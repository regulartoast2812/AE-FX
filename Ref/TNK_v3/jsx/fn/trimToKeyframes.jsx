function trimToKeyframes() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Trim to Keyframes", function() {
    function scan(prop, state) {
      if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
          var t = prop.keyTime(k);
          if (state.earliest === null || t < state.earliest) state.earliest = t;
          if (state.latest   === null || t > state.latest)   state.latest   = t;
        }
      }
      if (prop.numProperties > 0) { for (var j = 1; j <= prop.numProperties; j++) scan(prop.property(j), state); }
    }
    for (var i = 0; i < layers.length; i++) {
      var state = { earliest: null, latest: null };
      scan(layers[i], state);
      if (state.earliest !== null) { layers[i].inPoint = state.earliest; layers[i].outPoint = state.latest; }
    }
    return "Trimmed to keyframes";
  });
}
