function ensureLayerStyleDialog() {
  if (layerStyleDialogEl) return layerStyleDialogEl;
  layerStyleDialogEl = document.createElement("div");
  layerStyleDialogEl.className = "layer-style-dialog-backdrop";
  layerStyleDialogEl.setAttribute("aria-hidden", "true");
  layerStyleDialogEl.innerHTML = `
    <div class="layer-style-dialog">
      <div class="layer-style-dialog-head">
        <div>
          <div class="layer-style-dialog-title"></div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(layerStyleDialogEl);
  layerStyleDialogEl.addEventListener("mousedown", event => {
    if (event.target === layerStyleDialogEl) closeLayerStyleDialog();
  });
  layerStyleDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLayerStyleDialog();
    }
  });
  return layerStyleDialogEl;
}

function closeLayerStyleDialog() {
  if (!layerStyleDialogEl) return;
  layerStyleDialogEl.classList.remove("show");
  layerStyleDialogEl.setAttribute("aria-hidden", "true");
  layerStyleEditSnapshot = null;
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showLayerStyleDialog(title, subtitle) {
  const el = ensureLayerStyleDialog();
  const staleClose = el.querySelector(".layer-style-dialog:not(.mask-control-dialog) .layer-style-close");
  if (staleClose) staleClose.remove();
  const titleEl = el.querySelector(".layer-style-dialog-title");
  if (titleEl) titleEl.innerHTML = `<b class="layer-style-shortcut-badge">S</b><span>${escapeHtml(title || "Layer Styles")}</span>`;
  el.querySelector(".layer-style-dialog-subtitle").textContent = subtitle || "";
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureMaskControlDialog() {
  if (maskControlDialogEl) return maskControlDialogEl;
  maskControlDialogEl = document.createElement("div");
  maskControlDialogEl.className = "layer-style-dialog-backdrop mask-control-backdrop";
  maskControlDialogEl.setAttribute("aria-hidden", "true");
  maskControlDialogEl.innerHTML = `
    <div class="layer-style-dialog mask-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Mask Control</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(maskControlDialogEl);
  maskControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === maskControlDialogEl) closeMaskControlDialog();
  });
  maskControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeMaskControlDialog);
  maskControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMaskControlDialog();
    }
  });
  return maskControlDialogEl;
}

function closeMaskControlDialog() {
  if (!maskControlDialogEl) return;
  maskControlDialogEl.classList.remove("show");
  maskControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showMaskControlDialog() {
  const el = ensureMaskControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureEffectsControlDialog() {
  if (effectsControlDialogEl) return effectsControlDialogEl;
  effectsControlDialogEl = document.createElement("div");
  effectsControlDialogEl.className = "layer-style-dialog-backdrop effects-control-backdrop";
  effectsControlDialogEl.setAttribute("aria-hidden", "true");
  effectsControlDialogEl.innerHTML = `
    <div class="layer-style-dialog effects-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Effects</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(effectsControlDialogEl);
  effectsControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === effectsControlDialogEl) closeEffectsControlDialog();
  });
  effectsControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeEffectsControlDialog);
  effectsControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEffectsControlDialog();
    }
  });
  return effectsControlDialogEl;
}

function closeEffectsControlDialog() {
  if (!effectsControlDialogEl) return;
  effectsControlDialogEl.classList.remove("show");
  effectsControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showEffectsControlDialog() {
  const el = ensureEffectsControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureShapesControlDialog() {
  if (shapesControlDialogEl) return shapesControlDialogEl;
  shapesControlDialogEl = document.createElement("div");
  shapesControlDialogEl.className = "layer-style-dialog-backdrop shapes-control-backdrop";
  shapesControlDialogEl.setAttribute("aria-hidden", "true");
  shapesControlDialogEl.innerHTML = `
    <div class="layer-style-dialog shapes-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Shapes</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(shapesControlDialogEl);
  shapesControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === shapesControlDialogEl) closeShapesControlDialog();
  });
  shapesControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeShapesControlDialog);
  shapesControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeShapesControlDialog();
    }
  });
  return shapesControlDialogEl;
}

function closeShapesControlDialog() {
  if (!shapesControlDialogEl) return;
  shapesControlDialogEl.classList.remove("show");
  shapesControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showShapesControlDialog() {
  const el = ensureShapesControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

async function openMaskControlPanel() {
  closeFxConsole();
  const wasOpen = !!(maskControlDialogEl && maskControlDialogEl.classList.contains("show"));
  const el = showMaskControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading masks...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshMaskControlPanelContent({ showLoading: true }));
  await refreshMaskControlPanelContent({ showLoading: !wasOpen });
}

async function openEffectsControlPanel() {
  closeFxConsole();
  const wasOpen = !!(effectsControlDialogEl && effectsControlDialogEl.classList.contains("show"));
  const el = showEffectsControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading effects...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshEffectsControlPanelContent({ showLoading: true }));
  await loadFxConsoleEffects();
  await refreshEffectsControlPanelContent({ showLoading: !wasOpen });
}

async function refreshEffectsControlPanelContent(options = {}) {
  const el = ensureEffectsControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading effects...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedEffectsPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read effects.")}</div>`;
    return;
  }
  const layers = Array.isArray(result.layers) ? result.layers : [];
  const totalEffects = layers.reduce((sum, layer) => sum + ((layer.effects || []).length), 0);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Effects <span class="mask-control-count">${totalEffects} effect${totalEffects === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="effects-control-layout">
      <section class="effects-control-browser">
        <input type="text" class="effects-control-search" data-effects-search placeholder="Search effects to apply" spellcheck="false" autocomplete="off">
        <div class="effects-control-results" data-effects-results></div>
      </section>
      <section class="layer-style-layout mask-control-layout effects-control-current">
        ${layers.length ? layers.map(renderEffectsLayerGroup).join("") : `<div class="layer-style-empty">Select layers to inspect or apply effects.</div>`}
      </section>
    </div>
  `;
  bindEffectsControlPanel(body);
  body.scrollTop = previousScrollTop;
}

function effectSearchResults(query) {
  const normalized = String(query || "").toLowerCase().trim();
  const effects = (fxConsoleEffects || []).map(effect => ({ ...effect, source: "native", type: "effect" }));
  if (!normalized) return effects.slice(0, 10);
  const terms = normalized.split(/\s+/).filter(Boolean);
  return effects.filter(effect => {
    const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, 12);
}

function renderEffectsSearchResults(root) {
  const input = root.querySelector("[data-effects-search]");
  const resultsEl = root.querySelector("[data-effects-results]");
  if (!input || !resultsEl) return;
  const results = effectSearchResults(input.value);
  resultsEl.innerHTML = results.length
    ? results.map(effect => `
      <button type="button" class="effects-control-result" data-effect-match-name="${escapeHtml(effect.matchName || "")}">
        <strong>${escapeHtml(effect.name || effect.matchName || "Effect")}</strong>
        <em>${escapeHtml(effect.category || effect.matchName || "")}</em>
      </button>
    `).join("")
    : `<div class="layer-style-empty">No matching effects.</div>`;
}

function renderEffectsLayerGroup(layer) {
  const effects = Array.isArray(layer.effects) ? layer.effects : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer effects-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${effects.length} effect${effects.length === 1 ? "" : "s"}</span>
      </div>
      ${effects.length
        ? `<div class="layer-style-node-row mask-control-node-row effects-control-node-row">${effects.map(effect => renderEffectNode(layer, effect)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No effects on this layer.</div>`}
    </section>
  `;
}

function renderEffectNode(layer, effect) {
  return `
    <section class="mask-control-node effects-control-node${effect.enabled ? "" : " disabled"}" data-layer-index="${escapeHtml(layer.index)}" data-effect-index="${escapeHtml(effect.index)}">
      <div class="mask-control-node-head">
        <strong>${escapeHtml(effect.name || "Effect")}</strong>
        <em>${escapeHtml(effect.matchName || "")}</em>
      </div>
      <div class="layer-style-node-controls">
        <button type="button" class="layer-style-toggle${effect.enabled ? " on" : ""}" data-effect-enable="${effect.enabled ? "false" : "true"}" title="${effect.enabled ? "Turn off" : "Turn on"}"><span></span></button>
        <button type="button" class="layer-style-delete" data-effect-delete="true" title="Delete effect">x</button>
      </div>
    </section>
  `;
}

function bindEffectsControlPanel(root) {
  const search = root.querySelector("[data-effects-search]");
  if (search) {
    renderEffectsSearchResults(root);
    search.addEventListener("input", () => renderEffectsSearchResults(root));
  }
  root.querySelectorAll("[data-effect-match-name]").forEach(button => {
    button.addEventListener("click", async () => {
      await loadJSX();
      const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
      const result = await aeCall("TNT_applyEffectToSelectedLayers", [button.dataset.effectMatchName || "", selected]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not apply effect.";
        return;
      }
      statusEl.textContent = `Applied ${button.textContent.trim()}.`;
      await refreshLayers({ forceRender: true });
      await refreshEffectsControlPanelContent();
    });
  });
  root.querySelectorAll("[data-effect-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-effect-index]");
      if (!node) return;
      const result = await aeCall("TNT_setEffectEnabled", [Number(node.dataset.layerIndex), Number(node.dataset.effectIndex), button.dataset.effectEnable === "true"]);
      if (!result.ok) statusEl.textContent = result.error || "Could not update effect.";
      await refreshEffectsControlPanelContent();
    });
  });
  root.querySelectorAll("[data-effect-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-effect-index]");
      if (!node) return;
      const result = await aeCall("TNT_removeEffect", [Number(node.dataset.layerIndex), Number(node.dataset.effectIndex)]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete effect.";
      await refreshEffectsControlPanelContent();
    });
  });
}

