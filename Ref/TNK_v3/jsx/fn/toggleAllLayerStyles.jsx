function toggleAllLayerStyles() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  return _undo("TNK: Toggle Layer Styles", function() {
    var anyEnabled = false;
    for (var i = 0; i < sel.length; i++) {
      try { if (sel[i].property("ADBE Layer Styles").enabled) { anyEnabled = true; break; } } catch(e) {}
    }
    for (var i = 0; i < sel.length; i++) {
      try { sel[i].property("ADBE Layer Styles").enabled = !anyEnabled; } catch(e) {}
    }
    return anyEnabled ? "Styles disabled" : "Styles enabled";
  });
}
