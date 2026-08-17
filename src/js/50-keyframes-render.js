function render() {
  if (timelineMode === "keyframe") {
    renderKeyframeMode();
    return;
  }
  renderEditMode();
}

function prepareTimelineForRender() {
  if (isMarkerDragging || isKeyframeDragging) return;
  timelineEl.innerHTML = "";
  timelineEl.style.setProperty("--track-fill-start", "0px");
  if (topMarkerRailEl) topMarkerRailEl.innerHTML = "";
  if (bottomMarkerRailEl) bottomMarkerRailEl.innerHTML = "";
  hideLayerMenu();
  return true;
}

function renderEditMode() {
  if (!prepareTimelineForRender()) return;
  document.body.classList.remove("keyframe-mode");
  if (!state.comp || !state.layers.length) {
    timelineEl.innerHTML = `<div class="empty">No comp/layers found. Select or open an active composition.</div>`;
    drawRuler();
    updateFilterButtons();
    updatePlayhead();
    updateHorizontalScrollBar();
    return;
  }

  fitTimelineToPanel();
  drawRuler();
  renderCompMarkers();
  timelineEl.style.width = `${timelineContentWidth()}px`;
  updateHorizontalScrollBar();

  const filteredLayers = visibleLayers();
  updateFilterButtons();
  if (!filteredLayers.length) {
    timelineEl.innerHTML = `<div class="empty">No layers match this filter.</div>`;
    renderProtectedRegionOverlays(1);
    updatePlayhead();
    return;
  }

  const lanes = packLayers(filteredLayers);
  const relationSets = relationshipLayerSets(filteredLayers);
  lanes.forEach((lane, laneIndex) => {
    const track = document.createElement("div");
    track.className = "track";
    const laneIndices = lane.map(layer => Number(layer.index || 0)).filter(Boolean);
    track.dataset.dropBeforeIndex = String(Math.min.apply(null, laneIndices));
    track.dataset.dropAfterIndex = String(Math.max.apply(null, laneIndices));

    const label = document.createElement("div");
    label.className = "track-label";
    label.textContent = `V${laneIndex + 1}`;
    track.appendChild(label);

    lane.forEach(layer => {
      if (layer.outPoint <= visibleStart || layer.inPoint >= visibleStart + visibleDuration) return;
      const clip = document.createElement("div");
      const selectedNow = state.selectedLayerIndices.includes(layer.index);
      const lastSelectedNow = selectedNow && Number(layer.index) === Number(lastSelectedLayerIndex);
      clip.className = "clip" + (selectedNow ? " selected" : "") + (lastSelectedNow ? " last-selected" : "") + (layer.isMissingMedia ? " missing-media" : "") + (!layer.enabled ? " disabled-layer" : "") + (layer.locked ? " locked-layer" : "");
      const clipStart = Math.max(layer.inPoint, visibleStart);
      const clipEnd = Math.min(layer.outPoint, visibleStart + visibleDuration);
      clip.style.left = `${timeToX(clipStart)}px`;
      clip.style.width = `${Math.max(12, (clipEnd - clipStart) * pixelsPerSecond)}px`;
      const isSelected = selectedNow;
      const labelColorValue = labelColor(layer.label);
      clip.style.backgroundColor = labelColorValue;
      clip.style.setProperty("--clip-base-color", labelColorValue);
      clip.style.setProperty("--index-bg", darkerHex(labelColorValue, 0.42));
      clip.dataset.layerIndex = layer.index;
      clip.dataset.clipStart = clipStart;
      clip.title = `${layer.name} | AE layer ${layer.index} | label ${layer.label}${layer.isMissingMedia ? " | Missing media" + (layer.missingMediaPath ? ": " + layer.missingMediaPath : "") : ""}`;
      clip.innerHTML = `<span class="clip-index">${layer.index}</span>${layer.isMissingMedia ? '<span class="missing-media-icon" title="Missing media">!</span>' : ""}<span class="clip-name">${escapeHtml(layer.name)}</span>`;
      renderClipRelationshipDots(clip, layer, relationSets);
      renderLayerKeyframes(clip, layer, clipStart, clipEnd);
      renderLayerMarkers(clip, layer, clipStart, clipEnd);
      clip.addEventListener("mousedown", event => {
        if (event.detail > 1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        hideLayerMenu();
        const startEvent = event;
        const startX = event.clientX;
        const startY = event.clientY;
        let dragged = false;
        const cleanup = () => {
          document.removeEventListener("mousemove", onMove, true);
          document.removeEventListener("mouseup", onUp, true);
        };
        const onMove = moveEvent => {
          if (dragged) return;
          if (Math.abs(moveEvent.clientX - startX) < 4 && Math.abs(moveEvent.clientY - startY) < 4) return;
          dragged = true;
          cleanup();
          beginMarqueeSelect(startEvent, moveEvent);
        };
        const onUp = () => {
          cleanup();
          if (dragged) return;
          const additiveClick = event.shiftKey || event.ctrlKey || event.metaKey;
          suppressSyncUntil = Date.now() + 700;
          selectLayer(layer.index, additiveClick);
        };
        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("mouseup", onUp, true);
      });
      clip.addEventListener("dblclick", event => {
        if (!layer.sourceCompId) return;
        event.preventDefault();
        event.stopPropagation();
        openLayerSourceComp(layer);
      });
      clip.addEventListener("contextmenu", event => {
        event.preventDefault();
        event.stopPropagation();
        if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event, layer)) return;
        const selectedIndices = state.selectedLayerIndices || [];
        const isLayerSelected = selectedIndices.includes(layer.index);
        if (!isLayerSelected) {
          // Right-click should feel normal: select the layer first, then open the menu.
          state.selectedLayerIndices = [layer.index];
          renderSelectionOnly();
          selectLayer(layer.index, false);
        }
        showLayerMenu(event, layer);
      });
      track.appendChild(clip);
    });

    timelineEl.appendChild(track);
  });

  timelineEl.style.setProperty("--track-fill-start", `${lanes.length * TRACK_HEIGHT}px`);
  renderLayerRelationships(filteredLayers);
  renderProtectedRegionOverlays(timelineEl.querySelectorAll(".track").length || lanes.length);
  updatePlayhead();
}

