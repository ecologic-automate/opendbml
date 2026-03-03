# Contributing to EcoSchema

Thanks for contributing.

## Development Setup
1. Install Node.js 20+.
2. Install dependencies:
   `cd app && npm install`
3. Start dev server:
   `npm run dev`
4. Open the app at `http://localhost:3000`.

## Branch and PR Flow
1. Create a branch from `master`.
2. Keep PRs focused and small.
3. Add/update tests when behavior changes.
4. Open a PR with:
   - problem statement
   - approach
   - screenshots/GIFs for UI changes
   - migration notes (if any)

## Code Standards
- TypeScript for app logic.
- Keep functions small and explicit.
- Avoid introducing breaking schema/storage changes without migration notes.
- Prefer stable keys for model entities (`schema.table`).

## Commit Message Guidance
Use clear, imperative messages.
Examples:
- `feat: add drag-to-connect relationship creation`
- `fix: resolve relationship anchors for quoted identifiers`
- `docs: add security policy and issue templates`

## Reporting Bugs
Please use the bug template and include:
- reproduction steps
- expected vs actual behavior
- browser + OS
- sample DBML snippet if parser/diagram related

## Feature Requests
Please use the feature template and describe:
- problem
- proposed UX/API
- alternatives considered
