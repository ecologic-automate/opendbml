# Codebase Documentation

## Overview

`Open DBML` is a Nuxt 3 + Vue 3 application for editing DBML and rendering interactive database diagrams.

Runtime flow:
1. DBML is edited in the split/code editor.
2. `@dbml/core` parses DBML into an in-memory model.
3. Diagram tables and relationships are derived from that model.
4. Files/layout are persisted locally via IndexedDB (`localforage`).

## Repository Structure

- `app/`: active Nuxt application.
- `docs/`: documentation.
- `.github/`: workflow and contribution templates.

## Core App Files

- `app/composables/useProjectState.ts`:
  - central editor state
  - DBML parsing
  - local file save/load
  - undo/redo
  - relationship creation logic
- `app/components/DiagramCanvas.vue`:
  - table rendering
  - drag/move interactions
  - relationship line rendering
  - drag-to-connect behavior
- `app/components/AppTopbar.vue`:
  - file actions (new/save/rename/delete/import/export)
  - undo/redo controls
- `app/components/AppSidebar.vue`:
  - app navigation and logo
- `app/pages/*`:
  - main diagram, split editor, views, relationships, settings

## Persistence

Local IndexedDB store:
- database name: `open-dbml`
- store: `files`

Saved payload:
- `sourceText`
- `zoom`
- `split`
- `tablePositions`

2. `localforage`:
   - `files` store: full file payloads (source + chart).
   - `repo` store: S3/repository config.

Autosave behavior is wired in `src/store/plugin.js`:

- source and chart mutations trigger debounced autosave.
- editor preference changes are persisted and dark mode is applied immediately.
- on startup, last `currentFile` is loaded automatically.

## Import/Export Workflows

### Export (`src/utils/exportUtil.js`)

- JSON: exports saved file payload from localforage.
- DBML/SQL (`postgres`, `mysql`, `mssql`): uses `@dbml/core` exporter.
- SVG/PNG: serializes chart SVG layers, applies CSS attributes, saves as file/canvas PNG.

### Import (`src/components/VDbImportDialog.vue`)

- JSON imports full saved payload.
- SQL/DBML imports are converted to DBML via `@dbml/core` importer.
- User can overwrite current file or create a new/copy file.
- Parse/import errors are surfaced through Quasar notifications.

## Build and Runtime

From `web/`:

- Install: `yarn`
- Dev server: `yarn dev` (Quasar dev, default port `3210`)
- Lint: `yarn lint`
- Build: `yarn build`

`quasar.conf.js` currently sets:

- `vueRouterMode: "history"`
- environment passthrough via `dotenv` (`build.env`)
- PWA scaffolding enabled in config (standard Quasar options).

## Notes for Contributors

- There is no active backend implementation in `api/`.
- State synchronization relies heavily on debounced side effects in `store/plugin.js`; update this carefully when changing save/parse flows.
- A number of editor/graph/repo flows are implemented with direct browser APIs and async callbacks; regression-test import/export and repo sync manually after changes.
