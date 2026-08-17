async function refreshLayers(options = {}) {
  if (QUICK_PANEL_MODE) {
    await refreshQuickPanelState();
    return;
  }
  if (panelSyncPaused && !options.forceRender) return;
  const preservedKeyframes = Array.isArray(options.preserveKeyframeSelection)
    ? normalizeSelectedKeyframes(options.preserveKeyframeSelection)
    : null;
  await loadJSX();
  const result = await aeCall("TNT_getTimelineData", [!!options.preferNative]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not read active comp.";
    state = { comp: null, layers: [], selectedLayerIndices: [], compMarkers: [] };
    selectedKeyframes = [];
    activeLayerFilter = null;
    activeLayerFilterScopeIndices = null;
    lastSignature = "";
    if (!isLayerMenuOpen() || options.forceRender) render();
    return;
  }
  const previousCompId = state.comp && Number(state.comp.id || 0);
  const nextCompId = result.comp && Number(result.comp.id || 0);
  if (activeLayerFilterScopeIndices && previousCompId && nextCompId !== previousCompId) {
    activeLayerFilter = null;
    activeLayerFilterScopeIndices = null;
  }
  state = result;
  selectedKeyframes = preservedKeyframes || normalizeSelectedKeyframes(result.selectedKeyframes || []);
  lastSignature = timelineSignature(result);
  lastLayerFingerprint = result.comp && result.comp.layerFingerprint ? result.comp.layerFingerprint : "";
  updateStatus();
  if ((isLayerMenuOpen() || isMarkerDragging) && !options.forceRender) {
    pendingMenuRefresh = true;
    renderSelectionOnly();
    updatePlayhead();
    return;
  }
  pendingMenuRefresh = false;
  render();
  if (options.forceRender && !options.skipSettledRefresh) {
    scheduleSettledActionRefresh({
      includeSelectedKeyframes: !!options.includeSelectedKeyframes
    });
  }
}

function applyTimelineStructureResult(result, options = {}) {
  if (!result || !result.ok) return false;
  const previousLayers = state.layers || [];
  const previousById = {};
  previousLayers.forEach(layer => {
    if (layer && layer.layerId) previousById[String(layer.layerId)] = layer;
  });
  const layers = (result.layers || []).map(layer => {
    const previous = layer.layerId ? previousById[String(layer.layerId)] : null;
    if (!previous) return layer;
    return Object.assign({}, previous, layer, {
      hasKeyframes: !!previous.hasKeyframes,
      keyframes: previous.keyframes || [],
      animatedProperties: previous.animatedProperties || [],
      transformProperties: previous.transformProperties || [],
      markers: previous.markers || []
    });
  });
  state = Object.assign({}, state, {
    comp: Object.assign({}, state.comp || {}, result.comp || {}),
    layers,
    selectedLayerIndices: result.selectedLayerIndices || []
  });
  updateStatus();
  render();
  if (!options.skipSettledRefresh) {
    scheduleSettledActionRefresh({
      includeSelectedKeyframes: !!options.includeSelectedKeyframes,
      delay: options.delay || PANEL_ACTION_REFRESH_DELAY_MS
    });
  }
  return true;
}

async function refreshLayerStructureAfterAction(options = {}) {
  if (timelineMode === "keyframe") {
    await refreshLayers({
      forceRender: true,
      skipSettledRefresh: true,
      includeSelectedKeyframes: !!options.includeSelectedKeyframes
    });
    return;
  }
  await loadJSX();
  const result = await aeCall("TNT_getTimelineStructureData");
  const applyOptions = Object.assign({}, options, { skipSettledRefresh: true });
  if (!applyTimelineStructureResult(result, applyOptions)) {
    await refreshLayers({ forceRender: true, skipSettledRefresh: true });
  }
}

