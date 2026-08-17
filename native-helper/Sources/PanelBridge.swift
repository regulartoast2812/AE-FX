// Loopback bridge to the CEP panel's ExtendScript executor.
//
// The panel (running inside After Effects) listens on 127.0.0.1:8099 and speaks
// newline-delimited JSON. We send {id, script}; it runs the script through
// CSInterface.evalScript and replies {id, result}. Kept in its own file so it can
// be compiled into a test harness without dragging in the AppKit UI.

import Foundation
import Network

let panelBridgeHost = "127.0.0.1"
let panelBridgePort: UInt16 = 8099
let panelBridgeTimeout: TimeInterval = 15

func bridgeErrorJSON(_ message: String) -> String {
    let encoded = try? JSONSerialization.data(withJSONObject: ["ok": false, "error": message], options: [])
    return encoded.flatMap { String(data: $0, encoding: .utf8) }
        ?? "{\"ok\":false,\"error\":\"Panel bridge unavailable.\"}"
}

/// Sends one ExtendScript request to the CEP panel's loopback bridge and returns
/// the raw result string. The panel runs it via CSInterface.evalScript, so this
/// matches CEP semantics exactly - no AppleScript, no temp files.
func sendToPanelBridge(
    requestId: String,
    script: String,
    queue: DispatchQueue,
    completion: @escaping (String) -> Void
) {
    guard
        let port = NWEndpoint.Port(rawValue: panelBridgePort),
        let payload = try? JSONSerialization.data(
            withJSONObject: ["id": requestId, "script": script],
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
                if
                    let object = try? JSONSerialization.jsonObject(with: lineData) as? [String: Any]
                {
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
            finish(bridgeErrorJSON("Could not reach the panel bridge on \(panelBridgeHost):\(panelBridgePort). Open the Premiere Style Timeline panel in After Effects."))
        case .failed, .cancelled:
            finish(bridgeErrorJSON("Could not reach the panel bridge on \(panelBridgeHost):\(panelBridgePort). Open the Premiere Style Timeline panel in After Effects."))
        default:
            break
        }
    }

    connection.start(queue: queue)
    queue.asyncAfter(deadline: .now() + panelBridgeTimeout) {
        finish(bridgeErrorJSON("Panel bridge timed out."))
    }
}
