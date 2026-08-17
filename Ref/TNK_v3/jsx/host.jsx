// TNK v.3 — host.jsx


// ── globals.jsx
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


// ── fn/applyEaseInOut.jsx
function applyEaseInOut(params) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  var ei = params ? params.easeIn  : 75;
  var eo = params ? params.easeOut : 75;
  return _undo("TNK: Ease In/Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canVaryOverTime) continue;
        for (var k = 1; k <= prop.numKeys; k++) {
          try {
            var eIn  = new KeyframeEase(0, ei);
            var eOut = new KeyframeEase(0, eo);
            prop.setTemporalEaseAtKey(k, [eIn], [eOut]);
          } catch(e) {}
        }
      }
    }
    return "Ease applied";
  });
}


// ── fn/applyLinear.jsx
function applyLinear() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Linear", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canVaryOverTime) continue;
        for (var k = 1; k <= prop.numKeys; k++) {
          try {
            var e = new KeyframeEase(0, 0);
            prop.setTemporalEaseAtKey(k, [e], [e]);
          } catch(e2) {}
        }
      }
    }
    return "Linear applied";
  });
}


// ── fn/applyOvershoot.jsx
// Overshoot Binary - Pseudo Effects
var OvershootEffectData = {
    name: "Overshoot",
    matchName: "Pseudo/overshoot",
    binary: "RIFX\x00\x00\x13\u00C0FaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00\x13\u009Cbescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\nOvershoot\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x12\x1Esspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x07|parTparn\x00\x00\x00\x04\x00\x00\x00\ttdmn\x00\x00\x00(Pseudo/overshoot-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Enable\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nOvershooting\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00A\u00C6\u00F5\u00C2\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Presets\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03\x00\x03\x00\x03\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00.Fastest|Faster|Fast|Normal|Slow|Slower|Custom\x00tdmn\x00\x00\x00(Pseudo/overshoot-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rCustom Values\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nAmp\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00@\u00A0\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nFreq\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A \x00\x00\x00\x00\x00\x00A \x00\x00@\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nDecay\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00A\u00A0\x00\x00@\u00A0\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\nVtdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\nOvershoot\x00tdmn\x00\x00\x00(Pseudo/overshoot-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/overshoot-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Enable\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\rOvershooting\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@8\u00DE\u00B8Q\u00EB\u0085\x1F\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\bPresets\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\b\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ECustom Values\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x04Amp\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F2tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x05Freq\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@$\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F2tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x06Decay\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@4\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/overshoot-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E2tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\nOvershoot\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{\"controlName\":\"Overshoot\",\"matchname\":\"Pseudo/overshoot\",\"controlArray\":[{\"name\":\"Enable\",\"type\":\"checkbox\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"default\":true,\"keyframes\":true,\"id\":1030665364,\"hold\":true,\"label\":\"\",\"error\":[\n\n]},{\"name\":\"Overshooting\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":1063186634,\"hold\":false,\"default\":24.87,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":false,\"pixel\":false,\"open\":true,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Presets\",\"type\":\"popup\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":4615238385,\"hold\":false,\"default\":3,\"content\":\"Fastest|Faster|Fast|Normal|Slow|Slower|Custom\",\"error\":[\n\n]},{\"name\":\"Custom Values\",\"type\":\"group\",\"canHaveKeyframes\":false,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":false,\"id\":5768039451,\"hold\":false,\"children\":[\n\n],\"open\":true,\"error\":[\n\n]},{\"name\":\"Amp\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":9067848699,\"hold\":false,\"default\":5,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Freq\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2300752575,\"hold\":false,\"default\":2,\"sliderMax\":10,\"sliderMin\":0,\"validMax\":10,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Decay\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":1973646005,\"hold\":false,\"default\":5,\"sliderMax\":20,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"EndGroup\",\"type\":\"endgroup\",\"canBeInvisible\":false,\"canHaveKeyframes\":false,\"keyframes\":false,\"hold\":false,\"id\":3424178880,\"groupId\":0,\"error\":[\n\n]}],\"version\":3}",
};

function applyOvershoot() {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedProps = comp.selectedProperties;
  if (!selectedProps || selectedProps.length === 0) return "No properties selected";

  return _undo("TNK: Apply Overshoot", function() {

    // ── Step 1: Inject expression onto all selected properties ────────────
    for (var i = 0; i < selectedProps.length; i++) {
      var prop = selectedProps[i];
      var newName = getOvershootName(prop);
      var expr =
        "try {\n" +
        "fx = effect(\"" + newName + "\");\n" +
        "o = fx(\"Pseudo/overshoot-0002\") / 100;\n" +
        "switch (fx(\"Pseudo/overshoot-0003\").value) {\n" +
        "case 1: amp = 1.5 + 1.5 * o; freq = 5; decay = 5; break;\n" +
        "case 2: amp = 2.2 + 2.2 * o; freq = 4; decay = 4; break;\n" +
        "case 3: amp = 3 + 3 * o; freq = 3; decay = 3; break;\n" +
        "case 4: amp = 4 + 4 * o; freq = 2; decay = 2; break;\n" +
        "case 5: amp = 5 + 5 * o; freq = 1.5; decay = 1.5; break;\n" +
        "case 6: amp = 6 + 6 * o; freq = 1.2; decay = 1; break;\n" +
        "default:\n" +
        "  amp = fx(\"Pseudo/overshoot-0005\") + 4 * o;\n" +
        "  freq = fx(\"Pseudo/overshoot-0006\");\n" +
        "  decay = fx(\"Pseudo/overshoot-0007\");\n" +
        "  break;\n" +
        "}\n" +
        "if (fx(\"Pseudo/overshoot-0001\") == 0) {\n" +
        "  value;\n" +
        "} else {\n" +
        "  n = 0;\n" +
        "  if (numKeys > 0) {\n" +
        "    n = nearestKey(time).index;\n" +
        "    if (key(n).time > time) n--;\n" +
        "  }\n" +
        "  t = (n === 0) ? 0 : time - key(n).time;\n" +
        "  if (n > 0) {\n" +
        "    v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
        "    value + v / 100 * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t) * o;\n" +
        "  } else {\n" +
        "    value;\n" +
        "  }\n" +
        "}\n" +
        "} catch (err) { value; }";
      try { prop.expression = expr; prop.expressionEnabled = true; } catch(e) {}
    }

    // ── Step 2: Add pseudo effect to layers that now have overshoot expressions ──
    var layers = comp.selectedLayers;
    var previewData = [];
    for (var l = 0; l < layers.length; l++) {
      var layer = layers[l];
      var layerProps = layer.selectedProperties;
      for (var p = 0; p < layerProps.length; p++) {
        var lp = layerProps[p];
        if (!lp || lp.matchName === "ADBE Effect Parade") continue;
        if (lp.parentProperty && lp.parentProperty.matchName === "ADBE Effect Parade") {
          if (!lp.canSetExpression) continue;
        }
        if (lp.canSetExpression && lp.expressionEnabled) {
          var exprCheck = lp.expression;
          if (exprCheck && exprCheck.toLowerCase().indexOf("overshoot") !== -1) {
            var finalName = getOvershootName(lp);
            if (!hasOvershootWithName(layer, finalName)) {
              previewData.push({ layer: layer, name: finalName });
            }
          }
        }
      }
    }
    for (var i = 0; i < previewData.length; i++) {
      var fx = applyPseudoEffect(OvershootEffectData, previewData[i].layer.property("ADBE Effect Parade"));
      if (fx) fx.name = previewData[i].name;
    }

    return "Overshoot applied to " + selectedProps.length + " propert" + (selectedProps.length !== 1 ? "ies" : "y");
  });
}

// ── Naming helper ─────────────────────────────────────────────────────────────
function getOvershootName(prop) {
  var contextName = null;
  if (prop.propertyDepth > 1) {
    var parentGroup = prop.propertyGroup(prop.propertyDepth - 1);
    if (parentGroup && parentGroup.parentProperty &&
        parentGroup.parentProperty.matchName === "ADBE Effect Parade") {
      contextName = parentGroup.name;
    } else if (parentGroup && parentGroup.matchName === "ADBE Transform Group") {
      contextName = null;
    } else if (parentGroup) {
      contextName = parentGroup.name;
    }
  }
  return contextName
    ? "Overshoot - " + contextName + " - " + prop.name
    : "Overshoot - " + prop.name;
}

// ── Support functions ─────────────────────────────────────────────────────────
function applyPseudoEffect(data, effectsProp) {
  // Always force-reload the FFX (don't rely on canAddProperty cache — AE may
  // have a stale/broken version registered from a prior session).
  try {
    var ffxFile = new File(Folder.desktop.fsName + "/" + data.name + ".ffx");
    ffxFile.encoding = "BINARY";
    ffxFile.open("w");
    ffxFile.write(data.binary);
    ffxFile.close();
    var tempComp  = app.project.items.addComp("tempComp", 100, 100, 1, 1, 24);
    var tempLayer = tempComp.layers.addShape();
    tempLayer.applyPreset(ffxFile);
    tempComp.remove();
  } catch(e) {}
  try { return effectsProp.addProperty(data.matchName); } catch(e) { return null; }
}

function hasOvershootWithName(layer, finalName) {
  var effects = layer.property("ADBE Effect Parade");
  for (var i = 1; i <= effects.numProperties; i++) {
    if (effects.property(i).name === finalName) return true;
  }
  return false;
}


// ── fn/applyWiggle.jsx
function applyWiggle(params) {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  var freq = params ? (params.wFreq || 3)  : 3;
  var amp  = params ? (params.wAmp  || 20) : 20;
  return _undo("TNK: Wiggle", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (!prop.canSetExpression) continue;
        try { prop.expression = "wiggle(" + freq + "," + amp + ")"; } catch(e) {}
      }
    }
    return "Wiggle applied";
  });
}


// ── fn/clearExpressions.jsx
function clearExpressions() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Clear Expressions", function() {
    function clear(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      for (var i = 1; i <= prop.numProperties; i++) { try { clear(prop.property(i)); } catch(e) {} }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clear(layers[i].property(j)); } catch(e) {} }
    }
    return "Expressions cleared";
  });
}


// ── fn/animInDir.jsx
function animInDir(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var pixels = params ? (params.pixels || 100) : 100;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Animation In (" + dir + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - In"); if (ex) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - In";
      var cp = fx.property("Position").value;
      var sp;
      if      (dir === "up")    sp = [cp[0], cp[1] + pixels];
      else if (dir === "down")  sp = [cp[0], cp[1] - pixels];
      else if (dir === "left")  sp = [cp[0] + pixels, cp[1]];
      else                      sp = [cp[0] - pixels, cp[1]];
      var pos = fx.property("Position");
      pos.setValueAtTime(layer.inPoint, sp);
      pos.setValueAtTime(layer.inPoint + inTime, cp);
      pos.setTemporalEaseAtKey(1, [eIn], [eOut]);
      pos.setTemporalEaseAtKey(2, [eIn], [eOut]);
      var op = fx.property("Opacity");
      if (op) {
        op.setValueAtTime(layer.inPoint, 0);
        op.setValueAtTime(layer.inPoint + inTime, 100);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim in (" + dir + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animOutDir.jsx
function animOutDir(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var pixels  = params ? (params.pixels  || 100): 100;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Animation Out (" + dir + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - Out"); if (ex) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - Out";
      var cp = fx.property("Position").value;
      var ep;
      if      (dir === "up")    ep = [cp[0], cp[1] - pixels];
      else if (dir === "down")  ep = [cp[0], cp[1] + pixels];
      else if (dir === "left")  ep = [cp[0] - pixels, cp[1]];
      else                      ep = [cp[0] + pixels, cp[1]];
      var pos = fx.property("Position");
      pos.setValueAtTime(layer.outPoint - outTime, cp);
      pos.setValueAtTime(layer.outPoint, ep);
      try { pos.setTemporalEaseAtKey(1, [eIn], [eOut]); pos.setTemporalEaseAtKey(2, [eIn], [eOut]); } catch(e) {}
      var op = fx.property("Opacity");
      if (op) {
        var cur = op.value;
        op.setValueAtTime(layer.outPoint - outTime, cur);
        op.setValueAtTime(layer.outPoint, 0);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim out (" + dir + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animInOut.jsx
function animInOut(params, dir) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var pixels  = params ? (params.pixels  || 100): 100;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  var d = dir || "up";
  return _undo("TNK: Animation In+Out (" + d + ")", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // IN
      try { var exi = layer.effect("Animation - In"); if (exi) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fxIn = layer.Effects.addProperty("ADBE Geometry2"); fxIn.name = "Animation - In";
      var cp = fxIn.property("Position").value;
      var sp;
      if      (d === "up")    sp = [cp[0], cp[1] + pixels];
      else if (d === "down")  sp = [cp[0], cp[1] - pixels];
      else if (d === "left")  sp = [cp[0] + pixels, cp[1]];
      else                    sp = [cp[0] - pixels, cp[1]];
      var posIn = fxIn.property("Position");
      posIn.setValueAtTime(layer.inPoint, sp);
      posIn.setValueAtTime(layer.inPoint + inTime, cp);
      posIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
      posIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      var opIn = fxIn.property("Opacity");
      if (opIn) {
        opIn.setValueAtTime(layer.inPoint, 0);
        opIn.setValueAtTime(layer.inPoint + inTime, 100);
        opIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
      // OUT
      try { var exo = layer.effect("Animation - Out"); if (exo) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fxOut = layer.Effects.addProperty("ADBE Geometry2"); fxOut.name = "Animation - Out";
      var ep;
      if      (d === "up")    ep = [cp[0], cp[1] - pixels];
      else if (d === "down")  ep = [cp[0], cp[1] + pixels];
      else if (d === "left")  ep = [cp[0] - pixels, cp[1]];
      else                    ep = [cp[0] + pixels, cp[1]];
      var posOut = fxOut.property("Position");
      posOut.setValueAtTime(layer.outPoint - outTime, cp);
      posOut.setValueAtTime(layer.outPoint, ep);
      try { posOut.setTemporalEaseAtKey(1, [eIn], [eOut]); posOut.setTemporalEaseAtKey(2, [eIn], [eOut]); } catch(e) {}
      var opOut = fxOut.property("Opacity");
      if (opOut) {
        opOut.setValueAtTime(layer.outPoint - outTime, 100);
        opOut.setValueAtTime(layer.outPoint, 0);
        opOut.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opOut.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Anim in+out (" + d + ") on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animInOutDir.jsx
function animInOutDir(params, dir) { return animInOut(params, dir); }


// ── fn/animScaleIn.jsx
// Scale IN — Slider Control + expression on Scale. 0→100 at inPoint.
function animScaleIn(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Scale In", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var SLIDER_NAME = "Scale Animation";
      var sliderFx = layer.effect(SLIDER_NAME);
      if (sliderFx == null) {
        sliderFx = layer.Effects.addProperty("ADBE Slider Control");
        sliderFx.name = SLIDER_NAME;
      }
      var slider = sliderFx.property("Slider");
      slider.setValueAtTime(layer.inPoint,           0);
      slider.setValueAtTime(layer.inPoint + inTime, 100);
      var k1 = slider.nearestKeyIndex(layer.inPoint);
      var k2 = slider.nearestKeyIndex(layer.inPoint + inTime);
      slider.setTemporalEaseAtKey(k1, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k2, [eIn], [eOut]);
      layer.property("Scale").expression =
        'value * effect("' + SLIDER_NAME + '")("Slider") / 100';
    }
    return "Scale in on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animScaleOut.jsx
// Scale OUT — Slider Control + expression on Scale. 100→0 at outPoint.
function animScaleOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Scale Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var SLIDER_NAME = "Scale Animation";
      var sliderFx = layer.effect(SLIDER_NAME);
      if (sliderFx == null) {
        sliderFx = layer.Effects.addProperty("ADBE Slider Control");
        sliderFx.name = SLIDER_NAME;
      }
      var slider = sliderFx.property("Slider");
      slider.setValueAtTime(layer.outPoint - outTime, 100);
      slider.setValueAtTime(layer.outPoint,             0);
      var k3 = slider.nearestKeyIndex(layer.outPoint - outTime);
      var k4 = slider.nearestKeyIndex(layer.outPoint);
      slider.setTemporalEaseAtKey(k3, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k4, [eIn], [eOut]);
      layer.property("Scale").expression =
        'value * effect("' + SLIDER_NAME + '")("Slider") / 100';
    }
    return "Scale out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animScaleInOut.jsx
// Scale IN+OUT — Slider 0→100 at inPoint, 100→0 at outPoint. Clears existing keys first.
function animScaleInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Scale In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var SLIDER_NAME = "Scale Animation";
      var sliderFx = layer.effect(SLIDER_NAME);
      if (sliderFx == null) {
        sliderFx = layer.Effects.addProperty("ADBE Slider Control");
        sliderFx.name = SLIDER_NAME;
      }
      var slider = sliderFx.property("Slider");
      // Clear existing keys
      while (slider.numKeys > 0) slider.removeKey(1);
      slider.setValueAtTime(layer.inPoint,              0);
      slider.setValueAtTime(layer.inPoint  + inTime,  100);
      slider.setValueAtTime(layer.outPoint - outTime, 100);
      slider.setValueAtTime(layer.outPoint,             0);
      var k1 = slider.nearestKeyIndex(layer.inPoint);
      var k2 = slider.nearestKeyIndex(layer.inPoint  + inTime);
      var k3 = slider.nearestKeyIndex(layer.outPoint - outTime);
      var k4 = slider.nearestKeyIndex(layer.outPoint);
      slider.setTemporalEaseAtKey(k1, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k2, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k3, [eIn], [eOut]);
      slider.setTemporalEaseAtKey(k4, [eIn], [eOut]);
      layer.property("Scale").expression =
        'value * effect("' + SLIDER_NAME + '")("Slider") / 100';
    }
    return "Scale in+out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animOpacityIn.jsx
// Opacity IN — ADBE Geometry2 "Animation - In", Opacity 0→100 at inPoint (75% of inTime).
function animOpacityIn(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade In", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - In"); if (ex) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - In";
      var op = fx.property("Opacity");
      if (op) {
        op.setValueAtTime(layer.inPoint,                   0);
        op.setValueAtTime(layer.inPoint + inTime * 0.75, 100);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade in on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animOpacityOut.jsx
// Opacity OUT — ADBE Geometry2 "Animation - Out", Opacity current→0 at outPoint (75% of outTime).
function animOpacityOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      try { var ex = layer.effect("Animation - Out"); if (ex) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fx = layer.Effects.addProperty("ADBE Geometry2"); fx.name = "Animation - Out";
      var op = fx.property("Opacity");
      if (op) {
        var cur = op.value;
        op.setValueAtTime(layer.outPoint - outTime * 0.75, cur);
        op.setValueAtTime(layer.outPoint,                    0);
        op.setTemporalEaseAtKey(1, [eIn], [eOut]);
        op.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/animOpacityInOut.jsx
// Opacity IN+OUT — ADBE Geometry2 on both ends, 0→100 in, current→0 out.
function animOpacityInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Fade In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      // IN
      try { var exi = layer.effect("Animation - In"); if (exi) layer.Effects.property("Animation - In").remove(); } catch(e) {}
      var fxIn = layer.Effects.addProperty("ADBE Geometry2"); fxIn.name = "Animation - In";
      var opIn = fxIn.property("Opacity");
      if (opIn) {
        opIn.setValueAtTime(layer.inPoint,                   0);
        opIn.setValueAtTime(layer.inPoint + inTime * 0.75, 100);
        opIn.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opIn.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
      // OUT
      try { var exo = layer.effect("Animation - Out"); if (exo) layer.Effects.property("Animation - Out").remove(); } catch(e) {}
      var fxOut = layer.Effects.addProperty("ADBE Geometry2"); fxOut.name = "Animation - Out";
      var opOut = fxOut.property("Opacity");
      if (opOut) {
        var cur = opOut.value;
        opOut.setValueAtTime(layer.outPoint - outTime * 0.75, cur);
        opOut.setValueAtTime(layer.outPoint,                    0);
        opOut.setTemporalEaseAtKey(1, [eIn], [eOut]);
        opOut.setTemporalEaseAtKey(2, [eIn], [eOut]);
      }
    }
    return "Fade in+out on " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
  });
}


// ── fn/trimPathsIn.jsx
function trimPathsIn(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime = params ? (params.inTime || 1)   : 1;
  var ei     = params ? (params.easeIn  || 75) : 75;
  var eo     = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Trim Paths In", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trim = contents.property("ADBE Vector Filter - Trim");
      if (!trim) trim = contents.addProperty("ADBE Vector Filter - Trim");
      var end = trim.property("End");
      while (end.numKeys > 0) end.removeKey(1);
      end.setValueAtTime(layer.inPoint, 0);
      end.setValueAtTime(layer.inPoint + inTime, 100);
      end.setTemporalEaseAtKey(1, [eIn], [eOut]);
      end.setTemporalEaseAtKey(2, [eIn], [eOut]);
      count++;
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " — trim in applied";
  });
}


// ── fn/trimPathsOut.jsx
function trimPathsOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Trim Paths Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trim = contents.property("ADBE Vector Filter - Trim");
      if (!trim) trim = contents.addProperty("ADBE Vector Filter - Trim");
      var start = trim.property("Start");
      while (start.numKeys > 0) start.removeKey(1);
      start.setValueAtTime(layer.outPoint - outTime, 0);
      start.setValueAtTime(layer.outPoint, 100);
      start.setTemporalEaseAtKey(1, [eIn], [eOut]);
      start.setTemporalEaseAtKey(2, [eIn], [eOut]);
      count++;
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " — trim out applied";
  });
}


// ── fn/trimPathsInOut.jsx
function trimPathsInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Trim Paths In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trim = contents.property("ADBE Vector Filter - Trim");
      if (!trim) trim = contents.addProperty("ADBE Vector Filter - Trim");
      var end = trim.property("End"), start = trim.property("Start");
      while (end.numKeys   > 0) end.removeKey(1);
      while (start.numKeys > 0) start.removeKey(1);
      end.setValueAtTime(layer.inPoint, 0);          end.setValueAtTime(layer.inPoint + inTime, 100);
      end.setTemporalEaseAtKey(1,[eIn],[eOut]);       end.setTemporalEaseAtKey(2,[eIn],[eOut]);
      start.setValueAtTime(layer.outPoint - outTime, 0); start.setValueAtTime(layer.outPoint, 100);
      start.setTemporalEaseAtKey(1,[eIn],[eOut]);     start.setTemporalEaseAtKey(2,[eIn],[eOut]);
      count++;
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " — trim in+out applied";
  });
}


// ── fn/reverseKeyframes.jsx
function reverseKeyframes() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Reverse Keyframes", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p]; var n = prop.numKeys; if (n < 2) continue;
        var times = [], values = [];
        for (var k = 1; k <= n; k++) { times.push(prop.keyTime(k)); values.push(prop.keyValue(k)); }
        for (var k = 1; k <= n; k++) { try { prop.setValueAtTime(times[k-1], values[n-k]); } catch(e) {} }
      }
    }
    return "Keyframes reversed";
  });
}


// ── fn/cloneKeyframes.jsx
function cloneKeyframes(flip) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var firstKeyTime = null, lastKeyTime = null;
  for (var k = 0; k < layers.length; k++) {
    var props = layers[k].selectedProperties;
    for (var j = 0; j < props.length; j++) {
      var prop = props[j];
      if (prop && prop.canVaryOverTime) {
        var sk = prop.selectedKeys;
        if (sk.length > 0) {
          var ft = prop.keyTime(sk[0]), lt = prop.keyTime(sk[sk.length-1]);
          if (firstKeyTime === null || ft < firstKeyTime) firstKeyTime = ft;
          if (lastKeyTime  === null || lt > lastKeyTime)  lastKeyTime  = lt;
        }
      }
    }
  }
  if (firstKeyTime === null) return "No keyframes selected";
  return _undo("TNK: " + (flip ? "Clone & Flip" : "Clone") + " Keyframes", function() {
    for (var k = 0; k < layers.length; k++) {
      var props = layers[k].selectedProperties;
      for (var j = 0; j < props.length; j++) {
        var prop = props[j];
        if (prop && prop.canVaryOverTime) {
          var sk = prop.selectedKeys.slice();
          if (!sk.length) continue;
          var newKf = [];
          for (var i = 0; i < sk.length; i++) {
            var kt = prop.keyTime(sk[i]), kv = prop.keyValue(sk[i]), lbl = 0;
            try { if (prop.getLabelAtKey) lbl = prop.getLabelAtKey(sk[i]); } catch(e) {}
            var offset = kt - firstKeyTime;
            var newTime = flip ? comp.time + (lastKeyTime - kt) : comp.time + offset;
            newKf.push({ time: newTime, value: kv, label: lbl });
          }
          for (var i = 0; i < newKf.length; i++) {
            prop.setValueAtTime(newKf[i].time, newKf[i].value);
            if (newKf[i].label) {
              try { var ni = prop.nearestKeyIndex(newKf[i].time); if (prop.setLabelAtKey) prop.setLabelAtKey(ni, newKf[i].label); } catch(e) {}
            }
          }
        }
      }
    }
    return flip ? "Keyframes cloned & flipped" : "Keyframes cloned";
  });
}


