function ensureEaseDialog() {
  if (easeDialogEl) return easeDialogEl;
  easeDialogEl = document.createElement("div");
  easeDialogEl.className = "ease-dialog-backdrop";
  easeDialogEl.setAttribute("aria-hidden", "true");
  easeDialogEl.innerHTML = `
    <div class="ease-dialog">
      <div class="ease-dialog-head">
        <div class="ease-dialog-title-wrap">
          <div class="ease-dialog-title"><b class="ease-shortcut-badge">E</b><span>Ease Editor</span><em class="ease-keyframe-count"></em></div>
        </div>
        <div class="ease-actions">
          <button type="button" class="ease-apply-saved">Apply Saved</button>
          <button type="button" class="ease-cancel">Cancel</button>
        </div>
      </div>
      <div class="ease-main">
        <div class="ease-curve-column">
          <div class="ease-graph-wrap">
            <div class="ease-graph-zoom" aria-label="Ease graph zoom">
              <button type="button" class="ease-graph-zoom-out" aria-label="Zoom out" title="Zoom out"></button>
              <button type="button" class="ease-graph-zoom-value" aria-label="Reset graph zoom" title="Reset to 100%">100%</button>
              <button type="button" class="ease-graph-zoom-in" aria-label="Zoom in" title="Zoom in"></button>
            </div>
            <svg class="ease-graph" viewBox="${EASE_GRAPH.viewX} ${EASE_GRAPH.viewY} ${EASE_GRAPH.viewW} ${EASE_GRAPH.viewH}" aria-hidden="true">
              <line class="ease-box-edge ease-box-edge-weak" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.top}"></line>
              <line class="ease-box-edge ease-box-edge-weak" x1="${EASE_GRAPH.right}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-box-edge ease-box-edge-strong" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.bottom}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-box-edge ease-box-edge-strong" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.left}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-handle-line ease-out-line" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.bottom}" x2="0" y2="0"></line>
              <line class="ease-handle-line ease-in-line" x1="${EASE_GRAPH.right}" y1="${EASE_GRAPH.top}" x2="0" y2="0"></line>
              <path class="ease-curve" d=""></path>
              <circle class="ease-handle-hit ease-handle-target ease-out-hit" data-handle="out" r="14" cx="0" cy="0"></circle>
              <circle class="ease-handle-hit ease-handle-target ease-in-hit" data-handle="in" r="14" cx="0" cy="0"></circle>
              <circle class="ease-point ease-handle-target ease-out-handle" data-handle="out" r="5" cx="0" cy="0"></circle>
              <circle class="ease-point ease-handle-target ease-in-handle" data-handle="in" r="5" cx="0" cy="0"></circle>
            </svg>
          </div>
          <div class="ease-presets">
            <button type="button" data-preset="linear"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 L56 8"></path></svg><span>Linear</span></button>
            <button type="button" data-preset="easy"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 26 26, 38 8, 56 8"></path></svg><span>Easy</span></button>
            <button type="button" data-preset="gentle"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 18 23, 36 14, 56 8"></path></svg><span>Gentle</span></button>
            <button type="button" data-preset="smooth"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 28 25, 36 9, 56 8"></path></svg><span>Smooth</span></button>
            <button type="button" data-preset="sharp"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 36 22, 42 8, 56 8"></path></svg><span>Sharp</span></button>
            <button type="button" data-preset="snap"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 44 27, 52 23, 56 8"></path></svg><span>Snap</span></button>
          </div>
        </div>
        <div class="ease-side">
          <div class="ease-controls">
            <label class="ease-control">
              <span>Out Influence</span>
              <input class="ease-out-input" type="range" min="0" max="100" step="1">
              <em class="ease-out-value"></em>
            </label>
            <label class="ease-control">
              <span>In Influence</span>
              <input class="ease-in-input" type="range" min="0" max="100" step="1">
              <em class="ease-in-value"></em>
            </label>
            <label class="ease-control">
              <span>Out Speed</span>
              <input class="ease-out-speed-input" type="range" min="-500" max="500" step="1">
              <em class="ease-out-speed-value"></em>
            </label>
            <label class="ease-control">
              <span>In Speed</span>
              <input class="ease-in-speed-input" type="range" min="-500" max="500" step="1">
              <em class="ease-in-speed-value"></em>
            </label>
          </div>
          <div class="ease-tools" aria-label="Ease utilities">
            <button type="button" data-ease-tool="overshoot" data-tooltip="Overshoot Expression\nAdd the panel overshoot expression controls."><svg viewBox="0 0 28 20" aria-hidden="true"><path d="M3 15 C 9 14, 13 3, 18 8 C 21 11, 23 8, 25 5"></path></svg><span>Overshoot</span></button>
            <button type="button" data-ease-tool="wiggle" data-tooltip="Wiggle Expression\nAdd wiggle expression controls to selected properties."><svg viewBox="0 0 28 20" aria-hidden="true"><path d="M3 11 C 6 3, 10 19, 14 11 C 18 3, 22 19, 25 9"></path></svg><span>Wiggle</span></button>
          </div>
        </div>
      </div>
      <div class="ease-error"></div>
    </div>
  `;
  document.body.appendChild(easeDialogEl);
  easeDialogEl.addEventListener("mousedown", event => {
    if (event.target === easeDialogEl) hideEaseDialog();
  });
  const closeBtn = easeDialogEl.querySelector(".ease-close");
  if (closeBtn) closeBtn.addEventListener("click", hideEaseDialog);
  easeDialogEl.querySelector(".ease-cancel").addEventListener("click", hideEaseDialog);
  easeDialogEl.querySelector(".ease-apply-saved").addEventListener("click", applySavedEaseFromDialog);
  easeDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      hideEaseDialog();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleLiveEaseApply({ immediate: true, refresh: true });
    }
  });
  easeDialogEl.querySelectorAll(".ease-control input").forEach(input => {
    input.addEventListener("input", () => {
      easeDialogState.influenceOut = Number(easeDialogEl.querySelector(".ease-out-input").value);
      easeDialogState.influenceIn = Number(easeDialogEl.querySelector(".ease-in-input").value);
      easeDialogState.speedOut = Number(easeDialogEl.querySelector(".ease-out-speed-input").value);
      easeDialogState.speedIn = Number(easeDialogEl.querySelector(".ease-in-speed-input").value);
      updateEaseRangeFills();
      renderEaseGraph();
      scheduleLiveEaseApply();
    });
  });
  easeDialogEl.querySelectorAll(".ease-presets button").forEach(button => {
    button.addEventListener("click", () => setEasePreset(button.dataset.preset));
  });
  easeDialogEl.querySelector(".ease-graph-zoom-out").addEventListener("click", () => setEaseGraphZoom(easeGraphZoom - 25));
  easeDialogEl.querySelector(".ease-graph-zoom-in").addEventListener("click", () => setEaseGraphZoom(easeGraphZoom + 25));
  easeDialogEl.querySelector(".ease-graph-zoom-value").addEventListener("click", () => setEaseGraphZoom(100));
  easeDialogEl.querySelectorAll("[data-ease-tool]").forEach(button => {
    button.addEventListener("click", () => runEaseUtility(button.dataset.easeTool));
    bindPanelTooltip(button);
  });
  easeDialogEl.querySelectorAll(".ease-handle-target").forEach(handle => {
    handle.addEventListener("mousedown", beginEaseHandleDrag);
  });
  return easeDialogEl;
}

