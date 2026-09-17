# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Refreshed dependency resolution against the npm registry, retaining compatible TypeScript 5 and Zod 3 versions and Yarn's release-age gate.
- Updated checkout, Node setup, and Python setup GitHub Actions to their current v7 releases, pinned by commit.
- Run the build before coverage tests during verification so coverage reports remain available.

### Removed

- Removed forwarding type exports from implementation modules and redundant internal barrel modules; the package root exports directly from defining modules.
- Removed application-specific migration material, fixture data, and obsolete ignore rules.
- Removed the unused operational logging contract, global logger, and operation-scoping helpers; logging is created explicitly through the kernel logger factory.

### Added

- Added MkDocs user and contributor documentation with a strict CI build.
- Added Windows CI verification alongside Linux.

### Fixed

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

[Unreleased]: https://github.com/Coderrob/mcp-kernel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Coderrob/mcp-kernel/releases/tag/v0.1.0
