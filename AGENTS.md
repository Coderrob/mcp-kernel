# Agent guide

## Purpose and usage

`@coderrob/mcp-kernel` is a TypeScript library for composing Model Context Protocol servers. Consuming applications own service clients, domain logic, credentials, and authentication; the kernel owns feature registration, lifecycle, middleware, and execution policies. It is not a standalone server executable.

The normal application flow is:

1. Define typed tools, resources, resource templates, or prompts with the `define*` helpers and Zod schemas.
2. Group features with `definePlugin`, optionally providing setup and disposal hooks.
3. Call `createMcpServer` with an identity, plugins, and a `createContext` dependency factory.
4. Start with `app.start(stdioTransport())` or a custom SDK transport. Handlers receive `input`, `context`, and `request` metadata, including cancellation and an optional principal.
5. Stop with `app.stop()` to release application resources. For integration tests, use `connectTestClient` and close the returned test connection.

Copy a working example from [README.md](README.md) or [getting started](docs/getting-started.md), rather than inventing API signatures. Consumers import only `@coderrob/mcp-kernel`; the package supports ESM, CommonJS, and bundled declarations.

## Documentation map

Read the relevant guide before changing its behavior, then verify details in the implementation and colocated tests:

| Question                                                      | Reference                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| What does the library provide?                                | [README.md](README.md), [overview](docs/index.md), [public exports](src/index.ts) |
| How do I define features, start a server, and call it?        | [Getting started](docs/getting-started.md)                                        |
| How do lifecycle, scopes, caching, timeouts, and errors work? | [Runtime and policies](docs/runtime.md)                                           |
| How do I install, validate, build docs, or release?           | [Development](docs/development.md), [package scripts](package.json)               |
| What did the initial review cover?                            | [Audit](docs/audit.md); historical evidence, not proof of current checks          |
| Where is documentation navigation configured?                 | [mkdocs.yml](mkdocs.yml)                                                          |

Keep README examples and the relevant guide consistent with public API changes. Add new guide pages to `mkdocs.yml`. Link directly to the relevant repository document in explanations; do not duplicate entire guides here. For dependency APIs, consult the installed version's types and official documentation, and check compatibility against `package.json` and `yarn.lock`.

## Source map and boundaries

| Location                                           | Responsibility                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `src/index.ts`                                     | Sole public export surface and sole production re-export module     |
| `src/mcp/definitions.ts`, `registry.ts`            | Typed feature/plugin builders, validation, deterministic manifests  |
| `src/mcp/application.ts`                           | Lifecycle, dispatch, context ownership, and tool execution policies |
| `src/mcp/sdk-adapter.ts`                           | Register features with the official MCP SDK                         |
| `src/mcp/middleware.ts`, `results.ts`, `errors.ts` | Middleware composition, protocol results, error handling            |
| `src/mcp/transports.ts`, `testing.ts`              | Transport factories and linked in-memory SDK test client            |
| `src/types/`                                       | Shared contracts; `mcp-testing.ts` supports internal tests          |
| `src/shared/`                                      | Protocol constants and stderr logging                               |
| `test/`                                            | Downstream package type and ESM/CommonJS runtime checks             |
| `scripts/`                                         | Architecture/package checks and release preparation                 |
| `.github/workflows/`                               | Cross-platform CI, release PR preparation, and npm publishing       |

- Import internal symbols from their defining module. Do not introduce forwarding exports or internal barrel files; only `src/index.ts` re-exports production symbols.
- Use `.js` extensions in relative TypeScript imports to match the NodeNext configuration. Keep features generic and application dependencies in the consuming application's context.
- Colocate unit tests as `*.test.ts`; follow the layout enforced by `scripts/check-source-layout.mjs`. Release helper tests live beside `scripts/release.mjs`.
- Follow the existing ESLint, Prettier, and TypeScript configurations; preserve LF line endings. Do not suppress checks or lower coverage thresholds to make a change pass.
- Use the pinned Yarn version and preserve its dependency age gate. Check peer compatibility before dependency upgrades, especially MCP SDK, Zod, and TypeScript.
- Edit source and configuration, not generated `dist/`, `coverage/`, `site/`, dependency caches, or virtual environments.

