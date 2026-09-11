let timingOrderBackdropEl = null;
let timingOrderDirection = "asc";
let timingOrderUnit = "frames";
let timingOrderBaseStartTimes = null;
let timingOrderBaseKeyTimes = null;
let timingOrderStaggerOrderIndices = null;
let timingOrderLiveTimer = null;
let timingOrderLiveInFlight = false;
let timingOrderLivePending = false;
let layerOrderBasis = "in";
let layerOrderDirection = "asc";
let layerOrderProximity = "closest";

function timingOrderSelectedCount() {
  return (state.selectedLayerIndices || []).length;
}

function timingOrderSelectedKeyCount() {
  return selectedKeyframes && selectedKeyframes.length ? selectedKeyframes.length : 0;
}

function timingOrderStaggerTarget() {
  return timingOrderSelectedKeyCount() >= 2 ? "keyframes" : "layers";
}

function timingOrderStaggerCount() {
  return timingOrderStaggerTarget() === "keyframes" ? timingOrderSelectedKeyCount() : timingOrderSelectedCount();
}

// Handlers, tooltips and icons. Shared by both hosts: the Layout panel's own
// sections and the standalone backdrop.
function bindTimingOrderPanel() {
  if (typeof tntPaintDeclaredIcons === "function") tntPaintDeclaredIcons(timingOrderBackdropEl);
  timingOrderBackdropEl.querySelectorAll("[data-tooltip]").forEach(control => {
    control.setAttribute("aria-label", control.dataset.tooltip.replace(/\n+/g, ". "));
    bindPanelTooltip(control);
  });
  // In the Layout panel the sections are direct children - there is no
  // .timing-order-layout wrapper - so the host element is the listener target.
  const layoutEl = timingOrderBackdropEl.querySelector(".timing-order-layout") || timingOrderBackdropEl;
  layoutEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (typeof hideAnchorDialog === "function") hideAnchorDialog();
      focusPanel(2);
    }
  });
  layoutEl.addEventListener("click", event => {
    const staggerExecute = event.target.closest && event.target.closest("[data-stagger-execute]");
    if (staggerExecute && !staggerExecute.disabled) {
      timingOrderDirection = staggerExecute.dataset.staggerExecute || "";
      captureTimingOrderBaseline();
      renderTimingOrderPanel();
      return;
    }
    const unit = event.target.closest && event.target.closest("[data-timing-unit]");
    if (unit) {
      const previousUnit = timingOrderUnit;
      const nextUnit = unit.dataset.timingUnit || "frames";
      const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
      const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
      const fps = Math.max(1, Number(state.comp && state.comp.frameRate || 30));
      const currentAmount = Math.max(0, Number(amountInput.value || 0));
      timingOrderUnit = nextUnit;
      const seconds = nextUnit === "seconds";
      const convertedAmount = previousUnit === nextUnit
        ? currentAmount
        : (seconds ? currentAmount / fps : currentAmount * fps);
      amountInput.step = seconds ? "0.05" : "1";
      amountRange.max = seconds ? "5" : "60";
      amountRange.step = seconds ? "0.05" : "1";
      amountInput.value = seconds
        ? String(Math.round(convertedAmount * 100) / 100)
        : String(Math.round(convertedAmount));
      amountRange.value = amountInput.value;
      updateTimingOrderRangeFill();
      renderTimingOrderPanel();
      scheduleTimingStaggerApply();
      return;
    }
    const directionButton = event.target.closest && event.target.closest("[data-order-direction]");
    if (directionButton) {
      layerOrderDirection = directionButton.dataset.orderDirection || "asc";
      renderTimingOrderPanel();
      return;
    }
    const sortExecute = event.target.closest && event.target.closest("[data-order-sort]");
    if (sortExecute && !sortExecute.disabled) {
      runLayerOrderPanelAction(sortExecute.dataset.orderSort || "");
      return;
    }
    const stackExecute = event.target.closest && event.target.closest("[data-order-stack]");
    if (stackExecute && !stackExecute.disabled) {
      runLayerStackPanelAction(stackExecute.dataset.orderStack || "");
      return;
    }
    // One In and one Out button; what they move comes from the mode select.
    // Six buttons in a labelled matrix said the same four things.
    // Two axes: what travels, and whether it keeps its relative spacing (pull)
    // or every item lands on the playhead (snap). The panel is held to one
    // dropdown so backtick has a single thing to rotate, so the second axis is
    // the buttons: two for pull, two for snap.
    const pullRun = event.target.closest && event.target.closest("[data-pull-run],[data-snap-run]");
    if (pullRun && !pullRun.disabled) {
      const select = timingOrderBackdropEl.querySelector(".timing-pull-mode");
      const mode = select ? select.value : "layers";
      const together = !pullRun.dataset.snapRun;
      const edge = (pullRun.dataset.pullRun || pullRun.dataset.snapRun) === "out" ? "out" : "in";
      if (mode === "keys") {
        runSnapPullPanelAction("snap", "keyframes", edge === "out" ? "last" : "first",
          { scope: together ? "layer" : "property" });
      } else if (together) {
        runSnapPullPanelAction("pull", "layer", edge);
      } else {
        runSnapPullPanelAction("snap", "layer", edge);
      }
      return;
    }
    const pullLayer = event.target.closest && event.target.closest("[data-pull-layer]");
    if (pullLayer && !pullLayer.disabled) {
      runSnapPullPanelAction("pull", "layer", pullLayer.dataset.pullLayer || "in");
      return;
    }
    const snapLayer = event.target.closest && event.target.closest("[data-snap-layer]");
    if (snapLayer && !snapLayer.disabled) {
      runSnapPullPanelAction("snap", "layer", snapLayer.dataset.snapLayer || "in");
      return;
    }
    const snapKeys = event.target.closest && event.target.closest("[data-snap-keyframes]");
    if (snapKeys && !snapKeys.disabled) {
      runSnapPullPanelAction("snap", "keyframes", snapKeys.dataset.snapKeyframes || "first", { scope: snapKeys.dataset.keyScope || "layer" });
    }
  });
  // These two were spliced inside the click handler's [data-timing-unit] branch
  // by an earlier edit. The Layout panel has no [data-timing-unit] element - it
  // uses these selects instead - so the branch never ran and neither select had
  // a change listener: picking Seconds left stagger still working in frames.
  // In the docked panel, which does have that element, every click on it added
  // another duplicate listener.
  const unitSelect = timingOrderBackdropEl.querySelector(".timing-unit-select");
  if (unitSelect) {
    unitSelect.value = timingOrderUnit;
    unitSelect.addEventListener("change", () => {
      const previousUnit = timingOrderUnit;
      const nextUnit = unitSelect.value === "seconds" ? "seconds" : "frames";
      if (nextUnit === previousUnit) return;
      timingOrderUnit = nextUnit;
      // Carry the amount across the unit change instead of reinterpreting the
      // number: 5 frames becomes 0.2s, not 5s. The segmented control this select
      // replaced did this conversion, and it was lost with it.
      const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
      const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
      if (amountInput && amountRange) {
        const fps = Math.max(1, Number(state.comp && state.comp.frameRate || 30));
        const seconds = nextUnit === "seconds";
        const current = Math.max(0, Number(amountInput.value || 0));
        const converted = seconds ? current / fps : current * fps;
        amountInput.step = seconds ? "0.05" : "1";
        amountRange.max = seconds ? "5" : "60";
        amountRange.step = seconds ? "0.05" : "1";
        amountInput.value = seconds ? String(Math.round(converted * 100) / 100) : String(Math.round(converted));
        amountRange.value = amountInput.value;
        updateTimingOrderRangeFill();
      }
      renderTimingOrderPanel();
      scheduleTimingStaggerApply();
    });
  }
  const directionSelect = timingOrderBackdropEl.querySelector(".timing-direction-select");
  if (directionSelect) {
    directionSelect.value = layerOrderDirection;
    directionSelect.addEventListener("change", () => {
      layerOrderDirection = directionSelect.value === "desc" ? "desc" : "asc";
      renderTimingOrderPanel();
    });
  }
  const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
  const groupInput = timingOrderBackdropEl.querySelector(".timing-group-input");
  amountRange.addEventListener("input", () => {
    amountInput.value = amountRange.value;
    updateTimingOrderRangeFill();
    scheduleTimingStaggerApply();
  });
  amountRange.addEventListener("change", () => {
    scheduleTimingStaggerApply({ immediate: true });
  });
  amountInput.addEventListener("input", () => {
    let value = Number(amountInput.value || 0);
    if (!Number.isFinite(value)) value = 0;
    if (value > Number(amountRange.max)) amountRange.max = String(value);
    amountRange.value = String(Math.max(0, value));
    updateTimingOrderRangeFill();
    scheduleTimingStaggerApply();
  });
  amountInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleTimingStaggerApply({ immediate: true });
    }
  });
  groupInput.addEventListener("input", () => {
    let value = Math.round(Number(groupInput.value || 1));
    if (!Number.isFinite(value) || value < 1) value = 1;
    groupInput.value = String(value);
    scheduleTimingStaggerApply();
  });
  groupInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleTimingStaggerApply({ immediate: true });
    }
  });
}