async function runEaseUtility(tool) {
  focusPanel(2);
  if (tool === "easy") {
    await applyEasyEaseDirect();
    return;
  }
  if (tool === "linear") {
    await runTntV3Command({ name: "Linear Keyframes", tntFunction: "applyLinear" });
    return;
  }
  if (tool === "overshoot") {
    await runTntV3Command({ name: "Overshoot Expression", tntFunction: "applyOvershoot" });
    return;
  }
  if (tool === "wiggle") {
    await runTntV3Command({ name: "Wiggle Expression", tntFunction: "applyWiggle", args: [{ freq: 2, amp: 20 }] });
  }
}

async function showEaseDialog() {
  if (!state.comp) return;
  if (easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
    focusPanel(2);
    return;
  }
  await syncSelectedKeyframesFromAeIfNeeded();
  if (!selectedKeyframes.length) return;
  const el = ensureEaseDialog();
  const liveKeyframes = selectedKeyframes.slice();
  let initialEaseSettings = loadLastEaseSettings();
  let easeSelectionIsMixed = false;
  await loadJSX();
  const selectedEase = await aeCall("TNT_getSelectedKeyframeEaseSettings", [liveKeyframes]);
  if (selectedEase && selectedEase.ok && !selectedEase.mixed && selectedEase.settings) {
    initialEaseSettings = normalizedEaseSettings(selectedEase.settings);
  } else if (selectedEase && selectedEase.ok && selectedEase.mixed) {
    easeSelectionIsMixed = true;
  }
  easeDialogState = { ...initialEaseSettings, dragHandle: null, liveKeyframes };
  const countEl = el.querySelector(".ease-keyframe-count");
  if (countEl) countEl.textContent = formatKeyframeSelectionScope(liveKeyframes, easeSelectionIsMixed);
  el.querySelector(".ease-error").textContent = "";
  syncEaseInputs();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    const firstInput = el.querySelector(".ease-control input");
    if (firstInput) firstInput.focus();
  }, 0);
}

