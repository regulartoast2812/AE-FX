// ── VISIBILITY TOGGLES ────────────────────────────────────────────────────
// toggleVisibility — uses layer.enabled (the eye icon), NOT shy
function toggleVisibility() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Visibility", function() {
    // if any are visible (enabled), hide all. If all hidden, show all.
    var anyVisible = false;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].enabled) { anyVisible = true; break; }
    }
    for (var i = 0; i < layers.length; i++) layers[i].enabled = !anyVisible;
    return anyVisible ? "Layers hidden" : "Layers shown";
  });
}

function showAll() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Show All", function() {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).enabled = true;
    return "All layers shown";
  });
}

function toggleLockSelected() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Toggle Lock", function() {
    var anyUnlocked = false;
    for (var i = 0; i < layers.length; i++) if (!layers[i].locked) { anyUnlocked = true; break; }
    for (var i = 0; i < layers.length; i++) layers[i].locked = anyUnlocked;
    return anyUnlocked ? "Layers locked" : "Layers unlocked";
  });
}

function soloSelected(exclusive) {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "No layers selected";
  return _undo("TNK: Solo Selected", function() {
    if (exclusive) {
      for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
    }
    var anyNotSoloed = false;
    for (var i = 0; i < selected.length; i++) if (!selected[i].solo) { anyNotSoloed = true; break; }
    for (var i = 0; i < selected.length; i++) selected[i].solo = anyNotSoloed;
    return anyNotSoloed ? "Soloed" : "Unsoloed";
  });
}

// soloFocusToggle — if any selected layer is not soloed, solo+focus all.
// If all are already soloed, unsolo everything and restore work area.
function soloFocusToggle() {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "No layers selected";
  return _undo("TNK: Solo+Focus Toggle", function() {
    var anyNotSoloed = false;
    for (var i = 0; i < selected.length; i++) if (!selected[i].solo) { anyNotSoloed = true; break; }
    if (anyNotSoloed) {
      // Solo+Focus: unsolo all, then solo+focus selected
      for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
      for (var i = 0; i < selected.length; i++) selected[i].solo = true;
      // Focus: set work area to span of selected layers
      var earliest = selected[0].inPoint;
      var latest   = selected[0].outPoint;
      for (var i = 1; i < selected.length; i++) {
        if (selected[i].inPoint  < earliest) earliest = selected[i].inPoint;
        if (selected[i].outPoint > latest)   latest   = selected[i].outPoint;
      }
      c.workAreaStart    = earliest;
      c.workAreaDuration = latest - earliest;
    } else {
      // Unsolo+Unfocus: clear all solos, restore full work area
      for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
      c.workAreaStart    = 0;
      c.workAreaDuration = c.duration;
    }
    return anyNotSoloed ? "Solo + Focus" : "Unsolo + Unfocus";
  });
}

// selectAtPlayhead — select all layers whose in/out range overlaps current time
function selectAtPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  var count = 0;
  return _undo("TNK: Select at Playhead", function() {
    var t = comp.time;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      var hits = (l.inPoint <= t && l.outPoint > t);
      l.selected = hits;
      if (hits) count++;
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " selected at playhead";
  });
}

// ── APPLY GLOW ────────────────────────────────────────────────────────────