function updateModeButton() {
  if (!keyframeModeBtnEl) return;
  keyframeModeBtnEl.classList.toggle("active", timelineMode === "keyframe");
  keyframeModeBtnEl.dataset.mode = timelineMode;
  keyframeModeBtnEl.textContent = timelineMode === "keyframe" ? "Keyframes" : "Edit";
  keyframeModeBtnEl.title = timelineMode === "keyframe" ? "Current mode: Keyframes. Click to switch to Edit." : "Current mode: Edit. Click to switch to Keyframes.";
}

function setTimelineMode(mode) {
  timelineMode = mode === "keyframe" ? "keyframe" : "edit";
  if (timelineMode === "edit") keyframeLayerFilter = null;
  if (timelineMode === "keyframe") ensureKeyframeExpansionDefaults();
  updateModeButton();
  updateStatus();
  render();
}

function toggleTimelineMode() {
  if (timelineMode === "edit") keyframeLayerFilter = null;
  setTimelineMode(timelineMode === "keyframe" ? "edit" : "keyframe");
}

function toggleSelectedKeyframeExpansion() {
  const selectedIndices = state.selectedLayerIndices || [];
  let targets = [];
  if (timelineMode === "edit") {
    const selected = selectedIndices.filter(index =>
      (state.layers || []).some(layer => layer.index === index)
    );
    targets = selected.length
      ? selected
      : visibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
    targets = [...new Set(targets)];
    if (!targets.length) return;
    targets.forEach(index => { expandedKeyframeLayers[index] = true; });
    setTimelineMode("keyframe");
    return;
  } else {
    const selected = selectedIndices.filter(index =>
      (state.layers || []).some(layer => layer.index === index && (layer.animatedProperties || []).length)
    );
    targets = selected.length
      ? selected
      : keyframeVisibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
  }
  targets = [...new Set(targets)];
  if (!targets.length) return;

  const shouldExpand = targets.some(index => !expandedKeyframeLayers[index]);
  targets.forEach(index => { expandedKeyframeLayers[index] = shouldExpand; });
  updateStatus();
  render();
}

function animatedKeyframeLayerTargets() {
  const layers = timelineMode === "keyframe" ? keyframeVisibleLayers() : visibleLayers();
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const selectedAnimated = layers.filter(layer =>
    selected.has(Number(layer.index)) && (layer.animatedProperties || []).length
  );
  return selectedAnimated.length
    ? selectedAnimated
    : layers.filter(layer => (layer.animatedProperties || []).length);
}

