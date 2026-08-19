function ensureFxConsole() {
  if (fxConsoleEl) return fxConsoleEl;
  fxConsoleEl = document.createElement("div");
  fxConsoleEl.className = "fx-console";
  fxConsoleEl.setAttribute("aria-hidden", "true");
  fxConsoleEl.innerHTML = `
    <div class="fx-console-panel">
      <input class="fx-console-input" type="text" spellcheck="false" placeholder="Search commands or effects">
      <div class="fx-console-results"></div>
    </div>
  `;
  document.body.appendChild(fxConsoleEl);

  const input = fxConsoleEl.querySelector(".fx-console-input");
  const resultsEl = fxConsoleEl.querySelector(".fx-console-results");
  resultsEl.addEventListener("mousemove", () => {
    fxConsoleLastPointerMoveAt = Date.now();
  });
  input.addEventListener("input", renderFxConsoleResults);
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFxConsole();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFxConsoleSelectedIndex(fxConsoleSelectedIndex + 1, "keyboard");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFxConsoleSelectedIndex(fxConsoleSelectedIndex - 1, "keyboard");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      openSelectedFxConsoleSubmenu();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      closeFxConsoleSubmenu();
      return;
    }
    if (event.key === "Backspace" && !input.value && fxConsoleParentEntry) {
      event.preventDefault();
      closeFxConsoleSubmenu();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      applySelectedFxConsoleEffect();
    }
  });
  fxConsoleEl.addEventListener("mousedown", event => {
    if (event.target === fxConsoleEl) closeFxConsole();
  });
  return fxConsoleEl;
}

async function openFxConsole() {
  if (!state.comp) return;
  const el = ensureFxConsole();
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  const input = el.querySelector(".fx-console-input");
  input.value = "";
  input.placeholder = "Search commands or effects";
  fxConsoleParentEntry = null;
  fxConsoleSelectedIndex = 0;
  fxConsoleLastKeyboardAt = 0;
  fxConsoleLastPointerMoveAt = 0;
  focusFxConsoleInput(2);
  await loadFxConsoleEffects();
  renderFxConsoleResults();
  focusFxConsoleInput(5);
}

async function loadFxConsoleEffects() {
  if (fxConsoleEffects.length) return fxConsoleEffects;
  await loadJSX();
  const result = await aeCall("TNT_getEffects");
  if (result.ok) fxConsoleEffects = result.effects || [];
  else statusEl.textContent = result.error || "Could not read effects.";
  return fxConsoleEffects;
}

function closeFxConsole() {
  if (!fxConsoleEl) return;
  fxConsoleEl.classList.remove("open");
  fxConsoleEl.setAttribute("aria-hidden", "true");
  fxConsoleParentEntry = null;
}

function focusFxConsoleInput(retries = 4) {
  if (!fxConsoleEl || !fxConsoleEl.classList.contains("open")) return;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (!input) return;
  try { window.focus(); } catch (_) {}
  try {
    input.focus({ preventScroll: true });
    input.select();
  } catch (_) {
    try { input.focus(); input.select(); } catch (__) {}
  }
  if (retries > 0) setTimeout(() => focusFxConsoleInput(retries - 1), 60);
}

function hasSelectedKeyframesForCommands() {
  return Array.isArray(selectedKeyframes) && selectedKeyframes.length > 0;
}

function commandVisibleInFxConsole(command) {
  if (!command || !command.visibleWhen) return true;
  if (command.visibleWhen === "selectedKeyframes") return hasSelectedKeyframesForCommands();
  return true;
}

function fxConsoleFilterCommands(query = "") {
  const selectedIndices = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  const usesSelection = selectedIndices.length > 0;
  const scopeIndices = usesSelection ? [...new Set(selectedIndices)] : null;
  const scopeLayers = usesSelection
    ? (state.layers || []).filter(layer => scopeIndices.includes(Number(layer.index || 0)))
    : (state.layers || []).slice();
  const relationSets = allRelationshipLayerSets();
  const scopeName = usesSelection ? "Selection" : "Composition";
  const children = [];

  if (usesSelection) {
    children.push({
      type: "command",
      name: "Focus Selected Layers",
      category: `${scopeIndices.length} selected`,
      action: () => setLayerViewFilter(null, scopeIndices)
    });
  }

  LAYER_SELECTION_QUICK_FILTERS.forEach(definition => {
    const count = scopeLayers.filter(layer => layerMatchesFilter(layer, definition.key, relationSets)).length;
    if (!count) return;
    children.push({
      type: "command",
      name: `${definition.label} Layers`,
      category: `${scopeName} · ${count}`,
      filterKey: definition.key,
      action: () => setLayerViewFilter(definition.key, scopeIndices)
    });
  });

  if (hasActiveLayerViewConstraint()) {
    children.push({
      type: "command",
      name: "Turn Off Filter / Focus",
      category: "Show full composition",
      action: clearLayerViewFilter
    });
  }

  const parentName = `Filter ${scopeName}`;
  const normalizedQuery = String(query || "").toLowerCase();
  if (normalizedQuery.split(/\s+/).includes("filter")) {
    return children.map(command => ({
      ...command,
      name: `${parentName}: ${command.name}`
    }));
  }
  return [{
    name: parentName,
    category: usesSelection ? `${scopeIndices.length} selected layers` : `${scopeLayers.length} comp layers`,
    children
  }];
}