// ── fn/applyLoopExpression.jsx
function applyLoopExpression(type) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Loop " + type, function() {
    var layers = comp.selectedLayers;
    for (var j = 0; j < layers.length; j++) {
      var props = layers[j].selectedProperties;
      for (var i = 0; i < props.length; i++) {
        if (props[i].canSetExpression)
          try { props[i].expression = "loopOut(type='" + type + "', numKeyframes=0)"; } catch(e) {}
      }
    }
    return "Loop (" + type + ") applied";
  });
}


// ── fn/setContinuousRoving.jsx
function setContinuousRoving(enable) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: " + (enable ? "Enable" : "Disable") + " Continuous Keyframes", function() {
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (prop.propertyType === PropertyType.PROPERTY && prop.canVaryOverTime) {
        for (var j = 1; j <= prop.numKeys; j++) try { prop.setRovingAtKey(j, enable); } catch(e) {}
      }
    }
    return "Continuous roving " + (enable ? "on" : "off");
  });
}


// ── fn/deleteAllKeyframes.jsx
function deleteAllKeyframes() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Keyframes", function() {
    function clearKeys(prop) {
      if (!prop) return;
      if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
        for (var p = 1; p <= prop.numProperties; p++) { try { clearKeys(prop.property(p)); } catch(e) {} }
        return;
      }
      if (prop.numKeys > 0) {
        try {
          var midV = prop.valueAtTime(comp.time, true);
          while (prop.numKeys > 0) prop.removeKey(1);
          try { prop.setValue(midV); } catch(e) {}
        } catch(e) {}
      }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clearKeys(layers[i].property(j)); } catch(e) {} }
    }
    return "All keyframes deleted";
  });
}


// ── fn/alignKeysToPlayhead.jsx
function _alignKeys(anchor, target) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var layerGroups = [];
  for (var li = 0; li < layers.length; li++) {
    var layer = layers[li];
    var allData = [];
    var props = layer.selectedProperties;
    for (var pi = 0; pi < props.length; pi++) {
      var prop = props[pi];
      if (!prop.canVaryOverTime || !prop.numKeys) continue;
      var sk = prop.selectedKeys;
      for (var ki = 0; ki < sk.length; ki++) {
        var k = sk[ki];
        var eIn = null, eOut = null;
        try { eIn = prop.keyInTemporalEase(k); eOut = prop.keyOutTemporalEase(k); } catch(e) {}
        var lbl = 0; try { if (prop.getLabelAtKey) lbl = prop.getLabelAtKey(k); } catch(e) {}
        allData.push({ prop: prop, time: prop.keyTime(k), value: prop.keyValue(k), eIn: eIn, eOut: eOut, label: lbl });
      }
    }
    if (!allData.length) continue;
    allData.sort(function(a, b) { return a.time - b.time; });
    var anchorTime = (anchor === "first") ? allData[0].time : allData[allData.length-1].time;
    var targetTime;
    if      (target === "playhead") targetTime = comp.time;
    else if (target === "layerIn")  targetTime = layer.inPoint;
    else if (target === "layerOut") targetTime = layer.outPoint;
    layerGroups.push({ layer: layer, allData: allData, delta: targetTime - anchorTime });
  }
  if (!layerGroups.length) return "No selected keyframes found";
  return _undo("TNK: Align Keys", function() {
    for (var g = 0; g < layerGroups.length; g++) {
      var lg = layerGroups[g]; var delta = lg.delta;
      var propMap = [];
      for (var i = 0; i < lg.allData.length; i++) {
        var entry = lg.allData[i]; var found = false;
        for (var m = 0; m < propMap.length; m++) { if (propMap[m].prop === entry.prop) { propMap[m].keys.push(entry); found = true; break; } }
        if (!found) propMap.push({ prop: entry.prop, keys: [entry] });
      }
      for (var m = 0; m < propMap.length; m++) {
        var prop = propMap[m].prop; var keys = propMap[m].keys;
        keys.sort(function(a, b) { return b.time - a.time; });
        for (var k = 0; k < keys.length; k++) { try { prop.removeKey(prop.nearestKeyIndex(keys[k].time)); } catch(e) {} }
        keys.sort(function(a, b) { return a.time - b.time; });
        for (var k = 0; k < keys.length; k++) {
          var d = keys[k]; var newTime = d.time + delta;
          try {
            prop.setValueAtTime(newTime, d.value);
            var ni = prop.nearestKeyIndex(newTime);
            if (d.eIn && d.eOut) try { prop.setTemporalEaseAtKey(ni, d.eIn, d.eOut); } catch(e) {}
          } catch(e) {}
        }
      }
    }
    var labels = { first: "first key", last: "last key" };
    var targets = { playhead: "playhead", layerIn: "layer in", layerOut: "layer out" };
    return "Aligned " + labels[anchor] + " to " + targets[target];
  });
}
function alignKeysToPlayhead()      { return _alignKeys("first", "playhead"); }
function alignLastKeyToPlayhead()   { return _alignKeys("last",  "playhead"); }
function alignFirstKeyToLayerIn()   { return _alignKeys("first", "layerIn");  }
function alignLastKeyToLayerOut()   { return _alignKeys("last",  "layerOut"); }


// ── fn/openAnticipation.jsx
function openAnticipation() {
  var win = new Window("palette", "TNK Anticipation", undefined, {resizeable: true});
  var grp = win.add("group");
  grp.orientation = "column";
  grp.alignChildren = ["fill", "top"];

  var presetPanel = grp.add("panel", undefined, "Preset");
  presetPanel.orientation = "row";
  var presetDropdown = presetPanel.add("dropdownlist", undefined, ["Subtle", "Normal", "Strong", "Heavy"]);
  presetDropdown.selection = 1;

  var manualPanel = grp.add("panel", undefined, "Settings");
  manualPanel.orientation = "column";
  manualPanel.alignChildren = ["fill", "top"];

  var rowStrength = manualPanel.add("group"); rowStrength.orientation = "row";
  rowStrength.add("statictext", undefined, "Strength:");
  var strengthInput = rowStrength.add("edittext", undefined, "15");
  strengthInput.characters = 4;
  strengthInput.helpTip = "How far the anticipation dips back and the overshoot goes past the target.\nHigher = more exaggerated motion.";
  var strengthInfo = rowStrength.add("statictext", undefined, "How far it dips / overshoots");
  strengthInfo.graphics.foregroundColor = strengthInfo.graphics.newPen(strengthInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var rowDecay = manualPanel.add("group"); rowDecay.orientation = "row";
  rowDecay.add("statictext", undefined, "Decay:");
  var decayInput = rowDecay.add("edittext", undefined, "0.45");
  decayInput.characters = 5;
  decayInput.helpTip = "How much the motion settles after each bounce. 0 = no decay, 1 = fully settled.\nLower = more energy retained, higher = snappier return.";
  var decayInfo = rowDecay.add("statictext", undefined, "How fast it settles (0\u20131)");
  decayInfo.graphics.foregroundColor = decayInfo.graphics.newPen(decayInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var rowSteps = manualPanel.add("group"); rowSteps.orientation = "row";
  rowSteps.add("statictext", undefined, "Steps A:");
  var stepsAnticInput = rowSteps.add("edittext", undefined, "1");
  stepsAnticInput.characters = 2;
  stepsAnticInput.helpTip = "Anticipation steps: 1 = 1 key, 2 = 2 keys (max 2)";
  rowSteps.add("statictext", undefined, "O:");
  var stepsOverInput = rowSteps.add("edittext", undefined, "2");
  stepsOverInput.characters = 2;
  stepsOverInput.helpTip = "Overshoot steps: 1 = 1 key, 2 = 2 keys (max 2)";
  var stepsInfo = rowSteps.add("statictext", undefined, "A = antic,  O = overshoot");
  stepsInfo.graphics.foregroundColor = stepsInfo.graphics.newPen(stepsInfo.graphics.PenType.SOLID_COLOR, [0.6,0.6,0.6], 1);

  var PRESETS = { "Subtle":[8,0.35], "Normal":[15,0.45], "Strong":[22,0.50], "Heavy":[30,0.55] };
  presetDropdown.onChange = function() {
    var pv = PRESETS[presetDropdown.selection.text];
    strengthInput.text = pv[0];
    decayInput.text    = pv[1];
  };
  strengthInput.onChanging = function() { presetDropdown.selection = -1; };
  decayInput.onChanging    = function() { presetDropdown.selection = -1; };

  var applyPanel = grp.add("panel", undefined, "Apply");
  applyPanel.orientation = "row";
  var btnAnticipation = applyPanel.add("button", undefined, "Anticipation");
  var btnBoth         = applyPanel.add("button", undefined, "Both");
  var btnOvershoot    = applyPanel.add("button", undefined, "Overshoot");
  btnAnticipation.helpTip = "Add anticipation keys only (dip before the move)";
  btnBoth.helpTip         = "Add both anticipation + overshoot keys";
  btnOvershoot.helpTip    = "Add overshoot keys only (bounce past the target)";

  function lerp(v1, v2, t) {
    if (typeof v1 === "number") return v1 + (v2 - v1) * t;
    var r = [];
    for (var i = 0; i < v1.length; i++) r.push(v1[i] + (v2[i] - v1[i]) * t);
    return r;
  }

  function insertKey(prop, t, v, label) {
    prop.setValueAtTime(t, v);
    var idx = prop.nearestKeyIndex(t);
    try {
      prop.setInterpolationTypeAtKey(idx, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      var ee = new KeyframeEase(0, 66.7);
      prop.setTemporalEaseAtKey(idx, [ee], [ee]);
    } catch(e) {}
    try { prop.setLabelAtKey(idx, label); } catch(e) {}
  }

  function valuesEqual(a, b) {
    var tol = 0.001;
    if (typeof a === "number") return Math.abs(a - b) < tol;
    for (var i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > tol) return false;
    return true;
  }

  function detectPairs(comp) {
    var results = [];
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      try {
        if (!p || !p.canSetExpression) continue;
        if (p.numKeys < 2) continue;
        var mn = p.matchName || "";
        if (mn === "ADBE Marker" || mn === "ADBE Time Remap") continue;
        var parentMN = "";
        try { parentMN = p.parentProperty ? (p.parentProperty.matchName || "") : ""; } catch(e) {}
        if (parentMN === "ADBE Position" || parentMN === "ADBE Scale" ||
            parentMN === "ADBE Anchor Point") continue;

        var selKeys = [];
        for (var k = 1; k <= p.numKeys; k++) {
          try { if (p.keySelected(k)) selKeys.push(k); } catch(e) {}
        }
        if (selKeys.length < 2) continue;

        for (var si = 0; si < selKeys.length - 1; si++) {
          var k1 = selKeys[si], k2 = selKeys[si + 1];
          var ta = p.keyTime(k1), tb = p.keyTime(k2);
          if ((tb - ta) < 6 / comp.frameRate) continue;

          var va = p.keyValue(k1), vb = p.keyValue(k2);
          if (valuesEqual(va, vb)) continue;

          results.push({ prop: p, t1: ta, v1: va, t2: tb, v2: vb, addAntic: true, addOver: true });
        }
      } catch(e) {}
    }
    return results;
  }

  function run(mode) {
    var comp = getComp();
    if (!comp) { alert("Please select a composition."); return; }

    var STRENGTH    = parseFloat(strengthInput.text)   || 15;
    var DECAY       = parseFloat(decayInput.text)      || 0.45;
    var STEPS_ANTIC = Math.max(1, parseInt(stepsAnticInput.text) || 1);
    var STEPS_OVER  = Math.max(1, parseInt(stepsOverInput.text)  || 2);

    var pairs = detectPairs(comp);
    if (pairs.length === 0) { alert("No valid keyframe pairs found. Select keyframes with movement between them."); return; }

    _undo("TNK: Anticipation + Overshoot", function() {
      for (var pi = 0; pi < pairs.length; pi++) {
        var work = pairs[pi];
        var doAntic = (mode === 0 || mode === 1) && work.addAntic;
        var doOver  = (mode === 1 || mode === 2) && work.addOver;
        if (!doAntic && !doOver) continue;

        var insertedTimes = [];
        var span  = work.t2 - work.t1;
        var aZone = span * 0.33;
        var oZone = span * 0.33;

        if (doAntic) {
          for (var s = 0; s < STEPS_ANTIC; s++) {
            var frac = (s + 1) / (STEPS_ANTIC + 1);
            var tA   = work.t1 + aZone * frac;
            var amp  = -(STRENGTH / 100) * Math.pow(DECAY, s);
            var vA   = lerp(work.v1, work.v2, amp);
            insertKey(work.prop, tA, vA, 9);
            insertedTimes.push(tA);
          }
        }

        if (doOver) {
          for (var so = 0; so < STEPS_OVER; so++) {
            var fracO = (so + 1) / (STEPS_OVER + 1);
            var tO    = (work.t2 - oZone) + oZone * fracO;
            var sign  = (so % 2 === 0) ? 1 : -1;
            var ampO  = 1 + sign * (STRENGTH / 100) * Math.pow(DECAY, so);
            var vO    = lerp(work.v1, work.v2, ampO);
            insertKey(work.prop, tO, vO, 11);
            insertedTimes.push(tO);
          }
        }

        try {
          for (var ti = 0; ti < insertedTimes.length; ti++) {
            var idx = work.prop.nearestKeyIndex(insertedTimes[ti]);
            work.prop.setSelectedAtKey(idx, true);
          }
        } catch(e) {}
      }
    });
  }

  btnAnticipation.onClick = function() { run(0); };
  btnBoth.onClick         = function() { run(1); };
  btnOvershoot.onClick    = function() { run(2); };

  win.layout.layout(true);
  win.center();
  win.show();
  return "Anticipation open";
}


// ── fn/applyTextAnimMaster.jsx
function applyTextAnimMaster(dir, basedOn, usePos, useOpac, useScale, textIn, textOut, mode) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  // mode: 'in' | 'out' | 'both' — default 'in' for backward compat
  var doIn  = (!mode || mode === 'in'  || mode === 'both');
  var doOut = (mode === 'out' || mode === 'both');

  var dirMap = {
    "up":    [0,  100, 0],
    "down":  [0, -100, 0],
    "left":  [100,  0, 0],
    "right": [-100, 0, 0]
  };
  var posInVal  = dirMap[dir] || [0, 100, 0];
  var posOutVal = [-posInVal[0], -posInVal[1], -posInVal[2]];

  return _undo("TNK: Text Anim Master", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof TextLayer)) continue;

      // Anchor Point Grouping (word grouping)
      var moreOpts = layer.property("Text").property("ADBE Text More Options");
      if (moreOpts) {
        var anchorProp = moreOpts.property("ADBE Text Anchor Point Option");
        if (anchorProp) anchorProp.setValue(2); // Word
      }

      // Remove old animators for modes being (re)applied
      var animators = layer.property("Text").property("Animators");
      for (var ai = animators.numProperties; ai >= 1; ai--) {
        var an = animators.property(ai).name;
        if ((doIn && an === "Animator - In") || (doOut && an === "Animator - Out")) {
          animators.property(ai).remove();
        }
      }

      if (doIn) {
        // ---- ANIMATOR - IN ----
        var animIn = animators.addProperty("ADBE Text Animator");
        animIn.name = "Animator - In";

        var propsIn = animIn.property("ADBE Text Animator Properties");
        if (usePos)   propsIn.addProperty("ADBE Text Position 3D").setValue(posInVal);
        if (useOpac)  propsIn.addProperty("ADBE Text Opacity").setValue(0);
        if (useScale) propsIn.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

        var selIn = animIn.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var advIn = selIn.property("Advanced") || selIn.property("ADBE Text Range Advanced");
        if (advIn) {
          var boIn = advIn.property("Based On") || advIn.property("ADBE Text Range Advanced Based On");
          if (boIn) { try { boIn.setValue(basedOn); } catch(e) {} }
          var shIn = advIn.property("Shape") || advIn.property("ADBE Text Range Advanced Shape");
          if (shIn) shIn.setValue(2); // Ramp Up
          var ehIn = advIn.property("Ease High") || advIn.property("ADBE Text Range Advanced Ease High");
          if (ehIn) ehIn.setValue(-50);
          var elIn = advIn.property("Ease Low") || advIn.property("ADBE Text Range Advanced Ease Low");
          if (elIn) elIn.setValue(100);
        }
        var offsetIn = selIn.property("Offset");
        if (offsetIn) {
          offsetIn.expression =
            "tIN = inPoint + " + (textIn || 0.5) + ";\n" +
            "for (i = 1; i <= thisLayer.marker.numKeys; i++) {\n" +
            "  mk = thisLayer.marker.key(i);\n" +
            "  c = mk.comment;\n" +
            "  isIn = (c == 'IN') || (c && c.length >= 3 && c.substr(c.length-3,3) == '_IN');\n" +
            "  if (isIn) { tIN = mk.time; break; }\n" +
            "}\n" +
            "clamp(linear(time, inPoint, tIN, -100, 100), -100, 100);";
        }
      }

      if (doOut) {
        // ---- ANIMATOR - OUT ----
        var animOut = animators.addProperty("ADBE Text Animator");
        animOut.name = "Animator - Out";

        var propsOut = animOut.property("ADBE Text Animator Properties");
        if (usePos)   propsOut.addProperty("ADBE Text Position 3D").setValue(posOutVal);
        if (useOpac)  propsOut.addProperty("ADBE Text Opacity").setValue(0);
        if (useScale) propsOut.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

        var selOut = animOut.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var advOut = selOut.property("Advanced") || selOut.property("ADBE Text Range Advanced");
        if (advOut) {
          var boOut = advOut.property("Based On") || advOut.property("ADBE Text Range Advanced Based On");
          if (boOut) { try { boOut.setValue(basedOn); } catch(e) {} }
          var shOut = advOut.property("Shape") || advOut.property("ADBE Text Range Advanced Shape");
          if (shOut) shOut.setValue(3); // Ramp Down
          var ehOut = advOut.property("Ease High") || advOut.property("ADBE Text Range Advanced Ease High");
          if (ehOut) ehOut.setValue(-50);
          var elOut = advOut.property("Ease Low") || advOut.property("ADBE Text Range Advanced Ease Low");
          if (elOut) elOut.setValue(100);
        }
        var offsetOut = selOut.property("Offset");
        if (offsetOut) {
          offsetOut.expression =
            "tOUT = outPoint - " + (textOut || 0.5) + ";\n" +
            "for (i = 1; i <= thisLayer.marker.numKeys; i++) {\n" +
            "  mk = thisLayer.marker.key(i);\n" +
            "  c = mk.comment;\n" +
            "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
            "  if (isOut) { tOUT = mk.time; break; }\n" +
            "}\n" +
            "clamp(linear(time, tOUT, outPoint, -100, 100), -100, 100);";
        }
      }

      // Add IN/OUT markers if missing (only for the modes being applied)
      var markerProp = layer.marker;
      var hasIN = false, hasOUT = false;
      for (var mi = 1; mi <= markerProp.numKeys; mi++) {
        var mc = markerProp.keyValue(mi).comment;
        if (mc === "IN")  hasIN  = true;
        if (mc === "OUT") hasOUT = true;
      }
      if (doIn && !hasIN) {
        var keyIN = markerProp.addKey(layer.inPoint + (textIn || 0.5));
        markerProp.setValueAtKey(keyIN, new MarkerValue("IN"));
      }
      if (doOut && !hasOUT) {
        var keyOUT = markerProp.addKey(layer.outPoint - (textOut || 0.5));
        markerProp.setValueAtKey(keyOUT, new MarkerValue("OUT"));
      }
    }
    return "Text Anim " + (mode || 'in') + " applied";
  });
}


// ── fn/applyTextAnimBounce.jsx
function applyTextAnimBounce(dir, basedOn, usePos, useOpac, useScale, textIn, textOut, mode) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  var doIn  = (!mode || mode === 'in'  || mode === 'both');
  var doOut = (mode === 'out' || mode === 'both');

  var dirMap = {
    "up":    [0,  200, 0],
    "down":  [0, -200, 0],
    "left":  [200,  0, 0],
    "right": [-200, 0, 0]
  };
  var posInVal  = dirMap[dir] || [0, 200, 0];
  var posOutVal = [-posInVal[0], -posInVal[1], -posInVal[2]];

  return _undo("TNK: Text Anim Bounce", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof TextLayer)) continue;

      // Sliders: remove old, add fresh
      var fx = layer.Effects;
      for (var oi = fx.numProperties; oi >= 1; oi--) {
        var n = fx.property(oi).name;
        if (n === "Bounce Freq" || n === "Bounce Amplitude" || n === "Bounce Decay") {
          fx.property(oi).remove();
        }
      }
      var sf = fx.addProperty("ADBE Slider Control"); sf.name = "Bounce Freq";      sf.property(1).setValue(2.0);
      var sa = fx.addProperty("ADBE Slider Control"); sa.name = "Bounce Amplitude"; sa.property(1).setValue(150.0);
      var sd = fx.addProperty("ADBE Slider Control"); sd.name = "Bounce Decay";     sd.property(1).setValue(6.0);

      // Anchor Point Grouping
      var moreOpts = layer.property("Text").property("ADBE Text More Options");
      if (moreOpts) {
        var anchorProp = moreOpts.property("ADBE Text Anchor Point Option");
        if (anchorProp) anchorProp.setValue(2); // Word
      }

      // Remove old animators for modes being (re)applied
      var animators = layer.property("Text").property("Animators");
      for (var ai = animators.numProperties; ai >= 1; ai--) {
        var an = animators.property(ai).name;
        if ((doIn  && an === "Animator In") ||
            (doOut && (an === "Animator Out" || an === "Animator Out Opacity"))) {
          animators.property(ai).remove();
        }
      }

      if (doIn) {
      var animIn = animators.addProperty("ADBE Text Animator");
      animIn.name = "Animator In";
      var propsIn = animIn.property("ADBE Text Animator Properties");
      if (usePos)   propsIn.addProperty("ADBE Text Position 3D").setValue(posInVal);
      if (useOpac)  propsIn.addProperty("ADBE Text Opacity").setValue(0);
      if (useScale) propsIn.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

      var exprSelIn = animIn.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
      exprSelIn.name = "Expression Selector 1";
      var boIn = exprSelIn.property("Based On");
      if (boIn) boIn.setValue(basedOn);

      exprSelIn.property("Amount").expression =
        "delay = 0.15;\n" +
        "tIn = inPoint + delay*textTotal;\n" +
        "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
        "  mk = thisLayer.marker.key(i);\n" +
        "  c = mk.comment;\n" +
        "  isIn = (c == 'IN') || (c && c.length >= 3 && c.substr(c.length-3,3) == '_IN');\n" +
        "  if (isIn){ tIn = mk.time; break; }\n" +
        "}\n" +
        "delayFromMarker = (tIn - inPoint) / Math.max(1, textTotal);\n" +
        "if (delayFromMarker >= 0) delay = delayFromMarker;\n" +
        "myDelay = delay*textIndex;\n" +
        "t = (time - inPoint) - myDelay;\n" +
        "if (t >= 0) {\n" +
        "  freq = effect('Bounce Freq')('ADBE Slider Control-0001');\n" +
        "  amplitude = effect('Bounce Amplitude')('ADBE Slider Control-0001');\n" +
        "  decay = effect('Bounce Decay')('ADBE Slider Control-0001');\n" +
        "  s = amplitude*Math.cos(freq*t*2*Math.PI)/Math.exp(decay*t);\n" +
        "  s;\n" +
        "} else {\n" +
        "  value\n" +
        "}";
      } // end doIn

      if (doOut) {
      // ---- ANIMATOR OUT (position) ----
      var animOut = animators.addProperty("ADBE Text Animator");
      animOut.name = "Animator Out";
      var propsOut = animOut.property("ADBE Text Animator Properties");
      if (usePos)   propsOut.addProperty("ADBE Text Position 3D").setValue(posOutVal);
      if (useScale) propsOut.addProperty("ADBE Text Scale 3D").setValue([0, 0, 100]);

      var exprSelOut = animOut.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
      exprSelOut.name = "Expression Selector 1";
      var boOut = exprSelOut.property("Based On");
      if (boOut) boOut.setValue(basedOn);

      exprSelOut.property("Amount").expression =
        "riseDur  = 0.06;\n" +
        "dipDur   = 0.10;\n" +
        "exitDur  = 0.14;\n" +
        "totalDur = riseDur + dipDur + exitDur;\n" +
        "delay    = totalDur * 0.5;\n" +
        "tStart   = outPoint - totalDur - delay * (textTotal - 1);\n" +
        "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
        "  mk = thisLayer.marker.key(i);\n" +
        "  c = mk.comment;\n" +
        "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
        "  if (isOut){\n" +
        "    delay  = (outPoint - totalDur - mk.time) / Math.max(1, textTotal - 1);\n" +
        "    tStart = mk.time;\n" +
        "    break;\n" +
        "  }\n" +
        "}\n" +
        "myDelay = delay * textIndex;\n" +
        "t = (time - tStart) - myDelay;\n" +
        "if (t <= 0){\n" +
        "  0\n" +
        "} else if (t < riseDur){\n" +
        "  ease(t, 0, riseDur, 0, 10)\n" +
        "} else if (t < riseDur + dipDur){\n" +
        "  ease(t - riseDur, 0, dipDur, 10, -40)\n" +
        "} else if (t < totalDur){\n" +
        "  easeIn(t - riseDur - dipDur, 0, exitDur, -40, 100)\n" +
        "} else {\n" +
        "  100\n" +
        "}";

      // ---- ANIMATOR OUT OPACITY ----
      if (useOpac) {
        var animOutOpac = animators.addProperty("ADBE Text Animator");
        animOutOpac.name = "Animator Out Opacity";
        var propsOutOpac = animOutOpac.property("ADBE Text Animator Properties");
        propsOutOpac.addProperty("ADBE Text Opacity").setValue(0);

        var exprSelOutOpac = animOutOpac.property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
        exprSelOutOpac.name = "Expression Selector 1";
        var boOutOpac = exprSelOutOpac.property("Based On");
        if (boOutOpac) boOutOpac.setValue(basedOn);

        exprSelOutOpac.property("Amount").expression =
          "riseDur  = 0.06;\n" +
          "dipDur   = 0.10;\n" +
          "fadeDur  = 0.14;\n" +
          "totalDur = riseDur + dipDur + fadeDur;\n" +
          "delay    = totalDur * 0.5;\n" +
          "tStart   = outPoint - totalDur - delay * (textTotal - 1);\n" +
          "for (i = 1; i <= thisLayer.marker.numKeys; i++){\n" +
          "  mk = thisLayer.marker.key(i);\n" +
          "  c = mk.comment;\n" +
          "  isOut = (c == 'OUT') || (c && c.length >= 4 && c.substr(c.length-4,4) == '_OUT');\n" +
          "  if (isOut){\n" +
          "    delay  = (outPoint - totalDur - mk.time) / Math.max(1, textTotal - 1);\n" +
          "    tStart = mk.time;\n" +
          "    break;\n" +
          "  }\n" +
          "}\n" +
          "myDelay = delay * textIndex;\n" +
          "t = (time - tStart) - myDelay - riseDur - dipDur;\n" +
          "if (t <= 0){\n" +
          "  0\n" +
          "} else if (t >= fadeDur){\n" +
          "  100\n" +
          "} else {\n" +
          "  linear(t, 0, fadeDur, 0, 100)\n" +
          "}";
      }

      } // end doOut

      // Add IN/OUT markers if missing (only for the modes being applied)
      var markerProp = layer.marker;
      var hasIN = false, hasOUT = false;
      for (var mi = 1; mi <= markerProp.numKeys; mi++) {
        var mc = markerProp.keyValue(mi).comment;
        if (mc === "IN")  hasIN  = true;
        if (mc === "OUT") hasOUT = true;
      }
      if (doIn && !hasIN) {
        var keyIN = markerProp.addKey(layer.inPoint + (textIn || 0.5));
        markerProp.setValueAtKey(keyIN, new MarkerValue("IN"));
      }
      if (doOut && !hasOUT) {
        var keyOUT = markerProp.addKey(layer.outPoint - (textOut || 0.5));
        markerProp.setValueAtKey(keyOUT, new MarkerValue("OUT"));
      }
    }
    return "Text Anim Bounce " + (mode || 'in') + " applied";
  });
}


