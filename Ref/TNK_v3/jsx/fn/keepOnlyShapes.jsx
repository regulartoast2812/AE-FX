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
