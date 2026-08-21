#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$root/native/AE PR Quick Controls.app"

if [[ ! -x "$app/Contents/MacOS/AEPRQuickControls" ]]; then
  "$root/scripts/build-native-helper.sh"
fi

open "$app"
