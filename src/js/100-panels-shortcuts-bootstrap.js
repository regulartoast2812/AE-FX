function currentFrameRate() {
  return Math.max(1, Math.round(Number(state.comp && state.comp.frameRate || 30)));
}

function parseDurationInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const parts = raw.split(':').map(Number);
  if (parts.some(n => Number.isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) {
    const fps = currentFrameRate();
    return parts[0] * 60 + parts[1] + parts[2] / fps;
  }
  return null;
}

function showDurationDialog() {
  if (!state.comp || !durationModalEl) return;
  durationInputEl.value = formatDurationForInput(state.comp.duration || 0);
  durationErrorEl.textContent = "";
  durationModalEl.classList.add("show");
  durationModalEl.setAttribute("aria-hidden", "false");
  setTimeout(() => { durationInputEl.focus(); durationInputEl.select(); }, 0);
}

function hideDurationDialog() {
  if (!durationModalEl) return;
  durationModalEl.classList.remove("show");
  durationModalEl.setAttribute("aria-hidden", "true");
}

function formatDurationForInput(seconds) {
  seconds = Math.max(0, Number(seconds || 0));
  const fps = currentFrameRate();
  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

function formatMarkerDurationForInput(seconds) {
  return formatDurationForInput(seconds);
}

async function applyCompDurationFromDialog() {
  if (!state.comp) return;
  const seconds = parseDurationInput(durationInputEl.value);
  if (!seconds || seconds <= 0) {
    durationErrorEl.textContent = "Enter a valid duration, e.g. 10, 00:10, or 01:02:15.";
    return;
  }
  await loadJSX();
  const result = await aeCall('TNT_setCompDuration', [seconds]);
  if (result.ok) {
    hideDurationDialog();
    userZoomed = false;
    await refreshAfterPanelAction();
  } else {
    durationErrorEl.textContent = result.error || 'Could not set comp duration.';
  }
}

async function promptCompDuration() {
  showDurationDialog();
}

function setAnchorDialogPoint(point) {
  selectedAnchorPoint = String(point || "C");
  if (!anchorGridEl) return;
  anchorGridEl.querySelectorAll(".anchor-cell").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.point === selectedAnchorPoint);
  });
}

function showAnchorDialog() {
  if (!state.comp || !anchorModalEl) return;
  anchorErrorEl.textContent = "";
  setAnchorDialogPoint(selectedAnchorPoint || "C");
  anchorModalEl.classList.add("show");
  anchorModalEl.setAttribute("aria-hidden", "false");
}

function hideAnchorDialog() {
  if (!anchorModalEl) return;
  anchorModalEl.classList.remove("show");
  anchorModalEl.setAttribute("aria-hidden", "true");
}

function toggleAnchorDialog() {
  if (!anchorModalEl) return;
  if (anchorModalEl.classList.contains("show")) {
    hideAnchorDialog();
    focusPanel(2);
  } else {
    showAnchorDialog();
  }
}

function showCompositionPanel() {
  if (!compositionModalEl || !state.comp) return;
  if (compositionNameEl) compositionNameEl.textContent = state.comp.name || "Active comp";
  if (compositionErrorEl) compositionErrorEl.textContent = "";
  compositionModalEl.classList.add("show");
  compositionModalEl.setAttribute("aria-hidden", "false");
}

function hideCompositionPanel() {
  if (!compositionModalEl) return;
  compositionModalEl.classList.remove("show");
  compositionModalEl.setAttribute("aria-hidden", "true");
}

function toggleCompositionPanel() {
  if (!compositionModalEl) return;
  if (compositionModalEl.classList.contains("show")) {
    hideCompositionPanel();
    focusPanel(2);
  } else {
    showCompositionPanel();
  }
}

function openSubpanelByKey(key) {
  if (!QUICK_PANEL_MODE) {
    launchNativeQuickControls();
    return;
  }
  const panelActions = {
    anchor: toggleAnchorDialog,
    composition: toggleCompositionPanel,
    ease: showEaseDialog,
    mask: openMaskControlPanel,
    effects: openEffectsControlPanel,
    shapes: openShapesControlPanel,
    styles: openLayerStylePanel,
    "layer-menu": openQuickPanelLayerMenu,
    "mass-edit": showMassEditPanel,
    "text-animation": showTextAnimationPanel,
    "timing-order": showTimingOrderPanel,
    filter: showLayerSelectionPanel
  };
  const action = panelActions[key];
  if (action) action();
}

async function runCompositionPanelAction(action) {
  if (!state.comp) return;
  if (compositionErrorEl) compositionErrorEl.textContent = "";
  if (action === "rename") {
    await promptRenameComp();
    return;
  }
  if (action === "duration") {
    await promptCompDuration();
    return;
  }
  const commands = {
    trim: { name: "Auto Trim Comp", tntFunction: "autoTrimComp", args: [false] },
    crop: { name: "Auto Crop Comps", tntFunction: "cropComp", args: [false, 0] },
    precompose: { name: "Pre-compose Selected", tntFunction: "precomposeSelected" },
    render: { name: "Add to Render Queue", tntFunction: "addToRenderQueue" }
  };
  const command = commands[action];
  if (!command) return;
  await runTntV3Command(command);
}

function closeActivePopup() {
  let closed = false;
  if (propertyValueEditorEl) {
    closePropertyValueEditor();
    closed = true;
  }
  if (propertyValueHoverEl && propertyValueHoverEl.classList.contains("show")) {
    hidePropertyValueHover();
    closed = true;
  }
  if (isLayerMenuOpen()) {
    hideLayerMenu();
    closed = true;
  }
  if (closeSettingsMenu()) closed = true;
  if (shortcutRundownEl && shortcutRundownEl.classList.contains("show")) {
    closeShortcutRundown();
    closed = true;
  }
  if (layerStyleDialogEl && layerStyleDialogEl.classList.contains("show")) {
    closeLayerStyleDialog();
    closed = true;
  }
  if (maskControlDialogEl && maskControlDialogEl.classList.contains("show")) {
    closeMaskControlDialog();
    closed = true;
  }
  if (layerSelectionModalEl && layerSelectionModalEl.classList.contains("show")) {
    hideLayerSelectionPanel();
    closed = true;
  }
  if (compositionModalEl && compositionModalEl.classList.contains("show")) {
    hideCompositionPanel();
    closed = true;
  }
  if (anchorModalEl && anchorModalEl.classList.contains("show")) {
    hideAnchorDialog();
    closed = true;
  }
  if (easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
    closed = true;
  }
  if (massEditDialogEl && massEditDialogEl.classList.contains("show")) {
    hideMassEditPanel();
    closed = true;
  }
  if (textAnimationBackdropEl && textAnimationBackdropEl.classList.contains("show")) {
    hideTextAnimationPanel();
    closed = true;
  }
  if (timingOrderBackdropEl && timingOrderBackdropEl.classList.contains("show")) {
    hideTimingOrderPanel();
    closed = true;
  }
  if (compSelectEl && compSelectEl.classList.contains("open")) {
    closeCompSelect();
    closed = true;
  }
  if (flowChartOverlayEl && flowChartOverlayEl.classList.contains("open")) {
    closeFlowChart();
    closed = true;
  }
  if (closed) focusPanel(2);
  return closed;
}

async function applyAnchorPoint(point = selectedAnchorPoint) {
  if (!state.comp) return;
  setAnchorDialogPoint(point || "C");
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedAnchorPoint", [selectedAnchorPoint || "C", !!(anchorUseMasksEl && anchorUseMasksEl.checked)]);
  if (!result.ok) {
    anchorErrorEl.textContent = result.error || "Could not set anchor point.";
    return;
  }
  hideAnchorDialog();
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function centerSelectedAnchorPoints() {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_centerSelectedAnchorPoint");
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not center anchor point.";
    return;
  }
  hideAnchorDialog();
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function alignSelectedLayersFromAnchorPanel(mode) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_alignSelectedLayersToComp", [String(mode || ""), !!(anchorUseMasksEl && anchorUseMasksEl.checked)]);
  if (!result.ok) {
    anchorErrorEl.textContent = result.error || "Could not align selected layers.";
    return;
  }
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function addMarkerAtPlayhead() {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = await aeCall("TNT_addCompMarkerAtTime", [snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add marker.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

async function saveProjectFromPanel() {
  suppressSyncUntil = Date.now() + 700;
  await loadJSX();
  const result = await aeCall("TNT_saveProject");
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not save project.";
    return;
  }
  statusEl.textContent = result.path ? `Saved ${result.path}` : "Project saved.";
  focusPanel(2);
}

async function runNativeEditShortcut(kind) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(1);
  await loadJSX();
  const result = await aeCall("TNT_runNativeEditShortcut", [kind]);
  if (!result.ok) {
    statusEl.textContent = result.error || `Could not ${kind}.`;
    focusPanel(2);
    return;
  }
  statusEl.textContent = result.result || `${kind === "paste" ? "Paste" : "Copy"} done.`;
  if (kind === "paste") await refreshLayers({ forceRender: true });
  else focusPanel(2);
}

// PERMANENT SHORTCUT REGISTRY:
// Keep every panel shortcut in this table. Do not add loose keydown checks elsewhere,
// and do not replace this resolver when adding a shortcut. This prevents previously
// working shortcuts from being accidentally dropped during UI/tool edits.
const SHORTCUT_ACTIONS = {
  "ctrl+z": undoLastAeAction,
  "ctrl+s": saveProjectFromPanel,
  "ctrl+a": selectAllLayers,
  "ctrl+c": () => runNativeEditShortcut("copy"),
  "ctrl+v": () => runNativeEditShortcut("paste"),
  "ctrl+space": launchNativeQuickControls,
  "ctrl+k": openFxConsole,
  "ctrl+d": duplicateSelectedLayers,
  "alt+`": toggleTimelineMode,
  "alt+backquote": toggleTimelineMode,
  "alt+arrowup": () => moveSelectedLayersInStack("up"),
  "alt+arrowdown": () => moveSelectedLayersInStack("down"),
  "shift+alt+arrowup": () => moveSelectedLayersInStack("top"),
  "shift+alt+arrowdown": () => moveSelectedLayersInStack("bottom"),
  "tab": toggleFlowChart,
  "escape": closeActivePopup,
  "space": togglePlay,
  "a": () => openSubpanelByKey("anchor"),
  "shift+a": centerSelectedAnchorPoints,
  "c": () => openSubpanelByKey("composition"),
  "1": () => zoomTimeline(0.82),
  "numpad1": () => zoomTimeline(0.82),
  "2": () => zoomTimeline(1.22),
  "numpad2": () => zoomTimeline(1.22),
  "3": splitSelectedLayersAtPlayhead,
  "numpad3": splitSelectedLayersAtPlayhead,
  "4": deleteSelectedLevel,
  "numpad4": deleteSelectedLevel,
  "5": () => setSelectedLayerEndpoint("in"),
  "numpad5": () => setSelectedLayerEndpoint("in"),
  "6": () => setSelectedLayerEndpoint("out"),
  "numpad6": () => setSelectedLayerEndpoint("out"),
  "delete": deleteSelectedLevel,
  "backspace": deleteSelectedLevel,
  "q": () => runBundledShortcut('Trim In to playhead.jsxbin'),
  "w": () => runBundledShortcut('Trim Out to playhead.jsxbin'),
  "x": () => goToMarkerBoundary(1),
  "shift+x": () => openSubpanelByKey("filter"),
  "alt+x": () => goToMarkerBoundary(-1),
  "u": toggleSelectedKeyframeExpansion,
  "shift+u": revealAndFocusSelectedKeyframes,
  "t": revealSelectedTransformProperties,
  "e": () => openSubpanelByKey("ease"),
  "shift+e": applyEasyEaseDirect,
  "f": () => openSubpanelByKey("mask"),
  "shift+f": toggleKeyframeFocusMode,
  "s": () => openSubpanelByKey("styles"),
  "shift+s": () => openSubpanelByKey("styles"),
  ".": addMarkerAtPlayhead,
  "decimal": addMarkerAtPlayhead,
  "numpaddecimal": addMarkerAtPlayhead
};

function shortcutKeyForEvent(event) {
  const rawKey = String(event.key || "").toLowerCase();
  let key = rawKey === " " ? "space" : rawKey;
  if (key === "spacebar") key = "space";
  if (key === "esc") key = "escape";
  if (key === "del") key = "delete";
  if (key === "control" || key === "ctrl" || key === "shift" || key === "alt" || key === "option" || key === "meta" || key === "command") return "";
  if (key === "arrowup" || key === "up") key = "arrowup";
  if (key === "arrowdown" || key === "down") key = "arrowdown";
  const code = String(event.code || "").toLowerCase();
  const keyCode = Number(event.which || event.keyCode || 0);
  const fallbackByCode = {
    8: "backspace",
    9: "tab",
    13: "enter",
    26: "z",
    32: "space",
    38: "arrowup",
    40: "arrowdown",
    46: "delete",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    65: "a",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    77: "m",
    79: "o",
    86: "v",
    83: "s",
    84: "t",
    81: "q",
    75: "k",
    85: "u",
    87: "w",
    88: "x",
    90: "z",
    192: "`",
    190: ".",
    96: "numpad0",
    97: "numpad1",
    98: "numpad2",
    99: "numpad3",
    100: "numpad4",
    101: "numpad5",
    102: "numpad6",
    110: "numpaddecimal"
  };
  const macVirtualFallbackByCode = {
    0: "a",
    8: "c",
    1: "s",
    2: "d",
    3: "f",
    6: "z",
    7: "x",
    9: "v",
    12: "q",
    13: "w",
    14: "e",
    31: "o",
    17: "t",
    18: "1",
    19: "2",
    20: "3",
    21: "4",
    22: "6",
    23: "5",
    32: "u",
    40: "k",
    46: "m",
    47: ".",
    48: "tab",
    49: "space",
    50: "`",
    51: "backspace",
    117: "delete",
    125: "arrowdown",
    126: "arrowup"
  };
  const fallbackByCodeName = {
    backquote: "`",
    space: "space",
    tab: "tab",
    delete: "delete",
    backspace: "backspace",
    arrowup: "arrowup",
    arrowdown: "arrowdown",
    numpad1: "numpad1",
    numpad2: "numpad2",
    numpad3: "numpad3",
    numpad4: "numpad4",
    numpad5: "numpad5",
    numpad6: "numpad6",
    numpaddecimal: "numpaddecimal",
    digit1: "1",
    digit2: "2",
    digit3: "3",
    digit4: "4",
    digit5: "5",
    digit6: "6",
    keya: "a",
    keyc: "c",
    keyd: "d",
    keye: "e",
    keyf: "f",
    keyk: "k",
    keym: "m",
    keyo: "o",
    keyq: "q",
    keys: "s",
    keyt: "t",
    keyu: "u",
    keyv: "v",
    keyw: "w",
    keyx: "x",
    keyz: "z",
    period: "."
  };
  const shiftedDigitByKey = {
    "!": "1",
    "@": "2",
    "#": "3",
    "$": "4",
    "%": "5",
    "^": "6"
  };
  const fallbackByPlatformCode = isMacPlatform()
    ? (macVirtualFallbackByCode[keyCode] || fallbackByCode[keyCode])
    : (fallbackByCode[keyCode] || macVirtualFallbackByCode[keyCode]);
  const keyIsMissing = !key || key === "unidentified" || key === "dead";
  let normalizedKey = fallbackByCodeName[code] ||
    (key === "space" || code === "space" || (keyCode === 32 && keyIsMissing && !code) ? "space" : "") ||
    shiftedDigitByKey[key] ||
    fallbackByPlatformCode ||
    (!keyIsMissing ? key : "");
  if (normalizedKey === "`" && event.altKey) normalizedKey = "backquote";
  if (normalizedKey === "escape") return "escape";
  const modifiers = [];
  const hasMeta = !!(event.metaKey || event.commandKey);
  if (event.ctrlKey) modifiers.push("ctrl");
  if (hasMeta) modifiers.push("meta");
  if (event.shiftKey) modifiers.push("shift");
  if (event.altKey) modifiers.push("alt");
  if (modifiers.length && normalizedKey) return `${modifiers.join("+")}+${normalizedKey}`;
  if (code === "space") return "space";
  if (code === "tab") return "tab";
  if (code === "delete") return "delete";
  if (code === "backspace") return "backspace";
  if (code === "arrowup") return "arrowup";
  if (code === "arrowdown") return "arrowdown";
  if (code === "numpad1") return "numpad1";
  if (code === "numpad2") return "numpad2";
  if (code === "numpad3") return "numpad3";
  if (code === "numpad4") return "numpad4";
  if (code === "numpad5") return "numpad5";
  if (code === "numpad6") return "numpad6";
  if (code === "numpaddecimal") return "numpaddecimal";
  if (code === "digit1") return "1";
  if (code === "digit2") return "2";
  if (code === "digit3") return "3";
  if (code === "digit4") return "4";
  if (code === "digit5") return "5";
  if (code === "digit6") return "6";
  if (code === "keya") return "a";
  if (code === "keyc") return "c";
  if (code === "keyd") return "d";
  if (code === "keye") return "e";
  if (code === "keyf") return "f";
  if (code === "keym") return "m";
  if (code === "keyo") return "o";
  if (code === "keys") return "s";
  if (code === "keyt") return "t";
  if (code === "period") return ".";
  return normalizedKey;
}

function consumeShortcutEvent(event, shortcutKey) {
  event.__tntShortcutHandled = true;
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  suppressPanelShortcutKeyupKey = shortcutKey || shortcutKeyForEvent(event);
  suppressPanelShortcutKeyupUntil = Date.now() + 1800;
  recentPanelShortcutUntil = Date.now() + 1200;
  if (suppressPanelShortcutKeyupKey) suppressPanelShortcutKeys[suppressPanelShortcutKeyupKey] = suppressPanelShortcutKeyupUntil;
}

function isEditableShortcutTarget(event) {
  const tag = (event.target && event.target.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || !!(event.target && event.target.isContentEditable);
}

function shortcutAllowedInEditable(shortcutKey, easeDialogOpen) {
  if (QUICK_PANEL_MODE && QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]) return true;
  return shortcutKey === "ctrl+z" ||
    shortcutKey === "ctrl+s" ||
    shortcutKey === "ctrl+space" ||
    shortcutKey === "ctrl+k" ||
    shortcutKey === "escape" ||
    (easeDialogOpen && shortcutKey === "e");
}

function panelShortcutActionForKey(shortcutKey) {
  const boundName = tntUserShortcutIndex[shortcutKey];
  if (boundName) {
    const entry = tntFindEntryByName(boundName);
    if (entry) return () => executeFxConsoleEntry(entry);
  }
  if (QUICK_PANEL_MODE && QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]) {
    return () => openQuickPanelControl(QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]);
  }
  return SHORTCUT_ACTIONS[shortcutKey] || null;
}

