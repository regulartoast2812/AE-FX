function ensureSettingsMenu() {
  if (settingsMenuEl) return settingsMenuEl;
  settingsMenuEl = document.createElement("div");
  settingsMenuEl.className = "settings-menu";
  settingsMenuEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(settingsMenuEl);
  settingsMenuEl.addEventListener("mousedown", event => event.stopPropagation(), true);
  settingsMenuEl.addEventListener("click", handleSettingsMenuClick);
  return settingsMenuEl;
}

function toggleSettingsMenu() {
  if (settingsMenuEl && settingsMenuEl.classList.contains("open")) closeSettingsMenu();
  else openSettingsMenu();
}

function openSettingsMenu() {
  const menu = ensureSettingsMenu();
  renderSettingsMenu();

  // Show it before measuring. While hidden, offsetWidth/offsetHeight are 0, so the
  // width fell back to a guess and the height could not be clamped at all - the
  // callout was placed below the gear and ran straight off the bottom of a short
  // panel, which looked like the button did nothing.
  menu.classList.add("open");
  menu.setAttribute("aria-hidden", "false");

  const rect = settingsBtnEl
    ? settingsBtnEl.getBoundingClientRect()
    : { right: 30, top: 40, bottom: 62 };
  const margin = 6;
  const width = menu.offsetWidth || 240;
  const height = menu.offsetHeight || 320;

  // Right-aligned to the gear, clamped to the viewport.
  const left = Math.min(
    Math.max(margin, window.innerWidth - width - margin),
    Math.max(margin, rect.right - width)
  );

  // Below the gear when it fits, otherwise above it, otherwise pinned on screen.
  let top = (rect.bottom || rect.top) + margin;
  if (top + height > window.innerHeight - margin) {
    const above = (rect.top || 0) - height - margin;
    top = above >= margin ? above : Math.max(margin, window.innerHeight - height - margin);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  if (settingsBtnEl) settingsBtnEl.classList.add("open");
}

function closeSettingsMenu() {
  if (!settingsMenuEl) return false;
  const wasOpen = settingsMenuEl.classList.contains("open");
  settingsMenuEl.classList.remove("open");
  settingsMenuEl.setAttribute("aria-hidden", "true");
  if (settingsBtnEl) settingsBtnEl.classList.remove("open");
  return wasOpen;
}

function renderSettingsMenu() {
  const menu = ensureSettingsMenu();
  const listener = nativeListenerStatus();
  menu.innerHTML = `
    <div class="settings-menu-title">Settings</div>
    <button type="button" class="settings-menu-row" data-action="shortcuts"><span>Shortcuts</span><em>View rundown</em></button>
    <button type="button" class="settings-menu-row" data-action="refresh"><span>Refresh</span><em>Resync panel</em></button>
    <div class="settings-menu-section">Command Console</div>
    ${settingsToggleRow("showNativeEffects", "Native AE Effects", "Show in Ctrl+K")}
    ${settingsToggleRow("showTntCommands", "Timeline Commands", "Show in Ctrl+K")}
    <div class="settings-menu-section">Safety</div>
    <div class="settings-menu-section">Layer Styles</div>
    ${settingsToggleRow("keepStyleEditorOpen", "Keep Editor Open", "After style edits")}
    <div class="settings-menu-section">Listeners</div>
    ${settingsStatusRow("Panel Bridge", bridgeStatusLabel(), bridgeStatusClass())}
    ${settingsStatusRow("Quick Controls", listener.detail, listener.statusClass)}
    ${settingsActionRow("installNativeListener", listener.actionLabel, listener.actionDetail)}
    <div class="settings-menu-section">About</div>
    ${settingsActionRow("checkUpdate", "Check for Updates", tntUpdateStatusLabel())}
    <div class="settings-menu-info">Timeline CEP v${escapeHtml(typeof TNT_VERSION === "string" ? TNT_VERSION : "?")}<br>Platform: ${escapeHtml(platformLabel())}<br>Comp: ${escapeHtml(state.comp && state.comp.name || "None")}</div>
  `;
}

function settingsStatusRow(label, detail, statusClass) {
  return `
    <div class="settings-menu-row settings-menu-status">
      <span>${escapeHtml(label)}</span>
      <em>${escapeHtml(detail)}</em>
      <i class="${escapeHtml(statusClass || "unknown")}"></i>
    </div>
  `;
}

function settingsActionRow(key, label, detail) {
  return `
    <button type="button" class="settings-menu-row" data-action="${escapeHtml(key)}">
      <span>${escapeHtml(label)}</span>
      <em>${escapeHtml(detail)}</em>
    </button>
  `;
}

function settingsToggleRow(key, label, detail) {
  return `
    <button type="button" class="settings-menu-row" data-toggle="${escapeHtml(key)}">
      <span>${escapeHtml(label)}</span>
      <em>${escapeHtml(detail)}</em>
      <b class="${panelSettings[key] ? "on" : ""}"></b>
    </button>
  `;
}

function bridgeStatusLabel() {
  const status = window.__TNT_BRIDGE_STATUS__ || (typeof tntBridgeStatus !== "undefined" ? tntBridgeStatus : {}) || {};
  if (status.state === "ok") return status.message || "Active";
  if (status.state === "error") return status.message || "Unavailable";
  return "Starting";
}

function bridgeStatusClass() {
  const status = window.__TNT_BRIDGE_STATUS__ || (typeof tntBridgeStatus !== "undefined" ? tntBridgeStatus : {}) || {};
  if (status.state === "ok") return "ok";
  if (status.state === "error") return "bad";
  return "warn";
}

function settingsNodeRequire(moduleName) {
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

function nativeListenerExtensionRoot() {
  try {
    if (typeof SystemPath !== "undefined" && cs && typeof cs.getSystemPath === "function") {
      const value = cs.getSystemPath(SystemPath.EXTENSION);
      if (value) return value;
    }
  } catch (_) {}
  try {
    let pathname = decodeURIComponent(window.location.pathname || "");
    if (isMacPlatform() && pathname.charAt(0) === "/") return pathname.replace(/\/[^\/]*$/, "");
    pathname = pathname.replace(/^\/([A-Za-z]:\/)/, "$1").replace(/\//g, "\\");
    return pathname.replace(/\\[^\\]*$/, "");
  } catch (_) {
    return "";
  }
}

function nativeListenerStatus() {
  const fs = settingsNodeRequire("fs");
  const path = settingsNodeRequire("path");
  const childProcess = settingsNodeRequire("child_process");
  const root = nativeListenerExtensionRoot();
  const mac = isMacPlatform();
  if (!fs || !path || !childProcess || !root) {
    return {
      detail: "CEP Node unavailable",
      statusClass: "bad",
      actionLabel: "Install Listener",
      actionDetail: "Unavailable here"
    };
  }

  const artifact = mac
    ? path.join(root, "native", "AE FX Quick Controls.app", "Contents", "MacOS", "AEFXQuickControls")
    : path.join(root, "native-helper-win", "bin", "Release", "net8.0-windows", "AEFXQuickControls.exe");
  const installed = fs.existsSync(artifact);
  const active = nativeListenerProcessActive(childProcess, mac);

  return {
    detail: active ? "Installed and active" : (installed ? "Installed, not running" : "Not installed"),
    statusClass: active ? "ok" : (installed ? "warn" : "bad"),
    actionLabel: active ? "Open Listener" : (installed ? "Start Listener" : "Install Listener"),
    actionDetail: active ? "Already active" : (mac ? "macOS helper" : "Windows helper")
  };
}

function nativeListenerProcessActive(childProcess, mac) {
  try {
    if (mac) {
      childProcess.execFileSync("/usr/bin/pgrep", ["-x", "AEFXQuickControls"], { stdio: "ignore" });
      return true;
    }
    const output = childProcess.execFileSync(
      "tasklist.exe",
      ["/FI", "IMAGENAME eq AEFXQuickControls.exe", "/FO", "CSV", "/NH"],
      { encoding: "utf8", windowsHide: true }
    );
    return /AEFXQuickControls\.exe/i.test(output);
  } catch (_) {
    return false;
  }
}

function installNativeListener() {
  const fs = settingsNodeRequire("fs");
  const path = settingsNodeRequire("path");
  const childProcess = settingsNodeRequire("child_process");
  const root = nativeListenerExtensionRoot();
  if (!fs || !path || !childProcess || !root) {
    statusEl.textContent = "Native listener install is unavailable in this CEP runtime.";
    renderSettingsMenu();
    return;
  }

  const mac = isMacPlatform();
  const message = mac
    ? "Install or start the macOS Quick Controls listener?"
    : "Install or start the Windows Quick Controls listener?";
  if (!window.confirm(message)) return;

  statusEl.textContent = mac ? "Starting macOS listener..." : "Starting Windows listener...";
  if (mac) installMacNativeListener(childProcess, root);
  else installWindowsNativeListener(fs, path, childProcess, root);
}

function installMacNativeListener(childProcess, root) {
  const script = `${root}/scripts/launch-native-helper.sh`;
  childProcess.execFile("/bin/bash", [script], { cwd: root }, error => {
    statusEl.textContent = error ? `Listener failed: ${error.message}` : "Quick Controls listener is starting.";
    if (settingsMenuEl && settingsMenuEl.classList.contains("open")) renderSettingsMenu();
  });
}

function installWindowsNativeListener(fs, path, childProcess, root) {
  const helperDir = path.join(root, "native-helper-win");
  const exe = path.join(helperDir, "bin", "Release", "net8.0-windows", "AEFXQuickControls.exe");
  const launch = () => {
    try {
      const child = childProcess.spawn(exe, [], {
        cwd: helperDir,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
        env: Object.assign({}, (typeof process !== "undefined" && process.env) || {}, { TNT_EXTENSION_ROOT: root })
      });
      child.unref();
      statusEl.textContent = "Quick Controls listener is starting.";
    } catch (e) {
      statusEl.textContent = `Listener failed: ${e.message || e}`;
    }
    if (settingsMenuEl && settingsMenuEl.classList.contains("open")) {
      window.setTimeout(renderSettingsMenu, 600);
    }
  };

  if (fs.existsSync(exe)) {
    launch();
    return;
  }

  statusEl.textContent = "Building Windows listener...";
  childProcess.execFile("dotnet", ["build", "-c", "Release"], { cwd: helperDir, windowsHide: true }, error => {
    if (error) {
      statusEl.textContent = `Listener build failed: ${error.message}`;
      if (settingsMenuEl && settingsMenuEl.classList.contains("open")) renderSettingsMenu();
      return;
    }
    launch();
  });
}

async function handleSettingsMenuClick(event) {
  const toggle = event.target.closest && event.target.closest("[data-toggle]");
  if (toggle) {
    const key = toggle.dataset.toggle;
    panelSettings[key] = !panelSettings[key];
    savePanelSettings();
    renderSettingsMenu();
    if (fxConsoleEl && fxConsoleEl.classList.contains("open")) renderFxConsoleResults();
    return;
  }
  const action = event.target.closest && event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "shortcuts") {
    closeSettingsMenu();
    openShortcutRundown();
  } else if (action.dataset.action === "refresh") {
    closeSettingsMenu();
    statusEl.textContent = "Refreshing...";
    await refreshLayers({ forceRender: true });
    statusEl.textContent = "Refreshed.";
  } else if (action.dataset.action === "installNativeListener") {
    installNativeListener();
  }
}

function ensureShortcutRundown() {
  if (shortcutRundownEl) return shortcutRundownEl;
  shortcutRundownEl = document.createElement("div");
  shortcutRundownEl.className = "shortcut-rundown-backdrop";
  shortcutRundownEl.setAttribute("aria-hidden", "true");
  shortcutRundownEl.innerHTML = `
    <div class="shortcut-rundown-panel">
      <div class="shortcut-rundown-head">
        <div>
          <div class="shortcut-rundown-title">Shortcuts</div>
          <div class="shortcut-rundown-subtitle">Timeline panel and command console</div>
        </div>
        <button type="button" class="shortcut-rundown-close">x</button>
      </div>
      <div class="shortcut-rundown-body"></div>
    </div>
  `;
  document.body.appendChild(shortcutRundownEl);
  shortcutRundownEl.addEventListener("mousedown", event => {
    if (event.target === shortcutRundownEl) closeShortcutRundown();
  });
  shortcutRundownEl.querySelector(".shortcut-rundown-close").addEventListener("click", closeShortcutRundown);
  return shortcutRundownEl;
}

function openShortcutRundown() {
  const el = ensureShortcutRundown();
  const mod = primaryModifierLabel();
  const option = optionModifierLabel();
  const rows = [
    ["Ctrl+Space", "Open Quick Controls"],
    ["Ctrl+K", "Open command console"],
    [`${mod}+C / ${mod}+V`, "Copy / paste selection"],
    ["Enter", "Run selected command"],
    ["Right / Left", "Open or close command submenu"],
    ["Tab", "Composition Flow"],
    ["X", "Go to next marker boundary"],
    ["Shift+X", "Layer Selection & Filters"],
    ["A", "Anchor Point Master"],
    ["Shift+A", "Center Anchor Point"],
    ["C", "Composition Tools"],
    [`${mod}+D`, "Duplicate selected layers"],
    ["1 / 2", "Zoom out / in"],
    ["3", "Split selected layers"],
    ["4 / Delete", "Delete selected layer or keyframes"],
    ["5 / 6", "Set selected layer in/out to playhead"],
    ["Q / W", "Trim in/out to playhead"],
    [`${option}+X / X`, "Previous / next marker boundary"],
    ["U", "Reveal keyframes"],
    ["T", "Reveal transform properties"],
    ["E", "Open ease editor for selected keyframes"],
    ["Shift+E", "Apply easy ease to selected keyframes"],
    ["F", "Mask control"],
    ["Shift+F", "Focus selected layers"],
    ["S / Shift+S", "Layer styles"],
    [".", "Add marker at playhead"],
    [`${option}+Up / Down`, "Move layer up/down"],
    [`Shift+${option}+Up / Down`, "Move layer top/bottom"],
    ["Space", "Play / pause"],
    ["Esc", "Close active popup"]
  ];
  el.querySelector(".shortcut-rundown-body").innerHTML = rows.map(row => `
    <div class="shortcut-row"><kbd>${escapeHtml(row[0])}</kbd><span>${escapeHtml(row[1])}</span></div>
  `).join("");
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
}

function closeShortcutRundown() {
  if (!shortcutRundownEl) return;
  shortcutRundownEl.classList.remove("show");
  shortcutRundownEl.setAttribute("aria-hidden", "true");
}

async function runBundledShortcut(filename) {
  if (isMarkerDragging || isScrubbing || isMarqueeSelecting) return;
  suppressSyncUntil = Date.now() + 1200;
  await evalFileRaw('jsx/' + filename);
  await refreshAfterPanelAction();
}

async function goToMarkerBoundary(direction) {
  if (isMarkerDragging || isScrubbing || isMarqueeSelecting) return;
  suppressSyncUntil = Date.now() + 700;
  await loadJSX();
  const result = await aeCall("TNT_goToMarkerBoundary", [direction]);
  if (!result.ok) {
    statusEl.textContent = result.error || "No marker boundary found.";
    return;
  }
  if (state.comp) state.comp.time = result.time;
  updateStatus();
  updatePlayhead({ fast: true });
  focusPanel(2);
}

async function openMarkerMenu(marker, options = {}) {
  if (!marker || typeof marker.keyIndex === "undefined") return;
  await loadJSX();
  const markerType = options.type || "comp";
  const fn = markerType === "layer" ? "TNT_openLayerMarkerDialog" : "TNT_openCompMarkerDialog";
  const args = markerType === "layer"
    ? [options.layerIndex || 0, marker.keyIndex]
    : [marker.keyIndex];
  const result = await aeCall(fn, args);
  if (!result.ok && result.error) statusEl.textContent = result.error;
  await refreshLayers({ forceRender: true });
}

function loadJSX(options = {}) {
  if (jsxLoaded && !options.force) return Promise.resolve({ ok: true });
  const path = jsxPath();
  return new Promise(resolve => {
    cs.evalScript(`$.evalFile('${escForExtendScriptString(path)}')`, result => {
      jsxLoaded = true;
      resolve({ ok: true, result });
    });
  });
}

let aeEvalQueue = Promise.resolve();
let lastAeEvalAt = 0;
const AE_EVAL_MIN_GAP_MS = 20;
function aeEvalScript(script) {
  aeEvalQueue = aeEvalQueue.then(() => new Promise(resolve => {
    const delay = Math.max(0, AE_EVAL_MIN_GAP_MS - (Date.now() - lastAeEvalAt));
    setTimeout(() => {
      lastAeEvalAt = Date.now();
      cs.evalScript(script, result => {
        try { resolve(JSON.parse(result)); }
        catch (e) { resolve({ ok: false, error: String(result || e) }); }
      });
    }, delay);
  }));
  return aeEvalQueue;
}

function aeCall(functionName, args = []) {
  const encodedArgs = args.map(a => JSON.stringify(a)).join(",");
  const script = `${functionName}(${encodedArgs})`;
  return aeEvalScript(script);
}

function timelineSignature(data) {
  if (!data || !data.comp) return "";
  return [
    data.comp.name,
    data.comp.duration,
    data.comp.numLayers,
    data.comp.projectRevision || 0,
    (data.compMarkers || []).map(m => [m.keyIndex, m.time, m.comment, m.duration, m.label, m.protectedRegion].join('~')).join('^'),
    ...data.layers.map(l => [l.index, l.name, l.type, l.isMedia, l.isMissingMedia, l.hasKeyframes, l.inPoint, l.outPoint, l.startTime, l.label, l.enabled, l.locked, l.parentIndex || 0, l.trackMatteLayerIndex || 0, l.trackMatteType || "", (l.keyframes || []).map(k => [k.time, k.label || 0, k.type || "", (k.properties || []).join(',')].join('~')).join('^'), (l.markers || []).map(m => [m.keyIndex, m.time, m.comment, m.duration, m.label, m.protectedRegion].join('~')).join('^')].join("~"))
  ].join("|");
}

function syncFingerprint(data) {
  if (!data || !data.ok) return "";
  return [data.compName, data.duration, data.numLayers, data.projectRevision || 0, data.layerFingerprint || ""].join("|");
}

function intervalsOverlap(a, b) {
  const EPS = 1e-5;
  return a.inPoint < b.outPoint - EPS && a.outPoint > b.inPoint + EPS;
}

function allRelationshipLayerSets(layers = state.layers || []) {
  const parented = new Set();
  const parentSources = new Set();
  const matteChildren = new Set();
  const matteSources = new Set();
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    if (parentIndex) {
      parented.add(layerIndex);
      parentSources.add(parentIndex);
    }
    if (matteIndex) {
      matteChildren.add(layerIndex);
      matteSources.add(matteIndex);
    }
  });
  return { parented, parentSources, matteChildren, matteSources };
}
