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
