function findReplaceText(findStr, replaceStr, caseSensitive) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: Find/Replace Text", function() {
    var count = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (!(layer instanceof TextLayer)) continue;
      var prop = layer.property("Source Text"), doc = prop.value, src = doc.text;
      var replaced;
      if (caseSensitive) {
        if (src.indexOf(findStr) === -1) continue;
        replaced = src.split(findStr).join(replaceStr);
      } else {
        var re = new RegExp(findStr.replace(/[-\/\^$*+?.()|[\]{}]/g, "\$&"), "gi");
        if (!re.test(src)) continue; re.lastIndex = 0;
        replaced = src.replace(re, replaceStr);
      }
      doc.text = replaced; prop.setValue(doc); count++;
    }
    return "Replaced in " + count + " layer" + (count !== 1 ? "s" : "");
  });
}
