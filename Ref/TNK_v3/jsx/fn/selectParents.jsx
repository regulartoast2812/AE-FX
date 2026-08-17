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