function isUndoShortcutEvent(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = event.keyCode || event.which || 0;
  const hasUndoModifier = !!event.ctrlKey && !(event.metaKey || event.commandKey);
  const isZ = key === "z" || key === "\u001a" || code === "keyz" ||
    keyCode === 90 || (isMacPlatform() && (keyCode === 6 || keyCode === 26));
  return hasUndoModifier && isZ && !event.shiftKey && !event.altKey;
}

function isDuplicateShortcutEvent(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = event.keyCode || event.which || 0;
  const hasDuplicateModifier = !!event.ctrlKey && !(event.metaKey || event.commandKey);
  const isD = key === "d" || code === "keyd" || keyCode === 68 || (isMacPlatform() && keyCode === 2);
  return hasDuplicateModifier && isD && !event.shiftKey && !event.altKey;
}

function criticalShortcutBaseKey(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = Number(event.keyCode || event.which || 0);
  if (key === "z" || key === "\u001a" || code === "keyz" ||
      keyCode === 90 || (isMacPlatform() && (keyCode === 6 || keyCode === 26))) return "z";
  if (key === "d" || code === "keyd" || keyCode === 68 || (isMacPlatform() && keyCode === 2)) return "d";
  return "";
}

function handleCriticalPanelShortcut(event) {
  // While a shortcut cell is listening, capture owns the keyboard. These handlers
  // are registered on window earlier in the bundle, so without this they consume
  // Escape and Delete before the capture listener ever sees them.
  if (tntShortcutCaptureName) return;
  if (event.__tntShortcutHandled) return;
  const baseKey = criticalShortcutBaseKey(event);
  if (activeCriticalShortcut && baseKey &&
      activeCriticalShortcut.endsWith(`+${baseKey}`) &&
      Date.now() <= activeCriticalShortcutUntil) {
    consumeShortcutEvent(event, activeCriticalShortcut);
    return;
  }
  const isUndo = isUndoShortcutEvent(event);
  const isDuplicate = isDuplicateShortcutEvent(event);
  if (!isUndo && !isDuplicate) return;
  const shortcutKey = `ctrl+${isUndo ? "z" : "d"}`;
  consumeShortcutEvent(event, shortcutKey);
  activeCriticalShortcut = shortcutKey;
  activeCriticalShortcutUntil = Date.now() + 2500;
  recentPanelShortcutUntil = Date.now() + 4000;
  registerPanelKeyEventsInterest();
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
  if (isUndo) undoLastAeAction();
  else duplicateSelectedLayers();
}

function handleShortcut(event) {
  // While a shortcut cell is listening, capture owns the keyboard. These handlers
  // are registered on window earlier in the bundle, so without this they consume
  // Escape and Delete before the capture listener ever sees them.
  if (tntShortcutCaptureName) return;
  if (event.__tntShortcutHandled) return;
  if (handleLayerMenuShortcut(event)) return;
  const shortcutKey = shortcutKeyForEvent(event);
  if (!shortcutKey) return;
  const suppressedUntil = suppressPanelShortcutKeys[shortcutKey] || 0;
  if (Date.now() <= suppressedUntil && event.type !== "keydown") {
    consumeShortcutEvent(event, shortcutKey);
    return;
  }
  const easeDialogOpen = !!(easeDialogEl && easeDialogEl.classList.contains("show"));
  if (shortcutKey === "space" && event.repeat) {
    consumeShortcutEvent(event, shortcutKey);
    return;
  }
  if (isEditableShortcutTarget(event) && !shortcutAllowedInEditable(shortcutKey, easeDialogOpen)) return;

  const action = panelShortcutActionForKey(shortcutKey);
  if (!action) return;
  consumeShortcutEvent(event, shortcutKey);
  if (shortcutKey === "escape") suppressEscapeKeyupUntil = Date.now() + 350;
  registerPanelKeyEventsInterest();
  focusPanel(2);
  action();
}

function consumeSuppressedEscapeKeyup(event) {
  if (shortcutKeyForEvent(event) !== "escape") return;
  if (Date.now() > suppressEscapeKeyupUntil && !closeActivePopup()) return;
  event.preventDefault();
  event.stopPropagation();
  suppressEscapeKeyupUntil = 0;
}

function consumePanelShortcutKeyup(event) {
  const shortcutKey = shortcutKeyForEvent(event);
  const baseKey = criticalShortcutBaseKey(event);
  if (activeCriticalShortcut && baseKey &&
      activeCriticalShortcut.endsWith(`+${baseKey}`) &&
      Date.now() <= activeCriticalShortcutUntil) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    delete suppressPanelShortcutKeys[activeCriticalShortcut];
    if (suppressPanelShortcutKeyupKey === activeCriticalShortcut) suppressPanelShortcutKeyupKey = "";
    suppressPanelShortcutKeyupUntil = 0;
    activeCriticalShortcut = "";
    activeCriticalShortcutUntil = 0;
    focusPanel(6);
    return;
  }
  if (!shortcutKey) return;
  const suppressUntil = Math.max(suppressPanelShortcutKeyupUntil || 0, suppressPanelShortcutKeys[shortcutKey] || 0);
  if (Date.now() > suppressUntil) {
    delete suppressPanelShortcutKeys[shortcutKey];
    if (shortcutKey === suppressPanelShortcutKeyupKey) suppressPanelShortcutKeyupKey = "";
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  delete suppressPanelShortcutKeys[shortcutKey];
  if (shortcutKey === suppressPanelShortcutKeyupKey) suppressPanelShortcutKeyupKey = "";
}

function formatTime(seconds) {
  return formatDurationForInput(seconds);
}

function formatRulerTime(seconds) {
  return formatDurationForInput(seconds);
}

function startSyncLoop() {
  // CEP evalScript calls briefly put AE into its busy cursor state. Keep idle
  // synchronization action/activation-driven instead of polling the host.
  stopSyncLoop();
}

function stopSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
}

function startBackgroundEditWatch() {
  if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
  backgroundSyncInterval = setInterval(() => {
    syncTick({ background: true });
  }, 250);
}

function stopBackgroundEditWatch() {
  if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
  backgroundSyncInterval = null;
}

window.addEventListener("focus", () => {
  panelFocused = true;
  registerPanelKeyEventsInterest();
  if (QUICK_PANEL_MODE) {
    refreshQuickPanelState();
    return;
  }
  if (panelSyncPaused) resumePanelSync();
  else schedulePanelActivationSync();
});

window.addEventListener("blur", () => {
  if (QUICK_PANEL_MODE) {
    panelFocused = false;
    return;
  }
  if (Date.now() < recentPanelShortcutUntil) {
    focusPanel(2);
    return;
  }
  panelFocused = false;
  if (panelBlurPauseTimer) clearTimeout(panelBlurPauseTimer);
  panelBlurPauseTimer = setTimeout(() => {
    panelBlurPauseTimer = null;
    if (!nativeSelectionMonitorActive && !panelPointerInside) pausePanelSync();
  }, 350);
});

document.addEventListener("mouseenter", () => {
  panelPointerInside = true;
  registerPanelKeyEventsInterest();
  if (QUICK_PANEL_MODE) return;
  if (panelSyncPaused) resumePanelSync();
});

document.addEventListener("mouseleave", () => {
  panelPointerInside = false;
});

document.addEventListener("visibilitychange", () => {
  panelFocused = !document.hidden && document.hasFocus();
  if (QUICK_PANEL_MODE) {
    if (panelFocused) refreshQuickPanelState();
    return;
  }
  if (document.hidden) pausePanelSync();
  else if (panelFocused && panelSyncPaused) resumePanelSync();
  else if (panelFocused) schedulePanelActivationSync();
});

scrollAreaEl.addEventListener("mousedown", stopPlaybackOnTimelinePointer, true);
scrollAreaEl.addEventListener("contextmenu", stopPlaybackOnTimelinePointer, true);
rulerWrapEl.addEventListener("mousedown", beginScrub);
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("mousedown", beginScrub);
if (timeDisplayEl) timeDisplayEl.addEventListener("mousedown", beginTimeDisplayInteraction);
scrollAreaEl.addEventListener("mousedown", handleTimelineMouseDown);
scrollAreaEl.addEventListener("auxclick", e => { if (e.button === 1) e.preventDefault(); });
scrollAreaEl.addEventListener("dragenter", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
scrollAreaEl.addEventListener("dragover", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
scrollAreaEl.addEventListener("dragleave", event => {
  if (!event.relatedTarget || !scrollAreaEl.contains(event.relatedTarget)) setTimelineDropActive(false);
});
scrollAreaEl.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  setTimelineDropActive(false);
  importDroppedItems(event);
});
document.addEventListener("dragenter", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
document.addEventListener("dragover", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
document.addEventListener("dragleave", event => {
  if (!event.relatedTarget) setTimelineDropActive(false);
});
document.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  setTimelineDropActive(false);
  importDroppedItems(event);
});
scrollAreaEl.addEventListener("contextmenu", event => {
  if (timelineMode === "keyframe" && event.target.closest && event.target.closest(".property-keyframe-marker")) return;
  if (event.target.closest && event.target.closest("#layerMenu")) return;
  if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event)) return;
  const ownedTarget = event.target.closest && event.target.closest([
    ".clip",
    ".keyframe-focus-clip",
    ".keyframe-property-row",
    ".property-keyframe-hit",
    ".property-keyframe-marker",
    ".marker",
    ".marker-half",
    ".marker-region-band",
    ".layer-marker-region",
    ".layer-marker-half-end",
    ".protected-region-overlay"
  ].join(","));
  if (ownedTarget) return;
  const layerRow = event.target.closest && event.target.closest(".keyframe-layer-row[data-layer-index]");
  if (layerRow) {
    const rowLayer = (state.layers || []).find(layer => Number(layer.index) === Number(layerRow.dataset.layerIndex || 0));
    if (!rowLayer) return;
    event.preventDefault();
    event.stopPropagation();
    showLayerMenu(event, rowLayer);
    return;
  }
  if (!state.comp) return;
  event.preventDefault();
  event.stopPropagation();
  showAddLayerMenu(event);
});
rulerWrapEl.addEventListener("selectstart", e => e.preventDefault());
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("selectstart", e => e.preventDefault());
rulerWrapEl.addEventListener("dragstart", e => e.preventDefault());
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("dragstart", e => e.preventDefault());
window.addEventListener("keydown", handleCriticalPanelShortcut, true);
document.addEventListener("keydown", handleCriticalPanelShortcut, true);
window.addEventListener("keypress", handleCriticalPanelShortcut, true);
document.addEventListener("keypress", handleCriticalPanelShortcut, true);
window.addEventListener("keyup", event => {
  if ((isMacPlatform() && (event.key === "Meta" || event.key === "Command")) ||
      (!isMacPlatform() && event.key === "Control")) {
    hidePropertyValueHover();
  }
}, true);
document.addEventListener("mousedown", event => {
  if (!propertyValueEditorEl) return;
  if (propertyValueEditorEl.contains(event.target)) return;
  if (event.target.closest && event.target.closest(".property-keyframe-hit") && propertyValueModifierDown(event)) return;
  closePropertyValueEditor();
}, true);
window.addEventListener("keydown", handleShortcut, true);
document.addEventListener("keydown", handleShortcut, true);
window.addEventListener("keypress", handleShortcut, true);
document.addEventListener("keypress", handleShortcut, true);
window.addEventListener("keyup", consumeSuppressedEscapeKeyup, true);
document.addEventListener("keyup", consumeSuppressedEscapeKeyup, true);
window.addEventListener("keyup", consumePanelShortcutKeyup, true);
document.addEventListener("keyup", consumePanelShortcutKeyup, true);
if (filterColumnEl) {

}

async function refreshQuickPanelState() {
  if (!QUICK_PANEL_MODE) return;
  if (quickPanelRefreshPromise) return quickPanelRefreshPromise;
  quickPanelRefreshPromise = (async () => {
    const contextEl = document.getElementById("quickPanelContext");
    await loadJSX();
    const result = await aeCall("TNT_getTimelineStructureData");
    if (!result || !result.ok) {
      state = { comp: null, layers: [], selectedLayerIndices: [], compMarkers: [] };
      lastSelectedLayerIndex = 0;
      if (contextEl) contextEl.textContent = result && result.error ? result.error : "Open a composition in After Effects.";
      return;
    }
    state = Object.assign({}, state, {
      comp: Object.assign({}, result.comp || {}),
      layers: Array.isArray(result.layers) ? result.layers : [],
      selectedLayerIndices: Array.isArray(result.selectedLayerIndices) ? result.selectedLayerIndices.map(Number) : []
    });
    const selected = state.selectedLayerIndices;
    if (selected.length) lastSelectedLayerIndex = selected[selected.length - 1];
    else lastSelectedLayerIndex = 0;
    updateStatus();
    if (contextEl) {
      const count = selected.length;
      contextEl.textContent = `${state.comp && state.comp.name ? state.comp.name : "Active comp"} · ${count} layer${count === 1 ? "" : "s"} selected`;
    }
  })();
  try {
    await quickPanelRefreshPromise;
  } finally {
    quickPanelRefreshPromise = null;
  }
}

