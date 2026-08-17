# UI Design Guide

This panel is an After Effects working surface, not a marketing interface. UI should stay compact, direct, and predictable under repeated use.

## Core Principles

- Prioritize speed and scanability over decoration.
- Keep controls close to the thing they affect.
- Use the same visual language as After Effects where possible.
- Use a neutral graphite Apple-style finish across the whole panel.
- Prefer compact tool surfaces over large explanatory layouts.
- Avoid controls that imply AE properties that do not actually exist.
- Keep labels short and literal.
- Preserve user focus inside the CEP panel unless an AE command truly requires native focus.

## Layout

- Use fixed or bounded component sizes for timeline tools, cards, nodes, rows, and buttons.
- Avoid stretching a small amount of content across a large panel.
- Use responsive wrapping only when it improves density without making controls feel oversized.
- Use Apple-style proportional corner rounding consistently across controls and panels.
- Use shared radius tokens instead of one-off corner sizes.
- Derive core control height and corner radius from the timeline layer shape height.
- Treat the timeline layer shape as the base unit: layer clips should use about 18% of that height for radius, compact controls about 24%, nodes/cards about 32%, and glass dialogs about 55%.
- Use explicit radius tokens for CEP CSS instead of `calc()` multiplication, because older CEP Chromium builds may ignore modern ratio math.
- Keep timeline layer corners tighter than subpanel corners; avoid oversized pill corners unless the control is intentionally a pill.
- Keep repeated controls uniform in height and spacing.
- Utility popovers should stay compact. Graphic controls may be slightly larger than icon buttons, but they should still inherit the panel size scale instead of jumping to oversized presentation controls.
- Do not put cards inside cards.
- Section backgrounds should be flat panels or full-width bands, not decorative floating cards.
- Make horizontal/vertical scrolling intentional and visible.
- Use soft depth: one clear surface, one subtle border, one shadow. Avoid stacking multiple loud effects.
- Main workspace chrome should be understated so layer color and timeline state remain readable.

## Subpanels And Menus

- Use a simple Apple-style glass surface for command menus, pickers, and temporary subpanels.
- Prefer semi-transparent charcoal panels with blur/saturation over solid black panels.
- Floating quick-control surfaces should avoid a second internal title bar. In CEP modeless windows, fill the entire client region because the host-owned window background cannot be made transparently visible around an inset HTML shell. Keep context and utility controls floating inside the surface padding. True frameless rounded windows require a native plug-in or helper application.
- Keep menu selection neutral gray, not blue.
- Use blue sparingly for timeline-specific active state, playhead, or clear edit focus, not command-list hover/selection.
- Use soft borders, subtle inset highlights, and shadow for depth.
- Keep source badges neutral gray unless color is essential to comprehension.
- The backdrop may dim the timeline, but it must not blur the whole workspace.
- Blur belongs only to the glass panel surface, so only content visually underneath the panel/shape is softened.
- Avoid colorful rows in command menus unless the command itself is a destructive warning.
- Search fields should read as soft pills when they are the primary entry point.
- Use generous internal padding in glass panels; do not crowd content against rounded edges.
- Keep subpanel padding optically even on all sides. If a bottom row such as a checkbox or actions area is present, reduce excess bottom space rather than letting the panel sag.
- When two related utility groups should read as separate tools, use two adjacent floating panels without an additional visible parent container.
- A subtle top sheen or very restrained reflected tint is acceptable on glass surfaces. Decorative gradients can be used occasionally in subpanels, but not as the main workspace background.
- Use pill chips for lightweight categories or status, with gray fill by default.
- Header metadata should be inline chips beside the title, not subtitle rows, when it describes selection scope.
- Selection chips should stay compact: show the primary count first, then add property/layer scope only when that scope is 2 or more.
- Let important text be bright and secondary metadata be soft gray; avoid over-labeling every row.
- Prefer Esc and click-outside dismissal over visible close buttons on lightweight subpanels.
- Avoid browser-native alerts/confirms inside the CEP panel. They steal flow, look off-brand, and fight panel shortcuts.
- If a destructive action is already undoable through AE, run it directly and rely on the panel's Ctrl+Z native-history proxy instead of showing a modal confirmation.
- Subpanel headers use one fixed height. Header action buttons must be vertically centered inside that height, and the divider line must sit exactly at the header bottom.
- Every subpanel should use the same header/content rhythm: fixed header, divider, then a measured content gap before chips, rows, graphs, or nodes. Do not let old panel-specific padding push the divider visually lower than the header.
- If a side column has leftover vertical space, split it into stacked boxes with real secondary actions instead of stretching one small control group to fill the whole height.