async function syncSelectedKeyframesFromAeIfNeeded() {
  if (selectedKeyframes.length) return true;
  await loadJSX();
  const sync = await aeCall("TNT_getSyncState", [true, true]);
  if (sync && sync.ok) {
    state.selectedLayerIndices = sync.selectedLayerIndices || state.selectedLayerIndices || [];
    selectedKeyframes = normalizeSelectedKeyframes(sync.selectedKeyframes || []);
    updateStatus();
    renderSelectionOnly();
  }
  return selectedKeyframes.length > 0;
}

function hideEaseDialog() {
  if (!easeDialogEl) return;
  if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
  easeLiveApplyTimer = null;
  easeDialogEl.classList.remove("show");
  easeDialogEl.setAttribute("aria-hidden", "true");
  easeDialogState.dragHandle = null;
  easeDialogState.liveKeyframes = null;
  easeLiveApplyQueued = null;
}

function syncEaseInputs() {
  if (!easeDialogEl) return;
  easeDialogEl.querySelector(".ease-out-input").value = String(Math.round(easeDialogState.influenceOut));
  easeDialogEl.querySelector(".ease-in-input").value = String(Math.round(easeDialogState.influenceIn));
  easeDialogEl.querySelector(".ease-out-speed-input").value = String(Math.round(easeDialogState.speedOut));
  easeDialogEl.querySelector(".ease-in-speed-input").value = String(Math.round(easeDialogState.speedIn));
  updateEaseRangeFills();
  renderEaseGraph();
}

function updateEaseRangeFills() {
  if (!easeDialogEl) return;
  easeDialogEl.querySelectorAll(".ease-control input[type='range']").forEach(input => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || 0);
    const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
    input.style.setProperty("--range-fill", `${pct}%`);
  });
}

function setEasePreset(name) {
  if (name === "linear") {
    runEaseUtility("linear");
    return;
  }
  const presets = {
    easy: defaultEaseSettings(),
    gentle: { influenceOut: 33, influenceIn: 33, speedOut: 55, speedIn: 55 },
    smooth: { influenceOut: 65, influenceIn: 65, speedOut: 100, speedIn: 100 },
    sharp: { influenceOut: 85, influenceIn: 45, speedOut: 170, speedIn: 80 },
    snap: { influenceOut: 92, influenceIn: 18, speedOut: 190, speedIn: 35 }
  };
  easeDialogState = { ...easeDialogState, ...(presets[name] || presets.smooth), dragHandle: null };
  syncEaseInputs();
  scheduleLiveEaseApply();
}

function easeGraphPoints() {
  return easeGraphPointsFor(easeDialogState);
}

function easeGraphViewBox() {
  const zoom = Math.max(25, Math.min(200, Number(easeGraphZoom || 100)));
  const scale = 100 / zoom;
  const width = EASE_GRAPH.viewW * scale;
  const height = EASE_GRAPH.viewH * scale;
  const centerX = EASE_GRAPH.viewX + EASE_GRAPH.viewW / 2;
  const centerY = EASE_GRAPH.viewY + EASE_GRAPH.viewH / 2;
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  };
}

function setEaseGraphZoom(nextZoom) {
  easeGraphZoom = Math.max(25, Math.min(200, Math.round(Number(nextZoom || 100) / 25) * 25));
  renderEaseGraph();
}

