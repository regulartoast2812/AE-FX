let massEditDialogEl = null;
let massEditSourceIndex = 0;

function massEditSelectedLayers() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  return (state.layers || []).filter(layer => selected.has(Number(layer.index)));
}

function massEditProperties(layer) {
  const result = [];
  const seen = {};
  [...(layer && layer.transformProperties || []), ...(layer && layer.animatedProperties || [])].forEach(property => {
    const path = String(property && property.path || "");
    if (!path || seen[path]) return;
    seen[path] = true;
    result.push(property);
  });
  return result;
}

function ensureMassEditPanel() {
  if (massEditDialogEl) return massEditDialogEl;
  massEditDialogEl = document.createElement("div");
  massEditDialogEl.className = "mass-edit-backdrop";
  massEditDialogEl.setAttribute("aria-hidden", "true");
  massEditDialogEl.innerHTML = `
    <div class="mass-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="massEditTitle">
      <div class="mass-edit-head">
        <div class="mass-edit-title"><b>ME</b><span id="massEditTitle">Mass Edit</span><em class="mass-edit-count"></em></div>
      </div>
      <div class="mass-edit-body">
        <section class="mass-edit-source">
          <label><span>Source layer</span><select class="mass-edit-source-select" data-tooltip="Source Layer\nChoose the selected layer whose effects, keys, or property value will be copied."></select></label>
          <div class="mass-edit-target-summary"></div>
        </section>
        <section class="mass-edit-section">
          <div class="mass-edit-section-title">Transfer</div>
          <div class="mass-edit-actions">
            <button type="button" data-mass-action="effects" data-tooltip="Copy Effects\nAppend the source layer's effect stack to every other selected layer."><strong>Copy Effects</strong><span>Append the source effect stack to every target</span></button>
            <button type="button" data-mass-action="keyframes" data-tooltip="Copy Selected Keyframes\nCopy the source layer's selected keyframes to every target layer."><strong>Copy Selected Keyframes</strong><span class="mass-edit-key-summary">Select source keyframes first</span></button>
          </div>
        </section>
        <section class="mass-edit-section">
          <div class="mass-edit-section-title">Property Value</div>
          <div class="mass-edit-property-grid">
            <label><span>Property</span><select class="mass-edit-property-select" data-tooltip="Source Property\nChoose a property available on the source layer."></select></label>
            <label><span>Value</span><input class="mass-edit-value" type="text" spellcheck="false" data-tooltip="Property Value\nEdit the exact value that will be applied to every target layer."></label>
            <button type="button" class="mass-edit-apply-value" data-mass-action="value" data-tooltip="Apply to Targets\nSet this property value on every target layer.">Apply to Targets</button>
          </div>
        </section>
        <section class="mass-edit-section mass-edit-wrangler">
          <div class="mass-edit-section-title">Property Wrangler</div>
          <div class="mass-edit-wrangler-copy">Parent the matching property on each target to the selected source property.</div>
          <div class="mass-edit-actions mass-edit-wrangler-actions">
            <button type="button" data-mass-action="link-property" data-tooltip="Link Properties\nAdd a Wrangler expression so each matching target property follows the selected source property. Existing target keyframes remain underneath the expression."><strong>Link to Source</strong><span>Expression-parent matching target properties</span></button>
            <button type="button" data-mass-action="unlink-property" data-tooltip="Unlink Properties\nRemove Wrangler-generated links from the matching target properties without deleting their keyframes or values."><strong>Unlink</strong><span>Remove only Wrangler expressions</span></button>
          </div>
        </section>
        <div class="mass-edit-error"></div>
      </div>
    </div>
  `;
  document.body.appendChild(massEditDialogEl);
  massEditDialogEl.querySelectorAll("[data-tooltip]").forEach(control => {
    control.setAttribute("aria-label", control.dataset.tooltip.replace(/\n+/g, ". "));
    bindPanelTooltip(control);
  });
  massEditDialogEl.addEventListener("mousedown", event => {
    if (event.target === massEditDialogEl) hideMassEditPanel();
  });
  massEditDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideMassEditPanel();
      focusPanel(2);
    }
    if (event.key === "Enter" && event.target.classList.contains("mass-edit-value")) {
      event.preventDefault();
      runMassEditAction("value");
    }
  });
  massEditDialogEl.querySelector(".mass-edit-source-select").addEventListener("change", event => {
    massEditSourceIndex = Number(event.target.value || 0);
    renderMassEditPanel();
  });
  massEditDialogEl.querySelector(".mass-edit-property-select").addEventListener("change", loadMassEditPropertyValue);
  massEditDialogEl.addEventListener("click", event => {
    const button = event.target.closest && event.target.closest("[data-mass-action]");
    if (!button || button.disabled) return;
    runMassEditAction(button.dataset.massAction);
  });
  return massEditDialogEl;
}

function massEditTargetIndices() {
  return massEditSelectedLayers().map(layer => Number(layer.index)).filter(index => index !== Number(massEditSourceIndex));
}

