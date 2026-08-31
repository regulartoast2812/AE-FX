// TNK-style tool subpanel.
//
// A tribute to TNK v3's arrangement, not its skin: a persistent global parameter
// bar that every tool reads from, above dense wrapping rows of small buttons.
// That bar was the point of TNK - you set ease or timing once and every command
// used it, rather than each command carrying its own baked-in values. Sixty-six
// commands here still ship hardcoded args like { easeIn: 75, easeOut: 75 }, so
// the bar has something real to do.
//
// This is a subpanel (Ctrl+D), not a workspace tab: it opens over the panel like
// Ease or Mask, and closes on Escape. Styling follows the current panel, not
// TNK's blue-violet palette.

const TNK_PARAM_DEFAULTS = {
  inTime: 1, outTime: 1, easeIn: 75, easeOut: 75,
  pixels: 100, freq: 2, amp: 20, textIn: 0.35, textOut: 0.35
};
const TNK_PARAM_FIELDS = [
  { key: "inTime", label: "In", step: 0.05, min: 0 },
  { key: "outTime", label: "Out", step: 0.05, min: 0 },
  { divider: true },
  { key: "easeIn", label: "EI", step: 5, min: 0, max: 100 },
  { key: "easeOut", label: "EO", step: 5, min: 0, max: 100 },
  { divider: true },
  { key: "pixels", label: "Px", step: 10 },
  { divider: true },
  { key: "freq", label: "Hz", step: 1, min: 0 },
  { key: "amp", label: "Amp", step: 5 },
  { divider: true },
  { key: "textIn", label: "TI", step: 0.05, min: 0 },
  { key: "textOut", label: "TO", step: 0.05, min: 0 }
];
// TNK was never a catalogue. It held the handful of general commands you reach
// for constantly, grouped by task, and left everything deeper to the panels
// built for it - Ease, Mask, Mass Edit.
//
// Keys and grouping are lifted from TNK v3 itself (Ref/TNK_v3/index.html,
// _HK_ACTIONS), not invented. TNK compacts pairs onto one key with shift as the
// variant - clone/flip, hide/show, toggle-fx/copy-fx - so the buttons compact
// the same way rather than spending two squares on one idea.
//
// `key` is the bare key while TNK is open. `shift` and `alt` name the command
// run with that modifier held. Anything with no key is ours, not TNK's, and
// stays unbound until it earns one.
//
// Buttons are icon-only, the way TNK's were: at this size a row of glyphs is
// read by shape and position, not by reading words. That means every entry
// needs its OWN icon - the shared action/target glyphs from the Functions list
// would render half this panel as the same sparkle.
const TNK_GROUPS = [
  { title: "Keys", commands: [
    { label: "Ease In / Out", icon: "spline", key: "e", desc: "Eases the selected keyframes in and out, using the EI and EO values from the bar.",
      command: "Ease In / Out" },
    { label: "Linear", icon: "trending-up", key: "l", desc: "Strips easing from the selected keyframes so they move at a constant speed.",
      command: "Linear Keyframes" },
    { label: "Overshoot", icon: "waves", key: "o", desc: "Adds an overshoot expression that carries past the last keyframe and settles back.",
      command: "Overshoot Expression" },
    { label: "Wiggle", icon: "activity", key: "w", desc: "Adds a wiggle expression driven by the bar's HZ frequency and AMP amount.",
      command: "Wiggle Expression" },
    { label: "Reverse", icon: "arrow-left-right", key: "r", desc: "Reverses the selected keyframes in time, so the animation plays backwards.",
      command: "Reverse Keyframes" },
    { label: "Clone", icon: "copy", key: "c", desc: "Copies the selected keyframes to the playhead, keeping their spacing and easing.",
      command: "Clone Keyframes",
      shift: "Clone Keyframes Flipped" },
    { label: "Delete Keys", icon: "eraser", key: "z", desc: "Removes every keyframe from the selected layers, leaving the current values.",
      command: "Delete All Keyframes" },
    { label: "Align to Playhead", icon: "align-center-vertical", desc: "Shifts the whole keyframe group so its first key lands on the playhead.",
      command: "Align Keys to Playhead" },
    { label: "Clear Expressions", icon: "square-slash", desc: "Removes expressions from the selected properties, keeping their keyframes.",
      command: "Clear Expressions" }
  ] },
  { title: "Layers", commands: [
    { label: "Stagger", icon: "align-start-vertical", key: "s", desc: "Offsets the selected layers in time by an amount you enter, one after another.",
      command: "Stagger Layers..." },
    { label: "Pull to Playhead", icon: "chevrons-left", key: "p",
      desc: "Moves the selected layers to the playhead as one group, keeping their spacing.",
      command: "Pull Layer Group to Playhead In Point",
      shift: "Pull Layer Group to Playhead Out Point" },
    { label: "Focus", icon: "focus", key: "f", desc: "Solos the selected layers, or unsolos everything if they are already soloed.",
      command: "Solo Focus Toggle" },
    { label: "Hide", icon: "ghost", key: "h", desc: "Hides the selected layers.",
      command: "Hide Selected",
      shift: "Show All Layers" },
    { label: "Precompose", icon: "package", key: "`", desc: "Precomposes the selected layers into a new composition.",
      command: "Precompose Selected" },
    { label: "Lock", icon: "lock", desc: "Locks the selected layers so they cannot be edited or selected in the timeline.",
      command: "Lock Selected" },
    { label: "Duplicate", icon: "copy-plus", desc: "Duplicates the selected layers in place.",
      command: "Duplicate Selected Layers" },
    { label: "Split", icon: "split", desc: "Splits the selected layers at the playhead into two layers.",
      command: "Split Selected Layers" },
    { label: "Null", icon: "square-dashed", desc: "Creates a null at the centre of the composition.",
      command: "Create Null", shift: "Parent to Null" }
  ] },
  { title: "Effects", commands: [
    { label: "Toggle Effects", icon: "toggle-left", key: "x", desc: "Switches the effects on the selected layers off, or back on.",
      command: "Toggle Effects",
      shift: "Copy Effects" },
    { label: "Glow", icon: "sparkles", desc: "Adds a glow to the selected layers.",
      command: "Apply Glow" },
    { label: "Light Sweep", icon: "flashlight", desc: "Sweeps a band of light across the layer, timed by the bar's IN and easing values.",
      command: "Apply Light Sweep" },
    { label: "VHS", icon: "tv", desc: "Stacks a VHS-style degrade - chroma shift, noise and scanlines - on the selected layers.",
      command: "Apply VHS" },
    { label: "Blur", icon: "droplets", desc: "Blurs the selected layers in and out over the bar's IN and OUT times.",
      command: "Apply Blur In+Out",
      alt: "Apply Blur Out" },
    { label: "Grain", icon: "grip", desc: "Adds film grain to the selected layers.",
      command: "Apply Grain" },
    { label: "Dim + Desat", icon: "sun-dim", desc: "Adds a Lumetri pass that darkens and drains colour, for pushing layers back.",
      command: "Apply Dim + Desat" },
    { label: "Delete Effects", icon: "trash-2", desc: "Removes every effect from the selected layers.",
      command: "Delete All Effects" }
  ] },
  { title: "Motion", commands: [
    { label: "Scale", icon: "scaling", desc: "Animates scale in and out, using the bar's IN, OUT and easing values.",
      command: "Scale In+Out",
      shift: "Scale In", alt: "Scale Out" },
    { label: "Opacity", icon: "eye", desc: "Fades opacity in and out, using the bar's IN, OUT and easing values.",
      command: "Opacity In+Out",
      shift: "Opacity In", alt: "Opacity Out" },
    { label: "Anticipation", icon: "undo-2", desc: "Opens the Anticipation palette in After Effects for building anticipation and follow-through.",
      command: "Anticipation Tool" }
  ] },
  { title: "Timing", commands: [
    { label: "Trim to Playhead", icon: "arrow-right-to-line", desc: "Trims the in point of the selected layers to the playhead.",
      command: "Trim In to Playhead",
      shift: "Trim Out to Playhead" },
    { label: "Trim to Keyframes", icon: "scissors", desc: "Trims each layer's in and out points to its first and last keyframe.",
      command: "Trim to Keyframes" },
    { label: "Snap to Playhead", icon: "chevrons-right", desc: "Moves each selected layer to the playhead independently, ignoring their spacing.",
      command: "Snap Layers to Playhead In Point",
      shift: "Snap Layers to Playhead Out Point" },
    { label: "Auto Trim Comp", icon: "crop", desc: "Shortens the composition to end at the last layer's out point.",
      command: "Auto Trim Comp" }
  ] },
  { title: "Text", commands: [
    { label: "Set Text", icon: "type", desc: "Replaces the contents of the selected text layers.",
      command: "Set Text Content..." },
    { label: "Find / Replace", icon: "replace", desc: "Finds and replaces text across the selection, the comp, or the whole project.",
      command: "Find / Replace Text..." },
    { label: "Remove Animator", icon: "list-x", desc: "Removes the in animator and its marker from the selected text layers.",
      command: "Text: Remove In Animator + Marker",
      shift: "Text: Remove Out Animator + Marker" }
  ] },
  { title: "Markers", commands: [
    { label: "Add Marker", icon: "bookmark-plus", key: "m", desc: "Adds a marker at the playhead, with a comment you enter.",
      command: "Markers: Add Marker..." },
    { label: "In Marker", icon: "flag", desc: "Sets the in marker on the selected layers at the playhead.",
      command: "Markers: Set In Marker",
      shift: "Markers: Set Out Marker" },
    { label: "Remove Markers", icon: "flag-off", desc: "Removes the in and out markers from the selected layers.",
      command: "Markers: Remove In/Out Markers" }
  ] }
];

