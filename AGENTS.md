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

### On hold

- **Plain `C` opens TNK** - built and shipped, but inert until the helper is
  granted Accessibility. `CGEvent.tapCreate` returns nil without it, silently.
  The grant is bound to the code signature, so **every rebuild of the helper
  drops it** and it has to be re-granted (remove and re-add the app in System
  Settings > Privacy & Security > Accessibility; a stale entry matches the old
  signature and will not take). The same grant covers control-right-click.
  `Ctrl+D` needs none of this - Carbon hotkeys are not gated.
  Permanent fix, if it becomes tiresome: sign with a stable identity instead of
  the ad-hoc signature `scripts/build-native-helper.sh` uses now.
  Check state after any rebuild: `cat ~/.ae-fx-quick-controls/helper.log`


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
