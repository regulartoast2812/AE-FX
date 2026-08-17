function precomposeSelected() {
  var c = getComp(); if (!c) return "No comp";
  var selected = getSelectedLayers(); if (!selected.length) return "Select layers first";
  return _undo("TNK: Precompose", function() {
    var indices = [];
    for (var i = 0; i < selected.length; i++) indices.push(selected[i].index);
    c.layers.precompose(indices, "TNK_Precomp_" + new Date().getTime(), true);
    return "Precomposed";
  });
}