// key -> the group entry it runs. Built once from the table above so the key
// list and the buttons can never disagree.
const TNK_KEYMAP = (() => {
  const map = {};
  TNK_GROUPS.forEach(group => group.commands.forEach(item => {
    if (item.key) map[item.key] = item;
  }));
  return map;
})();

const TNK_PARAMS_KEY = "tnkParams.v1";

let tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS);
let tnkBackdropEl = null;

// Resolved lazily rather than held in module-level consts. The bundle is one
// concatenated script: function declarations hoist across all of it, so an
// earlier module can call into here during its own init - before this file's
// consts have initialised - and touching one then throws a temporal dead zone
// error that aborts the rest of the bundle.
function tnkToolRows() { return tnkBackdropEl && tnkBackdropEl.querySelector(".tnk-tool-rows"); }
function tnkFilterInput() { return tnkBackdropEl && tnkBackdropEl.querySelector(".tnk-filter"); }
function tnkCountLabel() { return tnkBackdropEl && tnkBackdropEl.querySelector(".tnk-count"); }

function tnkLoadParams() {
  try {
    const raw = window.localStorage.getItem(TNK_PARAMS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS, parsed && typeof parsed === "object" ? parsed : {});
  } catch (_) {
    tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS);
  }
}

function tnkSaveParams() {
  try { window.localStorage.setItem(TNK_PARAMS_KEY, JSON.stringify(tnkParams)); } catch (_) {}
}

