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

// The shared card header carries a live count, the way the O panel's always
// has. Align and distribute both have minimums - two layers and three - so
// seeing the number is the difference between a refusal and knowing why.
function updateAnchorSelectionCount() {
  if (!anchorModalEl) return;
  tntPaintSelectionReadouts(anchorModalEl);
}

// The Layout panel: where things sit and how they are ordered. Anchor, align
// and distribute sit with stagger, layer order and pull/snap - all six act on
// the same stable selection. The timing sections are part of this panel's own
// markup; ensureTimingOrderPanel only binds their handlers.
function showAnchorDialog() {
  if (!state.comp || !anchorModalEl) return;
  anchorErrorEl.textContent = "";
  if (typeof ensureTimingOrderPanel === "function") ensureTimingOrderPanel();
  // Marked in JS, not matched with :has() - CEP's Chromium predates it.
  const layoutPanel = anchorModalEl.querySelector(".anchor-panel");
  const layoutDialog = anchorModalEl.querySelector(".anchor-dialog");
  if (layoutPanel) layoutPanel.classList.add("layout-panel");
  if (layoutDialog) layoutDialog.classList.add("layout-dialog");
  if (typeof renderTimingOrderPanel === "function") {
    if (typeof captureTimingOrderBaseline === "function") captureTimingOrderBaseline();
    renderTimingOrderPanel();
  }
  updateAnchorSelectionCount();
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
    "timing-order": toggleAnchorDialog,
    tnk: showTnkPanel
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
    decompose: { name: "Decompose Precomp", tntFunction: "decomposeComp" },
    decomposeDelete: { name: "Decompose + Delete Source", tntFunction: "decomposeCompAndDelete" },
    render: { name: "Add to Render Queue", tntFunction: "addToRenderQueue" }
  };
  const command = commands[action];
  if (!command) return;
  const result = await callTntV3Command(command.tntFunction, command.args || [], {
    refresh: true,
    status: false
  });
  if (!result || !result.ok) {
    const message = result && result.error ? result.error : `${command.name} failed.`;
    if (compositionErrorEl) compositionErrorEl.textContent = message;
    statusEl.textContent = message;
    return;
  }
  statusEl.textContent = String(result.result || `${command.name} done`);
  hideCompositionPanel();
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

// Backtick flips "Align Layers to" between Selection and Composition - the one
// setting that changes constantly while aligning, where reaching for the
// dropdown breaks the flow.
//
// Not Tab: Tab is being kept free for cycling between subpanels. Backtick is
// left-hand, unused, and next to the digits rather than in the middle of them.
//
// It only acts while the anchor panel is open. Everywhere else backtick is
// left alone rather than silently bound to nothing.
// Backtick steps every choice in the open panel one place on: each dropdown
// advances to its next option, and Stagger - whose mode is three buttons rather
// than a dropdown - steps to its next mode. One key moves the whole panel's
// state forward without reaching for anything.
// R reverses the selected layers inside their own stack slots, while the Layout
// panel is open. It goes through the button rather than calling the action
// directly so it inherits the disabled state the panel already computes for the
// current selection - a key that fires when the button is greyed out would be
// the one case the panel cannot explain.
//
// Like backtick, it does nothing anywhere else rather than being claimed
// globally: R is Rotation in After Effects and has to stay that way.
function reverseLayerOrderIfAnchorOpen() {
  if (!anchorModalEl || !anchorModalEl.classList.contains("show")) return;
  const button = anchorModalEl.querySelector('[data-order-stack="reverse"]');
  if (!button || button.disabled) return;
  button.click();
  if (statusEl) statusEl.textContent = "Reversed the selected layer order.";
}

function toggleAlignTargetIfAnchorOpen() {
  // Whichever subpanel is open owns backtick. The Layout panel has several
  // dropdowns plus the stagger mode; the Text panel has one, its style. A panel
  // that is not open is left alone, so backtick is never bound to nothing.
  const anchorOpen = !!(anchorModalEl && anchorModalEl.classList.contains("show"));
  const textOpen = !anchorOpen && typeof textAnimationBackdropEl !== "undefined" &&
    textAnimationBackdropEl && textAnimationBackdropEl.classList.contains("show");
  const surface = anchorOpen ? anchorModalEl : (textOpen ? textAnimationBackdropEl : null);
  if (!surface) return;
  // The stagger mode first: clicking it re-renders the sections, and the select
  // values are only written at bind time, so the flips below survive it.
  const modes = anchorOpen ? anchorModalEl.querySelectorAll("[data-stagger-execute]") : [];
  if (modes.length) {
    let current = -1;
    modes.forEach((button, index) => { if (button.classList.contains("active")) current = index; });
    modes[(current + 1) % modes.length].click();
  }
  const selects = surface.querySelectorAll("select");
  let stepped = 0;
  selects.forEach(select => {
    if (!select.options || select.options.length < 2 || select.disabled) return;
    select.selectedIndex = (select.selectedIndex + 1) % select.options.length;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    // A brief highlight, because a dropdown is easy to miss when the eye is on
    // the buttons.
    select.classList.remove("anchor-align-target-flash");
    void select.offsetWidth;
    select.classList.add("anchor-align-target-flash");
    stepped++;
  });
  if (statusEl) {
    if (!anchorOpen) {
      const style = surface.querySelector(".text-animation-style-select");
      statusEl.textContent = style ? "Text style: " + style.options[style.selectedIndex].text + "." : "Stepped the panel.";
    } else {
      const target = document.getElementById("anchorAlignTarget");
      const alignWord = target && target.value === "comp" ? "composition" : "selection";
      statusEl.textContent = stepped
        ? "Stepped " + stepped + " dropdown" + (stepped === 1 ? "" : "s") + "; aligning to the " + alignWord + "."
        : "Stepped the stagger mode.";
    }
  }
}

