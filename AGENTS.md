# Codex Project Guide

This guide keeps future work compact and consistent for the `AE FX` CEP project.

## Token Discipline

- Use `rg` and targeted file reads before opening whole files.
- Prefer reading the smallest relevant function, CSS block, or JSX handler.
- Start with a one-pass location scan, then patch. Avoid repeatedly rediscovering the same selectors/functions in one turn.
- Parallelize independent reads with `multi_tool_use.parallel`, especially `rg`, `sed`, `nl`, and status/verification commands.
- Do not use broad `git diff` in this deployed CEP folder unless a `.git` directory exists; this workspace is often not a git repo.
- Use line-numbered targeted reads after edits instead of dumping entire files.
- For CSS work, edit the smallest owning file in `src/css/`. Append a final versioned override block only when historical overrides are tangled, then document the reusable rule.
- For JS work, patch the smallest owning function and use existing command routing/helpers before adding new host APIs.
- For JSX/AE scripting work, check the local scripting guide with targeted `rg` before guessing AE match names or API behavior.
- Do not repeat old conversation history unless it directly affects the current fix.
- Make scoped patches. Avoid broad rewrites unless the user explicitly asks for a revamp.
- Final responses should say what changed, where, and what checks passed.
- Keep progress updates short and only explain the immediate engineering move.

## Fast Path

- UI-only request: locate selectors, patch CSS, update `docs/ui-design-guide.md` if it creates a pattern, skip compile unless JS/JSX changed.
- Interaction request: locate the owning file under `src/js/`, patch it, then run `scripts/check.sh js`.
- AE behavior request: locate CEP caller and JSX host function, patch both only if needed, then run both `osacompile` checks.
- Regression request: inspect the last owning function/CSS block first, then compare against `Ref/` only if current code cannot explain the bug.
- If a requested external helper such as `dflash` is unavailable, say so once and continue with available fast tools.
- Use `scripts/find.sh <pattern>` for project-scoped search that skips bulky references by default.
- Use `scripts/check.sh build`, `scripts/check.sh js`, `scripts/check.sh jsx`, or `scripts/check.sh all` for the standard build/compile checks.
- Use `scripts/audit-tools.sh` when reassessing local tooling instead of manually probing PATH one tool at a time.

## Project Boundaries

- Work in the current CEP extension.
- Treat the legacy reference folder under `Ref/` as read-only. Never edit it.
- If reference behavior is needed, read/copy the relevant logic into the current CEP.
- Preserve user changes and do not revert unrelated work.
- Use `apply_patch` for manual file edits.
- Treat `js/main.js` and `css/style.css` as generated runtime bundles. Do not edit them directly.
- Edit JavaScript in `src/js/` and CSS in `src/css/`, preserving the order declared in `scripts/build.sh`.
- See `docs/code-structure.md` for feature ownership.

## Verification

- After JS edits, run `scripts/check.sh js`; it rebuilds `js/main.js` before compiling it.
- After JSX edits, run `scripts/check.sh jsx`.
- Before finishing cross-layer changes, run `scripts/check.sh all`.
- For CSS-only changes, no compile check is required, but inspect selectors carefully.
- Run `scripts/build.sh` after CSS-only changes so CEP receives the generated bundle.
- When a dev server or browser test is relevant, use the in-app Browser plugin.

## UI Direction

- Overall style: graphite glass, semi-transparent dark surfaces, compact Apple-like proportions.
- Accent: Claude-like orange for edit/primary warm actions; deep purple for keyframe state.
- Avoid loud blue unless it is functionally meaningful.
- Surfaces should feel darker and more transparent, not flat medium gray.
- Corner radius should be proportional to element height, not random.
- Buttons and timeline layer shapes should share consistent height/radius language.
- Hover states have four clear states: off, off hover, on, on hover.
- Hover animation scales from the center and keeps the element's state color.
- Do not blur the whole app behind subpanels. Blur only under the panel shape.
- Page scrollbars/sliders should stay neutral and thin. Property sliders can use functional accents only when intentional.

## Validate before saying a task is done

Every item below has broken this project more than once, and each is cheap to
check. Run the ones the change touches, and report the number, not the
intention.

**1. Moved markup breaks selectors that depended on its position.**
Putting Stagger and Pull inside a new column made them grandchildren, and their
fill was written `.anchor-timing-sections > .timing-order-card` - so they went
transparent over the timeline while Layer Order kept its background.
→ After moving any element, grep the stylesheets for `>` selectors naming the
classes involved, and for `:first-child` / `:last-child` / `+` / `~`.