## Nodes

Nodes are for grouped editable objects: masks, styles, effects, or property groups.

- Header: object name on the left, status/type on the right.
- Body: only real editable properties.
- Disabled/inactive state: dim the node, but keep text readable.
- Selected/active state: brighten border or use an inset highlight.
- Avoid adding fake convenience properties if AE does not expose them.
- If a node has linked dimensions, show a chain toggle in the property group header.
- Off/hidden nodes should remain visible when the underlying AE group still exists.
- Delete and hide/off are different states. Delete must remove the AE group; hide/off must only disable it.
- Navigation from a chip/menu to a node should scroll the row and flash the target even when the target is already visible.
- For AE layer styles, detect real nodes by scanning indexed children of `ADBE Layer Styles`. Do not treat direct match-name lookup as existence, because AE can return virtual style properties after the visible group has been removed.
- Off/hidden style nodes should remain visible when the panel action created that off state, such as toggle-off or Hide All.
- Do not promote random disabled AE layer-style accessors into visible nodes on refresh; they may be removed virtual ghosts.

## Controls

- Use dropdowns for finite AE enums, such as mask mode.
- Use checkboxes/toggles only for actual booleans.
- Use sliders plus numeric inputs for numeric values that users scrub often.
- Use numeric inputs alone only when scrubbing is not useful.
- Use icon buttons for repeated tool actions when the icon is familiar.
- Every icon-only button needs a tooltip or `title`.
- Compact utility boxes may use icon-over-label buttons when commands need to stay discoverable, such as ease helpers. Keep them small, centered, and tooltip-backed.
- Keep simple/direct actions with presets when they affect the current value shape. Reserve side utility boxes for more complex commands such as expressions, generated controls, or secondary workflows.
- Curve presets belong directly under the graph in the same column, not as a full-dialog footer. They are part of the graph editing tool, while side boxes are for utilities.
- Curve preset buttons should use the same graph-over-text rhythm as utility buttons, and their mini graph must visually match the actual preset curve closely enough to be predictive.
- Destructive actions need clear labels and should respect confirmation settings.
- Standard compact buttons should use one shared height.
- Icon buttons should use one shared square size.
- Inputs, selects, and sliders should align to the same row height within a panel.
- Center controls from container geometry, not text baselines. Use flex/grid `align-items: center` and `justify-content: center`; do not use `line-height` equal to the control height as a vertical-centering shortcut.
- Icon geometry must be mathematically centered inside its fixed square. For simple plus, minus, close, and chevron icons, use centered SVG/CSS geometry instead of font glyphs whose ascender and descender metrics commonly make them appear low.
- Check optical vertical alignment against both the top and bottom edge before finishing. A control that consistently sits below center is a failed state even when its CSS line box is technically centered.
- Timeline row geometry has one source of truth. Track row, frozen track label, layer bar, and property lane must derive their center from the same row-height variables; never adjust one of them with an independent pixel nudge.
- When borders or shadows make a mathematically centered timeline bar look low, use one shared optical-offset variable for all layer bars. Do not change individual modes or rows separately.
- Context-summary type chips should be actionable when they represent a useful subset. Apply the existing selection-scoped focus/filter system and expose the action in a tooltip instead of creating decorative detection badges.
- Context menus use proportional project radii: restrained outer panels, smaller node corners, and compact rectangular command/filter buttons. Reserve fully pill-shaped corners for toggles and status capsules.
- Range slider thumbs must be optically centered on their track. Reset native range appearance in CEP CSS and set thumb margin from the actual track/thumb sizes instead of eyeballing it.
- Toggles should be compact, vertically centered, pill-rounded to the maximum, and animated.
- Use green for toggle-on state in property panels.
- Tool sliders use one consistent accent treatment: a `2px` dark graphite base rail, orange filled rail, and `12px` orange circular thumb. Keep these dimensions identical across Style, Mask, Ease, and future property panels, with the thumb optically centered.
- Page/section scrollbars should stay thin and neutral gray; do not reuse the main accent color for scrollbars.
- Numeric spinner controls should be avoided when they make the layout feel louder than the property label.
- Buttons should have four clear visual states: off, off hover, on, and on hover.
- Hover animation should scale up from the center while preserving the button's color identity. Use subtle brightening or shadow lift for emphasis; never shrink, slide, or scale from a side.
- Active/on buttons should keep their assigned accent color on hover, only lightly brightened.
- Added/on style buttons must keep their assigned style color in both rest and hover states; hover should never fall back to the neutral/off styling.
- Mode switches should display the current mode, not the next action. Use color or an icon accent to make the active mode obvious.
- Timeline mode colors are fixed: Edit is orange, Keyframes is deep purple.
- Right-click/context menu rows are command rows, not cards. Keep the glass on the outer menu, use transparent rows with a soft gray hover wash, and reserve separate label/detail columns so text cannot overlap.

