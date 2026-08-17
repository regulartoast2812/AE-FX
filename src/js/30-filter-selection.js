const FILTER_LABELS = {
  comp: "comps",
  text: "text",
  shape: "shape",
  media: "media",
  missing: "missing media",
  adjustment: "adjustments",
  null: "nulls",
  camera: "cameras",
  light: "lights",
  animated: "animated",
  unanimated: "unanimated",
  parented: "children",
  "parent-source": "parents",
  "matte-child": "matte users",
  "matte-source": "matte sources"
};

function activeLayerFilterLabel() {
  return FILTER_LABELS[activeLayerFilter] || activeLayerFilter || "";
}

function activeLayerFilterScopeLabel() {
  return activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length
    ? `${activeLayerFilterScopeIndices.length} selected`
    : "composition";
}

function hasActiveLayerViewConstraint() {
  return !!activeLayerFilter ||
    !!(activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length);
}

function setLayerViewFilter(filter, scopeIndices = null) {
  activeLayerFilter = filter || null;
  activeLayerFilterScopeIndices = scopeIndices && scopeIndices.length
    ? [...new Set(scopeIndices.map(Number).filter(Boolean))]
    : null;
  updateStatus();
  updateFilterButtons();
  updateActiveFilterNotice();
  render();
}

function clearLayerViewFilter() {
  setLayerViewFilter(null, null);
}

function updateActiveFilterNotice() {
  if (!activeFilterNoticeEl) return;
  const active = hasActiveLayerViewConstraint();
  activeFilterNoticeEl.classList.toggle("show", active);
  activeFilterNoticeEl.setAttribute("aria-hidden", active ? "false" : "true");
  if (!active) return;
  const label = activeFilterNoticeEl.querySelector(".active-filter-notice-label");
  if (label) {
    const filterLabel = activeLayerFilter ? activeLayerFilterLabel() : "all layers";
    label.textContent = `${activeLayerFilterScopeLabel()} · ${filterLabel}`;
  }
}

function layerMatchesFilter(layer, filter, relationSets) {
  if (!filter) return true;
  const type = String(layer.type || "").toLowerCase();
  const layerIndex = Number(layer.index || 0);
  relationSets = relationSets || allRelationshipLayerSets();
  if (filter === "comp") return !!layer.sourceCompId;
  if (filter === "text") return type === "text";
  if (filter === "shape") return type === "shape";
  if (filter === "media") return !layer.sourceCompId && (!!layer.isMedia || (!!layer.type && !["text","shape","camera","light","null","adjustment"].includes(type)));
  if (filter === "missing") return !!layer.isMissingMedia;
  if (filter === "adjustment") return type === "adjustment";
  if (filter === "null") return type === "null";
  if (filter === "camera") return type === "camera";
  if (filter === "light") return type === "light";
  if (filter === "animated") return !!layer.hasKeyframes;
  if (filter === "unanimated") return !layer.hasKeyframes;
  if (filter === "parented") return relationSets.parented.has(layerIndex);
  if (filter === "parent-source") return relationSets.parentSources.has(layerIndex);
  if (filter === "matte-child") return relationSets.matteChildren.has(layerIndex);
  if (filter === "matte-source") return relationSets.matteSources.has(layerIndex);
  return true;
}

function layerMatchesActiveFilter(layer, relationSets) {
  if (activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length) {
    if (!activeLayerFilterScopeIndices.includes(Number(layer.index || 0))) return false;
  }
  return layerMatchesFilter(layer, activeLayerFilter, relationSets);
}

function visibleLayers() {
  const relationSets = allRelationshipLayerSets();
  return (state.layers || []).filter(layer => layerMatchesActiveFilter(layer, relationSets));
}