// ── fn/applyWiggleFFX.jsx
var WiggleEffectData = {
    name: "Wiggle",
    matchName: "Pseudo/Wiggle",
    binary: "RIFX\x00\x00\x0B\u00F4FaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00\x0B\u00D0bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x07Wiggle\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\nTsspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x04\x16parTparn\x00\x00\x00\x04\x00\x00\x00\x05tdmn\x00\x00\x00(Pseudo/Wiggle-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Enable\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nFrequency\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00A \x00\x00?\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nAmount\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00F\x1C@\x00\x00\x00\x00\x00Cz\x00\x00A\u00C8\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nSeed\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00?\u0080\x00\x00F\x1C@\x00?\u0080\x00\x00B\u00C8\x00\x00?\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x05\u00F2tdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Wiggle\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/Wiggle-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Enable\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\nFrequency\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@$\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Amount\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@9\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@o@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/Wiggle-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F2tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x05Seed\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b?\u00F0\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{\"controlName\":\"Wiggle\",\"matchname\":\"Pseudo/Wiggle\",\"controlArray\":[{\"name\":\"Enable\",\"type\":\"checkbox\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"default\":true,\"keyframes\":true,\"id\":2956298975,\"hold\":true,\"label\":\"\",\"error\":[\n\n]},{\"name\":\"Frequency\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":8951772406,\"hold\":false,\"default\":0.5,\"sliderMax\":10,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":true,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Amount\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":8249688144,\"hold\":false,\"default\":25,\"sliderMax\":250,\"sliderMin\":0,\"validMax\":10000,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":true,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Seed\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":7708869475,\"hold\":false,\"default\":1,\"sliderMax\":100,\"sliderMin\":1,\"validMax\":10000,\"validMin\":1,\"precision\":0,\"percent\":false,\"pixel\":false,\"open\":true,\"errors\":[\n\n],\"error\":[\n\n]}],\"version\":3}"
};

function applyWiggleFFX(freq, amp) {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedProps = comp.selectedProperties;
  if (!selectedProps || selectedProps.length === 0) return "No properties selected";

  return _undo("TNK: Apply Wiggle", function() {

    var targets = [];
    for (var i = 0; i < selectedProps.length; i++) {
      var prop = selectedProps[i];
      if (!prop.canSetExpression) continue;
      var layer = prop.propertyGroup(prop.propertyDepth);
      if (!layer) continue;
      targets.push({ prop: prop, layer: layer, name: getWiggleName(prop) });
    }
    if (!targets.length) return "No valid properties";

    var lastErr = null;
    for (var j = 0; j < targets.length; j++) {
      var t = targets[j];
      if (hasWiggleWithName(t.layer, t.name)) continue;
      try {
        var fx = applyPseudoEffect(WiggleEffectData, t.layer.property("ADBE Effect Parade"));
        if (!fx) { lastErr = "addProperty returned null for " + t.name; continue; }
        fx.name = t.name;
      } catch(e) {
        lastErr = "addProperty threw: " + e.toString();
      }
    }
    if (lastErr) return "Wiggle effect add failed: " + lastErr;

    for (var k = 0; k < targets.length; k++) {
      var p = targets[k].prop;
      var name = targets[k].name;
      var expr =
        'try {\n' +
        '    var fx = effect("' + name + '");\n' +
        '    e = fx(1).value;\n' +
        '    if (e) {\n' +
        '        freq = fx("Frequency");\n' +
        '        amp = fx("Amount");\n' +
        '        seed = fx("Seed");\n' +
        '        seedRandom(seed);\n' +
        '        result = wiggle(freq, amp);\n' +
        '        result + value - valueAtTime(0);\n' +
        '    } else {\n' +
        '        value;\n' +
        '    }\n' +
        '} catch(error) {\n' +
        '    value;\n' +
        '}';
      try { p.expression = expr; p.expressionEnabled = true; } catch(e) {}
    }

    return "Wiggle applied to " + targets.length + " propert" + (targets.length !== 1 ? "ies" : "y");
  });
}

function getWiggleName(prop) {
  var contextName = null;
  if (prop.propertyDepth > 1) {
    var parentGroup = prop.propertyGroup(prop.propertyDepth - 1);
    if (parentGroup && parentGroup.parentProperty &&
        parentGroup.parentProperty.matchName === "ADBE Effect Parade") {
      contextName = parentGroup.name;
    } else if (parentGroup && parentGroup.matchName === "ADBE Transform Group") {
      contextName = null;
    } else if (parentGroup) {
      contextName = parentGroup.name;
    }
  }
  return contextName
    ? "Wiggle - " + contextName + " - " + prop.name
    : "Wiggle - " + prop.name;
}

function hasWiggleWithName(layer, finalName) {
  var effects = layer.property("ADBE Effect Parade");
  for (var i = 1; i <= effects.numProperties; i++) {
    if (effects.property(i).name === finalName) return true;
  }
  return false;
}


// ── fn/applyGlow.jsx
function applyGlow() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Glow", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").addProperty("ADBE Glow2"); } catch(e) {}
    }
    return "Glow applied";
  });
}


// ── fn/applyVHS.jsx
function applyVHS() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: VHS", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      try { fx.addProperty("ADBE ChromaticAberration"); } catch(e) {}
      try { fx.addProperty("ADBE Noise"); } catch(e) {}
    }
    return "VHS applied";
  });
}


// ── fn/applyBlurInOut.jsx
function applyBlurInOut() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur In+Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var fx = layer.property("Effects");
      var blur = fx.addProperty("ADBE Camera Lens Blur");
      if (blur) {
        var blurProp = blur.property("ADBE Camera Lens Blur Radius");
        blurProp.setValueAtTime(layer.inPoint, 15);
        blurProp.setValueAtTime(layer.inPoint + 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint - 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint, 15);
      }
    }
    return "Blur in+out applied";
  });
}


// ── fn/applyBlurOut.jsx
function applyBlurOut() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Blur Out", function() {
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var blur = layer.property("Effects").addProperty("ADBE Camera Lens Blur");
      if (blur) {
        var blurProp = blur.property("ADBE Camera Lens Blur Radius");
        blurProp.setValueAtTime(layer.outPoint - 0.2, 0);
        blurProp.setValueAtTime(layer.outPoint, 15);
      }
    }
    return "Blur out applied";
  });
}


// ── fn/applyDimDesat.jsx
function applyDimDesat() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Dim + Desat", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      try {
        var lum = fx.addProperty("ADBE Lumetri");
        if (lum) {
          try { lum.property("ADBE Lumetri-0001").property("ADBE Lumetri-0010").setValue(-2); } catch(e) {}
          try { lum.property("ADBE Lumetri-0001").property("ADBE Lumetri-0016").setValue(0); } catch(e) {}
        }
      } catch(e) {}
    }
    return "Dim + Desat applied";
  });
}


// ── fn/applyGrain.jsx
function applyGrain() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Grain", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").addProperty("ADBE Add Grain"); } catch(e) {}
    }
    return "Grain applied";
  });
}


// ── fn/toggleVisibility.jsx
function toggleVisibility() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Visibility", function() {
    var anyVisible = false;
    for (var i = 0; i < layers.length; i++) { if (layers[i].enabled) { anyVisible = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].enabled = !anyVisible;
    return anyVisible ? "Layers hidden" : "Layers shown";
  });
}


// ── fn/showAll.jsx
function showAll() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Show All", function() {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).enabled = true;
    return "All layers shown";
  });
}


// ── fn/toggleLockSelected.jsx
function toggleLockSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Lock", function() {
    var anyUnlocked = false;
    for (var i = 0; i < layers.length; i++) { if (!layers[i].locked) { anyUnlocked = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].locked = anyUnlocked;
    return anyUnlocked ? "Layers locked" : "Layers unlocked";
  });
}


// ── fn/soloSelected.jsx
function soloSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Solo Selected", function() {
    var anyNotSoloed = false;
    for (var i = 0; i < layers.length; i++) { if (!layers[i].solo) { anyNotSoloed = true; break; } }
    for (var i = 0; i < layers.length; i++) layers[i].solo = anyNotSoloed;
    return anyNotSoloed ? "Soloed" : "Unsoloed";
  });
}


// ── fn/unsoloAll.jsx
function unsoloAll() {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Unsolo All", function() {
    for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
    return "All layers unsoloed";
  });
}


// ── fn/soloFocusToggle.jsx
function soloFocusToggle() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Solo+Focus Toggle", function() {
    var anyNotSoloed = false;
    for (var i = 0; i < layers.length; i++) { if (!layers[i].solo) { anyNotSoloed = true; break; } }
    if (anyNotSoloed) {
      for (var i = 0; i < layers.length; i++) layers[i].solo = true;
      for (var i = 1; i <= comp.numLayers; i++) { if (!comp.layer(i).selected) comp.layer(i).shy = true; }
      comp.hideShyLayers = true;
    } else {
      for (var i = 0; i < layers.length; i++) layers[i].solo = false;
      for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).shy = false; }
      comp.hideShyLayers = false;
    }
    return anyNotSoloed ? "Solo + Focus" : "Unsolo + Unfocus";
  });
}


// ── fn/selectAtPlayhead.jsx
function selectAtPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Select at Playhead", function() {
    var t = comp.time; var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.inPoint <= t && l.outPoint >= t) { l.selected = true; count++; }
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " selected at playhead";
  });
}


// ── fn/createNull.jsx
function createNull() {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Create Null", function() {
    var n = c.layers.addNull(); n.name = "TNK_NULL";
    return "Null created";
  });
}


// ── fn/parentToNull.jsx
function parentToNull() {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "Select layers first";
  return _undo("TNK: Parent to Null", function() {
    var sumX = 0, sumY = 0;
    for (var i = 0; i < selected.length; i++) {
      var pos = selected[i].property("Position");
      if (pos) { var v = pos.valueAtTime(c.time, false); sumX += v[0]; sumY += v[1]; }
    }
    var earliest = selected[0].inPoint, latest = selected[0].outPoint;
    for (var i = 1; i < selected.length; i++) {
      if (selected[i].inPoint  < earliest) earliest = selected[i].inPoint;
      if (selected[i].outPoint > latest)   latest   = selected[i].outPoint;
    }
    var topIndex = selected[0].index;
    for (var i = 1; i < selected.length; i++) { if (selected[i].index < topIndex) topIndex = selected[i].index; }
    var nullLayer = c.layers.addNull();
    nullLayer.name = "TNK_NULL"; nullLayer.label = 9;
    nullLayer.property("Position").setValue([sumX / selected.length, sumY / selected.length]);
    nullLayer.inPoint  = earliest;
    nullLayer.outPoint = latest;
    nullLayer.moveBefore(c.layer(topIndex + 1));
    for (var i = 0; i < selected.length; i++) selected[i].parent = nullLayer;
    return "Parented to null";
  });
}


// ── fn/precomposeSelected.jsx
function precomposeSelected() {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "Select layers first";
  return _undo("TNK: Precompose", function() {
    var indices = [];
    for (var i = 0; i < selected.length; i++) indices.push(selected[i].index);
    c.layers.precompose(indices, "TNK_Precomp_" + new Date().getTime(), true);
    return "Precomposed";
  });
}


// ── fn/lockSelected.jsx
function lockSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Lock Selected", function() {
    for (var i = 0; i < layers.length; i++) layers[i].locked = true;
    return "Locked " + layers.length + " layers";
  });
}


// ── fn/trimToKeyframes.jsx
function trimToKeyframes() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Trim to Keyframes", function() {
    function scan(prop, state) {
      if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
          var t = prop.keyTime(k);
          if (state.earliest === null || t < state.earliest) state.earliest = t;
          if (state.latest   === null || t > state.latest)   state.latest   = t;
        }
      }
      if (prop.numProperties > 0) { for (var j = 1; j <= prop.numProperties; j++) scan(prop.property(j), state); }
    }
    for (var i = 0; i < layers.length; i++) {
      var state = { earliest: null, latest: null };
      scan(layers[i], state);
      if (state.earliest !== null) { layers[i].inPoint = state.earliest; layers[i].outPoint = state.latest; }
    }
    return "Trimmed to keyframes";
  });
}


// ── fn/hideSelected.jsx
function hideSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Hide Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = false;
    return "Layers hidden";
  });
}


// ── fn/showSelected.jsx
function showSelected() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Show Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = true;
    return "Layers shown";
  });
}


// ── fn/applyTrackMatte.jsx
function applyTrackMatte(mode) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (sel.length < 2) return "Select at least 2 layers";
  if (mode === "break") {
    return _undo("TNK: Break Matte", function() {
      for (var i = 0; i < sel.length; i++) sel[i].trackMatteType = TrackMatteType.NO_TRACK_MATTE;
      return "Matte removed";
    });
  }
  return _undo("TNK: Track Matte", function() {
    var lastLayer = sel[sel.length - 1];
    for (var i = 0; i < sel.length - 1; i++) {
      var layer = sel[i];
      lastLayer.moveBefore(layer);
      layer.trackMatteType = TrackMatteType.ALPHA;
      if (mode === "matte_parent") layer.parent = lastLayer;
      if (mode === "matte_blend")  layer.blendingMode = BlendingMode.ADD;
    }
    for (var i = 0; i < sel.length - 1; i++) sel[i].moveBefore(lastLayer);
    lastLayer.enabled = true; lastLayer.selected = false;
    return "Track matte applied";
  });
}
function breakMatte() { return applyTrackMatte("break"); }


// ── fn/staggerLayers.jsx
function staggerLayers(params, fromBottom) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (layers.length < 2) return "Select 2+ layers";
  var inTime = params ? (params.inTime || 1) : 1;
  return _undo("TNK: Stagger Layers", function() {
    var ordered = layers.slice();
    if (fromBottom) ordered.reverse();
    for (var i = 0; i < ordered.length; i++) {
      var offset = i * inTime;
      ordered[i].inPoint  += offset;
      ordered[i].outPoint += offset;
    }
    return "Layers staggered";
  });
}


// ── fn/pullToPlayhead.jsx
function pullToPlayhead(useOut) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Pull to Playhead", function() {
    var t = comp.time;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var dur = layer.outPoint - layer.inPoint;
      if (useOut) {
        layer.outPoint = t;
        layer.inPoint  = t - dur;
      } else {
        layer.inPoint  = t;
        layer.outPoint = t + dur;
      }
    }
    return "Pulled to playhead";
  });
}


// ── fn/focusSelected.jsx
function focusSelected() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Focus Mode", function() {
    var hasShyLayers = false;
    for (var i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).shy) { hasShyLayers = true; break; } }
    if (hasShyLayers) {
      for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).shy = false; }
      comp.hideShyLayers = false;
    } else {
      var hasSelected = false;
      for (var i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).selected) { hasSelected = true; break; } }
      if (hasSelected) {
        for (var i = 1; i <= comp.numLayers; i++) { if (!comp.layer(i).selected) comp.layer(i).shy = true; }
        comp.hideShyLayers = true;
      }
    }
    return "Focus mode toggled";
  });
}


// ── fn/focusPlayhead.jsx
function focusPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Focus Playhead", function() {
    var t = comp.time;
    var hasShyLayers = false;
    for (var i = 1; i <= comp.numLayers; i++) { if (comp.layer(i).shy) { hasShyLayers = true; break; } }
    if (hasShyLayers) {
      for (var i = 1; i <= comp.numLayers; i++) { comp.layer(i).shy = false; }
      comp.hideShyLayers = false;
    } else {
      for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
      for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (l.inPoint <= t && l.outPoint >= t) l.selected = true;
      }
      for (var i = 1; i <= comp.numLayers; i++) { if (!comp.layer(i).selected) comp.layer(i).shy = true; }
      comp.hideShyLayers = true;
    }
    return "Focus playhead";
  });
}


// ── fn/filterTextLayers.jsx
function filterTextLayers() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Filter Text Layers", function() {
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (!(l instanceof TextLayer)) l.selected = false;
    }
    return "Text layers filtered";
  });
}


// ── fn/keepOnlyShapes.jsx
function keepOnlyShapes() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Keep Only Shapes", function() {
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (!(l instanceof ShapeLayer)) l.selected = false;
    }
    return "Shape layers kept";
  });
}


// ── fn/keepOnlyImages.jsx
function keepOnlyImages() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Keep Only Images", function() {
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l instanceof TextLayer || l instanceof ShapeLayer || l.nullLayer) l.selected = false;
    }
    return "Image layers kept";
  });
}


// ── fn/unlockAtPlayhead.jsx
function unlockAtPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Unlock at Playhead", function() {
    var t = comp.time; var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.locked && l.inPoint <= t && l.outPoint >= t) { l.locked = false; count++; }
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " unlocked";
  });
}


// ── fn/selectParents.jsx
function selectParents() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Select Parents", function() {
    var toSelect = {};
    for (var i = 0; i < layers.length; i++) { if (layers[i].parent) toSelect[layers[i].parent.index] = true; }
    for (var idx in toSelect) comp.layer(parseInt(idx)).selected = true;
    return "Parents selected";
  });
}


// ── fn/selectChildren.jsx
function selectChildren() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Select Children", function() {
    var parentIndices = {};
    for (var i = 0; i < layers.length; i++) parentIndices[layers[i].index] = true;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.parent && parentIndices[l.parent.index]) l.selected = true;
    }
    return "Children selected";
  });
}


// ── fn/toggleEffects.jsx
function toggleEffects() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Effects", function() {
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].property("Effects").enabled = !layers[i].property("Effects").enabled; } catch(e) {}
    }
    return "Effects toggled";
  });
}


// ── fn/copyEffects.jsx
function copyEffects() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (layers.length < 2) return "Select 2+ layers (source first)";
  return _undo("TNK: Copy Effects", function() {
    var src = layers[0];
    for (var i = 1; i < layers.length; i++) {
      var fx = src.property("Effects");
      for (var j = 1; j <= fx.numProperties; j++) {
        try {
          src.selected = true; layers[i].selected = false;
          app.executeCommand(2004); // copy
          layers[i].selected = true; src.selected = false;
          app.executeCommand(2005); // paste
        } catch(e) {}
      }
    }
    return "Effects copied";
  });
}


// ── fn/deleteAllEffects.jsx
function deleteAllEffects() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Effects", function() {
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      while (fx && fx.numProperties > 0) { try { fx.property(1).remove(); } catch(e) { break; } }
    }
    return "Effects deleted";
  });
}


// ── fn/deleteAllExpressions.jsx
function deleteAllExpressions() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Expressions", function() {
    function clearExpr(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      for (var i = 1; i <= prop.numProperties; i++) { try { clearExpr(prop.property(i)); } catch(e) {} }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clearExpr(layers[i].property(j)); } catch(e) {} }
    }
    return "Expressions deleted";
  });
}


// ── fn/fullPurge.jsx
function fullPurge(doFx, doKeys, doExpr, doLabels) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var parts = [];
  if (doFx)     parts.push("effects");
  if (doKeys)   parts.push("keyframes");
  if (doExpr)   parts.push("expressions");
  if (doLabels) parts.push("labels");
  return _undo("TNK: Full Purge", function() {
    function clearKeys(prop) {
      if (!prop) return;
      if (prop.numKeys) { try { while (prop.numKeys > 0) prop.removeKey(1); } catch(e) {} }
      if (prop.numProperties) { for (var i = 1; i <= prop.numProperties; i++) { try { clearKeys(prop.property(i)); } catch(e) {} } }
    }
    function clearExpr(prop) {
      if (prop.canSetExpression) try { prop.expression = ""; } catch(e) {}
      if (prop.numProperties) { for (var i = 1; i <= prop.numProperties; i++) { try { clearExpr(prop.property(i)); } catch(e) {} } }
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (doFx)     { var fx = layer.property("Effects"); while (fx && fx.numProperties > 0) { try { fx.property(1).remove(); } catch(e) { break; } } }
      if (doKeys)   clearKeys(layer);
      if (doExpr)   clearExpr(layer);
      if (doLabels) layer.label = 0;
    }
    return "Purged: " + (parts.join(", ") || "nothing");
  });
}


// ── fn/addDashesToStroke.jsx
function addDashesToStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Add Dashes", function() {
    function process(prop) {
      for (var i = 1; i <= prop.numProperties; i++) {
        var p = prop.property(i);
        if (p.matchName === "ADBE Vector Stroke" || p.matchName === "ADBE Vector Graphic - Stroke") {
          var dashes; try { dashes = p.property("ADBE Vector Stroke Dashes"); } catch(e) {}
          if (dashes && dashes.numProperties === 0) {
            dashes.addProperty("ADBE Vector Stroke Dash 1");
            try { dashes.addProperty("ADBE Vector Stroke Gap 1"); } catch(e) {}
          }
        }
        if (p.numProperties) process(p);
      }
    }
    for (var i = 0; i < layers.length; i++) {
      if (!(layers[i] instanceof ShapeLayer)) continue;
      process(layers[i].property("Contents"));
    }
    return "Dashes added";
  });
}


