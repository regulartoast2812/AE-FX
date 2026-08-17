function cloneKeyframes(flip) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  var firstKeyTime = null, lastKeyTime = null;
  for (var k = 0; k < layers.length; k++) {
    var props = layers[k].selectedProperties;
    for (var j = 0; j < props.length; j++) {
      var prop = props[j];
      if (prop && prop.canVaryOverTime) {
        var sk = prop.selectedKeys;
        if (sk.length > 0) {
          var ft = prop.keyTime(sk[0]), lt = prop.keyTime(sk[sk.length-1]);
          if (firstKeyTime === null || ft < firstKeyTime) firstKeyTime = ft;
          if (lastKeyTime  === null || lt > lastKeyTime)  lastKeyTime  = lt;
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
          if (!sk.length) continue;
          var newKf = [];
          for (var i = 0; i < sk.length; i++) {
            var kt = prop.keyTime(sk[i]), kv = prop.keyValue(sk[i]), lbl = 0;
            try { if (prop.getLabelAtKey) lbl = prop.getLabelAtKey(sk[i]); } catch(e) {}
            var offset = kt - firstKeyTime;
            var newTime = flip ? comp.time + (lastKeyTime - kt) : comp.time + offset;
            newKf.push({ time: newTime, value: kv, label: lbl });
          }
          for (var i = 0; i < newKf.length; i++) {
            prop.setValueAtTime(newKf[i].time, newKf[i].value);
            if (newKf[i].label) {
              try { var ni = prop.nearestKeyIndex(newKf[i].time); if (prop.setLabelAtKey) prop.setLabelAtKey(ni, newKf[i].label); } catch(e) {}
            }
          }
        }
      }
    }
    return flip ? "Keyframes cloned & flipped" : "Keyframes cloned";
  });
}
