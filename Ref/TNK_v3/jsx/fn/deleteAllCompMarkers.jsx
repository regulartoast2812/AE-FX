function deleteAllCompMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Delete Comp Markers", function() {
    var mp = comp.markerProperty;
    for (var i = mp.numKeys; i >= 1; i--) mp.removeKey(i);
    return "All comp markers deleted";
  });
}
