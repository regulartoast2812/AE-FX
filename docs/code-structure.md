# Code Structure

The CEP runtime still loads `js/main.js` and `css/style.css`. Those files are generated bundles so Adobe receives the same classic-script loading model it had before modularization.

Edit files under `src/`, then run:

```bash
scripts/build.sh
```

`scripts/check.sh js` and `scripts/check.sh all` run the build automatically.

## JavaScript Ownership

| Source | Responsibility |
| --- | --- |
| `src/js/00-core.js` | Shared state, host bridge primitives, command metadata, generic dialogs/actions |
| `src/js/10-style-mask-panels.js` | Layer Styles and Mask Control panels |
| `src/js/20-settings-host.js` | Settings, shortcut rundown, relationship/host helpers |
| `src/js/30-filter-selection.js` | Layer filtering, focus state, and selection operations |
| `src/js/40-timeline-layout.js` | Timeline layout, ruler, markers, flow, and relationship rendering |
| `src/js/50-keyframes-render.js` | Main render path, keyframe mode, and keyframe selection |
| `src/js/60-sync-context-menus.js` | AE synchronization, refresh lifecycle, and context menus |
| `src/js/70-interaction-playback.js` | Pointer interaction, drag/drop, playback, edits, and undo routing |
| `src/js/80-command-palette.js` | Ctrl+K command palette and command filtering |
| `src/js/90-ease-panel.js` | Ease Editor UI, graph interaction, and live ease updates |
| `src/js/95-mass-edit-panel.js` | Multi-layer property, effect, and keyframe transfer |
| `src/js/97-timing-order-panel.js` | Combined layer Stagger/Sequence and stack-order workspace |
| `src/js/100-panels-shortcuts-bootstrap.js` | Duration, Anchor, Composition panels, shortcuts, event binding, bootstrap |

## CSS Ownership

CSS is ordered because later files intentionally refine older rules. Keep the order in `scripts/build.sh`.

| Source | Responsibility |
| --- | --- |
| `src/css/00-base-timeline.css` | Base reset, shell, toolbar, tracks, layers |
| `src/css/10-dialogs-markers.css` | Duration dialog, shared dialogs, marker foundations |
| `src/css/20-timeline-history.css` | Earlier timeline, marker, relationship, and interaction refinements |
| `src/css/30-keyframes-filters.css` | Keyframe mode, filter/selection UI, command palette foundations |
| `src/css/40-layout-native-theme.css` | Frozen-column geometry and native AE color/layout refinements |
| `src/css/50-modern-theme-controls.css` | Current graphite-glass theme and shared control sizing |
| `src/css/60-style-anchor-panels.css` | Layer Styles, Anchor, and Align panel redesigns |
| `src/css/70-style-context-refinements.css` | Style node behavior, context menus, ruler and timeline refinements |
| `src/css/80-ease-panel.css` | Ease Editor layout, graph, controls, sliders, and header rhythm |
| `src/css/85-mass-edit-panel.css` | Mass Edit panel layout and transfer controls |
| `src/css/87-timing-order-panel.css` | Stagger/Sequence and layer-order floating panels |
| `src/css/90-command-panels.css` | Final selector, Composition tools, active filter indicator, subpanel rail |

## Runtime Files

- `index.html`: CEP markup and runtime bundle loading.
- `jsx/timeline.jsx`: After Effects host-side scripting.
- `js/main.js`: generated from `src/js/`.
- `css/style.css`: generated from `src/css/`.
- `scripts/build.sh`: canonical bundle order.
- `scripts/check.sh`: build and syntax validation entry point.
- `native-helper/`: macOS borderless `NSPanel` companion source.
- `scripts/build-native-helper.sh`: builds and ad-hoc signs the companion app.
- `scripts/launch-native-helper.sh`: builds when needed and launches the companion.

## Native Quick Controls

The macOS helper loads the generated `quick.html` in a transparent `WKWebView`.
`js/CSInterface.js` detects the native message handler and forwards the same
ExtendScript strings to Swift. Swift executes them in the running After Effects
instance through AppleScript `DoScript`, so the existing JSX host functions stay
canonical and no local polling server is required. The helper owns the OS-level
summon shortcuts, currently `Ctrl+Space` and `Ctrl+K`, so those keys work while
After Effects or the helper is frontmost.
# Quick Controls Entry

`quick.html` is generated from `index.html` during `scripts/build.sh` and is
loaded by the native macOS helper. It is no longer registered as a CEP
modeless extension because CEP-owned window chrome cannot be transparent or
frameless. Quick mode reuses the production subpanel implementations, but it
does not start the timeline renderer, native-selection event listener, or
selection monitor. It performs a lightweight structure read only when opened,
focused, manually refreshed, or before launching a subpanel.
