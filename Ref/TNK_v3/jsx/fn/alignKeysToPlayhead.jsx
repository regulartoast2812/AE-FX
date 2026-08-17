function _alignKeys(anchor, target) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var layerGroups = [];
  for (var li = 0; li < layers.length; li++) {
    var layer = layers[li];
    var allData = [];
    var props = layer.selectedProperties;
    for (var pi = 0; pi < props.length; pi++) {
      var prop = props[pi];
      if (!prop.canVaryOverTime || !prop.numKeys) continue;
      var sk = prop.selectedKeys;
      for (var ki = 0; ki < sk.length; ki++) {
        var k = sk[ki];
        var eIn = null, eOut = null;
        try { eIn = prop.keyInTemporalEase(k); eOut = prop.keyOutTemporalEase(k); } catch(e) {}
        var lbl = 0; try { if (prop.getLabelAtKey) lbl = prop.getLabelAtKey(k); } catch(e) {}
        allData.push({ prop: prop, time: prop.keyTime(k), value: prop.keyValue(k), eIn: eIn, eOut: eOut, label: lbl });
      }
    }
    if (!allData.length) continue;
    allData.sort(function(a, b) { return a.time - b.time; });
    var anchorTime = (anchor === "first") ? allData[0].time : allData[allData.length-1].time;
    var targetTime;
    if      (target === "playhead") targetTime = comp.time;
    else if (target === "layerIn")  targetTime = layer.inPoint;
    else if (target === "layerOut") targetTime = layer.outPoint;
    layerGroups.push({ layer: layer, allData: allData, delta: targetTime - anchorTime });
  }
  if (!layerGroups.length) return "No selected keyframes found";
  return _undo("TNK: Align Keys", function() {
    for (var g = 0; g < layerGroups.length; g++) {
      var lg = layerGroups[g]; var delta = lg.delta;
      var propMap = [];
      for (var i = 0; i < lg.allData.length; i++) {
        var entry = lg.allData[i]; var found = false;
        for (var m = 0; m < propMap.length; m++) { if (propMap[m].prop === entry.prop) { propMap[m].keys.push(entry); found = true; break; } }
        if (!found) propMap.push({ prop: entry.prop, keys: [entry] });
      }
      for (var m = 0; m < propMap.length; m++) {
        var prop = propMap[m].prop; var keys = propMap[m].keys;
        keys.sort(function(a, b) { return b.time - a.time; });
        for (var k = 0; k < keys.length; k++) { try { prop.removeKey(prop.nearestKeyIndex(keys[k].time)); } catch(e) {} }
        keys.sort(function(a, b) { return a.time - b.time; });
        for (var k = 0; k < keys.length; k++) {
          var d = keys[k]; var newTime = d.time + delta;
          try {
            prop.setValueAtTime(newTime, d.value);
            var ni = prop.nearestKeyIndex(newTime);
            if (d.eIn && d.eOut) try { prop.setTemporalEaseAtKey(ni, d.eIn, d.eOut); } catch(e) {}
          } catch(e) {}
        }
      }
    }
    var labels = { first: "first key", last: "last key" };
    var targets = { playhead: "playhead", layerIn: "layer in", layerOut: "layer out" };
    return "Aligned " + labels[anchor] + " to " + targets[target];
  });
}
function alignKeysToPlayhead()      { return _alignKeys("first", "playhead"); }
function alignLastKeyToPlayhead()   { return _alignKeys("last",  "playhead"); }
function alignFirstKeyToLayerIn()   { return _alignKeys("first", "layerIn");  }
function alignLastKeyToLayerOut()   { return _alignKeys("last",  "layerOut"); }
