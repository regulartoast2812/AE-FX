function unlockAtPlayhead() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Unlock at Playhead", function() {
    var t = comp.time; var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.locked && l.inPoint <= t && l.outPoint >= t) { l.locked = false; count++; }
    }
    return count + " layer" + (count !== 1 ? "s" : "") + " unlocked";
  });
}