function updateFilterButtons() {
  if (!filterColumnEl) return;
  filterColumnEl.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.dataset.relationToggle === "matte") btn.classList.toggle("active", showTrackMatteLinks);
    else if (btn.dataset.relationToggle === "parent") btn.classList.toggle("active", showParentLinks);
    else btn.classList.toggle("active", !activeLayerFilterScopeIndices && btn.dataset.filter === activeLayerFilter);
  });
  if (layerSelectionScopesEl) {
    layerSelectionScopesEl.querySelectorAll("[data-selection-scope]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.selectionScope === layerSelectionScope);
    });
  }
  if (layerViewFiltersEl) {
    layerViewFiltersEl.querySelectorAll("[data-layer-view-filter]").forEach(btn => {
      btn.classList.toggle("active", !activeLayerFilterScopeIndices &&
        String(btn.dataset.layerViewFilter || "") === String(activeLayerFilter || ""));
    });
  }
  if (layerSelectionModesEl) {
    layerSelectionModesEl.querySelectorAll("[data-selection-mode]").forEach(btn => {
      btn.classList.toggle("active", String(btn.dataset.selectionMode || "layer") === layerSelectionMode);
    });
  }
}

const LAYER_SELECTION_QUICK_FILTERS = [
  { key: "text", label: "Text", group: "type" },
  { key: "shape", label: "Shape", group: "type" },
  { key: "media", label: "Media", group: "type" },
  { key: "comp", label: "Comp", group: "type" },
  { key: "adjustment", label: "Adjustment", group: "type" },
  { key: "null", label: "Null", group: "type" },
  { key: "camera", label: "Camera", group: "type" },
  { key: "light", label: "Light", group: "type" },
  { key: "animated", label: "Animated", group: "animation" },
  { key: "unanimated", label: "Static", group: "animation" },
  { key: "parent-source", label: "Parents", group: "parent" },
  { key: "parented", label: "Children", group: "parent" },
  { key: "matte-source", label: "Matte Sources", group: "matte" },
  { key: "matte-child", label: "Matte Users", group: "matte" }
];

function layerIsAtPlayhead(layer) {
  const time = Number(state.comp && state.comp.time || 0);
  const frameDuration = 1 / Math.max(1, Number(state.comp && state.comp.frameRate || 30));
  const tolerance = Math.min(1e-4, frameDuration * 0.01);
  return time >= Number(layer.inPoint || 0) - tolerance &&
    time <= Number(layer.outPoint || 0) + tolerance;
}

function layerSelectionScopeLayers() {
  const layers = state.layers || [];
  if (layerSelectionScope === "selected") {
    const selected = new Set((state.selectedLayerIndices || []).map(Number));
    return layers.filter(layer => selected.has(Number(layer.index)));
  }
  if (layerSelectionScope === "playhead") return layers.filter(layerIsAtPlayhead);
  return layers;
}

function layerSelectionScopeLabel() {
  if (layerSelectionScope === "selected") return "selected";
  if (layerSelectionScope === "playhead") return "at playhead";
  return "total";
}

function layerSelectionModeLabel() {
  if (layerSelectionMode === "property") return "properties";
  if (layerSelectionMode === "effect") return "effects";
  return "layers";
}

function layerSelectionSearchPlaceholder() {
  if (layerSelectionMode === "property") return "Property name";
  if (layerSelectionMode === "effect") return "Effect name";
  return "Layer name";
}

function normalizeLayerSelectionTerms(items) {
  const out = [];
  (items || []).forEach(item => {
    if (!item) return;
    if (typeof item === "string") out.push(item);
    else {
      if (item.name) out.push(item.name);
      if (item.matchName) out.push(item.matchName);
      if (item.path) out.push(item.path);
      if (item.type) out.push(item.type);
    }
  });
  return [...new Set(out.map(value => String(value || "").trim()).filter(Boolean))];
}

function layerPropertySearchTerms(layer) {
  const terms = normalizeLayerSelectionTerms(layer.propertyNames)
    .concat(normalizeLayerSelectionTerms(layer.animatedProperties))
    .concat(normalizeLayerSelectionTerms(layer.transformProperties));
  (layer.keyframes || []).forEach(key => {
    (key.properties || []).forEach(name => terms.push(name));
  });
  if (layer.hasKeyframes) terms.push("Keyframes", "Animated");
  if (layer.type) terms.push(layer.type);
  return [...new Set(terms.map(value => String(value || "").trim()).filter(Boolean))];
}

function layerEffectSearchTerms(layer) {
  return normalizeLayerSelectionTerms(layer.effects || layer.effectNames);
}

