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
- No transparent/borderless chrome polish — WinForms shows a plain rectangle.
- No single-instance guard (macOS has `terminateDuplicateQuickControlsInstances`).
- Not built or run on Windows yet. The macOS half of the bridge is tested.
