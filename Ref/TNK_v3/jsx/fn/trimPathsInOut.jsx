function trimPathsInOut(params) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var inTime  = params ? (params.inTime  || 1)  : 1;
  var outTime = params ? (params.outTime || 1)  : 1;
  var ei      = params ? (params.easeIn  || 75) : 75;
  var eo      = params ? (params.easeOut || 75) : 75;
  return _undo("TNK: Trim Paths In+Out", function() {
    var eIn = new KeyframeEase(0, ei), eOut = new KeyframeEase(0, eo);
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trim = contents.property("ADBE Vector Filter - Trim");
      if (!trim) trim = contents.addProperty("ADBE Vector Filter - Trim");
      var end = trim.property("End"), start = trim.property("Start");
      while (end.numKeys   > 0) end.removeKey(1);
      while (start.numKeys > 0) start.removeKey(1);
      end.setValueAtTime(layer.inPoint, 0);          end.setValueAtTime(layer.inPoint + inTime, 100);
      end.setTemporalEaseAtKey(1,[eIn],[eOut]);       end.setTemporalEaseAtKey(2,[eIn],[eOut]);
      start.setValueAtTime(layer.outPoint - outTime, 0); start.setValueAtTime(layer.outPoint, 100);
      start.setTemporalEaseAtKey(1,[eIn],[eOut]);     start.setTemporalEaseAtKey(2,[eIn],[eOut]);
      count++;
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " — trim in+out applied";
  });
}