// ── fn/applySizeRig.jsx
function applySizeRig() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";

  var SIZE_MATCHNAMES = {
    "ADBE Vector Rect Size":    true,
    "ADBE Vector Ellipse Size": true
  };

  function findSelectedTwoD(layer) {
    var sel = layer.selectedProperties;
    for (var s = 0; s < sel.length; s++) {
      var p = sel[s];
      if (p.propertyType !== PropertyType.PROPERTY) continue;
      var t = p.propertyValueType;
      if (t === PropertyValueType.TwoD || t === PropertyValueType.TwoD_SPATIAL) return p;
    }
    return null;
  }

  function findSelectedShapeGroup(layer) {
    var sel = layer.selectedProperties;
    for (var s = 0; s < sel.length; s++) {
      var p = sel[s];
      while (p && p.parentProperty) {
        if (p.matchName === "ADBE Vector Group") return p;
        p = p.parentProperty;
      }
    }
    return null;
  }

  function findSizeInGroup(group, depth) {
    if (depth > 20) return null;
    var n; try { n = group.numProperties; } catch(e) { return null; }
    for (var i = 1; i <= n; i++) {
      try {
        var p = group.property(i);
        if (SIZE_MATCHNAMES[p.matchName]) return p;
        if (p.propertyType === PropertyType.PROPERTY &&
            p.propertyValueType === PropertyValueType.TwoD &&
            p.name === "Size") {
          return p;
        }
        if (p.numProperties && p.numProperties > 0) {
          var found = findSizeInGroup(p, depth + 1);
          if (found) return found;
        }
      } catch(e) {}
    }
    return null;
  }

  function findAllSizes(layer) {
    var out = [];
    var contents;
    try { contents = layer.property("ADBE Root Vectors Group"); } catch(e) {}
    if (!contents) { try { contents = layer.property("Contents"); } catch(e2) {} }
    if (!contents) return out;

    function walk(group, enclosingGroupName) {
      var n; try { n = group.numProperties; } catch(e) { return; }
      for (var i = 1; i <= n; i++) {
        try {
          var p = group.property(i);
          var nextEnclosing = (p.matchName === "ADBE Vector Group") ? p.name : enclosingGroupName;
          if (SIZE_MATCHNAMES[p.matchName] ||
              (p.propertyType === PropertyType.PROPERTY &&
               p.propertyValueType === PropertyValueType.TwoD &&
               p.name === "Size")) {
            out.push({ size: p, label: enclosingGroupName || p.name });
            continue;
          }
          if (p.numProperties && p.numProperties > 0) {
            walk(p, nextEnclosing);
          }
        } catch(e) {}
      }
    }
    walk(contents, "");
    return out;
  }

  function pickShapeDialog(layerName, entries) {
    var dlg = new Window("dialog", "TNK Size Rig — Pick Shape");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.margins = 14;
    dlg.add("statictext", undefined,
            'Layer "' + layerName + '" has multiple shapes — pick one to rig:');
    var list = dlg.add("listbox", undefined, [], { multiselect: false });
    list.preferredSize = [320, 160];
    for (var i = 0; i < entries.length; i++) {
      var sz = entries[i].size.value;
      list.add("item",
        entries[i].label + "   [" + sz[0].toFixed(1) + " × " + sz[1].toFixed(1) + "]");
    }
    list.selection = 0;
    var btns = dlg.add("group"); btns.alignment = "right";
    var ok = btns.add("button", undefined, "Rig", { name: "ok" });
    btns.add("button", undefined, "Cancel", { name: "cancel" });
    var picked = null;
    ok.onClick = function () {
      picked = list.selection ? list.selection.index : null;
      dlg.close();
    };
    dlg.show();
    return picked != null ? entries[picked].size : null;
  }

  function propChain(prop) {
    var chain = [], p = prop;
    while (p && p.parentProperty) {
      chain.unshift(p.matchName);
      p = p.parentProperty;
    }
    return chain;
  }

  function resolveChain(layer, chain) {
    var p = layer;
    for (var i = 0; i < chain.length; i++) p = p.property(chain[i]);
    return p;
  }

  function rigOne(layer, sizeProp, sliderPrefix) {
    if (!sizeProp.canSetExpression) {
      throw new Error('"' + sizeProp.name + '" does not accept expressions');
    }

    var curSize = sizeProp.value;
    var chain   = propChain(sizeProp);
    var propName = sizeProp.name;

    var fx = layer.property("ADBE Effect Parade");

    var wFx = fx.addProperty("ADBE Slider Control");
    wFx.name = sliderPrefix ? sliderPrefix + " Width" : "Width";
    var wIdx = wFx.propertyIndex;

    var hFx = fx.addProperty("ADBE Slider Control");
    hFx.name = sliderPrefix ? sliderPrefix + " Height" : "Height";
    var hIdx = hFx.propertyIndex;

    fx.property(wIdx).property("ADBE Slider Control-0001").setValue(curSize[0]);
    fx.property(hIdx).property("ADBE Slider Control-0001").setValue(curSize[1]);

    var wName = fx.property(wIdx).name;
    var hName = fx.property(hIdx).name;
    var expr = '[effect("' + wName + '")("Slider"), effect("' + hName + '")("Slider")]';

    var liveProp = resolveChain(layer, chain);
    liveProp.expression = expr;
    try { liveProp.expressionEnabled = true; } catch(e) {}

    if (liveProp.expressionError && liveProp.expressionError.length) {
      throw new Error("expression rejected: " + liveProp.expressionError);
    }
    return propName;
  }

  function pickTargetForLayer(layer) {
    var direct = findSelectedTwoD(layer);
    if (direct) return { size: direct, prefix: "" };

    var selGroup = findSelectedShapeGroup(layer);
    if (selGroup) {
      var sz = findSizeInGroup(selGroup, 0);
      if (sz) return { size: sz, prefix: selGroup.name };
    }

    var all = findAllSizes(layer);
    if (all.length === 0) return null;
    if (all.length === 1) {
      return { size: all[0].size, prefix: all[0].label || "" };
    }

    var picked = pickShapeDialog(layer.name, all);
    if (!picked) return null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].size === picked) return { size: picked, prefix: all[i].label };
    }
    return { size: picked, prefix: "" };
  }

  return _undo("TNK: Size Rig", function() {
    var rigged = 0, lastName = "", lastErr = "", skipped = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var target = pickTargetForLayer(layer);
      if (!target) { skipped++; continue; }
      try {
        lastName = rigOne(layer, target.size, target.prefix);
        rigged++;
      } catch(e) {
        lastErr = e.toString();
      }
    }
    if (!rigged) {
      if (lastErr) return "Rig failed: " + lastErr;
      return "No Size property found on " + skipped + " layer" + (skipped !== 1 ? "s" : "");
    }
    return rigged === 1
      ? 'Size rig → "' + lastName + '"'
      : "Size rig applied to " + rigged + " layers";
  });
}


// ── fn/swapFillStroke.jsx
function swapFillStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  function swapGroup(group) {
    var fills = [], strokes = [];
    for (var i = 1; i <= group.numProperties; i++) {
      try {
        var p = group.property(i); var mn = p.matchName;
        if (mn === "ADBE Vector Graphic - Fill") fills.push(p);
        else if (mn === "ADBE Vector Graphic - Stroke") strokes.push(p);
        else if (p.numProperties > 0) swapGroup(p);
      } catch(e) {}
    }
    for (var j = 0; j < Math.min(fills.length, strokes.length); j++) {
      try {
        var fc = fills[j].property("ADBE Vector Fill Color").value;
        var sc = strokes[j].property("ADBE Vector Stroke Color").value;
        fills[j].property("ADBE Vector Fill Color").setValue(sc);
        strokes[j].property("ADBE Vector Stroke Color").setValue(fc);
      } catch(e) {}
    }
  }
  return _undo("TNK: Swap Fill/Stroke", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i] instanceof TextLayer) {
        try {
          var tp = layers[i].property("Source Text"), doc = tp.value;
          if (doc.applyFill && doc.applyStroke) {
            var of = doc.fillColor, os = doc.strokeColor;
            doc.fillColor = os; doc.strokeColor = of; tp.setValue(doc); count++;
          }
        } catch(e) {}
      } else if (layers[i] instanceof ShapeLayer) {
        try { swapGroup(layers[i].property("Contents")); count++; } catch(e) {}
      }
    }
    return "Fill/Stroke swapped on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}


// ── fn/applyStrokeStyle.jsx
function applyStrokeStyle() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  function processContents(contents) {
    var count = 0;
    for (var i = 1; i <= contents.numProperties; i++) {
      try {
        var item = contents.property(i); var mn = item.matchName;
        if (mn === "ADBE Vector Shape - Group" || mn === "ADBE Vector Group") {
          count += processContents(item.property("Contents"));
          try { var po = item.property("ADBE Vector Blend Order"); if (po) po.setValue(2); } catch(e) {}
        } else if (mn === "ADBE Vector Graphic - Stroke") {
          try { item.property("ADBE Vector Stroke Line Join").setValue(2); } catch(e) {}
          count++;
        }
      } catch(e) {}
    }
    try {
      for (var j = 1; j <= contents.numProperties; j++) {
        var p = contents.property(j);
        if (p && p.matchName === "ADBE Vector Blend Order") { try { p.setValue(2); } catch(e) {} }
      }
    } catch(e) {}
    return count;
  }
  return _undo("TNK: Stroke Style", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      if (!(sel[i] instanceof ShapeLayer)) continue;
      count += processContents(sel[i].property("Contents"));
    }
    return count ? "Stroke style applied to " + count + " stroke" + (count !== 1 ? "s" : "") : "No strokes found";
  });
}


// ── fn/combineShapes.jsx
function combineShapes() {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedLayers = comp.selectedLayers;
  if (!selectedLayers || selectedLayers.length < 2) return "Select 2+ shape layers to combine";
  for (var i = 0; i < selectedLayers.length; i++) {
    if (selectedLayers[i].matchName !== "ADBE Vector Layer") return "All selected layers must be shape layers";
  }

  return _undo("TNK: Combine Shapes", function() {
    var sorted = [];
    for (var i = 0; i < selectedLayers.length; i++) sorted.push(selectedLayers[i]);
    sorted.sort(function(a, b) { return a.index - b.index; });

    function sv(p, v) { try { if (p && !p.isReadOnly) p.setValue(v); } catch(e) {} }
    function gv(p, mn, def) { try { return p.property(mn).value; } catch(e) { return def; } }

    // ── read helpers (snapshot to plain JS objects) ──
    var TAPER_KEYS=["ADBE Vector Taper Length Units","ADBE Vector Taper Start Length","ADBE Vector Taper End Length","ADBE Vector Taper StartWidthPx","ADBE Vector Taper EndWidthPx","ADBE Vector Taper Start Width","ADBE Vector Taper End Width","ADBE Vector Taper Start Ease","ADBE Vector Taper End Ease"];
    var WAVE_KEYS=["ADBE Vector Taper Wave Amount","ADBE Vector Taper Wave Units","ADBE Vector Taper Wavelength","ADBE Vector Taper Wave Cycles","ADBE Vector Taper Wave Phase"];
    var DASH_KEYS=["ADBE Vector Stroke Dash 1","ADBE Vector Stroke Gap 1","ADBE Vector Stroke Dash 2","ADBE Vector Stroke Gap 2","ADBE Vector Stroke Dash 3","ADBE Vector Stroke Gap 3","ADBE Vector Stroke Offset"];
    function readDashes(p){var o={};var sd=p.property("ADBE Vector Stroke Dashes");for(var i=0;i<DASH_KEYS.length;i++){try{o[DASH_KEYS[i]]=sd.property(DASH_KEYS[i]).value;}catch(e){}}return o;}
    function writeDashes(d,o){var dd=d.property("ADBE Vector Stroke Dashes");for(var i=0;i<DASH_KEYS.length;i++){if(o[DASH_KEYS[i]]!==undefined)try{dd.property(DASH_KEYS[i]).setValue(o[DASH_KEYS[i]]);}catch(e){}}}
    function readTaper(p){var o={};for(var i=0;i<TAPER_KEYS.length;i++){try{o[TAPER_KEYS[i]]=p.property(TAPER_KEYS[i]).value;}catch(e){}}return o;}
    function writeTaper(d,o){for(var i=0;i<TAPER_KEYS.length;i++){if(o[TAPER_KEYS[i]]!==undefined)try{d.property(TAPER_KEYS[i]).setValue(o[TAPER_KEYS[i]]);}catch(e){}}}
    function readWave(p){var o={};for(var i=0;i<WAVE_KEYS.length;i++){try{o[WAVE_KEYS[i]]=p.property(WAVE_KEYS[i]).value;}catch(e){}}return o;}
    function writeWave(d,o){for(var i=0;i<WAVE_KEYS.length;i++){if(o[WAVE_KEYS[i]]!==undefined)try{d.property(WAVE_KEYS[i]).setValue(o[WAVE_KEYS[i]]);}catch(e){}}}
    function readFill(p){return{mn:"ADBE Vector Graphic - Fill",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),fillRule:gv(p,"ADBE Vector Fill Rule",1),color:gv(p,"ADBE Vector Fill Color",[1,0,0,1]),opacity:gv(p,"ADBE Vector Fill Opacity",100)};}
    function writeFill(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Fill Rule"),o.fillRule);sv(d.property("ADBE Vector Fill Color"),o.color);sv(d.property("ADBE Vector Fill Opacity"),o.opacity);}
    function readStroke(p){return{mn:"ADBE Vector Graphic - Stroke",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),color:gv(p,"ADBE Vector Stroke Color",[1,0,0,1]),opacity:gv(p,"ADBE Vector Stroke Opacity",100),width:gv(p,"ADBE Vector Stroke Width",2),lineCap:gv(p,"ADBE Vector Stroke Line Cap",1),lineJoin:gv(p,"ADBE Vector Stroke Line Join",1),miter:gv(p,"ADBE Vector Stroke Miter Limit",4),dashes:readDashes(p),taper:readTaper(p.property("ADBE Vector Stroke Taper")),wave:readWave(p.property("ADBE Vector Stroke Wave"))};}
    function writeStroke(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Stroke Color"),o.color);sv(d.property("ADBE Vector Stroke Opacity"),o.opacity);sv(d.property("ADBE Vector Stroke Width"),o.width);sv(d.property("ADBE Vector Stroke Line Cap"),o.lineCap);sv(d.property("ADBE Vector Stroke Line Join"),o.lineJoin);sv(d.property("ADBE Vector Stroke Miter Limit"),o.miter);writeDashes(d,o.dashes);writeTaper(d.property("ADBE Vector Stroke Taper"),o.taper);writeWave(d.property("ADBE Vector Stroke Wave"),o.wave);}
    function readGradientFill(p){return{mn:"ADBE Vector Graphic - G-Fill",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),fillRule:gv(p,"ADBE Vector Fill Rule",1),gradType:gv(p,"ADBE Vector Grad Type",1),startPt:gv(p,"ADBE Vector Grad Start Pt",[0,0]),endPt:gv(p,"ADBE Vector Grad End Pt",[0,100]),hiLitLen:gv(p,"ADBE Vector Grad HiLite Length",0),hiLiteAng:gv(p,"ADBE Vector Grad HiLite Angle",0),gradScale:gv(p,"ADBE Vector Grad Scale",100),gradRot:gv(p,"ADBE Vector Grad Rotation",0),opacity:gv(p,"ADBE Vector Fill Opacity",100),colors:(function(){try{return p.property("ADBE Vector Grad Colors").value;}catch(e){return null;}})()};}
    function writeGradientFill(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Fill Rule"),o.fillRule);sv(d.property("ADBE Vector Grad Type"),o.gradType);sv(d.property("ADBE Vector Grad Start Pt"),o.startPt);sv(d.property("ADBE Vector Grad End Pt"),o.endPt);sv(d.property("ADBE Vector Grad HiLite Length"),o.hiLitLen);sv(d.property("ADBE Vector Grad HiLite Angle"),o.hiLiteAng);sv(d.property("ADBE Vector Grad Scale"),o.gradScale);sv(d.property("ADBE Vector Grad Rotation"),o.gradRot);sv(d.property("ADBE Vector Fill Opacity"),o.opacity);if(o.colors)sv(d.property("ADBE Vector Grad Colors"),o.colors);}
    function readGradientStroke(p){return{mn:"ADBE Vector Graphic - G-Stroke",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),composite:gv(p,"ADBE Vector Composite Order",1),opacity:gv(p,"ADBE Vector Stroke Opacity",100),width:gv(p,"ADBE Vector Stroke Width",2),lineCap:gv(p,"ADBE Vector Stroke Line Cap",1),lineJoin:gv(p,"ADBE Vector Stroke Line Join",1),miter:gv(p,"ADBE Vector Stroke Miter Limit",4),gradType:gv(p,"ADBE Vector Grad Type",1),startPt:gv(p,"ADBE Vector Grad Start Pt",[0,0]),endPt:gv(p,"ADBE Vector Grad End Pt",[0,100]),hiLitLen:gv(p,"ADBE Vector Grad HiLite Length",0),hiLiteAng:gv(p,"ADBE Vector Grad HiLite Angle",0),gradScale:gv(p,"ADBE Vector Grad Scale",100),gradRot:gv(p,"ADBE Vector Grad Rotation",0),colors:(function(){try{return p.property("ADBE Vector Grad Colors").value;}catch(e){return null;}})(),dashes:readDashes(p),taper:readTaper(p.property("ADBE Vector Stroke Taper")),wave:readWave(p.property("ADBE Vector Stroke Wave"))};}
    function writeGradientStroke(d,o){sv(d.property("ADBE Vector Blend Mode"),o.blendMode);sv(d.property("ADBE Vector Composite Order"),o.composite);sv(d.property("ADBE Vector Stroke Opacity"),o.opacity);sv(d.property("ADBE Vector Stroke Width"),o.width);sv(d.property("ADBE Vector Stroke Line Cap"),o.lineCap);sv(d.property("ADBE Vector Stroke Line Join"),o.lineJoin);sv(d.property("ADBE Vector Stroke Miter Limit"),o.miter);sv(d.property("ADBE Vector Grad Type"),o.gradType);sv(d.property("ADBE Vector Grad Start Pt"),o.startPt);sv(d.property("ADBE Vector Grad End Pt"),o.endPt);sv(d.property("ADBE Vector Grad HiLite Length"),o.hiLitLen);sv(d.property("ADBE Vector Grad HiLite Angle"),o.hiLiteAng);sv(d.property("ADBE Vector Grad Scale"),o.gradScale);sv(d.property("ADBE Vector Grad Rotation"),o.gradRot);if(o.colors)sv(d.property("ADBE Vector Grad Colors"),o.colors);writeDashes(d,o.dashes);writeTaper(d.property("ADBE Vector Stroke Taper"),o.taper);writeWave(d.property("ADBE Vector Stroke Wave"),o.wave);}
    function readShape(p){var mn=p.matchName,o={mn:mn,name:p.name};if(mn==="ADBE Vector Shape - Rect"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.size=gv(p,"ADBE Vector Rect Size",[100,100]);o.pos=gv(p,"ADBE Vector Rect Position",[0,0]);o.rnd=gv(p,"ADBE Vector Rect Roundness",0);}else if(mn==="ADBE Vector Shape - Ellipse"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.size=gv(p,"ADBE Vector Ellipse Size",[100,100]);o.pos=gv(p,"ADBE Vector Ellipse Position",[0,0]);}else if(mn==="ADBE Vector Shape - Star"){o.dir=gv(p,"ADBE Vector Shape Direction",1);o.type=gv(p,"ADBE Vector Star Type",1);o.pts=gv(p,"ADBE Vector Star Points",5);o.pos=gv(p,"ADBE Vector Star Position",[0,0]);o.rot=gv(p,"ADBE Vector Star Rotation",0);o.ir=gv(p,"ADBE Vector Star Inner Radius",50);o.or=gv(p,"ADBE Vector Star Outer Radius",100);o.irnd=gv(p,"ADBE Vector Star Inner Roundness",0);o.ornd=gv(p,"ADBE Vector Star Outer Roundness",0);}else if(mn==="ADBE Vector Shape"){try{o.shape=p.property("ADBE Vector Shape").value;}catch(e){o.shape=null;}}return o;}
    function writeShape(d,o){var mn=o.mn;if(mn==="ADBE Vector Shape - Rect"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Rect Size"),o.size);sv(d.property("ADBE Vector Rect Position"),o.pos);sv(d.property("ADBE Vector Rect Roundness"),o.rnd);}else if(mn==="ADBE Vector Shape - Ellipse"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Ellipse Size"),o.size);sv(d.property("ADBE Vector Ellipse Position"),o.pos);}else if(mn==="ADBE Vector Shape - Star"){sv(d.property("ADBE Vector Shape Direction"),o.dir);sv(d.property("ADBE Vector Star Type"),o.type);sv(d.property("ADBE Vector Star Points"),o.pts);sv(d.property("ADBE Vector Star Position"),o.pos);sv(d.property("ADBE Vector Star Rotation"),o.rot);sv(d.property("ADBE Vector Star Inner Radius"),o.ir);sv(d.property("ADBE Vector Star Outer Radius"),o.or);sv(d.property("ADBE Vector Star Inner Roundness"),o.irnd);sv(d.property("ADBE Vector Star Outer Roundness"),o.ornd);}else if(mn==="ADBE Vector Shape"){if(o.shape)sv(d.property("ADBE Vector Shape"),o.shape);}}
    var OPERATOR_MNS={"ADBE Vector Filter - Trim":true,"ADBE Vector Filter - Merge":true,"ADBE Vector Filter - Offset":true,"ADBE Vector Filter - PuckerBloat":true,"ADBE Vector Filter - Repeater":true,"ADBE Vector Filter - Roughen":true,"ADBE Vector Filter - Twist":true,"ADBE Vector Filter - Wiggle":true,"ADBE Vector Filter - Zigzag":true};
    function readOperator(p){var mn=p.matchName,o={mn:mn,name:p.name};if(mn==="ADBE Vector Filter - Trim"){o.start=gv(p,"ADBE Vector Trim Start",0);o.end=gv(p,"ADBE Vector Trim End",100);o.offset=gv(p,"ADBE Vector Trim Offset",0);o.type=gv(p,"ADBE Vector Trim Type",1);}else if(mn==="ADBE Vector Filter - Merge"){o.mode=gv(p,"ADBE Vector Merge Type",1);}else if(mn==="ADBE Vector Filter - Offset"){o.amount=gv(p,"ADBE Vector Offset Amount",0);o.join=gv(p,"ADBE Vector Offset Line Join",1);o.miter=gv(p,"ADBE Vector Offset Miter Limit",4);}else if(mn==="ADBE Vector Filter - PuckerBloat"){o.amount=gv(p,"ADBE Vector PuckerBloat Amount",0);}else if(mn==="ADBE Vector Filter - Repeater"){o.copies=gv(p,"ADBE Vector Repeater Copies",3);o.offset=gv(p,"ADBE Vector Repeater Offset",0);o.order=gv(p,"ADBE Vector Repeater Order",1);var t=p.property("ADBE Vector Repeater Transform");o.tr={anchor:gv(t,"ADBE Vector Repeater Anchor",[0,0]),position:gv(t,"ADBE Vector Repeater Position",[100,0]),scale:gv(t,"ADBE Vector Repeater Scale",[100,100]),rotation:gv(t,"ADBE Vector Repeater Rotation",0),startOpac:gv(t,"ADBE Vector Repeater Start Opacity",100),endOpac:gv(t,"ADBE Vector Repeater End Opacity",100)};}else if(mn==="ADBE Vector Filter - Roughen"){o.radius=gv(p,"ADBE Vector Roughen Radius",5);o.detail=gv(p,"ADBE Vector Roughen Detail",0.7);o.corners=gv(p,"ADBE Vector Roughen Corners",1);o.smooth=gv(p,"ADBE Vector Roughen Smooth",0);o.noise=gv(p,"ADBE Vector Roughen Noise Type",1);o.speed=gv(p,"ADBE Vector Roughen Speed",1);o.seed=gv(p,"ADBE Vector Roughen Random Seed",0);}else if(mn==="ADBE Vector Filter - Twist"){o.angle=gv(p,"ADBE Vector Twist Angle",0);o.center=gv(p,"ADBE Vector Twist Center",[0,0]);}else if(mn==="ADBE Vector Filter - Wiggle"){o.freq=gv(p,"ADBE Vector Wiggler Frequency",2);o.amp=gv(p,"ADBE Vector Wiggler Amount",5);o.noise=gv(p,"ADBE Vector Wiggler Noise Type",1);o.smooth=gv(p,"ADBE Vector Wiggler Smooth",0);o.seed=gv(p,"ADBE Vector Wiggler Random Seed",0);}else if(mn==="ADBE Vector Filter - Zigzag"){o.size=gv(p,"ADBE Vector Zigzag Size",10);o.detail=gv(p,"ADBE Vector Zigzag Detail",10);o.points=gv(p,"ADBE Vector Zigzag Points",1);}return o;}
    function writeOperator(d,o){var mn=o.mn;if(mn==="ADBE Vector Filter - Trim"){sv(d.property("ADBE Vector Trim Start"),o.start);sv(d.property("ADBE Vector Trim End"),o.end);sv(d.property("ADBE Vector Trim Offset"),o.offset);sv(d.property("ADBE Vector Trim Type"),o.type);}else if(mn==="ADBE Vector Filter - Merge"){sv(d.property("ADBE Vector Merge Type"),o.mode);}else if(mn==="ADBE Vector Filter - Offset"){sv(d.property("ADBE Vector Offset Amount"),o.amount);sv(d.property("ADBE Vector Offset Line Join"),o.join);sv(d.property("ADBE Vector Offset Miter Limit"),o.miter);}else if(mn==="ADBE Vector Filter - PuckerBloat"){sv(d.property("ADBE Vector PuckerBloat Amount"),o.amount);}else if(mn==="ADBE Vector Filter - Repeater"){sv(d.property("ADBE Vector Repeater Copies"),o.copies);sv(d.property("ADBE Vector Repeater Offset"),o.offset);sv(d.property("ADBE Vector Repeater Order"),o.order);var t=d.property("ADBE Vector Repeater Transform");sv(t.property("ADBE Vector Repeater Anchor"),o.tr.anchor);sv(t.property("ADBE Vector Repeater Position"),o.tr.position);sv(t.property("ADBE Vector Repeater Scale"),o.tr.scale);sv(t.property("ADBE Vector Repeater Rotation"),o.tr.rotation);sv(t.property("ADBE Vector Repeater Start Opacity"),o.tr.startOpac);sv(t.property("ADBE Vector Repeater End Opacity"),o.tr.endOpac);}else if(mn==="ADBE Vector Filter - Roughen"){sv(d.property("ADBE Vector Roughen Radius"),o.radius);sv(d.property("ADBE Vector Roughen Detail"),o.detail);sv(d.property("ADBE Vector Roughen Corners"),o.corners);sv(d.property("ADBE Vector Roughen Smooth"),o.smooth);sv(d.property("ADBE Vector Roughen Noise Type"),o.noise);sv(d.property("ADBE Vector Roughen Speed"),o.speed);sv(d.property("ADBE Vector Roughen Random Seed"),o.seed);}else if(mn==="ADBE Vector Filter - Twist"){sv(d.property("ADBE Vector Twist Angle"),o.angle);sv(d.property("ADBE Vector Twist Center"),o.center);}else if(mn==="ADBE Vector Filter - Wiggle"){sv(d.property("ADBE Vector Wiggler Frequency"),o.freq);sv(d.property("ADBE Vector Wiggler Amount"),o.amp);sv(d.property("ADBE Vector Wiggler Noise Type"),o.noise);sv(d.property("ADBE Vector Wiggler Smooth"),o.smooth);sv(d.property("ADBE Vector Wiggler Random Seed"),o.seed);}else if(mn==="ADBE Vector Filter - Zigzag"){sv(d.property("ADBE Vector Zigzag Size"),o.size);sv(d.property("ADBE Vector Zigzag Detail"),o.detail);sv(d.property("ADBE Vector Zigzag Points"),o.points);}}

    function readGroup(p){var o={mn:"ADBE Vector Group",name:p.name,blendMode:gv(p,"ADBE Vector Blend Mode",0),items:[],transform:{anchor:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Anchor",[0,0]),position:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Position",[0,0]),scale:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Scale",[100,100]),skew:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Skew",0),skewAxis:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Skew Axis",0),rotation:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Rotation",0),opacity:gv(p.property("ADBE Vector Transform Group"),"ADBE Vector Group Opacity",100)}};var inner=p.property("ADBE Vectors Group");for(var i=1;i<=inner.numProperties;i++){try{var child=inner.property(i),mn=child.matchName;if(mn==="ADBE Vector Group")o.items.push(readGroup(child));else if(mn==="ADBE Vector Graphic - Fill")o.items.push(readFill(child));else if(mn==="ADBE Vector Graphic - Stroke")o.items.push(readStroke(child));else if(mn==="ADBE Vector Graphic - G-Fill")o.items.push(readGradientFill(child));else if(mn==="ADBE Vector Graphic - G-Stroke")o.items.push(readGradientStroke(child));else if(OPERATOR_MNS[mn])o.items.push(readOperator(child));else o.items.push(readShape(child));}catch(e){}}return o;}

    // ── write group (no cleanup — done in separate pass) ──
    function writeGroup(o, destContainer, overridePos) {
      var grp=destContainer.addProperty("ADBE Vector Group");
      if(!grp) return;
      try{grp.name=o.name;}catch(e){}
      sv(grp.property("ADBE Vector Blend Mode"),o.blendMode);
      for(var i=0;i<o.items.length;i++){
        var inner=grp.property("ADBE Vectors Group");
        var item=o.items[i], mn=item.mn;
        if(mn==="ADBE Vector Group"){writeGroup(item,inner,null);}
        else if(mn==="ADBE Vector Graphic - Fill"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeFill(n,item);}}
        else if(mn==="ADBE Vector Graphic - Stroke"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeStroke(n,item);}}
        else if(mn==="ADBE Vector Graphic - G-Fill"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeGradientFill(n,item);}}
        else if(mn==="ADBE Vector Graphic - G-Stroke"){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeGradientStroke(n,item);}}
        else if(OPERATOR_MNS[mn]){var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeOperator(n,item);}}
        else{var n=inner.addProperty(mn);if(n){try{n.name=item.name;}catch(e){}writeShape(n,item);}}
      }
      // Hide auto-injected fills/strokes the source didn't have
      grp=destContainer.property(destContainer.numProperties);
      var _hasFill=false,_hasStroke=false,_hasGFill=false,_hasGStroke=false;
      for(var hi=0;hi<o.items.length;hi++){
        var hm=o.items[hi].mn;
        if(hm==="ADBE Vector Graphic - Fill")_hasFill=true;
        if(hm==="ADBE Vector Graphic - Stroke")_hasStroke=true;
        if(hm==="ADBE Vector Graphic - G-Fill")_hasGFill=true;
        if(hm==="ADBE Vector Graphic - G-Stroke")_hasGStroke=true;
      }
      var _inner=grp.property("ADBE Vectors Group");
      for(var hi=1;hi<=_inner.numProperties;hi++){
        try{
          var hp=_inner.property(hi),hmn=hp.matchName;
          if(!_hasFill&&!_hasGFill&&(hmn==="ADBE Vector Graphic - Fill"||hmn==="ADBE Vector Graphic - G-Fill")){
            try{sv(hp.property("ADBE Vector Fill Opacity"),0);}catch(e){}
          }
          if(!_hasStroke&&!_hasGStroke&&(hmn==="ADBE Vector Graphic - Stroke"||hmn==="ADBE Vector Graphic - G-Stroke")){
            try{sv(hp.property("ADBE Vector Stroke Opacity"),0);sv(hp.property("ADBE Vector Stroke Width"),0);}catch(e){}
          }
        }catch(e){}
      }
      var t=grp.property("ADBE Vector Transform Group");
      sv(t.property("ADBE Vector Anchor"),o.transform.anchor);
      sv(t.property("ADBE Vector Position"),overridePos||o.transform.position);
      sv(t.property("ADBE Vector Scale"),o.transform.scale);
      sv(t.property("ADBE Vector Skew"),o.transform.skew);
      sv(t.property("ADBE Vector Skew Axis"),o.transform.skewAxis);
      sv(t.property("ADBE Vector Rotation"),o.transform.rotation);
      sv(t.property("ADBE Vector Group Opacity"),o.transform.opacity);
    }

    // (cleanup is now done inside writeGroup)

    // STEP 1: Explode into single-group layers
    var exploded=[];
    for(var li=0;li<sorted.length;li++){
      var src=sorted[li],cnt=src.property("ADBE Root Vectors Group"),gc=cnt.numProperties;
      if(gc===1){exploded.push(src);}
      else{for(var gi=gc;gi>=1;gi--){var d=src.duplicate();d.selected=false;var dc=d.property("ADBE Root Vectors Group");for(var ri=dc.numProperties;ri>=1;ri--){if(ri!==gi)try{dc.property(ri).remove();}catch(e){}}exploded.push(d);}try{src.remove();}catch(e){}}
    }

    // STEP 2: Snapshot all layer+group data
    var snaps=[];
    for(var ei=0;ei<exploded.length;ei++){
      var lyr=exploded[ei],cnt=lyr.property("ADBE Root Vectors Group");
      if(cnt.numProperties<1)continue;
      var grpData=readGroup(cnt.property(1));
      var lPos=lyr.transform.position.value,lAnc=lyr.transform.anchorPoint.value,lSc=lyr.transform.scale.value,lRot=lyr.transform.rotation.value;
      var gPos=grpData.transform.position,lRad=lRot*Math.PI/180;
      var sx=gPos[0]*(lSc[0]/100),sy=gPos[1]*(lSc[1]/100);
      var rx=sx*Math.cos(lRad)-sy*Math.sin(lRad),ry=sx*Math.sin(lRad)+sy*Math.cos(lRad);
      var ax=lAnc[0]*(lSc[0]/100),ay=lAnc[1]*(lSc[1]/100);
      var arx=ax*Math.cos(lRad)-ay*Math.sin(lRad),ary=ax*Math.sin(lRad)+ay*Math.cos(lRad);
      grpData.transform.scale=[grpData.transform.scale[0]*lSc[0]/100,grpData.transform.scale[1]*lSc[1]/100];
      grpData.transform.rotation=grpData.transform.rotation+lRot;
      snaps.push({grpData:grpData,compX:lPos[0]+rx-arx,compY:lPos[1]+ry-ary});
    }

    // STEP 3: Delete exploded layers
    for(var ei=exploded.length-1;ei>=0;ei--){try{exploded[ei].remove();}catch(e){}}

    // STEP 4: New combined layer at comp center
    var nl=comp.layers.addShape();
    nl.name="Combined Shape";
    nl.transform.position.setValue([comp.width/2,comp.height/2]);
    nl.transform.anchorPoint.setValue([0,0]);
    nl.transform.scale.setValue([100,100]);
    nl.transform.rotation.setValue(0);
    var nc=nl.property("ADBE Root Vectors Group");
    var targetLayerIdx=nl.index;

    // STEP 5: Write all groups
    for(var si=0;si<snaps.length;si++){
      var s=snaps[si],pos=[s.compX-comp.width/2,s.compY-comp.height/2];
      writeGroup(s.grpData,nc,pos);
    }



    return "Shapes combined into 'Combined Shape'";
  });
}