async function alignSelectedLayersFromAnchorPanel(mode) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const alignTargetEl = document.getElementById("anchorAlignTarget");
  const alignTarget = alignTargetEl ? alignTargetEl.value : "selection";
  const ignoreParentEl = document.getElementById("anchorIgnoreParent");
  const result = await aeCall("TNT_alignSelectedLayersToComp", [
    String(mode || ""),
    !!(anchorUseMasksEl && anchorUseMasksEl.checked),
    alignTarget,
    !!(ignoreParentEl && ignoreParentEl.checked)
  ]);
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
  "`": toggleAlignTargetIfAnchorOpen,
  "r": reverseLayerOrderIfAnchorOpen,
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
  // A dropdown is not a text field. Treating it as one handed it every panel
  // key, and its native type-ahead rotated whichever select happened to hold
  // focus - pressing a letter in the Layout panel changed the dropdowns
  // instead of running the action. It keeps only the keys it navigates with.
  if (tag === "select") {
    const key = (event.key || "").toLowerCase();
    return key === "arrowup" || key === "arrowdown" ||
      key === "arrowleft" || key === "arrowright" ||
      key === "enter" || key === " " || key === "spacebar";
  }
  return tag === "input" || tag === "textarea" || !!(event.target && event.target.isContentEditable);
}

function shortcutAllowedInEditable(shortcutKey, easeDialogOpen) {
  if (QUICK_PANEL_MODE && QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]) return true;
  // Custom bindings live inside the overlay rather than being claimed globally,
  // so the overlay is where they have to work - and it opens with the caret in
  // the search box, which is exactly the case this function otherwise blocks.
  // Modified combinations only: a bare letter has to stay typeable in a search
  // field.
  if (QUICK_PANEL_MODE && tntUserShortcutIndex[shortcutKey] && /\+/.test(shortcutKey)) return true;
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
  // TNK binds its own keys over these while it is open - "c" is Clone there,
  // Composition Tools here. Its listener cannot win on ordering (this handler is
  // registered on window first), so it is deferred to explicitly.
  if (typeof tnkOwnsKeyboard === "function" && tnkOwnsKeyboard()) return;
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
  // TNK binds its own keys over these while it is open - "c" is Clone there,
  // Composition Tools here. Its listener cannot win on ordering (this handler is
  // registered on window first), so it is deferred to explicitly.
  if (typeof tnkOwnsKeyboard === "function" && tnkOwnsKeyboard()) return;
  // Native buttons own Space and Enter. Let their normal click activation run
  // before considering those keys as panel shortcuts (Space is playback).
  const focusedButton = event.target && event.target.closest && event.target.closest("button");
  if (focusedButton && (event.key === " " || event.key === "Spacebar" || event.key === "Enter")) return;
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
    "timing-order": toggleAnchorDialog,
    tnk: showTnkPanel
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
  "ctrl+d": "tnk"
};

const quickPanelShellEl = document.getElementById("quickPanelShell");
const quickPanelSearchEl = document.getElementById("quickPanelSearch");
const quickPanelSearchResultsEl = document.getElementById("quickPanelSearchResults");
const quickPanelSearchTabsEl = document.getElementById("quickPanelSearchTabs");
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
    ".tnk-backdrop.show .tnk-dialog",
    ".modal-backdrop.show > .expression-dialog",
    ".modal-backdrop.show > .anchor-dialog",
    ".modal-backdrop.show > .duration-dialog",
    ".modal-backdrop.show > .composition-dialog",
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

