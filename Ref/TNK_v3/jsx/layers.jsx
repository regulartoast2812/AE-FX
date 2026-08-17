// ── LAYERS ───────────────────────────────────────────────────────────────────

function unsoloAll() {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Unsolo All", function() {
    for (var i = 1; i <= c.numLayers; i++) c.layer(i).solo = false;
    return "All layers unsoloed";
  });
}

function lockSelected() {
  var layers = getSelectedLayers();
  if (!layers.length) return "No layers selected";
  return _undo("TNK: Lock Selected", function() {
    for (var i = 0; i < layers.length; i++) layers[i].locked = true;
    return "Locked " + layers.length + " layers";
  });
}

function createNull() {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Create Null", function() {
    var nullLayer = c.layers.addNull();
    nullLayer.name = "TNK_NULL";
    return "Null created";
  });
}

function parentToNull() {
  var c = getComp();
  if (!c) return "No comp";
  var selected = getSelectedLayers();
  if (!selected.length) return "Select layers first";
  return _undo("TNK: Parent to Null", function() {

    // Average position of all selected layers at current time
    var sumX = 0, sumY = 0;
    for (var i = 0; i < selected.length; i++) {
      var pos = selected[i].property("Position");
      if (pos) {
        var v = pos.valueAtTime(c.time, false);
        sumX += v[0];
        sumY += v[1];
      }
    }
    var avgX = sumX / selected.length;
    var avgY = sumY / selected.length;

    // Span: earliest inPoint to latest outPoint across selected layers
    var earliest = selected[0].inPoint;
    var latest   = selected[0].outPoint;
    for (var i = 1; i < selected.length; i++) {
      if (selected[i].inPoint  < earliest) earliest = selected[i].inPoint;
      if (selected[i].outPoint > latest)   latest   = selected[i].outPoint;
    }

    // Highest in stack = lowest index number
    var topIndex = selected[0].index;
    for (var i = 1; i < selected.length; i++) {
      if (selected[i].index < topIndex) topIndex = selected[i].index;
    }

    // addNull() always lands at index 1 — reorder after creation
    var nullLayer = c.layers.addNull();
    nullLayer.name     = "TNK_NULL";
    nullLayer.label    = 9; // Green
    nullLayer.property("Position").setValue([avgX, avgY]);
    nullLayer.inPoint  = earliest;
    nullLayer.outPoint = latest;

    // null landed at index 1, so topIndex shifted down by 1 — place null just above it
    nullLayer.moveBefore(c.layer(topIndex + 1));

    for (var i = 0; i < selected.length; i++) {
      selected[i].parent = nullLayer;
    }
    return "Parented to null";
  });
}

function precomposeSelected() {
    var c = getComp();
  if (!c) return "No comp";
  var selected = getSelectedLayers();
  if (selected.length < 1) return "Select layers first";
  return _undo("TNK: Precompose", function() {
    var indices = [];
    for (var i = 0; i < selected.length; i++) indices.push(selected[i].index);
    c.layers.precompose(indices, "TNK_Precomp_" + new Date().getTime(), true);
    return "Precomposed";
  });
}

// ── LABELS & MARKERS ─────────────────────────────────────────────────────────
