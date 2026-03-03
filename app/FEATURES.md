# Open DBML Feature Backlog

## Diagram Views Panel (from `app/d/Screenshot 2026-03-03 154040.png`)

### Summary
Add a left-side "Diagram Views" panel to control what tables are visible in the canvas, with saved view presets and schema grouping.

### Requested UX (from screenshot)
- View selector (`Default View`) + save action
- Search input (table/schema/group)
- Grouping mode (`Group by: Schema`)
- Tree list by schema with table checkboxes
- Per-table visibility toggle (eye icon)
- Optional "show all" control

### Complexity
- Overall difficulty: **Medium-High (7/10)**
- Estimated effort: **2-4 days** for a production-quality first version

### Why this is non-trivial
- Needs a new visibility state layer that integrates with existing parsed DBML model and connector rendering
- Requires deterministic table identity across parse cycles (`schema.table`) so visibility persists
- Relationship rendering must handle hidden endpoints correctly (hide/refilter lines)
- Needs persistent saved views in IndexedDB file payload

### Implementation plan
1. **State model**
- Add `diagramViews` to project state:
  - `activeViewId`
  - `views[]` with `{ id, name, hiddenTableKeys[], groupBy }`
  - `search`, `expandedSchemas`
- Default generated view includes all tables visible.

2. **Canvas integration**
- Derive `visibleTables` from `diagramTables` minus hidden keys.
- Filter `relationships` to visible endpoints only.
- Keep drag/layout behavior unchanged for visible tables.

3. **Panel UI**
- Build `components/DiagramViewsPanel.vue`:
  - view dropdown + save/update
  - search field
  - grouped tree by schema
  - row checkbox and eye toggle actions

4. **Persistence**
- Store `diagramViews` and `activeViewId` in existing IndexedDB file payload.
- Load and migrate legacy files without views.

5. **Validation**
- Verify parse update stability with large schemas.
- Verify hidden tables remain hidden after reload.
- Verify connector lines disappear when either endpoint table is hidden.

### Risks
- Large schemas can make panel filtering/tree rendering heavy; may need virtualization later.
- If table names move between schemas, saved keys may require migration handling.

### Recommended MVP scope
- Single grouping mode (`schema`)
- Single-select active view
- Save current visibility as a new view
- Rename/delete saved views
- No advanced permissions/sharing in v1
