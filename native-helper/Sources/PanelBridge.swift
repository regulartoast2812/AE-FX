// Loopback bridge to the CEP panel's ExtendScript executor.
//
// The panel (running inside After Effects) listens on 127.0.0.1 and speaks
// newline-delimited JSON. We send {id, token, script}; it runs the script through
// CSInterface.evalScript and replies {id, result}. Kept in its own file so it can
// be compiled into a test harness without dragging in the AppKit UI.
//
// Port and token are not hardcoded - the panel publishes them to a 0600 file at
// ~/.tnt-quick-controls/bridge.json. The token is required: without it any local
// process could run arbitrary ExtendScript in After Effects.

import Foundation
import Network

let panelBridgeHost = "127.0.0.1"
let panelBridgeTimeout: TimeInterval = 15

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
        .appendingPathComponent(".tnt-quick-controls", isDirectory: true)
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
    "Could not reach the panel bridge. Open the Premiere Style Timeline panel in After Effects."

/// Sends one ExtendScript request to the CEP panel's loopback bridge and returns
/// the raw result string. The panel runs it via CSInterface.evalScript, so this
/// matches CEP semantics exactly - no AppleScript, no temp files.
func sendToPanelBridge(
    requestId: String,
    script: String,
    queue: DispatchQueue,
    completion: @escaping (String) -> Void
) {
    guard let endpoint = loadPanelBridgeEndpoint() else {
        completion(bridgeErrorJSON(panelUnreachableMessage))
        return
    }

    guard
        let port = NWEndpoint.Port(rawValue: endpoint.port),
        let payload = try? JSONSerialization.data(
            withJSONObject: ["id": requestId, "token": endpoint.token, "script": script],
            options: []
        ),
        var line = String(data: payload, encoding: .utf8)
    else {
        completion(bridgeErrorJSON("Could not encode bridge request."))
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

    func finish(_ result: String) {
        settleLock.lock()
        if settled {
            settleLock.unlock()
            return
        }
        settled = true
        settleLock.unlock()
        connection.cancel()
        completion(result)
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
                finish(bridgeErrorJSON("Panel bridge closed the connection. Is the panel open in After Effects?"))
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
            finish(bridgeErrorJSON(panelUnreachableMessage))
        case .failed, .cancelled:
            finish(bridgeErrorJSON(panelUnreachableMessage))
        default:
            break
        }
    }

    connection.start(queue: queue)
    queue.asyncAfter(deadline: .now() + panelBridgeTimeout) {
        finish(bridgeErrorJSON("Panel bridge timed out."))
    }
}