function ensureTimingOrderPanel() {
  if (timingOrderBackdropEl) return timingOrderBackdropEl;
  // These sections are part of the Layout panel and live in index.html, so
  // there is no backdrop to build - only handlers to bind. The variable keeps
  // its name because the panel's 32 element lookups go through it.
  const inPanel = document.getElementById("anchorTimingSections");
  if (inPanel) {
    timingOrderBackdropEl = inPanel;
    bindTimingOrderPanel();
    return timingOrderBackdropEl;
  }
  timingOrderBackdropEl = document.createElement("div");
  timingOrderBackdropEl.className = "timing-order-backdrop";
  timingOrderBackdropEl.setAttribute("aria-hidden", "true");
  timingOrderBackdropEl.innerHTML = `
    <div class="timing-order-layout" role="dialog" aria-modal="true" aria-label="Stagger and layer order">
      <section class="timing-order-card timing-stagger-card">
        <header class="timing-order-head tnt-card-head">
          <div class="tnt-card-title timing-order-title"><b>ST</b><span>Stagger</span><em class="timing-order-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-execute-actions" role="group" aria-label="Choose stagger direction">
            <button type="button" data-stagger-execute="asc" data-icon="arrow-up-narrow-wide" data-tooltip="Bottom Up\nUse the bottom selected layer as the first layer, then stagger upward."><strong>Bottom up</strong><span>Stagger upward</span></button>
            <button type="button" data-stagger-execute="desc" data-icon="arrow-down-wide-narrow" data-tooltip="Top Down\nUse the top selected layer as the first layer, then stagger downward."><strong>Top down</strong><span>Stagger downward</span></button>
            <button type="button" data-stagger-execute="random" data-icon="shuffle" data-tooltip="Random Stagger\nShuffle the selected layers once, then use the slider to set the offset."><strong>Random</strong><span>Shuffle timing</span></button>
          </div>
          <div class="timing-order-field">
            <span>Offset / gap</span>
            <div class="timing-amount-row">
              <input class="timing-amount-range" type="range" min="0" max="60" step="1" value="0" data-tooltip="Apply Stagger\nChoose a direction above, then drag to apply the offset from the original layer positions.">
              <input class="timing-amount-input" type="number" min="0" step="1" value="0" data-tooltip="Exact Offset\nEnter an exact amount. The selected stagger direction applies from the original layer positions.">
              <label class="timing-group-control" data-tooltip="Group Size\nRepeat offsets inside groups. 1 staggers every selected layer in one run.">
                <span>Group</span>
                <input class="timing-group-input" type="number" min="1" step="1" value="1">
              </label>
              <div class="timing-order-segmented timing-unit" role="group" aria-label="Timing unit">
                <button type="button" data-timing-unit="frames" data-tooltip="Frames\nMeasure the offset using composition frames.">F</button>
                <button type="button" data-timing-unit="seconds" data-tooltip="Seconds\nMeasure the offset using seconds.">S</button>
              </div>
            </div>
            <div class="timing-live-status">Choose a direction, then move the slider to apply.</div>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>

      <section class="timing-order-card layer-order-card">
        <header class="timing-order-head tnt-card-head">
          <div class="tnt-card-title timing-order-title"><b>OR</b><span>Layer Order</span><em class="timing-order-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-order-field">
            <span>Direction</span>
            <div class="timing-order-segmented order-direction" role="group" aria-label="Layer order direction">
              <button type="button" data-order-direction="asc" data-tooltip="Ascending\nSmallest value goes to the bottom of the selected stack.">Ascending</button>
              <button type="button" data-order-direction="desc" data-tooltip="Descending\nLargest value goes to the top of the selected stack.">Descending</button>
            </div>
          </div>
          <div class="timing-order-field">
            <span>Sort selected layers</span>
            <div class="timing-execute-actions order-sort-actions" role="group" aria-label="Sort selected layers">
              <button type="button" data-order-sort="in" data-icon="chevrons-left" data-tooltip="By In Point\nSort selected layers by in point."><strong>In point</strong><span>Layer start</span></button>
              <button type="button" data-order-sort="out" data-icon="chevrons-right" data-tooltip="By Out Point\nSort selected layers by out point."><strong>Out point</strong><span>Layer end</span></button>
              <button type="button" data-order-sort="x" data-icon="move-horizontal" data-tooltip="By X Position\nSort selected layers by Position X at the current time."><strong>X position</strong><span>Left to right</span></button>
              <button type="button" data-order-sort="y" data-icon="move-vertical" data-tooltip="By Y Position\nSort selected layers by Position Y at the current time."><strong>Y position</strong><span>Top to bottom</span></button>
                <button type="button" data-order-sort="distance" data-icon="ruler" data-tooltip="By Distance\nSort selected layers by how far each one sits from the last layer in the selection, measured at the current time."><strong>Distance</strong><span>From last selected</span></button>
              <button type="button" data-order-sort="firstKey" data-icon="skip-back" data-tooltip="Earliest Keyframe\nSort by each layer's earliest keyframe. Layers with no keys use their in point."><strong>First key</strong><span>Earliest key</span></button>
              <button type="button" data-order-sort="lastKey" data-icon="skip-forward" data-tooltip="Last Keyframe\nSort by each layer's latest keyframe. Layers with no keys use their in point."><strong>Last key</strong><span>Latest key</span></button>
              <button type="button" data-order-sort="random" data-icon="shuffle" data-tooltip="Randomize\nShuffle selected layers and move the shuffled selection to the top of the stack."><strong>Random</strong><span>Shuffle stack</span></button>
            </div>
          </div>
          <div class="timing-execute-actions order-stack-actions" role="group" aria-label="Send selected layers">
            <button type="button" data-order-stack="top" data-icon="arrow-up-to-line" data-tooltip="Send to Top\nMove the selected layers to the top of the composition stack while preserving their order."><strong>Send to top</strong><span>Top of layer stack</span></button>
            <button type="button" data-order-stack="reverse" data-icon="flip-vertical-2" data-tooltip="Reverse Layer Order  (R)\nReverse the selected layers inside their current stack slots. The unselected layers do not move."><strong>Reverse</strong><span>Reverse selected stack</span></button>
            <button type="button" data-order-stack="bottom" data-icon="arrow-down-to-line" data-tooltip="Send to Bottom\nMove the selected layers to the bottom of the composition stack while preserving their order."><strong>Send to bottom</strong><span>Bottom of layer stack</span></button>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>

      <section class="timing-order-card timing-snap-pull-card">
        <header class="timing-order-head tnt-card-head">
          <div class="tnt-card-title timing-order-title"><b>SP</b><span>Pull / Snap</span><em class="timing-key-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-compact-group timing-pull-group">
            <div class="timing-compact-head">
              <strong>Pull whole selection</strong>
              <span>Move the selected layer group together</span>
            </div>
            <div class="timing-execute-actions timing-two-actions" role="group" aria-label="Pull layer group">
              <button type="button" data-pull-layer="in" data-icon="arrow-right-to-line" data-tooltip="Pull Group In\nMove the whole selected layer group so the earliest in point lands at the playhead."><strong>In to playhead</strong><span>Keep spacing</span></button>
              <button type="button" data-pull-layer="out" data-icon="arrow-left-to-line" data-tooltip="Pull Group Out\nMove the whole selected layer group so the latest out point lands at the playhead."><strong>Out to playhead</strong><span>Keep spacing</span></button>
            </div>
          </div>
          <div class="timing-compact-group timing-snap-group">
            <div class="timing-compact-head">
              <strong>Snap smaller groups</strong>
              <span>Move layers, properties, or selected key groups independently</span>
            </div>
            <div class="timing-snap-grid">
              <div class="timing-snap-scope">
                <span>Layers</span>
                <button type="button" data-snap-layer="in" data-tooltip="Snap Layer In Points\nMove each selected layer independently so its in point lands at the playhead.">In</button>
                <button type="button" data-snap-layer="out" data-tooltip="Snap Layer Out Points\nMove each selected layer independently so its out point lands at the playhead.">Out</button>
              </div>
              <div class="timing-snap-scope">
                <span>Properties</span>
                <button type="button" data-snap-keyframes="first" data-key-scope="property" data-tooltip="Snap Each Property First Key\nMove selected keys on each property so that property's first selected key lands at the playhead.">First</button>
                <button type="button" data-snap-keyframes="last" data-key-scope="property" data-tooltip="Snap Each Property Last Key\nMove selected keys on each property so that property's last selected key lands at the playhead.">Last</button>
              </div>
              <div class="timing-snap-scope">
                <span>Key groups</span>
                <button type="button" data-snap-keyframes="first" data-key-scope="layer" data-tooltip="Snap Key Group First\nMove selected keys as layer groups so each group's first selected key lands at the playhead.">First</button>
                <button type="button" data-snap-keyframes="last" data-key-scope="layer" data-tooltip="Snap Key Group Last\nMove selected keys as layer groups so each group's last selected key lands at the playhead.">Last</button>
              </div>
            </div>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>
    </div>
  `;
  document.body.appendChild(timingOrderBackdropEl);
  bindTimingOrderPanel();
  return timingOrderBackdropEl;
}

