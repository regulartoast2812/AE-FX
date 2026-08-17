// selectParents — add the parent layer of each selected layer to the selection
function selectParents() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Select Parents", function() {
    var toSelect = {};
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].parent) toSelect[layers[i].parent.index] = true;
    }
    for (var idx in toSelect) comp.layer(parseInt(idx)).selected = true;
    return "Parents selected";
  });
}

// selectChildren — select all layers parented to any selected layer
function selectChildren() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Select Children", function() {
    var parentIndices = {};
    for (var i = 0; i < layers.length; i++) parentIndices[layers[i].index] = true;
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (layer.parent && parentIndices[layer.parent.index]) layer.selected = true;
    }
    return "Children selected";
  });
}

// addDashesToStroke — toggle dashes on selected shape layer strokes
function addDashesToStroke() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Add Dashes", function() {
    function processProp(prop) {
      for (var i = 1; i <= prop.numProperties; i++) {
        var p = prop.property(i);
        if (p.matchName === "ADBE Vector Stroke" || p.matchName === "ADBE Vector Graphic - Stroke") {
          // Find or add Dashes group
          var dashes = null;
          try { dashes = p.property("ADBE Vector Stroke Dashes"); } catch(e) {}
          if (dashes) {
            if (dashes.numProperties === 0) {
              // Add a dash
              dashes.addProperty("ADBE Vector Stroke Dash 1");
              try { dashes.addProperty("ADBE Vector Stroke Gap 1"); } catch(e) {}
            }
          }
        }
        if (p.numProperties) processProp(p);
      }
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      processProp(layer.property("Contents"));
    }
    return "Dashes added";
  });
}

// setInMarker — place IN marker at playhead on selected layers, remove any existing IN marker first
function setInMarker() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  var t = comp.time;
  return _undo("TNK: Set IN Marker", function() {
    for (var i = 0; i < layers.length; i++) {
      var markers = layers[i].property("Marker");
      // Remove backwards to avoid index shift — check both "IN" and "_IN"
      for (var m = markers.numKeys; m >= 1; m--) {
        var c = markers.keyValue(m).comment;
        if (c === "IN" || c === "_IN" || c === "in") markers.removeKey(m);
      }
      var mv = new MarkerValue("");
      mv.comment = "IN";
      markers.setValueAtTime(t, mv);
    }
    return "IN marker set";
  });
}

// setOutMarker — place OUT marker at playhead on selected layers, remove any existing OUT marker
function setOutMarker() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  var t = comp.time;
  return _undo("TNK: Set OUT Marker", function() {
    for (var i = 0; i < layers.length; i++) {
      var markers = layers[i].property("Marker");
      for (var m = markers.numKeys; m >= 1; m--) {
        var c = markers.keyValue(m).comment;
        if (c === "OUT" || c === "_OUT" || c === "out") markers.removeKey(m);
      }
      var mv = new MarkerValue("");
      mv.comment = "OUT";
      markers.setValueAtTime(t, mv);
    }
    return "OUT marker set";
  });
}

// toggleAllMarkerProtection — toggle protected zone on ALL comp markers at once
function toggleAllMarkerProtection() {
  var comp = getComp(); if (!comp) return "No comp";
  var markers = comp.markerProperty;
  if (markers.numKeys === 0) return "No comp markers";
  return _undo("TNK: Toggle All Marker Protection", function() {
    // Check first marker to determine toggle direction
    var firstProtected = markers.keyValue(1).protectedRegion;
    for (var i = 1; i <= markers.numKeys; i++) {
      var mv = markers.keyValue(i);
      mv.protectedRegion = !firstProtected;
      markers.setValueAtKey(i, mv);
    }
    return "All marker protection toggled";
  });
}

// deleteUnnamedMarkers — delete markers with no comment on selected layers
function deleteUnnamedMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete Unnamed Markers", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      var markers = layers[i].property("Marker");
      for (var m = markers.numKeys; m >= 1; m--) {
        var mv = markers.keyValue(m);
        if (!mv.comment || mv.comment === "") {
          markers.removeKey(m);
          count++;
        }
      }
    }
    return count + " unnamed marker" + (count !== 1 ? "s" : "") + " deleted";
  });
}