async function openQuickPanelControl(name) {
  name = String(name || "");
  const actions = {
    anchor: showAnchorDialog,
    composition: showCompositionPanel,
    "rename-comp": promptRenameComp,
    ease: showEaseDialog,
    mask: openMaskControlPanel,
    effects: openEffectsControlPanel,
    shapes: openShapesControlPanel,
    styles: openLayerStylePanel,
    "layer-menu": openQuickPanelLayerMenu,
    "mass-edit": showMassEditPanel,
    "text-animation": showTextAnimationPanel,
    "timing-order": showTimingOrderPanel,
    filter: showLayerSelectionPanel
  };
  const action = actions[name];
  if (!action) return;
  if (QUICK_PANEL_MODE) prepareNativeQuickPanelForDirectSubpanel();
  await refreshQuickPanelState();
  if (QUICK_PANEL_MODE && name === "rename-comp") {
    const result = action();
    requestAnimationFrame(() => {
      quickPanelSurfaceSwitching = false;
      document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
      scheduleNativeQuickPanelResize(0);
    });
    await result;
    return;
  }
  try {
    await action();
  } finally {
    if (QUICK_PANEL_MODE) {
      requestAnimationFrame(() => {
        quickPanelSurfaceSwitching = false;
        document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
        focusPanel(1);
        scheduleNativeQuickPanelResize(0);
      });
    }
  }
}

async function openQuickPanelLayerMenu() {
  await refreshQuickPanelState();
  const layer = selectedLayerForContextMenu();
  if (!layer) {
    showQuickLayerMenuDialog(null, []);
    statusEl.textContent = "Select layers first.";
    return;
  }
  showQuickLayerMenuDialog(layer, selectedLayersForMenu(layer));
  if (QUICK_PANEL_MODE) {
    requestAnimationFrame(() => {
      quickPanelSurfaceSwitching = false;
      document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
      focusPanel(1);
      scheduleNativeQuickPanelResize(0);
    });
  }
}

function ensureQuickLayerMenuDialog() {
  if (quickLayerMenuDialogEl) return quickLayerMenuDialogEl;
  quickLayerMenuDialogEl = document.createElement("div");
  quickLayerMenuDialogEl.className = "layer-style-dialog-backdrop quick-layer-menu-backdrop";
  quickLayerMenuDialogEl.setAttribute("aria-hidden", "true");
  quickLayerMenuDialogEl.innerHTML = `
    <div class="quick-layer-menu-dialog">
      <div class="quick-layer-menu-body"></div>
    </div>
  `;
  document.body.appendChild(quickLayerMenuDialogEl);
  quickLayerMenuDialogEl.addEventListener("mousedown", event => {
    if (event.target === quickLayerMenuDialogEl) closeQuickLayerMenuDialog();
  });
  quickLayerMenuDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeQuickLayerMenuDialog();
    }
  });
  return quickLayerMenuDialogEl;
}

function closeQuickLayerMenuDialog() {
  if (!quickLayerMenuDialogEl) return;
  quickLayerMenuDialogEl.classList.remove("show");
  quickLayerMenuDialogEl.setAttribute("aria-hidden", "true");
  focusPanel(2);
}

function showQuickLayerMenuDialog(layer, contextLayers) {
  const el = ensureQuickLayerMenuDialog();
  const body = el.querySelector(".quick-layer-menu-body");
  if (!layer || !contextLayers.length) {
    body.innerHTML = `
      <div class="quick-layer-menu-empty">
        <strong>Layer Menu</strong>
        <span>Select layers in After Effects, then open this again.</span>
      </div>
    `;
  } else {
    const context = buildLayerMenuContext(contextLayers);
    const selected = contextLayers.map(item => item.index);
    const labelName = AE_LABEL_NAMES[layer.label] || `Label ${layer.label || 0}`;
    body.innerHTML = `
      ${buildLayerMenuContextHeader(context)}
      <button type="button" class="menu-row" data-action="maskControl"${menuShortcutKeys("f")}><span>Mask Control...</span>${menuShortcutLabel("F")}</button>
      <button type="button" class="menu-row" data-action="effectsControl"><span>Effects...</span><em>Selected layer effects</em></button>
      <button type="button" class="menu-row" data-action="shapesControl"><span>Shapes...</span><em>Selected shape contents</em></button>
      <button type="button" class="menu-row" data-action="layerStyles"${menuShortcutKeys("s,shift+s")}><span>Layer Styles...</span>${menuShortcutLabel("S")}</button>
      <div class="layer-menu-separator"></div>
      <div class="layer-menu-section label-section">
        <div class="layer-menu-kicker">LABEL COLOR</div>
        <div class="layer-menu-swatches">${buildLayerMenuLabelSwatches(layer.label)}</div>
      </div>
      <button type="button" class="menu-row" data-action="undoAction"${menuShortcutKeys("ctrl+z")}><span>Undo</span>${menuShortcutLabel(undoShortcutLabel())}</button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="labelGroup"><span>Select Label Group</span><em>${escapeHtml(labelName)}</em></button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="hide"><span>${layer.enabled ? "Disable" : "Enable"}</span><em>Toggle clip enabled</em></button>
      <button type="button" class="menu-row" data-action="lock"><span>${layer.locked ? "Unlock" : "Lock"}</span><em>${layer.locked ? "Unlock layer" : "Lock layer"}</em></button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="duplicateLayers"${menuShortcutKeys("d")}><span>Duplicate Selected Layers</span>${menuShortcutLabel("D")}</button>
      <button type="button" class="menu-row" data-action="splitLayers"${menuShortcutKeys("3,numpad3")}><span>Split at Playhead</span>${menuShortcutLabel("3")}</button>
      <button type="button" class="menu-row" data-action="setInPoint"${menuShortcutKeys("5,numpad5")}><span>Set In Point to Playhead</span>${menuShortcutLabel("5")}</button>
      <button type="button" class="menu-row" data-action="setOutPoint"${menuShortcutKeys("6,numpad6")}><span>Set Out Point to Playhead</span>${menuShortcutLabel("6")}</button>
      <button type="button" class="menu-row" data-action="deleteLayers"${menuShortcutKeys("4,numpad4,delete,backspace")}><span>Delete Selected Layers</span>${menuShortcutLabel("4 / Delete")}</button>
      ${buildLayerMenuContextRows(context, layer)}
    `;
    body.onclick = event => runQuickLayerMenuAction(event, selected, layer);
  }
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
}

