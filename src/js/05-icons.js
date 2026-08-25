// Icon registry.
//
// icons/lucide.js is loaded by a plain <script> tag before this bundle, so the
// whole 2,035-icon set is available synchronously on window.TNT_LUCIDE. That
// matters because every renderer builds its markup as a string - an async icon
// lookup would force all of them to become async. A script tag also works
// identically in the CEP panel and in both native overlays (WKWebView and
// WebView2), where a fetch() from file:// would not.
//
// Icons are referenced by semantic role rather than by Lucide name, so swapping
// the glyph for a role is a one-line change here and nothing else moves.

const TNT_ICON_FALLBACK = "circle";

// Role -> Lucide name.
const TNT_ICON_ROLES = {
  // Panel chrome
  "ui.settings": "settings",
  "ui.refresh": "refresh-cw",
  "ui.search": "search",
  "ui.close": "x",

  // Action verbs, matching TNT_ACTION_TITLES
  "action.Open": "panel-right-open",
  "action.Set": "sliders-horizontal",
  "action.Apply": "sparkles",
  "action.Add": "circle-plus",
  "action.Delete": "trash-2",
  "action.Show": "eye",
  "action.Go To": "circle-chevron-right",
  "action.Space": "align-horizontal-space-around",
  "action.Play": "play",

  // Targets that earn their own glyph, overriding the action icon
  "target.Marker": "flag",
  "target.Text": "type",
  "target.Shape": "shapes",
  "target.Mask": "scan",
  "target.Effect": "wand-sparkles",

  // Quick Controls subpanels
  "panel.anchor": "crosshair",
  "panel.composition": "film",
  "panel.rename-comp": "pencil",
  "panel.ease": "spline",
  "panel.mask": "scan",
  "panel.effects": "wand-sparkles",
  "panel.shapes": "shapes",
  "panel.styles": "layers",
  "panel.layer-menu": "list",
  "panel.mass-edit": "list-checks",
  "panel.text-animation": "type",
  "panel.timing-order": "align-start-vertical",
  "panel.filter": "filter"
};

function tntIconLibraryReady() {
  return !!(window.TNT_LUCIDE && typeof window.TNT_LUCIDE === "object");
}

// Inner markup for a Lucide icon name. Unknown names fall back rather than
// rendering an empty box, so a typo is visible but never breaks a layout.
function tntIconMarkupByName(name) {
  if (!tntIconLibraryReady()) return "";
  const icons = window.TNT_LUCIDE;
  return icons[name] || icons[TNT_ICON_FALLBACK] || "";
}

function tntIconNameForRole(role) {
  return TNT_ICON_ROLES[role] || "";
}

