function selectAtPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Select at Playhead", function() {
    var t = comp.time; var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.inPoint <= t && l.outPoint >= t) { l.selected = true; count++; }
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " selected at playhead";
  });
}
