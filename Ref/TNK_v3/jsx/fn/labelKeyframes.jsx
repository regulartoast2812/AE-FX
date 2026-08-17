function labelKeyframes(colorIndex) {
  var c = getComp(); if (!c) return "No comp";
  var myKeys = c.selectedProperties; if (!myKeys || !myKeys.length) return "No keyframes selected";
  return _undo("TNK: Label Keyframes", function() {
    for (var i = 0; i < myKeys.length; i++) {
      var prop = myKeys[i];
      if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) continue;
      var sk = prop.selectedKeys;
      for (var k = 0; k < sk.length; k++) { try { prop.setLabelAtKey(sk[k], colorIndex); } catch(e) {} }
    }
    return "Keyframes labeled";
  });
}