// Every panel is sized by its own content, which is what the A panel has always
// done. The per-panel minimums below were stale - the Text panel asked for 560
// while its content is 239, so the window came out 321px taller than the panel.
// The content sits at the top of that window and the window is centred
// vertically, so an inflated minimum makes the panel ride high on screen. That
// is why the Text panel sat over the toolbar while the A panel sat over the
// timeline: not a position setting, a size one.
//
// A floor is still wanted so a panel that opens empty is not a sliver.
function quickPanelSurfaceMinimumHeight(surface) {
  return surface ? 180 : 260;
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

// Extra transparent space the native window carries around the panel so drop
// shadows can fade out instead of being clipped square at the window edge.
//
// Only the Windows overlay needs it. The macOS window is not sized this tightly
// and its shadow is drawn by AppKit, not by CSS. On Windows the window is sized
// to the measured content, so without a gutter any shadow reaching past the edge
// is cut off at full strength - which reads as a dark rectangle around the panel
// rather than as depth.
//
// This has to stay above the largest shadow's reach (offset + blur) in the
// `.native-win` rules of 95-quick-panel.css, which is 8 + 24 = 32. Equalling it is
// not enough: a Gaussian tail is still faintly visible at its nominal extent, so
// the last pixels get clipped and the edge stays detectable. 40 leaves 8px of
// clean margin. The CSS insets the panel by this same amount, so the panel keeps
// its intended size and the gutter is pure transparent margin.
const QUICK_PANEL_SHADOW_GUTTER = 40;

// Both platforms. This started as a Windows-only fix, but the cause is not
// platform-specific: the page reports its size, the helper makes a window that
// size, and a box-shadow drawn right up to the window edge is cut off there -
// a soft fade becomes a hard rectangle. macOS was sized flush the same way and
// had the same hard edge.
function quickPanelShadowGutter() {
  return QUICK_PANEL_SHADOW_GUTTER;
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
  const gutter = quickPanelShadowGutter();
  const width = quickPanelSurfaceWidth(surface) + gutter * 2;
  const contentHeight = quickPanelNaturalHeight(surface);
  const height = Math.max(quickPanelSurfaceMinimumHeight(surface), contentHeight) + gutter * 2;
  const signature = `${Math.round(width)}x${Math.round(height)}`;
  if (signature === quickPanelLastSize) return;
  quickPanelLastSize = signature;
  window.__tntNativeResize(width, height);
}

// The window is invisible until this reports a size, so every delay here is
// dead time on screen. Default was 20ms plus two frames; it measures on the
// next frame now and only takes a second pass when the first changed nothing
// - layout is settled by then in every case measured.
function scheduleNativeQuickPanelResize(delay = 0) {
  if (!QUICK_PANEL_MODE) return;
  if (quickPanelResizeTimer) clearTimeout(quickPanelResizeTimer);
  const run = () => {
    quickPanelResizeTimer = null;
    requestAnimationFrame(() => {
      resizeNativeQuickPanel();
      // Always take a second look. The first measurement can land before
      // layout has settled, and skipping the correction would leave the window
      // at the wrong size permanently. It is not a second native call unless
      // the size actually changed - quickPanelLastSize sees to that.
      requestAnimationFrame(resizeNativeQuickPanel);
    });
  };
  if (delay <= 0) run();
  else quickPanelResizeTimer = setTimeout(run, delay);
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
  if (typeof tnkBackdropEl !== "undefined" && tnkBackdropEl && tnkBackdropEl.classList.contains("show")) hideTnkPanel();
  if (compositionModalEl && compositionModalEl.classList.contains("show")) hideCompositionPanel();
  if (anchorModalEl && anchorModalEl.classList.contains("show")) hideAnchorDialog();
  if (durationModalEl && durationModalEl.classList.contains("show")) hideDurationDialog();
  if (compSelectEl && compSelectEl.classList.contains("open")) closeCompSelect();
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

// Tabs and sections laid out like PR FX's Ctrl+Space palette (client/palette-search.js):
// tabs with counts, Tab cycles them, and the list is in coloured sections with
// counts. All holds everything; the others are parts of it. Colours are PR FX's
// palette hues: orange functions, purple saved scripts, blue automation, warm
// orange effects, teal audio.
const QUICK_SEARCH_TABS = [
  { key: "all", label: "All", icon: "command", rgb: "255 154 61" },
  { key: "functions", label: "Functions", icon: "zap", rgb: "255 154 61" },
  { key: "automation", label: "Automation", icon: "workflow", rgb: "134 166 208" },
  { key: "effects", label: "Effects", icon: "wand-sparkles", rgb: "212 162 106" },
  { key: "audio", label: "Audio", icon: "audio-lines", rgb: "125 181 174" }
];
const QUICK_SEARCH_KINDS = [
  { key: "functions", title: "Functions", rgb: "255 154 61" },
  { key: "saved", title: "Saved scripts", rgb: "169 156 212" },
  { key: "automation", title: "Automation", rgb: "134 166 208" },
  { key: "effects", title: "Effects", rgb: "212 162 106" },
  { key: "audio", title: "Audio effects", rgb: "125 181 174" }
];
let quickPanelSearchTab = "all";
let quickPanelSearchLayoutCache = null;

function quickSearchKind(entry) {
  const source = String((entry && entry.source) || "");
  if (source === "native" || (entry && entry.type === "effect")) {
    return /^audio$/i.test(String(entry.category || "").trim()) ? "audio" : "effects";
  }
  if (source === "custom") return "automation";
  if (source === "assistant") return "saved";
  return "functions";
}

function quickSearchKindMeta(kind) {
  return QUICK_SEARCH_KINDS.find(k => k.key === kind) || QUICK_SEARCH_KINDS[0];
}

function quickSearchTabHas(tab, kind) {
  return tab === "all" || tab === kind || (tab === "functions" && kind === "saved");
}

// Where the typed text lands in the name: the start first, then a word start,
// then anywhere; a hit only in tags or category comes last.
function quickSearchScore(entry, query) {
  const q = String(query || "").toLowerCase().trim();
  if (!q) return 0;
  const name = String(entry.name || entry.matchName || "").toLowerCase();
  const at = name.indexOf(q);
  if (at === 0) return 3;
  if (at > 0) return /[a-z0-9]/.test(name.charAt(at - 1)) ? 1 : 2;
  return 0;
}

function quickPanelSearchScope() {
  if (!quickPanelSearchEl) return "";
  if (quickPanelSearchParentEntry) return quickPanelSearchParentEntry.name || "Group";
  const scope = parseFxConsoleScope(quickPanelSearchEl.value);
  if (!scope.group) return "";
  const match = String(quickPanelSearchEl.value).match(/^\s*\[([^\]]+)\]/);
  return match ? match[1].trim() : scope.group;
}

// rows: { kind: "section", title, count, rgb } | { kind: "entry", entry, index, rgb }
function quickPanelSearchLayout() {
  if (!quickPanelSearchEl) return { tabs: null, rows: [], entries: [] };
  const query = quickPanelSearchEl.value;
  const scope = quickPanelSearchScope();
  const rows = [];
  const entries = [];
  const push = (title, rgb, list) => {
    if (!list.length) return;
    rows.push({ kind: "section", title, count: list.length, rgb });
    list.forEach(entry => {
      rows.push({ kind: "entry", entry, index: entries.length, rgb: quickSearchKindMeta(quickSearchKind(entry)).rgb });
      entries.push(entry);
    });
  };
  if (scope) {
    // Inside a group or a parent menu: one section named after it, no tabs.
    const list = searchFxConsoleEntries(query, quickPanelSearchParentEntry, 400);
    push(scope, list.length ? quickSearchKindMeta(quickSearchKind(list[0])).rgb : QUICK_SEARCH_KINDS[0].rgb, list);
    return { tabs: null, rows, entries };
  }
  const typed = String(query || "").trim();
  const all = searchFxConsoleEntries(query, null, 5000);
  const counts = {};
  QUICK_SEARCH_TABS.forEach(tab => { counts[tab.key] = 0; });
  const kinds = new Map();
  all.forEach(entry => {
    const kind = quickSearchKind(entry);
    kinds.set(entry, kind);
    QUICK_SEARCH_TABS.forEach(tab => { if (quickSearchTabHas(tab.key, kind)) counts[tab.key] += 1; });
  });
  const tab = quickPanelSearchTab;
  const inTab = all.filter(entry => quickSearchTabHas(tab, kinds.get(entry)));
  const ranked = list => typed
    ? list.map((entry, i) => ({ entry, i, score: quickSearchScore(entry, typed) }))
      .sort((a, b) => b.score - a.score || a.i - b.i).map(x => x.entry)
    : list;
  if (tab === "all" || tab === "functions") {
    // By kind, in the palette's order.
    QUICK_SEARCH_KINDS.forEach(kind => {
      push(kind.title, kind.rgb, ranked(inTab.filter(entry => kinds.get(entry) === kind.key)));
    });
  } else {
    // One kind: its own categories, as After Effects names them (Blur & Sharpen,
    // Distort...), alphabetically.
    const meta = quickSearchKindMeta(tab);
    const groups = new Map();
    inTab.forEach(entry => {
      const title = String(entry.category || "").trim() || meta.title;
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title).push(entry);
    });
    Array.from(groups.keys()).sort((a, b) => a.localeCompare(b)).forEach(title => {
      push(title, meta.rgb, ranked(groups.get(title)));
    });
  }
  return { tabs: counts, rows, entries };
}

