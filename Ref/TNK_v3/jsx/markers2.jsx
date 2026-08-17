
function cloneKeyframes(flip) {
  var comp = getComp();
  if (!comp) return "No comp";
  // Pre-scan for selected keys BEFORE opening undo group
  var layers = comp.selectedLayers;
  var firstKeyTime = null, lastKeyTime = null;
  for (var k = 0; k < layers.length; k++) {
    var props = layers[k].selectedProperties;
    for (var j = 0; j < props.length; j++) {
      var prop = props[j];
      if (prop && prop.canVaryOverTime) {
        var sk = prop.selectedKeys;
        if (sk.length > 0) {
          var ft = prop.keyTime(sk[0]), lt = prop.keyTime(sk[sk.length - 1]);
          if (firstKeyTime === null || ft < firstKeyTime) firstKeyTime = ft;
          if (lastKeyTime === null || lt > lastKeyTime) lastKeyTime = lt;
        }
      }
    }
  }
  if (firstKeyTime === null) return "No keyframes selected";
  return _undo("TNK: " + (flip ? "Clone & Flip" : "Clone") + " Keyframes", function() {
    for (var k = 0; k < layers.length; k++) {
      var props = layers[k].selectedProperties;
      for (var j = 0; j < props.length; j++) {
        var prop = props[j];
        if (prop && prop.canVaryOverTime) {
          var sk = prop.selectedKeys.slice();
          if (sk.length > 0) {
            var newKf = [];
            for (var i = 0; i < sk.length; i++) {
              var kt = prop.keyTime(sk[i]), kv = prop.keyValue(sk[i]);
              var lbl = 0;
              try { if (prop.getLabelAtKey) lbl = prop.getLabelAtKey(sk[i]); } catch(e) {}
              var offset = kt - firstKeyTime;
              var newTime = flip ? comp.time + (lastKeyTime - kt) : comp.time + offset;
              newKf.push({ time: newTime, value: kv, label: lbl });
            }
            for (var i = 0; i < newKf.length; i++) {
              prop.setValueAtTime(newKf[i].time, newKf[i].value);
              if (newKf[i].label) {
                try {
                  var ni = prop.nearestKeyIndex(newKf[i].time);
                  if (prop.setLabelAtKey) prop.setLabelAtKey(ni, newKf[i].label);
                } catch(e) {}
              }
            }
          }
        }
      }
    }
    comp.openInViewer();
    return flip ? "Keyframes cloned & flipped" : "Keyframes cloned";
  });
}

function applyLoopExpression(type) {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: Loop " + type, function() {
    var layers = comp.selectedLayers;
    for (var j = 0; j < layers.length; j++) {
      var props = layers[j].selectedProperties;
      for (var i = 0; i < props.length; i++) {
        if (props[i].canSetExpression) {
          props[i].expression = "loopOut(type='" + type + "', numKeyframes=0)";
        }
      }
    }
    return "Loop (" + type + ") applied";
  });
}

function setContinuousRoving(enable) {
  var comp = getComp();
  if (!comp) return "No comp";
  return _undo("TNK: " + (enable ? "Enable" : "Disable") + " Continuous Keyframes", function() {
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (prop.propertyType === PropertyType.PROPERTY && prop.canVaryOverTime) {
        for (var j = 1; j <= prop.numKeys; j++) prop.setRovingAtKey(j, enable);
      }
    }
    return "Continuous roving " + (enable ? "on" : "off");
  });
}

function deleteAllKeyframes() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Keyframes", function() {
    function clearKeys(prop) {
      if (!prop) return;
      // Skip groups — recurse into them
      if (prop.propertyType === PropertyType.INDEXED_GROUP ||
          prop.propertyType === PropertyType.NAMED_GROUP) {
        for (var p = 1; p <= prop.numProperties; p++) {
          try { clearKeys(prop.property(p)); } catch(e) {}
        }
        return;
      }
      if (prop.numKeys > 0) {
        try {
          var midT = comp.time;
          var midV = prop.valueAtTime(midT, true);
          while (prop.numKeys > 0) prop.removeKey(1);
          try { prop.setValue(midV); } catch(e) {}
        } catch(e) {}
      }
    }
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      for (var j = 1; j <= layer.numProperties; j++) {
        try { clearKeys(layer.property(j)); } catch(e) {}
      }
    }
    return "All keyframes deleted";
  });
}

// ── EFFECTS & EXPRESSIONS ─────────────────────────────────────────────────────
