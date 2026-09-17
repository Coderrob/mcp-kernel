# Development

## Install and verify

The repository pins Yarn through `packageManager` and the Node major through `.node-version` and `.nvmrc`.

```bash
corepack enable
yarn install --immutable
yarn verify
```

`verify` runs formatting, lint, production and test type checking, source architecture checks, circular dependency detection, unused dependency/export checks, the Rollup build, coverage tests, downstream type/runtime consumer checks, and package file verification. Per-file coverage thresholds are 95% for statements, branches, functions, and lines.

| Command               | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `yarn build`          | Build ESM, CommonJS, source maps, and bundled declarations.      |
| `yarn lint`           | Run ESLint with no warnings allowed.                             |
| `yarn test`           | Run Vitest with coverage.                                        |
| `yarn typecheck`      | Check source and test TypeScript.                                |
| `yarn format`         | Apply repository formatting.                                     |
| `yarn consumer:check` | Validate downstream TypeScript and load both built entry points. |
| `yarn package:check`  | Validate the npm tarball file allowlist without publishing.      |
| `yarn publish:check`  | Run verification and an npm publish dry run.                     |

`verify` builds before running tests so its coverage report remains available. Standalone `build` cleans generated distribution and coverage directories. Run `yarn test` after a standalone build when retaining a coverage report is needed. Consumer and package checks require an existing build.

## Documentation

Internal imports reference the module that defines each symbol. Re-exports are limited to `src/index.ts`, the package's public entry point; ESLint enforces this boundary for production source.

Documentation uses [MkDocs](https://www.mkdocs.org/user-guide/configuration/) with the root `mkdocs.yml` and Markdown files in `docs/`.

Create a Python virtual environment and install the pinned documentation tool:

```bash
python -m venv .venv
# Linux/macOS
.venv/bin/python -m pip install -r requirements-docs.txt
.venv/bin/python -m mkdocs build --strict
.venv/bin/python -m mkdocs serve
```

On Windows, replace `.venv/bin/python` with `.venv/Scripts/python.exe`. The generated `site/` directory is ignored by Git and is excluded from the npm package. The strict build fails on documentation warnings, including broken internal links.

## CI and releases

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual dispatch. It verifies the package on Linux and Windows and runs an npm publishing dry run. A separate Python job builds the documentation in strict mode. New pushes cancel superseded runs for the same ref.

`.github/workflows/publish.yml` verifies and publishes on a published GitHub release using the `npm` environment and provenance. Repository administrators must configure npm trusted publishing and any environment protections. Update the package version and changelog before releasing. Local verification cannot validate hosted runner execution, npm account configuration, or environment approvals.
