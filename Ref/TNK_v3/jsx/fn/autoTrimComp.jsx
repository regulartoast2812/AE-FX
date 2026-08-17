function autoTrimComp(useActive) {
  var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Auto-Trim Comp", function() {
    var maxOut = 0;
    for (var i = 1; i <= c.numLayers; i++) {
      var lOut = c.layer(i).outPoint;
      if (lOut > maxOut) maxOut = lOut;
    }
    if (maxOut > 0) {
      c.duration = maxOut;
    } else {
      return "No layers found";
    }
    return "Comp trimmed to " + Math.round(maxOut * 100) / 100 + "s";
  });
}