## Linked Values

Use linked-value UI for paired or multi-axis properties where AE stores an array and users commonly edit dimensions together.

- Show linked values as one grouped property, not separate unrelated rows.
- Use a chain toggle to switch linked/unlinked.
- When linked, editing one axis mirrors the others before sending the value to AE.
- When unlinked, axes remain independent.
- Start linked only when axis values are equal.
- Start unlinked when axis values differ.

Good examples:

- Mask Feather X/Y
- Scale X/Y if exposed in a future transform editor
- Shape Size X/Y if exposed in a future shape editor

Bad examples:

- Opacity
- Expansion
- Angle
- Distance
- Any single-value property

## Color

- Keep the base UI neutral and dark.
- Use AE label colors for layer identity.
- Timeline layers should keep AE label color as identity, but render through a darker translucent surface so they fit the graphite/glass UI.
- Use gray for menu selection and temporary subpanel active rows.
- Use blue only for timeline-specific active state, playhead, or explicit edit focus.
- Use amber only for warnings or mixed/partial states.
- Use red only for destructive actions or errors.
- When a surface feels too bulgy, adjust the gradient map first. Preserve existing shadows, borders, hover behavior, and shape details unless those are the actual problem.
- Avoid one-note palettes dominated by a single hue.
- Do not use decorative gradient blobs or abstract background effects.
- Avoid purple gradients and background grids in the main timeline workspace.
- The main accent should be a restrained Claude-style orange. Keep cyan reserved for track matte links and green reserved for parent links.
- Relationship colors are reserved: cyan for track matte, green for parent.

## Typography

- Use small, dense labels in panels and nodes.
- Use the editorial serif header stack `"Ivory LL Web", "IvoryLLWeb-Light", "Iowan Old Style", Baskerville, Georgia, serif` for panel and dialog headers. Ivory may only be bundled when properly licensed; `Iowan Old Style` is the built-in macOS fallback.
- Editorial serif headers need slightly more size than equivalent sans-serif labels because their light strokes have less visual mass. Use about `16px` for standard headers and `17px` for primary tool-panel titles.
- Keep body text and working controls in the system sans-serif stack. The serif is for hierarchy, not property labels, values, menus, or dense timeline rows.
- Use uppercase labels only for compact property names or status text.
- Keep letter spacing at `0`.
- Do not scale type with viewport width.
- Ensure long layer/property names truncate with ellipsis instead of wrapping into controls.

