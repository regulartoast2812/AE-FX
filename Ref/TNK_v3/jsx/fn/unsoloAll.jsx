function unsoloAll() {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Unsolo All", function() {
    for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
    return "All layers unsoloed";
  });
}
