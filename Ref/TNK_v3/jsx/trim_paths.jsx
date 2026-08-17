// ── TRIM PATHS ───────────────────────────────────────────────────────────────

function trimPathsIn(inTime, ease1, ease2) {
    var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Trim Paths In", function() {
    var layers = comp.selectedLayers;
    var easeIn = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
  
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trimPaths = contents.property("ADBE Vector Filter - Trim");
      if (!trimPaths) trimPaths = contents.addProperty("ADBE Vector Filter - Trim");
  
      var end = trimPaths.property("End");
      while (end.numKeys > 0) end.removeKey(1);
  
      var startTime = layer.inPoint;
      var endTime = startTime + inTime;
      end.setValueAtTime(startTime, 0);
      end.setValueAtTime(endTime, 100);
      end.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      end.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
    }
      return count + " trim path(s) in applied";
  });
  comp.openInViewer();
  return "Trim Paths In applied";
}

function trimPathsOut(outTime, ease1, ease2) {
    var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Trim Paths Out", function() {
    var layers = comp.selectedLayers;
    var easeIn = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
  
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trimPaths = contents.property("ADBE Vector Filter - Trim");
      if (!trimPaths) trimPaths = contents.addProperty("ADBE Vector Filter - Trim");
  
      var start = trimPaths.property("Start");
      while (start.numKeys > 0) start.removeKey(1);
  
      var startTime = layer.outPoint - outTime;
      var endTime = layer.outPoint;
      start.setValueAtTime(startTime, 0);
      start.setValueAtTime(endTime, 100);
      start.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      start.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
    }
      return count + " trim path(s) out applied";
  });
  comp.openInViewer();
  return "Trim Paths Out applied";
}

function trimPathsInOut(inTime, outTime, ease1, ease2) {
    var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Trim Paths In+Out", function() {
    var layers = comp.selectedLayers;
    var easeIn = new KeyframeEase(0, ease1);
    var easeOut = new KeyframeEase(0, ease2);
  
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      if (!(layer instanceof ShapeLayer)) continue;
      var contents = layer.property("Contents");
      var trimPaths = contents.property("ADBE Vector Filter - Trim");
      if (!trimPaths) trimPaths = contents.addProperty("ADBE Vector Filter - Trim");
  
      var end = trimPaths.property("End");
      var start = trimPaths.property("Start");
      while (end.numKeys > 0) end.removeKey(1);
      while (start.numKeys > 0) start.removeKey(1);
  
      // Trim In — End: 0→100
      var inStart = layer.inPoint;
      var inEnd = inStart + inTime;
      end.setValueAtTime(inStart, 0);
      end.setValueAtTime(inEnd, 100);
      end.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      end.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
  
      // Trim Out — Start: 0→100
      var outStart = layer.outPoint - outTime;
      var outEnd = layer.outPoint;
      start.setValueAtTime(outStart, 0);
      start.setValueAtTime(outEnd, 100);
      start.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
      start.setTemporalEaseAtKey(2, [easeIn], [easeOut]);
    }
      return count + " trim path(s) in+out applied";
  });
  comp.openInViewer();
  return "Trim Paths In+Out applied";
}




function applyGrain() {
  return _undo("TNK: Grain", function() {
    var layers = getSelectedLayers();
    for (var i = 0; i < layers.length; i++) {
      var fx = layers[i].property("Effects");
      fx.addProperty("ADBE Add Grain");
    }
    return "Grain applied";
  });
}

// ── ANIMATION IN / OUT ───────────────────────────────────────────────────────
