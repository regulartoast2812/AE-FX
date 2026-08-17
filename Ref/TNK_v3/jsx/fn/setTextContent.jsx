function setTextContent(newText) {
  var comp = getComp(); if (!comp) return "No comp";
  var layers = comp.selectedLayers; if (!layers.length) return "No layers selected";
  return _undo("TNK: Set Text", function() {
    var count = 0;
    for (var i = 0; i < layers.length; i++) {
      if (!(layers[i] instanceof TextLayer)) continue;
      var prop = layers[i].property("Source Text");
      var doc = prop.value; doc.text = newText; prop.setValue(doc); count++;
    }
    return count + " text layer" + (count !== 1 ? "s" : "") + " updated";
  });
}
