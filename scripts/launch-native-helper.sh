#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$root/native/AE FX Quick Controls.app"
exe="$app/Contents/MacOS/AEFXQuickControls"

if [[ ! -x "$exe" ]]; then
  "$root/scripts/build-native-helper.sh"
fi

# Restart, not "open if not already running".
#
# `open` on an app that is already running just activates it - it does not start
# a new process. So a stale instance, one built from older code or whose webview
# has died, could never be replaced from the panel: pressing Start listener
# re-activated the broken process and reported success. The old instance also
# owns all eleven Carbon hot keys, so nothing else can take them, and the whole
# listener stays dead with nothing in the log.
if pgrep -x AEFXQuickControls >/dev/null 2>&1; then
  pkill -x AEFXQuickControls || true
  for _ in $(seq 1 40); do
    pgrep -x AEFXQuickControls >/dev/null 2>&1 || break
    sleep 0.05
  done
  pkill -9 -x AEFXQuickControls 2>/dev/null || true
fi

if ! open "$app" >/dev/null 2>&1; then
  nohup "$exe" >/dev/null 2>&1 &
fi
