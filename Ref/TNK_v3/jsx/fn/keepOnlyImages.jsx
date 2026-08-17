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
