# TNT Quick Controls — Windows helper

Windows counterpart to `native-helper/` (macOS Swift). Same contract, same hotkeys.

## Build

Requires the .NET 8 SDK and a WebView2 runtime (preinstalled on Windows 11 and
current Windows 10; otherwise install the Evergreen runtime from Microsoft).

```
cd native-helper-win
dotnet build -c Release
```

Run it with the extension folder discoverable — the app walks up from its own
directory looking for `quick.html`, or you can point it explicitly:

```
set TNT_EXTENSION_ROOT=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\ae_premiere_timeline_panel
dotnet run -c Release
```

## How it talks to After Effects

It doesn't, directly. The panel running inside AE listens on `127.0.0.1:8099`
(`src/js/25-native-bridge-server.js`). This app sends newline-delimited JSON:

```
-> {"id":"7","script":"tntGetTimeline()"}
<- {"id":"7","result":"{\"ok\":true,...}"}
```

The panel executes the script through `CSInterface.evalScript`. That is why the
Windows build needs no equivalent of the macOS AppleScript path — there isn't
one on Windows, and it is no longer needed on either platform.

**The panel must be open in After Effects.** With it closed, the bridge refuses
the connection and every request returns `{"ok":false,"error":"..."}` immediately.

The macOS helper does not have this limitation — it bootstraps the panel with a
one-shot AppleScript `DoScript` that runs `app.findMenuCommandId` /
`app.executeCommand` on the panel's Window-menu entry. After Effects exposes no
equivalent scripting IPC on Windows, so there is no way to open the panel from
outside AE here. Options, none implemented:

- Tell the user to open the panel (current behavior — the error message says so).
- Ship a stub `.jsx` in the Scripts folder bound to a keyboard shortcut, which
  opens the panel from *inside* AE. Cross-platform, but costs a shortcut slot.

## Hotkeys

`Ctrl+Space` summons the overlay. Control keys match the macOS helper:

| Key | Control | | Key | Control |
|---|---|---|---|---|
| `Ctrl+A` | anchor | | `Ctrl+M` | mass-edit |
| `Ctrl+C` | composition | | `Ctrl+T` | text-animation |
| `Ctrl+E` | ease | | `Ctrl+O` | timing-order |
| `Ctrl+F` | mask | | `Ctrl+X` | filter |
| `Ctrl+S` | styles | | `Esc` | hide overlay |

`RegisterHotKey` is system-wide, so these are claimed globally while the helper
runs — including over Ctrl+C / Ctrl+X / Ctrl+S in other apps. That matches the
macOS helper's behavior and is the main thing to revisit past the proof of
concept.

## Known gaps (proof of concept)

- Overlay centers on the primary screen; the macOS helper positions it over the
  After Effects window (see `afterEffectsOverlayFrame` in `native-helper/`).
- No single-instance guard (macOS has `terminateDuplicateQuickControlsInstances`).
- Not built or run on Windows yet. The macOS half of the bridge is tested.

## Transparency

The window is WPF with `AllowsTransparency=True` + `WindowStyle=None`, giving
per-pixel alpha so the page's `border-radius: 18px` shell renders with clean
antialiased corners. `WebView2.DefaultBackgroundColor = Transparent` is required
as well — without it the control paints an opaque sheet over the window.

WinForms was the wrong tool here: its only option is `TransparencyKey`, a binary
colour key with no alpha blending, which produces jagged corners and no shadow.

**Unverified:** the shell uses `backdrop-filter: blur(8px)`. On macOS, WebKit in a
transparent window can sample what is behind the window; Chromium generally
samples only page content, so the blur may read as flat on Windows. If it does,
the options are a more opaque shell background on Windows, or DWM-level blur via
`SetWindowCompositionAttribute`. Test this before tuning anything else visual.

## Fonts

`--tnt-font-main` now lists `"Segoe UI Variable Text", "Segoe UI"` before Arial,
matching the five other stacks in the CSS that already did.

Still open: `"Ivory LL Web"` (used for headers in the keyframes, ease, mass-edit,
and timing-order panels) is not bundled — there is no `@font-face` and no font
file in the repo. It resolves on macOS only because it is installed there. On
Windows the chain falls through `Iowan Old Style` and `Baskerville`, both
Mac-only, and lands on Georgia. Either bundle it via `@font-face` if licensing
allows, or pick a deliberate Windows serif so it is a decision rather than an
accident.
