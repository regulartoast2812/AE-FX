function applyStrokeStyle() {
  var comp = getComp(); if (!comp) return "No comp";
  var sel = comp.selectedLayers; if (!sel.length) return "No layers selected";
  function processContents(contents) {
    var count = 0;
    for (var i = 1; i <= contents.numProperties; i++) {
      try {
        var item = contents.property(i); var mn = item.matchName;
        if (mn === "ADBE Vector Shape - Group" || mn === "ADBE Vector Group") {
          count += processContents(item.property("Contents"));
          try { var po = item.property("ADBE Vector Blend Order"); if (po) po.setValue(2); } catch(e) {}
        } else if (mn === "ADBE Vector Graphic - Stroke") {
          try { item.property("ADBE Vector Stroke Line Join").setValue(2); } catch(e) {}
          count++;
        }
      } catch(e) {}
    }
    try {
      for (var j = 1; j <= contents.numProperties; j++) {
        var p = contents.property(j);
        if (p && p.matchName === "ADBE Vector Blend Order") { try { p.setValue(2); } catch(e) {} }
      }
    } catch(e) {}
    return count;
  }
  return _undo("TNK: Stroke Style", function() {
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
      if (!(sel[i] instanceof ShapeLayer)) continue;
      count += processContents(sel[i].property("Contents"));
    }
    return count ? "Stroke style applied to " + count + " stroke" + (count !== 1 ? "s" : "") : "No strokes found";
  });
}
