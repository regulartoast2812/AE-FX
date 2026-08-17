// ── COMP ─────────────────────────────────────────────────────────────────────

function addToRenderQueue() {
    var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Add to Render Queue", function() {
    app.project.renderQueue.items.add(c);
    return "Added to render queue";
  });
}

// Precompose selected layers, add to render queue with QT+alpha,
// output to <project folder>/Quick Render/<compName>.mov
function quickRender() {
  var comp = getComp();
  if (!comp) return "No comp";
  var layers = comp.selectedLayers;
  if (!layers.length) return "No layers selected";

  // Determine output folder next to project file
  var projFile = app.project.file;
  var outputDir;
  if (projFile) {
    outputDir = new Folder(projFile.parent.fsName + "/Quick Render");
  } else {
    outputDir = new Folder("~/Desktop/Quick Render");
  }
  if (!outputDir.exists) outputDir.create();

  return _undo("TNK: Quick Render", function() {
    // Precompose selected layers into a new comp
    var indices = [];
    for (var i = 0; i < layers.length; i++) indices.push(layers[i].index);
    // Sort ascending so precompose gets them in order
    indices.sort(function(a, b) { return a - b; });
    // Select them by index
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    for (var i = 0; i < indices.length; i++) comp.layer(indices[i]).selected = true;

    // Precompose (move all into new comp, leave in place)
    var precompName = "QR_" + comp.name;
    comp.layers.precompose(indices, precompName, true);

    // Find the new precomp
    var precomp = null;
    for (var i = 0; i < app.project.numItems; i++) {
      var item = app.project.item(i + 1);
      if (item instanceof CompItem && item.name === precompName) {
        precomp = item; break;
      }
    }
    if (!precomp) return "Precompose failed";

    // Add to render queue
    var rqi = app.project.renderQueue.items.add(precomp);
    rqi.applyTemplate("Best Settings");

    // Set output module to QuickTime + alpha
    var om = rqi.outputModule(1);
    om.applyTemplate("Lossless with Alpha");
    // Fallback: set format manually if template not found
    try {
      var omSettings = om.getSettings(GetSettingsFormat.STRING);
    } catch(e) {
      om.format = "QuickTime";
      om.includeSourceXMP = false;
    }
    try { om.channels = ChannelType.RGBA; } catch(e) {}
    try { om.videoCodec = "animation"; } catch(e) {}

    // Set output file path
    var outFile = new File(outputDir.fsName + "/" + precompName + ".mov");
    om.file = outFile;

    // Render
    app.project.renderQueue.render();

    return "Rendered: " + outFile.fsName;
  });
}

function getCompInfo() {
  var c = getComp();
  if (!c) return JSON.stringify({name:"None",w:0,h:0,fps:0,dur:0});
  return JSON.stringify({
    name: c.name,
    w: c.width,
    h: c.height,
    fps: Math.round(c.frameRate * 100) / 100,
    dur: Math.round(c.duration * 100) / 100
  });
}

// Default: rename each selected precomp layer's source comp.
// Shift (useActive=true): rename the active comp itself.
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

// Trim comp duration to last layer outpoint
function autoTrimComp(useActive) {
  var c = getComp();
  if (!c) return "No comp";
  return _undo("TNK: Auto-Trim Comp", function() {
    var maxOut = 0;
    for (var i = 1; i <= c.numLayers; i++) {
      var lOut = c.layer(i).outPoint;
      if (lOut > maxOut) maxOut = lOut;
    }
    if (maxOut > 0) {
      c.duration = maxOut;
    } else {
      return "No layers found";
    }
    return "Comp trimmed to " + Math.round(maxOut * 100) / 100 + "s";
  });
}