async function openShapesControlPanel() {
  closeFxConsole();
  const wasOpen = !!(shapesControlDialogEl && shapesControlDialogEl.classList.contains("show"));
  const el = showShapesControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading shapes...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshShapesControlPanelContent({ showLoading: true }));
  await refreshShapesControlPanelContent({ showLoading: !wasOpen });
}

async function refreshShapesControlPanelContent(options = {}) {
  const el = ensureShapesControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading shapes...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedShapesPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read shapes.")}</div>`;
    return;
  }
  const layers = Array.isArray(result.layers) ? result.layers : [];
  const totalItems = layers.reduce((sum, layer) => sum + ((layer.items || []).length), 0);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Shapes <span class="mask-control-count">${totalItems} item${totalItems === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="shapes-control-layout">
      <section class="shapes-control-add-row">
        ${[
          ["shape-layer", "New Layer"],
          ["group", "Group"],
          ["rect", "Rectangle"],
          ["ellipse", "Ellipse"],
          ["star", "Star"],
          ["fill", "Fill"],
          ["stroke", "Stroke"],
          ["trim", "Trim Paths"]
        ].map(([type, label]) => `<button type="button" data-shape-add="${type}">${escapeHtml(label)}</button>`).join("")}
      </section>
      <section class="layer-style-layout mask-control-layout shapes-control-current">
        ${layers.length ? layers.map(renderShapesLayerGroup).join("") : `<div class="layer-style-empty">Select a shape layer, or create one above.</div>`}
      </section>
    </div>
  `;
  bindShapesControlPanel(body);
  body.scrollTop = previousScrollTop;
}

function renderShapesLayerGroup(layer) {
  const items = Array.isArray(layer.items) ? layer.items : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer shapes-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${items.length} shape item${items.length === 1 ? "" : "s"}</span>
      </div>
      ${items.length
        ? `<div class="layer-style-node-row mask-control-node-row shapes-control-node-row">${items.map(item => renderShapeNode(layer, item)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No shape contents on this layer.</div>`}
    </section>
  `;
}

function renderShapeNode(layer, item) {
  const path = encodeURIComponent(JSON.stringify(item.path || []));
  return `
    <section class="mask-control-node shapes-control-node${item.enabled ? "" : " disabled"}" data-layer-index="${escapeHtml(layer.index)}" data-shape-path="${path}">
      <div class="mask-control-node-head">
        <strong>${escapeHtml(item.name || "Shape Item")}</strong>
        <em>${escapeHtml(item.type || item.matchName || "")}</em>
      </div>
      <div class="layer-style-node-controls">
        <button type="button" class="layer-style-toggle${item.enabled ? " on" : ""}" data-shape-enable="${item.enabled ? "false" : "true"}" title="${item.enabled ? "Turn off" : "Turn on"}"><span></span></button>
        <button type="button" class="layer-style-delete" data-shape-delete="true" title="Delete shape item">x</button>
      </div>
    </section>
  `;
}

function shapeNodePath(node) {
  try { return JSON.parse(decodeURIComponent(node.dataset.shapePath || "%5B%5D")); }
  catch (_) { return []; }
}

function bindShapesControlPanel(root) {
  root.querySelectorAll("[data-shape-add]").forEach(button => {
    button.addEventListener("click", async () => {
      const result = await aeCall("TNT_addShapeItemToSelectedLayers", [button.dataset.shapeAdd || ""]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not add shape item.";
        return;
      }
      statusEl.textContent = result.result || "Shape item added.";
      await refreshLayers({ forceRender: true });
      await refreshShapesControlPanelContent();
    });
  });
  root.querySelectorAll("[data-shape-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-shape-path]");
      if (!node) return;
      const result = await aeCall("TNT_setShapeItemEnabled", [Number(node.dataset.layerIndex), shapeNodePath(node), button.dataset.shapeEnable === "true"]);
      if (!result.ok) statusEl.textContent = result.error || "Could not update shape item.";
      await refreshShapesControlPanelContent();
    });
  });
  root.querySelectorAll("[data-shape-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-shape-path]");
      if (!node) return;
      const result = await aeCall("TNT_removeShapeItem", [Number(node.dataset.layerIndex), shapeNodePath(node)]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete shape item.";
      await refreshShapesControlPanelContent();
    });
  });
}

async function refreshMaskControlPanelContent(options = {}) {
  const el = ensureMaskControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  const previousScrollLeft = body ? body.scrollLeft : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading masks...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedMaskPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read masks.")}</div>`;
    return;
  }
  const data = result || {};
  const layers = data && Array.isArray(data.layers) ? data.layers : [];
  const totalMasks = layers.reduce((sum, layer) => sum + ((layer.masks || []).length), 0);
  const maskGroups = buildMaskNameGroups(layers);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Mask Control <span class="mask-control-count">${totalMasks} mask${totalMasks === 1 ? "" : "s"} / ${maskGroups.length} group${maskGroups.length === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  if (!layers.length) {
    body.innerHTML = `<div class="layer-style-empty">Select a layer with masks to control them here.</div>`;
    return;
  }
  body.innerHTML = `
    <div class="layer-style-layout mask-control-layout">
      ${renderMaskGroupedPanel(layers, maskGroups)}
    </div>
  `;
  bindMaskControlNodes(body);
  body.scrollTop = previousScrollTop;
  body.scrollLeft = previousScrollLeft;
}

