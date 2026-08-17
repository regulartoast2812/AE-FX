// ── LAYER MANAGEMENT ─────────────────────────────────────────────────────────

function trimToKeyframes() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Trim to Keyframes", function() {
    function scanProperty(prop, state) {
      if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
          var t = prop.keyTime(k);
          if (state.earliest === null || t < state.earliest) state.earliest = t;
          if (state.latest === null || t > state.latest) state.latest = t;
        }
      }
      if (prop.numProperties > 0) {
        for (var j = 1; j <= prop.numProperties; j++) scanProperty(prop.property(j), state);
      }
    }
    for (var i = 0; i < layers.length; i++) {
      var state = { earliest: null, latest: null };
      scanProperty(layers[i], state);
      if (state.earliest !== null) {
        layers[i].inPoint = state.earliest;
        layers[i].outPoint = state.latest;
      }
    }
    return "Trimmed to keyframes";
  });
}

function hideSelected() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Hide Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = false;
    return "Layers hidden";
  });
}

function showSelected() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Show Layers", function() {
    for (var i = 0; i < layers.length; i++) layers[i].enabled = true;
    return "Layers shown";
  });
}

function applyTrackMatte(mode) {
  // Ported directly from Prep.jsxbin source logic:
  // For each content layer:
  //   1. Move matte layer directly above that content layer
  //   2. Set trackMatteType = ALPHA (now matte is directly above = correct)
  //   3. Optionally set parent / blendingMode
  // Then move all content layers back above the matte (restoring stack order)
  // Finally unhide + deselect the matte.
  //
  // mode: 'matte' | 'matte_parent' | 'matte_blend' | 'break'
  var comp = getComp();
  if (!comp) return "No comp";
  var sel = comp.selectedLayers;
  if (sel.length < 2) return "Select at least 2 layers";

  if (mode === 'break') {
    return _undo("TNK: Break Matte", function() {
      for (var i = 0; i < sel.length; i++) {
        sel[i].trackMatteType = TrackMatteType.NO_TRACK_MATTE;
      }
      return "Matte removed";
    });
  }

  return _undo("TNK: Track Matte", function() {
    var lastLayer = sel[sel.length - 1]; // matte layer

    // Step 1: for each content layer, leapfrog matte above it, then wire matte
    for (var i = 0; i < sel.length - 1; i++) {
      var layer = sel[i];
      lastLayer.moveBefore(layer);         // matte goes directly above this content layer
      layer.trackMatteType = TrackMatteType.ALPHA; // now the layer directly above is the matte
      if (mode === 'matte_parent') layer.parent = lastLayer;
      if (mode === 'matte_blend')  layer.blendingMode = BlendingMode.ADD;
    }

    // Step 2: move all content layers back above the matte (original relative order preserved)
    for (var i = 0; i < sel.length - 1; i++) {
      sel[i].moveBefore(lastLayer);
    }

    lastLayer.enabled = true;
    lastLayer.selected = false;

    return "Track matte applied";
  });
}

function breakMatte() {
  return applyTrackMatte('break');
}

function focusSelected() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Focus Mode", function() {
    var hasShyLayers = false;
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).shy) { hasShyLayers = true; break; }
    }
    if (hasShyLayers) {
      for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).shy = false;
      comp.hideShyLayers = false;
    } else {
      var hasSelected = false;
      for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).selected) { hasSelected = true; break; }
      }
      if (hasSelected) {
        for (var i = 1; i <= comp.numLayers; i++) {
          if (!comp.layer(i).selected) comp.layer(i).shy = true;
        }
        comp.hideShyLayers = true;
      }
    }
      return "Focus mode toggled";
});
  comp.openInViewer();
  return "Focus mode toggled";
}

function focusPlayhead() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Focus Playhead", function() {
    var t = comp.time;
    var hasShyLayers = false;
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).shy) { hasShyLayers = true; break; }
    }
    if (hasShyLayers) {
      for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).shy = false;
      comp.hideShyLayers = false;
    } else {
      for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
      for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layer(i);
        if (l.inPoint <= t && l.outPoint >= t) l.selected = true;
      }
      for (var i = 1; i <= comp.numLayers; i++) {
        if (!comp.layer(i).selected) comp.layer(i).shy = true;
      }
      comp.hideShyLayers = true;
    }
      return "Focus playhead";
});
  comp.openInViewer();
  return "Focus playhead";
}

function staggerLayers(fromBottom) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Stagger Layers", function() {
    var stagger = 0.1;
    layers.sort(function(a, b) { return fromBottom ? b.index - a.index : a.index - b.index; });
    for (var i = 0; i < layers.length; i++) layers[i].startTime = layers[i].startTime + (i * stagger);
    return "Layers staggered";
  });
}

