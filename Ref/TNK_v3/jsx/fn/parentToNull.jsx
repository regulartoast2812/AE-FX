function parentToNull() {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "Select layers first";
  return _undo("TNK: Parent to Null", function() {
    var sumX = 0, sumY = 0;
    for (var i = 0; i < selected.length; i++) {
      var pos = selected[i].property("Position");
      if (pos) { var v = pos.valueAtTime(c.time, false); sumX += v[0]; sumY += v[1]; }
    }
    var earliest = selected[0].inPoint, latest = selected[0].outPoint;
    for (var i = 1; i < selected.length; i++) {
      if (selected[i].inPoint  < earliest) earliest = selected[i].inPoint;
      if (selected[i].outPoint > latest)   latest   = selected[i].outPoint;
    }
    var topIndex = selected[0].index;
    for (var i = 1; i < selected.length; i++) { if (selected[i].index < topIndex) topIndex = selected[i].index; }
    var nullLayer = c.layers.addNull();
    nullLayer.name = "TNK_NULL"; nullLayer.label = 9;
    nullLayer.property("Position").setValue([sumX / selected.length, sumY / selected.length]);
    nullLayer.inPoint  = earliest;
    nullLayer.outPoint = latest;
    nullLayer.moveBefore(c.layer(topIndex + 1));
    for (var i = 0; i < selected.length; i++) selected[i].parent = nullLayer;
    return "Parented to null";
  });
}