function tnkSyncParamInputs() {
  if (!tnkBackdropEl) return;
  tnkBackdropEl.querySelectorAll("[data-tnk-param]").forEach(input => {
    const key = input.dataset.tnkParam;
    if (key in tnkParams) input.value = tnkParams[key];
  });
}

// Overlay bar values onto a command's own args, but only for keys the command
// already declares. A command that never took easeIn must not suddenly receive
// one - the host functions read positional and named args and would be confused
// by parameters they do not expect.
function tnkApplyParamsToArgs(args) {
  if (!Array.isArray(args) || !args.length) return args;
  return args.map(arg => {
    if (!arg || typeof arg !== "object" || Array.isArray(arg)) return arg;
    const merged = Object.assign({}, arg);
    Object.keys(merged).forEach(key => {
      if (key in tnkParams) merged[key] = tnkParams[key];
    });
    return merged;
  });
}

// Every registry entry keyed by name, so the curated lists above stay readable
// as plain command names rather than duplicated definitions.
function tnkEntryIndex() {
  const index = new Map();
  let all = [];
  try { all = searchFxConsoleEntries("", null, 2000) || []; } catch (_) {}
  all.forEach(entry => {
    if (!entry || entry.children) return;
    const name = String(entry.name || "");
    if (name && !index.has(name)) index.set(name, entry);
  });
  return index;
}

// The flat, ordered list behind the grouped view. Indices into it are what the
// buttons carry, so running a tool never depends on how the groups are drawn.
// Which command a button runs, given the modifiers held. TNK's own convention:
// shift is the variant, and a button with no variant ignores it.
function tnkCommandFor(item, modifiers) {
  if (modifiers && modifiers.altKey && item.alt) return item.alt;
  if (modifiers && modifiers.shiftKey && item.shift) return item.shift;
  return item.command;
}

function tnkResolvedGroups() {
  const index = tnkEntryIndex();
  const query = String(tnkFilterInput() ? tnkFilterInput().value : "").toLowerCase().trim();
  const terms = query.split(/\s+/).filter(Boolean);
  const flat = [];
  const groups = TNK_GROUPS.map(group => {
    const entries = group.commands
      .filter(item => index.has(item.command))
      .filter(item => {
        if (!terms.length) return true;
        const haystack = `${item.label} ${item.command} ${item.key || ""}`.toLowerCase();
        return terms.every(term => haystack.indexOf(term) >= 0);
      })
      .map(item => Object.assign({ item }, { index: flat.push(item) - 1 }));
    return { title: group.title, entries };
  }).filter(group => group.entries.length);
  return { groups, flat, index };
}