// ── fn/explodeShapes.jsx
function explodeShapes() {
  var comp = getComp(); if (!comp) return "No comp";
  var selectedLayers = comp.selectedLayers;
  if (!selectedLayers || selectedLayers.length === 0) return "Select at least one shape layer";

  return _undo("TNK: Explode Shapes", function() {
    var totalCreated = 0;
    var layersToDelete = [];

    for(var li=0; li<selectedLayers.length; li++){
      var srcLayer=selectedLayers[li];
      if(srcLayer.matchName !== "ADBE Vector Layer") continue;
      var contents=srcLayer.property("ADBE Root Vectors Group");
      if(!contents || contents.numProperties < 1) continue;

      // Snapshot group count and names before duplicating
      var groupCount=contents.numProperties, groupNames=[];
      for(var gi=1;gi<=groupCount;gi++) groupNames.push(contents.property(gi).name);

      // Duplicate once per group, strip all others
      for(var gi=groupCount-1;gi>=0;gi--){
        var newLayer=srcLayer.duplicate();
        newLayer.moveAfter(srcLayer);
        newLayer.name=groupNames[gi];
        var newContents=newLayer.property("ADBE Root Vectors Group");
        for(var ri=newContents.numProperties;ri>=1;ri--){
          if(ri !== gi+1) try{newContents.property(ri).remove();}catch(e){}
        }
        newLayer.selected=false;
        totalCreated++;
      }
      layersToDelete.push(srcLayer);
    }

    // Delete originals after all duplicating is done
    for(var di=0;di<layersToDelete.length;di++){try{layersToDelete[di].remove();}catch(e){}}

    if(totalCreated === 0) return "No shape groups found to explode";
    return "Exploded into " + totalCreated + " layer(s)";
  });
}


// ── fn/setAnchorToPoint.jsx
function _getMaskBBox(layer, curTime) {
  var masks = layer.property("Masks");
  if (!masks || masks.numProperties === 0) return null;
  var minX = null, maxX = null, minY = null, maxY = null, found = false;
  for (var mi = 1; mi <= masks.numProperties; mi++) {
    var mask = masks.property(mi);
    try {
      var enabledProp = mask.property("ADBE Mask Atom");
      if (enabledProp && enabledProp.value === false) continue;
      var modeProp = mask.property("ADBE Mask Mode");
      if (modeProp) {
        var mode = modeProp.value;
        if (mode === 1 || mode === 3 || mode === 7) continue; // None, Subtract, Difference
      }
      var pathProp = mask.property("ADBE Mask Shape");
      if (!pathProp) continue;
      var shape = pathProp.valueAtTime(curTime, false);
      var verts = shape.vertices;
      if (!verts || verts.length === 0) continue;
      for (var vi = 0; vi < verts.length; vi++) {
        var vx = verts[vi][0], vy = verts[vi][1];
        if (minX === null || vx < minX) minX = vx;
        if (maxX === null || vx > maxX) maxX = vx;
        if (minY === null || vy < minY) minY = vy;
        if (maxY === null || vy > maxY) maxY = vy;
      }
      found = true;
    } catch(e) {}
  }
  if (!found) return null;
  return { left: minX, top: minY, right: maxX, bottom: maxY };
}
function _setAnchorOnLayer(layer, point, useMasks) {
  var comp    = layer.containingComp;
  var curTime = comp.time;

  // Get bounding box — mask-aware or full layer
  var bbox = null;
  if (useMasks) bbox = _getMaskBBox(layer, curTime);
  if (!bbox) {
    var rect = layer.sourceRectAtTime(curTime, false);
    bbox = {
      left:   rect.left,
      top:    rect.top,
      right:  rect.left + rect.width,
      bottom: rect.top  + rect.height
    };
  }

  var L = bbox.left,  R = bbox.right;
  var T = bbox.top,   B = bbox.bottom;
  var CX = (L + R) / 2, CY = (T + B) / 2;

  var pointMap = {
    "TL": [L,  T],  "TC": [CX, T],  "TR": [R,  T],
    "ML": [L,  CY], "C":  [CX, CY], "MR": [R,  CY],
    "BL": [L,  B],  "BC": [CX, B],  "BR": [R,  B]
  };

  var newAnchor = pointMap[point];
  if (!newAnchor) return;

  var oldAnchor = layer.anchorPoint.value;

  // Delta in layer-local space
  var dLx = newAnchor[0] - oldAnchor[0];
  var dLy = newAnchor[1] - oldAnchor[1];

  // Convert layer-local delta to comp space.
  // Position is stored in PARENT space (comp space if no parent).
  // We must rotate+scale the delta through the transform chain up to the parent.
  //
  // For 2D layers: apply scale then rotation.
  // For 3D layers: orientation+rotationX/Y/Z stack applies, but we use the
  // same rotate-by-Z approach plus scale as a good approximation for the common
  // case. Full 3D orientation math would require a full matrix — for 3D layers
  // we fall back to toWorld/fromWorld via a null-helper trick instead.
  //
  // For parented layers: the parent transform is already baked into Position's
  // coordinate space, so we only need THIS layer's local rotation+scale.

  var is3D = layer.threeDLayer;
  var compDx, compDy, compDz;

  if (!is3D) {
    // Sample scale and rotation at curTime (handles keyframed transforms)
    var sx = layer.scale.valueAtTime(curTime, false)[0] / 100;
    var sy = layer.scale.valueAtTime(curTime, false)[1] / 100;
    var rotDeg = layer.rotation.valueAtTime(curTime, false);
    var rad    = rotDeg * Math.PI / 180;
    var cosR   = Math.cos(rad);
    var sinR   = Math.sin(rad);

    // Scale the layer-local delta, then rotate into parent/comp space
    compDx = (dLx * sx) * cosR - (dLy * sy) * sinR;
    compDy = (dLx * sx) * sinR + (dLy * sy) * cosR;
    compDz = 0;
  } else {
    // 3D: use the toWorld approach — convert a point offset by the delta
    // relative to the current world-space anchor position.
    // toWorld maps layer-local to world (comp) space.
    // oldAnchor in world space = layer.toWorld(oldAnchor)
    // newAnchor in world space = layer.toWorld(newAnchor)
    // delta = newWorld - oldWorld
    try {
      var oldWorld = layer.toWorld([oldAnchor[0], oldAnchor[1], oldAnchor[2] || 0]);
      var newWorld = layer.toWorld([newAnchor[0], newAnchor[1], 0]);
      compDx = newWorld[0] - oldWorld[0];
      compDy = newWorld[1] - oldWorld[1];
      compDz = newWorld[2] - oldWorld[2];
    } catch(e) {
      // fallback: scale-only
      var sx3 = layer.scale.valueAtTime(curTime, false)[0] / 100;
      var sy3 = layer.scale.valueAtTime(curTime, false)[1] / 100;
      compDx = dLx * sx3;
      compDy = dLy * sy3;
      compDz = 0;
    }
  }

  // Set the new anchor point first
  layer.anchorPoint.setValue([newAnchor[0], newAnchor[1]]);

  // Now compensate position to keep the layer visually in place.
  // Handle separated dimensions (Position X / Position Y).
  var posProp = layer.property("Position");

  // Check if dimensions are separated
  var separated = false;
  try { separated = posProp.dimensionsSeparated; } catch(e) {}

  if (separated) {
    // Each axis is its own property with its own keyframes
    var xProp = posProp.getSeparationFollower(0);
    var yProp = posProp.getSeparationFollower(1);
    if (xProp.numKeys > 0) {
      for (var k = 1; k <= xProp.numKeys; k++) {
        xProp.setValueAtKey(k, xProp.keyValue(k) + compDx);
      }
    } else {
      xProp.setValue(xProp.value + compDx);
    }
    if (yProp.numKeys > 0) {
      for (var k = 1; k <= yProp.numKeys; k++) {
        yProp.setValueAtKey(k, yProp.keyValue(k) + compDy);
      }
    } else {
      yProp.setValue(yProp.value + compDy);
    }
  } else if (posProp.numKeys > 0) {
    for (var k = 1; k <= posProp.numKeys; k++) {
      var kv = posProp.keyValue(k);
      if (is3D && kv.length > 2) {
        posProp.setValueAtKey(k, [kv[0] + compDx, kv[1] + compDy, kv[2] + compDz]);
      } else {
        posProp.setValueAtKey(k, [kv[0] + compDx, kv[1] + compDy]);
      }
    }
  } else {
    var pv = posProp.value;
    if (is3D && pv.length > 2) {
      posProp.setValue([pv[0] + compDx, pv[1] + compDy, pv[2] + compDz]);
    } else {
      posProp.setValue([pv[0] + compDx, pv[1] + compDy]);
    }
  }
}
function setAnchorToPoint(point, useMasks) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Set Anchor Point", function() {
    for (var i = 0; i < sel.length; i++) {
      _setAnchorOnLayer(sel[i], point, useMasks);
    }
    return "Anchor → " + point;
  });
}


// ── fn/addMarker.jsx
function addMarker(label) {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Add Marker", function() {
    var mv = new MarkerValue(label || "");
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      for (var i = 0; i < layers.length; i++) {
        layers[i].property("Marker").setValueAtTime(c.time, mv);
      }
      return "Marker added to " + layers.length + " layer" + (layers.length !== 1 ? "s" : "");
    } else {
      c.markerProperty.setValueAtTime(c.time, mv);
      return "Comp marker added";
    }
  });
}


// ── fn/addColoredMarker.jsx
function addColoredMarker(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Add Colored Marker", function() {
    var m = new MarkerValue(""); m.label = colorIndex || 0;
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      layers[0].property("Marker").setValueAtTime(c.time, m);
    } else {
      c.markerProperty.setValueAtTime(c.time, m);
    }
    return "Marker added";
  });
}


// ── fn/recolorMarkerAtPlayhead.jsx
function recolorMarkerAtPlayhead(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  var markers = c.markerProperty;
  var t = c.time;
  for (var i = 1; i <= markers.numKeys; i++) {
    var mt = markers.keyTime(i);
    var mv = markers.keyValue(i);
    if (t >= mt && t <= mt + mv.duration) {
      return _undo("TNK: Recolor Marker", function() {
        mv.label = colorIndex;
        markers.setValueAtKey(i, mv);
        return "Marker recolored";
      });
    }
  }
  return "No marker at playhead";
}


// ── fn/createProtectedMarker.jsx
// createProtectedMarker(colorIndex, comment, isProtected)
// Spans selected keyframes if any; falls back to layer in/out range.
// Places marker on comp timeline.
function createProtectedMarker(colorIndex, comment, isProtected) {
  var c = getComp(); if (!c) return "No comp";
  var selectedLayers = getSelectedLayers();
  if (!selectedLayers || !selectedLayers.length) return "No layers selected";

  var startTime = Infinity, endTime = -Infinity;
  var foundKeys = false;

  // 1. Try selected keyframes first
  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i];
    var props = layer.selectedProperties;
    if (props && props.length > 0) {
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (prop.propertyType === PropertyType.INDEXED_GROUP ||
            prop.propertyType === PropertyType.NAMED_GROUP) continue;
        var keys = prop.selectedKeys;
        if (!keys || !keys.length) continue;
        foundKeys = true;
        for (var k = 0; k < keys.length; k++) {
          var t = prop.keyTime(keys[k]);
          if (t < startTime) startTime = t;
          if (t > endTime)   endTime   = t;
        }
      }
    }
  }

  // 2. Fallback: use layer in/out range
  if (!foundKeys) {
    for (var i = 0; i < selectedLayers.length; i++) {
      if (selectedLayers[i].inPoint  < startTime) startTime = selectedLayers[i].inPoint;
      if (selectedLayers[i].outPoint > endTime)   endTime   = selectedLayers[i].outPoint;
    }
  }

  if (startTime === Infinity) return "Could not determine range";

  // If start === end (single key or zero-length), place a point marker
  var duration = (endTime > startTime) ? (endTime - startTime) : 0;

  return _undo("TNK: Create Marker", function() {
    var marker          = new MarkerValue(comment || "");
    marker.duration     = duration;
    marker.label        = colorIndex || 0;
    marker.protectedRegion = (isProtected === true || isProtected === "true");
    c.markerProperty.setValueAtTime(startTime, marker);
    var msg = (comment ? '"' + comment + '" ' : '') + 'marker';
    if (duration > 0) msg += ' (' + Math.round(duration * 100) / 100 + 's)';
    if (isProtected) msg += ' [protected]';
    return msg + ' created';
  });
}


// ── fn/layerMarkersToComp.jsx
function layerMarkersToComp(numberAndMove) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Layer Markers to Comp", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var lm = layer.property("Marker");
      for (var m = 1; m <= lm.numKeys; m++) {
        var mv = lm.keyValue(m);
        var mt = lm.keyTime(m);
        var newMv = new MarkerValue(mv.comment || "");
        newMv.duration = mv.duration; newMv.label = mv.label;
        newMv.protectedRegion = mv.protectedRegion;
        comp.markerProperty.setValueAtTime(mt, newMv);
        count++;
      }
    }
    return count + " marker" + (count !== 1 ? "s" : "") + " transferred to comp";
  });
}


// ── fn/layerMarkersToCompNumbered.jsx
// layerMarkersToCompNumbered — number layer markers sequentially then move to comp
function layerMarkersToCompNumbered() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Layer Markers to Comp (Numbered)", function() {
    // 1. Collect all layer markers across selected layers, sorted by time
    var all = [];
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = 1; m <= mp.numKeys; m++) {
        all.push({ time: mp.keyTime(m), val: mp.keyValue(m) });
      }
    }
    all.sort(function(a, b) { return a.time - b.time; });

    // 2. Write to comp timeline with sequential numbers as labels
    for (var j = 0; j < all.length; j++) {
      var mv = new MarkerValue(String(j + 1));
      mv.duration        = all[j].val.duration;
      mv.label           = all[j].val.label;
      mv.protectedRegion = all[j].val.protectedRegion;
      comp.markerProperty.setValueAtTime(all[j].time, mv);
    }
    return all.length + " marker" + (all.length !== 1 ? "s" : "") + " numbered and moved to comp";
  });
}


// ── fn/renameLayerMarkers.jsx
function renameLayerMarkers(prefix) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Rename Markers", function() {
    var total = 0;
    for (var j = 0; j < layers.length; j++) {
      var mp = layers[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var mv = mp.keyValue(i);
        mv.comment = prefix ? (prefix + " " + i) : String(i);
        mp.setValueAtKey(i, mv);
        total++;
      }
    }
    return total + " marker" + (total !== 1 ? "s" : "") + " renamed";
  });
}


// ── fn/removeInOutMarkers.jsx
// removeInOutMarkers — removes any marker labelled IN or OUT from selected layers
function removeInOutMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Remove IN/OUT Markers", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        var c = mp.keyValue(m).comment.toUpperCase();
        if (c === "IN" || c === "OUT" || c === "_IN" || c === "_OUT") {
          mp.removeKey(m); count++;
        }
      }
    }
    return count + " IN/OUT marker" + (count !== 1 ? "s" : "") + " removed";
  });
}


// ── fn/deleteAllCompMarkers.jsx
function deleteAllCompMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Delete Comp Markers", function() {
    var mp = comp.markerProperty;
    for (var i = mp.numKeys; i >= 1; i--) mp.removeKey(i);
    return "All comp markers deleted";
  });
}


// ── fn/deleteAllLayerMarkers.jsx
function deleteAllLayerMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Layer Markers", function() {
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) mp.removeKey(m);
    }
    return "Layer markers deleted";
  });
}


// ── fn/deleteUnnamedMarkers.jsx
function deleteUnnamedMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete Unnamed Markers", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        if (!mp.keyValue(m).comment) { mp.removeKey(m); count++; }
      }
    }
    return count + " unnamed marker" + (count !== 1 ? "s" : "") + " deleted";
  });
}


// ── fn/deleteAllMarkersEverywhere.jsx
function deleteAllMarkersEverywhere() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Delete All Markers", function() {
    var cm = comp.markerProperty;
    for (var m = cm.numKeys; m >= 1; m--) cm.removeKey(m);
    for (var i = 1; i <= comp.numLayers; i++) {
      var lm = comp.layer(i).property("Marker");
      for (var m = lm.numKeys; m >= 1; m--) lm.removeKey(m);
    }
    return "All markers deleted";
  });
}


// ── fn/toggleMarkerProtection.jsx
function toggleMarkerProtection() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Toggle Marker Protection", function() {
    var t = comp.time;
    var markers = comp.markerProperty;
    for (var i = 1; i <= markers.numKeys; i++) {
      var mt = markers.keyTime(i);
      var mv = markers.keyValue(i);
      if (mv.duration > 0 && t >= mt && t <= mt + mv.duration) {
        mv.protectedRegion = !mv.protectedRegion;
        markers.setValueAtKey(i, mv);
      }
    }
    return "Marker protection toggled";
  });
}


