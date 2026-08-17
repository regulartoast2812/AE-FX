function createNull() {
  var c = getComp(); if (!c) return "No comp";
  return _undo("TNK: Create Null", function() {
    var n = c.layers.addNull(); n.name = "TNK_NULL";
    return "Null created";
  });
}
