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
