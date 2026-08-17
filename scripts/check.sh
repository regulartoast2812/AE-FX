#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

target="${1:-all}"

case "$target" in
  build)
    scripts/build.sh
    ;;
  js|main)
    scripts/build.sh
    osacompile -l JavaScript -o /tmp/ae_panel_main.scpt js/main.js
    ;;
  jsx|timeline)
    osacompile -l JavaScript -o /tmp/ae_panel_timeline.scpt jsx/timeline.jsx
    ;;
  all)
    scripts/build.sh
    osacompile -l JavaScript -o /tmp/ae_panel_main.scpt js/main.js
    osacompile -l JavaScript -o /tmp/ae_panel_timeline.scpt jsx/timeline.jsx
    ;;
  *)
    echo "Usage: scripts/check.sh [all|build|js|jsx]" >&2
    exit 2
    ;;
esac

echo "ok: $target"
