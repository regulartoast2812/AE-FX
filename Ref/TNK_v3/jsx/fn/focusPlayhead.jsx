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
