// createProtectedMarker(colorIndex, comment, isProtected)
// Spans selected keyframes if any; falls back to layer in/out range.
// Places marker on comp timeline.
function createProtectedMarker(colorIndex, comment, isProtected) {
  var c = getComp(); if (!c) return "No comp";
  var selectedLayers = getSelectedLayers();
  if (!selectedLayers || !selectedLayers.length) return "No layers selected";

  var startTime = Infinity, endTime = -Infinity;
  var foundKeys = false;

  // 1. Try selected keyframes first
  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i];
    var props = layer.selectedProperties;
    if (props && props.length > 0) {
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (prop.propertyType === PropertyType.INDEXED_GROUP ||
            prop.propertyType === PropertyType.NAMED_GROUP) continue;
        var keys = prop.selectedKeys;
        if (!keys || !keys.length) continue;
        foundKeys = true;
        for (var k = 0; k < keys.length; k++) {
          var t = prop.keyTime(keys[k]);
          if (t < startTime) startTime = t;
          if (t > endTime)   endTime   = t;
        }
      }
    }
  }

  // 2. Fallback: use layer in/out range
  if (!foundKeys) {
    for (var i = 0; i < selectedLayers.length; i++) {
      if (selectedLayers[i].inPoint  < startTime) startTime = selectedLayers[i].inPoint;
      if (selectedLayers[i].outPoint > endTime)   endTime   = selectedLayers[i].outPoint;
    }
  }

  if (startTime === Infinity) return "Could not determine range";

  // If start === end (single key or zero-length), place a point marker
  var duration = (endTime > startTime) ? (endTime - startTime) : 0;

  return _undo("TNK: Create Marker", function() {
    var marker          = new MarkerValue(comment || "");
    marker.duration     = duration;
    marker.label        = colorIndex || 0;
    marker.protectedRegion = (isProtected === true || isProtected === "true");
    c.markerProperty.setValueAtTime(startTime, marker);
    var msg = (comment ? '"' + comment + '" ' : '') + 'marker';
    if (duration > 0) msg += ' (' + Math.round(duration * 100) / 100 + 's)';
    if (isProtected) msg += ' [protected]';
    return msg + ' created';
  });
}