// ── fn/toggleAllMarkerProtection.jsx
function toggleAllMarkerProtection() {
  var comp = getComp(); if (!comp) return "No comp";
  var markers = comp.markerProperty;
  if (!markers.numKeys) return "No comp markers";
  return _undo("TNK: Toggle All Marker Protection", function() {
    var firstProtected = markers.keyValue(1).protectedRegion;
    for (var i = 1; i <= markers.numKeys; i++) {
      var mv = markers.keyValue(i);
      mv.protectedRegion = !firstProtected;
      markers.setValueAtKey(i, mv);
    }
    return "All marker protection toggled";
  });
}


// ── fn/setInMarker.jsx
function setInMarker() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var t = comp.time;
  return _undo("TNK: Set IN Marker", function() {
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        var c = mp.keyValue(m).comment;
        if (c === "IN" || c === "_IN" || c === "in") mp.removeKey(m);
      }
      var mv = new MarkerValue("IN");
      mp.setValueAtTime(t, mv);
    }
    return "IN marker set";
  });
}


// ── fn/setOutMarker.jsx
function setOutMarker() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var t = comp.time;
  return _undo("TNK: Set OUT Marker", function() {
    for (var i = 0; i < layers.length; i++) {
      var mp = layers[i].property("Marker");
      for (var m = mp.numKeys; m >= 1; m--) {
        var c = mp.keyValue(m).comment;
        if (c === "OUT" || c === "_OUT" || c === "out") mp.removeKey(m);
      }
      var mv = new MarkerValue("OUT");
      mp.setValueAtTime(t, mv);
    }
    return "OUT marker set";
  });
}


// ── fn/countLayerMarkers.jsx
function countLayerMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Count Layer Markers", function() {
    var allMarkers = [];
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var t = mp.keyTime(i);
        if (t >= sel[j].inPoint && t <= sel[j].outPoint)
          allMarkers.push({ layer: sel[j], time: t, keyIndex: i });
      }
    }
    allMarkers.sort(function(a, b) { return a.time - b.time; });
    for (var m = 0; m < allMarkers.length; m++) {
      var entry = allMarkers[m];
      var mp2 = entry.layer.property("Marker");
      var existing = mp2.keyValue(entry.keyIndex);
      var nv = new MarkerValue(String(m + 1));
      nv.duration = existing.duration; nv.chapter = existing.chapter;
      nv.url = existing.url; nv.frameTarget = existing.frameTarget;
      mp2.setValueAtKey(entry.keyIndex, nv);
    }
    return "Numbered " + allMarkers.length + " marker" + (allMarkers.length !== 1 ? "s" : "");
  });
}


// ── fn/clearLayerMarkerNumbers.jsx
function clearLayerMarkerNumbers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Clear Marker Numbers", function() {
    var count = 0;
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var existing = mp.keyValue(i);
        if (!/^\d+$/.test(existing.comment)) continue;
        var nv = new MarkerValue("");
        nv.duration = existing.duration; nv.chapter = existing.chapter;
        nv.url = existing.url; nv.frameTarget = existing.frameTarget;
        mp.setValueAtKey(i, nv); count++;
      }
    }
    return "Cleared " + count + " number" + (count !== 1 ? "s" : "");
  });
}


// ── fn/labelLayers.jsx
function labelLayers(colorIndex) {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Label Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].label = colorIndex;
    return "Layers labeled";
  });
}


// ── fn/labelKeyframes.jsx
function labelKeyframes(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  var myKeys = c.selectedProperties; if (!myKeys || !myKeys.length) return "No keyframes selected";
  return _undo("TNK: Label Keyframes", function() {
    for (var i = 0; i < myKeys.length; i++) {
      var prop = myKeys[i];
      if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) continue;
      var sk = prop.selectedKeys;
      for (var k = 0; k < sk.length; k++) { try { prop.setLabelAtKey(sk[k], colorIndex); } catch(e) {} }
    }
    return "Keyframes labeled";
  });
}


// ── fn/toggleAllLayerStyles.jsx
function toggleAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Toggle Layer Styles", function() {
    var anyEnabled = false;
    for (var i = 0; i < sel.length; i++) {
      try { if (sel[i].property("ADBE Layer Styles").enabled) { anyEnabled = true; break; } } catch(e) {}
    }
    for (var i = 0; i < sel.length; i++) {
      try { sel[i].property("ADBE Layer Styles").enabled = !anyEnabled; } catch(e) {}
    }
    return anyEnabled ? "Styles disabled" : "Styles enabled";
  });
}


// ── fn/hideAllLayerStyles.jsx
function hideAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Hide Layer Styles", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      try { var ls = sel[i].property("ADBE Layer Styles"); if (ls) { ls.enabled = false; count++; } } catch(e) {}
    }
    return "Styles hidden on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}


// ── fn/removeAllLayerStyles.jsx
function removeAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var STYLE_MNS = [
    "dropShadow/enabled","innerShadow/enabled","outerGlow/enabled","innerGlow/enabled",
    "bevelEmboss/enabled","chromeFX/enabled","solidFill/enabled","gradientFill/enabled",
    "frameFX/enabled","patternFill/enabled"
  ];
  return _undo("TNK: Remove All Layer Styles", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      try {
        var ls = sel[i].property("ADBE Layer Styles"); if (!ls) continue;
        for (var si = STYLE_MNS.length - 1; si >= 0; si--) {
          try { var grp = ls.property(STYLE_MNS[si]); if (grp) grp.remove(); }
          catch(e) { try { var grp2 = ls.property(STYLE_MNS[si]); if (grp2) grp2.enabled = false; } catch(e2) {} }
        }
        count++;
      } catch(e) {}
    }
    return "Styles removed on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}


// ── fn/setTextContent.jsx
function setTextContent(newText) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Set Text", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      if (!(layers[i] instanceof TextLayer)) continue;
      var prop = layers[i].property("Source Text");
      var doc = prop.value; doc.text = newText; prop.setValue(doc); count++;
    }
    return count + " text layer" + (count !== 1 ? "s" : "") + " updated";
  });
}


// ── fn/shapeToMask.jsx
function shapeToMask() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Shape to Mask", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var pathShape = null;
      outer: for (var g = 1; g <= contents.numProperties; g++) {
        try {
          var grp = contents.property(g);
          var gc; try { gc = grp.property("Contents"); } catch(e) { gc = grp; }
          for (var s = 1; s <= gc.numProperties; s++) {
            try {
              var sh = gc.property(s);
              if (sh.matchName === "ADBE Vector Shape - Group" || sh.matchName === "ADBE Vector Shape") {
                pathShape = sh.property("ADBE Vector Shape"); break outer;
              }
              if (sh.matchName === "ADBE Vector Shape - Rect")
                return "Convert Rectangle to Bezier first (right-click path > Convert to Bezier)";
            } catch(e2) {}
          }
        } catch(e) {}
      }
      if (!pathShape) continue;
      var masks = layer.property("Masks");
      var newMask = masks.addProperty("Mask");
      newMask.property("Mask Path").setValue(pathShape.value);
      count++;
    }
    return count ? "Mask created on " + count + " layer" + (count !== 1 ? "s" : "") : "No convertible paths found";
  });
}


// ── fn/shapeToPath.jsx
function shapeToPath()        { return "[WIP] Convert shape to path"; }


// ── fn/splitText.jsx
function splitText()          { return "[WIP] Split text"; }


// ── fn/applyTypewriterRig.jsx
function applyTypewriterRig() { return "[WIP] Typewriter rig"; }


// ── fn/applyCounterRig.jsx
function applyCounterRig()    { return "[WIP] Counter rig"; }


// ── fn/findReplaceText.jsx
function findReplaceText(findStr, replaceStr, caseSensitive) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Find/Replace Text", function() {
    var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (!(layer instanceof TextLayer)) continue;
      var prop = layer.property("Source Text"), doc = prop.value, src = doc.text;
      var replaced;
      if (caseSensitive) {
        if (src.indexOf(findStr) === -1) continue;
        replaced = src.split(findStr).join(replaceStr);
      } else {
        var re = new RegExp(findStr.replace(/[-\/\^$*+?.()|[\]{}]/g, "\$&"), "gi");
        if (!re.test(src)) continue; re.lastIndex = 0;
        replaced = src.replace(re, replaceStr);
      }
      doc.text = replaced; prop.setValue(doc); count++;
    }
    return "Replaced in " + count + " layer" + (count !== 1 ? "s" : "");
  });
}


// ── fn/styleEditorBundle.jsx
// TNK — Style Editor bundle (requires _STYLE_DEFS)

var _STYLE_DEFS = [
  { label:"Gradient Overlay", groupMn:"gradientFill/enabled", props:[
    { label:"Opacity",     mn:"gradientFill/opacity",  type:"slider", min:0,   max:100 },
    { label:"Angle",       mn:"gradientFill/angle",    type:"angle"                    },
    { label:"Scale",       mn:"gradientFill/scale",    type:"slider", min:10,  max:150 },
    { label:"Reverse",     mn:"gradientFill/reverse",  type:"bool"                     },
    { label:"Align Layer", mn:"gradientFill/align",    type:"bool"                     },
    { label:"Edit Colors", mn:"gradientFill/gradient", type:"gradient_btn"             }
  ]},
  { label:"Color Overlay", groupMn:"solidFill/enabled", props:[
    { label:"Color",   mn:"solidFill/color",   type:"color"                  },
    { label:"Opacity", mn:"solidFill/opacity", type:"slider", min:0, max:100 }
  ]},
  { label:"Stroke", groupMn:"frameFX/enabled", props:[
    { label:"Color",    mn:"frameFX/color",   type:"color"                   },
    { label:"Size",     mn:"frameFX/size",    type:"slider", min:1,  max:250 },
    { label:"Opacity",  mn:"frameFX/opacity", type:"slider", min:0,  max:100 },
    { label:"Position", mn:"frameFX/style",   type:"dropdown",
      options:["Outside","Inside","Center"], values:[1,2,3] }
  ]},
  { label:"Outer Glow", groupMn:"outerGlow/enabled", props:[
    { label:"Color",   mn:"outerGlow/color",        type:"color"                   },
    { label:"Opacity", mn:"outerGlow/opacity",      type:"slider", min:0,  max:100 },
    { label:"Noise",   mn:"outerGlow/noise",        type:"slider", min:0,  max:100 },
    { label:"Spread",  mn:"outerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
    { label:"Size",    mn:"outerGlow/blur",         type:"slider", min:0,  max:250 }
  ]},
  { label:"Inner Glow", groupMn:"innerGlow/enabled", props:[
    { label:"Color",   mn:"innerGlow/color",        type:"color"                   },
    { label:"Opacity", mn:"innerGlow/opacity",      type:"slider", min:0,  max:100 },
    { label:"Noise",   mn:"innerGlow/noise",        type:"slider", min:0,  max:100 },
    { label:"Choke",   mn:"innerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
    { label:"Size",    mn:"innerGlow/blur",         type:"slider", min:0,  max:250 }
  ]},
  { label:"Drop Shadow", groupMn:"dropShadow/enabled", props:[
    { label:"Color",        mn:"dropShadow/color",              type:"color"                    },
    { label:"Opacity",      mn:"dropShadow/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",        mn:"dropShadow/localLightingAngle", type:"angle"                   },
    { label:"Distance",     mn:"dropShadow/distance",           type:"slider", min:0,  max:300 },
    { label:"Spread",       mn:"dropShadow/chokeMatte",         type:"slider", min:0,  max:100 },
    { label:"Size",         mn:"dropShadow/blur",               type:"slider", min:0,  max:250 },
    { label:"Noise",        mn:"dropShadow/noise",              type:"slider", min:0,  max:100 },
    { label:"Global Light", mn:"dropShadow/useGlobalAngle",     type:"bool"                    },
    { label:"Knocks Out",   mn:"dropShadow/layerConceals",      type:"bool"                    }
  ]},
  { label:"Inner Shadow", groupMn:"innerShadow/enabled", props:[
    { label:"Color",        mn:"innerShadow/color",              type:"color"                   },
    { label:"Opacity",      mn:"innerShadow/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",        mn:"innerShadow/localLightingAngle", type:"angle"                   },
    { label:"Distance",     mn:"innerShadow/distance",           type:"slider", min:0,  max:300 },
    { label:"Choke",        mn:"innerShadow/chokeMatte",         type:"slider", min:0,  max:100 },
    { label:"Size",         mn:"innerShadow/blur",               type:"slider", min:0,  max:250 },
    { label:"Noise",        mn:"innerShadow/noise",              type:"slider", min:0,  max:100 },
    { label:"Global Light", mn:"innerShadow/useGlobalAngle",     type:"bool"                    }
  ]},
  { label:"Bevel & Emboss", groupMn:"bevelEmboss/enabled", props:[
    { label:"Depth",        mn:"bevelEmboss/strengthRatio",         type:"slider", min:1,  max:1000 },
    { label:"Size",         mn:"bevelEmboss/blur",                  type:"slider", min:0,  max:250  },
    { label:"Soften",       mn:"bevelEmboss/softness",              type:"slider", min:0,  max:16   },
    { label:"Angle",        mn:"bevelEmboss/localLightingAngle",    type:"angle"                    },
    { label:"Altitude",     mn:"bevelEmboss/localLightingAltitude", type:"slider", min:0,  max:90   },
    { label:"Hi Color",     mn:"bevelEmboss/highlightColor",        type:"color"                    },
    { label:"Hi Opacity",   mn:"bevelEmboss/highlightOpacity",      type:"slider", min:0,  max:100  },
    { label:"Sh Color",     mn:"bevelEmboss/shadowColor",           type:"color"                    },
    { label:"Sh Opacity",   mn:"bevelEmboss/shadowOpacity",         type:"slider", min:0,  max:100  },
    { label:"Global Light", mn:"bevelEmboss/useGlobalAngle",        type:"bool"                     }
  ]},
  { label:"Satin", groupMn:"chromeFX/enabled", props:[
    { label:"Color",    mn:"chromeFX/color",              type:"color"                   },
    { label:"Opacity",  mn:"chromeFX/opacity",            type:"slider", min:0,  max:100 },
    { label:"Angle",    mn:"chromeFX/localLightingAngle", type:"angle"                   },
    { label:"Distance", mn:"chromeFX/distance",           type:"slider", min:0,  max:250 },
    { label:"Size",     mn:"chromeFX/blur",               type:"slider", min:0,  max:250 },
    { label:"Invert",   mn:"chromeFX/invert",             type:"bool"                    }
  ]}
];


function getStyleStatusJSON() {
  var comp = getComp(); if (!comp) return '{}';
  var sel = comp.selectedLayers; if (!sel.length) return '{}';
  var GMN_LIST = [
    'dropShadow/enabled','innerShadow/enabled','outerGlow/enabled','innerGlow/enabled',
    'bevelEmboss/enabled','chromeFX/enabled','solidFill/enabled','gradientFill/enabled','frameFX/enabled'
  ];
  var total = sel.length;
  var parts = [];
  for (var si = 0; si < GMN_LIST.length; si++) {
    var gMn = GMN_LIST[si];
    var haveCount = 0;
    for (var li = 0; li < sel.length; li++) {
      try {
        var grp = sel[li].property("ADBE Layer Styles").property(gMn);
        if (grp && grp.enabled) haveCount++;
      } catch(e) {}
    }
    parts.push('"' + gMn + '":{"have":' + haveCount + ',"missing":' + (total - haveCount) + ',"total":' + total + '}');
  }
  return '{' + parts.join(',') + '}';
}

function getLayerStylesEnabledState() {
  var comp = getComp(); if (!comp) return "false";
  var sel = comp.selectedLayers; if (!sel.length) return "false";
  for (var i = 0; i < sel.length; i++) {
    try { if (sel[i].property("ADBE Layer Styles").enabled) return "true"; } catch(e) {}
  }
  return "false";
}

function getActiveStylesJSON() {
  var comp = getComp(); if (!comp) return "\"No comp\"";
  var sel = comp.selectedLayers; if (!sel.length) return "\"No layers selected\"";

  function _rv(layer, gMn, pMn) {
    try { return layer.property("ADBE Layer Styles").property(gMn).property(pMn).value; }
    catch(e) { return null; }
  }
  function _vj(v) {
    if (v === null || v === undefined) return "null";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "number")  return String(v);
    if (typeof v === "string")  return "\"" + v + "\"";
    if (v && v.length !== undefined) {
      var a = [];
      for (var ai = 0; ai < v.length; ai++) a.push(String(v[ai]));
      return "[" + a.join(",") + "]";
    }
    return "null";
  }

  // Snapshot
  var snapParts = [];
  for (var li = 0; li < sel.length; li++) {
    var layer = sel[li];
    var enParts = [], prParts = [];
    for (var si = 0; si < _STYLE_DEFS.length; si++) {
      var def = _STYLE_DEFS[si];
      var gmn = def.groupMn;
      var isEn = false;
      try {
        var grp = layer.property("ADBE Layer Styles").property(gmn);
        isEn = !!(grp && grp.enabled);
      } catch(e) {}
      enParts.push("\"" + gmn + "\":" + isEn);
      var pp = [];
      for (var pi = 0; pi < def.props.length; pi++) {
        var pmn = def.props[pi].mn;
        if (def.props[pi].type === "dropdown") continue;
        pp.push("\"" + pmn + "\":" + _vj(_rv(layer, gmn, pmn)));
      }
      prParts.push("\"" + gmn + "\":{" + pp.join(",") + "}");
    }
    snapParts.push("{\"enabled\":{" + enParts.join(",") + "},\"props\":{" + prParts.join(",") + "}}");
  }

  // Active styles
  var activeParts = [];
  for (var si2 = 0; si2 < _STYLE_DEFS.length; si2++) {
    var def2 = _STYLE_DEFS[si2];
    var gmn2 = def2.groupMn;
    var anyEn = false;
    for (var li2 = 0; li2 < sel.length; li2++) {
      try {
        var grp2 = sel[li2].property("ADBE Layer Styles").property(gmn2);
        if (grp2 && grp2.enabled) { anyEn = true; break; }
      } catch(e) {}
    }
    if (!anyEn) continue;

    var prList = [];
    for (var pi2 = 0; pi2 < def2.props.length; pi2++) {
      var pd = def2.props[pi2];
      var pmn2 = pd.mn;
      if (pd.type === "gradient_btn") {
        prList.push("{\"label\":\"" + pd.label + "\",\"mn\":\"" + pmn2 + "\",\"type\":\"gradient_btn\",\"value\":null}");
        continue;
      }
      var val = null;
      for (var li3 = 0; li3 < sel.length; li3++) {
        try {
          var grp3 = sel[li3].property("ADBE Layer Styles").property(gmn2);
          if (grp3 && grp3.enabled) { val = _rv(sel[li3], gmn2, pmn2); if (val !== null) break; }
        } catch(e) {}
      }
      var pj = "{\"label\":\"" + pd.label + "\",\"mn\":\"" + pmn2 + "\",\"type\":\"" + pd.type + "\",\"value\":" + _vj(val);
      if (pd.min !== undefined) pj += ",\"min\":" + pd.min + ",\"max\":" + pd.max;
      if (pd.options) {
        var opts = [], ovals = [];
        for (var oi = 0; oi < pd.options.length; oi++) {
          opts.push("\"" + pd.options[oi] + "\"");
          ovals.push(pd.values[oi]);
        }
        pj += ",\"options\":[" + opts.join(",") + "],\"values\":[" + ovals.join(",") + "]";
      }
      pj += "}";
      prList.push(pj);
    }
    activeParts.push("{\"label\":\"" + def2.label + "\",\"gMn\":\"" + gmn2 + "\",\"props\":[" + prList.join(",") + "]}");
  }

  return "{\"snapshot\":[" + snapParts.join(",") + "],\"styles\":[" + activeParts.join(",") + "]}";
}

function applyLayerStyleCmds(cmds, matchNames, skipExisting) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  // Snapshot original selection so we can restore it
  var origSelected = [];
  for (var i = 0; i < layers.length; i++) origSelected.push(layers[i]);
  var applied = 0, skipped = 0;
  comp.openInViewer();
  return _undo("TNK: Add Layer Styles", function() {
    for (var li = 0; li < origSelected.length; li++) {
      var layer = origSelected[li];
      for (var si = 0; si < cmds.length; si++) {
        // Check skip
        if (skipExisting) {
          try {
            var ls = layer.property("ADBE Layer Styles");
            var existing = ls ? ls.property(matchNames[si]) : null;
            if (existing && existing.enabled) { skipped++; continue; }
          } catch(e) {}
        }
        // Deselect all, select only this layer, fire command
        for (var j = 0; j < comp.numLayers; j++) {
          try { comp.layer(j+1).selected = false; } catch(e) {}
        }
        layer.selected = true;
        try { app.executeCommand(cmds[si]); applied++; } catch(e) {}
      }
    }
    // Restore original selection
    for (var k = 0; k < origSelected.length; k++) {
      try { origSelected[k].selected = true; } catch(e) {}
    }
    return "Styles applied: " + applied + (skipped ? " (skipped " + skipped + ")" : "");
  });
}

function seSetProp(gMn, pMn, val) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Style Edit", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var grp = sel[i].property("ADBE Layer Styles").property(gMn);
        if (!grp || !grp.enabled) continue;
        var prop = grp.property(pMn);
        if (prop) prop.setValue(val);
      } catch(e) {}
    }
    return "ok";
  });
}

function seEnableStyle(gMn, state) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: " + (state ? "Enable" : "Disable") + " Style", function() {
    for (var i = 0; i < sel.length; i++) {
      try {
        var grp = sel[i].property("ADBE Layer Styles").property(gMn);
        if (grp) grp.enabled = !!state;
      } catch(e) {}
    }
    return state ? "Style enabled" : "Style disabled";
  });
}

function sePickColor(gMn, pMn) {
  var comp = getComp(); if (!comp) return "\"No comp\"";
  var sel = comp.selectedLayers; if (!sel.length) return "\"No layers selected\"";

  // Find first enabled layer with this style
  var targetProp = null;
  for (var i = 0; i < sel.length; i++) {
    try {
      var grp = sel[i].property("ADBE Layer Styles").property(gMn);
      if (grp && grp.enabled) {
        var p = grp.property(pMn);
        if (p) { targetProp = p; break; }
      }
    } catch(e) {}
  }
  if (!targetProp) return "\"No active style found\"";

  // Save + clear selection
  var origSelected = [];
  for (var j = 1; j <= comp.numLayers; j++) {
    try {
      if (comp.layer(j).selected) {
        origSelected.push(j);
        comp.layer(j).selected = false;
      }
    } catch(e) {}
  }

  var nullLayer = null;
  var result = "\"cancelled\"";

  try {
    nullLayer = comp.layers.addNull();
    var cp = nullLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
    var cpProp = cp.property("ADBE Color Control-0001");
    try { cpProp.setValue(targetProp.value); } catch(e) {}
    nullLayer.selected = true;
    cpProp.selected = true;
    app.executeCommand(app.findMenuCommandId("Edit Value..."));
    var newColor = cpProp.value;
    if (newColor && newColor.length >= 3) {
      result = "[" + newColor[0] + "," + newColor[1] + "," + newColor[2] + "]";
      _undo("TNK: Style Color", function() {
        for (var li = 0; li < sel.length; li++) {
          try {
            var grp2 = sel[li].property("ADBE Layer Styles").property(gMn);
            if (grp2 && grp2.enabled) {
              var p2 = grp2.property(pMn);
              if (p2) p2.setValue(newColor);
            }
          } catch(e) {}
        }
      });
    }
  } catch(e) {}

  // Always clean up
  try { if (nullLayer) nullLayer.remove(); } catch(e) {}
  for (var k = 0; k < origSelected.length; k++) {
    try { comp.layer(origSelected[k]).selected = true; } catch(e) {}
  }
  return result;
}

function seEditGradient() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  // Save original selection indices
  var origSelected = [];
  for (var j = 1; j <= comp.numLayers; j++) {
    try { if (comp.layer(j).selected) origSelected.push(j); } catch(e) {}
  }
  // Deselect all
  for (var j2 = 1; j2 <= comp.numLayers; j2++) {
    try { comp.layer(j2).selected = false; } catch(e) {}
  }
  var found = 0;
  for (var i = 0; i < sel.length; i++) {
    try {
      var grp = sel[i].property("ADBE Layer Styles").property("gradientFill/enabled");
      if (!grp || !grp.enabled) continue;
      sel[i].selected = true;
      // Select the gradient Colors sub-property (index 3 in the group)
      try {
        var gradProp = grp.property(3);
        if (gradProp) gradProp.selected = true;
      } catch(e) {}
      found++;
    } catch(e) {}
  }
  if (found > 0) {
    try { app.executeCommand(app.findMenuCommandId("Edit Value...")); } catch(e) {}
  }
  // Restore selection
  for (var k = 0; k < origSelected.length; k++) {
    try { comp.layer(origSelected[k]).selected = true; } catch(e) {}
  }
  return found > 0 ? "ok" : "No active Gradient Overlay found";
}

