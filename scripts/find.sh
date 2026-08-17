#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/find.sh <pattern> [rg args...]" >&2
  exit 2
fi

pattern="$1"
shift || true

rg -n -S "$pattern" js css jsx docs AGENTS.md README.md "$@"