function layerSelectionSearchTerms(layer) {
  if (layerSelectionMode === "property") return layerPropertySearchTerms(layer);
  if (layerSelectionMode === "effect") return layerEffectSearchTerms(layer);
  return [
    layer.name,
    layer.index,
    layer.type,
    layer.sourceCompName,
    layer.missingMediaPath,
    layer.trackMatteType,
    layer.parentName,
    layer.trackMatteLayerName
  ].map(value => String(value || "").trim()).filter(Boolean);
}

function layerMatchesSelectionQuery(layer, query) {
  if (!query) return true;
  return layerSelectionSearchTerms(layer).some(term => String(term || "").toLowerCase().includes(query));
}

function visibleLayerSelectionTerms(layer) {
  const query = String(layerSelectionQuery || "").trim().toLowerCase();
  let terms = [];
  if (layerSelectionMode === "property") terms = layerPropertySearchTerms(layer);
  else if (layerSelectionMode === "effect") terms = layerEffectSearchTerms(layer);
  else terms = [layer.type, layer.sourceCompName, layer.parentName, layer.trackMatteLayerName].filter(Boolean);
  if (query) terms = terms.filter(term => String(term || "").toLowerCase().includes(query));
  return terms.slice(0, 4);
}

function layerSelectionCandidates() {
  const relationSets = allRelationshipLayerSets();
  const query = String(layerSelectionQuery || "").trim().toLowerCase();
  return layerSelectionScopeLayers().filter(layer => {
    if (!layerMatchesFilter(layer, layerSelectionFilter, relationSets)) return false;
    return layerMatchesSelectionQuery(layer, query);
  });
}

function renderLayerSelectionQuickFilters(scopeLayers, relationSets) {
  if (!layerSelectionQuickFiltersEl) return;
  const actions = [];
  if (scopeLayers.length) {
    actions.push({ key: "", label: "All", group: "general", count: scopeLayers.length });
  }
  LAYER_SELECTION_QUICK_FILTERS.forEach(definition => {
    const count = scopeLayers.filter(layer => layerMatchesFilter(layer, definition.key, relationSets)).length;
    if (count) actions.push({ ...definition, count });
  });
  layerSelectionQuickFiltersEl.innerHTML = actions.length ? actions.map(action => `
    <button type="button"
      class="layer-selection-quick-filter filter-group-${action.group}${String(layerSelectionFilter || "") === action.key ? " active" : ""}"
      data-layer-selection-filter="${action.key}">
      <span>${escapeHtml(action.label)}</span>
      <em>${action.count}</em>
    </button>`).join("") : '<span class="layer-selection-no-actions">No layers in this scope.</span>';
}

function layerSelectionBadges(layer, relationSets) {
  const badges = [];
  const index = Number(layer.index || 0);
  const type = String(layer.type || (layer.isMedia ? "Media" : "Layer"));
  badges.push(`<span class="layer-selection-badge type">${escapeHtml(type)}</span>`);
  if (relationSets.parentSources.has(index)) badges.push('<span class="layer-selection-badge parent">Parent</span>');
  if (relationSets.parented.has(index)) badges.push('<span class="layer-selection-badge parent">Child</span>');
  if (relationSets.matteSources.has(index)) badges.push('<span class="layer-selection-badge matte">Matte</span>');
  if (relationSets.matteChildren.has(index)) badges.push('<span class="layer-selection-badge matte">Uses Matte</span>');
  if (layer.hasKeyframes) badges.push('<span class="layer-selection-badge animated">Animated</span>');
  return badges.join("");
}