// Full <svg> for a role, e.g. tntIconSvg("panel.ease", "quick-panel-icon").
// Falls back to a role's raw Lucide name if the role is unknown, so callers can
// pass either - which is what a user-assigned custom icon will do.
function tntIconSvg(roleOrName, className) {
  const name = tntIconNameForRole(roleOrName) || roleOrName;
  const inner = tntIconMarkupByName(name);
  if (!inner) return "";
  const cls = className ? ` class="${className}"` : "";
  return `<svg${cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
}

// Names available for a future icon picker.
function tntIconCatalogue() {
  return tntIconLibraryReady() ? Object.keys(window.TNT_LUCIDE).sort() : [];
}


// Paints every element carrying data-icon. Static markup declares the role and
// this fills it, so index.html holds no path data at all.
function tntPaintDeclaredIcons(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-icon]").forEach(el => {
    const role = el.getAttribute("data-icon");
    if (!role || el.querySelector("svg")) return;
    const cls = el.classList.contains("quick-panel-grid-button") ? "quick-panel-icon" : "";
    const markup = tntIconSvg(role, cls || (el.closest(".quick-panel-grid") ? "quick-panel-icon" : "tnt-action-icon"));
    if (markup) el.insertAdjacentHTML("afterbegin", markup);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => tntPaintDeclaredIcons());
} else {
  tntPaintDeclaredIcons();
}


// ---- Icon picker ------------------------------------------------------------
// Searchable across the whole Lucide set. Results are capped because rendering
// 2,035 inline SVGs at once is slow enough to feel broken; searching narrows it
// long before the cap matters.

const TNT_ICON_PICKER_LIMIT = 240;
let tntIconPickerTarget = "";
let tntIconPickerEl = null;

function tntEnsureIconPicker() {
  if (tntIconPickerEl) return tntIconPickerEl;
  const el = document.createElement("div");
  el.className = "tnt-icon-picker-backdrop";
  el.innerHTML = `
    <div class="tnt-icon-picker" role="dialog" aria-label="Choose an icon">
      <div class="tnt-icon-picker-head">
        <strong>Choose an icon</strong>
        <span class="tnt-icon-picker-for"></span>
        <button type="button" data-icon-reset title="Use the default icon for this command">Reset</button>
        <button type="button" data-icon-close aria-label="Close">Close</button>
      </div>
      <input type="text" class="tnt-icon-picker-search" placeholder="Search 2,035 icons" spellcheck="false" autocomplete="off">
      <div class="tnt-icon-picker-grid"></div>
    </div>
  `;
  document.body.appendChild(el);

  const search = el.querySelector(".tnt-icon-picker-search");
  search.addEventListener("input", () => tntRenderIconPickerGrid(search.value));
  search.addEventListener("keydown", event => {
    // Escape must close the picker, not leak to the panel's shortcut handlers.
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      tntCloseIconPicker();
    }
  });

  el.addEventListener("click", event => {
    if (event.target === el || event.target.closest("[data-icon-close]")) {
      tntCloseIconPicker();
      return;
    }
    if (event.target.closest("[data-icon-reset]")) {
      tntAssignIcon(tntIconPickerTarget, "");
      return;
    }
    const choice = event.target.closest("[data-icon-name]");
    if (choice) tntAssignIcon(tntIconPickerTarget, choice.dataset.iconName);
  });

  tntIconPickerEl = el;
  return el;
}

function tntRenderIconPickerGrid(query) {
  const el = tntEnsureIconPicker();
  const grid = el.querySelector(".tnt-icon-picker-grid");
  const term = String(query || "").toLowerCase().trim();
  const all = tntIconCatalogue();
  const matches = term ? all.filter(name => name.indexOf(term) >= 0) : all;
  const shown = matches.slice(0, TNT_ICON_PICKER_LIMIT);
  const current = (typeof tntUserIcons === "object" && tntIconPickerTarget)
    ? tntUserIcons[tntIconPickerTarget] || ""
    : "";

  grid.innerHTML = shown.map(name => `
    <button type="button" class="tnt-icon-choice${name === current ? " active" : ""}" data-icon-name="${name}" title="${name}">
      ${tntIconSvg(name, "tnt-icon-choice-glyph")}
      <span>${name}</span>
    </button>
  `).join("") || `<div class="tnt-icon-picker-empty">No icon matches "${escapeHtml(term)}"</div>`;

  const count = el.querySelector(".tnt-icon-picker-for");
  const more = matches.length > shown.length ? ` · showing ${shown.length}` : "";
  count.textContent = `${tntIconPickerTarget} — ${matches.length} match${matches.length === 1 ? "" : "es"}${more}`;
}

function tntOpenIconPicker(commandName) {
  if (!commandName) return;
  tntIconPickerTarget = commandName;
  const el = tntEnsureIconPicker();
  el.classList.add("open");
  const search = el.querySelector(".tnt-icon-picker-search");
  search.value = "";
  tntRenderIconPickerGrid("");
  setTimeout(() => search.focus(), 0);
}

function tntCloseIconPicker() {
  if (tntIconPickerEl) tntIconPickerEl.classList.remove("open");
  tntIconPickerTarget = "";
}

function tntAssignIcon(commandName, iconName) {
  if (!commandName) return;
  if (iconName) tntUserIcons[commandName] = iconName;
  else delete tntUserIcons[commandName];
  tntSaveUserIcons();
  tntCloseIconPicker();
  try { renderAssistantFunctions(); } catch (_) {}
  try { renderQuickPanelSearchResults(); } catch (_) {}
  if (typeof statusEl !== "undefined" && statusEl) {
    statusEl.textContent = iconName
      ? `${commandName} icon set to "${iconName}".`
      : `${commandName} icon reset to default.`;
  }
}