function tnkParamBarMarkup() {
  return TNK_PARAM_FIELDS.map(field => {
    if (field.divider) return `<div class="tnk-divider"></div>`;
    const bounds = [
      `step="${field.step}"`,
      field.min == null ? "" : `min="${field.min}"`,
      field.max == null ? "" : `max="${field.max}"`
    ].filter(Boolean).join(" ");
    return `<div class="tnk-param"><label>${escapeHtml(field.label)}</label>` +
      `<input data-tnk-param="${field.key}" type="number" ${bounds} value="${TNK_PARAM_DEFAULTS[field.key]}"></div>`;
  }).join("");
}

function ensureTnkPanel() {
  if (tnkBackdropEl) return tnkBackdropEl;
  tnkBackdropEl = document.createElement("div");
  tnkBackdropEl.className = "tnk-backdrop";
  tnkBackdropEl.setAttribute("aria-hidden", "true");
  tnkBackdropEl.innerHTML = `
    <section class="tnk-dialog" role="dialog" aria-modal="true" aria-label="TNK tools" tabindex="-1">
      <header class="tnk-head">
        <div class="tnk-title"><b>TNK</b><span>Tools</span><em class="tnk-count"></em><em class="tnk-selection" data-tnt-selection></em></div>
        <button type="button" class="tnk-bar-btn" data-tnk-reset data-icon="ui.refresh" data-tooltip="Reset Parameters\nReturn every value in the bar to its default."></button>
      </header>
      <div class="tnk-global-bar">${tnkParamBarMarkup()}</div>
      <div class="tnk-search-row">
        <input class="tnk-filter" type="text" spellcheck="false" autocomplete="off" placeholder="Filter tools">
      </div>
      <div class="tnk-tool-rows"></div>
    </section>
  `;
  document.body.appendChild(tnkBackdropEl);
  if (typeof tntPaintDeclaredIcons === "function") tntPaintDeclaredIcons(tnkBackdropEl);
  tnkBackdropEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);

  tnkBackdropEl.addEventListener("input", event => {
    const input = event.target.closest("[data-tnk-param]");
    if (input) {
      const value = parseFloat(input.value);
      tnkParams[input.dataset.tnkParam] = Number.isFinite(value) ? value : TNK_PARAM_DEFAULTS[input.dataset.tnkParam];
      tnkSaveParams();
      tnkRender();
      return;
    }
    if (event.target === tnkFilterInput()) tnkRender();
  });

  tnkBackdropEl.addEventListener("click", event => {
    if (event.target === tnkBackdropEl) { hideTnkPanel(); return; }
    if (event.target.closest("[data-tnk-reset]")) {
      tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS);
      tnkSaveParams();
      tnkSyncParamInputs();
      tnkRender();
      if (statusEl) statusEl.textContent = "TNK parameters reset.";
      return;
    }
    const tool = event.target.closest("[data-tnk-index]");
    if (tool) {
      event.preventDefault();
      tnkRunEntry(Number(tool.dataset.tnkIndex || 0), event, tool);
    }
  });

  tnkBackdropEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideTnkPanel();
    }
  });

  return tnkBackdropEl;
}

function tnkKeyBadge(key) {
  if (!key) return "";
  return `<kbd class="tnk-key">${escapeHtml(key === "`" ? "\u0060" : key.toUpperCase())}</kbd>`;
}

