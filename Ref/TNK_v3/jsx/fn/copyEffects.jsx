function copyEffects() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (layers.length < 2) return "Select 2+ layers (source first)";
  return _undo("TNK: Copy Effects", function() {
    var src = layers[0];
    for (var i = 1; i < layers.length; i++) {
      var fx = src.property("Effects");
      for (var j = 1; j <= fx.numProperties; j++) {
        try {
          src.selected = true; layers[i].selected = false;
          app.executeCommand(2004); // copy
          layers[i].selected = true; src.selected = false;
          app.executeCommand(2005); // paste
        } catch(e) {}
      }
    }
    return "Effects copied";
  });
}
