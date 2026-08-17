function staggerLayers(params, fromBottom) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (layers.length < 2) return "Select 2+ layers";
  var inTime = params ? (params.inTime || 1) : 1;
  return _undo("TNK: Stagger Layers", function() {
    var ordered = layers.slice();
    if (fromBottom) ordered.reverse();
    for (var i = 0; i < ordered.length; i++) {
      var offset = i * inTime;
      ordered[i].inPoint  += offset;
      ordered[i].outPoint += offset;
    }
    return "Layers staggered";
  });
}
