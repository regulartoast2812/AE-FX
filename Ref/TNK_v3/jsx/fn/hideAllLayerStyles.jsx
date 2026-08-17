function hideAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Hide Layer Styles", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      try { var ls = sel[i].property("ADBE Layer Styles"); if (ls) { ls.enabled = false; count++; } } catch(e) {}
    }
    return "Styles hidden on " + count + " layer" + (count !== 1 ? "s" : "");
  });
}