async function runQuickLayerMenuAction(event, selected, layer) {
  event.preventDefault();
  event.stopPropagation();
  const btn = event.target.closest && event.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "contextFilter") {
    closeQuickLayerMenuDialog();
    setLayerViewFilter(String(btn.dataset.contextFilter || "") || null, selected);
    return;
  }
  if (action === "labelGroup") return;
  if (action === "undoAction") {
    closeQuickLayerMenuDialog();
    await undoLastAeAction();
    return;
  }
  if (action === "layerStyles") {
    closeQuickLayerMenuDialog();
    openLayerStylePanel();
    return;
  }
  if (action === "maskControl") {
    closeQuickLayerMenuDialog();
    openMaskControlPanel();
    return;
  }
  if (action === "effectsControl") {
    closeQuickLayerMenuDialog();
    openEffectsControlPanel();
    return;
  }
  if (action === "shapesControl") {
    closeQuickLayerMenuDialog();
    openShapesControlPanel();
    return;
  }
  if (action === "duplicateLayers") {
    closeQuickLayerMenuDialog();
    await duplicateSelectedLayers(selected);
    return;
  }
  if (action === "splitLayers") {
    closeQuickLayerMenuDialog();
    await splitSelectedLayersAtPlayhead();
    return;
  }
  if (action === "setInPoint") {
    closeQuickLayerMenuDialog();
    await setSelectedLayerEndpoint("in");
    return;
  }
  if (action === "setOutPoint") {
    closeQuickLayerMenuDialog();
    await setSelectedLayerEndpoint("out");
    return;
  }
  if (action === "deleteLayers") {
    closeQuickLayerMenuDialog();
    await deleteSelectedLayers();
    return;
  }
  if (action === "openSourceComp") {
    closeQuickLayerMenuDialog();
    await openLayerSourceComp(layer);
    return;
  }
  if (action === "renameSourceComp") {
    closeQuickLayerMenuDialog();
    await promptRenameSourceComp(layer);
    return;
  }
  if (action === "setTextContent") {
    closeQuickLayerMenuDialog();
    await promptSetTextContent();
    return;
  }
  if (action === "findReplaceText") {
    closeQuickLayerMenuDialog();
    await promptFindReplaceText();
    return;
  }
  if (action === "parentToLastSelected") {
    closeQuickLayerMenuDialog();
    await parentToLastSelectedLayer();
    return;
  }
  if (action === "matteToLastSelected") {
    closeQuickLayerMenuDialog();
    await matteToLastSelectedLayer();
    return;
  }
  if (action === "parentToTarget") {
    closeQuickLayerMenuDialog();
    await promptParentToTargetLayer();
    return;
  }
  if (action === "tntCommand") {
    closeQuickLayerMenuDialog();
    let args = [];
    try { args = JSON.parse(decodeURIComponent(btn.dataset.tntArgs || "%5B%5D")); } catch (_) {}
    await runTntV3Command({ name: btn.textContent || "Panel Command", tntFunction: btn.dataset.tntFunction, args });
    return;
  }
  if (action === "label") {
    const labelIndex = Number(btn.dataset.label || 0);
    await loadJSX();
    const result = await aeCall("TNT_setSelectedLayerLabel", [selected, layer.index, labelIndex]);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update label color.";
      return;
    }
    closeQuickLayerMenuDialog();
    await refreshLayers({ forceRender: true });
    return;
  }
  closeQuickLayerMenuDialog();
  await loadJSX();
  const fn = action === "lock" ? "TNT_toggleSelectedLayerLock" : "TNT_toggleSelectedLayerVisibility";
  const result = await aeCall(fn, [selected, layer.index]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not update selected layers.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

const QUICK_PANEL_CONTROL_SHORTCUTS = {
  "ctrl+a": "anchor",
  "ctrl+c": "composition",
  "ctrl+e": "ease",
  "ctrl+f": "mask",
  "ctrl+s": "styles",
  "ctrl+m": "mass-edit",
  "ctrl+t": "text-animation",
  "ctrl+o": "timing-order",
  "ctrl+x": "filter"
};

const quickPanelShellEl = document.getElementById("quickPanelShell");
const quickPanelSearchEl = document.getElementById("quickPanelSearch");
const quickPanelSearchResultsEl = document.getElementById("quickPanelSearchResults");
let quickPanelResizeTimer = null;
let quickPanelLastSize = "";
let quickPanelSearchParentEntry = null;
let quickPanelSearchSelectedIndex = 0;
let quickPanelSearchEffectsLoading = false;
let quickPanelSurfaceSwitching = false;
let quickPanelHadSurface = false;

function activeQuickPanelSurface() {
  if (layerMenuEl && layerMenuEl.classList.contains("open")) return layerMenuEl;
  const commandDialog = document.querySelector(".timeline-command-dialog-backdrop.show > .timeline-command-dialog");
  if (commandDialog) {
    const style = window.getComputedStyle(commandDialog);
    if (style.display !== "none" && style.visibility !== "hidden") return commandDialog;
  }
  const subpanelSelectors = [
    ".quick-layer-menu-backdrop.show .quick-layer-menu-dialog",
    ".layer-style-dialog-backdrop.show .layer-style-dialog",
    ".ease-dialog-backdrop.show .ease-dialog",
    ".mass-edit-backdrop.show .mass-edit-dialog",
    ".text-animation-backdrop.show .text-animation-dialog",
    ".timing-order-backdrop.show .timing-order-layout",
    ".modal-backdrop.show > .expression-dialog",
    ".modal-backdrop.show > .anchor-dialog",
    ".modal-backdrop.show > .duration-dialog",
    ".modal-backdrop.show > .composition-dialog",
    ".modal-backdrop.show > .layer-selection-dialog"
  ];
  const visibleSubpanels = Array.from(document.querySelectorAll(subpanelSelectors.join(","))).filter(element => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
  if (visibleSubpanels.length) return visibleSubpanels[visibleSubpanels.length - 1];
  return null;
}

function quickPanelSurfaceWidth(surface) {
  if (!surface) return 620;
  if (surface.classList.contains("anchor-dialog")) {
    const panel = surface.querySelector(".anchor-panel") || surface;
    const rect = panel.getBoundingClientRect();
    return Math.ceil(Math.max(panel.scrollWidth || 0, rect.width || 0) + 16);
  }
  if (surface.classList.contains("expression-dialog")) return 580;
  if (surface.classList.contains("duration-dialog")) return 380;
  if (surface.classList.contains("composition-dialog")) return 620;
  if (surface.classList.contains("timeline-command-dialog")) return 620;
  if (surface.classList.contains("layer-selection-dialog")) return 820;
  if (surface.classList.contains("quick-layer-menu-dialog")) return 420;
  if (surface.classList.contains("layer-menu")) return 360;
  if (surface.classList.contains("layer-style-dialog")) {
    if (surface.classList.contains("mask-control-dialog")) return 820;
    if (surface.classList.contains("effects-control-dialog")) return 900;
    if (surface.classList.contains("shapes-control-dialog")) return 900;
    return 1180;
  }
  if (surface.classList.contains("ease-dialog")) return 980;
  if (surface.classList.contains("mass-edit-dialog")) return 900;
  if (surface.classList.contains("text-animation-dialog")) return 780;
  if (surface.classList.contains("timing-order-layout")) return 1140;
  return 680;
}

function quickPanelSurfaceFixedHeight(surface) {
  if (!surface) return 0;
  if (surface.classList.contains("anchor-dialog")) {
    const panel = surface.querySelector(".anchor-panel") || surface;
    const rect = panel.getBoundingClientRect();
    return Math.ceil(Math.max(panel.scrollHeight || 0, rect.height || 0) + 16);
  }
  if (surface.classList.contains("composition-dialog")) return 360;
  if (surface.classList.contains("expression-dialog")) return 360;
  if (surface.classList.contains("duration-dialog")) return 220;
  return 0;
}

function quickPanelSurfaceMinimumHeight(surface) {
  if (!surface) return 260;
  if (surface.classList.contains("quick-layer-menu-dialog")) return 520;
  if (surface.classList.contains("effects-control-dialog") || surface.classList.contains("shapes-control-dialog")) return 520;
  if (surface.classList.contains("layer-style-dialog") && !surface.classList.contains("mask-control-dialog")) return 620;
  if (surface.classList.contains("ease-dialog")) return 620;
  if (surface.classList.contains("mass-edit-dialog")) return 560;
  if (surface.classList.contains("text-animation-dialog")) return 560;
  if (surface.classList.contains("timing-order-layout")) return 420;
  if (surface.classList.contains("timeline-command-dialog")) return 300;
  if (surface.classList.contains("layer-selection-dialog")) return 540;
  return 180;
}

function quickPanelNaturalHeight(surface) {
  if (!surface) return quickPanelShellEl && quickPanelShellEl.classList.contains("searching") ? 320 : 320;
  const fixedHeight = quickPanelSurfaceFixedHeight(surface);
  if (fixedHeight) return fixedHeight;
  document.documentElement.classList.add("quick-panel-measuring");
  void surface.offsetHeight;
  const surfaceRect = surface.getBoundingClientRect();
  let contentBottom = Math.max(surface.scrollHeight || 0, surfaceRect.height || 0);
  surface.querySelectorAll("*").forEach(element => {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.position === "fixed") return;
    const rect = element.getBoundingClientRect();
    contentBottom = Math.max(contentBottom, rect.bottom - surfaceRect.top);
  });
  const body = surface.querySelector(
    ".quick-layer-menu-body, .layer-style-dialog-body, .ease-dialog-body, .mass-edit-body, .text-animation-body, .timing-order-body, .composition-body, .layer-selection-list"
  );
  if (body) {
    const bodyRect = body.getBoundingClientRect();
    contentBottom = Math.max(
      contentBottom,
      bodyRect.top - surfaceRect.top + Math.max(body.scrollHeight || 0, bodyRect.height || 0)
    );
  }
  document.documentElement.classList.remove("quick-panel-measuring");
  return Math.ceil(contentBottom + 16);
}

function resizeNativeQuickPanel() {
  if (!QUICK_PANEL_MODE || typeof window.__tntNativeResize !== "function") return;
  const surface = activeQuickPanelSurface();
  if (surface) quickPanelHadSurface = true;
  else if (quickPanelHadSurface && !quickPanelSurfaceSwitching && closeNativeQuickPanelWindow()) {
    quickPanelHadSurface = false;
    return;
  }
  document.body.classList.toggle("quick-subpanel-open", !!surface || quickPanelSurfaceSwitching);
  if (!surface && quickPanelSurfaceSwitching) return;
  const width = quickPanelSurfaceWidth(surface);
  const contentHeight = quickPanelNaturalHeight(surface);
  const height = Math.max(quickPanelSurfaceMinimumHeight(surface), contentHeight);
  const signature = `${Math.round(width)}x${Math.round(height)}`;
  if (signature === quickPanelLastSize) return;
  quickPanelLastSize = signature;
  window.__tntNativeResize(width, height);
}

function scheduleNativeQuickPanelResize(delay = 20) {
  if (!QUICK_PANEL_MODE) return;
  if (quickPanelResizeTimer) clearTimeout(quickPanelResizeTimer);
  quickPanelResizeTimer = setTimeout(() => {
    quickPanelResizeTimer = null;
    requestAnimationFrame(() => {
      resizeNativeQuickPanel();
      requestAnimationFrame(resizeNativeQuickPanel);
    });
  }, delay);
}

function closeNativeQuickPanelWindow() {
  if (!QUICK_PANEL_MODE || typeof window.__tntNativeClose !== "function") return false;
  window.__tntNativeClose();
  return true;
}

function closeNativeQuickPanelSurfaces() {
  if (!QUICK_PANEL_MODE) return;
  const commandDialog = document.querySelector(".timeline-command-dialog-backdrop.show");
  if (commandDialog && typeof closeTntCommandDialog === "function") closeTntCommandDialog(null);
  if (layerMenuEl && layerMenuEl.classList.contains("open")) hideLayerMenu();
  if (quickLayerMenuDialogEl && quickLayerMenuDialogEl.classList.contains("show")) closeQuickLayerMenuDialog();
  if (layerStyleDialogEl && layerStyleDialogEl.classList.contains("show")) closeLayerStyleDialog();
  if (maskControlDialogEl && maskControlDialogEl.classList.contains("show")) closeMaskControlDialog();
  if (effectsControlDialogEl && effectsControlDialogEl.classList.contains("show")) closeEffectsControlDialog();
  if (shapesControlDialogEl && shapesControlDialogEl.classList.contains("show")) closeShapesControlDialog();
  if (easeDialogEl && easeDialogEl.classList.contains("show")) hideEaseDialog();
  if (massEditDialogEl && massEditDialogEl.classList.contains("show")) hideMassEditPanel();
  if (textAnimationBackdropEl && textAnimationBackdropEl.classList.contains("show")) hideTextAnimationPanel();
  if (timingOrderBackdropEl && timingOrderBackdropEl.classList.contains("show")) hideTimingOrderPanel();
  if (layerSelectionModalEl && layerSelectionModalEl.classList.contains("show")) hideLayerSelectionPanel();
  if (compositionModalEl && compositionModalEl.classList.contains("show")) hideCompositionPanel();
  if (anchorModalEl && anchorModalEl.classList.contains("show")) hideAnchorDialog();
  if (durationModalEl && durationModalEl.classList.contains("show")) hideDurationDialog();
  if (compSelectEl && compSelectEl.classList.contains("open")) closeCompSelect();
  if (flowChartOverlayEl && flowChartOverlayEl.classList.contains("open")) closeFlowChart();
}

function resetNativeQuickPanelToLauncher() {
  if (!QUICK_PANEL_MODE) return;
  quickPanelSurfaceSwitching = false;
  quickPanelHadSurface = false;
  closeNativeQuickPanelSurfaces();
  document.body.classList.remove("quick-subpanel-open");
  resetQuickPanelSearch();
  quickPanelLastSize = "";
}

function prepareNativeQuickPanelForDirectSubpanel() {
  if (!QUICK_PANEL_MODE) return;
  quickPanelSurfaceSwitching = true;
  quickPanelHadSurface = false;
  document.body.classList.add("quick-subpanel-open");
  closeNativeQuickPanelSurfaces();
  resetQuickPanelSearch();
  quickPanelLastSize = "";
}

function quickPanelSearchEntries() {
  if (!quickPanelSearchEl) return [];
  return searchFxConsoleEntries(quickPanelSearchEl.value, quickPanelSearchParentEntry, 12);
}

function tntTagChips(entry, limit) {
  let tags = typeof safeFxConsoleEntryTags === "function" ? safeFxConsoleEntryTags(entry) : [];
  if (limit) tags = tags.slice(0, limit);
  return tags.map(tag =>
    `<i class="tnt-tag tnt-tag-${escapeHtml(tag.kind)} ${escapeHtml(tag.key)}" title="${escapeHtml(tag.title)}">${escapeHtml(tag.label)}</i>`
  ).join("");
}

function renderQuickPanelSearchResults() {
  if (!quickPanelShellEl || !quickPanelSearchResultsEl || !quickPanelSearchEl) return;
  const searching = !!quickPanelSearchEl.value.trim() || !!quickPanelSearchParentEntry;
  quickPanelShellEl.classList.toggle("searching", searching);
  if (!searching) {
    quickPanelSearchResultsEl.innerHTML = "";
    scheduleNativeQuickPanelResize(0);
    return;
  }
  const entries = quickPanelSearchEntries();
  quickPanelSearchSelectedIndex = Math.max(0, Math.min(quickPanelSearchSelectedIndex, Math.max(0, entries.length - 1)));
  if (!entries.length) {
    quickPanelSearchResultsEl.innerHTML = `<div class="quick-panel-search-empty">No matching commands or effects</div>`;
    scheduleNativeQuickPanelResize(0);
    return;
  }
  quickPanelSearchResultsEl.innerHTML = entries.map((entry, index) => {
    const shortcut = String(entry.shortcut || "").trim();
    const keyLabel = entry.children ? "Open" : (shortcut || "\u2014");
    return `
      <button type="button" class="quick-panel-search-result${index === quickPanelSearchSelectedIndex ? " active" : ""}${tntRunClassFor(entry)}" data-quick-search-index="${index}" data-fx-source="${tntSourceGroup(entry)}"${tntRunStyleFor(entry)}>
        ${tntActionIconMarkup(entry)}
        <span class="quick-panel-search-name">${escapeHtml(entry.name || entry.matchName || "Effect")}</span>
        <span class="tnt-tags">${tntTagChips(entry, 2)}</span>
        <kbd class="quick-panel-search-key${shortcut || entry.children ? "" : " empty"}">${escapeHtml(keyLabel)}</kbd>
      </button>
    `;
  }).join("");
  requestAnimationFrame(() => {
    const active = quickPanelSearchResultsEl.querySelector(".quick-panel-search-result.active");
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  });
  scheduleNativeQuickPanelResize(0);
}

async function loadQuickPanelSearchEffects() {
  if (quickPanelSearchEffectsLoading || fxConsoleEffects.length) return;
  quickPanelSearchEffectsLoading = true;
  try {
    await loadFxConsoleEffects();
    renderQuickPanelSearchResults();
  } finally {
    quickPanelSearchEffectsLoading = false;
  }
}

function resetQuickPanelSearch() {
  quickPanelSearchParentEntry = null;
  quickPanelSearchSelectedIndex = 0;
  if (quickPanelSearchEl) {
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = "Search commands or effects";
  }
  renderQuickPanelSearchResults();
}

async function applyQuickPanelSearchEntry(index = quickPanelSearchSelectedIndex) {
  const entries = quickPanelSearchEntries();
  const entry = entries[Math.max(0, Math.min(Number(index || 0), entries.length - 1))];
  if (!entry) return;
  if (entry.children && entry.children.length) {
    quickPanelSearchParentEntry = entry;
    quickPanelSearchSelectedIndex = 0;
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = `Search ${entry.name}`;
    renderQuickPanelSearchResults();
    quickPanelSearchEl.focus();
    return;
  }
  const runRow = quickPanelSearchResultsEl
    ? quickPanelSearchResultsEl.querySelector(`[data-quick-search-index="${index}"]`)
    : null;
  const ran = await tntRunWithProgress(runRow, entry.name, () => executeFxConsoleEntry(entry));
  if (!ran) return;
  if (!activeQuickPanelSurface() && closeNativeQuickPanelWindow()) return;
  resetQuickPanelSearch();
  await refreshQuickPanelState();
  focusQuickPanelSearch(2);
}

function focusQuickPanelSearch(retries = 3) {
  if (!QUICK_PANEL_MODE || !quickPanelSearchEl) return;
  try { window.focus(); } catch (_) {}
  try { quickPanelSearchEl.focus({ preventScroll: true }); }
  catch (_) { try { quickPanelSearchEl.focus(); } catch (__) {} }
  if (retries > 0) setTimeout(() => focusQuickPanelSearch(retries - 1), 80);
}

window.__tntQuickPanelDidShow = async function () {
  if (!QUICK_PANEL_MODE) return;
  resetNativeQuickPanelToLauncher();
  jsxLoaded = false;
  await refreshQuickPanelState();
  focusQuickPanelSearch(4);
  if (quickPanelSearchEl) loadQuickPanelSearchEffects();
  scheduleNativeQuickPanelResize(0);
};

window.__tntQuickPanelOpenControl = async function (name) {
  if (!QUICK_PANEL_MODE) return;
  await openQuickPanelControl(name);
  focusPanel(1);
  scheduleNativeQuickPanelResize(0);
};

window.__tntQuickPanelOpenLayerMenu = async function () {
  if (!QUICK_PANEL_MODE) return;
  await openQuickPanelLayerMenu();
};

window.__tntQuickPanelRestoreFocus = function () {
  if (!QUICK_PANEL_MODE) return;
  if (activeQuickPanelSurface()) {
    focusPanel(1);
  } else {
    focusQuickPanelSearch(2);
  }
};

if (quickPanelShellEl) {
  quickPanelShellEl.addEventListener("click", async event => {
    const refreshButton = event.target.closest && event.target.closest("#quickPanelRefresh");
    if (refreshButton) {
      refreshQuickPanelState();
      return;
    }
    const searchResult = event.target.closest && event.target.closest("[data-quick-search-index]");
    if (searchResult) {
      applyQuickPanelSearchEntry(Number(searchResult.dataset.quickSearchIndex || 0));
      return;
    }
    const button = event.target.closest && event.target.closest("[data-quick-panel]");
    if (!button) return;
    await openQuickPanelControl(button.dataset.quickPanel);
  });
  if (quickPanelSearchEl) {
    quickPanelSearchEl.addEventListener("focus", loadQuickPanelSearchEffects);
    quickPanelSearchEl.addEventListener("input", () => {
      quickPanelSearchSelectedIndex = 0;
      renderQuickPanelSearchResults();
    });
    quickPanelSearchEl.addEventListener("keydown", event => {
      const entries = quickPanelSearchEntries();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        quickPanelSearchSelectedIndex = Math.min(entries.length - 1, quickPanelSearchSelectedIndex + 1);
        renderQuickPanelSearchResults();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        quickPanelSearchSelectedIndex = Math.max(0, quickPanelSearchSelectedIndex - 1);
        renderQuickPanelSearchResults();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        applyQuickPanelSearchEntry();
        return;
      }
      if (event.key === "Escape") {
        if (quickPanelSearchParentEntry) {
          event.preventDefault();
          event.stopPropagation();
          quickPanelSearchParentEntry = null;
          quickPanelSearchSelectedIndex = 0;
          quickPanelSearchEl.value = "";
          quickPanelSearchEl.placeholder = "Search commands or effects";
          renderQuickPanelSearchResults();
        } else if (quickPanelSearchEl.value) {
          event.preventDefault();
          event.stopPropagation();
          resetQuickPanelSearch();
        }
      }
    });
  }
  quickPanelShellEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
  if (QUICK_PANEL_MODE && window.MutationObserver) {
    const observer = new MutationObserver(() => scheduleNativeQuickPanelResize());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"],
      childList: true,
      subtree: true
    });
    window.addEventListener("resize", () => scheduleNativeQuickPanelResize(80));
    scheduleNativeQuickPanelResize(0);
  }
}
const assistantHubEl = document.getElementById("assistantHub");
const assistantFunctionSearchEl = document.getElementById("assistantFunctionSearch");
const assistantFunctionListEl = document.getElementById("assistantFunctionList");
const assistantFunctionCountEl = document.getElementById("assistantFunctionCount");
// Search wide enough to cover the whole catalogue, so the type and shortcut
// filters see every entry rather than only the first page of results. The
// display cap is applied after filtering, in the renderer.
// ---- User shortcut bindings -------------------------------------------------
// Stored against the command name rather than the built-in key, so any catalogue
// entry can be bound - not just the 62 with a hardcoded SHORTCUT_ACTIONS entry.
// Looked up before SHORTCUT_ACTIONS, so a user binding wins over a built-in.
const TNT_USER_SHORTCUTS_KEY = "tntUserShortcuts.v1";
let tntUserShortcuts = {};
let tntUserShortcutIndex = {};
let tntShortcutCaptureName = "";