## Interaction

- Controls should respond immediately in the UI before or while AE updates.
- Long sync operations should not block local control feedback.
- Sliders should update while dragging, with host calls throttled/coalesced.
- Clicking a node should select the corresponding AE object when that mapping exists.
- Inputs inside a node must not trigger node selection by accident.
- Escape should close the current subpanel/dialog first.
- Add/remove operations in node rows should animate enough to explain the layout change: existing nodes make room, the new node scales in, and focused nodes flash briefly.
- Middle-click and right-click shortcuts may be used for navigation helpers when left-click already performs the primary command.
- Panel-owned shortcuts must be registered through CEP key-event interest and consumed at capture time across `keydown`, `keypress`, and `keyup`. Do not let AE native timeline shortcuts receive the same key after the panel action runs.
- Keyframe selection must clear locally as soon as the user clicks a property row or empty keyframe track. Do not wait for host sync; update the CEP selection state immediately, then send the AE clear/select command.
- An interaction that begins on a selected editable object must preserve that selection through drag and pointer release. Moving a keyframe, node, handle, or similar object is not a click-away action.
- Tiny timeline symbols should keep their visual size but use a slightly larger centered invisible hit target. The clickable area must follow the symbol during drag and should not alter marquee geometry or timeline density.
- Filter subpanels must separate **Filter View** from **Filter Selection**. View filters stay synchronized with the timeline rail and change what the timeline displays; selection filters alter the native AE selection without changing timeline visibility.
- Selection filters are scope-based: **Current Selection** narrows an existing broad native selection, **At Playhead** targets layers whose in/out interval contains the current composition time, and **All Layers** targets the whole composition.
- Show only selection-filter commands relevant to the active scope. Type buttons are immediate commands such as `Keep Text` for Current Selection and `Select Text` for At Playhead/All Layers; include the matching layer count so the result is predictable before clicking.
- Utility panels may include future commands for spatial planning, but unfinished commands must be visually quieter, italicized, and non-interactive. Never style a roadmap item like a working button.
- Multi-layer editors must name one explicit source layer and show the remaining target count. Transfer commands must run as one host undo group, preserve the user's layer selection, and disable themselves when the required source data is missing.
- Frequently paired multi-layer operations may share one launcher while remaining two adjacent floating panels. Timing and layer-stack order are a good pair: keep stagger/sequence controls in one panel and stack movement/sorting in the other, with independent surfaces and shared selection metadata.
- Multi-layer stack movement must preserve the selected block's internal order for ordinary Top, Up, Down, and Bottom commands. Reverse only when the user invokes an explicit Reverse command.
- Context menus for selected keyframes must show selection scope before commands: total keyframes, property count when greater than one, layer count when greater than one, and concise property-name chips.
- Layer selection surfaces should support immediate native selection, visible selected counts, Shift-range selection, and bulk clear/invert/select-filtered actions without duplicating ordinary property controls.
- Clear or replace selection only when a new pointer press begins on another selectable target or on an explicitly empty area. Never let the synthetic click or mouseup after a drag trigger deselection.
- Property inspection should be transient and spatially anchored. Holding Command on macOS or Control on Windows while hovering a property track may show its sampled value at the pointer time; the follower must disappear on modifier release or track exit and must not trigger a full timeline refresh.
- Modified clicks directly on keyframes may open a compact value editor beneath the key. Scalar values use one slider/input row; vector values expose explicit X/Y/Z rows. Slider feedback is immediate, but host commits happen on release/change so one gesture remains one undoable edit.
- When a host edit can renumber or recreate selected objects, return their resolved identities from the host command, restore native selection, and preserve the same local selection through the immediate refresh.
- Clicking the time ruler or middle-clicking the timeline during panel playback must stop playback without committing the stale playback position, then seek/scrub directly to the pointer time.
- Any primary or middle pointer press inside the CEP timeline must stop panel playback at capture time, before layer, keyframe, property, ruler, or marquee handlers can return early. Invalidate queued playback frames when stopping so an older host-time write cannot restart visible movement after the click.
- Keep the CEP playhead animation on `requestAnimationFrame`, independent from host scripting latency. Coalesce host time writes to the newest frame and adapt their interval to the measured ExtendScript round trip; never drain pending playback writes in a tight loop because that saturates CEP's serialized bridge and makes playback, input, and panel rendering stutter.
- Do not launch After Effects' native `Play Current Preview` from CEP for panel-controlled playback. Native preview blocks AE's ExtendScript service loop, so subsequent Space and pointer stop requests cannot execute until preview has already ended through native input.
- Playback controls must update their state synchronously. Keep the CEP playhead on `requestAnimationFrame`; send only coalesced, rate-limited `CompItem.time` seeks to AE, and never await a host transition before changing `isPlaying`. Left, middle, and right pointer presses in the timeline must all route through the same immediate stop transition.
- Discrete host mutations should refresh the CEP immediately after the host call succeeds, followed by one debounced full verification refresh after AE settles. Centralize this on forced action refreshes so split, trim, duplicate, delete, layer creation, timing, styles, masks, markers, and mass edits converge quickly without waiting for the background poll. Do not attach verification refreshes to live slider input events; refresh on commit instead.
- Never run recurring idle `evalScript` polling from CEP. Even lightweight host reads can flash After Effects' busy cursor across native panels and make the mouse feel unusable. Synchronize on CEP activation/pointer return and after explicit panel actions; remain completely host-idle while the panel is open but untouched.
- Native Timeline and Composition selections should stay live in CEP through a host-side change watcher that dispatches compact CSXS events. Do not recreate this with recurring CEP `evalScript` polling. Keep the panel synchronized and undimmed while an active composition context is available.
- Native selection events are selection-only. Never compare project revision or traverse rendered keyframes in their immediate repaint path; project revision can change during selection on some AE versions and accidentally trigger a multi-second full refresh.
- Structural edit-mode actions should repaint from a lightweight layer snapshot containing indices, names, timing, selection, labels, and relationships. Do not block split, duplicate, delete, layer creation, endpoint, stack, or layer-timing feedback on the full property/keyframe traversal; preserve known detailed data by stable layer ID and let the debounced verification snapshot fill in new or changed details.
- Curve editors should use a bounded graph ratio instead of a wide banner. Prefer 5:4 when the user needs vertical handle range without making the panel too tall.
- The ease graph must never invoke expression utilities. Graph handles edit keyframe easing/value-graph behavior only; expression-based Overshoot and Wiggle stay behind their explicit utility buttons.
- Linked spatial properties such as Position need spatial tangents as well as temporal ease. When the graph creates overshoot on spatial properties, update `setSpatialTangentsAtKey()` so the motion path reflects the graph instead of only changing speed feel.
- Ease graph handles should stay inside the graph bounds during normal drags. Holding Shift unlocks out-of-bounds dragging for overshoot shapes, so regular easing stays predictable and overshoot remains intentional.
- Influence handles should not require edge-to-edge travel for 100%. Map the full influence range to a shorter reach inside the graph so fine control is comfortable.
- Curve editors that allow out-of-bounds handles need camera zoom controls on the graph frame. Show the current percentage, provide compact zoom-out/zoom-in buttons, and make the percentage reset to `100%` so escaped handles can always be recovered.
- During Shift-drag overshoot editing, the graph may auto-zoom outward only when the visible handle circle touches the viewport edge. Do not use a pre-emptive padding zone. Auto-zoom in `1%` steps and allow only one step per edge crossing; the handle must move back inside before auto-zoom can trigger again. Never auto-zoom inward during the drag, and preserve the resulting zoom for predictable recovery.

