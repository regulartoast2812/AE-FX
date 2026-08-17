function setContinuousRoving(enable) {
  var comp = getComp(); if (!comp) return "No comp";
  return _undo("TNK: " + (enable ? "Enable" : "Disable") + " Continuous Keyframes", function() {
    var props = comp.selectedProperties;
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (prop.propertyType === PropertyType.PROPERTY && prop.canVaryOverTime) {
        for (var j = 1; j <= prop.numKeys; j++) try { prop.setRovingAtKey(j, enable); } catch(e) {}
      }
    }
    return "Continuous roving " + (enable ? "on" : "off");
  });
}