## Setup and verification

Use Node.js satisfying `package.json` (currently 24.15 or newer) and the repository's Node version files. Run from the repository root:

```sh
corepack enable
yarn install --immutable
yarn verify
```

If Yarn is not on PATH, use `corepack yarn` in place of `yarn`. `verify` runs formatting, lint, source/test type checks, architecture and circular dependency checks, Knip, build, coverage tests, downstream consumer checks, and package allowlist validation. It builds before testing because `build` removes both `dist/` and `coverage/`.

During iteration, use `yarn lint`, `yarn typecheck`, or `yarn vitest run path/to/file.test.ts`. Before completing code, dependency, or build changes, run `yarn verify`. `yarn test` enforces at least 95% per file for statements, branches, functions, and lines on the production files included by `vitest.config.mjs`. Add meaningful regression tests for changed behavior, including failure and cleanup paths. Consumer and package checks require a build first.

For Markdown/assets-only changes, run `yarn format:check`, verify links/assets, and build the documentation when it changes. Set up MkDocs using:

```sh
python -m venv .venv
.venv/bin/python -m pip install -r requirements-docs.txt
.venv/bin/python -m mkdocs build --strict
```

On Windows, use `.venv/Scripts/python.exe` instead of `.venv/bin/python`. Preview with `python -m mkdocs serve` using that environment's Python.

## Code Review Rules

Prioritize behavioral regressions and missing tests; leave formatting enforcement to CI.

- Preserve lifecycle ownership: `undefined` is a valid context, stop is terminal and idempotent, and successfully initialized plugins dispose in reverse order. A plugin that throws during setup owns cleanup of its partially acquired resources.
- Preserve single tool-input validation across the SDK boundary. SDK-validated inputs must not run Zod transforms twice; direct application invocations must still validate input. Successful structured outputs must satisfy the declared output schema.
- Keep authorization before cached results and preserve principal isolation, including anonymous versus an authenticated ID literally named `anonymous`. Transport `authInfo.clientId` supplies identity; scope checks do not authenticate tokens. Resources and prompts need authorization in middleware or handlers.
- Cache only eligible read-only tools, respect invalidation and capacity limits, and count cache hits toward rate limits. These stores are local to the application, not distributed guarantees.
- Treat cancellation as cooperative: timeouts signal handlers but cannot forcibly stop JavaScript side effects. Preserve signal propagation and resource cleanup on startup, connection, and shutdown failures.
- Keep unexpected errors sanitized and typed error details caller-safe. Stdio stdout is reserved for protocol traffic; use stderr logging and keep secrets out of free-form messages.
- Check public export/type compatibility and both built module formats when changing the package API.

## Releases and completion

Record user-visible behavior changes in `CHANGELOG.md` under Unreleased. The manual `release-pr.yml` workflow selects `major`, `minor`, or `revision` (patch), versions the pending notes and package, creates a fresh Unreleased section, refreshes the lockfile, verifies, and opens or updates `release/next`.

For local preparation use `yarn release:prepare revision` (or the other increments), then `yarn install --mode=update-lockfile` and `yarn verify`. Preparation does not commit, tag, or publish. See [the release guide](docs/development.md#ci-and-releases) for the complete workflow.

`yarn publish:check` is a dry run. `yarn release:publish` actually publishes to npm; use it only for a task requesting publication. Publishing a GitHub release with a matching `vX.Y.Z` tag triggers `publish.yml` after the release PR is merged.

Before handing off, review the diff for unintended changes and report what changed, which checks actually ran, and any remaining failures or limits. Keep this file accurate when commands or architecture change; put detailed explanations in the linked documentation.

## Guidance maintenance

This root file provides repository-wide context. Keep it concise and actionable; use scoped guidance only when a subtree needs different instructions. OpenAI documents discovery and precedence in [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), and recommends practical setup, layout, verification, and documentation pointers in [Codex best practices](https://learn.chatgpt.com/guides/best-practices#make-guidance-reusable-with-agentsmd).
