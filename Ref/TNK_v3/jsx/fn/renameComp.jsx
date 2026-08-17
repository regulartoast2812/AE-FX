function renameComp(newName, useActive) {
  var activeComp = getComp();
  if (!activeComp) return "No comp";
  if (!newName || !newName.length) return "No name provided";
  return _undo("TNK: Rename Comp", function() {
    if (useActive) {
      activeComp.name = newName;
      return "Renamed to \"" + newName + "\"";
    }
    var sel = activeComp.selectedLayers;
    var renamed = 0;
    for (var i = 0; i < sel.length; i++) {
      try {
        if (sel[i].source && sel[i].source instanceof CompItem) {
          var suffix = renamed > 0 ? " " + (renamed + 1) : "";
          sel[i].source.name = newName + suffix;
          renamed++;
        }
      } catch(e) {}
    }
    if (!renamed) {
      activeComp.name = newName;
      return "Renamed active comp to \"" + newName + "\"";
    }
    return "Renamed " + renamed + " comp" + (renamed > 1 ? "s" : "");
  });
}
