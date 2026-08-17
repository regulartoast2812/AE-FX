// randomize-shape-fill-colors.jsx
// Distributes hues evenly across the full color spectrum based on layer count,
// so N layers always get N maximally-spread hues. A random offset rotates the
// starting point so results differ each run. All fills within one layer share
// that layer's assigned hue; brightness varies per fill within the chosen range.
// Run via: File > Scripts > Run Script File...

(function randomizeShapeFillColors() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("No active composition.");
        return;
    }

    // --- Collect layers first so the dialog can show the count ---
    var layers = [];
    var sel = comp.selectedLayers;
    if (sel.length > 0) {
        for (var i = 0; i < sel.length; i++) {
            if (sel[i] instanceof ShapeLayer) layers.push(sel[i]);
        }
    } else {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i) instanceof ShapeLayer) layers.push(comp.layer(i));
        }
    }

    if (layers.length === 0) { alert("No shape layers found."); return; }

    var n = layers.length;

    // --- Dialog ---
    var dlg = new Window("dialog", "Randomize Fill Colors");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 18;

    dlg.add("statictext", undefined,
        n + " shape layer" + (n !== 1 ? "s" : "") + " detected — " +
        n + " evenly-spaced hue" + (n !== 1 ? "s" : "") + " will be assigned.");

    var satRow = dlg.add("group");
    satRow.orientation = "row";
    satRow.alignChildren = "center";
    satRow.add("statictext", undefined, "Saturation (0–100):");
    var satInput = satRow.add("edittext", undefined, "80");
    satInput.characters = 5;

    var briRow = dlg.add("group");
    briRow.orientation = "row";
    briRow.alignChildren = "center";
    briRow.add("statictext", undefined, "Brightness range (0–100):");
    var briMinInput = briRow.add("edittext", undefined, "55");
    briMinInput.characters = 4;
    briRow.add("statictext", undefined, "–");
    var briMaxInput = briRow.add("edittext", undefined, "95");
    briMaxInput.characters = 4;

    var shuffleRow = dlg.add("group");
    shuffleRow.orientation = "row";
    shuffleRow.alignChildren = "center";
    var shuffleCheck = shuffleRow.add("checkbox", undefined, "Shuffle hue order across layers");
    shuffleCheck.value = true;

    var btns = dlg.add("group");
    btns.orientation = "row";
    btns.alignment = "right";
    btns.add("button", undefined, "Cancel", { name: "cancel" });
    btns.add("button", undefined, "Randomize", { name: "ok" });

    if (dlg.show() !== 1) return;

    var sat    = parseFloat(satInput.text)    / 100;
    var briMin = parseFloat(briMinInput.text) / 100;
    var briMax = parseFloat(briMaxInput.text) / 100;

    if (isNaN(sat) || sat < 0 || sat > 1) { alert("Saturation must be 0–100."); return; }
    if (isNaN(briMin) || isNaN(briMax) || briMin > briMax) { alert("Brightness range is invalid."); return; }
    briMin = Math.max(0, Math.min(1, briMin));
    briMax = Math.max(0, Math.min(1, briMax));

    // --- Build evenly-distributed hue list ---
    // Random offset rotates the palette so results differ each run.
    var offset = Math.random();
    var hues = [];
    for (var i = 0; i < n; i++) {
        hues.push((offset + i / n) % 1);
    }

    // Fisher-Yates shuffle so adjacent layers don't get adjacent hues.
    if (shuffleCheck.value) {
        for (var i = hues.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = hues[i]; hues[i] = hues[j]; hues[j] = tmp;
        }
    }

    // --- Apply ---
    var fillsChanged = 0;

    app.beginUndoGroup("Randomize Shape Fill Colors");

    for (var li = 0; li < layers.length; li++) {
        fillsChanged += applyToGroup(
            layers[li].property("ADBE Root Vectors Group"),
            hues[li]
        );
    }

    app.endUndoGroup();

    alert("Done. Applied " + n + " evenly-spaced hues across " + n +
          " layer" + (n !== 1 ? "s" : "") + " (" + fillsChanged +
          " fill" + (fillsChanged !== 1 ? "s" : "") + " total).");

    // --- Helpers ---

    // All fills in a group share the layer's assigned hue; brightness varies per fill.
    function applyToGroup(group, hue) {
        if (!group) return 0;
        var count = 0;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (!prop) continue;
            if (prop.matchName === "ADBE Vector Graphic - Fill") {
                var colorProp = prop.property("ADBE Vector Fill Color");
                if (colorProp && colorProp.canSetExpression !== undefined) {
                    var bri = briMin + Math.random() * (briMax - briMin);
                    colorProp.setValue(hsbToRgb(hue, sat, bri));
                    count++;
                }
            }
            if (prop.matchName === "ADBE Vector Group" || prop.matchName === "ADBE Vectors Group") {
                var contents = prop.property("ADBE Vectors Group");
                if (contents) count += applyToGroup(contents, hue);
            }
        }
        return count;
    }

    // HSB → [r, g, b, 1], all channels 0–1.
    function hsbToRgb(h, s, b) {
        if (s === 0) return [b, b, b, 1];
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = b * (1 - s);
        var q = b * (1 - f * s);
        var t = b * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: return [b, t, p, 1];
            case 1: return [q, b, p, 1];
            case 2: return [p, b, t, 1];
            case 3: return [p, q, b, 1];
            case 4: return [t, p, b, 1];
            case 5: return [b, p, q, 1];
        }
        return [b, b, b, 1];
    }
})();
