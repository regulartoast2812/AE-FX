#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

for tool in rg jq osacompile osascript fd sd ast-grep sg node npm bun pnpm brew cargo pipx; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf "yes  %-12s %s\n" "$tool" "$(command -v "$tool")"
  else
    printf "no   %-12s\n" "$tool"
  fi
done

echo
du -sh js css jsx docs Ref after-effects-scripting-guide-master 2>/dev/null || true
