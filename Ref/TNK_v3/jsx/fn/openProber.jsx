function openProber() {

  function valueTypeLabel(pvt) {
    var m = {};
    m[PropertyValueType.NO_VALUE]        = "NO_VALUE";
    m[PropertyValueType.ThreeD_SPATIAL]  = "ThreeD_SPATIAL";
    m[PropertyValueType.ThreeD]          = "ThreeD";
    m[PropertyValueType.TwoD_SPATIAL]    = "TwoD_SPATIAL";
    m[PropertyValueType.TwoD]            = "TwoD";
    m[PropertyValueType.OneD]            = "OneD";
    m[PropertyValueType.COLOR]           = "COLOR";
    m[PropertyValueType.CUSTOM_VALUE]    = "CUSTOM_VALUE";
    m[PropertyValueType.MARKER]          = "MARKER";
    m[PropertyValueType.LAYER_INDEX]     = "LAYER_INDEX";
    m[PropertyValueType.MASK_INDEX]      = "MASK_INDEX";
    m[PropertyValueType.SHAPE]           = "SHAPE";
    m[PropertyValueType.TEXT_DOCUMENT]   = "TEXT_DOCUMENT";
    return m[pvt] != null ? m[pvt] : String(pvt);
  }

  function propertyTypeLabel(pt) {
    if (pt === PropertyType.PROPERTY)      return "PROPERTY";
    if (pt === PropertyType.INDEXED_GROUP) return "INDEXED_GROUP";
    if (pt === PropertyType.NAMED_GROUP)   return "NAMED_GROUP";
    return String(pt);
  }

  function layerType(layer) {
    if (layer instanceof TextLayer)   return "TextLayer";
    if (layer instanceof ShapeLayer)  return "ShapeLayer";
    if (layer instanceof CameraLayer) return "CameraLayer";
    if (layer instanceof LightLayer)  return "LightLayer";
    if (layer instanceof AVLayer)     return "AVLayer";
    return "Layer";
  }

  function formatValue(prop) {
    try {
      var v = prop.value, t = prop.propertyValueType;
      if (t === PropertyValueType.COLOR) {
        return "[R:" + v[0].toFixed(3) + " G:" + v[1].toFixed(3) +
               " B:" + v[2].toFixed(3) + " A:" + v[3].toFixed(3) + "]";
      }
      if (t === PropertyValueType.TEXT_DOCUMENT) {
        return "TextDocument(\"" + String(v.text).replace(/\r|\n/g, "\\n") + "\")";
      }
      if (t === PropertyValueType.MARKER) {
        return "MarkerValue(\"" + (v.comment || "") + "\")";
      }
      if (t === PropertyValueType.SHAPE) {
        return "Shape(verts:" + v.vertices.length + " closed:" + v.closed + ")";
      }
      if (t === PropertyValueType.CUSTOM_VALUE) return "<custom>";
      if (t === PropertyValueType.NO_VALUE)     return "<no value>";
      if (v instanceof Array) {
        var parts = [];
        for (var i = 0; i < v.length; i++) {
          parts.push(typeof v[i] === "number" ? v[i].toFixed(3) : String(v[i]));
        }
        return "[" + parts.join(", ") + "]";
      }
      if (typeof v === "number") return v.toFixed(3);
      return String(v);
    } catch (e) {
      return "<unreadable: " + e.toString() + ">";
    }
  }

  function buildPath(prop) {
    var parts = [], p = prop;
    while (p && p.parentProperty) {
      parts.unshift('.property("' + p.matchName + '")');
      p = p.parentProperty;
    }
    return parts.join("");
  }

  function walkProperty(prop, depth, maxDepth, lines, showValues) {
    var pad = "";
    for (var i = 0; i < depth; i++) pad += "  ";
    var header = pad + "[" + propertyTypeLabel(prop.propertyType) + "] " +
                 '"' + prop.name + '"  (' + prop.matchName + ')';
    if (prop.propertyType === PropertyType.PROPERTY) {
      header += "  <" + valueTypeLabel(prop.propertyValueType) + ">";
      if (showValues && prop.propertyValueType !== PropertyValueType.NO_VALUE) {
        header += "  =  " + formatValue(prop);
      }
      if (prop.canSetExpression && prop.expressionEnabled) header += "  [EXPR]";
      if (prop.numKeys && prop.numKeys > 0) header += "  [" + prop.numKeys + " keys]";
    }
    lines.push(header);
    if (depth >= maxDepth) {
      if (prop.numProperties && prop.numProperties > 0) {
        lines.push(pad + "  ...(truncated at max depth)");
      }
      return;
    }
    if (prop.numProperties) {
      for (var j = 1; j <= prop.numProperties; j++) {
        walkProperty(prop.property(j), depth + 1, maxDepth, lines, showValues);
      }
    }
  }

  function buildReport(opts) {
    var out = [];
    var comp = app.project.activeItem;
    out.push("=========================================");
    out.push("  TNK PROPERTY PROBER");
    out.push("  " + new Date().toString());
    out.push("=========================================");

    if (!(comp && comp instanceof CompItem)) {
      out.push("No active composition.");
      return out.join("\n");
    }

    out.push('Comp: "' + comp.name + '"  ' +
             comp.width + "x" + comp.height + "  " +
             comp.frameRate.toFixed(2) + "fps  " +
             comp.duration.toFixed(2) + "s");
    out.push("Active Item ID: " + comp.id);
    out.push("Selected Layers: " + comp.selectedLayers.length);
    out.push("");

    if (comp.selectedLayers.length === 0) {
      out.push("(no layers selected — select at least one layer and Refresh)");
      return out.join("\n");
    }

    for (var i = 0; i < comp.selectedLayers.length; i++) {
      var layer = comp.selectedLayers[i];
      out.push("─────────────────────────────────────────");
      out.push("LAYER [" + layer.index + "]: \"" + layer.name + "\"");
      out.push("  runtime type: " + layerType(layer));
      out.push("  matchName:    " + layer.matchName);
      out.push("  enabled:      " + layer.enabled +
               "   locked: " + layer.locked +
               "   shy: " + layer.shy +
               "   3D: " + (layer.threeDLayer === true));
      out.push("  inPoint:      " + layer.inPoint.toFixed(3) +
               "s   outPoint: " + layer.outPoint.toFixed(3) + "s");
      out.push("  path:         app.project.activeItem.layer(" + layer.index + ")");
      out.push("");

      if (opts.mode !== "tree") {
        var selProps = layer.selectedProperties;
        out.push("  SELECTED PROPERTIES (" + selProps.length + "):");
        if (selProps.length === 0) {
          out.push("    (none — click a property in the timeline to include it)");
        } else {
          for (var s = 0; s < selProps.length; s++) {
            var sp = selProps[s];
            out.push("    • \"" + sp.name + "\"  (" + sp.matchName + ")");
            out.push("        propertyType:      " + propertyTypeLabel(sp.propertyType));
            if (sp.propertyType === PropertyType.PROPERTY) {
              out.push("        propertyValueType: " + valueTypeLabel(sp.propertyValueType));
              if (opts.showValues && sp.propertyValueType !== PropertyValueType.NO_VALUE) {
                out.push("        value:             " + formatValue(sp));
              }
              if (sp.numKeys > 0) out.push("        keyframes:         " + sp.numKeys);
              if (sp.canSetExpression && sp.expressionEnabled) {
                out.push("        expression:        ENABLED");
              }
            }
            out.push("        path:              layer" + buildPath(sp));
          }
        }
        out.push("");
      }

      if (opts.mode !== "selection") {
        out.push("  FULL PROPERTY TREE (maxDepth=" + opts.maxDepth + "):");
        var treeLines = [];
        for (var k = 1; k <= layer.numProperties; k++) {
          walkProperty(layer.property(k), 0, opts.maxDepth, treeLines, opts.showValues);
        }
        for (var t = 0; t < treeLines.length; t++) out.push("    " + treeLines[t]);
        out.push("");
      }
    }
    return out.join("\n");
  }

  var win = new Window("palette", "TNK Property Prober", undefined,
                       {resizeable: true, closeButton: true});
  win.orientation = "column";
  win.alignChildren = ["fill", "fill"];
  win.spacing = 6;
  win.margins = 10;

  var ctrls = win.add("group");
  ctrls.orientation = "row";
  ctrls.alignChildren = ["left", "center"];
  ctrls.add("statictext", undefined, "Mode:");
  var modePanel = ctrls.add("group");
  modePanel.orientation = "row";
  var rbSel  = modePanel.add("radiobutton", undefined, "Selection");
  var rbTree = modePanel.add("radiobutton", undefined, "Full Tree");
  var rbBoth = modePanel.add("radiobutton", undefined, "Both");
  rbBoth.value = true;
  ctrls.add("statictext", undefined, "   Max depth:");
  var depthInput = ctrls.add("edittext", undefined, "6");
  depthInput.characters = 3;
  var cbValues = ctrls.add("checkbox", undefined, "Show values");
  cbValues.value = true;

  var btnRow = win.add("group");
  btnRow.orientation = "row";
  btnRow.alignChildren = ["left", "center"];
  var btnRefresh = btnRow.add("button", undefined, "Refresh (F5)");
  var btnCopy    = btnRow.add("button", undefined, "Copy All");
  var btnClear   = btnRow.add("button", undefined, "Clear");
  var statusTxt  = btnRow.add("statictext", undefined, "", {multiline: false});
  statusTxt.characters = 40;

  var output = win.add("edittext", undefined, "",
                       {multiline: true, scrolling: true, readonly: false});
  output.preferredSize = [720, 520];
  try { output.graphics.font = ScriptUI.newFont("Consolas", "Regular", 11); } catch (e) {}

  function currentOpts() {
    var mode = rbSel.value ? "selection" : (rbTree.value ? "tree" : "both");
    var depth = parseInt(depthInput.text, 10);
    if (isNaN(depth) || depth < 0) depth = 6;
    return { mode: mode, maxDepth: depth, showValues: cbValues.value };
  }

  function refresh() {
    try {
      output.text = buildReport(currentOpts());
      var now = new Date();
      statusTxt.text = "Refreshed  " + now.getHours() + ":" +
                       ("0" + now.getMinutes()).slice(-2) + ":" +
                       ("0" + now.getSeconds()).slice(-2);
    } catch (e) {
      output.text = "ERROR: " + e.toString() + "\n" + (e.stack || "");
      statusTxt.text = "Error";
    }
  }

  btnRefresh.onClick = refresh;
  btnClear.onClick   = function () { output.text = ""; statusTxt.text = "Cleared"; };
  btnCopy.onClick    = function () {
    try {
      var txt = output.text.replace(/\r\n/g, "\n");
      var tmp = new File(Folder.temp.fsName + "/tnk_prober_clip.txt");
      tmp.encoding = "UTF-8";
      tmp.open("w"); tmp.write(txt); tmp.close();
      if ($.os.indexOf("Windows") !== -1) {
        system.callSystem('cmd.exe /c clip < "' + tmp.fsName + '"');
      } else {
        system.callSystem('bash -c "pbcopy < \'' + tmp.fsName + '\'"');
      }
      tmp.remove();
      statusTxt.text = "Copied " + txt.length + " chars to clipboard";
    } catch (e) {
      statusTxt.text = "Copy failed: " + e.toString();
    }
  };

  win.addEventListener("keydown", function (k) {
    if (k.keyName === "F5") refresh();
  });
  win.onResizing = win.onResize = function () { this.layout.resize(); };

  refresh();
  win.center();
  win.show();
  return "Prober open";
}