// deleteAllLayerMarkers — delete all markers from selected layers
function deleteAllLayerMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Layer Markers", function() {
    for (var i = 0; i < layers.length; i++) {
      var markers = layers[i].property("Marker");
      for (var m = markers.numKeys; m >= 1; m--) markers.removeKey(m);
    }
    return "All layer markers deleted";
  });
}

// deleteAllMarkersEverywhere — delete comp markers AND all layer markers
function deleteAllMarkersEverywhere() {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Delete All Markers", function() {
    var cm = comp.markerProperty;
    for (var m = cm.numKeys; m >= 1; m--) cm.removeKey(m);
    for (var i = 1; i <= comp.numLayers; i++) {
      var lm = comp.layer(i).property("Marker");
      for (var m = lm.numKeys; m >= 1; m--) lm.removeKey(m);
    }
    return "All markers deleted";
  });
}

// (ported from Layer_Marker_Count.jsx)
function countLayerMarkers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var allMarkers = [];
  return _undo("TNK: Count Layer Markers", function() {
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var t = mp.keyTime(i);
        if (t >= sel[j].inPoint && t <= sel[j].outPoint)
          allMarkers.push({ layer: sel[j], time: t, keyIndex: i });
      }
    }
    allMarkers.sort(function(a, b) { return a.time - b.time; });
    for (var m = 0; m < allMarkers.length; m++) {
      var entry = allMarkers[m];
      var markerProp = entry.layer.property("Marker");
      var existing = markerProp.keyValue(entry.keyIndex);
      var nv = new MarkerValue(String(m + 1));
      nv.duration = existing.duration; nv.chapter = existing.chapter;
      nv.url = existing.url; nv.frameTarget = existing.frameTarget;
      nv.cuePointName = existing.cuePointName; nv.params = existing.params;
      markerProp.setValueAtKey(entry.keyIndex, nv);
    }
    return "Numbered " + allMarkers.length + " marker" + (allMarkers.length !== 1 ? "s" : "");
  });
}

// (ported from Layer_Marker_Clear_Number.jsx)
function clearLayerMarkerNumbers() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  var count = 0;
  return _undo("TNK: Clear Marker Numbers", function() {
    for (var j = 0; j < sel.length; j++) {
      var mp = sel[j].property("Marker");
      for (var i = 1; i <= mp.numKeys; i++) {
        var existing = mp.keyValue(i);
        if (!/^\d+$/.test(existing.comment)) continue;
        var nv = new MarkerValue("");
        nv.duration = existing.duration; nv.chapter = existing.chapter;
        nv.url = existing.url; nv.frameTarget = existing.frameTarget;
        nv.cuePointName = existing.cuePointName; nv.params = existing.params;
        mp.setValueAtKey(i, nv);
        count++;
      }
    }
    return "Cleared " + count + " number" + (count !== 1 ? "s" : "");
  });
}

// fullPurge — delete effects / keyframes / expressions / reset labels on selected layers
function fullPurge(doFx, doKeys, doExpr, doLabels) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Full Purge", function() {
    function clearKeys(prop) {
      if (prop.numKeys) while (prop.numKeys > 0) prop.removeKey(1);
      if (prop.numProperties) for (var i = 1; i <= prop.numProperties; i++) clearKeys(prop.property(i));
    }
    function clearExpr(prop) {
      if (prop.canSetExpression) prop.expression = "";
      if (prop.numProperties) for (var i = 1; i <= prop.numProperties; i++) clearExpr(prop.property(i));
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (doFx) {
        var fx = layer.property("Effects");
        while (fx && fx.numProperties > 0) fx.property(1).remove();
      }
      if (doKeys)   clearKeys(layer);
      if (doExpr)   clearExpr(layer);
      if (doLabels) layer.label = 0;
    }
      return "Purged: " + (parts.join(", ") || "nothing");
});
  var parts = [];
  if (doFx) parts.push("effects");
  if (doKeys) parts.push("keyframes");
  if (doExpr) parts.push("expressions");
  if (doLabels) parts.push("labels");
  return "Purged: " + (parts.join(", ") || "nothing");
}