function renderLayerSelectionPanel() {
  if (!layerSelectionModalEl || !layerSelectionModalEl.classList.contains("show") || !layerSelectionListEl) return;
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const scopeLayers = layerSelectionScopeLayers();
  const layers = layerSelectionCandidates();
  const relationSets = allRelationshipLayerSets();
  if (layerSelectionCountEl) {
    const count = selected.size;
    layerSelectionCountEl.textContent = `${count} selected`;
  }
  if (layerSelectionShownCountEl) {
    layerSelectionShownCountEl.textContent = `${layers.length}/${scopeLayers.length} ${layerSelectionScopeLabel()} · ${layerSelectionModeLabel()}`;
  }
  updateFilterButtons();
  if (layerSelectionSearchEl) layerSelectionSearchEl.placeholder = layerSelectionSearchPlaceholder();
  renderLayerSelectionQuickFilters(scopeLayers, relationSets);
  layerSelectionListEl.innerHTML = layers.length ? layers.map(layer => {
    const index = Number(layer.index || 0);
    const isSelected = selected.has(index);
    const details = visibleLayerSelectionTerms(layer);
    return `
      <button type="button" class="layer-selection-row${isSelected ? " selected" : ""}" data-layer-index="${index}" role="option" aria-selected="${isSelected}">
        <span class="layer-selection-check" aria-hidden="true"></span>
        <span class="layer-selection-index">${index}</span>
        <span class="layer-selection-name">${escapeHtml(layer.name || `Layer ${index}`)}</span>
        <span class="layer-selection-detail">${details.map(item => `<em>${escapeHtml(item)}</em>`).join("")}</span>
        <span class="layer-selection-badges">${layerSelectionBadges(layer, relationSets)}</span>
      </button>`;
  }).join("") : '<div class="layer-selection-empty">No layers match this filter.</div>';
}

function showLayerSelectionPanel() {
  if (!layerSelectionModalEl || !state.comp) return;
  layerSelectionModalEl.classList.add("show");
  layerSelectionModalEl.setAttribute("aria-hidden", "false");
  renderLayerSelectionPanel();
  requestAnimationFrame(() => {
    if (layerSelectionSearchEl) layerSelectionSearchEl.focus();
  });
}

function hideLayerSelectionPanel() {
  if (!layerSelectionModalEl) return;
  layerSelectionModalEl.classList.remove("show");
  layerSelectionModalEl.setAttribute("aria-hidden", "true");
}

async function queueLayerSelectionHostUpdate(indices) {
  layerSelectionPendingIndices = [...new Set((indices || []).map(Number).filter(Boolean))];
  if (layerSelectionApplyInFlight) return;
  layerSelectionApplyInFlight = true;
  try {
    while (layerSelectionPendingIndices) {
      const next = layerSelectionPendingIndices;
      layerSelectionPendingIndices = null;
      suppressSyncUntil = Date.now() + 700;
      await loadJSX();
      const result = await aeCall("TNT_setSelectedLayers", [next, false]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not update selection.";
        continue;
      }
      if (!layerSelectionPendingIndices) {
        state.selectedLayerIndices = result.selectedLayerIndices || next;
        renderSelectionOnly();
        renderLayerSelectionPanel();
      }
    }
  } finally {
    layerSelectionApplyInFlight = false;
  }
}

async function updateLayerSelectionFromPanel(layerIndex, shiftRange = false) {
  const candidates = layerSelectionCandidates();
  const current = new Set((state.selectedLayerIndices || []).map(Number));
  const index = Number(layerIndex || 0);
  if (shiftRange && lastLayerSelectionIndex) {
    const from = candidates.findIndex(layer => Number(layer.index) === Number(lastLayerSelectionIndex));
    const to = candidates.findIndex(layer => Number(layer.index) === index);
    if (from >= 0 && to >= 0) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      for (let i = start; i <= end; i++) current.add(Number(candidates[i].index));
    }
  } else if (current.has(index)) {
    current.delete(index);
  } else {
    current.add(index);
  }
  lastLayerSelectionIndex = index;
  state.selectedLayerIndices = [...current];
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(state.selectedLayerIndices);
}

async function runLayerSelectionAction(action) {
  const candidates = layerSelectionCandidates().map(layer => Number(layer.index));
  const current = new Set((state.selectedLayerIndices || []).map(Number));
  let next = [];
  if (action === "select") next = candidates;
  else if (action === "invert") {
    candidates.forEach(index => {
      if (current.has(index)) current.delete(index);
      else current.add(index);
    });
    next = [...current];
  }
  state.selectedLayerIndices = next;
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(next);
}

async function selectLayerSelectionMatches() {
  await runLayerSelectionAction("select");
}

async function applyLayerSelectionQuickFilter(filter) {
  const relationSets = allRelationshipLayerSets();
  const scopeLayers = layerSelectionScopeLayers();
  const next = scopeLayers
    .filter(layer => layerMatchesFilter(layer, filter, relationSets))
    .map(layer => Number(layer.index));
  layerSelectionFilter = filter || null;
  state.selectedLayerIndices = next;
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(next);
}
