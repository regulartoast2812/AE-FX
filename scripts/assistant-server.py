#!/usr/bin/env python3
import json
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RUNNER = os.path.join(ROOT, "scripts", "assistant-runner.sh")
HOST = "127.0.0.1"
PORT = int(os.environ.get("TNT_ASSISTANT_PORT", "48739"))
MAX_BODY = 1024 * 1024 * 8
TIMEOUT = int(os.environ.get("TNT_ASSISTANT_TIMEOUT", "600"))


class AssistantHandler(BaseHTTPRequestHandler):
    server_version = "TNTAssistant/1.0"

    def log_message(self, fmt, *args):
        return

    def _headers(self, status=200):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()

    def _json(self, payload, status=200):
        self._headers(status)
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self._headers(204)

    def do_GET(self):
        if self.path.startswith("/health"):
            self._json({"ok": True, "root": ROOT, "runner": RUNNER})
            return
        self._json({"ok": False, "error": "Not found."}, 404)

    def do_POST(self):
        if not self.path.startswith("/run"):
            self._json({"ok": False, "error": "Not found."}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY:
                self._json({"ok": False, "error": "Invalid request size."}, 413)
                return
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            provider = str(payload.get("provider") or "auto")
            prompt = str(payload.get("prompt") or "")
            if not prompt.strip():
                self._json({"ok": False, "error": "Enter a message for the assistant."}, 400)
                return
            with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, prefix="tnt-assistant-", suffix=".txt") as handle:
                prompt_path = handle.name
                handle.write(prompt)
            try:
                env = os.environ.copy()
                env["TNT_ASSISTANT_MCP_CONFIG"] = os.path.join(ROOT, "scripts", "assistant-mcp.json")
                result = subprocess.run(
                    ["/bin/bash", RUNNER, provider, prompt_path, ROOT],
                    cwd=ROOT,
                    env=env,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=TIMEOUT,
                )
            finally:
                try:
                    os.unlink(prompt_path)
                except OSError:
                    pass
            output = (result.stdout or "").strip()
            error_output = (result.stderr or "").strip()
            if result.returncode:
                self._json({"ok": False, "error": error_output or output or "Assistant runner failed."}, 500)
                return
            self._json({"ok": True, "provider": provider, "result": output + (("\n" + error_output) if error_output else "")})
        except subprocess.TimeoutExpired:
            self._json({"ok": False, "error": "Assistant timed out."}, 504)
        except Exception as err:
            self._json({"ok": False, "error": str(err)}, 500)


def main():
    server = ThreadingHTTPServer((HOST, PORT), AssistantHandler)
    server.serve_forever()


if __name__ == "__main__":
    main()
