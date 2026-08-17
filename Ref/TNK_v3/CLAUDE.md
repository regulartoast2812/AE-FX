# TNK — Claude Instructions

## After Effects Scripting Docs
Before writing any AE scripting code, always consult the local reference docs in `Guide Docs/`.

Key references:
- `Guide Docs/index.md` — start here for overview
- `Guide Docs/general/application.md` — app-level scripting
- `Guide Docs/layer/` — all layer types
- `Guide Docs/property/` — properties and keyframes
- `Guide Docs/item/` — comp, footage, folder items
- `Guide Docs/text/` — text documents and ranges
- `Guide Docs/other/shape.md` — shape scripting
- `Guide Docs/matchnames/` — effect/property match names

## Project
- Script: `TNK v3.jsx` (ScriptUI dockable panel)
- Architecture: modular via `#include`, one namespace object per function file
- Categories: Motion, Effects, Layers, Text, Shapes, Keyframes, Color, Camera/3D, Comp/Project, Expressions, Render, Align/Transform
- Button pattern: each button supports normal / Ctrl / Shift / Alt variants using `ScriptUI.environment.keyboardState`

## Global Settings — ALWAYS read from app.settings
Any function that involves timing, easing, scale, or pixel offset MUST read these values from `app.settings` at runtime — never hardcode them.

| Variable   | Setting key              | Default | Purpose                        |
|------------|--------------------------|---------|--------------------------------|
| `inTime`   | `myScript` / `inValue`   | `1`     | Animation in duration (frames) |
| `outTime`  | `myScript` / `outValue`  | `1`     | Animation out duration (frames)|
| `SinTime`  | `myScript` / `SinValue`  | `1`     | Scale in value                 |
| `SoutTime` | `myScript` / `SoutValue` | `1`     | Scale out value                |
| `ease1`    | `myScript` / `easeInValue`  | `75` | Ease in influence (%)          |
| `ease2`    | `myScript` / `easeOutValue` | `75` | Ease out influence (%)         |
| `pixels`   | `myScript` / `pixelsValue`  | `100`| Position offset in pixels      |
| `wFreq`    | `myScript` / `wFreqValue`  | `3`   | Wiggle frequency (Hz)          |
| `wAmp`     | `myScript` / `wAmpValue`   | `20`  | Wiggle amplitude (pixels)      |
| `textIn`   | `myScript` / `textInValue` | `0.5` | Text animation in duration     |
| `textOut`  | `myScript` / `textOutValue`| `0.5` | Text animation out duration    |

Read pattern — use this at the top of every function that needs these values:
```javascript
var inTime  = Number(app.settings.haveSetting("myScript", "inValue")   ? app.settings.getSetting("myScript", "inValue")   : "1");
var outTime = Number(app.settings.haveSetting("myScript", "outValue")  ? app.settings.getSetting("myScript", "outValue")  : "1");
var SinTime = Number(app.settings.haveSetting("myScript", "SinValue")  ? app.settings.getSetting("myScript", "SinValue")  : "1");
var SoutTime= Number(app.settings.haveSetting("myScript", "SoutValue") ? app.settings.getSetting("myScript", "SoutValue") : "1");
var ease1   = Number(app.settings.haveSetting("myScript", "easeInValue")  ? app.settings.getSetting("myScript", "easeInValue")  : "75");
var ease2   = Number(app.settings.haveSetting("myScript", "easeOutValue") ? app.settings.getSetting("myScript", "easeOutValue") : "75");
var pixels  = Number(app.settings.haveSetting("myScript", "pixelsValue")  ? app.settings.getSetting("myScript", "pixelsValue")  : "100");
var wFreq   = Number(app.settings.haveSetting("myScript", "wFreqValue")  ? app.settings.getSetting("myScript", "wFreqValue")  : "3");
var wAmp    = Number(app.settings.haveSetting("myScript", "wAmpValue")   ? app.settings.getSetting("myScript", "wAmpValue")   : "20");
var textIn  = Number(app.settings.haveSetting("myScript", "textInValue") ? app.settings.getSetting("myScript", "textInValue") : "0.5");
var textOut = Number(app.settings.haveSetting("myScript", "textOutValue")? app.settings.getSetting("myScript", "textOutValue"): "0.5");
```

Easing is applied via `KeyframeEase`:
```javascript
var easeIn  = new KeyframeEase(0, ease1);   // 0 = spread, ease1 = influence %
var easeOut = new KeyframeEase(0, ease2);
prop.setTemporalEaseAtKey(keyIndex, [easeIn], [easeOut]);
```

## Function Parameters Checklist
When creating any new function/script, always consider and support:

- **inpoint/outpoint** — Use `inTime`/`outTime` for animation durations at layer in/out
- **easing** — Apply `ease1`/`ease2` (easeIn/easeOut) to all keyframes via `KeyframeEase`
- **pixel value** — Use `pixels` for position offsets, distances, sizes
- **wiggle params** — Use `wFreq`/`wAmp` for wiggle expressions
- **text timing** — Use `textIn`/`textOut` for text-specific animations
- **layer selection** — Always operate on `comp.selectedLayers` or `layer.selectedProperties`
- **undo groups** — Wrap all changes in `app.beginUndoGroup()` / `app.endUndoGroup()`
- **error handling** — Use try/catch when accessing properties that may not exist