// The rendered layout, reused by the arrow keys and Enter so the index they
// use is the row on screen. Rebuilt whenever what it was built from changed.
function quickPanelSearchLayoutKey() {
  return [quickPanelSearchEl ? quickPanelSearchEl.value : "", quickPanelSearchTab, quickPanelSearchParentEntry ? quickPanelSearchParentEntry.name : "", (fxConsoleEffects || []).length].join("\u0001");
}

function quickPanelSearchEntries() {
  const key = quickPanelSearchLayoutKey();
  if (!quickPanelSearchLayoutCache || quickPanelSearchLayoutCache.key !== key) {
    quickPanelSearchLayoutCache = { key, ...quickPanelSearchLayout() };
  }
  return quickPanelSearchLayoutCache.entries;
}

function stepQuickPanelSearchTab(by) {
  const keys = QUICK_SEARCH_TABS.map(tab => tab.key);
  const at = Math.max(0, keys.indexOf(quickPanelSearchTab));
  setQuickPanelSearchTab(keys[(at + by + keys.length) % keys.length]);
}

function setQuickPanelSearchTab(key) {
  if (!QUICK_SEARCH_TABS.some(tab => tab.key === key)) return;
  quickPanelSearchTab = key;
  quickPanelSearchSelectedIndex = 0;
  renderQuickPanelSearchResults();
  if (quickPanelSearchResultsEl) quickPanelSearchResultsEl.scrollTop = 0;
}

