function applyLoopExpression(type) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Loop " + type, function() {
    var layers = comp.selectedLayers;
    for (var j = 0; j < layers.length; j++) {
      var props = layers[j].selectedProperties;
      for (var i = 0; i < props.length; i++) {
        if (props[i].canSetExpression)
          try { props[i].expression = "loopOut(type='" + type + "', numKeyframes=0)"; } catch(e) {}
      }
    }
    return "Loop (" + type + ") applied";
  });
}
