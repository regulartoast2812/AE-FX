// ============================================================
// LayerStyleEditor.jsx  v16
// - "Undo All": snapshots all style property values at launch,
//   restores them on click — no undo stack counting needed
// - Gradient "Edit Gradient": opens picker on layer 1, then
//   copies the resulting gradient to all other selected layers
// - Live slider preview, each drag = 1 named undo entry
// ============================================================

(function () {

    var STYLE_DEFS = [
        { label:"Gradient Overlay", groupMn:"gradientFill/enabled", props:[
            { label:"Opacity",       mn:"gradientFill/opacity",  type:"slider", min:0,  max:100  },
            { label:"Angle",         mn:"gradientFill/angle",    type:"angle"                    },
            { label:"Scale",         mn:"gradientFill/scale",    type:"slider", min:10, max:150  },
            { label:"Reverse",       mn:"gradientFill/reverse",  type:"bool"                     },
            { label:"Align Layer",   mn:"gradientFill/align",    type:"bool"                     },
            { label:"Edit Colors",   mn:"gradientFill/gradient", type:"gradient_btn"             }
        ]},
        { label:"Color Overlay", groupMn:"solidFill/enabled", props:[
            { label:"Color",   mn:"solidFill/color",   type:"color"                  },
            { label:"Opacity", mn:"solidFill/opacity", type:"slider", min:0, max:100 }
        ]},
        { label:"Pattern Overlay", groupMn:"patternFill/enabled", props:[
            { label:"Opacity", mn:"patternFill/opacity", type:"slider", min:0, max:100 },
            { label:"Scale",   mn:"patternFill/scale",   type:"slider", min:1, max:100 }
        ]},
        { label:"Stroke", groupMn:"frameFX/enabled", props:[
            { label:"Color",    mn:"frameFX/color",   type:"color"                   },
            { label:"Size",     mn:"frameFX/size",    type:"slider", min:1,  max:250 },
            { label:"Opacity",  mn:"frameFX/opacity", type:"slider", min:0,  max:100 },
            { label:"Position", mn:"frameFX/style",   type:"dropdown",
              options:["Outside","Inside","Center"], values:[1,2,3] }
        ]},
        { label:"Outer Glow", groupMn:"outerGlow/enabled", props:[
            { label:"Color",   mn:"outerGlow/color",        type:"color"                   },
            { label:"Opacity", mn:"outerGlow/opacity",      type:"slider", min:0,  max:100 },
            { label:"Noise",   mn:"outerGlow/noise",        type:"slider", min:0,  max:100 },
            { label:"Spread",  mn:"outerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
            { label:"Size",    mn:"outerGlow/blur",         type:"slider", min:0,  max:250 },
            { label:"Range",   mn:"outerGlow/inputRange",   type:"slider", min:1,  max:100 },
            { label:"Jitter",  mn:"outerGlow/shadingNoise", type:"slider", min:0,  max:100 }
        ]},
        { label:"Inner Glow", groupMn:"innerGlow/enabled", props:[
            { label:"Color",   mn:"innerGlow/color",        type:"color"                   },
            { label:"Opacity", mn:"innerGlow/opacity",      type:"slider", min:0,  max:100 },
            { label:"Noise",   mn:"innerGlow/noise",        type:"slider", min:0,  max:100 },
            { label:"Choke",   mn:"innerGlow/chokeMatte",   type:"slider", min:0,  max:100 },
            { label:"Size",    mn:"innerGlow/blur",         type:"slider", min:0,  max:250 },
            { label:"Range",   mn:"innerGlow/inputRange",   type:"slider", min:1,  max:100 },
            { label:"Jitter",  mn:"innerGlow/shadingNoise", type:"slider", min:0,  max:100 }
        ]},
        { label:"Drop Shadow", groupMn:"dropShadow/enabled", props:[
            { label:"Color",        mn:"dropShadow/color",              type:"color"                    },
            { label:"Opacity",      mn:"dropShadow/opacity",            type:"slider", min:0,  max:100 },
            { label:"Angle",        mn:"dropShadow/localLightingAngle", type:"angle"                   },
            { label:"Distance",     mn:"dropShadow/distance",           type:"slider", min:0,  max:300 },
            { label:"Spread",       mn:"dropShadow/chokeMatte",         type:"slider", min:0,  max:100 },
            { label:"Size",         mn:"dropShadow/blur",               type:"slider", min:0,  max:250 },
            { label:"Noise",        mn:"dropShadow/noise",              type:"slider", min:0,  max:100 },
            { label:"Global Light", mn:"dropShadow/useGlobalAngle",     type:"bool"                    },
            { label:"Knocks Out",   mn:"dropShadow/layerConceals",      type:"bool"                    }
        ]},
        { label:"Inner Shadow", groupMn:"innerShadow/enabled", props:[
            { label:"Color",        mn:"innerShadow/color",              type:"color"                   },
            { label:"Opacity",      mn:"innerShadow/opacity",            type:"slider", min:0,  max:100 },
            { label:"Angle",        mn:"innerShadow/localLightingAngle", type:"angle"                   },
            { label:"Distance",     mn:"innerShadow/distance",           type:"slider", min:0,  max:300 },
            { label:"Choke",        mn:"innerShadow/chokeMatte",         type:"slider", min:0,  max:100 },
            { label:"Size",         mn:"innerShadow/blur",               type:"slider", min:0,  max:250 },
            { label:"Noise",        mn:"innerShadow/noise",              type:"slider", min:0,  max:100 },
            { label:"Global Light", mn:"innerShadow/useGlobalAngle",     type:"bool"                    }
        ]},
        { label:"Bevel & Emboss", groupMn:"bevelEmboss/enabled", props:[
            { label:"Depth",        mn:"bevelEmboss/strengthRatio",         type:"slider", min:1,  max:1000 },
            { label:"Size",         mn:"bevelEmboss/blur",                  type:"slider", min:0,  max:250  },
            { label:"Soften",       mn:"bevelEmboss/softness",              type:"slider", min:0,  max:16   },
            { label:"Angle",        mn:"bevelEmboss/localLightingAngle",    type:"angle"                    },
            { label:"Altitude",     mn:"bevelEmboss/localLightingAltitude", type:"slider", min:0,  max:90   },
            { label:"Hi Color",     mn:"bevelEmboss/highlightColor",        type:"color"                    },
            { label:"Hi Opacity",   mn:"bevelEmboss/highlightOpacity",      type:"slider", min:0,  max:100  },
            { label:"Sh Color",     mn:"bevelEmboss/shadowColor",           type:"color"                    },
            { label:"Sh Opacity",   mn:"bevelEmboss/shadowOpacity",         type:"slider", min:0,  max:100  },
            { label:"Global Light", mn:"bevelEmboss/useGlobalAngle",        type:"bool"                     }
        ]},
        { label:"Satin", groupMn:"chromeFX/enabled", props:[
            { label:"Color",    mn:"chromeFX/color",              type:"color"                   },
            { label:"Opacity",  mn:"chromeFX/opacity",            type:"slider", min:0,  max:100 },
            { label:"Angle",    mn:"chromeFX/localLightingAngle", type:"angle"                   },
            { label:"Distance", mn:"chromeFX/distance",           type:"slider", min:0,  max:250 },
            { label:"Size",     mn:"chromeFX/blur",               type:"slider", min:0,  max:250 },
            { label:"Invert",   mn:"chromeFX/invert",             type:"bool"                    }
        ]}
    ];

    // ── Helpers ───────────────────────────────────────────────

    function rgbToHex(a) {
        function h(v){ var s=Math.round(v*255).toString(16); return s.length===1?"0"+s:s; }
        return "#"+h(a[0])+h(a[1])+h(a[2]);
    }

    function getPropObj(layer, gMn, pMn) {
        try { return layer.property("ADBE Layer Styles").property(gMn).property(pMn)||null; }
        catch(e){ return null; }
    }
    function readVal(layer, gMn, pMn) {
        var p=getPropObj(layer,gMn,pMn);
        try { return p?p.value:null; } catch(e){ return null; }
    }

    // ── AE dark color picker ──────────────────────────────────
    function aeColorPicker(startAE) {
        var c=app.project.activeItem;
        if (!c||!(c instanceof CompItem)) return null;
        var ps=[];
        for (var i=1;i<=c.numLayers;i++) if(c.layer(i).selected) ps.push(i);
        var nl=c.layers.addNull();
        var cp=nl.property("ADBE Effect Parade").addProperty("ADBE Color Control").property("ADBE Color Control-0001");
        nl.shy=true; nl.enabled=false;
        if (startAE&&startAE.length>=3) cp.setValue([startAE[0],startAE[1],startAE[2],1]);
        for (var j=1;j<=c.numLayers;j++) c.layer(j).selected=false;
        cp.selected=true;
        app.executeCommand(app.findMenuCommandId("Edit Value..."));
        var r=cp.value.slice(0,3);
        nl.remove();
        for (var k=0;k<ps.length;k++) c.layer(ps[k]).selected=true;
        return r;
    }

    // ── Gradient editor ─────────────────────────────────────
    // Opens AE's native gradient editor on ALL selected layers simultaneously.
    // AE applies the result to all of them at once.
    function openGradientEditorAll(layerData, gMn) {
        var comp=app.project.activeItem;
        if (!comp||!(comp instanceof CompItem)) return;
        var ps=[];
        for (var i=1;i<=comp.numLayers;i++) if(comp.layer(i).selected) ps.push(i);
        for (var j=1;j<=comp.numLayers;j++) comp.layer(j).selected=false;
        var found=0;
        for (var li=0;li<layerData.length;li++) {
            if (!layerData[li].active[gMn]) continue;
            var layer=layerData[li].layer;
            layer.selected=true;
            try {
                var cp=layer.property("ADBE Layer Styles").property("gradientFill/enabled").property(3);
                if (cp) cp.selected=true;
            } catch(e){}
            found++;
        }
        if (found>0) app.executeCommand(app.findMenuCommandId("Edit Value..."));
        for (var k=0;k<ps.length;k++) comp.layer(ps[k]).selected=true;
    }

        // ── Detect active styles ──────────────────────────────────
    function getActiveStyles(layer) {
        var active={};
        try {
            var sg=layer.property("ADBE Layer Styles");
            if (!sg) return active;
            for (var i=0;i<STYLE_DEFS.length;i++) {
                try {
                    var grp=sg.property(STYLE_DEFS[i].groupMn);
                    if (grp&&grp.enabled===true) active[STYLE_DEFS[i].groupMn]=true;
                } catch(e){}
            }
        } catch(e){}
        return active;
    }

    // ── Gather layers ─────────────────────────────────────────
    var comp=app.project.activeItem;
    if (!comp||!(comp instanceof CompItem)){ alert("Open a composition first."); return; }
    var sel=comp.selectedLayers;
    if (!sel.length){ alert("Select at least one layer."); return; }

    var layerData=[], globalActive={};
    for (var i=0;i<sel.length;i++) {
        var active=getActiveStyles(sel[i]);
        layerData.push({layer:sel[i], active:active});
        for (var mn in active) globalActive[mn]=true;
    }
    var LC=sel.length;
    var hasAny=false; for(var x in globalActive){hasAny=true;break;}
    if (!hasAny){ alert("No active layer styles found."); return; }

    // ── Snapshot ALL style property values at launch ──────────
    // snapshot[layerIndex][gMn][pMn] = value
    // Also snapshot enabled state per style group.
    // Used by "Undo All" to restore exactly the state before the script ran.
    var snapshot=[];
    for (var li=0;li<LC;li++) {
        snapshot[li]={ enabled:{}, props:{} };
        for (var si=0;si<STYLE_DEFS.length;si++) {
            var def=STYLE_DEFS[si];
            var gMn=def.groupMn;
            // Snapshot enabled flag for every style (not just active ones)
            try {
                var grp=layerData[li].layer.property("ADBE Layer Styles").property(gMn);
                snapshot[li].enabled[gMn] = grp ? grp.enabled : false;
            } catch(e){ snapshot[li].enabled[gMn]=false; }
            // Snapshot each prop value
            snapshot[li].props[gMn]={};
            for (var pi=0;pi<def.props.length;pi++) {
                var pMn=def.props[pi].mn;
                if (def.props[pi].type==="gradient_btn") {
                    // Snapshot the gradient Colors sub-property separately
                    try {
                        var gradGrp=layerData[li].layer.property("ADBE Layer Styles").property(gMn);
                        for (var gti=0;gti<GRAD_TRIES.length;gti++) {
                            try {
                                var gcp=gradGrp.property(GRAD_TRIES[gti]);
                                if (gcp) {
                                    var gcv=gcp.value;
                                    if (gcv) snapshot[li].props[gMn]["__gradient__"]=gcv;
                                    break;
                                }
                            } catch(ge){}
                        }
                    } catch(ge2){}
                    continue;
                }
                try {
                    var v=readVal(layerData[li].layer, gMn, pMn);
                    if (v!==null) snapshot[li].props[gMn][pMn]=v;
                } catch(e){}
            }
        }
    }

    // ── Apply helpers ─────────────────────────────────────────
    function applyToAll(gMn, pMn, val, label) {
        app.beginUndoGroup("Style: "+(label||pMn));
        for (var i=0;i<LC;i++) {
            if (!layerData[i].active[gMn]) continue;
            var p=getPropObj(layerData[i].layer,gMn,pMn);
            if (p) try { p.setValue(val); } catch(e){}
        }
        app.endUndoGroup();
    }

    // Live: no undo group, no counting — just raw setValue for smooth drag preview
    function applyLive(gMn, pMn, val) {
        for (var i=0;i<LC;i++) {
            if (!layerData[i].active[gMn]) continue;
            var p=getPropObj(layerData[i].layer,gMn,pMn);
            if (p) try { p.setValue(val); } catch(e){}
        }
    }

    function setStyleEnabled(gMn, state, label) {
        app.beginUndoGroup((state?"Enable: ":"Disable: ")+(label||gMn));
        for (var i=0;i<LC;i++) {
            try {
                var grp=layerData[i].layer.property("ADBE Layer Styles").property(gMn);
                if (grp) grp.enabled=state;
            } catch(e){}
        }
        app.endUndoGroup();
    }

    function firstVal(gMn, pMn) {
        for (var i=0;i<LC;i++) {
            if (!layerData[i].active[gMn]) continue;
            var v=readVal(layerData[i].layer,gMn,pMn);
            if (v!==null) return v;
        }
        return null;
    }

    // ── Restore snapshot ──────────────────────────────────────
    function restoreSnapshot() {
        app.beginUndoGroup("Undo All Layer Style Edits");
        for (var li=0;li<LC;li++) {
            for (var si=0;si<STYLE_DEFS.length;si++) {
                var def=STYLE_DEFS[si];
                var gMn=def.groupMn;
                // Restore enabled state
                try {
                    var grp=layerData[li].layer.property("ADBE Layer Styles").property(gMn);
                    if (grp) grp.enabled = snapshot[li].enabled[gMn];
                } catch(e){}
                // Restore each prop
                if (snapshot[li].props[gMn]) {
                    for (var pMn in snapshot[li].props[gMn]) {
                        if (pMn==="__gradient__") {
                            // Restore gradient Colors sub-prop
                            try {
                                var rgg=layerData[li].layer.property("ADBE Layer Styles").property(gMn);
                                for (var rgti=0;rgti<GRAD_TRIES.length;rgti++) {
                                    try {
                                        var rgp=rgg.property(GRAD_TRIES[rgti]);
                                        if (rgp){ rgp.setValue(snapshot[li].props[gMn][pMn]); break; }
                                    } catch(rge){}
                                }
                            } catch(rge2){}
                            continue;
                        }
                        var p=getPropObj(layerData[li].layer, gMn, pMn);
                        if (p) try { p.setValue(snapshot[li].props[gMn][pMn]); } catch(e){}
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    // ── Build UI ──────────────────────────────────────────────
    var COLS=3, CW=100, SLW=62, ETW=44;

    var win=new Window("palette","Layer Style Editor",undefined,{resizeable:true});
    win.orientation="column"; win.alignChildren=["fill","top"];
    win.spacing=0; win.margins=0;
    win.addEventListener("keydown",function(e){
        if(e.keyName==="Escape"){ restoreSnapshot(); win.close(); }
        // Ctrl+Z (Win) or Cmd+Z (Mac) = Undo All & Close
        if(e.keyName==="Z" && (e.ctrlKey||e.metaKey)){ restoreSnapshot(); win.close(); }
    });

    function div(p){ var d=p.add("panel"); d.alignment=["fill","center"]; d.preferredSize.height=1; }

    // Header
    var hdr=win.add("group");
    hdr.margins=[10,6,10,4]; hdr.orientation="row";
    hdr.alignChildren=["fill","center"]; hdr.spacing=4;
    var t1=hdr.add("statictext",undefined,"LAYER STYLE EDITOR");
    t1.graphics.font=ScriptUI.newFont("dialog","BOLD",10);
    var t2=hdr.add("statictext",undefined,sel.length+" layer(s)  |  ESC to close");
    t2.graphics.font=ScriptUI.newFont("dialog","REGULAR",8);
    div(win);

    var body=win.add("group");
    body.orientation="column"; body.alignChildren=["fill","top"];
    body.spacing=0; body.margins=0;

    for (var si=0;si<STYLE_DEFS.length;si++) {
        var def=STYLE_DEFS[si];
        if (!globalActive[def.groupMn]) continue;

        // Section header: name + Enable/Disable
        var sh=body.add("group");
        sh.margins=[8,5,8,2]; sh.orientation="row";
        sh.alignChildren=["left","center"]; sh.spacing=4;
        var shT=sh.add("statictext",undefined,def.label.toUpperCase());
        shT.graphics.font=ScriptUI.newFont("dialog","BOLD",8);
        var enBtn=sh.add("button",undefined,"Enable");
        enBtn.preferredSize=[44,14]; enBtn.graphics.font=ScriptUI.newFont("dialog","REGULAR",7);
        enBtn.onClick=(function(gMn,lbl){return function(){ setStyleEnabled(gMn,true,lbl); };})(def.groupMn,def.label);
        var disBtn=sh.add("button",undefined,"Disable");
        disBtn.preferredSize=[44,14]; disBtn.graphics.font=ScriptUI.newFont("dialog","REGULAR",7);
        disBtn.onClick=(function(gMn,lbl){return function(){ setStyleEnabled(gMn,false,lbl); };})(def.groupMn,def.label);

        div(body);

        var grid=body.add("group");
        grid.orientation="column"; grid.alignChildren=["left","top"];
        grid.margins=[6,3,6,6]; grid.spacing=2;

        (function(def,grid){
            var row=null, col=0;
            for (var pi=0;pi<def.props.length;pi++) {
                var pd=def.props[pi], gMn=def.groupMn, pMn=pd.mn;
                var cv=firstVal(gMn,pMn);

                // Gradient — opens AE editor on all layers at once
                if (pd.type==="gradient_btn") {
                    if (row!==null&&col>0){ row=null; col=0; }
                    var gr=grid.add("group");
                    gr.orientation="row"; gr.alignChildren=["left","center"];
                    gr.spacing=4; gr.margins=0;
                    var totalW=CW*COLS+4*(COLS-1);
                    var gb=gr.add("button",undefined,"Edit Gradient (All Layers)...");
                    gb.preferredSize=[totalW,18];
                    gb.graphics.font=ScriptUI.newFont("dialog","REGULAR",9);
                    gb.onClick=(function(gMn){ return function(){
                        openGradientEditorAll(layerData,gMn);
                    };})(gMn);
                    continue;
                }

                                if (col===0){
                    row=grid.add("group");
                    row.orientation="row"; row.alignChildren=["left","top"];
                    row.spacing=2; row.margins=0;
                }

                var cell=row.add("group");
                cell.orientation="column"; cell.alignChildren=["fill","top"];
                cell.spacing=2; cell.margins=[2,1,2,1];
                cell.preferredSize.width=CW;

                var lbl=cell.add("statictext",undefined,pd.label);
                lbl.graphics.font=ScriptUI.newFont("dialog","REGULAR",8);

                if (pd.type==="slider"||pd.type==="angle") {
                    var mn2=pd.type==="angle"?0:pd.min;
                    var mx2=pd.type==="angle"?360:pd.max;
                    var v0=(cv!==null&&cv!==undefined)?cv:mn2;
                    var sr=cell.add("group");
                    sr.orientation="row"; sr.alignChildren=["left","center"];
                    sr.spacing=2; sr.margins=0;
                    var sl=sr.add("slider",undefined,v0,mn2,mx2);
                    sl.preferredSize=[SLW,12];
                    var et=sr.add("edittext",undefined,""+Math.round(v0));
                    et.preferredSize=[ETW,18];
                    et.graphics.font=ScriptUI.newFont("dialog","REGULAR",10);
                    if (pd.type==="angle") sr.add("statictext",undefined,"°").graphics.font=ScriptUI.newFont("dialog","REGULAR",8);

                    // Drag: open one undo group on first movement, close on release
                    sl.onChanging=(function(sl,et,gMn,pMn,lbl){
                        return function(){
                            if (!sl._dragOpen) {
                                app.beginUndoGroup("Style: "+lbl);
                                sl._dragOpen=true;
                            }
                            et.text=Math.round(sl.value)+"";
                            applyLive(gMn,pMn,parseFloat(sl.value));
                        };
                    })(sl,et,gMn,pMn,pd.label);
                    sl.onChange=(function(sl,et,gMn,pMn){return function(){
                        var v=parseFloat(sl.value);
                        et.text=Math.round(v)+"";
                        applyLive(gMn,pMn,v);
                        if (sl._dragOpen) { app.endUndoGroup(); sl._dragOpen=false; }
                        else { app.beginUndoGroup("Style: slider"); applyLive(gMn,pMn,v); app.endUndoGroup(); }
                    };})(sl,et,gMn,pMn);
                    et.onChange=(function(sl,et,gMn,pMn,mn2,mx2,lbl){return function(){
                        var v=parseFloat(et.text); if(isNaN(v))return;
                        v=Math.max(mn2,Math.min(mx2,v));
                        sl.value=v; et.text=Math.round(v)+"";
                        applyToAll(gMn,pMn,v,lbl);
                    };})(sl,et,gMn,pMn,mn2,mx2,pd.label);

                } else if (pd.type==="bool") {
                    var cb=cell.add("checkbox",undefined,"on");
                    cb.value=(cv===true||cv===1);
                    cb.graphics.font=ScriptUI.newFont("dialog","REGULAR",8);
                    cb.onChange=(function(cb,gMn,pMn,lbl){return function(){
                        applyToAll(gMn,pMn,cb.value,lbl);
                    };})(cb,gMn,pMn,pd.label);

                } else if (pd.type==="color") {
                    var initC=(cv&&cv.length>=3)?[cv[0],cv[1],cv[2]]:[1,0,0];
                    var sBtn=cell.add("button",undefined,"");
                    sBtn.preferredSize=[Math.floor((CW-4)/2),18];
                    sBtn.aeColor=initC.slice();
                    sBtn.onDraw=function(){
                        var g=this.graphics,c=this.aeColor;
                        var b=g.newBrush(g.BrushType.SOLID_COLOR,[c[0],c[1],c[2],1]);
                        g.rectPath(0,0,this.size[0],this.size[1]); g.fillPath(b);
                    };
                    var hLbl=cell.add("statictext",undefined,rgbToHex(initC));
                    hLbl.graphics.font=ScriptUI.newFont("dialog","REGULAR",7);
                    sBtn.onClick=(function(sBtn,hLbl,gMn,pMn,lbl){return function(){
                        var r=aeColorPicker(sBtn.aeColor);
                        if(!r) return;
                        sBtn.aeColor=[r[0],r[1],r[2]];
                        hLbl.text=rgbToHex(r);
                        sBtn.notify("onDraw"); win.update();
                        applyToAll(gMn,pMn,r,lbl);
                    };})(sBtn,hLbl,gMn,pMn,pd.label);

                } else if (pd.type==="dropdown") {
                    var dd=cell.add("dropdownlist",undefined,pd.options);
                    dd.preferredSize.width=CW-4;
                    if (cv!==null) for(var vi=0;vi<pd.values.length;vi++) if(pd.values[vi]===cv){dd.selection=vi;break;}
                    if (!dd.selection&&dd.items.length) dd.selection=0;
                    dd.onChange=(function(dd,gMn,pMn,vals,lbl){return function(){
                        if(!dd.selection)return;
                        applyToAll(gMn,pMn,vals[dd.selection.index],lbl);
                    };})(dd,gMn,pMn,pd.values,pd.label);
                }

                col++; if(col>=COLS){ col=0; row=null; }
            }
        })(def,grid);

        div(body);
    }

    // Footer
    var footer=win.add("group");
    footer.margins=[10,5,10,7]; footer.spacing=6;

    var undoAllBtn=footer.add("button",undefined,"Undo All  [ESC / Ctrl+Z]");
    undoAllBtn.preferredSize=[150,18];
    undoAllBtn.onClick=function(){ restoreSnapshot(); win.close(); };

    var confirmBtn=footer.add("button",undefined,"Confirm");
    confirmBtn.preferredSize=[70,18];
    confirmBtn.onClick=function(){ win.close(); };

    win.center();
    win.show();

}());