function renderQuickPanelSearchTabs(counts) {
  if (!quickPanelSearchTabsEl) return;
  if (!counts) {
    quickPanelSearchTabsEl.innerHTML = "";
    quickPanelSearchTabsEl.hidden = true;
    return;
  }
  quickPanelSearchTabsEl.hidden = false;
  quickPanelSearchTabsEl.innerHTML = QUICK_SEARCH_TABS.map(tab => {
    const active = tab.key === quickPanelSearchTab;
    const count = counts[tab.key] || 0;
    return `<button type="button" class="quick-search-tab${active ? " is-active" : ""}${count ? "" : " is-empty"}" role="tab" aria-selected="${active}" data-quick-search-tab="${tab.key}" style="--tab-rgb: ${tab.rgb}">${tntIconSvg(tab.icon, "quick-search-tab-icon")}<span>${escapeHtml(tab.label)}</span><span class="count">${count}</span></button>`;
  }).join("") + `<span class="quick-search-tabs-hint">Tab to switch</span>`;
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
  quickPanelSearchLayoutCache = null;
  const searching = !!quickPanelSearchEl.value.trim() || !!quickPanelSearchParentEntry;
  quickPanelShellEl.classList.toggle("searching", searching);
  if (!searching) {
    quickPanelSearchResultsEl.innerHTML = "";
    renderQuickPanelSearchTabs(null);
    scheduleNativeQuickPanelResize(0);
    return;
  }
  const layout = { key: quickPanelSearchLayoutKey(), ...quickPanelSearchLayout() };
  quickPanelSearchLayoutCache = layout;
  renderQuickPanelSearchTabs(layout.tabs);
  const entries = layout.entries;
  quickPanelSearchSelectedIndex = Math.max(0, Math.min(quickPanelSearchSelectedIndex, Math.max(0, entries.length - 1)));
  if (!entries.length) {
    const tab = QUICK_SEARCH_TABS.find(t => t.key === quickPanelSearchTab);
    const elsewhere = layout.tabs && layout.tabs.all > 0;
    const note = elsewhere
      ? `Nothing in ${escapeHtml(tab ? tab.label : "this tab")} is called that. Tab to look in the others.`
      : "No matching commands or effects";
    quickPanelSearchResultsEl.innerHTML = `<div class="quick-panel-search-empty">${note}</div>`;
    scheduleNativeQuickPanelResize(0);
    return;
  }
  quickPanelSearchResultsEl.innerHTML = layout.rows.map(row => {
    if (row.kind === "section") {
      return `<div class="quick-search-section" style="--kind-rgb: ${row.rgb}">${escapeHtml(row.title)}<span class="count">${row.count}</span></div>`;
    }
    const entry = row.entry;
    const index = row.index;
    const shortcut = String(entry.shortcut || "").trim();
    const keyLabel = entry.children ? "Open" : (shortcut || "\u2014");
    // Same cross-check as the Functions list. This is the surface the tool is
    // actually used from, so dimming here is the point of having it at all.
    const unmet = typeof tntEntryUnmetRequirement === "function" ? tntEntryUnmetRequirement(entry) : "";
    return `
      <button type="button" class="quick-panel-search-result${index === quickPanelSearchSelectedIndex ? " active" : ""}${unmet ? " unmet" : ""}${tntRunClassFor(entry)}" data-quick-search-index="${index}" data-fx-source="${tntSourceGroup(entry)}"${unmet ? ` data-tooltip="${escapeHtml(entry.name || "")}\n${escapeHtml(unmet)}"` : ""} style="--kind-rgb: ${row.rgb};${tntRunStyleFor(entry).replace(/^\s*style="|"\s*$/g, "")}">
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
  quickPanelSearchTab = "all";
  if (quickPanelSearchEl) {
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = "Search commands or effects";
  }
  renderQuickPanelSearchResults();
}

// Picking a command, using the quick panel's own search rather than a text
// field. It is the real list - icons, tags, shortcuts, the same navigation -
// so choosing a command to bind is the same act as running one.
//
// While a pick is pending the search does not execute what you activate; it
// hands the name back to whoever asked and restores what was on screen.
let quickPanelPickRequest = null;

function quickPanelPickCommand(prompt) {
  if (!QUICK_PANEL_MODE || !quickPanelSearchEl) return Promise.resolve("");
  return new Promise(resolve => {
    quickPanelPickRequest = { resolve, prompt: String(prompt || "Pick a command") };
    closeNativeQuickPanelSurfaces();
    document.body.classList.remove("quick-subpanel-open");
    quickPanelSearchParentEntry = null;
    quickPanelSearchSelectedIndex = 0;
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = quickPanelPickRequest.prompt;
    if (quickPanelShellEl) quickPanelShellEl.classList.add("picking");
    renderQuickPanelSearchResults();
    quickPanelSearchEl.focus();
    scheduleNativeQuickPanelResize(0);
  });
}

function quickPanelFinishPick(name) {
  const request = quickPanelPickRequest;
  quickPanelPickRequest = null;
  if (quickPanelShellEl) quickPanelShellEl.classList.remove("picking");
  if (quickPanelSearchEl) {
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = "Search commands or effects";
  }
  renderQuickPanelSearchResults();
  if (request) request.resolve(String(name || ""));
}

async function applyQuickPanelSearchEntry(index = quickPanelSearchSelectedIndex) {
  const entries = quickPanelSearchEntries();
  const entry = entries[Math.max(0, Math.min(Number(index || 0), entries.length - 1))];
  if (!entry) return;
  // A pending pick takes the name instead of running anything.
  if (quickPanelPickRequest) {
    quickPanelFinishPick(entry.name || "");
    return;
  }
  // A group parent does not run anything - it writes its scope token into the
  // search box and leaves the caret after it, so the next keystroke narrows
  // within the group. Same box, same keys, no separate mode.
  if (entry.groupParent) {
    quickPanelSearchEl.value = `[${entry.groupParent}] `;
    quickPanelSearchSelectedIndex = 0;
    renderQuickPanelSearchResults();
    quickPanelSearchEl.focus();
    quickPanelSearchEl.setSelectionRange(quickPanelSearchEl.value.length, quickPanelSearchEl.value.length);
    return;
  }
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
  // A direct hotkey asked for one specific control. If that control declined to
  // open - Ease with no keyframes selected, for instance - the shell is what is
  // left on screen, so the request lands as the search launcher instead. Asking
  // for Ease and being handed a search box is worse than nothing happening, so
  // on Windows the overlay just dismisses itself. Scoped to the native-win
  // helper: this is the behaviour the user asked to change on that side only.
  if (window.__TNT_NATIVE_PLATFORM__ === "win" && !activeQuickPanelSurface()) {
    closeNativeQuickPanelWindow();
    return;
  }
  focusPanel(1);
  scheduleNativeQuickPanelResize(0);
};

// Called by the native helper right after it shows the overlay, when the panel
// asked for a group. Mirrors __tntQuickPanelOpenControl.
window.__tntQuickPanelOpenGroup = async function (name) {
  if (!QUICK_PANEL_MODE || !name) return;
  await openCommandGroup(String(name));
  focusPanel(1);
  scheduleNativeQuickPanelResize(0);
};

// Fired by the helper when one of the published bindings is pressed. A group
// parent scopes the search; anything else runs.
window.__tntQuickPanelRunBinding = async function (name) {
  if (!QUICK_PANEL_MODE || !name) return;
  const entry = typeof tntFindEntryByName === "function" ? tntFindEntryByName(String(name)) : null;
  if (!entry) return;
  if (entry.groupParent) {
    await openCommandGroup(entry.groupParent);
  } else {
    await executeFxConsoleEntry(entry);
  }
  focusPanel(1);
  scheduleNativeQuickPanelResize(0);
};

window.__tntQuickPanelOpenLayerMenu = async function () {
  if (!QUICK_PANEL_MODE) return;
  await openQuickPanelLayerMenu();
};

// Windows only. The overlay is a per-pixel-alpha layered window, and Windows
// hit-tests those against the alpha channel - but WebView2 renders through its own
// composition visual, so nothing the page paints contributes to that mask and the
// whole overlay is click-through. Filling the window with a near-transparent
// colour fixes the clicks but tints the entire window rectangle, which shows up as
// a faint rectangle around floating layouts like the anchor panel.
//
// So instead the helper draws WPF rectangles that match only the surfaces actually
// painted here, and puts them *behind* the WebView. They supply the alpha the hit
// test needs, they are completely hidden behind the page's own opaque surfaces,
// and the gaps between cards stay transparent and click-through.
window.__tntQuickPanelHitRects = function () {
  if (!QUICK_PANEL_MODE) return [];
  const selectors = [
    ".quick-panel-shell",
    ".anchor-section",
    ".timing-order-section",
    ".quick-layer-menu-dialog",
    ".layer-style-dialog",
    ".timeline-command-dialog",
    ".duration-dialog",
    ".expression-dialog",
    ".composition-dialog",
    ".ease-dialog",
    ".mass-edit-dialog",
    ".text-animation-dialog",
    ".tnk-dialog",
    ".layer-menu.open"
  ];
  const rects = [];
  const add = (el, style) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;
    rects.push({
      x: Math.floor(rect.left),
      y: Math.floor(rect.top),
      w: Math.ceil(rect.width),
      h: Math.ceil(rect.height),
      r: Math.ceil(parseFloat(style.borderTopLeftRadius) || 0)
    });
  };

  document.querySelectorAll(selectors.join(",")).forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    // The bare wrappers are transparent frames; their child cards are the real
    // surfaces and are matched separately.
    if (el.classList.contains("anchor-dialog") || el.classList.contains("timing-order-layout")) return;
    add(el, style);
  });

  // The list above covers the known panel surfaces, but anything that floats
  // outside them - a colour picker, a select drop-down, a context menu, an editor
  // card positioned beyond its dialog - would render and then refuse clicks,
  // because a surface with no hit shape behind it is a hole in the alpha mask.
  // Rather than maintain a second list of those, sweep for anything that paints
  // an opaque surface and is not already covered.
  const covered = (x, y) => rects.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  document.querySelectorAll("body *").forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 16) return;
    if (covered(rect.left + rect.width / 2, rect.top + rect.height / 2)) return;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (parseFloat(style.opacity) < 0.1) return;
    const match = /rgba?\(([^)]+)\)/.exec(style.backgroundColor);
    if (!match) return;
    const parts = match[1].split(",");
    const alpha = parts.length > 3 ? parseFloat(parts[3]) : 1;
    if (alpha < 0.3) return;
    add(el, style);
  });

  return rects;
};

// Pushes the current hit shapes to the native helper. Sizing alone is not enough
// to keep them current: opening an editor inside a dialog, or a drop-down over it,
// changes what the page paints without changing the window size, and stale shapes
// leave the new surface unclickable. Cheap to send - a handful of rectangles.
function pushNativeQuickPanelHitShapes() {
  if (!QUICK_PANEL_MODE || window.__TNT_NATIVE_PLATFORM__ !== "win") return;
  if (typeof window.__tntNativePost !== "function") return;
  window.__tntNativePost("tntWindow", {
    action: "hitshapes",
    rects: window.__tntQuickPanelHitRects()
  });
}

let quickPanelHitShapeTimer = 0;
function scheduleNativeQuickPanelHitShapes(delay = 60) {
  if (!QUICK_PANEL_MODE || window.__TNT_NATIVE_PLATFORM__ !== "win") return;
  window.clearTimeout(quickPanelHitShapeTimer);
  quickPanelHitShapeTimer = window.setTimeout(pushNativeQuickPanelHitShapes, delay);
}

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
    const searchTab = event.target.closest && event.target.closest("[data-quick-search-tab]");
    if (searchTab) {
      setQuickPanelSearchTab(searchTab.dataset.quickSearchTab);
      focusQuickPanelSearch(0);
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
      if (event.key === "Tab" && !event.altKey && !event.metaKey && !event.ctrlKey &&
          quickPanelShellEl.classList.contains("searching") && !quickPanelSearchScope()) {
        event.preventDefault();
        stepQuickPanelSearchTab(event.shiftKey ? -1 : 1);
        return;
      }
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
        if (quickPanelPickRequest) {
          event.preventDefault();
          event.stopPropagation();
          quickPanelFinishPick("");
          return;
        }
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
const TNT_USER_ICONS_KEY = "tntUserIcons.v1";
let tntUserIcons = {};

function tntLoadUserIcons() {
  try {
    const raw = window.localStorage.getItem(TNT_USER_ICONS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    tntUserIcons = parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    tntUserIcons = {};
  }
}

function tntSaveUserIcons() {
  try {
    window.localStorage.setItem(TNT_USER_ICONS_KEY, JSON.stringify(tntUserIcons));
  } catch (_) {}
}

function tntIconNameForEntry(entry) {
  const name = String((entry && entry.name) || "");
  return (name && tntUserIcons[name]) || "";
}

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
  // The declared key list is built from this index, so it has to be rebuilt
  // with it - otherwise a key bound now stays dead until the panel reloads.
  if (typeof registerPanelKeyEventsInterest === "function") registerPanelKeyEventsInterest();
}


// Display form from the normalised form ("ctrl+shift+e" -> "Control+Shift+E").
//
// Named per platform: meta is Command on macOS but the Windows key on Windows,
// and alt is Option on macOS. Modifiers are also ordered by platform
// convention - Control, Option, Shift, Command on macOS - so a binding reads the
// way the OS writes it. The stored form never changes, only the label.
const TNT_MODIFIER_LABELS_MAC = { ctrl: "Control", alt: "Option", shift: "Shift", meta: "Cmd" };
const TNT_MODIFIER_LABELS_WIN = { ctrl: "Ctrl", meta: "Win", alt: "Alt", shift: "Shift" };
const TNT_MODIFIER_ORDER_MAC = ["ctrl", "alt", "shift", "meta"];
const TNT_MODIFIER_ORDER_WIN = ["ctrl", "meta", "alt", "shift"];

function tntShortcutLabel(key) {
  const parts = String(key || "").split("+").filter(Boolean);
  if (!parts.length) return "";
  const mac = typeof isMacPlatform === "function" ? isMacPlatform() : false;
  const names = mac ? TNT_MODIFIER_LABELS_MAC : TNT_MODIFIER_LABELS_WIN;
  const order = mac ? TNT_MODIFIER_ORDER_MAC : TNT_MODIFIER_ORDER_WIN;

  const mods = order.filter(mod => parts.indexOf(mod) >= 0).map(mod => names[mod]);
  const base = parts.filter(part => !names[part]).map(part => {
    if (part === "space") return "Space";
    if (part === "escape") return "Esc";
    if (part === "backquote") return "`";
    if (part.length === 1) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  return mods.concat(base).join("+");
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

// Capture reads keys from a focused off-screen input rather than from a window
// listener.
//
// In After Effects a CEP panel only receives the keys it declared through
// registerKeyEventsInterest - a fixed list of 14 letters and a few specials here
// - so pressing anything else never reached the handler and the cell sat on
// "Press key..." forever. Text inputs receive keys natively regardless of that
// list, which is why the search box accepts any character. Focusing one for the
// duration of the capture sidesteps the whole problem, on both platforms.
function tntShortcutCaptureInput() {
  let input = document.getElementById("tntShortcutCaptureInput");
  if (input) return input;
  input = document.createElement("input");
  input.id = "tntShortcutCaptureInput";
  input.type = "text";
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  // Off-screen rather than display:none, which cannot take focus.
  input.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;";
  input.addEventListener("keydown", tntShortcutCaptureKeydown);
  // Losing focus ends the capture, so a stray click can never strand the cell.
  input.addEventListener("blur", () => {
    if (tntShortcutCaptureName) {
      if (statusEl) statusEl.textContent = "Shortcut unchanged.";
      tntEndShortcutCapture();
    }
  });
  document.body.appendChild(input);
  return input;
}

function tntBeginShortcutCapture(name) {
  tntShortcutCaptureName = String(name || "");
  renderAssistantFunctions();
  if (statusEl) statusEl.textContent = `Press a key for "${tntShortcutCaptureName}" - Esc to cancel, Delete to clear`;
  const input = tntShortcutCaptureInput();
  input.value = "";
  setTimeout(() => { try { input.focus(); } catch (_) {} }, 0);
}

function tntEndShortcutCapture() {
  tntShortcutCaptureName = "";
  const input = document.getElementById("tntShortcutCaptureInput");
  if (input && document.activeElement === input) {
    try { input.blur(); } catch (_) {}
  }
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
  // Single click on either editable cell. The capture-phase row runner bails for
  // these, so the click reaches here instead of running the command.
  assistantFunctionListEl.addEventListener("click", event => {
    const keyCell = event.target.closest("[data-shortcut-for]");
    if (keyCell) {
      event.preventDefault();
      event.stopPropagation();
      tntBeginShortcutCapture(keyCell.dataset.shortcutFor || "");
      return;
    }
    const iconCell = event.target.closest("[data-icon-for]");
    if (iconCell) {
      event.preventDefault();
      event.stopPropagation();
      tntOpenIconPicker(iconCell.dataset.iconFor || "");
    }
  });
}

// On window, not document: capture runs window -> document, and handleShortcut is
// registered on document earlier in the bundle. Keys with a built-in action -
// Escape and Delete among them - were consumed there before capture could see
// them, so cancel and clear never fired.
window.addEventListener("keydown", tntShortcutCaptureKeydown, true);
tntLoadUserShortcuts();
tntLoadUserIcons();

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
  let succeeded = false;
  try {
    const result = await run();
    succeeded = result !== false;
    return result;
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
    if (succeeded && statusEl && label) statusEl.textContent = `${label} · ${tntFormatRunTime(elapsed)}`;
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
const ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY = "tntAssistantSavedFunctions.v1";
let assistantFunctionsParentEntry = null;
let assistantFunctionSelectedIndex = 0;
let assistantSavedFunctions = [];
let assistantFunctionBusy = false;
let assistantFunctionLastPointerRunAt = 0;

// Group parents expand in place in the Functions list rather than taking over
// the panel or opening a floating search. Expanded groups are remembered by
// name, so a re-render - which happens on every run and every filter - does
// not collapse what you just opened.
let assistantExpandedGroups = new Set();

function assistantToggleGroup(name, force) {
  const key = String(name || "");
  if (!key) return;
  const open = force === undefined ? !assistantExpandedGroups.has(key) : !!force;
  if (open) assistantExpandedGroups.add(key);
  else assistantExpandedGroups.delete(key);
  renderAssistantFunctions();
  if (!open || !assistantFunctionListEl) return;
  requestAnimationFrame(() => {
    const row = assistantFunctionListEl.querySelector(`[data-group-parent="${CSS.escape(key)}"]`);
    if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest" });
  });
}

// Children of an expanded group, in registry order.
function assistantGroupChildren(name) {
  try {
    return searchFxConsoleEntries(`[${name}]`, null, ASSISTANT_SEARCH_LIMIT) || [];
  } catch (_) {
    return [];
  }
}

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
    '<span></span><span>Command</span><span>Type</span><span>Needs</span><span>Shortcut</span></div>';
  const rowMarkup = (entry, index, child) => {
    const shortcut = tntShortcutForEntry(entry);
    const capturing = tntShortcutCaptureName && tntShortcutCaptureName === String(entry.name || "");
    const custom = Object.prototype.hasOwnProperty.call(tntUserShortcuts, String(entry.name || ""));
    const group = entry.groupParent ? String(entry.groupParent) : "";
    const expanded = group && assistantExpandedGroups.has(group);
    // Cross-check: what the command requires against what is selected.
    const requirement = typeof tntEntryRequirement === "function" ? tntEntryRequirement(entry) : "";
    const unmet = typeof tntEntryUnmetRequirement === "function" ? tntEntryUnmetRequirement(entry) : "";
    const needsLabel = requirement ? (TNT_REQUIREMENT_LABELS[requirement] || requirement) : "";
    // The chevron sits before the icon and states which way the row is: a group
    // that cannot be told open from shut is worse than no group at all.
    const chevron = group
      ? `<span class="assistant-function-chevron">${tntIconSvg(expanded ? "chevron-up" : "chevron-down", "assistant-chevron-icon") || ""}</span>`
      : "";
    const attrs = [
      index === null ? "" : `data-assistant-function-index="${index}"`,
      group ? `data-group-parent="${escapeHtml(group)}" aria-expanded="${expanded ? "true" : "false"}"` : "",
      child ? `data-group-child="${escapeHtml(child)}"` : ""
    ].filter(Boolean).join(" ");
    return `
      <button type="button" class="assistant-function-card${index === assistantFunctionSelectedIndex ? " active" : ""}${group ? " is-group" : ""}${child ? " is-child" : ""}${unmet ? " unmet" : ""}${tntRunClassFor(entry)}"${unmet ? ` title="${escapeHtml(unmet)}"` : ""} ${attrs} data-fx-source="${tntSourceGroup(entry)}"${tntRunStyleFor(entry)}>
        <span class="assistant-function-iconcell${tntIconNameForEntry(entry) ? " custom" : ""}" data-icon-for="${escapeHtml(String(entry.name || ""))}" title="Click to change the icon">${chevron}${tntActionIconMarkup(entry)}</span>
        <strong>${escapeHtml(entry.name || entry.matchName || "Function")}</strong>
        <span class="assistant-function-tags tnt-tags">${tntTagChips(entry, 2)}</span>
        <em>${escapeHtml(assistantFunctionDetail(entry))}</em>
        <span class="assistant-function-needs">${escapeHtml(needsLabel)}</span>
        <kbd class="assistant-function-key${shortcut ? "" : " empty"}${custom ? " custom" : ""}${capturing ? " listening" : ""}" data-shortcut-for="${escapeHtml(String(entry.name || ""))}" title="Click to set a shortcut">${capturing ? "Press key&hellip;" : (shortcut ? escapeHtml(shortcut) : "&mdash;")}</kbd>
      </button>
    `;
  };

  assistantFunctionListEl.innerHTML = columnHeader + shown.map((entry, index) => {
    let html = rowMarkup(entry, index, "");
    const group = entry.groupParent ? String(entry.groupParent) : "";
    if (group && assistantExpandedGroups.has(group)) {
      html += assistantGroupChildren(group).map(child => rowMarkup(child, null, group)).join("");
    }
    return html;
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
  if (entry.groupParent) {
    assistantToggleGroup(entry.groupParent);
    return;
  }
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

function assistantStorageAvailable() {
  try {
    return !!window.localStorage;
  } catch (_) {
    return false;
  }
}

function handleAssistantFunctionCardPointer(event, run = false) {
  // A child row of an expanded group carries no index - it is not part of the
  // filtered list - so it is matched on its own attribute and run by name.
  const childRow = event.target.closest && event.target.closest("[data-group-child]");
  if (childRow) {
    if (event.target.closest && event.target.closest("[data-shortcut-for], [data-icon-for]")) return false;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    if (!run) return true;
    const now = Date.now();
    if (now - assistantFunctionLastPointerRunAt < 300) return true;
    assistantFunctionLastPointerRunAt = now;
    const name = String((childRow.querySelector("strong") || {}).textContent || "");
    const entry = tntFindEntryByName(name);
    if (entry) {
      tntRunWithProgress(childRow, name, () => executeFxConsoleEntry(entry))
        .then(ran => { if (ran) statusEl.textContent = `${name} \u00b7 ${tntFormatRunTime(tntRunElapsed)}`; })
        .catch(err => { statusEl.textContent = `Function failed: ${String(err && err.message || err)}`; });
    }
    return true;
  }
  const card = event.target.closest && event.target.closest("[data-assistant-function-index]");
  if (!card) return false;
  // The shortcut and icon cells are editable controls sitting inside the row.
  // This handler runs at capture phase and stops immediate propagation, so
  // without bailing here a click on either would run the command instead.
  if (event.target.closest && event.target.closest("[data-shortcut-for], [data-icon-for]")) return false;
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
  loadAssistantSavedFunctions();
  renderAssistantFunctions();
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
  });
}
if (layerSelectionSearchClearEl) {
  layerSelectionSearchClearEl.addEventListener("click", () => {
    layerSelectionQuery = "";
    if (layerSelectionSearchEl) {
      layerSelectionSearchEl.value = "";
      layerSelectionSearchEl.focus();
    }
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
  });
}
if (activeFilterNoticeEl) {
  activeFilterNoticeEl.addEventListener("click", () => {
    clearLayerViewFilter();
    focusPanel(2);
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
scrollAreaEl.addEventListener("scroll", syncBottomRulerPosition);
if (horizontalScrollBarEl) horizontalScrollBarEl.addEventListener("mousedown", beginHorizontalScrollDrag);
window.addEventListener("resize", () => { if (!userZoomed) render(); updateHorizontalScrollBar(); });
if (keyframeModeBtnEl) keyframeModeBtnEl.addEventListener("click", toggleTimelineMode);
registerPanelKeyEventsInterest();
if (!QUICK_PANEL_MODE && !ENGINE_MODE) {
  cs.addEventListener("com.tnt.timeline.nativeSelection", handleNativeSelectionSync);
}
renderPlatformBadge();
setupFilterTooltips();
updateModeButton();

if (QUICK_PANEL_MODE) {
  document.title = "AE FX Quick Controls";
  document.documentElement.classList.add("quick-panel-mode");
  document.body.classList.add("quick-panel-mode");
  // Windows-only marker, set by native-helper-win. WebKit on macOS can sample the
  // desktop behind a transparent window, so backdrop-filter genuinely blurs there.
  // Chromium samples page content only, so the same rule renders as a black slab
  // over the After Effects timeline. The .native-win rules in 95-quick-panel.css
  // swap it for an opaque shell plus real DWM blur behind the window.
  if (window.__TNT_NATIVE_PLATFORM__ === "win") {
    document.documentElement.classList.add("native-win");
    document.body.classList.add("native-win");
    // Anything that changes what the page paints changes where clicks may land,
    // so recompute the hit shapes off the DOM itself rather than off resizes.
    // Debounced, and a no-op on every other platform.
    const watcher = new MutationObserver(() => scheduleNativeQuickPanelHitShapes());
    watcher.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"]
    });
    window.addEventListener("transitionend", () => scheduleNativeQuickPanelHitShapes(), true);
  }
  refreshQuickPanelState();
} else if (ENGINE_MODE) {
  // Hidden: no timeline to draw, so no sync loop, selection monitor or edit
  // watch. Bridge requests refresh what they need when they run.
  startAeFxEngine();
} else {
  // Initial read, then a lightweight focused/hovered fingerprint watch.
  // Full timeline refresh still only happens when the host fingerprint changes.
  refreshLayers({ forceRender: true, skipSettledRefresh: true }).then(() => {
    startSyncLoop();
    startNativeSelectionMonitor();
    // The 250ms edit watch is a fallback, not the normal path. Every tick is a
    // CEP evalScript into After Effects, and AE flashes its busy cursor for each
    // one - four times a second, forever, whether or not anything changed. When
    // the native selection monitor is live it pushes comp, layer-count, and
    // selection changes from the host instead, so the poll buys nothing. Only
    // start it if that monitor never reports in.
    setTimeout(() => {
      if (!nativeSelectionMonitorActive) startBackgroundEditWatch();
    }, 3000);
  });
}
