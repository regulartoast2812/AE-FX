#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$root/native/AE FX Quick Controls.app"
exe="$app/Contents/MacOS/AEFXQuickControls"

# A restricted caller may be unable to inspect or stop the existing helper.
# Do not report a successful restart when pgrep itself is unavailable.
probe_status=0
/usr/bin/pgrep -x AEFXQuickControls >/dev/null 2>&1 || probe_status=$?
if [[ "$probe_status" -gt 1 ]]; then
  echo "Cannot inspect the listener process from this environment. Run scripts/launch-native-helper.sh from Terminal to restart it." >&2
  exit 1
fi

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

launch_log="$(mktemp "${TMPDIR:-/tmp}/ae-fx-launch.XXXXXX")"
if ! open "$app" >"$launch_log" 2>&1; then
  nohup "$exe" >>"$launch_log" 2>&1 </dev/null &
fi

for _ in $(seq 1 40); do
  if /usr/bin/pgrep -x AEFXQuickControls >/dev/null 2>&1; then
    sleep 0.5
    if /usr/bin/pgrep -x AEFXQuickControls >/dev/null 2>&1; then
      echo "Quick Controls listener restarted."
      exit 0
    fi
  fi
  sleep 0.1
done

echo "Quick Controls did not stay running. Launch details: $launch_log" >&2
cat "$launch_log" >&2
exit 1