function captureTimingOrderBaseline() {
  timingOrderBaseKeyTimes = null;
  if (timingOrderStaggerTarget() === "keyframes") {
    timingOrderBaseKeyTimes = (selectedKeyframes || []).map(key => ({
      layerIndex: Number(key.layerIndex || 0),
      propertyPath: String(key.propertyPath || ""),
      keyIndex: Number(key.keyIndex || 0),
      time: Number(key.time || 0)
    })).filter(key => key.layerIndex && key.propertyPath && key.keyIndex && Number.isFinite(key.time));
    timingOrderBaseStartTimes = null;
    timingOrderStaggerOrderIndices = null;
    return;
  }
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const selectedLayers = (state.layers || [])
    .filter(layer => selected.has(Number(layer.index)))
    .map(layer => ({ index: Number(layer.index), startTime: Number(layer.startTime || 0) }));
  timingOrderBaseStartTimes = selectedLayers.map(layer => ({ index: layer.index, startTime: layer.startTime }));
  timingOrderStaggerOrderIndices = null;
  if (timingOrderDirection === "random") {
    const indices = selectedLayers.map(layer => layer.index);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    timingOrderStaggerOrderIndices = indices;
  }
}

function resetTimingOrderStaggerState() {
  timingOrderDirection = "asc";
  timingOrderBaseStartTimes = null;
  timingOrderBaseKeyTimes = null;
  timingOrderStaggerOrderIndices = null;
  if (timingOrderLiveTimer) clearTimeout(timingOrderLiveTimer);
  timingOrderLiveTimer = null;
  timingOrderLivePending = false;
}

