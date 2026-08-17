#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${TNT_ASSISTANT_PORT:-48739}"
LOG="${TMPDIR:-/tmp}/tnt-assistant-server.log"
PIDFILE="${TMPDIR:-/tmp}/tnt-assistant-server.pid"
PYTHON="${PYTHON:-/usr/bin/python3}"

if /usr/bin/curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
  exit 0
fi

if [[ -f "$PIDFILE" ]]; then
  old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && /bin/kill -0 "$old_pid" >/dev/null 2>&1; then
    exit 0
  fi
fi

nohup "$PYTHON" "$ROOT/scripts/assistant-server.py" >"$LOG" 2>&1 &
echo "$!" > "$PIDFILE"

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if /usr/bin/curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    exit 0
  fi
  /bin/sleep 0.2
done

echo "Assistant server did not start. See $LOG" >&2
exit 1
