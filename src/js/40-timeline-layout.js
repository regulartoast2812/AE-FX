function packLayers(layers) {
  // Compact, stack-aware interval packing.
  // Goal:
  // 1. Minimize visible track count like Premiere/RailCut.
  // 2. Preserve AE visual stack only where layers actually overlap in time.
  //    AE layer 1 stays above layer 2 if they overlap, but non-overlapping
  //    layers are free to reuse the same lane.
  // 3. Prefer visual continuity: reuse the lane whose previous clip ends
  //    closest to this clip's in point.
  const sorted = [...layers].sort((a, b) => {
    const dt = Number(a.inPoint) - Number(b.inPoint);
    if (Math.abs(dt) > 1e-5) return dt;
    return a.index - b.index; // AE stack order for simultaneous starts
  });

  const lanes = [];
  const placed = [];

  function laneHasOverlap(lane, layer) {
    return lane.some(existing => intervalsOverlap(existing, layer));
  }

  function insertEmptyLane(at) {
    lanes.splice(at, 0, []);
    placed.forEach(item => {
      if (item.lane >= at) item.lane += 1;
    });
  }

  sorted.forEach(layer => {
    const activeOverlaps = placed.filter(item => intervalsOverlap(item.layer, layer));

    // Lane constraints from overlapping AE layers.
    // Smaller AE index means visually above, therefore smaller lane number.
    let minLane = 0;
    let maxLane = Infinity;
    activeOverlaps.forEach(item => {
      if (item.layer.index < layer.index) {
        minLane = Math.max(minLane, item.lane + 1);
      } else if (item.layer.index > layer.index) {
        maxLane = Math.min(maxLane, item.lane - 1);
      }
    });

    let bestLane = -1;
    let bestScore = Infinity;

    for (let i = minLane; i < lanes.length && i <= maxLane; i++) {
      if (laneHasOverlap(lanes[i], layer)) continue;

      const previous = lanes[i]
        .filter(l => l.outPoint <= layer.inPoint + 1e-5)
        .sort((a, b) => b.outPoint - a.outPoint)[0];

      // Lower score = better. Prefer close temporal continuity, then compact top lanes.
      const gap = previous ? Math.max(0, layer.inPoint - previous.outPoint) : 9999;
      const stackDrift = previous ? Math.abs(previous.index - layer.index) * 0.015 : 0;
      const topBias = i * 0.05;
      const score = gap + stackDrift + topBias;
      if (score < bestScore) {
        bestScore = score;
        bestLane = i;
      }
    }

    if (bestLane < 0) {
      // Need a new lane. Insert it where the AE overlap constraints require it,
      // instead of always adding at the bottom. This prevents high-priority/top
      // AE layers from being pushed far down by earlier non-overlapping clips.
      if (minLane > lanes.length) minLane = lanes.length;
      insertEmptyLane(minLane);
      bestLane = minLane;
    }

    lanes[bestLane].push(layer);
    lanes[bestLane].sort((a, b) => a.inPoint - b.inPoint || a.index - b.index);
    placed.push({ layer, lane: bestLane });
  });

  // Remove any accidental empty lanes after insert/shift operations.
  return lanes.filter(lane => lane.length > 0);
}
function getVisibleRange() {
  if (!state.comp) return { start: 0, duration: 10, end: 10 };

  // Use the full comp duration for the visible timeline range.
  // Earlier versions used the work area, which made a 10s comp stop early
  // whenever the work area was shorter/offset. The ruler should behave like
  // AE's timeline header: 0s at the left edge, comp duration at the right edge
  // when fitted to panel.
  const start = 0;
  const duration = Math.max(0.1, Number(state.comp.duration || state.comp.workAreaDuration || 10));
  return { start, duration, end: start + duration };
}

function fittedPixelsPerSecond() {
  if (!state.comp) return pixelsPerSecond;
  const range = getVisibleRange();
  const available = Math.max(240, timelineViewportWidth() - currentLeftGutter());
  return Math.max(1, Math.min(MAX_PIXELS_PER_SECOND, available / range.duration));
}

function timelineViewportWidth() {
  const rectWidth = scrollAreaEl ? Math.round(scrollAreaEl.getBoundingClientRect().width) : 0;
  return Math.max(
    1,
    scrollAreaEl ? scrollAreaEl.clientWidth : 0,
    rectWidth,
    window.innerWidth || 0,
    document.documentElement ? document.documentElement.clientWidth : 0
  );
}

function timelineContentWidth() {
  return Math.max(timelineViewportWidth(), currentLeftGutter() + visibleDuration * pixelsPerSecond);
}

function fitTimelineToPanel(force = false) {
  if (!state.comp) return;
  const fitPps = fittedPixelsPerSecond();

  // Default is exact fit. If user zoomed in, preserve it.
  // But never allow a zoomed-out/old pps that leaves blank space at the right;
  // this guarantees the comp end marker, e.g. 10s, lands at the panel end.
  if (force || !userZoomed || pixelsPerSecond < fitPps) {
    pixelsPerSecond = fitPps;
    if (pixelsPerSecond === fitPps) userZoomed = false;
  }
}

function timeToX(time) {
  return Math.round(currentLeftGutter() + (Number(time || 0) - visibleStart) * pixelsPerSecond);
}

function timeToPreciseX(time) {
  return currentLeftGutter() + (Number(time || 0) - visibleStart) * pixelsPerSecond;
}

function currentLeftGutter() {
  return LEFT_GUTTER;
}

function mixHex(a, b, amount = 0.5) {
  function parts(hex) {
    hex = String(hex || '#777777').replace('#','');
    if (hex.length !== 6) return [119,119,119];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  const ca = parts(a), cb = parts(b);
  const out = ca.map((v,i) => Math.round(v * (1 - amount) + cb[i] * amount));
  return '#' + out.map(v => v.toString(16).padStart(2,'0')).join('');
}

function saturateHex(hex, factor = 1.2) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return '#777777';
  let r = parseInt(hex.slice(0,2),16) / 255, g = parseInt(hex.slice(2,4),16) / 255, b = parseInt(hex.slice(4,6),16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  s = Math.max(0, Math.min(1, s * factor));
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  let rr, gg, bb;
  if (s === 0) rr = gg = bb = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rr = hue2rgb(p, q, h + 1/3); gg = hue2rgb(p, q, h); bb = hue2rgb(p, q, h - 1/3);
  }
  return '#' + [rr,gg,bb].map(v => Math.round(v * 255).toString(16).padStart(2,'0')).join('');
}

