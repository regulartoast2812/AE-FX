(function () {

    // ============================================================
    //  Anchor Point Master
    //  9-point picker with mask awareness + position adjustment
    // ============================================================

    var win = new Window("dialog", "Anchor Point");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;

    // ---- 3x3 grid picker ------------------------------------
    var gridPanel = win.add("panel", undefined, "Position");
    gridPanel.orientation = "column";
    gridPanel.alignChildren = ["center", "center"];
    gridPanel.margins = 12;
    gridPanel.spacing = 4;

    var btnSize = [36, 36];
    var selectedPoint = "C"; // default: center

    // Grid layout: [label, point code, row, col]
    var grid = [
        ["TL", "TL"], ["TC", "TC"], ["TR", "TR"],
        ["ML", "ML"], ["C",  "C" ], ["MR", "MR"],
        ["BL", "BL"], ["BC", "BC"], ["BR", "BR"]
    ];

    // Unicode arrows / symbols for buttons
    var labels = {
        "TL": "", "TC": "", "TR": "",
        "ML": "", "C":  "", "MR": "",
        "BL": "", "BC": "", "BR": ""
    };

    var buttons = {};
    var rows = [];

    for (var r = 0; r < 3; r++) {
        var row = gridPanel.add("group");
        row.orientation = "row";
        row.spacing = 4;
        rows.push(row);
        for (var c = 0; c < 3; c++) {
            var idx   = r * 3 + c;
            var code  = grid[idx][1];
            var lbl   = labels[code];
            var btn   = row.add("button", undefined, lbl);
            btn.size  = btnSize;
            btn.code  = code;
            buttons[code] = btn;

            btn.onClick = (function(b) {
                return function() {
                    selectedPoint = b.code;
                    updateButtons();
                };
            })(btn);
        }
    }

    function updateButtons() {
        for (var k in buttons) {
            buttons[k].text = (k === selectedPoint)
                ? "[" + labels[k] + "]"
                : labels[k];
        }
    }
    updateButtons();

    // ---- Use masks checkbox ---------------------------------
    var grpOpts = win.add("panel", undefined, "Options");
    grpOpts.orientation = "column";
    grpOpts.alignChildren = ["left", "center"];
    grpOpts.margins = 10;
    var cbMasks = grpOpts.add("checkbox", undefined, "Use mask bounds (if available)");
    cbMasks.value = true;

    // ---- Buttons --------------------------------------------
    var grpBtns = win.add("group");
    grpBtns.orientation = "row";
    grpBtns.alignment = "center";
    var btnApply  = grpBtns.add("button", undefined, "Apply");
    var btnCancel = grpBtns.add("button", undefined, "Cancel");

    btnCancel.onClick = function () { win.close(); };

    btnApply.onClick = function () {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) { alert("Open a composition first."); return; }
        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) { alert("Select at least one layer."); return; }

        app.beginUndoGroup("Set Anchor Point");

        for (var i = 0; i < sel.length; i++) {
            setAnchorPoint(sel[i], selectedPoint, cbMasks.value);
        }

        app.endUndoGroup();
        win.close();
    };

    // =========================================================
    function setAnchorPoint(layer, point, useMasks) {
        var comp    = layer.containingComp;
        var curTime = comp.time;

        // Get bounding box  mask-aware or full layer
        var bbox = null;
        if (useMasks) bbox = getMaskBBox(layer, curTime);
        if (!bbox) {
            var rect = layer.sourceRectAtTime(curTime, false);
            bbox = {
                left:   rect.left,
                top:    rect.top,
                right:  rect.left + rect.width,
                bottom: rect.top  + rect.height
            };
        }

        var L = bbox.left,   R = bbox.right;
        var T = bbox.top,    B = bbox.bottom;
        var CX = (L + R) / 2, CY = (T + B) / 2;

        // Map point code to [x, y]
        var pointMap = {
            "TL": [L,  T],  "TC": [CX, T],  "TR": [R,  T],
            "ML": [L,  CY], "C":  [CX, CY], "MR": [R,  CY],
            "BL": [L,  B],  "BC": [CX, B],  "BR": [R,  B]
        };

        var newAnchor = pointMap[point];
        var oldAnchor = layer.anchorPoint.value;

        var dx = (newAnchor[0] - oldAnchor[0]) * (layer.scale.value[0] / 100);
        var dy = (newAnchor[1] - oldAnchor[1]) * (layer.scale.value[1] / 100);

        layer.anchorPoint.setValue([newAnchor[0], newAnchor[1]]);

        var posProp = layer.property("Position");
        if (posProp.numKeys > 0) {
            for (var k = 1; k <= posProp.numKeys; k++) {
                var kv = posProp.keyValue(k);
                posProp.setValueAtKey(k, [kv[0] + dx, kv[1] + dy, kv[2] || 0]);
            }
        } else {
            var pv = posProp.value;
            posProp.setValue([pv[0] + dx, pv[1] + dy, pv[2] || 0]);
        }
    }

    // =========================================================
    //  Returns overall bounding box across all additive masks
    //  as { left, top, right, bottom } or null if none found
    // =========================================================
    function getMaskBBox(layer, curTime) {
        var masks = layer.property("Masks");
        if (!masks || masks.numProperties === 0) return null;

        var minX = null, maxX = null, minY = null, maxY = null;
        var found = false;

        for (var mi = 1; mi <= masks.numProperties; mi++) {
            var mask = masks.property(mi);

            var enabledProp = mask.property("ADBE Mask Atom");
            if (enabledProp && enabledProp.value === false) continue;

            var modeProp = mask.property("ADBE Mask Mode");
            if (modeProp) {
                var mode = modeProp.value;
                // Skip None=1, Subtract=3, Difference=7
                if (mode === 1 || mode === 3 || mode === 7) continue;
            }

            var pathProp = mask.property("ADBE Mask Shape");
            if (!pathProp) continue;

            var shape = pathProp.valueAtTime(curTime, false);
            var verts = shape.vertices;
            if (!verts || verts.length === 0) continue;

            for (var vi = 0; vi < verts.length; vi++) {
                var vx = verts[vi][0], vy = verts[vi][1];
                if (minX === null || vx < minX) minX = vx;
                if (maxX === null || vx > maxX) maxX = vx;
                if (minY === null || vy < minY) minY = vy;
                if (maxY === null || vy > maxY) maxY = vy;
            }
            found = true;
        }

        if (!found) return null;

        return { left: minX, top: minY, right: maxX, bottom: maxY };
    }

    win.show();

})();
