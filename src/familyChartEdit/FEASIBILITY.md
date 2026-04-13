# Feasibility: family-chart “v2” edit tree in React

## What “v2” means here

The URL path `/examples/v2/17-edit-tree` refers to **documentation example set v2**, not a separate npm package major. The current npm release is **0.9.x** (`family-chart@latest`). The editing API is **`Chart#editTree()`** returning **`EditTree`**, which matches the documented pattern: `setFields`, `setOnChange`, `setCardClickOpen`, then `chart.updateTree({ initial: true })`.

## Feasibility

| Area | Assessment |
|------|------------|
| **Rendering in React** | Feasible. Mount an empty `div`, call `createChart(container, data)`, configure cards and `editTree()`, then `updateTree`. Avoid recreating the chart on every React render; create once when data is ready, then rely on the library store + `exportData()` for updates. |
| **State sync** | Feasible. `EditTree#setOnChange` runs when the internal history updates after edits/add/remove flows. Export with `exportData()` and lift into React via `useState` (or a store). Use a ref flag to distinguish **internal** updates (from the chart) vs **external** updates (e.g. refetch) when calling `chart.updateData`. |
| **onUpdate / onAdd / onRemove** | Feasible. The library exposes a single **`setOnChange`** hook for all mutations. **`onUpdate`** maps to calling `exportData()` on each change. **`onAdd` / `onRemove`** are implemented by **diffing person `id`s** between the previous and next export (same tree data shape as the viewer). |
| **Tests / SSR** | Jest needs **`family-chart` mocked** (ESM `d3` dependency). No SSR in CRA by default; a chart is client-only. |
| **Backend** | Out of scope; this app only demonstrates frontend callbacks you can wire to `fetch` later. |

## Risks

- **CORS / proxy**: API on another port still needs proxy or CORS (already addressed elsewhere for read-only fetch).
- **Double `useEffect` (Strict Mode)**: Cleanup must clear the container and drop chart references to avoid duplicate SVG/forms.
