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

### Prepare a release PR

In GitHub, open **Actions → Create release PR → Run workflow**, select the default branch, and choose a version increment:

| Selection  | Example from 1.2.3 |
| ---------- | ------------------ |
| `major`    | 2.0.0              |
| `minor`    | 1.3.0              |
| `revision` | 1.2.4              |

The workflow updates `package.json`, assigns the Unreleased notes to the new dated version, updates comparison links, and adds a fresh empty Unreleased section. It refreshes the lockfile, runs `yarn verify`, and opens or updates the single `release/next` PR. Rerunning it before merge recalculates the release from the latest default branch. Empty Unreleased sections and malformed version or changelog data fail before either release file is changed.

For local preparation, run `yarn release:prepare revision` (or `major`/`minor`), then `yarn install --mode=update-lockfile` and `yarn verify`. Preparation does not commit, tag, or publish. Continue adding changes to Unreleased after the release PR is merged.

The repository must allow GitHub Actions to create pull requests under **Settings → Actions → General → Workflow permissions**. The release workflow grants write access only to repository contents and pull requests. PR workflows created with `GITHUB_TOKEN` may require a maintainer to approve their run; the release workflow validates the proposed changes before opening the PR. See [GitHub's workflow trigger rules](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

### Publish the merged version

After merging the release PR, publish a GitHub release tagged `vX.Y.Z` at the merge commit. `.github/workflows/publish.yml` checks that the tag matches `package.json`, then runs `yarn release:publish` in the `npm` environment. Configure npm trusted publishing for this workflow and any desired environment protections.

`yarn release:publish` runs the full verification suite and publishes with public access and provenance. It is intended for the configured GitHub publishing environment. The command uses `--ignore-scripts` after verification to avoid executing verification twice. Direct `npm publish` still runs the `prepublishOnly` verification hook. There is deliberately no script named `publish`: npm treats that name as a lifecycle hook, which could recursively call publication. `yarn publish:check` remains the non-publishing dry run.
