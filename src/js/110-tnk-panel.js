// TNK-style tool layout.
//
// A tribute to TNK v3's arrangement, not its skin: a persistent global parameter
// bar that every tool reads from, above dense wrapping rows of small buttons.
// That bar was the point of TNK - you set ease or timing once and every command
// used it, rather than each command carrying its own baked-in values. Sixty-six
// commands here still ship hardcoded args like { easeIn: 75, easeOut: 75 }, so
// the bar has something real to do.
//
// Styling follows the current panel, not TNK's blue-violet palette.

const TNK_PARAM_DEFAULTS = {
  inTime: 1, outTime: 1, easeIn: 75, easeOut: 75,
  pixels: 100, freq: 2, amp: 20, textIn: 0.35, textOut: 0.35
};
const TNK_PARAMS_KEY = "tnkParams.v1";
let tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS);

// Resolved lazily rather than held in module-level consts. The bundle is one
// concatenated script: function declarations hoist across all of it, so
// 100-panels-shortcuts-bootstrap.js can call tnkRender during its own init -
// before this file's consts have initialised - and touching one then throws a
// temporal dead zone error that aborts the rest of the bundle.
function tnkPanel() { return document.getElementById("assistantTnkPanel"); }
function tnkToolRows() { return document.getElementById("tnkToolRows"); }
function tnkFilterInput() { return document.getElementById("tnkFilter"); }
function tnkCountLabel() { return document.getElementById("tnkCount"); }

function tnkLoadParams() {
  try {
    const raw = window.localStorage.getItem(TNK_PARAMS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS, parsed && typeof parsed === "object" ? parsed : {});
  } catch (_) {
    tnkParams = Object.assign({}, TNK_PARAM_DEFAULTS);
  }
  tnkSyncParamInputs();
}

function tnkSaveParams() {
  try { window.localStorage.setItem(TNK_PARAMS_KEY, JSON.stringify(tnkParams)); } catch (_) {}
}

function tnkSyncParamInputs() {
  if (!tnkPanel()) return;
  tnkPanel().querySelectorAll("[data-tnk-param]").forEach(input => {
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

function tnkEntries() {
  const query = tnkFilterInput() ? tnkFilterInput().value : "";
  let entries = [];
  try {
    entries = searchFxConsoleEntries(query, null, ASSISTANT_SEARCH_LIMIT) || [];
  } catch (_) {}
  // Only things this bar can meaningfully drive, plus panel commands.
  return entries.filter(entry => entry && !entry.children);
}

function tnkRender() {
  if (!tnkToolRows()) return;
  const entries = tnkEntries().slice(0, 400);
  if (tnkCountLabel()) tnkCountLabel().textContent = `${entries.length} tools`;

  tnkToolRows().innerHTML = entries.map((entry, index) => {
    const name = String(entry.name || entry.matchName || "Tool");
    const driven = Array.isArray(entry.args) && entry.args.some(arg =>
      arg && typeof arg === "object" && !Array.isArray(arg) &&
      Object.keys(arg).some(key => key in tnkParams));
    const shortcut = typeof tntShortcutForEntry === "function" ? tntShortcutForEntry(entry) : "";
    const tip = [name, driven ? "uses the bar parameters" : "", shortcut].filter(Boolean).join(" · ");
    return `
      <button type="button" class="tnk-tool${driven ? " driven" : ""}" data-tnk-index="${index}" data-fx-source="${tntSourceGroup(entry)}" title="${escapeHtml(tip)}">
        ${tntActionIconMarkup(entry)}
        <span>${escapeHtml(name)}</span>
      </button>
    `;
  }).join("") || `<div class="tnk-empty">No tool matches that filter</div>`;
}

async function tnkRunEntry(index) {
  const entries = tnkEntries().slice(0, 400);
  const entry = entries[index];
  if (!entry) return;
  // Clone so the bar never mutates the shared registry entry.
  const withParams = Object.assign({}, entry, { args: tnkApplyParamsToArgs(entry.args) });
  const row = tnkToolRows().querySelector(`[data-tnk-index="${index}"]`);
  await tntRunWithProgress(row, entry.name, () => executeFxConsoleEntry(withParams));
}

const tnkPanelRoot = tnkPanel();
if (tnkPanelRoot) {
  tnkPanelRoot.addEventListener("input", event => {
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

  tnkPanelRoot.addEventListener("click", event => {
    if (event.target.closest("#tnkResetParams")) {
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

  tnkLoadParams();
}