## Shortcut Interception

Every panel-owned shortcut must remain inside CEP. A shortcut is incomplete if it runs correctly but also deselects the panel, focuses an AE panel, or triggers AE's native command.

When adding a shortcut:

1. Add it to the permanent `SHORTCUT_ACTIONS` registry. Do not create isolated feature-level `keydown` handlers.
2. Register exactly one OS-native virtual keycode per shortcut with `registerKeyEventsInterest`: Windows/Linux virtual keycode on Windows, macOS virtual keycode on macOS. Do not mix Windows, macOS, and ASCII control-character codes in one platform payload; CEP can reject or misroute the whole interest set without a useful error.
3. Use Control for panel-owned modified shortcuts on every platform, including macOS. Every registration object must include explicit true/false values for `ctrlKey`, `altKey`, `shiftKey`, and `metaKey`; broad plain-key interests must not accidentally swallow Command variants. Do not register `metaKey` application commands.
4. Normalize `event.key`, `event.code`, and platform `keyCode` before resolving the shortcut. Never rely on only one representation.
5. Consume the event during capture on both `window` and `document`. Call `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()` when available.
6. Consume `keydown`, `keypress`, and the matching `keyup`. Track suppression by normalized shortcut so duplicate window/document events do not run the command twice.
7. Put high-risk native shortcuts such as Undo, Save, Duplicate, and Select All through the early critical interceptor before the general resolver.
8. Restore panel focus and active sync state before invoking the command. The host function itself must not require switching to the native Timeline panel.
9. Preserve explicit editable-field exceptions. Modified application commands may run in inputs only when intentionally allowed; ordinary letter shortcuts must not.
10. Undo is a latency-critical native-history action. Execute exactly one stable AE Undo command per accepted Ctrl+Z press, verify that the project revision changed, and return the lightweight timeline structure in that same host response.
11. Repaint undo results immediately from the returned lightweight structure, then run one debounced full verification refresh. Do not add a fixed post-undo wait, a second structure round trip, or repeated long-running focus retries.
12. Preserve undo request order when presses are queued. Coalesce repaint work after the queue drains, but never merge or skip accepted native history steps.
10. Reload the CEP extension after changing key-event interest, then test the shortcut on macOS and Windows behavior paths.