function darkerHex(hex, amount = 0.34) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return '#444444';
  const r = Math.max(0, Math.round(parseInt(hex.slice(0,2),16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(2,4),16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(4,6),16) * (1 - amount)));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function hexToRgba(hex, alpha) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return `rgba(180,180,180,${alpha})`;
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRuler() {
  const range = getVisibleRange();
  visibleStart = range.start;
  visibleDuration = range.duration;

  rulerEl.innerHTML = "";
  if (bottomRulerEl) bottomRulerEl.innerHTML = "";
  const totalWidth = timelineContentWidth();
  rulerEl.style.width = `${totalWidth}px`;
  rulerWrapEl.style.width = `${totalWidth}px`;
  if (bottomRulerEl) bottomRulerEl.style.width = `${totalWidth}px`;
  if (bottomRulerWrapEl) bottomRulerWrapEl.style.width = `${totalWidth}px`;
  if (topMarkerRailEl) topMarkerRailEl.style.width = `${totalWidth}px`;
  if (bottomMarkerRailEl) bottomMarkerRailEl.style.width = `${totalWidth}px`;
  updateFrameCheckerPattern();

  const firstSecond = Math.floor(visibleStart);
  const lastSecond = Math.ceil(range.end);
  const rulerSections = pixelsPerSecond >= 96 ? 4 : (pixelsPerSecond >= 56 ? 2 : 1);
  const showFrameLabels = pixelsPerSecond >= 120;
  for (let t = firstSecond; t <= lastSecond; t++) {
    for (let q = 0; q < rulerSections; q++) {
      const time = t + q / rulerSections;
      if (time < visibleStart - 1e-5 || time > range.end + 1e-5) continue;
      // Keep subdivisions mathematically even. Integer rounding each absolute
      // tick independently makes quarter-second gaps alternate by one pixel.
      const left = `${timeToPreciseX(time).toFixed(3)}px`;
      const tickClass = q === 0
        ? "tick tick-major"
        : `tick tick-minor tick-section tick-section-${q}${rulerSections === 4 && q === 2 ? " tick-half" : ""}`;

      const tick = document.createElement("div");
      tick.className = tickClass;
      tick.style.left = left;
      if (q === 0) {
        tick.innerHTML = showFrameLabels ? rulerTimeFrameLabel(t) : escapeHtml(formatRulerTime(t));
      } else if (showFrameLabels) {
        tick.innerHTML = `<span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
      }
      rulerEl.appendChild(tick);

      if (bottomRulerEl) {
        const bottomTick = document.createElement("div");
        bottomTick.className = tickClass;
        bottomTick.style.left = left;
        if (q === 0) {
          bottomTick.innerHTML = showFrameLabels ? rulerTimeFrameLabel(t) : escapeHtml(formatRulerTime(t));
        } else if (showFrameLabels) {
          bottomTick.innerHTML = `<span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
        }
        bottomRulerEl.appendChild(bottomTick);
      }
    }
  }
  updateHorizontalScrollBar();
}

function frameNumberAtTime(time) {
  return Math.max(0, Math.round(Number(time || 0) * currentFrameRate()));
}

function rulerFrameLabel(time) {
  return `f${frameNumberAtTime(time)}`;
}

