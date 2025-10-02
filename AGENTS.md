# Repository Guidelines

## Project Structure & Module Organization
- `src/` houses the CLI entry point (`cli.mjs`), command orchestrators, and reusable core utilities; treat `src/commands` as the primary extension surface for new verbs.
- `test/` mirrors production behavior with `unit`, `integration`, `bdd`, and `readme` suites; `test/setup` contains shared fixtures and Docker helpers.
- `projects/` and `playground/` provide sample CLIs used in scenario tests; keep them small and deterministic so cleanroom runs stay fast.
- `docs/` covers feature walkthroughs and architecture notes; update relevant pages when altering public workflows or templates.

## Build, Test, and Development Commands
- Install dependencies with `npm install` (Node 18+). Use `pnpm install` only if you regenerate lockfiles with the matching tool.
- `npm test` or `npm run test:run` executes the full Vitest suite in verbose mode.
- `npm run test:unit`, `npm run test:integration`, and `npm run test:bdd` scope execution to their respective directories.
- `npm run test:coverage` produces V8 coverage; inspect `coverage/` output before publishing.
- `node demo.mjs` and `node demo-enterprise.js` showcase end-to-end scenarios; keep them runnable without extra flags.

## Coding Style & Naming Conventions
- Follow the `.editorconfig` defaults: LF endings, UTF-8, two-space indentation. Avoid trailing whitespace.
- Prettier settings (`.prettierrc`) enforce no semicolons, single quotes, `printWidth` 100, and two-space tabs; run `npx prettier .` before large submissions.
- Prefer descriptive verb-first file names (e.g., `generate-report.mjs`) and export factory functions over instantiating side effects at import time.
- Keep TypeScript declaration updates in `src/types/`, and document new template variables inline with succinct comments.

## Testing Guidelines
- All new features require at least one Vitest assertion; add snapshots in `test/__snapshots__` only when output is deterministic.
- Name tests with behavior-driven phrasing (`should handle missing flags`) and mirror directory structure under `test/`.
- For Docker cleanroom flows, gate long-running suites behind `process.env.CI` toggles when possible to keep local feedback quick.
- Run `npm run test:coverage` before release branches and target stable coverage trends—highlight regressions in PR descriptions.

## Commit & Pull Request Guidelines
- Use conventional commit prefixes (`feat:`, `fix:`, `docs:`); align with recent history (`feat: fix analysis command architecture`).
- Structure commits narrowly: implementation, tests, and docs updates may live together, but unrelated refactors need separate commits.
- PRs should link issues when applicable, summarize CLI impacts, and include `npm test` output snippets or coverage deltas.
- Attach screenshots or logs for CLI regressions.