function tntLoadUserShortcuts() {
  try {
    const raw = window.localStorage.getItem(TNT_USER_SHORTCUTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    tntUserShortcuts = parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    tntUserShortcuts = {};
  }
  tntRebuildUserShortcutIndex();
}

function tntSaveUserShortcuts() {
  try {
    window.localStorage.setItem(TNT_USER_SHORTCUTS_KEY, JSON.stringify(tntUserShortcuts));
  } catch (_) {}
  tntRebuildUserShortcutIndex();
}

function tntRebuildUserShortcutIndex() {
  tntUserShortcutIndex = {};
  Object.keys(tntUserShortcuts).forEach(name => {
    const key = String(tntUserShortcuts[name] || "").trim();
    if (key) tntUserShortcutIndex[key] = name;
  });
}

// Display form ("Ctrl+Shift+E") from the normalised form ("ctrl+shift+e").
function tntShortcutLabel(key) {
  return String(key || "")
    .split("+")
    .map(part => {
      if (part === "ctrl") return "Ctrl";
      if (part === "shift") return "Shift";
      if (part === "alt") return "Alt";
      if (part === "meta") return "Cmd";
      if (part === "space") return "Space";
      if (part === "escape") return "Esc";
      if (part.length === 1) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("+");
}

function tntShortcutForEntry(entry) {
  const name = String((entry && entry.name) || "");
  if (name && Object.prototype.hasOwnProperty.call(tntUserShortcuts, name)) {
    return tntShortcutLabel(tntUserShortcuts[name]);
  }
  return String((entry && entry.shortcut) || "").trim();
}

// shortcutKeyForEvent already emits the full normalised combo including
// modifiers ("ctrl+shift+e"), which is exactly the form SHORTCUT_ACTIONS is keyed
// by. Re-adding modifiers here produced "ctrl+shift+ctrl+shift+e".
function tntCaptureComboFromEvent(event) {
  return shortcutKeyForEvent(event);
}

function tntFindEntryByName(name) {
  const all = searchFxConsoleEntries("", null, ASSISTANT_SEARCH_LIMIT) || [];
  return all.filter(entry => String(entry.name || "") === name)[0] || null;
}

function tntConflictForKey(key, exceptName) {
  const owner = tntUserShortcutIndex[key];
  if (owner && owner !== exceptName) return owner;
  if (SHORTCUT_ACTIONS[key]) return "a built-in panel shortcut";
  return "";
}

function tntBeginShortcutCapture(name) {
  tntShortcutCaptureName = String(name || "");
  renderAssistantFunctions();
  if (statusEl) statusEl.textContent = `Press a key for "${tntShortcutCaptureName}" - Esc to cancel, Delete to clear`;
}

function tntEndShortcutCapture() {
  tntShortcutCaptureName = "";
  renderAssistantFunctions();
}

// Capture runs on capture-phase keydown so it beats the normal shortcut handler.
function tntShortcutCaptureKeydown(event) {
  if (!tntShortcutCaptureName) return;
  event.preventDefault();
  event.stopPropagation();

  const combo = shortcutKeyForEvent(event);
  if (!combo) return;
  const base = combo.split("+").pop();
  if (base === "escape") {
    if (statusEl) statusEl.textContent = "Shortcut unchanged.";
    tntEndShortcutCapture();
    return;
  }
  if (base === "delete" || base === "backspace") {
    delete tntUserShortcuts[tntShortcutCaptureName];
    tntSaveUserShortcuts();
    if (statusEl) statusEl.textContent = "Shortcut cleared.";
    tntEndShortcutCapture();
    return;
  }

  const clash = tntConflictForKey(combo, tntShortcutCaptureName);
  tntUserShortcuts[tntShortcutCaptureName] = combo;
  tntSaveUserShortcuts();
  if (statusEl) {
    statusEl.textContent = clash
      ? `${tntShortcutLabel(combo)} assigned - also used by ${clash}`
      : `${tntShortcutLabel(combo)} assigned.`;
  }
  tntEndShortcutCapture();
}

if (assistantFunctionListEl) {
  assistantFunctionListEl.addEventListener("dblclick", event => {
    const cell = event.target.closest("[data-shortcut-for]");
    if (!cell) return;
    event.preventDefault();
    event.stopPropagation();
    tntBeginShortcutCapture(cell.dataset.shortcutFor || "");
  });
  // Clicking a row runs the command, so swallow clicks that land on the key cell.
  assistantFunctionListEl.addEventListener("click", event => {
    if (event.target.closest("[data-shortcut-for]")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

// On window, not document: capture runs window -> document, and handleShortcut is
// registered on document earlier in the bundle. Keys with a built-in action -
// Escape and Delete among them - were consumed there before capture could see
// them, so cancel and clear never fired.
window.addEventListener("keydown", tntShortcutCaptureKeydown, true);
tntLoadUserShortcuts();

// Progress fill for a running command.
//
// The duration is unknown up front, so the bar eases toward 90% and only
// completes when the run resolves - the usual indeterminate pattern. A run that
// finishes instantly still shows a brief flash, so there is always feedback that
// something happened, and the elapsed time is reported when it lands.
function tntFormatRunTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
}

// Progress state lives here rather than only on the element, because finishing a
// command triggers a re-render that replaces the row. Renderers re-apply these to
// the matching row, so the fill survives being rebuilt mid-animation.
let tntRunName = "";
let tntRunPhase = "";
let tntRunFrom = "";
let tntRunElapsed = 0;
let tntRunClearTimer = 0;

function tntRunClassFor(entry) {
  const name = String((entry && entry.name) || "");
  if (!name || name !== tntRunName) return "";
  return tntRunPhase === "done" ? " tnt-run-done" : " tnt-running";
}

function tntRunStyleFor(entry) {
  const name = String((entry && entry.name) || "");
  if (!name || name !== tntRunName || tntRunPhase !== "done" || !tntRunFrom) return "";
  return ` style="--tnt-run-from:${tntRunFrom}"`;
}

async function tntRunWithProgress(element, label, run) {
  if (!element) return run();
  const started = Date.now();
  if (tntRunClearTimer) clearTimeout(tntRunClearTimer);
  tntRunName = String(label || "");
  tntRunPhase = "running";
  tntRunFrom = "";
  element.classList.remove("tnt-run-done");
  // Force a reflow so a repeated run restarts the animation instead of being
  // treated as the same running state.
  void element.offsetWidth;
  element.classList.add("tnt-running");
  try {
    return await run();
  } finally {
    const elapsed = Date.now() - started;
    // Hand the completion animation the width the fill actually reached, so a
    // command that finished early sweeps on from there instead of jumping to a
    // hardcoded start point.
    let reached = "0px";
    try { reached = getComputedStyle(element, "::after").width || "0px"; } catch (_) {}
    tntRunFrom = reached;
    tntRunPhase = "done";
    tntRunElapsed = elapsed;
    element.style.setProperty("--tnt-run-from", reached);
    element.classList.remove("tnt-running");
    void element.offsetWidth;
    element.classList.add("tnt-run-done");
    if (statusEl && label) statusEl.textContent = `${label} · ${tntFormatRunTime(elapsed)}`;
    // Must outlast the 2s completion animation, or the fill is dropped mid-fade.
    // Re-renders in between re-apply the state, so this owns clearing it.
    tntRunClearTimer = setTimeout(() => {
      tntRunClearTimer = 0;
      tntRunName = "";
      tntRunPhase = "";
      tntRunFrom = "";
      try { renderAssistantFunctions(); } catch (_) {}
      try { if (typeof renderQuickPanelSearchResults === "function") renderQuickPanelSearchResults(); } catch (_) {}
    }, 900);
  }
}

const ASSISTANT_SEARCH_LIMIT = 5000;
const ASSISTANT_RENDER_LIMIT = 200;
const assistantFilterTypeEl = document.getElementById("assistantFilterType");
const assistantFilterKeyEl = document.getElementById("assistantFilterKey");
let assistantFilterType = "all";
let assistantFilterKey = "all";

// Source group and shortcut presence, applied after the text search so the count
// reflects what is actually on screen.
function assistantApplyFilters(entries) {
  return (entries || []).filter(entry => {
    if (assistantFilterType !== "all" && tntSourceGroup(entry) !== assistantFilterType) return false;
    if (assistantFilterKey === "all") return true;
    const hasKey = !!String((entry && entry.shortcut) || "").trim();
    return assistantFilterKey === "assigned" ? hasKey : !hasKey;
  });
}

if (assistantFilterTypeEl) {
  assistantFilterTypeEl.addEventListener("change", () => {
    assistantFilterType = assistantFilterTypeEl.value || "all";
    assistantFunctionSelectedIndex = 0;
    renderAssistantFunctions();
  });
}

if (assistantFilterKeyEl) {
  assistantFilterKeyEl.addEventListener("click", event => {
    const button = event.target.closest("[data-key-filter]");
    if (!button) return;
    assistantFilterKey = button.dataset.keyFilter || "all";
    assistantFilterKeyEl.querySelectorAll("[data-key-filter]").forEach(el => {
      el.classList.toggle("active", el === button);
    });
    assistantFunctionSelectedIndex = 0;
    renderAssistantFunctions();
  });
}

// The gear moved from the (now removed) left gutter into the tab row, so it can
// no longer rely on the gutter's delegated click handler.
if (settingsBtnEl) {
  settingsBtnEl.addEventListener("mousedown", event => event.stopPropagation(), true);
  settingsBtnEl.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleSettingsMenu();
  });
}
const assistantRefreshFunctionsEl = document.getElementById("assistantRefreshFunctions");
const assistantChatMessagesEl = document.getElementById("assistantChatMessages");
const assistantChatInputEl = document.getElementById("assistantChatInput");
const assistantChatSendEl = document.getElementById("assistantChatSend");
const assistantHistoryMenuEl = document.getElementById("assistantHistoryMenu");
const assistantDraftActionsEl = document.getElementById("assistantDraftActions");
const assistantDraftStatusEl = document.getElementById("assistantDraftStatus");
const assistantAutoTestDraftEl = document.getElementById("assistantAutoTestDraft");
const assistantTestDraftEl = document.getElementById("assistantTestDraft");
const assistantApplyDraftEl = document.getElementById("assistantApplyDraft");
const assistantSaveDraftEl = document.getElementById("assistantSaveDraft");
const assistantSaveModalEl = document.getElementById("assistantSaveModal");
const assistantSaveNameEl = document.getElementById("assistantSaveName");
const assistantSaveCategoryEl = document.getElementById("assistantSaveCategory");
const assistantSaveErrorEl = document.getElementById("assistantSaveError");
const assistantSaveCancelEl = document.getElementById("assistantSaveCancel");
const assistantSaveApplyEl = document.getElementById("assistantSaveApply");
const ASSISTANT_HISTORY_STORAGE_KEY = "tntAssistantChatSessions.v1";
const ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY = "tntAssistantSavedFunctions.v1";
const ASSISTANT_INITIAL_MESSAGE = "Connected to the local assistant bridge. It can read the current After Effects context and the panel function registry.";
const ASSISTANT_AUTO_TEST_MAX_ATTEMPTS = 2;
let assistantFunctionsParentEntry = null;
let assistantFunctionSelectedIndex = 0;
let assistantProvider = "claude";
let assistantChatBusy = false;
let assistantSessions = [];
let assistantCurrentSessionId = "";
let assistantLatestDraft = null;
let assistantSavedFunctions = [];
let assistantAutoTestBusy = false;
let assistantFunctionBusy = false;
let assistantFunctionLastPointerRunAt = 0;

function assistantFunctionEntries() {
  if (!assistantFunctionSearchEl) return [];
  const query = assistantFunctionSearchEl.value;
  try {
    let entries = searchFxConsoleEntries(query, assistantFunctionsParentEntry, ASSISTANT_SEARCH_LIMIT);
    if (!entries.length && assistantFunctionsParentEntry && !String(query || "").trim()) {
      assistantFunctionsParentEntry = null;
      assistantFunctionSearchEl.placeholder = "Search functions";
      entries = searchFxConsoleEntries("", null, ASSISTANT_SEARCH_LIMIT);
    }
    entries = assistantApplyFilters(entries);
    if (entries.length) return entries;
  } catch (err) {
    statusEl.textContent = `Function search failed: ${String(err && err.message || err)}`;
  }
  const normalizedQuery = String(query || "").toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const fallback = []
    .concat((FX_CONSOLE_COMMANDS || []).map(command => ({ ...command, source: "panel" })))
    .concat((typeof getAssistantSavedFunctionCommands === "function" ? getAssistantSavedFunctionCommands() : []))
    .concat((TNT_V3_COMMANDS || []).map(command => ({
      ...command,
      source: "custom",
      type: command.action ? "command" : (command.children ? "tntMenu" : "tntCommand")
    })));
  if (!terms.length) return assistantApplyFilters(fallback);
  return fallback.filter(entry => {
    const source = fxConsoleSourceMeta(entry);
    const tags = (typeof safeFxConsoleEntryTags === "function" ? safeFxConsoleEntryTags(entry) : [{ label: source.label }]).map(tag => tag.label).join(" ");
    const haystack = `${entry.name || ""} ${entry.category || ""} ${entry.matchName || ""} ${entry.shortcut || ""} ${entry.parentName || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, 96);
}

function assistantFunctionDetail(entry) {
  return [entry.category || entry.matchName || "", entry.shortcut || "", entry.parentName || ""].filter(Boolean).join(" / ");
}

function renderAssistantFunctions() {
  if (!assistantFunctionListEl) return;
  const entries = assistantFunctionEntries();
  assistantFunctionSelectedIndex = Math.max(0, Math.min(assistantFunctionSelectedIndex, Math.max(0, entries.length - 1)));
  if (assistantFunctionCountEl) {
    assistantFunctionCountEl.textContent = assistantFunctionsParentEntry
      ? `${entries.length} in ${assistantFunctionsParentEntry.name || "group"}`
      : `${entries.length} command${entries.length === 1 ? "" : "s"}`;
  }
  if (!entries.length) {
    assistantFunctionListEl.innerHTML = `<div class="assistant-message">No functions found.</div>`;
    return;
  }
  const shown = entries.slice(0, ASSISTANT_RENDER_LIMIT);
  // Emitted inside the list so it shares the rows' exact content width - as a
  // sibling it was wider by the list padding plus the scrollbar, so the columns
  // never lined up with the header.
  const columnHeader =
    '<div class="assistant-function-columns" aria-hidden="true">' +
    '<span></span><span>Command</span><span>Type</span><span>Shortcut</span></div>';
  assistantFunctionListEl.innerHTML = columnHeader + shown.map((entry, index) => {
    const shortcut = tntShortcutForEntry(entry);
    const capturing = tntShortcutCaptureName && tntShortcutCaptureName === String(entry.name || "");
    const custom = Object.prototype.hasOwnProperty.call(tntUserShortcuts, String(entry.name || ""));
    return `
      <button type="button" class="assistant-function-card${index === assistantFunctionSelectedIndex ? " active" : ""}${tntRunClassFor(entry)}" data-assistant-function-index="${index}" data-fx-source="${tntSourceGroup(entry)}"${tntRunStyleFor(entry)}>
        ${tntActionIconMarkup(entry)}
        <strong>${escapeHtml(entry.name || entry.matchName || "Function")}</strong>
        <span class="assistant-function-tags tnt-tags">${tntTagChips(entry, 2)}</span>
        <em>${escapeHtml(assistantFunctionDetail(entry))}</em>
        <kbd class="assistant-function-key${shortcut ? "" : " empty"}${custom ? " custom" : ""}${capturing ? " listening" : ""}" data-shortcut-for="${escapeHtml(String(entry.name || ""))}" title="Double-click to set a shortcut">${capturing ? "Press key&hellip;" : (shortcut ? escapeHtml(shortcut) : "&mdash;")}</kbd>
      </button>
    `;
  }).join("");
}

function loadAssistantSavedFunctions() {
  if (!assistantStorageAvailable()) {
    assistantSavedFunctions = [];
    return;
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY) || "[]");
    assistantSavedFunctions = Array.isArray(parsed) ? parsed.filter(item => item && item.id && item.source) : [];
  } catch (_) {
    assistantSavedFunctions = [];
  }
}

function saveAssistantSavedFunctions() {
  if (!assistantStorageAvailable()) return;
  try {
    window.localStorage.setItem(ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY, JSON.stringify(assistantSavedFunctions.slice(0, 200)));
  } catch (_) {}
}

function getAssistantSavedFunctionCommands() {
  if (!assistantSavedFunctions.length) loadAssistantSavedFunctions();
  return assistantSavedFunctions.map(item => ({
    type: "command",
    name: item.name || "Assistant Function",
    category: item.category || "Assistant",
    source: "assistant",
    assistantFunctionId: item.id,
    action: () => runAssistantSavedFunction(item.id)
  }));
}

function assistantExtractScriptBlock(text) {
  const value = String(text || "");
  const fenced = [];
  value.replace(/```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
    const normalizedLang = String(lang || "").toLowerCase();
    fenced.push({ lang: normalizedLang, code: String(code || "").trim() });
    return match;
  });
  const preferred = fenced.find(block => /^(jsx|extendscript|javascript|js)$/.test(block.lang)) || fenced[0];
  if (preferred && preferred.code) return preferred.code;
  return "";
}

function assistantSetLatestDraft(source, originText = "") {
  const cleanSource = String(source || "").trim();
  assistantLatestDraft = cleanSource ? {
    source: cleanSource,
    suggestedName: assistantSessionTitleFromText(originText || "Assistant Function")
  } : null;
  renderAssistantDraftActions();
}

function renderAssistantDraftActions(message = "") {
  if (!assistantDraftActionsEl) return;
  const hasDraft = !!(assistantLatestDraft && assistantLatestDraft.source);
  assistantDraftActionsEl.classList.toggle("show", hasDraft);
  assistantDraftActionsEl.setAttribute("aria-hidden", hasDraft ? "false" : "true");
  if (assistantDraftStatusEl) {
    assistantDraftStatusEl.textContent = message || (hasDraft ? "Script draft ready" : "");
  }
}

function assistantScriptSafetyCheck(source) {
  const code = String(source || "");
  const compact = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const blocked = [
    { pattern: /\bapp\.project\.save\b|\bsaveWithDialog\b|\.save\s*\(/i, reason: "saving project/files" },
    { pattern: /\bapp\.quit\b|\bapp\.exit\b/i, reason: "quitting After Effects" },
    { pattern: /\bsystem\.callSystem\b/i, reason: "running shell commands" },
    { pattern: /\bnew\s+(File|Folder)\b|\bFile\s*\(|\bFolder\s*\(/i, reason: "filesystem access" },
    { pattern: /\bimportFile\b|\bImportOptions\b/i, reason: "importing files" },
    { pattern: /\brenderQueue\b|\boutputModule\b/i, reason: "render/output queue changes" },
    { pattern: /\.remove\s*\(/i, reason: "deleting project items, layers, or properties" },
    { pattern: /\bexecuteCommand\s*\(/i, reason: "unbounded AE menu commands" }
  ];
  for (let i = 0; i < blocked.length; i += 1) {
    if (blocked[i].pattern.test(compact)) {
      return { ok: false, error: `Blocked unsafe assistant script: ${blocked[i].reason}.` };
    }
  }
  if (compact.length > 30000) return { ok: false, error: "Blocked unsafe assistant script: draft is too large." };
  return { ok: true };
}

async function runAssistantScriptSource(source, name = "Assistant Function", options = {}) {
  const safety = assistantScriptSafetyCheck(source);
  if (!safety.ok) {
    statusEl.textContent = safety.error;
    return safety;
  }
  await loadJSX();
  const result = await aeCall("TNT_runAssistantGeneratedScript", [String(source || ""), String(name || "Assistant Function"), !!options.revertAfterRun]);
  if (!result.ok) {
    const verificationText = assistantVerificationText(result);
    statusEl.textContent = verificationText || result.error || "Assistant script failed.";
    return result;
  }
  statusEl.textContent = options.revertAfterRun
    ? String(result.result || `${name} test passed`)
    : String(result.result || `${name} done`);
  await refreshLayers({ forceRender: true });
  renderAssistantFunctions();
  return result;
}

function assistantVerificationText(result) {
  if (!result) return "";
  const parts = [];
  if (result.error) parts.push(String(result.error));
  const verification = result.verification || null;
  if (verification) {
    if (verification.before || verification.after) {
      parts.push(`Before: ${verification.before || "unknown"}`);
      parts.push(`After: ${verification.after || "unknown"}`);
    }
    if (verification.dashIntent) {
      parts.push(`Dash check: valid=${verification.dashPatternValid ? "yes" : "no"}, changed=${verification.dashChanged ? "yes" : "no"}, added=${verification.dashValueAdded ? "yes" : "no"}`);
    }
  }
  return parts.filter(Boolean).join("\n");
}

async function testAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  renderAssistantDraftActions("Testing script in After Effects...");
  if (assistantTestDraftEl) assistantTestDraftEl.disabled = true;
  try {
    const result = await runAssistantScriptSource(assistantLatestDraft.source, "Test Assistant Draft", { revertAfterRun: true });
    renderAssistantDraftActions(result.ok ? "Test passed. Apply or Save when ready." : (assistantVerificationText(result) || "Test failed."));
  } finally {
    if (assistantTestDraftEl) assistantTestDraftEl.disabled = false;
  }
}

function setAssistantDraftButtonsBusy(isBusy) {
  if (assistantAutoTestDraftEl) assistantAutoTestDraftEl.disabled = !!isBusy;
  if (assistantTestDraftEl) assistantTestDraftEl.disabled = !!isBusy;
  if (assistantApplyDraftEl) assistantApplyDraftEl.disabled = !!isBusy;
  if (assistantSaveDraftEl) assistantSaveDraftEl.disabled = !!isBusy;
}

async function applyAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  renderAssistantDraftActions("Applying script in After Effects...");
  setAssistantDraftButtonsBusy(true);
  try {
    const result = await runAssistantScriptSource(assistantLatestDraft.source, "Apply Assistant Draft", { revertAfterRun: false });
    renderAssistantDraftActions(result.ok ? "Applied. Save it if you want it in Functions." : (result.error || "Apply failed."));
  } finally {
    setAssistantDraftButtonsBusy(false);
  }
}

async function requestAssistantDraftRevision(errorText, failingSource, attempt) {
  const prompt = [
    assistantAeContextText(`${errorText}\n${failingSource}`),
    "",
    "Current assistant chat history for this session:",
    assistantSessionTranscriptText({ limit: 18, maxCharsPerMessage: 2200 }),
    "",
    "The previous assistant-generated ExtendScript draft failed when tested inside After Effects.",
    `Attempt: ${attempt}`,
    "AE error:",
    String(errorText || "Unknown error"),
    "",
    "Failing script:",
    "```jsx",
    String(failingSource || ""),
    "```",
    "",
    assistantScriptingLibraryText(`${errorText}\n${failingSource}`),
    "",
    "Return a corrected version. Keep the answer compact and include exactly one executable jsx code block. The code block is the function body; the panel wraps it in an undo group.",
    "The corrected script must verify its own result after applying it. For dash/stroke work, confirm actual Dash/Gap properties exist and have values; do not return success for an empty Dashes group or no-op."
  ].filter(Boolean).join("\n");
  try {
    return await runAssistantPromptViaLocalServer(assistantProvider, prompt);
  } catch (serverErr) {
    try {
      return await runAssistantPromptInCep(assistantProvider, prompt);
    } catch (_) {
      throw new Error(`Local assistant server is not reachable: ${String(serverErr && serverErr.message || serverErr)}.`);
    }
  }
}

async function autoTestAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source || assistantAutoTestBusy) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  assistantAutoTestBusy = true;
  setAssistantDraftButtonsBusy(true);
  setAssistantChatBusy(true);
  let source = assistantLatestDraft.source;
  try {
    for (let attempt = 1; attempt <= ASSISTANT_AUTO_TEST_MAX_ATTEMPTS; attempt += 1) {
      renderAssistantDraftActions(`Auto test ${attempt}/${ASSISTANT_AUTO_TEST_MAX_ATTEMPTS}...`);
      const testResult = await runAssistantScriptSource(source, `Auto Test Draft ${attempt}`, { revertAfterRun: true });
      if (testResult.ok) {
        assistantSetLatestDraft(source, assistantLatestDraft.suggestedName || "Assistant Function");
        renderAssistantDraftActions(`Auto test passed on attempt ${attempt}. Apply or Save when ready.`);
        appendAssistantMessage(`Auto test passed on attempt ${attempt}. Test changes were reverted; use Apply to commit them.`, "system");
        return;
      }
      const errorText = assistantVerificationText(testResult) || testResult.error || testResult.result || "Unknown script error.";
      appendAssistantMessage(`Auto test ${attempt} failed:\n${errorText}`, "system");
      if (attempt >= ASSISTANT_AUTO_TEST_MAX_ATTEMPTS) {
        renderAssistantDraftActions(`Auto test stopped: ${errorText}`);
        return;
      }
      renderAssistantDraftActions(`Refining after error ${attempt}/${ASSISTANT_AUTO_TEST_MAX_ATTEMPTS}...`);
      const revision = await requestAssistantDraftRevision(errorText, source, attempt + 1);
      const replyText = String(revision && revision.result || "").trim();
      if (!revision || !revision.ok || !replyText) {
        renderAssistantDraftActions("Refinement failed.");
        appendAssistantMessage((revision && revision.error) || "Assistant refinement failed.", "system");
        return;
      }
      appendAssistantMessage(replyText, "system");
      const nextSource = assistantExtractScriptBlock(replyText);
      if (!nextSource) {
        renderAssistantDraftActions("Refinement did not include a jsx code block.");
        return;
      }
      source = nextSource;
      assistantSetLatestDraft(source, replyText);
    }
  } catch (err) {
    const errorText = `Auto test error: ${String(err && err.message || err)}`;
    renderAssistantDraftActions(errorText);
    appendAssistantMessage(errorText, "system");
  } finally {
    assistantAutoTestBusy = false;
    setAssistantDraftButtonsBusy(false);
    setAssistantChatBusy(false);
    if (assistantChatInputEl) assistantChatInputEl.focus();
  }
}

function showAssistantSaveDialog() {
  if (!assistantLatestDraft || !assistantLatestDraft.source || !assistantSaveModalEl) {
    renderAssistantDraftActions("No script draft found to save.");
    return;
  }
  if (assistantSaveNameEl) {
    assistantSaveNameEl.value = assistantLatestDraft.suggestedName || "Assistant Function";
    setTimeout(() => { try { assistantSaveNameEl.focus(); assistantSaveNameEl.select(); } catch (_) {} }, 0);
  }
  if (assistantSaveCategoryEl && !assistantSaveCategoryEl.value) assistantSaveCategoryEl.value = "Assistant";
  if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = "";
  assistantSaveModalEl.classList.add("show");
  assistantSaveModalEl.setAttribute("aria-hidden", "false");
}

function hideAssistantSaveDialog() {
  if (!assistantSaveModalEl) return;
  assistantSaveModalEl.classList.remove("show");
  assistantSaveModalEl.setAttribute("aria-hidden", "true");
}

function saveAssistantDraftAsFunction() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) return;
  const safety = assistantScriptSafetyCheck(assistantLatestDraft.source);
  if (!safety.ok) {
    if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = safety.error;
    renderAssistantDraftActions(safety.error);
    return;
  }
  const name = String(assistantSaveNameEl && assistantSaveNameEl.value || "").trim();
  const category = String(assistantSaveCategoryEl && assistantSaveCategoryEl.value || "Assistant").trim() || "Assistant";
  if (!name) {
    if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = "Name the function first.";
    return;
  }
  const now = new Date().toISOString();
  assistantSavedFunctions.unshift({
    id: `assistant-fn-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    name,
    category,
    source: assistantLatestDraft.source,
    createdAt: now,
    updatedAt: now
  });
  saveAssistantSavedFunctions();
  hideAssistantSaveDialog();
  renderAssistantFunctions();
  renderAssistantDraftActions(`Saved "${name}" to Functions.`);
  setAssistantTab("functions");
  if (assistantFunctionSearchEl) {
    assistantFunctionSearchEl.value = name;
    assistantFunctionSelectedIndex = 0;
    renderAssistantFunctions();
  }
}

async function runAssistantSavedFunction(id) {
  if (!assistantSavedFunctions.length) loadAssistantSavedFunctions();
  const item = assistantSavedFunctions.find(fn => fn.id === id);
  if (!item) {
    statusEl.textContent = "Saved assistant function not found.";
    return;
  }
  await runAssistantScriptSource(item.source, item.name || "Assistant Function");
}

async function runAssistantFunction(index = assistantFunctionSelectedIndex) {
  if (assistantFunctionBusy) return;
  const entries = assistantFunctionEntries();
  const entry = entries[Math.max(0, Math.min(Number(index || 0), entries.length - 1))];
  if (!entry) return;
  if (entry.children && entry.children.length) {
    assistantFunctionsParentEntry = entry;
    assistantFunctionSelectedIndex = 0;
    if (assistantFunctionSearchEl) {
      assistantFunctionSearchEl.value = "";
      assistantFunctionSearchEl.placeholder = `Search ${entry.name}`;
    }
    renderAssistantFunctions();
    return;
  }
  assistantFunctionBusy = true;
  if (assistantFunctionCountEl) assistantFunctionCountEl.textContent = `Running ${entry.name || "function"}...`;
  const runRow = assistantFunctionListEl
    ? assistantFunctionListEl.querySelector(`[data-assistant-function-index="${index}"]`)
    : null;
  try {
    const ran = await tntRunWithProgress(runRow, entry.name, () => executeFxConsoleEntry(entry));
    if (ran) {
      statusEl.textContent = `${entry.name || "Function"} · ${tntFormatRunTime(tntRunElapsed)}`;
      await refreshLayers({ forceRender: true });
    }
  } catch (err) {
    statusEl.textContent = `Function failed: ${String(err && err.message || err)}`;
  } finally {
    assistantFunctionBusy = false;
    renderAssistantFunctions();
  }
}

function setAssistantTab(name) {
  if (!assistantHubEl) return;
  const selected = String(name || "functions");
  assistantHubEl.querySelectorAll("[data-assistant-tab]").forEach(button => {
    const active = button.dataset.assistantTab === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  assistantHubEl.querySelectorAll("[data-assistant-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.assistantPanel === selected);
  });
  if (selected === "functions") renderAssistantFunctions();
}

function assistantStorageAvailable() {
  try {
    return !!window.localStorage;
  } catch (_) {
    return false;
  }
}

function assistantSessionTitleFromText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "New session";
  return normalized.length > 46 ? `${normalized.slice(0, 43)}...` : normalized;
}

function loadAssistantSessions() {
  if (!assistantStorageAvailable()) {
    assistantSessions = [];
    return;
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSISTANT_HISTORY_STORAGE_KEY) || "[]");
    assistantSessions = Array.isArray(parsed) ? parsed.filter(session => session && session.id && Array.isArray(session.messages)) : [];
  } catch (_) {
    assistantSessions = [];
  }
}

function saveAssistantSessions() {
  if (!assistantStorageAvailable()) return;
  try {
    const capped = assistantSessions
      .slice()
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, 40);
    window.localStorage.setItem(ASSISTANT_HISTORY_STORAGE_KEY, JSON.stringify(capped));
    assistantSessions = capped;
  } catch (_) {}
}

function createAssistantSession() {
  const now = new Date().toISOString();
  const session = {
    id: `session-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    title: "New session",
    provider: assistantProvider,
    createdAt: now,
    updatedAt: now,
    messages: [{ kind: "system", text: ASSISTANT_INITIAL_MESSAGE, at: now }]
  };
  assistantSessions.unshift(session);
  assistantCurrentSessionId = session.id;
  saveAssistantSessions();
  return session;
}

function currentAssistantSession() {
  return assistantSessions.find(session => session.id === assistantCurrentSessionId) || assistantSessions[0] || createAssistantSession();
}

function recordAssistantMessage(text, kind = "system") {
  const session = currentAssistantSession();
  const now = new Date().toISOString();
  const cleanText = cleanAssistantOutput(text);
  session.messages.push({ kind, text: cleanText, at: now });
  session.provider = assistantProvider;
  session.updatedAt = now;
  if (kind === "user" && (!session.title || session.title === "New session")) {
    session.title = assistantSessionTitleFromText(cleanText);
  }
  saveAssistantSessions();
  renderAssistantHistoryMenu();
}

function renderAssistantSession(session = currentAssistantSession()) {
  if (!assistantChatMessagesEl || !session) return;
  assistantChatMessagesEl.innerHTML = "";
  (session.messages || []).forEach(message => {
    appendAssistantMessage(message.text, message.kind || "system", { persist: false });
  });
}

function assistantHistoryDateLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  const sessions = assistantSessions
    .slice()
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!sessions.length) {
    assistantHistoryMenuEl.innerHTML = `<div class="assistant-history-empty">No saved chats yet.</div>`;
    return;
  }
  assistantHistoryMenuEl.innerHTML = sessions.map(session => `
    <button type="button" class="assistant-history-item${session.id === assistantCurrentSessionId ? " active" : ""}" data-assistant-session-id="${escapeHtml(session.id)}">
      <strong>${escapeHtml(session.title || "New session")}</strong>
      <span>${escapeHtml(providerLabel(session.provider || assistantProvider))} · ${escapeHtml(assistantHistoryDateLabel(session.updatedAt))} · ${(session.messages || []).length} messages</span>
    </button>
  `).join("");
}

function toggleAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  renderAssistantHistoryMenu();
  const open = !assistantHistoryMenuEl.classList.contains("show");
  assistantHistoryMenuEl.classList.toggle("show", open);
  assistantHistoryMenuEl.setAttribute("aria-hidden", open ? "false" : "true");
}

function closeAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  assistantHistoryMenuEl.classList.remove("show");
  assistantHistoryMenuEl.setAttribute("aria-hidden", "true");
}