function autoZoomEaseGraphForActiveHandle() {
  if (!easeDialogState.dragHandle || easeGraphZoom <= 25) return false;
  const points = easeGraphPoints();
  const handle = easeDialogState.dragHandle === "out" ? points.p1 : points.p2;
  const view = easeGraphViewBox();
  const handleRadius = 6;
  const touchingEdge =
    handle.y - handleRadius <= view.y ||
    handle.y + handleRadius >= view.y + view.height;

  if (!touchingEdge) {
    easeGraphAutoZoomArmed = true;
    return false;
  }
  if (!easeGraphAutoZoomArmed) return false;

  const now = Date.now();
  if (now - easeGraphAutoZoomAt < 140) return false;
  easeGraphZoom = Math.max(25, easeGraphZoom - 1);
  easeGraphAutoZoomAt = now;
  easeGraphAutoZoomArmed = false;
  return true;
}

function easeGraphPointsFor(settings) {
  settings = settings || {};
  const outInf = Math.max(0, Math.min(100, Number(settings.influenceOut || 0)));
  const inInf = Math.max(0, Math.min(100, Number(settings.influenceIn || 0)));
  const outSpeed = Math.max(-500, Math.min(500, Number(settings.speedOut || 0)));
  const inSpeed = Math.max(-500, Math.min(500, Number(settings.speedIn || 0)));
  const graphWidth = EASE_GRAPH.right - EASE_GRAPH.left;
  const influenceWidth = graphWidth * EASE_GRAPH.influenceReach;
  const p0 = { x: EASE_GRAPH.left, y: EASE_GRAPH.bottom };
  const p3 = { x: EASE_GRAPH.right, y: EASE_GRAPH.top };
  const p1 = { x: EASE_GRAPH.left + (outInf / 100) * influenceWidth, y: EASE_GRAPH.bottom - outSpeed * EASE_GRAPH.speedY };
  const p2 = { x: EASE_GRAPH.right - (inInf / 100) * influenceWidth, y: EASE_GRAPH.top + inSpeed * EASE_GRAPH.speedY };
  return { p0, p1, p2, p3 };
}

function renderEaseGraph() {
  if (!easeDialogEl) return;
  const svg = easeDialogEl.querySelector(".ease-graph");
  const view = easeGraphViewBox();
  svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
  const { p0, p1, p2, p3 } = easeGraphPoints();
  const path = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
  easeDialogEl.querySelector(".ease-curve").setAttribute("d", path);
  easeDialogEl.querySelector(".ease-out-line").setAttribute("x2", p1.x);
  easeDialogEl.querySelector(".ease-out-line").setAttribute("y2", p1.y);
  easeDialogEl.querySelector(".ease-in-line").setAttribute("x2", p2.x);
  easeDialogEl.querySelector(".ease-in-line").setAttribute("y2", p2.y);
  easeDialogEl.querySelector(".ease-out-hit").setAttribute("cx", p1.x);
  easeDialogEl.querySelector(".ease-out-hit").setAttribute("cy", p1.y);
  easeDialogEl.querySelector(".ease-in-hit").setAttribute("cx", p2.x);
  easeDialogEl.querySelector(".ease-in-hit").setAttribute("cy", p2.y);
  easeDialogEl.querySelector(".ease-out-handle").setAttribute("cx", p1.x);
  easeDialogEl.querySelector(".ease-out-handle").setAttribute("cy", p1.y);
  easeDialogEl.querySelector(".ease-in-handle").setAttribute("cx", p2.x);
  easeDialogEl.querySelector(".ease-in-handle").setAttribute("cy", p2.y);
  easeDialogEl.querySelector(".ease-out-value").textContent = `${Math.round(easeDialogState.influenceOut)}%`;
  easeDialogEl.querySelector(".ease-in-value").textContent = `${Math.round(easeDialogState.influenceIn)}%`;
  easeDialogEl.querySelector(".ease-out-speed-value").textContent = `${Math.round(easeDialogState.speedOut)}%`;
  easeDialogEl.querySelector(".ease-in-speed-value").textContent = `${Math.round(easeDialogState.speedIn)}%`;
  const zoomValue = easeDialogEl.querySelector(".ease-graph-zoom-value");
  if (zoomValue) zoomValue.textContent = `${easeGraphZoom}%`;
  const zoomOut = easeDialogEl.querySelector(".ease-graph-zoom-out");
  const zoomIn = easeDialogEl.querySelector(".ease-graph-zoom-in");
  if (zoomOut) zoomOut.disabled = easeGraphZoom <= 25;
  if (zoomIn) zoomIn.disabled = easeGraphZoom >= 200;
}