function scheduleTimingStaggerApply(options = {}) {
  if (!timingOrderBackdropEl || !timingOrderDirection || timingOrderStaggerCount() < 2) return;
  if (timingOrderStaggerTarget() === "keyframes") {
    if (!timingOrderBaseKeyTimes || !timingOrderBaseKeyTimes.length) captureTimingOrderBaseline();
  } else if (!timingOrderBaseStartTimes || !timingOrderBaseStartTimes.length) {
    captureTimingOrderBaseline();
  }
  if (timingOrderLiveTimer) clearTimeout(timingOrderLiveTimer);
  const delay = options.immediate ? 0 : 220;
  timingOrderLiveTimer = setTimeout(() => {
    timingOrderLiveTimer = null;
    runTimingPanelAction("stagger", timingOrderDirection, { live: true });
  }, delay);
}

function updateTimingOrderRangeFill() {
  if (!timingOrderBackdropEl) return;
  const input = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

function renderTimingOrderPanel() {
  if (!timingOrderBackdropEl) return;
  // The status line and the error line are filled independently and land on
  // the same sentence when a section is unusable, printing it twice.
  const dedupeMessages = () => {
    timingOrderBackdropEl.querySelectorAll(".timing-order-card").forEach(card => {
      const status = card.querySelector(".timing-live-status");
      const error = card.querySelector(".timing-order-error");
      if (!status || !error) return;
      if (status.textContent.trim() && status.textContent.trim() === error.textContent.trim()) {
        error.textContent = "";
      }
    });
  };
  setTimeout(dedupeMessages, 0);
  const count = timingOrderSelectedCount();
  const keyCount = timingOrderSelectedKeyCount();
  const staggerTarget = timingOrderStaggerTarget();
  const staggerCount = timingOrderStaggerCount();
  const staggerCountEl = timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-count");
  if (staggerCountEl) {
    staggerCountEl.textContent = staggerTarget === "keyframes"
      ? `${keyCount} key${keyCount === 1 ? "" : "s"}`
      : `${count} layer${count === 1 ? "" : "s"}`;
  }
  timingOrderBackdropEl.querySelectorAll(".layer-order-card .timing-order-count").forEach(el => {
    el.textContent = `${count} layer${count === 1 ? "" : "s"}`;
  });
  timingOrderBackdropEl.querySelectorAll("[data-timing-unit]").forEach(button => {
    button.classList.toggle("active", button.dataset.timingUnit === timingOrderUnit);
  });
  timingOrderBackdropEl.querySelectorAll("[data-stagger-execute]").forEach(button => {
    button.disabled = staggerCount < 2;
    button.classList.toggle("active", !!timingOrderDirection && button.dataset.staggerExecute === timingOrderDirection);
  });
  const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
  const groupInput = timingOrderBackdropEl.querySelector(".timing-group-input");
  const amountDisabled = staggerCount < 2 || !timingOrderDirection;
  if (amountRange) amountRange.disabled = amountDisabled;
  if (amountInput) amountInput.disabled = amountDisabled;
  if (groupInput) groupInput.disabled = amountDisabled;
  const liveStatus = timingOrderBackdropEl.querySelector(".timing-live-status");
  if (liveStatus) {
    liveStatus.textContent = staggerCount < 2
      ? (staggerTarget === "keyframes" ? "Select at least two keyframes to stagger." : "Select at least two layers to stagger.")
      : (timingOrderDirection
        ? `Slider applies from the original ${staggerTarget === "keyframes" ? "keyframe" : "layer"} positions.`
        : `Choose a direction, then move the slider to stagger ${staggerTarget}.`);
  }
  timingOrderBackdropEl.querySelectorAll("[data-order-direction]").forEach(button => {
    button.classList.toggle("active", button.dataset.orderDirection === layerOrderDirection);
  });
  timingOrderBackdropEl.querySelectorAll("[data-order-sort]").forEach(button => {
    button.disabled = count < 2;
    button.classList.toggle("active", button.dataset.orderSort === layerOrderBasis);
  });
  timingOrderBackdropEl.querySelectorAll("[data-order-stack]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-error").textContent =
    staggerCount < 2
      ? (staggerTarget === "keyframes" ? "Select at least two keyframes to stagger." : "Select at least two layers to stagger.")
      : "";
  timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error").textContent =
    count < 2 ? "Select at least two layers to sort." : "";
  const keyCountEl = timingOrderBackdropEl.querySelector(".timing-key-count");
  if (keyCountEl) keyCountEl.textContent = `${keyCount} key${keyCount === 1 ? "" : "s"}`;
  timingOrderBackdropEl.querySelectorAll("[data-pull-layer]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelectorAll("[data-snap-layer]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelectorAll("[data-snap-keyframes]").forEach(button => {
    button.disabled = keyCount < 1;
  });
  const snapError = timingOrderBackdropEl.querySelector(".timing-snap-pull-card .timing-order-error");
  if (snapError) snapError.textContent = count < 1 ? "Select at least one layer." : "";
  updateTimingOrderRangeFill();
}

async function runTimingPanelAction(action, direction = timingOrderDirection, options = {}) {
  const target = timingOrderStaggerTarget();
  if (!timingOrderBackdropEl || timingOrderStaggerCount() < 2) return;
  if (action === "stagger" && !direction) return;
  if (options.live && timingOrderLiveInFlight) {
    timingOrderLivePending = true;
    return;
  }
  const amount = Math.max(0, Number(timingOrderBackdropEl.querySelector(".timing-amount-input").value || 0));
  const groupSize = Math.max(1, Math.round(Number(timingOrderBackdropEl.querySelector(".timing-group-input").value || 1)));
  const error = timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-error");
  error.textContent = "";
  timingOrderLiveInFlight = !!options.live;
  const timingOptions = {
    direction,
    amount,
    unit: timingOrderUnit,
    group: groupSize
  };
  if (target === "keyframes") {
    timingOptions.baseKeyTimes = timingOrderBaseKeyTimes || [];
    await runKeyframeTimingAction(action, timingOptions);
  } else {
    timingOptions.baseStartTimes = timingOrderBaseStartTimes || [];
    timingOptions.orderIndices = timingOrderStaggerOrderIndices || [];
    await runLayerTimingAction(action, timingOptions);
  }
  timingOrderLiveInFlight = false;
  renderTimingOrderPanel();
  if (timingOrderLivePending) {
    timingOrderLivePending = false;
    scheduleTimingStaggerApply({ immediate: true });
  }
}

async function runLayerOrderPanelAction(mode) {
  const error = timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error");
  error.textContent = "";
  layerOrderBasis = mode || layerOrderBasis || "in";
  await sortSelectedLayersByOrder(mode, layerOrderDirection);
  renderTimingOrderPanel();
}

async function runLayerStackPanelAction(mode) {
  const error = timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error");
  error.textContent = "";
  await moveSelectedLayersInStack(mode);
  renderTimingOrderPanel();
}

async function runSnapPullPanelAction(action, target, anchor, options = {}) {
  const error = timingOrderBackdropEl.querySelector(".timing-snap-pull-card .timing-order-error");
  if (error) error.textContent = "";
  if (target === "keyframes") {
    await runKeyframeTimingAction(action, Object.assign({ anchor }, options));
  } else {
    await runLayerTimingAction(action, { anchor });
  }
  renderTimingOrderPanel();
}

function showTimingOrderPanel() {
  if (typeof tntPaintSelectionReadouts === "function") setTimeout(() => tntPaintSelectionReadouts(document), 0);
  const panel = ensureTimingOrderPanel();
  if (panel.classList.contains("show")) {
    hideTimingOrderPanel();
    return;
  }
  resetTimingOrderStaggerState();
  const amountRange = panel.querySelector(".timing-amount-range");
  const amountInput = panel.querySelector(".timing-amount-input");
  const groupInput = panel.querySelector(".timing-group-input");
  if (amountRange) amountRange.value = "0";
  if (amountInput) amountInput.value = "0";
  if (groupInput) groupInput.value = "1";
  captureTimingOrderBaseline();
  renderTimingOrderPanel();
  panel.classList.add("show");
  panel.setAttribute("aria-hidden", "false");
}

function hideTimingOrderPanel() {
  if (!timingOrderBackdropEl) return;
  resetTimingOrderStaggerState();
  timingOrderBackdropEl.classList.remove("show");
  timingOrderBackdropEl.setAttribute("aria-hidden", "true");
}