function assistantSessionTranscriptText(options = {}) {
  const session = currentAssistantSession();
  const messages = (session && session.messages || [])
    .filter(message => message && message.text && message.kind !== "system-internal")
    .slice(-Number(options.limit || 18));
  if (!messages.length) return "No prior chat messages in this session.";
  return messages.map(message => {
    const role = message.kind === "user" ? "User" : "Assistant";
    const text = String(message.text || "")
      .replace(/\s+$/g, "")
      .slice(0, Number(options.maxCharsPerMessage || 2400));
    return `${role}: ${text}`;
  }).join("\n\n");
}

function appendAssistantMessage(text, kind = "system", options = {}) {
  if (!assistantChatMessagesEl) return;
  const cleanText = cleanAssistantOutput(text);
  const message = document.createElement("div");
  message.className = `assistant-message assistant-message-${kind}`;
  if (kind === "user") {
    message.textContent = cleanText;
  } else {
    renderAssistantMessageContent(message, cleanText);
  }
  assistantChatMessagesEl.appendChild(message);
  assistantChatMessagesEl.scrollTop = assistantChatMessagesEl.scrollHeight;
  if (options.persist !== false) recordAssistantMessage(cleanText, kind);
  if (options.updateDraft !== false && kind !== "user") {
    const draftSource = assistantExtractScriptBlock(cleanText);
    if (draftSource) assistantSetLatestDraft(draftSource, cleanText);
  }
  return message;
}

