const cs = new CSInterface();
const QUICK_PANEL_MODE = /(?:^|\/)quick\.html(?:$|[?#])/i.test(String(window.location.href || ""));
const timelineEl = document.getElementById("timeline");
const rulerEl = document.getElementById("ruler");
const rulerWrapEl = document.getElementById("rulerWrap");
const playheadEl = document.getElementById("playhead");
const compSelectEl = document.getElementById("compSelect");
const compSelectButtonEl = document.getElementById("compSelectButton");
const compSelectSearchEl = document.getElementById("compSelectSearch");
const compSelectMenuEl = document.getElementById("compSelectMenu");
const statusEl = document.getElementById("status");
const timeDisplayEl = document.getElementById("timeDisplay");
const scrollAreaEl = document.getElementById("scrollArea");
const bottomRulerEl = document.getElementById("bottomRuler");
const bottomRulerWrapEl = document.getElementById("bottomRulerWrap");
const topMarkerRailEl = document.getElementById("topMarkerRail");
const bottomMarkerRailEl = document.getElementById("bottomMarkerRail");
const selectionBoxEl = document.getElementById("selectionBox");
const horizontalScrollBarEl = document.getElementById("horizontalScrollBar");
const horizontalScrollThumbEl = document.getElementById("horizontalScrollThumb");
const activeFilterNoticeEl = document.getElementById("activeFilterNotice");
const keyframeModeBtnEl = document.getElementById("keyframeModeBtn");
const durationBtnEl = document.getElementById("durationBtn");
const durationModalEl = document.getElementById("durationModal");
const durationInputEl = document.getElementById("durationInput");
const durationErrorEl = document.getElementById("durationError");
const durationApplyEl = document.getElementById("durationApply");
const durationCancelEl = document.getElementById("durationCancel");
const expressionModalEl = document.getElementById("expressionModal");
const expressionTitleEl = document.getElementById("expressionTitle");
const expressionSubtitleEl = document.getElementById("expressionSubtitle");
const expressionInputEl = document.getElementById("expressionInput");
const expressionErrorEl = document.getElementById("expressionError");
const expressionApplyEl = document.getElementById("expressionApply");
const expressionCancelEl = document.getElementById("expressionCancel");
const expressionDisableEl = document.getElementById("expressionDisable");
const anchorModalEl = document.getElementById("anchorModal");
const anchorGridEl = document.getElementById("anchorGrid");
const anchorAlignGridEl = document.getElementById("anchorAlignGrid");
const anchorUseMasksEl = document.getElementById("anchorUseMasks");
const anchorErrorEl = document.getElementById("anchorError");
const compositionModalEl = document.getElementById("compositionModal");
const compositionNameEl = document.getElementById("compositionName");
const compositionErrorEl = document.getElementById("compositionError");
const flowChartOverlayEl = document.getElementById("flowChartOverlay");
const flowChartBodyEl = document.getElementById("flowChartBody");
const flowChartSubtitleEl = document.getElementById("flowChartSubtitle");
const flowChartCloseEl = document.getElementById("flowChartClose");
const layerMenuEl = document.getElementById("layerMenu");
const filterColumnEl = document.getElementById("filterColumn");
const settingsBtnEl = document.getElementById("settingsBtn");
const layerSelectionModalEl = document.getElementById("layerSelectionModal");
const layerSelectionCountEl = document.getElementById("layerSelectionCount");
const layerSelectionSearchEl = document.getElementById("layerSelectionSearch");
const layerSelectionSearchClearEl = document.getElementById("layerSelectionSearchClear");
const layerSelectionSelectMatchesEl = document.getElementById("layerSelectionSelectMatches");
const layerViewFiltersEl = document.getElementById("layerViewFilters");
const layerSelectionScopesEl = document.getElementById("layerSelectionScopes");
const layerSelectionModesEl = document.getElementById("layerSelectionModes");
const layerSelectionQuickFiltersEl = document.getElementById("layerSelectionQuickFilters");
const layerSelectionShownCountEl = document.getElementById("layerSelectionShownCount");
const layerSelectionListEl = document.getElementById("layerSelectionList");
const platformBadgeEl = document.getElementById("platformBadge");

let state = { comp: null, layers: [], selectedLayerIndices: [], compMarkers: [] };
let lastSelectedLayerIndex = 0;
let jsxLoaded = false;
let isPlaying = false;
let playTimer = null;
let playbackRaf = 0;
let playbackStartMs = 0;
let playbackStartTime = 0;
let playbackLastAeSendMs = 0;
let playbackLastAeFrame = -1;
let playbackAeInFlight = false;
let playbackPendingAeTime = null;
let playbackGeneration = 0;
let lastPlayheadHeight = 0;
let lastPlayheadTrackCount = -1;
let lastSignature = "";
let panelFocused = document.hasFocus();
let panelPointerInside = false;
let panelSyncPaused = false;
let resumeSyncInFlight = false;
let panelActivationSyncTimer = null;
let lastPanelActivationSyncAt = 0;
let syncInterval = null;
let syncInFlight = false;
let lastFullSyncAt = 0;
let lastLayerFingerprint = "";
let settledActionRefreshTimer = null;
let settledActionRefreshInFlight = false;
let backgroundSyncInterval = null;
let nativeSelectionMonitorActive = false;
let nativeSelectionRefreshTimer = null;
let nativeSelectionKeyframeSyncTimer = null;
let panelBlurPauseTimer = null;
let isScrubbing = false;
let isMarqueeSelecting = false;
let activeLayerFilter = null;
let activeLayerFilterScopeIndices = null;
let layerSelectionScope = "selected";
let layerSelectionFilter = null;
let layerSelectionMode = "layer";
let timelineMode = "edit";
let expandedKeyframeLayers = {};
let expandedTransformLayers = {};
let keyframeLayerFilter = null;
let showTrackMatteLinks = true;
let showParentLinks = false;
let layerSelectionQuery = "";
let lastLayerSelectionIndex = 0;
let layerSelectionApplyInFlight = false;
let layerSelectionPendingIndices = null;

let pixelsPerSecond = 90;
const MIN_PIXELS_PER_SECOND = 25;
const MAX_PIXELS_PER_SECOND = 12000;
const FILTER_GUTTER = 30;
const TRACK_GUTTER = 92;
const LEFT_GUTTER = FILTER_GUTTER + TRACK_GUTTER;
const TRACK_HEIGHT = 30;
const RELATION_COLORS = {
  matte: "#35c7ff",
  parent: "#5fd36f"
};
let visibleStart = 0;
let visibleDuration = 10;
let userZoomed = false;
let suppressSyncUntil = 0;
let isMarkerDragging = false;
let isKeyframeDragging = false;
let layerMenuOpenedAt = 0;
let layerMenuPinned = false;
let pendingMenuRefresh = false;
let snapGuideEl = null;
let dropInsertGuideEl = null;
let fxConsoleEl = null;
let fxConsoleEffects = [];
let fxConsoleSelectedIndex = 0;
let fxConsoleLastKeyboardAt = 0;
let fxConsoleLastPointerMoveAt = 0;
let fxConsoleParentEntry = null;
let tntV3HostLoaded = false;
let tntCommandDialogEl = null;
let activeTntDialogResolve = null;
let layerStyleDialogEl = null;
let layerStyleEditSnapshot = null;
let layerStyleKnownAdded = new Set();
let layerStylePinnedOff = new Set();
let layerStyleLastByGmn = new Map();
let layerStyleRecentAddGmn = "";
let layerStylePresetNameOpen = false;
let maskControlDialogEl = null;
let effectsControlDialogEl = null;
let shapesControlDialogEl = null;
let quickLayerMenuDialogEl = null;
let settingsMenuEl = null;
let shortcutRundownEl = null;
let panelTooltipEl = null;
let easeDialogEl = null;
let easeDialogState = { influenceIn: 75, influenceOut: 75, speedIn: 100, speedOut: 100, dragHandle: null };
let easeLiveApplyTimer = null;
let easeLiveApplyInFlight = false;
let easeLiveApplyQueued = null;
let styleSliderLiveTimers = new WeakMap();
let maskSliderLiveTimers = new WeakMap();
let easeHostReloaded = false;
let easeGraphZoom = 100;
let easeGraphAutoZoomAt = 0;
let easeGraphAutoZoomArmed = true;
let selectedKeyframes = [];
let compSelectUpdating = false;
let activeExpressionTarget = null;
let isTimeDisplayEditing = false;
let selectedAnchorPoint = "C";
let suppressEscapeKeyupUntil = 0;
let suppressPanelShortcutKeyupUntil = 0;
let suppressPanelShortcutKeyupKey = "";
let suppressPanelShortcutKeys = {};
let recentPanelShortcutUntil = 0;
let activeCriticalShortcut = "";
let activeCriticalShortcutUntil = 0;
let registeredKeyInterestJSON = "";
let pendingUndoRequests = 0;
let undoDrainInFlight = false;
let propertyValueHoverEl = null;
let propertyValueEditorEl = null;
let propertyValueHoverTimer = null;
let propertyValueHoverRequest = 0;
let propertyValueHoverTarget = null;
let propertyValueEditorKeys = [];
let propertyValueEditorCommitInFlight = false;
let propertyValueEditorCommitQueued = false;
let propertyValueEditorLastCommitted = "";
let quickPanelRefreshPromise = null;

const EASE_GRAPH = {
  viewX: 0,
  viewY: -80,
  viewW: 220,
  viewH: 300,
  left: 7,
  right: 213,
  top: -8,
  bottom: 148,
  minY: -238,
  maxY: 378,
  influenceReach: 0.5,
  speedY: 0.46
};

const FX_CONSOLE_COMMANDS = [
  { type: "command", name: "Open Quick Controls", category: "Native", does: "Open", targets: [], shortcut: "Ctrl+Space", action: launchNativeQuickControls },
  { type: "command", name: "Trim In to Playhead", category: "Shortcut", does: "Set", targets: ["Layer"], shortcut: "Q", action: () => runBundledShortcut('Trim In to playhead.jsxbin') },
  { type: "command", name: "Trim Out to Playhead", category: "Shortcut", does: "Set", targets: ["Layer"], shortcut: "W", action: () => runBundledShortcut('Trim Out to playhead.jsxbin') },
  { type: "command", name: "Go to Next Marker Boundary", category: "Navigation", does: "Go To", targets: ["Marker"], shortcut: "X", action: () => goToMarkerBoundary(1) },
  { type: "command", name: "Go to Previous Marker Boundary", category: "Navigation", does: "Go To", targets: ["Marker"], shortcut: "Alt+X", action: () => goToMarkerBoundary(-1) },
  { type: "command", name: "Toggle Edit / Keyframe View", category: "View", does: "Show", targets: ["Animation"], shortcut: "Option/Alt+`", action: toggleTimelineMode },
  { type: "command", name: "Composition Flow", category: "Navigation", does: "Show", targets: ["Comp"], shortcut: "Tab", action: toggleFlowChart },
  { type: "command", name: "Reveal Keyframes", category: "View", does: "Show", targets: ["Animation"], shortcut: "U", action: toggleSelectedKeyframeExpansion },
  { type: "command", name: "Expand Animated Keyframe Properties", category: "View", does: "Show", targets: ["Animation"], shortcut: "", action: expandAnimatedKeyframeProperties },
  { type: "command", name: "Collapse Keyframe Properties", category: "View", does: "Show", targets: ["Animation"], shortcut: "", action: collapseAllKeyframeProperties },
  { type: "command", name: "Reveal Transform Properties", category: "View", does: "Show", targets: ["Layer"], shortcut: "T", action: revealSelectedTransformProperties },
  { type: "command", name: "Ease Editor", category: "Keyframes", does: "Open", targets: ["Animation"], shortcut: "E", visibleWhen: "selectedKeyframes", action: () => openSubpanelByKey("ease") },
  { type: "command", name: "Apply Easy Ease", category: "Keyframes", does: "Apply", targets: ["Animation"], shortcut: "Shift+E", visibleWhen: "selectedKeyframes", action: applyEasyEaseDirect },
  { type: "command", name: "Mask Control", category: "Masks", does: "Open", targets: ["Mask"], shortcut: "F", action: () => openSubpanelByKey("mask") },
  { type: "command", name: "Effects Control", category: "Effects", does: "Open", targets: ["Effect"], shortcut: "", action: () => openSubpanelByKey("effects") },
  { type: "command", name: "Shape Control", category: "Shapes", does: "Open", targets: ["Shape"], shortcut: "", action: () => openSubpanelByKey("shapes") },
  { type: "command", name: "Layer Menu", category: "Layers", does: "Open", targets: ["Layer"], shortcut: "", action: () => openSubpanelByKey("layer-menu") },
  { type: "command", name: "Focus Selected Layers", category: "View", does: "Show", targets: ["Layer"], shortcut: "Shift+F", action: toggleKeyframeFocusMode },
  { type: "command", name: "Layer Styles...", category: "Layer Styles", does: "Open", targets: ["Style"], shortcut: "S", action: () => openSubpanelByKey("styles") },
  { type: "command", name: "Rename Composition...", category: "Composition", does: "Set", targets: ["Comp"], shortcut: "", action: promptRenameComp },
  { type: "command", name: "Set Composition Length", category: "Composition", does: "Set", targets: ["Comp"], shortcut: "", action: promptCompDuration },
  { type: "command", name: "Composition Tools", category: "Composition", does: "Open", targets: ["Comp"], shortcut: "C", action: () => openSubpanelByKey("composition") },
  { type: "command", name: "Anchor Point Master", category: "Anchor", does: "Open", targets: ["Layer"], shortcut: "A", action: () => openSubpanelByKey("anchor") },
  { type: "command", name: "Center Anchor Point", category: "Anchor", does: "Set", targets: ["Layer"], shortcut: "Shift+A", action: centerSelectedAnchorPoints },
  { type: "command", name: "Layer Selection & Filters", category: "Layers", does: "Open", targets: ["Layer"], shortcut: "Shift+X", action: () => openSubpanelByKey("filter") },
  { type: "command", name: "Stagger & Layer Order", category: "Layers", does: "Open", targets: ["Layer"], shortcut: "", action: () => openSubpanelByKey("timing-order") },
  { type: "command", name: "Flip Layer Order", category: "Layers", does: "Set", targets: ["Layer"], shortcut: "", action: () => moveSelectedLayersInStack("reverse") },
  { type: "command", name: "Duplicate Selected Layers", category: "Edit", does: "Add", targets: ["Layer"], shortcut: "Ctrl+D", action: duplicateSelectedLayers },
  { type: "command", name: "Split Selected Layers", category: "Edit", does: "Set", targets: ["Layer"], shortcut: "3", action: splitSelectedLayersAtPlayhead },
  { type: "command", name: "Delete Selected Layers", category: "Edit", does: "Delete", targets: ["Layer"], shortcut: "Delete", action: deleteSelectedLayers },
  { type: "command", name: "Add Layer", category: "Layers", does: "Add", targets: ["Layer"], children: [
    { name: "Add Null Layer", category: "Layers", does: "Add", targets: ["Layer"], action: () => createLayerFromFxConsole("null") },
    { name: "Add Shape Layer", category: "Layers", does: "Add", targets: ["Shape", "Layer"], action: () => createLayerFromFxConsole("shape") },
    { name: "Add Text Layer", category: "Layers", does: "Add", targets: ["Text", "Layer"], action: () => createLayerFromFxConsole("text") },
    { name: "Add Box Text Layer", category: "Layers", does: "Add", targets: ["Text", "Layer"], action: () => createLayerFromFxConsole("boxtext") },
    { name: "Add Solid Layer", category: "Layers", does: "Add", targets: ["Layer"], action: () => createLayerFromFxConsole("solid") },
    { name: "Add Adjustment Layer", category: "Layers", does: "Add", targets: ["Layer"], action: () => createLayerFromFxConsole("adjustment") },
    { name: "Add Camera Layer", category: "Layers", does: "Add", targets: ["Layer"], action: () => createLayerFromFxConsole("camera") },
    { name: "Add Light Layer", category: "Layers", does: "Add", targets: ["Layer"], action: () => createLayerFromFxConsole("light") }
  ] },
  { type: "command", name: "Snap Layers to Playhead In Point", category: "Snap", does: "Set", targets: ["Layer"], shortcut: "", action: () => runLayerTimingAction("snap", { anchor: "in" }) },
  { type: "command", name: "Snap Layers to Playhead Out Point", category: "Snap", does: "Set", targets: ["Layer"], shortcut: "", action: () => runLayerTimingAction("snap", { anchor: "out" }) },
  { type: "command", name: "Pull Layer Group to Playhead In Point", category: "Pull", does: "Set", targets: ["Layer"], shortcut: "", action: () => runLayerTimingAction("pull", { anchor: "in" }) },
  { type: "command", name: "Pull Layer Group to Playhead Out Point", category: "Pull", does: "Set", targets: ["Layer"], shortcut: "", action: () => runLayerTimingAction("pull", { anchor: "out" }) },
  { type: "command", name: "Snap Keyframes to Playhead First Key", category: "Snap", does: "Set", targets: ["Animation"], shortcut: "", action: () => runKeyframeTimingAction("snap", { anchor: "first" }) },
  { type: "command", name: "Snap Keyframes to Playhead Last Key", category: "Snap", does: "Set", targets: ["Animation"], shortcut: "", action: () => runKeyframeTimingAction("snap", { anchor: "last" }) },
  { type: "command", name: "Snap Keyframes to Layer In Point", category: "Snap", does: "Set", targets: ["Animation"], shortcut: "", action: () => runKeyframeTimingAction("snap", { anchor: "layerIn" }) },
  { type: "command", name: "Snap Keyframes to Layer Out Point", category: "Snap", does: "Set", targets: ["Animation"], shortcut: "", action: () => runKeyframeTimingAction("snap", { anchor: "layerOut" }) },
  { type: "command", name: "Pull Selected Keyframes to Playhead First Key", category: "Pull", does: "Set", targets: ["Animation"], shortcut: "", visibleWhen: "selectedKeyframes", action: () => runKeyframeTimingAction("pull", { anchor: "first" }) },
  { type: "command", name: "Pull Selected Keyframes to Playhead Last Key", category: "Pull", does: "Set", targets: ["Animation"], shortcut: "", visibleWhen: "selectedKeyframes", action: () => runKeyframeTimingAction("pull", { anchor: "last" }) },
  { type: "command", name: "Stagger Selected Keyframes 5 Frames Ascending", category: "Stagger", does: "Space", targets: ["Animation"], shortcut: "", visibleWhen: "selectedKeyframes", action: () => runKeyframeTimingAction("stagger", { direction: "asc", amount: 5, unit: "frames", group: 1 }) },
  { type: "command", name: "Stagger Selected Keyframes 5 Frames Descending", category: "Stagger", does: "Space", targets: ["Animation"], shortcut: "", visibleWhen: "selectedKeyframes", action: () => runKeyframeTimingAction("stagger", { direction: "desc", amount: 5, unit: "frames", group: 1 }) },
  { type: "command", name: "Stagger Selected Keyframes 5 Frames Random", category: "Stagger", does: "Space", targets: ["Animation"], shortcut: "", visibleWhen: "selectedKeyframes", action: () => runKeyframeTimingAction("stagger", { direction: "random", amount: 5, unit: "frames", group: 1 }) },
  { type: "command", name: "Zoom In Timeline", category: "View", does: "Show", targets: [], shortcut: "2", action: () => zoomTimeline(1.22) },
  { type: "command", name: "Zoom Out Timeline", category: "View", does: "Show", targets: [], shortcut: "1", action: () => zoomTimeline(0.82) },
  { type: "command", name: "Play / Pause", category: "Playback", does: "Play", targets: [], shortcut: "Space", action: togglePlay }
];

const TNT_V3_COMMANDS = [
  { name: "Ease In / Out", category: "Keyframes", tntFunction: "applyEaseInOut", args: [{ easeIn: 75, easeOut: 75 }] },
  { name: "Linear Keyframes", category: "Keyframes", tntFunction: "applyLinear" },
  { name: "Overshoot Expression", category: "Expressions", tntFunction: "applyOvershoot" },
  { name: "Wiggle Expression", category: "Expressions", tntFunction: "applyWiggle", args: [{ freq: 2, amp: 20 }] },
  { name: "Clear Expressions", category: "Expressions", tntFunction: "clearExpressions" },
  { name: "Animate Position In", category: "Animation", children: [
    { name: "In from Up", category: "Animation", tntFunction: "animInDir", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }, "up"] },
    { name: "In from Down", category: "Animation", tntFunction: "animInDir", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }, "down"] },
    { name: "In from Left", category: "Animation", tntFunction: "animInDir", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }, "left"] },
    { name: "In from Right", category: "Animation", tntFunction: "animInDir", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }, "right"] }
  ] },
  { name: "Animate Position Out", category: "Animation", children: [
    { name: "Out to Up", category: "Animation", tntFunction: "animOutDir", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }, "up"] },
    { name: "Out to Down", category: "Animation", tntFunction: "animOutDir", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }, "down"] },
    { name: "Out to Left", category: "Animation", tntFunction: "animOutDir", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }, "left"] },
    { name: "Out to Right", category: "Animation", tntFunction: "animOutDir", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }, "right"] }
  ] },
  { name: "Animate Position In+Out", category: "Animation", children: [
    { name: "In+Out Up", category: "Animation", tntFunction: "animInOutDir", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }, "up"] },
    { name: "In+Out Down", category: "Animation", tntFunction: "animInOutDir", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }, "down"] },
    { name: "In+Out Left", category: "Animation", tntFunction: "animInOutDir", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }, "left"] },
    { name: "In+Out Right", category: "Animation", tntFunction: "animInOutDir", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }, "right"] }
  ] },
  { name: "Scale In", category: "Animation", tntFunction: "animScaleIn", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Scale Out", category: "Animation", tntFunction: "animScaleOut", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Scale In+Out", category: "Animation", tntFunction: "animScaleInOut", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Opacity In", category: "Animation", tntFunction: "animOpacityIn", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Opacity Out", category: "Animation", tntFunction: "animOpacityOut", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Opacity In+Out", category: "Animation", tntFunction: "animOpacityInOut", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Reverse Keyframes", category: "Keyframes", tntFunction: "reverseKeyframes" },
  { name: "Clone Keyframes", category: "Keyframes", tntFunction: "cloneKeyframes", args: [false] },
  { name: "Clone Keyframes Flipped", category: "Keyframes", tntFunction: "cloneKeyframes", args: [true] },
  { name: "Loop Expression", category: "Expressions", children: [
    { name: "Loop Cycle", category: "Expressions", tntFunction: "applyLoopExpression", args: ["cycle"] },
    { name: "Loop Pingpong", category: "Expressions", tntFunction: "applyLoopExpression", args: ["pingpong"] },
    { name: "Loop Offset", category: "Expressions", tntFunction: "applyLoopExpression", args: ["offset"] },
    { name: "Loop Continue", category: "Expressions", tntFunction: "applyLoopExpression", args: ["continue"] }
  ] },
  { name: "Continuous Roving", category: "Keyframes", children: [
    { name: "Enable Continuous Roving", category: "Keyframes", tntFunction: "setContinuousRoving", args: [true] },
    { name: "Disable Continuous Roving", category: "Keyframes", tntFunction: "setContinuousRoving", args: [false] }
  ] },
  { name: "Delete All Keyframes", category: "Keyframes", tntFunction: "deleteAllKeyframes" },
  { name: "Align Keys to Playhead", category: "Keyframes", tntFunction: "alignKeysToPlayhead" },
  { name: "Anticipation Tool", category: "Keyframes", tntFunction: "openAnticipation" },
  { name: "Text Animation", category: "Text", children: [
    { name: "Text Anim In Up", category: "Text", tntFunction: "applyTextAnimMaster", args: ["up", 3, true, true, false, 0.35, 0.35, "in"] },
    { name: "Text Anim Out Up", category: "Text", tntFunction: "applyTextAnimMaster", args: ["up", 3, true, true, false, 0.35, 0.35, "out"] },
    { name: "Text Anim In+Out Up", category: "Text", tntFunction: "applyTextAnimMaster", args: ["up", 3, true, true, false, 0.35, 0.35, "both"] },
    { name: "Text Bounce In Up", category: "Text", tntFunction: "applyTextAnimBounce", args: ["up", 3, true, true, false, 0.35, 0.35, "in"] }
  ] },
  { name: "Apply Wiggle FFX", category: "Effects", tntFunction: "applyWiggleFFX", args: [2, 20] },
  { name: "Apply Glow", category: "Effects", tntFunction: "applyGlow" },
  { name: "Apply Light Sweep", category: "Effects", tntFunction: "applyLightSweep", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Apply VHS", category: "Effects", tntFunction: "applyVHS" },
  { name: "Apply Blur In+Out", category: "Effects", tntFunction: "applyBlurInOut" },
  { name: "Apply Blur Out", category: "Effects", tntFunction: "applyBlurOut" },
  { name: "Apply Dim + Desat", category: "Effects", tntFunction: "applyDimDesat" },
  { name: "Apply Grain", category: "Effects", tntFunction: "applyGrain" },
  { name: "Toggle Visibility", category: "Layers", tntFunction: "toggleVisibility" },
  { name: "Show All Layers", category: "Layers", tntFunction: "showAll" },
  { name: "Toggle Lock Selected", category: "Layers", tntFunction: "toggleLockSelected" },
  { name: "Solo Selected", category: "Layers", tntFunction: "soloSelected" },
  { name: "Unsolo All", category: "Layers", tntFunction: "unsoloAll" },
  { name: "Solo Focus Toggle", category: "Layers", tntFunction: "soloFocusToggle" },
  { name: "Select at Playhead", category: "Layers", tntFunction: "selectAtPlayhead" },
  { name: "Create Null", category: "Layers", tntFunction: "createNull" },
  { name: "Parent to Null", category: "Layers", tntFunction: "parentToNull" },
  { name: "Parent to Last Selected Layer", category: "Layers", action: parentToLastSelectedLayer },
  { name: "Parent to Target Layer...", category: "Layers", action: promptParentToTargetLayer },
  { name: "Precompose Selected", category: "Layers", tntFunction: "precomposeSelected" },
  { name: "Lock Selected", category: "Layers", tntFunction: "lockSelected" },
  { name: "Trim to Keyframes", category: "Layers", tntFunction: "trimToKeyframes" },
  { name: "Hide Selected", category: "Layers", tntFunction: "hideSelected" },
  { name: "Show Selected", category: "Layers", tntFunction: "showSelected" },
  { name: "Track Matte", category: "Layers", children: [
    { name: "Apply Alpha Track Matte", category: "Layers", tntFunction: "applyTrackMatte", args: ["matte"] },
    { name: "Apply Matte + Parent", category: "Layers", tntFunction: "applyTrackMatte", args: ["matte_parent"] },
    { name: "Apply Matte + Blend", category: "Layers", tntFunction: "applyTrackMatte", args: ["matte_blend"] },
    { name: "Break Track Matte", category: "Layers", tntFunction: "applyTrackMatte", args: ["break"] }
  ] },
  { name: "Pull to Playhead", category: "Layers", children: [
    { name: "Pull In Point to Playhead", category: "Layers", tntFunction: "pullToPlayhead", args: [false] },
    { name: "Pull Out Point to Playhead", category: "Layers", tntFunction: "pullToPlayhead", args: [true] }
  ] },
  { name: "Focus Selected", category: "Layers", tntFunction: "focusSelected" },
  { name: "Focus Playhead", category: "Layers", tntFunction: "focusPlayhead" },
  { name: "Filter Text Layers", category: "Layers", tntFunction: "filterTextLayers" },
  { name: "Keep Only Shapes", category: "Layers", tntFunction: "keepOnlyShapes" },
  { name: "Keep Only Images", category: "Layers", tntFunction: "keepOnlyImages" },
  { name: "Unlock at Playhead", category: "Layers", tntFunction: "unlockAtPlayhead" },
  { name: "Select Parents", category: "Layers", tntFunction: "selectParents" },
  { name: "Select Children", category: "Layers", tntFunction: "selectChildren" },
  { name: "Toggle Effects", category: "Effects", tntFunction: "toggleEffects" },
  { name: "Copy Effects", category: "Effects", tntFunction: "copyEffects" },
  { name: "Delete All Effects", category: "Effects", tntFunction: "deleteAllEffects" },
  { name: "Delete All Expressions", category: "Expressions", tntFunction: "deleteAllExpressions" },
  { name: "Full Purge", category: "Cleanup", children: [
    { name: "Purge Effects", category: "Cleanup", tntFunction: "fullPurge", args: [true, false, false, false] },
    { name: "Purge Keyframes", category: "Cleanup", tntFunction: "fullPurge", args: [false, true, false, false] },
    { name: "Purge Expressions", category: "Cleanup", tntFunction: "fullPurge", args: [false, false, true, false] },
    { name: "Purge Labels", category: "Cleanup", tntFunction: "fullPurge", args: [false, false, false, true] },
    { name: "Purge Effects + Keys + Expressions", category: "Cleanup", tntFunction: "fullPurge", args: [true, true, true, false] }
  ] },
  { name: "Add Dashes to Stroke", category: "Shape", tntFunction: "addDashesToStroke" },
  { name: "Add Dashed Stroke", category: "Shape", tntFunction: "addStrokeAndDashes" },
  { name: "Create Split Screen Masks", category: "Shape", tntFunction: "createSplitScreenMasks" },
  { name: "Add Arrowhead Triangle", category: "Shape", tntFunction: "addArrowhead", args: [0, 50, 0, true, false] },
  { name: "Add Arrowhead Triangle Start", category: "Shape", tntFunction: "addArrowhead", args: [1, 50, 0, true, false] },
  { name: "Add Arrowhead Triangle Both", category: "Shape", tntFunction: "addArrowhead", args: [2, 50, 0, true, false] },
  { name: "Follow Path", category: "Shape", tntFunction: "followPath", args: [0, true, false] },
  { name: "Apply Size Rig", category: "Shape", tntFunction: "applySizeRig" },
  { name: "Swap Fill / Stroke", category: "Shape", tntFunction: "swapFillStroke" },
  { name: "Apply Stroke Style", category: "Shape", tntFunction: "applyStrokeStyle" },
  { name: "Trim Paths In", category: "Shape", tntFunction: "trimPathsIn", args: [{ inTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Trim Paths Out", category: "Shape", tntFunction: "trimPathsOut", args: [{ outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Trim Paths In+Out", category: "Shape", tntFunction: "trimPathsInOut", args: [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }] },
  { name: "Combine Shapes", category: "Shape", tntFunction: "combineShapes" },
  { name: "Explode Shapes", category: "Shape", tntFunction: "explodeShapes" },
  { name: "Shape to Mask", category: "Shape", tntFunction: "shapeToMask" },
  { name: "Markers: Set In Marker", category: "Markers", tntFunction: "setInMarker" },
  { name: "Markers: Set Out Marker", category: "Markers", tntFunction: "setOutMarker" },
  { name: "Markers: Remove In Marker", category: "Markers", tntFunction: "removeInMarker", does: "Delete", targets: ["Marker"] },
  { name: "Markers: Remove Out Marker", category: "Markers", tntFunction: "removeOutMarker", does: "Delete", targets: ["Marker"] },
  { name: "Text: Remove In Animator + Marker", category: "Text", tntFunction: "removeTextAnimIn", does: "Delete", targets: ["Text", "Animation"] },
  { name: "Text: Remove Out Animator + Marker", category: "Text", tntFunction: "removeTextAnimOut", does: "Delete", targets: ["Text", "Animation"] },
  { name: "Markers: Add Marker...", category: "Markers", action: promptAddMarker },
  { name: "Markers: Remove In/Out Markers", category: "Markers", tntFunction: "removeInOutMarkers" },
  { name: "Markers: Layer to Comp", category: "Markers", tntFunction: "layerMarkersToComp", args: [false] },
  { name: "Markers: Layer to Comp Numbered", category: "Markers", tntFunction: "layerMarkersToComp", args: [true] },
  { name: "Markers: Clear Layer Marker Numbers", category: "Markers", tntFunction: "clearLayerMarkerNumbers" },
  { name: "Markers: Count Layer Markers", category: "Markers", tntFunction: "countLayerMarkers" },
  { name: "Markers: Toggle Protection", category: "Markers", tntFunction: "toggleMarkerProtection" },
  { name: "Markers: Toggle All Protection", category: "Markers", tntFunction: "toggleAllMarkerProtection" },
  { name: "Markers: Delete All Comp Markers", category: "Markers", tntFunction: "deleteAllCompMarkers" },
  { name: "Markers: Delete All Layer Markers", category: "Markers", tntFunction: "deleteAllLayerMarkers" },
  { name: "Markers: Delete All Markers Everywhere", category: "Markers", tntFunction: "deleteAllMarkersEverywhere" },
  { name: "Markers: Delete Unnamed Markers", category: "Markers", tntFunction: "deleteUnnamedMarkers" },
  { name: "Rename Composition...", category: "Composition", does: "Set", targets: ["Comp"], action: promptRenameComp },
  { name: "Rename Layer Markers...", category: "Markers", action: promptRenameLayerMarkers },
  { name: "Set Text Content...", category: "Text", action: promptSetTextContent },
  { name: "Find / Replace Text...", category: "Text", action: promptFindReplaceText },
  { name: "Stagger Layers...", category: "Layers", action: () => promptStagger("layers") },
  { name: "Stagger Keyframes...", category: "Keyframes", action: () => promptStagger("keyframes") },
  { name: "Label Layers", category: "Labels", children: [] },
  { name: "Label Keyframes", category: "Labels", children: [] },
  { name: "Recolor Marker at Playhead", category: "Labels", children: [] },
  { name: "Anchor Point", category: "Anchor", children: [] },
  { name: "Mask Control", category: "Masks", does: "Open", targets: ["Mask"], action: () => openSubpanelByKey("mask") },
  { name: "Effects Control", category: "Effects", does: "Open", targets: ["Effect"], action: () => openSubpanelByKey("effects") },
  { name: "Shape Control", category: "Shapes", does: "Open", targets: ["Shape"], action: () => openSubpanelByKey("shapes") },
  { name: "Layer Menu", category: "Layers", does: "Open", targets: ["Layer"], action: () => openSubpanelByKey("layer-menu") },
  { name: "Layer Styles...", category: "Layer Styles", does: "Open", targets: ["Style"], action: () => openSubpanelByKey("styles") },
  { name: "Auto Trim Comp", category: "Composition", tntFunction: "autoTrimComp", args: [false] },
  { name: "Crop Comp", category: "Composition", tntFunction: "cropComp", args: [false, 0] },
  { name: "Add to Render Queue", category: "Render", tntFunction: "addToRenderQueue" },
  { name: "Quick Render", category: "Render", tntFunction: "quickRender" },
  { name: "Open Prober", category: "Utility", tntFunction: "openProber" }
];

const TNT_LABEL_NAMES = [
  "None", "Red", "Yellow", "Aqua", "Pink", "Lavender", "Peach", "Sea Foam", "Blue",
  "Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone", "Dark Green"
];
const TNT_LABEL_COMMANDS = TNT_LABEL_NAMES.map((name, index) => ({
  name,
  category: "Labels",
  tntFunction: "labelLayers",
  args: [index]
}));
const TNT_KEYFRAME_LABEL_COMMANDS = TNT_LABEL_NAMES.map((name, index) => ({
  name,
  category: "Labels",
  tntFunction: "labelKeyframes",
  args: [index]
}));
const TNT_MARKER_LABEL_COMMANDS = TNT_LABEL_NAMES.map((name, index) => ({
  name,
  category: "Labels",
  tntFunction: "recolorMarkerAtPlayhead",
  args: [index]
}));
const TNT_ANCHOR_COMMANDS = [
  ["TL", "Top Left"], ["TC", "Top Center"], ["TR", "Top Right"],
  ["ML", "Middle Left"], ["C", "Center"], ["MR", "Middle Right"],
  ["BL", "Bottom Left"], ["BC", "Bottom Center"], ["BR", "Bottom Right"]
].map(item => ({
  name: item[1],
  category: "Anchor",
  tntFunction: "setAnchorToPoint",
  args: [item[0], true]
}));
TNT_V3_COMMANDS.forEach(command => {
  if (command.name === "Label Layers") command.children = TNT_LABEL_COMMANDS;
  if (command.name === "Label Keyframes") command.children = TNT_KEYFRAME_LABEL_COMMANDS;
  if (command.name === "Recolor Marker at Playhead") command.children = TNT_MARKER_LABEL_COMMANDS;
  if (command.name === "Anchor Point") command.children = TNT_ANCHOR_COMMANDS;
});

const TNT_LAYER_STYLE_MAP = [
  { label: "Color Overlay", cmd: 9006, mn: "ADBE Color Overlay", gMn: "solidFill/enabled", icon: "CO", color: "#4b8bd6", position: "over the layer fill", preview: ["Color", "Opacity"] },
  { label: "Gradient Overlay", cmd: 9007, mn: "ADBE Grad Overlay", gMn: "gradientFill/enabled", icon: "GO", color: "#6f68d8", position: "over the layer fill", preview: ["Opacity", "Angle", "Scale", "Reverse", "Align Layer"] },
  { label: "Satin", cmd: 9005, mn: "ADBE Satin", gMn: "chromeFX/enabled", icon: "SA", color: "#9b6aa8", position: "inside the layer", preview: ["Color", "Opacity", "Angle", "Distance", "Size"] },
  { label: "Bevel & Emboss", cmd: 9004, mn: "ADBE Bevel Emboss", gMn: "bevelEmboss/enabled", icon: "BE", color: "#9a8f74", position: "on the layer surface", preview: ["Depth", "Size", "Soften", "Angle", "Altitude"] },
  { label: "Stroke", cmd: 9008, mn: "ADBE Stroke", gMn: "frameFX/enabled", icon: "ST", color: "#d6674b", position: "on the layer edge", preview: ["Color", "Size", "Opacity", "Position"] },
  { label: "Inner Glow", cmd: 9003, mn: "ADBE Inner Glow", gMn: "innerGlow/enabled", icon: "IG", color: "#7bb7d8", position: "inside the layer edge", preview: ["Color", "Opacity", "Noise", "Choke", "Size"] },
  { label: "Outer Glow", cmd: 9002, mn: "ADBE Outer Glow", gMn: "outerGlow/enabled", icon: "OG", color: "#d2b35f", position: "outside the layer edge", preview: ["Color", "Opacity", "Noise", "Spread", "Size"] },
  { label: "Inner Shadow", cmd: 9001, mn: "ADBE Inner Shadow", gMn: "innerShadow/enabled", icon: "IS", color: "#3f536e", position: "inside the layer", preview: ["Color", "Opacity", "Angle", "Distance", "Choke", "Size"] },
  { label: "Drop Shadow", cmd: 9000, mn: "ADBE Drop Shadow", gMn: "dropShadow/enabled", icon: "DS", color: "#6d6f78", position: "under/outside the layer", preview: ["Color", "Opacity", "Angle", "Distance", "Spread", "Size"] }
];

const MASK_PROPORTIONAL_GROUPS = {
  feather: {
    label: "Feather",
    propertyName: "feather",
    controls: ["feather-x", "feather-y"],
    axes: ["X", "Y"]
  }
};

const PANEL_SETTINGS_DEFAULTS = {
  showNativeEffects: true,
  showTntCommands: true,
  keepStyleEditorOpen: true
};
const LAYER_STYLE_PANEL_KEEP_OPEN = true;

let panelSettings = loadPanelSettings();

function layerStyleVisualOrder(gMn) {
  const index = TNT_LAYER_STYLE_MAP.findIndex(style => style.gMn === gMn);
  return index < 0 ? 999 : index;
}

function isMacPlatform() {
  const platform = String(navigator.platform || navigator.userAgent || "").toLowerCase();
  return platform.indexOf("mac") >= 0;
}

function primaryModifierLabel() {
  return "Ctrl";
}

function optionModifierLabel() {
  return isMacPlatform() ? "Option" : "Alt";
}

function renderPlatformBadge() {
  if (!platformBadgeEl) return;
  const isMac = isMacPlatform();
  platformBadgeEl.className = `platform-badge ${isMac ? "mac" : "windows"}`;
  const tooltip = isMac
    ? "macOS mode\nShortcut equivalents\nControl = Windows Ctrl\nOption = Windows Alt"
    : "Windows mode\nShortcut equivalents\nCtrl = macOS Control\nAlt = macOS Option";
  platformBadgeEl.removeAttribute("title");
  platformBadgeEl.dataset.tooltip = tooltip;
  platformBadgeEl.setAttribute("aria-label", tooltip);
  platformBadgeEl.innerHTML = isMac
    ? '<span class="platform-apple" aria-hidden="true">&#63743;</span>'
    : '<span class="platform-windows" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
  bindPanelTooltip(platformBadgeEl);
}

function ensurePanelTooltip() {
  if (panelTooltipEl) return panelTooltipEl;
  panelTooltipEl = document.createElement("div");
  panelTooltipEl.className = "panel-tooltip";
  panelTooltipEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(panelTooltipEl);
  return panelTooltipEl;
}

function normalizePanelTooltipText(text) {
  return String(text || "").replace(/\\n/g, "\n");
}

function showPanelTooltip(target, event) {
  const text = normalizePanelTooltipText(target && target.dataset ? target.dataset.tooltip : "");
  if (!text) return;
  const el = ensurePanelTooltip();
  el.innerHTML = String(text).split(/\n+/).map((line, index) =>
    `<span class="panel-tooltip-line${index === 0 ? " first" : ""}">${escapeHtml(line)}</span>`
  ).join("");
  el.classList.toggle("rail-tooltip", !!(target && target.closest && target.closest(".subpanel-rail")));
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  positionPanelTooltip(event || { clientX: 0, clientY: 0 }, target);
}

function positionPanelTooltip(event, target) {
  if (!panelTooltipEl || !panelTooltipEl.classList.contains("show")) return;
  const pad = 10;
  const rect = panelTooltipEl.getBoundingClientRect();
  const targetRect = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
  const railTarget = targetRect && target.closest && target.closest(".subpanel-rail");
  const baseX = railTarget ? targetRect.right + 12 : event.clientX + 12;
  const baseY = railTarget ? targetRect.top + (targetRect.height / 2) - (rect.height / 2) : event.clientY + 12;
  const x = Math.min(window.innerWidth - rect.width - pad, Math.max(pad, baseX));
  const y = Math.min(window.innerHeight - rect.height - pad, Math.max(pad, baseY));
  panelTooltipEl.style.left = `${x}px`;
  panelTooltipEl.style.top = `${y}px`;
}

function hidePanelTooltip() {
  if (!panelTooltipEl) return;
  panelTooltipEl.classList.remove("show");
  panelTooltipEl.classList.remove("rail-tooltip");
  panelTooltipEl.setAttribute("aria-hidden", "true");
}

function bindPanelTooltip(el) {
  if (!el || el.__panelTooltipBound) return;
  el.__panelTooltipBound = true;
  el.addEventListener("mouseenter", event => showPanelTooltip(el, event));
  el.addEventListener("mousemove", event => positionPanelTooltip(event, el));
  el.addEventListener("mouseleave", hidePanelTooltip);
  el.addEventListener("mousedown", hidePanelTooltip);
}

function bindRailTooltipDelegation() {
  if (!filterColumnEl || filterColumnEl.__railTooltipDelegated) return;
  filterColumnEl.__railTooltipDelegated = true;
  let activeTarget = null;
  filterColumnEl.addEventListener("mouseover", event => {
    const target = event.target.closest && event.target.closest(".filter-btn");
    if (!target || !filterColumnEl.contains(target)) return;
    activeTarget = target;
    showPanelTooltip(target, event);
  }, true);
  filterColumnEl.addEventListener("mousemove", event => {
    if (!activeTarget) return;
    positionPanelTooltip(event, activeTarget);
  }, true);
  filterColumnEl.addEventListener("mouseout", event => {
    if (!activeTarget) return;
    const next = event.relatedTarget;
    if (next && activeTarget.contains(next)) return;
    activeTarget = null;
    hidePanelTooltip();
  }, true);
}

function setupFilterTooltips() {
  if (!filterColumnEl) return;
  const tooltipByPanel = {
    anchor: "Anchor Point\nShortcut: A",
    composition: "Composition Tools\nShortcut: C",
    ease: "Ease Editor\nShortcut: E\nRequires selected keyframes",
    mask: "Mask Control\nShortcut: F",
    effects: "Effects Control\nSearch, apply, toggle, and delete effects on selected layers",
    shapes: "Shape Control\nInspect selected shape contents and add common shape items",
    styles: "Layer Styles\nShortcut: S",
    "mass-edit": "Mass Edit\nCopy effects, keys, values, and link matching properties across selected layers",
    "text-animation": "Text Animation\nBuild text animators and manage selected text layers",
    "timing-order": "Timing and Layer Order\nStagger, sequence, and reorder selected layers",
    filter: "Filter\nShortcut: Shift+X"
  };
  filterColumnEl.querySelectorAll(".filter-btn").forEach(btn => {
    const tooltip = btn.id === "settingsBtn"
      ? "Settings\nPanel options and shortcut guide"
      : (btn.dataset.tooltip || tooltipByPanel[btn.dataset.subpanel]);
    if (!tooltip) return;
    const normalized = normalizePanelTooltipText(tooltip);
    btn.dataset.tooltip = normalized;
    btn.setAttribute("aria-label", normalized.replace(/\n+/g, ". "));
    btn.setAttribute("title", normalized.replace(/\n+/g, " - "));
    bindPanelTooltip(btn);
  });
  bindRailTooltipDelegation();
}

function setPanelSyncPaused(paused) {
  panelSyncPaused = !!paused;
  refreshSyncPausedVisualState();
}

function isInternalPopupOpen() {
  return !!(
    isLayerMenuOpen() ||
    (layerStyleDialogEl && layerStyleDialogEl.classList.contains("show")) ||
    (maskControlDialogEl && maskControlDialogEl.classList.contains("show")) ||
    (effectsControlDialogEl && effectsControlDialogEl.classList.contains("show")) ||
    (shapesControlDialogEl && shapesControlDialogEl.classList.contains("show")) ||
    (quickLayerMenuDialogEl && quickLayerMenuDialogEl.classList.contains("show")) ||
    (tntCommandDialogEl && tntCommandDialogEl.classList.contains("show")) ||
    (shortcutRundownEl && shortcutRundownEl.classList.contains("show")) ||
    (layerSelectionModalEl && layerSelectionModalEl.classList.contains("show")) ||
    (compositionModalEl && compositionModalEl.classList.contains("show")) ||
    (anchorModalEl && anchorModalEl.classList.contains("show")) ||
    (easeDialogEl && easeDialogEl.classList.contains("show")) ||
    (massEditDialogEl && massEditDialogEl.classList.contains("show")) ||
    (durationModalEl && durationModalEl.classList.contains("show")) ||
    (expressionModalEl && expressionModalEl.classList.contains("show")) ||
    (compSelectEl && compSelectEl.classList.contains("open")) ||
    (flowChartOverlayEl && flowChartOverlayEl.classList.contains("open"))
  );
}

function refreshSyncPausedVisualState() {
  const showPausedVisual = panelSyncPaused && !isInternalPopupOpen();
  document.body.classList.toggle("panel-sync-paused", showPausedVisual);
}

function pausePanelSync() {
  setPanelSyncPaused(true);
}

function schedulePanelActivationSync() {
  if (panelActivationSyncTimer) clearTimeout(panelActivationSyncTimer);
  const delay = Math.max(0, 140 - (Date.now() - lastPanelActivationSyncAt));
  panelActivationSyncTimer = setTimeout(async () => {
    panelActivationSyncTimer = null;
    if (resumeSyncInFlight || panelSyncPaused || document.hidden) return;
    resumeSyncInFlight = true;
    lastPanelActivationSyncAt = Date.now();
    try {
      await syncTick({ activation: true });
    } finally {
      resumeSyncInFlight = false;
    }
  }, delay);
}

function resumePanelSync() {
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  schedulePanelActivationSync();
}

function extensionRootPath() {
  if (window.__TNT_EXTENSION_PATH__) return String(window.__TNT_EXTENSION_PATH__);
  try {
    const url = new URL(window.location.href);
    const path = decodeURIComponent(url.pathname || "");
    return path.replace(/\/(?:index|quick)\.html$/i, "");
  } catch (_) {
    return "";
  }
}

async function launchNativeQuickControls() {
  suppressSyncUntil = Date.now() + 700;
  await loadJSX();
  const appPath = `${extensionRootPath()}/native/TNT Quick Controls.app`;
  const result = await aeCall("TNT_launchNativeQuickControls", [appPath]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not open Quick Controls.";
    return;
  }
  statusEl.textContent = "Quick Controls opened.";
}

function nativeSelectionEventData(event) {
  try {
    return typeof event.data === "string" ? JSON.parse(event.data) : (event.data || {});
  } catch (_) {
    return {};
  }
}

function scheduleNativeSelectionFullRefresh() {
  if (nativeSelectionRefreshTimer) clearTimeout(nativeSelectionRefreshTimer);
  nativeSelectionRefreshTimer = setTimeout(async () => {
    nativeSelectionRefreshTimer = null;
    await refreshLayers({
      forceRender: true,
      preferNative: true,
      skipSettledRefresh: true
    });
  }, 0);
}

function scheduleNativeSelectionKeyframeSync() {
  if (timelineMode !== "keyframe") return;
  if (nativeSelectionKeyframeSyncTimer) clearTimeout(nativeSelectionKeyframeSyncTimer);
  nativeSelectionKeyframeSyncTimer = setTimeout(async () => {
    nativeSelectionKeyframeSyncTimer = null;
    await syncTick({ selection: true, nativeSelection: true });
  }, 15);
}

function handleNativeSelectionSync(event) {
  const data = nativeSelectionEventData(event);
  nativeSelectionMonitorActive = !!data.activeContext;
  if (!nativeSelectionMonitorActive) {
    if (!panelFocused && !panelPointerInside) pausePanelSync();
    return;
  }

  if (panelBlurPauseTimer) {
    clearTimeout(panelBlurPauseTimer);
    panelBlurPauseTimer = null;
  }
  setPanelSyncPaused(false);

  const compChanged = !state.comp ||
    Number(data.compId || 0) !== Number(state.comp.id || 0) ||
    Number(data.numLayers || 0) !== Number((state.layers || []).length);
  if (compChanged) {
    scheduleNativeSelectionFullRefresh();
    return;
  }

  const previous = state.selectedLayerIndices || [];
  const selected = Array.isArray(data.selectedLayerIndices)
    ? data.selectedLayerIndices.map(Number).filter(index => index > 0)
    : [];
  if (Number(data.time) >= 0 && state.comp) {
    state.comp.time = Number(data.time || 0);
    updatePlayhead();
  }
  const selectionChanged = previous.length !== selected.length ||
    previous.some((index, position) => Number(index) !== Number(selected[position]));
  if (!selectionChanged) {
    scheduleNativeSelectionKeyframeSync();
    return;
  }
  const added = selected.filter(index => !previous.includes(index));
  state.selectedLayerIndices = selected;
  if (added.length) lastSelectedLayerIndex = added[added.length - 1];
  else if (!selected.includes(Number(lastSelectedLayerIndex))) {
    lastSelectedLayerIndex = selected.length ? selected[selected.length - 1] : 0;
  }
  renderSelectionOnly({ skipKeyframes: true });
  updateStatus();
  scheduleNativeSelectionKeyframeSync();
}

async function startNativeSelectionMonitor() {
  await loadJSX();
  const result = await aeCall("TNT_startNativeSelectionMonitor");
  if (!result.ok) {
    nativeSelectionMonitorActive = false;
  }
}

function registerPanelKeyEventsInterest() {
  if (!cs || typeof cs.registerKeyEventsInterest !== "function") return;
  const mac = isMacPlatform();
  const keyEvents = [];
  const add = (windowsCode, macCode, modifiers = {}) => {
    keyEvents.push({
      keyCode: mac ? macCode : windowsCode,
      ctrlKey: !!modifiers.ctrlKey,
      altKey: !!modifiers.altKey,
      shiftKey: !!modifiers.shiftKey,
      metaKey: !!modifiers.metaKey
    });
  };
  const letters = {
    a: [65, 0], c: [67, 8], d: [68, 2], e: [69, 14],
    f: [70, 3], k: [75, 40], q: [81, 12], s: [83, 1],
    t: [84, 17], u: [85, 32], v: [86, 9], w: [87, 13], x: [88, 7], z: [90, 6]
  };
  Object.keys(letters).filter(key => key !== "z").forEach(key => add(letters[key][0], letters[key][1]));
  ["a", "e", "f", "s", "t", "u", "x"].forEach(key => add(letters[key][0], letters[key][1], { shiftKey: true }));
  [[49, 18], [50, 19], [51, 20], [52, 21], [53, 23], [54, 22]].forEach(codes => add(codes[0], codes[1]));
  add(32, 49); // Space
  add(190, 47); // Period
  add(9, 48); // Tab
  add(8, 51); // Backspace
  add(46, 117); // Forward delete
  if (!mac) {
    [97, 98, 99, 100, 101, 102].forEach(keyCode => keyEvents.push({ keyCode }));
  }

  const addControl = (windowsCode, macCode) => {
    keyEvents.push({
      keyCode: mac ? macCode : windowsCode,
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      metaKey: false
    });
  };
  ["a", "c", "d", "s", "u", "v", "z"].forEach(key => addControl(letters[key][0], letters[key][1]));
  addControl(32, 49);
  addControl(letters.k[0], letters.k[1]);

  add(192, 50, { altKey: true });
  add(letters.x[0], letters.x[1], { altKey: true });
  add(38, 126, { altKey: true });
  add(40, 125, { altKey: true });
  add(38, 126, { shiftKey: true, altKey: true });
  add(40, 125, { shiftKey: true, altKey: true });
  try {
    const validKeyEvents = keyEvents.map(event => ({
      keyCode: event.keyCode,
      ctrlKey: !!event.ctrlKey,
      altKey: !!event.altKey,
      shiftKey: !!event.shiftKey,
      metaKey: !!event.metaKey
    }));
    const keyInterestJSON = JSON.stringify(validKeyEvents);
    if (keyInterestJSON === registeredKeyInterestJSON) return;
    cs.registerKeyEventsInterest("");
    cs.registerKeyEventsInterest(keyInterestJSON);
    registeredKeyInterestJSON = keyInterestJSON;
  } catch (_) {}
}

function loadPanelSettings() {
  try {
    const legacyPrefix = "t" + "nk";
    const legacyKey = `${legacyPrefix}TimelineSettings`;
    const raw = localStorage.getItem("tntTimelineSettings") || localStorage.getItem(legacyKey) || "{}";
    const saved = JSON.parse(raw);
    if (!localStorage.getItem("tntTimelineSettings") && localStorage.getItem(legacyKey)) {
      try { localStorage.setItem("tntTimelineSettings", JSON.stringify(saved)); } catch (_) {}
    }
    return { ...PANEL_SETTINGS_DEFAULTS, ...saved };
  } catch (_) {
    return { ...PANEL_SETTINGS_DEFAULTS };
  }
}

function savePanelSettings() {
  try { localStorage.setItem("tntTimelineSettings", JSON.stringify(panelSettings)); } catch (_) {}
}

function defaultEaseSettings() {
  return { influenceIn: 75, influenceOut: 75, speedIn: 100, speedOut: 100 };
}

function normalizedEaseSettings(settings) {
  settings = settings || {};
  const influenceIn = settings.influenceIn === undefined || settings.influenceIn === null ? 75 : settings.influenceIn;
  const influenceOut = settings.influenceOut === undefined || settings.influenceOut === null ? 75 : settings.influenceOut;
  const speedIn = settings.speedIn === undefined || settings.speedIn === null ? 100 : settings.speedIn;
  const speedOut = settings.speedOut === undefined || settings.speedOut === null ? 100 : settings.speedOut;
  return {
    influenceIn: Math.max(0, Math.min(100, Number(influenceIn))),
    influenceOut: Math.max(0, Math.min(100, Number(influenceOut))),
    speedIn: Math.max(-500, Math.min(500, Number(speedIn))),
    speedOut: Math.max(-500, Math.min(500, Number(speedOut)))
  };
}

function loadLastEaseSettings() {
  try {
    const legacyPrefix = "t" + "nk";
    const legacyKey = `${legacyPrefix}TimelineEaseSettings`;
    const raw = localStorage.getItem("tntTimelineEaseSettings") || localStorage.getItem(legacyKey) || "null";
    const saved = JSON.parse(raw);
    if (!localStorage.getItem("tntTimelineEaseSettings") && localStorage.getItem(legacyKey)) {
      try { localStorage.setItem("tntTimelineEaseSettings", JSON.stringify(normalizedEaseSettings(saved))); } catch (_) {}
    }
    return normalizedEaseSettings(saved);
  } catch (_) {
    return defaultEaseSettings();
  }
}

function saveLastEaseSettings(settings = easeDialogState) {
  try { localStorage.setItem("tntTimelineEaseSettings", JSON.stringify(normalizedEaseSettings(settings))); } catch (_) {}
}

// Keep explicit action refreshes slightly delayed so AE has time to commit undoable edits.
const PANEL_ACTION_REFRESH_DELAY_MS = 90;

// AE label palette, sampled from the native After Effects label swatches.
// Important: these are AE label *indices* in order, not custom categories.
// 0=None, 1=Red, 2=Yellow, 3=Aqua, 4=Pink, 5=Lavender, etc.
const AE_LABEL_COLORS = {
  0: "#353535",
  1: "#b53838",
  2: "#e4d84c",
  3: "#a9cbc7",
  4: "#e5bcc9",
  5: "#a9a9ca",
  6: "#e7c19e",
  7: "#b3c7b3",
  8: "#677de0",
  9: "#4aa44c",
  10: "#8e2c9a",
  11: "#e8920d",
  12: "#7f452a",
  13: "#f46dd6",
  14: "#3da2a5",
  15: "#a89677",
  16: "#1e401e"
};

const AE_LABEL_NAMES = {
  0: "None", 1: "Red", 2: "Yellow", 3: "Aqua", 4: "Pink", 5: "Lavender",
  6: "Peach", 7: "Sea Foam", 8: "Blue", 9: "Green", 10: "Purple",
  11: "Orange", 12: "Brown", 13: "Fuchsia", 14: "Cyan", 15: "Sandstone", 16: "Dark Green"
};

function labelColor(label) {
  // Use the base AE label color directly. Selection is visual-only via CSS filter,
  // so the unselected clip color stays as close as possible to the native AE label.
  return AE_LABEL_COLORS[label] || AE_LABEL_COLORS[0];
}

function keyframeLabelColor(label) {
  return Number(label || 0) ? labelColor(Number(label || 0)) : "#b8b8b8";
}

function boostedLabelColor(label) {
  return labelColor(label);
}

function jsxPath() {
  const extensionRoot = cs.getSystemPath(SystemPath.EXTENSION);
  return extensionRoot.replace(/\\/g, '/') + '/jsx/timeline.jsx';
}

function escForExtendScriptString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}


function extensionFilePath(relativePath) {
  const extensionRoot = cs.getSystemPath(SystemPath.EXTENSION);
  return extensionRoot.replace(/\\/g, '/') + '/' + relativePath.replace(/^\/+/, '');
}

function evalFileRaw(relativePath) {
  const path = extensionFilePath(relativePath);
  return new Promise(resolve => {
    cs.evalScript(`$.evalFile('${escForExtendScriptString(path)}')`, result => {
      resolve({ ok: true, result });
    });
  });
}

function focusPanel(retries = 3) {
  // Never pull focus out of a field the user is typing in. focusPanel exists to
  // keep keyboard shortcuts inside the panel instead of leaking to After Effects,
  // but it moves focus to <body> and retries on an 80ms timer. Without this guard,
  // clicking into a text input handed focus straight back moments later, which
  // made the Functions search box impossible to type in.
  const active = document.activeElement;
  const activeTag = String((active && active.tagName) || "").toLowerCase();
  if (
    activeTag === "input" ||
    activeTag === "textarea" ||
    activeTag === "select" ||
    (active && active.isContentEditable)
  ) {
    return;
  }

  try { window.focus(); } catch (_) {}
  try {
    if (!document.body.hasAttribute("tabindex")) document.body.setAttribute("tabindex", "-1");
    document.body.focus({ preventScroll: true });
  } catch (_) {
    try { document.body.focus(); } catch (__) {}
  }
  if (retries > 0) setTimeout(() => focusPanel(retries - 1), 80);
}

function scheduleSettledActionRefresh(options = {}) {
  if (settledActionRefreshTimer) clearTimeout(settledActionRefreshTimer);
  settledActionRefreshTimer = setTimeout(async () => {
    settledActionRefreshTimer = null;
    if (settledActionRefreshInFlight) {
      scheduleSettledActionRefresh(options);
      return;
    }
    if (isPlaying || isScrubbing || isMarqueeSelecting || isMarkerDragging || isKeyframeDragging) {
      scheduleSettledActionRefresh(options);
      return;
    }
    settledActionRefreshInFlight = true;
    try {
      await refreshLayers({
        forceRender: true,
        skipSettledRefresh: true,
        includeSelectedKeyframes: !!options.includeSelectedKeyframes
      });
    } finally {
      settledActionRefreshInFlight = false;
    }
  }, Number(options.delay || PANEL_ACTION_REFRESH_DELAY_MS));
}

async function refreshAfterPanelAction(options = {}) {
  suppressSyncUntil = Date.now() + 500;
  await refreshLayers({
    forceRender: true,
    includeSelectedKeyframes: !!options.includeSelectedKeyframes
  });
}

async function ensureVendoredTntCommands(options = {}) {
  if (tntV3HostLoaded && !options.force) return { ok: true };
  await loadJSX({ force: !!options.force });
  // TNT v3 commands are vendored into jsx/timeline.jsx; no external host eval.
  tntV3HostLoaded = true;
  return { ok: true };
}

async function runTntV3Command(command) {
  if (!command || !command.tntFunction) return;
  suppressSyncUntil = Date.now() + 1200;
  const loaded = await ensureVendoredTntCommands();
  if (!loaded.ok) {
    statusEl.textContent = loaded.error || "Could not load panel commands.";
    return;
  }
  const result = await aeCall("TNT_runTntV3Command", [command.tntFunction, command.args || []]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Panel command failed.";
    return;
  }
  statusEl.textContent = String(result.result || `${command.name} done`);
  closeFxConsole();
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function callTntV3Command(functionName, args = [], options = {}) {
  suppressSyncUntil = Date.now() + 1200;
  await loadJSX();
  if (!options.localFirst) {
    const loaded = await ensureVendoredTntCommands();
    if (!loaded.ok) {
      statusEl.textContent = loaded.error || "Could not load panel commands.";
      return { ok: false, error: loaded.error };
    }
  }
  let result = await aeCall("TNT_runTntV3Command", [functionName, args]);
  const missingFunctionError = value => {
    if (String(value && value.error || "").indexOf("TNT function not available") >= 0) return true;
    try {
      const inner = JSON.parse(String(value && value.result || ""));
      return String(inner && inner.error || "").indexOf("TNT function not available") >= 0;
    } catch (_) {}
    return false;
  };
  if (missingFunctionError(result)) {
    tntV3HostLoaded = false;
    const reloaded = await ensureVendoredTntCommands({ force: true });
    if (reloaded.ok) result = await aeCall("TNT_runTntV3Command", [functionName, args]);
  }
  if (!result.ok) {
    statusEl.textContent = result.error || "Panel command failed.";
    return result;
  }
  if (options.status !== false && result.result) statusEl.textContent = String(result.result);
  if (options.refresh) await refreshLayers({ forceRender: true });
  return result;
}

function ensureTntCommandDialog() {
  if (tntCommandDialogEl) return tntCommandDialogEl;
  tntCommandDialogEl = document.createElement("div");
  tntCommandDialogEl.className = "timeline-command-dialog-backdrop";
  tntCommandDialogEl.setAttribute("aria-hidden", "true");
  tntCommandDialogEl.innerHTML = `
    <div class="timeline-command-dialog">
      <div class="timeline-command-dialog-title"></div>
      <div class="timeline-command-dialog-subtitle"></div>
      <div class="timeline-command-dialog-fields"></div>
      <div class="timeline-command-dialog-error"></div>
      <div class="timeline-command-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(tntCommandDialogEl);
  tntCommandDialogEl.addEventListener("mousedown", event => {
    if (event.target === tntCommandDialogEl) closeTntCommandDialog(null);
  });
  tntCommandDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeTntCommandDialog(null);
    }
  });
  return tntCommandDialogEl;
}

function closeTntCommandDialog(value) {
  if (!tntCommandDialogEl) return;
  tntCommandDialogEl.classList.remove("show");
  tntCommandDialogEl.setAttribute("aria-hidden", "true");
  const resolve = activeTntDialogResolve;
  activeTntDialogResolve = null;
  if (resolve) resolve(value);
}

function showTntCommandDialog(config) {
  const el = ensureTntCommandDialog();
  const fields = config.fields || [{ id: "value", label: "", type: "text", value: "" }];
  const titleEl = el.querySelector(".timeline-command-dialog-title");
  const subtitleEl = el.querySelector(".timeline-command-dialog-subtitle");
  const fieldsEl = el.querySelector(".timeline-command-dialog-fields");
  const errorEl = el.querySelector(".timeline-command-dialog-error");
  const actionsEl = el.querySelector(".timeline-command-dialog-actions");
  titleEl.textContent = config.title || "Timeline Command";
  subtitleEl.textContent = config.subtitle || "";
  errorEl.textContent = "";
  fieldsEl.innerHTML = fields.map(field => `
    <label class="timeline-command-dialog-field">
      ${field.label ? `<span>${escapeHtml(field.label)}</span>` : ""}
      ${field.type === "textarea"
        ? `<textarea data-field="${escapeHtml(field.id)}" spellcheck="false">${escapeHtml(field.value || "")}</textarea>`
        : field.suggest
          ? `<span class="timeline-command-suggest-wrap"><span class="timeline-command-ghost" data-field-ghost="${escapeHtml(field.id)}"></span><input data-field="${escapeHtml(field.id)}" type="text" value="${escapeHtml(field.value || "")}" spellcheck="false" autocomplete="off"></span>`
          : `<input data-field="${escapeHtml(field.id)}" type="text" value="${escapeHtml(field.value || "")}" spellcheck="false">`}
    </label>
  `).join("");
  actionsEl.innerHTML = (config.buttons || [{ label: "Apply", value: "apply", primary: true }]).map(button => `
    <button type="button" class="${button.primary ? "primary" : ""}" data-value="${escapeHtml(button.value || "")}">${escapeHtml(button.label || "Apply")}</button>
  `).join("") + `<button type="button" data-value="__cancel">Cancel</button>`;

  function values() {
    const out = {};
    fieldsEl.querySelectorAll("[data-field]").forEach(input => {
      out[input.dataset.field] = input.value;
    });
    return out;
  }

  actionsEl.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const value = button.dataset.value || "";
      if (value === "__cancel") {
        closeTntCommandDialog(null);
        return;
      }
      closeTntCommandDialog({ action: value, values: values() });
    });
  });
  fieldsEl.querySelectorAll("input, textarea").forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && input.tagName !== "TEXTAREA") {
        event.preventDefault();
        const primary = (config.buttons || []).find(button => button.primary) || (config.buttons || [])[0] || { value: "apply" };
        closeTntCommandDialog({ action: primary.value || "apply", values: values() });
      }
    });
  });
  if (typeof config.onReady === "function") {
    config.onReady({ el, fieldsEl, errorEl, actionsEl, values, close: closeTntCommandDialog });
  }

  return new Promise(resolve => {
    activeTntDialogResolve = resolve;
    el.classList.add("show");
    el.setAttribute("aria-hidden", "false");
    const first = fieldsEl.querySelector("input, textarea");
    setTimeout(() => {
      if (first) {
        first.focus();
        if (first.select) first.select();
      }
    }, 0);
  });
}

function parseTntTimeValue(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  const match = raw.match(/^(-?\d+(?:\.\d+)?)(f|s)?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  const unit = match[2] === "s" ? "seconds" : "frames";
  return { amount: Math.abs(amount), unit, sign: amount < 0 ? -1 : 1 };
}

async function promptRenameComp() {
  closeFxConsole();
  const response = await showTntCommandDialog({
    title: "Rename Composition",
    subtitle: "Enter a new comp name.",
    fields: [{ id: "name", label: "Name", value: state.comp && state.comp.name || "" }],
    buttons: [{ label: "Rename", value: "rename", primary: true }]
  });
  if (!response) return;
  const name = String(response.values.name || "").trim();
  if (!name) return;
  await runTntV3Command({ name: "Rename Composition", tntFunction: "renameComp", args: [name, false] });
}

async function promptRenameSourceComp(layer) {
  if (!layer || !layer.sourceCompId) return;
  const response = await showTntCommandDialog({
    title: "Rename Source Composition",
    subtitle: "Renames the comp item in the Project panel.",
    fields: [{ id: "name", label: "Name", value: layer.sourceCompName || layer.name || "" }],
    buttons: [{ label: "Rename", value: "rename", primary: true }]
  });
  if (!response) return;
  const name = String(response.values.name || "").trim();
  if (!name) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_renameProjectCompById", [Number(layer.sourceCompId), name]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not rename source composition.";
    return;
  }
  statusEl.textContent = `Renamed comp to ${result.name || name}.`;
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function promptRenameLayerMarkers() {
  closeFxConsole();
  const response = await showTntCommandDialog({
    title: "Rename Layer Markers",
    subtitle: "Markers become prefix 1, prefix 2, ...",
    fields: [{ id: "prefix", label: "Prefix", value: "Marker" }],
    buttons: [{ label: "Rename", value: "rename", primary: true }]
  });
  if (!response) return;
  await runTntV3Command({ name: "Rename Layer Markers", tntFunction: "renameLayerMarkers", args: [String(response.values.prefix || "").trim()] });
}

async function promptSetTextContent() {
  closeFxConsole();
  const response = await showTntCommandDialog({
    title: "Set Text Content",
    subtitle: "Choose whether to update one text layer or all selected text layers.",
    fields: [{ id: "text", label: "Text", type: "textarea", value: "" }],
    buttons: [
      { label: "First Selected", value: "first", primary: true },
      { label: "All Selected", value: "selected" }
    ]
  });
  if (!response) return;
  await runTntV3Command({ name: "Set Text Content", tntFunction: "TNT_setTextContentScoped", args: [response.values.text || "", response.action] });
}

async function promptFindReplaceText() {
  closeFxConsole();
  const response = await showTntCommandDialog({
    title: "Find / Replace Text",
    subtitle: "Pick the search scope after entering the values.",
    fields: [
      { id: "find", label: "Find", value: "" },
      { id: "replace", label: "Replace", value: "" }
    ],
    buttons: [
      { label: "Selected", value: "selected", primary: true },
      { label: "Active Comp", value: "comp" },
      { label: "Whole Project", value: "project" }
    ]
  });
  if (!response) return;
  const find = String(response.values.find || "");
  if (!find) return;
  await runTntV3Command({ name: "Find / Replace Text", tntFunction: "TNT_findReplaceTextScoped", args: [find, response.values.replace || "", false, response.action] });
}

async function promptStagger(target) {
  closeFxConsole();
  const response = await showTntCommandDialog({
    title: target === "keyframes" ? "Stagger Keyframes" : "Stagger Layers",
    subtitle: "Use frames or seconds. Positive = bottom up, negative = top down. Examples: 5f, -5f, 1s.",
    fields: [{ id: "time", label: "Amount", value: "5f" }],
    buttons: [{ label: "Stagger", value: "stagger", primary: true }]
  });
  if (!response) return;
  const parsed = parseTntTimeValue(response.values.time);
  if (!parsed || parsed.amount === 0) {
    statusEl.textContent = "Enter a time value like 5f, -5f, or 1s.";
    return;
  }
  const direction = parsed.sign >= 0 ? "asc" : "desc";
  const options = { direction, amount: parsed.amount, unit: parsed.unit, group: 1 };
  if (target === "keyframes") await runKeyframeTimingAction("stagger", options);
  else await runLayerTimingAction("stagger", options);
}

function layerTargetSuggestion(query) {
  const raw = String(query || "").trim();
  const layers = state.layers || [];
  if (!layers.length || !raw) return null;
  const lower = raw.toLowerCase();
  const numeric = raw.match(/^#?\s*(\d+)/);
  let match = null;
  if (numeric) {
    const indexText = numeric[1];
    match = layers.find(layer => String(layer.index) === indexText) ||
      layers.find(layer => String(layer.index).indexOf(indexText) === 0);
  }
  if (!match) match = layers.find(layer => String(layer.name || "").toLowerCase().indexOf(lower) >= 0);
  if (!match) return null;
  return {
    index: Number(match.index),
    name: String(match.name || ""),
    label: `${match.index} - ${match.name || "Layer"}`
  };
}

function parentableSelectedIndices(targetIndex) {
  return (state.selectedLayerIndices || [])
    .map(Number)
    .filter(index => index && index !== Number(targetIndex));
}

function lastSelectedTargetIndex() {
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  const last = Number(lastSelectedLayerIndex || 0);
  if (last && selected.includes(last)) return last;
  return selected.length ? selected[selected.length - 1] : 0;
}

async function parentLayersToTarget(childIndices, targetIndex, label = "Parent Layers") {
  childIndices = (childIndices || []).map(Number).filter(Boolean);
  targetIndex = Number(targetIndex || 0);
  if (!targetIndex || !childIndices.length) {
    statusEl.textContent = "Select child layers and a target parent layer.";
    return;
  }
  suppressSyncUntil = Date.now() + 1200;
  await loadJSX();
  const result = await aeCall("TNT_parentSelectedToLayer", [childIndices, targetIndex]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not parent layers.";
    return;
  }
  if (result.selectedLayerIndices) state.selectedLayerIndices = result.selectedLayerIndices;
  statusEl.textContent = result.result || `${label} done`;
  await refreshLayers({ forceRender: true });
}

async function parentToLastSelectedLayer() {
  closeFxConsole();
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  if (selected.length < 2) {
    statusEl.textContent = "Select child layers first, then the target parent layer last.";
    return;
  }
  const targetIndex = lastSelectedTargetIndex();
  await parentLayersToTarget(parentableSelectedIndices(targetIndex), targetIndex, "Parent to last selected layer");
}

async function matteToLastSelectedLayer() {
  closeFxConsole();
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  if (selected.length < 2) {
    statusEl.textContent = "Select fill layers first, then the matte layer last.";
    return;
  }
  const targetIndex = lastSelectedTargetIndex();
  const childIndices = parentableSelectedIndices(targetIndex);
  if (!targetIndex || !childIndices.length) {
    statusEl.textContent = "Select fill layers first, then the matte layer last.";
    return;
  }
  suppressSyncUntil = Date.now() + 1200;
  await loadJSX();
  const result = await aeCall("TNT_applyTrackMatteToLayer", [childIndices, targetIndex, "alpha"]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not apply track matte.";
    return;
  }
  if (result.selectedLayerIndices) state.selectedLayerIndices = result.selectedLayerIndices;
  statusEl.textContent = result.result || "Track matte applied.";
  await refreshLayers({ forceRender: true });
}

async function promptParentToTargetLayer() {
  closeFxConsole();
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  if (!selected.length) {
    statusEl.textContent = "Select the child layers first.";
    return;
  }
  let latestSuggestion = null;
  const response = await showTntCommandDialog({
    title: "Parent to Target Layer",
    subtitle: "Type a layer number or name. Selected layers become children of the matched target.",
    fields: [{ id: "target", label: "Target", value: "", suggest: true }],
    buttons: [{ label: "Parent", value: "parent", primary: true }],
    onReady: ({ fieldsEl }) => {
      const input = fieldsEl.querySelector('[data-field="target"]');
      const ghost = fieldsEl.querySelector('[data-field-ghost="target"]');
      const updateSuggestion = () => {
        latestSuggestion = layerTargetSuggestion(input ? input.value : "");
        if (ghost) ghost.textContent = latestSuggestion ? latestSuggestion.label : "";
      };
      if (input) {
        input.addEventListener("input", updateSuggestion);
        input.addEventListener("keydown", event => {
          if ((event.key === "Tab" || event.key === "ArrowRight") && latestSuggestion) {
            event.preventDefault();
            input.value = latestSuggestion.label;
            updateSuggestion();
          }
        });
      }
      updateSuggestion();
    }
  });
  if (!response) return;
  const suggestion = layerTargetSuggestion(response.values.target) || latestSuggestion;
  if (!suggestion || !suggestion.index) {
    statusEl.textContent = "No matching target layer.";
    return;
  }
  const childIndices = parentableSelectedIndices(suggestion.index);
  if (!childIndices.length) {
    statusEl.textContent = "Target layer cannot be the only selected layer.";
    return;
  }
  await parentLayersToTarget(childIndices, suggestion.index, "Parent to target layer");
}

async function promptAddMarker() {
  closeFxConsole();
  const hasLayerSelection = !!(state.selectedLayerIndices && state.selectedLayerIndices.length);
  const buttons = [{ label: "Add", value: "add", primary: true }];
  if (hasLayerSelection) {
    buttons.push({ label: "IN", value: "in" });
    buttons.push({ label: "OUT", value: "out" });
    buttons.push({ label: "Protected", value: "protected" });
  }
  const response = await showTntCommandDialog({
    title: "Add Marker",
    subtitle: hasLayerSelection ? "Selected layers can use IN, OUT, or protected range markers." : "No layer selected: this adds a comp marker.",
    fields: [{ id: "label", label: "Name", value: "" }],
    buttons
  });
  if (!response) return;
  const label = String(response.values.label || "");
  if (response.action === "in") await runTntV3Command({ name: "Set IN Marker", tntFunction: "setInMarker" });
  else if (response.action === "out") await runTntV3Command({ name: "Set OUT Marker", tntFunction: "setOutMarker" });
  else if (response.action === "protected") await runTntV3Command({ name: "Create Protected Marker", tntFunction: "createProtectedMarker", args: [0, label, true] });
  else await runTntV3Command({ name: "Add Marker", tntFunction: "addMarker", args: [label] });
}
function ensureLayerStyleDialog() {
  if (layerStyleDialogEl) return layerStyleDialogEl;
  layerStyleDialogEl = document.createElement("div");
  layerStyleDialogEl.className = "layer-style-dialog-backdrop";
  layerStyleDialogEl.setAttribute("aria-hidden", "true");
  layerStyleDialogEl.innerHTML = `
    <div class="layer-style-dialog">
      <div class="layer-style-dialog-head">
        <div>
          <div class="layer-style-dialog-title"></div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(layerStyleDialogEl);
  layerStyleDialogEl.addEventListener("mousedown", event => {
    if (event.target === layerStyleDialogEl) closeLayerStyleDialog();
  });
  layerStyleDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeLayerStyleDialog();
    }
  });
  return layerStyleDialogEl;
}

function closeLayerStyleDialog() {
  if (!layerStyleDialogEl) return;
  layerStyleDialogEl.classList.remove("show");
  layerStyleDialogEl.setAttribute("aria-hidden", "true");
  layerStyleEditSnapshot = null;
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showLayerStyleDialog(title, subtitle) {
  const el = ensureLayerStyleDialog();
  const staleClose = el.querySelector(".layer-style-dialog:not(.mask-control-dialog) .layer-style-close");
  if (staleClose) staleClose.remove();
  const titleEl = el.querySelector(".layer-style-dialog-title");
  if (titleEl) titleEl.innerHTML = `<b class="layer-style-shortcut-badge">S</b><span>${escapeHtml(title || "Layer Styles")}</span>`;
  el.querySelector(".layer-style-dialog-subtitle").textContent = subtitle || "";
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureMaskControlDialog() {
  if (maskControlDialogEl) return maskControlDialogEl;
  maskControlDialogEl = document.createElement("div");
  maskControlDialogEl.className = "layer-style-dialog-backdrop mask-control-backdrop";
  maskControlDialogEl.setAttribute("aria-hidden", "true");
  maskControlDialogEl.innerHTML = `
    <div class="layer-style-dialog mask-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Mask Control</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(maskControlDialogEl);
  maskControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === maskControlDialogEl) closeMaskControlDialog();
  });
  maskControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeMaskControlDialog);
  maskControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMaskControlDialog();
    }
  });
  return maskControlDialogEl;
}

function closeMaskControlDialog() {
  if (!maskControlDialogEl) return;
  maskControlDialogEl.classList.remove("show");
  maskControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showMaskControlDialog() {
  const el = ensureMaskControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureEffectsControlDialog() {
  if (effectsControlDialogEl) return effectsControlDialogEl;
  effectsControlDialogEl = document.createElement("div");
  effectsControlDialogEl.className = "layer-style-dialog-backdrop effects-control-backdrop";
  effectsControlDialogEl.setAttribute("aria-hidden", "true");
  effectsControlDialogEl.innerHTML = `
    <div class="layer-style-dialog effects-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Effects</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(effectsControlDialogEl);
  effectsControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === effectsControlDialogEl) closeEffectsControlDialog();
  });
  effectsControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeEffectsControlDialog);
  effectsControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEffectsControlDialog();
    }
  });
  return effectsControlDialogEl;
}

function closeEffectsControlDialog() {
  if (!effectsControlDialogEl) return;
  effectsControlDialogEl.classList.remove("show");
  effectsControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showEffectsControlDialog() {
  const el = ensureEffectsControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

function ensureShapesControlDialog() {
  if (shapesControlDialogEl) return shapesControlDialogEl;
  shapesControlDialogEl = document.createElement("div");
  shapesControlDialogEl.className = "layer-style-dialog-backdrop shapes-control-backdrop";
  shapesControlDialogEl.setAttribute("aria-hidden", "true");
  shapesControlDialogEl.innerHTML = `
    <div class="layer-style-dialog shapes-control-dialog">
      <div class="layer-style-dialog-head mask-control-head">
        <div>
          <div class="layer-style-dialog-title">Shapes</div>
          <div class="layer-style-dialog-subtitle"></div>
        </div>
        <button type="button" class="layer-style-close" title="Close">x</button>
      </div>
      <div class="layer-style-dialog-body"></div>
      <div class="layer-style-dialog-actions"></div>
    </div>
  `;
  document.body.appendChild(shapesControlDialogEl);
  shapesControlDialogEl.addEventListener("mousedown", event => {
    if (event.target === shapesControlDialogEl) closeShapesControlDialog();
  });
  shapesControlDialogEl.querySelector(".layer-style-close").addEventListener("click", closeShapesControlDialog);
  shapesControlDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeShapesControlDialog();
    }
  });
  return shapesControlDialogEl;
}

function closeShapesControlDialog() {
  if (!shapesControlDialogEl) return;
  shapesControlDialogEl.classList.remove("show");
  shapesControlDialogEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
  focusPanel(2);
}

function showShapesControlDialog() {
  const el = ensureShapesControlDialog();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
  return el;
}

async function openMaskControlPanel() {
  closeFxConsole();
  const wasOpen = !!(maskControlDialogEl && maskControlDialogEl.classList.contains("show"));
  const el = showMaskControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading masks...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshMaskControlPanelContent({ showLoading: true }));
  await refreshMaskControlPanelContent({ showLoading: !wasOpen });
}

async function openEffectsControlPanel() {
  closeFxConsole();
  const wasOpen = !!(effectsControlDialogEl && effectsControlDialogEl.classList.contains("show"));
  const el = showEffectsControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading effects...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshEffectsControlPanelContent({ showLoading: true }));
  await loadFxConsoleEffects();
  await refreshEffectsControlPanelContent({ showLoading: !wasOpen });
}

async function refreshEffectsControlPanelContent(options = {}) {
  const el = ensureEffectsControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading effects...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedEffectsPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read effects.")}</div>`;
    return;
  }
  const layers = Array.isArray(result.layers) ? result.layers : [];
  const totalEffects = layers.reduce((sum, layer) => sum + ((layer.effects || []).length), 0);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Effects <span class="mask-control-count">${totalEffects} effect${totalEffects === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="effects-control-layout">
      <section class="effects-control-browser">
        <input type="text" class="effects-control-search" data-effects-search placeholder="Search effects to apply" spellcheck="false" autocomplete="off">
        <div class="effects-control-results" data-effects-results></div>
      </section>
      <section class="layer-style-layout mask-control-layout effects-control-current">
        ${layers.length ? layers.map(renderEffectsLayerGroup).join("") : `<div class="layer-style-empty">Select layers to inspect or apply effects.</div>`}
      </section>
    </div>
  `;
  bindEffectsControlPanel(body);
  body.scrollTop = previousScrollTop;
}

function effectSearchResults(query) {
  const normalized = String(query || "").toLowerCase().trim();
  const effects = (fxConsoleEffects || []).map(effect => ({ ...effect, source: "native", type: "effect" }));
  if (!normalized) return effects.slice(0, 10);
  const terms = normalized.split(/\s+/).filter(Boolean);
  return effects.filter(effect => {
    const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, 12);
}

function renderEffectsSearchResults(root) {
  const input = root.querySelector("[data-effects-search]");
  const resultsEl = root.querySelector("[data-effects-results]");
  if (!input || !resultsEl) return;
  const results = effectSearchResults(input.value);
  resultsEl.innerHTML = results.length
    ? results.map(effect => `
      <button type="button" class="effects-control-result" data-effect-match-name="${escapeHtml(effect.matchName || "")}">
        <strong>${escapeHtml(effect.name || effect.matchName || "Effect")}</strong>
        <em>${escapeHtml(effect.category || effect.matchName || "")}</em>
      </button>
    `).join("")
    : `<div class="layer-style-empty">No matching effects.</div>`;
}

function renderEffectsLayerGroup(layer) {
  const effects = Array.isArray(layer.effects) ? layer.effects : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer effects-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${effects.length} effect${effects.length === 1 ? "" : "s"}</span>
      </div>
      ${effects.length
        ? `<div class="layer-style-node-row mask-control-node-row effects-control-node-row">${effects.map(effect => renderEffectNode(layer, effect)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No effects on this layer.</div>`}
    </section>
  `;
}

function renderEffectNode(layer, effect) {
  return `
    <section class="mask-control-node effects-control-node${effect.enabled ? "" : " disabled"}" data-layer-index="${escapeHtml(layer.index)}" data-effect-index="${escapeHtml(effect.index)}">
      <div class="mask-control-node-head">
        <strong>${escapeHtml(effect.name || "Effect")}</strong>
        <em>${escapeHtml(effect.matchName || "")}</em>
      </div>
      <div class="layer-style-node-controls">
        <button type="button" class="layer-style-toggle${effect.enabled ? " on" : ""}" data-effect-enable="${effect.enabled ? "false" : "true"}" title="${effect.enabled ? "Turn off" : "Turn on"}"><span></span></button>
        <button type="button" class="layer-style-delete" data-effect-delete="true" title="Delete effect">x</button>
      </div>
    </section>
  `;
}

function bindEffectsControlPanel(root) {
  const search = root.querySelector("[data-effects-search]");
  if (search) {
    renderEffectsSearchResults(root);
    search.addEventListener("input", () => renderEffectsSearchResults(root));
  }
  root.querySelectorAll("[data-effect-match-name]").forEach(button => {
    button.addEventListener("click", async () => {
      await loadJSX();
      const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
      const result = await aeCall("TNT_applyEffectToSelectedLayers", [button.dataset.effectMatchName || "", selected]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not apply effect.";
        return;
      }
      statusEl.textContent = `Applied ${button.textContent.trim()}.`;
      await refreshLayers({ forceRender: true });
      await refreshEffectsControlPanelContent();
    });
  });
  root.querySelectorAll("[data-effect-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-effect-index]");
      if (!node) return;
      const result = await aeCall("TNT_setEffectEnabled", [Number(node.dataset.layerIndex), Number(node.dataset.effectIndex), button.dataset.effectEnable === "true"]);
      if (!result.ok) statusEl.textContent = result.error || "Could not update effect.";
      await refreshEffectsControlPanelContent();
    });
  });
  root.querySelectorAll("[data-effect-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-effect-index]");
      if (!node) return;
      const result = await aeCall("TNT_removeEffect", [Number(node.dataset.layerIndex), Number(node.dataset.effectIndex)]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete effect.";
      await refreshEffectsControlPanelContent();
    });
  });
}

async function openShapesControlPanel() {
  closeFxConsole();
  const wasOpen = !!(shapesControlDialogEl && shapesControlDialogEl.classList.contains("show"));
  const el = showShapesControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading shapes...</div>`;
  actions.innerHTML = `<button type="button" data-action="refresh">Refresh</button>`;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", () => refreshShapesControlPanelContent({ showLoading: true }));
  await refreshShapesControlPanelContent({ showLoading: !wasOpen });
}

async function refreshShapesControlPanelContent(options = {}) {
  const el = ensureShapesControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading shapes...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedShapesPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read shapes.")}</div>`;
    return;
  }
  const layers = Array.isArray(result.layers) ? result.layers : [];
  const totalItems = layers.reduce((sum, layer) => sum + ((layer.items || []).length), 0);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Shapes <span class="mask-control-count">${totalItems} item${totalItems === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="shapes-control-layout">
      <section class="shapes-control-add-row">
        ${[
          ["shape-layer", "New Layer"],
          ["group", "Group"],
          ["rect", "Rectangle"],
          ["ellipse", "Ellipse"],
          ["star", "Star"],
          ["fill", "Fill"],
          ["stroke", "Stroke"],
          ["trim", "Trim Paths"]
        ].map(([type, label]) => `<button type="button" data-shape-add="${type}">${escapeHtml(label)}</button>`).join("")}
      </section>
      <section class="layer-style-layout mask-control-layout shapes-control-current">
        ${layers.length ? layers.map(renderShapesLayerGroup).join("") : `<div class="layer-style-empty">Select a shape layer, or create one above.</div>`}
      </section>
    </div>
  `;
  bindShapesControlPanel(body);
  body.scrollTop = previousScrollTop;
}

function renderShapesLayerGroup(layer) {
  const items = Array.isArray(layer.items) ? layer.items : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer shapes-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${items.length} shape item${items.length === 1 ? "" : "s"}</span>
      </div>
      ${items.length
        ? `<div class="layer-style-node-row mask-control-node-row shapes-control-node-row">${items.map(item => renderShapeNode(layer, item)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No shape contents on this layer.</div>`}
    </section>
  `;
}

function renderShapeNode(layer, item) {
  const path = encodeURIComponent(JSON.stringify(item.path || []));
  return `
    <section class="mask-control-node shapes-control-node${item.enabled ? "" : " disabled"}" data-layer-index="${escapeHtml(layer.index)}" data-shape-path="${path}">
      <div class="mask-control-node-head">
        <strong>${escapeHtml(item.name || "Shape Item")}</strong>
        <em>${escapeHtml(item.type || item.matchName || "")}</em>
      </div>
      <div class="layer-style-node-controls">
        <button type="button" class="layer-style-toggle${item.enabled ? " on" : ""}" data-shape-enable="${item.enabled ? "false" : "true"}" title="${item.enabled ? "Turn off" : "Turn on"}"><span></span></button>
        <button type="button" class="layer-style-delete" data-shape-delete="true" title="Delete shape item">x</button>
      </div>
    </section>
  `;
}

function shapeNodePath(node) {
  try { return JSON.parse(decodeURIComponent(node.dataset.shapePath || "%5B%5D")); }
  catch (_) { return []; }
}

function bindShapesControlPanel(root) {
  root.querySelectorAll("[data-shape-add]").forEach(button => {
    button.addEventListener("click", async () => {
      const result = await aeCall("TNT_addShapeItemToSelectedLayers", [button.dataset.shapeAdd || ""]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not add shape item.";
        return;
      }
      statusEl.textContent = result.result || "Shape item added.";
      await refreshLayers({ forceRender: true });
      await refreshShapesControlPanelContent();
    });
  });
  root.querySelectorAll("[data-shape-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-shape-path]");
      if (!node) return;
      const result = await aeCall("TNT_setShapeItemEnabled", [Number(node.dataset.layerIndex), shapeNodePath(node), button.dataset.shapeEnable === "true"]);
      if (!result.ok) statusEl.textContent = result.error || "Could not update shape item.";
      await refreshShapesControlPanelContent();
    });
  });
  root.querySelectorAll("[data-shape-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest("[data-layer-index][data-shape-path]");
      if (!node) return;
      const result = await aeCall("TNT_removeShapeItem", [Number(node.dataset.layerIndex), shapeNodePath(node)]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete shape item.";
      await refreshShapesControlPanelContent();
    });
  });
}

async function refreshMaskControlPanelContent(options = {}) {
  const el = ensureMaskControlDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  const previousScrollLeft = body ? body.scrollLeft : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading masks...</div>`;
  await loadJSX();
  const result = await aeCall("TNT_getSelectedMaskPanelJSON");
  if (!result.ok) {
    body.innerHTML = `<div class="layer-style-empty">${escapeHtml(result.error || "Could not read masks.")}</div>`;
    return;
  }
  const data = result || {};
  const layers = data && Array.isArray(data.layers) ? data.layers : [];
  const totalMasks = layers.reduce((sum, layer) => sum + ((layer.masks || []).length), 0);
  const maskGroups = buildMaskNameGroups(layers);
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `Mask Control <span class="mask-control-count">${totalMasks} mask${totalMasks === 1 ? "" : "s"} / ${maskGroups.length} group${maskGroups.length === 1 ? "" : "s"}</span>`;
  if (subtitleEl) subtitleEl.textContent = "";
  if (!layers.length) {
    body.innerHTML = `<div class="layer-style-empty">Select a layer with masks to control them here.</div>`;
    return;
  }
  body.innerHTML = `
    <div class="layer-style-layout mask-control-layout">
      ${renderMaskGroupedPanel(layers, maskGroups)}
    </div>
  `;
  bindMaskControlNodes(body);
  body.scrollTop = previousScrollTop;
  body.scrollLeft = previousScrollLeft;
}

function renderMaskLayerGroup(layer) {
  const masks = Array.isArray(layer.masks) ? layer.masks : [];
  const stripeColor = labelColor(Number(layer.label || 0));
  return `
    <section class="mask-control-layer" style="--mask-layer-color:${escapeHtml(stripeColor)}">
      <div class="mask-control-layer-head">
        <strong>${escapeHtml(layer.name || ("Layer " + layer.index))}</strong>
        <span>Layer ${escapeHtml(layer.index)} / ${masks.length} mask${masks.length === 1 ? "" : "s"}</span>
      </div>
      ${masks.length
        ? `<div class="layer-style-node-row mask-control-node-row">${masks.map(mask => renderMaskNode(layer, mask)).join("")}</div>`
        : `<div class="layer-style-empty mask-control-empty">No masks on this layer.</div>`}
    </section>
  `;
}

function maskValueSame(a, b) {
  if (a && a.length !== undefined && typeof a !== "string") {
    if (!b || b.length === undefined || typeof b === "string" || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!maskValueSame(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "number" || typeof b === "number") {
    return Math.abs(Number(a) - Number(b)) < 0.001;
  }
  return a === b;
}

function maskGroupCommonValue(items, getter) {
  if (!items.length) return { mixed: false, value: "" };
  const first = getter(items[0]);
  for (let i = 1; i < items.length; i++) {
    if (!maskValueSame(first, getter(items[i]))) return { mixed: true, value: first };
  }
  return { mixed: false, value: first };
}

function buildMaskNameGroups(layers) {
  const groups = [];
  const byName = new Map();
  layers.forEach(layer => {
    (Array.isArray(layer.masks) ? layer.masks : []).forEach(mask => {
      const name = String(mask.name || `Mask ${mask.index || ""}`).trim() || "Mask";
      let group = byName.get(name);
      if (!group) {
        group = { name, items: [], targets: [], layerNames: [], label: layer.label };
        byName.set(name, group);
        groups.push(group);
      }
      group.items.push({ layer, mask });
      group.targets.push({ layerIndex: Number(layer.index), maskIndex: Number(mask.index) });
      if (group.layerNames.indexOf(layer.name || `Layer ${layer.index}`) < 0) group.layerNames.push(layer.name || `Layer ${layer.index}`);
    });
  });
  groups.forEach(group => {
    const common = {
      enabled: maskGroupCommonValue(group.items, item => item.mask.enabled !== false),
      modeValue: maskGroupCommonValue(group.items, item => item.mask.modeValue === "" || item.mask.modeValue === null || typeof item.mask.modeValue === "undefined" ? 2 : Number(item.mask.modeValue)),
      mode: maskGroupCommonValue(group.items, item => item.mask.mode || ""),
      inverted: maskGroupCommonValue(group.items, item => !!item.mask.inverted),
      opacity: maskGroupCommonValue(group.items, item => item.mask.opacity === "" || item.mask.opacity === null || typeof item.mask.opacity === "undefined" ? 100 : Number(item.mask.opacity)),
      expansion: maskGroupCommonValue(group.items, item => item.mask.expansion === "" || item.mask.expansion === null || typeof item.mask.expansion === "undefined" ? 0 : Number(item.mask.expansion)),
      feather: maskGroupCommonValue(group.items, item => item.mask.feather && item.mask.feather.length !== undefined ? [Number(item.mask.feather[0] || 0), Number(item.mask.feather[1] || 0)] : [0, 0])
    };
    group.common = common;
    group.selected = group.items.some(item => !!item.mask.selected);
    group.enabled = !common.enabled.mixed ? !!common.enabled.value : true;
  });
  return groups;
}

function renderMaskGroupedPanel(layers, existingGroups) {
  const groups = existingGroups || buildMaskNameGroups(layers);
  if (!groups.length) return `<div class="layer-style-empty mask-control-empty">No masks on the selected layers.</div>`;
  return `
    <section class="mask-control-layer mask-control-grouped">
      <div class="mask-control-layer-head">
        <strong>Mask Groups</strong>
        <span>${groups.length} name group${groups.length === 1 ? "" : "s"}</span>
      </div>
      <div class="layer-style-node-row mask-control-node-row">
        ${groups.map(renderMaskGroupNode).join("")}
      </div>
    </section>
  `;
}

function renderMaskMassEditPanel(totalMasks, layerCount) {
  return `
    <section class="mask-control-mass-panel">
      <div class="mask-control-mass-head">
        <strong>Mass Edit</strong>
        <span>${escapeHtml(totalMasks)} mask${totalMasks === 1 ? "" : "s"} on ${escapeHtml(layerCount)} selected layer${layerCount === 1 ? "" : "s"}</span>
      </div>
      <div class="mask-control-mass-grid">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-bulk-control="mode">
            ${renderMaskModeOptions(2)}
          </select>
          <button type="button" data-mask-bulk-apply="mode">Apply</button>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-bulk-control="inverted">
          <button type="button" data-mask-bulk-apply="inverted">Apply</button>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskBulkSliderNumber("opacity", 100, 0, 100, 1)}
          <button type="button" data-mask-bulk-apply="opacity">Apply</button>
        </label>
        <div class="mask-control-prop-group mask-control-mass-feather">
          <div class="mask-control-prop-group-head">
            <span>Feather</span>
            <button type="button" data-mask-bulk-apply="feather">Apply</button>
          </div>
          <label class="mask-control-prop compact">
            <span>X</span>
            ${renderMaskBulkSliderNumber("feather-x", 0, 0, 500, 0.1)}
          </label>
          <label class="mask-control-prop compact">
            <span>Y</span>
            ${renderMaskBulkSliderNumber("feather-y", 0, 0, 500, 0.1)}
          </label>
        </div>
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskBulkSliderNumber("expansion", 0, -500, 500, 0.1)}
          <button type="button" data-mask-bulk-apply="expansion">Apply</button>
        </label>
      </div>
    </section>
  `;
}

function renderMaskNode(layer, mask) {
  const enabled = mask.enabled !== false;
  const active = !!mask.selected;
  const modeValue = mask.modeValue === "" || mask.modeValue === null || typeof mask.modeValue === "undefined" ? 2 : Number(mask.modeValue);
  const opacity = mask.opacity === "" || mask.opacity === null || typeof mask.opacity === "undefined" ? 100 : Number(mask.opacity);
  const expansion = mask.expansion === "" || mask.expansion === null || typeof mask.expansion === "undefined" ? 0 : Number(mask.expansion);
  const feather = mask.feather && mask.feather.length !== undefined ? mask.feather : [0, 0];
  const featherX = Number(feather[0] || 0);
  const featherY = Number(feather[1] || 0);
  const lastModeValue = modeValue && modeValue !== 1 ? modeValue : 2;
  return `
    <section class="layer-style-node mask-control-node${enabled ? "" : " disabled"}${active ? " active" : ""}" data-layer-index="${escapeHtml(layer.index)}" data-mask-index="${escapeHtml(mask.index)}" data-mask-last-mode="${escapeHtml(lastModeValue)}">
      <span class="mask-control-node-strip"></span>
      <span class="mask-control-node-head">
        <strong>${escapeHtml(mask.name || ("Mask " + mask.index))}</strong>
        <em>${escapeHtml(mask.mode || "Mode")}</em>
      </span>
      <div class="mask-control-props">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-control="mode">
            ${renderMaskModeOptions(modeValue)}
          </select>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-control="inverted" ${mask.inverted ? "checked" : ""}>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskSliderNumber("opacity", opacity, 0, 100, 1)}
        </label>
        ${renderMaskProportionalSliderGroup("feather", [featherX, featherY], 0, 500, 0.1)}
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskSliderNumber("expansion", expansion, -500, 500, 0.1)}
        </label>
      </div>
    </section>
  `;
}

function renderMaskGroupNode(group) {
  const common = group.common || {};
  const modeValue = common.modeValue && !common.modeValue.mixed ? Number(common.modeValue.value) : "";
  const modeLabel = common.mode && !common.mode.mixed ? (common.mode.value || "Mode") : "--";
  const opacity = common.opacity && !common.opacity.mixed ? Number(common.opacity.value) : "";
  const expansion = common.expansion && !common.expansion.mixed ? Number(common.expansion.value) : "";
  const featherValue = common.feather && !common.feather.mixed && common.feather.value && common.feather.value.length !== undefined ? common.feather.value : ["", ""];
  const lastModeValue = modeValue && modeValue !== 1 ? modeValue : 2;
  const targetJson = JSON.stringify(group.targets || []);
  const layerSummary = group.layerNames && group.layerNames.length
    ? `${group.items.length} mask${group.items.length === 1 ? "" : "s"} / ${group.layerNames.length} layer${group.layerNames.length === 1 ? "" : "s"}`
    : `${group.items.length} mask${group.items.length === 1 ? "" : "s"}`;
  return `
    <section class="layer-style-node mask-control-node mask-control-group-node${group.enabled ? "" : " disabled"}${group.selected ? " active" : ""}" data-mask-targets="${escapeHtml(targetJson)}" data-mask-last-mode="${escapeHtml(lastModeValue)}">
      <span class="mask-control-node-strip"></span>
      <span class="mask-control-node-head">
        <strong>${escapeHtml(group.name)}</strong>
        <em>${escapeHtml(modeLabel)} · ${escapeHtml(layerSummary)}</em>
      </span>
      <div class="mask-control-props">
        <label class="mask-control-prop">
          <span>Mode</span>
          <select data-mask-control="mode" ${common.modeValue && common.modeValue.mixed ? 'data-mask-mixed="true"' : ""}>
            ${renderMaskModeOptions(modeValue, common.modeValue && common.modeValue.mixed)}
          </select>
        </label>
        <label class="mask-control-prop inline">
          <span>Inverted</span>
          <input type="checkbox" data-mask-control="inverted" ${common.inverted && common.inverted.value ? "checked" : ""} ${common.inverted && common.inverted.mixed ? 'data-mask-mixed="true"' : ""}>
        </label>
        <label class="mask-control-prop">
          <span>Opacity</span>
          ${renderMaskSliderNumber("opacity", opacity, 0, 100, 1, common.opacity && common.opacity.mixed)}
        </label>
        ${renderMaskProportionalSliderGroup("feather", featherValue, 0, 500, 0.1, common.feather && common.feather.mixed)}
        <label class="mask-control-prop">
          <span>Expansion</span>
          ${renderMaskSliderNumber("expansion", expansion, -500, 500, 0.1, common.expansion && common.expansion.mixed)}
        </label>
      </div>
    </section>
  `;
}

function renderMaskProportionalSliderGroup(groupId, values, min, max, step, mixed) {
  const group = MASK_PROPORTIONAL_GROUPS[groupId];
  if (!group) return "";
  const controls = group.controls || [];
  const axes = group.axes || [];
  const numbers = controls.map((_, index) => mixed ? "" : Number(values && values[index] || 0));
  const linked = !mixed && numbers.length > 1 && numbers.every(value => Math.abs(value - numbers[0]) < 0.001);
  return `
    <div class="mask-control-prop-group" data-mask-link-group="${escapeHtml(groupId)}" data-mask-link-active="${linked ? "true" : "false"}">
      <div class="mask-control-prop-group-head">
        <span>${escapeHtml(group.label || groupId)}</span>
        <button type="button" class="mask-control-link${linked ? " linked" : ""}" data-mask-link-toggle="${escapeHtml(groupId)}" title="Link ${escapeHtml((axes.join(" and ") || "values"))}" aria-label="Link ${escapeHtml((axes.join(" and ") || "values"))}"></button>
      </div>
      ${controls.map((control, index) => `
        <label class="mask-control-prop compact">
          <span>${escapeHtml(axes[index] || String(index + 1))}</span>
          ${renderMaskSliderNumber(control, numbers[index], min, max, step, mixed)}
        </label>
      `).join("")}
    </div>
  `;
}

function renderMaskSliderNumber(control, value, min, max, step, mixed) {
  const rounded = mixed ? "" : Math.round(Number(value || 0) * 100) / 100;
  const displayValue = mixed ? "--" : rounded;
  const sliderValue = Math.max(min, Math.min(max, rounded));
  const rangePercent = max === min ? 0 : Math.max(0, Math.min(100, ((sliderValue - min) / (max - min)) * 100));
  return `
    <span class="mask-control-pair">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${mixed ? min : sliderValue}" data-mask-control="${control}" data-mask-control-kind="range" ${mixed ? 'data-mask-mixed="true"' : ""} style="--range-fill:${mixed ? 0 : rangePercent}%">
      <input type="text" inputmode="decimal" value="${escapeHtml(displayValue)}" data-mask-control="${control}" data-mask-control-kind="number" ${mixed ? 'data-mask-mixed="true"' : ""}>
    </span>
  `;
}

function renderMaskBulkSliderNumber(control, value, min, max, step) {
  const rounded = Math.round(Number(value || 0) * 100) / 100;
  const sliderValue = Math.max(min, Math.min(max, rounded));
  const rangePercent = max === min ? 0 : Math.max(0, Math.min(100, ((sliderValue - min) / (max - min)) * 100));
  return `
    <span class="mask-control-pair">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${sliderValue}" data-mask-bulk-control="${control}" data-mask-bulk-kind="range" style="--range-fill:${rangePercent}%">
      <input type="number" min="${min}" max="${max}" step="${step}" value="${rounded}" data-mask-bulk-control="${control}" data-mask-bulk-kind="number">
    </span>
  `;
}

function renderMaskModeOptions(value, mixed) {
  const options = [
    [1, "None"],
    [2, "Add"],
    [3, "Subtract"],
    [4, "Intersect"],
    [5, "Lighten"],
    [6, "Darken"],
    [7, "Difference"]
  ].map(option => `<option value="${option[0]}" ${Number(value) === option[0] ? "selected" : ""}>${escapeHtml(option[1])}</option>`).join("");
  return `${mixed ? '<option value="" selected>--</option>' : ""}${options}`;
}

function bindMaskControlNodes(root) {
  bindMaskBulkControls(root);
  root.querySelectorAll(".mask-control-node[data-mask-index], .mask-control-node[data-mask-targets]").forEach(node => {
    node.addEventListener("click", async event => {
      if (event.target.closest && event.target.closest("input, select, button, textarea")) return;
      const targets = maskTargetsFromNode(node);
      if (targets.length) await selectMaskFromPanel(Number(targets[0].layerIndex), Number(targets[0].maskIndex));
      root.querySelectorAll(".mask-control-node.active").forEach(item => item.classList.remove("active"));
      node.classList.add("active");
    });
  });
  root.querySelectorAll("[data-mask-link-toggle]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const group = button.closest("[data-mask-link-group]");
      const node = button.closest("[data-mask-index], [data-mask-targets]");
      if (!group || !node) return;
      const linked = group.dataset.maskLinkActive !== "true";
      group.dataset.maskLinkActive = linked ? "true" : "false";
      button.classList.toggle("linked", linked);
      if (!linked) return;
      const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
      const firstControl = linkGroup && linkGroup.controls && linkGroup.controls[0];
      const source = firstControl
        ? group.querySelector(`[data-mask-control="${firstControl}"][data-mask-control-kind="number"]`) || group.querySelector(`[data-mask-control="${firstControl}"]`)
        : null;
      if (!source) return;
      mirrorMaskProportionalValue(source, group);
      await setMaskControlValue(node, source, { refresh: false });
    });
  });
  root.querySelectorAll("[data-mask-control]").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("focus", () => {
      if (input.dataset.maskMixed === "true" && input.dataset.maskControlKind === "number" && input.value === "--") input.value = "";
    });
    input.addEventListener("input", () => {
      syncMaskPairedControl(input);
      syncMaskLinkedControls(input);
      syncMaskProportionalControls(input);
      updateMaskRangeFills(input);
      if (input.dataset.maskControlKind === "range") scheduleLiveMaskSlider(input);
    });
    input.addEventListener("change", async () => {
      clearLiveMaskSlider(input);
      syncMaskPairedControl(input);
      syncMaskLinkedControls(input);
      syncMaskProportionalControls(input);
      updateMaskRangeFills(input);
      const node = input.closest("[data-mask-index], [data-mask-targets]");
      if (!node) return;
      await setMaskControlValue(node, input);
    });
  });
  root.querySelectorAll('input[type="checkbox"][data-mask-mixed="true"]').forEach(input => {
    input.indeterminate = true;
  });
}

function bindMaskBulkControls(root) {
  root.querySelectorAll("[data-mask-bulk-control]").forEach(input => {
    input.addEventListener("click", event => event.stopPropagation());
    input.addEventListener("input", () => {
      syncMaskBulkPairedControl(input);
      updateMaskBulkRangeFills(input);
    });
    input.addEventListener("change", () => {
      syncMaskBulkPairedControl(input);
      updateMaskBulkRangeFills(input);
    });
  });
  root.querySelectorAll("[data-mask-bulk-apply]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await applyMaskBulkControl(root, button.dataset.maskBulkApply);
    });
  });
}

function syncMaskBulkPairedControl(input) {
  const control = input.dataset.maskBulkControl;
  const kind = input.dataset.maskBulkKind;
  if (!control || !kind) return;
  const pair = input.closest(".mask-control-pair");
  if (!pair) return;
  const otherKind = kind === "range" ? "number" : "range";
  const other = pair.querySelector(`[data-mask-bulk-control="${control}"][data-mask-bulk-kind="${otherKind}"]`);
  if (other) other.value = input.value;
}

function updateMaskBulkRangeFills(input) {
  const panel = input && input.closest ? input.closest(".mask-control-mass-panel") : null;
  if (!panel) return;
  panel.querySelectorAll('[data-mask-bulk-kind="range"]').forEach(updateLayerStyleRangeFill);
}

async function applyMaskBulkControl(root, propertyName) {
  const panel = root.querySelector(".mask-control-mass-panel");
  if (!panel || !propertyName) return;
  let value;
  if (propertyName === "inverted") {
    const input = panel.querySelector('[data-mask-bulk-control="inverted"]');
    value = !!(input && input.checked);
  } else if (propertyName === "feather") {
    const x = panel.querySelector('[data-mask-bulk-control="feather-x"][data-mask-bulk-kind="number"]');
    const y = panel.querySelector('[data-mask-bulk-control="feather-y"][data-mask-bulk-kind="number"]');
    value = [Number((x && x.value) || 0), Number((y && y.value) || 0)];
  } else {
    const input = panel.querySelector(`[data-mask-bulk-control="${propertyName}"]`);
    value = Number((input && input.value) || 0);
  }
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedMasksProperty", [propertyName, value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not mass edit masks.";
    return;
  }
  const maskCount = Number(result.maskCount || 0);
  statusEl.textContent = `Updated ${maskCount} selected-layer mask${maskCount === 1 ? "" : "s"}.`;
  await refreshMaskControlPanelContent();
}

function syncMaskPairedControl(input) {
  const control = input.dataset.maskControl;
  const kind = input.dataset.maskControlKind;
  if (!control || !kind) return;
  const pair = input.closest(".mask-control-pair");
  if (!pair) return;
  const otherKind = kind === "range" ? "number" : "range";
  const other = pair.querySelector(`[data-mask-control="${control}"][data-mask-control-kind="${otherKind}"]`);
  if (other) other.value = input.value;
}

function updateMaskRangeFills(input) {
  const node = input && input.closest ? input.closest("[data-mask-index], [data-mask-targets]") : null;
  if (!node) return;
  node.querySelectorAll('[data-mask-control-kind="range"]').forEach(updateLayerStyleRangeFill);
}

function syncMaskLinkedControls(input) {
  const node = input.closest("[data-mask-index], [data-mask-targets]");
  if (!node) return;
  const control = input.dataset.maskControl;
  if (control === "mode") {
    const mode = Number(input.value);
    node.classList.toggle("disabled", mode === 1);
    if (mode && mode !== 1) node.dataset.maskLastMode = String(mode);
  }
}

function syncMaskProportionalControls(input) {
  const control = input.dataset.maskControl;
  const group = input.closest("[data-mask-link-group]");
  if (!group || group.dataset.maskLinkActive !== "true") return;
  const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
  if (!linkGroup || (linkGroup.controls || []).indexOf(control) < 0) return;
  mirrorMaskProportionalValue(input, group);
}

function mirrorMaskProportionalValue(input, group) {
  const linkGroup = MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
  if (!linkGroup || !(linkGroup.controls || []).length) return;
  const sourceControl = input.dataset.maskControl;
  const value = input.value;
  linkGroup.controls.forEach(control => {
    group.querySelectorAll(`[data-mask-control="${control}"]`).forEach(target => {
      if (target !== input) target.value = value;
    });
  });
}

function scheduleLiveMaskSlider(input) {
  clearLiveMaskSlider(input);
  const timer = setTimeout(async () => {
    maskSliderLiveTimers.delete(input);
    const node = input.closest("[data-mask-index], [data-mask-targets]");
    if (!node) return;
    await setMaskControlValue(node, input, { refresh: false, status: false });
  }, 55);
  maskSliderLiveTimers.set(input, timer);
}

function clearLiveMaskSlider(input) {
  const timer = maskSliderLiveTimers.get(input);
  if (!timer) return;
  clearTimeout(timer);
  maskSliderLiveTimers.delete(input);
}

async function selectMaskFromPanel(layerIndex, maskIndex) {
  suppressSyncUntil = Date.now() + 900;
  state.selectedLayerIndices = [Number(layerIndex)];
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectMask", [layerIndex, maskIndex]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not select mask.";
    return;
  }
  statusEl.textContent = `Selected mask ${maskIndex} on layer ${layerIndex}.`;
}

function maskTargetsFromNode(node) {
  if (!node) return [];
  if (node.dataset.maskTargets) {
    try {
      const targets = JSON.parse(node.dataset.maskTargets || "[]");
      return Array.isArray(targets) ? targets.filter(target => Number(target.layerIndex) > 0 && Number(target.maskIndex) > 0) : [];
    } catch (_) {
      return [];
    }
  }
  const layerIndex = Number(node.dataset.layerIndex || 0);
  const maskIndex = Number(node.dataset.maskIndex || 0);
  return layerIndex > 0 && maskIndex > 0 ? [{ layerIndex, maskIndex }] : [];
}

async function setMaskControlValue(node, input, options = {}) {
  const targets = maskTargetsFromNode(node);
  const layerIndex = Number(targets[0] && targets[0].layerIndex || 0);
  const maskIndex = Number(targets[0] && targets[0].maskIndex || 0);
  const control = input.dataset.maskControl;
  let propertyName = control;
  let value = input.value;
  if (control === "inverted") {
    value = !!input.checked;
  } else if (control === "mode" || control === "opacity" || control === "expansion") {
    value = Number(input.value);
    if (!Number.isFinite(value)) {
      statusEl.textContent = "Enter a value before applying mixed mask properties.";
      return;
    }
    if (control === "mode" && value !== 1) node.dataset.maskLastMode = String(value);
  } else {
    const group = input.closest("[data-mask-link-group]");
    const linkGroup = group && MASK_PROPORTIONAL_GROUPS[group.dataset.maskLinkGroup];
    if (linkGroup && (linkGroup.controls || []).indexOf(control) >= 0) {
      propertyName = linkGroup.propertyName;
      value = linkGroup.controls.map(item => Number((node.querySelector(`[data-mask-control="${item}"][data-mask-control-kind="number"]`) || node.querySelector(`[data-mask-control="${item}"]`) || {}).value || 0));
      if (value.some(item => !Number.isFinite(item))) {
        statusEl.textContent = "Enter feather values before applying mixed mask properties.";
        return;
      }
    }
  }
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = targets.length > 1
    ? await aeCall("TNT_setMaskTargetsProperty", [targets, propertyName, value])
    : await aeCall("TNT_setMaskProperty", [layerIndex, maskIndex, propertyName, value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not update mask.";
    if (control === "inverted") input.checked = !input.checked;
    return;
  }
  if (control === "mode") {
    node.classList.toggle("disabled", Number(value) === 1);
  }
  if (options.status !== false) statusEl.textContent = targets.length > 1 ? `Updated ${targets.length} grouped masks.` : `Updated mask ${maskIndex}.`;
  if (options.refresh !== false) await refreshMaskControlPanelContent();
}

function rgbArrayToHex(value) {
  const arr = value && value.length !== undefined ? value : [0, 0, 0];
  function hex(channel) {
    const n = Math.max(0, Math.min(255, Math.round(Number(channel || 0) * 255)));
    const s = n.toString(16);
    return s.length === 1 ? "0" + s : s;
  }
  return "#" + hex(arr[0]) + hex(arr[1]) + hex(arr[2]);
}

function hexToRgbArray(hex) {
  const raw = String(hex || "#000000").replace("#", "");
  const value = raw.length === 3 ? raw.split("").map(ch => ch + ch).join("") : raw;
  const intValue = parseInt(value, 16);
  if (Number.isNaN(intValue)) return [0, 0, 0];
  return [
    ((intValue >> 16) & 255) / 255,
    ((intValue >> 8) & 255) / 255,
    (intValue & 255) / 255
  ];
}

function layerStylePresetFolderPath() {
  return `${extensionRootPath()}/presets/layer-styles`;
}

function parseLayerStylePresetCommandResult(result) {
  if (!result || !result.ok) return result || { ok: false, error: "Panel command failed." };
  if (typeof result.result !== "string") return result;
  try {
    const inner = JSON.parse(result.result || "{}");
    if (inner && typeof inner === "object" && Object.prototype.hasOwnProperty.call(inner, "ok")) return inner;
  } catch (_) {}
  return result;
}

async function callLayerStylePresetCommand(functionName, args = []) {
  const encodedArgs = args.map(value => JSON.stringify(value)).join(",");
  const path = jsxPath();
  const script = `
    (function () {
      $.evalFile('${escForExtendScriptString(path)}');
      if (typeof ${functionName} !== "function") {
        return JSON.stringify({ ok: false, error: "TNT function not available after reload: ${functionName}", path: '${escForExtendScriptString(path)}' });
      }
      return ${functionName}(${encodedArgs});
    }())
  `;
  return parseLayerStylePresetCommandResult(await aeEvalScript(script));
}

async function openLayerStyleAddDialog() {
  return openLayerStylePanel();
}

async function openLayerStyleEditDialog() {
  return openLayerStylePanel();
}

async function openLayerStylePanel() {
  closeFxConsole();
  const wasOpen = !!(layerStyleDialogEl && layerStyleDialogEl.classList.contains("show"));
  const el = showLayerStyleDialog("Layer Styles", "Add missing styles and edit existing ones in one panel.");
  const body = el.querySelector(".layer-style-dialog-body");
  const actions = el.querySelector(".layer-style-dialog-actions");
  if (!wasOpen) body.innerHTML = `<div class="layer-style-loading">Loading layer styles...</div>`;
  actions.innerHTML = `
    <button type="button" data-action="refresh">Refresh</button>
    <button type="button" data-action="save-preset">Save Style</button>
    <button type="button" data-action="restore">Undo Style Edits</button>
    <button type="button" data-action="hide">Hide All</button>
    <button type="button" data-action="delete" class="danger">Delete All</button>
  `;
  actions.querySelector('[data-action="refresh"]').addEventListener("click", refreshLayerStylePanelContent);
  actions.querySelector('[data-action="save-preset"]').addEventListener("click", saveCurrentLayerStylePreset);
  actions.querySelector('[data-action="restore"]').addEventListener("click", async () => {
    if (!layerStyleEditSnapshot) {
      statusEl.textContent = "No style edit snapshot to restore.";
      return;
    }
    await callTntV3Command("seRestoreSnapshot", [JSON.stringify(layerStyleEditSnapshot)], { status: false, localFirst: true });
    await refreshLayerStylePanelContent();
  });
  actions.querySelector('[data-action="hide"]').addEventListener("click", async () => {
    rawLayerStyleGmnsFromPanel().forEach(gMn => layerStylePinnedOff.add(gMn));
    await callTntV3Command("hideAllLayerStyles", [], { status: false, localFirst: true });
    await refreshLayerStylePanelContent();
  });
  actions.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    await callTntV3Command("removeAllLayerStyles", [], { status: false, localFirst: true });
    layerStyleKnownAdded.clear();
    layerStylePinnedOff.clear();
    layerStyleLastByGmn.clear();
    await refreshLayerStylePanelContent();
  });
  await refreshLayerStylePanelContent({ showLoading: !wasOpen });
}

async function refreshLayerStylePanelContent(options = {}) {
  const el = ensureLayerStyleDialog();
  const body = el.querySelector(".layer-style-dialog-body");
  const previousScrollTop = body ? body.scrollTop : 0;
  const previousScrollLeft = body ? body.scrollLeft : 0;
  if (options.showLoading) body.innerHTML = `<div class="layer-style-loading">Loading layer styles...</div>`;
  const statusResult = await callTntV3Command("getStyleStatusJSON", [], { status: false, localFirst: true });
  let status = {};
  try { status = JSON.parse(statusResult.result || "{}"); } catch (_) {}
  const presetData = await callLayerStylePresetCommand("TNT_getLayerStylePresetsJSON", [layerStylePresetFolderPath()]);
  const presets = Array.isArray(presetData.presets) ? presetData.presets : [];

  const result = await callTntV3Command("TNT_getLayerStylePanelJSON", [], { status: false, localFirst: true });
  let data = null;
  try { data = JSON.parse(result.result || "{}"); } catch (_) {}
  const rawStyles = data && Array.isArray(data.styles) ? data.styles : [];
  const stylePresence = {};
  rawStyles.forEach(style => {
    if (!style || !style.gMn) return;
    if (Number(style.enabled || 0) > 0 || layerStylePinnedOff.has(style.gMn)) {
      layerStyleLastByGmn.set(style.gMn, Object.assign({}, style));
    }
    stylePresence[style.gMn] = {
      have: Number(style.have || 0),
      enabled: Number(style.enabled || 0),
      total: Number(style.total || 0)
    };
  });
  layerStylePinnedOff.forEach(gMn => {
    const presence = stylePresence[gMn];
    if (gMn !== layerStyleRecentAddGmn && (!presence || Number(presence.have || 0) <= 0)) {
      layerStylePinnedOff.delete(gMn);
      layerStyleLastByGmn.delete(gMn);
      layerStyleKnownAdded.delete(gMn);
    }
  });
  layerStyleKnownAdded.forEach(gMn => {
    if (gMn === layerStyleRecentAddGmn) return;
    layerStyleKnownAdded.delete(gMn);
  });
  const styles = rawStyles.filter(style => {
    const gMn = style && style.gMn;
    const enabled = gMn ? Number(style.enabled || 0) : 0;
    return enabled > 0 || (gMn && (layerStylePinnedOff.has(gMn) || gMn === layerStyleRecentAddGmn));
  });
  layerStylePinnedOff.forEach(gMn => {
    if (styles.some(style => style && style.gMn === gMn)) return;
    const cached = layerStyleLastByGmn.get(gMn);
    if (cached) styles.push(Object.assign({}, cached, { enabled: 0 }));
  });
  styles.sort((a, b) => layerStyleVisualOrder(a && a.gMn) - layerStyleVisualOrder(b && b.gMn));
  const addButtons = TNT_LAYER_STYLE_MAP
    .map((style, index) => {
      const baseStatus = status[style.gMn] || {};
      const presence = stylePresence[style.gMn] || {};
      return {
        style,
        index,
        status: {
          total: Number(presence.total || baseStatus.total || 0),
          have: Number(presence.enabled || baseStatus.have || (layerStylePinnedOff.has(style.gMn) ? presence.total || baseStatus.total || 1 : 0)),
          enabled: Number(presence.enabled || baseStatus.have || 0),
          missing: layerStylePinnedOff.has(style.gMn) ? 0 : Math.max(0, Number(presence.total || baseStatus.total || 0) - Number(presence.enabled || baseStatus.have || 0))
        }
      };
    });
  layerStyleEditSnapshot = data && data.snapshot ? data.snapshot : null;
  const styleLayerCount = rawStyles.reduce((max, style) => Math.max(max, Number(style && style.total || 0)), 0) ||
    (state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.length : 0);
  const addRowHtml = addButtons.length
    ? `<div class="layer-style-header-add-row">${addButtons.map(item => renderLayerStyleAddButton(item.style, item.index, item.status)).join("")}</div>`
    : `<div class="layer-style-header-add-row empty"><span>All styles added</span></div>`;
  const titleEl = el.querySelector(".layer-style-dialog-title");
  const subtitleEl = el.querySelector(".layer-style-dialog-subtitle");
  if (titleEl) titleEl.innerHTML = `<b class="layer-style-shortcut-badge">S</b><span>Layer Styles</span><em class="layer-style-layer-count">${styleLayerCount || 0} layer${styleLayerCount === 1 ? "" : "s"}</em>`;
  if (subtitleEl) subtitleEl.textContent = "";
  body.innerHTML = `
    <div class="layer-style-layout">
      <section class="layer-style-presets-panel">
        ${layerStylePresetNameOpen ? renderLayerStylePresetNameForm() : ""}
        ${presets.length ? `<div class="layer-style-presets-row">${presets.map(renderLayerStylePresetButton).join("")}</div>` : (layerStylePresetNameOpen ? "" : `<div class="layer-style-presets-empty">No saved styles yet.</div>`)}
      </section>
      <section class="layer-style-add-panel">
        ${addRowHtml}
      </section>
      <section class="layer-style-edit-panel">
        ${styles.length ? `<div class="layer-style-node-row${layerStyleRecentAddGmn ? " is-adding" : ""}">${styles.map(style => renderLayerStyleNode(style)).join("")}</div>` : `<div class="layer-style-empty">No layer styles have been added yet.</div>`}
      </section>
    </div>
  `;
  el.querySelectorAll("[data-style-add-index]").forEach(button => {
    bindLayerStyleAddButton(button);
  });
  bindLayerStylePresetNameForm(body);
  bindLayerStylePresetControls(body);
  bindLayerStyleEditControls(body);
  body.scrollTop = previousScrollTop;
  body.scrollLeft = previousScrollLeft;
  if (layerStyleRecentAddGmn) {
    const addedGmn = layerStyleRecentAddGmn;
    setTimeout(() => focusLayerStyleNode(addedGmn), 70);
    setTimeout(() => {
      const row = body.querySelector(".layer-style-node-row");
      const node = body.querySelector(`.layer-style-node[data-gmn="${cssEscapeValue(addedGmn)}"]`);
      if (row) row.classList.remove("is-adding");
      if (node) node.classList.remove("style-node-new");
      if (layerStyleRecentAddGmn === addedGmn) layerStyleRecentAddGmn = "";
    }, 760);
  }
}

async function saveCurrentLayerStylePreset() {
  layerStylePresetNameOpen = true;
  await refreshLayerStylePanelContent();
  const input = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-name]");
  setTimeout(() => {
    if (!input) return;
    try { input.focus({ preventScroll: true }); }
    catch (_) { try { input.focus(); } catch (__) {} }
    if (input.select) input.select();
  }, 0);
}

function renderLayerStylePresetNameForm() {
  return `
    <form class="layer-style-preset-save-form" data-style-preset-save-form>
      <input type="text" data-style-preset-name placeholder="Style name" spellcheck="false" autocomplete="off">
      <button type="button" class="primary" data-style-preset-submit>Save</button>
      <button type="button" data-style-preset-cancel>Cancel</button>
      <span class="layer-style-preset-save-message" data-style-preset-message></span>
    </form>
  `;
}

function bindLayerStylePresetNameForm(root) {
  const form = root.querySelector("[data-style-preset-save-form]");
  if (!form) return;
  const input = form.querySelector("[data-style-preset-name]");
  const submit = form.querySelector("[data-style-preset-submit]");
  const cancel = form.querySelector("[data-style-preset-cancel]");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    await submitLayerStylePresetName(input ? input.value : "");
  });
  if (submit) {
    submit.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      await submitLayerStylePresetName(input ? input.value : "");
    });
  }
  form.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    layerStylePresetNameOpen = false;
    refreshLayerStylePanelContent();
  });
  if (cancel) {
    cancel.addEventListener("click", () => {
      layerStylePresetNameOpen = false;
      refreshLayerStylePanelContent();
    });
  }
}

function setLayerStylePresetSaveMessage(message, isError) {
  const messageEl = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-message]");
  if (messageEl) {
    messageEl.textContent = message || "";
    messageEl.classList.toggle("error", !!isError);
  }
  if (message) statusEl.textContent = message;
}

async function submitLayerStylePresetName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    setLayerStylePresetSaveMessage("Style preset needs a name.", true);
    return;
  }
  const form = layerStyleDialogEl && layerStyleDialogEl.querySelector("[data-style-preset-save-form]");
  const controls = form ? Array.from(form.querySelectorAll("input, button")) : [];
  controls.forEach(control => { control.disabled = true; });
  setLayerStylePresetSaveMessage("Saving...", false);
  const result = await callLayerStylePresetCommand("TNT_saveSelectedLayerStylePreset", [trimmed, layerStylePresetFolderPath()]);
  if (!result.ok) {
    controls.forEach(control => { control.disabled = false; });
    setLayerStylePresetSaveMessage(result.error || "Could not save style preset.", true);
    return;
  }
  layerStylePresetNameOpen = false;
  setLayerStylePresetSaveMessage(result.result || "Style preset saved.", false);
  await refreshLayerStylePanelContent();
}

function layerStylePresetProp(style, matchName, fallback) {
  const props = Array.isArray(style && style.props) ? style.props : [];
  const prop = props.find(item => item && item.mn === matchName);
  return prop ? prop.value : fallback;
}

function layerStylePresetStyle(preset, gMn) {
  const styles = Array.isArray(preset && preset.styles) ? preset.styles : [];
  return styles.find(style => style && style.gMn === gMn) || null;
}

function layerStylePresetCssColor(value, opacity = 1, fallback = "#9b1d32") {
  const alpha = Math.max(0, Math.min(1, Number(opacity)));
  if (value && value.length !== undefined && typeof value !== "string") {
    const r = Math.max(0, Math.min(255, Math.round(Number(value[0] || 0) * 255)));
    const g = Math.max(0, Math.min(255, Math.round(Number(value[1] || 0) * 255)));
    const b = Math.max(0, Math.min(255, Math.round(Number(value[2] || 0) * 255)));
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
  }
  if (typeof value === "string" && value) return value;
  return fallback;
}

function layerStylePresetPreviewCss(preset) {
  const colorOverlay = layerStylePresetStyle(preset, "solidFill/enabled");
  const stroke = layerStylePresetStyle(preset, "frameFX/enabled");
  const shadow = layerStylePresetStyle(preset, "dropShadow/enabled");
  const outerGlow = layerStylePresetStyle(preset, "outerGlow/enabled");
  const innerGlow = layerStylePresetStyle(preset, "innerGlow/enabled");
  const satin = layerStylePresetStyle(preset, "chromeFX/enabled");

  let fill = colorOverlay
    ? layerStylePresetCssColor(layerStylePresetProp(colorOverlay, "solidFill/color", null), Number(layerStylePresetProp(colorOverlay, "solidFill/opacity", 100)) / 100)
    : "";
  if (!fill) {
    const firstColorStyle = (preset.styles || []).find(style => style && style.previewColor);
    fill = firstColorStyle ? firstColorStyle.previewColor : "#9b1d32";
  }

  const strokeWidth = stroke ? Math.max(1, Math.min(5, Math.round(Number(layerStylePresetProp(stroke, "frameFX/size", 2)) * 0.34))) : 0;
  const strokeOpacity = stroke ? Number(layerStylePresetProp(stroke, "frameFX/opacity", 100)) / 100 : 1;
  const strokeColor = stroke ? layerStylePresetCssColor(layerStylePresetProp(stroke, "frameFX/color", null), strokeOpacity, "#ffffff") : "rgba(255,255,255,.88)";
  const shadows = [];

  if (shadow) {
    const angle = Number(layerStylePresetProp(shadow, "dropShadow/localLightingAngle", 120)) * Math.PI / 180;
    const distance = Math.max(0, Number(layerStylePresetProp(shadow, "dropShadow/distance", 16))) * 0.22;
    const blur = Math.max(1, Number(layerStylePresetProp(shadow, "dropShadow/blur", 8)) * 0.18);
    const opacity = Number(layerStylePresetProp(shadow, "dropShadow/opacity", 45)) / 100;
    const x = Math.cos(angle) * distance;
    const y = -Math.sin(angle) * distance;
    shadows.push(`${x.toFixed(1)}px ${y.toFixed(1)}px ${blur.toFixed(1)}px ${layerStylePresetCssColor(layerStylePresetProp(shadow, "dropShadow/color", null), opacity, "rgba(0,0,0,.45)")}`);
  }
  if (outerGlow) {
    const blur = Math.max(2, Number(layerStylePresetProp(outerGlow, "outerGlow/blur", 12)) * 0.16);
    const opacity = Number(layerStylePresetProp(outerGlow, "outerGlow/opacity", 60)) / 100;
    shadows.push(`0 0 ${blur.toFixed(1)}px ${layerStylePresetCssColor(layerStylePresetProp(outerGlow, "outerGlow/color", null), opacity, "rgba(255,255,255,.55)")}`);
  }
  if (innerGlow) {
    const opacity = Number(layerStylePresetProp(innerGlow, "innerGlow/opacity", 40)) / 100;
    shadows.push(`0 0 2px ${layerStylePresetCssColor(layerStylePresetProp(innerGlow, "innerGlow/color", null), opacity, "rgba(255,255,255,.35)")}`);
  }
  if (satin) {
    const opacity = Number(layerStylePresetProp(satin, "chromeFX/opacity", 28)) / 100;
    shadows.push(`inset 0 0 0 ${layerStylePresetCssColor(layerStylePresetProp(satin, "chromeFX/color", null), opacity, "rgba(0,0,0,.25)")}`);
  }

  const textShadow = shadows.filter(item => item.indexOf("inset") !== 0).join(", ") || "0 2px 3px rgba(0,0,0,.28)";
  return [
    `--preset-letter-fill:${fill}`,
    `--preset-letter-stroke:${strokeColor}`,
    `--preset-letter-stroke-width:${strokeWidth || 1}px`,
    `--preset-letter-shadow:${textShadow}`
  ].join(";");
}

function renderLayerStylePresetButton(preset) {
  const styles = Array.isArray(preset && preset.styles) ? preset.styles : [];
  const title = `${preset.name || "Saved Style"}${preset.sourceLayer ? ` - from ${preset.sourceLayer}` : ""}`;
  const previewCss = layerStylePresetPreviewCss({ styles });
  return `
    <button type="button" class="layer-style-preset-button" data-style-preset-id="${escapeHtml(preset.id || "")}" title="${escapeHtml(title)}">
      <span class="layer-style-preset-meta">
        <strong>${escapeHtml(preset.name || "Saved Style")}</strong>
        <em>${styles.length} style${styles.length === 1 ? "" : "s"}</em>
      </span>
      <b class="layer-style-preset-preview" style="${escapeHtml(previewCss)}"><span>A</span></b>
    </button>
  `;
}

function bindLayerStylePresetControls(root) {
  root.querySelectorAll("[data-style-preset-id]").forEach(button => {
    button.addEventListener("click", async () => {
      const result = await callLayerStylePresetCommand("TNT_applyLayerStylePreset", [button.dataset.stylePresetId || "", layerStylePresetFolderPath()]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not apply saved style.";
        return;
      }
      statusEl.textContent = result.result || "Saved style applied.";
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
}

function waitForLayerStyleCommit(delay = 110) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

function bindLayerStyleAddButton(button) {
  const focusAddedStyle = event => {
    const gMn = button.dataset.styleGmn || "";
    if (!button.classList.contains("is-added")) return false;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    focusLayerStyleNode(gMn);
    return true;
  };
  button.addEventListener("contextmenu", event => {
    focusAddedStyle(event);
  });
  button.addEventListener("auxclick", event => {
    if (event.button === 1) focusAddedStyle(event);
  });
  button.addEventListener("mousedown", event => {
    if (event.button === 1 && focusAddedStyle(event)) return;
    if (event.button !== 0 || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const style = TNT_LAYER_STYLE_MAP[Number(button.dataset.styleAddIndex)];
    if (!style) return;
    if (button.classList.contains("all-have")) {
      focusLayerStyleNode(style.gMn);
      return;
    }
    const startY = event.clientY;
    let preview = null;
    let committed = false;
    const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
    const editPanel = body && body.querySelector(".layer-style-edit-panel");

    const ensurePreview = () => {
      if (preview || !editPanel) return preview;
      preview = document.createElement("section");
      preview.className = "layer-style-node preview";
      preview.innerHTML = `
        <div class="layer-style-node-head">
          <strong>${escapeHtml(style.label)}</strong>
          <div class="layer-style-node-controls"><span class="layer-style-preview-chip">Preview</span></div>
        </div>
        <div class="layer-style-node-props">
          ${(style.preview || []).map(name => `
            <label class="layer-style-prop preview-prop">
              <span>${escapeHtml(name)}</span>
            </label>
          `).join("")}
        </div>
      `;
      const row = editPanel.querySelector(".layer-style-node-row");
      if (row) row.insertBefore(preview, row.firstChild);
      else editPanel.appendChild(preview);
      return preview;
    };

    const updatePreview = moveEvent => {
      const dy = Math.max(0, moveEvent.clientY - startY);
      const amount = Math.max(0, Math.min(1, dy / 96));
      if (amount > 0.08) {
        const el = ensurePreview();
        if (el) {
          el.style.opacity = String(0.28 + amount * 0.72);
          el.style.transform = `translateY(${Math.round((1 - amount) * -10)}px) scale(${0.96 + amount * 0.04})`;
          el.style.setProperty("--preview-amount", String(amount));
        }
        button.classList.toggle("drag-adding", amount > 0.45);
      }
    };

    const addStyle = async () => {
      if (committed) return;
      committed = true;
      const result = await callTntV3Command("applyLayerStyleCmds", [[style.cmd], [style.gMn], true], { status: false, localFirst: true });
      if (result && result.ok) {
        layerStyleKnownAdded.add(style.gMn);
        layerStyleRecentAddGmn = style.gMn;
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    };

    const finish = upEvent => {
      document.removeEventListener("mousemove", updatePreview, true);
      document.removeEventListener("mouseup", finish, true);
      button.classList.remove("drag-adding");
      const dy = Math.max(0, upEvent.clientY - startY);
      if (preview && dy < 48) preview.remove();
      addStyle();
    };

    document.addEventListener("mousemove", updatePreview, true);
    document.addEventListener("mouseup", finish, true);
  });
}

function renderLayerStyleAddButton(style, index, status) {
  const total = Number(status && status.total || 0);
  const have = Number(status && status.have || 0);
  const someHave = total > 0 && have > 0 && have < total;
  const knownAdded = layerStyleKnownAdded.has(style.gMn);
  const added = knownAdded || have > 0;
  const allHave = knownAdded || (total > 0 && have >= total);
  const className = [
    "layer-style-add-button",
    added ? "is-added" : "",
    someHave ? "some-have" : "",
    allHave ? "all-have" : ""
  ].filter(Boolean).join(" ");
  const title = `${style.label} - ${style.position || "layer style"}${added ? " - right-click to jump to its editor" : ""}${someHave ? ` (${have}/${total} selected layers have it)` : ""}`;
  return `
    <button type="button" class="${className}" data-style-add-index="${index}" data-style-gmn="${escapeHtml(style.gMn || "")}" title="${escapeHtml(title)}" style="--style-color:${escapeHtml(style.color || "#777")}">
      <span>${escapeHtml(style.label || layerStyleIconText(style.label))}</span>
    </button>
  `;
}

function rawLayerStyleGmnsFromPanel() {
  const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
  if (!body) return [];
  return Array.prototype.slice.call(body.querySelectorAll(".layer-style-node[data-gmn]"))
    .map(node => node.dataset.gmn)
    .filter(Boolean);
}

function focusLayerStyleNode(gMn) {
  const body = layerStyleDialogEl && layerStyleDialogEl.querySelector(".layer-style-dialog-body");
  if (!body || !gMn) return false;
  const nodes = Array.prototype.slice.call(body.querySelectorAll(".layer-style-node[data-gmn]"));
  const node = nodes.find(item => item.dataset.gmn === gMn);
  if (!node) return false;
  if (node.scrollIntoView) {
    try { node.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); }
    catch (_) { node.scrollIntoView(); }
  }
  node.classList.remove("style-node-flash");
  void node.offsetWidth;
  node.classList.add("style-node-flash");
  setTimeout(() => { if (node) node.classList.remove("style-node-flash"); }, 1200);
  return true;
}

function cssEscapeValue(value) {
  if (window.CSS && CSS.escape) return CSS.escape(String(value || ""));
  return String(value || "").replace(/["\\]/g, "\\$&");
}

function layerStyleIconText(label) {
  const words = String(label || "").replace("&", " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

function renderLayerStyleNode(style) {
  const enabledCount = Number(style.enabled || 0);
  const total = Number(style.total || 0);
  const enabled = enabledCount > 0;
  const mixed = total > 1 && enabledCount > 0 && enabledCount < total;
  const isNew = style.gMn === layerStyleRecentAddGmn;
  return `
    <section class="layer-style-node${enabled ? "" : " disabled"}${mixed ? " mixed" : ""}${isNew ? " style-node-new" : ""}" data-gmn="${escapeHtml(style.gMn)}">
      <div class="layer-style-node-head">
        <strong>${escapeHtml(style.label)}</strong>
        <div class="layer-style-node-controls">
          <button type="button" class="layer-style-toggle${enabled ? " on" : ""}" data-style-enable="${enabled ? "false" : "true"}" title="${enabled ? "Turn off" : "Turn on"}"><span></span></button>
          <button type="button" class="layer-style-delete" data-style-delete="true" title="Delete style">x</button>
        </div>
      </div>
      <div class="layer-style-node-props">
        ${(style.props || []).map(prop => renderLayerStyleProp(style, prop)).join("")}
      </div>
    </section>
  `;
}

function renderLayerStyleProp(style, prop) {
  const value = prop.value;
  const safeLabel = escapeHtml(prop.label || prop.mn || "Property");
  const dataAttrs = `data-gmn="${escapeHtml(style.gMn)}" data-pmn="${escapeHtml(prop.mn || "")}"`;
  if (prop.type === "slider" || prop.type === "angle") {
    const min = prop.type === "angle" ? 0 : Number(prop.min || 0);
    const max = prop.type === "angle" ? 360 : Number(prop.max || 100);
    const number = value === null || typeof value === "undefined" ? min : Number(value);
    const rangePercent = Math.max(0, Math.min(100, max === min ? 0 : ((number - min) / (max - min)) * 100));
    return `
      <label class="layer-style-prop">
        <span>${safeLabel}</span>
        <input type="range" min="${min}" max="${max}" value="${number}" ${dataAttrs} data-style-control="range" style="--range-fill:${rangePercent}%">
        <input type="number" min="${min}" max="${max}" value="${Math.round(number * 100) / 100}" ${dataAttrs} data-style-control="number">
      </label>
    `;
  }
  if (prop.type === "bool") {
    return `
      <label class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <input type="checkbox" ${value ? "checked" : ""} ${dataAttrs} data-style-control="bool">
      </label>
    `;
  }
  if (prop.type === "color") {
    const colorValue = rgbArrayToHex(value);
    return `
      <label class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <button type="button" class="layer-style-color-swatch" ${dataAttrs} data-style-control="color" style="--color-value:${escapeHtml(colorValue)}" title="Edit color"></button>
      </label>
    `;
  }
  if (prop.type === "dropdown") {
    const options = prop.options || [];
    const values = prop.values || [];
    return `
      <label class="layer-style-prop dropdown">
        <span>${safeLabel}</span>
        <select ${dataAttrs} data-style-control="dropdown">
          ${options.map((option, index) => {
            const optionValue = values[index];
            return `<option value="${optionValue}" ${Number(value) === Number(optionValue) ? "selected" : ""}>${escapeHtml(option)}</option>`;
          }).join("")}
        </select>
      </label>
    `;
  }
  if (prop.type === "gradient_btn") {
    return `
      <div class="layer-style-prop inline">
        <span>${safeLabel}</span>
        <button type="button" data-style-control="gradient">Edit</button>
      </div>
    `;
  }
  return "";
}

function bindLayerStyleEditControls(root) {
  root.querySelectorAll("[data-style-enable]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest(".layer-style-node");
      if (!node) return;
      const gMn = node.dataset.gmn;
      const shouldEnable = button.dataset.styleEnable === "true";
      const result = await callTntV3Command("seEnableStyle", [gMn, shouldEnable], { status: false, localFirst: true });
      if (result && result.ok && shouldEnable) {
        layerStylePinnedOff.delete(gMn);
        layerStyleRecentAddGmn = gMn;
      } else if (result && result.ok) {
        layerStylePinnedOff.add(gMn);
        const cached = layerStyleLastByGmn.get(gMn);
        if (cached) layerStyleLastByGmn.set(gMn, Object.assign({}, cached, { enabled: 0 }));
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll("[data-style-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      const node = button.closest(".layer-style-node");
      if (!node) return;
      await loadJSX();
      const result = await aeCall("TNT_removeLayerStyle", [node.dataset.gmn]);
      if (!result.ok) statusEl.textContent = result.error || "Could not delete layer style.";
      else if (result.result) statusEl.textContent = String(result.result);
      if (result.ok) {
        layerStyleKnownAdded.delete(node.dataset.gmn);
        layerStylePinnedOff.delete(node.dataset.gmn);
        layerStyleLastByGmn.delete(node.dataset.gmn);
      }
      await waitForLayerStyleCommit();
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll('[data-style-control="range"]').forEach(input => {
    updateLayerStyleRangeFill(input);
    input.addEventListener("input", () => {
      const number = input.parentElement.querySelector('[data-style-control="number"]');
      if (number) number.value = input.value;
      updateLayerStyleRangeFill(input);
      scheduleLiveLayerStyleSlider(input);
    });
    input.addEventListener("change", () => {
      clearLiveLayerStyleSlider(input);
      setLayerStyleProp(input, Number(input.value));
    });
  });
  root.querySelectorAll('[data-style-control="number"]').forEach(input => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      const range = input.parentElement.querySelector('[data-style-control="range"]');
      if (range) {
        range.value = value;
        updateLayerStyleRangeFill(range);
      }
      setLayerStyleProp(input, value);
    });
  });
  root.querySelectorAll('[data-style-control="bool"]').forEach(input => {
    input.addEventListener("change", () => setLayerStyleProp(input, !!input.checked));
  });
  root.querySelectorAll('[data-style-control="color"]').forEach(input => {
    input.addEventListener("click", async () => {
      const result = await callTntV3Command("sePickColor", [input.dataset.gmn, input.dataset.pmn], { status: false, localFirst: true });
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not open native color picker.";
        return;
      }
      await refreshLayerStylePanelContent();
    });
  });
  root.querySelectorAll('[data-style-control="dropdown"]').forEach(input => {
    input.addEventListener("change", () => setLayerStyleProp(input, Number(input.value)));
  });
  root.querySelectorAll('[data-style-control="gradient"]').forEach(button => {
    button.addEventListener("click", async () => {
      await callTntV3Command("seEditGradient", [], { status: false, localFirst: true });
    });
  });
}

function updateLayerStyleRangeFill(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

function scheduleLiveLayerStyleSlider(input) {
  clearLiveLayerStyleSlider(input);
  const timer = setTimeout(() => {
    styleSliderLiveTimers.delete(input);
    setLayerStyleProp(input, Number(input.value));
  }, 55);
  styleSliderLiveTimers.set(input, timer);
}

function clearLiveLayerStyleSlider(input) {
  const timer = styleSliderLiveTimers.get(input);
  if (!timer) return;
  clearTimeout(timer);
  styleSliderLiveTimers.delete(input);
}

async function setLayerStyleProp(input, value) {
  await callTntV3Command("seSetProp", [input.dataset.gmn, input.dataset.pmn, value], { status: false, localFirst: true });
  if (!LAYER_STYLE_PANEL_KEEP_OPEN && !panelSettings.keepStyleEditorOpen) closeLayerStyleDialog();
}
function ensureSettingsMenu() {
  if (settingsMenuEl) return settingsMenuEl;
  settingsMenuEl = document.createElement("div");
  settingsMenuEl.className = "settings-menu";
  settingsMenuEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(settingsMenuEl);
  settingsMenuEl.addEventListener("mousedown", event => event.stopPropagation(), true);
  settingsMenuEl.addEventListener("click", handleSettingsMenuClick);
  return settingsMenuEl;
}

function toggleSettingsMenu() {
  if (settingsMenuEl && settingsMenuEl.classList.contains("open")) closeSettingsMenu();
  else openSettingsMenu();
}

function openSettingsMenu() {
  const menu = ensureSettingsMenu();
  renderSettingsMenu();
  const rect = settingsBtnEl ? settingsBtnEl.getBoundingClientRect() : { right: 30, top: 40, bottom: 62 };
  // The gear sits at the right edge of the tab row, so the callout hangs below it
  // and is right-aligned to it, clamped to the viewport.
  const menuWidth = menu.offsetWidth || 240;
  const maxLeft = Math.max(4, window.innerWidth - menuWidth - 6);
  menu.style.left = `${Math.min(maxLeft, Math.max(4, rect.right - menuWidth))}px`;
  menu.style.top = `${Math.max(32, (rect.bottom || rect.top) + 6)}px`;
  menu.classList.add("open");
  menu.setAttribute("aria-hidden", "false");
  if (settingsBtnEl) settingsBtnEl.classList.add("open");
}

function closeSettingsMenu() {
  if (!settingsMenuEl) return false;
  const wasOpen = settingsMenuEl.classList.contains("open");
  settingsMenuEl.classList.remove("open");
  settingsMenuEl.setAttribute("aria-hidden", "true");
  if (settingsBtnEl) settingsBtnEl.classList.remove("open");
  return wasOpen;
}

function renderSettingsMenu() {
  const menu = ensureSettingsMenu();
  menu.innerHTML = `
    <div class="settings-menu-title">Settings</div>
    <button type="button" class="settings-menu-row" data-action="shortcuts"><span>Shortcuts</span><em>View rundown</em></button>
    <button type="button" class="settings-menu-row" data-action="refresh"><span>Refresh</span><em>Resync panel</em></button>
    <div class="settings-menu-section">Command Console</div>
    ${settingsToggleRow("showNativeEffects", "Native AE Effects", "Show in Ctrl+K")}
    ${settingsToggleRow("showTntCommands", "Timeline Commands", "Show in Ctrl+K")}
    <div class="settings-menu-section">Safety</div>
    <div class="settings-menu-section">Layer Styles</div>
    ${settingsToggleRow("keepStyleEditorOpen", "Keep Editor Open", "After style edits")}
    <div class="settings-menu-section">About</div>
    <div class="settings-menu-info">Timeline CEP<br>Comp: ${escapeHtml(state.comp && state.comp.name || "None")}</div>
  `;
}

function settingsToggleRow(key, label, detail) {
  return `
    <button type="button" class="settings-menu-row" data-toggle="${escapeHtml(key)}">
      <span>${escapeHtml(label)}</span>
      <em>${escapeHtml(detail)}</em>
      <b class="${panelSettings[key] ? "on" : ""}"></b>
    </button>
  `;
}

async function handleSettingsMenuClick(event) {
  const toggle = event.target.closest && event.target.closest("[data-toggle]");
  if (toggle) {
    const key = toggle.dataset.toggle;
    panelSettings[key] = !panelSettings[key];
    savePanelSettings();
    renderSettingsMenu();
    if (fxConsoleEl && fxConsoleEl.classList.contains("open")) renderFxConsoleResults();
    return;
  }
  const action = event.target.closest && event.target.closest("[data-action]");
  if (!action) return;
  if (action.dataset.action === "shortcuts") {
    closeSettingsMenu();
    openShortcutRundown();
  } else if (action.dataset.action === "refresh") {
    closeSettingsMenu();
    statusEl.textContent = "Refreshing...";
    await refreshLayers({ forceRender: true });
    statusEl.textContent = "Refreshed.";
  }
}

function ensureShortcutRundown() {
  if (shortcutRundownEl) return shortcutRundownEl;
  shortcutRundownEl = document.createElement("div");
  shortcutRundownEl.className = "shortcut-rundown-backdrop";
  shortcutRundownEl.setAttribute("aria-hidden", "true");
  shortcutRundownEl.innerHTML = `
    <div class="shortcut-rundown-panel">
      <div class="shortcut-rundown-head">
        <div>
          <div class="shortcut-rundown-title">Shortcuts</div>
          <div class="shortcut-rundown-subtitle">Timeline panel and command console</div>
        </div>
        <button type="button" class="shortcut-rundown-close">x</button>
      </div>
      <div class="shortcut-rundown-body"></div>
    </div>
  `;
  document.body.appendChild(shortcutRundownEl);
  shortcutRundownEl.addEventListener("mousedown", event => {
    if (event.target === shortcutRundownEl) closeShortcutRundown();
  });
  shortcutRundownEl.querySelector(".shortcut-rundown-close").addEventListener("click", closeShortcutRundown);
  return shortcutRundownEl;
}

function openShortcutRundown() {
  const el = ensureShortcutRundown();
  const mod = primaryModifierLabel();
  const option = optionModifierLabel();
  const rows = [
    ["Ctrl+Space", "Open Quick Controls"],
    ["Ctrl+K", "Open command console"],
    [`${mod}+C / ${mod}+V`, "Copy / paste selection"],
    ["Enter", "Run selected command"],
    ["Right / Left", "Open or close command submenu"],
    ["Tab", "Composition Flow"],
    ["X", "Go to next marker boundary"],
    ["Shift+X", "Layer Selection & Filters"],
    ["A", "Anchor Point Master"],
    ["Shift+A", "Center Anchor Point"],
    ["C", "Composition Tools"],
    [`${mod}+D`, "Duplicate selected layers"],
    ["1 / 2", "Zoom out / in"],
    ["3", "Split selected layers"],
    ["4 / Delete", "Delete selected layer or keyframes"],
    ["5 / 6", "Set selected layer in/out to playhead"],
    ["Q / W", "Trim in/out to playhead"],
    [`${option}+X / X`, "Previous / next marker boundary"],
    ["U", "Reveal keyframes"],
    ["T", "Reveal transform properties"],
    ["E", "Open ease editor for selected keyframes"],
    ["Shift+E", "Apply easy ease to selected keyframes"],
    ["F", "Mask control"],
    ["Shift+F", "Focus selected layers"],
    ["S / Shift+S", "Layer styles"],
    [".", "Add marker at playhead"],
    [`${option}+Up / Down`, "Move layer up/down"],
    [`Shift+${option}+Up / Down`, "Move layer top/bottom"],
    ["Space", "Play / pause"],
    ["Esc", "Close active popup"]
  ];
  el.querySelector(".shortcut-rundown-body").innerHTML = rows.map(row => `
    <div class="shortcut-row"><kbd>${escapeHtml(row[0])}</kbd><span>${escapeHtml(row[1])}</span></div>
  `).join("");
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
}

function closeShortcutRundown() {
  if (!shortcutRundownEl) return;
  shortcutRundownEl.classList.remove("show");
  shortcutRundownEl.setAttribute("aria-hidden", "true");
}

async function runBundledShortcut(filename) {
  if (isMarkerDragging || isScrubbing || isMarqueeSelecting) return;
  suppressSyncUntil = Date.now() + 1200;
  await evalFileRaw('jsx/' + filename);
  await refreshAfterPanelAction();
}

async function goToMarkerBoundary(direction) {
  if (isMarkerDragging || isScrubbing || isMarqueeSelecting) return;
  suppressSyncUntil = Date.now() + 700;
  await loadJSX();
  const result = await aeCall("TNT_goToMarkerBoundary", [direction]);
  if (!result.ok) {
    statusEl.textContent = result.error || "No marker boundary found.";
    return;
  }
  if (state.comp) state.comp.time = result.time;
  updateStatus();
  updatePlayhead({ fast: true });
  focusPanel(2);
}

async function openMarkerMenu(marker, options = {}) {
  if (!marker || typeof marker.keyIndex === "undefined") return;
  await loadJSX();
  const markerType = options.type || "comp";
  const fn = markerType === "layer" ? "TNT_openLayerMarkerDialog" : "TNT_openCompMarkerDialog";
  const args = markerType === "layer"
    ? [options.layerIndex || 0, marker.keyIndex]
    : [marker.keyIndex];
  const result = await aeCall(fn, args);
  if (!result.ok && result.error) statusEl.textContent = result.error;
  await refreshLayers({ forceRender: true });
}

function loadJSX(options = {}) {
  if (jsxLoaded && !options.force) return Promise.resolve({ ok: true });
  const path = jsxPath();
  return new Promise(resolve => {
    cs.evalScript(`$.evalFile('${escForExtendScriptString(path)}')`, result => {
      jsxLoaded = true;
      resolve({ ok: true, result });
    });
  });
}

let aeEvalQueue = Promise.resolve();
let lastAeEvalAt = 0;
const AE_EVAL_MIN_GAP_MS = 20;
function aeEvalScript(script) {
  aeEvalQueue = aeEvalQueue.then(() => new Promise(resolve => {
    const delay = Math.max(0, AE_EVAL_MIN_GAP_MS - (Date.now() - lastAeEvalAt));
    setTimeout(() => {
      lastAeEvalAt = Date.now();
      cs.evalScript(script, result => {
        try { resolve(JSON.parse(result)); }
        catch (e) { resolve({ ok: false, error: String(result || e) }); }
      });
    }, delay);
  }));
  return aeEvalQueue;
}

function aeCall(functionName, args = []) {
  const encodedArgs = args.map(a => JSON.stringify(a)).join(",");
  const script = `${functionName}(${encodedArgs})`;
  return aeEvalScript(script);
}

function timelineSignature(data) {
  if (!data || !data.comp) return "";
  return [
    data.comp.name,
    data.comp.duration,
    data.comp.numLayers,
    data.comp.projectRevision || 0,
    (data.compMarkers || []).map(m => [m.keyIndex, m.time, m.comment, m.duration, m.label, m.protectedRegion].join('~')).join('^'),
    ...data.layers.map(l => [l.index, l.name, l.type, l.isMedia, l.isMissingMedia, l.hasKeyframes, l.inPoint, l.outPoint, l.startTime, l.label, l.enabled, l.locked, l.parentIndex || 0, l.trackMatteLayerIndex || 0, l.trackMatteType || "", (l.keyframes || []).map(k => [k.time, k.label || 0, k.type || "", (k.properties || []).join(',')].join('~')).join('^'), (l.markers || []).map(m => [m.keyIndex, m.time, m.comment, m.duration, m.label, m.protectedRegion].join('~')).join('^')].join("~"))
  ].join("|");
}

function syncFingerprint(data) {
  if (!data || !data.ok) return "";
  return [data.compName, data.duration, data.numLayers, data.projectRevision || 0, data.layerFingerprint || ""].join("|");
}

function intervalsOverlap(a, b) {
  const EPS = 1e-5;
  return a.inPoint < b.outPoint - EPS && a.outPoint > b.inPoint + EPS;
}

function allRelationshipLayerSets(layers = state.layers || []) {
  const parented = new Set();
  const parentSources = new Set();
  const matteChildren = new Set();
  const matteSources = new Set();
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    if (parentIndex) {
      parented.add(layerIndex);
      parentSources.add(parentIndex);
    }
    if (matteIndex) {
      matteChildren.add(layerIndex);
      matteSources.add(matteIndex);
    }
  });
  return { parented, parentSources, matteChildren, matteSources };
}
// Native bridge server.
//
// Runs only in the real CEP panel (inside After Effects), never in quick.html.
// Native overlay helpers (macOS Swift app, Windows C# app) connect over loopback
// TCP and send ExtendScript to run; the panel executes it with cs.evalScript and
// sends the raw result back. This replaces the old macOS-only path that shelled
// out to AppleScript `DoScript` and marshalled results through a temp file.
//
// Every request must carry the shared token. Without it, any local process could
// connect and run arbitrary ExtendScript in After Effects - full project access
// and file I/O. The token and the chosen port are published to a 0600 discovery
// file in the user's home directory; helpers read it instead of hardcoding a port.
//
//   ~/.tnt-quick-controls/bridge.json   {"port":8099,"token":"...","pid":123}
//
// Protocol: newline-delimited JSON, one object per line.
//   -> {"id":"7","token":"...","script":"tntGetTimeline()"}
//   <- {"id":"7","result":"{\"ok\":true,...}"}
//   <- {"id":"7","error":"..."}          (bridge-level failure only)

const TNT_BRIDGE_HOST = "127.0.0.1";
const TNT_BRIDGE_PORT_FIRST = 8099;
const TNT_BRIDGE_PORT_LAST = 8109;

function bridgeRequire(moduleName) {
  try {
    if (typeof require === "function") return require(moduleName);
  } catch (_) {}
  try {
    if (window.cep_node && typeof window.cep_node.require === "function") {
      return window.cep_node.require(moduleName);
    }
  } catch (_) {}
  return null;
}

function bridgeDiscoveryPath(nodeOs, nodePath) {
  return nodePath.join(nodeOs.homedir(), ".tnt-quick-controls", "bridge.json");
}

function bridgeWriteDiscoveryFile(port, token) {
  const fs = bridgeRequire("fs");
  const os = bridgeRequire("os");
  const path = bridgeRequire("path");
  if (!fs || !os || !path) return null;

  const file = bridgeDiscoveryPath(os, path);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    // Re-create rather than overwrite: writing to an existing file keeps its old
    // (possibly permissive) mode.
    try { fs.unlinkSync(file); } catch (_) {}
    fs.writeFileSync(
      file,
      JSON.stringify({ port, token, pid: (typeof process !== "undefined" ? process.pid : 0) }),
      { mode: 0o600 }
    );
    try { fs.chmodSync(file, 0o600); } catch (_) {}
    return file;
  } catch (e) {
    console.warn("[tnt-bridge] could not publish discovery file:", String(e));
    return null;
  }
}

function bridgeRemoveDiscoveryFile() {
  const fs = bridgeRequire("fs");
  const os = bridgeRequire("os");
  const path = bridgeRequire("path");
  if (!fs || !os || !path) return;
  try { fs.unlinkSync(bridgeDiscoveryPath(os, path)); } catch (_) {}
}

function bridgeCreateToken() {
  const crypto = bridgeRequire("crypto");
  if (crypto && typeof crypto.randomBytes === "function") {
    return crypto.randomBytes(32).toString("hex");
  }
  // Should not happen inside CEP's Node, but never fall back to a fixed token.
  let fallback = "";
  for (let i = 0; i < 8; i += 1) fallback += Math.random().toString(36).slice(2);
  return fallback;
}

function bridgeSend(socket, payload) {
  try {
    socket.write(JSON.stringify(payload) + "\n");
  } catch (_) {}
}

function bridgeHandleLine(line, socket, token) {
  let request;
  try {
    request = JSON.parse(line);
  } catch (e) {
    return;
  }

  const id = String(request && request.id != null ? request.id : "");
  const script = String((request && request.script) || "");
  const provided = String((request && request.token) || "");

  if (provided.length !== token.length || provided !== token) {
    if (id) bridgeSend(socket, { id, error: "Unauthorized: bad or missing bridge token." });
    console.warn("[tnt-bridge] rejected a request with an invalid token");
    try { socket.destroy(); } catch (_) {}
    return;
  }

  if (!id || !script) return;

  try {
    cs.evalScript(script, result => {
      bridgeSend(socket, { id, result: String(result == null ? "" : result) });
    });
  } catch (e) {
    bridgeSend(socket, { id, error: String(e) });
  }
}

function startNativeBridgeServer() {
  // quick.html is the overlay's own content; it is a bridge *client*, not a server.
  if (QUICK_PANEL_MODE) return null;

  const net = bridgeRequire("net");
  if (!net) {
    console.warn("[tnt-bridge] node 'net' unavailable; native overlay bridge disabled");
    return null;
  }

  const token = bridgeCreateToken();

  const server = net.createServer(socket => {
    socket.setEncoding("utf8");
    let buffer = "";

    socket.on("data", chunk => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (line) bridgeHandleLine(line, socket, token);
      }
    });

    socket.on("error", () => {});
  });

  let port = TNT_BRIDGE_PORT_FIRST;

  server.on("error", err => {
    if (err && err.code === "EADDRINUSE" && port < TNT_BRIDGE_PORT_LAST) {
      // Another panel instance (or an unrelated process) holds this port.
      port += 1;
      server.listen(port, TNT_BRIDGE_HOST);
      return;
    }
    console.warn("[tnt-bridge] server error:", err && err.message);
    bridgeSetStatus("error", err && err.message ? String(err.message) : "bridge failed to start");
  });

  server.on("listening", () => {
    const file = bridgeWriteDiscoveryFile(port, token);
    console.log("[tnt-bridge] listening on " + TNT_BRIDGE_HOST + ":" + port);
    if (!file) {
      bridgeSetStatus("error", "bridge is up on port " + port + " but helpers cannot discover it");
      return;
    }
    bridgeSetStatus("ok", "bridge ready on port " + port);
  });

  try {
    server.listen(port, TNT_BRIDGE_HOST);
  } catch (e) {
    console.warn("[tnt-bridge] listen failed:", String(e));
    return null;
  }

  window.addEventListener("beforeunload", () => {
    bridgeRemoveDiscoveryFile();
    try { server.close(); } catch (_) {}
  });

  return server;
}

// Surfaced so a failed bridge is visible somewhere other than a console nobody
// is watching. state: "ok" | "error".
let tntBridgeStatus = { state: "starting", message: "" };
function bridgeSetStatus(state, message) {
  tntBridgeStatus = { state, message: String(message || "") };
  window.__TNT_BRIDGE_STATUS__ = tntBridgeStatus;
  if (state === "error") console.warn("[tnt-bridge]", message);
}

const tntBridgeServer = startNativeBridgeServer();
const FILTER_LABELS = {
  comp: "comps",
  text: "text",
  shape: "shape",
  media: "media",
  missing: "missing media",
  adjustment: "adjustments",
  null: "nulls",
  camera: "cameras",
  light: "lights",
  animated: "animated",
  unanimated: "unanimated",
  parented: "children",
  "parent-source": "parents",
  "matte-child": "matte users",
  "matte-source": "matte sources"
};

function activeLayerFilterLabel() {
  return FILTER_LABELS[activeLayerFilter] || activeLayerFilter || "";
}

function activeLayerFilterScopeLabel() {
  return activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length
    ? `${activeLayerFilterScopeIndices.length} selected`
    : "composition";
}

function hasActiveLayerViewConstraint() {
  return !!activeLayerFilter ||
    !!(activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length);
}

function setLayerViewFilter(filter, scopeIndices = null) {
  activeLayerFilter = filter || null;
  activeLayerFilterScopeIndices = scopeIndices && scopeIndices.length
    ? [...new Set(scopeIndices.map(Number).filter(Boolean))]
    : null;
  updateStatus();
  updateFilterButtons();
  updateActiveFilterNotice();
  render();
}

function clearLayerViewFilter() {
  setLayerViewFilter(null, null);
}

function updateActiveFilterNotice() {
  if (!activeFilterNoticeEl) return;
  const active = hasActiveLayerViewConstraint();
  activeFilterNoticeEl.classList.toggle("show", active);
  activeFilterNoticeEl.setAttribute("aria-hidden", active ? "false" : "true");
  if (!active) return;
  const label = activeFilterNoticeEl.querySelector(".active-filter-notice-label");
  if (label) {
    const filterLabel = activeLayerFilter ? activeLayerFilterLabel() : "all layers";
    label.textContent = `${activeLayerFilterScopeLabel()} · ${filterLabel}`;
  }
}

function layerMatchesFilter(layer, filter, relationSets) {
  if (!filter) return true;
  const type = String(layer.type || "").toLowerCase();
  const layerIndex = Number(layer.index || 0);
  relationSets = relationSets || allRelationshipLayerSets();
  if (filter === "comp") return !!layer.sourceCompId;
  if (filter === "text") return type === "text";
  if (filter === "shape") return type === "shape";
  if (filter === "media") return !layer.sourceCompId && (!!layer.isMedia || (!!layer.type && !["text","shape","camera","light","null","adjustment"].includes(type)));
  if (filter === "missing") return !!layer.isMissingMedia;
  if (filter === "adjustment") return type === "adjustment";
  if (filter === "null") return type === "null";
  if (filter === "camera") return type === "camera";
  if (filter === "light") return type === "light";
  if (filter === "animated") return !!layer.hasKeyframes;
  if (filter === "unanimated") return !layer.hasKeyframes;
  if (filter === "parented") return relationSets.parented.has(layerIndex);
  if (filter === "parent-source") return relationSets.parentSources.has(layerIndex);
  if (filter === "matte-child") return relationSets.matteChildren.has(layerIndex);
  if (filter === "matte-source") return relationSets.matteSources.has(layerIndex);
  return true;
}

function layerMatchesActiveFilter(layer, relationSets) {
  if (activeLayerFilterScopeIndices && activeLayerFilterScopeIndices.length) {
    if (!activeLayerFilterScopeIndices.includes(Number(layer.index || 0))) return false;
  }
  return layerMatchesFilter(layer, activeLayerFilter, relationSets);
}

function visibleLayers() {
  const relationSets = allRelationshipLayerSets();
  return (state.layers || []).filter(layer => layerMatchesActiveFilter(layer, relationSets));
}

function updateFilterButtons() {
  if (!filterColumnEl) return;
  filterColumnEl.querySelectorAll(".filter-btn").forEach(btn => {
    if (btn.dataset.relationToggle === "matte") btn.classList.toggle("active", showTrackMatteLinks);
    else if (btn.dataset.relationToggle === "parent") btn.classList.toggle("active", showParentLinks);
    else btn.classList.toggle("active", !activeLayerFilterScopeIndices && btn.dataset.filter === activeLayerFilter);
  });
  if (layerSelectionScopesEl) {
    layerSelectionScopesEl.querySelectorAll("[data-selection-scope]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.selectionScope === layerSelectionScope);
    });
  }
  if (layerViewFiltersEl) {
    layerViewFiltersEl.querySelectorAll("[data-layer-view-filter]").forEach(btn => {
      btn.classList.toggle("active", !activeLayerFilterScopeIndices &&
        String(btn.dataset.layerViewFilter || "") === String(activeLayerFilter || ""));
    });
  }
  if (layerSelectionModesEl) {
    layerSelectionModesEl.querySelectorAll("[data-selection-mode]").forEach(btn => {
      btn.classList.toggle("active", String(btn.dataset.selectionMode || "layer") === layerSelectionMode);
    });
  }
}

const LAYER_SELECTION_QUICK_FILTERS = [
  { key: "text", label: "Text", group: "type" },
  { key: "shape", label: "Shape", group: "type" },
  { key: "media", label: "Media", group: "type" },
  { key: "comp", label: "Comp", group: "type" },
  { key: "adjustment", label: "Adjustment", group: "type" },
  { key: "null", label: "Null", group: "type" },
  { key: "camera", label: "Camera", group: "type" },
  { key: "light", label: "Light", group: "type" },
  { key: "animated", label: "Animated", group: "animation" },
  { key: "unanimated", label: "Static", group: "animation" },
  { key: "parent-source", label: "Parents", group: "parent" },
  { key: "parented", label: "Children", group: "parent" },
  { key: "matte-source", label: "Matte Sources", group: "matte" },
  { key: "matte-child", label: "Matte Users", group: "matte" }
];

function layerIsAtPlayhead(layer) {
  const time = Number(state.comp && state.comp.time || 0);
  const frameDuration = 1 / Math.max(1, Number(state.comp && state.comp.frameRate || 30));
  const tolerance = Math.min(1e-4, frameDuration * 0.01);
  return time >= Number(layer.inPoint || 0) - tolerance &&
    time <= Number(layer.outPoint || 0) + tolerance;
}

function layerSelectionScopeLayers() {
  const layers = state.layers || [];
  if (layerSelectionScope === "selected") {
    const selected = new Set((state.selectedLayerIndices || []).map(Number));
    return layers.filter(layer => selected.has(Number(layer.index)));
  }
  if (layerSelectionScope === "playhead") return layers.filter(layerIsAtPlayhead);
  return layers;
}

function layerSelectionScopeLabel() {
  if (layerSelectionScope === "selected") return "selected";
  if (layerSelectionScope === "playhead") return "at playhead";
  return "total";
}

function layerSelectionModeLabel() {
  if (layerSelectionMode === "property") return "properties";
  if (layerSelectionMode === "effect") return "effects";
  return "layers";
}

function layerSelectionSearchPlaceholder() {
  if (layerSelectionMode === "property") return "Property name";
  if (layerSelectionMode === "effect") return "Effect name";
  return "Layer name";
}

function normalizeLayerSelectionTerms(items) {
  const out = [];
  (items || []).forEach(item => {
    if (!item) return;
    if (typeof item === "string") out.push(item);
    else {
      if (item.name) out.push(item.name);
      if (item.matchName) out.push(item.matchName);
      if (item.path) out.push(item.path);
      if (item.type) out.push(item.type);
    }
  });
  return [...new Set(out.map(value => String(value || "").trim()).filter(Boolean))];
}

function layerPropertySearchTerms(layer) {
  const terms = normalizeLayerSelectionTerms(layer.propertyNames)
    .concat(normalizeLayerSelectionTerms(layer.animatedProperties))
    .concat(normalizeLayerSelectionTerms(layer.transformProperties));
  (layer.keyframes || []).forEach(key => {
    (key.properties || []).forEach(name => terms.push(name));
  });
  if (layer.hasKeyframes) terms.push("Keyframes", "Animated");
  if (layer.type) terms.push(layer.type);
  return [...new Set(terms.map(value => String(value || "").trim()).filter(Boolean))];
}

function layerEffectSearchTerms(layer) {
  return normalizeLayerSelectionTerms(layer.effects || layer.effectNames);
}

function layerSelectionSearchTerms(layer) {
  if (layerSelectionMode === "property") return layerPropertySearchTerms(layer);
  if (layerSelectionMode === "effect") return layerEffectSearchTerms(layer);
  return [
    layer.name,
    layer.index,
    layer.type,
    layer.sourceCompName,
    layer.missingMediaPath,
    layer.trackMatteType,
    layer.parentName,
    layer.trackMatteLayerName
  ].map(value => String(value || "").trim()).filter(Boolean);
}

function layerMatchesSelectionQuery(layer, query) {
  if (!query) return true;
  return layerSelectionSearchTerms(layer).some(term => String(term || "").toLowerCase().includes(query));
}

function visibleLayerSelectionTerms(layer) {
  const query = String(layerSelectionQuery || "").trim().toLowerCase();
  let terms = [];
  if (layerSelectionMode === "property") terms = layerPropertySearchTerms(layer);
  else if (layerSelectionMode === "effect") terms = layerEffectSearchTerms(layer);
  else terms = [layer.type, layer.sourceCompName, layer.parentName, layer.trackMatteLayerName].filter(Boolean);
  if (query) terms = terms.filter(term => String(term || "").toLowerCase().includes(query));
  return terms.slice(0, 4);
}

function layerSelectionCandidates() {
  const relationSets = allRelationshipLayerSets();
  const query = String(layerSelectionQuery || "").trim().toLowerCase();
  return layerSelectionScopeLayers().filter(layer => {
    if (!layerMatchesFilter(layer, layerSelectionFilter, relationSets)) return false;
    return layerMatchesSelectionQuery(layer, query);
  });
}

function renderLayerSelectionQuickFilters(scopeLayers, relationSets) {
  if (!layerSelectionQuickFiltersEl) return;
  const actions = [];
  if (scopeLayers.length) {
    actions.push({ key: "", label: "All", group: "general", count: scopeLayers.length });
  }
  LAYER_SELECTION_QUICK_FILTERS.forEach(definition => {
    const count = scopeLayers.filter(layer => layerMatchesFilter(layer, definition.key, relationSets)).length;
    if (count) actions.push({ ...definition, count });
  });
  layerSelectionQuickFiltersEl.innerHTML = actions.length ? actions.map(action => `
    <button type="button"
      class="layer-selection-quick-filter filter-group-${action.group}${String(layerSelectionFilter || "") === action.key ? " active" : ""}"
      data-layer-selection-filter="${action.key}">
      <span>${escapeHtml(action.label)}</span>
      <em>${action.count}</em>
    </button>`).join("") : '<span class="layer-selection-no-actions">No layers in this scope.</span>';
}

function layerSelectionBadges(layer, relationSets) {
  const badges = [];
  const index = Number(layer.index || 0);
  const type = String(layer.type || (layer.isMedia ? "Media" : "Layer"));
  badges.push(`<span class="layer-selection-badge type">${escapeHtml(type)}</span>`);
  if (relationSets.parentSources.has(index)) badges.push('<span class="layer-selection-badge parent">Parent</span>');
  if (relationSets.parented.has(index)) badges.push('<span class="layer-selection-badge parent">Child</span>');
  if (relationSets.matteSources.has(index)) badges.push('<span class="layer-selection-badge matte">Matte</span>');
  if (relationSets.matteChildren.has(index)) badges.push('<span class="layer-selection-badge matte">Uses Matte</span>');
  if (layer.hasKeyframes) badges.push('<span class="layer-selection-badge animated">Animated</span>');
  return badges.join("");
}

function renderLayerSelectionPanel() {
  if (!layerSelectionModalEl || !layerSelectionModalEl.classList.contains("show") || !layerSelectionListEl) return;
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const scopeLayers = layerSelectionScopeLayers();
  const layers = layerSelectionCandidates();
  const relationSets = allRelationshipLayerSets();
  if (layerSelectionCountEl) {
    const count = selected.size;
    layerSelectionCountEl.textContent = `${count} selected`;
  }
  if (layerSelectionShownCountEl) {
    layerSelectionShownCountEl.textContent = `${layers.length}/${scopeLayers.length} ${layerSelectionScopeLabel()} · ${layerSelectionModeLabel()}`;
  }
  updateFilterButtons();
  if (layerSelectionSearchEl) layerSelectionSearchEl.placeholder = layerSelectionSearchPlaceholder();
  renderLayerSelectionQuickFilters(scopeLayers, relationSets);
  layerSelectionListEl.innerHTML = layers.length ? layers.map(layer => {
    const index = Number(layer.index || 0);
    const isSelected = selected.has(index);
    const details = visibleLayerSelectionTerms(layer);
    return `
      <button type="button" class="layer-selection-row${isSelected ? " selected" : ""}" data-layer-index="${index}" role="option" aria-selected="${isSelected}">
        <span class="layer-selection-check" aria-hidden="true"></span>
        <span class="layer-selection-index">${index}</span>
        <span class="layer-selection-name">${escapeHtml(layer.name || `Layer ${index}`)}</span>
        <span class="layer-selection-detail">${details.map(item => `<em>${escapeHtml(item)}</em>`).join("")}</span>
        <span class="layer-selection-badges">${layerSelectionBadges(layer, relationSets)}</span>
      </button>`;
  }).join("") : '<div class="layer-selection-empty">No layers match this filter.</div>';
}

function showLayerSelectionPanel() {
  if (!layerSelectionModalEl || !state.comp) return;
  layerSelectionModalEl.classList.add("show");
  layerSelectionModalEl.setAttribute("aria-hidden", "false");
  renderLayerSelectionPanel();
  requestAnimationFrame(() => {
    if (layerSelectionSearchEl) layerSelectionSearchEl.focus();
  });
}

function hideLayerSelectionPanel() {
  if (!layerSelectionModalEl) return;
  layerSelectionModalEl.classList.remove("show");
  layerSelectionModalEl.setAttribute("aria-hidden", "true");
}

async function queueLayerSelectionHostUpdate(indices) {
  layerSelectionPendingIndices = [...new Set((indices || []).map(Number).filter(Boolean))];
  if (layerSelectionApplyInFlight) return;
  layerSelectionApplyInFlight = true;
  try {
    while (layerSelectionPendingIndices) {
      const next = layerSelectionPendingIndices;
      layerSelectionPendingIndices = null;
      suppressSyncUntil = Date.now() + 700;
      await loadJSX();
      const result = await aeCall("TNT_setSelectedLayers", [next, false]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not update selection.";
        continue;
      }
      if (!layerSelectionPendingIndices) {
        state.selectedLayerIndices = result.selectedLayerIndices || next;
        renderSelectionOnly();
        renderLayerSelectionPanel();
      }
    }
  } finally {
    layerSelectionApplyInFlight = false;
  }
}

async function updateLayerSelectionFromPanel(layerIndex, shiftRange = false) {
  const candidates = layerSelectionCandidates();
  const current = new Set((state.selectedLayerIndices || []).map(Number));
  const index = Number(layerIndex || 0);
  if (shiftRange && lastLayerSelectionIndex) {
    const from = candidates.findIndex(layer => Number(layer.index) === Number(lastLayerSelectionIndex));
    const to = candidates.findIndex(layer => Number(layer.index) === index);
    if (from >= 0 && to >= 0) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      for (let i = start; i <= end; i++) current.add(Number(candidates[i].index));
    }
  } else if (current.has(index)) {
    current.delete(index);
  } else {
    current.add(index);
  }
  lastLayerSelectionIndex = index;
  state.selectedLayerIndices = [...current];
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(state.selectedLayerIndices);
}

async function runLayerSelectionAction(action) {
  const candidates = layerSelectionCandidates().map(layer => Number(layer.index));
  const current = new Set((state.selectedLayerIndices || []).map(Number));
  let next = [];
  if (action === "select") next = candidates;
  else if (action === "invert") {
    candidates.forEach(index => {
      if (current.has(index)) current.delete(index);
      else current.add(index);
    });
    next = [...current];
  }
  state.selectedLayerIndices = next;
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(next);
}

async function selectLayerSelectionMatches() {
  await runLayerSelectionAction("select");
}

async function applyLayerSelectionQuickFilter(filter) {
  const relationSets = allRelationshipLayerSets();
  const scopeLayers = layerSelectionScopeLayers();
  const next = scopeLayers
    .filter(layer => layerMatchesFilter(layer, filter, relationSets))
    .map(layer => Number(layer.index));
  layerSelectionFilter = filter || null;
  state.selectedLayerIndices = next;
  renderSelectionOnly();
  renderLayerSelectionPanel();
  await queueLayerSelectionHostUpdate(next);
}
function packLayers(layers) {
  // Compact, stack-aware interval packing.
  // Goal:
  // 1. Minimize visible track count like Premiere/RailCut.
  // 2. Preserve AE visual stack only where layers actually overlap in time.
  //    AE layer 1 stays above layer 2 if they overlap, but non-overlapping
  //    layers are free to reuse the same lane.
  // 3. Prefer visual continuity: reuse the lane whose previous clip ends
  //    closest to this clip's in point.
  const sorted = [...layers].sort((a, b) => {
    const dt = Number(a.inPoint) - Number(b.inPoint);
    if (Math.abs(dt) > 1e-5) return dt;
    return a.index - b.index; // AE stack order for simultaneous starts
  });

  const lanes = [];
  const placed = [];

  function laneHasOverlap(lane, layer) {
    return lane.some(existing => intervalsOverlap(existing, layer));
  }

  function insertEmptyLane(at) {
    lanes.splice(at, 0, []);
    placed.forEach(item => {
      if (item.lane >= at) item.lane += 1;
    });
  }

  sorted.forEach(layer => {
    const activeOverlaps = placed.filter(item => intervalsOverlap(item.layer, layer));

    // Lane constraints from overlapping AE layers.
    // Smaller AE index means visually above, therefore smaller lane number.
    let minLane = 0;
    let maxLane = Infinity;
    activeOverlaps.forEach(item => {
      if (item.layer.index < layer.index) {
        minLane = Math.max(minLane, item.lane + 1);
      } else if (item.layer.index > layer.index) {
        maxLane = Math.min(maxLane, item.lane - 1);
      }
    });

    let bestLane = -1;
    let bestScore = Infinity;

    for (let i = minLane; i < lanes.length && i <= maxLane; i++) {
      if (laneHasOverlap(lanes[i], layer)) continue;

      const previous = lanes[i]
        .filter(l => l.outPoint <= layer.inPoint + 1e-5)
        .sort((a, b) => b.outPoint - a.outPoint)[0];

      // Lower score = better. Prefer close temporal continuity, then compact top lanes.
      const gap = previous ? Math.max(0, layer.inPoint - previous.outPoint) : 9999;
      const stackDrift = previous ? Math.abs(previous.index - layer.index) * 0.015 : 0;
      const topBias = i * 0.05;
      const score = gap + stackDrift + topBias;
      if (score < bestScore) {
        bestScore = score;
        bestLane = i;
      }
    }

    if (bestLane < 0) {
      // Need a new lane. Insert it where the AE overlap constraints require it,
      // instead of always adding at the bottom. This prevents high-priority/top
      // AE layers from being pushed far down by earlier non-overlapping clips.
      if (minLane > lanes.length) minLane = lanes.length;
      insertEmptyLane(minLane);
      bestLane = minLane;
    }

    lanes[bestLane].push(layer);
    lanes[bestLane].sort((a, b) => a.inPoint - b.inPoint || a.index - b.index);
    placed.push({ layer, lane: bestLane });
  });

  // Remove any accidental empty lanes after insert/shift operations.
  return lanes.filter(lane => lane.length > 0);
}
function getVisibleRange() {
  if (!state.comp) return { start: 0, duration: 10, end: 10 };

  // Use the full comp duration for the visible timeline range.
  // Earlier versions used the work area, which made a 10s comp stop early
  // whenever the work area was shorter/offset. The ruler should behave like
  // AE's timeline header: 0s at the left edge, comp duration at the right edge
  // when fitted to panel.
  const start = 0;
  const duration = Math.max(0.1, Number(state.comp.duration || state.comp.workAreaDuration || 10));
  return { start, duration, end: start + duration };
}

function fittedPixelsPerSecond() {
  if (!state.comp) return pixelsPerSecond;
  const range = getVisibleRange();
  const available = Math.max(240, timelineViewportWidth() - currentLeftGutter());
  return Math.max(1, Math.min(MAX_PIXELS_PER_SECOND, available / range.duration));
}

function timelineViewportWidth() {
  const rectWidth = scrollAreaEl ? Math.round(scrollAreaEl.getBoundingClientRect().width) : 0;
  return Math.max(
    1,
    scrollAreaEl ? scrollAreaEl.clientWidth : 0,
    rectWidth,
    window.innerWidth || 0,
    document.documentElement ? document.documentElement.clientWidth : 0
  );
}

function timelineContentWidth() {
  return Math.max(timelineViewportWidth(), currentLeftGutter() + visibleDuration * pixelsPerSecond);
}

function fitTimelineToPanel(force = false) {
  if (!state.comp) return;
  const fitPps = fittedPixelsPerSecond();

  // Default is exact fit. If user zoomed in, preserve it.
  // But never allow a zoomed-out/old pps that leaves blank space at the right;
  // this guarantees the comp end marker, e.g. 10s, lands at the panel end.
  if (force || !userZoomed || pixelsPerSecond < fitPps) {
    pixelsPerSecond = fitPps;
    if (pixelsPerSecond === fitPps) userZoomed = false;
  }
}

function timeToX(time) {
  return Math.round(currentLeftGutter() + (Number(time || 0) - visibleStart) * pixelsPerSecond);
}

function timeToPreciseX(time) {
  return currentLeftGutter() + (Number(time || 0) - visibleStart) * pixelsPerSecond;
}

function currentLeftGutter() {
  return LEFT_GUTTER;
}

function mixHex(a, b, amount = 0.5) {
  function parts(hex) {
    hex = String(hex || '#777777').replace('#','');
    if (hex.length !== 6) return [119,119,119];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  const ca = parts(a), cb = parts(b);
  const out = ca.map((v,i) => Math.round(v * (1 - amount) + cb[i] * amount));
  return '#' + out.map(v => v.toString(16).padStart(2,'0')).join('');
}

function saturateHex(hex, factor = 1.2) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return '#777777';
  let r = parseInt(hex.slice(0,2),16) / 255, g = parseInt(hex.slice(2,4),16) / 255, b = parseInt(hex.slice(4,6),16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  s = Math.max(0, Math.min(1, s * factor));
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }
  let rr, gg, bb;
  if (s === 0) rr = gg = bb = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rr = hue2rgb(p, q, h + 1/3); gg = hue2rgb(p, q, h); bb = hue2rgb(p, q, h - 1/3);
  }
  return '#' + [rr,gg,bb].map(v => Math.round(v * 255).toString(16).padStart(2,'0')).join('');
}

function darkerHex(hex, amount = 0.34) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return '#444444';
  const r = Math.max(0, Math.round(parseInt(hex.slice(0,2),16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(2,4),16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(4,6),16) * (1 - amount)));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function hexToRgba(hex, alpha) {
  hex = String(hex || '#777777').replace('#','');
  if (hex.length !== 6) return `rgba(180,180,180,${alpha})`;
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRuler() {
  const range = getVisibleRange();
  visibleStart = range.start;
  visibleDuration = range.duration;

  rulerEl.innerHTML = "";
  if (bottomRulerEl) bottomRulerEl.innerHTML = "";
  const totalWidth = timelineContentWidth();
  rulerEl.style.width = `${totalWidth}px`;
  rulerWrapEl.style.width = `${totalWidth}px`;
  if (bottomRulerEl) bottomRulerEl.style.width = `${totalWidth}px`;
  if (bottomRulerWrapEl) bottomRulerWrapEl.style.width = `${totalWidth}px`;
  if (topMarkerRailEl) topMarkerRailEl.style.width = `${totalWidth}px`;
  if (bottomMarkerRailEl) bottomMarkerRailEl.style.width = `${totalWidth}px`;
  updateFrameCheckerPattern();

  const firstSecond = Math.floor(visibleStart);
  const lastSecond = Math.ceil(range.end);
  const rulerSections = pixelsPerSecond >= 96 ? 4 : (pixelsPerSecond >= 56 ? 2 : 1);
  const showFrameLabels = pixelsPerSecond >= 120;
  for (let t = firstSecond; t <= lastSecond; t++) {
    for (let q = 0; q < rulerSections; q++) {
      const time = t + q / rulerSections;
      if (time < visibleStart - 1e-5 || time > range.end + 1e-5) continue;
      // Keep subdivisions mathematically even. Integer rounding each absolute
      // tick independently makes quarter-second gaps alternate by one pixel.
      const left = `${timeToPreciseX(time).toFixed(3)}px`;
      const tickClass = q === 0
        ? "tick tick-major"
        : `tick tick-minor tick-section tick-section-${q}${rulerSections === 4 && q === 2 ? " tick-half" : ""}`;

      const tick = document.createElement("div");
      tick.className = tickClass;
      tick.style.left = left;
      if (q === 0) {
        tick.innerHTML = showFrameLabels ? rulerTimeFrameLabel(t) : escapeHtml(formatRulerTime(t));
      } else if (showFrameLabels) {
        tick.innerHTML = `<span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
      }
      rulerEl.appendChild(tick);

      if (bottomRulerEl) {
        const bottomTick = document.createElement("div");
        bottomTick.className = tickClass;
        bottomTick.style.left = left;
        if (q === 0) {
          bottomTick.innerHTML = showFrameLabels ? rulerTimeFrameLabel(t) : escapeHtml(formatRulerTime(t));
        } else if (showFrameLabels) {
          bottomTick.innerHTML = `<span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
        }
        bottomRulerEl.appendChild(bottomTick);
      }
    }
  }
  updateHorizontalScrollBar();
}

function frameNumberAtTime(time) {
  return Math.max(0, Math.round(Number(time || 0) * currentFrameRate()));
}

function rulerFrameLabel(time) {
  return `f${frameNumberAtTime(time)}`;
}

function rulerTimeFrameLabel(time) {
  return `<span class="tick-time">${escapeHtml(formatRulerTime(time))}</span><span class="tick-frame">${escapeHtml(rulerFrameLabel(time))}</span>`;
}

function updateFrameCheckerPattern() {
  const fps = Math.max(1, Number(state.comp && state.comp.frameRate || 30));
  const frameWidth = pixelsPerSecond / fps;
  const showCheckers = !!state.comp && pixelsPerSecond >= MAX_PIXELS_PER_SECOND - 0.01;
  document.body.classList.toggle("show-frame-checkers", showCheckers);
  timelineEl.style.setProperty("--frame-width", `${Math.max(1, frameWidth)}px`);
}

function syncBottomRulerPosition() {
  if (bottomRulerEl) bottomRulerEl.style.transform = `translateX(${-scrollAreaEl.scrollLeft}px)`;
  if (bottomMarkerRailEl) bottomMarkerRailEl.style.transform = `translateX(${-scrollAreaEl.scrollLeft}px)`;
  updateHorizontalScrollBar();
}

function updateHorizontalScrollBar() {
  if (!horizontalScrollBarEl || !horizontalScrollThumbEl) return;
  horizontalScrollBarEl.style.setProperty("left", `${currentLeftGutter()}px`, "important");
  horizontalScrollBarEl.style.setProperty("right", "0px", "important");
  const trackWidth = Math.max(1, horizontalScrollBarEl.clientWidth);
  const viewport = trackWidth;
  const content = Math.max(viewport, timelineContentWidth() - currentLeftGutter());
  if (content <= viewport + 1) {
    scrollAreaEl.scrollLeft = 0;
    horizontalScrollThumbEl.style.width = `${trackWidth}px`;
    horizontalScrollThumbEl.style.transform = "translateX(0px)";
    horizontalScrollBarEl.classList.add("disabled");
    return;
  }
  horizontalScrollBarEl.classList.remove("disabled");
  const thumbWidth = Math.max(36, Math.round(trackWidth * viewport / content));
  const maxThumbX = Math.max(0, trackWidth - thumbWidth);
  const maxScroll = Math.max(1, content - viewport);
  const thumbX = Math.round(maxThumbX * scrollAreaEl.scrollLeft / maxScroll);
  horizontalScrollThumbEl.style.width = `${thumbWidth}px`;
  horizontalScrollThumbEl.style.transform = `translateX(${thumbX}px)`;
}

function beginHorizontalScrollDrag(event) {
  if (!horizontalScrollBarEl || !horizontalScrollThumbEl || event.button !== 0) return;
  event.preventDefault();
  const trackRect = horizontalScrollBarEl.getBoundingClientRect();
  const viewport = Math.max(1, trackRect.width);
  const content = Math.max(viewport, timelineContentWidth() - currentLeftGutter());
  const maxScroll = Math.max(0, content - viewport);
  if (maxScroll <= 0) return;
  const thumbRect = horizontalScrollThumbEl.getBoundingClientRect();
  const trackWidth = Math.max(1, trackRect.width);
  const thumbWidth = Math.max(1, thumbRect.width);
  const maxThumbX = Math.max(1, trackWidth - thumbWidth);
  const startX = event.clientX;
  const startScroll = scrollAreaEl.scrollLeft;
  const clickedThumb = event.target === horizontalScrollThumbEl;

  if (!clickedThumb) {
    const targetThumbX = Math.max(0, Math.min(maxThumbX, event.clientX - trackRect.left - thumbWidth / 2));
    scrollAreaEl.scrollLeft = Math.round(targetThumbX / maxThumbX * maxScroll);
    updateHorizontalScrollBar();
  }

  const move = e => {
    const delta = e.clientX - startX;
    scrollAreaEl.scrollLeft = Math.max(0, Math.min(maxScroll, startScroll + delta / maxThumbX * maxScroll));
    updateHorizontalScrollBar();
  };
  const finish = () => {
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("mouseup", finish, true);
  };
  document.addEventListener("mousemove", move, true);
  document.addEventListener("mouseup", finish, true);
}

function updateStatus() {
  if (!state.comp) {
    statusEl.textContent = "Open a comp.";
    updateCompSelect([]);
    updateActiveFilterNotice();
    if (timeDisplayEl) timeDisplayEl.textContent = "0:00:00";
    return;
  }
  statusEl.textContent = `${state.comp.name} — ${visibleLayers().length}/${state.layers.length} layers${activeLayerFilter ? " • filter: " + activeLayerFilterLabel() : ""}`;
  updateCompSelect(state.comps || []);
  statusEl.textContent = `${visibleLayers().length}/${state.layers.length} layers${hasActiveLayerViewConstraint() ? " - " + activeLayerFilterScopeLabel() + (activeLayerFilter ? ": " + activeLayerFilterLabel() : " focus") : ""}${timelineMode === "keyframe" ? " - keyframes" : ""}${keyframeLayerFilter && keyframeLayerFilter.length ? " - focus" : ""}`;
  updateActiveFilterNotice();
  if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(state.comp.time);
  if (typeof renderTimingOrderPanel === "function") renderTimingOrderPanel();
}

function updateCompSelect(comps) {
  if (!compSelectEl || !compSelectButtonEl || !compSelectMenuEl) return;
  const list = comps && comps.length ? comps : (state.comp ? [{ id: state.comp.id || "", name: state.comp.name }] : []);
  compSelectUpdating = true;
  compSelectMenuEl.innerHTML = "";
  if (!list.length) {
    compSelectButtonEl.textContent = "No active comp";
    if (compSelectSearchEl) {
      compSelectSearchEl.value = "";
      compSelectSearchEl.placeholder = "No active comp";
      compSelectSearchEl.disabled = true;
    }
    compSelectButtonEl.disabled = true;
    compSelectUpdating = false;
    return;
  }
  compSelectButtonEl.disabled = false;
  if (compSelectSearchEl) compSelectSearchEl.disabled = false;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  list.forEach((comp, index) => {
    const item = document.createElement("button");
    const summary = formatCompSummary(comp);
    item.type = "button";
    item.className = "comp-select-item" + (String(comp.id || "") === activeId ? " active" : "");
    item.dataset.compId = String(comp.id || "");
    item.dataset.searchText = `${index + 1} ${comp.name || "Composition"} ${summary}`.toLowerCase();
    item.innerHTML = `<span class="comp-select-name">${index + 1}. ${escapeHtml(comp.name || "Composition")}</span><span class="comp-select-detail">${escapeHtml(summary)}</span>`;
    item.addEventListener("mousedown", e => e.preventDefault());
    item.addEventListener("click", () => {
      closeCompSelect();
      selectCompFromHeader(item.dataset.compId);
    });
    compSelectMenuEl.appendChild(item);
  });
  const active = list.find(comp => String(comp.id || "") === activeId) || list[0];
  const activeIndex = Math.max(0, list.indexOf(active)) + 1;
  const activeLabel = `${activeIndex}. ${active.name || "Composition"}`;
  compSelectButtonEl.textContent = activeLabel;
  if (compSelectSearchEl && !compSelectEl.classList.contains("open")) {
    compSelectSearchEl.value = "";
    compSelectSearchEl.placeholder = activeLabel;
  } else if (compSelectSearchEl) {
    filterCompSelectItems();
  }
  compSelectUpdating = false;
}

function compByIdMap() {
  const map = {};
  (state.comps || []).forEach(comp => { map[String(comp.id || "")] = comp; });
  return map;
}

function uniqueIds(ids) {
  const seen = {};
  return (ids || []).filter(id => {
    const key = String(id || "");
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function flowCompButton(comp, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "flow-node" + (className ? ` ${className}` : "");
  button.dataset.compId = String(comp.id || "");
  button.innerHTML = `<span>${escapeHtml(comp.name || "Composition")}</span><em>${escapeHtml(formatCompSummary(comp))}</em>`;
  button.addEventListener("click", () => {
    closeFlowChart();
    selectCompFromHeader(button.dataset.compId);
  });
  return button;
}

function renderFlowChart() {
  if (!flowChartBodyEl) return;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  const map = compByIdMap();
  const activeComp = map[activeId] || state.comp || null;
  const parentIds = activeComp ? uniqueIds(activeComp.parentIds || []) : [];
  const childIds = activeComp
    ? uniqueIds((activeComp.childIds || []).concat((state.layers || []).map(layer => layer.sourceCompId || 0)))
    : [];
  flowChartBodyEl.innerHTML = "";
  [
    { title: "Parents", ids: parentIds, empty: "No parent comps" },
    { title: "Current", ids: activeComp ? [activeComp.id] : [], empty: "No active comp", active: true },
    { title: "Precomps", ids: childIds, empty: "No precomps" }
  ].forEach((group, index) => {
    const column = document.createElement("div");
    column.className = "flow-column";
    const title = document.createElement("div");
    title.className = "flow-column-title";
    title.textContent = group.title;
    column.appendChild(title);
    if (!group.ids.length) {
      const empty = document.createElement("div");
      empty.className = "flow-empty";
      empty.textContent = group.empty;
      column.appendChild(empty);
    } else {
      group.ids.forEach(id => {
        const comp = map[String(id)] || (String(id) === activeId ? activeComp : null);
        if (comp) column.appendChild(flowCompButton(comp, group.active ? "active" : ""));
      });
    }
    flowChartBodyEl.appendChild(column);
    if (index < 2) {
      const connector = document.createElement("div");
      connector.className = "flow-connector";
      connector.textContent = "›";
      flowChartBodyEl.appendChild(connector);
    }
  });
  if (flowChartSubtitleEl) flowChartSubtitleEl.textContent = `${(state.comps || []).length} comps - click a node to open`;
}

function renderFlowGraph() {
  if (!flowChartBodyEl) return;
  const activeId = state.comp && state.comp.id ? String(state.comp.id) : "";
  const map = compByIdMap();
  const activeComp = map[activeId] || state.comp || null;
  const parentIds = activeComp ? uniqueIds(activeComp.parentIds || []) : [];
  const childIds = activeComp
    ? uniqueIds((activeComp.childIds || []).concat((state.layers || []).map(layer => layer.sourceCompId || 0)))
    : [];
  const parents = parentIds.map(id => map[String(id)]).filter(Boolean);
  const children = childIds.map(id => map[String(id)]).filter(Boolean);
  const sideCount = Math.max(parents.length, children.length, 1);
  const viewHeight = Math.max(240, sideCount * 58 + 88);
  const centerY = viewHeight / 2;
  const parentYs = flowNodeYs(parents.length, viewHeight);
  const childYs = flowNodeYs(children.length, viewHeight);

  flowChartBodyEl.innerHTML = "";
  const graph = document.createElement("div");
  graph.className = "flow-graph";
  graph.style.minHeight = `${viewHeight}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "flow-lines");
  svg.setAttribute("viewBox", `0 0 900 ${viewHeight}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.innerHTML = `
    <defs>
      <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4 L0,8 Z"></path>
      </marker>
    </defs>
  `;
  parents.forEach((comp, index) => svg.appendChild(flowCurvePath(282, parentYs[index], 365, centerY)));
  children.forEach((comp, index) => svg.appendChild(flowCurvePath(535, centerY, 618, childYs[index])));
  graph.appendChild(svg);
  graph.appendChild(flowGraphColumn("Parents", parents, "left", parentYs, viewHeight));
  graph.appendChild(flowGraphCurrent(activeComp, centerY));
  graph.appendChild(flowGraphColumn("Precomps", children, "right", childYs, viewHeight));
  flowChartBodyEl.appendChild(graph);
  if (flowChartSubtitleEl) flowChartSubtitleEl.textContent = `${(state.comps || []).length} comps - click a node to open`;
}

function flowNodeYs(count, viewHeight) {
  if (!count) return [];
  if (count === 1) return [viewHeight / 2];
  const top = 52;
  const bottom = viewHeight - 52;
  const step = (bottom - top) / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, index) => top + step * index);
}

function flowCurvePath(startX, startY, endX, endY) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const bend = Math.max(50, Math.abs(endX - startX) * 0.55);
  path.setAttribute("d", `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`);
  path.setAttribute("class", "flow-line");
  path.setAttribute("marker-end", "url(#flowArrow)");
  return path;
}

function flowGraphColumn(titleText, comps, side, ys, viewHeight) {
  const column = document.createElement("div");
  column.className = `flow-graph-column ${side}`;
  const title = document.createElement("div");
  title.className = "flow-column-title";
  title.textContent = titleText;
  column.appendChild(title);
  if (!comps.length) {
    const empty = document.createElement("div");
    empty.className = "flow-empty graph-empty";
    empty.textContent = side === "left" ? "No parent comps" : "No precomps";
    empty.style.top = `${viewHeight / 2}px`;
    column.appendChild(empty);
    return column;
  }
  comps.forEach((comp, index) => {
    const node = flowCompButton(comp);
    node.style.top = `${ys[index]}px`;
    column.appendChild(node);
  });
  return column;
}

function flowGraphCurrent(activeComp, centerY) {
  const column = document.createElement("div");
  column.className = "flow-graph-column center";
  const title = document.createElement("div");
  title.className = "flow-column-title";
  title.textContent = "Current";
  column.appendChild(title);
  const node = activeComp ? flowCompButton(activeComp, "active current") : document.createElement("div");
  if (!activeComp) {
    node.className = "flow-empty graph-empty";
    node.textContent = "No active comp";
  }
  node.style.top = `${centerY}px`;
  column.appendChild(node);
  return column;
}

function openFlowChart() {
  if (!flowChartOverlayEl) return;
  renderFlowGraph();
  flowChartOverlayEl.classList.add("open");
  flowChartOverlayEl.setAttribute("aria-hidden", "false");
}

function closeFlowChart() {
  if (!flowChartOverlayEl) return;
  flowChartOverlayEl.classList.remove("open");
  flowChartOverlayEl.setAttribute("aria-hidden", "true");
}

function toggleFlowChart() {
  if (!flowChartOverlayEl) return;
  if (flowChartOverlayEl.classList.contains("open")) closeFlowChart();
  else openFlowChart();
}

function formatCompSummary(comp) {
  if (!comp) return "";
  const size = comp.width && comp.height ? `${comp.width}x${comp.height}` : "";
  const duration = typeof comp.duration === "number" ? formatTime(comp.duration) : "";
  const kind = comp.usedAsPrecomp ? "Precomp" : "Main";
  return [duration, size, kind].filter(Boolean).join(" - ");
}

function filterCompSelectItems() {
  if (!compSelectMenuEl) return null;
  const query = String(compSelectSearchEl && compSelectSearchEl.value || "").trim().toLowerCase();
  let firstVisible = null;
  let visibleCount = 0;
  compSelectMenuEl.querySelectorAll(".comp-select-item").forEach(item => {
    const text = String(item.dataset.searchText || item.textContent || "").toLowerCase();
    const visible = !query || text.includes(query);
    item.hidden = !visible;
    item.classList.toggle("search-match", visible && !!query);
    if (visible) {
      visibleCount += 1;
      if (!firstVisible) firstVisible = item;
    }
  });
  let empty = compSelectMenuEl.querySelector(".comp-select-empty");
  if (!visibleCount) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "comp-select-empty";
      empty.textContent = "No matching comps";
      compSelectMenuEl.appendChild(empty);
    }
  } else if (empty) {
    empty.remove();
  }
  return firstVisible;
}

function openCompSelect() {
  if (!compSelectEl || !compSelectMenuEl) return;
  compSelectEl.classList.add("open");
  compSelectMenuEl.setAttribute("aria-hidden", "false");
  if (compSelectSearchEl) {
    compSelectSearchEl.value = "";
    filterCompSelectItems();
    requestAnimationFrame(() => {
      compSelectSearchEl.focus();
      compSelectSearchEl.select();
    });
  }
  compSelectMenuEl.scrollTop = 0;
}

function closeCompSelect() {
  if (!compSelectEl || !compSelectMenuEl) return;
  compSelectEl.classList.remove("open");
  compSelectMenuEl.setAttribute("aria-hidden", "true");
  if (compSelectSearchEl) {
    compSelectSearchEl.value = "";
    filterCompSelectItems();
    compSelectSearchEl.blur();
  }
}

function toggleCompSelect() {
  if (!compSelectEl || !compSelectMenuEl || !compSelectButtonEl || compSelectButtonEl.disabled) return;
  if (compSelectEl.classList.contains("open")) closeCompSelect();
  else openCompSelect();
}

async function selectCompFromHeader(compId) {
  if (!compId) return;
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  focusPanel(2);
  await loadJSX();
  const result = await aeCall("TNT_setActiveCompById", [Number(compId)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not switch comp.";
    return;
  }
  userZoomed = false;
  selectedKeyframes = [];
  await refreshLayers({ forceRender: true });
  focusPanel(5);
}

async function openLayerSourceComp(layer) {
  if (!layer || !layer.sourceCompId) return false;
  await selectCompFromHeader(layer.sourceCompId);
  return true;
}

function keyframeModeRowCount() {
  if (timelineMode !== "keyframe") return 0;
  return buildKeyframeRows().length || 1;
}

function timelineContentHeight(fallbackRows = 1) {
  const fallbackHeight = Math.max(1, fallbackRows) * TRACK_HEIGHT;
  return Math.max(fallbackHeight, timelineEl ? timelineEl.scrollHeight : 0);
}

function scrollContentViewportHeight() {
  return scrollAreaEl ? Math.max(scrollAreaEl.scrollHeight, scrollAreaEl.scrollTop + scrollAreaEl.clientHeight) : 0;
}

function updatePlayhead(options = {}) {
  const time = typeof options.time === "number" ? options.time : (state.comp ? state.comp.time || 0 : 0);
  const x = options.fast ? timeToPreciseX(time) : timeToX(time);
  if (options.fast) {
    playheadEl.style.left = "0px";
    playheadEl.style.transform = `translate3d(${x.toFixed(3)}px, 0, 0)`;
  } else {
    playheadEl.style.transform = "";
    playheadEl.style.left = `${x}px`;
  }
  if (options.fast) return;
  const trackCount = timelineMode === "keyframe"
    ? keyframeModeRowCount()
    : (state.comp && state.layers.length ? Math.max(1, packLayers(visibleLayers()).length) : Math.max(1, timelineEl.children.length || 1));
  const height = Math.max(42 + timelineContentHeight(trackCount), scrollContentViewportHeight());
  if (height !== lastPlayheadHeight || trackCount !== lastPlayheadTrackCount || options.forceHeight) {
    lastPlayheadHeight = height;
    lastPlayheadTrackCount = trackCount;
    // Extend through the panel, not just the populated tracks.
    playheadEl.style.height = `${height}px`;
  }
}

function markerTitle(marker, prefix) {
  const label = markerText(marker) || "Marker";
  const dur = Number(marker && marker.duration || 0);
  const region = dur > 0 ? ` → ${formatTime((marker.time || 0) + dur)}` : "";
  const protectedText = marker && marker.protectedRegion ? " • Protected region" : "";
  return `${prefix}: ${label} @ ${formatTime(marker.time || 0)}${region}${protectedText}`;
}

function markerText(marker) {
  return marker && (marker.comment || marker.chapter || marker.cuePointName || marker.url || "");
}

function markerColor(marker) {
  const idx = marker && typeof marker.label !== "undefined" ? Number(marker.label) : 0;
  if (!idx) return "#ffffff";
  return labelColor(idx) || "#b8b8b8";
}

function markerHasNoLabelColor(marker) {
  const idx = marker && typeof marker.label !== "undefined" ? Number(marker.label) : 0;
  return !idx;
}

function markerEnd(marker) {
  return Number(marker.time || 0) + Math.max(0, Number(marker.duration || 0));
}

function clampMarkerTime(time, min = 0, max = state.comp ? state.comp.duration : Infinity) {
  return Math.max(min, Math.min(max, Number(time || 0)));
}

function snapTimeToFrame(time) {
  const fps = currentFrameRate();
  const clamped = Math.max(0, Math.min(state.comp ? state.comp.duration : Number(time || 0), Number(time || 0)));
  return Math.round(clamped * fps) / fps;
}

function snapTargetTimes(options = {}) {
  if (!state.comp) return [];
  const targets = [0, Number(state.comp.duration || 0)];
  (state.compMarkers || []).forEach(marker => {
    if (options.excludeType === "comp" && Number(options.excludeKey) === Number(marker.keyIndex)) return;
    targets.push(Number(marker.time || 0));
    if (Number(marker.duration || 0) > 0) targets.push(markerEnd(marker));
  });
  (state.layers || []).forEach(layer => {
    targets.push(Number(layer.inPoint || 0), Number(layer.outPoint || 0));
    (layer.animatedProperties || []).forEach(property => {
      (property.keyframes || []).forEach(keyframe => {
        if (
          options.excludeType === "keyframe" &&
          Number(options.excludeLayerIndex) === Number(layer.index) &&
          String(options.excludePropertyPath || "") === String(property.path || "") &&
          Number(options.excludeKey) === Number(keyframe.keyIndex)
        ) return;
        const t = Number(keyframe.time || 0);
        if (Number.isFinite(t)) targets.push(t);
      });
    });
    (layer.markers || []).forEach(marker => {
      if (
        options.excludeType === "layer" &&
        Number(options.excludeLayerIndex) === Number(layer.index) &&
        Number(options.excludeKey) === Number(marker.keyIndex)
      ) return;
      targets.push(Number(marker.time || 0));
      if (Number(marker.duration || 0) > 0) targets.push(markerEnd(marker));
    });
  });
  const min = typeof options.minTime === "number" ? options.minTime : 0;
  const max = typeof options.maxTime === "number" ? options.maxTime : Number(state.comp.duration || 0);
  return targets
    .filter(time => Number.isFinite(time) && time >= min - 1e-6 && time <= max + 1e-6)
    .map(time => snapTimeToFrame(Math.max(min, Math.min(max, time))));
}

function snapTimeToTargets(time, options = {}) {
  const framed = snapTimeToFrame(time);
  if (!options.targetSnap) return { time: framed, target: false };
  const threshold = Math.max(1 / currentFrameRate() * 0.5, 10 / Math.max(1, pixelsPerSecond));
  let best = framed;
  let bestDistance = Infinity;
  snapTargetTimes(options).forEach(target => {
    const distance = Math.abs(target - framed);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  });
  return bestDistance <= threshold ? { time: best, target: true } : { time: framed, target: false };
}

function ensureSnapGuide() {
  if (snapGuideEl) return snapGuideEl;
  snapGuideEl = document.createElement("div");
  snapGuideEl.className = "snap-guide";
  snapGuideEl.setAttribute("aria-hidden", "true");
  scrollAreaEl.appendChild(snapGuideEl);
  return snapGuideEl;
}

function showSnapGuide(time, active = true, snapped = false) {
  if (!active || !snapped || !state.comp) {
    hideSnapGuide();
    return;
  }
  const guide = ensureSnapGuide();
  const trackCount = timelineMode === "keyframe"
    ? keyframeModeRowCount()
    : (state.layers.length ? Math.max(1, packLayers(visibleLayers()).length) : Math.max(1, timelineEl.children.length || 1));
  guide.style.left = `${timeToX(time)}px`;
  guide.style.height = `${Math.max(scrollAreaEl.scrollHeight, 42 + timelineContentHeight(trackCount))}px`;
  guide.classList.toggle("snapped", !!snapped);
  guide.classList.add("show");
}

function hideSnapGuide() {
  if (snapGuideEl) snapGuideEl.classList.remove("show", "snapped");
}

function beginMarkerDrag(event, marker, options = {}) {
  if (!state.comp || event.button !== 0) return;
  if (event.detail > 1) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const markerType = options.type || "comp";
  const dragMode = options.mode || "move"; // move | in | out
  const layerIndex = options.layerIndex || 0;
  const minTime = typeof options.minTime === "number" ? options.minTime : 0;
  const maxTime = typeof options.maxTime === "number" ? options.maxTime : state.comp.duration;
  const startPointerTime = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const originalTime = snapTimeToFrame(Number(marker.time || 0));
  const originalEnd = snapTimeToFrame(originalTime + Math.max(0, Number(marker.duration || 0)));
  const originalDuration = Math.max(0, originalEnd - originalTime);

  isMarkerDragging = true;
  suppressSyncUntil = Date.now() + 60000;
  document.body.classList.add(dragMode === "move" ? "marker-moving" : "marker-resizing");
  if (dragMode === "in") document.body.classList.add("marker-dragging-in");
  if (dragMode === "out") document.body.classList.add("marker-dragging-out");
  if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.add("is-dragging");
  let activeHandle = event.currentTarget;
  let previewTime = originalTime;
  let previewDuration = originalDuration;
  let previewFrame = 0;
  const dragRail = activeHandle ? activeHandle.closest('.marker-rail, .clip') : null;
  const dragVisuals = activeHandle ? Array.from(document.querySelectorAll(`[data-marker-key="${marker.keyIndex}"][data-marker-type="${markerType}"]`)) : [];

  const visualXFor = (el, t) => {
    // Layer marker elements live inside a clipped layer div, so their left value is
    // relative to the visible clip start. Comp marker/ruler/timeline elements use
    // the absolute timeline x.
    const clip = el && el.closest ? el.closest('.clip') : null;
    if (clip && typeof clip.dataset.clipStart !== 'undefined') {
      return (Number(t || 0) - Number(clip.dataset.clipStart || 0)) * pixelsPerSecond;
    }
    return timeToX(t);
  };

  const renderMarkerPreview = () => {
    previewFrame = 0;
    // v24: update the dragged marker's DOM only. Do not call render() while dragging;
    // rebuilding the rail under the cursor causes CEP hover/cursor flicker.
    dragVisuals.forEach(el => {
      const role = el.dataset.markerRole || '';
      const inX = visualXFor(el, previewTime);
      const outX = visualXFor(el, previewTime + previewDuration);
      if (role === 'in' || role === 'move') el.style.left = `${inX}px`;
      if (role === 'out') el.style.left = `${outX}px`;
      if (role === 'band' || role === 'overlay' || role === 'layer-region') {
        el.style.left = `${inX}px`;
        el.style.width = `${Math.max(2, (outX - inX))}px`;
      }
    });
    if (activeHandle && !activeHandle.dataset.markerRole) {
      activeHandle.style.left = `${dragMode === 'out' ? outX : inX}px`;
    }
  };

  const applyPreview = (moveEvent) => {
    const pointerTime = timeFromPointerEvent(moveEvent, { targetSnap: false, showGuide: false });
    const delta = pointerTime - startPointerTime;
    if (dragMode === "out") {
      const snapped = snapTimeToTargets(clampMarkerTime(originalEnd + delta, originalTime, maxTime), {
        targetSnap: moveEvent.shiftKey,
        minTime: originalTime,
        maxTime,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      const nextEnd = clampMarkerTime(snapped.time, originalTime, maxTime);
      previewTime = originalTime;
      previewDuration = Math.max(0, nextEnd - originalTime);
      showSnapGuide(nextEnd, moveEvent.shiftKey, snapped.target);
    } else if (dragMode === "in") {
      const snapped = snapTimeToTargets(clampMarkerTime(originalTime + delta, minTime, originalEnd), {
        targetSnap: moveEvent.shiftKey,
        minTime,
        maxTime: originalEnd,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      const nextIn = clampMarkerTime(snapped.time, minTime, originalEnd);
      previewTime = nextIn;
      previewDuration = Math.max(0, originalEnd - nextIn);
      showSnapGuide(nextIn, moveEvent.shiftKey, snapped.target);
    } else {
      const maxStart = Math.max(minTime, maxTime - originalDuration);
      const snapped = snapTimeToTargets(clampMarkerTime(originalTime + delta, minTime, maxStart), {
        targetSnap: moveEvent.shiftKey,
        minTime,
        maxTime: maxStart,
        excludeType: markerType,
        excludeLayerIndex: layerIndex,
        excludeKey: marker.keyIndex
      });
      previewTime = clampMarkerTime(snapped.time, minTime, maxStart);
      previewDuration = originalDuration;
      showSnapGuide(previewTime, moveEvent.shiftKey, snapped.target);
    }

    // v29: keep drag preview purely visual. Do not mutate marker data while dragging;
    // the sync loop keys off marker data and can rebuild the UI under the cursor.
    if (!previewFrame) previewFrame = requestAnimationFrame(renderMarkerPreview);
  };

  const finish = async () => {
    if (previewFrame) { cancelAnimationFrame(previewFrame); previewFrame = 0; }
    renderMarkerPreview();
    document.removeEventListener("mousemove", applyPreview, true);
    document.removeEventListener("mouseup", finish, true);
    hideSnapGuide();
    marker.time = previewTime;
    marker.duration = previewDuration;
    isMarkerDragging = false;
    document.body.classList.remove("marker-moving", "marker-resizing", "marker-dragging-in", "marker-dragging-out");
    if (activeHandle && activeHandle.classList) activeHandle.classList.remove("is-dragging");
    render();
    await loadJSX();
    const fn = markerType === "layer" ? "TNT_updateLayerMarker" : "TNT_updateCompMarker";
    const args = markerType === "layer"
      ? [layerIndex, marker.keyIndex, previewTime, previewDuration]
      : [marker.keyIndex, previewTime, previewDuration];
    const result = await aeCall(fn, args);
    suppressSyncUntil = Date.now() + 500;
    if (!result.ok) statusEl.textContent = result.error || "Could not edit marker.";
    await refreshLayers();
  };

  document.addEventListener("mousemove", applyPreview, true);
  document.addEventListener("mouseup", finish, true);
  applyPreview(event);
}

function addMarkerLabel(markerEl, marker) {
  const text = markerText(marker);
  const color = markerColor(marker);
  markerEl.style.setProperty("--marker-color", color);
  if (!text) return;
  markerEl.classList.add("has-text");
  if (markerHasNoLabelColor(marker)) markerEl.classList.add("marker-no-label-color");
  const label = document.createElement("span");
  label.className = "marker-label";
  label.textContent = text;
  if (markerHasNoLabelColor(marker)) {
    label.style.backgroundColor = "rgba(255,255,255,.12)";
    label.style.borderColor = "rgba(255,255,255,.88)";
  } else {
    label.style.backgroundColor = color;
  }
  markerEl.appendChild(label);
}

function addRegionOnRuler(ruler, marker) {
  const dur = Math.max(0, Number(marker.duration || 0));
  if (dur <= 0) return;
  const start = Math.max(visibleStart, Number(marker.time || 0));
  const end = Math.min(visibleStart + visibleDuration, markerEnd(marker));
  if (end <= start) return;
  const color = markerColor(marker);
  const band = document.createElement("div");
  band.className = "marker-region-band" + (marker.protectedRegion ? " protected" : "");
  band.dataset.markerKey = marker.keyIndex;
  band.dataset.markerType = "comp";
  band.dataset.markerRole = "band";
  band.style.left = `${timeToX(start)}px`;
  band.style.width = `${Math.max(2, (end - start) * pixelsPerSecond)}px`;
  band.style.borderColor = color;
  band.style.setProperty("--marker-color", color);
  band.style.backgroundColor = hexToRgba(color, marker.protectedRegion ? 0.18 : 0.08);
  band.title = markerTitle(marker, "Marker region");
  band.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "move" }));
  band.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(band, marker, { type: "comp" });
  ruler.appendChild(band);

  const left = document.createElement("div");
  left.className = "marker-half marker-half-start marker-handle marker-handle-in";
  left.dataset.markerKey = marker.keyIndex;
  left.dataset.markerType = "comp";
  left.dataset.markerRole = "in";
  left.style.left = `${timeToX(Number(marker.time || 0))}px`;
  left.style.borderLeftColor = color;
  left.style.color = color;
  left.style.setProperty("--marker-handle-color", color);
  left.title = markerTitle(marker, "Region in");
  left.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "in" }));
  left.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(left, marker, { type: "comp" });
  ruler.appendChild(left);

  const right = document.createElement("div");
  right.className = "marker-half marker-half-end marker-handle marker-handle-out";
  right.dataset.markerKey = marker.keyIndex;
  right.dataset.markerType = "comp";
  right.dataset.markerRole = "out";
  right.style.left = `${timeToX(markerEnd(marker))}px`;
  right.style.borderRightColor = color;
  right.style.color = color;
  right.style.setProperty("--marker-handle-color", color);
  right.title = markerTitle(marker, "Region out");
  right.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "out" }));
  right.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
  bindMarkerContextMenu(right, marker, { type: "comp" });
  ruler.appendChild(right);
}

function renderCompMarkers() {
  const markers = state.compMarkers || [];
  markers.forEach(marker => {
    addRegionOnRuler(topMarkerRailEl || rulerEl, marker);

    if (marker.time < visibleStart || marker.time > visibleStart + visibleDuration) return;
    const x = timeToX(marker.time);
    const top = document.createElement("div");
    top.className = "marker marker-comp" + (Number(marker.duration || 0) > 0 ? " marker-region-start" : "") + (markerHasNoLabelColor(marker) ? " marker-no-label-color" : "");
    top.style.left = `${x}px`;
    top.dataset.markerKey = marker.keyIndex;
    top.dataset.markerType = "comp";
    top.dataset.markerRole = "move";
    top.title = markerTitle(marker, "Comp marker");
    top.style.setProperty("--marker-color", markerColor(marker));
    addMarkerLabel(top, marker);
    top.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "comp", mode: "move" }));
    top.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "comp" }); });
    bindMarkerContextMenu(top, marker, { type: "comp" });
    (topMarkerRailEl || rulerEl).appendChild(top);

  });
}

function renderProtectedRegionOverlays(trackCount) {
  const markers = state.compMarkers || [];
  markers.forEach(marker => {
    if (!marker.protectedRegion || Number(marker.duration || 0) <= 0) return;
    const start = Math.max(visibleStart, Number(marker.time || 0));
    const end = Math.min(visibleStart + visibleDuration, markerEnd(marker));
    if (end <= start) return;
    const color = markerColor(marker);
    const overlay = document.createElement("div");
    overlay.className = "protected-region-overlay";
    overlay.dataset.markerKey = marker.keyIndex;
    overlay.dataset.markerType = "comp";
    overlay.dataset.markerRole = "overlay";
    // Keep the overlay edges on the exact marker handles. The element may extend
    // outside the viewport; the scroll container clips it naturally.
    overlay.style.left = `${timeToX(Number(marker.time || 0))}px`;
    overlay.style.width = `${Math.max(2, (markerEnd(marker) - Number(marker.time || 0)) * pixelsPerSecond)}px`;
    // Start at the track area. The marker rail owns the header band; this column owns rows.
    overlay.style.top = `0px`;
    overlay.style.height = `${Math.max(timelineContentHeight(trackCount), scrollAreaEl.clientHeight + scrollAreaEl.scrollTop)}px`;
    overlay.style.backgroundColor = hexToRgba(color, 0.12);
    overlay.style.borderLeftColor = color;
    overlay.style.borderRightColor = color;
    overlay.title = markerTitle(marker, "Protected region");
    timelineEl.appendChild(overlay);
  });
}

function renderLayerMarkers(clip, layer, clipStart, clipEnd) {
  const markers = layer.markers || [];
  markers.forEach(marker => {
    const t = Number(marker.time || 0);
    // Layer markers are shown only inside the visible in/out region of that layer.
    if (t < layer.inPoint || t > layer.outPoint) return;
    if (t < clipStart || t > clipEnd) return;
    const color = markerColor(marker);
    const dur = Math.max(0, Number(marker.duration || 0));

    if (dur > 0) {
      const regionStart = Math.max(clipStart, t);
      const regionEnd = Math.min(clipEnd, markerEnd(marker), layer.outPoint);
      if (regionEnd > regionStart) {
        const region = document.createElement("div");
        region.className = "layer-marker-region" + (marker.protectedRegion ? " protected" : "");
        region.dataset.markerKey = marker.keyIndex;
        region.dataset.markerType = "layer";
        region.dataset.markerRole = "layer-region";
        region.style.left = `${(regionStart - clipStart) * pixelsPerSecond}px`;
        region.style.width = `${Math.max(2, (regionEnd - regionStart) * pixelsPerSecond)}px`;
        region.style.backgroundColor = hexToRgba(color, marker.protectedRegion ? 0.22 : 0.12);
        region.title = markerTitle(marker, `Layer marker region • ${layer.name}`);
        clip.appendChild(region);
      }
      const endT = Math.min(markerEnd(marker), layer.outPoint);
      if (endT >= clipStart && endT <= clipEnd) {
        const endEl = document.createElement("div");
        endEl.className = "marker-half layer-marker-half-end marker-handle marker-handle-out";
        endEl.dataset.markerKey = marker.keyIndex;
        endEl.dataset.markerType = "layer";
        endEl.dataset.markerRole = "out";
        endEl.style.left = `${(endT - clipStart) * pixelsPerSecond}px`;
        endEl.style.borderRightColor = color;
        endEl.style.color = color;
        endEl.title = markerTitle(marker, `Layer marker out • ${layer.name}`);
        endEl.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "layer", layerIndex: layer.index, mode: "out", minTime: layer.inPoint, maxTime: layer.outPoint }));
        endEl.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "layer", layerIndex: layer.index }); });
        bindMarkerContextMenu(endEl, marker, { type: "layer", layerIndex: layer.index });
        clip.appendChild(endEl);
      }
    }

    const markerEl = document.createElement("div");
    markerEl.className = "marker marker-layer" + (dur > 0 ? " marker-region-start" : "") + (markerHasNoLabelColor(marker) ? " marker-no-label-color" : "");
    markerEl.style.left = `${(t - clipStart) * pixelsPerSecond}px`;
    markerEl.dataset.markerKey = marker.keyIndex;
    markerEl.dataset.markerType = "layer";
    markerEl.dataset.markerRole = "move";
    markerEl.style.setProperty("--marker-color", color);
    markerEl.title = markerTitle(marker, `Layer marker • ${layer.name}`);
    addMarkerLabel(markerEl, marker);
    markerEl.addEventListener("mousedown", e => beginMarkerDrag(e, marker, { type: "layer", layerIndex: layer.index, mode: "move", minTime: layer.inPoint, maxTime: layer.outPoint }));
    markerEl.addEventListener("dblclick", e => { e.preventDefault(); e.stopPropagation(); openMarkerMenu(marker, { type: "layer", layerIndex: layer.index }); });
    bindMarkerContextMenu(markerEl, marker, { type: "layer", layerIndex: layer.index });
    clip.appendChild(markerEl);
  });
}

function renderLayerKeyframes(clip, layer, clipStart, clipEnd) {
  const keyframes = layer.keyframes || [];
  if (!keyframes.length) return;
  keyframes.forEach((keyframe, index) => {
    const t = Number(keyframe.time || 0);
    if (t < layer.inPoint || t > layer.outPoint) return;
    if (t < clipStart || t > clipEnd) return;
    const color = Number(keyframe.label || 0) ? labelColor(Number(keyframe.label || 0)) : labelColor(layer.label);
    const el = document.createElement("div");
    el.className = "layer-keyframe-marker";
    el.style.left = `${(t - clipStart) * pixelsPerSecond}px`;
    el.style.setProperty("--keyframe-color", color);
    el.title = `Keyframe @ ${formatTime(t)}${keyframe.properties && keyframe.properties.length ? " - " + keyframe.properties.join(", ") : ""}`;
    el.dataset.keyframeIndex = index;
    clip.appendChild(el);
  });
}

function layerByIndexMap(layers) {
  const map = {};
  (layers || []).forEach(layer => {
    map[Number(layer.index)] = layer;
  });
  return map;
}

function relationshipLayerSets(layers) {
  const visible = layerByIndexMap(layers);
  const matte = new Set();
  const parent = new Set();
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    if (matteIndex && visible[matteIndex]) {
      matte.add(layerIndex);
      matte.add(matteIndex);
    } else if (matteIndex) {
      matte.add(layerIndex);
    }
    if (parentIndex && visible[parentIndex]) {
      parent.add(layerIndex);
      parent.add(parentIndex);
    } else if (parentIndex) {
      parent.add(layerIndex);
    }
  });
  return { matte, parent };
}

function renderClipRelationshipDots(clip, layer, relationSets) {
  const hasMatteDot = showTrackMatteLinks && relationSets.matte.has(Number(layer.index));
  const hasParentDot = showParentLinks && relationSets.parent.has(Number(layer.index));
  if (!hasMatteDot && !hasParentDot) return;
  clip.classList.add("has-relation-dots");
  const dots = document.createElement("span");
  dots.className = "clip-relation-dots";
  if (hasMatteDot) {
    const dot = document.createElement("span");
    dot.className = "clip-relation-dot matte";
    dot.title = layer.trackMatteLayerIndex
      ? `Track matte: ${layer.trackMatteType || "Track Matte"} -> ${layer.trackMatteLayerName || ("Layer " + layer.trackMatteLayerIndex)}`
      : "Track matte endpoint";
    dots.appendChild(dot);
  }
  if (hasParentDot) {
    const dot = document.createElement("span");
    dot.className = "clip-relation-dot parent";
    dot.title = layer.parentIndex
      ? `Parent: ${layer.parentName || ("Layer " + layer.parentIndex)}`
      : "Parent endpoint";
    dots.appendChild(dot);
  }
  clip.appendChild(dots);
}

function renderRelationshipLine(type, from, to) {
  if (!from || !to) return;
  const fromClip = timelineEl.querySelector(`.clip[data-layer-index="${from}"]`);
  const toClip = timelineEl.querySelector(`.clip[data-layer-index="${to}"]`);
  if (!fromClip || !toClip) return;
  const fromX = Number(fromClip.style.left.replace("px", "") || 0) + Number(fromClip.style.width.replace("px", "") || 0) - 8;
  const toX = Number(toClip.style.left.replace("px", "") || 0) + Number(toClip.style.width.replace("px", "") || 0) - 8;
  const fromY = (fromClip.offsetParent ? fromClip.offsetParent.offsetTop : 0) + TRACK_HEIGHT / 2 + (type === "matte" ? -4 : 4);
  const toY = (toClip.offsetParent ? toClip.offsetParent.offsetTop : 0) + TRACK_HEIGHT / 2 + (type === "matte" ? -4 : 4);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const line = document.createElement("div");
  line.className = `relationship-line ${type}`;
  line.style.left = `${fromX}px`;
  line.style.top = `${fromY}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  line.title = type === "matte" ? `Track matte link: layer ${from} -> layer ${to}` : `Parent link: layer ${from} -> layer ${to}`;
  timelineEl.appendChild(line);
}

function renderLayerRelationships(layers) {
  if (!showTrackMatteLinks && !showParentLinks) return;
  const visible = layerByIndexMap(layers);
  (layers || []).forEach(layer => {
    const layerIndex = Number(layer.index);
    const matteIndex = Number(layer.trackMatteLayerIndex || 0);
    const parentIndex = Number(layer.parentIndex || 0);
    if (showTrackMatteLinks && matteIndex && visible[matteIndex]) renderRelationshipLine("matte", layerIndex, matteIndex);
    if (showParentLinks && parentIndex && visible[parentIndex]) renderRelationshipLine("parent", layerIndex, parentIndex);
  });
}
function render() {
  if (timelineMode === "keyframe") {
    renderKeyframeMode();
    return;
  }
  renderEditMode();
}

function prepareTimelineForRender() {
  if (isMarkerDragging || isKeyframeDragging) return;
  timelineEl.innerHTML = "";
  timelineEl.style.setProperty("--track-fill-start", "0px");
  if (topMarkerRailEl) topMarkerRailEl.innerHTML = "";
  if (bottomMarkerRailEl) bottomMarkerRailEl.innerHTML = "";
  hideLayerMenu();
  return true;
}

function renderEditMode() {
  if (!prepareTimelineForRender()) return;
  document.body.classList.remove("keyframe-mode");
  if (!state.comp || !state.layers.length) {
    timelineEl.innerHTML = `<div class="empty">No comp/layers found. Select or open an active composition.</div>`;
    drawRuler();
    updateFilterButtons();
    updatePlayhead();
    updateHorizontalScrollBar();
    return;
  }

  fitTimelineToPanel();
  drawRuler();
  renderCompMarkers();
  timelineEl.style.width = `${timelineContentWidth()}px`;
  updateHorizontalScrollBar();

  const filteredLayers = visibleLayers();
  updateFilterButtons();
  if (!filteredLayers.length) {
    timelineEl.innerHTML = `<div class="empty">No layers match this filter.</div>`;
    renderProtectedRegionOverlays(1);
    updatePlayhead();
    return;
  }

  const lanes = packLayers(filteredLayers);
  const relationSets = relationshipLayerSets(filteredLayers);
  lanes.forEach((lane, laneIndex) => {
    const track = document.createElement("div");
    track.className = "track";
    const laneIndices = lane.map(layer => Number(layer.index || 0)).filter(Boolean);
    track.dataset.dropBeforeIndex = String(Math.min.apply(null, laneIndices));
    track.dataset.dropAfterIndex = String(Math.max.apply(null, laneIndices));

    const label = document.createElement("div");
    label.className = "track-label";
    label.textContent = `V${laneIndex + 1}`;
    track.appendChild(label);

    lane.forEach(layer => {
      if (layer.outPoint <= visibleStart || layer.inPoint >= visibleStart + visibleDuration) return;
      const clip = document.createElement("div");
      const selectedNow = state.selectedLayerIndices.includes(layer.index);
      const lastSelectedNow = selectedNow && Number(layer.index) === Number(lastSelectedLayerIndex);
      clip.className = "clip" + (selectedNow ? " selected" : "") + (lastSelectedNow ? " last-selected" : "") + (layer.isMissingMedia ? " missing-media" : "") + (!layer.enabled ? " disabled-layer" : "") + (layer.locked ? " locked-layer" : "");
      const clipStart = Math.max(layer.inPoint, visibleStart);
      const clipEnd = Math.min(layer.outPoint, visibleStart + visibleDuration);
      clip.style.left = `${timeToX(clipStart)}px`;
      clip.style.width = `${Math.max(12, (clipEnd - clipStart) * pixelsPerSecond)}px`;
      const isSelected = selectedNow;
      const labelColorValue = labelColor(layer.label);
      clip.style.backgroundColor = labelColorValue;
      clip.style.setProperty("--clip-base-color", labelColorValue);
      clip.style.setProperty("--index-bg", darkerHex(labelColorValue, 0.42));
      clip.dataset.layerIndex = layer.index;
      clip.dataset.clipStart = clipStart;
      clip.title = `${layer.name} | AE layer ${layer.index} | label ${layer.label}${layer.isMissingMedia ? " | Missing media" + (layer.missingMediaPath ? ": " + layer.missingMediaPath : "") : ""}`;
      clip.innerHTML = `<span class="clip-index">${layer.index}</span>${layer.isMissingMedia ? '<span class="missing-media-icon" title="Missing media">!</span>' : ""}<span class="clip-name">${escapeHtml(layer.name)}</span>`;
      renderClipRelationshipDots(clip, layer, relationSets);
      renderLayerKeyframes(clip, layer, clipStart, clipEnd);
      renderLayerMarkers(clip, layer, clipStart, clipEnd);
      clip.addEventListener("mousedown", event => {
        if (event.detail > 1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        hideLayerMenu();
        const startEvent = event;
        const startX = event.clientX;
        const startY = event.clientY;
        let dragged = false;
        const cleanup = () => {
          document.removeEventListener("mousemove", onMove, true);
          document.removeEventListener("mouseup", onUp, true);
        };
        const onMove = moveEvent => {
          if (dragged) return;
          if (Math.abs(moveEvent.clientX - startX) < 4 && Math.abs(moveEvent.clientY - startY) < 4) return;
          dragged = true;
          cleanup();
          beginMarqueeSelect(startEvent, moveEvent);
        };
        const onUp = () => {
          cleanup();
          if (dragged) return;
          const additiveClick = event.shiftKey || event.ctrlKey || event.metaKey;
          suppressSyncUntil = Date.now() + 700;
          selectLayer(layer.index, additiveClick);
        };
        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("mouseup", onUp, true);
      });
      clip.addEventListener("dblclick", event => {
        if (!layer.sourceCompId) return;
        event.preventDefault();
        event.stopPropagation();
        openLayerSourceComp(layer);
      });
      clip.addEventListener("contextmenu", event => {
        event.preventDefault();
        event.stopPropagation();
        if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event, layer)) return;
        const selectedIndices = state.selectedLayerIndices || [];
        const isLayerSelected = selectedIndices.includes(layer.index);
        if (!isLayerSelected) {
          // Right-click should feel normal: select the layer first, then open the menu.
          state.selectedLayerIndices = [layer.index];
          renderSelectionOnly();
          selectLayer(layer.index, false);
        }
        showLayerMenu(event, layer);
      });
      track.appendChild(clip);
    });

    timelineEl.appendChild(track);
  });

  timelineEl.style.setProperty("--track-fill-start", `${lanes.length * TRACK_HEIGHT}px`);
  renderLayerRelationships(filteredLayers);
  renderProtectedRegionOverlays(timelineEl.querySelectorAll(".track").length || lanes.length);
  updatePlayhead();
}

function updateModeButton() {
  if (!keyframeModeBtnEl) return;
  keyframeModeBtnEl.classList.toggle("active", timelineMode === "keyframe");
  keyframeModeBtnEl.dataset.mode = timelineMode;
  keyframeModeBtnEl.textContent = timelineMode === "keyframe" ? "Keyframes" : "Edit";
  keyframeModeBtnEl.title = timelineMode === "keyframe" ? "Current mode: Keyframes. Click to switch to Edit." : "Current mode: Edit. Click to switch to Keyframes.";
}

function setTimelineMode(mode) {
  timelineMode = mode === "keyframe" ? "keyframe" : "edit";
  if (timelineMode === "edit") keyframeLayerFilter = null;
  if (timelineMode === "keyframe") ensureKeyframeExpansionDefaults();
  updateModeButton();
  updateStatus();
  render();
}

function toggleTimelineMode() {
  if (timelineMode === "edit") keyframeLayerFilter = null;
  setTimelineMode(timelineMode === "keyframe" ? "edit" : "keyframe");
}

function toggleSelectedKeyframeExpansion() {
  const selectedIndices = state.selectedLayerIndices || [];
  let targets = [];
  if (timelineMode === "edit") {
    const selected = selectedIndices.filter(index =>
      (state.layers || []).some(layer => layer.index === index)
    );
    targets = selected.length
      ? selected
      : visibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
    targets = [...new Set(targets)];
    if (!targets.length) return;
    targets.forEach(index => { expandedKeyframeLayers[index] = true; });
    setTimelineMode("keyframe");
    return;
  } else {
    const selected = selectedIndices.filter(index =>
      (state.layers || []).some(layer => layer.index === index && (layer.animatedProperties || []).length)
    );
    targets = selected.length
      ? selected
      : keyframeVisibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
  }
  targets = [...new Set(targets)];
  if (!targets.length) return;

  const shouldExpand = targets.some(index => !expandedKeyframeLayers[index]);
  targets.forEach(index => { expandedKeyframeLayers[index] = shouldExpand; });
  updateStatus();
  render();
}

function animatedKeyframeLayerTargets() {
  const layers = timelineMode === "keyframe" ? keyframeVisibleLayers() : visibleLayers();
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const selectedAnimated = layers.filter(layer =>
    selected.has(Number(layer.index)) && (layer.animatedProperties || []).length
  );
  return selectedAnimated.length
    ? selectedAnimated
    : layers.filter(layer => (layer.animatedProperties || []).length);
}

function expandAnimatedKeyframeProperties() {
  if (!state.comp) return;
  const targets = animatedKeyframeLayerTargets();
  if (!targets.length) {
    statusEl.textContent = "No animated properties to reveal.";
    return;
  }
  targets.forEach(layer => { expandedKeyframeLayers[layer.index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function collapseAllKeyframeProperties() {
  expandedKeyframeLayers = {};
  expandedTransformLayers = {};
  if (timelineMode !== "keyframe") {
    statusEl.textContent = "Collapsed keyframe property lanes.";
    return;
  }
  updateStatus();
  render();
}

function toggleKeyframeFocusMode() {
  if (!state.comp) return;
  if (keyframeLayerFilter && keyframeLayerFilter.length) {
    keyframeLayerFilter = null;
    updateStatus();
    render();
    return;
  }
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  if (!selected.length) return;
  keyframeLayerFilter = [...new Set(selected.map(Number))];
  keyframeLayerFilter.forEach(index => { expandedKeyframeLayers[index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function revealAndFocusSelectedKeyframes() {
  if (!state.comp) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  const targets = selected.length
    ? selected
    : visibleLayers().filter(layer => (layer.animatedProperties || []).length).map(layer => layer.index);
  const uniqueTargets = [...new Set(targets.map(Number))];
  if (!uniqueTargets.length) return;
  keyframeLayerFilter = selected.length ? uniqueTargets.slice() : null;
  uniqueTargets.forEach(index => { expandedKeyframeLayers[index] = true; });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function revealSelectedTransformProperties() {
  if (!state.comp) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    (state.layers || []).some(layer => layer.index === index)
  );
  const targets = selected.length ? selected : visibleLayers().map(layer => layer.index);
  const uniqueTargets = [...new Set(targets.map(Number))].filter(index => {
    const layer = (state.layers || []).find(item => Number(item.index) === index);
    return layer && (layer.transformProperties || []).length;
  });
  if (!uniqueTargets.length) return;
  const shouldShow = uniqueTargets.some(index => !expandedTransformLayers[index]);
  uniqueTargets.forEach(index => {
    expandedTransformLayers[index] = shouldShow;
    if (shouldShow) {
      expandedKeyframeLayers[index] = true;
    } else {
      const layer = (state.layers || []).find(item => Number(item.index) === index);
      if (!layer || !(layer.animatedProperties || []).length) expandedKeyframeLayers[index] = false;
    }
  });
  if (timelineMode !== "keyframe") {
    setTimelineMode("keyframe");
    return;
  }
  updateStatus();
  render();
}

function ensureKeyframeExpansionDefaults() {
  const allowed = keyframeVisibleLayers();
  const hasAny = Object.keys(expandedKeyframeLayers || {}).some(key =>
    expandedKeyframeLayers[key] && allowed.some(layer => String(layer.index) === String(key))
  );
  if (hasAny) return;
  const selected = (state.selectedLayerIndices || []).filter(index =>
    allowed.some(layer => layer.index === index)
  );
  const targets = selected.length
    ? selected
    : allowed.filter(layer => (layer.animatedProperties || []).length).slice(0, 8).map(layer => layer.index);
  targets.forEach(index => { expandedKeyframeLayers[index] = true; });
}

function keyframeVisibleLayers() {
  const layers = visibleLayers();
  if (!keyframeLayerFilter || !keyframeLayerFilter.length) return layers;
  const allowed = new Set(keyframeLayerFilter.map(Number));
  return layers.filter(layer => allowed.has(Number(layer.index)));
}

function buildKeyframeRows() {
  const rows = [];
  keyframeVisibleLayers().forEach(layer => {
    rows.push({ type: "layer", layer });
    if (expandedKeyframeLayers[layer.index]) {
      keyframeRowProperties(layer).forEach(property => rows.push({ type: "property", layer, property }));
    }
  });
  return rows;
}

function keyframeRowProperties(layer) {
  const animated = layer.animatedProperties || [];
  if (!expandedTransformLayers[layer.index]) return animated;
  const merged = [];
  const seen = {};
  (layer.transformProperties || []).forEach(property => {
    const path = String(property.path || "");
    const animatedVersion = animated.find(item => String(item.path || "") === path);
    const resolved = animatedVersion || property;
    merged.push(resolved);
    if (path) seen[path] = true;
  });
  animated.forEach(property => {
    const path = String(property.path || "");
    if (path && seen[path]) return;
    merged.push(property);
  });
  return merged;
}

function propertyGroupKey(property) {
  return String(property && (property.path || property.name || property.matchName || propertyLaneLabel(property)) || "");
}

function propertyGroupItemAtPointer(event, items) {
  const list = items && items.length ? items : [];
  if (list.length <= 1) return list[0] || null;
  const viewportRect = scrollAreaEl.getBoundingClientRect();
  const contentX = event.clientX - viewportRect.left + scrollAreaEl.scrollLeft;
  if (contentX < currentLeftGutter()) return list[0];
  const time = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  return list.find(item => time >= Number(item.layer.inPoint || 0) && time <= Number(item.layer.outPoint || 0))
    || list[0];
}

function propertyValueModifierDown(event) {
  return isMacPlatform()
    ? !!(event && (event.metaKey || event.commandKey))
    : !!(event && event.ctrlKey);
}

function ensurePropertyValueHover() {
  if (propertyValueHoverEl && propertyValueHoverEl.isConnected) return propertyValueHoverEl;
  propertyValueHoverEl = document.createElement("div");
  propertyValueHoverEl.className = "property-value-hover";
  propertyValueHoverEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(propertyValueHoverEl);
  return propertyValueHoverEl;
}

function hidePropertyValueHover() {
  propertyValueHoverTarget = null;
  propertyValueHoverRequest++;
  if (propertyValueHoverTimer) {
    clearTimeout(propertyValueHoverTimer);
    propertyValueHoverTimer = null;
  }
  if (propertyValueHoverEl) {
    propertyValueHoverEl.classList.remove("show");
    propertyValueHoverEl.setAttribute("aria-hidden", "true");
  }
}

function positionPropertyValueHover(event) {
  const popup = ensurePropertyValueHover();
  const gap = 12;
  const width = popup.offsetWidth || 150;
  const height = popup.offsetHeight || 34;
  let left = Number(event.clientX || 0) + gap;
  let top = Number(event.clientY || 0) + gap;
  if (left + width > window.innerWidth - 8) left = Number(event.clientX || 0) - width - gap;
  if (top + height > window.innerHeight - 8) top = Number(event.clientY || 0) - height - gap;
  popup.style.left = `${Math.max(8, left)}px`;
  popup.style.top = `${Math.max(8, top)}px`;
}

function formatPropertyValueDisplay(result) {
  if (!result || !result.ok || !result.editable) return result && result.error ? result.error : "Value unavailable";
  const units = result.units ? ` ${result.units}` : "";
  return `${result.value || "0"}${units}`;
}

function requestPropertyValueHover(event, items) {
  if (!propertyValueModifierDown(event) || propertyValueEditorEl) {
    hidePropertyValueHover();
    return;
  }
  const target = propertyGroupItemAtPointer(event, items);
  if (!target) return;
  const time = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const frameDuration = Number(state.comp && state.comp.frameDuration || 1 / 30);
  const snappedTime = Math.round(time / frameDuration) * frameDuration;
  const targetKey = `${target.layer.index}|${target.property.path || ""}|${snappedTime.toFixed(6)}`;
  const popup = ensurePropertyValueHover();
  positionPropertyValueHover(event);
  popup.classList.add("show");
  popup.setAttribute("aria-hidden", "false");
  if (propertyValueHoverTarget === targetKey) return;
  propertyValueHoverTarget = targetKey;
  popup.innerHTML = `<strong>${escapeHtml(propertyLaneLabel(target.property))}</strong><span>Loading...</span>`;
  const requestId = ++propertyValueHoverRequest;
  if (propertyValueHoverTimer) clearTimeout(propertyValueHoverTimer);
  propertyValueHoverTimer = setTimeout(async () => {
    propertyValueHoverTimer = null;
    await loadJSX();
    const result = await aeCall("TNT_getPropertyValueAtTime", [
      target.layer.index,
      target.property.path || "",
      snappedTime
    ]);
    if (requestId !== propertyValueHoverRequest || propertyValueHoverTarget !== targetKey) return;
    popup.innerHTML = `
      <strong>${escapeHtml(result.propertyName || propertyLaneLabel(target.property))}</strong>
      <span>${escapeHtml(formatPropertyValueDisplay(result))}</span>
    `;
  }, 55);
}

function closePropertyValueEditor(options = {}) {
  if (!propertyValueEditorEl) return;
  propertyValueEditorEl.remove();
  propertyValueEditorEl = null;
  propertyValueEditorKeys = [];
  propertyValueEditorCommitQueued = false;
  propertyValueEditorLastCommitted = "";
}

function propertyValueEditorText() {
  if (!propertyValueEditorEl) return "";
  return Array.from(propertyValueEditorEl.querySelectorAll(".property-value-editor-number"))
    .map(input => input.value)
    .join(", ");
}

function updatePropertyValueRangeFill(input) {
  if (!input) return;
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

async function commitPropertyValueEditor() {
  if (!propertyValueEditorEl || !propertyValueEditorKeys.length) return;
  const valueText = propertyValueEditorText();
  if (valueText === propertyValueEditorLastCommitted) return;
  if (propertyValueEditorCommitInFlight) {
    propertyValueEditorCommitQueued = true;
    return;
  }
  propertyValueEditorCommitInFlight = true;
  propertyValueEditorLastCommitted = valueText;
  const keys = propertyValueEditorKeys.slice();
  await loadJSX();
  const result = await aeCall("TNT_setSelectedKeyframeValue", [keys, valueText]);
  propertyValueEditorCommitInFlight = false;
  if (!result.ok) {
    propertyValueEditorLastCommitted = "";
    statusEl.textContent = result.error || "Could not set keyframe value.";
  }
  else {
    suppressSyncUntil = Date.now() + 500;
    scheduleSettledActionRefresh({ includeSelectedKeyframes: true });
  }
  if (propertyValueEditorCommitQueued) {
    propertyValueEditorCommitQueued = false;
    commitPropertyValueEditor();
  }
}

function sliderRangeForPropertyValue(value, result) {
  if (result && result.isColor) return { min: 0, max: 1, step: 0.001 };
  const magnitude = Math.max(1, Math.abs(Number(value) || 0));
  const span = Math.max(100, magnitude * 2);
  return {
    min: Number(value) - span,
    max: Number(value) + span,
    step: magnitude < 10 ? 0.01 : 0.1
  };
}

function positionPropertyValueEditor(anchor) {
  if (!propertyValueEditorEl || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const popupRect = propertyValueEditorEl.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - popupRect.width / 2;
  let top = rect.bottom + 9;
  left = Math.max(8, Math.min(window.innerWidth - popupRect.width - 8, left));
  if (top + popupRect.height > window.innerHeight - 8) top = rect.top - popupRect.height - 9;
  propertyValueEditorEl.style.left = `${left}px`;
  propertyValueEditorEl.style.top = `${Math.max(8, top)}px`;
}

async function openPropertyValueEditor(anchor, layer, property, keyframe) {
  hidePropertyValueHover();
  closePropertyValueEditor();
  const key = {
    layerIndex: layer.index,
    propertyPath: property.path || "",
    keyIndex: keyframe.keyIndex || 0
  };
  selectedKeyframes = normalizeSelectedKeyframes([key]);
  renderKeyframeSelectionOnly();
  loadJSX().then(() => aeCall("TNT_selectPropertyKeys", [selectedKeyframes]));
  propertyValueEditorKeys = [key];
  const popup = document.createElement("div");
  popup.className = "property-value-editor loading";
  popup.innerHTML = `<div class="property-value-editor-title">${escapeHtml(propertyLaneLabel(property))}</div><div class="property-value-editor-loading">Loading...</div>`;
  popup.addEventListener("mousedown", event => event.stopPropagation());
  popup.addEventListener("contextmenu", event => {
    event.preventDefault();
    event.stopPropagation();
  });
  document.body.appendChild(popup);
  propertyValueEditorEl = popup;
  positionPropertyValueEditor(anchor);
  await loadJSX();
  const result = await aeCall("TNT_getKeyframeValueForEdit", [[key]]);
  if (propertyValueEditorEl !== popup) return;
  if (!result.ok || !result.editable || !result.values || !result.values.length) {
    popup.innerHTML = `<div class="property-value-editor-title">${escapeHtml(propertyLaneLabel(property))}</div><div class="property-value-editor-error">${escapeHtml(result.error || "This value is not editable.")}</div>`;
    popup.classList.remove("loading");
    positionPropertyValueEditor(anchor);
    return;
  }
  propertyValueEditorLastCommitted = result.values.map(value => String(Number(value))).join(", ");
  const axes = result.values.length === 1 ? ["Value"] : ["X", "Y", "Z", "W"];
  popup.innerHTML = `
    <div class="property-value-editor-head">
      <strong>${escapeHtml(result.propertyName || propertyLaneLabel(property))}</strong>
      <span>${escapeHtml(formatTime(Number(keyframe.time || 0)))}</span>
    </div>
    <div class="property-value-editor-controls">
      ${result.values.map((value, index) => {
        const range = sliderRangeForPropertyValue(value, result);
        return `
          <label class="property-value-editor-row">
            <span>${axes[index] || index + 1}</span>
            <input class="property-value-editor-slider" type="range" min="${range.min}" max="${range.max}" step="${range.step}" value="${Number(value)}">
            <input class="property-value-editor-number" type="number" step="${range.step}" value="${Number(value)}">
          </label>
        `;
      }).join("")}
    </div>
  `;
  popup.classList.remove("loading");
  const sliders = Array.from(popup.querySelectorAll(".property-value-editor-slider"));
  const numbers = Array.from(popup.querySelectorAll(".property-value-editor-number"));
  sliders.forEach((slider, index) => {
    slider.addEventListener("input", () => {
      numbers[index].value = slider.value;
      updatePropertyValueRangeFill(slider);
    });
    slider.addEventListener("change", () => commitPropertyValueEditor());
    updatePropertyValueRangeFill(slider);
  });
  numbers.forEach((input, index) => {
    input.addEventListener("input", () => {
      const slider = sliders[index];
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      if (value < Number(slider.min)) slider.min = String(value);
      if (value > Number(slider.max)) slider.max = String(value);
      slider.value = String(value);
      updatePropertyValueRangeFill(slider);
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitPropertyValueEditor();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closePropertyValueEditor();
      }
    });
    input.addEventListener("change", () => commitPropertyValueEditor());
  });
  positionPropertyValueEditor(anchor);
  const firstInput = numbers[0];
  if (firstInput) firstInput.focus({ preventScroll: true });
}

function renderPropertyTrack(layer, property, options = {}) {
  const track = document.createElement("div");
  const items = options.items && options.items.length ? options.items : [{ layer, property }];
  const hasKeys = items.some(item => !!(item.property.hasKeyframes || (item.property.keyframes || []).length));
  const hasExpression = items.some(item => !!item.property.hasExpression);
  track.className = "track keyframe-property-row" + (options.editMode ? " edit-property-row" : "") + (items.length > 1 ? " grouped-property-row" : "") + (hasExpression ? " has-expression" : "");
  track.dataset.layerIndex = layer.index;
  track.dataset.propertyPath = property.path || "";
  track.addEventListener("mousemove", event => requestPropertyValueHover(event, items));
  track.addEventListener("mouseleave", hidePropertyValueHover);

  const label = document.createElement("div");
  label.className = "track-label property-track-label";
  const stateClass = hasKeys && hasExpression ? " both" : (hasExpression ? " expression" : (hasKeys ? " keyed" : ""));
  label.innerHTML = `<span class="property-indent"></span><span class="property-row-icon"></span><span class="property-label-text">${escapeHtml(propertyLaneLabel(property))}</span>`;
  label.querySelector(".property-row-icon").className = "property-row-icon" + stateClass;
  label.title = propertyLaneLabel(property);
  const handlePropertyRowAction = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const target = propertyGroupItemAtPointer(event, items);
    if (!target) return;
    if (event.ctrlKey || event.metaKey) {
      addPropertyKeyAtPointer(event, target.layer, target.property);
      return;
    }
    if (event.altKey) {
      openExpressionDialog(target.layer, target.property);
      return;
    }
    selectLayerProperty(target.layer.index, target.property.path || "");
  };
  const handlePropertyRowMouseDown = event => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey || event.altKey) {
      handlePropertyRowAction(event);
      return;
    }
    if (timelineMode === "keyframe" && selectedKeyframes.length) {
      clearKeyframeSelectionLocally({ closeEase: true });
    }
    const startEvent = event;
    const startX = event.clientX;
    const startY = event.clientY;
    let dragged = false;
    const cleanup = () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
    };
    const onMove = moveEvent => {
      if (dragged) return;
      if (Math.abs(moveEvent.clientX - startX) < 4 && Math.abs(moveEvent.clientY - startY) < 4) return;
      dragged = true;
      cleanup();
      beginMarqueeSelect(startEvent, moveEvent);
    };
    const onUp = upEvent => {
      cleanup();
      if (!dragged) handlePropertyRowAction(upEvent);
    };
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
  };
  label.addEventListener("mousedown", handlePropertyRowMouseDown);
  track.addEventListener("mousedown", event => {
    if (event.target.closest && event.target.closest(".property-keyframe-marker")) return;
    handlePropertyRowMouseDown(event);
  });

  const propName = document.createElement("div");
  propName.className = "property-lane-name";
  const nameTime = Math.max(Number(layer.inPoint || 0), visibleStart);
  propName.style.left = `${timeToX(nameTime)}px`;
  propName.textContent = propertyLaneLabel(property);
  propName.title = propertyLaneLabel(property);
  track.appendChild(propName);
  renderPropertyExpressionZones(track, items);
  items.forEach(item => renderPropertyKeyframes(track, item.layer, item.property));
  track.appendChild(label);
  return track;
}

function renderPropertyExpressionZones(track, items) {
  (items || []).forEach(item => {
    if (!item || !item.property || !item.property.hasExpression || !item.layer) return;
    const start = Math.max(visibleStart, Number(item.layer.inPoint || 0));
    const end = Math.min(visibleStart + visibleDuration, Number(item.layer.outPoint || 0));
    if (end <= start) return;
    const zone = document.createElement("div");
    zone.className = "property-expression-zone";
    zone.style.left = `${timeToX(start)}px`;
    zone.style.width = `${Math.max(2, (end - start) * pixelsPerSecond)}px`;
    zone.title = `${item.layer.name || "Layer"} | ${propertyLaneLabel(item.property)} expression`;
    track.appendChild(zone);
  });
}

async function addPropertyKeyAtPointer(event, layer, property) {
  const time = timeFromPointerEvent(event, { targetSnap: true, showGuide: false });
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_addPropertyKeyAtTime", [layer.index, property.path || "", time]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add keyframe.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

async function openExpressionDialog(layer, property) {
  if (!expressionModalEl) return;
  activeExpressionTarget = { layerIndex: layer.index, propertyPath: property.path || "" };
  expressionTitleEl.textContent = propertyLaneLabel(property);
  expressionSubtitleEl.textContent = layer.name || `Layer ${layer.index}`;
  expressionErrorEl.textContent = "";
  expressionInputEl.value = "";
  expressionModalEl.classList.add("show");
  expressionModalEl.setAttribute("aria-hidden", "false");
  await loadJSX();
  const result = await aeCall("TNT_getPropertyExpression", [layer.index, property.path || ""]);
  if (result.ok) expressionInputEl.value = result.expression || "";
  else expressionErrorEl.textContent = result.error || "Could not read expression.";
  setTimeout(() => { expressionInputEl.focus(); expressionInputEl.select(); }, 0);
}

function hideExpressionDialog() {
  if (!expressionModalEl) return;
  expressionModalEl.classList.remove("show");
  expressionModalEl.setAttribute("aria-hidden", "true");
  activeExpressionTarget = null;
}

async function applyExpressionDialog(disable = false) {
  if (!activeExpressionTarget) return;
  expressionErrorEl.textContent = "";
  await loadJSX();
  const result = await aeCall("TNT_setPropertyExpression", [
    activeExpressionTarget.layerIndex,
    activeExpressionTarget.propertyPath,
    disable ? "" : expressionInputEl.value,
    !disable
  ]);
  if (!result.ok) {
    expressionErrorEl.textContent = result.error || "Could not set expression.";
    return;
  }
  hideExpressionDialog();
  await refreshLayers({ forceRender: true });
}

function keyframeTypeClass(keyframe) {
  const type = String(keyframe && keyframe.type || "linear").toLowerCase();
  if (type === "hold") return "hold";
  if (type === "hold-ease-out") return "hold-ease-out";
  if (type === "hold-ease-in") return "hold-ease-in";
  if (type === "hold-linear-out") return "hold-linear-out";
  if (type === "hold-linear-in") return "hold-linear-in";
  if (type === "roving") return "roving";
  if (type === "auto-bezier") return "auto-bezier";
  if (type === "ease-in") return "ease-in";
  if (type === "ease-out") return "ease-out";
  if (type === "easy-ease") return "easy-ease";
  if (type === "mixed") return "mixed";
  return "linear";
}

function keyframeTypeLabel(keyframe) {
  const type = String(keyframe && keyframe.type || "linear").toLowerCase();
  if (type === "hold") return "Hold";
  if (type === "hold-ease-out") return "Hold Ease Out";
  if (type === "hold-ease-in") return "Hold Ease In";
  if (type === "hold-linear-out") return "Hold Linear Out";
  if (type === "hold-linear-in") return "Hold Linear In";
  if (type === "roving") return "Rove Across Time";
  if (type === "auto-bezier") return "Auto Bezier";
  if (type === "ease-in") return "Ease In";
  if (type === "ease-out") return "Ease Out";
  if (type === "easy-ease") return "Easy Ease";
  if (type === "mixed") return "Mixed";
  return "Linear";
}

function propertyLaneLabel(property) {
  const displayPath = String(property && property.displayPath || "");
  const name = String(property && property.name || "Property");
  if (/^transform\s*\/\s*/i.test(displayPath)) return name;
  return displayPath || name;
}

function keyframeSelectionId(layerIndex, propertyPath, keyIndex) {
  return [Number(layerIndex || 0), String(propertyPath || ""), Number(keyIndex || 0)].join("|");
}

function normalizeSelectedKeyframes(keys) {
  return (keys || []).map(key => ({
    layerIndex: Number(key.layerIndex || 0),
    propertyPath: String(key.propertyPath || ""),
    keyIndex: Number(key.keyIndex || 0)
  })).filter(key => key.layerIndex && key.propertyPath && key.keyIndex);
}

function formatKeyframeSelectionScope(keys, mixed = false) {
  const normalized = normalizeSelectedKeyframes(keys);
  const layers = {};
  const properties = {};
  normalized.forEach(key => {
    layers[key.layerIndex] = true;
    properties[`${key.layerIndex}|${key.propertyPath}`] = true;
  });
  const keyCount = normalized.length;
  const propertyCount = Object.keys(properties).length;
  const layerCount = Object.keys(layers).length;
  const parts = [`${keyCount} keyframe${keyCount === 1 ? "" : "s"}`];
  if (propertyCount >= 2) parts.push(`${propertyCount} props`);
  if (layerCount >= 2) parts.push(`${layerCount} layers`);
  if (mixed) parts.push("mixed");
  return parts.join(" / ");
}

function isKeyframeSelected(layerIndex, propertyPath, keyIndex) {
  const id = keyframeSelectionId(layerIndex, propertyPath, keyIndex);
  return selectedKeyframes.some(item => keyframeSelectionId(item.layerIndex, item.propertyPath, item.keyIndex) === id);
}

function findKeyframeInfo(key) {
  const layerIndex = Number(key.layerIndex || 0);
  const propertyPath = String(key.propertyPath || "");
  const keyIndex = Number(key.keyIndex || 0);
  const layer = (state.layers || []).find(item => Number(item.index) === layerIndex);
  if (!layer) return null;
  const property = (layer.animatedProperties || []).find(item => String(item.path || "") === propertyPath);
  if (!property) return null;
  const keyframe = (property.keyframes || []).find(item => Number(item.keyIndex || 0) === keyIndex);
  if (!keyframe) return null;
  return {
    layer,
    property,
    keyframe,
    layerIndex,
    propertyPath,
    keyIndex,
    originalTime: snapTimeToFrame(Number(keyframe.time || 0)),
    minTime: Math.max(0, Number(layer.inPoint || 0)),
    maxTime: Math.min(Number(state.comp && state.comp.duration || Infinity), Number(layer.outPoint || (state.comp && state.comp.duration) || Infinity))
  };
}

async function selectKeyframes(keys, additive = false) {
  const incoming = normalizeSelectedKeyframes(keys);

  const map = {};
  if (additive) {
    selectedKeyframes.forEach(key => { map[keyframeSelectionId(key.layerIndex, key.propertyPath, key.keyIndex)] = key; });
  }
  incoming.forEach(key => { map[keyframeSelectionId(key.layerIndex, key.propertyPath, key.keyIndex)] = key; });
  selectedKeyframes = Object.keys(map).map(id => map[id]);
  renderKeyframeSelectionOnly();

  await loadJSX();
  const result = await aeCall("TNT_selectPropertyKeys", [selectedKeyframes]);
  if (!result.ok) statusEl.textContent = result.error || "Could not select keyframes.";
}

function clearKeyframeSelectionLocally(options = {}) {
  selectedKeyframes = [];
  suppressSyncUntil = Date.now() + 700;
  renderKeyframeSelectionOnly();
  updateStatus();
  if (options.closeEase !== false && easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
  }
}

async function clearSelectedKeyframes(options = {}) {
  const hadSelection = selectedKeyframes.length > 0;
  clearKeyframeSelectionLocally(options);
  if (options.host === false || (!hadSelection && !options.forceHost)) return;
  await loadJSX();
  const result = await aeCall("TNT_selectPropertyKeys", [[]]);
  if (!result.ok) statusEl.textContent = result.error || "Could not clear keyframes.";
}

function renderKeyframeSelectionOnly() {
  document.querySelectorAll(".property-keyframe-marker").forEach(el => {
    el.classList.toggle("selected", isKeyframeSelected(el.dataset.layerIndex, el.dataset.propertyPath, el.dataset.keyIndex));
  });
}

function renderPropertyKeyframes(track, layer, property) {
  const showOutsideLayerBounds = timelineMode === "keyframe";
  (property.keyframes || []).forEach(keyframe => {
    const t = Number(keyframe.time || 0);
    if (t < visibleStart || t > visibleStart + visibleDuration) return;
    if (!showOutsideLayerBounds && (t < layer.inPoint || t > layer.outPoint)) return;
    const hit = document.createElement("div");
    hit.className = "property-keyframe-hit";
    hit.style.left = `${timeToX(t)}px`;
    hit.dataset.layerIndex = layer.index;
    hit.dataset.propertyPath = property.path || "";
    hit.dataset.keyIndex = keyframe.keyIndex || "";
    hit.dataset.time = t;

    const el = document.createElement("div");
    const typeClass = keyframeTypeClass(keyframe);
    el.className = `property-keyframe-marker keyframe-${typeClass}`;
    el.style.setProperty("--property-keyframe-color", keyframeLabelColor(keyframe.label));
    el.title = `${layer.name} | ${propertyLaneLabel(property)} | ${keyframeTypeLabel(keyframe)} keyframe @ ${formatTime(t)}`;
    el.dataset.layerIndex = layer.index;
    el.dataset.propertyPath = property.path || "";
    el.dataset.keyIndex = keyframe.keyIndex || "";
    el.dataset.time = t;
    el.classList.toggle("selected", isKeyframeSelected(layer.index, property.path || "", keyframe.keyIndex || 0));
    hit.title = el.title;
    hit.addEventListener("mousedown", event => {
      if (event.button === 0 && propertyValueModifierDown(event)) {
        event.preventDefault();
        event.stopPropagation();
        openPropertyValueEditor(hit, layer, property, keyframe);
        return;
      }
      beginKeyframeDrag(event, layer, property, keyframe);
    });
    hit.addEventListener("contextmenu", event => {
      const key = { layerIndex: layer.index, propertyPath: property.path || "", keyIndex: keyframe.keyIndex || 0 };
      if (!isKeyframeSelected(key.layerIndex, key.propertyPath, key.keyIndex)) {
        selectedKeyframes = normalizeSelectedKeyframes([key]);
        renderKeyframeSelectionOnly();
        loadJSX().then(() => aeCall("TNT_selectPropertyKeys", [selectedKeyframes]));
      }
      showKeyframeMenu(event);
    });
    hit.appendChild(el);
    track.appendChild(hit);
  });
}

function beginKeyframeDrag(event, layer, property, keyframe) {
  if (!state.comp || event.button !== 0) return;
  if (event.detail > 1) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  const propertyPath = property.path || "";
  const keyIndex = Number(keyframe.keyIndex || 0);
  const additive = event.ctrlKey || event.metaKey;
  const alreadySelected = isKeyframeSelected(layer.index, propertyPath, keyIndex);
  if (!alreadySelected || additive) {
    selectKeyframes([{ layerIndex: layer.index, propertyPath, keyIndex }], additive);
  }
  const moveKeys = alreadySelected && !additive
    ? selectedKeyframes.slice()
    : [{ layerIndex: layer.index, propertyPath, keyIndex }];
  const moveInfos = moveKeys.map(findKeyframeInfo).filter(Boolean);
  if (!moveInfos.length) return;
  const minDelta = Math.max(...moveInfos.map(info => info.minTime - info.originalTime));
  const maxDelta = Math.min(...moveInfos.map(info => info.maxTime - info.originalTime));
  const startPointerTime = timeFromPointerEvent(event, { targetSnap: false, showGuide: false });
  const originalTime = snapTimeToFrame(Number(keyframe.time || 0));
  let previewTime = originalTime;
  let previewFrame = 0;
  const dragVisuals = moveInfos.map(info => {
    const el = Array.from(document.querySelectorAll(
      `.property-keyframe-hit[data-layer-index="${info.layerIndex}"][data-key-index="${info.keyIndex}"]`
    )).find(candidate => String(candidate.dataset.propertyPath || "") === String(info.propertyPath || ""));
    return el ? { el, originalTime: info.originalTime } : null;
  }).filter(Boolean);

  isKeyframeDragging = true;
  suppressSyncUntil = Date.now() + 60000;
  document.body.classList.add("keyframe-moving");
  if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.add("is-dragging");

  const renderPreview = () => {
    previewFrame = 0;
    const delta = previewTime - originalTime;
    dragVisuals.forEach(item => { item.el.style.left = `${timeToX(item.originalTime + delta)}px`; });
  };

  const applyPreview = moveEvent => {
    const pointerTime = timeFromPointerEvent(moveEvent, { targetSnap: false, showGuide: false });
    const rawDelta = pointerTime - startPointerTime;
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, rawDelta));
    const snapped = snapTimeToTargets(originalTime + clampedDelta, {
      targetSnap: moveEvent.shiftKey,
      minTime: originalTime + minDelta,
      maxTime: originalTime + maxDelta,
      excludeType: "keyframe",
      excludeLayerIndex: layer.index,
      excludePropertyPath: propertyPath,
      excludeKey: keyIndex
    });
    previewTime = Math.max(originalTime + minDelta, Math.min(originalTime + maxDelta, snapped.time));
    showSnapGuide(previewTime, moveEvent.shiftKey, snapped.target);
    if (!previewFrame) previewFrame = requestAnimationFrame(renderPreview);
  };

  const finish = async () => {
    if (previewFrame) { cancelAnimationFrame(previewFrame); previewFrame = 0; }
    renderPreview();
    document.removeEventListener("mousemove", applyPreview, true);
    document.removeEventListener("mouseup", finish, true);
    hideSnapGuide();
    isKeyframeDragging = false;
    document.body.classList.remove("keyframe-moving");
    if (event.currentTarget && event.currentTarget.classList) event.currentTarget.classList.remove("is-dragging");
    await loadJSX();
    const delta = previewTime - originalTime;
    const commitKeys = moveInfos.map(info => ({ layerIndex: info.layerIndex, propertyPath: info.propertyPath, keyIndex: info.keyIndex }));
    const result = commitKeys.length > 1
      ? await aeCall("TNT_movePropertyKeysByDelta", [commitKeys, delta])
      : await aeCall("TNT_setPropertyKeyTime", [layer.index, propertyPath, keyIndex, previewTime]);
    suppressSyncUntil = Date.now() + 500;
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not move keyframe.";
      await refreshLayers({ forceRender: true });
      return;
    }
    const movedSelection = normalizeSelectedKeyframes(
      result.movedKeys && result.movedKeys.length
        ? result.movedKeys
        : [{
            layerIndex: layer.index,
            propertyPath,
            keyIndex: Number(result.keyIndex || keyIndex)
          }]
    );
    selectedKeyframes = movedSelection;
    renderKeyframeSelectionOnly();
    await refreshLayers({
      forceRender: true,
      preserveKeyframeSelection: movedSelection
    });
  };

  document.addEventListener("mousemove", applyPreview, true);
  document.addEventListener("mouseup", finish, true);
  applyPreview(event);
}

function renderKeyframeMode() {
  if (!prepareTimelineForRender()) return;
  document.body.classList.add("keyframe-mode");
  if (!state.comp || !state.layers.length) {
    timelineEl.innerHTML = `<div class="empty">No comp/layers found. Select or open an active composition.</div>`;
    drawRuler();
    updateFilterButtons();
    updatePlayhead();
    updateHorizontalScrollBar();
    return;
  }

  fitTimelineToPanel();
  drawRuler();
  renderCompMarkers();
  timelineEl.style.width = `${timelineContentWidth()}px`;
  updateHorizontalScrollBar();
  updateFilterButtons();

  const rows = buildKeyframeRows();
  if (!rows.length) {
    timelineEl.innerHTML = `<div class="empty">No layers match this filter.</div>`;
    renderProtectedRegionOverlays(1);
    updatePlayhead();
    return;
  }

  rows.forEach(row => {
    const track = document.createElement("div");
    track.className = row.type === "property" ? "track keyframe-property-row" : "track keyframe-layer-row";
    if (row.type === "layer") {
      track.dataset.layerIndex = row.layer.index;
      if (state.selectedLayerIndices.includes(row.layer.index)) track.classList.add("selected");
      if (state.selectedLayerIndices.includes(row.layer.index) &&
          Number(row.layer.index) === Number(lastSelectedLayerIndex)) {
        track.classList.add("last-selected");
      }
    }

    const label = document.createElement("div");
    label.className = "track-label";
    if (row.type === "layer") {
      const props = keyframeRowProperties(row.layer);
      const expanded = !!expandedKeyframeLayers[row.layer.index];
      label.innerHTML = `<button type="button" class="property-disclosure${expanded ? " open" : ""}" title="${expanded ? "Collapse properties" : "Expand properties"}"></button><span class="keyframe-track-name">V${row.layer.index}</span>`;
      const disclosure = label.querySelector(".property-disclosure");
      disclosure.disabled = !props.length;
      disclosure.addEventListener("mousedown", e => e.stopPropagation(), true);
      disclosure.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        expandedKeyframeLayers[row.layer.index] = !expandedKeyframeLayers[row.layer.index];
        render();
      });
      track.addEventListener("mousedown", event => {
        if (event.detail > 1) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (event.button !== 0 || event.target.closest(".property-disclosure")) return;
        event.preventDefault();
        selectLayer(row.layer.index, event.shiftKey || event.ctrlKey || event.metaKey);
      });
      track.addEventListener("dblclick", event => {
        if (event.target.closest(".property-disclosure") || !row.layer.sourceCompId) return;
        event.preventDefault();
        event.stopPropagation();
        openLayerSourceComp(row.layer);
      });
      if (row.layer.outPoint > visibleStart && row.layer.inPoint < visibleStart + visibleDuration) {
        const clip = document.createElement("div");
        const clipStart = Math.max(row.layer.inPoint, visibleStart);
        const clipEnd = Math.min(row.layer.outPoint, visibleStart + visibleDuration);
        const selectedNow = state.selectedLayerIndices.includes(row.layer.index);
        const lastSelectedNow = selectedNow && Number(row.layer.index) === Number(lastSelectedLayerIndex);
        const labelColorValue = labelColor(row.layer.label);
        clip.className = "clip keyframe-focus-clip" + (selectedNow ? " selected" : "") + (lastSelectedNow ? " last-selected" : "") + (row.layer.isMissingMedia ? " missing-media" : "") + (!row.layer.enabled ? " disabled-layer" : "") + (row.layer.locked ? " locked-layer" : "");
        clip.style.left = `${timeToX(clipStart)}px`;
        clip.style.width = `${Math.max(12, (clipEnd - clipStart) * pixelsPerSecond)}px`;
        clip.style.backgroundColor = labelColorValue;
        clip.style.setProperty("--clip-base-color", labelColorValue);
        clip.style.setProperty("--index-bg", darkerHex(labelColorValue, 0.42));
        clip.dataset.layerIndex = row.layer.index;
        clip.dataset.clipStart = clipStart;
        clip.title = `${row.layer.name} | AE layer ${row.layer.index} | label ${row.layer.label}${row.layer.isMissingMedia ? " | Missing media" + (row.layer.missingMediaPath ? ": " + row.layer.missingMediaPath : "") : ""}`;
        clip.innerHTML = `<span class="clip-index">${row.layer.index}</span>${row.layer.isMissingMedia ? '<span class="missing-media-icon" title="Missing media">!</span>' : ""}<span class="clip-name">${escapeHtml(row.layer.name)}</span>`;
        clip.addEventListener("contextmenu", event => {
          event.preventDefault();
          event.stopPropagation();
          if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event, row.layer)) return;
          const selectedIndices = state.selectedLayerIndices || [];
          const isLayerSelected = selectedIndices.includes(row.layer.index);
          if (!isLayerSelected) {
            state.selectedLayerIndices = [row.layer.index];
            renderSelectionOnly();
            selectLayer(row.layer.index, false);
          }
          showLayerMenu(event, row.layer);
        });
        track.appendChild(clip);
      }
    } else {
      timelineEl.appendChild(renderPropertyTrack(row.layer, row.property));
      return;
    }

    track.appendChild(label);
    timelineEl.appendChild(track);
  });

  timelineEl.style.setProperty("--track-fill-start", `${rows.length * TRACK_HEIGHT}px`);
  renderProtectedRegionOverlays(rows.length);
  updatePlayhead();
}

async function selectLayerProperty(layerIndex, propertyPath) {
  suppressSyncUntil = Date.now() + 700;
  state.selectedLayerIndices = [Number(layerIndex)];
  if (timelineMode === "keyframe" && selectedKeyframes.length) {
    clearKeyframeSelectionLocally({ closeEase: true });
  }
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectLayerProperty", [layerIndex, propertyPath]);
  if (!result.ok) statusEl.textContent = result.error || "Could not select property.";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
}

function isLayerMenuOpen() {
  return !!(layerMenuEl && layerMenuEl.classList.contains("open"));
}
async function refreshLayers(options = {}) {
  if (QUICK_PANEL_MODE) {
    await refreshQuickPanelState();
    return;
  }
  if (panelSyncPaused && !options.forceRender) return;
  const preservedKeyframes = Array.isArray(options.preserveKeyframeSelection)
    ? normalizeSelectedKeyframes(options.preserveKeyframeSelection)
    : null;
  await loadJSX();
  const result = await aeCall("TNT_getTimelineData", [!!options.preferNative]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not read active comp.";
    state = { comp: null, layers: [], selectedLayerIndices: [], compMarkers: [] };
    selectedKeyframes = [];
    activeLayerFilter = null;
    activeLayerFilterScopeIndices = null;
    lastSignature = "";
    if (!isLayerMenuOpen() || options.forceRender) render();
    return;
  }
  const previousCompId = state.comp && Number(state.comp.id || 0);
  const nextCompId = result.comp && Number(result.comp.id || 0);
  if (activeLayerFilterScopeIndices && previousCompId && nextCompId !== previousCompId) {
    activeLayerFilter = null;
    activeLayerFilterScopeIndices = null;
  }
  state = result;
  selectedKeyframes = preservedKeyframes || normalizeSelectedKeyframes(result.selectedKeyframes || []);
  lastSignature = timelineSignature(result);
  lastLayerFingerprint = result.comp && result.comp.layerFingerprint ? result.comp.layerFingerprint : "";
  updateStatus();
  if ((isLayerMenuOpen() || isMarkerDragging) && !options.forceRender) {
    pendingMenuRefresh = true;
    renderSelectionOnly();
    updatePlayhead();
    return;
  }
  pendingMenuRefresh = false;
  render();
  if (options.forceRender && !options.skipSettledRefresh) {
    scheduleSettledActionRefresh({
      includeSelectedKeyframes: !!options.includeSelectedKeyframes
    });
  }
}

function applyTimelineStructureResult(result, options = {}) {
  if (!result || !result.ok) return false;
  const previousLayers = state.layers || [];
  const previousById = {};
  previousLayers.forEach(layer => {
    if (layer && layer.layerId) previousById[String(layer.layerId)] = layer;
  });
  const layers = (result.layers || []).map(layer => {
    const previous = layer.layerId ? previousById[String(layer.layerId)] : null;
    if (!previous) return layer;
    return Object.assign({}, previous, layer, {
      hasKeyframes: !!previous.hasKeyframes,
      keyframes: previous.keyframes || [],
      animatedProperties: previous.animatedProperties || [],
      transformProperties: previous.transformProperties || [],
      markers: previous.markers || []
    });
  });
  state = Object.assign({}, state, {
    comp: Object.assign({}, state.comp || {}, result.comp || {}),
    layers,
    selectedLayerIndices: result.selectedLayerIndices || []
  });
  updateStatus();
  render();
  if (!options.skipSettledRefresh) {
    scheduleSettledActionRefresh({
      includeSelectedKeyframes: !!options.includeSelectedKeyframes,
      delay: options.delay || PANEL_ACTION_REFRESH_DELAY_MS
    });
  }
  return true;
}

async function refreshLayerStructureAfterAction(options = {}) {
  if (timelineMode === "keyframe") {
    await refreshLayers({
      forceRender: true,
      skipSettledRefresh: true,
      includeSelectedKeyframes: !!options.includeSelectedKeyframes
    });
    return;
  }
  await loadJSX();
  const result = await aeCall("TNT_getTimelineStructureData");
  const applyOptions = Object.assign({}, options, { skipSettledRefresh: true });
  if (!applyTimelineStructureResult(result, applyOptions)) {
    await refreshLayers({ forceRender: true, skipSettledRefresh: true });
  }
}

async function syncTick(options = {}) {
  // Foreground sync follows playhead/selection. Background sync only watches edits.
  if (panelSyncPaused) return;
  if (isPlaying) return;
  if (syncInFlight) return;
  if (isScrubbing || isMarqueeSelecting || isMarkerDragging || isKeyframeDragging) return;
  if (!options.nativeSelection && Date.now() < suppressSyncUntil) return;
  if (isLayerMenuOpen()) return;
  // Background structure sync should not depend on mouse hover/focus; otherwise
  // native AE edits drift until the pointer returns to the CEP panel.
  if (options.background && document.hidden) return;
  // Keyframe mode can require expensive property traversal; avoid the idle CEP
  // eval loop that causes AE to flash the loading cursor while the user works.
  if (options.background && timelineMode === "keyframe") return;

  syncInFlight = true;
  try {
    await loadJSX();

    const includeSelectedKeyframes = timelineMode === "keyframe" &&
      !options.activation &&
      (!!options.selection || (!options.background && panelFocused));
    const sync = options.activation
      ? await aeCall("TNT_getActivationState")
      : await aeCall("TNT_getSyncState", [includeSelectedKeyframes, true]);
    if (!sync.ok) return;

    const layerFingerprint = sync.layerFingerprint || "";
    const layerEditDetected = layerFingerprint && layerFingerprint !== lastLayerFingerprint;
    const projectRevisionChanged =
      state.comp &&
      Number(sync.projectRevision || 0) !== Number(state.comp.projectRevision || 0);

    const needsFullRefresh = !state.comp ||
      (sync.compId && state.comp.id && Number(sync.compId) !== Number(state.comp.id)) ||
      sync.compName !== state.comp.name ||
      sync.numLayers !== state.layers.length ||
      Math.abs(sync.duration - state.comp.duration) > 1e-5 ||
      projectRevisionChanged ||
      layerEditDetected;

    if (needsFullRefresh) {
      await refreshLayers({
        preferNative: !!options.activation,
        skipSettledRefresh: true
      });
      return;
    }

    state.selectedLayerIndices = sync.selectedLayerIndices || [];
    if (!state.selectedLayerIndices.includes(Number(lastSelectedLayerIndex))) {
      lastSelectedLayerIndex = state.selectedLayerIndices.length
        ? Number(state.selectedLayerIndices[state.selectedLayerIndices.length - 1])
        : 0;
    }
    if (includeSelectedKeyframes) selectedKeyframes = normalizeSelectedKeyframes(sync.selectedKeyframes || []);
    updateStatus();
    renderSelectionOnly();

    if (options.background || !panelFocused) {
      return;
    }

    state.comp.time = sync.time;
    updatePlayhead();

  } finally {
    syncInFlight = false;
  }
}

function renderSelectionOnly(options = {}) {
  document.querySelectorAll(".clip").forEach(clip => {
    const idx = Number(clip.dataset.layerIndex);
    const selected = state.selectedLayerIndices.includes(idx);
    clip.classList.toggle("selected", selected);
    clip.classList.toggle("last-selected", selected && idx === Number(lastSelectedLayerIndex));
  });
  document.querySelectorAll(".keyframe-layer-row").forEach(row => {
    const idx = Number(row.dataset.layerIndex || 0);
    const selected = state.selectedLayerIndices.includes(idx);
    row.classList.toggle("selected", selected);
    row.classList.toggle("last-selected", selected && idx === Number(lastSelectedLayerIndex));
  });
  renderLayerSelectionPanel();
  if (!options.skipKeyframes) renderKeyframeSelectionOnly();
}

async function selectLayer(index, additive = false) {
  suppressSyncUntil = Date.now() + 700;
  index = Number(index || 0);
  const currentSelection = state.selectedLayerIndices || [];
  const preserveExistingGroup = !additive &&
    currentSelection.length > 1 &&
    currentSelection.includes(index);
  const effectiveAdditive = additive || preserveExistingGroup;
  lastSelectedLayerIndex = index;
  if (effectiveAdditive) {
    if (!currentSelection.includes(index)) {
      state.selectedLayerIndices = [...currentSelection, index];
    }
  } else {
    state.selectedLayerIndices = [index];
  }
  renderSelectionOnly();
  await loadJSX();
  const result = await aeCall("TNT_selectLayerByIndex", [index, effectiveAdditive]);
  if (result.ok) {
    state.selectedLayerIndices = result.selectedLayerIndices || [index];
    renderSelectionOnly();
  } else {
    statusEl.textContent = result.error || "Could not select layer.";
  }
}


function firstSelectedLayer() {
  const selected = state.selectedLayerIndices || [];
  if (!selected.length) return null;
  return (state.layers || []).find(l => l.index === selected[0]) || null;
}

function selectedLayersForMenu(fallbackLayer) {
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  const layers = selected.map(index => (state.layers || []).find(layer => layer.index === index)).filter(Boolean);
  if (!layers.length && fallbackLayer) return [fallbackLayer];
  return layers;
}

function selectedLayerForContextMenu(fallbackLayer) {
  const selected = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  if (!selected.length) return fallbackLayer || null;

  const fallbackIndex = Number(fallbackLayer && fallbackLayer.index);
  if (fallbackLayer && selected.includes(fallbackIndex)) return fallbackLayer;

  const lastSelected = (state.layers || []).find(layer =>
    selected.includes(Number(layer.index)) &&
    Number(layer.index) === Number(lastSelectedLayerIndex)
  );
  if (lastSelected) return lastSelected;

  return (state.layers || []).find(layer => selected.includes(Number(layer.index))) || fallbackLayer || null;
}

function showSelectedLayerMenu(event, fallbackLayer) {
  const layer = selectedLayerForContextMenu(fallbackLayer);
  if (!layer) return false;
  event.preventDefault();
  event.stopPropagation();
  showLayerMenu(event, layer);
  return true;
}

function hideLayerMenu() {
  if (!layerMenuEl) return;
  const hadPendingRefresh = pendingMenuRefresh;
  layerMenuPinned = false;
  pendingMenuRefresh = false;
  layerMenuEl.classList.remove("open");
  layerMenuEl.setAttribute("aria-hidden", "true");
  layerMenuEl.innerHTML = "";
  if (hadPendingRefresh) {
    requestAnimationFrame(() => render());
  }
}

function buildLayerMenuLabelSwatches(currentLabel) {
  const swatches = [];
  for (let i = 0; i <= 16; i++) {
    const color = i === 0 ? "#ffffff" : labelColor(i);
    const active = Number(currentLabel) === i ? " active" : "";
    const name = AE_LABEL_NAMES[i] || `Label ${i}`;
    swatches.push(`<button type="button" class="label-swatch${active}" data-action="label" data-label="${i}" title="${escapeHtml(name)}" style="--swatch:${color}"></button>`);
  }
  return swatches.join("");
}

function buildKeyframeMenuLabelSwatches() {
  return buildLayerMenuLabelSwatches(0);
}

function numericValueFromKeyframeInput(input) {
  const first = String(input && input.value || "").split(",")[0];
  const value = Number(first);
  return Number.isFinite(value) ? value : 0;
}

function beginKeyframeValueDrag(event, input) {
  if (!input || input.disabled || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startValue = numericValueFromKeyframeInput(input);
  const precision = event.shiftKey ? 0.1 : 1;
  const onMove = moveEvent => {
    moveEvent.preventDefault();
    const next = startValue + Math.round((moveEvent.clientX - startX) * precision * 10) / 10;
    input.value = String(next);
  };
  const onUp = async () => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    await applyKeyframeValueInput(input);
  };
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

async function applyKeyframeValueInput(input) {
  if (!input || input.disabled || !selectedKeyframes.length) return;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedKeyframeValue", [selectedKeyframes, input.value]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not set keyframe value.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

function menuShortcutLabel(shortcut) {
  return `<em class="menu-shortcut">${escapeHtml(shortcut || "")}</em>`;
}

function menuShortcutKeys(keys) {
  return ` data-menu-keys="${escapeHtml(keys || "")}"`;
}

function undoShortcutLabel() {
  return "Ctrl+Z";
}

const LAYER_CONTEXT_KINDS = {
  comp: { label: "Comps", singleLabel: "Comp", color: "#5da8ff" },
  shape: { label: "Shapes", singleLabel: "Shape", color: "#42d680" },
  text: { label: "Text", singleLabel: "Text", color: "#f5c84b" },
  media: { label: "Media", singleLabel: "Media", color: "#d885ff" },
  missing: { label: "Missing Media", singleLabel: "Missing Media", color: "#ff5d5d" },
  null: { label: "Nulls", singleLabel: "Null", color: "#a7adb8" },
  adjustment: { label: "Adjustments", singleLabel: "Adjustment", color: "#7fdbd3" },
  camera: { label: "Cameras", singleLabel: "Camera", color: "#ff9f43" },
  light: { label: "Lights", singleLabel: "Light", color: "#ffe66d" },
  layer: { label: "Layers", singleLabel: "Layer", color: "#8f98a8" }
};

function layerContextKind(layer) {
  const type = String(layer && layer.type || "").toLowerCase();
  if (layer && layer.isMissingMedia) return "missing";
  if (layer && layer.sourceCompId) return "comp";
  if (type === "shape") return "shape";
  if (type === "text") return "text";
  if (type === "null") return "null";
  if (type === "adjustment") return "adjustment";
  if (type === "camera") return "camera";
  if (type === "light") return "light";
  if (layer && layer.isMedia) return "media";
  return "layer";
}

function buildLayerMenuContext(layers) {
  const counts = {};
  (layers || []).forEach(layer => {
    const kind = layerContextKind(layer);
    counts[kind] = (counts[kind] || 0) + 1;
  });
  const kinds = Object.keys(counts);
  const count = (layers || []).length;
  const mixed = kinds.length > 1;
  const title = mixed
    ? "General Menu"
    : `${count > 1 ? "Many" : "Single"} ${(LAYER_CONTEXT_KINDS[kinds[0]] || LAYER_CONTEXT_KINDS.layer)[count > 1 ? "label" : "singleLabel"]}`;
  const details = kinds.map(kind => `${counts[kind]} ${(LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer)[counts[kind] > 1 ? "label" : "singleLabel"]}`);
  return { layers, count, counts, kinds, mixed, title, subtitle: details.join(" / ") };
}

function buildLayerMenuContextHeader(context) {
  const kinds = context.kinds.length ? context.kinds : ["layer"];
  const total = Math.max(1, context.count || 1);
  const strip = kinds.map(kind => {
    const meta = LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer;
    const width = Math.max(8, Math.round(((context.counts[kind] || 1) / total) * 100));
    return `<span style="--context-color:${meta.color};--context-width:${width}%"></span>`;
  }).join("");
  const chips = kinds.map(kind => {
    const meta = LAYER_CONTEXT_KINDS[kind] || LAYER_CONTEXT_KINDS.layer;
    const filter = kind === "layer" ? "" : kind;
    const label = `${context.counts[kind] || 0} ${meta.label}`;
    return `<button type="button" data-action="contextFilter" data-context-filter="${escapeHtml(filter)}" style="--context-color:${meta.color}" title="Focus selection and keep ${escapeHtml(meta.label)}">${escapeHtml(label)}</button>`;
  }).join("");
  return `
    <div class="layer-menu-context-strip">${strip}</div>
    <div class="layer-menu-context">
      <div>
        <strong>${escapeHtml(context.title)}</strong>
        <em>${escapeHtml(context.subtitle || "Selection")}</em>
      </div>
      <div class="layer-menu-context-chips">${chips}</div>
    </div>
  `;
}

function layerMenuRow(action, label, detail, keys) {
  return `<button type="button" class="menu-row" data-action="${escapeHtml(action)}"${keys ? menuShortcutKeys(keys) : ""}><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "")}</em></button>`;
}

function layerMenuTntRow(functionName, label, detail, args = [], keys = "") {
  const encodedArgs = encodeURIComponent(JSON.stringify(args || []));
  return `<button type="button" class="menu-row" data-action="tntCommand" data-tnt-function="${escapeHtml(functionName)}" data-tnt-args="${escapeHtml(encodedArgs)}"${keys ? menuShortcutKeys(keys) : ""}><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "Panel")}</em></button>`;
}

function layerMenuAddLayerRow(type, label, detail) {
  return `<button type="button" class="menu-row" data-action="addLayer" data-layer-type="${escapeHtml(type)}"><span>${escapeHtml(label)}</span><em>${escapeHtml(detail || "")}</em></button>`;
}

function buildLayerMenuContextRows(context, layer) {
  const has = kind => !!context.counts[kind];
  const rows = [];
  const selectedCount = Number(context.count || 0);
  const targetLayer = (state.layers || []).find(item => Number(item.index) === Number(lastSelectedTargetIndex()));
  const targetDetail = targetLayer
    ? `Target: ${targetLayer.index} ${targetLayer.name || "Layer"}`
    : "Last selected layer is target";
  if (has("comp")) {
    rows.push(`<div class="layer-menu-section-title">Comp Actions</div>`);
    if (layer && layer.sourceCompId) rows.push(layerMenuRow("openSourceComp", "Open Source Comp", layer.sourceCompName || "Precomp"));
    if (layer && layer.sourceCompId) rows.push(layerMenuRow("renameSourceComp", "Rename Source Comp...", layer.sourceCompName || "Project comp"));
  }
  if (has("text")) {
    rows.push(`<div class="layer-menu-section-title">Text Actions</div>`);
    rows.push(layerMenuRow("setTextContent", "Set Text Content...", "Selected text"));
    rows.push(layerMenuRow("findReplaceText", "Find / Replace Text...", "Selected text"));
    rows.push(layerMenuTntRow("applyTextAnimMaster", "Text Anim In+Out Up", "Text", ["up", 3, true, true, false, 0.35, 0.35, "both"]));
    rows.push(layerMenuTntRow("applyTextAnimBounce", "Text Bounce In Up", "Text", ["up", 3, true, true, false, 0.35, 0.35, "in"]));
  }
  if (has("shape")) {
    rows.push(`<div class="layer-menu-section-title">Shape Actions</div>`);
    rows.push(layerMenuTntRow("trimPathsInOut", "Trim Paths In+Out", "Shape", [{ inTime: 1, outTime: 1, easeIn: 75, easeOut: 75 }]));
    rows.push(layerMenuTntRow("addDashesToStroke", "Add Dashes to Stroke", "Shape"));
    rows.push(layerMenuTntRow("swapFillStroke", "Swap Fill / Stroke", "Shape"));
    rows.push(layerMenuTntRow("shapeToMask", "Shape to Mask", "Shape"));
  }
  if (has("media") || has("missing") || has("comp")) {
    rows.push(`<div class="layer-menu-section-title">Source Actions</div>`);
    rows.push(layerMenuTntRow("toggleEffects", "Toggle Effects", "Selected layers"));
    rows.push(layerMenuTntRow("copyEffects", "Copy Effects", "Selected layers"));
  }
  if (selectedCount > 1) {
    rows.push(`<div class="layer-menu-section-title">Relationship Actions</div>`);
    rows.push(layerMenuRow("matteToLastSelected", "Matte to Last Selected", targetDetail));
    rows.push(layerMenuRow("parentToLastSelected", "Parent to Last Selected", targetDetail));
    rows.push(layerMenuTntRow("parentToNull", "Parent to Null", "Selected layers"));
  }
  rows.push(`<div class="layer-menu-section-title">Selection Actions</div>`);
  rows.push(layerMenuTntRow("precomposeSelected", "Precompose Selected", `${context.count} layer${context.count === 1 ? "" : "s"}`));
  rows.push(layerMenuRow("parentToTarget", "Parent to Target...", "Type layer number or name"));
  rows.push(layerMenuTntRow("soloSelected", "Solo Selected", "Selected layers"));
  rows.push(layerMenuTntRow("focusSelected", "Focus Selected", "Selected layers"));
  return rows.join("");
}

function handleLayerMenuShortcut(event) {
  if (event.__tntShortcutHandled || !isLayerMenuOpen()) return false;
  const shortcutKey = shortcutKeyForEvent(event);
  if (!shortcutKey) return false;
  const suppressedUntil = suppressPanelShortcutKeys[shortcutKey] || 0;
  if (Date.now() <= suppressedUntil && event.type !== "keydown") {
    consumeShortcutEvent(event, shortcutKey);
    return true;
  }
  const tag = (event.target && event.target.tagName || "").toLowerCase();
  const isEditable = tag === "input" || tag === "textarea" || tag === "select" || (event.target && event.target.isContentEditable);
  if (isEditable && shortcutKey !== "escape") return false;
  if (shortcutKey === "escape") {
    event.__tntShortcutHandled = true;
    consumeShortcutEvent(event, shortcutKey);
    hideLayerMenu();
    focusPanel(2);
    return true;
  }
  const buttons = Array.prototype.slice.call(layerMenuEl.querySelectorAll("button[data-menu-keys]"));
  const button = buttons.find(btn => {
    const keys = String(btn.dataset.menuKeys || "").split(",").map(key => key.trim()).filter(Boolean);
    return keys.indexOf(shortcutKey) >= 0;
  });
  if (!button || button.disabled) return false;
  event.__tntShortcutHandled = true;
  consumeShortcutEvent(event, shortcutKey);
  button.click();
  return true;
}

function positionLayerMenuAtEvent(event, options = {}) {
  if (!layerMenuEl || !event) return;
  const pad = Number(options.pad || 8);
  const preferredWidth = Math.max(300, Number(options.width || 360));
  const viewportWidth = Math.max(preferredWidth + pad * 2, window.innerWidth || preferredWidth + pad * 2);
  const viewportHeight = Math.max(180, window.innerHeight || 180);
  const rawX = Math.max(pad, Number(event.clientX || pad));
  const rawY = Math.max(pad, Number(event.clientY || pad));
  const x = Math.max(pad, Math.min(rawX, viewportWidth - preferredWidth - pad));
  const y = Math.max(pad, Math.min(rawY, viewportHeight - 180 - pad));
  const maxHeight = Math.max(180, Math.floor(viewportHeight - y - pad));
  const maxWidth = Math.min(420, Math.max(preferredWidth, Math.floor(viewportWidth - x - pad)));
  layerMenuEl.style.setProperty("--menu-left", `${Math.round(x)}px`);
  layerMenuEl.style.setProperty("--menu-top", `${Math.round(y)}px`);
  layerMenuEl.style.setProperty("--menu-width", `${Math.round(preferredWidth)}px`);
  layerMenuEl.style.setProperty("--menu-max-height", `${maxHeight}px`);
  layerMenuEl.style.setProperty("--menu-max-width", `${maxWidth}px`);
  layerMenuEl.style.left = `${Math.round(x)}px`;
  layerMenuEl.style.top = `${Math.round(y)}px`;
  layerMenuEl.style.width = `${Math.round(preferredWidth)}px`;
  layerMenuEl.style.maxHeight = `${maxHeight}px`;
  layerMenuEl.style.maxWidth = `${maxWidth}px`;
  layerMenuEl.classList.add("open");
  layerMenuEl.setAttribute("aria-hidden", "false");
}

function showKeyframeMenu(event) {
  if (!layerMenuEl || !selectedKeyframes.length) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;
  const count = selectedKeyframes.length;
  const scope = formatKeyframeSelectionScope(selectedKeyframes);
  const propertyNames = [];
  const seenPropertyNames = {};
  selectedKeyframes.forEach(key => {
    const layer = (state.layers || []).find(item => Number(item.index) === Number(key.layerIndex));
    const property = layer && (layer.animatedProperties || []).find(item => String(item.path || "") === String(key.propertyPath || ""));
    const label = property ? propertyLaneLabel(property) : "Property";
    if (!seenPropertyNames[label]) {
      seenPropertyNames[label] = true;
      propertyNames.push(label);
    }
  });
  layerMenuEl.innerHTML = `
    <div class="layer-menu-keyframe-context">
      <div class="layer-menu-keyframe-title"><b>K</b><strong>Keyframes</strong><span>${escapeHtml(scope)}</span></div>
      <div class="layer-menu-keyframe-properties">${propertyNames.map(name => `<span>${escapeHtml(name)}</span>`).join("")}</div>
    </div>
    <div class="layer-menu-section label-section">
      <div class="layer-menu-kicker">KEYFRAME LABEL COLOR</div>
      <div class="layer-menu-swatches">${buildKeyframeMenuLabelSwatches()}</div>
    </div>
    <div class="layer-menu-section keyframe-value-section">
      <div class="layer-menu-kicker keyframe-value-scrub" title="Drag horizontally to adjust numeric values">VALUE</div>
      <input id="keyframeValueInput" class="keyframe-value-input" type="text" value="Loading..." disabled spellcheck="false">
    </div>
    <button type="button" class="menu-row" data-action="undoAction"${menuShortcutKeys("ctrl+z")}><span>Undo</span>${menuShortcutLabel(undoShortcutLabel())}</button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="easyEase"${menuShortcutKeys("e")}><span>Ease Editor</span>${menuShortcutLabel("E")}</button>
    <button type="button" class="menu-row" data-action="applyEasyEase"${menuShortcutKeys("shift+e")}><span>Apply Easy Ease</span>${menuShortcutLabel("Shift+E")}</button>
    <button type="button" class="menu-row" data-action="placeholder-linear"><span>Linear Interpolation</span><em>Temporal</em></button>
    <button type="button" class="menu-row" data-action="placeholder-hold"><span>Hold Keyframe</span><em>Toggle hold</em></button>
    <button type="button" class="menu-row" data-action="placeholder-roving"><span>Rove Across Time</span><em>Spatial only</em></button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="placeholder-copy"><span>Copy Keyframes</span><em>${count} selected</em></button>
    <button type="button" class="menu-row" data-action="placeholder-paste"><span>Paste at Playhead</span><em>${formatTime(state.comp ? state.comp.time || 0 : 0)}</em></button>
    <button type="button" class="menu-row" data-action="deleteKeyframes"${menuShortcutKeys("4,numpad4,delete,backspace")}><span>Delete Keyframes</span>${menuShortcutLabel("4 / Delete")}</button>
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = e => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); };
  const valueInput = layerMenuEl.querySelector("#keyframeValueInput");
  const valueScrub = layerMenuEl.querySelector(".keyframe-value-scrub");
  if (valueInput && valueScrub) {
    loadJSX().then(() => aeCall("TNT_getKeyframeValueForEdit", [selectedKeyframes])).then(result => {
      if (!valueInput || !layerMenuEl.classList.contains("open")) return;
      if (result.ok && result.editable) {
        valueInput.disabled = false;
        valueInput.value = result.value || "0";
        valueScrub.textContent = result.propertyName ? `VALUE - ${result.propertyName}` : "VALUE";
      } else {
        valueInput.value = result.error || "Not editable";
      }
    });
    valueScrub.addEventListener("mousedown", e => beginKeyframeValueDrag(e, valueInput));
    valueInput.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); applyKeyframeValueInput(valueInput); }
      if (e.key === "Escape") { e.preventDefault(); hideLayerMenu(); }
    });
    valueInput.addEventListener("blur", () => applyKeyframeValueInput(valueInput));
  }
  layerMenuEl.onclick = async e => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "label") {
      const label = Number(btn.dataset.label || 0);
      const result = await aeCall("TNT_setSelectedKeyframeLabel", [selectedKeyframes, label]);
      if (!result.ok) statusEl.textContent = result.error || "Could not set keyframe label.";
      hideLayerMenu();
      await refreshLayers({ forceRender: true });
      return;
    }
    if (btn.dataset.action === "undoAction") {
      hideLayerMenu();
      await undoLastAeAction();
      return;
    }
    if (btn.dataset.action === "deleteKeyframes") {
      hideLayerMenu();
      await deleteSelectedKeyframes();
      return;
    }
    if (btn.dataset.action === "easyEase") {
      hideLayerMenu();
      showEaseDialog();
      return;
    }
    if (btn.dataset.action === "applyEasyEase") {
      hideLayerMenu();
      await applyEasyEaseDirect();
      return;
    }
    statusEl.textContent = `Placeholder keyframe action for ${count} selected keyframe${count === 1 ? "" : "s"}.`;
    hideLayerMenu();
  };
}

function showLayerMenu(event, layer) {
  if (!layerMenuEl || !layer) return;
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;
  const contextLayers = selectedLayersForMenu(layer);
  const context = buildLayerMenuContext(contextLayers);
  const selected = contextLayers.map(item => item.index);
  const labelName = AE_LABEL_NAMES[layer.label] || `Label ${layer.label || 0}`;
  layerMenuEl.innerHTML = `
    ${buildLayerMenuContextHeader(context)}
    <button type="button" class="menu-row" data-action="maskControl"${menuShortcutKeys("f")}><span>Mask Control...</span>${menuShortcutLabel("F")}</button>
    <button type="button" class="menu-row" data-action="effectsControl"><span>Effects...</span><em>Selected layer effects</em></button>
    <button type="button" class="menu-row" data-action="shapesControl"><span>Shapes...</span><em>Selected shape contents</em></button>
    <button type="button" class="menu-row" data-action="layerStyles"${menuShortcutKeys("s,shift+s")}><span>Layer Styles...</span>${menuShortcutLabel("S")}</button>
    <div class="layer-menu-separator"></div>
    <div class="layer-menu-section label-section">
      <div class="layer-menu-kicker">LABEL COLOR</div>
      <div class="layer-menu-swatches">${buildLayerMenuLabelSwatches(layer.label)}</div>
    </div>
    <button type="button" class="menu-row" data-action="undoAction"${menuShortcutKeys("ctrl+z")}><span>Undo</span>${menuShortcutLabel(undoShortcutLabel())}</button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="labelGroup"><span>Select Label Group</span><em>${escapeHtml(labelName)}</em></button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="hide"><span>${layer.enabled ? "Disable" : "Enable"}</span><em>Toggle clip enabled</em></button>
    <button type="button" class="menu-row" data-action="lock"><span>${layer.locked ? "Unlock" : "Lock"}</span><em>${layer.locked ? "Unlock layer" : "Lock layer"}</em></button>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="duplicateLayers"${menuShortcutKeys("d")}><span>Duplicate Selected Layers</span>${menuShortcutLabel("D")}</button>
    <button type="button" class="menu-row" data-action="splitLayers"${menuShortcutKeys("3,numpad3")}><span>Split at Playhead</span>${menuShortcutLabel("3")}</button>
    <button type="button" class="menu-row" data-action="setInPoint"${menuShortcutKeys("5,numpad5")}><span>Set In Point to Playhead</span>${menuShortcutLabel("5")}</button>
    <button type="button" class="menu-row" data-action="setOutPoint"${menuShortcutKeys("6,numpad6")}><span>Set Out Point to Playhead</span>${menuShortcutLabel("6")}</button>
    <button type="button" class="menu-row" data-action="deleteLayers"${menuShortcutKeys("4,numpad4,delete,backspace")}><span>Delete Selected Layers</span>${menuShortcutLabel("4 / Delete")}</button>
    ${buildLayerMenuContextRows(context, layer)}
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row" data-action="placeholder-speed"><span>Speed/Duration...</span><em>Change playback speed</em></button>
    <button type="button" class="menu-row" data-action="placeholder-fit"><span>Fit to Frame</span><em>Fit to Comp</em></button>
    <button type="button" class="menu-row" data-action="placeholder-rename"><span>Rename...</span><em>Change clip name</em></button>
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "contextFilter") {
      const filter = String(btn.dataset.contextFilter || "") || null;
      hideLayerMenu();
      setLayerViewFilter(filter, selected);
      return;
    }
    if (action === "labelGroup") return;
    if (action === "undoAction") {
      hideLayerMenu();
      await undoLastAeAction();
      return;
    }
    if (action === "renameSourceComp") {
      hideLayerMenu();
      await promptRenameSourceComp(layer);
      return;
    }
    if (action === "openSourceComp") {
      hideLayerMenu();
      await openLayerSourceComp(layer);
      return;
    }
    if (action === "setTextContent") {
      hideLayerMenu();
      await promptSetTextContent();
      return;
    }
    if (action === "findReplaceText") {
      hideLayerMenu();
      await promptFindReplaceText();
      return;
    }
    if (action === "parentToLastSelected") {
      hideLayerMenu();
      await parentToLastSelectedLayer();
      return;
    }
    if (action === "matteToLastSelected") {
      hideLayerMenu();
      await matteToLastSelectedLayer();
      return;
    }
    if (action === "parentToTarget") {
      hideLayerMenu();
      await promptParentToTargetLayer();
      return;
    }
    if (action === "tntCommand") {
      hideLayerMenu();
      let args = [];
      try { args = JSON.parse(decodeURIComponent(btn.dataset.tntArgs || "%5B%5D")); } catch (_) {}
      await runTntV3Command({ name: btn.textContent || "Panel Command", tntFunction: btn.dataset.tntFunction, args });
      return;
    }
    if (action === "duplicateLayers") {
      hideLayerMenu();
      await duplicateSelectedLayers(selected);
      return;
    }
    if (action === "splitLayers") {
      hideLayerMenu();
      await splitSelectedLayersAtPlayhead();
      return;
    }
    if (action === "setInPoint") {
      hideLayerMenu();
      await setSelectedLayerEndpoint("in");
      return;
    }
    if (action === "setOutPoint") {
      hideLayerMenu();
      await setSelectedLayerEndpoint("out");
      return;
    }
    if (action === "deleteLayers") {
      hideLayerMenu();
      await deleteSelectedLayers();
      return;
    }
    if (action === "layerStyles") {
      hideLayerMenu();
      openLayerStylePanel();
      return;
    }
    if (action === "maskControl") {
      hideLayerMenu();
      openMaskControlPanel();
      return;
    }
    if (action === "effectsControl") {
      hideLayerMenu();
      openEffectsControlPanel();
      return;
    }
    if (action === "shapesControl") {
      hideLayerMenu();
      openShapesControlPanel();
      return;
    }
    if (action.indexOf("placeholder") === 0) {
      statusEl.textContent = `Placeholder menu action for ${selected.length} selected layer(s).`;
      return;
    }
    if (action === "label") {
      const labelIndex = Number(btn.dataset.label || 0);
      await loadJSX();
      const result = await aeCall("TNT_setSelectedLayerLabel", [selected, layer.index, labelIndex]);
      if (!result.ok) {
        statusEl.textContent = result.error || "Could not update label color.";
        return;
      }
      hideLayerMenu();
      await refreshLayers({ forceRender: true });
      return;
    }
    hideLayerMenu();
    await loadJSX();
    const fn = action === "lock" ? "TNT_toggleSelectedLayerLock" : "TNT_toggleSelectedLayerVisibility";
    const result = await aeCall(fn, [selected, layer.index]);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update selected layers.";
      return;
    }
    await refreshLayers({ forceRender: true });
  };
}

function showAddLayerMenu(event) {
  if (!layerMenuEl || !state.comp) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 1200;
  const timeLabel = formatTime(state.comp.time || 0);
  layerMenuEl.innerHTML = `
    <div class="layer-menu-section-title">Add Layer at ${escapeHtml(timeLabel)}</div>
    ${layerMenuAddLayerRow("null", "Null", "Centered at playhead")}
    ${layerMenuAddLayerRow("shape", "Shape Layer", "Empty shape layer")}
    ${layerMenuAddLayerRow("text", "Text", "Point text")}
    ${layerMenuAddLayerRow("boxtext", "Box Text", "Paragraph text box")}
    ${layerMenuAddLayerRow("solid", "Solid", "Comp-sized solid")}
    ${layerMenuAddLayerRow("adjustment", "Adjustment Layer", "Comp-sized adjustment")}
    ${layerMenuAddLayerRow("camera", "Camera", "Default camera")}
    ${layerMenuAddLayerRow("light", "Light", "Default light")}
  `;
  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action !== "addLayer") return;
    const type = String(btn.dataset.layerType || "");
    hideLayerMenu();
    await createLayerFromFxConsole(type);
  };
}

function showMarkerContextMenu(event, marker, options = {}) {
  if (!layerMenuEl || !marker) return;
  event.preventDefault();
  event.stopPropagation();
  layerMenuOpenedAt = Date.now();
  layerMenuPinned = true;
  pendingMenuRefresh = false;
  suppressSyncUntil = Date.now() + 3500;

  const markerType = options.type || "comp";
  const label = markerText(marker) || "Marker";
  const scope = markerType === "layer" ? "Layer marker" : "Comp marker";
  const durationValue = formatMarkerDurationForInput(Math.max(0, Number(marker.duration || 0)));
  const protectedChecked = marker.protectedRegion ? " checked" : "";
  layerMenuEl.innerHTML = `
    <div class="layer-menu-section label-section marker-editor-section">
      <div class="layer-menu-kicker">${escapeHtml(scope)} Label Color</div>
      <div class="layer-menu-swatches">${buildLayerMenuLabelSwatches(marker.label || 0)}</div>
    </div>
    <div class="layer-menu-section marker-editor-section">
      <label class="marker-editor-field">
        <span>Duration</span>
        <div class="marker-duration-row">
          <input id="markerDurationInput" type="text" value="${escapeHtml(durationValue)}" spellcheck="false">
          <button type="button" class="marker-duration-reset" data-action="marker-reset-duration" title="Reset duration"></button>
        </div>
      </label>
      <label class="marker-editor-field">
        <span>Comment/Text</span>
        <textarea id="markerCommentInput" spellcheck="false">${escapeHtml(marker.comment || "")}</textarea>
      </label>
      <label class="marker-editor-toggle">
        <input id="markerProtectedInput" type="checkbox"${protectedChecked}>
        <span>Protected region</span>
      </label>
    </div>
    <div class="layer-menu-separator"></div>
    <button type="button" class="menu-row marker-confirm-row" data-action="marker-confirm"><span>Confirm</span><em>${formatTime(marker.time || 0)}</em></button>
  `;

  positionLayerMenuAtEvent(event, { width: 336 });
  layerMenuEl.onmousedown = (e) => { e.stopPropagation(); };
  layerMenuEl.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); };
  layerMenuEl.querySelectorAll(".label-swatch").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      layerMenuEl.querySelectorAll(".label-swatch.active").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  layerMenuEl.onclick = async (e) => {
    const btn = e.target.closest && e.target.closest("button[data-action]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    if (btn.dataset.action === "marker-reset-duration") {
      const input = layerMenuEl.querySelector("#markerDurationInput");
      if (input) input.value = "00:00:00";
      return;
    }
    if (btn.dataset.action !== "marker-confirm") return;
    const duration = parseDurationInput((layerMenuEl.querySelector("#markerDurationInput") || {}).value);
    if (duration === null || duration < 0) {
      statusEl.textContent = "Enter a valid marker duration.";
      return;
    }
    const comment = (layerMenuEl.querySelector("#markerCommentInput") || {}).value || "";
    const activeSwatch = layerMenuEl.querySelector(".label-swatch.active");
    const labelIndex = activeSwatch ? Number(activeSwatch.dataset.label || 0) : Number(marker.label || 0);
    const protectedRegion = !!(layerMenuEl.querySelector("#markerProtectedInput") || {}).checked;
    hideLayerMenu();
    await loadJSX();
    const fn = markerType === "layer" ? "TNT_updateLayerMarkerDetails" : "TNT_updateCompMarkerDetails";
    const args = markerType === "layer"
      ? [options.layerIndex || 0, marker.keyIndex, duration, comment, labelIndex, protectedRegion]
      : [marker.keyIndex, duration, comment, labelIndex, protectedRegion];
    const result = await aeCall(fn, args);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update marker.";
      return;
    }
    await refreshLayers({ forceRender: true });
  };
}

function bindMarkerContextMenu(el, marker, options = {}) {
  el.addEventListener("contextmenu", e => showMarkerContextMenu(e, marker, options));
}
function timeFromPointerEvent(event, options = {}) {
  if (!state.comp) return 0;

  // Use the scroll container viewport as the coordinate origin.
  // Do NOT use rulerWrapEl.getBoundingClientRect() here: the ruler is a wide
  // sticky/scrolling element, so its left edge changes as you scroll. Adding
  // scrollLeft on top of that made scrubbing become "relative" near the ends.
  const viewportRect = scrollAreaEl.getBoundingClientRect();
  const contentX = event.clientX - viewportRect.left + scrollAreaEl.scrollLeft;
  const time = visibleStart + (contentX - currentLeftGutter()) / pixelsPerSecond;
  const minTime = visibleStart;
  const maxTime = Math.min(state.comp.duration, visibleStart + visibleDuration);
  const clamped = Math.max(minTime, Math.min(maxTime, time));
  const snapped = snapTimeToTargets(clamped, {
    targetSnap: options.targetSnap !== false && event.shiftKey,
    minTime,
    maxTime
  });

  if (options.showGuide !== false) showSnapGuide(snapped.time, event.shiftKey, snapped.target);
  return Math.max(minTime, Math.min(maxTime, snapped.time));
}

function normalizeDroppedPath(path) {
  let value = String(path || "").trim();
  if (!value) return "";
  value = value.replace(/^file:\/\/localhost/i, "file://");
  value = value.replace(/^file:\/+/i, match => match.length > 7 ? "/" : "");
  try { value = decodeURIComponent(value); } catch (_) {}
  if (/^\/[A-Za-z]:\//.test(value)) value = value.slice(1);
  if (/^[A-Za-z]:[\\/]/.test(value)) return value.replace(/\//g, "\\");
  if (value.charAt(0) === "/") return value.replace(/\\/g, "/");
  return isMacPlatform() ? value.replace(/\\/g, "/") : value.replace(/\//g, "\\");
}

function droppedFilePaths(event) {
  const transfer = event.dataTransfer;
  const paths = [];
  if (!transfer) return paths;

  try {
    Array.prototype.forEach.call(transfer.files || [], file => {
      const path = file && (file.path || file.name);
      if (path) paths.push(normalizeDroppedPath(path));
    });
  } catch (_) {}

  try {
    Array.prototype.forEach.call(transfer.types || [], type => {
      const data = transfer.getData(type);
      if (!data) return;
      String(data).split(/\r?\n/).forEach(line => {
        const path = normalizeDroppedPath(line);
        if (path && (path.charAt(0) === "/" || path.indexOf("\\") >= 0 || /^[A-Za-z]:/.test(path))) paths.push(path);
      });
    });
  } catch (_) {}

  const seen = {};
  return paths.filter(path => {
    const key = String(path || "").toLowerCase();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function setTimelineDropActive(active) {
  if (!scrollAreaEl) return;
  document.body.classList.toggle("timeline-drop-active", !!active);
  scrollAreaEl.classList.toggle("drop-active", !!active);
  if (!active) hideDropInsertGuide();
}

function ensureDropInsertGuide() {
  if (dropInsertGuideEl) return dropInsertGuideEl;
  dropInsertGuideEl = document.createElement("div");
  dropInsertGuideEl.className = "drop-insert-guide";
  dropInsertGuideEl.setAttribute("aria-hidden", "true");
  document.body.appendChild(dropInsertGuideEl);
  return dropInsertGuideEl;
}

function dropPlacementFromPointer(event) {
  if (!state.comp) return { beforeIndex: 1, afterIndex: 0, y: 28 };
  const tracks = Array.prototype.slice.call(timelineEl.querySelectorAll(".track[data-drop-before-index]"));
  if (!tracks.length) return { beforeIndex: 1, afterIndex: 0, y: Math.max(28, event.clientY || 28) };

  const y = Number(event.clientY || 0);
  for (let i = 0; i < tracks.length; i++) {
    const rect = tracks[i].getBoundingClientRect();
    const boundary = rect.top + rect.height / 2;
    if (y < boundary) {
      return {
        beforeIndex: Number(tracks[i].dataset.dropBeforeIndex || 1),
        afterIndex: 0,
        y: rect.top
      };
    }
  }

  const lastRect = tracks[tracks.length - 1].getBoundingClientRect();
  return {
    beforeIndex: 0,
    afterIndex: Number(state.comp.numLayers || (state.layers || []).length || tracks[tracks.length - 1].dataset.dropAfterIndex || 0),
    y: lastRect.bottom
  };
}

function showDropInsertGuide(event) {
  if (!state.comp || timelineMode !== "edit") {
    hideDropInsertGuide();
    return;
  }
  const placement = dropPlacementFromPointer(event);
  const guide = ensureDropInsertGuide();
  const panelRect = document.body.getBoundingClientRect();
  guide.style.left = "0px";
  guide.style.right = "0px";
  guide.style.top = `${Math.max(28, Math.min(window.innerHeight - 2, placement.y - panelRect.top))}px`;
  guide.classList.add("show");
}

function hideDropInsertGuide() {
  if (dropInsertGuideEl) dropInsertGuideEl.classList.remove("show");
}

async function importDroppedItems(event) {
  if (!state.comp) {
    statusEl.textContent = "Open a comp before importing.";
    return;
  }
  const paths = droppedFilePaths(event);
  const time = snapTimeToFrame(timeFromPointerEvent(event, { targetSnap: false, showGuide: false }));
  const placement = timelineMode === "edit" ? dropPlacementFromPointer(event) : { beforeIndex: 0, afterIndex: 0 };
  suppressSyncUntil = Date.now() + 1500;
  await loadJSX();
  const result = await aeCall("TNT_importDroppedItems", [paths, time, placement.beforeIndex || 0, placement.afterIndex || 0]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not import dropped items.";
    return;
  }
  const imported = Number(result.importedCount || 0);
  const reused = Number(result.reusedCount || 0);
  const added = Number(result.addedCount || 0);
  statusEl.textContent = imported
    ? `Imported ${imported} file${imported === 1 ? "" : "s"} and added ${added} layer${added === 1 ? "" : "s"}.`
    : reused
      ? `Reused ${reused} Project item${reused === 1 ? "" : "s"} and added ${added} layer${added === 1 ? "" : "s"}.`
      : `Added ${added} Project item${added === 1 ? "" : "s"} as layer${added === 1 ? "" : "s"}.`;
  await refreshLayers({ forceRender: true });
}

async function setTimeFromPointer(event) {
  if (!state.comp) return;
  const time = timeFromPointerEvent(event);
  await setCompTime(time);
}


function previewCompTime(time) {
  if (!state.comp) return;
  const clamped = snapTimeToFrame(Math.max(0, Math.min(state.comp.duration || time, Number(time || 0))));
  state.comp.time = clamped;
  if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(clamped);
  updatePlayhead({ fast: true });
}

async function commitPreviewCompTime(time) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 700;
  await setCompTime(time);
  await syncTick();
}

async function setCompTime(time) {
  await loadJSX();
  const result = await aeCall("TNT_setTime", [snapTimeToFrame(time)]);
  if (result.ok) {
    state.comp.time = result.time;
    updateStatus();
    updatePlayhead();
  }
}

function timeFromDragDelta(startTime, deltaX) {
  if (!state.comp) return 0;
  const raw = Number(startTime || 0) + Number(deltaX || 0) / Math.max(1, pixelsPerSecond);
  return snapTimeToFrame(Math.max(0, Math.min(state.comp.duration || raw, raw)));
}

function beginTimeDisplayInteraction(event) {
  if (!state.comp || event.button !== 0 || isTimeDisplayEditing) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  const startX = event.clientX;
  const startTime = Number(state.comp.time || 0);
  let moved = false;
  let pendingTime = startTime;

  const onMove = moveEvent => {
    moveEvent.preventDefault();
    const dx = moveEvent.clientX - startX;
    if (!moved && Math.abs(dx) < 3) return;
    moved = true;
    isScrubbing = true;
    document.body.classList.add("playhead-scrubbing");
    suppressSyncUntil = Date.now() + 60000;
    pendingTime = timeFromDragDelta(startTime, dx);
    previewCompTime(pendingTime);
  };

  const onUp = async upEvent => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    if (!moved) {
      openTimeDisplayEditor();
      return;
    }
    if (upEvent) pendingTime = timeFromDragDelta(startTime, upEvent.clientX - startX);
    isScrubbing = false;
    document.body.classList.remove("playhead-scrubbing");
    await commitPreviewCompTime(pendingTime);
    focusPanel(2);
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

function openTimeDisplayEditor() {
  if (!state.comp || !timeDisplayEl || isTimeDisplayEditing) return;
  isTimeDisplayEditing = true;
  const originalTime = Number(state.comp.time || 0);
  timeDisplayEl.classList.add("editing");
  timeDisplayEl.innerHTML = `<input id="timeDisplayInput" class="time-display-input" type="text" spellcheck="false">`;
  const input = timeDisplayEl.querySelector("#timeDisplayInput");
  input.value = formatTime(originalTime);

  let closed = false;
  const close = async (apply) => {
    if (closed) return;
    closed = true;
    const nextTime = apply ? parseDurationInput(input.value) : originalTime;
    isTimeDisplayEditing = false;
    timeDisplayEl.classList.remove("editing");
    timeDisplayEl.innerHTML = "";
    if (apply && typeof nextTime === "number" && Number.isFinite(nextTime)) {
      await setCompTime(Math.max(0, Math.min(state.comp.duration || nextTime, nextTime)));
    } else {
      updateStatus();
    }
    focusPanel(2);
  };

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(false);
    }
  });
  input.addEventListener("blur", () => close(true));
  setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}

function beginMiddleScrub(event) {
  if (!state.comp || event.button !== 1) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  beginPlayheadPreviewDrag(event, { liveAeUpdate: true });
}

function beginScrub(event) {
  if (!state.comp) return;
  if (event.button !== 0 && event.button !== 1) return;
  event.preventDefault();
  event.stopPropagation();
  if (isPlaying) stopPlayback(false);
  beginPlayheadPreviewDrag(event, { liveAeUpdate: true });
}

function beginPlayheadPreviewDrag(event, options = {}) {
  isScrubbing = true;
  document.body.classList.add("playhead-scrubbing");
  suppressSyncUntil = Date.now() + 60000;

  const fps = state.comp ? state.comp.frameRate || 24 : 24;
  // Live AE scrubbing is intentionally capped to half frame-rate so dragging feels alive
  // without bringing back the heavy per-mousemove lag/loading cursor.
  const liveInterval = Math.max(42, Math.round(2000 / fps));
  const liveAeUpdate = options.liveAeUpdate !== false;

  let pendingTime = timeFromPointerEvent(event);
  let lastSentTime = pendingTime;
  let lastLiveSend = 0;
  let liveSendInFlight = false;
  let raf = 0;

  const sendLiveTimeToAe = async (time, force = false) => {
    if (!liveAeUpdate || liveSendInFlight) return;
    const now = performance.now();
    if (!force && now - lastLiveSend < liveInterval) return;
    lastLiveSend = now;
    lastSentTime = time;
    liveSendInFlight = true;
    try {
      await loadJSX();
      const result = await aeCall("TNT_setTime", [time]);
      if (result.ok && state.comp) {
        // Keep local state in sync, but do not full-render while dragging.
        state.comp.time = result.time;
        if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(result.time);
        updatePlayhead({ fast: true });
      }
    } finally {
      liveSendInFlight = false;
    }
  };

  const flushPreview = () => {
    raf = 0;
    previewCompTime(pendingTime);
    sendLiveTimeToAe(pendingTime, false);
  };
  const requestPreview = (moveEvent) => {
    pendingTime = timeFromPointerEvent(moveEvent);
    if (!raf) raf = requestAnimationFrame(flushPreview);
  };

  previewCompTime(pendingTime);
  sendLiveTimeToAe(pendingTime, true);

  const onMove = (moveEvent) => {
    if (!isScrubbing) return;
    moveEvent.preventDefault();
    requestPreview(moveEvent);
  };
  const onUp = async (upEvent) => {
    if (upEvent) pendingTime = timeFromPointerEvent(upEvent);
    isScrubbing = false;
    if (raf) cancelAnimationFrame(raf);
    document.body.classList.remove("playhead-scrubbing");
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
    previewCompTime(pendingTime);
    hideSnapGuide();

    // Final commit always wins, even if the throttled live update skipped the last few pixels.
    suppressSyncUntil = Date.now() + 700;
    if (Math.abs(lastSentTime - pendingTime) > 0.0001 || liveSendInFlight) {
      await commitPreviewCompTime(pendingTime);
    } else {
      await syncTick();
    }
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
}

function stopPlayback(commit = true) {
  playbackGeneration++;
  isPlaying = false;
  if (typeof playTimer === "number") {
    clearInterval(playTimer);
  }
  playTimer = null;
  if (playbackRaf) {
    cancelAnimationFrame(playbackRaf);
    playbackRaf = 0;
  }
  document.body.classList.remove("playback-active");
  playbackPendingAeTime = null;
  if (commit && state.comp) {
    suppressSyncUntil = Date.now() + 700;
    return setCompTime(state.comp.time || 0)
      .then(() => syncTick());
  }
  return Promise.resolve();
}

function startPlayback() {
  stopPlayback(false);
  if (!state.comp) return;
  const generation = ++playbackGeneration;
  isPlaying = true;
  document.body.classList.add("playback-active");
  playbackStartMs = performance.now();
  playbackStartTime = Number(state.comp.time || 0);
  playbackLastAeSendMs = 0;
  playbackLastAeFrame = -1;
  playbackAeInFlight = false;
  playbackPendingAeTime = null;
  playTimer = "raf";
  const fps = Math.max(1, Number(state.comp.frameRate || 30));
  const frameDuration = Number(state.comp.frameDuration || (1 / fps));
  // CEP can animate at display refresh, but CompItem.time is a host seek that
  // forces AE to render. Limit those seeks so they cannot starve input/rendering.
  const minimumAeSendInterval = Math.max(1000 / Math.min(fps, 15), AE_EVAL_MIN_GAP_MS);
  let adaptiveAeSendInterval = minimumAeSendInterval;

  const queuePlaybackTimeToAe = async (time, now) => {
    if (generation !== playbackGeneration) return;
    playbackPendingAeTime = time;
    if (playbackAeInFlight || now - playbackLastAeSendMs < adaptiveAeSendInterval) return;

    const nextTime = playbackPendingAeTime;
    playbackPendingAeTime = null;
    playbackAeInFlight = true;
    playbackLastAeSendMs = now;
    const requestStartedAt = performance.now();
    try {
      await aeCall("TNT_setTime", [nextTime]);
    } finally {
      if (generation === playbackGeneration) {
        playbackAeInFlight = false;
        const roundTripMs = Math.max(1, performance.now() - requestStartedAt);
        // Never saturate CEP's serialized ExtendScript bridge. Keep the local
        // rAF playhead smooth while matching AE as quickly as the comp permits.
        adaptiveAeSendInterval = Math.max(
          minimumAeSendInterval,
          Math.min(180, roundTripMs * 1.15)
        );
      }
    }
  };

  const tick = now => {
    if (!isPlaying || generation !== playbackGeneration || !state.comp) return;
    const duration = Math.max(0, Number(state.comp.duration || 0));
    let time = playbackStartTime + Math.max(0, now - playbackStartMs) / 1000;
    if (duration > 0 && time >= duration) {
      time = duration;
      state.comp.time = time;
      updateStatus();
      updatePlayhead({ time, fast: true });
      stopPlayback();
      return;
    }
    state.comp.time = time;
    if (timeDisplayEl && !isTimeDisplayEditing) timeDisplayEl.textContent = formatTime(time);
    updatePlayhead({ time, fast: true });
    const frameIndex = Math.max(0, Math.min(
      Math.round(duration / Math.max(frameDuration, 1e-6)),
      Math.floor((time + frameDuration * 0.25) / Math.max(frameDuration, 1e-6))
    ));
    if (frameIndex !== playbackLastAeFrame) {
      playbackLastAeFrame = frameIndex;
      queuePlaybackTimeToAe(frameIndex * frameDuration, now);
    }
    playbackRaf = requestAnimationFrame(tick);
  };

  playbackRaf = requestAnimationFrame(tick);
}

function stopPlaybackOnTimelinePointer(event) {
  if (!isPlaying || !event) return;
  if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
  const target = event.target;
  if (!target || !(scrollAreaEl === target || (scrollAreaEl.contains && scrollAreaEl.contains(target)))) return;
  if (target.closest && target.closest("#assistantHub")) return;
  stopPlayback(false).then(() => focusPanel(2));
}

function togglePlay() {
  if (isPlaying) stopPlayback();
  else startPlayback();
  focusPanel(1);
}

function zoomTimeline(multiplier) {
  if (!state.comp) return;
  const oldPixels = pixelsPerSecond;
  const playheadTime = state.comp.time || 0;
  const fitPps = fittedPixelsPerSecond();

  pixelsPerSecond = Math.max(
    fitPps,
    Math.min(MAX_PIXELS_PER_SECOND, pixelsPerSecond * multiplier)
  );

  // If we are back at fit, exit manual zoom mode so resize/refresh keeps it fitted.
  userZoomed = pixelsPerSecond > fitPps + 0.01;
  if (Math.abs(oldPixels - pixelsPerSecond) < 0.01) return;

  render();

  // Keep the playhead as the visual center of the zoom, instead of zooming from timeline start.
  const playheadX = timeToX(playheadTime);
  scrollAreaEl.scrollLeft = Math.max(0, playheadX - timelineViewportWidth() / 2);
}


function isInRuler(target) {
  return target.closest && target.closest(".time-ruler-wrap");
}

function handleTimelineMouseDown(event) {
  if (!state.comp || isInRuler(event.target)) return;
  if (event.target.closest && event.target.closest("#assistantHub")) return;

  // Middle mouse click places the playhead; hold + drag scrubs it.
  if (event.button === 1) {
    beginMiddleScrub(event);
    return;
  }

  if (event.button !== 0) return;
  if (event.target.closest && event.target.closest(".clip")) return;
  if (event.target.closest && event.target.closest(".property-keyframe-marker")) return;
  hideLayerMenu();
  beginMarqueeSelect(event);
}

function clipRectToLayerIndex(clip) {
  return Number(clip.dataset.layerIndex);
}

function rectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function beginMarqueeSelect(event, initialMoveEvent) {
  isMarqueeSelecting = true;
  event.preventDefault();

  const additive = event.shiftKey || event.ctrlKey || event.metaKey;
  const startX = event.clientX;
  const startY = event.clientY;
  let lastClientX = startX;
  let lastClientY = startY;
  let autoScrollTimer = 0;
  selectionBoxEl.style.display = "block";
  selectionBoxEl.style.left = `${startX}px`;
  selectionBoxEl.style.top = `${startY}px`;
  selectionBoxEl.style.width = `0px`;
  selectionBoxEl.style.height = `0px`;

  let latestSelected = [];
  let latestKeyframes = [];
  const updateBox = (moveEvent) => {
    lastClientX = moveEvent.clientX;
    lastClientY = moveEvent.clientY;
    const left = Math.min(startX, moveEvent.clientX);
    const top = Math.min(startY, moveEvent.clientY);
    const width = Math.abs(moveEvent.clientX - startX);
    const height = Math.abs(moveEvent.clientY - startY);
    selectionBoxEl.style.left = `${left}px`;
    selectionBoxEl.style.top = `${top}px`;
    selectionBoxEl.style.width = `${width}px`;
    selectionBoxEl.style.height = `${height}px`;

    const boxRect = selectionBoxEl.getBoundingClientRect();
    latestSelected = [];
    latestKeyframes = [];
    document.querySelectorAll(".clip").forEach(clip => {
      const hit = rectsIntersect(boxRect, clip.getBoundingClientRect());
      clip.classList.toggle("marquee-hit", hit);
      if (hit) latestSelected.push(clipRectToLayerIndex(clip));
    });
    if (timelineMode === "keyframe") {
      document.querySelectorAll(".property-keyframe-marker").forEach(keyEl => {
        const hit = rectsIntersect(boxRect, keyEl.getBoundingClientRect());
        keyEl.classList.toggle("marquee-hit", hit);
        if (hit) latestKeyframes.push({
          layerIndex: Number(keyEl.dataset.layerIndex || 0),
          propertyPath: keyEl.dataset.propertyPath || "",
          keyIndex: Number(keyEl.dataset.keyIndex || 0)
        });
      });
    }
  };

  const autoScrollTick = () => {
    if (!isMarqueeSelecting) return;
    const rect = scrollAreaEl.getBoundingClientRect();
    const edge = 34;
    const maxStep = 22;
    let dx = 0;
    let dy = 0;
    if (lastClientX < rect.left + edge) dx = -Math.round(maxStep * (1 - Math.max(0, lastClientX - rect.left) / edge));
    else if (lastClientX > rect.right - edge) dx = Math.round(maxStep * (1 - Math.max(0, rect.right - lastClientX) / edge));
    if (lastClientY < rect.top + edge) dy = -Math.round(maxStep * (1 - Math.max(0, lastClientY - rect.top) / edge));
    else if (lastClientY > rect.bottom - edge) dy = Math.round(maxStep * (1 - Math.max(0, rect.bottom - lastClientY) / edge));
    if (!dx && !dy) return;
    const beforeX = scrollAreaEl.scrollLeft;
    const beforeY = scrollAreaEl.scrollTop;
    scrollAreaEl.scrollLeft = Math.max(0, scrollAreaEl.scrollLeft + dx);
    scrollAreaEl.scrollTop = Math.max(0, scrollAreaEl.scrollTop + dy);
    if (scrollAreaEl.scrollLeft !== beforeX || scrollAreaEl.scrollTop !== beforeY) {
      syncBottomRulerPosition();
      updateBox({ clientX: lastClientX, clientY: lastClientY });
    }
  };
  autoScrollTimer = setInterval(autoScrollTick, 16);

  const finish = async (upEvent) => {
    document.removeEventListener("mousemove", updateBox, true);
    document.removeEventListener("mouseup", finish, true);
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    selectionBoxEl.style.display = "none";
    document.querySelectorAll(".clip.marquee-hit").forEach(clip => clip.classList.remove("marquee-hit"));
    document.querySelectorAll(".property-keyframe-marker.marquee-hit").forEach(keyEl => keyEl.classList.remove("marquee-hit"));
    isMarqueeSelecting = false;

    // Treat a tiny click on empty track as deselect, similar to AE timeline behavior.
    if (Math.abs(upEvent.clientX - startX) < 3 && Math.abs(upEvent.clientY - startY) < 3) {
      latestSelected = [];
      latestKeyframes = [];
    }
    if (latestKeyframes.length) {
      const keyLayerIndices = [...new Set(latestKeyframes.map(key => key.layerIndex).filter(Boolean))];
      state.selectedLayerIndices = additive
        ? [...new Set([...(state.selectedLayerIndices || []), ...keyLayerIndices])]
        : keyLayerIndices;
      renderSelectionOnly();
      await setSelectedLayers(state.selectedLayerIndices, false);
      await selectKeyframes(latestKeyframes, additive);
      return;
    }
    if (timelineMode === "keyframe" || selectedKeyframes.length) {
      await clearSelectedKeyframes({ forceHost: true });
    }
    await setSelectedLayers(latestSelected, additive);
    syncTick();
  };

  document.addEventListener("mousemove", updateBox, true);
  document.addEventListener("mouseup", finish, true);
  if (initialMoveEvent) updateBox(initialMoveEvent);
}

async function setSelectedLayers(indices, additive = false) {
  suppressSyncUntil = Date.now() + 700;
  const requested = (indices || []).map(Number).filter(Boolean);
  if (requested.length) lastSelectedLayerIndex = requested[requested.length - 1];
  await loadJSX();
  const result = await aeCall("TNT_setSelectedLayers", [indices, additive]);
  if (result.ok) {
    state.selectedLayerIndices = result.selectedLayerIndices || [];
    renderSelectionOnly();
  } else {
    statusEl.textContent = result.error || "Could not update selection.";
  }
}

async function selectAllLayers() {
  if (!state.comp || !state.layers || !state.layers.length) return;
  const indices = state.layers.map(layer => layer.index).filter(index => Number(index) >= 1);
  if (!indices.length) return;
  await setSelectedLayers(indices, false);
  focusPanel(2);
}

async function duplicateSelectedLayers(indicesOverride) {
  if (!state.comp) return;
  const selected = Array.isArray(indicesOverride) && indicesOverride.length
    ? indicesOverride.slice()
    : (state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : []);
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(1);
  await loadJSX();
  const result = await aeCall("TNT_duplicateSelectedLayers", [selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not duplicate selected layers.";
    focusPanel(2);
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
  focusPanel(4);
}

async function deleteSelectedLayers() {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_deleteSelectedLayers", [selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not delete selected layers.";
    return;
  }
  state.selectedLayerIndices = [];
  await refreshLayerStructureAfterAction();
}

async function createLayerFromFxConsole(type) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_createLayerFromPanel", [type, state.comp.time || 0]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add layer.";
    focusPanel(2);
    return;
  }
  statusEl.textContent = `Added ${result.name || "layer"}.`;
  state.selectedLayerIndices = result.layerIndex ? [result.layerIndex] : [];
  await refreshLayerStructureAfterAction();
  focusPanel(2);
}

async function deleteSelectedKeyframes() {
  if (!state.comp || !selectedKeyframes.length) return;
  const keys = selectedKeyframes.slice();
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_deleteSelectedPropertyKeys", [keys]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not delete selected keyframes.";
    return;
  }
  selectedKeyframes = [];
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function deleteSelectedLevel() {
  if (selectedKeyframes.length) {
    await deleteSelectedKeyframes();
    return;
  }
  await deleteSelectedLayers();
}

async function splitSelectedLayersAtPlayhead() {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_splitSelectedLayersAtTime", [selected, snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not split selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
}

async function setSelectedLayerEndpoint(endpoint) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedLayerEndpoint", [selected, endpoint, snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not set layer point.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || state.selectedLayerIndices || [];
  await refreshLayerStructureAfterAction();
  focusPanel(2);
}

async function moveSelectedLayersInStack(mode) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  const anchorIndex = mode === "anchor-last" && selected.includes(Number(lastSelectedLayerIndex))
    ? Number(lastSelectedLayerIndex)
    : 0;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_moveSelectedLayersInStack", [selected, mode, anchorIndex]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not move selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layer order updated.";
  focusPanel(2);
}

async function orderSelectedLayersAroundTarget(direction, basis, proximity = "closest") {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [];
  const targetIndex = selected.includes(Number(lastSelectedLayerIndex))
    ? Number(lastSelectedLayerIndex)
    : 0;
  if (selected.length < 2 || !targetIndex) {
    statusEl.textContent = "Select other layers, then click the target layer last.";
    return;
  }
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_orderLayersAroundTarget", [
    selected,
    targetIndex,
    String(basis || "in"),
    String(direction || "bottom-up"),
    String(proximity || "closest")
  ]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not order layers around the target.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (Number(result.targetLayerIndex) > 0) {
    lastSelectedLayerIndex = Number(result.targetLayerIndex);
  }
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layers ordered around target.";
  focusPanel(2);
}

async function sortSelectedLayersByOrder(basis, direction = "asc") {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [];
  if (selected.length < 2) {
    statusEl.textContent = "Select at least two layers to sort.";
    return;
  }
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_sortSelectedLayers", [
    selected,
    String(basis || "in"),
    String(direction || "asc")
  ]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not sort selected layers.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layers sorted.";
  focusPanel(2);
}

async function runLayerTimingAction(action, options = {}) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_snapPullStaggerLayers", [selected, action, options]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not run layer timing action.";
    return;
  }
  state.selectedLayerIndices = result.selectedLayerIndices || state.selectedLayerIndices || [];
  if (!applyTimelineStructureResult(result, { skipSettledRefresh: true })) {
    await refreshLayerStructureAfterAction();
  }
  statusEl.textContent = result.result || "Layer timing updated.";
  focusPanel(2);
}

async function runKeyframeTimingAction(action, options = {}) {
  if (!state.comp) return;
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length
    ? state.selectedLayerIndices.slice()
    : [...new Set((selectedKeyframes || []).map(key => Number(key.layerIndex || 0)).filter(Boolean))];
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_snapPullStaggerKeyframes", [selected, action, options]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not run keyframe timing action.";
    return;
  }
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

function undoLastAeAction() {
  pendingUndoRequests++;
  suppressSyncUntil = Date.now() + 700;
  recentPanelShortcutUntil = Date.now() + 1200;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
  drainUndoRequests();
}

async function drainUndoRequests() {
  if (undoDrainInFlight) return;
  undoDrainInFlight = true;
  await loadJSX();
  let latestStructure = null;
  try {
    while (pendingUndoRequests > 0) {
      pendingUndoRequests--;
      const result = await aeCall("TNT_undoNativeHistory", [true]);
      if (!result.ok || result.changed === false) {
        statusEl.textContent = result.error || "Could not undo.";
        pendingUndoRequests = 0;
        break;
      }
      if (result.structure && result.structure.ok) latestStructure = result.structure;
    }
  } finally {
    undoDrainInFlight = false;
  }
  if (pendingUndoRequests > 0) {
    drainUndoRequests();
    return;
  }
  if (latestStructure && timelineMode !== "keyframe") {
    applyTimelineStructureResult(latestStructure);
  } else {
    await refreshLayers({
      forceRender: true,
      includeSelectedKeyframes: timelineMode === "keyframe"
    });
  }
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
}
function ensureFxConsole() {
  if (fxConsoleEl) return fxConsoleEl;
  fxConsoleEl = document.createElement("div");
  fxConsoleEl.className = "fx-console";
  fxConsoleEl.setAttribute("aria-hidden", "true");
  fxConsoleEl.innerHTML = `
    <div class="fx-console-panel">
      <input class="fx-console-input" type="text" spellcheck="false" placeholder="Search commands or effects">
      <div class="fx-console-results"></div>
    </div>
  `;
  document.body.appendChild(fxConsoleEl);

  const input = fxConsoleEl.querySelector(".fx-console-input");
  const resultsEl = fxConsoleEl.querySelector(".fx-console-results");
  resultsEl.addEventListener("mousemove", () => {
    fxConsoleLastPointerMoveAt = Date.now();
  });
  input.addEventListener("input", renderFxConsoleResults);
  input.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeFxConsole();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFxConsoleSelectedIndex(fxConsoleSelectedIndex + 1, "keyboard");
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFxConsoleSelectedIndex(fxConsoleSelectedIndex - 1, "keyboard");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      openSelectedFxConsoleSubmenu();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      closeFxConsoleSubmenu();
      return;
    }
    if (event.key === "Backspace" && !input.value && fxConsoleParentEntry) {
      event.preventDefault();
      closeFxConsoleSubmenu();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      applySelectedFxConsoleEffect();
    }
  });
  fxConsoleEl.addEventListener("mousedown", event => {
    if (event.target === fxConsoleEl) closeFxConsole();
  });
  return fxConsoleEl;
}

async function openFxConsole() {
  if (!state.comp) return;
  const el = ensureFxConsole();
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  const input = el.querySelector(".fx-console-input");
  input.value = "";
  input.placeholder = "Search commands or effects";
  fxConsoleParentEntry = null;
  fxConsoleSelectedIndex = 0;
  fxConsoleLastKeyboardAt = 0;
  fxConsoleLastPointerMoveAt = 0;
  focusFxConsoleInput(2);
  await loadFxConsoleEffects();
  renderFxConsoleResults();
  focusFxConsoleInput(5);
}

async function loadFxConsoleEffects() {
  if (fxConsoleEffects.length) return fxConsoleEffects;
  await loadJSX();
  const result = await aeCall("TNT_getEffects");
  if (result.ok) fxConsoleEffects = result.effects || [];
  else statusEl.textContent = result.error || "Could not read effects.";
  return fxConsoleEffects;
}

function closeFxConsole() {
  if (!fxConsoleEl) return;
  fxConsoleEl.classList.remove("open");
  fxConsoleEl.setAttribute("aria-hidden", "true");
  fxConsoleParentEntry = null;
}

function focusFxConsoleInput(retries = 4) {
  if (!fxConsoleEl || !fxConsoleEl.classList.contains("open")) return;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (!input) return;
  try { window.focus(); } catch (_) {}
  try {
    input.focus({ preventScroll: true });
    input.select();
  } catch (_) {
    try { input.focus(); input.select(); } catch (__) {}
  }
  if (retries > 0) setTimeout(() => focusFxConsoleInput(retries - 1), 60);
}

function hasSelectedKeyframesForCommands() {
  return Array.isArray(selectedKeyframes) && selectedKeyframes.length > 0;
}

function commandVisibleInFxConsole(command) {
  if (!command || !command.visibleWhen) return true;
  if (command.visibleWhen === "selectedKeyframes") return hasSelectedKeyframesForCommands();
  return true;
}

function fxConsoleFilterCommands(query = "") {
  const selectedIndices = (state.selectedLayerIndices || []).map(Number).filter(Boolean);
  const usesSelection = selectedIndices.length > 0;
  const scopeIndices = usesSelection ? [...new Set(selectedIndices)] : null;
  const scopeLayers = usesSelection
    ? (state.layers || []).filter(layer => scopeIndices.includes(Number(layer.index || 0)))
    : (state.layers || []).slice();
  const relationSets = allRelationshipLayerSets();
  const scopeName = usesSelection ? "Selection" : "Composition";
  const children = [];

  if (usesSelection) {
    children.push({
      type: "command",
      name: "Focus Selected Layers",
      category: `${scopeIndices.length} selected`,
      action: () => setLayerViewFilter(null, scopeIndices)
    });
  }

  LAYER_SELECTION_QUICK_FILTERS.forEach(definition => {
    const count = scopeLayers.filter(layer => layerMatchesFilter(layer, definition.key, relationSets)).length;
    if (!count) return;
    children.push({
      type: "command",
      name: `${definition.label} Layers`,
      category: `${scopeName} · ${count}`,
      filterKey: definition.key,
      action: () => setLayerViewFilter(definition.key, scopeIndices)
    });
  });

  if (hasActiveLayerViewConstraint()) {
    children.push({
      type: "command",
      name: "Turn Off Filter / Focus",
      category: "Show full composition",
      action: clearLayerViewFilter
    });
  }

  const parentName = `Filter ${scopeName}`;
  const normalizedQuery = String(query || "").toLowerCase();
  if (normalizedQuery.split(/\s+/).includes("filter")) {
    return children.map(command => ({
      ...command,
      name: `${parentName}: ${command.name}`
    }));
  }
  return [{
    name: parentName,
    category: usesSelection ? `${scopeIndices.length} selected layers` : `${scopeLayers.length} comp layers`,
    children
  }];
}

function visibleFxConsoleCommands(query = "") {
  const isFilterQuery = String(query || "").toLowerCase().split(/\s+/).includes("filter");
  const supersededFilterCommands = new Set([
    "Focus Selected",
    "Focus Playhead",
    "Filter Text Layers",
    "Keep Only Shapes",
    "Keep Only Images"
  ]);
  const panelCommands = (isFilterQuery ? [] : FX_CONSOLE_COMMANDS)
    .concat(fxConsoleFilterCommands(query))
    .map(command => ({ ...command, source: "panel" }));
  const assistantSavedCommands = typeof getAssistantSavedFunctionCommands === "function" ? getAssistantSavedFunctionCommands() : [];
  const baseCommands = panelCommands.concat(assistantSavedCommands);
  if (!panelSettings.showTntCommands) return baseCommands.filter(commandVisibleInFxConsole);
  if (isFilterQuery) return baseCommands.filter(commandVisibleInFxConsole);
  return baseCommands.concat(TNT_V3_COMMANDS
    .filter(command => !supersededFilterCommands.has(command.name))
    .map(command => ({
      ...command,
      source: "custom",
      type: command.action ? "command" : (command.children ? "tntMenu" : "tntCommand")
    }))).filter(commandVisibleInFxConsole);
}

function searchFxConsoleEntries(query = "", parentEntry = null, limit = 24) {
  const normalizedQuery = String(query || "").toLowerCase().trim();
  if (parentEntry) {
    const children = (parentEntry.children || []).map(command => ({ ...command, source: parentEntry.source || "custom", type: command.action ? "command" : "tntCommand", parentName: parentEntry.name }));
    if (!normalizedQuery) return children.slice(0, limit);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return children.filter(effect => {
      const source = fxConsoleSourceMeta(effect);
      const tags = safeFxConsoleEntryTags(effect).map(tag => tag.label).join(" ");
      const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""} ${effect.shortcut || ""} ${effect.parentName || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
      return terms.every(term => haystack.indexOf(term) >= 0);
    }).slice(0, limit);
  }
  const isFilterQuery = normalizedQuery.split(/\s+/).includes("filter");
  const effects = panelSettings.showNativeEffects && !isFilterQuery
    ? (fxConsoleEffects || []).map(effect => ({ ...effect, source: "native", type: "effect" }))
    : [];
  const entries = visibleFxConsoleCommands(normalizedQuery).concat(effects);
  if (!normalizedQuery) return entries.slice(0, limit);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return entries.filter(effect => {
    const source = fxConsoleSourceMeta(effect);
    const tags = safeFxConsoleEntryTags(effect).map(tag => tag.label).join(" ");
    const haystack = `${effect.name || ""} ${effect.category || ""} ${effect.matchName || ""} ${effect.shortcut || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, limit);
}

function filteredFxEffects() {
  const query = fxConsoleEl ? String((fxConsoleEl.querySelector(".fx-console-input") || {}).value || "") : "";
  return searchFxConsoleEntries(query, fxConsoleParentEntry, 24);
}

// Three visual groups for the left-edge stripe. Assistant-saved scripts share the
// custom stripe deliberately: the distinction that matters at a glance is "not
// built into After Effects", not who authored it.
function tntSourceGroup(entry) {
  const source = String((entry && entry.source) || "");
  if (source === "native" || (entry && entry.type === "effect")) return "native";
  if (source === "custom" || source === "assistant") return "custom";
  return "panel";
}

function fxConsoleSourceMeta(entry) {
  const source = String(entry && entry.source || (entry && entry.type === "effect" ? "native" : "panel"));
  const category = String(entry && entry.category || "").toLowerCase();
  const parent = String(entry && entry.parentName || "").toLowerCase();
  if (source === "native") {
    return { key: "native", label: "AE Effect", detail: "Native After Effects effect or preset" };
  }
  if (source === "custom") {
    if (entry && entry.children) {
      return { key: "custom", label: "Automation Menu", detail: "Grouped TNT v3 ExtendScript actions" };
    }
    return { key: "custom", label: "Layer Automation", detail: "Runs an ExtendScript action against the current comp/layers" };
  }
  if (source === "assistant") {
    return { key: "assistant", label: "Saved Script", detail: "Assistant-generated ExtendScript saved in the panel library" };
  }
  if (category.indexOf("shortcut") >= 0 || category.indexOf("native") >= 0) {
    return { key: "panel", label: "AE Shortcut", detail: "Panel shortcut that triggers an After Effects or CEP command" };
  }
  if (category.indexOf("view") >= 0 || category.indexOf("navigation") >= 0) {
    return { key: "panel", label: "Timeline View", detail: "Changes panel navigation, focus, or visible timeline state" };
  }
  if (category.indexOf("composition") >= 0 || parent.indexOf("composition") >= 0) {
    return { key: "panel", label: "Comp Tool", detail: "Composition-level panel control" };
  }
  if (category.indexOf("layers") >= 0 || parent.indexOf("layer") >= 0) {
    return { key: "panel", label: "Layer Tool", detail: "Layer selection, ordering, or inspection control" };
  }
  if (category.indexOf("mask") >= 0 || category.indexOf("effect") >= 0 || category.indexOf("shape") >= 0 || category.indexOf("style") >= 0) {
    return { key: "panel", label: "Inspector", detail: "Opens or controls a focused layer inspector" };
  }
  return { key: "panel", label: "Panel Tool", detail: "CEP panel control or utility" };
}

const TNT_ACTION_TITLES = {
  "Set": "Changes a value or property on something that already exists",
  "Apply": "Applies an effect, preset, or ease to the selection",
  "Add": "Creates something new in the comp",
  "Delete": "Removes something from the comp",
  "Show": "Changes what is visible or expanded, without altering the project",
  "Go To": "Moves the playhead or view to a position",
  "Open": "Opens a panel, editor, or inspector",
  "Space": "Distributes or staggers timing across a selection",
  "Play": "Controls playback"
};

const TNT_TARGET_TITLES = {
  "Text": "Acts on text layers or text properties",
  "Shape": "Acts on shape layers or vector properties",
  "Mask": "Acts on masks or track mattes",
  "Effect": "Acts on effects or presets",
  "Animation": "Acts on keyframes, easing, or expressions",
  "Marker": "Acts on composition or layer markers",
  "Style": "Acts on layer styles or labels",
  "Comp": "Acts on the composition itself",
  "Layer": "Acts on the selected layers"
};

function tntTagSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Targets only, for entries we cannot hand-tag (AE effects, saved assistant
// scripts, TNT v3 menu items). Deliberately does NOT guess an action: deriving
// verbs from titles is what produced "Trim In to Playhead -> Navigate", because
// a title names what a command references, not what it acts on.
const TNT_DERIVED_TARGETS = [
  ["Text", /\b(text|source text|animator|font|typograph)/i],
  ["Shape", /\b(shape|stroke|fill|trim paths|vector|dash|arrowhead)\b/i],
  ["Mask", /\b(mask|matte)\b/i],
  ["Animation", /\b(keyframe|keyframes|ease|expression|loop|wiggle|roving)\b/i],
  ["Marker", /\b(marker|markers)\b/i],
  ["Style", /\b(layer style|styles?|label)\b/i],
  ["Comp", /\b(composition|comp)\b/i],
  ["Layer", /\b(layer|layers)\b/i]
];

function fxConsoleEntryTags(entry) {
  const tags = [];
  const pushAction = label => {
    if (!label) return;
    tags.push({
      kind: "action",
      key: `action-${tntTagSlug(label)}`,
      label,
      title: TNT_ACTION_TITLES[label] || "What this command does"
    });
  };
  const pushTarget = label => {
    if (!label || tags.some(tag => tag.label === label)) return;
    tags.push({
      kind: "target",
      key: `target-${tntTagSlug(label)}`,
      label,
      title: TNT_TARGET_TITLES[label] || "What this command acts on"
    });
  };

  // 1. Hand-tagged registry commands are authoritative.
  if (entry && entry.does) {
    pushAction(entry.does);
    (Array.isArray(entry.targets) ? entry.targets : []).slice(0, 2).forEach(pushTarget);
    return tags;
  }

  // 2. Native AE effects and presets: the action is always Apply, and the target
  //    comes from real effect metadata rather than a reading of the title.
  const source = String(entry && entry.source || "");
  if (source === "native" || (entry && entry.type === "effect")) {
    pushAction("Apply");
    pushTarget("Effect");
    return tags;
  }

  // 3. Everything else: Apply plus at most two targets matched from the title.
  pushAction("Apply");
  const text = [entry && entry.name, entry && entry.category, entry && entry.parentName]
    .filter(Boolean).join(" ");
  TNT_DERIVED_TARGETS.filter(pair => pair[1].test(text)).slice(0, 2).forEach(pair => pushTarget(pair[0]));
  return tags;
}

function safeFxConsoleEntryTags(entry) {
  try {
    return fxConsoleEntryTags(entry);
  } catch (_) {
    const source = fxConsoleSourceMeta(entry);
    return [{ key: `source-${source.key}`, label: source.label, title: source.detail }];
  }
}

function fxConsoleResultClass(entry, index) {
  const meta = fxConsoleSourceMeta(entry);
  return [
    "fx-console-result",
    `source-${meta.key}`,
    entry && entry.children ? "has-children" : "",
    index === fxConsoleSelectedIndex ? "active" : ""
  ].filter(Boolean).join(" ");
}

function openFxConsoleSubmenu(entry) {
  if (!entry || !entry.children || !entry.children.length || !fxConsoleEl) return false;
  fxConsoleParentEntry = entry;
  fxConsoleSelectedIndex = 0;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (input) {
    input.value = "";
    input.placeholder = `Search ${entry.name}`;
  }
  renderFxConsoleResults();
  focusFxConsoleInput(2);
  return true;
}

function openSelectedFxConsoleSubmenu() {
  return openFxConsoleSubmenu(filteredFxEffects()[fxConsoleSelectedIndex]);
}

function closeFxConsoleSubmenu() {
  if (!fxConsoleParentEntry || !fxConsoleEl) return false;
  fxConsoleParentEntry = null;
  fxConsoleSelectedIndex = 0;
  const input = fxConsoleEl.querySelector(".fx-console-input");
  if (input) {
    input.value = "";
    input.placeholder = "Search commands or effects";
  }
  renderFxConsoleResults();
  focusFxConsoleInput(2);
  return true;
}

function setFxConsoleSelectedIndex(index, source) {
  const effects = filteredFxEffects();
  if (!effects.length) {
    fxConsoleSelectedIndex = 0;
    renderFxConsoleResults();
    return;
  }
  if (source === "keyboard") fxConsoleLastKeyboardAt = Date.now();
  if (source === "mouse") fxConsoleLastPointerMoveAt = Date.now();
  const nextIndex = Math.max(0, Math.min(Number(index || 0), effects.length - 1));
  if (nextIndex === fxConsoleSelectedIndex) {
    scrollFxConsoleSelectionIntoView();
    return;
  }
  fxConsoleSelectedIndex = nextIndex;
  renderFxConsoleResults();
  scrollFxConsoleSelectionIntoView();
}

function scrollFxConsoleSelectionIntoView() {
  if (!fxConsoleEl) return;
  requestAnimationFrame(() => {
    const active = fxConsoleEl.querySelector(".fx-console-result.active");
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: "nearest" });
    }
  });
}

function renderFxConsoleResults() {
  if (!fxConsoleEl) return;
  const resultsEl = fxConsoleEl.querySelector(".fx-console-results");
  const effects = filteredFxEffects();
  fxConsoleSelectedIndex = Math.max(0, Math.min(fxConsoleSelectedIndex, Math.max(0, effects.length - 1)));
  if (!effects.length) {
    resultsEl.innerHTML = `<div class="fx-console-empty">No matching ${fxConsoleParentEntry ? "choices" : "effects"}</div>`;
    return;
  }
  resultsEl.innerHTML = effects.map((effect, index) => {
    const source = fxConsoleSourceMeta(effect);
    return `
    <button type="button" class="${fxConsoleResultClass(effect, index)}" data-index="${index}">
      <i class="fx-console-source" title="${escapeHtml(source.detail)}">${escapeHtml(source.label)}</i>
      <span>${escapeHtml(effect.name || effect.matchName || "Effect")}</span>
      <em>${escapeHtml([effect.category || effect.matchName || "", effect.shortcut || "", effect.children ? "Right" : ""].filter(Boolean).join(" - "))}</em>
    </button>
  `;
  }).join("");
  resultsEl.querySelectorAll(".fx-console-result").forEach(button => {
    button.addEventListener("mouseenter", () => {
      if (fxConsoleLastPointerMoveAt < fxConsoleLastKeyboardAt) return;
      setFxConsoleSelectedIndex(Number(button.dataset.index || 0), "mouse");
    });
    button.addEventListener("mousedown", event => {
      event.preventDefault();
      setFxConsoleSelectedIndex(Number(button.dataset.index || 0), "mouse");
      if (event.button === 0) applySelectedFxConsoleEffect();
    });
  });
}

async function applySelectedFxConsoleEffect() {
  const effect = filteredFxEffects()[fxConsoleSelectedIndex];
  if (!effect) return;
  if (effect.children && openFxConsoleSubmenu(effect)) return;
  await executeFxConsoleEntry(effect);
}

async function executeFxConsoleEntry(effect) {
  if (!effect) return false;
  if (effect.type === "command") {
    closeFxConsole();
    await effect.action();
    return true;
  }
  if (effect.type === "tntMenu" && effect.children && effect.children.length) {
    return openFxConsoleSubmenu(effect);
  }
  if (effect.type === "tntCommand") {
    await runTntV3Command(effect);
    return true;
  }
  const selected = state.selectedLayerIndices && state.selectedLayerIndices.length ? state.selectedLayerIndices.slice() : [];
  await loadJSX();
  const result = await aeCall("TNT_applyEffectToSelectedLayers", [effect.matchName, selected]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not apply effect.";
    return false;
  }
  closeFxConsole();
  await refreshLayers({ forceRender: true });
  return true;
}
function ensureEaseDialog() {
  if (easeDialogEl) return easeDialogEl;
  easeDialogEl = document.createElement("div");
  easeDialogEl.className = "ease-dialog-backdrop";
  easeDialogEl.setAttribute("aria-hidden", "true");
  easeDialogEl.innerHTML = `
    <div class="ease-dialog">
      <div class="ease-dialog-head">
        <div class="ease-dialog-title-wrap">
          <div class="ease-dialog-title"><b class="ease-shortcut-badge">E</b><span>Ease Editor</span><em class="ease-keyframe-count"></em></div>
        </div>
        <div class="ease-actions">
          <button type="button" class="ease-apply-saved">Apply Saved</button>
          <button type="button" class="ease-cancel">Cancel</button>
        </div>
      </div>
      <div class="ease-main">
        <div class="ease-curve-column">
          <div class="ease-graph-wrap">
            <div class="ease-graph-zoom" aria-label="Ease graph zoom">
              <button type="button" class="ease-graph-zoom-out" aria-label="Zoom out" title="Zoom out"></button>
              <button type="button" class="ease-graph-zoom-value" aria-label="Reset graph zoom" title="Reset to 100%">100%</button>
              <button type="button" class="ease-graph-zoom-in" aria-label="Zoom in" title="Zoom in"></button>
            </div>
            <svg class="ease-graph" viewBox="${EASE_GRAPH.viewX} ${EASE_GRAPH.viewY} ${EASE_GRAPH.viewW} ${EASE_GRAPH.viewH}" aria-hidden="true">
              <line class="ease-box-edge ease-box-edge-weak" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.top}"></line>
              <line class="ease-box-edge ease-box-edge-weak" x1="${EASE_GRAPH.right}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-box-edge ease-box-edge-strong" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.bottom}" x2="${EASE_GRAPH.right}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-box-edge ease-box-edge-strong" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.top}" x2="${EASE_GRAPH.left}" y2="${EASE_GRAPH.bottom}"></line>
              <line class="ease-handle-line ease-out-line" x1="${EASE_GRAPH.left}" y1="${EASE_GRAPH.bottom}" x2="0" y2="0"></line>
              <line class="ease-handle-line ease-in-line" x1="${EASE_GRAPH.right}" y1="${EASE_GRAPH.top}" x2="0" y2="0"></line>
              <path class="ease-curve" d=""></path>
              <circle class="ease-handle-hit ease-handle-target ease-out-hit" data-handle="out" r="14" cx="0" cy="0"></circle>
              <circle class="ease-handle-hit ease-handle-target ease-in-hit" data-handle="in" r="14" cx="0" cy="0"></circle>
              <circle class="ease-point ease-handle-target ease-out-handle" data-handle="out" r="5" cx="0" cy="0"></circle>
              <circle class="ease-point ease-handle-target ease-in-handle" data-handle="in" r="5" cx="0" cy="0"></circle>
            </svg>
          </div>
          <div class="ease-presets">
            <button type="button" data-preset="linear"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 L56 8"></path></svg><span>Linear</span></button>
            <button type="button" data-preset="easy"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 26 26, 38 8, 56 8"></path></svg><span>Easy</span></button>
            <button type="button" data-preset="gentle"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 18 23, 36 14, 56 8"></path></svg><span>Gentle</span></button>
            <button type="button" data-preset="smooth"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 28 25, 36 9, 56 8"></path></svg><span>Smooth</span></button>
            <button type="button" data-preset="sharp"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 36 22, 42 8, 56 8"></path></svg><span>Sharp</span></button>
            <button type="button" data-preset="snap"><svg viewBox="0 0 64 32" aria-hidden="true"><path d="M8 26 C 44 27, 52 23, 56 8"></path></svg><span>Snap</span></button>
          </div>
        </div>
        <div class="ease-side">
          <div class="ease-controls">
            <label class="ease-control">
              <span>Out Influence</span>
              <input class="ease-out-input" type="range" min="0" max="100" step="1">
              <em class="ease-out-value"></em>
            </label>
            <label class="ease-control">
              <span>In Influence</span>
              <input class="ease-in-input" type="range" min="0" max="100" step="1">
              <em class="ease-in-value"></em>
            </label>
            <label class="ease-control">
              <span>Out Speed</span>
              <input class="ease-out-speed-input" type="range" min="-500" max="500" step="1">
              <em class="ease-out-speed-value"></em>
            </label>
            <label class="ease-control">
              <span>In Speed</span>
              <input class="ease-in-speed-input" type="range" min="-500" max="500" step="1">
              <em class="ease-in-speed-value"></em>
            </label>
          </div>
          <div class="ease-tools" aria-label="Ease utilities">
            <button type="button" data-ease-tool="overshoot" data-tooltip="Overshoot Expression\nAdd the panel overshoot expression controls."><svg viewBox="0 0 28 20" aria-hidden="true"><path d="M3 15 C 9 14, 13 3, 18 8 C 21 11, 23 8, 25 5"></path></svg><span>Overshoot</span></button>
            <button type="button" data-ease-tool="wiggle" data-tooltip="Wiggle Expression\nAdd wiggle expression controls to selected properties."><svg viewBox="0 0 28 20" aria-hidden="true"><path d="M3 11 C 6 3, 10 19, 14 11 C 18 3, 22 19, 25 9"></path></svg><span>Wiggle</span></button>
          </div>
        </div>
      </div>
      <div class="ease-error"></div>
    </div>
  `;
  document.body.appendChild(easeDialogEl);
  easeDialogEl.addEventListener("mousedown", event => {
    if (event.target === easeDialogEl) hideEaseDialog();
  });
  const closeBtn = easeDialogEl.querySelector(".ease-close");
  if (closeBtn) closeBtn.addEventListener("click", hideEaseDialog);
  easeDialogEl.querySelector(".ease-cancel").addEventListener("click", hideEaseDialog);
  easeDialogEl.querySelector(".ease-apply-saved").addEventListener("click", applySavedEaseFromDialog);
  easeDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      hideEaseDialog();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleLiveEaseApply({ immediate: true, refresh: true });
    }
  });
  easeDialogEl.querySelectorAll(".ease-control input").forEach(input => {
    input.addEventListener("input", () => {
      easeDialogState.influenceOut = Number(easeDialogEl.querySelector(".ease-out-input").value);
      easeDialogState.influenceIn = Number(easeDialogEl.querySelector(".ease-in-input").value);
      easeDialogState.speedOut = Number(easeDialogEl.querySelector(".ease-out-speed-input").value);
      easeDialogState.speedIn = Number(easeDialogEl.querySelector(".ease-in-speed-input").value);
      updateEaseRangeFills();
      renderEaseGraph();
      scheduleLiveEaseApply();
    });
  });
  easeDialogEl.querySelectorAll(".ease-presets button").forEach(button => {
    button.addEventListener("click", () => setEasePreset(button.dataset.preset));
  });
  easeDialogEl.querySelector(".ease-graph-zoom-out").addEventListener("click", () => setEaseGraphZoom(easeGraphZoom - 25));
  easeDialogEl.querySelector(".ease-graph-zoom-in").addEventListener("click", () => setEaseGraphZoom(easeGraphZoom + 25));
  easeDialogEl.querySelector(".ease-graph-zoom-value").addEventListener("click", () => setEaseGraphZoom(100));
  easeDialogEl.querySelectorAll("[data-ease-tool]").forEach(button => {
    button.addEventListener("click", () => runEaseUtility(button.dataset.easeTool));
    bindPanelTooltip(button);
  });
  easeDialogEl.querySelectorAll(".ease-handle-target").forEach(handle => {
    handle.addEventListener("mousedown", beginEaseHandleDrag);
  });
  return easeDialogEl;
}

async function runEaseUtility(tool) {
  focusPanel(2);
  if (tool === "easy") {
    await applyEasyEaseDirect();
    return;
  }
  if (tool === "linear") {
    await runTntV3Command({ name: "Linear Keyframes", tntFunction: "applyLinear" });
    return;
  }
  if (tool === "overshoot") {
    await runTntV3Command({ name: "Overshoot Expression", tntFunction: "applyOvershoot" });
    return;
  }
  if (tool === "wiggle") {
    await runTntV3Command({ name: "Wiggle Expression", tntFunction: "applyWiggle", args: [{ freq: 2, amp: 20 }] });
  }
}

async function showEaseDialog() {
  if (!state.comp) return;
  if (easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
    focusPanel(2);
    return;
  }
  await syncSelectedKeyframesFromAeIfNeeded();
  if (!selectedKeyframes.length) return;
  const el = ensureEaseDialog();
  const liveKeyframes = selectedKeyframes.slice();
  let initialEaseSettings = loadLastEaseSettings();
  let easeSelectionIsMixed = false;
  await loadJSX();
  const selectedEase = await aeCall("TNT_getSelectedKeyframeEaseSettings", [liveKeyframes]);
  if (selectedEase && selectedEase.ok && !selectedEase.mixed && selectedEase.settings) {
    initialEaseSettings = normalizedEaseSettings(selectedEase.settings);
  } else if (selectedEase && selectedEase.ok && selectedEase.mixed) {
    easeSelectionIsMixed = true;
  }
  easeDialogState = { ...initialEaseSettings, dragHandle: null, liveKeyframes };
  const countEl = el.querySelector(".ease-keyframe-count");
  if (countEl) countEl.textContent = formatKeyframeSelectionScope(liveKeyframes, easeSelectionIsMixed);
  el.querySelector(".ease-error").textContent = "";
  syncEaseInputs();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  setTimeout(() => {
    const firstInput = el.querySelector(".ease-control input");
    if (firstInput) firstInput.focus();
  }, 0);
}

async function syncSelectedKeyframesFromAeIfNeeded() {
  if (selectedKeyframes.length) return true;
  await loadJSX();
  const sync = await aeCall("TNT_getSyncState", [true, true]);
  if (sync && sync.ok) {
    state.selectedLayerIndices = sync.selectedLayerIndices || state.selectedLayerIndices || [];
    selectedKeyframes = normalizeSelectedKeyframes(sync.selectedKeyframes || []);
    updateStatus();
    renderSelectionOnly();
  }
  return selectedKeyframes.length > 0;
}

function hideEaseDialog() {
  if (!easeDialogEl) return;
  if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
  easeLiveApplyTimer = null;
  easeDialogEl.classList.remove("show");
  easeDialogEl.setAttribute("aria-hidden", "true");
  easeDialogState.dragHandle = null;
  easeDialogState.liveKeyframes = null;
  easeLiveApplyQueued = null;
}

function syncEaseInputs() {
  if (!easeDialogEl) return;
  easeDialogEl.querySelector(".ease-out-input").value = String(Math.round(easeDialogState.influenceOut));
  easeDialogEl.querySelector(".ease-in-input").value = String(Math.round(easeDialogState.influenceIn));
  easeDialogEl.querySelector(".ease-out-speed-input").value = String(Math.round(easeDialogState.speedOut));
  easeDialogEl.querySelector(".ease-in-speed-input").value = String(Math.round(easeDialogState.speedIn));
  updateEaseRangeFills();
  renderEaseGraph();
}

function updateEaseRangeFills() {
  if (!easeDialogEl) return;
  easeDialogEl.querySelectorAll(".ease-control input[type='range']").forEach(input => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || 0);
    const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
    input.style.setProperty("--range-fill", `${pct}%`);
  });
}

function setEasePreset(name) {
  if (name === "linear") {
    runEaseUtility("linear");
    return;
  }
  const presets = {
    easy: defaultEaseSettings(),
    gentle: { influenceOut: 33, influenceIn: 33, speedOut: 55, speedIn: 55 },
    smooth: { influenceOut: 65, influenceIn: 65, speedOut: 100, speedIn: 100 },
    sharp: { influenceOut: 85, influenceIn: 45, speedOut: 170, speedIn: 80 },
    snap: { influenceOut: 92, influenceIn: 18, speedOut: 190, speedIn: 35 }
  };
  easeDialogState = { ...easeDialogState, ...(presets[name] || presets.smooth), dragHandle: null };
  syncEaseInputs();
  scheduleLiveEaseApply();
}

function easeGraphPoints() {
  return easeGraphPointsFor(easeDialogState);
}

function easeGraphViewBox() {
  const zoom = Math.max(25, Math.min(200, Number(easeGraphZoom || 100)));
  const scale = 100 / zoom;
  const width = EASE_GRAPH.viewW * scale;
  const height = EASE_GRAPH.viewH * scale;
  const centerX = EASE_GRAPH.viewX + EASE_GRAPH.viewW / 2;
  const centerY = EASE_GRAPH.viewY + EASE_GRAPH.viewH / 2;
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  };
}

function setEaseGraphZoom(nextZoom) {
  easeGraphZoom = Math.max(25, Math.min(200, Math.round(Number(nextZoom || 100) / 25) * 25));
  renderEaseGraph();
}

function autoZoomEaseGraphForActiveHandle() {
  if (!easeDialogState.dragHandle || easeGraphZoom <= 25) return false;
  const points = easeGraphPoints();
  const handle = easeDialogState.dragHandle === "out" ? points.p1 : points.p2;
  const view = easeGraphViewBox();
  const handleRadius = 6;
  const touchingEdge =
    handle.y - handleRadius <= view.y ||
    handle.y + handleRadius >= view.y + view.height;

  if (!touchingEdge) {
    easeGraphAutoZoomArmed = true;
    return false;
  }
  if (!easeGraphAutoZoomArmed) return false;

  const now = Date.now();
  if (now - easeGraphAutoZoomAt < 140) return false;
  easeGraphZoom = Math.max(25, easeGraphZoom - 1);
  easeGraphAutoZoomAt = now;
  easeGraphAutoZoomArmed = false;
  return true;
}

function easeGraphPointsFor(settings) {
  settings = settings || {};
  const outInf = Math.max(0, Math.min(100, Number(settings.influenceOut || 0)));
  const inInf = Math.max(0, Math.min(100, Number(settings.influenceIn || 0)));
  const outSpeed = Math.max(-500, Math.min(500, Number(settings.speedOut || 0)));
  const inSpeed = Math.max(-500, Math.min(500, Number(settings.speedIn || 0)));
  const graphWidth = EASE_GRAPH.right - EASE_GRAPH.left;
  const influenceWidth = graphWidth * EASE_GRAPH.influenceReach;
  const p0 = { x: EASE_GRAPH.left, y: EASE_GRAPH.bottom };
  const p3 = { x: EASE_GRAPH.right, y: EASE_GRAPH.top };
  const p1 = { x: EASE_GRAPH.left + (outInf / 100) * influenceWidth, y: EASE_GRAPH.bottom - outSpeed * EASE_GRAPH.speedY };
  const p2 = { x: EASE_GRAPH.right - (inInf / 100) * influenceWidth, y: EASE_GRAPH.top + inSpeed * EASE_GRAPH.speedY };
  return { p0, p1, p2, p3 };
}

function renderEaseGraph() {
  if (!easeDialogEl) return;
  const svg = easeDialogEl.querySelector(".ease-graph");
  const view = easeGraphViewBox();
  svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
  const { p0, p1, p2, p3 } = easeGraphPoints();
  const path = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
  easeDialogEl.querySelector(".ease-curve").setAttribute("d", path);
  easeDialogEl.querySelector(".ease-out-line").setAttribute("x2", p1.x);
  easeDialogEl.querySelector(".ease-out-line").setAttribute("y2", p1.y);
  easeDialogEl.querySelector(".ease-in-line").setAttribute("x2", p2.x);
  easeDialogEl.querySelector(".ease-in-line").setAttribute("y2", p2.y);
  easeDialogEl.querySelector(".ease-out-hit").setAttribute("cx", p1.x);
  easeDialogEl.querySelector(".ease-out-hit").setAttribute("cy", p1.y);
  easeDialogEl.querySelector(".ease-in-hit").setAttribute("cx", p2.x);
  easeDialogEl.querySelector(".ease-in-hit").setAttribute("cy", p2.y);
  easeDialogEl.querySelector(".ease-out-handle").setAttribute("cx", p1.x);
  easeDialogEl.querySelector(".ease-out-handle").setAttribute("cy", p1.y);
  easeDialogEl.querySelector(".ease-in-handle").setAttribute("cx", p2.x);
  easeDialogEl.querySelector(".ease-in-handle").setAttribute("cy", p2.y);
  easeDialogEl.querySelector(".ease-out-value").textContent = `${Math.round(easeDialogState.influenceOut)}%`;
  easeDialogEl.querySelector(".ease-in-value").textContent = `${Math.round(easeDialogState.influenceIn)}%`;
  easeDialogEl.querySelector(".ease-out-speed-value").textContent = `${Math.round(easeDialogState.speedOut)}%`;
  easeDialogEl.querySelector(".ease-in-speed-value").textContent = `${Math.round(easeDialogState.speedIn)}%`;
  const zoomValue = easeDialogEl.querySelector(".ease-graph-zoom-value");
  if (zoomValue) zoomValue.textContent = `${easeGraphZoom}%`;
  const zoomOut = easeDialogEl.querySelector(".ease-graph-zoom-out");
  const zoomIn = easeDialogEl.querySelector(".ease-graph-zoom-in");
  if (zoomOut) zoomOut.disabled = easeGraphZoom <= 25;
  if (zoomIn) zoomIn.disabled = easeGraphZoom >= 200;
}

function beginEaseHandleDrag(event) {
  event.preventDefault();
  event.stopPropagation();
  easeDialogState.dragHandle = event.currentTarget.dataset.handle;
  easeGraphAutoZoomArmed = true;
  const dragKeyframes = (easeDialogState.liveKeyframes && easeDialogState.liveKeyframes.length ? easeDialogState.liveKeyframes : selectedKeyframes).slice();
  easeDialogState.dragKeyframes = dragKeyframes;
  let dragFinished = false;
  document.body.classList.add("ease-handle-dragging");
  const onMove = moveEaseHandle;
  const onUp = () => {
    if (dragFinished) return;
    dragFinished = true;
    if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
    easeLiveApplyTimer = null;
    const finalSettings = normalizedEaseSettings(easeDialogState);
    easeDialogState.dragHandle = null;
    document.body.classList.remove("ease-handle-dragging");
    window.removeEventListener("mousemove", onMove, true);
    window.removeEventListener("mouseup", onUp, true);
	    document.removeEventListener("mousemove", onMove, true);
	    document.removeEventListener("mouseup", onUp, true);
	    easeDialogState.dragKeyframes = null;
	    scheduleLiveEaseApply({ immediate: true, refresh: true, keys: dragKeyframes, settings: finalSettings });
	  };
  window.addEventListener("mousemove", onMove, true);
  window.addEventListener("mouseup", onUp, true);
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("mouseup", onUp, true);
	moveEaseHandle(event);
}

function moveEaseHandle(event) {
  if (!easeDialogEl || !easeDialogState.dragHandle) return;
  const svg = easeDialogEl.querySelector(".ease-graph");
  const point = svg.createSVGPoint ? svg.createSVGPoint() : null;
  let rawX = 0;
  let rawY = 0;
  if (point && svg.getScreenCTM()) {
    point.x = event.clientX;
    point.y = event.clientY;
    const localPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    rawX = localPoint.x;
    rawY = localPoint.y;
  } else {
    const rect = svg.getBoundingClientRect();
    const view = easeGraphViewBox();
    rawX = view.x + ((event.clientX - rect.left) / rect.width) * view.width;
    rawY = view.y + ((event.clientY - rect.top) / rect.height) * view.height;
  }
  const view = easeGraphViewBox();
  const xMin = event.shiftKey ? view.x : EASE_GRAPH.left;
  const xMax = event.shiftKey ? view.x + view.width : EASE_GRAPH.right;
  const yMin = event.shiftKey ? EASE_GRAPH.minY : EASE_GRAPH.top;
  const yMax = event.shiftKey ? EASE_GRAPH.maxY : EASE_GRAPH.bottom;
  const x = Math.max(xMin, Math.min(xMax, rawX));
  const y = Math.max(yMin, Math.min(yMax, rawY));
  const graphWidth = EASE_GRAPH.right - EASE_GRAPH.left;
  const influenceWidth = graphWidth * EASE_GRAPH.influenceReach;
  if (easeDialogState.dragHandle === "out") {
    easeDialogState.influenceOut = Math.max(0, Math.min(100, ((x - EASE_GRAPH.left) / influenceWidth) * 100));
    easeDialogState.speedOut = Math.max(-500, Math.min(500, (EASE_GRAPH.bottom - y) / EASE_GRAPH.speedY));
  } else {
    easeDialogState.influenceIn = Math.max(0, Math.min(100, ((EASE_GRAPH.right - x) / influenceWidth) * 100));
    easeDialogState.speedIn = Math.max(-500, Math.min(500, (y - EASE_GRAPH.top) / EASE_GRAPH.speedY));
  }
  if (event.shiftKey) autoZoomEaseGraphForActiveHandle();
  syncEaseInputs();
  scheduleLiveEaseApply({ keys: easeDialogState.dragKeyframes || easeDialogState.liveKeyframes });
}

async function applySavedEaseFromDialog() {
  easeDialogState = { ...easeDialogState, ...loadLastEaseSettings(), dragHandle: null };
  syncEaseInputs();
  scheduleLiveEaseApply({ immediate: true, refresh: true });
}

function scheduleLiveEaseApply(options = {}) {
  if (!easeDialogEl || !easeDialogEl.classList.contains("show")) return;
  const keys = options.keys && options.keys.length
    ? options.keys.slice()
    : (easeDialogState.liveKeyframes && easeDialogState.liveKeyframes.length ? easeDialogState.liveKeyframes.slice() : selectedKeyframes.slice());
  if (!keys.length) return;
  const settings = normalizedEaseSettings(options.settings || easeDialogState);
  if (easeLiveApplyTimer) clearTimeout(easeLiveApplyTimer);
  const run = () => {
    easeLiveApplyTimer = null;
    queueEaseLiveApply({
      keys,
      settings,
      refresh: !!options.refresh,
      save: options.save !== false && (!!options.refresh || !!options.immediate)
    });
  };
  if (options.immediate) {
    run();
    return;
  }
  easeLiveApplyTimer = setTimeout(() => {
    run();
  }, 70);
}

function queueEaseLiveApply(payload) {
  easeLiveApplyQueued = payload;
  if (easeLiveApplyInFlight) return;
  flushQueuedEaseLiveApply();
}

async function flushQueuedEaseLiveApply() {
  if (easeLiveApplyInFlight || !easeLiveApplyQueued) return;
  const payload = easeLiveApplyQueued;
  easeLiveApplyQueued = null;
  easeLiveApplyInFlight = true;
  try {
    await applyEaseToSelected({
      close: false,
      refresh: !!payload.refresh,
      settings: payload.settings,
      live: true,
      keepDialogOpen: true,
      save: !!payload.save,
      keys: payload.keys
    });
  } finally {
    easeLiveApplyInFlight = false;
    if (easeLiveApplyQueued) flushQueuedEaseLiveApply();
  }
}

async function applyEasyEaseDirect() {
  await applyEaseToSelected({ close: false, refresh: true, settings: defaultEaseSettings(), save: false });
}

async function applySavedEaseDirect() {
  await applyEaseToSelected({ close: false, refresh: true, settings: loadLastEaseSettings(), save: false });
}

async function applyEaseToSelected(options = {}) {
  let keysToApply = options.keys && options.keys.length ? options.keys.slice() : selectedKeyframes.slice();
  if (!keysToApply.length) {
    await syncSelectedKeyframesFromAeIfNeeded();
    keysToApply = selectedKeyframes.slice();
  }
  if (!keysToApply.length) {
    if (options.close) hideEaseDialog();
    return;
  }
  const el = easeDialogEl || ensureEaseDialog();
  const errorEl = el.querySelector(".ease-error");
  if (errorEl) errorEl.textContent = "";
  const settings = normalizedEaseSettings(options.settings || easeDialogState);
  if (options.save !== false) saveLastEaseSettings(settings);
  if (!easeHostReloaded) jsxLoaded = false;
  await loadJSX();
  easeHostReloaded = true;
  const result = await aeCall("TNT_applySelectedKeyframeEase", [keysToApply, {
    influenceIn: settings.influenceIn,
    influenceOut: settings.influenceOut,
    speedInScale: settings.speedIn / 100,
    speedOutScale: settings.speedOut / 100
  }]);
  if (!result.ok) {
    if (errorEl) errorEl.textContent = result.error || "Could not apply easing.";
    else statusEl.textContent = result.error || "Could not apply easing.";
    return;
  }
  if (!options.live) statusEl.textContent = `Eased ${result.changedCount || keysToApply.length} keyframe${(result.changedCount || keysToApply.length) === 1 ? "" : "s"}.`;
  const keepDialogOpen = !!options.keepDialogOpen;
  if (options.close && !keepDialogOpen) hideEaseDialog();
  if (options.refresh) await refreshLayers({ forceRender: true, includeSelectedKeyframes: true });
  if (keepDialogOpen && easeDialogEl) {
    easeDialogEl.classList.add("show");
    easeDialogEl.setAttribute("aria-hidden", "false");
    syncEaseInputs();
  }
  if ((options.close || options.refresh) && !keepDialogOpen) focusPanel(2);
}

let massEditDialogEl = null;
let massEditSourceIndex = 0;

function massEditSelectedLayers() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  return (state.layers || []).filter(layer => selected.has(Number(layer.index)));
}

function massEditProperties(layer) {
  const result = [];
  const seen = {};
  [...(layer && layer.transformProperties || []), ...(layer && layer.animatedProperties || [])].forEach(property => {
    const path = String(property && property.path || "");
    if (!path || seen[path]) return;
    seen[path] = true;
    result.push(property);
  });
  return result;
}

function ensureMassEditPanel() {
  if (massEditDialogEl) return massEditDialogEl;
  massEditDialogEl = document.createElement("div");
  massEditDialogEl.className = "mass-edit-backdrop";
  massEditDialogEl.setAttribute("aria-hidden", "true");
  massEditDialogEl.innerHTML = `
    <div class="mass-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="massEditTitle">
      <div class="mass-edit-head">
        <div class="mass-edit-title"><b>ME</b><span id="massEditTitle">Mass Edit</span><em class="mass-edit-count"></em></div>
      </div>
      <div class="mass-edit-body">
        <section class="mass-edit-source">
          <label><span>Source layer</span><select class="mass-edit-source-select" data-tooltip="Source Layer\nChoose the selected layer whose effects, keys, or property value will be copied."></select></label>
          <div class="mass-edit-target-summary"></div>
        </section>
        <section class="mass-edit-section">
          <div class="mass-edit-section-title">Transfer</div>
          <div class="mass-edit-actions">
            <button type="button" data-mass-action="effects" data-tooltip="Copy Effects\nAppend the source layer's effect stack to every other selected layer."><strong>Copy Effects</strong><span>Append the source effect stack to every target</span></button>
            <button type="button" data-mass-action="keyframes" data-tooltip="Copy Selected Keyframes\nCopy the source layer's selected keyframes to every target layer."><strong>Copy Selected Keyframes</strong><span class="mass-edit-key-summary">Select source keyframes first</span></button>
          </div>
        </section>
        <section class="mass-edit-section">
          <div class="mass-edit-section-title">Property Value</div>
          <div class="mass-edit-property-grid">
            <label><span>Property</span><select class="mass-edit-property-select" data-tooltip="Source Property\nChoose a property available on the source layer."></select></label>
            <label><span>Value</span><input class="mass-edit-value" type="text" spellcheck="false" data-tooltip="Property Value\nEdit the exact value that will be applied to every target layer."></label>
            <button type="button" class="mass-edit-apply-value" data-mass-action="value" data-tooltip="Apply to Targets\nSet this property value on every target layer.">Apply to Targets</button>
          </div>
        </section>
        <section class="mass-edit-section mass-edit-wrangler">
          <div class="mass-edit-section-title">Property Wrangler</div>
          <div class="mass-edit-wrangler-copy">Parent the matching property on each target to the selected source property.</div>
          <div class="mass-edit-actions mass-edit-wrangler-actions">
            <button type="button" data-mass-action="link-property" data-tooltip="Link Properties\nAdd a Wrangler expression so each matching target property follows the selected source property. Existing target keyframes remain underneath the expression."><strong>Link to Source</strong><span>Expression-parent matching target properties</span></button>
            <button type="button" data-mass-action="unlink-property" data-tooltip="Unlink Properties\nRemove Wrangler-generated links from the matching target properties without deleting their keyframes or values."><strong>Unlink</strong><span>Remove only Wrangler expressions</span></button>
          </div>
        </section>
        <div class="mass-edit-error"></div>
      </div>
    </div>
  `;
  document.body.appendChild(massEditDialogEl);
  massEditDialogEl.querySelectorAll("[data-tooltip]").forEach(control => {
    control.setAttribute("aria-label", control.dataset.tooltip.replace(/\n+/g, ". "));
    bindPanelTooltip(control);
  });
  massEditDialogEl.addEventListener("mousedown", event => {
    if (event.target === massEditDialogEl) hideMassEditPanel();
  });
  massEditDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideMassEditPanel();
      focusPanel(2);
    }
    if (event.key === "Enter" && event.target.classList.contains("mass-edit-value")) {
      event.preventDefault();
      runMassEditAction("value");
    }
  });
  massEditDialogEl.querySelector(".mass-edit-source-select").addEventListener("change", event => {
    massEditSourceIndex = Number(event.target.value || 0);
    renderMassEditPanel();
  });
  massEditDialogEl.querySelector(".mass-edit-property-select").addEventListener("change", loadMassEditPropertyValue);
  massEditDialogEl.addEventListener("click", event => {
    const button = event.target.closest && event.target.closest("[data-mass-action]");
    if (!button || button.disabled) return;
    runMassEditAction(button.dataset.massAction);
  });
  return massEditDialogEl;
}

function massEditTargetIndices() {
  return massEditSelectedLayers().map(layer => Number(layer.index)).filter(index => index !== Number(massEditSourceIndex));
}

async function loadMassEditPropertyValue() {
  if (!massEditDialogEl) return;
  const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
  const input = massEditDialogEl.querySelector(".mass-edit-value");
  input.value = "";
  input.disabled = !path;
  if (!path || !massEditSourceIndex) return;
  await loadJSX();
  const result = await aeCall("TNT_massGetPropertyValue", [massEditSourceIndex, path]);
  if (result.ok) input.value = result.value || "";
  else massEditDialogEl.querySelector(".mass-edit-error").textContent = result.error || "Could not read the source value.";
}

function renderMassEditPanel() {
  if (!massEditDialogEl) return;
  const layers = massEditSelectedLayers();
  if (!layers.some(layer => Number(layer.index) === Number(massEditSourceIndex))) {
    massEditSourceIndex = Number(layers[layers.length - 1] && layers[layers.length - 1].index || layers[0] && layers[0].index || 0);
  }
  const source = layers.find(layer => Number(layer.index) === Number(massEditSourceIndex));
  const targets = massEditTargetIndices();
  const sourceSelect = massEditDialogEl.querySelector(".mass-edit-source-select");
  sourceSelect.innerHTML = layers.map(layer => `<option value="${Number(layer.index)}"${Number(layer.index) === Number(massEditSourceIndex) ? " selected" : ""}>${Number(layer.index)}. ${escapeHtml(layer.name || "Layer")}</option>`).join("");
  const count = massEditDialogEl.querySelector(".mass-edit-count");
  count.textContent = `${layers.length} layer${layers.length === 1 ? "" : "s"}`;
  massEditDialogEl.querySelector(".mass-edit-target-summary").textContent = `${targets.length} target layer${targets.length === 1 ? "" : "s"}`;

  const properties = massEditProperties(source);
  const propertySelect = massEditDialogEl.querySelector(".mass-edit-property-select");
  const previousPath = propertySelect.value;
  propertySelect.innerHTML = properties.length
    ? properties.map(property => `<option value="${escapeHtml(property.path || "")}"${String(property.path || "") === previousPath ? " selected" : ""}>${escapeHtml(propertyLaneLabel(property))}</option>`).join("")
    : `<option value="">No editable properties found</option>`;

  const sourceKeys = normalizeSelectedKeyframes(selectedKeyframes).filter(key => Number(key.layerIndex) === Number(massEditSourceIndex));
  const keySummary = massEditDialogEl.querySelector(".mass-edit-key-summary");
  keySummary.textContent = sourceKeys.length ? formatKeyframeSelectionScope(sourceKeys) : "Select source keyframes first";
  const effectsButton = massEditDialogEl.querySelector('[data-mass-action="effects"]');
  const keysButton = massEditDialogEl.querySelector('[data-mass-action="keyframes"]');
  const valueButton = massEditDialogEl.querySelector('[data-mass-action="value"]');
  const linkButton = massEditDialogEl.querySelector('[data-mass-action="link-property"]');
  const unlinkButton = massEditDialogEl.querySelector('[data-mass-action="unlink-property"]');
  effectsButton.disabled = !source || !targets.length;
  keysButton.disabled = !targets.length || !sourceKeys.length;
  valueButton.disabled = !targets.length || !properties.length;
  linkButton.disabled = !source || !targets.length || !properties.length;
  unlinkButton.disabled = !targets.length || !properties.length;
  massEditDialogEl.querySelector(".mass-edit-error").textContent = layers.length < 2 ? "Select at least two layers to transfer edits." : "";
  loadMassEditPropertyValue();
}

async function runMassEditAction(action) {
  const targets = massEditTargetIndices();
  const errorEl = massEditDialogEl.querySelector(".mass-edit-error");
  errorEl.textContent = "";
  if (!massEditSourceIndex || !targets.length) {
    errorEl.textContent = "Choose a source and at least one target layer.";
    return;
  }
  await loadJSX();
  let result;
  if (action === "effects") {
    result = await aeCall("TNT_massCopyEffects", [massEditSourceIndex, targets]);
  } else if (action === "keyframes") {
    const keys = normalizeSelectedKeyframes(selectedKeyframes).filter(key => Number(key.layerIndex) === Number(massEditSourceIndex));
    result = await aeCall("TNT_massCopySelectedKeyframes", [massEditSourceIndex, targets, keys]);
  } else if (action === "value") {
    const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
    const value = massEditDialogEl.querySelector(".mass-edit-value").value;
    result = await aeCall("TNT_massSetPropertyValue", [massEditSourceIndex, targets, path, value]);
  } else if (action === "link-property" || action === "unlink-property") {
    const path = massEditDialogEl.querySelector(".mass-edit-property-select").value;
    result = await aeCall("TNT_massWrangleProperty", [
      massEditSourceIndex,
      targets,
      path,
      action === "link-property"
    ]);
  } else {
    return;
  }
  if (!result.ok) {
    errorEl.textContent = result.error || "Mass edit failed.";
    return;
  }
  statusEl.textContent = result.result || "Mass edit complete.";
  await refreshLayers({ forceRender: true });
  renderMassEditPanel();
  focusPanel(2);
}

function showMassEditPanel() {
  const el = ensureMassEditPanel();
  if (el.classList.contains("show")) {
    hideMassEditPanel();
    return;
  }
  renderMassEditPanel();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
}

function hideMassEditPanel() {
  if (!massEditDialogEl) return;
  massEditDialogEl.classList.remove("show");
  massEditDialogEl.setAttribute("aria-hidden", "true");
}
let textAnimationBackdropEl = null;
let textAnimationState = {
  style: "master",
  mode: "both",
  direction: "up",
  basedOn: 3,
  usePosition: true,
  useOpacity: true,
  useScale: false,
  inTime: 0.35,
  outTime: 0.35
};

function ensureTextAnimationPanel() {
  if (textAnimationBackdropEl) return textAnimationBackdropEl;
  textAnimationBackdropEl = document.createElement("div");
  textAnimationBackdropEl.className = "text-animation-backdrop";
  textAnimationBackdropEl.setAttribute("aria-hidden", "true");
  textAnimationBackdropEl.innerHTML = `
    <div class="text-animation-dialog" role="dialog" aria-modal="true" aria-label="Text animation">
      <header class="text-animation-head">
        <div class="text-animation-title"><b>TA</b><span>Text Animation</span><em class="text-animation-count">0 text</em></div>
        <button type="button" class="text-animation-close" aria-label="Close">x</button>
      </header>
      <div class="text-animation-body">
        <section class="text-animation-section">
          <div class="text-animation-section-head">
            <strong>Content</strong>
            <span>Selected text layers or wider text scopes</span>
          </div>
          <div class="text-animation-command-row">
            <button type="button" data-text-command="set" data-tooltip="Set Text Content\nReplace the text on the first or all selected text layers."><strong>Set Text</strong><span>First or all selected</span></button>
            <button type="button" data-text-command="replace" data-tooltip="Find / Replace Text\nSearch selected text, the active comp, or the whole project."><strong>Find / Replace</strong><span>Selected, comp, project</span></button>
          </div>
        </section>

        <section class="text-animation-section text-animation-builder">
          <div class="text-animation-section-head">
            <strong>Animator Builder</strong>
            <span>Applies to selected text layers</span>
          </div>
          <div class="text-animation-grid">
            <label class="text-animation-field">
              <span>Style</span>
              <div class="text-animation-segmented" data-text-option-group="style">
                <button type="button" data-text-option="style" data-value="master">Master</button>
                <button type="button" data-text-option="style" data-value="bounce">Bounce</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Mode</span>
              <div class="text-animation-segmented" data-text-option-group="mode">
                <button type="button" data-text-option="mode" data-value="in">In</button>
                <button type="button" data-text-option="mode" data-value="out">Out</button>
                <button type="button" data-text-option="mode" data-value="both">Both</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Direction</span>
              <div class="text-animation-segmented direction" data-text-option-group="direction">
                <button type="button" data-text-option="direction" data-value="up">Up</button>
                <button type="button" data-text-option="direction" data-value="down">Down</button>
                <button type="button" data-text-option="direction" data-value="left">Left</button>
                <button type="button" data-text-option="direction" data-value="right">Right</button>
              </div>
            </label>
            <label class="text-animation-field">
              <span>Based on</span>
              <div class="text-animation-segmented based-on" data-text-option-group="basedOn">
                <button type="button" data-text-option="basedOn" data-value="1">Chars</button>
                <button type="button" data-text-option="basedOn" data-value="3">Words</button>
                <button type="button" data-text-option="basedOn" data-value="4">Lines</button>
              </div>
            </label>
            <div class="text-animation-field">
              <span>Properties</span>
              <div class="text-animation-checks">
                <label><input type="checkbox" data-text-toggle="usePosition"> Position</label>
                <label><input type="checkbox" data-text-toggle="useOpacity"> Opacity</label>
                <label><input type="checkbox" data-text-toggle="useScale"> Scale</label>
              </div>
            </div>
            <div class="text-animation-field">
              <span>Timing</span>
              <div class="text-animation-times">
                <label><span>In</span><input type="number" min="0" step="0.05" data-text-number="inTime"></label>
                <label><span>Out</span><input type="number" min="0" step="0.05" data-text-number="outTime"></label>
              </div>
            </div>
          </div>
          <button type="button" class="text-animation-apply" data-text-apply="builder" data-tooltip="Apply Text Animator\nBuild text animators using the selected style, mode, direction, grouping, properties, and timing.">Apply Animator</button>
        </section>

        <section class="text-animation-section">
          <div class="text-animation-section-head">
            <strong>Presets</strong>
            <span>Fast common text animator setups</span>
          </div>
          <div class="text-animation-preset-grid">
            <button type="button" data-text-preset="master-in-up"><strong>In Up</strong><span>Position + opacity</span></button>
            <button type="button" data-text-preset="master-out-up"><strong>Out Up</strong><span>Position + opacity</span></button>
            <button type="button" data-text-preset="master-both-up"><strong>In + Out Up</strong><span>Balanced default</span></button>
            <button type="button" data-text-preset="master-both-left"><strong>In + Out Left</strong><span>Side reveal</span></button>
            <button type="button" data-text-preset="master-scale-both"><strong>Scale Pop</strong><span>Scale + opacity</span></button>
            <button type="button" data-text-preset="bounce-in-up"><strong>Bounce In</strong><span>Upward bounce</span></button>
          </div>
        </section>
      </div>
      <div class="text-animation-error"></div>
    </div>
  `;
  document.body.appendChild(textAnimationBackdropEl);
  textAnimationBackdropEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
  textAnimationBackdropEl.querySelector(".text-animation-close").addEventListener("click", hideTextAnimationPanel);
  textAnimationBackdropEl.addEventListener("mousedown", event => {
    if (event.target === textAnimationBackdropEl) hideTextAnimationPanel();
  });
  textAnimationBackdropEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      hideTextAnimationPanel();
      focusPanel(2);
    }
  });
  textAnimationBackdropEl.addEventListener("click", event => {
    const option = event.target.closest && event.target.closest("[data-text-option]");
    if (option) {
      const key = option.dataset.textOption;
      textAnimationState[key] = key === "basedOn" ? Number(option.dataset.value || 3) : option.dataset.value;
      renderTextAnimationPanel();
      return;
    }
    const command = event.target.closest && event.target.closest("[data-text-command]");
    if (command) {
      runTextAnimationCommand(command.dataset.textCommand);
      return;
    }
    const preset = event.target.closest && event.target.closest("[data-text-preset]");
    if (preset) {
      applyTextAnimationPreset(preset.dataset.textPreset);
      return;
    }
    const apply = event.target.closest && event.target.closest("[data-text-apply]");
    if (apply) applyTextAnimationBuilder();
  });
  textAnimationBackdropEl.addEventListener("change", event => {
    const toggle = event.target.closest && event.target.closest("[data-text-toggle]");
    if (toggle) {
      textAnimationState[toggle.dataset.textToggle] = !!toggle.checked;
      renderTextAnimationPanel();
      return;
    }
    const number = event.target.closest && event.target.closest("[data-text-number]");
    if (number) {
      textAnimationState[number.dataset.textNumber] = Math.max(0, Number(number.value || 0));
      renderTextAnimationPanel();
    }
  });
  return textAnimationBackdropEl;
}

function textAnimationSelectedTextCount() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  return (state.layers || []).filter(layer => selected.has(Number(layer.index)) && layer.type === "Text").length;
}

function renderTextAnimationPanel() {
  if (!textAnimationBackdropEl) return;
  const count = textAnimationSelectedTextCount();
  const countEl = textAnimationBackdropEl.querySelector(".text-animation-count");
  if (countEl) countEl.textContent = `${count} text layer${count === 1 ? "" : "s"}`;
  textAnimationBackdropEl.querySelectorAll("[data-text-option]").forEach(button => {
    const key = button.dataset.textOption;
    button.classList.toggle("active", String(textAnimationState[key]) === String(button.dataset.value));
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-toggle]").forEach(input => {
    input.checked = !!textAnimationState[input.dataset.textToggle];
  });
  textAnimationBackdropEl.querySelectorAll("[data-text-number]").forEach(input => {
    input.value = String(textAnimationState[input.dataset.textNumber]);
  });
  const apply = textAnimationBackdropEl.querySelector("[data-text-apply]");
  if (apply) apply.disabled = count < 1;
  textAnimationBackdropEl.querySelectorAll("[data-text-preset]").forEach(button => {
    button.disabled = count < 1;
  });
  const error = textAnimationBackdropEl.querySelector(".text-animation-error");
  if (error) error.textContent = count < 1 ? "Select at least one text layer to apply text animation." : "";
}

function showTextAnimationPanel() {
  const el = ensureTextAnimationPanel();
  if (el.classList.contains("show")) {
    hideTextAnimationPanel();
    return;
  }
  renderTextAnimationPanel();
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
}

function hideTextAnimationPanel() {
  if (!textAnimationBackdropEl) return;
  textAnimationBackdropEl.classList.remove("show");
  textAnimationBackdropEl.setAttribute("aria-hidden", "true");
  refreshSyncPausedVisualState();
}

async function runTextAnimationCommand(command) {
  if (command === "set") await promptSetTextContent();
  else if (command === "replace") await promptFindReplaceText();
  renderTextAnimationPanel();
}

function textAnimationArgsFromState() {
  return [
    textAnimationState.direction,
    Number(textAnimationState.basedOn || 3),
    !!textAnimationState.usePosition,
    !!textAnimationState.useOpacity,
    !!textAnimationState.useScale,
    Number(textAnimationState.inTime || 0),
    Number(textAnimationState.outTime || 0),
    textAnimationState.mode
  ];
}

async function applyTextAnimationBuilder() {
  if (textAnimationSelectedTextCount() < 1) {
    renderTextAnimationPanel();
    return;
  }
  const fn = textAnimationState.style === "bounce" ? "applyTextAnimBounce" : "applyTextAnimMaster";
  await runTntV3Command({ name: "Text Animation", tntFunction: fn, args: textAnimationArgsFromState() });
  renderTextAnimationPanel();
}

async function applyTextAnimationPreset(name) {
  const presets = {
    "master-in-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "in"]],
    "master-out-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "out"]],
    "master-both-up": ["applyTextAnimMaster", ["up", 3, true, true, false, 0.35, 0.35, "both"]],
    "master-both-left": ["applyTextAnimMaster", ["left", 3, true, true, false, 0.35, 0.35, "both"]],
    "master-scale-both": ["applyTextAnimMaster", ["up", 3, false, true, true, 0.35, 0.35, "both"]],
    "bounce-in-up": ["applyTextAnimBounce", ["up", 3, true, true, false, 0.35, 0.35, "in"]]
  };
  const preset = presets[name];
  if (!preset) return;
  await runTntV3Command({ name: "Text Animation Preset", tntFunction: preset[0], args: preset[1] });
  renderTextAnimationPanel();
}
let timingOrderBackdropEl = null;
let timingOrderDirection = "asc";
let timingOrderUnit = "frames";
let timingOrderBaseStartTimes = null;
let timingOrderBaseKeyTimes = null;
let timingOrderStaggerOrderIndices = null;
let timingOrderLiveTimer = null;
let timingOrderLiveInFlight = false;
let timingOrderLivePending = false;
let layerOrderBasis = "in";
let layerOrderDirection = "asc";
let layerOrderProximity = "closest";

function timingOrderSelectedCount() {
  return (state.selectedLayerIndices || []).length;
}

function timingOrderSelectedKeyCount() {
  return selectedKeyframes && selectedKeyframes.length ? selectedKeyframes.length : 0;
}

function timingOrderStaggerTarget() {
  return timingOrderSelectedKeyCount() >= 2 ? "keyframes" : "layers";
}

function timingOrderStaggerCount() {
  return timingOrderStaggerTarget() === "keyframes" ? timingOrderSelectedKeyCount() : timingOrderSelectedCount();
}

function ensureTimingOrderPanel() {
  if (timingOrderBackdropEl) return timingOrderBackdropEl;
  timingOrderBackdropEl = document.createElement("div");
  timingOrderBackdropEl.className = "timing-order-backdrop";
  timingOrderBackdropEl.setAttribute("aria-hidden", "true");
  timingOrderBackdropEl.innerHTML = `
    <div class="timing-order-layout" role="dialog" aria-modal="true" aria-label="Stagger and layer order">
      <section class="timing-order-card timing-stagger-card">
        <header class="timing-order-head">
          <div class="timing-order-title"><b>ST</b><span>Stagger</span><em class="timing-order-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-execute-actions" role="group" aria-label="Choose stagger direction">
            <button type="button" data-stagger-execute="asc" data-tooltip="Bottom Up\nUse the bottom selected layer as the first layer, then stagger upward."><strong>Bottom up</strong><span>Stagger upward</span></button>
            <button type="button" data-stagger-execute="desc" data-tooltip="Top Down\nUse the top selected layer as the first layer, then stagger downward."><strong>Top down</strong><span>Stagger downward</span></button>
            <button type="button" data-stagger-execute="random" data-tooltip="Random Stagger\nShuffle the selected layers once, then use the slider to set the offset."><strong>Random</strong><span>Shuffle timing</span></button>
          </div>
          <div class="timing-order-field">
            <span>Offset / gap</span>
            <div class="timing-amount-row">
              <input class="timing-amount-range" type="range" min="0" max="60" step="1" value="0" data-tooltip="Apply Stagger\nChoose a direction above, then drag to apply the offset from the original layer positions.">
              <input class="timing-amount-input" type="number" min="0" step="1" value="0" data-tooltip="Exact Offset\nEnter an exact amount. The selected stagger direction applies from the original layer positions.">
              <label class="timing-group-control" data-tooltip="Group Size\nRepeat offsets inside groups. 1 staggers every selected layer in one run.">
                <span>Group</span>
                <input class="timing-group-input" type="number" min="1" step="1" value="1">
              </label>
              <div class="timing-order-segmented timing-unit" role="group" aria-label="Timing unit">
                <button type="button" data-timing-unit="frames" data-tooltip="Frames\nMeasure the offset using composition frames.">F</button>
                <button type="button" data-timing-unit="seconds" data-tooltip="Seconds\nMeasure the offset using seconds.">S</button>
              </div>
            </div>
            <div class="timing-live-status">Choose a direction, then move the slider to apply.</div>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>

      <section class="timing-order-card layer-order-card">
        <header class="timing-order-head">
          <div class="timing-order-title"><b>OR</b><span>Layer Order</span><em class="timing-order-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-order-field">
            <span>Direction</span>
            <div class="timing-order-segmented order-direction" role="group" aria-label="Layer order direction">
              <button type="button" data-order-direction="asc" data-tooltip="Ascending\nSmallest value goes to the top of the selected stack.">Ascending</button>
              <button type="button" data-order-direction="desc" data-tooltip="Descending\nLargest value goes to the top of the selected stack.">Descending</button>
            </div>
          </div>
          <div class="timing-order-field">
            <span>Sort selected layers</span>
            <div class="timing-execute-actions order-sort-actions" role="group" aria-label="Sort selected layers">
              <button type="button" data-order-sort="in" data-tooltip="By In Point\nSort selected layers by in point."><strong>In point</strong><span>Layer start</span></button>
              <button type="button" data-order-sort="out" data-tooltip="By Out Point\nSort selected layers by out point."><strong>Out point</strong><span>Layer end</span></button>
              <button type="button" data-order-sort="x" data-tooltip="By X Position\nSort selected layers by Position X at the current time."><strong>X position</strong><span>Left to right</span></button>
              <button type="button" data-order-sort="y" data-tooltip="By Y Position\nSort selected layers by Position Y at the current time."><strong>Y position</strong><span>Top to bottom</span></button>
              <button type="button" data-order-sort="firstKey" data-tooltip="Earliest Keyframe\nSort by each layer's earliest keyframe. Layers with no keys use their in point."><strong>First key</strong><span>Earliest key</span></button>
              <button type="button" data-order-sort="lastKey" data-tooltip="Last Keyframe\nSort by each layer's latest keyframe. Layers with no keys use their in point."><strong>Last key</strong><span>Latest key</span></button>
              <button type="button" data-order-sort="random" data-tooltip="Randomize\nShuffle selected layers and move the shuffled selection to the top of the stack."><strong>Random</strong><span>Shuffle stack</span></button>
            </div>
          </div>
          <div class="timing-execute-actions order-stack-actions" role="group" aria-label="Send selected layers">
            <button type="button" data-order-stack="top" data-tooltip="Send to Top\nMove the selected layers to the top of the composition stack while preserving their order."><strong>Send to top</strong><span>Top of layer stack</span></button>
            <button type="button" data-order-stack="reverse" data-tooltip="Flip Layer Order\nReverse the selected layers inside their current stack slots."><strong>Flip order</strong><span>Reverse selected stack</span></button>
            <button type="button" data-order-stack="bottom" data-tooltip="Send to Bottom\nMove the selected layers to the bottom of the composition stack while preserving their order."><strong>Send to bottom</strong><span>Bottom of layer stack</span></button>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>

      <section class="timing-order-card timing-snap-pull-card">
        <header class="timing-order-head">
          <div class="timing-order-title"><b>SP</b><span>Pull / Snap</span><em class="timing-key-count"></em></div>
        </header>
        <div class="timing-order-body">
          <div class="timing-compact-group timing-pull-group">
            <div class="timing-compact-head">
              <strong>Pull whole selection</strong>
              <span>Move the selected layer group together</span>
            </div>
            <div class="timing-execute-actions timing-two-actions" role="group" aria-label="Pull layer group">
              <button type="button" data-pull-layer="in" data-tooltip="Pull Group In\nMove the whole selected layer group so the earliest in point lands at the playhead."><strong>In to playhead</strong><span>Keep spacing</span></button>
              <button type="button" data-pull-layer="out" data-tooltip="Pull Group Out\nMove the whole selected layer group so the latest out point lands at the playhead."><strong>Out to playhead</strong><span>Keep spacing</span></button>
            </div>
          </div>
          <div class="timing-compact-group timing-snap-group">
            <div class="timing-compact-head">
              <strong>Snap smaller groups</strong>
              <span>Move layers, properties, or selected key groups independently</span>
            </div>
            <div class="timing-snap-grid">
              <div class="timing-snap-scope">
                <span>Layers</span>
                <button type="button" data-snap-layer="in" data-tooltip="Snap Layer In Points\nMove each selected layer independently so its in point lands at the playhead.">In</button>
                <button type="button" data-snap-layer="out" data-tooltip="Snap Layer Out Points\nMove each selected layer independently so its out point lands at the playhead.">Out</button>
              </div>
              <div class="timing-snap-scope">
                <span>Properties</span>
                <button type="button" data-snap-keyframes="first" data-key-scope="property" data-tooltip="Snap Each Property First Key\nMove selected keys on each property so that property's first selected key lands at the playhead.">First</button>
                <button type="button" data-snap-keyframes="last" data-key-scope="property" data-tooltip="Snap Each Property Last Key\nMove selected keys on each property so that property's last selected key lands at the playhead.">Last</button>
              </div>
              <div class="timing-snap-scope">
                <span>Key groups</span>
                <button type="button" data-snap-keyframes="first" data-key-scope="layer" data-tooltip="Snap Key Group First\nMove selected keys as layer groups so each group's first selected key lands at the playhead.">First</button>
                <button type="button" data-snap-keyframes="last" data-key-scope="layer" data-tooltip="Snap Key Group Last\nMove selected keys as layer groups so each group's last selected key lands at the playhead.">Last</button>
              </div>
            </div>
          </div>
        </div>
        <div class="timing-order-error"></div>
      </section>
    </div>
  `;
  document.body.appendChild(timingOrderBackdropEl);
  timingOrderBackdropEl.querySelectorAll("[data-tooltip]").forEach(control => {
    control.setAttribute("aria-label", control.dataset.tooltip.replace(/\n+/g, ". "));
    bindPanelTooltip(control);
  });
  timingOrderBackdropEl.addEventListener("mousedown", event => {
    if (event.target === timingOrderBackdropEl) hideTimingOrderPanel();
  });
  timingOrderBackdropEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideTimingOrderPanel();
      focusPanel(2);
    }
  });
  timingOrderBackdropEl.addEventListener("click", event => {
    const staggerExecute = event.target.closest && event.target.closest("[data-stagger-execute]");
    if (staggerExecute && !staggerExecute.disabled) {
      timingOrderDirection = staggerExecute.dataset.staggerExecute || "";
      captureTimingOrderBaseline();
      renderTimingOrderPanel();
      return;
    }
    const unit = event.target.closest && event.target.closest("[data-timing-unit]");
    if (unit) {
      const previousUnit = timingOrderUnit;
      const nextUnit = unit.dataset.timingUnit || "frames";
      const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
      const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
      const fps = Math.max(1, Number(state.comp && state.comp.frameRate || 30));
      const currentAmount = Math.max(0, Number(amountInput.value || 0));
      timingOrderUnit = nextUnit;
      const seconds = nextUnit === "seconds";
      const convertedAmount = previousUnit === nextUnit
        ? currentAmount
        : (seconds ? currentAmount / fps : currentAmount * fps);
      amountInput.step = seconds ? "0.05" : "1";
      amountRange.max = seconds ? "5" : "60";
      amountRange.step = seconds ? "0.05" : "1";
      amountInput.value = seconds
        ? String(Math.round(convertedAmount * 100) / 100)
        : String(Math.round(convertedAmount));
      amountRange.value = amountInput.value;
      updateTimingOrderRangeFill();
      renderTimingOrderPanel();
      scheduleTimingStaggerApply();
      return;
    }
    const directionButton = event.target.closest && event.target.closest("[data-order-direction]");
    if (directionButton) {
      layerOrderDirection = directionButton.dataset.orderDirection || "asc";
      renderTimingOrderPanel();
      return;
    }
    const sortExecute = event.target.closest && event.target.closest("[data-order-sort]");
    if (sortExecute && !sortExecute.disabled) {
      runLayerOrderPanelAction(sortExecute.dataset.orderSort || "");
      return;
    }
    const stackExecute = event.target.closest && event.target.closest("[data-order-stack]");
    if (stackExecute && !stackExecute.disabled) {
      runLayerStackPanelAction(stackExecute.dataset.orderStack || "");
      return;
    }
    const pullLayer = event.target.closest && event.target.closest("[data-pull-layer]");
    if (pullLayer && !pullLayer.disabled) {
      runSnapPullPanelAction("pull", "layer", pullLayer.dataset.pullLayer || "in");
      return;
    }
    const snapLayer = event.target.closest && event.target.closest("[data-snap-layer]");
    if (snapLayer && !snapLayer.disabled) {
      runSnapPullPanelAction("snap", "layer", snapLayer.dataset.snapLayer || "in");
      return;
    }
    const snapKeys = event.target.closest && event.target.closest("[data-snap-keyframes]");
    if (snapKeys && !snapKeys.disabled) {
      runSnapPullPanelAction("snap", "keyframes", snapKeys.dataset.snapKeyframes || "first", { scope: snapKeys.dataset.keyScope || "layer" });
    }
  });
  const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
  const groupInput = timingOrderBackdropEl.querySelector(".timing-group-input");
  amountRange.addEventListener("input", () => {
    amountInput.value = amountRange.value;
    updateTimingOrderRangeFill();
    scheduleTimingStaggerApply();
  });
  amountRange.addEventListener("change", () => {
    scheduleTimingStaggerApply({ immediate: true });
  });
  amountInput.addEventListener("input", () => {
    let value = Number(amountInput.value || 0);
    if (!Number.isFinite(value)) value = 0;
    if (value > Number(amountRange.max)) amountRange.max = String(value);
    amountRange.value = String(Math.max(0, value));
    updateTimingOrderRangeFill();
    scheduleTimingStaggerApply();
  });
  amountInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleTimingStaggerApply({ immediate: true });
    }
  });
  groupInput.addEventListener("input", () => {
    let value = Math.round(Number(groupInput.value || 1));
    if (!Number.isFinite(value) || value < 1) value = 1;
    groupInput.value = String(value);
    scheduleTimingStaggerApply();
  });
  groupInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      scheduleTimingStaggerApply({ immediate: true });
    }
  });
  return timingOrderBackdropEl;
}

function captureTimingOrderBaseline() {
  timingOrderBaseKeyTimes = null;
  if (timingOrderStaggerTarget() === "keyframes") {
    timingOrderBaseKeyTimes = (selectedKeyframes || []).map(key => ({
      layerIndex: Number(key.layerIndex || 0),
      propertyPath: String(key.propertyPath || ""),
      keyIndex: Number(key.keyIndex || 0),
      time: Number(key.time || 0)
    })).filter(key => key.layerIndex && key.propertyPath && key.keyIndex && Number.isFinite(key.time));
    timingOrderBaseStartTimes = null;
    timingOrderStaggerOrderIndices = null;
    return;
  }
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const selectedLayers = (state.layers || [])
    .filter(layer => selected.has(Number(layer.index)))
    .map(layer => ({ index: Number(layer.index), startTime: Number(layer.startTime || 0) }));
  timingOrderBaseStartTimes = selectedLayers.map(layer => ({ index: layer.index, startTime: layer.startTime }));
  timingOrderStaggerOrderIndices = null;
  if (timingOrderDirection === "random") {
    const indices = selectedLayers.map(layer => layer.index);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    timingOrderStaggerOrderIndices = indices;
  }
}

function resetTimingOrderStaggerState() {
  timingOrderDirection = "asc";
  timingOrderBaseStartTimes = null;
  timingOrderBaseKeyTimes = null;
  timingOrderStaggerOrderIndices = null;
  if (timingOrderLiveTimer) clearTimeout(timingOrderLiveTimer);
  timingOrderLiveTimer = null;
  timingOrderLivePending = false;
}

function scheduleTimingStaggerApply(options = {}) {
  if (!timingOrderBackdropEl || !timingOrderDirection || timingOrderStaggerCount() < 2) return;
  if (timingOrderStaggerTarget() === "keyframes") {
    if (!timingOrderBaseKeyTimes || !timingOrderBaseKeyTimes.length) captureTimingOrderBaseline();
  } else if (!timingOrderBaseStartTimes || !timingOrderBaseStartTimes.length) {
    captureTimingOrderBaseline();
  }
  if (timingOrderLiveTimer) clearTimeout(timingOrderLiveTimer);
  const delay = options.immediate ? 0 : 220;
  timingOrderLiveTimer = setTimeout(() => {
    timingOrderLiveTimer = null;
    runTimingPanelAction("stagger", timingOrderDirection, { live: true });
  }, delay);
}

function updateTimingOrderRangeFill() {
  if (!timingOrderBackdropEl) return;
  const input = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const pct = Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100));
  input.style.setProperty("--range-fill", `${pct}%`);
}

function renderTimingOrderPanel() {
  if (!timingOrderBackdropEl) return;
  const count = timingOrderSelectedCount();
  const keyCount = timingOrderSelectedKeyCount();
  const staggerTarget = timingOrderStaggerTarget();
  const staggerCount = timingOrderStaggerCount();
  const staggerCountEl = timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-count");
  if (staggerCountEl) {
    staggerCountEl.textContent = staggerTarget === "keyframes"
      ? `${keyCount} key${keyCount === 1 ? "" : "s"}`
      : `${count} layer${count === 1 ? "" : "s"}`;
  }
  timingOrderBackdropEl.querySelectorAll(".layer-order-card .timing-order-count").forEach(el => {
    el.textContent = `${count} layer${count === 1 ? "" : "s"}`;
  });
  timingOrderBackdropEl.querySelectorAll("[data-timing-unit]").forEach(button => {
    button.classList.toggle("active", button.dataset.timingUnit === timingOrderUnit);
  });
  timingOrderBackdropEl.querySelectorAll("[data-stagger-execute]").forEach(button => {
    button.disabled = staggerCount < 2;
    button.classList.toggle("active", !!timingOrderDirection && button.dataset.staggerExecute === timingOrderDirection);
  });
  const amountRange = timingOrderBackdropEl.querySelector(".timing-amount-range");
  const amountInput = timingOrderBackdropEl.querySelector(".timing-amount-input");
  const groupInput = timingOrderBackdropEl.querySelector(".timing-group-input");
  const amountDisabled = staggerCount < 2 || !timingOrderDirection;
  if (amountRange) amountRange.disabled = amountDisabled;
  if (amountInput) amountInput.disabled = amountDisabled;
  if (groupInput) groupInput.disabled = amountDisabled;
  const liveStatus = timingOrderBackdropEl.querySelector(".timing-live-status");
  if (liveStatus) {
    liveStatus.textContent = staggerCount < 2
      ? (staggerTarget === "keyframes" ? "Select at least two keyframes to stagger." : "Select at least two layers to stagger.")
      : (timingOrderDirection
        ? `Slider applies from the original ${staggerTarget === "keyframes" ? "keyframe" : "layer"} positions.`
        : `Choose a direction, then move the slider to stagger ${staggerTarget}.`);
  }
  timingOrderBackdropEl.querySelectorAll("[data-order-direction]").forEach(button => {
    button.classList.toggle("active", button.dataset.orderDirection === layerOrderDirection);
  });
  timingOrderBackdropEl.querySelectorAll("[data-order-sort]").forEach(button => {
    button.disabled = count < 2;
    button.classList.toggle("active", button.dataset.orderSort === layerOrderBasis);
  });
  timingOrderBackdropEl.querySelectorAll("[data-order-stack]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-error").textContent =
    staggerCount < 2
      ? (staggerTarget === "keyframes" ? "Select at least two keyframes to stagger." : "Select at least two layers to stagger.")
      : "";
  timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error").textContent =
    count < 2 ? "Select at least two layers to sort." : "";
  const keyCountEl = timingOrderBackdropEl.querySelector(".timing-key-count");
  if (keyCountEl) keyCountEl.textContent = `${keyCount} key${keyCount === 1 ? "" : "s"}`;
  timingOrderBackdropEl.querySelectorAll("[data-pull-layer]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelectorAll("[data-snap-layer]").forEach(button => {
    button.disabled = count < 1;
  });
  timingOrderBackdropEl.querySelectorAll("[data-snap-keyframes]").forEach(button => {
    button.disabled = keyCount < 1;
  });
  const snapError = timingOrderBackdropEl.querySelector(".timing-snap-pull-card .timing-order-error");
  if (snapError) snapError.textContent = count < 1 ? "Select at least one layer." : "";
  updateTimingOrderRangeFill();
}

async function runTimingPanelAction(action, direction = timingOrderDirection, options = {}) {
  const target = timingOrderStaggerTarget();
  if (!timingOrderBackdropEl || timingOrderStaggerCount() < 2) return;
  if (action === "stagger" && !direction) return;
  if (options.live && timingOrderLiveInFlight) {
    timingOrderLivePending = true;
    return;
  }
  const amount = Math.max(0, Number(timingOrderBackdropEl.querySelector(".timing-amount-input").value || 0));
  const groupSize = Math.max(1, Math.round(Number(timingOrderBackdropEl.querySelector(".timing-group-input").value || 1)));
  const error = timingOrderBackdropEl.querySelector(".timing-stagger-card .timing-order-error");
  error.textContent = "";
  timingOrderLiveInFlight = !!options.live;
  const timingOptions = {
    direction,
    amount,
    unit: timingOrderUnit,
    group: groupSize
  };
  if (target === "keyframes") {
    timingOptions.baseKeyTimes = timingOrderBaseKeyTimes || [];
    await runKeyframeTimingAction(action, timingOptions);
  } else {
    timingOptions.baseStartTimes = timingOrderBaseStartTimes || [];
    timingOptions.orderIndices = timingOrderStaggerOrderIndices || [];
    await runLayerTimingAction(action, timingOptions);
  }
  timingOrderLiveInFlight = false;
  renderTimingOrderPanel();
  if (timingOrderLivePending) {
    timingOrderLivePending = false;
    scheduleTimingStaggerApply({ immediate: true });
  }
}

async function runLayerOrderPanelAction(mode) {
  const error = timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error");
  error.textContent = "";
  layerOrderBasis = mode || layerOrderBasis || "in";
  await sortSelectedLayersByOrder(mode, layerOrderDirection);
  renderTimingOrderPanel();
}

async function runLayerStackPanelAction(mode) {
  const error = timingOrderBackdropEl.querySelector(".layer-order-card .timing-order-error");
  error.textContent = "";
  await moveSelectedLayersInStack(mode);
  renderTimingOrderPanel();
}

async function runSnapPullPanelAction(action, target, anchor, options = {}) {
  const error = timingOrderBackdropEl.querySelector(".timing-snap-pull-card .timing-order-error");
  if (error) error.textContent = "";
  if (target === "keyframes") {
    await runKeyframeTimingAction(action, Object.assign({ anchor }, options));
  } else {
    await runLayerTimingAction(action, { anchor });
  }
  renderTimingOrderPanel();
}

function showTimingOrderPanel() {
  const panel = ensureTimingOrderPanel();
  if (panel.classList.contains("show")) {
    hideTimingOrderPanel();
    return;
  }
  resetTimingOrderStaggerState();
  const amountRange = panel.querySelector(".timing-amount-range");
  const amountInput = panel.querySelector(".timing-amount-input");
  const groupInput = panel.querySelector(".timing-group-input");
  if (amountRange) amountRange.value = "0";
  if (amountInput) amountInput.value = "0";
  if (groupInput) groupInput.value = "1";
  captureTimingOrderBaseline();
  renderTimingOrderPanel();
  panel.classList.add("show");
  panel.setAttribute("aria-hidden", "false");
}

function hideTimingOrderPanel() {
  if (!timingOrderBackdropEl) return;
  resetTimingOrderStaggerState();
  timingOrderBackdropEl.classList.remove("show");
  timingOrderBackdropEl.setAttribute("aria-hidden", "true");
}
function currentFrameRate() {
  return Math.max(1, Math.round(Number(state.comp && state.comp.frameRate || 30)));
}

function parseDurationInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return Number(raw);
  const parts = raw.split(':').map(Number);
  if (parts.some(n => Number.isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) {
    const fps = currentFrameRate();
    return parts[0] * 60 + parts[1] + parts[2] / fps;
  }
  return null;
}

function showDurationDialog() {
  if (!state.comp || !durationModalEl) return;
  durationInputEl.value = formatDurationForInput(state.comp.duration || 0);
  durationErrorEl.textContent = "";
  durationModalEl.classList.add("show");
  durationModalEl.setAttribute("aria-hidden", "false");
  setTimeout(() => { durationInputEl.focus(); durationInputEl.select(); }, 0);
}

function hideDurationDialog() {
  if (!durationModalEl) return;
  durationModalEl.classList.remove("show");
  durationModalEl.setAttribute("aria-hidden", "true");
}

function formatDurationForInput(seconds) {
  seconds = Math.max(0, Number(seconds || 0));
  const fps = currentFrameRate();
  const totalFrames = Math.max(0, Math.round(seconds * fps));
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

function formatMarkerDurationForInput(seconds) {
  return formatDurationForInput(seconds);
}

async function applyCompDurationFromDialog() {
  if (!state.comp) return;
  const seconds = parseDurationInput(durationInputEl.value);
  if (!seconds || seconds <= 0) {
    durationErrorEl.textContent = "Enter a valid duration, e.g. 10, 00:10, or 01:02:15.";
    return;
  }
  await loadJSX();
  const result = await aeCall('TNT_setCompDuration', [seconds]);
  if (result.ok) {
    hideDurationDialog();
    userZoomed = false;
    await refreshAfterPanelAction();
  } else {
    durationErrorEl.textContent = result.error || 'Could not set comp duration.';
  }
}

async function promptCompDuration() {
  showDurationDialog();
}

function setAnchorDialogPoint(point) {
  selectedAnchorPoint = String(point || "C");
  if (!anchorGridEl) return;
  anchorGridEl.querySelectorAll(".anchor-cell").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.point === selectedAnchorPoint);
  });
}

function showAnchorDialog() {
  if (!state.comp || !anchorModalEl) return;
  anchorErrorEl.textContent = "";
  setAnchorDialogPoint(selectedAnchorPoint || "C");
  anchorModalEl.classList.add("show");
  anchorModalEl.setAttribute("aria-hidden", "false");
}

function hideAnchorDialog() {
  if (!anchorModalEl) return;
  anchorModalEl.classList.remove("show");
  anchorModalEl.setAttribute("aria-hidden", "true");
}

function toggleAnchorDialog() {
  if (!anchorModalEl) return;
  if (anchorModalEl.classList.contains("show")) {
    hideAnchorDialog();
    focusPanel(2);
  } else {
    showAnchorDialog();
  }
}

function showCompositionPanel() {
  if (!compositionModalEl || !state.comp) return;
  if (compositionNameEl) compositionNameEl.textContent = state.comp.name || "Active comp";
  if (compositionErrorEl) compositionErrorEl.textContent = "";
  compositionModalEl.classList.add("show");
  compositionModalEl.setAttribute("aria-hidden", "false");
}

function hideCompositionPanel() {
  if (!compositionModalEl) return;
  compositionModalEl.classList.remove("show");
  compositionModalEl.setAttribute("aria-hidden", "true");
}

function toggleCompositionPanel() {
  if (!compositionModalEl) return;
  if (compositionModalEl.classList.contains("show")) {
    hideCompositionPanel();
    focusPanel(2);
  } else {
    showCompositionPanel();
  }
}

function openSubpanelByKey(key) {
  if (!QUICK_PANEL_MODE) {
    launchNativeQuickControls();
    return;
  }
  const panelActions = {
    anchor: toggleAnchorDialog,
    composition: toggleCompositionPanel,
    ease: showEaseDialog,
    mask: openMaskControlPanel,
    effects: openEffectsControlPanel,
    shapes: openShapesControlPanel,
    styles: openLayerStylePanel,
    "layer-menu": openQuickPanelLayerMenu,
    "mass-edit": showMassEditPanel,
    "text-animation": showTextAnimationPanel,
    "timing-order": showTimingOrderPanel,
    filter: showLayerSelectionPanel
  };
  const action = panelActions[key];
  if (action) action();
}

async function runCompositionPanelAction(action) {
  if (!state.comp) return;
  if (compositionErrorEl) compositionErrorEl.textContent = "";
  if (action === "rename") {
    await promptRenameComp();
    return;
  }
  if (action === "duration") {
    await promptCompDuration();
    return;
  }
  const commands = {
    trim: { name: "Auto Trim Comp", tntFunction: "autoTrimComp", args: [false] },
    crop: { name: "Auto Crop Comps", tntFunction: "cropComp", args: [false, 0] },
    precompose: { name: "Pre-compose Selected", tntFunction: "precomposeSelected" },
    render: { name: "Add to Render Queue", tntFunction: "addToRenderQueue" }
  };
  const command = commands[action];
  if (!command) return;
  await runTntV3Command(command);
}

function closeActivePopup() {
  let closed = false;
  if (propertyValueEditorEl) {
    closePropertyValueEditor();
    closed = true;
  }
  if (propertyValueHoverEl && propertyValueHoverEl.classList.contains("show")) {
    hidePropertyValueHover();
    closed = true;
  }
  if (isLayerMenuOpen()) {
    hideLayerMenu();
    closed = true;
  }
  if (closeSettingsMenu()) closed = true;
  if (shortcutRundownEl && shortcutRundownEl.classList.contains("show")) {
    closeShortcutRundown();
    closed = true;
  }
  if (layerStyleDialogEl && layerStyleDialogEl.classList.contains("show")) {
    closeLayerStyleDialog();
    closed = true;
  }
  if (maskControlDialogEl && maskControlDialogEl.classList.contains("show")) {
    closeMaskControlDialog();
    closed = true;
  }
  if (layerSelectionModalEl && layerSelectionModalEl.classList.contains("show")) {
    hideLayerSelectionPanel();
    closed = true;
  }
  if (compositionModalEl && compositionModalEl.classList.contains("show")) {
    hideCompositionPanel();
    closed = true;
  }
  if (anchorModalEl && anchorModalEl.classList.contains("show")) {
    hideAnchorDialog();
    closed = true;
  }
  if (easeDialogEl && easeDialogEl.classList.contains("show")) {
    hideEaseDialog();
    closed = true;
  }
  if (massEditDialogEl && massEditDialogEl.classList.contains("show")) {
    hideMassEditPanel();
    closed = true;
  }
  if (textAnimationBackdropEl && textAnimationBackdropEl.classList.contains("show")) {
    hideTextAnimationPanel();
    closed = true;
  }
  if (timingOrderBackdropEl && timingOrderBackdropEl.classList.contains("show")) {
    hideTimingOrderPanel();
    closed = true;
  }
  if (compSelectEl && compSelectEl.classList.contains("open")) {
    closeCompSelect();
    closed = true;
  }
  if (flowChartOverlayEl && flowChartOverlayEl.classList.contains("open")) {
    closeFlowChart();
    closed = true;
  }
  if (closed) focusPanel(2);
  return closed;
}

async function applyAnchorPoint(point = selectedAnchorPoint) {
  if (!state.comp) return;
  setAnchorDialogPoint(point || "C");
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_setSelectedAnchorPoint", [selectedAnchorPoint || "C", !!(anchorUseMasksEl && anchorUseMasksEl.checked)]);
  if (!result.ok) {
    anchorErrorEl.textContent = result.error || "Could not set anchor point.";
    return;
  }
  hideAnchorDialog();
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function centerSelectedAnchorPoints() {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_centerSelectedAnchorPoint");
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not center anchor point.";
    return;
  }
  hideAnchorDialog();
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function alignSelectedLayersFromAnchorPanel(mode) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  await loadJSX();
  const result = await aeCall("TNT_alignSelectedLayersToComp", [String(mode || ""), !!(anchorUseMasksEl && anchorUseMasksEl.checked)]);
  if (!result.ok) {
    anchorErrorEl.textContent = result.error || "Could not align selected layers.";
    return;
  }
  await refreshLayers({ forceRender: true });
  focusPanel(2);
}

async function addMarkerAtPlayhead() {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 900;
  await loadJSX();
  const result = await aeCall("TNT_addCompMarkerAtTime", [snapTimeToFrame(state.comp.time || 0)]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not add marker.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

async function saveProjectFromPanel() {
  suppressSyncUntil = Date.now() + 700;
  await loadJSX();
  const result = await aeCall("TNT_saveProject");
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not save project.";
    return;
  }
  statusEl.textContent = result.path ? `Saved ${result.path}` : "Project saved.";
  focusPanel(2);
}

async function runNativeEditShortcut(kind) {
  if (!state.comp) return;
  suppressSyncUntil = Date.now() + 1000;
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(1);
  await loadJSX();
  const result = await aeCall("TNT_runNativeEditShortcut", [kind]);
  if (!result.ok) {
    statusEl.textContent = result.error || `Could not ${kind}.`;
    focusPanel(2);
    return;
  }
  statusEl.textContent = result.result || `${kind === "paste" ? "Paste" : "Copy"} done.`;
  if (kind === "paste") await refreshLayers({ forceRender: true });
  else focusPanel(2);
}

// PERMANENT SHORTCUT REGISTRY:
// Keep every panel shortcut in this table. Do not add loose keydown checks elsewhere,
// and do not replace this resolver when adding a shortcut. This prevents previously
// working shortcuts from being accidentally dropped during UI/tool edits.
const SHORTCUT_ACTIONS = {
  "ctrl+z": undoLastAeAction,
  "ctrl+s": saveProjectFromPanel,
  "ctrl+a": selectAllLayers,
  "ctrl+c": () => runNativeEditShortcut("copy"),
  "ctrl+v": () => runNativeEditShortcut("paste"),
  "ctrl+space": launchNativeQuickControls,
  "ctrl+k": openFxConsole,
  "ctrl+d": duplicateSelectedLayers,
  "alt+`": toggleTimelineMode,
  "alt+backquote": toggleTimelineMode,
  "alt+arrowup": () => moveSelectedLayersInStack("up"),
  "alt+arrowdown": () => moveSelectedLayersInStack("down"),
  "shift+alt+arrowup": () => moveSelectedLayersInStack("top"),
  "shift+alt+arrowdown": () => moveSelectedLayersInStack("bottom"),
  "tab": toggleFlowChart,
  "escape": closeActivePopup,
  "space": togglePlay,
  "a": () => openSubpanelByKey("anchor"),
  "shift+a": centerSelectedAnchorPoints,
  "c": () => openSubpanelByKey("composition"),
  "1": () => zoomTimeline(0.82),
  "numpad1": () => zoomTimeline(0.82),
  "2": () => zoomTimeline(1.22),
  "numpad2": () => zoomTimeline(1.22),
  "3": splitSelectedLayersAtPlayhead,
  "numpad3": splitSelectedLayersAtPlayhead,
  "4": deleteSelectedLevel,
  "numpad4": deleteSelectedLevel,
  "5": () => setSelectedLayerEndpoint("in"),
  "numpad5": () => setSelectedLayerEndpoint("in"),
  "6": () => setSelectedLayerEndpoint("out"),
  "numpad6": () => setSelectedLayerEndpoint("out"),
  "delete": deleteSelectedLevel,
  "backspace": deleteSelectedLevel,
  "q": () => runBundledShortcut('Trim In to playhead.jsxbin'),
  "w": () => runBundledShortcut('Trim Out to playhead.jsxbin'),
  "x": () => goToMarkerBoundary(1),
  "shift+x": () => openSubpanelByKey("filter"),
  "alt+x": () => goToMarkerBoundary(-1),
  "u": toggleSelectedKeyframeExpansion,
  "shift+u": revealAndFocusSelectedKeyframes,
  "t": revealSelectedTransformProperties,
  "e": () => openSubpanelByKey("ease"),
  "shift+e": applyEasyEaseDirect,
  "f": () => openSubpanelByKey("mask"),
  "shift+f": toggleKeyframeFocusMode,
  "s": () => openSubpanelByKey("styles"),
  "shift+s": () => openSubpanelByKey("styles"),
  ".": addMarkerAtPlayhead,
  "decimal": addMarkerAtPlayhead,
  "numpaddecimal": addMarkerAtPlayhead
};

function shortcutKeyForEvent(event) {
  const rawKey = String(event.key || "").toLowerCase();
  let key = rawKey === " " ? "space" : rawKey;
  if (key === "spacebar") key = "space";
  if (key === "esc") key = "escape";
  if (key === "del") key = "delete";
  if (key === "control" || key === "ctrl" || key === "shift" || key === "alt" || key === "option" || key === "meta" || key === "command") return "";
  if (key === "arrowup" || key === "up") key = "arrowup";
  if (key === "arrowdown" || key === "down") key = "arrowdown";
  const code = String(event.code || "").toLowerCase();
  const keyCode = Number(event.which || event.keyCode || 0);
  const fallbackByCode = {
    8: "backspace",
    9: "tab",
    13: "enter",
    26: "z",
    32: "space",
    38: "arrowup",
    40: "arrowdown",
    46: "delete",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    65: "a",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    77: "m",
    79: "o",
    86: "v",
    83: "s",
    84: "t",
    81: "q",
    75: "k",
    85: "u",
    87: "w",
    88: "x",
    90: "z",
    192: "`",
    190: ".",
    96: "numpad0",
    97: "numpad1",
    98: "numpad2",
    99: "numpad3",
    100: "numpad4",
    101: "numpad5",
    102: "numpad6",
    110: "numpaddecimal"
  };
  const macVirtualFallbackByCode = {
    0: "a",
    8: "c",
    1: "s",
    2: "d",
    3: "f",
    6: "z",
    7: "x",
    9: "v",
    12: "q",
    13: "w",
    14: "e",
    31: "o",
    17: "t",
    18: "1",
    19: "2",
    20: "3",
    21: "4",
    22: "6",
    23: "5",
    32: "u",
    40: "k",
    46: "m",
    47: ".",
    48: "tab",
    49: "space",
    50: "`",
    51: "backspace",
    117: "delete",
    125: "arrowdown",
    126: "arrowup"
  };
  const fallbackByCodeName = {
    backquote: "`",
    space: "space",
    tab: "tab",
    delete: "delete",
    backspace: "backspace",
    arrowup: "arrowup",
    arrowdown: "arrowdown",
    numpad1: "numpad1",
    numpad2: "numpad2",
    numpad3: "numpad3",
    numpad4: "numpad4",
    numpad5: "numpad5",
    numpad6: "numpad6",
    numpaddecimal: "numpaddecimal",
    digit1: "1",
    digit2: "2",
    digit3: "3",
    digit4: "4",
    digit5: "5",
    digit6: "6",
    keya: "a",
    keyc: "c",
    keyd: "d",
    keye: "e",
    keyf: "f",
    keyk: "k",
    keym: "m",
    keyo: "o",
    keyq: "q",
    keys: "s",
    keyt: "t",
    keyu: "u",
    keyv: "v",
    keyw: "w",
    keyx: "x",
    keyz: "z",
    period: "."
  };
  const shiftedDigitByKey = {
    "!": "1",
    "@": "2",
    "#": "3",
    "$": "4",
    "%": "5",
    "^": "6"
  };
  const fallbackByPlatformCode = isMacPlatform()
    ? (macVirtualFallbackByCode[keyCode] || fallbackByCode[keyCode])
    : (fallbackByCode[keyCode] || macVirtualFallbackByCode[keyCode]);
  const keyIsMissing = !key || key === "unidentified" || key === "dead";
  let normalizedKey = fallbackByCodeName[code] ||
    (key === "space" || code === "space" || (keyCode === 32 && keyIsMissing && !code) ? "space" : "") ||
    shiftedDigitByKey[key] ||
    fallbackByPlatformCode ||
    (!keyIsMissing ? key : "");
  if (normalizedKey === "`" && event.altKey) normalizedKey = "backquote";
  if (normalizedKey === "escape") return "escape";
  const modifiers = [];
  const hasMeta = !!(event.metaKey || event.commandKey);
  if (event.ctrlKey) modifiers.push("ctrl");
  if (hasMeta) modifiers.push("meta");
  if (event.shiftKey) modifiers.push("shift");
  if (event.altKey) modifiers.push("alt");
  if (modifiers.length && normalizedKey) return `${modifiers.join("+")}+${normalizedKey}`;
  if (code === "space") return "space";
  if (code === "tab") return "tab";
  if (code === "delete") return "delete";
  if (code === "backspace") return "backspace";
  if (code === "arrowup") return "arrowup";
  if (code === "arrowdown") return "arrowdown";
  if (code === "numpad1") return "numpad1";
  if (code === "numpad2") return "numpad2";
  if (code === "numpad3") return "numpad3";
  if (code === "numpad4") return "numpad4";
  if (code === "numpad5") return "numpad5";
  if (code === "numpad6") return "numpad6";
  if (code === "numpaddecimal") return "numpaddecimal";
  if (code === "digit1") return "1";
  if (code === "digit2") return "2";
  if (code === "digit3") return "3";
  if (code === "digit4") return "4";
  if (code === "digit5") return "5";
  if (code === "digit6") return "6";
  if (code === "keya") return "a";
  if (code === "keyc") return "c";
  if (code === "keyd") return "d";
  if (code === "keye") return "e";
  if (code === "keyf") return "f";
  if (code === "keym") return "m";
  if (code === "keyo") return "o";
  if (code === "keys") return "s";
  if (code === "keyt") return "t";
  if (code === "period") return ".";
  return normalizedKey;
}

function consumeShortcutEvent(event, shortcutKey) {
  event.__tntShortcutHandled = true;
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  suppressPanelShortcutKeyupKey = shortcutKey || shortcutKeyForEvent(event);
  suppressPanelShortcutKeyupUntil = Date.now() + 1800;
  recentPanelShortcutUntil = Date.now() + 1200;
  if (suppressPanelShortcutKeyupKey) suppressPanelShortcutKeys[suppressPanelShortcutKeyupKey] = suppressPanelShortcutKeyupUntil;
}

function isEditableShortcutTarget(event) {
  const tag = (event.target && event.target.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || !!(event.target && event.target.isContentEditable);
}

function shortcutAllowedInEditable(shortcutKey, easeDialogOpen) {
  if (QUICK_PANEL_MODE && QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]) return true;
  return shortcutKey === "ctrl+z" ||
    shortcutKey === "ctrl+s" ||
    shortcutKey === "ctrl+space" ||
    shortcutKey === "ctrl+k" ||
    shortcutKey === "escape" ||
    (easeDialogOpen && shortcutKey === "e");
}

function panelShortcutActionForKey(shortcutKey) {
  if (QUICK_PANEL_MODE && QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]) {
    return () => openQuickPanelControl(QUICK_PANEL_CONTROL_SHORTCUTS[shortcutKey]);
  }
  return SHORTCUT_ACTIONS[shortcutKey] || null;
}

function isUndoShortcutEvent(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = event.keyCode || event.which || 0;
  const hasUndoModifier = !!event.ctrlKey && !(event.metaKey || event.commandKey);
  const isZ = key === "z" || key === "\u001a" || code === "keyz" ||
    keyCode === 90 || (isMacPlatform() && (keyCode === 6 || keyCode === 26));
  return hasUndoModifier && isZ && !event.shiftKey && !event.altKey;
}

function isDuplicateShortcutEvent(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = event.keyCode || event.which || 0;
  const hasDuplicateModifier = !!event.ctrlKey && !(event.metaKey || event.commandKey);
  const isD = key === "d" || code === "keyd" || keyCode === 68 || (isMacPlatform() && keyCode === 2);
  return hasDuplicateModifier && isD && !event.shiftKey && !event.altKey;
}

function criticalShortcutBaseKey(event) {
  const key = String(event.key || "").toLowerCase();
  const code = String(event.code || "").toLowerCase();
  const keyCode = Number(event.keyCode || event.which || 0);
  if (key === "z" || key === "\u001a" || code === "keyz" ||
      keyCode === 90 || (isMacPlatform() && (keyCode === 6 || keyCode === 26))) return "z";
  if (key === "d" || code === "keyd" || keyCode === 68 || (isMacPlatform() && keyCode === 2)) return "d";
  return "";
}

function handleCriticalPanelShortcut(event) {
  if (event.__tntShortcutHandled) return;
  const baseKey = criticalShortcutBaseKey(event);
  if (activeCriticalShortcut && baseKey &&
      activeCriticalShortcut.endsWith(`+${baseKey}`) &&
      Date.now() <= activeCriticalShortcutUntil) {
    consumeShortcutEvent(event, activeCriticalShortcut);
    return;
  }
  const isUndo = isUndoShortcutEvent(event);
  const isDuplicate = isDuplicateShortcutEvent(event);
  if (!isUndo && !isDuplicate) return;
  const shortcutKey = `ctrl+${isUndo ? "z" : "d"}`;
  consumeShortcutEvent(event, shortcutKey);
  activeCriticalShortcut = shortcutKey;
  activeCriticalShortcutUntil = Date.now() + 2500;
  recentPanelShortcutUntil = Date.now() + 4000;
  registerPanelKeyEventsInterest();
  setPanelSyncPaused(false);
  panelFocused = true;
  panelPointerInside = true;
  focusPanel(2);
  if (isUndo) undoLastAeAction();
  else duplicateSelectedLayers();
}

function handleShortcut(event) {
  if (event.__tntShortcutHandled) return;
  if (handleLayerMenuShortcut(event)) return;
  const shortcutKey = shortcutKeyForEvent(event);
  if (!shortcutKey) return;
  const suppressedUntil = suppressPanelShortcutKeys[shortcutKey] || 0;
  if (Date.now() <= suppressedUntil && event.type !== "keydown") {
    consumeShortcutEvent(event, shortcutKey);
    return;
  }
  const easeDialogOpen = !!(easeDialogEl && easeDialogEl.classList.contains("show"));
  if (shortcutKey === "space" && event.repeat) {
    consumeShortcutEvent(event, shortcutKey);
    return;
  }
  if (isEditableShortcutTarget(event) && !shortcutAllowedInEditable(shortcutKey, easeDialogOpen)) return;

  const action = panelShortcutActionForKey(shortcutKey);
  if (!action) return;
  consumeShortcutEvent(event, shortcutKey);
  if (shortcutKey === "escape") suppressEscapeKeyupUntil = Date.now() + 350;
  registerPanelKeyEventsInterest();
  focusPanel(2);
  action();
}

function consumeSuppressedEscapeKeyup(event) {
  if (shortcutKeyForEvent(event) !== "escape") return;
  if (Date.now() > suppressEscapeKeyupUntil && !closeActivePopup()) return;
  event.preventDefault();
  event.stopPropagation();
  suppressEscapeKeyupUntil = 0;
}

function consumePanelShortcutKeyup(event) {
  const shortcutKey = shortcutKeyForEvent(event);
  const baseKey = criticalShortcutBaseKey(event);
  if (activeCriticalShortcut && baseKey &&
      activeCriticalShortcut.endsWith(`+${baseKey}`) &&
      Date.now() <= activeCriticalShortcutUntil) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    delete suppressPanelShortcutKeys[activeCriticalShortcut];
    if (suppressPanelShortcutKeyupKey === activeCriticalShortcut) suppressPanelShortcutKeyupKey = "";
    suppressPanelShortcutKeyupUntil = 0;
    activeCriticalShortcut = "";
    activeCriticalShortcutUntil = 0;
    focusPanel(6);
    return;
  }
  if (!shortcutKey) return;
  const suppressUntil = Math.max(suppressPanelShortcutKeyupUntil || 0, suppressPanelShortcutKeys[shortcutKey] || 0);
  if (Date.now() > suppressUntil) {
    delete suppressPanelShortcutKeys[shortcutKey];
    if (shortcutKey === suppressPanelShortcutKeyupKey) suppressPanelShortcutKeyupKey = "";
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  delete suppressPanelShortcutKeys[shortcutKey];
  if (shortcutKey === suppressPanelShortcutKeyupKey) suppressPanelShortcutKeyupKey = "";
}

function formatTime(seconds) {
  return formatDurationForInput(seconds);
}

function formatRulerTime(seconds) {
  return formatDurationForInput(seconds);
}

function startSyncLoop() {
  // CEP evalScript calls briefly put AE into its busy cursor state. Keep idle
  // synchronization action/activation-driven instead of polling the host.
  stopSyncLoop();
}

function stopSyncLoop() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
}

function startBackgroundEditWatch() {
  if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
  backgroundSyncInterval = setInterval(() => {
    syncTick({ background: true });
  }, 250);
}

function stopBackgroundEditWatch() {
  if (backgroundSyncInterval) clearInterval(backgroundSyncInterval);
  backgroundSyncInterval = null;
}

window.addEventListener("focus", () => {
  panelFocused = true;
  registerPanelKeyEventsInterest();
  if (QUICK_PANEL_MODE) {
    refreshQuickPanelState();
    return;
  }
  if (panelSyncPaused) resumePanelSync();
  else schedulePanelActivationSync();
});

window.addEventListener("blur", () => {
  if (QUICK_PANEL_MODE) {
    panelFocused = false;
    return;
  }
  if (Date.now() < recentPanelShortcutUntil) {
    focusPanel(2);
    return;
  }
  panelFocused = false;
  if (panelBlurPauseTimer) clearTimeout(panelBlurPauseTimer);
  panelBlurPauseTimer = setTimeout(() => {
    panelBlurPauseTimer = null;
    if (!nativeSelectionMonitorActive && !panelPointerInside) pausePanelSync();
  }, 350);
});

document.addEventListener("mouseenter", () => {
  panelPointerInside = true;
  registerPanelKeyEventsInterest();
  if (QUICK_PANEL_MODE) return;
  if (panelSyncPaused) resumePanelSync();
});

document.addEventListener("mouseleave", () => {
  panelPointerInside = false;
});

document.addEventListener("visibilitychange", () => {
  panelFocused = !document.hidden && document.hasFocus();
  if (QUICK_PANEL_MODE) {
    if (panelFocused) refreshQuickPanelState();
    return;
  }
  if (document.hidden) pausePanelSync();
  else if (panelFocused && panelSyncPaused) resumePanelSync();
  else if (panelFocused) schedulePanelActivationSync();
});

scrollAreaEl.addEventListener("mousedown", stopPlaybackOnTimelinePointer, true);
scrollAreaEl.addEventListener("contextmenu", stopPlaybackOnTimelinePointer, true);
rulerWrapEl.addEventListener("mousedown", beginScrub);
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("mousedown", beginScrub);
if (timeDisplayEl) timeDisplayEl.addEventListener("mousedown", beginTimeDisplayInteraction);
scrollAreaEl.addEventListener("mousedown", handleTimelineMouseDown);
scrollAreaEl.addEventListener("auxclick", e => { if (e.button === 1) e.preventDefault(); });
scrollAreaEl.addEventListener("dragenter", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
scrollAreaEl.addEventListener("dragover", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
scrollAreaEl.addEventListener("dragleave", event => {
  if (!event.relatedTarget || !scrollAreaEl.contains(event.relatedTarget)) setTimelineDropActive(false);
});
scrollAreaEl.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  setTimelineDropActive(false);
  importDroppedItems(event);
});
document.addEventListener("dragenter", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
document.addEventListener("dragover", event => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  setTimelineDropActive(true);
  showDropInsertGuide(event);
});
document.addEventListener("dragleave", event => {
  if (!event.relatedTarget) setTimelineDropActive(false);
});
document.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  setTimelineDropActive(false);
  importDroppedItems(event);
});
scrollAreaEl.addEventListener("contextmenu", event => {
  if (timelineMode === "keyframe" && event.target.closest && event.target.closest(".property-keyframe-marker")) return;
  if (event.target.closest && event.target.closest("#layerMenu")) return;
  if (event.ctrlKey && (state.selectedLayerIndices || []).length && showSelectedLayerMenu(event)) return;
  const ownedTarget = event.target.closest && event.target.closest([
    ".clip",
    ".keyframe-focus-clip",
    ".keyframe-property-row",
    ".property-keyframe-hit",
    ".property-keyframe-marker",
    ".marker",
    ".marker-half",
    ".marker-region-band",
    ".layer-marker-region",
    ".layer-marker-half-end",
    ".protected-region-overlay"
  ].join(","));
  if (ownedTarget) return;
  const layerRow = event.target.closest && event.target.closest(".keyframe-layer-row[data-layer-index]");
  if (layerRow) {
    const rowLayer = (state.layers || []).find(layer => Number(layer.index) === Number(layerRow.dataset.layerIndex || 0));
    if (!rowLayer) return;
    event.preventDefault();
    event.stopPropagation();
    showLayerMenu(event, rowLayer);
    return;
  }
  if (!state.comp) return;
  event.preventDefault();
  event.stopPropagation();
  showAddLayerMenu(event);
});
rulerWrapEl.addEventListener("selectstart", e => e.preventDefault());
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("selectstart", e => e.preventDefault());
rulerWrapEl.addEventListener("dragstart", e => e.preventDefault());
if (bottomRulerWrapEl) bottomRulerWrapEl.addEventListener("dragstart", e => e.preventDefault());
window.addEventListener("keydown", handleCriticalPanelShortcut, true);
document.addEventListener("keydown", handleCriticalPanelShortcut, true);
window.addEventListener("keypress", handleCriticalPanelShortcut, true);
document.addEventListener("keypress", handleCriticalPanelShortcut, true);
window.addEventListener("keyup", event => {
  if ((isMacPlatform() && (event.key === "Meta" || event.key === "Command")) ||
      (!isMacPlatform() && event.key === "Control")) {
    hidePropertyValueHover();
  }
}, true);
document.addEventListener("mousedown", event => {
  if (!propertyValueEditorEl) return;
  if (propertyValueEditorEl.contains(event.target)) return;
  if (event.target.closest && event.target.closest(".property-keyframe-hit") && propertyValueModifierDown(event)) return;
  closePropertyValueEditor();
}, true);
window.addEventListener("keydown", handleShortcut, true);
document.addEventListener("keydown", handleShortcut, true);
window.addEventListener("keypress", handleShortcut, true);
document.addEventListener("keypress", handleShortcut, true);
window.addEventListener("keyup", consumeSuppressedEscapeKeyup, true);
document.addEventListener("keyup", consumeSuppressedEscapeKeyup, true);
window.addEventListener("keyup", consumePanelShortcutKeyup, true);
document.addEventListener("keyup", consumePanelShortcutKeyup, true);
if (filterColumnEl) {

}

async function refreshQuickPanelState() {
  if (!QUICK_PANEL_MODE) return;
  if (quickPanelRefreshPromise) return quickPanelRefreshPromise;
  quickPanelRefreshPromise = (async () => {
    const contextEl = document.getElementById("quickPanelContext");
    await loadJSX();
    const result = await aeCall("TNT_getTimelineStructureData");
    if (!result || !result.ok) {
      state = { comp: null, layers: [], selectedLayerIndices: [], compMarkers: [] };
      lastSelectedLayerIndex = 0;
      if (contextEl) contextEl.textContent = result && result.error ? result.error : "Open a composition in After Effects.";
      return;
    }
    state = Object.assign({}, state, {
      comp: Object.assign({}, result.comp || {}),
      layers: Array.isArray(result.layers) ? result.layers : [],
      selectedLayerIndices: Array.isArray(result.selectedLayerIndices) ? result.selectedLayerIndices.map(Number) : []
    });
    const selected = state.selectedLayerIndices;
    if (selected.length) lastSelectedLayerIndex = selected[selected.length - 1];
    else lastSelectedLayerIndex = 0;
    updateStatus();
    if (contextEl) {
      const count = selected.length;
      contextEl.textContent = `${state.comp && state.comp.name ? state.comp.name : "Active comp"} · ${count} layer${count === 1 ? "" : "s"} selected`;
    }
  })();
  try {
    await quickPanelRefreshPromise;
  } finally {
    quickPanelRefreshPromise = null;
  }
}

async function openQuickPanelControl(name) {
  name = String(name || "");
  const actions = {
    anchor: showAnchorDialog,
    composition: showCompositionPanel,
    "rename-comp": promptRenameComp,
    ease: showEaseDialog,
    mask: openMaskControlPanel,
    effects: openEffectsControlPanel,
    shapes: openShapesControlPanel,
    styles: openLayerStylePanel,
    "layer-menu": openQuickPanelLayerMenu,
    "mass-edit": showMassEditPanel,
    "text-animation": showTextAnimationPanel,
    "timing-order": showTimingOrderPanel,
    filter: showLayerSelectionPanel
  };
  const action = actions[name];
  if (!action) return;
  if (QUICK_PANEL_MODE) prepareNativeQuickPanelForDirectSubpanel();
  await refreshQuickPanelState();
  if (QUICK_PANEL_MODE && name === "rename-comp") {
    const result = action();
    requestAnimationFrame(() => {
      quickPanelSurfaceSwitching = false;
      document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
      scheduleNativeQuickPanelResize(0);
    });
    await result;
    return;
  }
  try {
    await action();
  } finally {
    if (QUICK_PANEL_MODE) {
      requestAnimationFrame(() => {
        quickPanelSurfaceSwitching = false;
        document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
        focusPanel(1);
        scheduleNativeQuickPanelResize(0);
      });
    }
  }
}

async function openQuickPanelLayerMenu() {
  await refreshQuickPanelState();
  const layer = selectedLayerForContextMenu();
  if (!layer) {
    showQuickLayerMenuDialog(null, []);
    statusEl.textContent = "Select layers first.";
    return;
  }
  showQuickLayerMenuDialog(layer, selectedLayersForMenu(layer));
  if (QUICK_PANEL_MODE) {
    requestAnimationFrame(() => {
      quickPanelSurfaceSwitching = false;
      document.body.classList.toggle("quick-subpanel-open", !!activeQuickPanelSurface());
      focusPanel(1);
      scheduleNativeQuickPanelResize(0);
    });
  }
}

function ensureQuickLayerMenuDialog() {
  if (quickLayerMenuDialogEl) return quickLayerMenuDialogEl;
  quickLayerMenuDialogEl = document.createElement("div");
  quickLayerMenuDialogEl.className = "layer-style-dialog-backdrop quick-layer-menu-backdrop";
  quickLayerMenuDialogEl.setAttribute("aria-hidden", "true");
  quickLayerMenuDialogEl.innerHTML = `
    <div class="quick-layer-menu-dialog">
      <div class="quick-layer-menu-body"></div>
    </div>
  `;
  document.body.appendChild(quickLayerMenuDialogEl);
  quickLayerMenuDialogEl.addEventListener("mousedown", event => {
    if (event.target === quickLayerMenuDialogEl) closeQuickLayerMenuDialog();
  });
  quickLayerMenuDialogEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeQuickLayerMenuDialog();
    }
  });
  return quickLayerMenuDialogEl;
}

function closeQuickLayerMenuDialog() {
  if (!quickLayerMenuDialogEl) return;
  quickLayerMenuDialogEl.classList.remove("show");
  quickLayerMenuDialogEl.setAttribute("aria-hidden", "true");
  focusPanel(2);
}

function showQuickLayerMenuDialog(layer, contextLayers) {
  const el = ensureQuickLayerMenuDialog();
  const body = el.querySelector(".quick-layer-menu-body");
  if (!layer || !contextLayers.length) {
    body.innerHTML = `
      <div class="quick-layer-menu-empty">
        <strong>Layer Menu</strong>
        <span>Select layers in After Effects, then open this again.</span>
      </div>
    `;
  } else {
    const context = buildLayerMenuContext(contextLayers);
    const selected = contextLayers.map(item => item.index);
    const labelName = AE_LABEL_NAMES[layer.label] || `Label ${layer.label || 0}`;
    body.innerHTML = `
      ${buildLayerMenuContextHeader(context)}
      <button type="button" class="menu-row" data-action="maskControl"${menuShortcutKeys("f")}><span>Mask Control...</span>${menuShortcutLabel("F")}</button>
      <button type="button" class="menu-row" data-action="effectsControl"><span>Effects...</span><em>Selected layer effects</em></button>
      <button type="button" class="menu-row" data-action="shapesControl"><span>Shapes...</span><em>Selected shape contents</em></button>
      <button type="button" class="menu-row" data-action="layerStyles"${menuShortcutKeys("s,shift+s")}><span>Layer Styles...</span>${menuShortcutLabel("S")}</button>
      <div class="layer-menu-separator"></div>
      <div class="layer-menu-section label-section">
        <div class="layer-menu-kicker">LABEL COLOR</div>
        <div class="layer-menu-swatches">${buildLayerMenuLabelSwatches(layer.label)}</div>
      </div>
      <button type="button" class="menu-row" data-action="undoAction"${menuShortcutKeys("ctrl+z")}><span>Undo</span>${menuShortcutLabel(undoShortcutLabel())}</button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="labelGroup"><span>Select Label Group</span><em>${escapeHtml(labelName)}</em></button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="hide"><span>${layer.enabled ? "Disable" : "Enable"}</span><em>Toggle clip enabled</em></button>
      <button type="button" class="menu-row" data-action="lock"><span>${layer.locked ? "Unlock" : "Lock"}</span><em>${layer.locked ? "Unlock layer" : "Lock layer"}</em></button>
      <div class="layer-menu-separator"></div>
      <button type="button" class="menu-row" data-action="duplicateLayers"${menuShortcutKeys("d")}><span>Duplicate Selected Layers</span>${menuShortcutLabel("D")}</button>
      <button type="button" class="menu-row" data-action="splitLayers"${menuShortcutKeys("3,numpad3")}><span>Split at Playhead</span>${menuShortcutLabel("3")}</button>
      <button type="button" class="menu-row" data-action="setInPoint"${menuShortcutKeys("5,numpad5")}><span>Set In Point to Playhead</span>${menuShortcutLabel("5")}</button>
      <button type="button" class="menu-row" data-action="setOutPoint"${menuShortcutKeys("6,numpad6")}><span>Set Out Point to Playhead</span>${menuShortcutLabel("6")}</button>
      <button type="button" class="menu-row" data-action="deleteLayers"${menuShortcutKeys("4,numpad4,delete,backspace")}><span>Delete Selected Layers</span>${menuShortcutLabel("4 / Delete")}</button>
      ${buildLayerMenuContextRows(context, layer)}
    `;
    body.onclick = event => runQuickLayerMenuAction(event, selected, layer);
  }
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  refreshSyncPausedVisualState();
}

async function runQuickLayerMenuAction(event, selected, layer) {
  event.preventDefault();
  event.stopPropagation();
  const btn = event.target.closest && event.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === "contextFilter") {
    closeQuickLayerMenuDialog();
    setLayerViewFilter(String(btn.dataset.contextFilter || "") || null, selected);
    return;
  }
  if (action === "labelGroup") return;
  if (action === "undoAction") {
    closeQuickLayerMenuDialog();
    await undoLastAeAction();
    return;
  }
  if (action === "layerStyles") {
    closeQuickLayerMenuDialog();
    openLayerStylePanel();
    return;
  }
  if (action === "maskControl") {
    closeQuickLayerMenuDialog();
    openMaskControlPanel();
    return;
  }
  if (action === "effectsControl") {
    closeQuickLayerMenuDialog();
    openEffectsControlPanel();
    return;
  }
  if (action === "shapesControl") {
    closeQuickLayerMenuDialog();
    openShapesControlPanel();
    return;
  }
  if (action === "duplicateLayers") {
    closeQuickLayerMenuDialog();
    await duplicateSelectedLayers(selected);
    return;
  }
  if (action === "splitLayers") {
    closeQuickLayerMenuDialog();
    await splitSelectedLayersAtPlayhead();
    return;
  }
  if (action === "setInPoint") {
    closeQuickLayerMenuDialog();
    await setSelectedLayerEndpoint("in");
    return;
  }
  if (action === "setOutPoint") {
    closeQuickLayerMenuDialog();
    await setSelectedLayerEndpoint("out");
    return;
  }
  if (action === "deleteLayers") {
    closeQuickLayerMenuDialog();
    await deleteSelectedLayers();
    return;
  }
  if (action === "openSourceComp") {
    closeQuickLayerMenuDialog();
    await openLayerSourceComp(layer);
    return;
  }
  if (action === "renameSourceComp") {
    closeQuickLayerMenuDialog();
    await promptRenameSourceComp(layer);
    return;
  }
  if (action === "setTextContent") {
    closeQuickLayerMenuDialog();
    await promptSetTextContent();
    return;
  }
  if (action === "findReplaceText") {
    closeQuickLayerMenuDialog();
    await promptFindReplaceText();
    return;
  }
  if (action === "parentToLastSelected") {
    closeQuickLayerMenuDialog();
    await parentToLastSelectedLayer();
    return;
  }
  if (action === "matteToLastSelected") {
    closeQuickLayerMenuDialog();
    await matteToLastSelectedLayer();
    return;
  }
  if (action === "parentToTarget") {
    closeQuickLayerMenuDialog();
    await promptParentToTargetLayer();
    return;
  }
  if (action === "tntCommand") {
    closeQuickLayerMenuDialog();
    let args = [];
    try { args = JSON.parse(decodeURIComponent(btn.dataset.tntArgs || "%5B%5D")); } catch (_) {}
    await runTntV3Command({ name: btn.textContent || "Panel Command", tntFunction: btn.dataset.tntFunction, args });
    return;
  }
  if (action === "label") {
    const labelIndex = Number(btn.dataset.label || 0);
    await loadJSX();
    const result = await aeCall("TNT_setSelectedLayerLabel", [selected, layer.index, labelIndex]);
    if (!result.ok) {
      statusEl.textContent = result.error || "Could not update label color.";
      return;
    }
    closeQuickLayerMenuDialog();
    await refreshLayers({ forceRender: true });
    return;
  }
  closeQuickLayerMenuDialog();
  await loadJSX();
  const fn = action === "lock" ? "TNT_toggleSelectedLayerLock" : "TNT_toggleSelectedLayerVisibility";
  const result = await aeCall(fn, [selected, layer.index]);
  if (!result.ok) {
    statusEl.textContent = result.error || "Could not update selected layers.";
    return;
  }
  await refreshLayers({ forceRender: true });
}

const QUICK_PANEL_CONTROL_SHORTCUTS = {
  "ctrl+a": "anchor",
  "ctrl+c": "composition",
  "ctrl+e": "ease",
  "ctrl+f": "mask",
  "ctrl+s": "styles",
  "ctrl+m": "mass-edit",
  "ctrl+t": "text-animation",
  "ctrl+o": "timing-order",
  "ctrl+x": "filter"
};

const quickPanelShellEl = document.getElementById("quickPanelShell");
const quickPanelSearchEl = document.getElementById("quickPanelSearch");
const quickPanelSearchResultsEl = document.getElementById("quickPanelSearchResults");
let quickPanelResizeTimer = null;
let quickPanelLastSize = "";
let quickPanelSearchParentEntry = null;
let quickPanelSearchSelectedIndex = 0;
let quickPanelSearchEffectsLoading = false;
let quickPanelSurfaceSwitching = false;
let quickPanelHadSurface = false;

function activeQuickPanelSurface() {
  if (layerMenuEl && layerMenuEl.classList.contains("open")) return layerMenuEl;
  const commandDialog = document.querySelector(".timeline-command-dialog-backdrop.show > .timeline-command-dialog");
  if (commandDialog) {
    const style = window.getComputedStyle(commandDialog);
    if (style.display !== "none" && style.visibility !== "hidden") return commandDialog;
  }
  const subpanelSelectors = [
    ".quick-layer-menu-backdrop.show .quick-layer-menu-dialog",
    ".layer-style-dialog-backdrop.show .layer-style-dialog",
    ".ease-dialog-backdrop.show .ease-dialog",
    ".mass-edit-backdrop.show .mass-edit-dialog",
    ".text-animation-backdrop.show .text-animation-dialog",
    ".timing-order-backdrop.show .timing-order-layout",
    ".modal-backdrop.show > .expression-dialog",
    ".modal-backdrop.show > .anchor-dialog",
    ".modal-backdrop.show > .duration-dialog",
    ".modal-backdrop.show > .composition-dialog",
    ".modal-backdrop.show > .layer-selection-dialog"
  ];
  const visibleSubpanels = Array.from(document.querySelectorAll(subpanelSelectors.join(","))).filter(element => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  });
  if (visibleSubpanels.length) return visibleSubpanels[visibleSubpanels.length - 1];
  return null;
}

function quickPanelSurfaceWidth(surface) {
  if (!surface) return 620;
  if (surface.classList.contains("anchor-dialog")) {
    const panel = surface.querySelector(".anchor-panel") || surface;
    const rect = panel.getBoundingClientRect();
    return Math.ceil(Math.max(panel.scrollWidth || 0, rect.width || 0) + 16);
  }
  if (surface.classList.contains("expression-dialog")) return 580;
  if (surface.classList.contains("duration-dialog")) return 380;
  if (surface.classList.contains("composition-dialog")) return 620;
  if (surface.classList.contains("timeline-command-dialog")) return 620;
  if (surface.classList.contains("layer-selection-dialog")) return 820;
  if (surface.classList.contains("quick-layer-menu-dialog")) return 420;
  if (surface.classList.contains("layer-menu")) return 360;
  if (surface.classList.contains("layer-style-dialog")) {
    if (surface.classList.contains("mask-control-dialog")) return 820;
    if (surface.classList.contains("effects-control-dialog")) return 900;
    if (surface.classList.contains("shapes-control-dialog")) return 900;
    return 1180;
  }
  if (surface.classList.contains("ease-dialog")) return 980;
  if (surface.classList.contains("mass-edit-dialog")) return 900;
  if (surface.classList.contains("text-animation-dialog")) return 780;
  if (surface.classList.contains("timing-order-layout")) return 1140;
  return 680;
}

function quickPanelSurfaceFixedHeight(surface) {
  if (!surface) return 0;
  if (surface.classList.contains("anchor-dialog")) {
    const panel = surface.querySelector(".anchor-panel") || surface;
    const rect = panel.getBoundingClientRect();
    return Math.ceil(Math.max(panel.scrollHeight || 0, rect.height || 0) + 16);
  }
  if (surface.classList.contains("composition-dialog")) return 360;
  if (surface.classList.contains("expression-dialog")) return 360;
  if (surface.classList.contains("duration-dialog")) return 220;
  return 0;
}

function quickPanelSurfaceMinimumHeight(surface) {
  if (!surface) return 260;
  if (surface.classList.contains("quick-layer-menu-dialog")) return 520;
  if (surface.classList.contains("effects-control-dialog") || surface.classList.contains("shapes-control-dialog")) return 520;
  if (surface.classList.contains("layer-style-dialog") && !surface.classList.contains("mask-control-dialog")) return 620;
  if (surface.classList.contains("ease-dialog")) return 620;
  if (surface.classList.contains("mass-edit-dialog")) return 560;
  if (surface.classList.contains("text-animation-dialog")) return 560;
  if (surface.classList.contains("timing-order-layout")) return 420;
  if (surface.classList.contains("timeline-command-dialog")) return 300;
  if (surface.classList.contains("layer-selection-dialog")) return 540;
  return 180;
}

function quickPanelNaturalHeight(surface) {
  if (!surface) return quickPanelShellEl && quickPanelShellEl.classList.contains("searching") ? 320 : 320;
  const fixedHeight = quickPanelSurfaceFixedHeight(surface);
  if (fixedHeight) return fixedHeight;
  document.documentElement.classList.add("quick-panel-measuring");
  void surface.offsetHeight;
  const surfaceRect = surface.getBoundingClientRect();
  let contentBottom = Math.max(surface.scrollHeight || 0, surfaceRect.height || 0);
  surface.querySelectorAll("*").forEach(element => {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.position === "fixed") return;
    const rect = element.getBoundingClientRect();
    contentBottom = Math.max(contentBottom, rect.bottom - surfaceRect.top);
  });
  const body = surface.querySelector(
    ".quick-layer-menu-body, .layer-style-dialog-body, .ease-dialog-body, .mass-edit-body, .text-animation-body, .timing-order-body, .composition-body, .layer-selection-list"
  );
  if (body) {
    const bodyRect = body.getBoundingClientRect();
    contentBottom = Math.max(
      contentBottom,
      bodyRect.top - surfaceRect.top + Math.max(body.scrollHeight || 0, bodyRect.height || 0)
    );
  }
  document.documentElement.classList.remove("quick-panel-measuring");
  return Math.ceil(contentBottom + 16);
}

function resizeNativeQuickPanel() {
  if (!QUICK_PANEL_MODE || typeof window.__tntNativeResize !== "function") return;
  const surface = activeQuickPanelSurface();
  if (surface) quickPanelHadSurface = true;
  else if (quickPanelHadSurface && !quickPanelSurfaceSwitching && closeNativeQuickPanelWindow()) {
    quickPanelHadSurface = false;
    return;
  }
  document.body.classList.toggle("quick-subpanel-open", !!surface || quickPanelSurfaceSwitching);
  if (!surface && quickPanelSurfaceSwitching) return;
  const width = quickPanelSurfaceWidth(surface);
  const contentHeight = quickPanelNaturalHeight(surface);
  const height = Math.max(quickPanelSurfaceMinimumHeight(surface), contentHeight);
  const signature = `${Math.round(width)}x${Math.round(height)}`;
  if (signature === quickPanelLastSize) return;
  quickPanelLastSize = signature;
  window.__tntNativeResize(width, height);
}

function scheduleNativeQuickPanelResize(delay = 20) {
  if (!QUICK_PANEL_MODE) return;
  if (quickPanelResizeTimer) clearTimeout(quickPanelResizeTimer);
  quickPanelResizeTimer = setTimeout(() => {
    quickPanelResizeTimer = null;
    requestAnimationFrame(() => {
      resizeNativeQuickPanel();
      requestAnimationFrame(resizeNativeQuickPanel);
    });
  }, delay);
}

function closeNativeQuickPanelWindow() {
  if (!QUICK_PANEL_MODE || typeof window.__tntNativeClose !== "function") return false;
  window.__tntNativeClose();
  return true;
}

function closeNativeQuickPanelSurfaces() {
  if (!QUICK_PANEL_MODE) return;
  const commandDialog = document.querySelector(".timeline-command-dialog-backdrop.show");
  if (commandDialog && typeof closeTntCommandDialog === "function") closeTntCommandDialog(null);
  if (layerMenuEl && layerMenuEl.classList.contains("open")) hideLayerMenu();
  if (quickLayerMenuDialogEl && quickLayerMenuDialogEl.classList.contains("show")) closeQuickLayerMenuDialog();
  if (layerStyleDialogEl && layerStyleDialogEl.classList.contains("show")) closeLayerStyleDialog();
  if (maskControlDialogEl && maskControlDialogEl.classList.contains("show")) closeMaskControlDialog();
  if (effectsControlDialogEl && effectsControlDialogEl.classList.contains("show")) closeEffectsControlDialog();
  if (shapesControlDialogEl && shapesControlDialogEl.classList.contains("show")) closeShapesControlDialog();
  if (easeDialogEl && easeDialogEl.classList.contains("show")) hideEaseDialog();
  if (massEditDialogEl && massEditDialogEl.classList.contains("show")) hideMassEditPanel();
  if (textAnimationBackdropEl && textAnimationBackdropEl.classList.contains("show")) hideTextAnimationPanel();
  if (timingOrderBackdropEl && timingOrderBackdropEl.classList.contains("show")) hideTimingOrderPanel();
  if (layerSelectionModalEl && layerSelectionModalEl.classList.contains("show")) hideLayerSelectionPanel();
  if (compositionModalEl && compositionModalEl.classList.contains("show")) hideCompositionPanel();
  if (anchorModalEl && anchorModalEl.classList.contains("show")) hideAnchorDialog();
  if (durationModalEl && durationModalEl.classList.contains("show")) hideDurationDialog();
  if (compSelectEl && compSelectEl.classList.contains("open")) closeCompSelect();
  if (flowChartOverlayEl && flowChartOverlayEl.classList.contains("open")) closeFlowChart();
}

function resetNativeQuickPanelToLauncher() {
  if (!QUICK_PANEL_MODE) return;
  quickPanelSurfaceSwitching = false;
  quickPanelHadSurface = false;
  closeNativeQuickPanelSurfaces();
  document.body.classList.remove("quick-subpanel-open");
  resetQuickPanelSearch();
  quickPanelLastSize = "";
}

function prepareNativeQuickPanelForDirectSubpanel() {
  if (!QUICK_PANEL_MODE) return;
  quickPanelSurfaceSwitching = true;
  quickPanelHadSurface = false;
  document.body.classList.add("quick-subpanel-open");
  closeNativeQuickPanelSurfaces();
  resetQuickPanelSearch();
  quickPanelLastSize = "";
}

function quickPanelSearchEntries() {
  if (!quickPanelSearchEl) return [];
  return searchFxConsoleEntries(quickPanelSearchEl.value, quickPanelSearchParentEntry, 12);
}

function tntTagChips(entry) {
  const tags = typeof safeFxConsoleEntryTags === "function" ? safeFxConsoleEntryTags(entry) : [];
  return tags.map(tag =>
    `<i class="tnt-tag tnt-tag-${escapeHtml(tag.kind)} ${escapeHtml(tag.key)}" title="${escapeHtml(tag.title)}">${escapeHtml(tag.label)}</i>`
  ).join("");
}

function renderQuickPanelSearchResults() {
  if (!quickPanelShellEl || !quickPanelSearchResultsEl || !quickPanelSearchEl) return;
  const searching = !!quickPanelSearchEl.value.trim() || !!quickPanelSearchParentEntry;
  quickPanelShellEl.classList.toggle("searching", searching);
  if (!searching) {
    quickPanelSearchResultsEl.innerHTML = "";
    scheduleNativeQuickPanelResize(0);
    return;
  }
  const entries = quickPanelSearchEntries();
  quickPanelSearchSelectedIndex = Math.max(0, Math.min(quickPanelSearchSelectedIndex, Math.max(0, entries.length - 1)));
  if (!entries.length) {
    quickPanelSearchResultsEl.innerHTML = `<div class="quick-panel-search-empty">No matching commands or effects</div>`;
    scheduleNativeQuickPanelResize(0);
    return;
  }
  quickPanelSearchResultsEl.innerHTML = entries.map((entry, index) => {
    const detail = [entry.shortcut || "", entry.children ? "Open" : ""].filter(Boolean).join(" · ");
    return `
      <button type="button" class="quick-panel-search-result${index === quickPanelSearchSelectedIndex ? " active" : ""}" data-quick-search-index="${index}" data-fx-source="${tntSourceGroup(entry)}">
        <span class="quick-panel-search-name">${escapeHtml(entry.name || entry.matchName || "Effect")}</span>
        <em class="quick-panel-search-detail">${escapeHtml(detail)}</em>
        <span class="tnt-tags">${tntTagChips(entry)}</span>
      </button>
    `;
  }).join("");
  requestAnimationFrame(() => {
    const active = quickPanelSearchResultsEl.querySelector(".quick-panel-search-result.active");
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  });
  scheduleNativeQuickPanelResize(0);
}

async function loadQuickPanelSearchEffects() {
  if (quickPanelSearchEffectsLoading || fxConsoleEffects.length) return;
  quickPanelSearchEffectsLoading = true;
  try {
    await loadFxConsoleEffects();
    renderQuickPanelSearchResults();
  } finally {
    quickPanelSearchEffectsLoading = false;
  }
}

function resetQuickPanelSearch() {
  quickPanelSearchParentEntry = null;
  quickPanelSearchSelectedIndex = 0;
  if (quickPanelSearchEl) {
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = "Search commands or effects";
  }
  renderQuickPanelSearchResults();
}

async function applyQuickPanelSearchEntry(index = quickPanelSearchSelectedIndex) {
  const entries = quickPanelSearchEntries();
  const entry = entries[Math.max(0, Math.min(Number(index || 0), entries.length - 1))];
  if (!entry) return;
  if (entry.children && entry.children.length) {
    quickPanelSearchParentEntry = entry;
    quickPanelSearchSelectedIndex = 0;
    quickPanelSearchEl.value = "";
    quickPanelSearchEl.placeholder = `Search ${entry.name}`;
    renderQuickPanelSearchResults();
    quickPanelSearchEl.focus();
    return;
  }
  const ran = await executeFxConsoleEntry(entry);
  if (!ran) return;
  if (!activeQuickPanelSurface() && closeNativeQuickPanelWindow()) return;
  resetQuickPanelSearch();
  await refreshQuickPanelState();
  focusQuickPanelSearch(2);
}

function focusQuickPanelSearch(retries = 3) {
  if (!QUICK_PANEL_MODE || !quickPanelSearchEl) return;
  try { window.focus(); } catch (_) {}
  try { quickPanelSearchEl.focus({ preventScroll: true }); }
  catch (_) { try { quickPanelSearchEl.focus(); } catch (__) {} }
  if (retries > 0) setTimeout(() => focusQuickPanelSearch(retries - 1), 80);
}

window.__tntQuickPanelDidShow = async function () {
  if (!QUICK_PANEL_MODE) return;
  resetNativeQuickPanelToLauncher();
  jsxLoaded = false;
  await refreshQuickPanelState();
  focusQuickPanelSearch(4);
  if (quickPanelSearchEl) loadQuickPanelSearchEffects();
  scheduleNativeQuickPanelResize(0);
};

window.__tntQuickPanelOpenControl = async function (name) {
  if (!QUICK_PANEL_MODE) return;
  await openQuickPanelControl(name);
  focusPanel(1);
  scheduleNativeQuickPanelResize(0);
};

window.__tntQuickPanelOpenLayerMenu = async function () {
  if (!QUICK_PANEL_MODE) return;
  await openQuickPanelLayerMenu();
};

window.__tntQuickPanelRestoreFocus = function () {
  if (!QUICK_PANEL_MODE) return;
  if (activeQuickPanelSurface()) {
    focusPanel(1);
  } else {
    focusQuickPanelSearch(2);
  }
};

if (quickPanelShellEl) {
  quickPanelShellEl.addEventListener("click", async event => {
    const refreshButton = event.target.closest && event.target.closest("#quickPanelRefresh");
    if (refreshButton) {
      refreshQuickPanelState();
      return;
    }
    const searchResult = event.target.closest && event.target.closest("[data-quick-search-index]");
    if (searchResult) {
      applyQuickPanelSearchEntry(Number(searchResult.dataset.quickSearchIndex || 0));
      return;
    }
    const button = event.target.closest && event.target.closest("[data-quick-panel]");
    if (!button) return;
    await openQuickPanelControl(button.dataset.quickPanel);
  });
  if (quickPanelSearchEl) {
    quickPanelSearchEl.addEventListener("focus", loadQuickPanelSearchEffects);
    quickPanelSearchEl.addEventListener("input", () => {
      quickPanelSearchSelectedIndex = 0;
      renderQuickPanelSearchResults();
    });
    quickPanelSearchEl.addEventListener("keydown", event => {
      const entries = quickPanelSearchEntries();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        quickPanelSearchSelectedIndex = Math.min(entries.length - 1, quickPanelSearchSelectedIndex + 1);
        renderQuickPanelSearchResults();
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        quickPanelSearchSelectedIndex = Math.max(0, quickPanelSearchSelectedIndex - 1);
        renderQuickPanelSearchResults();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        applyQuickPanelSearchEntry();
        return;
      }
      if (event.key === "Escape") {
        if (quickPanelSearchParentEntry) {
          event.preventDefault();
          event.stopPropagation();
          quickPanelSearchParentEntry = null;
          quickPanelSearchSelectedIndex = 0;
          quickPanelSearchEl.value = "";
          quickPanelSearchEl.placeholder = "Search commands or effects";
          renderQuickPanelSearchResults();
        } else if (quickPanelSearchEl.value) {
          event.preventDefault();
          event.stopPropagation();
          resetQuickPanelSearch();
        }
      }
    });
  }
  quickPanelShellEl.querySelectorAll("[data-tooltip]").forEach(bindPanelTooltip);
  if (QUICK_PANEL_MODE && window.MutationObserver) {
    const observer = new MutationObserver(() => scheduleNativeQuickPanelResize());
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"],
      childList: true,
      subtree: true
    });
    window.addEventListener("resize", () => scheduleNativeQuickPanelResize(80));
    scheduleNativeQuickPanelResize(0);
  }
}
const assistantHubEl = document.getElementById("assistantHub");
const assistantFunctionSearchEl = document.getElementById("assistantFunctionSearch");
const assistantFunctionListEl = document.getElementById("assistantFunctionList");
const assistantFunctionCountEl = document.getElementById("assistantFunctionCount");

// The gear moved from the (now removed) left gutter into the tab row, so it can
// no longer rely on the gutter's delegated click handler.
if (settingsBtnEl) {
  settingsBtnEl.addEventListener("mousedown", event => event.stopPropagation(), true);
  settingsBtnEl.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    toggleSettingsMenu();
  });
}
const assistantRefreshFunctionsEl = document.getElementById("assistantRefreshFunctions");
const assistantChatMessagesEl = document.getElementById("assistantChatMessages");
const assistantChatInputEl = document.getElementById("assistantChatInput");
const assistantChatSendEl = document.getElementById("assistantChatSend");
const assistantHistoryMenuEl = document.getElementById("assistantHistoryMenu");
const assistantDraftActionsEl = document.getElementById("assistantDraftActions");
const assistantDraftStatusEl = document.getElementById("assistantDraftStatus");
const assistantAutoTestDraftEl = document.getElementById("assistantAutoTestDraft");
const assistantTestDraftEl = document.getElementById("assistantTestDraft");
const assistantApplyDraftEl = document.getElementById("assistantApplyDraft");
const assistantSaveDraftEl = document.getElementById("assistantSaveDraft");
const assistantSaveModalEl = document.getElementById("assistantSaveModal");
const assistantSaveNameEl = document.getElementById("assistantSaveName");
const assistantSaveCategoryEl = document.getElementById("assistantSaveCategory");
const assistantSaveErrorEl = document.getElementById("assistantSaveError");
const assistantSaveCancelEl = document.getElementById("assistantSaveCancel");
const assistantSaveApplyEl = document.getElementById("assistantSaveApply");
const ASSISTANT_HISTORY_STORAGE_KEY = "tntAssistantChatSessions.v1";
const ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY = "tntAssistantSavedFunctions.v1";
const ASSISTANT_INITIAL_MESSAGE = "Connected to the local assistant bridge. It can read the current After Effects context and the panel function registry.";
const ASSISTANT_AUTO_TEST_MAX_ATTEMPTS = 2;
let assistantFunctionsParentEntry = null;
let assistantFunctionSelectedIndex = 0;
let assistantProvider = "claude";
let assistantChatBusy = false;
let assistantSessions = [];
let assistantCurrentSessionId = "";
let assistantLatestDraft = null;
let assistantSavedFunctions = [];
let assistantAutoTestBusy = false;
let assistantFunctionBusy = false;
let assistantFunctionLastPointerRunAt = 0;

function assistantFunctionEntries() {
  if (!assistantFunctionSearchEl) return [];
  const query = assistantFunctionSearchEl.value;
  try {
    let entries = searchFxConsoleEntries(query, assistantFunctionsParentEntry, 96);
    if (!entries.length && assistantFunctionsParentEntry && !String(query || "").trim()) {
      assistantFunctionsParentEntry = null;
      assistantFunctionSearchEl.placeholder = "Search functions";
      entries = searchFxConsoleEntries("", null, 96);
    }
    if (entries.length) return entries;
  } catch (err) {
    statusEl.textContent = `Function search failed: ${String(err && err.message || err)}`;
  }
  const normalizedQuery = String(query || "").toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const fallback = []
    .concat((FX_CONSOLE_COMMANDS || []).map(command => ({ ...command, source: "panel" })))
    .concat((typeof getAssistantSavedFunctionCommands === "function" ? getAssistantSavedFunctionCommands() : []))
    .concat((TNT_V3_COMMANDS || []).map(command => ({
      ...command,
      source: "custom",
      type: command.action ? "command" : (command.children ? "tntMenu" : "tntCommand")
    })));
  if (!terms.length) return fallback.slice(0, 96);
  return fallback.filter(entry => {
    const source = fxConsoleSourceMeta(entry);
    const tags = (typeof safeFxConsoleEntryTags === "function" ? safeFxConsoleEntryTags(entry) : [{ label: source.label }]).map(tag => tag.label).join(" ");
    const haystack = `${entry.name || ""} ${entry.category || ""} ${entry.matchName || ""} ${entry.shortcut || ""} ${entry.parentName || ""} ${source.label} ${source.detail} ${tags}`.toLowerCase();
    return terms.every(term => haystack.indexOf(term) >= 0);
  }).slice(0, 96);
}

function assistantFunctionDetail(entry) {
  return [entry.category || entry.matchName || "", entry.shortcut || "", entry.parentName || ""].filter(Boolean).join(" / ");
}

function renderAssistantFunctions() {
  if (!assistantFunctionListEl) return;
  const entries = assistantFunctionEntries();
  assistantFunctionSelectedIndex = Math.max(0, Math.min(assistantFunctionSelectedIndex, Math.max(0, entries.length - 1)));
  if (assistantFunctionCountEl) {
    assistantFunctionCountEl.textContent = assistantFunctionsParentEntry
      ? `${entries.length} in ${assistantFunctionsParentEntry.name || "group"}`
      : `${entries.length} ready`;
  }
  if (!entries.length) {
    assistantFunctionListEl.innerHTML = `<div class="assistant-message">No functions found.</div>`;
    return;
  }
  assistantFunctionListEl.innerHTML = entries.map((entry, index) => {
    return `
      <button type="button" class="assistant-function-card${index === assistantFunctionSelectedIndex ? " active" : ""}" data-assistant-function-index="${index}" data-fx-source="${tntSourceGroup(entry)}">
        <strong>${escapeHtml(entry.name || entry.matchName || "Function")}</strong>
        <span class="assistant-function-tags tnt-tags">${tntTagChips(entry)}</span>
        <em>${escapeHtml(assistantFunctionDetail(entry))}</em>
      </button>
    `;
  }).join("");
}

function loadAssistantSavedFunctions() {
  if (!assistantStorageAvailable()) {
    assistantSavedFunctions = [];
    return;
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY) || "[]");
    assistantSavedFunctions = Array.isArray(parsed) ? parsed.filter(item => item && item.id && item.source) : [];
  } catch (_) {
    assistantSavedFunctions = [];
  }
}

function saveAssistantSavedFunctions() {
  if (!assistantStorageAvailable()) return;
  try {
    window.localStorage.setItem(ASSISTANT_SAVED_FUNCTIONS_STORAGE_KEY, JSON.stringify(assistantSavedFunctions.slice(0, 200)));
  } catch (_) {}
}

function getAssistantSavedFunctionCommands() {
  if (!assistantSavedFunctions.length) loadAssistantSavedFunctions();
  return assistantSavedFunctions.map(item => ({
    type: "command",
    name: item.name || "Assistant Function",
    category: item.category || "Assistant",
    source: "assistant",
    assistantFunctionId: item.id,
    action: () => runAssistantSavedFunction(item.id)
  }));
}

function assistantExtractScriptBlock(text) {
  const value = String(text || "");
  const fenced = [];
  value.replace(/```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
    const normalizedLang = String(lang || "").toLowerCase();
    fenced.push({ lang: normalizedLang, code: String(code || "").trim() });
    return match;
  });
  const preferred = fenced.find(block => /^(jsx|extendscript|javascript|js)$/.test(block.lang)) || fenced[0];
  if (preferred && preferred.code) return preferred.code;
  return "";
}

function assistantSetLatestDraft(source, originText = "") {
  const cleanSource = String(source || "").trim();
  assistantLatestDraft = cleanSource ? {
    source: cleanSource,
    suggestedName: assistantSessionTitleFromText(originText || "Assistant Function")
  } : null;
  renderAssistantDraftActions();
}

function renderAssistantDraftActions(message = "") {
  if (!assistantDraftActionsEl) return;
  const hasDraft = !!(assistantLatestDraft && assistantLatestDraft.source);
  assistantDraftActionsEl.classList.toggle("show", hasDraft);
  assistantDraftActionsEl.setAttribute("aria-hidden", hasDraft ? "false" : "true");
  if (assistantDraftStatusEl) {
    assistantDraftStatusEl.textContent = message || (hasDraft ? "Script draft ready" : "");
  }
}

function assistantScriptSafetyCheck(source) {
  const code = String(source || "");
  const compact = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  const blocked = [
    { pattern: /\bapp\.project\.save\b|\bsaveWithDialog\b|\.save\s*\(/i, reason: "saving project/files" },
    { pattern: /\bapp\.quit\b|\bapp\.exit\b/i, reason: "quitting After Effects" },
    { pattern: /\bsystem\.callSystem\b/i, reason: "running shell commands" },
    { pattern: /\bnew\s+(File|Folder)\b|\bFile\s*\(|\bFolder\s*\(/i, reason: "filesystem access" },
    { pattern: /\bimportFile\b|\bImportOptions\b/i, reason: "importing files" },
    { pattern: /\brenderQueue\b|\boutputModule\b/i, reason: "render/output queue changes" },
    { pattern: /\.remove\s*\(/i, reason: "deleting project items, layers, or properties" },
    { pattern: /\bexecuteCommand\s*\(/i, reason: "unbounded AE menu commands" }
  ];
  for (let i = 0; i < blocked.length; i += 1) {
    if (blocked[i].pattern.test(compact)) {
      return { ok: false, error: `Blocked unsafe assistant script: ${blocked[i].reason}.` };
    }
  }
  if (compact.length > 30000) return { ok: false, error: "Blocked unsafe assistant script: draft is too large." };
  return { ok: true };
}

async function runAssistantScriptSource(source, name = "Assistant Function", options = {}) {
  const safety = assistantScriptSafetyCheck(source);
  if (!safety.ok) {
    statusEl.textContent = safety.error;
    return safety;
  }
  await loadJSX();
  const result = await aeCall("TNT_runAssistantGeneratedScript", [String(source || ""), String(name || "Assistant Function"), !!options.revertAfterRun]);
  if (!result.ok) {
    const verificationText = assistantVerificationText(result);
    statusEl.textContent = verificationText || result.error || "Assistant script failed.";
    return result;
  }
  statusEl.textContent = options.revertAfterRun
    ? String(result.result || `${name} test passed`)
    : String(result.result || `${name} done`);
  await refreshLayers({ forceRender: true });
  renderAssistantFunctions();
  return result;
}

function assistantVerificationText(result) {
  if (!result) return "";
  const parts = [];
  if (result.error) parts.push(String(result.error));
  const verification = result.verification || null;
  if (verification) {
    if (verification.before || verification.after) {
      parts.push(`Before: ${verification.before || "unknown"}`);
      parts.push(`After: ${verification.after || "unknown"}`);
    }
    if (verification.dashIntent) {
      parts.push(`Dash check: valid=${verification.dashPatternValid ? "yes" : "no"}, changed=${verification.dashChanged ? "yes" : "no"}, added=${verification.dashValueAdded ? "yes" : "no"}`);
    }
  }
  return parts.filter(Boolean).join("\n");
}

async function testAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  renderAssistantDraftActions("Testing script in After Effects...");
  if (assistantTestDraftEl) assistantTestDraftEl.disabled = true;
  try {
    const result = await runAssistantScriptSource(assistantLatestDraft.source, "Test Assistant Draft", { revertAfterRun: true });
    renderAssistantDraftActions(result.ok ? "Test passed. Apply or Save when ready." : (assistantVerificationText(result) || "Test failed."));
  } finally {
    if (assistantTestDraftEl) assistantTestDraftEl.disabled = false;
  }
}

function setAssistantDraftButtonsBusy(isBusy) {
  if (assistantAutoTestDraftEl) assistantAutoTestDraftEl.disabled = !!isBusy;
  if (assistantTestDraftEl) assistantTestDraftEl.disabled = !!isBusy;
  if (assistantApplyDraftEl) assistantApplyDraftEl.disabled = !!isBusy;
  if (assistantSaveDraftEl) assistantSaveDraftEl.disabled = !!isBusy;
}

async function applyAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  renderAssistantDraftActions("Applying script in After Effects...");
  setAssistantDraftButtonsBusy(true);
  try {
    const result = await runAssistantScriptSource(assistantLatestDraft.source, "Apply Assistant Draft", { revertAfterRun: false });
    renderAssistantDraftActions(result.ok ? "Applied. Save it if you want it in Functions." : (result.error || "Apply failed."));
  } finally {
    setAssistantDraftButtonsBusy(false);
  }
}

async function requestAssistantDraftRevision(errorText, failingSource, attempt) {
  const prompt = [
    assistantAeContextText(`${errorText}\n${failingSource}`),
    "",
    "Current assistant chat history for this session:",
    assistantSessionTranscriptText({ limit: 18, maxCharsPerMessage: 2200 }),
    "",
    "The previous assistant-generated ExtendScript draft failed when tested inside After Effects.",
    `Attempt: ${attempt}`,
    "AE error:",
    String(errorText || "Unknown error"),
    "",
    "Failing script:",
    "```jsx",
    String(failingSource || ""),
    "```",
    "",
    assistantScriptingLibraryText(`${errorText}\n${failingSource}`),
    "",
    "Return a corrected version. Keep the answer compact and include exactly one executable jsx code block. The code block is the function body; the panel wraps it in an undo group.",
    "The corrected script must verify its own result after applying it. For dash/stroke work, confirm actual Dash/Gap properties exist and have values; do not return success for an empty Dashes group or no-op."
  ].filter(Boolean).join("\n");
  try {
    return await runAssistantPromptViaLocalServer(assistantProvider, prompt);
  } catch (serverErr) {
    try {
      return await runAssistantPromptInCep(assistantProvider, prompt);
    } catch (_) {
      throw new Error(`Local assistant server is not reachable: ${String(serverErr && serverErr.message || serverErr)}.`);
    }
  }
}

async function autoTestAssistantDraft() {
  if (!assistantLatestDraft || !assistantLatestDraft.source || assistantAutoTestBusy) {
    renderAssistantDraftActions("No script draft found in the latest assistant reply.");
    return;
  }
  assistantAutoTestBusy = true;
  setAssistantDraftButtonsBusy(true);
  setAssistantChatBusy(true);
  let source = assistantLatestDraft.source;
  try {
    for (let attempt = 1; attempt <= ASSISTANT_AUTO_TEST_MAX_ATTEMPTS; attempt += 1) {
      renderAssistantDraftActions(`Auto test ${attempt}/${ASSISTANT_AUTO_TEST_MAX_ATTEMPTS}...`);
      const testResult = await runAssistantScriptSource(source, `Auto Test Draft ${attempt}`, { revertAfterRun: true });
      if (testResult.ok) {
        assistantSetLatestDraft(source, assistantLatestDraft.suggestedName || "Assistant Function");
        renderAssistantDraftActions(`Auto test passed on attempt ${attempt}. Apply or Save when ready.`);
        appendAssistantMessage(`Auto test passed on attempt ${attempt}. Test changes were reverted; use Apply to commit them.`, "system");
        return;
      }
      const errorText = assistantVerificationText(testResult) || testResult.error || testResult.result || "Unknown script error.";
      appendAssistantMessage(`Auto test ${attempt} failed:\n${errorText}`, "system");
      if (attempt >= ASSISTANT_AUTO_TEST_MAX_ATTEMPTS) {
        renderAssistantDraftActions(`Auto test stopped: ${errorText}`);
        return;
      }
      renderAssistantDraftActions(`Refining after error ${attempt}/${ASSISTANT_AUTO_TEST_MAX_ATTEMPTS}...`);
      const revision = await requestAssistantDraftRevision(errorText, source, attempt + 1);
      const replyText = String(revision && revision.result || "").trim();
      if (!revision || !revision.ok || !replyText) {
        renderAssistantDraftActions("Refinement failed.");
        appendAssistantMessage((revision && revision.error) || "Assistant refinement failed.", "system");
        return;
      }
      appendAssistantMessage(replyText, "system");
      const nextSource = assistantExtractScriptBlock(replyText);
      if (!nextSource) {
        renderAssistantDraftActions("Refinement did not include a jsx code block.");
        return;
      }
      source = nextSource;
      assistantSetLatestDraft(source, replyText);
    }
  } catch (err) {
    const errorText = `Auto test error: ${String(err && err.message || err)}`;
    renderAssistantDraftActions(errorText);
    appendAssistantMessage(errorText, "system");
  } finally {
    assistantAutoTestBusy = false;
    setAssistantDraftButtonsBusy(false);
    setAssistantChatBusy(false);
    if (assistantChatInputEl) assistantChatInputEl.focus();
  }
}

function showAssistantSaveDialog() {
  if (!assistantLatestDraft || !assistantLatestDraft.source || !assistantSaveModalEl) {
    renderAssistantDraftActions("No script draft found to save.");
    return;
  }
  if (assistantSaveNameEl) {
    assistantSaveNameEl.value = assistantLatestDraft.suggestedName || "Assistant Function";
    setTimeout(() => { try { assistantSaveNameEl.focus(); assistantSaveNameEl.select(); } catch (_) {} }, 0);
  }
  if (assistantSaveCategoryEl && !assistantSaveCategoryEl.value) assistantSaveCategoryEl.value = "Assistant";
  if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = "";
  assistantSaveModalEl.classList.add("show");
  assistantSaveModalEl.setAttribute("aria-hidden", "false");
}

function hideAssistantSaveDialog() {
  if (!assistantSaveModalEl) return;
  assistantSaveModalEl.classList.remove("show");
  assistantSaveModalEl.setAttribute("aria-hidden", "true");
}

function saveAssistantDraftAsFunction() {
  if (!assistantLatestDraft || !assistantLatestDraft.source) return;
  const safety = assistantScriptSafetyCheck(assistantLatestDraft.source);
  if (!safety.ok) {
    if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = safety.error;
    renderAssistantDraftActions(safety.error);
    return;
  }
  const name = String(assistantSaveNameEl && assistantSaveNameEl.value || "").trim();
  const category = String(assistantSaveCategoryEl && assistantSaveCategoryEl.value || "Assistant").trim() || "Assistant";
  if (!name) {
    if (assistantSaveErrorEl) assistantSaveErrorEl.textContent = "Name the function first.";
    return;
  }
  const now = new Date().toISOString();
  assistantSavedFunctions.unshift({
    id: `assistant-fn-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    name,
    category,
    source: assistantLatestDraft.source,
    createdAt: now,
    updatedAt: now
  });
  saveAssistantSavedFunctions();
  hideAssistantSaveDialog();
  renderAssistantFunctions();
  renderAssistantDraftActions(`Saved "${name}" to Functions.`);
  setAssistantTab("functions");
  if (assistantFunctionSearchEl) {
    assistantFunctionSearchEl.value = name;
    assistantFunctionSelectedIndex = 0;
    renderAssistantFunctions();
  }
}

async function runAssistantSavedFunction(id) {
  if (!assistantSavedFunctions.length) loadAssistantSavedFunctions();
  const item = assistantSavedFunctions.find(fn => fn.id === id);
  if (!item) {
    statusEl.textContent = "Saved assistant function not found.";
    return;
  }
  await runAssistantScriptSource(item.source, item.name || "Assistant Function");
}

async function runAssistantFunction(index = assistantFunctionSelectedIndex) {
  if (assistantFunctionBusy) return;
  const entries = assistantFunctionEntries();
  const entry = entries[Math.max(0, Math.min(Number(index || 0), entries.length - 1))];
  if (!entry) return;
  if (entry.children && entry.children.length) {
    assistantFunctionsParentEntry = entry;
    assistantFunctionSelectedIndex = 0;
    if (assistantFunctionSearchEl) {
      assistantFunctionSearchEl.value = "";
      assistantFunctionSearchEl.placeholder = `Search ${entry.name}`;
    }
    renderAssistantFunctions();
    return;
  }
  assistantFunctionBusy = true;
  if (assistantFunctionCountEl) assistantFunctionCountEl.textContent = `Running ${entry.name || "function"}...`;
  try {
    const ran = await executeFxConsoleEntry(entry);
    if (ran) {
      statusEl.textContent = `${entry.name || "Function"} applied`;
      await refreshLayers({ forceRender: true });
    }
  } catch (err) {
    statusEl.textContent = `Function failed: ${String(err && err.message || err)}`;
  } finally {
    assistantFunctionBusy = false;
    renderAssistantFunctions();
  }
}

function setAssistantTab(name) {
  if (!assistantHubEl) return;
  const selected = String(name || "functions");
  assistantHubEl.querySelectorAll("[data-assistant-tab]").forEach(button => {
    const active = button.dataset.assistantTab === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
  assistantHubEl.querySelectorAll("[data-assistant-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.assistantPanel === selected);
  });
  if (selected === "functions") renderAssistantFunctions();
}

function assistantStorageAvailable() {
  try {
    return !!window.localStorage;
  } catch (_) {
    return false;
  }
}

function assistantSessionTitleFromText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "New session";
  return normalized.length > 46 ? `${normalized.slice(0, 43)}...` : normalized;
}

function loadAssistantSessions() {
  if (!assistantStorageAvailable()) {
    assistantSessions = [];
    return;
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ASSISTANT_HISTORY_STORAGE_KEY) || "[]");
    assistantSessions = Array.isArray(parsed) ? parsed.filter(session => session && session.id && Array.isArray(session.messages)) : [];
  } catch (_) {
    assistantSessions = [];
  }
}

function saveAssistantSessions() {
  if (!assistantStorageAvailable()) return;
  try {
    const capped = assistantSessions
      .slice()
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
      .slice(0, 40);
    window.localStorage.setItem(ASSISTANT_HISTORY_STORAGE_KEY, JSON.stringify(capped));
    assistantSessions = capped;
  } catch (_) {}
}

function createAssistantSession() {
  const now = new Date().toISOString();
  const session = {
    id: `session-${Date.now()}-${Math.round(Math.random() * 100000)}`,
    title: "New session",
    provider: assistantProvider,
    createdAt: now,
    updatedAt: now,
    messages: [{ kind: "system", text: ASSISTANT_INITIAL_MESSAGE, at: now }]
  };
  assistantSessions.unshift(session);
  assistantCurrentSessionId = session.id;
  saveAssistantSessions();
  return session;
}

function currentAssistantSession() {
  return assistantSessions.find(session => session.id === assistantCurrentSessionId) || assistantSessions[0] || createAssistantSession();
}

function recordAssistantMessage(text, kind = "system") {
  const session = currentAssistantSession();
  const now = new Date().toISOString();
  const cleanText = cleanAssistantOutput(text);
  session.messages.push({ kind, text: cleanText, at: now });
  session.provider = assistantProvider;
  session.updatedAt = now;
  if (kind === "user" && (!session.title || session.title === "New session")) {
    session.title = assistantSessionTitleFromText(cleanText);
  }
  saveAssistantSessions();
  renderAssistantHistoryMenu();
}

function renderAssistantSession(session = currentAssistantSession()) {
  if (!assistantChatMessagesEl || !session) return;
  assistantChatMessagesEl.innerHTML = "";
  (session.messages || []).forEach(message => {
    appendAssistantMessage(message.text, message.kind || "system", { persist: false });
  });
}

function assistantHistoryDateLabel(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  const sessions = assistantSessions
    .slice()
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  if (!sessions.length) {
    assistantHistoryMenuEl.innerHTML = `<div class="assistant-history-empty">No saved chats yet.</div>`;
    return;
  }
  assistantHistoryMenuEl.innerHTML = sessions.map(session => `
    <button type="button" class="assistant-history-item${session.id === assistantCurrentSessionId ? " active" : ""}" data-assistant-session-id="${escapeHtml(session.id)}">
      <strong>${escapeHtml(session.title || "New session")}</strong>
      <span>${escapeHtml(providerLabel(session.provider || assistantProvider))} · ${escapeHtml(assistantHistoryDateLabel(session.updatedAt))} · ${(session.messages || []).length} messages</span>
    </button>
  `).join("");
}

function toggleAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  renderAssistantHistoryMenu();
  const open = !assistantHistoryMenuEl.classList.contains("show");
  assistantHistoryMenuEl.classList.toggle("show", open);
  assistantHistoryMenuEl.setAttribute("aria-hidden", open ? "false" : "true");
}

function closeAssistantHistoryMenu() {
  if (!assistantHistoryMenuEl) return;
  assistantHistoryMenuEl.classList.remove("show");
  assistantHistoryMenuEl.setAttribute("aria-hidden", "true");
}

function assistantSessionTranscriptText(options = {}) {
  const session = currentAssistantSession();
  const messages = (session && session.messages || [])
    .filter(message => message && message.text && message.kind !== "system-internal")
    .slice(-Number(options.limit || 18));
  if (!messages.length) return "No prior chat messages in this session.";
  return messages.map(message => {
    const role = message.kind === "user" ? "User" : "Assistant";
    const text = String(message.text || "")
      .replace(/\s+$/g, "")
      .slice(0, Number(options.maxCharsPerMessage || 2400));
    return `${role}: ${text}`;
  }).join("\n\n");
}

function appendAssistantMessage(text, kind = "system", options = {}) {
  if (!assistantChatMessagesEl) return;
  const cleanText = cleanAssistantOutput(text);
  const message = document.createElement("div");
  message.className = `assistant-message assistant-message-${kind}`;
  if (kind === "user") {
    message.textContent = cleanText;
  } else {
    renderAssistantMessageContent(message, cleanText);
  }
  assistantChatMessagesEl.appendChild(message);
  assistantChatMessagesEl.scrollTop = assistantChatMessagesEl.scrollHeight;
  if (options.persist !== false) recordAssistantMessage(cleanText, kind);
  if (options.updateDraft !== false && kind !== "user") {
    const draftSource = assistantExtractScriptBlock(cleanText);
    if (draftSource) assistantSetLatestDraft(draftSource, cleanText);
  }
  return message;
}

function renderAssistantMessageContent(container, text) {
  const value = String(text || "");
  const pattern = /```([A-Za-z0-9_-]*)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  let rendered = false;
  while ((match = pattern.exec(value))) {
    const before = value.slice(lastIndex, match.index);
    if (before.trim()) container.appendChild(assistantTextBlock(before));
    const lang = String(match[1] || "jsx").trim() || "jsx";
    const code = String(match[2] || "").replace(/\s+$/, "");
    container.appendChild(assistantCodeBlock(code, lang));
    lastIndex = pattern.lastIndex;
    rendered = true;
  }
  const after = value.slice(lastIndex);
  if (after.trim()) container.appendChild(assistantTextBlock(after));
  if (!rendered && !container.childNodes.length) container.textContent = value;
}

function assistantTextBlock(text) {
  const block = document.createElement("div");
  block.className = "assistant-text-block";
  block.textContent = String(text || "").trim();
  return block;
}

function assistantCodeBlock(code, lang) {
  const wrap = document.createElement("div");
  wrap.className = "assistant-code-block";
  const header = document.createElement("div");
  header.className = "assistant-code-header";
  header.textContent = String(lang || "code").toUpperCase();
  const pre = document.createElement("pre");
  const codeEl = document.createElement("code");
  const normalizedLang = String(lang || "").toLowerCase();
  if (/^(jsx|extendscript|javascript|js)$/.test(normalizedLang)) {
    codeEl.innerHTML = assistantHighlightJavaScript(code);
  } else {
    codeEl.textContent = String(code || "");
  }
  pre.appendChild(codeEl);
  wrap.appendChild(header);
  wrap.appendChild(pre);
  return wrap;
}

function assistantEscapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function assistantHighlightJavaScript(code) {
  const source = assistantEscapeHtml(code);
  const placeholders = [];
  const placeholderKey = index => {
    let n = index + 1;
    let key = "";
    while (n > 0) {
      n -= 1;
      key = String.fromCharCode(65 + (n % 26)) + key;
      n = Math.floor(n / 26);
    }
    return key;
  };
  const hold = (className, value) => {
    const token = `\u0000${placeholderKey(placeholders.length)}\u0000`;
    placeholders.push(`<span class="${className}">${value}</span>`);
    return token;
  };
  let highlighted = source
    .replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/g, match => hold("code-comment", match))
    .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, match => hold("code-string", match));
  highlighted = highlighted
    .replace(/\b(function|var|let|const|if|else|for|while|return|try|catch|finally|new|true|false|null|undefined|typeof|instanceof|continue|break|switch|case|default|throw)\b/g, '<span class="code-keyword">$1</span>')
    .replace(/\b(app|CompItem|ShapeLayer|PropertyType|PropertyValueType|ADBE[A-Za-z0-9 _-]*)\b/g, '<span class="code-ae">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>');
  return highlighted.replace(/\u0000([A-Z]+)\u0000/g, (_, key) => {
    let index = 0;
    for (let i = 0; i < key.length; i += 1) index = index * 26 + (key.charCodeAt(i) - 64);
    return placeholders[index - 1] || "";
  });
}

function cleanAssistantOutput(text) {
  const lines = String(text || "").split(/\r?\n/);
  const filtered = [];
  let droppingClaudeStdinWarning = false;
  lines.forEach(line => {
    if (/^Warning: no stdin data received/i.test(line)) {
      droppingClaudeStdinWarning = true;
      return;
    }
    if (droppingClaudeStdinWarning && /^(without it|stdin explicitly:|If piping from)/i.test(line.trim())) return;
    droppingClaudeStdinWarning = false;
    filtered.push(line);
  });
  return filtered.join("\n").trim();
}

function setAssistantProvider(provider) {
  assistantProvider = String(provider || "auto");
  if (!assistantHubEl) return;
  assistantHubEl.querySelectorAll("[data-assistant-provider]").forEach(button => {
    const active = button.dataset.assistantProvider === assistantProvider;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function providerLabel(provider) {
  const labels = { claude: "Claude", codex: "Codex", ollama: "Ollama", auto: "Auto" };
  return labels[String(provider || "").toLowerCase()] || "Assistant";
}

function assistantNodeRequire(moduleName) {
  try {
    if (typeof require === "function") return require(moduleName);
  } catch (_) {}
  try {
    if (window.cep_node && typeof window.cep_node.require === "function") return window.cep_node.require(moduleName);
  } catch (_) {}
  return null;
}

function selectedAssistantLayersForContext() {
  const selected = new Set((state.selectedLayerIndices || []).map(Number));
  const layers = (state.layers || []).filter(layer => selected.has(Number(layer.index || 0)));
  return layers.length ? layers : (state.layers || []).slice(0, 12);
}

function assistantAeContextText(topicText = "") {
  const comp = state.comp || null;
  const functions = assistantFunctionInventoryForContext();
  const selectedLayers = selectedAssistantLayersForContext().map(layer => ({
    index: layer.index,
    name: layer.name,
    type: layer.type,
    selected: !!layer.selected,
    inPoint: layer.inPoint,
    outPoint: layer.outPoint,
    startTime: layer.startTime,
    enabled: !!layer.enabled,
    locked: !!layer.locked,
    parentIndex: layer.parentIndex || 0,
    trackMatteType: layer.trackMatteType || "",
    effectNames: layer.effectNames || [],
    propertyNames: layer.propertyNames || []
  }));
  const context = {
    host: "Adobe After Effects 2026",
    extension: "Premiere Style Timeline CEP panel",
    extensionRoot: extensionRootPath(),
    activeComp: comp ? {
      id: comp.id,
      name: comp.name,
      width: comp.width,
      height: comp.height,
      duration: comp.duration,
      frameRate: comp.frameRate,
      time: comp.time,
      numLayers: comp.numLayers,
      selectedLayerIndices: state.selectedLayerIndices || []
    } : null,
    visibleProjectComps: (state.comps || []).slice(0, 40).map(item => ({
      id: item.id,
      name: item.name,
      width: item.width,
      height: item.height,
      duration: item.duration,
      numLayers: item.numLayers
    })),
    selectedOrSampleLayers: selectedLayers,
    selectedKeyframes: (selectedKeyframes || []).slice(0, 80),
    functionRegistry: functions
  };
  return [
    "You are running inside Adobe After Effects 2026 through the Premiere Style Timeline CEP assistant panel.",
    "You may use local CLI tools, MCP servers, and files available to this machine. The user expects After Effects scripting help and panel automation.",
    "You can see the panel's current function registry in context.functionRegistry. When the user asks what functions the tool has, answer from that registry.",
    "Safety mode is enabled for generated scripts. Do not use app.project.save/saveWithDialog, app.quit/exit, system.callSystem, File/Folder filesystem access, importFile/ImportOptions, renderQueue/outputModule, remove(), or executeCommand(). Generated scripts should only mutate the active comp, selected layers, and their properties for the requested task.",
    "When the user asks you to recreate, build, make from scratch, or automate something in AE, break down the approach in 1-3 short bullets and include one executable ExtendScript code block tagged jsx. Keep the code inside the fenced code block only; the panel renders it as a code box and offers Auto Test, Test, and Save for that latest code block.",
    "The jsx code block should be the body of a function executed inside After Effects. Use app.project.activeItem for the active comp, validate that it is a CompItem, and return a short result string. The panel wraps it in an undo group.",
    "If the user asks to save a generated function, provide the jsx code block; the panel's Save button stores it in the assistant function library. Only patch extension source files when the user explicitly asks for a permanent built-in command.",
    "Use the assistant scripting library notes below when they apply. They summarize local Adobe scripting guide match names and proven panel helper patterns:",
    assistantScriptingLibraryText(topicText),
    "Current AE read context follows as JSON. Treat it as live host context read from After Effects:",
    JSON.stringify(context, null, 2)
  ].join("\n");
}

function assistantScriptingLibraryText(topicText = "") {
  const topic = String(topicText || "").toLowerCase();
  const notes = [];
  if (/dash|stroke|shape|adbe vector/.test(topic)) {
    notes.push([
      "AE SCRIPTING LIBRARY: Shape stroke dashes",
      "- Local reference: after-effects-scripting-guide-master/docs/matchnames/layer/shapelayer.md#stroke-dashes.",
      "- Shape stroke match name is ADBE Vector Graphic - Stroke. Stroke dash container is ADBE Vector Stroke Dashes.",
      "- Dash props are ADBE Vector Stroke Dash 1 and ADBE Vector Stroke Gap 1. Add missing props with dashes.addProperty(matchName), then setValue(number).",
      "- Existing Dashes containers may already report children; still set Dash 1 and Gap 1 values explicitly and verify by reading them back.",
      "- Recursive traversal should start from layer.property(\"ADBE Root Vectors Group\") / Contents and look for ADBE Vector Graphic - Stroke or ADBE Vector Graphic - G-Stroke.",
      "- Known-good shortcut in this extension: the host function addDashesToStroke() sets Dash 1 to 10 and Gap 1 to 6 on selected shape strokes. A generated script can call return addDashesToStroke(); when the panel JSX has loaded."
    ].join("\n"));
  }
  if (/mask|track matte|matte/.test(topic)) {
    notes.push([
      "AE SCRIPTING LIBRARY: Masks and mattes",
      "- Prefer match-name lookups over display names.",
      "- Validate selected layers and comp with app.project.activeItem instanceof CompItem before mutating."
    ].join("\n"));
  }
  return notes.join("\n\n");
}

function assistantFunctionInventoryForContext() {
  const seen = new Set();
  const flatten = (entry, parentName = "") => {
    if (!entry) return [];
    const source = fxConsoleSourceMeta(entry);
    const tags = typeof fxConsoleEntryTags === "function" ? fxConsoleEntryTags(entry) : [{ label: source.label }];
    const item = {
      name: entry.name || entry.matchName || "Function",
      category: entry.category || "",
      shortcut: entry.shortcut || "",
      source: source.label,
      sourceDetail: source.detail,
      tags: tags.map(tag => tag.label),
      parent: parentName
    };
    const key = [item.name, item.category, item.shortcut, item.source, item.parent].join("\u0001");
    const rows = [];
    if (!seen.has(key)) {
      seen.add(key);
      rows.push(item);
    }
    (entry.children || []).forEach(child => {
      rows.push(...flatten({ ...child, source: entry.source || child.source }, entry.name || parentName));
    });
    return rows;
  };
  return searchFxConsoleEntries("", null, 240).flatMap(entry => flatten(entry)).slice(0, 360);
}

function assistantPromptWithAeContext(userPrompt) {
  return [
    assistantAeContextText(userPrompt),
    "Current assistant chat history for this session follows. Use it as conversation memory; when the user says 'try again', 'same thing', or references earlier errors, resolve that from this transcript:",
    assistantSessionTranscriptText({ limit: 18, maxCharsPerMessage: 2800 }),
    "Current user request:",
    String(userPrompt || "")
  ].join("\n\n");
}

async function runAssistantPromptViaLocalServer(provider, prompt) {
  const response = await fetch("http://127.0.0.1:48739/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: String(provider || "auto"), prompt: String(prompt || "") })
  });
  let payload = null;
  try { payload = await response.json(); } catch (_) {}
  if (!response.ok || !payload || !payload.ok) {
    throw new Error((payload && payload.error) || `Assistant server failed (${response.status}).`);
  }
  return payload;
}

function runAssistantPromptInCep(provider, prompt) {
  const fs = assistantNodeRequire("fs");
  const os = assistantNodeRequire("os");
  const path = assistantNodeRequire("path");
  const childProcess = assistantNodeRequire("child_process");
  if (!fs || !os || !path || !childProcess) {
    return Promise.reject(new Error("CEP Node is not enabled yet. Reload the panel after the manifest update."));
  }
  return new Promise((resolve, reject) => {
    const root = extensionRootPath();
    const runner = path.join(root, "scripts", "assistant-runner.sh");
    const promptFile = path.join(os.tmpdir(), `tnt-assistant-${Date.now()}-${Math.round(Math.random() * 100000)}.txt`);
    try {
      fs.writeFileSync(promptFile, prompt, "utf8");
    } catch (err) {
      reject(err);
      return;
    }
    const env = Object.assign({}, typeof process !== "undefined" && process.env ? process.env : {}, {
      TNT_ASSISTANT_MCP_CONFIG: path.join(root, "scripts", "assistant-mcp.json")
    });
    childProcess.execFile("/bin/bash", [runner, String(provider || "auto"), promptFile, root], {
      cwd: root,
      env,
      maxBuffer: 1024 * 1024 * 16
    }, (error, stdout, stderr) => {
      try { fs.unlinkSync(promptFile); } catch (_) {}
      const output = `${stdout || ""}${stderr ? `\n${stderr}` : ""}`.trim();
      if (error) {
        error.message = output || error.message;
        reject(error);
        return;
      }
      resolve({ ok: true, provider, result: output });
    });
  });
}

function setAssistantChatBusy(isBusy) {
  assistantChatBusy = !!isBusy;
  if (assistantChatSendEl) assistantChatSendEl.disabled = assistantChatBusy;
  if (assistantChatInputEl) assistantChatInputEl.disabled = assistantChatBusy;
}

async function submitAssistantChat() {
  if (!assistantChatInputEl || assistantChatBusy) return;
  const value = assistantChatInputEl.value.trim();
  if (!value) return;
  assistantChatInputEl.value = "";
  appendAssistantMessage(value, "user");
  const thinkingEl = appendAssistantMessage(`${providerLabel(assistantProvider)} is thinking...`, "system", { persist: false });
  setAssistantChatBusy(true);
  try {
    if (state.comp) await refreshLayers({ forceRender: false, skipSettledRefresh: true });
    const prompt = assistantPromptWithAeContext(value);
    let result = null;
    try {
      result = await runAssistantPromptViaLocalServer(assistantProvider, prompt);
    } catch (serverErr) {
      try {
        result = await runAssistantPromptInCep(assistantProvider, prompt);
      } catch (_) {
        throw new Error(`Local assistant server is not reachable: ${String(serverErr && serverErr.message || serverErr)}.`);
      }
    }
    if (result && result.ok) {
      if (thinkingEl) thinkingEl.remove();
      appendAssistantMessage(String(result.result || "").trim() || `${providerLabel(assistantProvider)} returned an empty response.`);
    } else {
      const errorText = (result && result.error) || "Assistant provider failed.";
      if (thinkingEl) thinkingEl.textContent = errorText;
      recordAssistantMessage(errorText);
    }
  } catch (err) {
    const errorText = `Assistant error: ${String(err && err.message || err)}`;
    if (thinkingEl) thinkingEl.textContent = errorText;
    recordAssistantMessage(errorText);
  } finally {
    setAssistantChatBusy(false);
    if (assistantChatInputEl) assistantChatInputEl.focus();
  }
}

function handleAssistantFunctionCardPointer(event, run = false) {
  const card = event.target.closest && event.target.closest("[data-assistant-function-index]");
  if (!card) return false;
  event.preventDefault();
  event.stopPropagation();
  if (event.stopImmediatePropagation) event.stopImmediatePropagation();
  if (!run) return true;
  const now = Date.now();
  if (now - assistantFunctionLastPointerRunAt < 300) return true;
  assistantFunctionLastPointerRunAt = now;
  assistantFunctionSelectedIndex = Number(card.dataset.assistantFunctionIndex || 0);
  renderAssistantFunctions();
  runAssistantFunction(assistantFunctionSelectedIndex);
  return true;
}

if (assistantFunctionListEl) {
  assistantFunctionListEl.addEventListener("pointerdown", event => handleAssistantFunctionCardPointer(event, true), true);
  assistantFunctionListEl.addEventListener("mousedown", event => handleAssistantFunctionCardPointer(event, true), true);
  assistantFunctionListEl.addEventListener("click", event => handleAssistantFunctionCardPointer(event, true), true);
}

if (assistantHubEl) {
  assistantHubEl.addEventListener("click", event => {
    const tab = event.target.closest && event.target.closest("[data-assistant-tab]");
    if (tab) {
      closeAssistantHistoryMenu();
      setAssistantTab(tab.dataset.assistantTab);
      return;
    }
    const historyButton = event.target.closest && event.target.closest("[data-assistant-history]");
    if (historyButton) {
      toggleAssistantHistoryMenu();
      return;
    }
    const historyItem = event.target.closest && event.target.closest("[data-assistant-session-id]");
    if (historyItem) {
      const session = assistantSessions.find(item => item.id === historyItem.dataset.assistantSessionId);
      if (session) {
        assistantCurrentSessionId = session.id;
        if (session.provider) setAssistantProvider(session.provider);
        renderAssistantSession(session);
        renderAssistantHistoryMenu();
        closeAssistantHistoryMenu();
        if (assistantChatInputEl) assistantChatInputEl.focus();
      }
      return;
    }
    const provider = event.target.closest && event.target.closest("[data-assistant-provider]");
    if (provider) {
      setAssistantProvider(provider.dataset.assistantProvider);
      currentAssistantSession().provider = assistantProvider;
      saveAssistantSessions();
      renderAssistantHistoryMenu();
      return;
    }
    const newChat = event.target.closest && event.target.closest(".assistant-new-btn");
    if (newChat && assistantChatMessagesEl) {
      const session = createAssistantSession();
      renderAssistantSession(session);
      renderAssistantHistoryMenu();
      closeAssistantHistoryMenu();
      if (assistantChatInputEl) assistantChatInputEl.focus();
      return;
    }
    const card = event.target.closest && event.target.closest("[data-assistant-function-index]");
    if (card) {
      event.preventDefault();
      return;
    }
  });
  if (assistantFunctionSearchEl) {
    assistantFunctionSearchEl.addEventListener("focus", async () => {
      if (!fxConsoleEffects.length) {
        await loadFxConsoleEffects();
        renderAssistantFunctions();
      }
    });
    assistantFunctionSearchEl.addEventListener("input", () => {
      assistantFunctionSelectedIndex = 0;
      renderAssistantFunctions();
    });
    assistantFunctionSearchEl.addEventListener("keydown", event => {
      const entries = assistantFunctionEntries();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        assistantFunctionSelectedIndex = Math.min(entries.length - 1, assistantFunctionSelectedIndex + 1);
        renderAssistantFunctions();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        assistantFunctionSelectedIndex = Math.max(0, assistantFunctionSelectedIndex - 1);
        renderAssistantFunctions();
      } else if (event.key === "Enter") {
        event.preventDefault();
        runAssistantFunction();
      } else if (event.key === "Backspace" && !assistantFunctionSearchEl.value && assistantFunctionsParentEntry) {
        assistantFunctionsParentEntry = null;
        assistantFunctionSearchEl.placeholder = "Search functions";
        renderAssistantFunctions();
      }
    });
  }
  if (assistantRefreshFunctionsEl) {
    assistantRefreshFunctionsEl.addEventListener("click", async () => {
      await loadFxConsoleEffects();
      renderAssistantFunctions();
    });
  }
  if (assistantChatSendEl) assistantChatSendEl.addEventListener("click", () => submitAssistantChat());
  if (assistantAutoTestDraftEl) assistantAutoTestDraftEl.addEventListener("click", () => autoTestAssistantDraft());
  if (assistantTestDraftEl) assistantTestDraftEl.addEventListener("click", () => testAssistantDraft());
  if (assistantApplyDraftEl) assistantApplyDraftEl.addEventListener("click", () => applyAssistantDraft());
  if (assistantSaveDraftEl) assistantSaveDraftEl.addEventListener("click", () => showAssistantSaveDialog());
  if (assistantSaveCancelEl) assistantSaveCancelEl.addEventListener("click", () => hideAssistantSaveDialog());
  if (assistantSaveApplyEl) assistantSaveApplyEl.addEventListener("click", () => saveAssistantDraftAsFunction());
  if (assistantSaveModalEl) {
    assistantSaveModalEl.addEventListener("mousedown", event => {
      if (event.target === assistantSaveModalEl) hideAssistantSaveDialog();
    });
    assistantSaveModalEl.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        hideAssistantSaveDialog();
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        saveAssistantDraftAsFunction();
      }
    });
  }
  if (assistantChatInputEl) {
    assistantChatInputEl.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitAssistantChat();
      }
    });
  }
  setAssistantProvider(assistantProvider);
  loadAssistantSessions();
  loadAssistantSavedFunctions();
  if (!assistantSessions.length) createAssistantSession();
  assistantCurrentSessionId = currentAssistantSession().id;
  renderAssistantSession(currentAssistantSession());
  renderAssistantHistoryMenu();
  renderAssistantDraftActions();
  renderAssistantFunctions();
}
if (layerSelectionModalEl) {
  layerSelectionModalEl.addEventListener("mousedown", event => {
    if (event.target === layerSelectionModalEl) hideLayerSelectionPanel();
  });
  layerSelectionModalEl.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideLayerSelectionPanel();
      focusPanel(2);
    }
  });
}
if (compositionModalEl) {
  compositionModalEl.addEventListener("mousedown", event => {
    if (event.target === compositionModalEl) {
      hideCompositionPanel();
      focusPanel(2);
    }
  });
  compositionModalEl.addEventListener("click", event => {
    const button = event.target.closest && event.target.closest("[data-composition-action]");
    if (!button) return;
    runCompositionPanelAction(button.dataset.compositionAction || "");
  });
}
if (layerSelectionSearchEl) {
  layerSelectionSearchEl.addEventListener("input", () => {
    layerSelectionQuery = layerSelectionSearchEl.value || "";
    renderLayerSelectionPanel();
  });
}
if (layerSelectionSearchClearEl) {
  layerSelectionSearchClearEl.addEventListener("click", () => {
    layerSelectionQuery = "";
    if (layerSelectionSearchEl) {
      layerSelectionSearchEl.value = "";
      layerSelectionSearchEl.focus();
    }
    renderLayerSelectionPanel();
  });
}
if (layerSelectionSelectMatchesEl) {
  layerSelectionSelectMatchesEl.addEventListener("click", () => {
    selectLayerSelectionMatches();
  });
}
if (layerSelectionModesEl) {
  layerSelectionModesEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-selection-mode]");
    if (!btn) return;
    layerSelectionMode = btn.dataset.selectionMode || "layer";
    lastLayerSelectionIndex = 0;
    renderLayerSelectionPanel();
    if (layerSelectionSearchEl) layerSelectionSearchEl.focus();
  });
}
if (layerSelectionScopesEl) {
  layerSelectionScopesEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-selection-scope]");
    if (!btn) return;
    layerSelectionScope = btn.dataset.selectionScope || "selected";
    layerSelectionFilter = null;
    lastLayerSelectionIndex = 0;
    renderLayerSelectionPanel();
  });
}
if (layerSelectionQuickFiltersEl) {
  layerSelectionQuickFiltersEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-layer-selection-filter]");
    if (!btn) return;
    applyLayerSelectionQuickFilter(btn.dataset.layerSelectionFilter || null);
  });
}
if (layerViewFiltersEl) {
  layerViewFiltersEl.addEventListener("click", event => {
    const btn = event.target.closest && event.target.closest("[data-layer-view-filter]");
    if (!btn) return;
    setLayerViewFilter(btn.dataset.layerViewFilter || null, null);
    renderLayerSelectionPanel();
  });
}
if (activeFilterNoticeEl) {
  activeFilterNoticeEl.addEventListener("click", () => {
    clearLayerViewFilter();
    focusPanel(2);
  });
}
if (layerSelectionListEl) {
  layerSelectionListEl.addEventListener("click", event => {
    const row = event.target.closest && event.target.closest(".layer-selection-row");
    if (!row) return;
    updateLayerSelectionFromPanel(Number(row.dataset.layerIndex || 0), !!event.shiftKey);
  });
}
if (layerSelectionModalEl) {
  layerSelectionModalEl.addEventListener("click", event => {
    const action = event.target.closest && event.target.closest("[data-layer-selection-action]");
    if (!action) return;
    runLayerSelectionAction(action.dataset.layerSelectionAction);
  });
}
document.addEventListener("mousedown", event => {
  if (compSelectEl && !compSelectEl.contains(event.target)) closeCompSelect();
  if (settingsMenuEl && settingsMenuEl.classList.contains("open") && !settingsMenuEl.contains(event.target) && !(settingsBtnEl && settingsBtnEl.contains(event.target))) closeSettingsMenu();
  if (!layerMenuEl || !layerMenuEl.classList.contains("open")) return;
  if (Date.now() - layerMenuOpenedAt < 320) return;
  if (event.button === 2) return;
  if (event.target.closest && event.target.closest("#layerMenu")) return;
  hideLayerMenu();
}, true);

document.addEventListener("contextmenu", event => {
  if (!layerMenuEl || !layerMenuEl.classList.contains("open")) return;
  if (Date.now() - layerMenuOpenedAt < 320) return;
  if (event.target.closest && (event.target.closest("#layerMenu") || event.target.closest(".clip") || event.target.closest("#scrollArea"))) return;
  hideLayerMenu();
}, true);

if (durationBtnEl) durationBtnEl.addEventListener("click", promptCompDuration);
if (compSelectEl) {
  compSelectEl.addEventListener("mousedown", e => e.stopPropagation(), true);
}
if (compSelectButtonEl) {
  compSelectButtonEl.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    if (!compSelectUpdating) toggleCompSelect();
  });
}
if (compSelectSearchEl) {
  compSelectSearchEl.addEventListener("click", e => {
    e.stopPropagation();
    if (!compSelectEl.classList.contains("open") && !compSelectSearchEl.disabled) openCompSelect();
  });
  compSelectSearchEl.addEventListener("input", () => {
    filterCompSelectItems();
    if (!compSelectEl.classList.contains("open")) openCompSelect();
  });
  compSelectSearchEl.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeCompSelect();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const first = filterCompSelectItems();
      if (first) {
        closeCompSelect();
        selectCompFromHeader(first.dataset.compId);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const first = filterCompSelectItems();
      if (first) first.focus();
    }
  });
}
if (durationCancelEl) durationCancelEl.addEventListener("click", hideDurationDialog);
if (durationApplyEl) durationApplyEl.addEventListener("click", applyCompDurationFromDialog);
if (durationModalEl) durationModalEl.addEventListener("mousedown", e => { if (e.target === durationModalEl) hideDurationDialog(); });
if (durationInputEl) durationInputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") { e.preventDefault(); applyCompDurationFromDialog(); }
  if (e.key === "Escape") { e.preventDefault(); hideDurationDialog(); }
});
if (expressionCancelEl) expressionCancelEl.addEventListener("click", hideExpressionDialog);
if (expressionApplyEl) expressionApplyEl.addEventListener("click", () => applyExpressionDialog(false));
if (expressionDisableEl) expressionDisableEl.addEventListener("click", () => applyExpressionDialog(true));
if (expressionModalEl) expressionModalEl.addEventListener("mousedown", e => { if (e.target === expressionModalEl) hideExpressionDialog(); });
if (expressionInputEl) expressionInputEl.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); hideExpressionDialog(); }
  if (e.ctrlKey && !e.metaKey && e.key === "Enter") { e.preventDefault(); applyExpressionDialog(false); }
});
if (anchorGridEl) anchorGridEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-cell");
  if (!btn) return;
  applyAnchorPoint(btn.dataset.point);
});
if (anchorAlignGridEl) anchorAlignGridEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-align-btn");
  if (!btn) return;
  alignSelectedLayersFromAnchorPanel(btn.dataset.align);
});
if (anchorModalEl) anchorModalEl.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest(".anchor-distribute-grid .anchor-align-btn");
  if (!btn) return;
  alignSelectedLayersFromAnchorPanel(btn.dataset.align);
});
if (anchorModalEl) anchorModalEl.addEventListener("mousedown", e => { if (e.target === anchorModalEl) hideAnchorDialog(); });
if (anchorModalEl) anchorModalEl.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); hideAnchorDialog(); }
});
if (flowChartCloseEl) flowChartCloseEl.addEventListener("click", closeFlowChart);
if (flowChartOverlayEl) flowChartOverlayEl.addEventListener("mousedown", event => {
  if (event.target === flowChartOverlayEl) closeFlowChart();
});
scrollAreaEl.addEventListener("scroll", syncBottomRulerPosition);
if (horizontalScrollBarEl) horizontalScrollBarEl.addEventListener("mousedown", beginHorizontalScrollDrag);
window.addEventListener("resize", () => { if (!userZoomed) render(); updateHorizontalScrollBar(); });
if (keyframeModeBtnEl) keyframeModeBtnEl.addEventListener("click", toggleTimelineMode);
registerPanelKeyEventsInterest();
if (!QUICK_PANEL_MODE) {
  cs.addEventListener("com.tnt.timeline.nativeSelection", handleNativeSelectionSync);
}
renderPlatformBadge();
setupFilterTooltips();
updateModeButton();

if (QUICK_PANEL_MODE) {
  document.title = "TNT Quick Controls";
  document.documentElement.classList.add("quick-panel-mode");
  document.body.classList.add("quick-panel-mode");
  refreshQuickPanelState();
  } else {
  // Initial read, then a lightweight focused/hovered fingerprint watch.
  // Full timeline refresh still only happens when the host fingerprint changes.
  refreshLayers({ forceRender: true, skipSettledRefresh: true }).then(() => {
    startSyncLoop();
    startBackgroundEditWatch();
    startNativeSelectionMonitor();
  });
}