// Crop comp canvas to fit visible content bounds.
// Default: crop selected precomp layer sources. Shift: crop active comp.
// Content stays in place visually — the precomp layer in the parent is offset
// to compensate for the canvas origin shift.
function cropComp(useActive) {
  var activeComp = getComp();
  if (!activeComp) return "No comp";

  // Build list of {comp, parentLayer} pairs to process
  var targets = [];
  if (useActive) {
    targets.push({ comp: activeComp, parentLayer: null });
  } else {
    var sel = activeComp.selectedLayers;
    for (var i = 0; i < sel.length; i++) {
      try {
        if (sel[i].source && sel[i].source instanceof CompItem) {
          targets.push({ comp: sel[i].source, parentLayer: sel[i] });
        }
      } catch(e) {}
    }
    if (!targets.length) return "No precomp layers selected";
  }

  return _undo("TNK: Crop Comp to Content", function() {
  var results = [];
  try {
    for (var ci = 0; ci < targets.length; ci++) {
      var comp = targets[ci].comp;
      var parentLayer = targets[ci].parentLayer;
      var t = comp.time;
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      var found = false;

      for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        try { if (layer instanceof CameraLayer) continue; } catch(e) {}
        try { if (layer instanceof LightLayer)  continue; } catch(e) {}
        if (layer.nullLayer) continue;
        if (t < layer.inPoint || t > layer.outPoint) continue;
        try { if (!layer.enabled) continue; } catch(e) {}

        var lw = 0, lh = 0;
        try { if (layer.source) { lw = layer.source.width; lh = layer.source.height; } } catch(e) {}
        if (lw === 0 || lh === 0) {
          try { var sr = layer.sourceRectAtTime(t, false); lw = sr.width; lh = sr.height; } catch(e) {}
        }
        if (lw === 0 || lh === 0) { lw = comp.width; lh = comp.height; }

        var anchor = [lw/2, lh/2], pos = [comp.width/2, comp.height/2];
        var scaleX = 1, scaleY = 1, rot = 0;
        try {
          var tg = layer.property("ADBE Transform Group");
          anchor = tg.property("ADBE Anchor Point").valueAtTime(t, false);
          pos    = tg.property("ADBE Position").valueAtTime(t, false);
          var sc = tg.property("ADBE Scale").valueAtTime(t, false);
          scaleX = sc[0] / 100; scaleY = sc[1] / 100;
          rot = tg.property("ADBE Rotate Z").valueAtTime(t, false) * Math.PI / 180;
        } catch(e) {}

        var corners = [[-anchor[0],-anchor[1]],[lw-anchor[0],-anchor[1]],[lw-anchor[0],lh-anchor[1]],[-anchor[0],lh-anchor[1]]];
        var cosR = Math.cos(rot), sinR = Math.sin(rot);
        for (var c = 0; c < corners.length; c++) {
          var cx = corners[c][0]*scaleX, cy = corners[c][1]*scaleY;
          var wx = cx*cosR - cy*sinR + pos[0];
          var wy = cx*sinR + cy*cosR + pos[1];
          if (wx < minX) minX = wx; if (wy < minY) minY = wy;
          if (wx > maxX) maxX = wx; if (wy > maxY) maxY = wy;
        }
        found = true;
      }

      if (!found) { results.push(comp.name + ": no layers"); continue; }

      var newW = Math.max(2, Math.round(maxX - minX));
      var newH = Math.max(2, Math.round(maxY - minY));
      var offX = Math.round(minX);
      var offY = Math.round(minY);

      // Shift layer positions inside the sub-comp so content starts at new origin
      for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        try {
          var prop = layer.property("ADBE Transform Group").property("ADBE Position");
          if (prop.numKeys === 0) {
            var v = prop.value;
            prop.setValue([v[0]-offX, v[1]-offY]);
          } else {
            for (var k = 1; k <= prop.numKeys; k++) {
              var v = prop.keyValue(k); prop.setValueAtKey(k, [v[0]-offX, v[1]-offY]);
            }
          }
        } catch(e) {}
      }

      // Compensate in parent: move the precomp layer by the same offset
      // so the content appears in the same place in the parent comp
      if (parentLayer) {
        try {
          var pp = parentLayer.property("ADBE Transform Group").property("ADBE Position");
          if (pp.numKeys === 0) {
            var pv = pp.value;
            pp.setValue([pv[0]+offX, pv[1]+offY]);
          } else {
            for (var k = 1; k <= pp.numKeys; k++) {
              var pv = pp.keyValue(k); pp.setValueAtKey(k, [pv[0]+offX, pv[1]+offY]);
            }
          }
        } catch(e) {}
      }

      comp.width = newW; comp.height = newH;
      results.push(comp.name + " \u2192 " + newW + "\u00d7" + newH);
    }
    return results.join(", ");
  } catch(e) { return "Crop failed: " + e.toString(); }
  });
}

// ── LAYER MANAGEMENT ─────────────────────────────────────────────────────────
