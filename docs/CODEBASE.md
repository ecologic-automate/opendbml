# Codebase Documentation

## Overview

`EcoSchema` is a Quasar + Vue 3 single-page app for editing DBML and rendering interactive database diagrams.

At runtime, the app:

1. Edits DBML text in an Ace editor.
2. Parses DBML to an in-memory database model via `@dbml/core`.
3. Renders diagram tables/refs from that model.
4. Persists files/layout locally with `localforage`.
5. Optionally syncs JSON files to/from an S3-compatible object store.

## Repository Structure

- `api/`: placeholder folder only (`.gitkeep`), no backend implementation in this repo.
- `web/`: main frontend application (Quasar/Vue).
- `docs/`: project-level documentation.

## Frontend Architecture (`web/`)

### Entry and Routing

- App entry: `src/App.vue` (renders router view).
- Main shell: `src/layouts/MainLayout.vue` (header + toolbar slot + page container).
- Routes:
  - `/editor` -> `src/pages/Editor/Index.vue` (main editor page) + `src/pages/Editor/Toolbar.vue` (named toolbar view).
  - catch-all -> `src/pages/Error404.vue`.

### Boot Files

Configured in `quasar.conf.js`:

- `src/boot/i18n.js`: Vue I18n setup.
- `src/boot/ace.js`: Ace extensions/themes + DBML mode registration.
- `src/boot/pinia.js`: Pinia registration + global store plugin.
- `src/boot/v3num.js`: numeric input helper boot file.

### Core UI Components

- `src/components/DbmlEditor.vue`:
  - Ace-based DBML text editor.
  - Mirrors source text through `v-model`.
  - Displays parse errors as inline annotations.
  - Highlights selected tokens when chart items are activated.

- `src/components/DbmlGraph.vue`:
  - Hosts diagram chart (`VDbChart`).
  - Provides auto-layout and fit-to-view controls.
  - Supports double-click navigation from graph objects back to source tokens.

- `src/components/VDbChart/*`:
  - Diagram rendering primitives (tables, refs, groups, panels, tooltips).

- `src/components/VDbExportDialog.vue` and `src/components/VDbImportDialog.vue`:
  - Import/export workflows for DBML/SQL/JSON/SVG/PNG.

## State Management (Pinia)

### `editor` Store (`src/store/editor.js`)

Responsible for source and parsed model:

- `source`: current DBML text + selection markers.
- `database`: parsed DB model (`schemas`, `tables`, `refs`, groups).
- `preferences`: editor theme, dark mode, split ratio.
- `parserError`: parse error location/message shown in editor.

Key action flow:

- `updateSourceText` updates source.
- store plugin debounces `updateDatabase`.
- `updateDatabase` uses `Parser.parse(...)` from `@dbml/core`.
- on success, chart store receives the normalized database.

### `chart` Store (`src/store/chart.js`)

Responsible for diagram state:

- viewport (`zoom`, `pan`, CTM data).
- table/group/ref geometry.
- table header colors.
- tooltip and side-panel visibility/state.

Also exposes persisted chart payload for local file saves.

### `files` Store (`src/store/files.js`)

Responsible for local file lifecycle via `localforage` store `files`:

- list files, load/save/rename/delete.
- track current file.
- reset editor + chart for new files.

Saved file payload combines:

- `editor.save` (source + preferences)
- `chart.save` (diagram positioning/appearance)

### `repo` Store (`src/store/repo.js`)

Responsible for S3-compatible remote storage:

- stores repository config in `localforage` store `repo` under key `cfg`.
- creates S3 client from user settings.
- lists remote objects, filters by configured folder prefix(es), and handles upload/download.

Required settings:

- `host`, `bucket`, `region`, `access_key`, `secret_key`
- `path` supports multiple comma-separated folder roots.

## Persistence Model

Two local persistence mechanisms are used:

1. `localStorage` via `src/utils/storageUtils.js`:
   - `dbml-preferences`
   - `dbml-currentFile`

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