function renderMaskLayerGroup(layer) {
  const masks = Array.isArray(layer.masks) ? layer.masks : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${masks.length} mask${masks.length === 1 ? "" : "s"}</span>
      </div>
      ${masks.length
        ? `<div class="layer-style-node-row mask-control-node-row">${masks.map(mask => renderMaskNode(layer, mask)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No masks on this layer.</div>`}
    </section>
  `;
}

function maskValueSame(a, b) {
  if (a && a.length !== undefined && typeof a !== "string") {
    if (!b || b.length === undefined || typeof b === "string" || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!maskValueSame(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "number" || typeof b === "number") {
    return Math.abs(Number(a) - Number(b)) < 0.001;
  }
  return a === b;
}

function maskGroupCommonValue(items, getter) {
  if (!items.length) return { mixed: false, value: "" };
  const first = getter(items[0]);
  for (let i = 1; i < items.length; i++) {
    if (!maskValueSame(first, getter(items[i]))) return { mixed: true, value: first };
  }
  return { mixed: false, value: first };
}

function buildMaskNameGroups(layers) {
  const groups = [];
  const byName = new Map();
  layers.forEach(layer => {
    (Array.isArray(layer.masks) ? layer.masks : []).forEach(mask => {
      const name = String(mask.name || `Mask ${mask.index || ""}`).trim() || "Mask";
      let group = byName.get(name);
      if (!group) {
        group = { name, items: [], targets: [], layerNames: [], label: layer.label };
        byName.set(name, group);
        groups.push(group);
      }
      group.items.push({ layer, mask });
      group.targets.push({ layerIndex: Number(layer.index), maskIndex: Number(mask.index) });
      if (group.layerNames.indexOf(layer.name || `Layer ${layer.index}`) < 0) group.layerNames.push(layer.name || `Layer ${layer.index}`);
    });
  });
  groups.forEach(group => {
    const common = {
      enabled: maskGroupCommonValue(group.items, item => item.mask.enabled !== false),
      modeValue: maskGroupCommonValue(group.items, item => item.mask.modeValue === "" || item.mask.modeValue === null || typeof item.mask.modeValue === "undefined" ? 2 : Number(item.mask.modeValue)),
      mode: maskGroupCommonValue(group.items, item => item.mask.mode || ""),
      inverted: maskGroupCommonValue(group.items, item => !!item.mask.inverted),
      opacity: maskGroupCommonValue(group.items, item => item.mask.opacity === "" || item.mask.opacity === null || typeof item.mask.opacity === "undefined" ? 100 : Number(item.mask.opacity)),
      expansion: maskGroupCommonValue(group.items, item => item.mask.expansion === "" || item.mask.expansion === null || typeof item.mask.expansion === "undefined" ? 0 : Number(item.mask.expansion)),
      feather: maskGroupCommonValue(group.items, item => item.mask.feather && item.mask.feather.length !== undefined ? [Number(item.mask.feather[0] || 0), Number(item.mask.feather[1] || 0)] : [0, 0])
    };
    group.common = common;
    group.selected = group.items.some(item => !!item.mask.selected);
    group.enabled = !common.enabled.mixed ? !!common.enabled.value : true;
  });
  return groups;
}

function renderMaskGroupedPanel(layers, existingGroups) {
  const groups = existingGroups || buildMaskNameGroups(layers);
  if (!groups.length) return `<div class="layer-style-empty mask-control-empty">No masks on the selected layers.</div>`;
  return `
    <section class="mask-control-layer mask-control-grouped">
      <div class="mask-control-layer-head">
        <strong>Mask Groups</strong>
        <span>${groups.length} name group${groups.length === 1 ? "" : "s"}</span>
      </div>
      <div class="layer-style-node-row mask-control-node-row">
        ${groups.map(renderMaskGroupNode).join("")}
      </div>
    </section>
  `;
}

function renderMaskMassEditPanel(totalMasks, layerCount) {
  return `
    <section class="mask-control-mass-panel">
      <div class="mask-control-mass-head">
        <strong>Mass Edit</strong>
        <span>${escapeHtml(totalMasks)} mask${totalMasks === 1 ? "" : "s"} on ${escapeHtml(layerCount)} selected layer${layerCount === 1 ? "" : "s"}</span>
      </div>
      <div class="mask-control-mass-grid">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-bulk-control="mode">
            ${renderMaskModeOptions(2)}
          </select>
          <button type="button" data-mask-bulk-apply="mode">Apply</button>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-bulk-control="inverted">
          <button type="button" data-mask-bulk-apply="inverted">Apply</button>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskBulkSliderNumber("opacity", 100, 0, 100, 1)}
          <button type="button" data-mask-bulk-apply="opacity">Apply</button>
        </label>
        <div class="mask-control-prop-group mask-control-mass-feather">
          <div class="mask-control-prop-group-head">
            <span>Feather</span>
            <button type="button" data-mask-bulk-apply="feather">Apply</button>
          </div>
          <label class="mask-control-prop compact">
            <span>X</span>
            ${renderMaskBulkSliderNumber("feather-x", 0, 0, 500, 0.1)}
          </label>
          <label class="mask-control-prop compact">
            <span>Y</span>
            ${renderMaskBulkSliderNumber("feather-y", 0, 0, 500, 0.1)}
          </label>
        </div>
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskBulkSliderNumber("expansion", 0, -500, 500, 0.1)}
          <button type="button" data-mask-bulk-apply="expansion">Apply</button>
        </label>
      </div>
    </section>
  `;
}

function renderMaskNode(layer, mask) {
  const enabled = mask.enabled !== false;
  const active = !!mask.selected;
  const modeValue = mask.modeValue === "" || mask.modeValue === null || typeof mask.modeValue === "undefined" ? 2 : Number(mask.modeValue);
  const opacity = mask.opacity === "" || mask.opacity === null || typeof mask.opacity === "undefined" ? 100 : Number(mask.opacity);
  const expansion = mask.expansion === "" || mask.expansion === null || typeof mask.expansion === "undefined" ? 0 : Number(mask.expansion);
  const feather = mask.feather && mask.feather.length !== undefined ? mask.feather : [0, 0];
  const featherX = Number(feather[0] || 0);
  const featherY = Number(feather[1] || 0);
  const lastModeValue = modeValue && modeValue !== 1 ? modeValue : 2;
  return `
    <section class="layer-style-node mask-control-node${enabled ? "" : " disabled"}${active ? " active" : ""}" data-layer-index="${escapeHtml(layer.index)}" data-mask-index="${escapeHtml(mask.index)}" data-mask-last-mode="${escapeHtml(lastModeValue)}">
      <span class="mask-control-node-strip"></span>
      <span class="mask-control-node-head">
        <strong>${escapeHtml(mask.name || ("Mask " + mask.index))}</strong>
        <em>${escapeHtml(mask.mode || "Mode")}</em>
      </span>
      <div class="mask-control-props">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-control="mode">
            ${renderMaskModeOptions(modeValue)}
          </select>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-control="inverted" ${mask.inverted ? "checked" : ""}>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskSliderNumber("opacity", opacity, 0, 100, 1)}
        </label>
        ${renderMaskProportionalSliderGroup("feather", [featherX, featherY], 0, 500, 0.1)}
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskSliderNumber("expansion", expansion, -500, 500, 0.1)}
        </label>
      </div>
    </section>
  `;
}

function renderMaskGroupNode(group) {
  const common = group.common || {};
  const modeValue = common.modeValue && !common.modeValue.mixed ? Number(common.modeValue.value) : "";
  const modeLabel = common.mode && !common.mode.mixed ? (common.mode.value || "Mode") : "--";
  const opacity = common.opacity && !common.opacity.mixed ? Number(common.opacity.value) : "";
  const expansion = common.expansion && !common.expansion.mixed ? Number(common.expansion.value) : "";
  const featherValue = common.feather && !common.feather.mixed && common.feather.value && common.feather.value.length !== undefined ? common.feather.value : ["", ""];
  const lastModeValue = modeValue && modeValue !== 1 ? modeValue : 2;
  const targetJson = JSON.stringify(group.targets || []);
  const layerSummary = group.layerNames && group.layerNames.length
    ? `${group.items.length} mask${group.items.length === 1 ? "" : "s"} / ${group.layerNames.length} layer${group.layerNames.length === 1 ? "" : "s"}`
    : `${group.items.length} mask${group.items.length === 1 ? "" : "s"}`;
  return `
    <section class="layer-style-node mask-control-node mask-control-group-node${group.enabled ? "" : " disabled"}${group.selected ? " active" : ""}" data-mask-targets="${escapeHtml(targetJson)}" data-mask-last-mode="${escapeHtml(lastModeValue)}">
      <span class="mask-control-node-strip"></span>
      <span class="mask-control-node-head">
        <strong>${escapeHtml(group.name)}</strong>
        <em>${escapeHtml(modeLabel)} · ${escapeHtml(layerSummary)}</em>
      </span>
      <div class="mask-control-props">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-control="mode" ${common.modeValue && common.modeValue.mixed ? 'data-mask-mixed="true"' : ""}>
            ${renderMaskModeOptions(modeValue, common.modeValue && common.modeValue.mixed)}
          </select>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-control="inverted" ${common.inverted && common.inverted.value ? "checked" : ""} ${common.inverted && common.inverted.mixed ? 'data-mask-mixed="true"' : ""}>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskSliderNumber("opacity", opacity, 0, 100, 1, common.opacity && common.opacity.mixed)}
        </label>
        ${renderMaskProportionalSliderGroup("feather", featherValue, 0, 500, 0.1, common.feather && common.feather.mixed)}
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskSliderNumber("expansion", expansion, -500, 500, 0.1, common.expansion && common.expansion.mixed)}
        </label>
      </div>
    </section>
  `;
}

function renderMaskProportionalSliderGroup(groupId, values, min, max, step, mixed) {
  const group = MASK_PROPORTIONAL_GROUPS[groupId];
  if (!group) return "";
  const controls = group.controls || [];
  const axes = group.axes || [];
  const numbers = controls.map((_, index) => mixed ? "" : Number(values && values[index] || 0));
  const linked = !mixed && numbers.length > 1 && numbers.every(value => Math.abs(value - numbers[0]) < 0.001);
  return `
    <div class="mask-control-prop-group" data-mask-link-group="${escapeHtml(groupId)}" data-mask-link-active="${linked ? "true" : "false"}">
      <div class="mask-control-prop-group-head">
        <span>${escapeHtml(group.label || groupId)}</span>
        <button type="button" class="mask-control-link${linked ? " linked" : ""}" data-mask-link-toggle="${escapeHtml(groupId)}" title="Link ${escapeHtml((axes.join(" and ") || "values"))}" aria-label="Link ${escapeHtml((axes.join(" and ") || "values"))}"></button>
      </div>
      ${controls.map((control, index) => `
        <label class="mask-control-prop compact">
          <span>${escapeHtml(axes[index] || String(index + 1))}</span>
          ${renderMaskSliderNumber(control, numbers[index], min, max, step, mixed)}
        </label>
      `).join("")}
    </div>
  `;
}

function renderMaskSliderNumber(control, value, min, max, step, mixed) {
  const rounded = mixed ? "" : Math.round(Number(value || 0) * 100) / 100;
  const displayValue = mixed ? "--" : rounded;
  const sliderValue = Math.max(min, Math.min(max, rounded));
  const rangePercent = max === min ? 0 : Math.max(0, Math.min(100, ((sliderValue - min) / (max - min)) * 100));
  return `
    <span class="mask-control-pair">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${mixed ? min : sliderValue}" data-mask-control="${control}" data-mask-control-kind="range" ${mixed ? 'data-mask-mixed="true"' : ""} style="--range-fill:${mixed ? 0 : rangePercent}%">
      <input type="text" inputmode="decimal" value="${escapeHtml(displayValue)}" data-mask-control="${control}" data-mask-control-kind="number" ${mixed ? 'data-mask-mixed="true"' : ""}>
    </span>
  `;
}

function renderMaskBulkSliderNumber(control, value, min, max, step) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  const sliderValue = Math.max(min, Math.min(max, rounded));
  const rangePercent = max === min ? 0 : Math.max(0, Math.min(100, ((sliderValue - min) / (max - min)) * 100));
  return `
    <span class="mask-control-pair">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${sliderValue}" data-mask-bulk-control="${control}" data-mask-bulk-kind="range" style="--range-fill:${rangePercent}%">
      <input type="number" min="${min}" max="${max}" step="${step}" value="${rounded}" data-mask-bulk-control="${control}" data-mask-bulk-kind="number">
    </span>
  `;
}

function renderMaskModeOptions(value, mixed) {
  const options = [
    [1, "None"],
    [2, "Add"],
    [3, "Subtract"],
    [4, "Intersect"],
    [5, "Lighten"],
    [6, "Darken"],
    [7, "Difference"]
  ].map(option => `<option value="${option[0]}" ${Number(value) === option[0] ? "selected" : ""}>${escapeHtml(option[1])}</option>`).join("");
  return `${mixed ? '<option value="" selected>--</option>' : ""}${options}`;
}

function bindMaskControlNodes(root) {
  bindMaskBulkControls(root);
  root.querySelectorAll(".mask-control-node[data-mask-index], .mask-control-node[data-mask-targets]").forEach(node => {
    node.addEventListener("click", async event => {
      if (event.target.closest && event.target.closest("input, select, button, textarea")) return;
      const targets = maskTargetsFromNode(node);
      if (targets.length) await selectMaskFromPanel(Number(targets[0].layerIndex), Number(targets[0].maskIndex));
      root.querySelectorAll(".mask-control-node.active").forEach(item => item.classList.remove("active"));
      node.classList.add("active");
    });
  });
  root.querySelectorAll("[data-mask-link-toggle]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const group = button.closest("[data-mask-link-group]");
      const node = button.closest("[data-mask-index], [data-mask-targets]");
      if (!group || !node) return;
      const linked = group.dataset.maskLinkActive !== "true";
      group.dataset.maskLinkActive = linked ? "true" : "false";
      button.classList.toggle("linked", linked);
      if (!linked) return;
      const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
      const firstControl = linkGroup && linkGroup.controls && linkGroup.controls[0];
      const source = firstControl
        ? group.querySelector(`[data-mask-control="${firstControl}"][data-mask-control-kind="number"]`) || group.querySelector(`[data-mask-control="${firstControl}"]`)
        : null;
      if (!source) return;
      mirrorMaskProportionalValue(source, group);
      await setMaskControlValue(node, source, { refresh: false });
    });
  });
  root.querySelectorAll("[data-mask-control]").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("focus", () => {
      if (input.dataset.maskMixed === "true" && input.dataset.maskControlKind === "number" && input.value === "--") input.value = "";
    });
    input.addEventListener("input", () => {
      syncMaskPairedControl(input);
      syncMaskLinkedControls(input);
      syncMaskProportionalControls(input);
      updateMaskRangeFills(input);
      if (input.dataset.maskControlKind === "range") scheduleLiveMaskSlider(input);
    });
    input.addEventListener("change", async () => {
      clearLiveMaskSlider(input);
      syncMaskPairedControl(input);
      syncMaskLinkedControls(input);
      syncMaskProportionalControls(input);
      updateMaskRangeFills(input);
      const node = input.closest("[data-mask-index], [data-mask-targets]");
      if (!node) return;
      await setMaskControlValue(node, input);
    });
  });
  root.querySelectorAll('input[type="checkbox"][data-mask-mixed="true"]').forEach(input => {
    input.indeterminate = true;
  });
}

function bindMaskBulkControls(root) {
  root.querySelectorAll("[data-mask-bulk-control]").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("input", () => {
      syncMaskBulkPairedControl(input);
      updateMaskBulkRangeFills(input);
    });
    input.addEventListener("change", () => {
      syncMaskBulkPairedControl(input);
      updateMaskBulkRangeFills(input);
    });
  });
  root.querySelectorAll("[data-mask-bulk-apply]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await applyMaskBulkControl(root, button.dataset.maskBulkApply);
    });
  });
}

function syncMaskBulkPairedControl(input) {
  const control = input.dataset.maskBulkControl;
  const kind = input.dataset.maskBulkKind;
  if (!control || !kind) return;
  const pair = input.closest(".mask-control-pair");
  if (!pair) return;
  const otherKind = kind === "range" ? "number" : "range";
  const other = pair.querySelector(`[data-mask-bulk-control="${control}"][data-mask-bulk-kind="${otherKind}"]`);
  if (other) other.value = input.value;
}

function updateMaskBulkRangeFills(input) {
  const panel = input && input.closest ? input.closest(".mask-control-mass-panel") : null;
  if (!panel) return;
  panel.querySelectorAll('[data-mask-bulk-kind="range"]').forEach(updateLayerStyleRangeFill);
}

async function applyMaskBulkControl(root, propertyName) {
  const panel = root.querySelector(".mask-control-mass-panel");
  if (!panel || !propertyName) return;
  let value;
  if (propertyName === "inverted") {
    const input = panel.querySelector('[data-mask-bulk-control="inverted"]');
    value = !!(input && input.checked);
  } else if (propertyName === "feather") {
    const x = panel.querySelector('[data-mask-bulk-control="feather-x"][data-mask-bulk-kind="number"]');
    const y = panel.querySelector('[data-mask-bulk-control="feather-y"][data-mask-bulk-kind="number"]');
    value = [Number((x && x.value) || 0), Number((y && y.value) || 0)];
  } else {
    const input = panel.querySelector(`[data-mask-bulk-control="${propertyName}"]`);
    value = Number((input && input.value) || 0);
  }
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedMasksProperty", [propertyName, value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not mass edit masks.";
    return;
  }
  const maskCount = Number(result.maskCount || 0);
  statusEl.textContent = `Updated ${maskCount} selected-layer mask${maskCount === 1 ? "" : "s"}.`;
  await refreshMaskControlPanelContent();
}

function syncMaskPairedControl(input) {
  const control = input.dataset.maskControl;
  const kind = input.dataset.maskControlKind;
  if (!control || !kind) return;
  const pair = input.closest(".mask-control-pair");
  if (!pair) return;
  const otherKind = kind === "range" ? "number" : "range";
  const other = pair.querySelector(`[data-mask-control="${control}"][data-mask-control-kind="${otherKind}"]`);
  if (other) other.value = input.value;
}

function updateMaskRangeFills(input) {
  const node = input && input.closest ? input.closest("[data-mask-index], [data-mask-targets]") : null;
  if (!node) return;
  node.querySelectorAll('[data-mask-control-kind="range"]').forEach(updateLayerStyleRangeFill);
}

function syncMaskLinkedControls(input) {
  const node = input.closest("[data-mask-index], [data-mask-targets]");
  if (!node) return;
  const control = input.dataset.maskControl;
  if (control === "mode") {
    const mode = Number(input.value);
    node.classList.toggle("disabled", mode === 1);
    if (mode && mode !== 1) node.dataset.maskLastMode = String(mode);
  }
}

function syncMaskProportionalControls(input) {
  const control = input.dataset.maskControl;
  const group = input.closest("[data-mask-link-group]");
  if (!group || group.dataset.maskLinkActive !== "true") return;
  const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
  if (!linkGroup || (linkGroup.controls || []).indexOf(control) < 0) return;
  mirrorMaskProportionalValue(input, group);
}

function mirrorMaskProportionalValue(input, group) {
  const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
  if (!linkGroup || !(linkGroup.controls || []).length) return;
  const sourceControl = input.dataset.maskControl;
  const value = input.value;
  linkGroup.controls.forEach(control => {
    group.querySelectorAll(`[data-mask-control="${control}"]`).forEach(target => {
      if (target !== input) target.value = value;
    });
  });
}

function scheduleLiveMaskSlider(input) {
  clearLiveMaskSlider(input);
  const timer = setTimeout(async () => {
    maskSliderLiveTimers.delete(input);
    const node = input.closest("[data-mask-index], [data-mask-targets]");
    if (!node) return;
    await setMaskControlValue(node, input, { refresh: false, status: false });
  }, 55);
  maskSliderLiveTimers.set(input, timer);
}

function clearLiveMaskSlider(input) {
  const timer = maskSliderLiveTimers.get(input);
  if (!timer) return;
  clearTimeout(timer);
  maskSliderLiveTimers.delete(input);
}

async function selectMaskFromPanel(layerIndex, maskIndex) {
  suppressSyncUntil = Date.now() + 900;
  state.selectedLayerIndices = [Number(layerIndex)];
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectMask", [layerIndex, maskIndex]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not select mask.";
    return;
  }
  statusEl.textContent = `Selected mask ${maskIndex} on layer ${layerIndex}.`;
}

function maskTargetsFromNode(node) {
  if (!node) return [];
  if (node.dataset.maskTargets) {
    try {
      const targets = JSON.parse(node.dataset.maskTargets || "[]");
      return Array.isArray(targets) ? targets.filter(target => Number(target.layerIndex) > 0 && Number(target.maskIndex) > 0) : [];
    } catch (_) {
      return [];
    }
  }
  const layerIndex = Number(node.dataset.layerIndex || 0);
  const maskIndex = Number(node.dataset.maskIndex || 0);
  return layerIndex > 0 && maskIndex > 0 ? [{ layerIndex, maskIndex }] : [];
}

async function setMaskControlValue(node, input, options = {}) {
  const targets = maskTargetsFromNode(node);
  const layerIndex = Number(targets[0] && targets[0].layerIndex || 0);
  const maskIndex = Number(targets[0] && targets[0].maskIndex || 0);
  const control = input.dataset.maskControl;
  let propertyName = control;
  let value = input.value;
  if (control === "inverted") {
    value = !!input.checked;
  } else if (control === "mode" || control === "opacity" || control === "expansion") {
    value = Number(input.value);
    if (!Number.isFinite(value)) {
      statusEl.textContent = "Enter a value before applying mixed mask properties.";
      return;
    }
    if (control === "mode" && value !== 1) node.dataset.maskLastMode = String(value);
  } else {
    const group = input.closest("[data-mask-link-group]");
    const linkGroup = group && MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
    if (linkGroup && (linkGroup.controls || []).indexOf(control) >= 0) {
      propertyName = linkGroup.propertyName;
      value = linkGroup.controls.map(item => Number((node.querySelector(`[data-mask-control="${item}"][data-mask-control-kind="number"]`) || node.querySelector(`[data-mask-control="${item}"]`) || {}).value || 0));
      if (value.some(item => !Number.isFinite(item))) {
        statusEl.textContent = "Enter feather values before applying mixed mask properties.";
        return;
      }
    }
  }
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = targets.length > 1
    ? await aeCall("TNT_setMaskTargetsProperty", [targets, propertyName, value])
    : await aeCall("TNT_setMaskProperty", [layerIndex, maskIndex, propertyName, value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not update mask.";
    if (control === "inverted") input.checked = !input.checked;
    return;
  }
  if (control === "mode") {
    node.classList.toggle("disabled", Number(value) === 1);
  }
  if (options.status !== false) statusEl.textContent = targets.length > 1 ? `Updated ${targets.length} grouped masks.` : `Updated mask ${maskIndex}.`;
  if (options.refresh !== false) await refreshMaskControlPanelContent();
}

function rgbArrayToHex(value) {
  const arr = value && value.length !== undefined ? value : [0, 0, 0];
  function hex(channel) {
    const n = Math.max(0, Math.min(255, Math.round(Number(channel || 0) * 255)));
    const s = n.toString(16);
    return s.length === 1 ? "0" + s : s;
  }
  return "#" + hex(arr[0]) + hex(arr[1]) + hex(arr[2]);
}

function hexToRgbArray(hex) {
  const raw = String(hex || "#000000").replace("#", "");
  const value = raw.length === 3 ? raw.split("").map(ch => ch + ch).join("") : raw;
  const intValue = parseInt(value, 16);
  if (Number.isNaN(intValue)) return [0, 0, 0];
  return [
    ((intValue >> 16) & 255) / 255,
    ((intValue >> 8) & 255) / 255,
    (intValue & 255) / 255
  ];
}

function layerStylePresetFolderPath() {
  return `${extensionRootPath()}/presets/layer-styles`;
}

function parseLayerStylePresetCommandResult(result) {
  if (!result || !result.ok) return result || { ok: false, error: "Panel command failed." };
  if (typeof result.result !== "string") return result;
  try {
    const inner = JSON.parse(result.result || "{}");
    if (inner && typeof inner === "object" && Object.prototype.hasOwnProperty.call(inner, "ok")) return inner;
  } catch (_) {}
  return result;
}

async function callLayerStylePresetCommand(functionName, args = []) {
  const encodedArgs = args.map(value => JSON.stringify(value)).join(",");
  const path = jsxPath();
  const script = `
    (function () {
      $.evalFile('${escForExtendScriptString(path)}');
      if (typeof ${functionName} !== "function") {
        return JSON.stringify({ ok: false, error: "TNT function not available after reload: ${functionName}", path: '${escForExtendScriptString(path)}' });
      }
      return ${functionName}(${encodedArgs});
    }())
  `;
  return parseLayerStylePresetCommandResult(await aeEvalScript(script));
}

async function openLayerStyleAddDialog() {
  return openLayerStylePanel();
}

async function openLayerStyleEditDialog() {
  return openLayerStylePanel();
}

async function openLayerStylePanel() {
  closeFxConsole();
  const wasOpen = !!(layerStyleDialogEl && layerStyleDialogEl.classList.contains("show"));
  const el = showLayerStyleDialog("Layer Styles", "Add missing styles and edit existing ones in one panel.");
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading layer styles...</div>`;
  actions.innerHTML = `
    <button type="button" data-action="refresh">Refresh</button>
    <button type="button" data-action="save-preset">Save Style</button>
    <button type="button" data-action="restore">Undo Style Edits</button>
    <button type="button" data-action="hide">Hide All</button>
    <button type="button" data-action="delete" class="danger">Delete All</button>
  `;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", refreshLayerStylePanelContent);
  actions.querySelector('[data-action="save-preset"]').addEventListener("click", saveCurrentLayerStylePreset);
  actions.querySelector('[data-action="restore"]').addEventListener("click", async () => {
    if (!layerStyleEditSnapshot) {
      statusEl.textContent = "No style edit snapshot to restore.";
      return;
    }
    await callTntV3Command("seRestoreSnapshot", [JSON.stringify(layerStyleEditSnapshot)], { status: false, localFirst: true });
    await refreshLayerStylePanelContent();
  });
  actions.querySelector('[data-action="hide"]').addEventListener("click", async () => {
    rawLayerStyleGmnsFromPanel().forEach(gMn => layerStylePinnedOff.add(gMn));
    await callTntV3Command("hideAllLayerStyles", [], { status: false, localFirst: true });
    await refreshLayerStylePanelContent();
  });
  actions.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    await callTntV3Command("removeAllLayerStyles", [], { status: false, localFirst: true });
    layerStyleKnownAdded.clear();
    layerStylePinnedOff.clear();
    layerStyleLastByGmn.clear();
    await refreshLayerStylePanelContent();
  });
  await refreshLayerStylePanelContent({ showLoading: !wasOpen });
}