async function syncTick(options = {}) {
  // Foreground sync follows playhead/selection. Background sync only watches edits.
  if (panelSyncPaused) return;
  if (isPlaying) return;
  if (syncInFlight) return;
  if (isScrubbing || isMarqueeSelecting || isMarkerDragging || isKeyframeDragging) return;
  if (!options.nativeSelection && Date.now() < suppressSyncUntil) return;
  if (isLayerMenuOpen()) return;
  // Background structure sync should not depend on mouse hover/focus; otherwise
  // native AE edits drift until the pointer returns to the CEP panel.
  if (options.background && document.hidden) return;
  // Keyframe mode can require expensive property traversal; avoid the idle CEP
  // eval loop that causes AE to flash the loading cursor while the user works.
  if (options.background && timelineMode === "keyframe") return;

  syncInFlight = true;
  try {
    await loadJSX();

    const includeSelectedKeyframes = timelineMode === "keyframe" &&
      !options.activation &&
      (!!options.selection || (!options.background && panelFocused));
    const sync = options.activation
      ? await aeCall("TNT_getActivationState")
      : await aeCall("TNT_getSyncState", [includeSelectedKeyframes, true]);
    if (!sync.ok) return;

    const layerFingerprint = sync.layerFingerprint || "";
    const layerEditDetected = layerFingerprint && layerFingerprint !== lastLayerFingerprint;
    const projectRevisionChanged =
      state.comp &&
      Number(sync.projectRevision || 0) !== Number(state.comp.projectRevision || 0);

    const needsFullRefresh = !state.comp ||
      (sync.compId && state.comp.id && Number(sync.compId) !== Number(state.comp.id)) ||
      sync.compName !== state.comp.name ||
      sync.numLayers !== state.layers.length ||
      Math.abs(sync.duration - state.comp.duration) > 1e-5 ||
      projectRevisionChanged ||
      layerEditDetected;

    if (needsFullRefresh) {
      await refreshLayers({
        preferNative: !!options.activation,
        skipSettledRefresh: true
      });
      return;
    }

    state.selectedLayerIndices = sync.selectedLayerIndices || [];
    if (!state.selectedLayerIndices.includes(Number(lastSelectedLayerIndex))) {
      lastSelectedLayerIndex = state.selectedLayerIndices.length
        ? Number(state.selectedLayerIndices[state.selectedLayerIndices.length - 1])
        : 0;
    }
    if (includeSelectedKeyframes) selectedKeyframes = normalizeSelectedKeyframes(sync.selectedKeyframes || []);
    updateStatus();
    renderSelectionOnly();

    if (options.background || !panelFocused) {
      return;
    }

    state.comp.time = sync.time;
    updatePlayhead();

  } finally {
    syncInFlight = false;
  }
}

function renderSelectionOnly(options = {}) {
  document.querySelectorAll(".clip").forEach(clip => {
    const idx = Number(clip.dataset.layerIndex);
    const selected = state.selectedLayerIndices.includes(idx);
    clip.classList.toggle("selected", selected);
    clip.classList.toggle("last-selected", selected && idx === Number(lastSelectedLayerIndex));
  });
  document.querySelectorAll(".keyframe-layer-row").forEach(row => {
    const idx = Number(row.dataset.layerIndex || 0);
    const selected = state.selectedLayerIndices.includes(idx);
    row.classList.toggle("selected", selected);
    row.classList.toggle("last-selected", selected && idx === Number(lastSelectedLayerIndex));
  });
  renderLayerSelectionPanel();
  if (!options.skipKeyframes) renderKeyframeSelectionOnly();
}

async function selectLayer(index, additive = false) {
  suppressSyncUntil = Date.now() + 700;
  index = Number(index || 0);
  const currentSelection = state.selectedLayerIndices || [];
  const preserveExistingGroup = !additive &&
    currentSelection.length > 1 &&
    currentSelection.includes(index);
  const effectiveAdditive = additive || preserveExistingGroup;
  lastSelectedLayerIndex = index;
  if (effectiveAdditive) {
    if (!currentSelection.includes(index)) {
      state.selectedLayerIndices = [...currentSelection, index];
    }
  } else {
    state.selectedLayerIndices = [index];
  }
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectLayerByIndex", [index, effectiveAdditive]);
  if (result.ok) {
    state.selectedLayerIndices = result.selectedLayerIndices || [index];
    renderSelectionOnly();
  } else {
    statusEl.textContent = result.error || "Could not select layer.";
  }
}


function firstSelectedLayer() {
  const selected = state.selectedLayerIndices || [];
  if (!selected.length) return null;
  return (state.layers || []).find(l => l.index === selected[0]) || null;
}

function selectedLayersForMenu(fallbackLayer) {
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  const layers = selected.map(index => (state.layers || []).find(layer => layer.index === index)).filter(Boolean);
  if (!layers.length && fallbackLayer) return [fallbackLayer];
  return layers;
}

function selectedLayerForContextMenu(fallbackLayer) {
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  if (!selected.length) return fallbackLayer || null;

  const fallbackIndex = Number(fallbackLayer && fallbackLayer.index);
  if (fallbackLayer && selected.includes(fallbackIndex)) return fallbackLayer;

  const lastSelected = (state.layers || []).find(layer =>
    selected.includes(Number(layer.index)) &&
    Number(layer.index) === Number(lastSelectedLayerIndex)
  );
  if (lastSelected) return lastSelected;

  return (state.layers || []).find(layer => selected.includes(Number(layer.index))) || fallbackLayer || null;
}