function renderAssistantMessageContent(container, text) {
  const value = String(text || "");
  const pattern = /```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let rendered = false;
  while ((match = pattern.exec(value))) {
    const before = value.slice(lastIndex, match.index);
    if (before.trim()) container.appendChild(assistantTextBlock(before));
    const lang = String(match[1] || "jsx").trim() || "jsx";
    const code = String(match[2] || "").replace(/\s+$/, "");
    container.appendChild(assistantCodeBlock(code, lang));
    lastIndex = pattern.lastIndex;
    rendered = true;
  }
  const after = value.slice(lastIndex);
  if (after.trim()) container.appendChild(assistantTextBlock(after));
  if (!rendered && !container.childNodes.length) container.textContent = value;
}

function assistantTextBlock(text) {
  const block = document.createElement("div");
  block.className = "assistant-text-block";
  block.textContent = String(text || "").trim();
  return block;
}

function assistantCodeBlock(code, lang) {
  const wrap = document.createElement("div");
  wrap.className = "assistant-code-block";
  const header = document.createElement("div");
  header.className = "assistant-code-header";
  header.textContent = String(lang || "code").toUpperCase();
  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");
  const normalizedLang = String(lang || "").toLowerCase();
  if (/^(jsx|extendscript|javascript|js)$/.test(normalizedLang)) {
    codeEl.innerHTML = assistantHighlightJavaScript(code);
  } else {
    codeEl.textContent = String(code || "");
  }
  pre.appendChild(codeEl);
  wrap.appendChild(header);
  wrap.appendChild(pre);
  return wrap;
}

function assistantEscapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function assistantHighlightJavaScript(code) {
  const source = assistantEscapeHtml(code);
  const placeholders = [];
  const placeholderKey = index => {
    let n = index + 1;
    let key = "";
    while (n > 0) {
      n -= 1;
      key = String.fromCharCode(65 + (n % 26)) + key;
      n = Math.floor(n / 26);
    }
    return key;
  };
  const hold = (className, value) => {
    const token = `\u0000${placeholderKey(placeholders.length)}\u0000`;
    placeholders.push(`<span class="${className}">${value}</span>`);
    return token;
  };
  let highlighted = source
    .replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, match => hold("code-comment", match))
    .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, match => hold("code-string", match));
  highlighted = highlighted
    .replace(/\b(function|var|let|const|if|else|for|while|return|try|catch|finally|new|true|false|null|undefined|typeof|instanceof|continue|break|switch|case|default|throw)\b/g, '<span class="code-keyword">$1</span>')
    .replace(/\b(app|CompItem|ShapeLayer|PropertyType|PropertyValueType|ADBE[A-Za-z0-9 _-]*)\b/g, '<span class="code-ae">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>');
  return highlighted.replace(/\u0000([A-Z]+)\u0000/g, (_, key) => {
    let index = 0;
    for (let i = 0; i < key.length; i += 1) index = index * 26 + (key.charCodeAt(i) - 64);
    return placeholders[index - 1] || "";
  });
}

function cleanAssistantOutput(text) {
  const lines = String(text || "").split(/\r?\n/);
  const filtered = [];
  let droppingClaudeStdinWarning = false;
  lines.forEach(line => {
    if (/^Warning: no stdin data received/i.test(line)) {
      droppingClaudeStdinWarning = true;
      return;
    }
    if (droppingClaudeStdinWarning && /^(without it|stdin explicitly:|If piping from)/i.test(line.trim())) return;
    droppingClaudeStdinWarning = false;
    filtered.push(line);
  });
  return filtered.join("\n").trim();
}

function setAssistantProvider(provider) {
  assistantProvider = String(provider || "auto");
  if (!assistantHubEl) return;
  assistantHubEl.querySelectorAll("[data-assistant-provider]").forEach(button => {
    const active = button.dataset.assistantProvider === assistantProvider;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function providerLabel(provider) {
  const labels = { claude: "Claude", codex: "Codex", ollama: "Ollama", auto: "Auto" };
  return labels[String(provider || "").toLowerCase()] || "Assistant";
}

function assistantNodeRequire(moduleName) {
  try {
    if (typeof require === "function") return require(moduleName);
  } catch (_) {}
  try {
    if (window.cep_node && typeof window.cep_node.require === "function") return window.cep_node.require(moduleName);
  } catch (_) {}
  return null;
}

function selectedAssistantLayersForContext() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const layers = (state.layers || []).filter(layer => selected.has(Number(layer.index || 0)));
  return layers.length ? layers : (state.layers || []).slice(0, 12);
}

function assistantAeContextText(topicText = "") {
  const comp = state.comp || null;
  const functions = assistantFunctionInventoryForContext();
  const selectedLayers = selectedAssistantLayersForContext().map(layer => ({
    index: layer.index,
    name: layer.name,
    type: layer.type,
    selected: !!layer.selected,
    inPoint: layer.inPoint,
    outPoint: layer.outPoint,
    startTime: layer.startTime,
    enabled: !!layer.enabled,
    locked: !!layer.locked,
    parentIndex: layer.parentIndex || 0,
    trackMatteType: layer.trackMatteType || "",
    effectNames: layer.effectNames || [],
    propertyNames: layer.propertyNames || []
  }));
  const context = {
    host: "Adobe After Effects 2026",
    extension: "AE FX CEP panel",
    extensionRoot: extensionRootPath(),
    activeComp: comp ? {
      id: comp.id,
      name: comp.name,
      width: comp.width,
      height: comp.height,
      duration: comp.duration,
      frameRate: comp.frameRate,
      time: comp.time,
      numLayers: comp.numLayers,
      selectedLayerIndices: state.selectedLayerIndices || []
    } : null,
    visibleProjectComps: (state.comps || []).slice(0, 40).map(item => ({
      id: item.id,
      name: item.name,
      width: item.width,
      height: item.height,
      duration: item.duration,
      numLayers: item.numLayers
    })),
    selectedOrSampleLayers: selectedLayers,
    selectedKeyframes: (selectedKeyframes || []).slice(0, 80),
    functionRegistry: functions
  };
  return [
    "You are running inside Adobe After Effects 2026 through the AE FX CEP assistant panel.",
    "You may use local CLI tools, MCP servers, and files available to this machine. The user expects After Effects scripting help and panel automation.",
    "You can see the panel's current function registry in context.functionRegistry. When the user asks what functions the tool has, answer from that registry.",
    "Safety mode is enabled for generated scripts. Do not use app.project.save/saveWithDialog, app.quit/exit, system.callSystem, File/Folder filesystem access, importFile/ImportOptions, renderQueue/outputModule, remove(), or executeCommand(). Generated scripts should only mutate the active comp, selected layers, and their properties for the requested task.",
    "When the user asks you to recreate, build, make from scratch, or automate something in AE, break down the approach in 1-3 short bullets and include one executable ExtendScript code block tagged jsx. Keep the code inside the fenced code block only; the panel renders it as a code box and offers Auto Test, Test, and Save for that latest code block.",
    "The jsx code block should be the body of a function executed inside After Effects. Use app.project.activeItem for the active comp, validate that it is a CompItem, and return a short result string. The panel wraps it in an undo group.",
    "If the user asks to save a generated function, provide the jsx code block; the panel's Save button stores it in the assistant function library. Only patch extension source files when the user explicitly asks for a permanent built-in command.",
    "Use the assistant scripting library notes below when they apply. They summarize local Adobe scripting guide match names and proven panel helper patterns:",
    assistantScriptingLibraryText(topicText),
    "Current AE read context follows as JSON. Treat it as live host context read from After Effects:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

function assistantScriptingLibraryText(topicText = "") {
  const topic = String(topicText || "").toLowerCase();
  const notes = [];
  if (/dash|stroke|shape|adbe vector/.test(topic)) {
    notes.push([
      "AE SCRIPTING LIBRARY: Shape stroke dashes",
      "- Local reference: after-effects-scripting-guide-master/docs/matchnames/layer/shapelayer.md#stroke-dashes.",
      "- Shape stroke match name is ADBE Vector Graphic - Stroke. Stroke dash container is ADBE Vector Stroke Dashes.",
      "- Dash props are ADBE Vector Stroke Dash 1 and ADBE Vector Stroke Gap 1. Add missing props with dashes.addProperty(matchName), then setValue(number).",
      "- Existing Dashes containers may already report children; still set Dash 1 and Gap 1 values explicitly and verify by reading them back.",
      "- Recursive traversal should start from layer.property(\"ADBE Root Vectors Group\") / Contents and look for ADBE Vector Graphic - Stroke or ADBE Vector Graphic - G-Stroke.",
      "- Known-good shortcut in this extension: the host function addDashesToStroke() sets Dash 1 to 10 and Gap 1 to 6 on selected shape strokes. A generated script can call return addDashesToStroke(); when the panel JSX has loaded."
    ].join("\n"));
  }
  if (/mask|track matte|matte/.test(topic)) {
    notes.push([
      "AE SCRIPTING LIBRARY: Masks and mattes",
      "- Prefer match-name lookups over display names.",
      "- Validate selected layers and comp with app.project.activeItem instanceof CompItem before mutating."
    ].join("\n"));
  }
  return notes.join("\n\n");
}

function assistantFunctionInventoryForContext() {
  const seen = new Set();
  const flatten = (entry, parentName = "") => {
    if (!entry) return [];
    const source = fxConsoleSourceMeta(entry);
    const tags = typeof fxConsoleEntryTags === "function" ? fxConsoleEntryTags(entry) : [{ label: source.label }];
    const item = {
      name: entry.name || entry.matchName || "Function",
      category: entry.category || "",
      shortcut: entry.shortcut || "",
      source: source.label,
      sourceDetail: source.detail,
      tags: tags.map(tag => tag.label),
      parent: parentName
    };
    const key = [item.name, item.category, item.shortcut, item.source, item.parent].join("\u0001");
    const rows = [];
    if (!seen.has(key)) {
      seen.add(key);
      rows.push(item);
    }
    (entry.children || []).forEach(child => {
      rows.push(...flatten({ ...child, source: entry.source || child.source }, entry.name || parentName));
    });
    return rows;
  };
  return searchFxConsoleEntries("", null, 240).flatMap(entry => flatten(entry)).slice(0, 360);
}

function assistantPromptWithAeContext(userPrompt) {
  return [
    assistantAeContextText(userPrompt),
    "Current assistant chat history for this session follows. Use it as conversation memory; when the user says 'try again', 'same thing', or references earlier errors, resolve that from this transcript:",
    assistantSessionTranscriptText({ limit: 18, maxCharsPerMessage: 2800 }),
    "Current user request:",
    String(userPrompt || "")
  ].join("\n\n");
}

async function runAssistantPromptViaLocalServer(provider, prompt) {
  const response = await fetch("http://127.0.0.1:48739/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: String(provider || "auto"), prompt: String(prompt || "") })
  });
  let payload = null;
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok || !payload || !payload.ok) {
    throw new Error((payload && payload.error) || `Assistant server failed (${response.status}).`);
  }
  return payload;
}

function runAssistantPromptInCep(provider, prompt) {
  const fs = assistantNodeRequire("fs");
  const os = assistantNodeRequire("os");
  const path = assistantNodeRequire("path");
  const childProcess = assistantNodeRequire("child_process");
  if (!fs || !os || !path || !childProcess) {
    return Promise.reject(new Error("CEP Node is not enabled yet. Reload the panel after the manifest update."));
  }
  return new Promise((resolve, reject) => {
    const root = extensionRootPath();
    const runner = path.join(root, "scripts", "assistant-runner.sh");
    const promptFile = path.join(os.tmpdir(), `tnt-assistant-${Date.now()}-${Math.round(Math.random() * 100000)}.txt`);
    try {
      fs.writeFileSync(promptFile, prompt, "utf8");
    } catch (err) {
      reject(err);
      return;
    }
    const env = Object.assign({}, typeof process !== "undefined" && process.env ? process.env : {}, {
      TNT_ASSISTANT_MCP_CONFIG: path.join(root, "scripts", "assistant-mcp.json")
    });
    childProcess.execFile("/bin/bash", [runner, String(provider || "auto"), promptFile, root], {
      cwd: root,
      env,
      maxBuffer: 1024 * 1024 * 16
    }, (error, stdout, stderr) => {
      try { fs.unlinkSync(promptFile); } catch (_) {}
      const output = `${stdout || ""}${stderr ? `\n${stderr}` : ""}`.trim();
      if (error) {
        error.message = output || error.message;
        reject(error);
        return;
      }
      resolve({ ok: true, provider, result: output });
    });
  });
}

function setAssistantChatBusy(isBusy) {
  assistantChatBusy = !!isBusy;
  if (assistantChatSendEl) assistantChatSendEl.disabled = assistantChatBusy;
  if (assistantChatInputEl) assistantChatInputEl.disabled = assistantChatBusy;
}

async function submitAssistantChat() {
  if (!assistantChatInputEl || assistantChatBusy) return;
  const value = assistantChatInputEl.value.trim();
  if (!value) return;
  assistantChatInputEl.value = "";
  appendAssistantMessage(value, "user");
  const thinkingEl = appendAssistantMessage(`${providerLabel(assistantProvider)} is thinking...`, "system", { persist: false });
  setAssistantChatBusy(true);
  try {
    if (state.comp) await refreshLayers({ forceRender: false, skipSettledRefresh: true });
    const prompt = assistantPromptWithAeContext(value);
    let result = null;
    try {
      result = await runAssistantPromptViaLocalServer(assistantProvider, prompt);
    } catch (serverErr) {
      try {
        result = await runAssistantPromptInCep(assistantProvider, prompt);
      } catch (_) {
        throw new Error(`Local assistant server is not reachable: ${String(serverErr && serverErr.message || serverErr)}.`);
      }
    }
    if (result && result.ok) {
      if (thinkingEl) thinkingEl.remove();
      appendAssistantMessage(String(result.result || "").trim() || `${providerLabel(assistantProvider)} returned an empty response.`);
    } else {
      const errorText = (result && result.error) || "Assistant provider failed.";
      if (thinkingEl) thinkingEl.textContent = errorText;
      recordAssistantMessage(errorText);
    }
  } catch (err) {
    const errorText = `Assistant error: ${String(err && err.message || err)}`;
    if (thinkingEl) thinkingEl.textContent = errorText;
    recordAssistantMessage(errorText);
  } finally {
    setAssistantChatBusy(false);
    if (assistantChatInputEl) assistantChatInputEl.focus();
  }
}

function handleAssistantFunctionCardPointer(event, run = false) {
  const card = event.target.closest && event.target.closest("[data-assistant-function-index]");
  if (!card) return false;
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  if (!run) return true;
  const now = Date.now();
  if (now - assistantFunctionLastPointerRunAt < 300) return true;
  assistantFunctionLastPointerRunAt = now;
  assistantFunctionSelectedIndex = Number(card.dataset.assistantFunctionIndex || 0);
  renderAssistantFunctions();
  runAssistantFunction(assistantFunctionSelectedIndex);
  return true;
}

if (assistantFunctionListEl) {
  assistantFunctionListEl.addEventListener("pointerdown", event => handleAssistantFunctionCardPointer(event, true), true);
  assistantFunctionListEl.addEventListener("mousedown", event => handleAssistantFunctionCardPointer(event, true), true);
  assistantFunctionListEl.addEventListener("click", event => handleAssistantFunctionCardPointer(event, true), true);
}

if (assistantHubEl) {
  assistantHubEl.addEventListener("click", event => {
    const tab = event.target.closest && event.target.closest("[data-assistant-tab]");
    if (tab) {
      closeAssistantHistoryMenu();
      setAssistantTab(tab.dataset.assistantTab);
      return;
    }
    const historyButton = event.target.closest && event.target.closest("[data-assistant-history]");
    if (historyButton) {
      toggleAssistantHistoryMenu();
      return;
    }
    const historyItem = event.target.closest && event.target.closest("[data-assistant-session-id]");
    if (historyItem) {
      const session = assistantSessions.find(item => item.id === historyItem.dataset.assistantSessionId);
      if (session) {
        assistantCurrentSessionId = session.id;
        if (session.provider) setAssistantProvider(session.provider);
        renderAssistantSession(session);
        renderAssistantHistoryMenu();
        closeAssistantHistoryMenu();
        if (assistantChatInputEl) assistantChatInputEl.focus();
      }
      return;
    }
    const provider = event.target.closest && event.target.closest("[data-assistant-provider]");
    if (provider) {
      setAssistantProvider(provider.dataset.assistantProvider);
      currentAssistantSession().provider = assistantProvider;
      saveAssistantSessions();
      renderAssistantHistoryMenu();
      return;
    }
    const newChat = event.target.closest && event.target.closest(".assistant-new-btn");
    if (newChat && assistantChatMessagesEl) {
      const session = createAssistantSession();
      renderAssistantSession(session);
      renderAssistantHistoryMenu();
      closeAssistantHistoryMenu();
      if (assistantChatInputEl) assistantChatInputEl.focus();
      return;
    }
    const card = event.target.closest && event.target.closest("[data-assistant-function-index]");
    if (card) {
      event.preventDefault();
      return;
    }
  });
  if (assistantFunctionSearchEl) {
    assistantFunctionSearchEl.addEventListener("focus", async () => {
      if (!fxConsoleEffects.length) {
        await loadFxConsoleEffects();
        renderAssistantFunctions();
      }
    });
    assistantFunctionSearchEl.addEventListener("input", () => {
      assistantFunctionSelectedIndex = 0;
      renderAssistantFunctions();
    });
    assistantFunctionSearchEl.addEventListener("keydown", event => {
      const entries = assistantFunctionEntries();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        assistantFunctionSelectedIndex = Math.min(entries.length - 1, assistantFunctionSelectedIndex + 1);
        renderAssistantFunctions();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        assistantFunctionSelectedIndex = Math.max(0, assistantFunctionSelectedIndex - 1);
        renderAssistantFunctions();
      } else if (event.key === "Enter") {
        event.preventDefault();
        runAssistantFunction();
      } else if (event.key === "Backspace" && !assistantFunctionSearchEl.value && assistantFunctionsParentEntry) {
        assistantFunctionsParentEntry = null;
        assistantFunctionSearchEl.placeholder = "Search functions";
        renderAssistantFunctions();
      }
    });
  }
  if (assistantRefreshFunctionsEl) {
    assistantRefreshFunctionsEl.addEventListener("click", async () => {
      await loadFxConsoleEffects();
      renderAssistantFunctions();
    });
  }
  if (assistantChatSendEl) assistantChatSendEl.addEventListener("click", () => submitAssistantChat());
  if (assistantAutoTestDraftEl) assistantAutoTestDraftEl.addEventListener("click", () => autoTestAssistantDraft());
  if (assistantTestDraftEl) assistantTestDraftEl.addEventListener("click", () => testAssistantDraft());
  if (assistantApplyDraftEl) assistantApplyDraftEl.addEventListener("click", () => applyAssistantDraft());
  if (assistantSaveDraftEl) assistantSaveDraftEl.addEventListener("click", () => showAssistantSaveDialog());
  if (assistantSaveCancelEl) assistantSaveCancelEl.addEventListener("click", () => hideAssistantSaveDialog());
  if (assistantSaveApplyEl) assistantSaveApplyEl.addEventListener("click", () => saveAssistantDraftAsFunction());
  if (assistantSaveModalEl) {
    assistantSaveModalEl.addEventListener("mousedown", event => {
      if (event.target === assistantSaveModalEl) hideAssistantSaveDialog();
    });
    assistantSaveModalEl.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        hideAssistantSaveDialog();
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        saveAssistantDraftAsFunction();
      }
    });
  }
  if (assistantChatInputEl) {
    assistantChatInputEl.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitAssistantChat();
      }
    });
  }
  setAssistantProvider(assistantProvider);
  loadAssistantSessions();
  loadAssistantSavedFunctions();
  if (!assistantSessions.length) createAssistantSession();
  assistantCurrentSessionId = currentAssistantSession().id;
  renderAssistantSession(currentAssistantSession());
  renderAssistantHistoryMenu();
  renderAssistantDraftActions();
  renderAssistantFunctions();
}
if (layerSelectionModalEl) {
  layerSelectionModalEl.addEventListener("mousedown", event => {
    if (event.target === layerSelectionModalEl) hideLayerSelectionPanel();
  });
  layerSelectionModalEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideLayerSelectionPanel();
      focusPanel(2);
    }
  });
}
if (compositionModalEl) {
  compositionModalEl.addEventListener("mousedown", event => {
    if (event.target === compositionModalEl) {
      hideCompositionPanel();
      focusPanel(2);
    }
  });
  compositionModalEl.addEventListener("click", event => {
    const button = event.target.closest && event.target.closest("[data-composition-action]");
    if (!button) return;
    runCompositionPanelAction(button.dataset.compositionAction || "");
  });
}
if (layerSelectionSearchEl) {
  layerSelectionSearchEl.addEventListener("input", () => {
    layerSelectionQuery = layerSelectionSearchEl.value || "";
    renderLayerSelectionPanel();
  });
}
if (layerSelectionSearchClearEl) {
  layerSelectionSearchClearEl.addEventListener("click", () => {
    layerSelectionQuery = "";
    if (layerSelectionSearchEl) {
      layerSelectionSearchEl.value = "";
      layerSelectionSearchEl.focus();
    }
    renderLayerSelectionPanel();
  });
}
if (layerSelectionSelectMatchesEl) {
  layerSelectionSelectMatchesEl.addEventListener("click", () => {
    selectLayerSelectionMatches();
  });
}
if (layerSelectionModesEl) {
  layerSelectionModesEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-selection-mode]");
    if (!btn) return;
    layerSelectionMode = btn.dataset.selectionMode || "layer";
    lastLayerSelectionIndex = 0;
    renderLayerSelectionPanel();
    if (layerSelectionSearchEl) layerSelectionSearchEl.focus();
  });
}
if (layerSelectionScopesEl) {
  layerSelectionScopesEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-selection-scope]");
    if (!btn) return;
    layerSelectionScope = btn.dataset.selectionScope || "selected";
    layerSelectionFilter = null;
    lastLayerSelectionIndex = 0;
    renderLayerSelectionPanel();
  });
}
if (layerSelectionQuickFiltersEl) {
  layerSelectionQuickFiltersEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-layer-selection-filter]");
    if (!btn) return;
    applyLayerSelectionQuickFilter(btn.dataset.layerSelectionFilter || null);
  });
}
if (layerViewFiltersEl) {
  layerViewFiltersEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-layer-view-filter]");
    if (!btn) return;
    setLayerViewFilter(btn.dataset.layerViewFilter || null, null);
    renderLayerSelectionPanel();
  });
}
if (activeFilterNoticeEl) {
  activeFilterNoticeEl.addEventListener("click", () => {
    clearLayerViewFilter();
    focusPanel(2);
  });
}
if (layerSelectionListEl) {
  layerSelectionListEl.addEventListener("click", event => {
    const row = event.target.closest && event.target.closest(".layer-selection-row");
    if (!row) return;
    updateLayerSelectionFromPanel(Number(row.dataset.layerIndex || 0), !!event.shiftKey);
  });
}
if (layerSelectionModalEl) {
  layerSelectionModalEl.addEventListener("click", event => {
    const action = event.target.closest && event.target.closest("[data-layer-selection-action]");
    if (!action) return;
    runLayerSelectionAction(action.dataset.layerSelectionAction);
  });
}
document.addEventListener("mousedown", event => {
  if (compSelectEl && !compSelectEl.contains(event.target)) closeCompSelect();
  if (settingsMenuEl && settingsMenuEl.classList.contains("open") && !settingsMenuEl.contains(event.target) && !(settingsBtnEl && settingsBtnEl.contains(event.target))) closeSettingsMenu();
  if (!layerMenuEl || !layerMenuEl.classList.contains("open")) return;
  if (Date.now() - layerMenuOpenedAt < 320) return;
  if (event.button === 2) return;
  if (event.target.closest && event.target.closest("#layerMenu")) return;
  hideLayerMenu();
}, true);

document.addEventListener("contextmenu", event => {
  if (!layerMenuEl || !layerMenuEl.classList.contains("open")) return;
  if (Date.now() - layerMenuOpenedAt < 320) return;
  if (event.target.closest && (event.target.closest("#layerMenu") || event.target.closest(".clip") || event.target.closest("#scrollArea"))) return;
  hideLayerMenu();
}, true);

if (durationBtnEl) durationBtnEl.addEventListener("click", promptCompDuration);
if (compSelectEl) {
  compSelectEl.addEventListener("mousedown", e => e.stopPropagation(), true);
}
if (compSelectButtonEl) {
  compSelectButtonEl.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    if (!compSelectUpdating) toggleCompSelect();
  });
}
if (compSelectSearchEl) {
  compSelectSearchEl.addEventListener("click", e => {
    e.stopPropagation();
    if (!compSelectEl.classList.contains("open") && !compSelectSearchEl.disabled) openCompSelect();
  });
  compSelectSearchEl.addEventListener("input", () => {
    filterCompSelectItems();
    if (!compSelectEl.classList.contains("open")) openCompSelect();
  });
  compSelectSearchEl.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeCompSelect();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const first = filterCompSelectItems();
      if (first) {
        closeCompSelect();
        selectCompFromHeader(first.dataset.compId);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const first = filterCompSelectItems();
      if (first) first.focus();
    }
  });
}
if (durationCancelEl) durationCancelEl.addEventListener("click", hideDurationDialog);
if (durationApplyEl) durationApplyEl.addEventListener("click", applyCompDurationFromDialog);
if (durationModalEl) durationModalEl.addEventListener("mousedown", e => { if (e.target === durationModalEl) hideDurationDialog(); });
if (durationInputEl) durationInputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); applyCompDurationFromDialog(); }
  if (e.key === "Escape") { e.preventDefault(); hideDurationDialog(); }
});
if (expressionCancelEl) expressionCancelEl.addEventListener("click", hideExpressionDialog);
if (expressionApplyEl) expressionApplyEl.addEventListener("click", () => applyExpressionDialog(false));
if (expressionDisableEl) expressionDisableEl.addEventListener("click", () => applyExpressionDialog(true));
if (expressionModalEl) expressionModalEl.addEventListener("mousedown", e => { if (e.target === expressionModalEl) hideExpressionDialog(); });
if (expressionInputEl) expressionInputEl.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); hideExpressionDialog(); }
  if (e.ctrlKey && !e.metaKey && e.key === "Enter") { e.preventDefault(); applyExpressionDialog(false); }
});
if (anchorGridEl) anchorGridEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-cell");
  if (!btn) return;
  applyAnchorPoint(btn.dataset.point);
});
if (anchorAlignGridEl) anchorAlignGridEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-align-btn");
  if (!btn) return;
  alignSelectedLayersFromAnchorPanel(btn.dataset.align);
});
if (anchorModalEl) anchorModalEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-distribute-grid .anchor-align-btn");
  if (!btn) return;
  alignSelectedLayersFromAnchorPanel(btn.dataset.align);
});
if (anchorModalEl) anchorModalEl.addEventListener("mousedown", e => { if (e.target === anchorModalEl) hideAnchorDialog(); });
if (anchorModalEl) anchorModalEl.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); hideAnchorDialog(); }
});
if (flowChartCloseEl) flowChartCloseEl.addEventListener("click", closeFlowChart);
if (flowChartOverlayEl) flowChartOverlayEl.addEventListener("mousedown", event => {
  if (event.target === flowChartOverlayEl) closeFlowChart();
});
scrollAreaEl.addEventListener("scroll", syncBottomRulerPosition);
if (horizontalScrollBarEl) horizontalScrollBarEl.addEventListener("mousedown", beginHorizontalScrollDrag);
window.addEventListener("resize", () => { if (!userZoomed) render(); updateHorizontalScrollBar(); });
if (keyframeModeBtnEl) keyframeModeBtnEl.addEventListener("click", toggleTimelineMode);
registerPanelKeyEventsInterest();
if (!QUICK_PANEL_MODE) {
  cs.addEventListener("com.tnt.timeline.nativeSelection", handleNativeSelectionSync);
}
renderPlatformBadge();
setupFilterTooltips();
updateModeButton();

if (QUICK_PANEL_MODE) {
  document.title = "AE FX Quick Controls";
  document.documentElement.classList.add("quick-panel-mode");
  document.body.classList.add("quick-panel-mode");
  refreshQuickPanelState();
  } else {
  // Initial read, then a lightweight focused/hovered fingerprint watch.
  // Full timeline refresh still only happens when the host fingerprint changes.
  refreshLayers({ forceRender: true, skipSettledRefresh: true }).then(() => {
    startSyncLoop();
    startBackgroundEditWatch();
    startNativeSelectionMonitor();
  });
}
