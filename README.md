# Open DBML

Open DBML is an open-source database diagram editor focused on local-first editing, fast visual modeling, and DBML-driven workflows.

## Features
- Visual table diagram editor
- DBML split editor
- Drag-to-connect relationships
- Undo/redo
- Import and export workflows (DBML/SQL/JSON)
- Local persistence using IndexedDB
- Dark/light mode support
- Accent color and grid visibility controls

## Tech Stack
- Nuxt 3
- Vue 3 + TypeScript
- `@dbml/core`
- `localforage`

## Project Structure
- `app/`: main Nuxt application
- `docs/`: architecture and project documentation
- `.github/`: CI/CD workflows and contribution templates

## Run Locally
```bash
cd app
npm install
npm run dev
```

Dev server:
- `http://0.0.0.0:3000`

## Build
```bash
cd app
npm run build
npm run preview
```

## Screenshots

### Dark Mode
![Dark Screen 1](app/screens/dark/Screenshot%202026-03-03%20171332.png)
![Dark Screen 2](app/screens/dark/Screenshot%202026-03-03%20171346.png)
![Dark Screen 3](app/screens/dark/Screenshot%202026-03-03%20171358.png)

### Light Mode
![Light Screen 1](app/screens/light/Screenshot%202026-03-03%20171106.png)
![Light Screen 2](app/screens/light/Screenshot%202026-03-03%20171122.png)
![Light Screen 3](app/screens/light/Screenshot%202026-03-03%20171139.png)
![Light Screen 4](app/screens/light/Screenshot%202026-03-03%20171150.png)

## Documentation
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)
- [Codebase Documentation](docs/CODEBASE.md)

## License
MIT. See [LICENSE](LICENSE).
