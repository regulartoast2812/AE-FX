# TNK v.3 — CEP Extension for After Effects

## Install

1. Copy the `TNK_v3` folder to your CEP extensions directory:

   **Mac:**
   ```
   /Library/Application Support/Adobe/CEP/extensions/TNK_v3
   ```

   **Windows:**
   ```
   C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\TNK_v3
   ```

2. Enable unsigned extensions (one-time setup):

   **Mac — run in Terminal:**
   ```bash
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   ```
   *(change 11 to match your CEP version — AE 2024 = CEP 11)*

   **Windows — add registry key:**
   ```
   HKEY_CURRENT_USER\Software\Adobe\CSXS.11
   Add string: PlayerDebugMode = 1
   ```

3. Restart After Effects

4. Open via **Window > Extensions > TNK v.3**

---

## Assign a keyboard shortcut to open it

**Option A — KBar (recommended):**
- In KBar, add a new button → "Run Script File"
- Point it to a small launcher `.jsx`:
  ```jsx
  var cs = new CSInterface();
  cs.requestOpenExtension("com.tnk.v3.panel", "");
  ```
- Assign your keyboard shortcut in KBar settings

**Option B — ft-toolbar:**
Same approach, add as a script button.

---

## Hotkeys (while panel is focused)

| Key | Action |
|-----|--------|
| E   | Ease In/Out (uses global ease values) |
| L   | Linear keyframes |
| O   | Overshoot expression |
| W   | Wiggle expression |
| R   | Reverse keyframes |
| S   | Solo selected layers |
| P   | Parent selected to new null |
| G   | Apply Glow effect |
| M   | Add marker at playhead |
| ?   | Show hotkey overlay |
| ESC | Close panel |

---

## Auto-close
Toggle "auto-close" in the bottom bar. When ON, the panel closes ~400ms after any action fires — giving you time to see the toast confirmation before it dismisses.
