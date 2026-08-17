#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$root/native/TNT Quick Controls.app"

if [[ ! -x "$app/Contents/MacOS/TNTQuickControls" ]]; then
  "$root/scripts/build-native-helper.sh"
fi

open "$app"
