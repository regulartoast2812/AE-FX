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
  confirmDanger: true,
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
  if (isDangerousCommand(command) && panelSettings.confirmDanger && !window.confirm(`${command.name || "This command"} can remove or overwrite data. Continue?`)) return;
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

// Confirms are for commands whose blast radius is wider than the current
// selection, or that are awkward to undo. Matching on the name (delete/remove/
// purge/clear) prompted just as loudly for "remove one marker on the selected
// layer" as for "purge the project", which trained the prompt into noise. Every
// genuinely destructive command is named explicitly below, so the name test was
// only ever catching selection-scoped, single-undo edits.
function isDangerousCommand(command) {
  const fn = String(command && command.tntFunction || "");
  return [
      "deleteAllKeyframes",
      "deleteAllEffects",
      "deleteAllExpressions",
      "deleteAllCompMarkers",
      "deleteAllLayerMarkers",
      "deleteAllMarkersEverywhere",
      "deleteUnnamedMarkers",
      "removeAllLayerStyles",
      "removeInOutMarkers",
      "clearLayerMarkerNumbers",
      "clearExpressions",
      "fullPurge"
    ].indexOf(fn) >= 0;
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
