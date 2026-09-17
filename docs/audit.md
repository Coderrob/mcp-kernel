# Repository audit

## Scope

The September 17, 2026 audit reviewed production modules, public types and exports, tests, build and package scripts, repository quality configuration, GitHub workflows, and documentation setup. Existing workspace files were retained; no release was published.

## Corrected findings

- Removed forwarding type exports from implementation modules and redundant internal barrels. Internal consumers now import contracts from their defining modules, and only the public package entry point re-exports symbols.
- Removed application-specific migration documentation, fixture names and data, and obsolete ignore rules. The downstream consumer fixture now uses a generic application context.
- Removed unused operational logging helpers and the global logger singleton. Importing the package no longer creates a logger destination; applications explicitly call `createStderrLogger` when needed.
- Tool inputs were parsed by both the SDK and kernel, breaking non-idempotent property transforms. The SDK now receives the whole object schema, and the kernel accepts its validated result without reparsing. Regression tests cover transforms and strict unknown-property rejection.
- Anonymous policy state used a string sentinel that collided with an authenticated client ID of `anonymous`. Cache and rate-limit keys now encode identity components with a distinct null marker.
- Applications with an undefined context could start but could not invoke features or dispose plugin state. Context ownership is now tracked independently from its value.
- The test-client helper left applications running when client connection or close failed. Cleanup now runs on both failure paths.
- CI repeated the entire verification suite during its publish check and configured Yarn caching before enabling Corepack. The workflow now enables Corepack before invoking Yarn and performs one verification run per operating system followed by a publishing dry run.
- Documentation was absent. The repository now has a root MkDocs configuration, a pinned documentation requirement, user and contributor guides, and a strict documentation CI job.

## Validation boundaries

The completed local checks passed:

| Check                  | Result                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Immutable Yarn install | Passed without lockfile changes                                                                                  |
| `yarn verify`          | Formatting, lint, type checking, architecture, Knip, tests, build, consumer checks, and package allowlist passed |
| Vitest                 | 46 tests across 12 files passed; all per-file coverage thresholds passed                                         |
| Dependency audit       | `yarn npm audit --all --recursive` returned no audit suggestions                                                 |
| MkDocs                 | Strict build passed                                                                                              |
| Workflow files         | YAML parsed successfully with required trigger and job sections                                                  |

The npm publishing dry run also passed with `--offline --ignore-scripts`; it included only the nine allowed package files and did not publish anything. Offline mode avoids a registry metadata lookup and does not validate publication credentials.

The audit uses the repository verification suite, focused regression tests, an immutable dependency install, an npm publishing dry run, and a strict MkDocs build. Local checks establish behavior in the available Windows environment. Linux runner behavior and GitHub/npm account settings require a hosted workflow run after these changes are pushed.

Coverage measures exercised code, not the absence of all defects. In-memory policy state, cooperative cancellation, and transport-supplied identity remain deliberate runtime boundaries described in [Runtime and policies](runtime.md).