**2. An override at lower specificity loses silently.**
The header font, Pull's select width and the timing-order padding all failed
this way: the rule was written class-only against a rule carrying `#anchorModal`
or a body class, and simply did nothing.
→ Match the specificity of the rule being overridden. Confirm with
`getComputedStyle`, never by reading the file.

**3. The same thing is declared in more than one place.**
Two `.timing-amount-row` blocks from different passes fought each other; the
earlier one kept the slider on its own line. Two `.layout-panel-name` blocks.
Two action maps. Two command registries.
→ Before adding a rule or a case, `grep -n` for the selector or key. If it
already exists, edit it rather than appending another.

**4. Regex edits to markup break nesting.**
A rewrite of the stagger section left a duplicated status line and a stray
`</div>`, which threw on open.
→ After any structural edit, count `<div|section|header|label>` against their
closers in the affected block and assert it balances.

**5. Verified in the wrong place.**
Three commits were measured in the docked panel for a feature that only exists
in the overlay.
→ `quick.html` for anything in the overlay. `index.html` only for the docked
panel.

**6. Guessing the cause instead of measuring the element.**
The 42px header, the stretch gap, the 700 weight and the box-shadow line each
took several attempts while being edited by assumption, and each was found in
one probe once measured.
→ Probe the element - height, computed style, the specific property - before
changing anything.

**7. Dead code that compiles.**
A `deferReveal` flag nothing ever set; a `renderFxConsole` call for a function
that does not exist.
→ Grep that every new identifier is both assigned and read.

**8. `:has()` is unsupported.**
CEP's Chromium predates it. Six rules were inert inside After Effects while
working in a current browser.
→ Never use it. Set a class in JS.

## Fix every instance, not the one in front of you

This is the single most expensive recurring mistake in this codebase, measured
in round trips. The pattern is always the same: a thing exists in several
places, one of them gets fixed, the bug survives in the others, and it comes
back looking like the fix did not work.

It has happened, at least, with:

- **The window animation.** Four separate show paths each ordered the panel
  front with their own `unhide / activate / makeKeyAndOrderFront`. Fixed one,
  reported fixed, still animated. Three rounds.
- **`closeNativeQuickPanelSurfaces`** - a hand-written list of fifteen `if`
  statements. A new surface not added to it stays open over everything after
  it, which is how TNK covered every other panel.
- **Two identical action maps**, `openSubpanelByKey` and
  `openQuickPanelControl`, ending in the same line. A single-occurrence replace
  patched the first and left the hotkey path dead.
- **Registering a subpanel** needs four edits: the action map, the surface
  list, the Windows hit-rect list, and the teardown list. Three were done.
- **`TNT_restoreParents`** landed inside `TNT_setSelectedAnchorPoint`, because
  two functions ended with the same three lines and the replace matched the
  wrong one.
- **A CSS declaration** kept after its selector prefix was removed, so a rule
  meant for one group of icons silently applied to all of them.

The rule, in order:

1. **Enumerate before editing.** `grep -n` for every occurrence of the call,
   the selector, the pattern. Count them. If there is more than one, fix all
   of them in the same change.
2. **Never rely on a single-occurrence replace** against a pattern that could
   match twice. Slice the target function out first, or match on something
   unique to it.
3. **Prove it afterwards.** Grep again and show zero remaining. "I fixed it"
   is not a result; `grep -c` returning 0 is.
4. **Test where the thing runs.** Three commits were verified in the docked
   panel for a feature that only exists in the overlay. `quick.html`, not
   `index.html`, for anything in the overlay.

Known duplicated registries to check whenever one of them changes:
`FX_CONSOLE_COMMANDS` and `TNT_V3_COMMANDS`; `openSubpanelByKey` and
`openQuickPanelControl`; `closeNativeQuickPanelSurfaces`,
`activeQuickPanelSurface` and `__tntQuickPanelHitRects`; the macOS and Windows
helper hotkey tables.

## The overlay window must never animate or resize on screen

`native-helper` shows an `NSPanel`. Four separate things animate it, and any
one left alone brings the movement back:

1. **`panel.animationBehavior`** defaults to the utility-window behaviour for
   an NSPanel, which scales the window in from its centre. Set to `.none`.
