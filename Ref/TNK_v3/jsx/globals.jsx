// TNK v.3 — globals.jsx
// Shared helpers available to all #included files.

// ── UNDO HELPERS ─────────────────────────────────────────────────────────────
// _undo(label, fn) — wraps any operation in a single named undo group.
// The group is ALWAYS closed even if fn() throws.
// Returns whatever fn() returns, or an error string on failure.
//
// Usage:
//   function myTool() {
//     return _undo("TNK: My Tool", function() {
//       // ... do stuff ...
//       return "Done";
//     });
//   }
function _undo(label, fn) {
  app.beginUndoGroup(label);
  var result;
  try {
    result = fn();
  } catch(e) {
    result = "Error: " + e.toString();
  } finally {
    app.endUndoGroup();
  }
  return result;
}

// ── GLOBALS ──────────────────────────────────────────────────────────────────
var comp = app.project.activeItem;

function getComp() {
  comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) return null;
  return comp;
}

function getSelectedLayers() {
  var c = getComp();
  if (!c) return [];
  return c.selectedLayers;
}
