// Words for commands that the command's own name does not use.
//
// The search is literal - a term either appears in the haystack or it does not
// - which is right for a 200-entry list where fuzzy matching would make
// everything match everything. The cost is that a name has to be guessed
// exactly: "remove effects" found nothing, because the registry says Delete.
//
// So the vocabulary that is not in the name is written down. Keyed by name, and
// applied at lookup rather than baked into each entry, so adding a word is a
// line here rather than an edit to a registry row.
const TNT_COMMAND_ALIASES = {
  "Flip Layer Order": "reverse invert backwards flip stack order",
  "Delete All Effects": "remove clear strip wipe purge",
  "Delete All Keyframes": "remove clear strip wipe purge keys",
  "Delete All Expressions": "remove clear strip wipe purge",
  "Delete Selected Layers": "remove erase",
  "Clear Expressions": "delete remove strip",
  "Toggle Effects": "disable enable bypass mute off on",
  "Toggle Visibility": "hide show eye",
  "Toggle Lock Selected": "unlock protect",
  "Hide Selected": "invisible off",
  "Show All Layers": "unhide reveal visible",
  "Solo Selected": "isolate",
  "Unsolo All": "unisolate clear solo",
  "Precompose Selected": "nest group pre-comp precomp",
  "Create Null": "add null object",
  "Parent to Null": "pick whip parenting attach",
  "Parent to Last Selected Layer": "pick whip parenting attach",
  "Parent to Target Layer...": "pick whip parenting attach",
  "Duplicate Selected Layers": "copy clone repeat",
  "Split Selected Layers": "cut razor slice",
  "Trim to Keyframes": "shorten fit",
  "Auto Trim Comp": "shorten fit length duration",
  "Set Composition Length": "duration resize",
  "Reverse Keyframes": "flip mirror backwards",
  "Clone Keyframes": "copy duplicate",
  "Clone Keyframes Flipped": "copy duplicate mirror reverse",
  "Ease In / Out": "easy smooth bezier",
  "Linear Keyframes": "unease straight constant",
  "Overshoot Expression": "bounce elastic settle",
  "Wiggle Expression": "shake noise random jitter",
  "Anticipation Tool": "overshoot follow through prep",
  "Apply Dim + Desat": "darken desaturate mute grey gray push back",
  "Apply Light Sweep": "shine glint sheen reflection",
  "Apply Glow": "bloom shine",
  "Apply Grain": "noise film texture",
  "Apply VHS": "chroma glitch retro degrade tape",
  "Align Keys to Playhead": "move keys snap",
  "Stagger Layers...": "offset cascade sequence ripple",
  "Stagger Keyframes...": "offset cascade sequence ripple",
  "Solo Focus Toggle": "isolate focus",
  "Center Anchor Point": "middle centre",
  "Anchor Point Master": "centre origin pivot",
  "Layer Selection & Filters": "find select filter",
  "Set Text Content...": "edit change rename copy",
  "Find / Replace Text...": "search substitute swap",
  "Markers: Add Marker...": "new comment note",
  "Markers: Remove In/Out Markers": "delete clear",
  "Composition Flow": "map tree hierarchy",
  "Open Quick Controls": "launch overlay palette",
  "TNK Tools": "tnk v3 tribute"
};

// The words for an entry, or "" when it has none. Children inherit nothing;
// they are looked up by their own name.
function tntEntryAliases(entry) {
  if (!entry) return "";
  const own = entry.aliases ? String(entry.aliases) : "";
  const shared = TNT_COMMAND_ALIASES[String(entry.name || "")] || "";
  return own && shared ? `${own} ${shared}` : (own || shared);
}

// Moved here out of 06-command-requirements.js. That file is written whole by
// scripts/derive-command-requirements.py, which emits the map and stops - so
// these two lived below the generator's last line and would have been deleted
// the next time anyone regenerated the requirements.

// Badge text for the Functions list, next to a command whose requirement the
// selection does not meet. Falls back to the raw requirement key.
//
// RECONSTRUCTED: this lived at the bottom of 06-command-requirements.js and was
// lost when that file was truncated. The wording is a guess at the original.
const TNT_REQUIREMENT_LABELS = {
  layers: "Needs layers",
  keyframes: "Needs keyframes",
  masks: "Needs a mask"
};

// What a registry entry requires, or "" when nothing is known. tntFunction
// commands look their host function up in the derived table; entries with a
// panel-side action are not covered by the derivation, so they stay live.
function tntEntryRequirement(entry) {
  if (!entry) return "";
  if (entry.requires) return String(entry.requires);
  const fn = entry.tntFunction ? String(entry.tntFunction) : "";
  return fn && TNT_FUNCTION_REQUIREMENTS[fn] ? TNT_FUNCTION_REQUIREMENTS[fn] : "";
}

// The cross-check: requirement against what is actually selected. Returns the
// reason it cannot run, or "" when it can.
function tntEntryUnmetRequirement(entry) {
  const requirement = tntEntryRequirement(entry);
  if (!requirement) return "";
  // Counted through tntSelectionSummary rather than off the raw array, which
  // keeps repeats and indices that no longer point at a layer. [1,1,1] read as
  // three layers there, so a command could look runnable on a selection that
  // was really one layer, or none.
  const layerCount = typeof tntSelectionSummary === "function"
    ? tntSelectionSummary().count
    : (state.selectedLayerIndices || []).length;
  if (requirement === "layers") {
    return layerCount ? "" : "Needs a layer selected";
  }
  if (requirement === "keyframes") {
    const keys = typeof selectedKeyframes !== "undefined" ? (selectedKeyframes || []) : [];
    return keys.length ? "" : "Needs keyframes selected";
  }
  if (requirement === "masks") {
    return layerCount ? "" : "Needs a layer with a mask";
  }
  return "";
}
