// ============================================================
// AddLayerStyles.jsx  v1
// ScriptUI panel — pick layer styles to apply to selected layers
// Works on ALL layer types including text layers.
// ============================================================

(function buildUI() {

    // ── Style command map ─────────────────────────────────────
    var STYLES = [
        { label: "Drop Shadow",       cmd: 9000, matchName: "ADBE Drop Shadow"    },
        { label: "Inner Shadow",      cmd: 9001, matchName: "ADBE Inner Shadow"   },
        { label: "Outer Glow",        cmd: 9002, matchName: "ADBE Outer Glow"     },
        { label: "Inner Glow",        cmd: 9003, matchName: "ADBE Inner Glow"     },
        { label: "Bevel & Emboss",    cmd: 9004, matchName: "ADBE Bevel Emboss"   },
        { label: "Satin",             cmd: 9005, matchName: "ADBE Satin"          },
        { label: "Color Overlay",     cmd: 9006, matchName: "ADBE Color Overlay"  },
        { label: "Gradient Overlay",  cmd: 9007, matchName: "ADBE Grad Overlay"   },
        { label: "Stroke",            cmd: 9008, matchName: "ADBE Stroke"         }
    ];

    // ── Build the window ──────────────────────────────────────
    var win = new Window("dialog", "Layer Styles Applicator", undefined, { resizeable: false });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 0;
    win.margins = 0;

    // ── Header bar ────────────────────────────────────────────
    var header = win.add("group");
    header.orientation = "column";
    header.alignChildren = ["fill", "center"];
    header.margins = [16, 14, 16, 12];
    header.spacing = 4;
    header.graphics.backgroundColor = header.graphics.newBrush(
        header.graphics.BrushType.SOLID_COLOR, [0.11, 0.11, 0.13]
    );

    var titleText = header.add("statictext", undefined, "LAYER STYLES");
    titleText.graphics.font = ScriptUI.newFont("dialog", "BOLD", 14);
    titleText.graphics.foregroundColor = titleText.graphics.newPen(
        titleText.graphics.PenType.SOLID_COLOR, [0.96, 0.96, 0.96], 1
    );

    var subText = header.add("statictext", undefined, "Select styles to apply to selected layers");
    subText.graphics.font = ScriptUI.newFont("dialog", "REGULAR", 10);
    subText.graphics.foregroundColor = subText.graphics.newPen(
        subText.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.55], 1
    );

    // ── Divider ───────────────────────────────────────────────
    function addDivider(parent) {
        var d = parent.add("panel");
        d.alignment = ["fill", "center"];
        d.preferredSize.height = 1;
        d.graphics.backgroundColor = d.graphics.newBrush(
            d.graphics.BrushType.SOLID_COLOR, [0.2, 0.2, 0.22]
        );
    }

    addDivider(win);

    // ── Checkboxes ────────────────────────────────────────────
    var listGroup = win.add("group");
    listGroup.orientation = "column";
    listGroup.alignChildren = ["fill", "top"];
    listGroup.margins = [16, 12, 16, 8];
    listGroup.spacing = 6;
    listGroup.graphics.backgroundColor = listGroup.graphics.newBrush(
        listGroup.graphics.BrushType.SOLID_COLOR, [0.14, 0.14, 0.16]
    );

    var checkboxes = [];
    for (var i = 0; i < STYLES.length; i++) {
        var cb = listGroup.add("checkbox", undefined, "  " + STYLES[i].label);
        cb.value = (STYLES[i].label === "Gradient Overlay"); // pre-check gradient
        cb.graphics.font = ScriptUI.newFont("dialog", "REGULAR", 11);
        cb.graphics.foregroundColor = cb.graphics.newPen(
            cb.graphics.PenType.SOLID_COLOR, [0.85, 0.85, 0.88], 1
        );
        checkboxes.push(cb);
    }

    addDivider(win);

    // ── Select All / None row ─────────────────────────────────
    var toggleRow = win.add("group");
    toggleRow.orientation = "row";
    toggleRow.alignChildren = ["fill", "center"];
    toggleRow.margins = [16, 8, 16, 4];
    toggleRow.spacing = 8;
    toggleRow.graphics.backgroundColor = toggleRow.graphics.newBrush(
        toggleRow.graphics.BrushType.SOLID_COLOR, [0.14, 0.14, 0.16]
    );

    var selectAllBtn = toggleRow.add("button", undefined, "Select All");
    selectAllBtn.preferredSize = [100, 24];

    var selectNoneBtn = toggleRow.add("button", undefined, "Select None");
    selectNoneBtn.preferredSize = [100, 24];

    selectAllBtn.onClick = function () {
        for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = true;
    };
    selectNoneBtn.onClick = function () {
        for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = false;
    };

    addDivider(win);

    // ── Skip / overwrite option ───────────────────────────────
    var optGroup = win.add("group");
    optGroup.orientation = "row";
    optGroup.alignChildren = ["fill", "center"];
    optGroup.margins = [16, 8, 16, 4];
    optGroup.graphics.backgroundColor = optGroup.graphics.newBrush(
        optGroup.graphics.BrushType.SOLID_COLOR, [0.14, 0.14, 0.16]
    );

    var skipExisting = optGroup.add("checkbox", undefined, "  Skip if style already exists");
    skipExisting.value = true;
    skipExisting.graphics.font = ScriptUI.newFont("dialog", "REGULAR", 10);
    skipExisting.graphics.foregroundColor = skipExisting.graphics.newPen(
        skipExisting.graphics.PenType.SOLID_COLOR, [0.6, 0.6, 0.65], 1
    );

    addDivider(win);

    // ── Apply / Cancel buttons ────────────────────────────────
    var btnRow = win.add("group");
    btnRow.orientation = "row";
    btnRow.alignChildren = ["fill", "center"];
    btnRow.margins = [16, 10, 16, 14];
    btnRow.spacing = 8;
    btnRow.graphics.backgroundColor = btnRow.graphics.newBrush(
        btnRow.graphics.BrushType.SOLID_COLOR, [0.11, 0.11, 0.13]
    );

    var cancelBtn = btnRow.add("button", undefined, "Cancel");
    cancelBtn.preferredSize = [90, 28];

    var applyBtn = btnRow.add("button", undefined, "Apply");
    applyBtn.preferredSize = [130, 28];

    cancelBtn.onClick = function () { win.close(); };

    // ── Core apply logic ──────────────────────────────────────
    applyBtn.onClick = function () {

        // Collect chosen styles
        var chosen = [];
        for (var i = 0; i < STYLES.length; i++) {
            if (checkboxes[i].value) chosen.push(STYLES[i]);
        }

        if (chosen.length === 0) {
            alert("Please select at least one layer style.");
            return;
        }

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("No active composition found.");
            return;
        }

        var layers = comp.selectedLayers;
        if (!layers || layers.length === 0) {
            alert("No layers selected in the composition.");
            return;
        }

        var doSkip = skipExisting.value;

        comp.openInViewer();
        app.beginUndoGroup("Add Layer Styles");

        var totalApplied = 0;
        var totalSkipped = 0;

        for (var li = 0; li < layers.length; li++) {
            var layer = layers[li];

            for (var si = 0; si < chosen.length; si++) {
                var style = chosen[si];

                // Check existing
                var alreadyEnabled = false;
                if (doSkip) {
                    try {
                        var ls = layer.property("ADBE Layer Styles");
                        if (ls) {
                            var sp = ls.property(style.matchName);
                            if (sp && sp.enabled) alreadyEnabled = true;
                        }
                    } catch (e) { /* not yet present */ }
                }

                if (alreadyEnabled) {
                    totalSkipped++;
                    continue;
                }

                // Deselect all, select only this layer, fire command
                for (var j = 0; j < comp.selectedLayers.length; j++) {
                    comp.selectedLayers[j].selected = false;
                }
                layer.selected = true;

                try {
                    app.executeCommand(style.cmd);
                    totalApplied++;
                } catch (e) {
                    $.writeln("Failed on [" + layer.name + "] " + style.label + ": " + e);
                }
            }
        }

        // Restore selection
        for (var k = 0; k < layers.length; k++) {
            layers[k].selected = true;
        }

        app.endUndoGroup();

        var msg = "Done!\n\nApplied: " + totalApplied + " style(s)";
        if (totalSkipped > 0) msg += "\nSkipped (already exists): " + totalSkipped;
        alert(msg);
        win.close();
    };

    win.center();
    win.show();

}());