function showSelectedLayerMenu(event, fallbackLayer) {
  const layer = selectedLayerForContextMenu(fallbackLayer);
  if (!layer) return false;
  event.preventDefault();
  event.stopPropagation();
  showLayerMenu(event, layer);
  return true;
}

function hideLayerMenu() {
  if (!layerMenuEl) return;
  const hadPendingRefresh = pendingMenuRefresh;
  layerMenuPinned = false;
  pendingMenuRefresh = false;
  layerMenuEl.classList.remove("open");
  layerMenuEl.setAttribute("aria-hidden", "true");
  layerMenuEl.innerHTML = "";
  if (hadPendingRefresh) {
    requestAnimationFrame(() => render());
  }
}

function buildLayerMenuLabelSwatches(currentLabel) {
  const swatches = [];
  for (let i = 0; i <= 16; i++) {
    const color = i === 0 ? "#ffffff" : labelColor(i);
    const active = Number(currentLabel) === i ? " active" : "";
    const name = AE_LABEL_NAMES[i] || `Label ${i}`;
    swatches.push(`<button type="button" class="label-swatch${active}" data-action="label" data-label="${i}" title="${escapeHtml(name)}" style="--swatch:${color}"></button>`);
  }
  return swatches.join("");
}

function buildKeyframeMenuLabelSwatches() {
  return buildLayerMenuLabelSwatches(0);
}

function numericValueFromKeyframeInput(input) {
  const first = String(input && input.value || "").split(",")[0];
  const value = Number(first);
  return Number.isFinite(value) ? value : 0;
}

