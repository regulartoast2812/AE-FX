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