function tnkToolMarkup(item, index, entryIndex) {
  const entry = entryIndex.get(item.command);
  const driven = entry && Array.isArray(entry.args) && entry.args.some(arg =>
    arg && typeof arg === "object" && !Array.isArray(arg) &&
    Object.keys(arg).some(key => key in tnkParams));
  // data-tooltip, not title. The native title attribute waits on the OS hover
  // delay - over a second - which is unusable on a panel whose only label is
  // the tooltip. The panel's own tooltip renders on mouseenter with no delay.
  // Headline, then one bulleted line per variation. The key goes in
  // data-tooltip-key so the tooltip can draw it as a chip rather than spell it
  // out mid-sentence.
  // Cross-checked against the selection, like every other surface.
  const unmet = typeof tntEntryUnmetRequirement === "function" ? tntEntryUnmetRequirement(entry) : "";
  const lines = [item.label];
  if (unmet) lines.push(`- ${unmet}`);
  if (item.shift && entryIndex.has(item.shift)) lines.push(`- Shift: ${item.shift}`);
  if (item.alt && entryIndex.has(item.alt)) lines.push(`- Alt: ${item.alt}`);
  if (driven) lines.push("- Uses the bar parameters");
  return `
    <button type="button" class="tnk-tool${driven ? " driven" : ""}${item.key ? " keyed" : ""}${unmet ? " unmet" : ""}" data-tnk-index="${index}" data-fx-source="${tntSourceGroup(entry)}" aria-label="${escapeHtml(item.label)}" data-tooltip="${escapeHtml(lines.join("\n"))}"${item.desc ? ` data-tooltip-desc="${escapeHtml(item.desc)}"` : ""}${item.key ? ` data-tooltip-key="${escapeHtml(item.key === "`" ? "\u0060" : item.key.toUpperCase())}"` : ""}>
      ${tntIconSvg(item.icon, "tnk-tool-icon") || ""}
      ${tnkKeyBadge(item.key)}
    </button>
  `;
}

function tnkRender() {
  if (!tnkToolRows()) return;
  const { groups, flat, index } = tnkResolvedGroups();
  if (tnkCountLabel()) tnkCountLabel().textContent = `${flat.length} tools`;

  tnkToolRows().innerHTML = groups.map(group => `
    <section class="tnk-group">
      <h4>${escapeHtml(group.title)}</h4>
      <div class="tnk-group-tools">
        ${group.entries.map(row => tnkToolMarkup(row.item, row.index, index)).join("")}
      </div>
    </section>
  `).join("") || `<div class="tnk-empty">No tool matches that filter</div>`;

  // Rendering replaces the buttons wholesale, so binding has to follow it.
  tnkToolRows().querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
}

async function tnkRunEntry(index, modifiers, button) {
  const { flat, index: entryIndex } = tnkResolvedGroups();
  const item = flat[index];
  if (!item) return;
  const entry = entryIndex.get(tnkCommandFor(item, modifiers));
  if (!entry) return;
  // Clone so the bar never mutates the shared registry entry.
  const withParams = Object.assign({}, entry, { args: tnkApplyParamsToArgs(entry.args) });
  const row = button || tnkToolRows().querySelector(`[data-tnk-index="${index}"]`);
  await tntRunWithProgress(row, entry.name, () => executeFxConsoleEntry(withParams));
}

// TNK's own keys, live while the panel is open. Skipped while a field has focus
// so typing in the filter or a parameter is never swallowed.
function tnkHandleKey(event) {
  if (event.metaKey || event.ctrlKey) return false;
  const target = event.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return false;
  const item = TNK_KEYMAP[String(event.key || "").toLowerCase()];
  if (!item) return false;
  const { flat } = tnkResolvedGroups();
  const index = flat.indexOf(item);
  if (index < 0) return false;
  event.preventDefault();
  event.stopPropagation();
  tnkRunEntry(index, event);
  return true;
}

// While TNK is open it owns the keyboard: its keys collide with the panel's own
// by design ("c" is Clone here and Composition Tools there), and TNK wins.
//
// This cannot be done with a capturing window listener. handleShortcut is bound
// on window earlier in the bundle, so it runs first and consumes the event
// before any listener added here. handleShortcut checks this guard instead -
// the same shape as the tntShortcutCaptureName guard already beside it.
function tnkOwnsKeyboard() {
  return !!(tnkBackdropEl && tnkBackdropEl.classList.contains("show"));
}

function tnkCaptureKeydown(event) {
  if (!tnkOwnsKeyboard()) return;
  tnkHandleKey(event);
}

function showTnkPanel() {
  const panel = ensureTnkPanel();
  if (panel.classList.contains("show")) {
    hideTnkPanel();
    return;
  }
  tnkLoadParams();
  tnkSyncParamInputs();
  tnkRender();
  if (typeof tntPaintSelectionReadouts === "function") tntPaintSelectionReadouts(panel);
  panel.classList.add("show");
  panel.setAttribute("aria-hidden", "false");
  window.addEventListener("keydown", tnkCaptureKeydown, true);
  // Focus the dialog, not the filter. TNK is key-driven first and searched
  // second; parking the caret in a text field would make every key below dead,
  // since tnkHandleKey deliberately ignores keystrokes aimed at an input.
  const dialog = panel.querySelector(".tnk-dialog");
  if (dialog) requestAnimationFrame(() => dialog.focus());
}

function hideTnkPanel() {
  if (!tnkBackdropEl) return;
  window.removeEventListener("keydown", tnkCaptureKeydown, true);
  tnkBackdropEl.classList.remove("show");
  tnkBackdropEl.setAttribute("aria-hidden", "true");
}

tnkLoadParams();