function beginKeyframeValueDrag(event, input) {
  if (!input || input.disabled || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startValue = numericValueFromKeyframeInput(input);
  const precision = event.shiftKey ? 0.1 : 1;
  const onMove = moveEvent => {
    moveEvent.preventDefault();
    const next = startValue + Math.round((moveEvent.clientX - startX) * precision * 10) / 10;
    input.value = String(next);
  };
  const onUp = async () => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    await applyKeyframeValueInput(input);
  };
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

async function applyKeyframeValueInput(input) {
  if (!input || input.disabled || !selectedKeyframes.length) return;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedKeyframeValue", [selectedKeyframes, input.value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not set keyframe value.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

function menuShortcutLabel(shortcut) {
  return `<em class="menu-shortcut">${escapeHtml(shortcut || "")}</em>`;
}

function menuShortcutKeys(keys) {
  return ` data-menu-keys="${escapeHtml(keys || "")}"`;
}

function undoShortcutLabel() {
  return "Ctrl+Z";
}

const LAYER_CONTEXT_KINDS = {
  comp: { label: "Comps", singleLabel: "Comp", color: "#5da8ff" },
  shape: { label: "Shapes", singleLabel: "Shape", color: "#42d680" },
  text: { label: "Text", singleLabel: "Text", color: "#f5c84b" },
  media: { label: "Media", singleLabel: "Media", color: "#d885ff" },
  missing: { label: "Missing Media", singleLabel: "Missing Media", color: "#ff5d5d" },
  null: { label: "Nulls", singleLabel: "Null", color: "#a7adb8" },
  adjustment: { label: "Adjustments", singleLabel: "Adjustment", color: "#7fdbd3" },
  camera: { label: "Cameras", singleLabel: "Camera", color: "#ff9f43" },
  light: { label: "Lights", singleLabel: "Light", color: "#ffe66d" },
  layer: { label: "Layers", singleLabel: "Layer", color: "#8f98a8" }
};

function layerContextKind(layer) {
  const type = String(layer && layer.type || "").toLowerCase();
  if (layer && layer.isMissingMedia) return "missing";
  if (layer && layer.sourceCompId) return "comp";
  if (type === "shape") return "shape";
  if (type === "text") return "text";
  if (type === "null") return "null";
  if (type === "adjustment") return "adjustment";
  if (type === "camera") return "camera";
  if (type === "light") return "light";
  if (layer && layer.isMedia) return "media";
  return "layer";
}

function buildLayerMenuContext(layers) {
  const counts = {};
  (layers || []).forEach(layer => {
    const kind = layerContextKind(layer);
    counts[kind] = (counts[kind] || 0) + 1;
  });
  const kinds = Object.keys(counts);
  const count = (layers || []).length;
  const mixed = kinds.length > 1;
  const title = mixed
    ? "General Menu"
    : `${count > 1 ? "Many" : "Single"} ${(LAYER_CONTEXT_KINDS[kinds[0]] || LAYER_CONTEXT_KINDS.layer)[count > 1 ? "label" : "singleLabel"]}`;
  const details = kinds.map(kind => `${counts[kind]} ${(LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer)[counts[kind] > 1 ? "label" : "singleLabel"]}`);
  return { layers, count, counts, kinds, mixed, title, subtitle: details.join(" / ") };
}

function buildLayerMenuContextHeader(context) {
  const kinds = context.kinds.length ? context.kinds : ["layer"];
  const total = Math.max(1, context.count || 1);
  const strip = kinds.map(kind => {
    const meta = LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer;
    const width = Math.max(8, Math.round(((context.counts[kind] || 1) / total) * 100));
    return `<span style="--context-color:${meta.color};--context-width:${width}%"></span>`;
  }).join("");
  const chips = kinds.map(kind => {
    const meta = LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer;
    const filter = kind === "layer" ? "" : kind;
    const label = `${context.counts[kind] || 0} ${meta.label}`;
    return `<button type="button" data-action="contextFilter" data-context-filter="${escapeHtml(filter)}" style="--context-color:${meta.color}" title="Focus selection and keep ${escapeHtml(meta.label)}">${escapeHtml(label)}</button>`;
  }).join("");
  return `
    <div class="layer-menu-context-strip">${strip}</div>
    <div class="layer-menu-context">
      <div>
        <strong>${escapeHtml(context.title)}</strong>
        <em>${escapeHtml(context.subtitle || "Selection")}</em>
      </div>
      <div class="layer-menu-context-chips">${chips}</div>
    </div>
  `;
}

function layerMenuRow(action, label, detail, keys) {
  return `<button type="button" class="menu-row" data-action="${escapeHtml(action)}"${keys ? menuShortcutKeys(keys) : ""}><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "")}</em></button>`;
}

function layerMenuTntRow(functionName, label, detail, args = [], keys = "") {
  const encodedArgs = encodeURIComponent(JSON.stringify(args || []));
  return `<button type="button" class="menu-row" data-action="tntCommand" data-tnt-function="${escapeHtml(functionName)}" data-tnt-args="${escapeHtml(encodedArgs)}"${keys ? menuShortcutKeys(keys) : ""}><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "Panel")}</em></button>`;
}

function layerMenuAddLayerRow(type, label, detail) {
  return `<button type="button" class="menu-row" data-action="addLayer" data-layer-type="${escapeHtml(type)}"><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "")}</em></button>`;
}

function buildLayerMenuContextRows(context, layer) {
  const has = kind => !!context.counts[kind];
  const rows = [];
  const selectedCount = Number(context.count || 0);
  const targetLayer = (state.layers || []).find(item => Number(item.index) === Number(lastSelectedTargetIndex()));
  const targetDetail = targetLayer
    ? `Target: ${targetLayer.index} ${targetLayer.name || "Layer"}`
    : "Last selected layer is target";
  if (has("comp")) {
    rows.push(`<div class="layer-menu-section-title">Comp Actions</div>`);
    if (layer && layer.sourceCompId) rows.push(layerMenuRow("openSourceComp", "Open Source Comp", layer.sourceCompName || "Precomp"));
    if (layer && layer.sourceCompId) rows.push(layerMenuRow("renameSourceComp", "Rename Source Comp...", layer.sourceCompName || "Project comp"));
  }
  if (has("text")) {
    rows.push(`<div class="layer-menu-section-title">Text Actions</div>`);
    rows.push(layerMenuRow("setTextContent", "Set Text Content...", "Selected text"));
    rows.push(layerMenuRow("findReplaceText", "Find / Replace Text...", "Selected text"));
    rows.push(layerMenuTntRow("applyTextAnimMaster", "Text Anim In+Out Up", "Text", ["up", 3, true, true, false, 0.35, 0.35, "both"]));
    rows.push(layerMenuTntRow("applyTextAnimBounce", "Text Bounce In Up", "Text", ["up", 3, true, true, false, 0.35, 0.35, "in"]));
  }
  if (has("shape")) {
    rows.push(`<div class="layer-menu-section-title">Shape Actions</div>`);
    rows.push(layerMenuTntRow("trimPathsInOut", "Trim Paths In+Out", "Shape", [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }]));
    rows.push(layerMenuTntRow("addDashesToStroke", "Add Dashes to Stroke", "Shape"));
    rows.push(layerMenuTntRow("swapFillStroke", "Swap Fill / Stroke", "Shape"));
    rows.push(layerMenuTntRow("shapeToMask", "Shape to Mask", "Shape"));
  }
  if (has("media") || has("missing") || has("comp")) {
    rows.push(`<div class="layer-menu-section-title">Source Actions</div>`);
    rows.push(layerMenuTntRow("toggleEffects", "Toggle Effects", "Selected layers"));
    rows.push(layerMenuTntRow("copyEffects", "Copy Effects", "Selected layers"));
  }
  if (selectedCount > 1) {
    rows.push(`<div class="layer-menu-section-title">Relationship Actions</div>`);
    rows.push(layerMenuRow("matteToLastSelected", "Matte to Last Selected", targetDetail));
    rows.push(layerMenuRow("parentToLastSelected", "Parent to Last Selected", targetDetail));
    rows.push(layerMenuTntRow("parentToNull", "Parent to Null", "Selected layers"));
  }
  rows.push(`<div class="layer-menu-section-title">Selection Actions</div>`);
  rows.push(layerMenuTntRow("precomposeSelected", "Precompose Selected", `${context.count} layer${context.count === 1 ? "" : "s"}`));
  rows.push(layerMenuRow("parentToTarget", "Parent to Target...", "Type layer number or name"));
  rows.push(layerMenuTntRow("soloSelected", "Solo Selected", "Selected layers"));
  rows.push(layerMenuTntRow("focusSelected", "Focus Selected", "Selected layers"));
  return rows.join("");
}

function handleLayerMenuShortcut(event) {
  if (event.__tntShortcutHandled || !isLayerMenuOpen()) return false;
  const shortcutKey = shortcutKeyForEvent(event);
  if (!shortcutKey) return false;
  const suppressedUntil = suppressPanelShortcutKeys[shortcutKey] || 0;
  if (Date.now() <= suppressedUntil && event.type !== "keydown") {
    consumeShortcutEvent(event, shortcutKey);
    return true;
  }
  const tag = (event.target && event.target.tagName || "").toLowerCase();
  const isEditable = tag === "input" || tag === "textarea" || tag === "select" || (event.target && event.target.isContentEditable);
  if (isEditable && shortcutKey !== "escape") return false;
  if (shortcutKey === "escape") {
    event.__tntShortcutHandled = true;
    consumeShortcutEvent(event, shortcutKey);
    hideLayerMenu();
    focusPanel(2);
    return true;
  }
  const buttons = Array.prototype.slice.call(layerMenuEl.querySelectorAll("button[data-menu-keys]"));
  const button = buttons.find(btn => {
    const keys = String(btn.dataset.menuKeys || "").split(",").map(key => key.trim()).filter(Boolean);
    return keys.indexOf(shortcutKey) >= 0;
  });
  if (!button || button.disabled) return false;
  event.__tntShortcutHandled = true;
  consumeShortcutEvent(event, shortcutKey);
  button.click();
  return true;
}

function positionLayerMenuAtEvent(event, options = {}) {
  if (!layerMenuEl || !event) return;
  const pad = Number(options.pad || 8);
  const preferredWidth = Math.max(300, Number(options.width || 360));
  const viewportWidth = Math.max(preferredWidth + pad * 2, window.innerWidth || preferredWidth + pad * 2);
  const viewportHeight = Math.max(180, window.innerHeight || 180);
  const rawX = Math.max(pad, Number(event.clientX || pad));
  const rawY = Math.max(pad, Number(event.clientY || pad));
  const x = Math.max(pad, Math.min(rawX, viewportWidth - preferredWidth - pad));
  const y = Math.max(pad, Math.min(rawY, viewportHeight - 180 - pad));
  const maxHeight = Math.max(180, Math.floor(viewportHeight - y - pad));
  const maxWidth = Math.min(420, Math.max(preferredWidth, Math.floor(viewportWidth - x - pad)));
  layerMenuEl.style.setProperty("--menu-left", `${Math.round(x)}px`);
  layerMenuEl.style.setProperty("--menu-top", `${Math.round(y)}px`);
  layerMenuEl.style.setProperty("--menu-width", `${Math.round(preferredWidth)}px`);
  layerMenuEl.style.setProperty("--menu-max-height", `${maxHeight}px`);
  layerMenuEl.style.setProperty("--menu-max-width", `${maxWidth}px`);
  layerMenuEl.style.left = `${Math.round(x)}px`;
  layerMenuEl.style.top = `${Math.round(y)}px`;
  layerMenuEl.style.width = `${Math.round(preferredWidth)}px`;
  layerMenuEl.style.maxHeight = `${maxHeight}px`;
  layerMenuEl.style.maxWidth = `${maxWidth}px`;
  layerMenuEl.classList.add("open");
  layerMenuEl.setAttribute("aria-hidden", "false");
}

function showKeyframeMenu(event) {
  if (!layerMenuEl || !selectedKeyframes.length) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;
  const count = selectedKeyframes.length;
  const scope = formatKeyframeSelectionScope(selectedKeyframes);
  const propertyNames = [];
  const seenPropertyNames = {};
  selectedKeyframes.forEach(key => {
    const layer = (state.layers || []).find(item => Number(item.index) === Number(key.layerIndex));
    const property = layer && (layer.animatedProperties || []).find(item => String(item.path || "") === String(key.propertyPath || ""));
    const label = property ? propertyLaneLabel(property) : "Property";
    if (!seenPropertyNames[label]) {
      seenPropertyNames[label] = true;
      propertyNames.push(label);
    }
  });
  layerMenuEl.innerHTML = `
    <div class="layer-menu-keyframe-context">
      <div class="layer-menu-keyframe-title"><b>K</b><strong>Keyframes</strong><span>${escapeHtml(scope)}</span></div>
      <div class="layer-menu-keyframe-properties">${propertyNames.map(name => `<span>${escapeHtml(name)}</span>`).join("")}</div>
    </div>
    <div class="layer-menu-section label-section">
      <div class="layer-menu-kicker">KEYFRAME LABEL COLOR</div>
      <div class="layer-menu-swatches">${buildKeyframeMenuLabelSwatches()}</div>
    </div>
    <div class="layer-menu-section keyframe-value-section">
      <div class="layer-menu-kicker keyframe-value-scrub" title="Drag horizontally to adjust numeric values">VALUE</div>
      <input id="keyframeValueInput" class="keyframe-value-input" type="text" value="Loading..." disabled spellcheck="false">
    </div>
    <button type="button" class="menu-row" data-action="undoAction"${menuShortcutKeys("ctrl+z")}><span>Undo</span>${menuShortcutLabel(undoShortcutLabel())}</button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="easyEase"${menuShortcutKeys("e")}><span>Ease Editor</span>${menuShortcutLabel("E")}</button>
    <button type="button" class="menu-row" data-action="applyEasyEase"${menuShortcutKeys("shift+e")}><span>Apply Easy Ease</span>${menuShortcutLabel("Shift+E")}</button>
    <button type="button" class="menu-row" data-action="placeholder-linear"><span>Linear Interpolation</span><em>Temporal</em></button>
    <button type="button" class="menu-row" data-action="placeholder-hold"><span>Hold Keyframe</span><em>Toggle hold</em></button>
    <button type="button" class="menu-row" data-action="placeholder-roving"><span>Rove Across Time</span><em>Spatial only</em></button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="placeholder-copy"><span>Copy Keyframes</span><em>${count} selected</em></button>
    <button type="button" class="menu-row" data-action="placeholder-paste"><span>Paste at Playhead</span><em>${formatTime(state.comp ? state.comp.time || 0 : 0)}</em></button>
    <button type="button" class="menu-row" data-action="deleteKeyframes"${menuShortcutKeys("4,numpad4,delete,backspace")}><span>Delete Keyframes</span>${menuShortcutLabel("4 / Delete")}</button>
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = e => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); };
  const valueInput = layerMenuEl.querySelector("#keyframeValueInput");
  const valueScrub = layerMenuEl.querySelector(".keyframe-value-scrub");
  if (valueInput && valueScrub) {
    loadJSX().then(() => aeCall("TNT_getKeyframeValueForEdit", [selectedKeyframes])).then(result => {
      if (!valueInput || !layerMenuEl.classList.contains("open")) return;
      if (result.ok && result.editable) {
        valueInput.disabled = false;
        valueInput.value = result.value || "0";
        valueScrub.textContent = result.propertyName ? `VALUE - ${result.propertyName}` : "VALUE";
      } else {
        valueInput.value = result.error || "Not editable";
      }
    });
    valueScrub.addEventListener("mousedown", e => beginKeyframeValueDrag(e, valueInput));
    valueInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); applyKeyframeValueInput(valueInput); }
      if (e.key === "Escape") { e.preventDefault(); hideLayerMenu(); }
    });
    valueInput.addEventListener("blur", () => applyKeyframeValueInput(valueInput));
  }
  layerMenuEl.onclick = async e => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "label") {
      const label = Number(btn.dataset.label || 0);
      const result = await aeCall("TNT_setSelectedKeyframeLabel", [selectedKeyframes, label]);
      if (!result.ok) statusEl.textContent = result.error || "Could not set keyframe label.";
      hideLayerMenu();
      await refreshLayers({ forceRender: true });
      return;
    }
    if (btn.dataset.action === "undoAction") {
      hideLayerMenu();
      await undoLastAeAction();
      return;
    }
    if (btn.dataset.action === "deleteKeyframes") {
      hideLayerMenu();
      await deleteSelectedKeyframes();
      return;
    }
    if (btn.dataset.action === "easyEase") {
      hideLayerMenu();
      showEaseDialog();
      return;
    }
    if (btn.dataset.action === "applyEasyEase") {
      hideLayerMenu();
      await applyEasyEaseDirect();
      return;
    }
    statusEl.textContent = `Placeholder keyframe action for ${count} selected keyframe${count === 1 ? "" : "s"}.`;
    hideLayerMenu();
  };
}

function showLayerMenu(event, layer) {
  if (!layerMenuEl || !layer) return;
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;
  const contextLayers = selectedLayersForMenu(layer);
  const context = buildLayerMenuContext(contextLayers);
  const selected = contextLayers.map(item => item.index);
  const labelName = AE_LABEL_NAMES[layer.label] || `Label ${layer.label || 0}`;
  layerMenuEl.innerHTML = `
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
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="placeholder-speed"><span>Speed/Duration...</span><em>Change playback speed</em></button>
    <button type="button" class="menu-row" data-action="placeholder-fit"><span>Fit to Frame</span><em>Fit to Comp</em></button>
    <button type="button" class="menu-row" data-action="placeholder-rename"><span>Rename...</span><em>Change clip name</em></button>
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "contextFilter") {
      const filter = String(btn.dataset.contextFilter || "") || null;
      hideLayerMenu();
      setLayerViewFilter(filter, selected);
      return;
    }
    if (action === "labelGroup") return;
    if (action === "undoAction") {
      hideLayerMenu();
      await undoLastAeAction();
      return;
    }
    if (action === "renameSourceComp") {
      hideLayerMenu();
      await promptRenameSourceComp(layer);
      return;
    }
    if (action === "openSourceComp") {
      hideLayerMenu();
      await openLayerSourceComp(layer);
      return;
    }
    if (action === "setTextContent") {
      hideLayerMenu();
      await promptSetTextContent();
      return;
    }
    if (action === "findReplaceText") {
      hideLayerMenu();
      await promptFindReplaceText();
      return;
    }
    if (action === "parentToLastSelected") {
      hideLayerMenu();
      await parentToLastSelectedLayer();
      return;
    }
    if (action === "matteToLastSelected") {
      hideLayerMenu();
      await matteToLastSelectedLayer();
      return;
    }
    if (action === "parentToTarget") {
      hideLayerMenu();
      await promptParentToTargetLayer();
      return;
    }
    if (action === "tntCommand") {
      hideLayerMenu();
      let args = [];
      try { args = JSON.parse(decodeURIComponent(btn.dataset.tntArgs || "%5B%5D")); } catch (_) {}
      await runTntV3Command({ name: btn.textContent || "Panel Command", tntFunction: btn.dataset.tntFunction, args });
      return;
    }
    if (action === "duplicateLayers") {
      hideLayerMenu();
      await duplicateSelectedLayers(selected);
      return;
    }
    if (action === "splitLayers") {
      hideLayerMenu();
      await splitSelectedLayersAtPlayhead();
      return;
    }
    if (action === "setInPoint") {
      hideLayerMenu();
      await setSelectedLayerEndpoint("in");
      return;
    }
    if (action === "setOutPoint") {
      hideLayerMenu();
      await setSelectedLayerEndpoint("out");
      return;
    }
    if (action === "deleteLayers") {
      hideLayerMenu();
      await deleteSelectedLayers();
      return;
    }
    if (action === "layerStyles") {
      hideLayerMenu();
      openLayerStylePanel();
      return;
    }
    if (action === "maskControl") {
      hideLayerMenu();
      openMaskControlPanel();
      return;
    }
    if (action === "effectsControl") {
      hideLayerMenu();
      openEffectsControlPanel();
      return;
    }
    if (action === "shapesControl") {
      hideLayerMenu();
      openShapesControlPanel();
      return;
    }
    if (action.indexOf("placeholder") === 0) {
      statusEl.textContent = `Placeholder menu action for ${selected.length} selected layer(s).`;
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
      hideLayerMenu();
      await refreshLayers({ forceRender: true });
      return;
    }
    hideLayerMenu();
    await loadJSX();
    const fn = action === "lock" ? "TNT_toggleSelectedLayerLock" : "TNT_toggleSelectedLayerVisibility";
    const result = await aeCall(fn, [selected, layer.index]);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update selected layers.";
      return;
    }
    await refreshLayers({ forceRender: true });
  };
}

