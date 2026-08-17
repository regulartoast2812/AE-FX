function deleteAllKeyframes() {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Delete All Keyframes", function() {
    function clearKeys(prop) {
      if (!prop) return;
      if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
        for (var p = 1; p <= prop.numProperties; p++) { try { clearKeys(prop.property(p)); } catch(e) {} }
        return;
      }
      if (prop.numKeys > 0) {
        try {
          var midV = prop.valueAtTime(comp.time, true);
          while (prop.numKeys > 0) prop.removeKey(1);
          try { prop.setValue(midV); } catch(e) {}
        } catch(e) {}
      }
    }
    for (var i = 0; i < layers.length; i++) {
      for (var j = 1; j <= layers[i].numProperties; j++) { try { clearKeys(layers[i].property(j)); } catch(e) {} }
    }
    return "All keyframes deleted";
  });
}