2. **Implicit CoreAnimation** on `alphaValue` and `setFrame`. Every one of
   those is inside `NSAnimationContext.runAnimationGroup` with `duration = 0`
   and `allowsImplicitAnimation = false`.
3. **`NSApp.unhide(nil)`** re-shows the app's windows with an animation. Called
   only when `NSApp.isHidden`.
4. **The resize itself.** The window opens at the launcher size and is resized
   once the page reports its content, and `afterEffectsOverlayFrame` centres
   it - so it grows from the middle outward. Three defences: the reveal is
   always deferred until a size arrives; every surface's settled size is
   remembered in `~/.ae-fx-quick-controls/panel-sizes.json` and reused on open;
   and if a resize does arrive while the window is visible and the size really
   differs, it hides, resizes and shows inside one animation-free block.

There were **four** separate call sites ordering the panel front, each with its
own `unhide / activate / makeKeyAndOrderFront`. They all go through
`presentPanelWithoutAnimation` now. Adding a fifth reintroduces the animation.

The page is not the place to look: every element was scanned and nothing has a
transform transition or a CSS animation except button hovers.

## Shortcut Rules

### Why the tool is split into subpanels

TNK v3 used far more keys than one hand can reach. The panels exist so every
trigger key can sit on the **left side of the keyboard** - reachable without
moving the hand off the mouse. Putting every function in one panel would make
that impossible, because the keys would have to spread across the whole board.

Consequences to respect:

- Shortcuts are **bound to the subpanel**, not global. The same key may mean
  different things in Ease and in Mask. That is the point, not a collision.
- Prefer left-hand keys (Q W E R A S D F Z X C V, 1-5) when adding a binding.
- `Ctrl+Space` is the general entry point for novice or occasional use. It is
  not the fast path; the subpanel keys are.
- Every subpanel should support its own further key controls once open. A
  subpanel that traps the keyboard and offers nothing is the worst case.

### Planned

- **Tab to cycle between subpanels** while one is open. Not built yet.

### The Layout panel

Anchor/Align and Timing/Order are one panel now: anchor, align, distribute,
stagger, layer order, pull/snap. All six act on the same stable selection and
were only separate because they were built separately. Ctrl+O opens it too.

**The whole timing backdrop moves, not just its cards.** All 32 of that
panel's element lookups go through `timingOrderBackdropEl`, so lifting the
layout out of it leaves every one of them querying an empty node. Embedded, it
carries an `embedded` class that turns it from a fixed overlay into a block in
the flow.

Two things that fought the layout, both worth knowing before editing it:

- `.anchor-panel` computes to **flex**, not grid, despite a `display: grid`
  rule earlier in the file. `grid-column` on the embedded backdrop was inert;
  it takes `flex: 1 0 100%` to get its own line.
- The timing layout is a `min(1120px, …)` three-column sheet when standalone.
  At the panel's width that spills out over the anchor row and reads as
  overlap, so embedded it is forced to one column at 100%.

The Filter panel is gone - its dialog, its registry entry, Ctrl+X and
Shift+X. The view-filter helpers in `30-filter-selection.js` stay: the
timeline render depends on `visibleLayers()`.

Still to do: Tab cycling between panels, and the type-aware skip - a tab the
current selection cannot use should not be in the cycle.

### On hold

- (Plain `C` for TNK was removed - see the keyboard tap note above.)


- Panel-owned shortcuts must be consumed inside the CEP panel.
- Prevent shortcuts like `S`, `F`, `Space`, `Cmd/Ctrl+Z`, and `Cmd/Ctrl+S` from leaking focus to native AE panels.
- When adding a shortcut, update the visible command/menu hint if one exists.

## Layer Style Rules

- Added styles stay visible as nodes even when toggled off; off nodes dim instead of disappearing.
- Delete removes the style from AE and from the panel state.
- Delete success means the real indexed style group no longer exists; `enabled === false` only means hidden/off.
- Hide/toggle-off must not delete or remove the node.
- Detect real AE layer styles by scanning indexed children of `ADBE Layer Styles`, not by direct match-name lookup.
- Style option chips remain in one horizontal row. Added styles are highlighted.
- Right-clicking an added style chip navigates to its node and highlights it.

## Timeline Rules

- Timeline rows, clips, labels, and property rows should align vertically to their lane center.
- Relationship dots/lines for parent and matte should be visually quiet but readable.
- Filters should be color-coded by group and have multiline tooltips.
- Time display must not overlap the filter column.