async function loadMassEditPropertyValue() {
  if (!massEditDialogEl) return;
  const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
  const input = massEditDialogEl.querySelector(".mass-edit-value");
  input.value = "";
  input.disabled = !path;
  if (!path || !massEditSourceIndex) return;
  await loadJSX();
  const result = await aeCall("TNT_massGetPropertyValue", [massEditSourceIndex, path]);
  if (result.ok) input.value = result.value || "";
  else massEditDialogEl.querySelector(".mass-edit-error").textContent = result.error || "Could not read the source value.";
}

function renderMassEditPanel() {
  if (!massEditDialogEl) return;
  const layers = massEditSelectedLayers();
  if (!layers.some(layer => Number(layer.index) === Number(massEditSourceIndex))) {
    massEditSourceIndex = Number(layers[layers.length - 1] && layers[layers.length - 1].index || layers[0] && layers[0].index || 0);
  }
  const source = layers.find(layer => Number(layer.index) === Number(massEditSourceIndex));
  const targets = massEditTargetIndices();
  const sourceSelect = massEditDialogEl.querySelector(".mass-edit-source-select");
  sourceSelect.innerHTML = layers.map(layer => `<option value="${Number(layer.index)}"${Number(layer.index) === Number(massEditSourceIndex) ? " selected" : ""}>${Number(layer.index)}. ${escapeHtml(layer.name || "Layer")}</option>`).join("");
  const count = massEditDialogEl.querySelector(".mass-edit-count");
  count.textContent = `${layers.length} layer${layers.length === 1 ? "" : "s"}`;
  massEditDialogEl.querySelector(".mass-edit-target-summary").textContent = `${targets.length} target layer${targets.length === 1 ? "" : "s"}`;

  const properties = massEditProperties(source);
  const propertySelect = massEditDialogEl.querySelector(".mass-edit-property-select");
  const previousPath = propertySelect.value;
  propertySelect.innerHTML = properties.length
    ? properties.map(property => `<option value="${escapeHtml(property.path || "")}"${String(property.path || "") === previousPath ? " selected" : ""}>${escapeHtml(propertyLaneLabel(property))}</option>`).join("")
    : `<option value="">No editable properties found</option>`;

  const sourceKeys = normalizeSelectedKeyframes(selectedKeyframes).filter(key => Number(key.layerIndex) === Number(massEditSourceIndex));
  const keySummary = massEditDialogEl.querySelector(".mass-edit-key-summary");
  keySummary.textContent = sourceKeys.length ? formatKeyframeSelectionScope(sourceKeys) : "Select source keyframes first";
  const effectsButton = massEditDialogEl.querySelector('[data-mass-action="effects"]');
  const keysButton = massEditDialogEl.querySelector('[data-mass-action="keyframes"]');
  const valueButton = massEditDialogEl.querySelector('[data-mass-action="value"]');
  const linkButton = massEditDialogEl.querySelector('[data-mass-action="link-property"]');
  const unlinkButton = massEditDialogEl.querySelector('[data-mass-action="unlink-property"]');
  effectsButton.disabled = !source || !targets.length;
  keysButton.disabled = !targets.length || !sourceKeys.length;
  valueButton.disabled = !targets.length || !properties.length;
  linkButton.disabled = !source || !targets.length || !properties.length;
  unlinkButton.disabled = !targets.length || !properties.length;
  massEditDialogEl.querySelector(".mass-edit-error").textContent = layers.length < 2 ? "Select at least two layers to transfer edits." : "";
  loadMassEditPropertyValue();
}

async function runMassEditAction(action) {
  const targets = massEditTargetIndices();
  const errorEl = massEditDialogEl.querySelector(".mass-edit-error");
  errorEl.textContent = "";
  if (!massEditSourceIndex || !targets.length) {
    errorEl.textContent = "Choose a source and at least one target layer.";
    return;
  }
  await loadJSX();
  let result;
  if (action === "effects") {
    result = await aeCall("TNT_massCopyEffects", [massEditSourceIndex, targets]);
  } else if (action === "keyframes") {
    const keys = normalizeSelectedKeyframes(selectedKeyframes).filter(key => Number(key.layerIndex) === Number(massEditSourceIndex));
    result = await aeCall("TNT_massCopySelectedKeyframes", [massEditSourceIndex, targets, keys]);
  } else if (action === "value") {
    const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
    const value = massEditDialogEl.querySelector(".mass-edit-value").value;
    result = await aeCall("TNT_massSetPropertyValue", [massEditSourceIndex, targets, path, value]);
  } else if (action === "link-property" || action === "unlink-property") {
    const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
    result = await aeCall("TNT_massWrangleProperty", [
      massEditSourceIndex,
      targets,
      path,
      action === "link-property"
    ]);
  } else {
    return;
  }
  if (!result.ok) {
    errorEl.textContent = result.error || "Mass edit failed.";
    return;
  }
  statusEl.textContent = result.result || "Mass edit complete.";
  await refreshLayers({ forceRender: true });
  renderMassEditPanel();
  focusPanel(2);
}

function showMassEditPanel() {
  const el = ensureMassEditPanel();
  if (el.classList.contains("show")) {
    hideMassEditPanel();
    return;
  }
  renderMassEditPanel();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
}

function hideMassEditPanel() {
  if (!massEditDialogEl) return;
  massEditDialogEl.classList.remove("show");
  massEditDialogEl.setAttribute("aria-hidden", "true");
}
