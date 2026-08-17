(function staggerTool(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Stagger Tool", undefined, {resizeable:true});
        var grp = win.add("group");
        grp.orientation = "column";
        grp.alignChildren = ["fill","top"];

        // ── Order ──
        var dirPanel = grp.add("panel", undefined, "Order");
        dirPanel.orientation = "row";
        var dirDropdown = dirPanel.add("dropdownlist", undefined, ["Ascending","Descending","Random"]);
        dirDropdown.selection = 0;

        // ── Stagger Settings ──
        var staggerPanel = grp.add("panel", undefined, "Stagger Settings");
        staggerPanel.orientation = "row";
        staggerPanel.add("statictext", undefined, "Amount:");
        var amountInput = staggerPanel.add("edittext", undefined, "5");
        amountInput.characters = 5;
        var unitDropdown = staggerPanel.add("dropdownlist", undefined, ["Frames","Seconds"]);
        unitDropdown.selection = 0;
        staggerPanel.add("statictext", undefined, "Group:");
        var groupInput = staggerPanel.add("edittext", undefined, "1");
        groupInput.characters = 3;

        // ── Layer Tools ──
        var layerPanel = grp.add("panel", undefined, "Layers");
        layerPanel.orientation = "row";
        var btnLayers     = layerPanel.add("button", undefined, "Stagger");
        var btnPullLayers = layerPanel.add("button", undefined, "Pull");
        var btnSnapLayers = layerPanel.add("button", undefined, "Snap");

        // ── Keyframe Tools ──
        var keyPanel = grp.add("panel", undefined, "Keyframes");
        keyPanel.orientation = "row";
        var btnKeyframes = keyPanel.add("button", undefined, "Stagger");
        var btnPullKeys  = keyPanel.add("button", undefined, "Pull");
        var btnSnapKeys  = keyPanel.add("button", undefined, "Snap");

        // ─────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────
        function shuffleArray(arr) {
            for (var i = arr.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
            }
        }

        function collectProps(propGroup, result) {
            for (var i = 1; i <= propGroup.numProperties; i++) {
                try {
                    var p = propGroup.property(i);
                    if (p.numProperties > 0) collectProps(p, result);
                    else if (p.numKeys > 0) result.push(p);
                } catch(e) {}
            }
        }

        function readKey(prop, k) {
            var key = { time: prop.keyTime(k), value: prop.keyValue(k), selected: false };
            try { key.selected = prop.keySelected(k); } catch(e) {}
            try { key.inType  = prop.keyInInterpolationType(k);  } catch(e) {}
            try { key.outType = prop.keyOutInterpolationType(k); } catch(e) {}
            var HOLD   = KeyframeInterpolationType.HOLD;
            var LINEAR = KeyframeInterpolationType.LINEAR;
            if (!(key.inType===HOLD || key.outType===HOLD || key.inType===LINEAR || key.outType===LINEAR)) {
                try { key.inEase  = prop.keyInTemporalEase(k);  } catch(e) {}
                try { key.outEase = prop.keyOutTemporalEase(k); } catch(e) {}
            }
            try { key.inSpatial  = prop.keyInSpatialTangent(k);  } catch(e) {}
            try { key.outSpatial = prop.keyOutSpatialTangent(k); } catch(e) {}
            try { key.roving = prop.keyRoving(k); } catch(e) {}
            return key;
        }

        function writeKey(prop, key) {
            try { prop.setValueAtTime(key.time, key.value); } catch(e) { return; }
            var idx = -1, tol = 1e-6;
            for (var k = 1; k <= prop.numKeys; k++) {
                if (Math.abs(prop.keyTime(k) - key.time) <= tol) { idx = k; break; }
            }
            if (idx < 1) return;
            try { if (key.inType !== undefined && key.outType !== undefined)
                prop.setInterpolationTypeAtKey(idx, key.inType, key.outType); } catch(e) {}
            try { if (key.inEase !== undefined && key.outEase !== undefined)
                prop.setTemporalEaseAtKey(idx, key.inEase, key.outEase); } catch(e) {}
            try { if (key.inSpatial !== undefined && key.outSpatial !== undefined)
                prop.setSpatialTangentsAtKey(idx, key.inSpatial, key.outSpatial); } catch(e) {}
            try { if (key.roving) prop.setRovingAtKey(idx, true); } catch(e) {}
        }

        // ─────────────────────────────────────────────
        // Stagger Layers
        // ─────────────────────────────────────────────
        function staggerLayers() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) { alert("Please select a composition."); return; }
            var selLayers = comp.selectedLayers;
            if (selLayers.length < 2) { alert("Select at least two layers."); return; }

            app.beginUndoGroup("Stagger Layers");
            var layers = [];
            for (var i = 0; i < selLayers.length; i++) layers.push(selLayers[i]);

            // Sort by index so stagger order matches timeline order, not selection order
            layers.sort(function(a, b) { return b.index - a.index; });
            if (dirDropdown.selection.index === 1) layers.reverse();
            else if (dirDropdown.selection.index === 2) shuffleArray(layers);

            var amount = parseFloat(amountInput.text) || 0;
            var staggerTime = (unitDropdown.selection.index === 0) ? amount / comp.frameRate : amount;
            var groupSize = Math.max(1, parseInt(groupInput.text) || 1);
            for (var i = 0; i < layers.length; i++) {
                var offset = (groupSize === 1) ? i : (i % groupSize);
                layers[i].startTime += offset * staggerTime;
            }
            app.endUndoGroup();
        }

        // ─────────────────────────────────────────────
        // Pull Layers
        //   Normal : earliest in-point → playhead
        //   Shift  : latest out-point  → playhead
        // ─────────────────────────────────────────────
        btnPullLayers.onClick = function() {
            if (ScriptUI.environment.keyboardState.shiftKey) {
                app.beginUndoGroup("Move Layers");
                var comp = app.project.activeItem;
                if (comp != null && (comp instanceof CompItem)) {
                    var selectedLayers = comp.selectedLayers;
                    if (selectedLayers.length > 0) {
                        var latestLayer = selectedLayers[0];
                        for (var i = 1; i < selectedLayers.length; i++) {
                            if (selectedLayers[i].outPoint > latestLayer.outPoint) latestLayer = selectedLayers[i];
                        }
                        var timeDifference = comp.time - latestLayer.outPoint;
                        for (var i = 0; i < selectedLayers.length; i++) {
                            selectedLayers[i].startTime = selectedLayers[i].startTime + timeDifference;
                        }
                    }
                }
                app.endUndoGroup();

            } else if (ScriptUI.environment.keyboardState.ctrlKey) {
                // Define your Ctrl-click function here

            } else if (ScriptUI.environment.keyboardState.altKey) {
                // Define your Alt-click function here

            } else {
                app.beginUndoGroup("Move Layers");
                var comp = app.project.activeItem;
                if (comp != null && (comp instanceof CompItem)) {
                    var selectedLayers = comp.selectedLayers;
                    if (selectedLayers.length > 0) {
                        var earliestLayer = selectedLayers[0];
                        for (var i = 1; i < selectedLayers.length; i++) {
                            if (selectedLayers[i].inPoint < earliestLayer.inPoint) earliestLayer = selectedLayers[i];
                        }
                        var timeDifference = comp.time - earliestLayer.inPoint;
                        for (var i = 0; i < selectedLayers.length; i++) {
                            selectedLayers[i].startTime = selectedLayers[i].startTime + timeDifference;
                        }
                    }
                }
                app.endUndoGroup();
            }
        };

        // ─────────────────────────────────────────────
        // Stagger Selected Keyframes
        // ─────────────────────────────────────────────
        function staggerSelectedKeyframes() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) { alert("Please select a composition."); return; }
            var selLayers = comp.selectedLayers;
            if (!selLayers || selLayers.length === 0) { alert("Select at least one layer."); return; }

            var amount = parseFloat(amountInput.text) || 0;
            var staggerTime = (unitDropdown.selection.index === 0) ? amount / comp.frameRate : amount;

            // PHASE 1: Snapshot
            var layerInfos = [];
            for (var li = 0; li < selLayers.length; li++) {
                var layer = selLayers[li];
                var props = [];
                collectProps(layer, props);

                var propSnaps = [], earliestTime = null;
                for (var pi = 0; pi < props.length; pi++) {
                    var prop = props[pi];
                    var keys = [];
                    for (var k = 1; k <= prop.numKeys; k++) {
                        var key = readKey(prop, k);
                        keys.push(key);
                        if (key.selected && (earliestTime === null || key.time < earliestTime)) earliestTime = key.time;
                    }
                    propSnaps.push({ prop: prop, keys: keys });
                }

                if (earliestTime === null) continue;
                layerInfos.push({ layerIndex: layer.index, propSnaps: propSnaps, earliestTime: earliestTime });
            }

            if (layerInfos.length === 0) { alert("No selected keyframes found."); return; }

            // PHASE 2: Sort & offsets
            layerInfos.sort(function(a, b) { return b.layerIndex - a.layerIndex; });
            if (dirDropdown.selection.index === 1) layerInfos.reverse();
            else if (dirDropdown.selection.index === 2) shuffleArray(layerInfos);
            var groupSize = Math.max(1, parseInt(groupInput.text) || 1);
            for (var i = 0; i < layerInfos.length; i++) {
                var offset = (groupSize === 1) ? i : (i % groupSize);
                layerInfos[i].offset = offset * staggerTime;
            }

            // PHASE 3: Apply
            app.beginUndoGroup("Stagger Selected Keyframes");
            for (var li = 0; li < layerInfos.length; li++) {
                var info = layerInfos[li], offset = info.offset;
                for (var pi = 0; pi < info.propSnaps.length; pi++) {
                    var prop = info.propSnaps[pi].prop;
                    var keys = info.propSnaps[pi].keys;
                    var hasSelected = false;
                    for (var ki = 0; ki < keys.length; ki++) { if (keys[ki].selected) { hasSelected = true; break; } }
                    if (!hasSelected) continue;
                    for (var ki = 0; ki < keys.length; ki++) { if (keys[ki].selected) keys[ki].time += offset; }
                    while (prop.numKeys > 0) try { prop.removeKey(1); } catch(e) { break; }
                    keys.sort(function(a, b) { return a.time - b.time; });
                    for (var ki = 0; ki < keys.length; ki++) writeKey(prop, keys[ki]);
                }
            }

            // Reselect
            var tol = 1e-6;
            for (var li = 0; li < layerInfos.length; li++) {
                for (var pi = 0; pi < layerInfos[li].propSnaps.length; pi++) {
                    var prop = layerInfos[li].propSnaps[pi].prop;
                    var keys = layerInfos[li].propSnaps[pi].keys;
                    for (var ki = 0; ki < keys.length; ki++) {
                        if (keys[ki].selected) {
                            for (var k = 1; k <= prop.numKeys; k++) {
                                if (Math.abs(prop.keyTime(k) - keys[ki].time) <= tol) {
                                    try { prop.setSelectedAtKey(k, true); } catch(e) {}
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            app.endUndoGroup();
        }

        // ─────────────────────────────────────────────
        // Pull Keyframes
        //   Normal : earliest selected keyframe → playhead
        //   Shift  : latest selected keyframe   → playhead
        // ─────────────────────────────────────────────
        btnPullKeys.onClick = function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) { alert("Please select a composition."); return; }
            var selLayers = comp.selectedLayers;
            if (!selLayers || selLayers.length === 0) { alert("Select at least one layer."); return; }

            // Snapshot all props/keys across selected layers
            var propSnaps = [];
            for (var li = 0; li < selLayers.length; li++) {
                var props = [];
                collectProps(selLayers[li], props);
                for (var pi = 0; pi < props.length; pi++) {
                    var prop = props[pi];
                    var keys = [];
                    for (var k = 1; k <= prop.numKeys; k++) keys.push(readKey(prop, k));
                    propSnaps.push({ prop: prop, keys: keys });
                }
            }

            // Find anchor time (earliest or latest selected key)
            var anchorTime = null;
            for (var i = 0; i < propSnaps.length; i++) {
                for (var ki = 0; ki < propSnaps[i].keys.length; ki++) {
                    var key = propSnaps[i].keys[ki];
                    if (!key.selected) continue;
                    if (anchorTime === null) { anchorTime = key.time; continue; }
                    if (ScriptUI.environment.keyboardState.shiftKey) {
                        if (key.time > anchorTime) anchorTime = key.time; // latest
                    } else {
                        if (key.time < anchorTime) anchorTime = key.time; // earliest
                    }
                }
            }

            if (anchorTime === null) { alert("No selected keyframes found."); return; }

            var offset = comp.time - anchorTime;
            if (offset === 0) return;

            app.beginUndoGroup("Pull Keyframes");

            for (var i = 0; i < propSnaps.length; i++) {
                var prop = propSnaps[i].prop;
                var keys = propSnaps[i].keys;
                var hasSelected = false;
                for (var ki = 0; ki < keys.length; ki++) { if (keys[ki].selected) { hasSelected = true; break; } }
                if (!hasSelected) continue;

                // Shift only selected keys by offset
                for (var ki = 0; ki < keys.length; ki++) {
                    if (keys[ki].selected) keys[ki].time += offset;
                }

                // Remove and rewrite all keys
                while (prop.numKeys > 0) try { prop.removeKey(1); } catch(e) { break; }
                keys.sort(function(a, b) { return a.time - b.time; });
                for (var ki = 0; ki < keys.length; ki++) writeKey(prop, keys[ki]);
            }

            // Reselect
            var tol = 1e-6;
            for (var i = 0; i < propSnaps.length; i++) {
                var prop = propSnaps[i].prop;
                var keys = propSnaps[i].keys;
                for (var ki = 0; ki < keys.length; ki++) {
                    if (keys[ki].selected) {
                        for (var k = 1; k <= prop.numKeys; k++) {
                            if (Math.abs(prop.keyTime(k) - keys[ki].time) <= tol) {
                                try { prop.setSelectedAtKey(k, true); } catch(e) {}
                                break;
                            }
                        }
                    }
                }
            }

            app.endUndoGroup();
        };

        // ─────────────────────────────────────────────
        // Snap Layers
        //   Normal : each layer's in-point  → playhead independently
        //   Shift  : each layer's out-point → playhead independently
        // ─────────────────────────────────────────────
        btnSnapLayers.onClick = function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) { alert("Please select a composition."); return; }
            var sel = comp.selectedLayers;
            if (!sel || sel.length === 0) { alert("Select at least one layer."); return; }

            app.beginUndoGroup("Snap Layers");
            var useOut = ScriptUI.environment.keyboardState.shiftKey;
            for (var i = 0; i < sel.length; i++) {
                var delta = useOut ? (comp.time - sel[i].outPoint) : (comp.time - sel[i].inPoint);
                sel[i].startTime += delta;
            }
            app.endUndoGroup();
        };

        // ─────────────────────────────────────────────
        // Snap Keyframes
        //   Normal : each layer's first selected keyframe → playhead independently
        //   Shift  : each layer's last  selected keyframe → playhead independently
        // ─────────────────────────────────────────────
        btnSnapKeys.onClick = function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) { alert("Please select a composition."); return; }
            var selLayers = comp.selectedLayers;
            if (!selLayers || selLayers.length === 0) { alert("Select at least one layer."); return; }

            var useLast = ScriptUI.environment.keyboardState.shiftKey;

            var layerSnaps = [];
            for (var li = 0; li < selLayers.length; li++) {
                var props = [];
                collectProps(selLayers[li], props);
                var propSnaps = [];
                var anchorTime = null;
                for (var pi = 0; pi < props.length; pi++) {
                    var prop = props[pi];
                    var keys = [];
                    for (var k = 1; k <= prop.numKeys; k++) keys.push(readKey(prop, k));
                    propSnaps.push({ prop: prop, keys: keys });
                    for (var ki = 0; ki < keys.length; ki++) {
                        if (!keys[ki].selected) continue;
                        if (anchorTime === null) { anchorTime = keys[ki].time; continue; }
                        if (useLast  && keys[ki].time > anchorTime) anchorTime = keys[ki].time;
                        if (!useLast && keys[ki].time < anchorTime) anchorTime = keys[ki].time;
                    }
                }
                if (anchorTime === null) continue;
                layerSnaps.push({ propSnaps: propSnaps, offset: comp.time - anchorTime });
            }

            if (layerSnaps.length === 0) { alert("No selected keyframes found."); return; }

            app.beginUndoGroup("Snap Keyframes");
            var tol = 1e-6;
            for (var li = 0; li < layerSnaps.length; li++) {
                var offset = layerSnaps[li].offset;
                for (var pi = 0; pi < layerSnaps[li].propSnaps.length; pi++) {
                    var prop = layerSnaps[li].propSnaps[pi].prop;
                    var keys = layerSnaps[li].propSnaps[pi].keys;
                    var hasSelected = false;
                    for (var ki = 0; ki < keys.length; ki++) { if (keys[ki].selected) { hasSelected = true; break; } }
                    if (!hasSelected) continue;
                    for (var ki = 0; ki < keys.length; ki++) { if (keys[ki].selected) keys[ki].time += offset; }
                    while (prop.numKeys > 0) try { prop.removeKey(1); } catch(e) { break; }
                    keys.sort(function(a, b) { return a.time - b.time; });
                    for (var ki = 0; ki < keys.length; ki++) writeKey(prop, keys[ki]);
                }
            }
            // Reselect
            for (var li = 0; li < layerSnaps.length; li++) {
                for (var pi = 0; pi < layerSnaps[li].propSnaps.length; pi++) {
                    var prop = layerSnaps[li].propSnaps[pi].prop;
                    var keys = layerSnaps[li].propSnaps[pi].keys;
                    for (var ki = 0; ki < keys.length; ki++) {
                        if (keys[ki].selected) {
                            for (var k = 1; k <= prop.numKeys; k++) {
                                if (Math.abs(prop.keyTime(k) - keys[ki].time) <= tol) {
                                    try { prop.setSelectedAtKey(k, true); } catch(e) {}
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            app.endUndoGroup();
        };

        btnLayers.onClick    = staggerLayers;
        btnKeyframes.onClick = staggerSelectedKeyframes;

        win.layout.layout(true);
        return win;
    }

    var myUI = buildUI(thisObj);
    if (myUI instanceof Window) { myUI.center(); myUI.show(); }
})(this);