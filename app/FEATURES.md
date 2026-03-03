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

## Workspace Export to Disk (Optional Local Backup)

### Summary
Add a user-facing action to download the entire current workspace to disk as a portable file, then allow restoring/importing it later.

### Requirements
- One-click export of current workspace (DBML source, layout positions, view state, preferences).
- File format should be versioned JSON (for forward-compatible migrations).
- Import flow should validate and preview before overwrite.
- Keep this optional; local IndexedDB remains default persistence.

### Complexity
- Overall difficulty: **Medium (5/10)**
- Estimated effort: **1-2 days** for MVP

### Proposed payload
```json
{
  "version": 1,
  "meta": {
    "app": "open-dbml",
    "exportedAt": "ISO_TIMESTAMP"
  },
  "workspace": {
    "sourceText": "...",
    "tablePositions": {},
    "zoom": 55,
    "split": 56,
    "preferences": {
      "darkMode": true,
      "gridVisible": true,
      "accentColor": "#6d5ef8"
    }
  }
}
```

### MVP implementation plan
1. Add `exportWorkspace()` and `importWorkspace()` in `useProjectState`.
2. Add toolbar menu actions:
   - `Download Workspace`
   - `Import Workspace`
3. Validate JSON schema + `version` before applying.
4. On import success, re-parse DBML and persist to IndexedDB.

### Risks
- Overwriting current workspace accidentally.
- Backward compatibility for future schema changes.
