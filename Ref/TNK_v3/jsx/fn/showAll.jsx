function showAll() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Show All", function() {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).enabled = true;
    return "All layers shown";
  });
}