function showAddLayerMenu(event) {
  if (!layerMenuEl || !state.comp) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 1200;
  const timeLabel = formatTime(state.comp.time || 0);
  layerMenuEl.innerHTML = `
    <div class="layer-menu-section-title">Add Layer at ${escapeHtml(timeLabel)}</div>
    ${layerMenuAddLayerRow("null", "Null", "Centered at playhead")}
    ${layerMenuAddLayerRow("shape", "Shape Layer", "Empty shape layer")}
    ${layerMenuAddLayerRow("text", "Text", "Point text")}
    ${layerMenuAddLayerRow("boxtext", "Box Text", "Paragraph text box")}
    ${layerMenuAddLayerRow("solid", "Solid", "Comp-sized solid")}
    ${layerMenuAddLayerRow("adjustment", "Adjustment Layer", "Comp-sized adjustment")}
    ${layerMenuAddLayerRow("camera", "Camera", "Default camera")}
    ${layerMenuAddLayerRow("light", "Light", "Default light")}
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action !== "addLayer") return;
    const type = String(btn.dataset.layerType || "");
    hideLayerMenu();
    await createLayerFromFxConsole(type);
  };
}

function showMarkerContextMenu(event, marker, options = {}) {
  if (!layerMenuEl || !marker) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;

  const markerType = options.type || "comp";
  const label = markerText(marker) || "Marker";
  const scope = markerType === "layer" ? "Layer marker" : "Comp marker";
  const durationValue = formatMarkerDurationForInput(Math.max(0, Number(marker.duration || 0)));
  const protectedChecked = marker.protectedRegion ? " checked" : "";
  layerMenuEl.innerHTML = `
    <div class="layer-menu-section label-section marker-editor-section">
      <div class="layer-menu-kicker">${escapeHtml(scope)} Label Color</div>
      <div class="layer-menu-swatches">${buildLayerMenuLabelSwatches(marker.label || 0)}</div>
    </div>
    <div class="layer-menu-section marker-editor-section">
      <label class="marker-editor-field">
        <span>Duration</span>
        <div class="marker-duration-row">
          <input id="markerDurationInput" type="text" value="${escapeHtml(durationValue)}" spellcheck="false">
          <button type="button" class="marker-duration-reset" data-action="marker-reset-duration" title="Reset duration"></button>
        </div>
      </label>
      <label class="marker-editor-field">
        <span>Comment/Text</span>
        <textarea id="markerCommentInput" spellcheck="false">${escapeHtml(marker.comment || "")}</textarea>
      </label>
      <label class="marker-editor-toggle">
        <input id="markerProtectedInput" type="checkbox"${protectedChecked}>
        <span>Protected region</span>
      </label>
    </div>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row marker-confirm-row" data-action="marker-confirm"><span>Confirm</span><em>${formatTime(marker.time || 0)}</em></button>
  `;

  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.querySelectorAll(".label-swatch").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      layerMenuEl.querySelectorAll(".label-swatch.active").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  layerMenuEl.onclick = async (e) => {
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (btn.dataset.action === "marker-reset-duration") {
      const input = layerMenuEl.querySelector("#markerDurationInput");
      if (input) input.value = "00:00:00";
      return;
    }
    if (btn.dataset.action !== "marker-confirm") return;
    const duration = parseDurationInput((layerMenuEl.querySelector("#markerDurationInput") || {}).value);
    if (duration === null || duration < 0) {
      statusEl.textContent = "Enter a valid marker duration.";
      return;
    }
    const comment = (layerMenuEl.querySelector("#markerCommentInput") || {}).value || "";
    const activeSwatch = layerMenuEl.querySelector(".label-swatch.active");
    const labelIndex = activeSwatch ? Number(activeSwatch.dataset.label || 0) : Number(marker.label || 0);
    const protectedRegion = !!(layerMenuEl.querySelector("#markerProtectedInput") || {}).checked;
    hideLayerMenu();
    await loadJSX();
    const fn = markerType === "layer" ? "TNT_updateLayerMarkerDetails" : "TNT_updateCompMarkerDetails";
    const args = markerType === "layer"
      ? [options.layerIndex || 0, marker.keyIndex, duration, comment, labelIndex, protectedRegion]
      : [marker.keyIndex, duration, comment, labelIndex, protectedRegion];
    const result = await aeCall(fn, args);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update marker.";
      return;
    }
    await refreshLayers({ forceRender: true });
  };
}

function bindMarkerContextMenu(el, marker, options = {}) {
  el.addEventListener("contextmenu", e => showMarkerContextMenu(e, marker, options));
}