function rulerTimeFrameLabel(time) {
  return `<span class="tick-time">${escapeHtml(formatRulerTime(time))}</span><span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
}

function updateFrameCheckerPattern() {
  const fps = Math.max(1, Number(state.comp && state.comp.frameRate || 30));
  const frameWidth = pixelsPerSecond / fps;
  const showCheckers = !!state.comp && pixelsPerSecond >= MAX_PIXELS_PER_SECOND - 0.01;
  document.body.classList.toggle("show-frame-checkers", showCheckers);
  timelineEl.style.setProperty("--frame-width", `${Math.max(1, frameWidth)}px`);
}

function syncBottomRulerPosition() {
  if (bottomRulerEl) bottomRulerEl.style.transform = `translateX(${-scrollAreaEl.scrollLeft}px)`;
  if (bottomMarkerRailEl) bottomMarkerRailEl.style.transform = `translateX(${-scrollAreaEl.scrollLeft}px)`;
  updateHorizontalScrollBar();
}

function updateHorizontalScrollBar() {
  if (!horizontalScrollBarEl || !horizontalScrollThumbEl) return;
  horizontalScrollBarEl.style.setProperty("left", `${currentLeftGutter()}px`, "important");
  horizontalScrollBarEl.style.setProperty("right", "0px", "important");
  const trackWidth = Math.max(1, horizontalScrollBarEl.clientWidth);
  const viewport = trackWidth;
  const content = Math.max(viewport, timelineContentWidth() - currentLeftGutter());
  if (content <= viewport + 1) {
    scrollAreaEl.scrollLeft = 0;
    horizontalScrollThumbEl.style.width = `${trackWidth}px`;
    horizontalScrollThumbEl.style.transform = "translateX(0px)";
    horizontalScrollBarEl.classList.add("disabled");
    return;
  }
  horizontalScrollBarEl.classList.remove("disabled");
  const thumbWidth = Math.max(36, Math.round(trackWidth * viewport / content));
  const maxThumbX = Math.max(0, trackWidth - thumbWidth);
  const maxScroll = Math.max(1, content - viewport);
  const thumbX = Math.round(maxThumbX * scrollAreaEl.scrollLeft / maxScroll);
  horizontalScrollThumbEl.style.width = `${thumbWidth}px`;
  horizontalScrollThumbEl.style.transform = `translateX(${thumbX}px)`;
}

function beginHorizontalScrollDrag(event) {
  if (!horizontalScrollBarEl || !horizontalScrollThumbEl || event.button !== 0) return;
  event.preventDefault();
  const trackRect = horizontalScrollBarEl.getBoundingClientRect();
  const viewport = Math.max(1, trackRect.width);
  const content = Math.max(viewport, timelineContentWidth() - currentLeftGutter());
  const maxScroll = Math.max(0, content - viewport);
  if (maxScroll <= 0) return;
  const thumbRect = horizontalScrollThumbEl.getBoundingClientRect();
  const trackWidth = Math.max(1, trackRect.width);
  const thumbWidth = Math.max(1, thumbRect.width);
  const maxThumbX = Math.max(1, trackWidth - thumbWidth);
  const startX = event.clientX;
  const startScroll = scrollAreaEl.scrollLeft;
  const clickedThumb = event.target === horizontalScrollThumbEl;

  if (!clickedThumb) {
    const targetThumbX = Math.max(0, Math.min(maxThumbX, event.clientX - trackRect.left - thumbWidth / 2));
    scrollAreaEl.scrollLeft = Math.round(targetThumbX / maxThumbX * maxScroll);
    updateHorizontalScrollBar();
  }

  const move = e => {
    const delta = e.clientX - startX;
    scrollAreaEl.scrollLeft = Math.max(0, Math.min(maxScroll, startScroll + delta / maxThumbX * maxScroll));
    updateHorizontalScrollBar();
  };
  const finish = () => {
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("mouseup", finish, true);
  };
  document.addEventListener("mousemove", move, true);
  document.addEventListener("mouseup", finish, true);
}

function updateStatus() {
  if (!state.comp) {
    statusEl.textContent = "Open a comp.";
    updateCompSelect([]);
    updateActiveFilterNotice();
    if (timeDisplayEl) timeDisplayEl.textContent = "0:00:00";
    return;
  }
  statusEl.textContent = `${state.comp.name} — ${visibleLayers().length}/${state.layers.length} layers${activeLayerFilter ? " • filter: " + activeLayerFilterLabel() : ""}`;
  updateCompSelect(state.comps || []);
  statusEl.textContent = `${visibleLayers().length}/${state.layers.length} layers${hasActiveLayerViewConstraint() ? " - " + activeLayerFilterScopeLabel() + (activeLayerFilter ? ": " + activeLayerFilterLabel() : " focus") : ""}${timelineMode === "keyframe" ? " - keyframes" : ""}${keyframeLayerFilter && keyframeLayerFilter.length ? " - focus" : ""}`;
  updateActiveFilterNotice();
  if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(state.comp.time);
  if (typeof renderTimingOrderPanel === "function") renderTimingOrderPanel();
}

function updateCompSelect(comps) {
  if (!compSelectEl || !compSelectButtonEl || !compSelectMenuEl) return;
  const list = comps && comps.length ? comps : (state.comp ? [{ id: state.comp.id || "", name: state.comp.name }] : []);
  compSelectUpdating = true;
  compSelectMenuEl.innerHTML = "";
  if (!list.length) {
    compSelectButtonEl.textContent = "No active comp";
    if (compSelectSearchEl) {
      compSelectSearchEl.value = "";
      compSelectSearchEl.placeholder = "No active comp";
      compSelectSearchEl.disabled = true;
    }
    compSelectButtonEl.disabled = true;
    compSelectUpdating = false;
    return;
  }
  compSelectButtonEl.disabled = false;
  if (compSelectSearchEl) compSelectSearchEl.disabled = false;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  list.forEach((comp, index) => {
    const item = document.createElement("button");
    const summary = formatCompSummary(comp);
    item.type = "button";
    item.className = "comp-select-item" + (String(comp.id || "") === activeId ? " active" : "");
    item.dataset.compId = String(comp.id || "");
    item.dataset.searchText = `${index + 1} ${comp.name || "Composition"} ${summary}`.toLowerCase();
    item.innerHTML = `<span class="comp-select-name">${index + 1}. ${escapeHtml(comp.name || "Composition")}</span><span class="comp-select-detail">${escapeHtml(summary)}</span>`;
    item.addEventListener("mousedown", e => e.preventDefault());
    item.addEventListener("click", () => {
      closeCompSelect();
      selectCompFromHeader(item.dataset.compId);
    });
    compSelectMenuEl.appendChild(item);
  });
  const active = list.find(comp => String(comp.id || "") === activeId) || list[0];
  const activeIndex = Math.max(0, list.indexOf(active)) + 1;
  const activeLabel = `${activeIndex}. ${active.name || "Composition"}`;
  compSelectButtonEl.textContent = activeLabel;
  if (compSelectSearchEl && !compSelectEl.classList.contains("open")) {
    compSelectSearchEl.value = "";
    compSelectSearchEl.placeholder = activeLabel;
  } else if (compSelectSearchEl) {
    filterCompSelectItems();
  }
  compSelectUpdating = false;
}

function compByIdMap() {
  const map = {};
  (state.comps || []).forEach(comp => { map[String(comp.id || "")] = comp; });
  return map;
}

function uniqueIds(ids) {
  const seen = {};
  return (ids || []).filter(id => {
    const key = String(id || "");
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function flowCompButton(comp, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "flow-node" + (className ? ` ${className}` : "");
  button.dataset.compId = String(comp.id || "");
  button.innerHTML = `<span>${escapeHtml(comp.name || "Composition")}</span><em>${escapeHtml(formatCompSummary(comp))}</em>`;
  button.addEventListener("click", () => {
    closeFlowChart();
    selectCompFromHeader(button.dataset.compId);
  });
  return button;
}

function renderFlowChart() {
  if (!flowChartBodyEl) return;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  const map = compByIdMap();
  const activeComp = map[activeId] || state.comp || null;
  const parentIds = activeComp ? uniqueIds(activeComp.parentIds || []) : [];
  const childIds = activeComp
    ? uniqueIds((activeComp.childIds || []).concat((state.layers || []).map(layer => layer.sourceCompId || 0)))
    : [];
  flowChartBodyEl.innerHTML = "";
  [
    { title: "Parents", ids: parentIds, empty: "No parent comps" },
    { title: "Current", ids: activeComp ? [activeComp.id] : [], empty: "No active comp", active: true },
    { title: "Precomps", ids: childIds, empty: "No precomps" }
  ].forEach((group, index) => {
    const column = document.createElement("div");
    column.className = "flow-column";
    const title = document.createElement("div");
    title.className = "flow-column-title";
    title.textContent = group.title;
    column.appendChild(title);
    if (!group.ids.length) {
      const empty = document.createElement("div");
      empty.className = "flow-empty";
      empty.textContent = group.empty;
      column.appendChild(empty);
    } else {
      group.ids.forEach(id => {
        const comp = map[String(id)] || (String(id) === activeId ? activeComp : null);
        if (comp) column.appendChild(flowCompButton(comp, group.active ? "active" : ""));
      });
    }
    flowChartBodyEl.appendChild(column);
    if (index < 2) {
      const connector = document.createElement("div");
      connector.className = "flow-connector";
      connector.textContent = "›";
      flowChartBodyEl.appendChild(connector);
    }
  });
  if (flowChartSubtitleEl) flowChartSubtitleEl.textContent = `${(state.comps || []).length} comps - click a node to open`;
}

function renderFlowGraph() {
  if (!flowChartBodyEl) return;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  const map = compByIdMap();
  const activeComp = map[activeId] || state.comp || null;
  const parentIds = activeComp ? uniqueIds(activeComp.parentIds || []) : [];
  const childIds = activeComp
    ? uniqueIds((activeComp.childIds || []).concat((state.layers || []).map(layer => layer.sourceCompId || 0)))
    : [];
  const parents = parentIds.map(id => map[String(id)]).filter(Boolean);
  const children = childIds.map(id => map[String(id)]).filter(Boolean);
  const sideCount = Math.max(parents.length, children.length, 1);
  const viewHeight = Math.max(240, sideCount * 58 + 88);
  const centerY = viewHeight / 2;
  const parentYs = flowNodeYs(parents.length, viewHeight);
  const childYs = flowNodeYs(children.length, viewHeight);

  flowChartBodyEl.innerHTML = "";
  const graph = document.createElement("div");
  graph.className = "flow-graph";
  graph.style.minHeight = `${viewHeight}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "flow-lines");
  svg.setAttribute("viewBox", `0 0 900 ${viewHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.innerHTML = `
    <defs>
      <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z"></path>
      </marker>
    </defs>
  `;
  parents.forEach((comp, index) => svg.appendChild(flowCurvePath(282, parentYs[index], 365, centerY)));
  children.forEach((comp, index) => svg.appendChild(flowCurvePath(535, centerY, 618, childYs[index])));
  graph.appendChild(svg);
  graph.appendChild(flowGraphColumn("Parents", parents, "left", parentYs, viewHeight));
  graph.appendChild(flowGraphCurrent(activeComp, centerY));
  graph.appendChild(flowGraphColumn("Precomps", children, "right", childYs, viewHeight));
  flowChartBodyEl.appendChild(graph);
  if (flowChartSubtitleEl) flowChartSubtitleEl.textContent = `${(state.comps || []).length} comps - click a node to open`;
}

function flowNodeYs(count, viewHeight) {
  if (!count) return [];
  if (count === 1) return [viewHeight / 2];
  const top = 52;
  const bottom = viewHeight - 52;
  const step = (bottom - top) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, index) => top + step * index);
}

function flowCurvePath(startX, startY, endX, endY) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const bend = Math.max(50, Math.abs(endX - startX) * 0.55);
  path.setAttribute("d", `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`);
  path.setAttribute("class", "flow-line");
  path.setAttribute("marker-end", "url(#flowArrow)");
  return path;
}

function flowGraphColumn(titleText, comps, side, ys, viewHeight) {
  const column = document.createElement("div");
  column.className = `flow-graph-column ${side}`;
  const title = document.createElement("div");
  title.className = "flow-column-title";
  title.textContent = titleText;
  column.appendChild(title);
  if (!comps.length) {
    const empty = document.createElement("div");
    empty.className = "flow-empty graph-empty";
    empty.textContent = side === "left" ? "No parent comps" : "No precomps";
    empty.style.top = `${viewHeight / 2}px`;
    column.appendChild(empty);
    return column;
  }
  comps.forEach((comp, index) => {
    const node = flowCompButton(comp);
    node.style.top = `${ys[index]}px`;
    column.appendChild(node);
  });
  return column;
}

function flowGraphCurrent(activeComp, centerY) {
  const column = document.createElement("div");
  column.className = "flow-graph-column center";
  const title = document.createElement("div");
  title.className = "flow-column-title";
  title.textContent = "Current";
  column.appendChild(title);
  const node = activeComp ? flowCompButton(activeComp, "active current") : document.createElement("div");
  if (!activeComp) {
    node.className = "flow-empty graph-empty";
    node.textContent = "No active comp";
  }
  node.style.top = `${centerY}px`;
  column.appendChild(node);
  return column;
}

function openFlowChart() {
  if (!flowChartOverlayEl) return;
  renderFlowGraph();
  flowChartOverlayEl.classList.add("open");
  flowChartOverlayEl.setAttribute("aria-hidden", "false");
}

function closeFlowChart() {
  if (!flowChartOverlayEl) return;
  flowChartOverlayEl.classList.remove("open");
  flowChartOverlayEl.setAttribute("aria-hidden", "true");
}

function toggleFlowChart() {
  if (!flowChartOverlayEl) return;
  if (flowChartOverlayEl.classList.contains("open")) closeFlowChart();
  else openFlowChart();
}

function formatCompSummary(comp) {
  if (!comp) return "";
  const size = comp.width && comp.height ? `${comp.width}x${comp.height}` : "";
  const duration = typeof comp.duration === "number" ? formatTime(comp.duration) : "";
  const kind = comp.usedAsPrecomp ? "Precomp" : "Main";
  return [duration, size, kind].filter(Boolean).join(" - ");
}

function filterCompSelectItems() {
  if (!compSelectMenuEl) return null;
  const query = String(compSelectSearchEl && compSelectSearchEl.value || "").trim().toLowerCase();
  let firstVisible = null;
  let visibleCount = 0;
  compSelectMenuEl.querySelectorAll(".comp-select-item").forEach(item => {
    const text = String(item.dataset.searchText || item.textContent || "").toLowerCase();
    const visible = !query || text.includes(query);
    item.hidden = !visible;
    item.classList.toggle("search-match", visible && !!query);
    if (visible) {
      visibleCount += 1;
      if (!firstVisible) firstVisible = item;
    }
  });
  let empty = compSelectMenuEl.querySelector(".comp-select-empty");
  if (!visibleCount) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "comp-select-empty";
      empty.textContent = "No matching comps";
      compSelectMenuEl.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
  return firstVisible;
}

function openCompSelect() {
  if (!compSelectEl || !compSelectMenuEl) return;
  compSelectEl.classList.add("open");
  compSelectMenuEl.setAttribute("aria-hidden", "false");
  if (compSelectSearchEl) {
    compSelectSearchEl.value = "";
    filterCompSelectItems();
    requestAnimationFrame(() => {
      compSelectSearchEl.focus();
      compSelectSearchEl.select();
    });
  }
  compSelectMenuEl.scrollTop = 0;
}

function closeCompSelect() {
  if (!compSelectEl || !compSelectMenuEl) return;
  compSelectEl.classList.remove("open");
  compSelectMenuEl.setAttribute("aria-hidden", "true");
  if (compSelectSearchEl) {
    compSelectSearchEl.value = "";
    filterCompSelectItems();
    compSelectSearchEl.blur();
  }
}

function toggleCompSelect() {
  if (!compSelectEl || !compSelectMenuEl || !compSelectButtonEl || compSelectButtonEl.disabled) return;
  if (compSelectEl.classList.contains("open")) closeCompSelect();
  else openCompSelect();
}

async function selectCompFromHeader(compId) {
  if (!compId) return;
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  focusPanel(2);
  await loadJSX();
  const result = await aeCall("TNT_setActiveCompById", [Number(compId)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not switch comp.";
    return;
  }
  userZoomed = false;
  selectedKeyframes = [];
  await refreshLayers({ forceRender: true });
  focusPanel(5);
}

async function openLayerSourceComp(layer) {
  if (!layer || !layer.sourceCompId) return false;
  await selectCompFromHeader(layer.sourceCompId);
  return true;
}

function keyframeModeRowCount() {
  if (timelineMode !== "keyframe") return 0;
  return buildKeyframeRows().length || 1;
}

function timelineContentHeight(fallbackRows = 1) {
  const fallbackHeight = Math.max(1, fallbackRows) * TRACK_HEIGHT;
  return Math.max(fallbackHeight, timelineEl ? timelineEl.scrollHeight : 0);
}

function scrollContentViewportHeight() {
  return scrollAreaEl ? Math.max(scrollAreaEl.scrollHeight, scrollAreaEl.scrollTop + scrollAreaEl.clientHeight) : 0;
}

function updatePlayhead(options = {}) {
  const time = typeof options.time === "number" ? options.time : (state.comp ? state.comp.time || 0 : 0);
  const x = options.fast ? timeToPreciseX(time) : timeToX(time);
  if (options.fast) {
    playheadEl.style.left = "0px";
    playheadEl.style.transform = `translate3d(${x.toFixed(3)}px, 0, 0)`;
  } else {
    playheadEl.style.transform = "";
    playheadEl.style.left = `${x}px`;
  }
  if (options.fast) return;
  const trackCount = timelineMode === "keyframe"
    ? keyframeModeRowCount()
    : (state.comp && state.layers.length ? Math.max(1, packLayers(visibleLayers()).length) : Math.max(1, timelineEl.children.length || 1));
  const height = Math.max(42 + timelineContentHeight(trackCount), scrollContentViewportHeight());
  if (height !== lastPlayheadHeight || trackCount !== lastPlayheadTrackCount || options.forceHeight) {
    lastPlayheadHeight = height;
    lastPlayheadTrackCount = trackCount;
    // Extend through the panel, not just the populated tracks.
    playheadEl.style.height = `${height}px`;
  }
}

function markerTitle(marker, prefix) {
  const label = markerText(marker) || "Marker";
  const dur = Number(marker && marker.duration || 0);
  const region = dur > 0 ? ` → ${formatTime((marker.time || 0) + dur)}` : "";
  const protectedText = marker && marker.protectedRegion ? " • Protected region" : "";
  return `${prefix}: ${label} @ ${formatTime(marker.time || 0)}${region}${protectedText}`;
}

function markerText(marker) {
  return marker && (marker.comment || marker.chapter || marker.cuePointName || marker.url || "");
}

function markerColor(marker) {
  const idx = marker && typeof marker.label !== "undefined" ? Number(marker.label) : 0;
  if (!idx) return "#ffffff";
  return labelColor(idx) || "#b8b8b8";
}

function markerHasNoLabelColor(marker) {
  const idx = marker && typeof marker.label !== "undefined" ? Number(marker.label) : 0;
  return !idx;
}

function markerEnd(marker) {
  return Number(marker.time || 0) + Math.max(0, Number(marker.duration || 0));
}

function clampMarkerTime(time, min = 0, max = state.comp ? state.comp.duration : Infinity) {
  return Math.max(min, Math.min(max, Number(time || 0)));
}

function snapTimeToFrame(time) {
  const fps = currentFrameRate();
  const clamped = Math.max(0, Math.min(state.comp ? state.comp.duration : Number(time || 0), Number(time || 0)));
  return Math.round(clamped * fps) / fps;
}

function snapTargetTimes(options = {}) {
  if (!state.comp) return [];
  const targets = [0, Number(state.comp.duration || 0)];
  (state.compMarkers || []).forEach(marker => {
    if (options.excludeType === "comp" && Number(options.excludeKey) === Number(marker.keyIndex)) return;
    targets.push(Number(marker.time || 0));
    if (Number(marker.duration || 0) > 0) targets.push(markerEnd(marker));
  });
  (state.layers || []).forEach(layer => {
    targets.push(Number(layer.inPoint || 0), Number(layer.outPoint || 0));
    (layer.animatedProperties || []).forEach(property => {
      (property.keyframes || []).forEach(keyframe => {
        if (
          options.excludeType === "keyframe" &&
          Number(options.excludeLayerIndex) === Number(layer.index) &&
          String(options.excludePropertyPath || "") === String(property.path || "") &&
          Number(options.excludeKey) === Number(keyframe.keyIndex)
        ) return;
        const t = Number(keyframe.time || 0);
        if (Number.isFinite(t)) targets.push(t);
      });
    });
    (layer.markers || []).forEach(marker => {
      if (
        options.excludeType === "layer" &&
        Number(options.excludeLayerIndex) === Number(layer.index) &&
        Number(options.excludeKey) === Number(marker.keyIndex)
      ) return;
      targets.push(Number(marker.time || 0));
      if (Number(marker.duration || 0) > 0) targets.push(markerEnd(marker));
    });
  });
  const min = typeof options.minTime === "number" ? options.minTime : 0;
  const max = typeof options.maxTime === "number" ? options.maxTime : Number(state.comp.duration || 0);
  return targets
    .filter(time => Number.isFinite(time) && time >= min - 1e-6 && time <= max + 1e-6)
    .map(time => snapTimeToFrame(Math.max(min, Math.min(max, time))));
}

function snapTimeToTargets(time, options = {}) {
  const framed = snapTimeToFrame(time);
  if (!options.targetSnap) return { time: framed, target: false };
  const threshold = Math.max(1 / currentFrameRate() * 0.5, 10 / Math.max(1, pixelsPerSecond));
  let best = framed;
  let bestDistance = Infinity;
  snapTargetTimes(options).forEach(target => {
    const distance = Math.abs(target - framed);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  });
  return bestDistance <= threshold ? { time: best, target: true } : { time: framed, target: false };
}

function ensureSnapGuide() {
  if (snapGuideEl) return snapGuideEl;
  snapGuideEl = document.createElement("div");
  snapGuideEl.className = "snap-guide";
  snapGuideEl.setAttribute("aria-hidden", "true");
  scrollAreaEl.appendChild(snapGuideEl);
  return snapGuideEl;
}

function showSnapGuide(time, active = true, snapped = false) {
  if (!active || !snapped || !state.comp) {
    hideSnapGuide();
    return;
  }
  const guide = ensureSnapGuide();
  const trackCount = timelineMode === "keyframe"
    ? keyframeModeRowCount()
    : (state.layers.length ? Math.max(1, packLayers(visibleLayers()).length) : Math.max(1, timelineEl.children.length || 1));
  guide.style.left = `${timeToX(time)}px`;
  guide.style.height = `${Math.max(scrollAreaEl.scrollHeight, 42 + timelineContentHeight(trackCount))}px`;
  guide.classList.toggle("snapped", !!snapped);
  guide.classList.add("show");
}

function hideSnapGuide() {
  if (snapGuideEl) snapGuideEl.classList.remove("show", "snapped");
}

function beginMarkerDrag(event, marker, options = {}) {
  if (!state.comp || event.button !== 0) return;
  if (event.detail > 1) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const markerType = options.type || "comp";
  const dragMode = options.mode || "move"; // move | in | out
  const layerIndex = options.layerIndex || 0;
  const minTime = typeof options.minTime === "number" ? options.minTime : 0;
  const maxTime = typeof options.maxTime === "number" ? options.maxTime : state.comp.duration;
  const startPointerTime = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const originalTime = snapTimeToFrame(Number(marker.time || 0));
  const originalEnd = snapTimeToFrame(originalTime + Math.max(0, Number(marker.duration || 0)));
  const originalDuration = Math.max(0, originalEnd - originalTime);

  isMarkerDragging = true;
  suppressSyncUntil = Date.now() + 60000;
  document.body.classList.add(dragMode === "move" ? "marker-moving" : "marker-resizing");
  if (dragMode === "in") document.body.classList.add("marker-dragging-in");
  if (dragMode === "out") document.body.classList.add("marker-dragging-out");
  if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.add("is-dragging");
  let activeHandle = event.currentTarget;
  let previewTime = originalTime;
  let previewDuration = originalDuration;
  let previewFrame = 0;
  const dragRail = activeHandle ? activeHandle.closest('.marker-rail, .clip') : null;
  const dragVisuals = activeHandle ? Array.from(document.querySelectorAll(`[data-marker-key="${marker.keyIndex}"][data-marker-type="${markerType}"]`)) : [];

  const visualXFor = (el, t) => {
    // Layer marker elements live inside a clipped layer div, so their left value is
    // relative to the visible clip start. Comp marker/ruler/timeline elements use
    // the absolute timeline x.
    const clip = el && el.closest ? el.closest('.clip') : null;
    if (clip && typeof clip.dataset.clipStart !== 'undefined') {
      return (Number(t || 0) - Number(clip.dataset.clipStart || 0)) * pixelsPerSecond;
    }
    return timeToX(t);
  };

  const renderMarkerPreview = () => {
    previewFrame = 0;
    // v24: update the dragged marker's DOM only. Do not call render() while dragging;
    // rebuilding the rail under the cursor causes CEP hover/cursor flicker.
    dragVisuals.forEach(el => {
      const role = el.dataset.markerRole || '';
      const inX = visualXFor(el, previewTime);
      const outX = visualXFor(el, previewTime + previewDuration);
      if (role === 'in' || role === 'move') el.style.left = `${inX}px`;
      if (role === 'out') el.style.left = `${outX}px`;
      if (role === 'band' || role === 'overlay' || role === 'layer-region') {
        el.style.left = `${inX}px`;
        el.style.width = `${Math.max(2, (outX - inX))}px`;
      }
    });
    if (activeHandle && !activeHandle.dataset.markerRole) {
      activeHandle.style.left = `${dragMode === 'out' ? outX : inX}px`;
    }
  };

  const applyPreview = (moveEvent) => {
    const pointerTime = timeFromPointerEvent(moveEvent, { targetSnap: false, showGuide: false });
    const delta = pointerTime - startPointerTime;
    if (dragMode === "out") {
      const snapped = snapTimeToTargets(clampMarkerTime(originalEnd + delta, originalTime, maxTime), {
        targetSnap: moveEvent.shiftKey,
        minTime: originalTime,
        maxTime,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      const nextEnd = clampMarkerTime(snapped.time, originalTime, maxTime);
      previewTime = originalTime;
      previewDuration = Math.max(0, nextEnd - originalTime);
      showSnapGuide(nextEnd, moveEvent.shiftKey, snapped.target);
    } else if (dragMode === "in") {
      const snapped = snapTimeToTargets(clampMarkerTime(originalTime + delta, minTime, originalEnd), {
        targetSnap: moveEvent.shiftKey,
        minTime,
        maxTime: originalEnd,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      const nextIn = clampMarkerTime(snapped.time, minTime, originalEnd);
      previewTime = nextIn;
      previewDuration = Math.max(0, originalEnd - nextIn);
      showSnapGuide(nextIn, moveEvent.shiftKey, snapped.target);
    } else {
      const maxStart = Math.max(minTime, maxTime - originalDuration);
      const snapped = snapTimeToTargets(clampMarkerTime(originalTime + delta, minTime, maxStart), {
        targetSnap: moveEvent.shiftKey,
        minTime,
        maxTime: maxStart,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      previewTime = clampMarkerTime(snapped.time, minTime, maxStart);
      previewDuration = originalDuration;
      showSnapGuide(previewTime, moveEvent.shiftKey, snapped.target);
    }

    // v29: keep drag preview purely visual. Do not mutate marker data while dragging;
    // the sync loop keys off marker data and can rebuild the UI under the cursor.
    if (!previewFrame) previewFrame = requestAnimationFrame(renderMarkerPreview);
  };

  const finish = async () => {
    if (previewFrame) { cancelAnimationFrame(previewFrame); previewFrame = 0; }
    renderMarkerPreview();
    document.removeEventListener("mousemove", applyPreview, true);
    document.removeEventListener("mouseup", finish, true);
    hideSnapGuide();
    marker.time = previewTime;
    marker.duration = previewDuration;
    isMarkerDragging = false;
    document.body.classList.remove("marker-moving", "marker-resizing", "marker-dragging-in", "marker-dragging-out");
    if (activeHandle && activeHandle.classList) activeHandle.classList.remove("is-dragging");
    render();
    await loadJSX();
    const fn = markerType === "layer" ? "TNT_updateLayerMarker" : "TNT_updateCompMarker";
    const args = markerType === "layer"
      ? [layerIndex, marker.keyIndex, previewTime, previewDuration]
      : [marker.keyIndex, previewTime, previewDuration];
    const result = await aeCall(fn, args);
    suppressSyncUntil = Date.now() + 500;
    if (!result.ok) statusEl.textContent = result.error || "Could not edit marker.";
    await refreshLayers();
  };

  document.addEventListener("mousemove", applyPreview, true);
  document.addEventListener("mouseup", finish, true);
  applyPreview(event);
}

function addMarkerLabel(markerEl, marker) {
  const text = markerText(marker);
  const color = markerColor(marker);
  markerEl.style.setProperty("--marker-color", color);
  if (!text) return;
  markerEl.classList.add("has-text");
  if (markerHasNoLabelColor(marker)) markerEl.classList.add("marker-no-label-color");
  const label = document.createElement("span");
  label.className = "marker-label";
  label.textContent = text;
  if (markerHasNoLabelColor(marker)) {
    label.style.backgroundColor = "rgba(255,255,255,.12)";
    label.style.borderColor = "rgba(255,255,255,.88)";
  } else {
    label.style.backgroundColor = color;
  }
  markerEl.appendChild(label);
}

function addRegionOnRuler(ruler, marker) {
  const dur = Math.max(0, Number(marker.duration || 0));
  if (dur <= 0) return;
  const start = Math.max(visibleStart, Number(marker.time || 0));
  const end = Math.min(visibleStart + visibleDuration, markerEnd(marker));
  if (end <= start) return;
  const color = markerColor(marker);
  const band = document.createElement("div");
  band.className = "marker-region-band" + (marker.protectedRegion ? " protected" : "");
  band.dataset.markerKey = marker.keyIndex;
  band.dataset.markerType = "comp";
  band.dataset.markerRole = "band";
  band.style.left = `${timeToX(start)}px`;
  band.style.width = `${Math.max(2, (end - start) * pixelsPerSecond)}px`;
  band.style.borderColor = color;
  band.style.setProperty("--marker-color", color);
  band.style.backgroundColor = hexToRgba(color, marker.protectedRegion ? 0.18 : 0.08);
  band.title = markerTitle(marker, "Marker region");
  band.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "move" }));
  band.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(band, marker, { type: "comp" });
  ruler.appendChild(band);

  const left = document.createElement("div");
  left.className = "marker-half marker-half-start marker-handle marker-handle-in";
  left.dataset.markerKey = marker.keyIndex;
  left.dataset.markerType = "comp";
  left.dataset.markerRole = "in";
  left.style.left = `${timeToX(Number(marker.time || 0))}px`;
  left.style.borderLeftColor = color;
  left.style.color = color;
  left.style.setProperty("--marker-handle-color", color);
  left.title = markerTitle(marker, "Region in");
  left.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "in" }));
  left.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(left, marker, { type: "comp" });
  ruler.appendChild(left);

  const right = document.createElement("div");
  right.className = "marker-half marker-half-end marker-handle marker-handle-out";
  right.dataset.markerKey = marker.keyIndex;
  right.dataset.markerType = "comp";
  right.dataset.markerRole = "out";
  right.style.left = `${timeToX(markerEnd(marker))}px`;
  right.style.borderRightColor = color;
  right.style.color = color;
  right.style.setProperty("--marker-handle-color", color);
  right.title = markerTitle(marker, "Region out");
  right.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "out" }));
  right.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(right, marker, { type: "comp" });
  ruler.appendChild(right);
}

function renderCompMarkers() {
  const markers = state.compMarkers || [];
  markers.forEach(marker => {
    addRegionOnRuler(topMarkerRailEl || rulerEl, marker);

    if (marker.time < visibleStart || marker.time > visibleStart + visibleDuration) return;
    const x = timeToX(marker.time);
    const top = document.createElement("div");
    top.className = "marker marker-comp" + (Number(marker.duration || 0) > 0 ? " marker-region-start" : "") + (markerHasNoLabelColor(marker) ? " marker-no-label-color" : "");
    top.style.left = `${x}px`;
    top.dataset.markerKey = marker.keyIndex;
    top.dataset.markerType = "comp";
    top.dataset.markerRole = "move";
    top.title = markerTitle(marker, "Comp marker");
    top.style.setProperty("--marker-color", markerColor(marker));
    addMarkerLabel(top, marker);
    top.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "move" }));
    top.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
    bindMarkerContextMenu(top, marker, { type: "comp" });
    (topMarkerRailEl || rulerEl).appendChild(top);

  });
}

function renderProtectedRegionOverlays(trackCount) {
  const markers = state.compMarkers || [];
  markers.forEach(marker => {
    if (!marker.protectedRegion || Number(marker.duration || 0) <= 0) return;
    const start = Math.max(visibleStart, Number(marker.time || 0));
    const end = Math.min(visibleStart + visibleDuration, markerEnd(marker));
    if (end <= start) return;
    const color = markerColor(marker);
    const overlay = document.createElement("div");
    overlay.className = "protected-region-overlay";
    overlay.dataset.markerKey = marker.keyIndex;
    overlay.dataset.markerType = "comp";
    overlay.dataset.markerRole = "overlay";
    // Keep the overlay edges on the exact marker handles. The element may extend
    // outside the viewport; the scroll container clips it naturally.
    overlay.style.left = `${timeToX(Number(marker.time || 0))}px`;
    overlay.style.width = `${Math.max(2, (markerEnd(marker) - Number(marker.time || 0)) * pixelsPerSecond)}px`;
    // Start at the track area. The marker rail owns the header band; this column owns rows.
    overlay.style.top = `0px`;
    overlay.style.height = `${Math.max(timelineContentHeight(trackCount), scrollAreaEl.clientHeight + scrollAreaEl.scrollTop)}px`;
    overlay.style.backgroundColor = hexToRgba(color, 0.12);
    overlay.style.borderLeftColor = color;
    overlay.style.borderRightColor = color;
    overlay.title = markerTitle(marker, "Protected region");
    timelineEl.appendChild(overlay);
  });
}

function renderLayerMarkers(clip, layer, clipStart, clipEnd) {
  const markers = layer.markers || [];
  markers.forEach(marker => {
    const t = Number(marker.time || 0);
    // Layer markers are shown only inside the visible in/out region of that layer.
    if (t < layer.inPoint || t > layer.outPoint) return;
    if (t < clipStart || t > clipEnd) return;
    const color = markerColor(marker);
    const dur = Math.max(0, Number(marker.duration || 0));

    if (dur > 0) {
      const regionStart = Math.max(clipStart, t);
      const regionEnd = Math.min(clipEnd, markerEnd(marker), layer.outPoint);
      if (regionEnd > regionStart) {
        const region = document.createElement("div");
        region.className = "layer-marker-region" + (marker.protectedRegion ? " protected" : "");
        region.dataset.markerKey = marker.keyIndex;
        region.dataset.markerType = "layer";
        region.dataset.markerRole = "layer-region";
        region.style.left = `${(regionStart - clipStart) * pixelsPerSecond}px`;
        region.style.width = `${Math.max(2, (regionEnd - regionStart) * pixelsPerSecond)}px`;
        region.style.backgroundColor = hexToRgba(color, marker.protectedRegion ? 0.22 : 0.12);
        region.title = markerTitle(marker, `Layer marker region • ${layer.name}`);
        clip.appendChild(region);
      }
      const endT = Math.min(markerEnd(marker), layer.outPoint);
      if (endT >= clipStart && endT <= clipEnd) {
        const endEl = document.createElement("div");
        endEl.className = "marker-half layer-marker-half-end marker-handle marker-handle-out";
        endEl.dataset.markerKey = marker.keyIndex;
        endEl.dataset.markerType = "layer";
        endEl.dataset.markerRole = "out";
        endEl.style.left = `${(endT - clipStart) * pixelsPerSecond}px`;
        endEl.style.borderRightColor = color;
        endEl.style.color = color;
        endEl.title = markerTitle(marker, `Layer marker out • ${layer.name}`);
        endEl.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "layer", layerIndex: layer.index, mode: "out", minTime: layer.inPoint, maxTime: layer.outPoint }));
        endEl.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "layer", layerIndex: layer.index }); });
        bindMarkerContextMenu(endEl, marker, { type: "layer", layerIndex: layer.index });
        clip.appendChild(endEl);
      }
    }

    const markerEl = document.createElement("div");
    markerEl.className = "marker marker-layer" + (dur > 0 ? " marker-region-start" : "") + (markerHasNoLabelColor(marker) ? " marker-no-label-color" : "");
    markerEl.style.left = `${(t - clipStart) * pixelsPerSecond}px`;
    markerEl.dataset.markerKey = marker.keyIndex;
    markerEl.dataset.markerType = "layer";
    markerEl.dataset.markerRole = "move";
    markerEl.style.setProperty("--marker-color", color);
    markerEl.title = markerTitle(marker, `Layer marker • ${layer.name}`);
    addMarkerLabel(markerEl, marker);
    markerEl.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "layer", layerIndex: layer.index, mode: "move", minTime: layer.inPoint, maxTime: layer.outPoint }));
    markerEl.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "layer", layerIndex: layer.index }); });
    bindMarkerContextMenu(markerEl, marker, { type: "layer", layerIndex: layer.index });
    clip.appendChild(markerEl);
  });
}

function renderLayerKeyframes(clip, layer, clipStart, clipEnd) {
  const keyframes = layer.keyframes || [];
  if (!keyframes.length) return;
  keyframes.forEach((keyframe, index) => {
    const t = Number(keyframe.time || 0);
    if (t < layer.inPoint || t > layer.outPoint) return;
    if (t < clipStart || t > clipEnd) return;
    const color = Number(keyframe.label || 0) ? labelColor(Number(keyframe.label || 0)) : labelColor(layer.label);
    const el = document.createElement("div");
    el.className = "layer-keyframe-marker";
    el.style.left = `${(t - clipStart) * pixelsPerSecond}px`;
    el.style.setProperty("--keyframe-color", color);
    el.title = `Keyframe @ ${formatTime(t)}${keyframe.properties && keyframe.properties.length ? " - " + keyframe.properties.join(", ") : ""}`;
    el.dataset.keyframeIndex = index;
    clip.appendChild(el);
  });
}

function layerByIndexMap(layers) {
  const map = {};
  (layers || []).forEach(layer => {
    map[Number(layer.index)] = layer;
  });
  return map;
}

function relationshipLayerSets(layers) {
  const visible = layerByIndexMap(layers);
  const matte = new Set();
  const parent = new Set();
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    if (matteIndex && visible[matteIndex]) {
      matte.add(layerIndex);
      matte.add(matteIndex);
    } else if (matteIndex) {
      matte.add(layerIndex);
    }
    if (parentIndex && visible[parentIndex]) {
      parent.add(layerIndex);
      parent.add(parentIndex);
    } else if (parentIndex) {
      parent.add(layerIndex);
    }
  });
  return { matte, parent };
}

function renderClipRelationshipDots(clip, layer, relationSets) {
  const hasMatteDot = showTrackMatteLinks && relationSets.matte.has(Number(layer.index));
  const hasParentDot = showParentLinks && relationSets.parent.has(Number(layer.index));
  if (!hasMatteDot && !hasParentDot) return;
  clip.classList.add("has-relation-dots");
  const dots = document.createElement("span");
  dots.className = "clip-relation-dots";
  if (hasMatteDot) {
    const dot = document.createElement("span");
    dot.className = "clip-relation-dot matte";
    dot.title = layer.trackMatteLayerIndex
      ? `Track matte: ${layer.trackMatteType || "Track Matte"} -> ${layer.trackMatteLayerName || ("Layer " + layer.trackMatteLayerIndex)}`
      : "Track matte endpoint";
    dots.appendChild(dot);
  }
  if (hasParentDot) {
    const dot = document.createElement("span");
    dot.className = "clip-relation-dot parent";
    dot.title = layer.parentIndex
      ? `Parent: ${layer.parentName || ("Layer " + layer.parentIndex)}`
      : "Parent endpoint";
    dots.appendChild(dot);
  }
  clip.appendChild(dots);
}

function renderRelationshipLine(type, from, to) {
  if (!from || !to) return;
  const fromClip = timelineEl.querySelector(`.clip[data-layer-index="${from}"]`);
  const toClip = timelineEl.querySelector(`.clip[data-layer-index="${to}"]`);
  if (!fromClip || !toClip) return;
  const fromX = Number(fromClip.style.left.replace("px", "") || 0) + Number(fromClip.style.width.replace("px", "") || 0) - 8;
  const toX = Number(toClip.style.left.replace("px", "") || 0) + Number(toClip.style.width.replace("px", "") || 0) - 8;
  const fromY = (fromClip.offsetParent ? fromClip.offsetParent.offsetTop : 0) + TRACK_HEIGHT / 2 + (type === "matte" ? -4 : 4);
  const toY = (toClip.offsetParent ? toClip.offsetParent.offsetTop : 0) + TRACK_HEIGHT / 2 + (type === "matte" ? -4 : 4);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const line = document.createElement("div");
  line.className = `relationship-line ${type}`;
  line.style.left = `${fromX}px`;
  line.style.top = `${fromY}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  line.title = type === "matte" ? `Track matte link: layer ${from} -> layer ${to}` : `Parent link: layer ${from} -> layer ${to}`;
  timelineEl.appendChild(line);
}

function renderLayerRelationships(layers) {
  if (!showTrackMatteLinks && !showParentLinks) return;
  const visible = layerByIndexMap(layers);
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    if (showTrackMatteLinks && matteIndex && visible[matteIndex]) renderRelationshipLine("matte", layerIndex, matteIndex);
    if (showParentLinks && parentIndex && visible[parentIndex]) renderRelationshipLine("parent", layerIndex, parentIndex);
  });
}
