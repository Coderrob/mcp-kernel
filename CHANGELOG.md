# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-09-19

### Added

- Added an architecture guide and lifecycle visual that document package ownership, feature compilation, registration, invocation, and protocol boundaries.

### Changed

- Rework the README and getting-started guide around a runnable application factory, consumer ownership, and the 0.1.x-to-0.2.0 migration path.
- Move documentation asset maintenance guidance into the development guide.
- Upgrade to version 2 of the MCP TypeScript SDK, including its split server and client packages, nested request context, Standard Schema registration, and Zod 4.2 requirement. This is a breaking peer-dependency change from 0.1.x.
- Generate deterministic manifests with Zod 4's built-in JSON Schema converter.

### Removed

- Remove the unused logo-generation prompt from the documentation assets.
- Remove the v1 `@modelcontextprotocol/sdk` peer and the obsolete `zod-to-json-schema` runtime dependency.

### Fixed

- Correct the protocol-test example to create a fresh application instance instead of reusing the already-started stdio server.
- Remove the npm publish dry run from CI so pull requests and main-branch verification succeed when the current package version is already published; retain package validation through `yarn verify`.
- Connect the publishing workflow's `NPM_TOKEN` secret to npm authentication and document the required publishing setup.

## [0.1.1] - 2026-09-18

### Changed

- Refreshed dependency resolution against the npm registry, retaining compatible TypeScript 5 and Zod 3 versions and Yarn's release-age gate.
- Updated checkout, Node setup, and Python setup GitHub Actions to their current v7 releases, pinned by commit.
- Run the build before coverage tests during verification so coverage reports remain available.

### Removed

- Removed forwarding type exports from implementation modules and redundant internal barrel modules; the package root exports directly from defining modules.
- Removed application-specific migration material, fixture data, and obsolete ignore rules.
- Removed the unused operational logging contract, global logger, and operation-scoping helpers; logging is created explicitly through the kernel logger factory.

### Added

- Added a manual release-PR workflow with major, minor, and revision choices, versioned changelog entries, and a fresh Unreleased section.
- Added release preparation tests and an explicit `release:publish` command shared by the publishing workflow.
- Added MkDocs user and contributor documentation with a strict CI build.
- Added Windows CI verification alongside Linux.

### Fixed

- Preserve LF line endings on every checkout so formatting checks also pass on Windows CI.
- Preserve strict tool schemas and apply SDK input transforms only once.
- Isolate anonymous cache and rate-limit state from authenticated principal IDs.
- Support undefined application contexts throughout invocation and disposal.
- Release test applications when SDK client connection or cleanup fails.
- Enable Corepack before invoking Yarn in CI and avoid duplicate CI verification.

## [0.1.0] - 2026-09-17

### Added

- Added the MCP application kernel.
- Added typed definitions for tools, prompts, resources, resource templates, and plugins.
- Added middleware, lifecycle management, execution policies, deterministic manifests, stdio transport support, and an in-memory test client.
- Added ESM, CommonJS, and bundled declaration outputs with npm package and downstream-consumer verification.

[Unreleased]: https://github.com/Coderrob/mcp-kernel/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Coderrob/mcp-kernel/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Coderrob/mcp-kernel/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Coderrob/mcp-kernel/releases/tag/v0.1.0