function beginEaseHandleDrag(event) {
  event.preventDefault();
  event.stopPropagation();
  easeDialogState.dragHandle = event.currentTarget.dataset.handle;
  easeGraphAutoZoomArmed = true;
  const dragKeyframes = (easeDialogState.liveKeyframes && easeDialogState.liveKeyframes.length ? easeDialogState.liveKeyframes : selectedKeyframes).slice();
  easeDialogState.dragKeyframes = dragKeyframes;
  let dragFinished = false;
  document.body.classList.add("ease-handle-dragging");
  const onMove = moveEaseHandle;
  const onUp = () => {
    if (dragFinished) return;
    dragFinished = true;
    if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
    easeLiveApplyTimer = null;
    const finalSettings = normalizedEaseSettings(easeDialogState);
    easeDialogState.dragHandle = null;
    document.body.classList.remove("ease-handle-dragging");
    window.removeEventListener("mousemove", onMove, true);
    window.removeEventListener("mouseup", onUp, true);
	    document.removeEventListener("mousemove", onMove, true);
	    document.removeEventListener("mouseup", onUp, true);
	    easeDialogState.dragKeyframes = null;
	    scheduleLiveEaseApply({ immediate: true, refresh: true, keys: dragKeyframes, settings: finalSettings });
	  };
  window.addEventListener("mousemove", onMove, true);
  window.addEventListener("mouseup", onUp, true);
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
	moveEaseHandle(event);
}

function moveEaseHandle(event) {
  if (!easeDialogEl || !easeDialogState.dragHandle) return;
  const svg = easeDialogEl.querySelector(".ease-graph");
  const point = svg.createSVGPoint ? svg.createSVGPoint() : null;
  let rawX = 0;
  let rawY = 0;
  if (point && svg.getScreenCTM()) {
    point.x = event.clientX;
    point.y = event.clientY;
    const localPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    rawX = localPoint.x;
    rawY = localPoint.y;
  } else {
    const rect = svg.getBoundingClientRect();
    const view = easeGraphViewBox();
    rawX = view.x + ((event.clientX - rect.left) / rect.width) * view.width;
    rawY = view.y + ((event.clientY - rect.top) / rect.height) * view.height;
  }
  const view = easeGraphViewBox();
  const xMin = event.shiftKey ? view.x : EASE_GRAPH.left;
  const xMax = event.shiftKey ? view.x + view.width : EASE_GRAPH.right;
  const yMin = event.shiftKey ? EASE_GRAPH.minY : EASE_GRAPH.top;
  const yMax = event.shiftKey ? EASE_GRAPH.maxY : EASE_GRAPH.bottom;
  const x = Math.max(xMin, Math.min(xMax, rawX));
  const y = Math.max(yMin, Math.min(yMax, rawY));
  const graphWidth = EASE_GRAPH.right - EASE_GRAPH.left;
  const influenceWidth = graphWidth * EASE_GRAPH.influenceReach;
  if (easeDialogState.dragHandle === "out") {
    easeDialogState.influenceOut = Math.max(0, Math.min(100, ((x - EASE_GRAPH.left) / influenceWidth) * 100));
    easeDialogState.speedOut = Math.max(-500, Math.min(500, (EASE_GRAPH.bottom - y) / EASE_GRAPH.speedY));
  } else {
    easeDialogState.influenceIn = Math.max(0, Math.min(100, ((EASE_GRAPH.right - x) / influenceWidth) * 100));
    easeDialogState.speedIn = Math.max(-500, Math.min(500, (y - EASE_GRAPH.top) / EASE_GRAPH.speedY));
  }
  if (event.shiftKey) autoZoomEaseGraphForActiveHandle();
  syncEaseInputs();
  scheduleLiveEaseApply({ keys: easeDialogState.dragKeyframes || easeDialogState.liveKeyframes });
}

