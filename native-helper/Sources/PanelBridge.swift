// Loopback bridge to the CEP panel's ExtendScript executor.
//
// The panel (running inside After Effects) listens on 127.0.0.1 and speaks
// newline-delimited JSON. We send {id, token, script}; it runs the script through
// CSInterface.evalScript and replies {id, result}. Kept in its own file so it can
// be compiled into a test harness without dragging in the AppKit UI.
//
// Port and token are not hardcoded - the panel publishes them to a 0600 file at
// ~/.ae-fx-quick-controls/bridge.json. The token is required: without it any local
// process could run arbitrary ExtendScript in After Effects.

import Foundation
import Network

let panelBridgeHost = "127.0.0.1"
let panelBridgeTimeout: TimeInterval = 15
let afterEffectsBundleIdentifier = "com.adobe.AfterEffects.application"

/// How long to wait for the panel to come up after we ask AE to open it.
private let panelBootstrapTimeout: TimeInterval = 12
private let panelBootstrapPollInterval: TimeInterval = 0.25

func appleScriptQuoted(_ value: String) -> String {
    var result = value.replacingOccurrences(of: "\\", with: "\\\\")
    result = result.replacingOccurrences(of: "\"", with: "\\\"")
    result = result.replacingOccurrences(of: "\r", with: "\\r")
    result = result.replacingOccurrences(of: "\n", with: "\\n")
    return "\"\(result)\""
}

struct PanelBridgeEndpoint {
    let port: UInt16
    let token: String
}

func bridgeErrorJSON(_ message: String) -> String {
    let encoded = try? JSONSerialization.data(withJSONObject: ["ok": false, "error": message], options: [])
    return encoded.flatMap { String(data: $0, encoding: .utf8) }
        ?? "{\"ok\":false,\"error\":\"Panel bridge unavailable.\"}"
}

func panelBridgeDiscoveryURL() -> URL {
    FileManager.default.homeDirectoryForCurrentUser
        .appendingPathComponent(".ae-fx-quick-controls", isDirectory: true)
        .appendingPathComponent("bridge.json", isDirectory: false)
}

/// Reads the port/token the panel published. Returns nil when the panel has never
/// run or is currently closed.
func loadPanelBridgeEndpoint() -> PanelBridgeEndpoint? {
    guard
        let data = try? Data(contentsOf: panelBridgeDiscoveryURL()),
        let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let token = object["token"] as? String,
        !token.isEmpty
    else {
        return nil
    }

    let rawPort: Int?
    if let number = object["port"] as? Int { rawPort = number }
    else if let number = object["port"] as? NSNumber { rawPort = number.intValue }
    else { rawPort = nil }

    guard let portValue = rawPort, portValue > 0, portValue <= 65535 else { return nil }
    return PanelBridgeEndpoint(port: UInt16(portValue), token: token)
}

private let panelUnreachableMessage =
    "Could not reach the panel bridge. Open the AE FX panel in After Effects."

// MARK: - Bootstrap

/// Asks After Effects to open our CEP panel, by finding its Window-menu command.
///
/// This is the *only* remaining AppleScript call, and it is not in the hot path -
/// it runs once when the panel is closed, purely to bring the bridge up. Every
/// subsequent request goes over the socket. AE has no scripting IPC of this kind
/// on Windows, which is why the Windows helper asks the user to open the panel
/// instead of bootstrapping it.
@discardableResult
func openTimelinePanelViaAppleScript() -> Bool {
    let jsx = """
    (function () {
        var id = app.findMenuCommandId("AE FX");
        if (id !== 0) { app.executeCommand(id); return "opened"; }
        return "notfound";
    }())
    """
    let source = """
    tell application id "\(afterEffectsBundleIdentifier)"
        DoScript \(appleScriptQuoted(jsx))
    end tell
    """

    var failed = false
    let run = {
        var error: NSDictionary?
        NSAppleScript(source: source)?.executeAndReturnError(&error)
        failed = error != nil
    }
    // NSAppleScript is not thread-safe; keep it on the main thread.
    if Thread.isMainThread { run() } else { DispatchQueue.main.sync(execute: run) }
    return !failed
}

/// Blocks until the panel publishes its discovery file, or the timeout expires.
/// Only ever called on a background queue.
private func waitForPanelBridge(timeout: TimeInterval) -> PanelBridgeEndpoint? {
    let deadline = Date().addingTimeInterval(timeout)
    while Date() < deadline {
        if let endpoint = loadPanelBridgeEndpoint() { return endpoint }
        Thread.sleep(forTimeInterval: panelBootstrapPollInterval)
    }
    return loadPanelBridgeEndpoint()
}