async function refreshLayerStylePanelContent(options = {}) {
  const el = ensureLayerStyleDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  const previousScrollLeft = body ? body.scrollLeft : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading layer styles...</div>`;
  const statusResult = await callTntV3Command("getStyleStatusJSON", [], { status: false, localFirst: true });
  let status = {};
  try { status = JSON.parse(statusResult.result || "{}"); } catch (_) {}
  const presetData = await callLayerStylePresetCommand("TNT_getLayerStylePresetsJSON", [layerStylePresetFolderPath()]);
  const presets = Array.isArray(presetData.presets) ? presetData.presets : [];

  const result = await callTntV3Command("TNT_getLayerStylePanelJSON", [], { status: false, localFirst: true });
  let data = null;
  try { data = JSON.parse(result.result || "{}"); } catch (_) {}
  const rawStyles = data && Array.isArray(data.styles) ? data.styles : [];
  const stylePresence = {};
  rawStyles.forEach(style => {
    if (!style || !style.gMn) return;
    if (Number(style.enabled || 0) > 0 || layerStylePinnedOff.has(style.gMn)) {
      layerStyleLastByGmn.set(style.gMn, Object.assign({}, style));
    }
    stylePresence[style.gMn] = {
      have: Number(style.have || 0),
      enabled: Number(style.enabled || 0),
      total: Number(style.total || 0)
    };
  });
  layerStylePinnedOff.forEach(gMn => {
    const presence = stylePresence[gMn];
    if (gMn !== layerStyleRecentAddGmn && (!presence || Number(presence.have || 0) <= 0)) {
      layerStylePinnedOff.delete(gMn);
      layerStyleLastByGmn.delete(gMn);
      layerStyleKnownAdded.delete(gMn);
    }
  });
  layerStyleKnownAdded.forEach(gMn => {
    if (gMn === layerStyleRecentAddGmn) return;
    layerStyleKnownAdded.delete(gMn);
  });
  const styles = rawStyles.filter(style => {
    const gMn = style && style.gMn;
    const enabled = gMn ? Number(style.enabled || 0) : 0;
    return enabled > 0 || (gMn && (layerStylePinnedOff.has(gMn) || gMn === layerStyleRecentAddGmn));
  });
  layerStylePinnedOff.forEach(gMn => {
    if (styles.some(style => style && style.gMn === gMn)) return;
    const cached = layerStyleLastByGmn.get(gMn);
    if (cached) styles.push(Object.assign({}, cached, { enabled: 0 }));
  });
  styles.sort((a, b) => layerStyleVisualOrder(a && a.gMn) - layerStyleVisualOrder(b && b.gMn));
  const addButtons = TNT_LAYER_STYLE_MAP
    .map((style, index) => {
      const baseStatus = status[style.gMn] || {};
      const presence = stylePresence[style.gMn] || {};
      return {
        style,
        index,
        status: {
          total: Number(presence.total || baseStatus.total || 0),
          have: Number(presence.enabled || baseStatus.have || (layerStylePinnedOff.has(style.gMn) ? presence.total || baseStatus.total || 1 : 0)),
          enabled: Number(presence.enabled || baseStatus.have || 0),
          missing: layerStylePinnedOff.has(style.gMn) ? 0 : Math.max(0, Number(presence.total || baseStatus.total || 0) - Number(presence.enabled || baseStatus.have || 0))
        }
      };
    });
  layerStyleEditSnapshot = data && data.snapshot ? data.snapshot : null;
  const styleLayerCount = rawStyles.reduce((max, style) => Math.max(max, Number(style && style.total || 0)), 0) ||
    (state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.length : 0);
  const addRowHtml = addButtons.length
    ? `<div class="layer-style-header-add-row">${addButtons.map(item => renderLayerStyleAddButton(item.style, item.index, item.status)).join("")}</div>`
    : `<div class="layer-style-header-add-row empty"><span>All styles added</span></div>`;
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `<b class="layer-style-shortcut-badge">S</b><span>Layer Styles</span><em class="layer-style-layer-count">${styleLayerCount || 0} layer${styleLayerCount === 1 ? "" : "s"}</em>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="layer-style-layout">
      <section class="layer-style-presets-panel">
        ${layerStylePresetNameOpen ? renderLayerStylePresetNameForm() : ""}
        ${presets.length ? `<div class="layer-style-presets-row">${presets.map(renderLayerStylePresetButton).join("")}</div>` : (layerStylePresetNameOpen ? "" : `<div class="layer-style-presets-empty">No saved styles yet.</div>`)}
      </section>
      <section class="layer-style-add-panel">
        ${addRowHtml}
      </section>
      <section class="layer-style-edit-panel">
        ${styles.length ? `<div class="layer-style-node-row${layerStyleRecentAddGmn ? " is-adding" : ""}">${styles.map(style => renderLayerStyleNode(style)).join("")}</div>` : `<div class="layer-style-empty">No layer styles have been added yet.</div>`}
      </section>
    </div>
  `;
  el.querySelectorAll("[data-style-add-index]").forEach(button => {
    bindLayerStyleAddButton(button);
  });
  bindLayerStylePresetNameForm(body);
  bindLayerStylePresetControls(body);
  bindLayerStyleEditControls(body);
  body.scrollTop = previousScrollTop;
  body.scrollLeft = previousScrollLeft;
  if (layerStyleRecentAddGmn) {
    const addedGmn = layerStyleRecentAddGmn;
    setTimeout(() => focusLayerStyleNode(addedGmn), 70);
    setTimeout(() => {
      const row = body.querySelector(".layer-style-node-row");
      const node = body.querySelector(`.layer-style-node[data-gmn="${cssEscapeValue(addedGmn)}"]`);
      if (row) row.classList.remove("is-adding");
      if (node) node.classList.remove("style-node-new");
      if (layerStyleRecentAddGmn === addedGmn) layerStyleRecentAddGmn = "";
    }, 760);
  }
}

async function saveCurrentLayerStylePreset() {
  layerStylePresetNameOpen = true;
  await refreshLayerStylePanelContent();
  const input = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-name]");
  setTimeout(() => {
    if (!input) return;
    try { input.focus({ preventScroll: true }); }
    catch (_) { try { input.focus(); } catch (__) {} }
    if (input.select) input.select();
  }, 0);
}

function renderLayerStylePresetNameForm() {
  return `
    <form class="layer-style-preset-save-form" data-style-preset-save-form>
      <input type="text" data-style-preset-name placeholder="Style name" spellcheck="false" autocomplete="off">
      <button type="button" class="primary" data-style-preset-submit>Save</button>
      <button type="button" data-style-preset-cancel>Cancel</button>
      <span class="layer-style-preset-save-message" data-style-preset-message></span>
    </form>
  `;
}

function bindLayerStylePresetNameForm(root) {
  const form = root.querySelector("[data-style-preset-save-form]");
  if (!form) return;
  const input = form.querySelector("[data-style-preset-name]");
  const submit = form.querySelector("[data-style-preset-submit]");
  const cancel = form.querySelector("[data-style-preset-cancel]");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    await submitLayerStylePresetName(input ? input.value : "");
  });
  if (submit) {
    submit.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await submitLayerStylePresetName(input ? input.value : "");
    });
  }
  form.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    layerStylePresetNameOpen = false;
    refreshLayerStylePanelContent();
  });
  if (cancel) {
    cancel.addEventListener("click", () => {
      layerStylePresetNameOpen = false;
      refreshLayerStylePanelContent();
    });
  }
}

function setLayerStylePresetSaveMessage(message, isError) {
  const messageEl = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-message]");
  if (messageEl) {
    messageEl.textContent = message || "";
    messageEl.classList.toggle("error", !!isError);
  }
  if (message) statusEl.textContent = message;
}

async function submitLayerStylePresetName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    setLayerStylePresetSaveMessage("Style preset needs a name.", true);
    return;
  }
  const form = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-save-form]");
  const controls = form ? Array.from(form.querySelectorAll("input, button")) : [];
  controls.forEach(control => { control.disabled = true; });
  setLayerStylePresetSaveMessage("Saving...", false);
  const result = await callLayerStylePresetCommand("TNT_saveSelectedLayerStylePreset", [trimmed, layerStylePresetFolderPath()]);
  if (!result.ok) {
    controls.forEach(control => { control.disabled = false; });
    setLayerStylePresetSaveMessage(result.error || "Could not save style preset.", true);
    return;
  }
  layerStylePresetNameOpen = false;
  setLayerStylePresetSaveMessage(result.result || "Style preset saved.", false);
  await refreshLayerStylePanelContent();
}

function layerStylePresetProp(style, matchName, fallback) {
  const props = Array.isArray(style && style.props) ? style.props : [];
  const prop = props.find(item => item && item.mn === matchName);
  return prop ? prop.value : fallback;
}

function layerStylePresetStyle(preset, gMn) {
  const styles = Array.isArray(preset && preset.styles) ? preset.styles : [];
  return styles.find(style => style && style.gMn === gMn) || null;
}

function layerStylePresetCssColor(value, opacity = 1, fallback = "#9b1d32") {
  const alpha = Math.max(0, Math.min(1, Number(opacity)));
  if (value && value.length !== undefined && typeof value !== "string") {
    const r = Math.max(0, Math.min(255, Math.round(Number(value[0] || 0) * 255)));
    const g = Math.max(0, Math.min(255, Math.round(Number(value[1] || 0) * 255)));
    const b = Math.max(0, Math.min(255, Math.round(Number(value[2] || 0) * 255)));
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
  if (typeof value === "string" && value) return value;
  return fallback;
}

function layerStylePresetPreviewCss(preset) {
  const colorOverlay = layerStylePresetStyle(preset, "solidFill/enabled");
  const stroke = layerStylePresetStyle(preset, "frameFX/enabled");
  const shadow = layerStylePresetStyle(preset, "dropShadow/enabled");
  const outerGlow = layerStylePresetStyle(preset, "outerGlow/enabled");
  const innerGlow = layerStylePresetStyle(preset, "innerGlow/enabled");
  const satin = layerStylePresetStyle(preset, "chromeFX/enabled");

  let fill = colorOverlay
    ? layerStylePresetCssColor(layerStylePresetProp(colorOverlay, "solidFill/color", null), Number(layerStylePresetProp(colorOverlay, "solidFill/opacity", 100)) / 100)
    : "";
  if (!fill) {
    const firstColorStyle = (preset.styles || []).find(style => style && style.previewColor);
    fill = firstColorStyle ? firstColorStyle.previewColor : "#9b1d32";
  }

  const strokeWidth = stroke ? Math.max(1, Math.min(5, Math.round(Number(layerStylePresetProp(stroke, "frameFX/size", 2)) * 0.34))) : 0;
  const strokeOpacity = stroke ? Number(layerStylePresetProp(stroke, "frameFX/opacity", 100)) / 100 : 1;
  const strokeColor = stroke ? layerStylePresetCssColor(layerStylePresetProp(stroke, "frameFX/color", null), strokeOpacity, "#ffffff") : "rgba(255,255,255,.88)";
  const shadows = [];

  if (shadow) {
    const angle = Number(layerStylePresetProp(shadow, "dropShadow/localLightingAngle", 120)) * Math.PI / 180;
    const distance = Math.max(0, Number(layerStylePresetProp(shadow, "dropShadow/distance", 16))) * 0.22;
    const blur = Math.max(1, Number(layerStylePresetProp(shadow, "dropShadow/blur", 8)) * 0.18);
    const opacity = Number(layerStylePresetProp(shadow, "dropShadow/opacity", 45)) / 100;
    const x = Math.cos(angle) * distance;
    const y = -Math.sin(angle) * distance;
    shadows.push(`${x.toFixed(1)}px ${y.toFixed(1)}px ${blur.toFixed(1)}px ${layerStylePresetCssColor(layerStylePresetProp(shadow, "dropShadow/color", null), opacity, "rgba(0,0,0,.45)")}`);
  }
  if (outerGlow) {
    const blur = Math.max(2, Number(layerStylePresetProp(outerGlow, "outerGlow/blur", 12)) * 0.16);
    const opacity = Number(layerStylePresetProp(outerGlow, "outerGlow/opacity", 60)) / 100;
    shadows.push(`0 0 ${blur.toFixed(1)}px ${layerStylePresetCssColor(layerStylePresetProp(outerGlow, "outerGlow/color", null), opacity, "rgba(255,255,255,.55)")}`);
  }
  if (innerGlow) {
    const opacity = Number(layerStylePresetProp(innerGlow, "innerGlow/opacity", 40)) / 100;
    shadows.push(`0 0 2px ${layerStylePresetCssColor(layerStylePresetProp(innerGlow, "innerGlow/color", null), opacity, "rgba(255,255,255,.35)")}`);
  }
  if (satin) {
    const opacity = Number(layerStylePresetProp(satin, "chromeFX/opacity", 28)) / 100;
    shadows.push(`inset 0 0 0 ${layerStylePresetCssColor(layerStylePresetProp(satin, "chromeFX/color", null), opacity, "rgba(0,0,0,.25)")}`);
  }

  const textShadow = shadows.filter(item => item.indexOf("inset") !== 0).join(", ") || "0 2px 3px rgba(0,0,0,.28)";
  return [
    `--preset-letter-fill:${fill}`,
    `--preset-letter-stroke:${strokeColor}`,
    `--preset-letter-stroke-width:${strokeWidth || 1}px`,
    `--preset-letter-shadow:${textShadow}`
  ].join(";");
}

function renderLayerStylePresetButton(preset) {
  const styles = Array.isArray(preset && preset.styles) ? preset.styles : [];
  const title = `${preset.name || "Saved Style"}${preset.sourceLayer ? ` - from ${preset.sourceLayer}` : ""}`;
  const previewCss = layerStylePresetPreviewCss({ styles });
  return `
    <button type="button" class="layer-style-preset-button" data-style-preset-id="${escapeHtml(preset.id || "")}" title="${escapeHtml(title)}">
      <span class="layer-style-preset-meta">
        <strong>${escapeHtml(preset.name || "Saved Style")}</strong>
        <em>${styles.length} style${styles.length === 1 ? "" : "s"}</em>
      </span>
      <b class="layer-style-preset-preview" style="${escapeHtml(previewCss)}"><span>A</span></b>
    </button>
  `;
}

function bindLayerStylePresetControls(root) {
  root.querySelectorAll("[data-style-preset-id]").forEach(button => {
    button.addEventListener("click", async () => {
      const result = await callLayerStylePresetCommand("TNT_applyLayerStylePreset", [button.dataset.stylePresetId || "", layerStylePresetFolderPath()]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not apply saved style.";
        return;
      }
      statusEl.textContent = result.result || "Saved style applied.";
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
}

function waitForLayerStyleCommit(delay = 110) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

function bindLayerStyleAddButton(button) {
  const focusAddedStyle = event => {
    const gMn = button.dataset.styleGmn || "";
    if (!button.classList.contains("is-added")) return false;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    focusLayerStyleNode(gMn);
    return true;
  };
  button.addEventListener("contextmenu", event => {
    focusAddedStyle(event);
  });
  button.addEventListener("auxclick", event => {
    if (event.button === 1) focusAddedStyle(event);
  });
  button.addEventListener("mousedown", event => {
    if (event.button === 1 && focusAddedStyle(event)) return;
    if (event.button !== 0 || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const style = TNT_LAYER_STYLE_MAP[Number(button.dataset.styleAddIndex)];
    if (!style) return;
    if (button.classList.contains("all-have")) {
      focusLayerStyleNode(style.gMn);
      return;
    }
    const startY = event.clientY;
    let preview = null;
    let committed = false;
    const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
    const editPanel = body && body.querySelector(".layer-style-edit-panel");

    const ensurePreview = () => {
      if (preview || !editPanel) return preview;
      preview = document.createElement("section");
      preview.className = "layer-style-node preview";
      preview.innerHTML = `
        <div class="layer-style-node-head">
          <strong>${escapeHtml(style.label)}</strong>
          <div class="layer-style-node-controls"><span class="layer-style-preview-chip">Preview</span></div>
        </div>
        <div class="layer-style-node-props">
          ${(style.preview || []).map(name => `
            <label class="layer-style-prop preview-prop">
              <span>${escapeHtml(name)}</span>
            </label>
          `).join("")}
        </div>
      `;
      const row = editPanel.querySelector(".layer-style-node-row");
      if (row) row.insertBefore(preview, row.firstChild);
      else editPanel.appendChild(preview);
      return preview;
    };

    const updatePreview = moveEvent => {
      const dy = Math.max(0, moveEvent.clientY - startY);
      const amount = Math.max(0, Math.min(1, dy / 96));
      if (amount > 0.08) {
        const el = ensurePreview();
        if (el) {
          el.style.opacity = String(0.28 + amount * 0.72);
          el.style.transform = `translateY(${Math.round((1 - amount) * -10)}px) scale(${0.96 + amount * 0.04})`;
          el.style.setProperty("--preview-amount", String(amount));
        }
        button.classList.toggle("drag-adding", amount > 0.45);
      }
    };

    const addStyle = async () => {
      if (committed) return;
      committed = true;
      const result = await callTntV3Command("applyLayerStyleCmds", [[style.cmd], [style.gMn], true], { status: false, localFirst: true });
      if (result && result.ok) {
        layerStyleKnownAdded.add(style.gMn);
        layerStyleRecentAddGmn = style.gMn;
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    };

    const finish = upEvent => {
      document.removeEventListener("mousemove", updatePreview, true);
      document.removeEventListener("mouseup", finish, true);
      button.classList.remove("drag-adding");
      const dy = Math.max(0, upEvent.clientY - startY);
      if (preview && dy < 48) preview.remove();
      addStyle();
    };

    document.addEventListener("mousemove", updatePreview, true);
    document.addEventListener("mouseup", finish, true);
  });
}

function renderLayerStyleAddButton(style, index, status) {
  const total = Number(status && status.total || 0);
  const have = Number(status && status.have || 0);
  const someHave = total > 0 && have > 0 && have < total;
  const knownAdded = layerStyleKnownAdded.has(style.gMn);
  const added = knownAdded || have > 0;
  const allHave = knownAdded || (total > 0 && have >= total);
  const className = [
    "layer-style-add-button",
    added ? "is-added" : "",
    someHave ? "some-have" : "",
    allHave ? "all-have" : ""
  ].filter(Boolean).join(" ");
  const title = `${style.label} - ${style.position || "layer style"}${added ? " - right-click to jump to its editor" : ""}${someHave ? ` (${have}/${total} selected layers have it)` : ""}`;
  return `
    <button type="button" class="${className}" data-style-add-index="${index}" data-style-gmn="${escapeHtml(style.gMn || "")}" title="${escapeHtml(title)}" style="--style-color:${escapeHtml(style.color || "#777")}">
      <span>${escapeHtml(style.label || layerStyleIconText(style.label))}</span>
    </button>
  `;
}

function rawLayerStyleGmnsFromPanel() {
  const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
  if (!body) return [];
  return Array.prototype.slice.call(body.querySelectorAll(".layer-style-node[data-gmn]"))
    .map(node => node.dataset.gmn)
    .filter(Boolean);
}

function focusLayerStyleNode(gMn) {
  const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
  if (!body || !gMn) return false;
  const nodes = Array.prototype.slice.call(body.querySelectorAll(".layer-style-node[data-gmn]"));
  const node = nodes.find(item => item.dataset.gmn === gMn);
  if (!node) return false;
  if (node.scrollIntoView) {
    try { node.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); }
    catch (_) { node.scrollIntoView(); }
  }
  node.classList.remove("style-node-flash");
  void node.offsetWidth;
  node.classList.add("style-node-flash");
  setTimeout(() => { if (node) node.classList.remove("style-node-flash"); }, 1200);
  return true;
}

function cssEscapeValue(value) {
  if (window.CSS && CSS.escape) return CSS.escape(String(value || ""));
  return String(value || "").replace(/["\\]/g, "\\$&");
}

function layerStyleIconText(label) {
  const words = String(label || "").replace("&", " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

function renderLayerStyleNode(style) {
  const enabledCount = Number(style.enabled || 0);
  const total = Number(style.total || 0);
  const enabled = enabledCount > 0;
  const mixed = total > 1 && enabledCount > 0 && enabledCount < total;
  const isNew = style.gMn === layerStyleRecentAddGmn;
  return `
    <section class="layer-style-node${enabled ? "" : " disabled"}${mixed ? " mixed" : ""}${isNew ? " style-node-new" : ""}" data-gmn="${escapeHtml(style.gMn)}">
      <div class="layer-style-node-head">
        <strong>${escapeHtml(style.label)}</strong>
        <div class="layer-style-node-controls">
          <button type="button" class="layer-style-toggle${enabled ? " on" : ""}" data-style-enable="${enabled ? "false" : "true"}" title="${enabled ? "Turn off" : "Turn on"}"><span></span></button>
          <button type="button" class="layer-style-delete" data-style-delete="true" title="Delete style">x</button>
        </div>
      </div>
      <div class="layer-style-node-props">
        ${(style.props || []).map(prop => renderLayerStyleProp(style, prop)).join("")}
      </div>
    </section>
  `;
}

function renderLayerStyleProp(style, prop) {
  const value = prop.value;
  const safeLabel = escapeHtml(prop.label || prop.mn || "Property");
  const dataAttrs = `data-gmn="${escapeHtml(style.gMn)}" data-pmn="${escapeHtml(prop.mn || "")}"`;
  if (prop.type === "slider" || prop.type === "angle") {
    const min = prop.type === "angle" ? 0 : Number(prop.min || 0);
    const max = prop.type === "angle" ? 360 : Number(prop.max || 100);
    const number = value === null || typeof value === "undefined" ? min : Number(value);
    const rangePercent = Math.max(0, Math.min(100, max === min ? 0 : ((number - min) / (max - min)) * 100));
    return `
      <label class="layer-style-prop">
        <span>${safeLabel}</span>
        <input type="range" min="${min}" max="${max}" value="${number}" ${dataAttrs} data-style-control="range" style="--range-fill:${rangePercent}%">
        <input type="number" min="${min}" max="${max}" value="${Math.round(number * 100) / 100}" ${dataAttrs} data-style-control="number">
      </label>
    `;
  }
  if (prop.type === "bool") {
    return `
      <label class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <input type="checkbox" ${value ? "checked" : ""} ${dataAttrs} data-style-control="bool">
      </label>
    `;
  }
  if (prop.type === "color") {
    const colorValue = rgbArrayToHex(value);
    return `
      <label class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <button type="button" class="layer-style-color-swatch" ${dataAttrs} data-style-control="color" style="--color-value:${escapeHtml(colorValue)}" title="Edit color"></button>
      </label>
    `;
  }
  if (prop.type === "dropdown") {
    const options = prop.options || [];
    const values = prop.values || [];
    return `
      <label class="layer-style-prop dropdown">
        <span>${safeLabel}</span>
        <select ${dataAttrs} data-style-control="dropdown">
          ${options.map((option, index) => {
            const optionValue = values[index];
            return `<option value="${optionValue}" ${Number(value) === Number(optionValue) ? "selected" : ""}>${escapeHtml(option)}</option>`;
          }).join("")}
        </select>
      </label>
    `;
  }
  if (prop.type === "gradient_btn") {
    return `
      <div class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <button type="button" data-style-control="gradient">Edit</button>
      </div>
    `;
  }
  return "";
}

function bindLayerStyleEditControls(root) {
  root.querySelectorAll("[data-style-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest(".layer-style-node");
      if (!node) return;
      const gMn = node.dataset.gmn;
      const shouldEnable = button.dataset.styleEnable === "true";
      const result = await callTntV3Command("seEnableStyle", [gMn, shouldEnable], { status: false, localFirst: true });
      if (result && result.ok && shouldEnable) {
        layerStylePinnedOff.delete(gMn);
        layerStyleRecentAddGmn = gMn;
      } else if (result && result.ok) {
        layerStylePinnedOff.add(gMn);
        const cached = layerStyleLastByGmn.get(gMn);
        if (cached) layerStyleLastByGmn.set(gMn, Object.assign({}, cached, { enabled: 0 }));
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll("[data-style-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest(".layer-style-node");
      if (!node) return;
      await loadJSX();
      const result = await aeCall("TNT_removeLayerStyle", [node.dataset.gmn]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete layer style.";
      else if (result.result) statusEl.textContent = String(result.result);
      if (result.ok) {
        layerStyleKnownAdded.delete(node.dataset.gmn);
        layerStylePinnedOff.delete(node.dataset.gmn);
        layerStyleLastByGmn.delete(node.dataset.gmn);
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll('[data-style-control="range"]').forEach(input => {
    updateLayerStyleRangeFill(input);
    input.addEventListener("input", () => {
      const number = input.parentElement.querySelector('[data-style-control="number"]');
      if (number) number.value = input.value;
      updateLayerStyleRangeFill(input);
      scheduleLiveLayerStyleSlider(input);
    });
    input.addEventListener("change", () => {
      clearLiveLayerStyleSlider(input);
      setLayerStyleProp(input, Number(input.value));
    });
  });
  root.querySelectorAll('[data-style-control="number"]').forEach(input => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      const range = input.parentElement.querySelector('[data-style-control="range"]');
      if (range) {
        range.value = value;
        updateLayerStyleRangeFill(range);
      }
      setLayerStyleProp(input, value);
    });
  });
  root.querySelectorAll('[data-style-control="bool"]').forEach(input => {
    input.addEventListener("change", () => setLayerStyleProp(input, !!input.checked));
  });
  root.querySelectorAll('[data-style-control="color"]').forEach(input => {
    input.addEventListener("click", async () => {
      const result = await callTntV3Command("sePickColor", [input.dataset.gmn, input.dataset.pmn], { status: false, localFirst: true });
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not open native color picker.";
        return;
      }
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll('[data-style-control="dropdown"]').forEach(input => {
    input.addEventListener("change", () => setLayerStyleProp(input, Number(input.value)));
  });
  root.querySelectorAll('[data-style-control="gradient"]').forEach(button => {
    button.addEventListener("click", async () => {
      await callTntV3Command("seEditGradient", [], { status: false, localFirst: true });
    });
  });
}

function updateLayerStyleRangeFill(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

function scheduleLiveLayerStyleSlider(input) {
  clearLiveLayerStyleSlider(input);
  const timer = setTimeout(() => {
    styleSliderLiveTimers.delete(input);
    setLayerStyleProp(input, Number(input.value));
  }, 55);
  styleSliderLiveTimers.set(input, timer);
}

function clearLiveLayerStyleSlider(input) {
  const timer = styleSliderLiveTimers.get(input);
  if (!timer) return;
  clearTimeout(timer);
  styleSliderLiveTimers.delete(input);
}

async function setLayerStyleProp(input, value) {
  await callTntV3Command("seSetProp", [input.dataset.gmn, input.dataset.pmn, value], { status: false, localFirst: true });
  if (!LAYER_STYLE_PANEL_KEEP_OPEN && !panelSettings.keepStyleEditorOpen) closeLayerStyleDialog();
}
