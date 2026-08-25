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