/// Sends one ExtendScript request, opening the panel first if the bridge is down.
/// Callers get a result either way; they never need to know the panel was closed.
func sendToPanelBridge(
    requestId: String,
    script: String,
    queue: DispatchQueue,
    completion: @escaping (String) -> Void
) {
    func attempt(_ endpoint: PanelBridgeEndpoint, allowBootstrap: Bool) {
        sendOnceToPanelBridge(endpoint: endpoint, requestId: requestId, script: script, queue: queue) { result, unreachable in
            guard unreachable, allowBootstrap else {
                completion(result)
                return
            }
            // Stale discovery file: panel was closed since it was written.
            queue.async {
                guard openTimelinePanelViaAppleScript(),
                      let refreshed = waitForPanelBridge(timeout: panelBootstrapTimeout)
                else {
                    completion(bridgeErrorJSON(panelUnreachableMessage))
                    return
                }
                attempt(refreshed, allowBootstrap: false)
            }
        }
    }

    if let endpoint = loadPanelBridgeEndpoint() {
        attempt(endpoint, allowBootstrap: true)
        return
    }

    // No discovery file at all - the panel has not run this session.
    queue.async {
        guard openTimelinePanelViaAppleScript(),
              let endpoint = waitForPanelBridge(timeout: panelBootstrapTimeout)
        else {
            completion(bridgeErrorJSON(panelUnreachableMessage))
            return
        }
        attempt(endpoint, allowBootstrap: false)
    }
}

private func sendOnceToPanelBridge(
    endpoint: PanelBridgeEndpoint,
    requestId: String,
    script: String,
    queue: DispatchQueue,
    completion: @escaping (String, Bool) -> Void
) {
    guard
        let port = NWEndpoint.Port(rawValue: endpoint.port),
        let payload = try? JSONSerialization.data(
            withJSONObject: ["id": requestId, "token": endpoint.token, "script": script],
            options: []
        ),
        var line = String(data: payload, encoding: .utf8)
    else {
        completion(bridgeErrorJSON("Could not encode bridge request."), false)
        return
    }
    line += "\n"

    let connection = NWConnection(
        host: NWEndpoint.Host(panelBridgeHost),
        port: port,
        using: .tcp
    )

    var buffer = Data()
    var settled = false
    let settleLock = NSLock()

    func finish(_ result: String, unreachable: Bool = false) {
        settleLock.lock()
        if settled {
            settleLock.unlock()
            return
        }
        settled = true
        settleLock.unlock()
        connection.cancel()
        completion(result, unreachable)
    }

    func receiveLoop() {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 1 << 20) { chunk, _, isComplete, error in
            if let chunk { buffer.append(chunk) }

            if let newlineIndex = buffer.firstIndex(of: UInt8(0x0A)) {
                let lineData = buffer.subdata(in: buffer.startIndex..<newlineIndex)
                if let object = try? JSONSerialization.jsonObject(with: lineData) as? [String: Any] {
                    if let result = object["result"] as? String {
                        finish(result)
                        return
                    }
                    if let bridgeError = object["error"] as? String {
                        finish(bridgeErrorJSON(bridgeError))
                        return
                    }
                }
                finish(bridgeErrorJSON("Malformed bridge response."))
                return
            }

            if error != nil || isComplete {
                finish(bridgeErrorJSON("Panel bridge closed the connection."), unreachable: true)
                return
            }
            receiveLoop()
        }
    }

    connection.stateUpdateHandler = { state in
        switch state {
        case .ready:
            connection.send(
                content: line.data(using: .utf8),
                completion: .contentProcessed { _ in }
            )
            receiveLoop()
        case .waiting:
            // Nothing is listening (panel closed). NWConnection would otherwise sit
            // in .waiting and retry until our timeout, stalling every hotkey press.
            finish(bridgeErrorJSON(panelUnreachableMessage), unreachable: true)
        case .failed, .cancelled:
            finish(bridgeErrorJSON(panelUnreachableMessage), unreachable: true)
        default:
            break
        }
    }

    connection.start(queue: queue)
    queue.asyncAfter(deadline: .now() + panelBridgeTimeout) {
        finish(bridgeErrorJSON("Panel bridge timed out."))
    }
}