async function applySavedEaseFromDialog() {
  easeDialogState = { ...easeDialogState, ...loadLastEaseSettings(), dragHandle: null };
  syncEaseInputs();
  scheduleLiveEaseApply({ immediate: true, refresh: true });
}

function scheduleLiveEaseApply(options = {}) {
  if (!easeDialogEl || !easeDialogEl.classList.contains("show")) return;
  const keys = options.keys && options.keys.length
    ? options.keys.slice()
    : (easeDialogState.liveKeyframes && easeDialogState.liveKeyframes.length ? easeDialogState.liveKeyframes.slice() : selectedKeyframes.slice());
  if (!keys.length) return;
  const settings = normalizedEaseSettings(options.settings || easeDialogState);
  if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
  const run = () => {
    easeLiveApplyTimer = null;
    queueEaseLiveApply({
      keys,
      settings,
      refresh: !!options.refresh,
      save: options.save !== false && (!!options.refresh || !!options.immediate)
    });
  };
  if (options.immediate) {
    run();
    return;
  }
  easeLiveApplyTimer = setTimeout(() => {
    run();
  }, 70);
}

function queueEaseLiveApply(payload) {
  easeLiveApplyQueued = payload;
  if (easeLiveApplyInFlight) return;
  flushQueuedEaseLiveApply();
}

async function flushQueuedEaseLiveApply() {
  if (easeLiveApplyInFlight || !easeLiveApplyQueued) return;
  const payload = easeLiveApplyQueued;
  easeLiveApplyQueued = null;
  easeLiveApplyInFlight = true;
  try {
    await applyEaseToSelected({
      close: false,
      refresh: !!payload.refresh,
      settings: payload.settings,
      live: true,
      keepDialogOpen: true,
      save: !!payload.save,
      keys: payload.keys
    });
  } finally {
    easeLiveApplyInFlight = false;
    if (easeLiveApplyQueued) flushQueuedEaseLiveApply();
  }
}

async function applyEasyEaseDirect() {
  await applyEaseToSelected({ close: false, refresh: true, settings: defaultEaseSettings(), save: false });
}

async function applySavedEaseDirect() {
  await applyEaseToSelected({ close: false, refresh: true, settings: loadLastEaseSettings(), save: false });
}

async function applyEaseToSelected(options = {}) {
  let keysToApply = options.keys && options.keys.length ? options.keys.slice() : selectedKeyframes.slice();
  if (!keysToApply.length) {
    await syncSelectedKeyframesFromAeIfNeeded();
    keysToApply = selectedKeyframes.slice();
  }
  if (!keysToApply.length) {
    if (options.close) hideEaseDialog();
    return;
  }
  const el = easeDialogEl || ensureEaseDialog();
  const errorEl = el.querySelector(".ease-error");
  if (errorEl) errorEl.textContent = "";
  const settings = normalizedEaseSettings(options.settings || easeDialogState);
  if (options.save !== false) saveLastEaseSettings(settings);
  if (!easeHostReloaded) jsxLoaded = false;
  await loadJSX();
  easeHostReloaded = true;
  const result = await aeCall("TNT_applySelectedKeyframeEase", [keysToApply, {
    influenceIn: settings.influenceIn,
    influenceOut: settings.influenceOut,
    speedInScale: settings.speedIn / 100,
    speedOutScale: settings.speedOut / 100
  }]);
  if (!result.ok) {
    if (errorEl) errorEl.textContent = result.error || "Could not apply easing.";
    else statusEl.textContent = result.error || "Could not apply easing.";
    return;
  }
  if (!options.live) statusEl.textContent = `Eased ${result.changedCount || keysToApply.length} keyframe${(result.changedCount || keysToApply.length) === 1 ? "" : "s"}.`;
  const keepDialogOpen = !!options.keepDialogOpen;
  if (options.close && !keepDialogOpen) hideEaseDialog();
  if (options.refresh) await refreshLayers({ forceRender: true, includeSelectedKeyframes: true });
  if (keepDialogOpen && easeDialogEl) {
    easeDialogEl.classList.add("show");
    easeDialogEl.setAttribute("aria-hidden", "false");
    syncEaseInputs();
  }
  if ((options.close || options.refresh) && !keepDialogOpen) focusPanel(2);
}