function seRestoreSnapshot(snapshotJSON) {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var snapshot;
  try { snapshot = eval('(' + snapshotJSON + ')'); } catch(e) { return "Bad snapshot"; }
  return _undo("TNK: Undo Style Edits", function() {
    for (var li = 0; li < sel.length && li < snapshot.length; li++) {
      var layer = sel[li];
      var snap = snapshot[li];
      if (!snap) continue;
      // Restore enabled states
      for (var rGmn in snap.enabled) {
        try {
          var grp = layer.property("ADBE Layer Styles").property(rGmn);
          if (grp) grp.enabled = snap.enabled[rGmn];
        } catch(e) {}
      }
      // Restore property values
      for (var rGmn2 in snap.props) {
        for (var rPmn in snap.props[rGmn2]) {
          try {
            var grp2 = layer.property("ADBE Layer Styles").property(rGmn2);
            if (grp2) { var p = grp2.property(rPmn); if (p) p.setValue(snap.props[rGmn2][rPmn]); }
          } catch(e) {}
        }
      }
    }
    return "Styles restored";
  });
}


// ── fn/addToRenderQueue.jsx
function addToRenderQueue() {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Add to Render Queue", function() {
    app.project.renderQueue.items.add(c);
    return "Added to render queue";
  });
}


// ── fn/quickRender.jsx
function quickRender() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  // Determine output folder next to project file
  var projFile = app.project.file;
  var outputDir;
  if (projFile) {
    outputDir = new Folder(projFile.parent.fsName + "/Quick Render");
  } else {
    outputDir = new Folder("~/Desktop/Quick Render");
  }
  if (!outputDir.exists) outputDir.create();

  return _undo("TNK: Quick Render", function() {
    // Precompose selected layers into a new comp
    var indices = [];
    for (var i = 0; i < layers.length; i++) indices.push(layers[i].index);
    // Sort ascending so precompose gets them in order
    indices.sort(function(a, b) { return a - b; });
    // Select them by index
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    for (var i = 0; i < indices.length; i++) comp.layer(indices[i]).selected = true;

    // Precompose (move all into new comp, leave in place)
    var precompName = "QR_" + comp.name;
    comp.layers.precompose(indices, precompName, true);

    // Find the new precomp
    var precomp = null;
    for (var i = 0; i < app.project.numItems; i++) {
      var item = app.project.item(i + 1);
      if (item instanceof CompItem && item.name === precompName) {
        precomp = item; break;
      }
    }
    if (!precomp) return "Precompose failed";

    // Add to render queue
    var rqi = app.project.renderQueue.items.add(precomp);
    rqi.applyTemplate("Best Settings");

    // Set output module to QuickTime + alpha
    var om = rqi.outputModule(1);
    om.applyTemplate("Lossless with Alpha");
    // Fallback: set format manually if template not found
    try {
      var omSettings = om.getSettings(GetSettingsFormat.STRING);
    } catch(e) {
      om.format = "QuickTime";
      om.includeSourceXMP = false;
    }
    try { om.channels = ChannelType.RGBA; } catch(e) {}
    try { om.videoCodec = "animation"; } catch(e) {}

    // Set output file path
    var outFile = new File(outputDir.fsName + "/" + precompName + ".mov");
    om.file = outFile;

    // Render
    app.project.renderQueue.render();

    return "Rendered: " + outFile.fsName;
  });
}


// ── fn/getCompInfo.jsx
function getCompInfo() {
  var c = getComp();
  if (!c) return JSON.stringify({name:"None",w:0,h:0,fps:0,dur:0});
  return JSON.stringify({
    name: c.name,
    w: c.width,
    h: c.height,
    fps: Math.round(c.frameRate * 100) / 100,
    dur: Math.round(c.duration * 100) / 100
  });
}


// ── fn/renameComp.jsx
function renameComp(newName, useActive) {
  var activeComp = getComp();
  if (!activeComp) return "No comp";
  if (!newName || !newName.length) return "No name provided";
  return _undo("TNK: Rename Comp", function() {
    if (useActive) {
      activeComp.name = newName;
      return "Renamed to \"" + newName + "\"";
    }
    var sel = activeComp.selectedLayers;
    var renamed = 0;
    for (var i = 0; i < sel.length; i++) {
      try {
        if (sel[i].source && sel[i].source instanceof CompItem) {
          var suffix = renamed > 0 ? " " + (renamed + 1) : "";
          sel[i].source.name = newName + suffix;
          renamed++;
        }
      } catch(e) {}
    }
    if (!renamed) {
      activeComp.name = newName;
      return "Renamed active comp to \"" + newName + "\"";
    }
    return "Renamed " + renamed + " comp" + (renamed > 1 ? "s" : "");
  });
}


// ── fn/autoTrimComp.jsx
function autoTrimComp(useActive) {
  var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Auto-Trim Comp", function() {
    var maxOut = 0;
    for (var i = 1; i <= c.numLayers; i++) {
      var lOut = c.layer(i).outPoint;
      if (lOut > maxOut) maxOut = lOut;
    }
    if (maxOut > 0) {
      c.duration = maxOut;
    } else {
      return "No layers found";
    }
    return "Comp trimmed to " + Math.round(maxOut * 100) / 100 + "s";
  });
}


