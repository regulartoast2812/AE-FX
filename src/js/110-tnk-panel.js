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
// Buttons are icon-only, the way TNK's were: at this size a row of glyphs is
// read by shape and position, not by reading words, and that is the whole
// speed argument for the panel. Which means every tool needs its OWN icon -
// the shared action/target glyphs used in the Functions list would render half
// this panel as the same sparkle. So each entry names its own Lucide icon here,
// and the name survives as the hover tooltip.
const TNK_GROUPS = [
  { title: "Motion", commands: [
    ["Scale In", "maximize-2"],
    ["Scale Out", "minimize-2"],
    ["Scale In+Out", "scaling"],
    ["Opacity In", "eye"],
    ["Opacity Out", "eye-off"],
    ["Opacity In+Out", "glasses"],
    ["Anticipation Tool", "undo-2"]
  ] },
  { title: "Keys", commands: [
    ["Ease In / Out", "spline"],
    ["Linear Keyframes", "trending-up"],
    ["Align Keys to Playhead", "align-center-vertical"],
    ["Clone Keyframes", "copy"],
    ["Clone Keyframes Flipped", "flip-horizontal-2"],
    ["Reverse Keyframes", "arrow-left-right"],
    ["Wiggle Expression", "activity"],
    ["Overshoot Expression", "waves"],
    ["Clear Expressions", "eraser"]
  ] },
  { title: "Layers", commands: [
    ["Duplicate Selected Layers", "copy-plus"],
    ["Split Selected Layers", "split"],
    ["Precompose Selected", "package"],
    ["Create Null", "square-dashed"],
    ["Parent to Null", "link"],
    ["Stagger Layers...", "align-start-vertical"],
    ["Hide Selected", "ghost"],
    ["Lock Selected", "lock"],
    ["Solo Focus Toggle", "focus"]
  ] },
  { title: "Timing", commands: [
    ["Trim In to Playhead", "arrow-right-to-line"],
    ["Trim Out to Playhead", "arrow-left-to-line"],
    ["Trim to Keyframes", "scissors"],
    ["Snap Layers to Playhead In Point", "chevrons-left"],
    ["Snap Layers to Playhead Out Point", "chevrons-right"],
    ["Auto Trim Comp", "crop"]
  ] },
  { title: "Effects", commands: [
    ["Apply Glow", "sparkles"],
    ["Apply Light Sweep", "flashlight"],
    ["Apply VHS", "tv"],
    ["Apply Blur In+Out", "droplets"],
    ["Apply Grain", "grip"],
    ["Apply Dim + Desat", "sun-dim"],
    ["Toggle Effects", "toggle-left"],
    ["Delete All Effects", "trash-2"]
  ] },
  { title: "Text", commands: [
    ["Set Text Content...", "type"],
    ["Find / Replace Text...", "replace"],
    ["Text: Remove In Animator + Marker", "list-x"],
    ["Text: Remove Out Animator + Marker", "text-select"]
  ] },
  { title: "Markers", commands: [
    ["Markers: Set In Marker", "flag"],
    ["Markers: Set Out Marker", "flag-triangle-right"],
    ["Markers: Add Marker...", "bookmark-plus"],
    ["Markers: Remove In/Out Markers", "flag-off"]
  ] }
];

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
function tnkResolvedGroups() {
  const index = tnkEntryIndex();
  const query = String(tnkFilterInput() ? tnkFilterInput().value : "").toLowerCase().trim();
  const terms = query.split(/\s+/).filter(Boolean);
  const flat = [];
  const groups = TNK_GROUPS.map(group => {
    const entries = group.commands
      .map(([name, icon]) => {
        const entry = index.get(name);
        return entry ? { entry, icon } : null;
      })
      .filter(Boolean)
      .filter(item => {
        if (!terms.length) return true;
        const haystack = `${item.entry.name || ""} ${item.entry.category || ""}`.toLowerCase();
        return terms.every(term => haystack.indexOf(term) >= 0);
      })
      .map(item => Object.assign(item, { index: flat.push(item.entry) - 1 }));
    return { title: group.title, entries };
  }).filter(group => group.entries.length);
  return { groups, flat };
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
    <section class="tnk-dialog" role="dialog" aria-modal="true" aria-label="TNK tools">
      <header class="tnk-head">
        <div class="tnk-title"><b>TNK</b><span>Tools</span><em class="tnk-count"></em></div>
        <button type="button" class="tnk-bar-btn" data-tnk-reset data-icon="ui.refresh" title="Reset every parameter to its default"></button>
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
      tnkRunEntry(Number(tool.dataset.tnkIndex || 0));
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

function tnkToolMarkup(entry, icon, index) {
  const name = String(entry.name || entry.matchName || "Tool");
  const driven = Array.isArray(entry.args) && entry.args.some(arg =>
    arg && typeof arg === "object" && !Array.isArray(arg) &&
    Object.keys(arg).some(key => key in tnkParams));
  const shortcut = typeof tntShortcutForEntry === "function" ? tntShortcutForEntry(entry) : "";
  // The name lives only in the tooltip now, so it has to carry everything the
  // label used to: what it is, its key, and whether the bar drives it.
  const tip = [name, shortcut, driven ? "uses the bar parameters" : ""].filter(Boolean).join(" \u00b7 ");
  return `
    <button type="button" class="tnk-tool${driven ? " driven" : ""}" data-tnk-index="${index}" aria-label="${escapeHtml(name)}" title="${escapeHtml(tip)}">
      ${tntIconSvg(icon, "tnk-tool-icon") || ""}
    </button>
  `;
}

function tnkRender() {
  if (!tnkToolRows()) return;
  const { groups, flat } = tnkResolvedGroups();
  if (tnkCountLabel()) tnkCountLabel().textContent = `${flat.length} tools`;

  tnkToolRows().innerHTML = groups.map(group => `
    <section class="tnk-group">
      <h4>${escapeHtml(group.title)}</h4>
      <div class="tnk-group-tools">
        ${group.entries.map(item => tnkToolMarkup(item.entry, item.icon, item.index)).join("")}
      </div>
    </section>
  `).join("") || `<div class="tnk-empty">No tool matches that filter</div>`;
}

async function tnkRunEntry(index) {
  const entry = tnkResolvedGroups().flat[index];
  if (!entry) return;
  // Clone so the bar never mutates the shared registry entry.
  const withParams = Object.assign({}, entry, { args: tnkApplyParamsToArgs(entry.args) });
  const row = tnkToolRows().querySelector(`[data-tnk-index="${index}"]`);
  await tntRunWithProgress(row, entry.name, () => executeFxConsoleEntry(withParams));
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
  panel.classList.add("show");
  panel.setAttribute("aria-hidden", "false");
  const filter = tnkFilterInput();
  if (filter) requestAnimationFrame(() => filter.focus());
}

function hideTnkPanel() {
  if (!tnkBackdropEl) return;
  tnkBackdropEl.classList.remove("show");
  tnkBackdropEl.setAttribute("aria-hidden", "true");
}

tnkLoadParams();