function visibleFxConsoleCommands(query = "") {
  const isFilterQuery = String(query || "").toLowerCase().split(/\s+/).includes("filter");
  const supersededFilterCommands = new Set([
    "Focus Selected",
    "Focus Playhead",
    "Filter Text Layers",
    "Keep Only Shapes",
    "Keep Only Images"
  ]);
  const panelCommands = (isFilterQuery ? [] : FX_CONSOLE_COMMANDS)
    .concat(fxConsoleFilterCommands(query))
    .map(command => ({ ...command, source: "panel" }));
  const assistantSavedCommands = typeof getAssistantSavedFunctionCommands === "function" ? getAssistantSavedFunctionCommands() : [];
  const baseCommands = panelCommands.concat(assistantSavedCommands);
  if (!panelSettings.showTntCommands) return baseCommands.filter(commandVisibleInFxConsole);
  if (isFilterQuery) return baseCommands.filter(commandVisibleInFxConsole);
  return baseCommands.concat(TNT_V3_COMMANDS
    .filter(command => !supersededFilterCommands.has(command.name))
    .map(command => ({
      ...command,
      source: "custom",
      type: command.action ? "command" : (command.children ? "tntMenu" : "tntCommand")
    }))).filter(commandVisibleInFxConsole);
}

function searchFxConsoleEntries(query = "", parentEntry = null, limit = 24) {
  const normalizedQuery = String(query || "").toLowerCase().trim();
  if (parentEntry) {
    const children = (parentEntry.children || []).map(command => ({ ...command, source: parentEntry.source || "custom", type: command.action ? "command" : "tntCommand", parentName: parentEntry.name }));
    if (!normalizedQuery) return children.slice(0, limit);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return children.filter(effect => {
      const source = fxConsoleSourceMeta(effect);
      const tags = safeFxConsoleEntryTags(effect).map(tag => tag.label).join(" ");
      const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""} ${effect.shortcut || ""} ${effect.parentName || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
      return terms.every(term => haystack.indexOf(term) >= 0);
    }).slice(0, limit);
  }
  const isFilterQuery = normalizedQuery.split(/\s+/).includes("filter");
  const effects = panelSettings.showNativeEffects && !isFilterQuery
    ? (fxConsoleEffects || []).map(effect => ({ ...effect, source: "native", type: "effect" }))
    : [];
  const entries = visibleFxConsoleCommands(normalizedQuery).concat(effects);
  if (!normalizedQuery) return entries.slice(0, limit);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return entries.filter(effect => {
    const source = fxConsoleSourceMeta(effect);
    const tags = safeFxConsoleEntryTags(effect).map(tag => tag.label).join(" ");
    const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""} ${effect.shortcut || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, limit);
}

function filteredFxEffects() {
  const query = fxConsoleEl ? String((fxConsoleEl.querySelector(".fx-console-input") || {}).value || "") : "";
  return searchFxConsoleEntries(query, fxConsoleParentEntry, 24);
}

// Three visual groups for the left-edge stripe. Assistant-saved scripts share the
// custom stripe deliberately: the distinction that matters at a glance is "not
// built into After Effects", not who authored it.
// One icon per action verb, reused across every entry. Drawing per-command icons
// is not viable at ~640 entries, and the action is the axis that says what a
// command does - the source stripe already carries where it came from.
const TNT_ACTION_ICONS = {
  "Open":   '<rect x="2.5" y="4" width="10" height="12" rx="1.6"/><path d="M12.5 10h5M15.2 7.4L17.7 10l-2.5 2.6"/>',
  "Set":    '<path d="M3 6h14M3 10h14M3 14h14"/><circle cx="7" cy="6" r="1.8"/><circle cx="13" cy="10" r="1.8"/><circle cx="9" cy="14" r="1.8"/>',
  "Apply":  '<path d="M8 2.6l1.5 4L13.4 8 9.5 9.5 8 13.4 6.5 9.5 2.6 8l3.9-1.5z"/><path d="M14.8 12.4l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>',
  "Add":    '<circle cx="10" cy="10" r="7"/><path d="M10 6.6v6.8M6.6 10h6.8"/>',
  "Delete": '<path d="M3.5 5.5h13M8 5.5V3.8h4v1.7"/><path d="M5.4 5.5l.8 10.2a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.8-10.2"/>',
  "Show":   '<path d="M1.6 10S4.6 4.6 10 4.6 18.4 10 18.4 10 15.4 15.4 10 15.4 1.6 10 1.6 10z"/><circle cx="10" cy="10" r="2.4"/>',
  "Go To":  '<circle cx="10" cy="10" r="7"/><path d="M8.6 6.9L11.8 10l-3.2 3.1"/>',
  "Space":  '<path d="M3 3.2v13.6M17 3.2v13.6"/><rect x="6.6" y="7.4" width="6.8" height="5.2" rx="1.2"/>',
  "Play":   '<path d="M6.6 4.4l8.4 5.6-8.4 5.6z"/>'
};

// Target glyphs that override the action icon. Markers earn one because they are
// a large, visually distinct slice of the catalogue; add more here as needed.
const TNT_TARGET_ICONS = {
  "Marker": '<path d="M5 2.4v15.2"/><path d="M5 3.6h9.9l-2.3 3.2 2.3 3.2H5z"/>'
};

function tntActionIconMarkup(entry) {
  let paths = TNT_ACTION_ICONS["Apply"];
  try {
    const tags = safeFxConsoleEntryTags(entry) || [];
    const target = tags.filter(tag => tag.kind === "target" && TNT_TARGET_ICONS[tag.label])[0];
    if (target) {
      paths = TNT_TARGET_ICONS[target.label];
    } else {
      const action = tags.filter(tag => tag.kind === "action")[0];
      if (action && TNT_ACTION_ICONS[action.label]) paths = TNT_ACTION_ICONS[action.label];
    }
  } catch (_) {}
  return `<svg class="assistant-function-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${paths}</svg>`;
}

function tntSourceGroup(entry) {
  const source = String((entry && entry.source) || "");
  if (source === "native" || (entry && entry.type === "effect")) return "native";
  if (source === "custom" || source === "assistant") return "custom";
  return "panel";
}

function fxConsoleSourceMeta(entry) {
  const source = String(entry && entry.source || (entry && entry.type === "effect" ? "native" : "panel"));
  const category = String(entry && entry.category || "").toLowerCase();
  const parent = String(entry && entry.parentName || "").toLowerCase();
  if (source === "native") {
    return { key: "native", label: "AE Effect", detail: "Native After Effects effect or preset" };
  }
  if (source === "custom") {
    if (entry && entry.children) {
      return { key: "custom", label: "Automation Menu", detail: "Grouped TNT v3 ExtendScript actions" };
    }
    return { key: "custom", label: "Layer Automation", detail: "Runs an ExtendScript action against the current comp/layers" };
  }
  if (source === "assistant") {
    return { key: "assistant", label: "Saved Script", detail: "Assistant-generated ExtendScript saved in the panel library" };
  }
  if (category.indexOf("shortcut") >= 0 || category.indexOf("native") >= 0) {
    return { key: "panel", label: "AE Shortcut", detail: "Panel shortcut that triggers an After Effects or CEP command" };
  }
  if (category.indexOf("view") >= 0 || category.indexOf("navigation") >= 0) {
    return { key: "panel", label: "Timeline View", detail: "Changes panel navigation, focus, or visible timeline state" };
  }
  if (category.indexOf("composition") >= 0 || parent.indexOf("composition") >= 0) {
    return { key: "panel", label: "Comp Tool", detail: "Composition-level panel control" };
  }
  if (category.indexOf("layers") >= 0 || parent.indexOf("layer") >= 0) {
    return { key: "panel", label: "Layer Tool", detail: "Layer selection, ordering, or inspection control" };
  }
  if (category.indexOf("mask") >= 0 || category.indexOf("effect") >= 0 || category.indexOf("shape") >= 0 || category.indexOf("style") >= 0) {
    return { key: "panel", label: "Inspector", detail: "Opens or controls a focused layer inspector" };
  }
  return { key: "panel", label: "Panel Tool", detail: "CEP panel control or utility" };
}

const TNT_ACTION_TITLES = {
  "Set": "Changes a value or property on something that already exists",
  "Apply": "Applies an effect, preset, or ease to the selection",
  "Add": "Creates something new in the comp",
  "Delete": "Removes something from the comp",
  "Show": "Changes what is visible or expanded, without altering the project",
  "Go To": "Moves the playhead or view to a position",
  "Open": "Opens a panel, editor, or inspector",
  "Space": "Distributes or staggers timing across a selection",
  "Play": "Controls playback"
};

const TNT_TARGET_TITLES = {
  "Text": "Acts on text layers or text properties",
  "Shape": "Acts on shape layers or vector properties",
  "Mask": "Acts on masks or track mattes",
  "Effect": "Acts on effects or presets",
  "Animation": "Acts on keyframes, easing, or expressions",
  "Marker": "Acts on composition or layer markers",
  "Style": "Acts on layer styles or labels",
  "Comp": "Acts on the composition itself",
  "Layer": "Acts on the selected layers"
};

function tntTagSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Targets only, for entries we cannot hand-tag (AE effects, saved assistant
// scripts, TNT v3 menu items). Deliberately does NOT guess an action: deriving
// verbs from titles is what produced "Trim In to Playhead -> Navigate", because
// a title names what a command references, not what it acts on.
const TNT_DERIVED_TARGETS = [
  ["Text", /\b(text|source text|animator|font|typograph)/i],
  ["Shape", /\b(shape|stroke|fill|trim paths|vector|dash|arrowhead)\b/i],
  ["Mask", /\b(mask|matte)\b/i],
  ["Animation", /\b(keyframe|keyframes|ease|expression|loop|wiggle|roving)\b/i],
  ["Marker", /\b(marker|markers)\b/i],
  ["Style", /\b(layer style|styles?|label)\b/i],
  ["Comp", /\b(composition|comp)\b/i],
  ["Layer", /\b(layer|layers)\b/i]
];

function fxConsoleEntryTags(entry) {
  const tags = [];
  const pushAction = label => {
    if (!label) return;
    tags.push({
      kind: "action",
      key: `action-${tntTagSlug(label)}`,
      label,
      title: TNT_ACTION_TITLES[label] || "What this command does"
    });
  };
  const pushTarget = label => {
    if (!label || tags.some(tag => tag.label === label)) return;
    tags.push({
      kind: "target",
      key: `target-${tntTagSlug(label)}`,
      label,
      title: TNT_TARGET_TITLES[label] || "What this command acts on"
    });
  };

  // 1. Hand-tagged registry commands are authoritative.
  if (entry && entry.does) {
    pushAction(entry.does);
    (Array.isArray(entry.targets) ? entry.targets : []).slice(0, 2).forEach(pushTarget);
    return tags;
  }

  // 2. Native AE effects and presets: the action is always Apply, and the target
  //    comes from real effect metadata rather than a reading of the title.
  const source = String(entry && entry.source || "");
  if (source === "native" || (entry && entry.type === "effect")) {
    pushAction("Apply");
    pushTarget("Effect");
    return tags;
  }

  // 3. Everything else: Apply plus at most two targets matched from the title.
  pushAction("Apply");
  const text = [entry && entry.name, entry && entry.category, entry && entry.parentName]
    .filter(Boolean).join(" ");
  TNT_DERIVED_TARGETS.filter(pair => pair[1].test(text)).slice(0, 2).forEach(pair => pushTarget(pair[0]));
  return tags;
}

function safeFxConsoleEntryTags(entry) {
  try {
    return fxConsoleEntryTags(entry);
  } catch (_) {
    const source = fxConsoleSourceMeta(entry);
    return [{ key: `source-${source.key}`, label: source.label, title: source.detail }];
  }
}

function fxConsoleResultClass(entry, index) {
  const meta = fxConsoleSourceMeta(entry);
  return [
    "fx-console-result",
    `source-${meta.key}`,
    entry && entry.children ? "has-children" : "",
    index === fxConsoleSelectedIndex ? "active" : ""
  ].filter(Boolean).join(" ");
}

function openFxConsoleSubmenu(entry) {
  if (!entry || !entry.children || !entry.children.length || !fxConsoleEl) return false;
  fxConsoleParentEntry = entry;
  fxConsoleSelectedIndex = 0;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (input) {
    input.value = "";
    input.placeholder = `Search ${entry.name}`;
  }
  renderFxConsoleResults();
  focusFxConsoleInput(2);
  return true;
}

function openSelectedFxConsoleSubmenu() {
  return openFxConsoleSubmenu(filteredFxEffects()[fxConsoleSelectedIndex]);
}

function closeFxConsoleSubmenu() {
  if (!fxConsoleParentEntry || !fxConsoleEl) return false;
  fxConsoleParentEntry = null;
  fxConsoleSelectedIndex = 0;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (input) {
    input.value = "";
    input.placeholder = "Search commands or effects";
  }
  renderFxConsoleResults();
  focusFxConsoleInput(2);
  return true;
}

function setFxConsoleSelectedIndex(index, source) {
  const effects = filteredFxEffects();
  if (!effects.length) {
    fxConsoleSelectedIndex = 0;
    renderFxConsoleResults();
    return;
  }
  if (source === "keyboard") fxConsoleLastKeyboardAt = Date.now();
  if (source === "mouse") fxConsoleLastPointerMoveAt = Date.now();
  const nextIndex = Math.max(0, Math.min(Number(index || 0), effects.length - 1));
  if (nextIndex === fxConsoleSelectedIndex) {
    scrollFxConsoleSelectionIntoView();
    return;
  }
  fxConsoleSelectedIndex = nextIndex;
  renderFxConsoleResults();
  scrollFxConsoleSelectionIntoView();
}

function scrollFxConsoleSelectionIntoView() {
  if (!fxConsoleEl) return;
  requestAnimationFrame(() => {
    const active = fxConsoleEl.querySelector(".fx-console-result.active");
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: "nearest" });
    }
  });
}