function pullToPlayhead(fromOutPoint) {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Pull to Playhead", function() {
    var refLayer = layers[0];
    for (var i = 1; i < layers.length; i++) {
      if (fromOutPoint) { if (layers[i].outPoint > refLayer.outPoint) refLayer = layers[i]; }
      else { if (layers[i].inPoint < refLayer.inPoint) refLayer = layers[i]; }
    }
    var diff = comp.time - (fromOutPoint ? refLayer.outPoint : refLayer.inPoint);
    for (var i = 0; i < layers.length; i++) layers[i].startTime += diff;
    return "Layers pulled to playhead";
  });
}

function filterTextLayers() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Filter Text Layers", function() {
    var sel = comp.selectedLayers;
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i] instanceof TextLayer) sel[i].selected = true;
    }
    return "Text layers filtered";
  });
}

// Keep only Shape layers from selection (deselect all others)
function keepOnlyShapes() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Keep Only Shapes", function() {
    var sel = comp.selectedLayers;
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    var kept = 0;
    for (var i = 0; i < sel.length; i++) {
      if (sel[i] instanceof ShapeLayer) { sel[i].selected = true; kept++; }
    }
    return kept > 0 ? "Kept " + kept + " shape layer" + (kept > 1 ? "s" : "") : "No shape layers in selection";
  });
}

// Keep only image/footage layers from selection (AVLayer with bitmap/movie source, not precomps or audio-only)
function keepOnlyImages() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Keep Only Images", function() {
    var sel = comp.selectedLayers;
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    var kept = 0;
    for (var i = 0; i < sel.length; i++) {
      var layer = sel[i];
      // Must be AVLayer (not text, shape, camera, light, null)
      if (layer instanceof TextLayer || layer instanceof ShapeLayer) continue;
      try { if (layer instanceof CameraLayer || layer instanceof LightLayer) continue; } catch(e) {}
      if (layer.nullLayer) continue;
      // Must have a footage source (not a comp)
      try {
        var src = layer.source;
        if (!src) continue;
        if (src instanceof CompItem) continue; // skip precomps
        // Accept FootageItem with a non-audio main source
        if (src instanceof FootageItem) {
          if (!layer.hasVideo) continue; // skip audio-only
          layer.selected = true;
          kept++;
        }
      } catch(e) {}
    }
    return kept > 0 ? "Kept " + kept + " image/footage layer" + (kept > 1 ? "s" : "") : "No image layers in selection";
  });
}

function unlockAtPlayhead() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Unlock at Playhead", function() {
    var t = comp.time;
    for (var i = 1; i <= comp.numLayers; i++) {
      var l = comp.layer(i);
      if (l.inPoint <= t && l.outPoint >= t) l.locked = false;
    }
    return "Layers at playhead unlocked";
  });
}

// ── MARKERS ───────────────────────────────────────────────────────────────────

function layerMarkersToComp() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Layer Markers to Comp", function() {
    var layers = comp.selectedLayers;
    var allTimes = [];
    for (var j = 0; j < layers.length; j++) {
      var m = layers[j].property("Marker");
      for (var i = 1; i <= m.numKeys; i++) {
        var kt = m.keyTime(i);
        if (kt >= layers[j].inPoint && kt <= layers[j].outPoint) allTimes.push(kt);
      }
    }
    allTimes.sort(function(a, b) { return a - b; });
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    for (var i = 0; i < allTimes.length; i++) {
      comp.markerProperty.setValueAtTime(allTimes[i], new MarkerValue(i + 1));
    }
    return "Markers transferred to comp";
  });
}

// renameLayerMarkers — rename existing markers on selected layers in-place
// Markers on each layer are numbered sequentially 1..N with the given prefix
function renameLayerMarkers(prefix) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var total = 0;
  return _undo("TNK: Rename Markers", function() {
    for (var j = 0; j < layers.length; j++) {
      var m = layers[j].property("Marker");
      for (var i = 1; i <= m.numKeys; i++) {
        var mv = m.keyValue(i);
        mv.comment = prefix ? (prefix + " " + i) : String(i);
        m.setValueAtKey(i, mv);
        total++;
      }
    }
    return total + " marker" + (total !== 1 ? "s" : "") + " renamed";
  });
}

function deleteAllCompMarkers() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Delete Comp Markers", function() {
    for (var i = comp.markerProperty.numKeys; i >= 1; i--) comp.markerProperty.removeKey(i);
    return "All comp markers deleted";
  });
}

function toggleMarkerProtection() {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Toggle Marker Protected", function() {
    var t = comp.time;
    var markers = comp.markerProperty;
    for (var i = 1; i <= markers.numKeys; i++) {
      var marker = markers.keyValue(i);
      var mt = markers.keyTime(i);
      if (marker.duration > 0 && t >= mt && t <= mt + marker.duration) {
        marker.protectedRegion = !marker.protectedRegion;
        markers.setValueAtKey(i, marker);
      }
    }
    return "Marker protection toggled";
  });
}

// ── KEYFRAME TOOLS ────────────────────────────────────────────────────────────
