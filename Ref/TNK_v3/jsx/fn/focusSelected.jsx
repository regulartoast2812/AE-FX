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
