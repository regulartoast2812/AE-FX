// Native bridge server.
//
// Runs only in the real CEP panel (inside After Effects), never in quick.html.
// Native overlay helpers (macOS Swift app, Windows C# app) connect over loopback
// TCP and send ExtendScript to run; the panel executes it with cs.evalScript and
// sends the raw result back. This replaces the old macOS-only path that shelled
// out to AppleScript `DoScript` and marshalled results through a temp file.
//
// Protocol: newline-delimited JSON, one JSON object per line.
//   -> {"id":"7","script":"tntGetTimeline()"}
//   <- {"id":"7","result":"{\"ok\":true,...}"}
//   <- {"id":"7","error":"..."}          (bridge-level failure only)

const TNT_BRIDGE_PORT = 8099;
const TNT_BRIDGE_HOST = "127.0.0.1";

function bridgeRequire(moduleName) {
  try {
    if (typeof require === "function") return require(moduleName);
  } catch (_) {}
  try {
    if (window.cep_node && typeof window.cep_node.require === "function") {
      return window.cep_node.require(moduleName);
    }
  } catch (_) {}
  return null;
}

function bridgeSend(socket, payload) {
  try {
    socket.write(JSON.stringify(payload) + "\n");
  } catch (_) {}
}

function bridgeHandleLine(line, socket) {
  let request;
  try {
    request = JSON.parse(line);
  } catch (e) {
    return;
  }

  const id = String(request && request.id != null ? request.id : "");
  const script = String((request && request.script) || "");
  if (!id || !script) return;

  try {
    cs.evalScript(script, result => {
      bridgeSend(socket, { id, result: String(result == null ? "" : result) });
    });
  } catch (e) {
    bridgeSend(socket, { id, error: String(e) });
  }
}

function startNativeBridgeServer() {
  // quick.html is the overlay's own content; it is a bridge *client*, not a server.
  if (QUICK_PANEL_MODE) return null;

  const net = bridgeRequire("net");
  if (!net) {
    console.warn("[tnt-bridge] node 'net' unavailable; native overlay bridge disabled");
    return null;
  }

  const server = net.createServer(socket => {
    socket.setEncoding("utf8");
    let buffer = "";

    socket.on("data", chunk => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) bridgeHandleLine(line, socket);
      }
    });

    socket.on("error", () => {});
  });

  server.on("error", err => {
    console.warn("[tnt-bridge] server error:", err && err.message);
  });

  try {
    server.listen(TNT_BRIDGE_PORT, TNT_BRIDGE_HOST, () => {
      console.log("[tnt-bridge] listening on " + TNT_BRIDGE_HOST + ":" + TNT_BRIDGE_PORT);
    });
  } catch (e) {
    console.warn("[tnt-bridge] listen failed:", String(e));
    return null;
  }

  return server;
}

const tntBridgeServer = startNativeBridgeServer();