On macOS, Command shortcuts are host-level gestures and are not panel aliases. Panel UI and tooltips must show Control explicitly. Critical Control shortcuts must latch their normalized command on the first intercepted `keydown`, consume later events by raw base key for the lifetime of that gesture, and clear the latch only after key release.

Key-release handling must clear duplicate suppression without starting a new suppression timer. A completed Control+Z gesture must never swallow the next physical Control+Z press, even when the user undoes rapidly.

Rapid Undo presses must enqueue native Undo commands without placing a full timeline read or render between them. Drain the host undo queue first, then debounce one panel refresh after the burst. Host reads do not add history, but interleaving them makes Undo feel delayed and can obscure which action was reverted.

Never assign plain `Z` to a panel action. CEP may match a registered unmodified key before modifier discrimination, which can swallow both native Command+Z and panel Control+Z. Reserve the Z key family for undo and place unrelated navigation on another gesture.

When changing the key-interest set, first call `registerKeyEventsInterest("")` to remove stale host registrations, then install the complete replacement payload. Cache the installed JSON locally so focus events do not repeatedly clear and rebuild the same interests.

An undo bridge must verify that the host history changed. `app.executeCommand()` returning without throwing does not prove that Undo ran; compare the project revision before and after and surface a failure when AE reports no undoable entry. In After Effects, use stable native command ID `16` for Undo. Do not trust `app.findMenuCommandId("Undo")`; AE 2026 can return `2371`, which executes without throwing but does not undo.

For responsive undo, return the lightweight structural timeline snapshot in the same host call as the verified native undo. Repaint from that result immediately and schedule the detailed full snapshot afterward. Do not add a fixed pre-refresh delay or excessive focus retries around Ctrl+Z; both make a completed undo feel slower without improving host correctness.

Keep the CEP extension bundle ID stable across product and code renames. The ID is AE's persistent installed-panel identity, not visible branding; changing it can leave the old panel process running beside a differently registered manifest and make reloads appear to ignore new JavaScript.

