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
