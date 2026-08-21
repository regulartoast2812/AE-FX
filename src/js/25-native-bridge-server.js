// Native bridge server.
//
// Runs only in the real CEP panel (inside After Effects), never in quick.html.
// Native overlay helpers (macOS Swift app, Windows C# app) connect over loopback
// TCP and send ExtendScript to run; the panel executes it with cs.evalScript and
// sends the raw result back. This replaces the old macOS-only path that shelled
// out to AppleScript `DoScript` and marshalled results through a temp file.
//
// Every request must carry the shared token. Without it, any local process could
// connect and run arbitrary ExtendScript in After Effects - full project access
// and file I/O. The token and the chosen port are published to a 0600 discovery
// file in the user's home directory; helpers read it instead of hardcoding a port.
//
//   ~/.ae-fx-quick-controls/bridge.json   {"port":8099,"token":"...","pid":123}
//
// Protocol: newline-delimited JSON, one object per line.
//   -> {"id":"7","token":"...","script":"tntGetTimeline()"}
//   <- {"id":"7","result":"{\"ok\":true,...}"}
//   <- {"id":"7","error":"..."}          (bridge-level failure only)

const TNT_BRIDGE_HOST = "127.0.0.1";
const TNT_BRIDGE_PORT_FIRST = 8099;
const TNT_BRIDGE_PORT_LAST = 8109;

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

function bridgeDiscoveryPath(nodeOs, nodePath) {
  return nodePath.join(nodeOs.homedir(), ".ae-fx-quick-controls", "bridge.json");
}

function bridgeWriteDiscoveryFile(port, token) {
  const fs = bridgeRequire("fs");
  const os = bridgeRequire("os");
  const path = bridgeRequire("path");
  if (!fs || !os || !path) return null;

  const file = bridgeDiscoveryPath(os, path);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    // Re-create rather than overwrite: writing to an existing file keeps its old
    // (possibly permissive) mode.
    try { fs.unlinkSync(file); } catch (_) {}
    fs.writeFileSync(
      file,
      JSON.stringify({ port, token, pid: (typeof process !== "undefined" ? process.pid : 0) }),
      { mode: 0o600 }
    );
    try { fs.chmodSync(file, 0o600); } catch (_) {}
    return file;
  } catch (e) {
    console.warn("[tnt-bridge] could not publish discovery file:", String(e));
    return null;
  }
}

function bridgeRemoveDiscoveryFile() {
  const fs = bridgeRequire("fs");
  const os = bridgeRequire("os");
  const path = bridgeRequire("path");
  if (!fs || !os || !path) return;
  try { fs.unlinkSync(bridgeDiscoveryPath(os, path)); } catch (_) {}
}

function bridgeCreateToken() {
  const crypto = bridgeRequire("crypto");
  if (crypto && typeof crypto.randomBytes === "function") {
    return crypto.randomBytes(32).toString("hex");
  }
  // Should not happen inside CEP's Node, but never fall back to a fixed token.
  let fallback = "";
  for (let i = 0; i < 8; i += 1) fallback += Math.random().toString(36).slice(2);
  return fallback;
}

function bridgeSend(socket, payload) {
  try {
    socket.write(JSON.stringify(payload) + "\n");
  } catch (_) {}
}

function bridgeHandleLine(line, socket, token) {
  let request;
  try {
    request = JSON.parse(line);
  } catch (e) {
    return;
  }

  const id = String(request && request.id != null ? request.id : "");
  const script = String((request && request.script) || "");
  const provided = String((request && request.token) || "");

  if (provided.length !== token.length || provided !== token) {
    if (id) bridgeSend(socket, { id, error: "Unauthorized: bad or missing bridge token." });
    console.warn("[tnt-bridge] rejected a request with an invalid token");
    try { socket.destroy(); } catch (_) {}
    return;
  }

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

  const token = bridgeCreateToken();

  const server = net.createServer(socket => {
    socket.setEncoding("utf8");
    let buffer = "";

    socket.on("data", chunk => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) bridgeHandleLine(line, socket, token);
      }
    });

    socket.on("error", () => {});
  });

  let port = TNT_BRIDGE_PORT_FIRST;

  server.on("error", err => {
    if (err && err.code === "EADDRINUSE" && port < TNT_BRIDGE_PORT_LAST) {
      // Another panel instance (or an unrelated process) holds this port.
      port += 1;
      server.listen(port, TNT_BRIDGE_HOST);
      return;
    }
    console.warn("[tnt-bridge] server error:", err && err.message);
    bridgeSetStatus("error", err && err.message ? String(err.message) : "bridge failed to start");
  });

  server.on("listening", () => {
    const file = bridgeWriteDiscoveryFile(port, token);
    console.log("[tnt-bridge] listening on " + TNT_BRIDGE_HOST + ":" + port);
    if (!file) {
      bridgeSetStatus("error", "bridge is up on port " + port + " but helpers cannot discover it");
      return;
    }
    bridgeSetStatus("ok", "bridge ready on port " + port);
  });

  try {
    server.listen(port, TNT_BRIDGE_HOST);
  } catch (e) {
    console.warn("[tnt-bridge] listen failed:", String(e));
    return null;
  }

  window.addEventListener("beforeunload", () => {
    bridgeRemoveDiscoveryFile();
    try { server.close(); } catch (_) {}
  });

  return server;
}

// Surfaced so a failed bridge is visible somewhere other than a console nobody
// is watching. state: "ok" | "error".
let tntBridgeStatus = { state: "starting", message: "" };
function bridgeSetStatus(state, message) {
  tntBridgeStatus = { state, message: String(message || "") };
  window.__TNT_BRIDGE_STATUS__ = tntBridgeStatus;
  if (state === "error") console.warn("[tnt-bridge]", message);
}

const tntBridgeServer = startNativeBridgeServer();
