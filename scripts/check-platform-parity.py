#!/usr/bin/env python3
"""Cross-platform parity checks for the panel and its two native helpers.

The panel ships one web bundle and two helpers - Swift on macOS, C# on Windows -
that inject the same bridge API into the page and translate the same hotkeys
into the same control names. Nothing enforced that they agreed, so the Windows
helper silently fell three features behind: opening a panel group, the layer
menu and focus restore were all no-ops there while macOS worked.

Run from the repo root. Exits non-zero and prints what diverged.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Bridge hooks that are genuinely one-sided, with the reason. Anything else the
# page calls has to exist in both helpers.
PLATFORM_ONLY = {
    "__tntQuickPanelHitRects": "windows",   # WebView2 needs explicit hit shapes; AppKit does not
    "__tntNativeResize": "both-injected",   # injected by the host page shim, not named in helper source
    "__tntNativeClose": "both-injected",
    "__tntNativePost": "both-injected",
    "__tntNativeResolve": "both-injected",
    "__tntShortcutHandled": "page-only",    # an event flag, never a bridge call
    "__tntQuickPanelRunBinding": "page-only",
}


def read(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="replace")


def js_sources():
    return "\n".join(read(p) for p in sorted(Path(ROOT / "src/js").glob("*.js")))


def swift_source():
    return "\n".join(p.read_text(encoding="utf-8", errors="replace")
                     for p in sorted((ROOT / "native-helper/Sources").glob("*.swift")))


def windows_source():
    return read("native-helper-win/Program.cs")


# Divergences that are known and accepted, with the reason. They print as
# warnings so the debt stays visible, but they do not fail the check - a
# baseline that always fails is a check nobody runs. Anything NOT listed here
# fails, which is the point: a new gap cannot be introduced silently.
KNOWN_GAPS = {
    "__tntQuickPanelOpenLayerMenu":
        "Windows has no layer-menu trigger yet; the macOS helper opens it from a "
        "control-right-click on the timeline.",
    "__tntQuickPanelRestoreFocus":
        "Windows returns focus through ForceForeground on hide instead of asking "
        "the page to restore it.",
}


def check_bridge_api(problems, warnings):
    page = set(re.findall(r"__tnt[A-Za-z]+", js_sources()))
    mac = set(re.findall(r"__tnt[A-Za-z]+", swift_source()))
    win = set(re.findall(r"__tnt[A-Za-z]+", windows_source()))
    for name in sorted(page):
        if name in PLATFORM_ONLY:
            continue
        missing = [label for label, have in (("macOS", mac), ("Windows", win)) if name not in have]
        if not missing:
            continue
        message = ("bridge: the page calls window.%s but %s does not implement it"
                   % (name, " and ".join(missing)))
        if name in KNOWN_GAPS:
            warnings.append(message + " - known: " + KNOWN_GAPS[name])
        else:
            problems.append(message)


def control_map(text, pattern):
    return {m.group(1) for m in re.finditer(pattern, text)}


def check_control_names(problems):
    page = control_map(read("src/js/100-panels-shortcuts-bootstrap.js"),
                       r'"ctrl\+[a-z]":\s*"([a-z-]+)"')
    mac = control_map(swift_source(), r'case\s+\d+:\s*return\s+"([a-z-]+)"')
    win = control_map(windows_source(), r"\['[A-Z]'\]\s*=\s*\"([a-z-]+)\"")
    if not page or not mac or not win:
        problems.append("control names: a map could not be read - the checker's patterns need updating")
        return
    for label, names in (("macOS", mac), ("Windows", win)):
        for stale in sorted(names - page):
            problems.append(
                "control names: the %s helper still maps a hotkey to \"%s\", which the panel no longer offers"
                % (label, stale)
            )
        for absent in sorted(page - names):
            problems.append(
                "control names: the panel offers \"%s\" but the %s helper has no hotkey for it"
                % (absent, label)
            )


def check_asset_stamp(problems):
    """The ?v= on the bundle URLs must track the built bundles.

    A constant here means a WebView2 or WKWebView cache keeps serving an old
    js/main.js against fresh markup - which is how the tool broke on Windows
    while macOS, where the helper is restarted constantly, looked fine.
    """
    import hashlib

    digest = hashlib.sha1()
    for name in ("js/main.js", "css/style.css"):
        path = ROOT / name
        if not path.exists():
            problems.append("asset stamp: %s has not been built" % name)
            return
        digest.update(path.read_bytes())
    expected = digest.hexdigest()[:12]
    for page in ("index.html", "quick.html", "engine.html"):
        found = set(re.findall(r'(?:main\.js|style\.css)\?v=([0-9a-zA-Z._-]+)', read(page)))
        if found != {expected}:
            problems.append(
                "asset stamp: %s carries ?v=%s but the built bundles hash to %s - "
                "run scripts/build.sh, which stamps it" % (page, ",".join(sorted(found)) or "nothing", expected)
            )


def main():
    problems, warnings = [], []
    check_bridge_api(problems, warnings)
    check_control_names(problems)
    check_asset_stamp(problems)
    for warning in warnings:
        print("  ! " + warning)
    if warnings:
        print()
    if problems:
        print("Platform parity check FAILED\n")
        for problem in problems:
            print("  - " + problem)
        print("\n%d problem(s)." % len(problems))
        return 1
    print("Platform parity check: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
