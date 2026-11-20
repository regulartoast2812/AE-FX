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

  // Edie (Creative Assist) asks by name rather than sending script: the same
  // command list and the same run path as the palette and the Functions list.
  const op = String((request && request.op) || "");
  if (id && (op === "status" || op === "commands" || op === "run")) {
    bridgeHandleOp(op, request).then(
      reply => bridgeSend(socket, { id, result: JSON.stringify(reply) }),
      e => bridgeSend(socket, { id, error: String(e && e.message || e) })
    );
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

// ---- Commands by name, for Edie ------------------------------------------------
//
//   -> {"id","token","op":"status"}            <- {ok, version, comp, layers, selected, commands, runs}
//   -> {"id","token","op":"commands"}          <- {ok, commands:[{name, kind, category, shortcut, needs}]}
//   -> {"id","token","op":"run","name":"…"}    <- {ok, name, ms, message}
//
// A command in a menu is named "Menu / Item" ("Label Layers / Red"). Runs go
// through executeFxConsoleEntry, exactly as a click in the palette, on what is
// selected in After Effects; AE's own undo still takes each one back.

const TNT_BRIDGE_RUNS = [];
let tntBridgeRunBusy = false;

function bridgeKind(entry) {
  if (entry.source === "native") return "AE effect";
  if (entry.source === "assistant") return "Saved script";
  if (entry.source === "custom") return "Custom";
  return "Panel";
}

function bridgeCommandRows() {
  const rows = [];
  const add = (entry, path) => {
    if (!entry || entry.groupParent) return;
    const name = path ? `${path} / ${entry.name}` : String(entry.name || entry.matchName || "");
    if (entry.children && entry.children.length && !entry.action && !entry.tntFunction) {
      entry.children.forEach(child => add({
        ...child, source: entry.source, type: child.action ? "command" : (child.children ? "tntMenu" : "tntCommand")
      }, name));
      return;
    }
    if (!name) return;
    let needs = "";
    try { needs = typeof tntEntryRequirement === "function" ? (TNT_REQUIREMENT_LABELS[tntEntryRequirement(entry)] || "") : ""; } catch (_) {}
    let shortcut = "";
    try { shortcut = typeof tntShortcutForEntry === "function" ? tntShortcutForEntry(entry) : (entry.shortcut || ""); } catch (_) { shortcut = entry.shortcut || ""; }
    rows.push({ name, kind: bridgeKind(entry), category: String(entry.category || ""), shortcut: String(shortcut || ""), needs, entry });
  };
  FX_CONSOLE_COMMANDS.forEach(c => add({ ...c, source: "panel" }, ""));
  (typeof getAssistantSavedFunctionCommands === "function" ? getAssistantSavedFunctionCommands() : []).forEach(c => add(c, ""));
  TNT_V3_COMMANDS.forEach(c => add({ ...c, source: "custom", type: c.action ? "command" : (c.children ? "tntMenu" : "tntCommand") }, ""));
  (fxConsoleEffects || []).forEach(e => add({ ...e, source: "native", type: "effect" }, ""));
  return rows;
}

function bridgeFindCommand(rows, name) {
  const key = String(name || "").trim().toLowerCase().replace(/\s*[\/›▸>]\s*/g, " / ");
  if (!key) return null;
  const exact = rows.filter(r => r.name.toLowerCase() === key);
  if (exact.length) return exact[0];
  // "Red" alone is ambiguous (layers, keyframes, markers); a unique last part is not.
  const last = rows.filter(r => r.name.toLowerCase().split(" / ").pop() === key);
  return last.length === 1 ? last[0] : null;
}

async function bridgeHandleOp(op, request) {
  if (op === "status") {
    return {
      ok: true, version: typeof TNT_VERSION === "string" ? TNT_VERSION : "",
      comp: state.comp ? String(state.comp.name || "") : "", layers: (state.layers || []).length,
      selected: (state.selectedLayerIndices || []).length, busy: tntBridgeRunBusy,
      commands: bridgeCommandRows().length, effectsLoaded: !!(fxConsoleEffects && fxConsoleEffects.length),
      runs: TNT_BRIDGE_RUNS.slice(-20)
    };
  }
  if (!fxConsoleEffects || !fxConsoleEffects.length) {
    try { await loadFxConsoleEffects(); } catch (_) {}
  }
  const rows = bridgeCommandRows();
  if (op === "commands") {
    return { ok: true, commands: rows.map(r => ({ name: r.name, kind: r.kind, category: r.category, shortcut: r.shortcut, needs: r.needs })) };
  }
  const row = bridgeFindCommand(rows, request && request.name);
  if (!row) return { ok: false, error: `No AE FX command is called "${String(request && request.name || "")}".` };
  if (tntBridgeRunBusy) return { ok: false, error: "Another command is still running in After Effects." };
  tntBridgeRunBusy = true;
  const started = Date.now();
  let ok = false, message = "";
  try {
    // The selection the command acts on is After Effects' own, read now.
    try { await refreshLayers({ forceRender: true, skipSettledRefresh: true }); } catch (_) {}
    if (statusEl) statusEl.textContent = "";
    ok = (await executeFxConsoleEntry(row.entry)) !== false;
    message = String(statusEl && statusEl.textContent || "").trim();
    if (ok && /\b(fail|failed|error|could not|couldn't|no layers? selected|select )/i.test(message) && !/\bdone\b/i.test(message)) ok = false;
  } catch (e) {
    ok = false;
    message = String(e && e.message || e);
  } finally {
    tntBridgeRunBusy = false;
  }
  const run = { time: new Date().toISOString(), outcome: ok ? "ok" : "failed", command: row.name, detail: message, ms: Date.now() - started };
  TNT_BRIDGE_RUNS.push(run);
  if (TNT_BRIDGE_RUNS.length > 50) TNT_BRIDGE_RUNS.shift();
  return { ok, name: row.name, ms: run.ms, message };
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
