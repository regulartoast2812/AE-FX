#!/usr/bin/env bash
set -euo pipefail

provider="${1:-auto}"
prompt_file="${2:-}"
root="${3:-$PWD}"

export PATH="$HOME/.local/bin:$HOME/.vscode/extensions/openai.chatgpt-26.803.41515-darwin-arm64/bin/macos-aarch64:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

for codex_bin in "$HOME"/.vscode/extensions/openai.chatgpt-*-darwin-arm64/bin/macos-aarch64/codex; do
  if [[ -x "$codex_bin" ]]; then
    export PATH="$(dirname "$codex_bin"):$PATH"
  fi
done

if [[ "$provider" == "--list" ]]; then
  for name in claude codex ollama; do
    if command -v "$name" >/dev/null 2>&1; then
      printf '%s\t%s\n' "$name" "$(command -v "$name")"
    fi
  done
  exit 0
fi

if [[ -z "$prompt_file" || ! -f "$prompt_file" ]]; then
  echo "No prompt file provided." >&2
  exit 2
fi

prompt="$(cat "$prompt_file")"
mcp_config="${TNT_ASSISTANT_MCP_CONFIG:-$root/scripts/assistant-mcp.json}"
requested="$provider"
if [[ "$requested" == "auto" ]]; then
  requested="${TNT_ASSISTANT_PROVIDER:-${ASSISTANT_PROVIDER:-}}"
  if [[ -z "$requested" ]]; then
    if command -v claude >/dev/null 2>&1; then requested="claude";
    elif command -v codex >/dev/null 2>&1; then requested="codex";
    elif command -v ollama >/dev/null 2>&1; then requested="ollama";
    else requested=""; fi
  fi
fi

case "$requested" in
  claude)
    claude_args=(--print --model "${CLAUDE_MODEL:-sonnet}" --dangerously-skip-permissions)
    if [[ -f "$mcp_config" ]]; then
      claude_args+=(--mcp-config "$mcp_config")
    fi
    printf '%s\n' "$prompt" | exec claude "${claude_args[@]}"
    ;;
  codex)
    exec codex exec -C "$root" --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox "$prompt"
    ;;
  ollama)
    exec ollama run "${OLLAMA_MODEL:-qwen3.5:latest}" "$prompt"
    ;;
  *)
    echo "No assistant provider is available. Install or configure claude, codex, or ollama." >&2
    exit 127
    ;;
esac
