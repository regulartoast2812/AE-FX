#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

js_sources=(
  src/js/00-core.js
  src/js/10-style-mask-panels.js
  src/js/20-settings-host.js
  src/js/30-filter-selection.js
  src/js/40-timeline-layout.js
  src/js/50-keyframes-render.js
  src/js/60-sync-context-menus.js
  src/js/70-interaction-playback.js
  src/js/80-command-palette.js
  src/js/90-ease-panel.js
  src/js/95-mass-edit-panel.js
  src/js/96-text-animation-panel.js
  src/js/97-timing-order-panel.js
  src/js/100-panels-shortcuts-bootstrap.js
)

css_sources=(
  src/css/00-base-timeline.css
  src/css/10-dialogs-markers.css
  src/css/20-timeline-history.css
  src/css/30-keyframes-filters.css
  src/css/40-layout-native-theme.css
  src/css/50-modern-theme-controls.css
  src/css/60-style-anchor-panels.css
  src/css/70-style-context-refinements.css
  src/css/80-ease-panel.css
  src/css/85-mass-edit-panel.css
  src/css/86-text-animation-panel.css
  src/css/87-timing-order-panel.css
  src/css/90-command-panels.css
  src/css/95-quick-panel.css
)

build_bundle() {
  local output="$1"
  shift

  local temp
  temp="$(mktemp "${TMPDIR:-/tmp}/ae-panel-build.XXXXXX")"
  trap 'rm -f "$temp"' RETURN

  for source in "$@"; do
    [[ -f "$source" ]] || {
      echo "Missing source module: $source" >&2
      exit 1
    }
    cat "$source" >> "$temp"
  done

  mv "$temp" "$output"
  trap - RETURN
}

build_bundle js/main.js "${js_sources[@]}"
build_bundle css/style.css "${css_sources[@]}"
cp index.html quick.html

echo "built: js/main.js (${#js_sources[@]} modules)"
echo "built: css/style.css (${#css_sources[@]} modules)"
echo "built: quick.html"
