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

function fxConsoleEntryTags(entry) {
  // Two axes, deliberately: what the command DOES and what it TARGETS.
  // Exactly one action, at most two targets. The old version emitted up to five
  // tags mixing source/category/domain, which both read as noise and blew out the
  // card layout. Matching is over name/category/parent only - the previous version
  // also searched the source description, whose boilerplate ("layer", "comp")
  // matched nearly every entry.
  const name = String(entry && entry.name || "");
  const category = String(entry && entry.category || "");
  const parent = String(entry && entry.parentName || "");
  const text = [name, category, parent].join(" ").toLowerCase();

  const ACTIONS = [
    ["open", "Open", "Opens a panel, editor, or inspector",
      /(^open\b|\b(controls?|editors?|master|tools?|menus?|panels?|inspector|styles\.\.\.|browser)\b)/],
    // Arrange before navigate: "Pull ... to Playhead" moves layers in time, so the
    // explicit arrange verb should win over the incidental "playhead".
    ["arrange", "Arrange", "Reorders, aligns, distributes, or spaces things out",
      /\b(align|distribute|order|stagger|sequence|snap|pull|reverse|sort|flip|stack|arrange|center)\b/],
    ["navigate", "Navigate", "Moves the playhead, time, or view position",
      /\b(go to|goto|next|previous|prev|jump|playhead|boundary|seek|scrub)\b/],
    ["reveal", "Reveal", "Shows, hides, expands, or collapses what is visible",
      /\b(reveal|expand|collapse|show|hide|focus|toggle|solo|isolate|view)\b/],
    ["create", "Create", "Adds new items to the project or comp",
      /\b(add|new|create|duplicate|import|precompose|pre-compose|generate|build|insert)\b/],
    ["remove", "Remove", "Deletes or cleans up existing items",
      /\b(delete|remove|clear|clean|cleanup|purge|strip|reset)\b/],
    ["edit", "Edit", "Changes values or properties on existing items",
      /\b(set|apply|rename|trim|split|adjust|change|scale|wiggle|ease|link|parent|copy|paste|replace|convert|toggle)\b/]
  ];

  // Most specific target first; we keep at most two so the chips stay readable.
  const TARGETS = [
    ["text", "Text", "Acts on text layers or text properties",
      /\b(text|source text|animator|font|typograph)/],
    ["shape", "Shape", "Acts on shape layers or vector properties",
      /\b(shape|stroke|fill|trim paths|vector|dash|arrowhead|path)\b/],
    ["mask", "Mask", "Acts on masks or track mattes",
      /\b(mask|matte)\b/],
    ["effect", "Effect", "Applies or manages effects and presets",
      /\b(effect|preset|glow|blur|grain|desat)\b/],
    ["animation", "Animation", "Creates, edits, or depends on keyframes",
      /\b(keyframe|keyframes|ease|animation|animate|stagger|roving|loop|overshoot|expression|wiggle|interpolat)/],
    ["marker", "Marker", "Acts on composition or layer markers",
      /\b(marker|markers)\b/],
    ["style", "Style", "Acts on layer styles or labels",
      /\b(style|styles|label|colou?r)\b/],
    ["comp", "Comp", "Composition-level action",
      /\b(composition|comp|duration|resolution|render)\b/],
    ["layer", "Layer", "Acts on the selected layers themselves",
      /\b(layer|layers|parent|solo|lock|visibility|selection|anchor|transform)\b/]
  ];

  const tags = [];

  let action = ACTIONS.find(entry => entry[3].test(text));
  // Effects and saved scripts are things you run, whatever their wording.
  const source = String(entry && entry.source || "");
  if (!action && (source === "native" || entry && entry.type === "effect")) {
    action = ["create", "Apply", "Applies an effect or preset to the selection"];
  }
  if (!action) action = ["edit", "Edit", "Changes values or properties on existing items"];
  tags.push({ kind: "action", key: `action-${action[0]}`, label: action[1], title: action[2] });

  const targets = TARGETS.filter(entry => entry[3].test(text)).slice(0, 2);
  targets.forEach(target => {
    tags.push({ kind: "target", key: `target-${target[0]}`, label: target[1], title: target[2] });
  });

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