function expandAnimatedKeyframeProperties() {
  if (!state.comp) return;
  const targets = animatedKeyframeLayerTargets();
  if (!targets.length) {
    statusEl.textContent = "No animated properties to reveal.";
    return;
  }
  targets.forEach(layer => { expandedKeyframeLayers[layer.index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function collapseAllKeyframeProperties() {
  expandedKeyframeLayers = {};
  expandedTransformLayers = {};
  if (timelineMode !== "keyframe") {
    statusEl.textContent = "Collapsed keyframe property lanes.";
    return;
  }
  updateStatus();
  render();
}

function toggleKeyframeFocusMode() {
  if (!state.comp) return;
  if (keyframeLayerFilter && keyframeLayerFilter.length) {
    keyframeLayerFilter = null;
    updateStatus();
    render();
    return;
  }
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  if (!selected.length) return;
  keyframeLayerFilter = [...new Set(selected.map(Number))];
  keyframeLayerFilter.forEach(index => { expandedKeyframeLayers[index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function revealAndFocusSelectedKeyframes() {
  if (!state.comp) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  const targets = selected.length
    ? selected
    : visibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
  const uniqueTargets = [...new Set(targets.map(Number))];
  if (!uniqueTargets.length) return;
  keyframeLayerFilter = selected.length ? uniqueTargets.slice() : null;
  uniqueTargets.forEach(index => { expandedKeyframeLayers[index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function revealSelectedTransformProperties() {
  if (!state.comp) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  const targets = selected.length ? selected : visibleLayers().map(layer => layer.index);
  const uniqueTargets = [...new Set(targets.map(Number))].filter(index => {
    const layer = (state.layers || []).find(item => Number(item.index) === index);
    return layer && (layer.transformProperties || []).length;
  });
  if (!uniqueTargets.length) return;
  const shouldShow = uniqueTargets.some(index => !expandedTransformLayers[index]);
  uniqueTargets.forEach(index => {
    expandedTransformLayers[index] = shouldShow;
    if (shouldShow) {
      expandedKeyframeLayers[index] = true;
    } else {
      const layer = (state.layers || []).find(item => Number(item.index) === index);
      if (!layer || !(layer.animatedProperties || []).length) expandedKeyframeLayers[index] = false;
    }
  });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function ensureKeyframeExpansionDefaults() {
  const allowed = keyframeVisibleLayers();
  const hasAny = Object.keys(expandedKeyframeLayers || {}).some(key =>
    expandedKeyframeLayers[key] && allowed.some(layer => String(layer.index) === String(key))
  );
  if (hasAny) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    allowed.some(layer => layer.index === index)
  );
  const targets = selected.length
    ? selected
    : allowed.filter(layer => (layer.animatedProperties || []).length).slice(0, 8).map(layer => layer.index);
  targets.forEach(index => { expandedKeyframeLayers[index] = true; });
}

function keyframeVisibleLayers() {
  const layers = visibleLayers();
  if (!keyframeLayerFilter || !keyframeLayerFilter.length) return layers;
  const allowed = new Set(keyframeLayerFilter.map(Number));
  return layers.filter(layer => allowed.has(Number(layer.index)));
}

function buildKeyframeRows() {
  const rows = [];
  keyframeVisibleLayers().forEach(layer => {
    rows.push({ type: "layer", layer });
    if (expandedKeyframeLayers[layer.index]) {
      keyframeRowProperties(layer).forEach(property => rows.push({ type: "property", layer, property }));
    }
  });
  return rows;
}

function keyframeRowProperties(layer) {
  const animated = layer.animatedProperties || [];
  if (!expandedTransformLayers[layer.index]) return animated;
  const merged = [];
  const seen = {};
  (layer.transformProperties || []).forEach(property => {
    const path = String(property.path || "");
    const animatedVersion = animated.find(item => String(item.path || "") === path);
    const resolved = animatedVersion || property;
    merged.push(resolved);
    if (path) seen[path] = true;
  });
  animated.forEach(property => {
    const path = String(property.path || "");
    if (path && seen[path]) return;
    merged.push(property);
  });
  return merged;
}

function propertyGroupKey(property) {
  return String(property && (property.path || property.name || property.matchName || propertyLaneLabel(property)) || "");
}

function propertyGroupItemAtPointer(event, items) {
  const list = items && items.length ? items : [];
  if (list.length <= 1) return list[0] || null;
  const viewportRect = scrollAreaEl.getBoundingClientRect();
  const contentX = event.clientX - viewportRect.left + scrollAreaEl.scrollLeft;
  if (contentX < currentLeftGutter()) return list[0];
  const time = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  return list.find(item => time >= Number(item.layer.inPoint || 0) && time <= Number(item.layer.outPoint || 0))
    || list[0];
}

function propertyValueModifierDown(event) {
  return isMacPlatform()
    ? !!(event && (event.metaKey || event.commandKey))
    : !!(event && event.ctrlKey);
}

function ensurePropertyValueHover() {
  if (propertyValueHoverEl && propertyValueHoverEl.isConnected) return propertyValueHoverEl;
  propertyValueHoverEl = document.createElement("div");
  propertyValueHoverEl.className = "property-value-hover";
  propertyValueHoverEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(propertyValueHoverEl);
  return propertyValueHoverEl;
}

function hidePropertyValueHover() {
  propertyValueHoverTarget = null;
  propertyValueHoverRequest++;
  if (propertyValueHoverTimer) {
    clearTimeout(propertyValueHoverTimer);
    propertyValueHoverTimer = null;
  }
  if (propertyValueHoverEl) {
    propertyValueHoverEl.classList.remove("show");
    propertyValueHoverEl.setAttribute("aria-hidden", "true");
  }
}

function positionPropertyValueHover(event) {
  const popup = ensurePropertyValueHover();
  const gap = 12;
  const width = popup.offsetWidth || 150;
  const height = popup.offsetHeight || 34;
  let left = Number(event.clientX || 0) + gap;
  let top = Number(event.clientY || 0) + gap;
  if (left + width > window.innerWidth - 8) left = Number(event.clientX || 0) - width - gap;
  if (top + height > window.innerHeight - 8) top = Number(event.clientY || 0) - height - gap;
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top = `${Math.max(8, top)}px`;
}

function formatPropertyValueDisplay(result) {
  if (!result || !result.ok || !result.editable) return result && result.error ? result.error : "Value unavailable";
  const units = result.units ? ` ${result.units}` : "";
  return `${result.value || "0"}${units}`;
}

function requestPropertyValueHover(event, items) {
  if (!propertyValueModifierDown(event) || propertyValueEditorEl) {
    hidePropertyValueHover();
    return;
  }
  const target = propertyGroupItemAtPointer(event, items);
  if (!target) return;
  const time = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const frameDuration = Number(state.comp && state.comp.frameDuration || 1 / 30);
  const snappedTime = Math.round(time / frameDuration) * frameDuration;
  const targetKey = `${target.layer.index}|${target.property.path || ""}|${snappedTime.toFixed(6)}`;
  const popup = ensurePropertyValueHover();
  positionPropertyValueHover(event);
  popup.classList.add("show");
  popup.setAttribute("aria-hidden", "false");
  if (propertyValueHoverTarget === targetKey) return;
  propertyValueHoverTarget = targetKey;
  popup.innerHTML = `<strong>${escapeHtml(propertyLaneLabel(target.property))}</strong><span>Loading...</span>`;
  const requestId = ++propertyValueHoverRequest;
  if (propertyValueHoverTimer) clearTimeout(propertyValueHoverTimer);
  propertyValueHoverTimer = setTimeout(async () => {
    propertyValueHoverTimer = null;
    await loadJSX();
    const result = await aeCall("TNT_getPropertyValueAtTime", [
      target.layer.index,
      target.property.path || "",
      snappedTime
    ]);
    if (requestId !== propertyValueHoverRequest || propertyValueHoverTarget !== targetKey) return;
    popup.innerHTML = `
      <strong>${escapeHtml(result.propertyName || propertyLaneLabel(target.property))}</strong>
      <span>${escapeHtml(formatPropertyValueDisplay(result))}</span>
    `;
  }, 55);
}

function closePropertyValueEditor(options = {}) {
  if (!propertyValueEditorEl) return;
  propertyValueEditorEl.remove();
  propertyValueEditorEl = null;
  propertyValueEditorKeys = [];
  propertyValueEditorCommitQueued = false;
  propertyValueEditorLastCommitted = "";
}

function propertyValueEditorText() {
  if (!propertyValueEditorEl) return "";
  return Array.from(propertyValueEditorEl.querySelectorAll(".property-value-editor-number"))
    .map(input => input.value)
    .join(", ");
}

function updatePropertyValueRangeFill(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

async function commitPropertyValueEditor() {
  if (!propertyValueEditorEl || !propertyValueEditorKeys.length) return;
  const valueText = propertyValueEditorText();
  if (valueText === propertyValueEditorLastCommitted) return;
  if (propertyValueEditorCommitInFlight) {
    propertyValueEditorCommitQueued = true;
    return;
  }
  propertyValueEditorCommitInFlight = true;
  propertyValueEditorLastCommitted = valueText;
  const keys = propertyValueEditorKeys.slice();
  await loadJSX();
  const result = await aeCall("TNT_setSelectedKeyframeValue", [keys, valueText]);
  propertyValueEditorCommitInFlight = false;
  if (!result.ok) {
    propertyValueEditorLastCommitted = "";
    statusEl.textContent = result.error || "Could not set keyframe value.";
  }
  else {
    suppressSyncUntil = Date.now() + 500;
    scheduleSettledActionRefresh({ includeSelectedKeyframes: true });
  }
  if (propertyValueEditorCommitQueued) {
    propertyValueEditorCommitQueued = false;
    commitPropertyValueEditor();
  }
}

function sliderRangeForPropertyValue(value, result) {
  if (result && result.isColor) return { min: 0, max: 1, step: 0.001 };
  const magnitude = Math.max(1, Math.abs(Number(value) || 0));
  const span = Math.max(100, magnitude * 2);
  return {
    min: Number(value) - span,
    max: Number(value) + span,
    step: magnitude < 10 ? 0.01 : 0.1
  };
}

function positionPropertyValueEditor(anchor) {
  if (!propertyValueEditorEl || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const popupRect = propertyValueEditorEl.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - popupRect.width / 2;
  let top = rect.bottom + 9;
  left = Math.max(8, Math.min(window.innerWidth - popupRect.width - 8, left));
  if (top + popupRect.height > window.innerHeight - 8) top = rect.top - popupRect.height - 9;
  propertyValueEditorEl.style.left = `${left}px`;
  propertyValueEditorEl.style.top = `${Math.max(8, top)}px`;
}

async function openPropertyValueEditor(anchor, layer, property, keyframe) {
  hidePropertyValueHover();
  closePropertyValueEditor();
  const key = {
    layerIndex: layer.index,
    propertyPath: property.path || "",
    keyIndex: keyframe.keyIndex || 0
  };
  selectedKeyframes = normalizeSelectedKeyframes([key]);
  renderKeyframeSelectionOnly();
  loadJSX().then(() => aeCall("TNT_selectPropertyKeys", [selectedKeyframes]));
  propertyValueEditorKeys = [key];
  const popup = document.createElement("div");
  popup.className = "property-value-editor loading";
  popup.innerHTML = `<div class="property-value-editor-title">${escapeHtml(propertyLaneLabel(property))}</div><div class="property-value-editor-loading">Loading...</div>`;
  popup.addEventListener("mousedown", event => event.stopPropagation());
  popup.addEventListener("contextmenu", event => {
    event.preventDefault();
    event.stopPropagation();
  });
  document.body.appendChild(popup);
  propertyValueEditorEl = popup;
  positionPropertyValueEditor(anchor);
  await loadJSX();
  const result = await aeCall("TNT_getKeyframeValueForEdit", [[key]]);
  if (propertyValueEditorEl !== popup) return;
  if (!result.ok || !result.editable || !result.values || !result.values.length) {
    popup.innerHTML = `<div class="property-value-editor-title">${escapeHtml(propertyLaneLabel(property))}</div><div class="property-value-editor-error">${escapeHtml(result.error || "This value is not editable.")}</div>`;
    popup.classList.remove("loading");
    positionPropertyValueEditor(anchor);
    return;
  }
  propertyValueEditorLastCommitted = result.values.map(value => String(Number(value))).join(", ");
  const axes = result.values.length === 1 ? ["Value"] : ["X", "Y", "Z", "W"];
  popup.innerHTML = `
    <div class="property-value-editor-head">
      <strong>${escapeHtml(result.propertyName || propertyLaneLabel(property))}</strong>
      <span>${escapeHtml(formatTime(Number(keyframe.time || 0)))}</span>
    </div>
    <div class="property-value-editor-controls">
      ${result.values.map((value, index) => {
        const range = sliderRangeForPropertyValue(value, result);
        return `
          <label class="property-value-editor-row">
            <span>${axes[index] || index + 1}</span>
            <input class="property-value-editor-slider" type="range" min="${range.min}" max="${range.max}" step="${range.step}" value="${Number(value)}">
            <input class="property-value-editor-number" type="number" step="${range.step}" value="${Number(value)}">
          </label>
        `;
      }).join("")}
    </div>
  `;
  popup.classList.remove("loading");
  const sliders = Array.from(popup.querySelectorAll(".property-value-editor-slider"));
  const numbers = Array.from(popup.querySelectorAll(".property-value-editor-number"));
  sliders.forEach((slider, index) => {
    slider.addEventListener("input", () => {
      numbers[index].value = slider.value;
      updatePropertyValueRangeFill(slider);
    });
    slider.addEventListener("change", () => commitPropertyValueEditor());
    updatePropertyValueRangeFill(slider);
  });
  numbers.forEach((input, index) => {
    input.addEventListener("input", () => {
      const slider = sliders[index];
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      if (value < Number(slider.min)) slider.min = String(value);
      if (value > Number(slider.max)) slider.max = String(value);
      slider.value = String(value);
      updatePropertyValueRangeFill(slider);
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitPropertyValueEditor();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePropertyValueEditor();
      }
    });
    input.addEventListener("change", () => commitPropertyValueEditor());
  });
  positionPropertyValueEditor(anchor);
  const firstInput = numbers[0];
  if (firstInput) firstInput.focus({ preventScroll: true });
}

function renderPropertyTrack(layer, property, options = {}) {
  const track = document.createElement("div");
  const items = options.items && options.items.length ? options.items : [{ layer, property }];
  const hasKeys = items.some(item => !!(item.property.hasKeyframes || (item.property.keyframes || []).length));
  const hasExpression = items.some(item => !!item.property.hasExpression);
  track.className = "track keyframe-property-row" + (options.editMode ? " edit-property-row" : "") + (items.length > 1 ? " grouped-property-row" : "") + (hasExpression ? " has-expression" : "");
  track.dataset.layerIndex = layer.index;
  track.dataset.propertyPath = property.path || "";
  track.addEventListener("mousemove", event => requestPropertyValueHover(event, items));
  track.addEventListener("mouseleave", hidePropertyValueHover);

  const label = document.createElement("div");
  label.className = "track-label property-track-label";
  const stateClass = hasKeys && hasExpression ? " both" : (hasExpression ? " expression" : (hasKeys ? " keyed" : ""));
  label.innerHTML = `<span class="property-indent"></span><span class="property-row-icon"></span><span class="property-label-text">${escapeHtml(propertyLaneLabel(property))}</span>`;
  label.querySelector(".property-row-icon").className = "property-row-icon" + stateClass;
  label.title = propertyLaneLabel(property);
  const handlePropertyRowAction = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = propertyGroupItemAtPointer(event, items);
    if (!target) return;
    if (event.ctrlKey || event.metaKey) {
      addPropertyKeyAtPointer(event, target.layer, target.property);
      return;
    }
    if (event.altKey) {
      openExpressionDialog(target.layer, target.property);
      return;
    }
    selectLayerProperty(target.layer.index, target.property.path || "");
  };
  const handlePropertyRowMouseDown = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey || event.altKey) {
      handlePropertyRowAction(event);
      return;
    }
    if (timelineMode === "keyframe" && selectedKeyframes.length) {
      clearKeyframeSelectionLocally({ closeEase: true });
    }
    const startEvent = event;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragged = false;
    const cleanup = () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
    };
    const onMove = moveEvent => {
      if (dragged) return;
      if (Math.abs(moveEvent.clientX - startX) < 4 && Math.abs(moveEvent.clientY - startY) < 4) return;
      dragged = true;
      cleanup();
      beginMarqueeSelect(startEvent, moveEvent);
    };
    const onUp = upEvent => {
      cleanup();
      if (!dragged) handlePropertyRowAction(upEvent);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
  };
  label.addEventListener("mousedown", handlePropertyRowMouseDown);
  track.addEventListener("mousedown", event => {
    if (event.target.closest && event.target.closest(".property-keyframe-marker")) return;
    handlePropertyRowMouseDown(event);
  });

  const propName = document.createElement("div");
  propName.className = "property-lane-name";
  const nameTime = Math.max(Number(layer.inPoint || 0), visibleStart);
  propName.style.left = `${timeToX(nameTime)}px`;
  propName.textContent = propertyLaneLabel(property);
  propName.title = propertyLaneLabel(property);
  track.appendChild(propName);
  renderPropertyExpressionZones(track, items);
  items.forEach(item => renderPropertyKeyframes(track, item.layer, item.property));
  track.appendChild(label);
  return track;
}

function renderPropertyExpressionZones(track, items) {
  (items || []).forEach(item => {
    if (!item || !item.property || !item.property.hasExpression || !item.layer) return;
    const start = Math.max(visibleStart, Number(item.layer.inPoint || 0));
    const end = Math.min(visibleStart + visibleDuration, Number(item.layer.outPoint || 0));
    if (end <= start) return;
    const zone = document.createElement("div");
    zone.className = "property-expression-zone";
    zone.style.left = `${timeToX(start)}px`;
    zone.style.width = `${Math.max(2, (end - start) * pixelsPerSecond)}px`;
    zone.title = `${item.layer.name || "Layer"} | ${propertyLaneLabel(item.property)} expression`;
    track.appendChild(zone);
  });
}

async function addPropertyKeyAtPointer(event, layer, property) {
  const time = timeFromPointerEvent(event, { targetSnap: true, showGuide: false });
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_addPropertyKeyAtTime", [layer.index, property.path || "", time]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add keyframe.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

async function openExpressionDialog(layer, property) {
  if (!expressionModalEl) return;
  activeExpressionTarget = { layerIndex: layer.index, propertyPath: property.path || "" };
  expressionTitleEl.textContent = propertyLaneLabel(property);
  expressionSubtitleEl.textContent = layer.name || `Layer ${layer.index}`;
  expressionErrorEl.textContent = "";
  expressionInputEl.value = "";
  expressionModalEl.classList.add("show");
  expressionModalEl.setAttribute("aria-hidden", "false");
  await loadJSX();
  const result = await aeCall("TNT_getPropertyExpression", [layer.index, property.path || ""]);
  if (result.ok) expressionInputEl.value = result.expression || "";
  else expressionErrorEl.textContent = result.error || "Could not read expression.";
  setTimeout(() => { expressionInputEl.focus(); expressionInputEl.select(); }, 0);
}

function hideExpressionDialog() {
  if (!expressionModalEl) return;
  expressionModalEl.classList.remove("show");
  expressionModalEl.setAttribute("aria-hidden", "true");
  activeExpressionTarget = null;
}

async function applyExpressionDialog(disable = false) {
  if (!activeExpressionTarget) return;
  expressionErrorEl.textContent = "";
  await loadJSX();
  const result = await aeCall("TNT_setPropertyExpression", [
    activeExpressionTarget.layerIndex,
    activeExpressionTarget.propertyPath,
    disable ? "" : expressionInputEl.value,
    !disable
  ]);
  if (!result.ok) {
    expressionErrorEl.textContent = result.error || "Could not set expression.";
    return;
  }
  hideExpressionDialog();
  await refreshLayers({ forceRender: true });
}

function keyframeTypeClass(keyframe) {
  const type = String(keyframe && keyframe.type || "linear").toLowerCase();
  if (type === "hold") return "hold";
  if (type === "hold-ease-out") return "hold-ease-out";
  if (type === "hold-ease-in") return "hold-ease-in";
  if (type === "hold-linear-out") return "hold-linear-out";
  if (type === "hold-linear-in") return "hold-linear-in";
  if (type === "roving") return "roving";
  if (type === "auto-bezier") return "auto-bezier";
  if (type === "ease-in") return "ease-in";
  if (type === "ease-out") return "ease-out";
  if (type === "easy-ease") return "easy-ease";
  if (type === "mixed") return "mixed";
  return "linear";
}

function keyframeTypeLabel(keyframe) {
  const type = String(keyframe && keyframe.type || "linear").toLowerCase();
  if (type === "hold") return "Hold";
  if (type === "hold-ease-out") return "Hold Ease Out";
  if (type === "hold-ease-in") return "Hold Ease In";
  if (type === "hold-linear-out") return "Hold Linear Out";
  if (type === "hold-linear-in") return "Hold Linear In";
  if (type === "roving") return "Rove Across Time";
  if (type === "auto-bezier") return "Auto Bezier";
  if (type === "ease-in") return "Ease In";
  if (type === "ease-out") return "Ease Out";
  if (type === "easy-ease") return "Easy Ease";
  if (type === "mixed") return "Mixed";
  return "Linear";
}

function propertyLaneLabel(property) {
  const displayPath = String(property && property.displayPath || "");
  const name = String(property && property.name || "Property");
  if (/^transform\s*\/\s*/i.test(displayPath)) return name;
  return displayPath || name;
}

function keyframeSelectionId(layerIndex, propertyPath, keyIndex) {
  return [Number(layerIndex || 0), String(propertyPath || ""), Number(keyIndex || 0)].join("|");
}

function normalizeSelectedKeyframes(keys) {
  return (keys || []).map(key => ({
    layerIndex: Number(key.layerIndex || 0),
    propertyPath: String(key.propertyPath || ""),
    keyIndex: Number(key.keyIndex || 0)
  })).filter(key => key.layerIndex && key.propertyPath && key.keyIndex);
}

function formatKeyframeSelectionScope(keys, mixed = false) {
  const normalized = normalizeSelectedKeyframes(keys);
  const layers = {};
  const properties = {};
  normalized.forEach(key => {
    layers[key.layerIndex] = true;
    properties[`${key.layerIndex}|${key.propertyPath}`] = true;
  });
  const keyCount = normalized.length;
  const propertyCount = Object.keys(properties).length;
  const layerCount = Object.keys(layers).length;
  const parts = [`${keyCount} keyframe${keyCount === 1 ? "" : "s"}`];
  if (propertyCount >= 2) parts.push(`${propertyCount} props`);
  if (layerCount >= 2) parts.push(`${layerCount} layers`);
  if (mixed) parts.push("mixed");
  return parts.join(" / ");
}

function isKeyframeSelected(layerIndex, propertyPath, keyIndex) {
  const id = keyframeSelectionId(layerIndex, propertyPath, keyIndex);
  return selectedKeyframes.some(item => keyframeSelectionId(item.layerIndex, item.propertyPath, item.keyIndex) === id);
}

function findKeyframeInfo(key) {
  const layerIndex = Number(key.layerIndex || 0);
  const propertyPath = String(key.propertyPath || "");
  const keyIndex = Number(key.keyIndex || 0);
  const layer = (state.layers || []).find(item => Number(item.index) === layerIndex);
  if (!layer) return null;
  const property = (layer.animatedProperties || []).find(item => String(item.path || "") === propertyPath);
  if (!property) return null;
  const keyframe = (property.keyframes || []).find(item => Number(item.keyIndex || 0) === keyIndex);
  if (!keyframe) return null;
  return {
    layer,
    property,
    keyframe,
    layerIndex,
    propertyPath,
    keyIndex,
    originalTime: snapTimeToFrame(Number(keyframe.time || 0)),
    minTime: Math.max(0, Number(layer.inPoint || 0)),
    maxTime: Math.min(Number(state.comp && state.comp.duration || Infinity), Number(layer.outPoint || (state.comp && state.comp.duration) || Infinity))
  };
}

async function selectKeyframes(keys, additive = false) {
  const incoming = normalizeSelectedKeyframes(keys);

  const map = {};
  if (additive) {
    selectedKeyframes.forEach(key => { map[keyframeSelectionId(key.layerIndex, key.propertyPath, key.keyIndex)] = key; });
  }
  incoming.forEach(key => { map[keyframeSelectionId(key.layerIndex, key.propertyPath, key.keyIndex)] = key; });
  selectedKeyframes = Object.keys(map).map(id => map[id]);
  renderKeyframeSelectionOnly();

  await loadJSX();
  const result = await aeCall("TNT_selectPropertyKeys", [selectedKeyframes]);
  if (!result.ok) statusEl.textContent = result.error || "Could not select keyframes.";
}

function clearKeyframeSelectionLocally(options = {}) {
  selectedKeyframes = [];
  suppressSyncUntil = Date.now() + 700;
  renderKeyframeSelectionOnly();
  updateStatus();
  if (options.closeEase !== false && easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
  }
}

async function clearSelectedKeyframes(options = {}) {
  const hadSelection = selectedKeyframes.length > 0;
  clearKeyframeSelectionLocally(options);
  if (options.host === false || (!hadSelection && !options.forceHost)) return;
  await loadJSX();
  const result = await aeCall("TNT_selectPropertyKeys", [[]]);
  if (!result.ok) statusEl.textContent = result.error || "Could not clear keyframes.";
}

function renderKeyframeSelectionOnly() {
  document.querySelectorAll(".property-keyframe-marker").forEach(el => {
    el.classList.toggle("selected", isKeyframeSelected(el.dataset.layerIndex, el.dataset.propertyPath, el.dataset.keyIndex));
  });
}

function renderPropertyKeyframes(track, layer, property) {
  const showOutsideLayerBounds = timelineMode === "keyframe";
  (property.keyframes || []).forEach(keyframe => {
    const t = Number(keyframe.time || 0);
    if (t < visibleStart || t > visibleStart + visibleDuration) return;
    if (!showOutsideLayerBounds && (t < layer.inPoint || t > layer.outPoint)) return;
    const hit = document.createElement("div");
    hit.className = "property-keyframe-hit";
    hit.style.left = `${timeToX(t)}px`;
    hit.dataset.layerIndex = layer.index;
    hit.dataset.propertyPath = property.path || "";
    hit.dataset.keyIndex = keyframe.keyIndex || "";
    hit.dataset.time = t;

    const el = document.createElement("div");
    const typeClass = keyframeTypeClass(keyframe);
    el.className = `property-keyframe-marker keyframe-${typeClass}`;
    el.style.setProperty("--property-keyframe-color", keyframeLabelColor(keyframe.label));
    el.title = `${layer.name} | ${propertyLaneLabel(property)} | ${keyframeTypeLabel(keyframe)} keyframe @ ${formatTime(t)}`;
    el.dataset.layerIndex = layer.index;
    el.dataset.propertyPath = property.path || "";
    el.dataset.keyIndex = keyframe.keyIndex || "";
    el.dataset.time = t;
    el.classList.toggle("selected", isKeyframeSelected(layer.index, property.path || "", keyframe.keyIndex || 0));
    hit.title = el.title;
    hit.addEventListener("mousedown", event => {
      if (event.button === 0 && propertyValueModifierDown(event)) {
        event.preventDefault();
        event.stopPropagation();
        openPropertyValueEditor(hit, layer, property, keyframe);
        return;
      }
      beginKeyframeDrag(event, layer, property, keyframe);
    });
    hit.addEventListener("contextmenu", event => {
      const key = { layerIndex: layer.index, propertyPath: property.path || "", keyIndex: keyframe.keyIndex || 0 };
      if (!isKeyframeSelected(key.layerIndex, key.propertyPath, key.keyIndex)) {
        selectedKeyframes = normalizeSelectedKeyframes([key]);
        renderKeyframeSelectionOnly();
        loadJSX().then(() => aeCall("TNT_selectPropertyKeys", [selectedKeyframes]));
      }
      showKeyframeMenu(event);
    });
    hit.appendChild(el);
    track.appendChild(hit);
  });
}

function beginKeyframeDrag(event, layer, property, keyframe) {
  if (!state.comp || event.button !== 0) return;
  if (event.detail > 1) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  const propertyPath = property.path || "";
  const keyIndex = Number(keyframe.keyIndex || 0);
  const additive = event.ctrlKey || event.metaKey;
  const alreadySelected = isKeyframeSelected(layer.index, propertyPath, keyIndex);
  if (!alreadySelected || additive) {
    selectKeyframes([{ layerIndex: layer.index, propertyPath, keyIndex }], additive);
  }
  const moveKeys = alreadySelected && !additive
    ? selectedKeyframes.slice()
    : [{ layerIndex: layer.index, propertyPath, keyIndex }];
  const moveInfos = moveKeys.map(findKeyframeInfo).filter(Boolean);
  if (!moveInfos.length) return;
  const minDelta = Math.max(...moveInfos.map(info => info.minTime - info.originalTime));
  const maxDelta = Math.min(...moveInfos.map(info => info.maxTime - info.originalTime));
  const startPointerTime = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const originalTime = snapTimeToFrame(Number(keyframe.time || 0));
  let previewTime = originalTime;
  let previewFrame = 0;
  const dragVisuals = moveInfos.map(info => {
    const el = Array.from(document.querySelectorAll(
      `.property-keyframe-hit[data-layer-index="${info.layerIndex}"][data-key-index="${info.keyIndex}"]`
    )).find(candidate => String(candidate.dataset.propertyPath || "") === String(info.propertyPath || ""));
    return el ? { el, originalTime: info.originalTime } : null;
  }).filter(Boolean);

  isKeyframeDragging = true;
  suppressSyncUntil = Date.now() + 60000;
  document.body.classList.add("keyframe-moving");
  if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.add("is-dragging");

  const renderPreview = () => {
    previewFrame = 0;
    const delta = previewTime - originalTime;
    dragVisuals.forEach(item => { item.el.style.left = `${timeToX(item.originalTime + delta)}px`; });
  };

  const applyPreview = moveEvent => {
    const pointerTime = timeFromPointerEvent(moveEvent, { targetSnap: false, showGuide: false });
    const rawDelta = pointerTime - startPointerTime;
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, rawDelta));
    const snapped = snapTimeToTargets(originalTime + clampedDelta, {
      targetSnap: moveEvent.shiftKey,
      minTime: originalTime + minDelta,
      maxTime: originalTime + maxDelta,
      excludeType: "keyframe",
      excludeLayerIndex: layer.index,
      excludePropertyPath: propertyPath,
      excludeKey: keyIndex
    });
    previewTime = Math.max(originalTime + minDelta, Math.min(originalTime + maxDelta, snapped.time));
    showSnapGuide(previewTime, moveEvent.shiftKey, snapped.target);
    if (!previewFrame) previewFrame = requestAnimationFrame(renderPreview);
  };

  const finish = async () => {
    if (previewFrame) { cancelAnimationFrame(previewFrame); previewFrame = 0; }
    renderPreview();
    document.removeEventListener("mousemove", applyPreview, true);
    document.removeEventListener("mouseup", finish, true);
    hideSnapGuide();
    isKeyframeDragging = false;
    document.body.classList.remove("keyframe-moving");
    if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.remove("is-dragging");
    await loadJSX();
    const delta = previewTime - originalTime;
    const commitKeys = moveInfos.map(info => ({ layerIndex: info.layerIndex, propertyPath: info.propertyPath, keyIndex: info.keyIndex }));
    const result = commitKeys.length > 1
      ? await aeCall("TNT_movePropertyKeysByDelta", [commitKeys, delta])
      : await aeCall("TNT_setPropertyKeyTime", [layer.index, propertyPath, keyIndex, previewTime]);
    suppressSyncUntil = Date.now() + 500;
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not move keyframe.";
      await refreshLayers({ forceRender: true });
      return;
    }
    const movedSelection = normalizeSelectedKeyframes(
      result.movedKeys && result.movedKeys.length
        ? result.movedKeys
        : [{
            layerIndex: layer.index,
            propertyPath,
            keyIndex: Number(result.keyIndex || keyIndex)
          }]
    );
    selectedKeyframes = movedSelection;
    renderKeyframeSelectionOnly();
    await refreshLayers({
      forceRender: true,
      preserveKeyframeSelection: movedSelection
    });
  };

  document.addEventListener("mousemove", applyPreview, true);
  document.addEventListener("mouseup", finish, true);
  applyPreview(event);
}

function renderKeyframeMode() {
  if (!prepareTimelineForRender()) return;
  document.body.classList.add("keyframe-mode");
  if (!state.comp || !state.layers.length) {
    timelineEl.innerHTML = `<div class="empty">No comp/layers found. Select or open an active composition.</div>`;
    drawRuler();
    updateFilterButtons();
    updatePlayhead();
    updateHorizontalScrollBar();
    return;
  }

  fitTimelineToPanel();
  drawRuler();
  renderCompMarkers();
  timelineEl.style.width = `${timelineContentWidth()}px`;
  updateHorizontalScrollBar();
  updateFilterButtons();

  const rows = buildKeyframeRows();
  if (!rows.length) {
    timelineEl.innerHTML = `<div class="empty">No layers match this filter.</div>`;
    renderProtectedRegionOverlays(1);
    updatePlayhead();
    return;
  }

  rows.forEach(row => {
    const track = document.createElement("div");
    track.className = row.type === "property" ? "track keyframe-property-row" : "track keyframe-layer-row";
    if (row.type === "layer") {
      track.dataset.layerIndex = row.layer.index;
      if (state.selectedLayerIndices.includes(row.layer.index)) track.classList.add("selected");
      if (state.selectedLayerIndices.includes(row.layer.index) &&
          Number(row.layer.index) === Number(lastSelectedLayerIndex)) {
        track.classList.add("last-selected");
      }
    }

    const label = document.createElement("div");
    label.className = "track-label";
    if (row.type === "layer") {
      const props = keyframeRowProperties(row.layer);
      const expanded = !!expandedKeyframeLayers[row.layer.index];
      label.innerHTML = `<button type="button" class="property-disclosure${expanded ? " open" : ""}" title="${expanded ? "Collapse properties" : "Expand properties"}"></button><span class="keyframe-track-name">V${row.layer.index}</span>`;
      const disclosure = label.querySelector(".property-disclosure");
      disclosure.disabled = !props.length;
      disclosure.addEventListener("mousedown", e => e.stopPropagation(), true);
      disclosure.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        expandedKeyframeLayers[row.layer.index] = !expandedKeyframeLayers[row.layer.index];
        render();
      });
      track.addEventListener("mousedown", event => {
        if (event.detail > 1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.button !== 0 || event.target.closest(".property-disclosure")) return;
        event.preventDefault();
        selectLayer(row.layer.index, event.shiftKey || event.ctrlKey || event.metaKey);
      });
      track.addEventListener("dblclick", event => {
        if (event.target.closest(".property-disclosure") || !row.layer.sourceCompId) return;
        event.preventDefault();
        event.stopPropagation();
        openLayerSourceComp(row.layer);
      });
      if (row.layer.outPoint > visibleStart && row.layer.inPoint < visibleStart + visibleDuration) {
        const clip = document.createElement("div");
        const clipStart = Math.max(row.layer.inPoint, visibleStart);
        const clipEnd = Math.min(row.layer.outPoint, visibleStart + visibleDuration);
        const selectedNow = state.selectedLayerIndices.includes(row.layer.index);
        const lastSelectedNow = selectedNow && Number(row.layer.index) === Number(lastSelectedLayerIndex);
        const labelColorValue = labelColor(row.layer.label);
        clip.className = "clip keyframe-focus-clip" + (selectedNow ? " selected" : "") + (lastSelectedNow ? " last-selected" : "") + (row.layer.isMissingMedia ? " missing-media" : "") + (!row.layer.enabled ? " disabled-layer" : "") + (row.layer.locked ? " locked-layer" : "");
        clip.style.left = `${timeToX(clipStart)}px`;
        clip.style.width = `${Math.max(12, (clipEnd - clipStart) * pixelsPerSecond)}px`;
        clip.style.backgroundColor = labelColorValue;
        clip.style.setProperty("--clip-base-color", labelColorValue);
        clip.style.setProperty("--index-bg", darkerHex(labelColorValue, 0.42));
        clip.dataset.layerIndex = row.layer.index;
        clip.dataset.clipStart = clipStart;
        clip.title = `${row.layer.name} | AE layer ${row.layer.index} | label ${row.layer.label}${row.layer.isMissingMedia ? " | Missing media" + (row.layer.missingMediaPath ? ": " + row.layer.missingMediaPath : "") : ""}`;
        clip.innerHTML = `<span class="clip-index">${row.layer.index}</span>${row.layer.isMissingMedia ? '<span class="missing-media-icon" title="Missing media">!</span>' : ""}<span class="clip-name">${escapeHtml(row.layer.name)}</span>`;
        clip.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event, row.layer)) return;
          const selectedIndices = state.selectedLayerIndices || [];
          const isLayerSelected = selectedIndices.includes(row.layer.index);
          if (!isLayerSelected) {
            state.selectedLayerIndices = [row.layer.index];
            renderSelectionOnly();
            selectLayer(row.layer.index, false);
          }
          showLayerMenu(event, row.layer);
        });
        track.appendChild(clip);
      }
    } else {
      timelineEl.appendChild(renderPropertyTrack(row.layer, row.property));
      return;
    }

    track.appendChild(label);
    timelineEl.appendChild(track);
  });

  timelineEl.style.setProperty("--track-fill-start", `${rows.length * TRACK_HEIGHT}px`);
  renderProtectedRegionOverlays(rows.length);
  updatePlayhead();
}

async function selectLayerProperty(layerIndex, propertyPath) {
  suppressSyncUntil = Date.now() + 700;
  state.selectedLayerIndices = [Number(layerIndex)];
  if (timelineMode === "keyframe" && selectedKeyframes.length) {
    clearKeyframeSelectionLocally({ closeEase: true });
  }
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectLayerProperty", [layerIndex, propertyPath]);
  if (!result.ok) statusEl.textContent = result.error || "Could not select property.";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}

function isLayerMenuOpen() {
  return !!(layerMenuEl && layerMenuEl.classList.contains("open"));
}