// ── fn/cropComp.jsx
// cropComp — crops selected precomp layers in the active timeline.
// Uses dual-null reference system to preserve world-space position in parent comps.
// Based on CropComp v17 by user.
function cropComp(useActive, pad) {
  var proj   = app.project;
  var active = app.project.activeItem;

  // ── Collect { comp, compLayer, parentComp } targets ─────────────────────
  var targets = [];
  var seenIds = {};

  function addTarget(comp, compLayer, parentComp) {
    if (!comp || seenIds[comp.id]) return;
    seenIds[comp.id] = true;
    targets.push({ comp: comp, compLayer: compLayer, parentComp: parentComp });
  }

  // Selected layers in active timeline
  if (active instanceof CompItem) {
    for (var li = 1; li <= active.numLayers; li++) {
      var lyr = active.layer(li);
      if (!lyr.selected) continue;
      try { if (lyr.source instanceof CompItem) addTarget(lyr.source, lyr, active); } catch(e) {}
    }
  }

  // Project panel selection (no parent info available)
  for (var i = 0; i < proj.selection.length; i++) {
    if (proj.selection[i] instanceof CompItem) addTarget(proj.selection[i], null, null);
  }

  if (targets.length === 0) return "No comp layers selected";

  // ── Bbox helpers ─────────────────────────────────────────────────────────
  function getStrokeExpansion(layer, t) {
    var maxStroke = 0;
    try {
      var contents = layer.property("ADBE Root Vectors Group");
      if (!contents) return 0;
      function walkGroup(grp) {
        for (var i = 1; i <= grp.numProperties; i++) {
          var p = grp.property(i);
          if (!p) continue;
          if (p.matchName === "ADBE Vector Graphic - Stroke") {
            try { var w = p.property("ADBE Vector Stroke Width").valueAtTime(t, false); if (w > maxStroke) maxStroke = w; } catch(e) {}
          }
          if (p.matchName === "ADBE Vector Group") {
            try { walkGroup(p.property("ADBE Vectors Group")); } catch(e) {}
          }
        }
      }
      walkGroup(contents);
    } catch(e) {}
    return maxStroke / 2;
  }

  function getEffectExpansion(layer, t) {
    var expand = 0;
    try {
      var effects = layer.property("ADBE Effect Parade");
      if (!effects) return 0;
      for (var i = 1; i <= effects.numProperties; i++) {
        var fx = effects.property(i);
        if (!fx) continue;
        try {
          if (fx.matchName === "ADBE Drop Shadow") {
            var dist = fx.property("ADBE Drop Shadow-0003").valueAtTime(t, false);
            var soft = fx.property("ADBE Drop Shadow-0005").valueAtTime(t, false);
            expand = Math.max(expand, dist + soft);
          }
          if (fx.matchName === "ADBE Glow")
            expand = Math.max(expand, fx.property("ADBE Glow-0002").valueAtTime(t, false));
          if (fx.matchName === "ADBE Gaussian Blur 2")
            expand = Math.max(expand, fx.property("ADBE Gaussian Blur 2-0001").valueAtTime(t, false) * 2);
          if (fx.matchName === "ADBE Box Blur2")
            expand = Math.max(expand, fx.property("ADBE Box Blur2-0001").valueAtTime(t, false) * 2);
        } catch(e) {}
      }
    } catch(e) {}
    return expand;
  }

  function layerBbox(layer, t) {
    var xf  = layer.property("ADBE Transform Group");
    var pos = xf.property("ADBE Position").valueAtTime(t, false);
    var anc = xf.property("ADBE Anchor Point").valueAtTime(t, false);
    var scl = xf.property("ADBE Scale").valueAtTime(t, false);
    var rot = xf.property("ADBE Rotate Z").valueAtTime(t, false);
    var sx  = scl[0] / 100, sy = scl[1] / 100;
    var rad = rot * Math.PI / 180;
    var rect = null;
    try { rect = layer.sourceRectAtTime(t, false); } catch(e) {}
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    var expand = 0;
    if (layer.matchName === "ADBE Vector Layer") expand = Math.max(expand, getStrokeExpansion(layer, t));
    expand = Math.max(expand, getEffectExpansion(layer, t));

    var corners = [
      [rect.left  - expand,              rect.top    - expand],
      [rect.left  + rect.width + expand, rect.top    - expand],
      [rect.left  - expand,              rect.top    + rect.height + expand],
      [rect.left  + rect.width + expand, rect.top    + rect.height + expand]
    ];
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (var c = 0; c < corners.length; c++) {
      var lx = corners[c][0] - anc[0], ly = corners[c][1] - anc[1];
      var wx = (lx * sx) * Math.cos(rad) - (ly * sy) * Math.sin(rad) + pos[0];
      var wy = (lx * sx) * Math.sin(rad) + (ly * sy) * Math.cos(rad) + pos[1];
      if (wx < minX) minX = wx; if (wy < minY) minY = wy;
      if (wx > maxX) maxX = wx; if (wy > maxY) maxY = wy;
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  // ── Compute bounds for each target ───────────────────────────────────────
  for (var ti = 0; ti < targets.length; ti++) {
    var comp = targets[ti].comp;
    var t    = comp.time;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    var found = false;
    for (var l = 1; l <= comp.numLayers; l++) {
      var layer = comp.layer(l);
      if (!layer.active || layer.guideLayer) continue;
      if (t < layer.inPoint || t > layer.outPoint) continue;
      try {
        var bb = layerBbox(layer, t);
        if (!bb) continue;
        if (bb.minX < minX) minX = bb.minX; if (bb.minY < minY) minY = bb.minY;
        if (bb.maxX > maxX) maxX = bb.maxX; if (bb.maxY > maxY) maxY = bb.maxY;
        found = true;
      } catch(e) {}
    }
    if (!found) { targets[ti].skip = true; continue; }
    var padding = (pad && pad > 0) ? pad : 0;
    targets[ti].newLeft = Math.round(minX) - padding;
    targets[ti].newTop  = Math.round(minY) - padding;
    targets[ti].newW    = Math.round(maxX) - targets[ti].newLeft + padding;
    targets[ti].newH    = Math.round(maxY) - targets[ti].newTop  + padding;
    targets[ti].compW   = comp.width; targets[ti].compH = comp.height;
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  return _undo("TNK: Crop Comps", function() {
    var report = [];
    for (var ti2 = 0; ti2 < targets.length; ti2++) {
      var tgt = targets[ti2];
      if (tgt.skip) { report.push(tgt.comp.name + ": no bounds — skipped"); continue; }

      var comp2       = tgt.comp;
      var compLayer2  = tgt.compLayer;
      var parentComp2 = tgt.parentComp;
      var newLeft2    = tgt.newLeft, newTop2 = tgt.newTop;
      var newW2       = tgt.newW,    newH2   = tgt.newH;
      var compW2      = tgt.compW,   compH2  = tgt.compH;

      // Step 1: Outside null in parent (preserves world position)
      var outsideNull = null;
      if (compLayer2 && parentComp2) {
        outsideNull = parentComp2.layers.addNull();
        outsideNull.name = "_OUTSIDE_REF";
        var clXf = compLayer2.property("ADBE Transform Group");
        var oXf  = outsideNull.property("ADBE Transform Group");
        oXf.property("ADBE Position").setValue(clXf.property("ADBE Position").value);
        oXf.property("ADBE Scale").setValue(clXf.property("ADBE Scale").value);
        oXf.property("ADBE Rotate Z").setValue(clXf.property("ADBE Rotate Z").value);
        oXf.property("ADBE Anchor Point").setValue([0, 0]);
      }

      // Step 2: Inside null at anchor coords
      var insideNull = comp2.layers.addNull();
      insideNull.name = "_INSIDE_REF";
      var anchorInComp = [compW2 / 2, compH2 / 2];
      if (compLayer2) {
        try {
          var a = compLayer2.property("ADBE Transform Group").property("ADBE Anchor Point").value;
          anchorInComp = [a[0], a[1]];
        } catch(e) {}
      }
      insideNull.property("ADBE Transform Group").property("ADBE Position").setValue(anchorInComp);
      insideNull.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);

      // Step 3: Parent all layers to inside null
      for (var l2 = 1; l2 <= comp2.numLayers; l2++) {
        var lyr2 = comp2.layer(l2);
        if (lyr2 === insideNull) continue;
        try { lyr2.parent = insideNull; } catch(e) {}
      }

      // Step 4: Shift inside null by crop offset
      insideNull.property("ADBE Transform Group").property("ADBE Position")
        .setValue([anchorInComp[0] - newLeft2, anchorInComp[1] - newTop2]);

      // Step 5: Unparent all layers
      for (var l3 = 1; l3 <= comp2.numLayers; l3++) {
        var lyr3 = comp2.layer(l3);
        if (lyr3 === insideNull) continue;
        try { lyr3.parent = null; } catch(e) {}
      }

      // Step 6: Delete inside null + resize comp
      insideNull.remove();
      comp2.width  = newW2;
      comp2.height = newH2;

      // Step 7: Update anchor in parent to compensate for canvas shift
      if (compLayer2 && outsideNull) {
        compLayer2.property("ADBE Transform Group").property("ADBE Anchor Point")
          .setValue([anchorInComp[0] - newLeft2, anchorInComp[1] - newTop2]);
        outsideNull.remove();
      }

      report.push(comp2.name + ": " + compW2 + "x" + compH2 + " → " + newW2 + "x" + newH2);
    }
    return report.join(" | ");
  });
}


// ── fn/decomposeComp.jsx
function decomposeComp()     { return "[WIP] Decompose comp — needs implementation"; }


// ── fn/addArrowhead.jsx
// Adds arrowhead (triangle, circle, or null) to shape layer paths.
// placement: 0 = end, 1 = start, 2 = both
// size: arrowhead size in px
// typeIdx: 0 = triangle, 1 = circle, 2 = null
// doAnimate: boolean — bake position keys from trim paths or path sampling
// doParent: boolean — parent arrowhead to source layer
function addArrowhead(placement, size, typeIdx, doAnimate, doParent) {
  return _undo("TNK: Add Arrowhead", function() {
    var comp = getComp();
    if (!comp) return "No comp";
    var selLayers = comp.selectedLayers;
    if (!selLayers || selLayers.length === 0) return "Select at least one shape layer";

    placement    = parseInt(placement, 10) || 0;
    size         = parseFloat(size) || 50;
    typeIdx      = parseInt(typeIdx, 10) || 0;
    doAnimate    = (doAnimate === true || doAnimate === "true");
    doParent     = (doParent === true || doParent === "true");
    var ease1 = Number(app.settings.haveSetting("myScript", "easeInValue")  ? app.settings.getSetting("myScript", "easeInValue")  : "75");
    var ease2 = Number(app.settings.haveSetting("myScript", "easeOutValue") ? app.settings.getSetting("myScript", "easeOutValue") : "75");

    // ── helpers ──
    function _findPaths(propGroup, result) {
      for (var i = 1; i <= propGroup.numProperties; i++) {
        try {
          var p = propGroup.property(i);
          if (p.matchName === "ADBE Vector Shape - Group") {
            result.push({ pathProp: p.property("Path"), parentGroup: propGroup });
          } else if (p.numProperties !== undefined && p.numProperties > 0) {
            _findPaths(p, result);
          }
        } catch(e) {}
      }
    }

    function _findTrimPaths(parentGroup) {
      for (var i = 1; i <= parentGroup.numProperties; i++) {
        try {
          var p = parentGroup.property(i);
          if (p.matchName === "ADBE Vector Filter - Trim") return p;
        } catch(e) {}
      }
      return null;
    }

    function _getStrokeColor(parentGroup) {
      try {
        for (var i = 1; i <= parentGroup.numProperties; i++) {
          var p = parentGroup.property(i);
          if (p.matchName === "ADBE Vector Graphic - Stroke") {
            var c = p.property("Color");
            if (c) return c.value;
          }
        }
      } catch(e) {}
      return null;
    }

    function _localToWorld(srcLayer, pt) {
      var pos = srcLayer.property("Transform").property("Position").value;
      var anc = srcLayer.property("Transform").property("Anchor Point").value;
      var rot = srcLayer.property("Transform").property("Rotation").value * Math.PI / 180;
      var scl = srcLayer.property("Transform").property("Scale").value;
      var sx  = scl[0] / 100, sy = scl[1] / 100;
      var lx  = (pt[0] - anc[0]) * sx;
      var ly  = (pt[1] - anc[1]) * sy;
      return [
        pos[0] + lx * Math.cos(rot) - ly * Math.sin(rot),
        pos[1] + lx * Math.sin(rot) + ly * Math.cos(rot)
      ];
    }

    function _evalCubic(p0, c1, c2, p1, t) {
      var mt = 1 - t;
      return [
        mt*mt*mt*p0[0] + 3*mt*mt*t*c1[0] + 3*mt*t*t*c2[0] + t*t*t*p1[0],
        mt*mt*mt*p0[1] + 3*mt*mt*t*c1[1] + 3*mt*t*t*c2[1] + t*t*t*p1[1]
      ];
    }

    function _evalCubicTan(p0, c1, c2, p1, t) {
      var mt = 1 - t;
      return [
        3*mt*mt*(c1[0]-p0[0]) + 6*mt*t*(c2[0]-c1[0]) + 3*t*t*(p1[0]-c2[0]),
        3*mt*mt*(c1[1]-p0[1]) + 6*mt*t*(c2[1]-c1[1]) + 3*t*t*(p1[1]-c2[1])
      ];
    }

    function _samplePath(shape, pct) {
      var SUBDIV = 100;
      var verts = shape.vertices, inT = shape.inTangents, outT = shape.outTangents;
      var nSeg  = shape.closed ? verts.length : verts.length - 1;
      var segs  = [], total = 0;
      for (var s = 0; s < nSeg; s++) {
        var i0 = s, i1 = (s+1) % verts.length;
        var p0 = verts[i0], p1 = verts[i1];
        var c1 = [p0[0]+outT[i0][0], p0[1]+outT[i0][1]];
        var c2 = [p1[0]+inT[i1][0],  p1[1]+inT[i1][1]];
        var len = 0, prev = p0;
        for (var d = 1; d <= SUBDIV; d++) {
          var pt = _evalCubic(p0,c1,c2,p1,d/SUBDIV);
          len += Math.sqrt(Math.pow(pt[0]-prev[0],2)+Math.pow(pt[1]-prev[1],2));
          prev = pt;
        }
        segs.push({p0:p0,p1:p1,c1:c1,c2:c2,len:len});
        total += len;
      }
      var target = Math.max(0,Math.min(1,pct))*total, walked = 0;
      for (var s = 0; s < segs.length; s++) {
        if (walked+segs[s].len >= target || s === segs.length-1) {
          var tParam = segs[s].len > 0 ? Math.max(0,Math.min(1,(target-walked)/segs[s].len)) : 0;
          var seg = segs[s];
          var pos = _evalCubic(seg.p0,seg.c1,seg.c2,seg.p1,tParam);
          var tan = _evalCubicTan(seg.p0,seg.c1,seg.c2,seg.p1,tParam);
          var rotVal = (tan[0]===0&&tan[1]===0) ? 0 : Math.atan2(tan[1],tan[0])*180/Math.PI;
          return {pos:pos, rot:rotVal};
        }
        walked += segs[s].len;
      }
      return {pos:verts[verts.length-1], rot:0};
    }

    function _angleAtEnd(shape) {
      var v = shape.vertices, n = v.length;
      // use incoming tangent of last vertex (points backward along curve)
      var tang = shape.inTangents[n-1];
      if (tang[0]!==0||tang[1]!==0) return Math.atan2(-tang[1],-tang[0])*180/Math.PI;
      // fallback: direction from second-to-last to last vertex
      return Math.atan2(v[n-1][1]-v[n-2][1], v[n-1][0]-v[n-2][0])*180/Math.PI;
    }

    function _angleAtStart(shape) {
      var v = shape.vertices;
      var tang = shape.outTangents[0];
      // outgoing tangent of first vertex points forward along the path
      // flip 180 so the arrow faces back into the path
      if (tang[0]!==0||tang[1]!==0) return Math.atan2(tang[1],tang[0])*180/Math.PI + 180;
      // fallback: direction from first to second vertex, flipped
      return Math.atan2(v[1][1]-v[0][1], v[1][0]-v[0][0])*180/Math.PI + 180;
    }

    function _makeTriangleShape(sz) {
      var s       = new Shape();
      s.vertices    = [[sz,0],[0,sz*0.5],[0,-sz*0.5]];
      s.inTangents  = [[0,0],[0,0],[0,0]];
      s.outTangents = [[0,0],[0,0],[0,0]];
      s.closed      = true;
      return s;
    }

    function _makeCircleShape(sz) {
      var r  = sz * 0.5;
      var k  = r * 0.5523;
      var s  = new Shape();
      s.vertices    = [[0,-r],[r,0],[0,r],[-r,0]];
      s.inTangents  = [[-k,0],[0,-k],[k,0],[0,k]];
      s.outTangents = [[k,0],[0,k],[-k,0],[0,-k]];
      s.closed      = true;
      return s;
    }

    function _addMarkerContents(layer, sz, strokeColor) {
      var contents = layer.property("Contents");
      var newGroup = contents.addProperty("ADBE Vector Group");
      newGroup.name = "Marker";
      var gc = newGroup.property("Contents");
      var pg = gc.addProperty("ADBE Vector Shape - Group");

      if (typeIdx === 2) {
        var h = sz * 0.5;
        var sq = new Shape();
        sq.vertices    = [[-h,-h],[h,-h],[h,h],[-h,h]];
        sq.inTangents  = [[0,0],[0,0],[0,0],[0,0]];
        sq.outTangents = [[0,0],[0,0],[0,0],[0,0]];
        sq.closed      = true;
        pg.property("Path").setValue(sq);
        var stroke = gc.addProperty("ADBE Vector Graphic - Stroke");
        try {
          stroke.property("Color").setValue([1, 1, 1, 1]);
          stroke.property("Stroke Width").setValue(2);
        } catch(e) {}
        layer.label = 9;
      } else {
        pg.property("Path").setValue(
          typeIdx === 0 ? _makeTriangleShape(sz) : _makeCircleShape(sz)
        );
        var fill = gc.addProperty("ADBE Vector Graphic - Fill");
        if (typeIdx === 1) {
          try { fill.property("Color").setValue([0, 0.5, 1, 1]); } catch(e) {}
        } else if (strokeColor) {
          try { fill.property("Color").setValue(strokeColor); } catch(e) {}
        }
      }
    }

    function _addArrowLayer(srcLayer, pathProp, parentGroup, sz, strokeColor, atEnd) {
      var typeName  = ["Triangle", "Circle", "Null"][typeIdx];
      var label     = "Arrow - " + typeName + " - " + (atEnd ? "End" : "Start");
      var newLayer  = comp.layers.addShape();
      newLayer.name  = label;
      newLayer.label = 3;
      newLayer.startTime = srcLayer.startTime;
      newLayer.inPoint   = srcLayer.inPoint;
      newLayer.outPoint  = srcLayer.outPoint;

      _addMarkerContents(newLayer, sz, strokeColor);

      if (doParent) newLayer.parent = srcLayer;

      var transform = newLayer.property("Transform");
      var posProp   = transform.property("Position");
      var rotProp   = transform.property("Rotation");
      var shape     = pathProp.value;
      var fps       = comp.frameRate;

      // static
      if (!doAnimate) {
        var pt  = atEnd ? shape.vertices[shape.vertices.length-1] : shape.vertices[0];
        var rot = atEnd ? _angleAtEnd(shape) : _angleAtStart(shape);
        var worldPt = doParent ? pt : _localToWorld(srcLayer, pt);
        posProp.setValue(worldPt);
        rotProp.setValue(rot);
        return;
      }

      // animated
      var trim     = _findTrimPaths(parentGroup);
      var trimProp = trim ? trim.property(atEnd ? "End" : "Start") : null;

      function _applyEasing(prop) {
        var nk = prop.numKeys;
        if (nk < 2) return;
        var easeIn  = new KeyframeEase(0, ease1);
        var easeOut = new KeyframeEase(0, ease2);
        // first key: ease out only
        try { prop.setTemporalEaseAtKey(1, [easeIn], [easeOut]); } catch(e) {}
        // last key: ease in only
        try { prop.setTemporalEaseAtKey(nk, [easeIn], [easeOut]); } catch(e) {}
      }

      if (trimProp && trimProp.numKeys > 0) {
        var bakeStart = trimProp.keyTime(1);
        var bakeEnd   = trimProp.keyTime(trimProp.numKeys);
        for (var t = bakeStart; t <= bakeEnd + 0.0001; t += 1/fps) {
          var pct     = trimProp.valueAtTime(t, false) / 100;
          var pr      = _samplePath(shape, pct);
          var worldPt = doParent ? pr.pos : _localToWorld(srcLayer, pr.pos);
          posProp.setValueAtTime(t, worldPt);
        }
        for (var k = 1; k <= posProp.numKeys; k++) {
          try { posProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); } catch(e) {}
        }
        _applyEasing(posProp);
      } else {
        var tStart   = srcLayer.inPoint;
        var nFrames  = Math.round(fps);
        var n        = shape.vertices.length;
        var vertexFrames = {};
        for (var vi = 0; vi < n; vi++) {
          var pct = atEnd ? (vi / (n-1)) : (1 - vi / (n-1));
          vertexFrames[Math.round(pct * nFrames)] = true;
        }
        for (var i = 0; i <= nFrames; i++) {
          var pct     = atEnd ? (i / nFrames) : (1 - i / nFrames);
          var pr      = _samplePath(shape, pct);
          var worldPt = doParent ? pr.pos : _localToWorld(srcLayer, pr.pos);
          posProp.setValueAtTime(tStart + i / fps, worldPt);
        }
        for (var k = 1; k <= posProp.numKeys; k++) {
          posProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        }
        _applyEasing(posProp);
        for (var i = 0; i <= nFrames; i++) {
          var kIdx = i + 1;
          if (vertexFrames[i]) try { posProp.setLabelAtKey(kIdx, 2); } catch(e) {}
          if (i > 0 && i < nFrames) try { posProp.setRovingAtKey(kIdx, true); } catch(e) {}
        }
      }

      try { newLayer.autoOrient = AutoOrientType.ALONG_PATH; } catch(e) {}
    }

    // ── main loop ──
    var count = 0;
    for (var li = 0; li < selLayers.length; li++) {
      var layer = selLayers[li];
      if (!(layer instanceof ShapeLayer)) continue;
      var paths = [];
      _findPaths(layer.property("Contents"), paths);
      if (paths.length === 0) continue;
      for (var pi = 0; pi < paths.length; pi++) {
        var pathProp    = paths[pi].pathProp;
        var parentGroup = paths[pi].parentGroup;
        var shape       = pathProp.value;
        if (!shape.vertices || shape.vertices.length < 2) continue;
        var strokeColor = _getStrokeColor(parentGroup);
        if (placement === 0 || placement === 2) { _addArrowLayer(layer, pathProp, parentGroup, size, strokeColor, true);  count++; }
        if (placement === 1 || placement === 2) { _addArrowLayer(layer, pathProp, parentGroup, size, strokeColor, false); count++; }
      }
    }

    return count > 0 ? "Arrowhead" + (count > 1 ? "s" : "") + " added (" + count + ")" : "No valid paths found";
  });
}


// ── fn/getFollowPathInfo.jsx
// Returns JSON with the last selected layer's name and all paths found on it.
function getFollowPathInfo() {
  var comp = getComp();
  if (!comp) return JSON.stringify({ error: "No comp" });
  var sel = comp.selectedLayers;
  if (!sel || sel.length < 2) return JSON.stringify({ error: "Select layers to follow + a path layer (last selected)" });

  var pathLayer = sel[sel.length - 1];
  if (!(pathLayer instanceof ShapeLayer)) return JSON.stringify({ error: "Last selected layer must be a shape layer" });

  function _findPathsInfo(propGroup, result, prefix) {
    for (var i = 1; i <= propGroup.numProperties; i++) {
      try {
        var p = propGroup.property(i);
        if (p.matchName === "ADBE Vector Shape - Group") {
          var name = prefix ? prefix + " > " + p.name : p.name;
          result.push({ name: name, index: result.length });
        } else if (p.numProperties !== undefined && p.numProperties > 0) {
          var sub = prefix ? prefix + " > " + p.name : p.name;
          _findPathsInfo(p, result, sub);
        }
      } catch(e) {}
    }
  }

  var paths = [];
  _findPathsInfo(pathLayer.property("Contents"), paths, "");
  if (paths.length === 0) return JSON.stringify({ error: "No paths found on \"" + pathLayer.name + "\"" });

  return JSON.stringify({
    layerName: pathLayer.name,
    layerIndex: pathLayer.index,
    followerCount: sel.length - 1,
    paths: paths
  });
}


// ── fn/followPath.jsx
// Bakes position keyframes for selected layers (except last) along a path on the last selected layer.
// pathIdx: which path to follow (0-based index among found paths)
// doAnimate: bake animated keys or static placement
// doParent: parent followers to path layer
// spacing: "equal" or "sequential"
function followPath(pathIdx, doAnimate, doParent) {
  return _undo("TNK: Follow Path", function() {
    var comp = getComp();
    if (!comp) return "No comp";
    var sel = comp.selectedLayers;
    if (!sel || sel.length < 2) return "Select layers to follow + a path layer (last selected)";

    var pathLayer = sel[sel.length - 1];
    if (!(pathLayer instanceof ShapeLayer)) return "Last selected layer must be a shape layer";

    pathIdx   = parseInt(pathIdx, 10) || 0;
    doAnimate = (doAnimate === true || doAnimate === "true");
    doParent  = (doParent === true || doParent === "true");

    var inTime = Number(app.settings.haveSetting("myScript", "inValue")     ? app.settings.getSetting("myScript", "inValue")     : "1");
    var ease1  = Number(app.settings.haveSetting("myScript", "easeInValue") ? app.settings.getSetting("myScript", "easeInValue") : "75");
    var ease2  = Number(app.settings.haveSetting("myScript", "easeOutValue")? app.settings.getSetting("myScript", "easeOutValue"): "75");

    // find all paths on the path layer
    function _findPaths(propGroup, result) {
      for (var i = 1; i <= propGroup.numProperties; i++) {
        try {
          var p = propGroup.property(i);
          if (p.matchName === "ADBE Vector Shape - Group") {
            result.push({ pathProp: p.property("Path"), parentGroup: propGroup });
          } else if (p.numProperties !== undefined && p.numProperties > 0) {
            _findPaths(p, result);
          }
        } catch(e) {}
      }
    }

    var allPaths = [];
    _findPaths(pathLayer.property("Contents"), allPaths);
    if (allPaths.length === 0) return "No paths on path layer";
    if (pathIdx >= allPaths.length) pathIdx = 0;

    var pathProp = allPaths[pathIdx].pathProp;
    var parentGroup = allPaths[pathIdx].parentGroup;
    var shape = pathProp.value;
    if (!shape.vertices || shape.vertices.length < 2) return "Path has fewer than 2 vertices";

    function _localToWorld(srcLayer, pt) {
      var pos = srcLayer.property("Transform").property("Position").value;
      var anc = srcLayer.property("Transform").property("Anchor Point").value;
      var rot = srcLayer.property("Transform").property("Rotation").value * Math.PI / 180;
      var scl = srcLayer.property("Transform").property("Scale").value;
      var sx  = scl[0] / 100, sy = scl[1] / 100;
      var lx  = (pt[0] - anc[0]) * sx;
      var ly  = (pt[1] - anc[1]) * sy;
      return [
        pos[0] + lx * Math.cos(rot) - ly * Math.sin(rot),
        pos[1] + lx * Math.sin(rot) + ly * Math.cos(rot)
      ];
    }

    function _evalCubic(p0, c1, c2, p1, t) {
      var mt = 1 - t;
      return [
        mt*mt*mt*p0[0] + 3*mt*mt*t*c1[0] + 3*mt*t*t*c2[0] + t*t*t*p1[0],
        mt*mt*mt*p0[1] + 3*mt*mt*t*c1[1] + 3*mt*t*t*c2[1] + t*t*t*p1[1]
      ];
    }

    function _samplePath(sh, pct) {
      var SUBDIV = 100;
      var verts = sh.vertices, inT = sh.inTangents, outT = sh.outTangents;
      var nSeg  = sh.closed ? verts.length : verts.length - 1;
      var segs  = [], total = 0;
      for (var s = 0; s < nSeg; s++) {
        var i0 = s, i1 = (s+1) % verts.length;
        var p0 = verts[i0], p1 = verts[i1];
        var c1 = [p0[0]+outT[i0][0], p0[1]+outT[i0][1]];
        var c2 = [p1[0]+inT[i1][0],  p1[1]+inT[i1][1]];
        var len = 0, prev = p0;
        for (var d = 1; d <= SUBDIV; d++) {
          var pt = _evalCubic(p0,c1,c2,p1,d/SUBDIV);
          len += Math.sqrt(Math.pow(pt[0]-prev[0],2)+Math.pow(pt[1]-prev[1],2));
          prev = pt;
        }
        segs.push({p0:p0,p1:p1,c1:c1,c2:c2,len:len});
        total += len;
      }
      var target = Math.max(0,Math.min(1,pct))*total, walked = 0;
      for (var s = 0; s < segs.length; s++) {
        if (walked+segs[s].len >= target || s === segs.length-1) {
          var tParam = segs[s].len > 0 ? Math.max(0,Math.min(1,(target-walked)/segs[s].len)) : 0;
          var seg = segs[s];
          return _evalCubic(seg.p0,seg.c1,seg.c2,seg.p1,tParam);
        }
        walked += segs[s].len;
      }
      return verts[verts.length-1];
    }

    // find trim paths for animated mode
    function _findTrimPaths(pg) {
      for (var i = 1; i <= pg.numProperties; i++) {
        try {
          var p = pg.property(i);
          if (p.matchName === "ADBE Vector Filter - Trim") return p;
        } catch(e) {}
      }
      return null;
    }

    function _applyEasing(prop) {
      var nk = prop.numKeys;
      if (nk < 2) return;
      var eIn  = new KeyframeEase(0, ease1);
      var eOut = new KeyframeEase(0, ease2);
      try { prop.setTemporalEaseAtKey(1, [eIn], [eOut]); } catch(e) {}
      try { prop.setTemporalEaseAtKey(nk, [eIn], [eOut]); } catch(e) {}
    }

    var followers = [];
    for (var i = 0; i < sel.length - 1; i++) followers.push(sel[i]);
    var nFollow = followers.length;
    var fps = comp.frameRate;

    for (var fi = 0; fi < nFollow; fi++) {
      var fLayer = followers[fi];
      if (doParent) fLayer.parent = pathLayer;

      var posProp = fLayer.property("Transform").property("Position");

      if (!doAnimate) {
        var pt  = _samplePath(shape, 0);
        var worldPt = doParent ? pt : _localToWorld(pathLayer, pt);
        posProp.setValue(worldPt);
        try { fLayer.autoOrient = AutoOrientType.ALONG_PATH; } catch(e) {}
      } else {
        // bake from layer inPoint over inTime duration, identical for every layer
        var tStart  = fLayer.inPoint;
        var nFrames = Math.round(inTime * fps);
        if (nFrames < 1) nFrames = 1;
        var n = shape.vertices.length;

        // map vertex indices to frame indices for labeling
        var vertexFrames = {};
        for (var vi = 0; vi < n; vi++) {
          vertexFrames[Math.round((vi / (n - 1)) * nFrames)] = true;
        }

        for (var j = 0; j <= nFrames; j++) {
          var pct     = j / nFrames;
          var pt      = _samplePath(shape, pct);
          var worldPt = doParent ? pt : _localToWorld(pathLayer, pt);
          posProp.setValueAtTime(tStart + j / fps, worldPt);
        }

        var nk = posProp.numKeys;
        for (var k = 1; k <= nk; k++) {
          try { posProp.setInterpolationTypeAtKey(k, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER); } catch(e) {}
        }
        _applyEasing(posProp);
        for (var j = 0; j <= nFrames; j++) {
          var kIdx = j + 1;
          if (vertexFrames[j]) try { posProp.setLabelAtKey(kIdx, 2); } catch(e) {}
          if (j > 0 && j < nFrames) try { posProp.setRovingAtKey(kIdx, true); } catch(e) {}
        }
        try { fLayer.autoOrient = AutoOrientType.ALONG_PATH; } catch(e) {}
      }
    }

    return nFollow + " layer" + (nFollow > 1 ? "s" : "") + " now following path";
  });
}


// ── fn/openProber.jsx
function openProber() {

  function valueTypeLabel(pvt) {
    var m = {};
    m[PropertyValueType.NO_VALUE]        = "NO_VALUE";
    m[PropertyValueType.ThreeD_SPATIAL]  = "ThreeD_SPATIAL";
    m[PropertyValueType.ThreeD]          = "ThreeD";
    m[PropertyValueType.TwoD_SPATIAL]    = "TwoD_SPATIAL";
    m[PropertyValueType.TwoD]            = "TwoD";
    m[PropertyValueType.OneD]            = "OneD";
    m[PropertyValueType.COLOR]           = "COLOR";
    m[PropertyValueType.CUSTOM_VALUE]    = "CUSTOM_VALUE";
    m[PropertyValueType.MARKER]          = "MARKER";
    m[PropertyValueType.LAYER_INDEX]     = "LAYER_INDEX";
    m[PropertyValueType.MASK_INDEX]      = "MASK_INDEX";
    m[PropertyValueType.SHAPE]           = "SHAPE";
    m[PropertyValueType.TEXT_DOCUMENT]   = "TEXT_DOCUMENT";
    return m[pvt] != null ? m[pvt] : String(pvt);
  }

  function propertyTypeLabel(pt) {
    if (pt === PropertyType.PROPERTY)      return "PROPERTY";
    if (pt === PropertyType.INDEXED_GROUP) return "INDEXED_GROUP";
    if (pt === PropertyType.NAMED_GROUP)   return "NAMED_GROUP";
    return String(pt);
  }

  function layerType(layer) {
    if (layer instanceof TextLayer)   return "TextLayer";
    if (layer instanceof ShapeLayer)  return "ShapeLayer";
    if (layer instanceof CameraLayer) return "CameraLayer";
    if (layer instanceof LightLayer)  return "LightLayer";
    if (layer instanceof AVLayer)     return "AVLayer";
    return "Layer";
  }

  function formatValue(prop) {
    try {
      var v = prop.value, t = prop.propertyValueType;
      if (t === PropertyValueType.COLOR) {
        return "[R:" + v[0].toFixed(3) + " G:" + v[1].toFixed(3) +
               " B:" + v[2].toFixed(3) + " A:" + v[3].toFixed(3) + "]";
      }
      if (t === PropertyValueType.TEXT_DOCUMENT) {
        return "TextDocument(\"" + String(v.text).replace(/\r|\n/g, "\\n") + "\")";
      }
      if (t === PropertyValueType.MARKER) {
        return "MarkerValue(\"" + (v.comment || "") + "\")";
      }
      if (t === PropertyValueType.SHAPE) {
        return "Shape(verts:" + v.vertices.length + " closed:" + v.closed + ")";
      }
      if (t === PropertyValueType.CUSTOM_VALUE) return "<custom>";
      if (t === PropertyValueType.NO_VALUE)     return "<no value>";
      if (v instanceof Array) {
        var parts = [];
        for (var i = 0; i < v.length; i++) {
          parts.push(typeof v[i] === "number" ? v[i].toFixed(3) : String(v[i]));
        }
        return "[" + parts.join(", ") + "]";
      }
      if (typeof v === "number") return v.toFixed(3);
      return String(v);
    } catch (e) {
      return "<unreadable: " + e.toString() + ">";
    }
  }

  function buildPath(prop) {
    var parts = [], p = prop;
    while (p && p.parentProperty) {
      parts.unshift('.property("' + p.matchName + '")');
      p = p.parentProperty;
    }
    return parts.join("");
  }

  function walkProperty(prop, depth, maxDepth, lines, showValues) {
    var pad = "";
    for (var i = 0; i < depth; i++) pad += "  ";
    var header = pad + "[" + propertyTypeLabel(prop.propertyType) + "] " +
                 '"' + prop.name + '"  (' + prop.matchName + ')';
    if (prop.propertyType === PropertyType.PROPERTY) {
      header += "  <" + valueTypeLabel(prop.propertyValueType) + ">";
      if (showValues && prop.propertyValueType !== PropertyValueType.NO_VALUE) {
        header += "  =  " + formatValue(prop);
      }
      if (prop.canSetExpression && prop.expressionEnabled) header += "  [EXPR]";
      if (prop.numKeys && prop.numKeys > 0) header += "  [" + prop.numKeys + " keys]";
    }
    lines.push(header);
    if (depth >= maxDepth) {
      if (prop.numProperties && prop.numProperties > 0) {
        lines.push(pad + "  ...(truncated at max depth)");
      }
      return;
    }
    if (prop.numProperties) {
      for (var j = 1; j <= prop.numProperties; j++) {
        walkProperty(prop.property(j), depth + 1, maxDepth, lines, showValues);
      }
    }
  }

  function buildReport(opts) {
    var out = [];
    var comp = app.project.activeItem;
    out.push("=========================================");
    out.push("  TNK PROPERTY PROBER");
    out.push("  " + new Date().toString());
    out.push("=========================================");

    if (!(comp && comp instanceof CompItem)) {
      out.push("No active composition.");
      return out.join("\n");
    }

    out.push('Comp: "' + comp.name + '"  ' +
             comp.width + "x" + comp.height + "  " +
             comp.frameRate.toFixed(2) + "fps  " +
             comp.duration.toFixed(2) + "s");
    out.push("Active Item ID: " + comp.id);
    out.push("Selected Layers: " + comp.selectedLayers.length);
    out.push("");

    if (comp.selectedLayers.length === 0) {
      out.push("(no layers selected — select at least one layer and Refresh)");
      return out.join("\n");
    }

    for (var i = 0; i < comp.selectedLayers.length; i++) {
      var layer = comp.selectedLayers[i];
      out.push("─────────────────────────────────────────");
      out.push("LAYER [" + layer.index + "]: \"" + layer.name + "\"");
      out.push("  runtime type: " + layerType(layer));
      out.push("  matchName:    " + layer.matchName);
      out.push("  enabled:      " + layer.enabled +
               "   locked: " + layer.locked +
               "   shy: " + layer.shy +
               "   3D: " + (layer.threeDLayer === true));
      out.push("  inPoint:      " + layer.inPoint.toFixed(3) +
               "s   outPoint: " + layer.outPoint.toFixed(3) + "s");
      out.push("  path:         app.project.activeItem.layer(" + layer.index + ")");
      out.push("");

      if (opts.mode !== "tree") {
        var selProps = layer.selectedProperties;
        out.push("  SELECTED PROPERTIES (" + selProps.length + "):");
        if (selProps.length === 0) {
          out.push("    (none — click a property in the timeline to include it)");
        } else {
          for (var s = 0; s < selProps.length; s++) {
            var sp = selProps[s];
            out.push("    • \"" + sp.name + "\"  (" + sp.matchName + ")");
            out.push("        propertyType:      " + propertyTypeLabel(sp.propertyType));
            if (sp.propertyType === PropertyType.PROPERTY) {
              out.push("        propertyValueType: " + valueTypeLabel(sp.propertyValueType));
              if (opts.showValues && sp.propertyValueType !== PropertyValueType.NO_VALUE) {
                out.push("        value:             " + formatValue(sp));
              }
              if (sp.numKeys > 0) out.push("        keyframes:         " + sp.numKeys);
              if (sp.canSetExpression && sp.expressionEnabled) {
                out.push("        expression:        ENABLED");
              }
            }
            out.push("        path:              layer" + buildPath(sp));
          }
        }
        out.push("");
      }

      if (opts.mode !== "selection") {
        out.push("  FULL PROPERTY TREE (maxDepth=" + opts.maxDepth + "):");
        var treeLines = [];
        for (var k = 1; k <= layer.numProperties; k++) {
          walkProperty(layer.property(k), 0, opts.maxDepth, treeLines, opts.showValues);
        }
        for (var t = 0; t < treeLines.length; t++) out.push("    " + treeLines[t]);
        out.push("");
      }
    }
    return out.join("\n");
  }

  var win = new Window("palette", "TNK Property Prober", undefined,
                       {resizeable: true, closeButton: true});
  win.orientation = "column";
  win.alignChildren = ["fill", "fill"];
  win.spacing = 6;
  win.margins = 10;

  var ctrls = win.add("group");
  ctrls.orientation = "row";
  ctrls.alignChildren = ["left", "center"];
  ctrls.add("statictext", undefined, "Mode:");
  var modePanel = ctrls.add("group");
  modePanel.orientation = "row";
  var rbSel  = modePanel.add("radiobutton", undefined, "Selection");
  var rbTree = modePanel.add("radiobutton", undefined, "Full Tree");
  var rbBoth = modePanel.add("radiobutton", undefined, "Both");
  rbBoth.value = true;
  ctrls.add("statictext", undefined, "   Max depth:");
  var depthInput = ctrls.add("edittext", undefined, "6");
  depthInput.characters = 3;
  var cbValues = ctrls.add("checkbox", undefined, "Show values");
  cbValues.value = true;

  var btnRow = win.add("group");
  btnRow.orientation = "row";
  btnRow.alignChildren = ["left", "center"];
  var btnRefresh = btnRow.add("button", undefined, "Refresh (F5)");
  var btnCopy    = btnRow.add("button", undefined, "Copy All");
  var btnClear   = btnRow.add("button", undefined, "Clear");
  var statusTxt  = btnRow.add("statictext", undefined, "", {multiline: false});
  statusTxt.characters = 40;

  var output = win.add("edittext", undefined, "",
                       {multiline: true, scrolling: true, readonly: false});
  output.preferredSize = [720, 520];
  try { output.graphics.font = ScriptUI.newFont("Consolas", "Regular", 11); } catch (e) {}

  function currentOpts() {
    var mode = rbSel.value ? "selection" : (rbTree.value ? "tree" : "both");
    var depth = parseInt(depthInput.text, 10);
    if (isNaN(depth) || depth < 0) depth = 6;
    return { mode: mode, maxDepth: depth, showValues: cbValues.value };
  }

  function refresh() {
    try {
      output.text = buildReport(currentOpts());
      var now = new Date();
      statusTxt.text = "Refreshed  " + now.getHours() + ":" +
                       ("0" + now.getMinutes()).slice(-2) + ":" +
                       ("0" + now.getSeconds()).slice(-2);
    } catch (e) {
      output.text = "ERROR: " + e.toString() + "\n" + (e.stack || "");
      statusTxt.text = "Error";
    }
  }

  btnRefresh.onClick = refresh;
  btnClear.onClick   = function () { output.text = ""; statusTxt.text = "Cleared"; };
  btnCopy.onClick    = function () {
    try {
      var txt = output.text.replace(/\r\n/g, "\n");
      var tmp = new File(Folder.temp.fsName + "/tnk_prober_clip.txt");
      tmp.encoding = "UTF-8";
      tmp.open("w"); tmp.write(txt); tmp.close();
      if ($.os.indexOf("Windows") !== -1) {
        system.callSystem('cmd.exe /c clip < "' + tmp.fsName + '"');
      } else {
        system.callSystem('bash -c "pbcopy < \'' + tmp.fsName + '\'"');
      }
      tmp.remove();
      statusTxt.text = "Copied " + txt.length + " chars to clipboard";
    } catch (e) {
      statusTxt.text = "Copy failed: " + e.toString();
    }
  };

  win.addEventListener("keydown", function (k) {
    if (k.keyName === "F5") refresh();
  });
  win.onResizing = win.onResize = function () { this.layout.resize(); };

  refresh();
  win.center();
  win.show();
  return "Prober open";
}


// ── fn/ffxToBinary.jsx
function ffxToBinary() {
  var f = File.openDialog("Pick an .ffx file", "FFX:*.ffx");
  if (!f) return "Cancelled";

  f.encoding = "BINARY";
  f.open("e");
  var binary = f.read().toSource();
  f.close();

  var dlg = new Window("dialog", "FFX → Binary String");
  dlg.orientation = "column";
  dlg.alignChildren = ["fill", "fill"];
  dlg.margins = 10;

  dlg.add("statictext", undefined,
          decodeURI(f.name) + "   (" + binary.length + " chars)");

  var out = dlg.add("edittext", undefined, binary,
                    { multiline: true, scrolling: true, readonly: true });
  out.preferredSize = [680, 420];
  try { out.graphics.font = ScriptUI.newFont("Consolas", "Regular", 11); } catch(e) {}

  var btns = dlg.add("group"); btns.alignment = "right";
  var copyBtn  = btns.add("button", undefined, "Copy");
  var closeBtn = btns.add("button", undefined, "Close", { name: "cancel" });
  var status   = dlg.add("statictext", undefined, "");
  status.characters = 40;

  copyBtn.onClick = function () {
    try {
      var tmp = new File(Folder.temp.fsName + "/tnk_ffx_bin.txt");
      tmp.encoding = "UTF-8";
      tmp.open("w"); tmp.write(binary); tmp.close();
      if ($.os.indexOf("Windows") !== -1) {
        system.callSystem('cmd.exe /c clip < "' + tmp.fsName + '"');
      } else {
        system.callSystem('bash -c "pbcopy < \'' + tmp.fsName + '\'"');
      }
      tmp.remove();
      status.text = "Copied " + binary.length + " chars to clipboard";
    } catch (e) {
      status.text = "Copy failed: " + e.toString();
    }
  };
  closeBtn.onClick = function () { dlg.close(); };

  dlg.show();
  return "FFX binary shown";
}
