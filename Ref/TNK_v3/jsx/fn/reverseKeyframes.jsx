function reverseKeyframes() {
  var layers = getSelectedLayers(); if (!layers.length) return "No layers selected";
  return _undo("TNK: Reverse Keyframes", function() {
    for (var i = 0; i < layers.length; i++) {
      var props = layers[i].selectedProperties;
      for (var p = 0; p < props.length; p++) {
        var prop = props[p]; var n = prop.numKeys; if (n < 2) continue;
        var times = [], values = [];
        for (var k = 1; k <= n; k++) { times.push(prop.keyTime(k)); values.push(prop.keyValue(k)); }
        for (var k = 1; k <= n; k++) { try { prop.setValueAtTime(times[k-1], values[n-k]); } catch(e) {} }
      }
    }
    return "Keyframes reversed";
  });
}