Selection-only host calls must never open an AE undo group. Layer, property, mask, and keyframe selection are navigation state, not edits; adding them to undo history forces users to press Undo repeatedly before reaching the actual operation.

Ctrl+Z is a proxy for After Effects' global Edit > Undo history, not a CEP-only history. It must undo exactly one native AE history entry whether that entry came from this extension or any native panel. Panel-specific snapshot restore actions may exist as explicit buttons, but must never replace the primary Undo shortcut.

Shortcut verification must confirm all four outcomes:

- The panel command runs exactly once.
- The CEP panel remains focused.
- AE's native shortcut does not also run.
- Key release does not trigger a second action or delayed focus change.

Context-menu shortcuts are local modes. When a right-click menu is open, its plain-letter shortcuts take priority over global panel shortcuts, must be consumed before the general resolver, and execute only on the first `keydown`. Follow-up `keypress` and `keyup` events are consumed without repeating the action. The menu closes after execution and returns focus to CEP.

## Panel Focus

- Avoid commands that switch focus to native AE panels unless necessary.
- Do not sync aggressively when the panel is inactive.
- On panel reactivation, run one debounced constant-cost state check using comp identity, project revision, time, and selection. Do not traverse markers, properties, or keyframes unless a real project change requires refresh.
- Internal subpanels, dropdowns, and dialogs should not be interrupted by background unsync overlays.
- If sync is paused, show passive status UI without blocking clicks.

## Copy

- Use direct labels: `Mode`, `Inverted`, `Opacity`, `Feather`, `Expansion`.
- Avoid explanatory text inside the main working UI.
- Put usage explanations in docs, tooltips, or guides.
- Error messages should say what failed and what action was attempted.

## Adding New UI

Before adding a new control:

1. Confirm the AE property or command actually exists.
2. Match the control type to the property type.
3. Check whether the value is single, enum, boolean, paired, or color.
4. Add immediate UI feedback.
5. Make host failure revert or clearly report the failed change.
6. Keep styling consistent with existing node/control patterns.
7. Add or update docs when introducing a reusable pattern.

### Compact utility panels

- Secondary utility panels should use the same compact density as the timeline: approximately 40-44px headers, 22-28px controls, and 8-12px internal padding.
- Do not let a two-function utility panel approach the size of the Style or Ease editors unless its content genuinely needs that workspace.
- Every icon-only, abbreviated, or workflow-specific control must use the shared multiline panel tooltip, with the action name on the first line and the behavior on the next line.
- Features that depend on selection order must track the last explicit CEP selection separately; AE may return selected layers in stack order rather than click order.
- Reordering must move selected layers only. Preserve unselected layer relative order and return updated lightweight structure in the same host response to avoid a second reload.
- Configuration controls belong above execution controls. Direction choices that immediately perform an operation should be presented as final action buttons at the bottom, not as passive segmented state.
- When a workflow uses the last selected layer as a target, preserve that layer by stable identity after reordering and return its new index to the panel. Never let a stack-index change silently retarget the next operation.
- Multi-selection needs a visible anchor. Keep the normal selection stroke on every selected layer, and use a restrained gold stroke only on the most recently selected layer.
- Clicking an already selected layer inside a multi-selection must preserve the group and promote that layer to the last-selected anchor. Collapse to one layer only when the user clicks outside the current selection.
- Do not hide a meaningful ordering rule inside an action label. Expose timing basis and stack-distance sorting as explicit modes so users can predict the result before executing Bottom Up or Top Down.
- Target-relative ordering must distinguish measurement, proximity, and placement: `In/Out/Distance` chooses what is measured, `Closest/Farthest` chooses which end touches the pivot, and `Bottom Up/Top Down` chooses the side of the pivot.
- Keep absolute stack commands separate from target-relative sorting. `Send to Top` and `Send to Bottom` act on the selection as an ordered group and must not require a last-selected target.
- Property-wrangling tools must mark generated expressions and remove only their own marker. Never let a bulk unlink command erase unrelated user expressions.
