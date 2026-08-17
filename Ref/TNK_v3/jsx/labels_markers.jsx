// ── LABELS & MARKERS ─────────────────────────────────────────────────────────

// Normal click — relabel selected layers
function labelLayers(colorIndex) {
  var c = getComp();
  if (!c) return "No comp";
  var layers = getSelectedLayers();
  if (layers.length === 0) return "No layers selected";
  return _undo("TNK: Label Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].label = colorIndex;
    return "Layers labeled";
  });
}

// Shift+click — relabel selected keyframes
function labelKeyframes(colorIndex) {
  var c = getComp();
  if (!c) return "No comp";
  var myKeys = c.selectedProperties;
  if (!myKeys || myKeys.length === 0) return "No keyframes selected";
  return _undo("TNK: Label Keyframes", function() {
    for (var i = 0; i < myKeys.length; i++) {
      var prop = myKeys[i];
      if (prop.propertyType == PropertyType.INDEXED_GROUP ||
          prop.propertyType == PropertyType.NAMED_GROUP) continue;
      var selectedKeys = prop.selectedKeys;
      for (var k = 0; k < selectedKeys.length; k++) {
        try { prop.setLabelAtKey(selectedKeys[k], colorIndex); } catch(e) {}
      }
    }
    return "Keyframes labeled";
  });
}

// Ctrl+click — create protected marker spanning selected layers/keys
function createProtectedMarker(colorIndex, comment, isProtected) {
  var c = getComp();
  if (!c) return "No comp";
  var selectedLayers = getSelectedLayers();
  if (!selectedLayers || selectedLayers.length === 0) return "No layers selected";

  var startTime = Infinity;
  var endTime = -Infinity;

  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i];
    var props = layer.selectedProperties;
    var hasKeys = false;
    if (props && props.length > 0) {
      for (var p = 0; p < props.length; p++) {
        var prop = props[p];
        if (prop.propertyType == PropertyType.INDEXED_GROUP ||
            prop.propertyType == PropertyType.NAMED_GROUP) continue;
        var keys = prop.selectedKeys;
        if (!keys || keys.length === 0) continue;
        hasKeys = true;
        for (var k = 0; k < keys.length; k++) {
          var t = prop.keyTime(keys[k]);
          if (t < startTime) startTime = t;
          if (t > endTime) endTime = t;
        }
      }
    }
    if (!hasKeys) {
      if (layer.inPoint < startTime) startTime = layer.inPoint;
      if (layer.outPoint > endTime) endTime = layer.outPoint;
    }
  }

  if (startTime === Infinity || endTime === -Infinity) return "Could not determine range";

  return _undo("TNK: Create Marker", function() {
    var marker = new MarkerValue(comment || "");
    marker.duration = endTime - startTime;
    marker.label = colorIndex;
    marker.protectedRegion = (isProtected === true || isProtected === "true");
    c.markerProperty.setValueAtTime(startTime, marker);
    return "Marker created";
  });
}

// Alt+click — recolor existing marker at playhead
function recolorMarkerAtPlayhead(colorIndex) {
  var c = getComp();
  if (!c) return "No comp";
  var currentTime = c.time;
  var markers = c.markerProperty;
  for (var i = 1; i <= markers.numKeys; i++) {
    var markerTime = markers.keyTime(i);
    var markerValue = markers.keyValue(i);
    var markerEnd = markerTime + markerValue.duration;
    if (currentTime >= markerTime && currentTime <= markerEnd) {
      markerValue.label = colorIndex;
      markers.setValueAtTime(markerTime, markerValue);
      return "Marker recolored";
    }
  }
  return "No marker at playhead";
}

function addMarker(label) {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Add Marker", function() {
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      var m = new MarkerValue(label || "");
      layers[0].property("Marker").setValueAtTime(c.time, m);
    } else {
      var m = new MarkerValue(label || "");
      c.markerProperty.setValueAtTime(c.time, m);
    }
    return "Marker added";
  });
}

function addColoredMarker(colorIndex) {
  var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Add Colored Marker", function() {
    var m = new MarkerValue("");
    m.label = colorIndex || 0;
    var layers = getSelectedLayers();
    if (layers.length > 0) {
      layers[0].property("Marker").setValueAtTime(c.time, m);
    } else {
      c.markerProperty.setValueAtTime(c.time, m);
    }
    return "Marker added";
  });
}

// ── TRIM PATHS ───────────────────────────────────────────────────────────────