function renderFxConsoleResults() {
  if (!fxConsoleEl) return;
  const resultsEl = fxConsoleEl.querySelector(".fx-console-results");
  const effects = filteredFxEffects();
  fxConsoleSelectedIndex = Math.max(0, Math.min(fxConsoleSelectedIndex, Math.max(0, effects.length - 1)));
  if (!effects.length) {
    resultsEl.innerHTML = `<div class="fx-console-empty">No matching ${fxConsoleParentEntry ? "choices" : "effects"}</div>`;
    return;
  }
  resultsEl.innerHTML = effects.map((effect, index) => {
    const source = fxConsoleSourceMeta(effect);
    return `
    <button type="button" class="${fxConsoleResultClass(effect, index)}" data-index="${index}">
      <i class="fx-console-source" title="${escapeHtml(source.detail)}">${escapeHtml(source.label)}</i>
      <span>${escapeHtml(effect.name || effect.matchName || "Effect")}</span>
      <em>${escapeHtml([effect.category || effect.matchName || "", effect.shortcut || "", effect.children ? "Right" : ""].filter(Boolean).join(" - "))}</em>
    </button>
  `;
  }).join("");
  resultsEl.querySelectorAll(".fx-console-result").forEach(button => {
    button.addEventListener("mouseenter", () => {
      if (fxConsoleLastPointerMoveAt < fxConsoleLastKeyboardAt) return;
      setFxConsoleSelectedIndex(Number(button.dataset.index || 0), "mouse");
    });
    button.addEventListener("mousedown", event => {
      event.preventDefault();
      setFxConsoleSelectedIndex(Number(button.dataset.index || 0), "mouse");
      if (event.button === 0) applySelectedFxConsoleEffect();
    });
  });
}

async function applySelectedFxConsoleEffect() {
  const effect = filteredFxEffects()[fxConsoleSelectedIndex];
  if (!effect) return;
  if (effect.children && openFxConsoleSubmenu(effect)) return;
  await executeFxConsoleEntry(effect);
}

async function executeFxConsoleEntry(effect) {
  if (!effect) return false;
  if (effect.type === "command") {
    closeFxConsole();
    await effect.action();
    return true;
  }
  if (effect.type === "tntMenu" && effect.children && effect.children.length) {
    return openFxConsoleSubmenu(effect);
  }
  if (effect.type === "tntCommand") {
    await runTntV3Command(effect);
    return true;
  }
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  await loadJSX();
  const result = await aeCall("TNT_applyEffectToSelectedLayers", [effect.matchName, selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not apply effect.";
    return false;
  }
  closeFxConsole();
  await refreshLayers({ forceRender: true });
  return true;
}
