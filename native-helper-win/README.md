# AE FX Quick Controls — Windows helper

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
set TNT_EXTENSION_ROOT=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\AE FX
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

The hotkeys only fire while After Effects (or the overlay itself) is the
foreground app. Everywhere else the keystroke passes straight through, so
Ctrl+C / Ctrl+X / Ctrl+S keep working normally in every other application.

That gating is why this uses a `WH_KEYBOARD_LL` hook rather than
`RegisterHotKey`: `RegisterHotKey` claims its combinations system-wide with no
way to inspect what is frontmost first. The hook checks the foreground window's
owning process (`AfterFX`) and only swallows the key when it matches.

`Ctrl+Space` toggles: it hides the overlay if the overlay already has focus.

## Placement and dismissal

The overlay is positioned over the After Effects window — centred horizontally,
over the timeline at 21% of the window height up from the bottom edge, clamped
into that monitor's work area. This mirrors `afterEffectsOverlayFrame(for:)` in
the macOS helper, and re-runs on every page-driven resize.

A 200ms timer hides the overlay as soon as something other than AE or the
overlay takes the foreground, or if AE quits while it is up — the equivalent of
the macOS `startApplicationVisibilityMonitor`. With AE not running at all, the
hotkey does nothing.

A named mutex (`Local\AEFXQuickControls`) keeps a second instance from starting;
two processes fighting over one keyboard hook is worse than the second refusing
to run.

## Diagnostics

The helper has no window and no console, so a hotkey that does nothing gives you
nothing to read. Set `TNT_HELPER_LOG=1` before launching and it writes a line per
decision to `%USERPROFILE%\.ae-fx-quick-controls\helper.log`:

```
$env:TNT_HELPER_LOG = "1"
.in\Release
et8.0-windows\AEFXQuickControls.exe
```

It logs hook installation, WebView2 startup, every chord it sees (including ones
it ignores because AE is not frontmost), and the size/position of each show.

Two more debug switches:

- `TNT_HELPER_DEBUG_PORT=9333` opens a DevTools endpoint on that port. The overlay
  has no menu and cannot be right-clicked into an inspector, so this is the only
  way to inspect or drive the page. Connect over CDP and call
  `window.__tntQuickPanelOpenControl("anchor")` to open a panel without touching
  the keyboard.
- `TNT_HELPER_NOHIDE=1` stops the overlay auto-hiding when AE loses the
  foreground, and shows it at startup. Without it the overlay vanishes the moment
  another process takes focus, which makes it impossible to inspect from outside.
- `TNT_HELPER_BLUR=1` re-enables the DWM blur-behind attempt. See below.

Two initialisation traps are worth knowing about, because both present as "the
hotkey does nothing" rather than as an error:

- `EnsureCoreWebView2Async` throws if called before `Application.Run` starts the
  dispatcher loop, so the init is queued onto the loop rather than run from
  `Initialize()`.
- The WPF WebView2 control does not start initialising until it is loaded into a
  window that has been *shown*. On a never-shown window that task simply never
  completes. The helper shows the window off-screen and unfocused once at
  startup to get past this, then hides it.

Either failure leaves a transparent window with nothing painted in it - the
hotkey "works", and you see nothing.

## Sizing: never move the HWND directly

The overlay resizes itself constantly - the page measures its own content and
calls back with a new size. That resize **must** go through WPF's
`Left`/`Top`/`Width`/`Height`, never `SetWindowPos`.

Moving the HWND directly resizes the window without WPF running a layout pass,
and the hosted WebView2 takes its viewport from that layout. The window shrinks
while the page keeps laying out at the old size. Because the shell is
`position: fixed; inset: 8px`, it then stretches to a viewport far larger than
the window, and the window shows only its top-left corner - which reads as a
large flat rectangle with the content cropped out of sight. It looks like a CSS
bug and is not one.

## Hit shapes: how the overlay is clickable at all

`AllowsTransparency` makes this a per-pixel-alpha layered window, and Windows
hit-tests those against the alpha channel: any pixel with alpha 0 passes the click
through to whatever is underneath. WPF builds that mask from WPF-drawn content
only, and WebView2 renders through its own composition visual rather than into
WPF's bitmap. So nothing the page paints contributes to the mask, and a window with
a transparent background is perfectly visible and *entirely click-through*.

Filling the whole window with a near-transparent colour fixes the clicks, and was
the first attempt - but it is not free. Even at alpha 1/255 the fill visibly tints
the entire window rectangle: scanning across the window edge over a backdrop
reading 243, the window interior read 227-232, about 5% darker. That shows up as a
faint rectangle around floating layouts like the anchor panel, where the page
itself paints nothing outside its two cards.

What is used instead: the page reports the rectangles it actually paints
(`window.__tntQuickPanelHitRects` in `src/js/100-panels-shortcuts-bootstrap.js`)
and the helper draws matching WPF rectangles on a canvas *behind* the WebView
(`UpdateHitShapesAsync`). They supply the alpha the hit test needs, they sit under
the page's own opaque surfaces so they are never seen, and the gaps stay
transparent - so clicks between the anchor cards fall through to After Effects
instead of being swallowed.

Verified with `WindowFromPoint`, which respects exactly this hit-testing:

```
ANCHOR card centre  -> msedgewebview2      (the overlay)
ALIGN  card centre  -> msedgewebview2
gap between cards   -> the app underneath
top margin          -> the app underneath
```

**When adding a new subpanel surface, add its selector to the list in
`__tntQuickPanelHitRects`** or it will render but not accept clicks.

`TNT_HELPER_HIT_ALPHA=1` restores the old whole-window fill for A/B comparison.

macOS has none of this: `WKWebView` is a real view in the window, so the panel
hit-tests itself.


## Blur

`backdrop-filter` cannot work in the overlay on Windows. WebKit, in a transparent
`NSWindow`, samples the desktop behind the window, so the macOS helper gets a real
blur of the After Effects timeline. Chromium samples page content only; with
nothing behind, the filtered layer resolves to flat black. That is where the black
rectangle behind the ANCHOR/ALIGN cards came from - the `v126` rule's
`backdrop-filter` + `translateZ(0)` + `isolation: isolate` on `.anchor-dialog`.
Clearing the filter alone is not enough; the isolated composited layer is what
paints, so the transform and isolation have to go with it. See the `.native-win`
block in `src/css/95-quick-panel.css`.

A DWM blur-behind (`SetWindowCompositionAttribute`, `ACCENT_ENABLE_ACRYLICBLURBEHIND`)
is implemented but **off by default, because it does not work either**: on a
layered window DWM paints the accent tint as a solid sheet instead of sampling,
filling the whole window with opaque black. The call returns success regardless,
so the return value proves nothing - look at it.

Making blur work means dropping `AllowsTransparency` and letting DWM own the
window: `DWMWA_WINDOW_CORNER_PREFERENCE` for the corners and
`DWMWA_SYSTEMBACKDROP_TYPE` for acrylic/mica. The trade-off is Windows' corner
radius instead of the page's 18px, and a rectangular window - which the anchor
layout, two floating cards on transparency, is not designed for.

## Known gaps

- Builds and runs on Windows 11 with the .NET 8 SDK. The hotkey path, the AE
  window placement, and the loopback bridge have each been exercised once; the
  page's own behaviour inside the overlay has not been reviewed in depth.
- Opening the panel when it is closed in AE is still not possible on Windows
  (see above) — the helper requires the panel to already be open.

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
