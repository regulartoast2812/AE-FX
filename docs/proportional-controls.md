# Proportional Controls

Proportional controls are used for properties that are stored as paired values and can reasonably be edited together, such as `Mask Feather` `[x, y]`.

## UI Guide

- A proportional property is shown as one grouped control with a header, axis rows, and a chain button.
- The chain button is the source of truth for linked editing.
- Linked state uses a blue-tinted group border and a connected chain icon.
- Unlinked state uses the normal group border and a broken/dim chain icon.
- When linked, changing any axis mirrors the same value into the other axes before the value is sent to After Effects.
- When unlinked, each axis edits independently.
- If all axis values are equal when the panel opens, the group starts linked.
- If axis values differ when the panel opens, the group starts unlinked.

## Current Coverage

The mask panel currently exposes one proportional property:

- `Mask Feather`: `feather-x` and `feather-y`, written to AE as the `feather` array.

Other panel controls should only use this UI when the underlying AE property is truly a paired/multi-axis value. Do not add a chain button to single-value properties like opacity, expansion, size, angle, or distance.

## Implementation Guide

Proportional mask controls are registered in `src/js/10-style-mask-panels.js` with `MASK_PROPORTIONAL_GROUPS`. `js/main.js` is the generated runtime bundle.

```js
const MASK_PROPORTIONAL_GROUPS = {
  feather: {
    label: "Feather",
    propertyName: "feather",
    controls: ["feather-x", "feather-y"],
    axes: ["X", "Y"]
  }
};
```

Fields:

- `label`: Header shown in the UI group.
- `propertyName`: Host property name passed to `TNT_setMaskProperty`.
- `controls`: Individual UI control ids, one per axis.
- `axes`: Short axis labels shown beside each slider/input row.

To add another proportional property:

1. Add a new entry to `MASK_PROPORTIONAL_GROUPS`.
2. Render it with `renderMaskProportionalSliderGroup(groupId, values, min, max, step)`.
3. Make sure `TNT_setMaskProperty` in `jsx/timeline.jsx` supports the `propertyName` and writes the array value to AE.
4. Keep the control ids unique inside the node.

The generic handlers are:

- `syncMaskProportionalControls`
- `mirrorMaskProportionalValue`
- the proportional branch inside `setMaskControlValue`

These handlers use the registry, so new registered groups automatically get link toggling, value mirroring, and array serialization.
