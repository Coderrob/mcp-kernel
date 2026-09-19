# MCP Kernel

[![npm version](https://img.shields.io/npm/v/%40coderrob%2Fmcp-kernel)](https://www.npmjs.com/package/@coderrob/mcp-kernel)
[![Code coverage threshold: at least 95% per file](https://img.shields.io/badge/coverage_threshold-%E2%89%A595%25-brightgreen)](https://github.com/Coderrob/mcp-kernel/blob/main/vitest.config.mjs)

<p align="center">
  <img src="https://raw.githubusercontent.com/Coderrob/mcp-kernel/main/docs/assets/mcp-kernel-logo.png" alt="MCP Kernel: modular teal K surrounding a golden core" width="680" />
</p>

`@coderrob/mcp-kernel` is a TypeScript application kernel for building Model Context Protocol servers. It provides schema-driven tools and prompts, resources, plugins, middleware, execution policies, deterministic manifests, transports, and an in-memory SDK test client.

## Install

```bash
npm install @coderrob/mcp-kernel @modelcontextprotocol/sdk zod@^3.25.0
```

The package requires Node.js 24.15 or newer. It publishes ESM and CommonJS entry points with bundled TypeScript declarations.

## Create a server

```typescript
import { createMcpServer, definePlugin, defineTool, jsonResult, stdioTransport } from '@coderrob/mcp-kernel';
import { z } from 'zod';

interface AppContext {
  greeting: string;
}

const hello = defineTool<AppContext>()({
  name: 'hello_user',
  description: 'Create a greeting.',
  inputSchema: z.object({ name: z.string().min(1) }),
  outputSchema: z.object({ message: z.string() }),
  annotations: { readOnlyHint: true },
  handler: ({ input, context }) => jsonResult({ message: `${context.greeting}, ${input.name}` }),
});

const app = createMcpServer<AppContext>({
  identity: { name: 'greeting-server', version: '1.0.0' },
  plugins: [definePlugin({ name: 'greetings', version: '1.0.0', features: [hello] })],
  createContext: () => ({ greeting: 'Hello' }),
});

await app.start(stdioTransport());
```

Handlers receive validated input, the application context, and request metadata. Tool policies support timeouts, required scopes, per-principal rate limits, result caching, and cache invalidation.

## Public API

The package root exports:

- application lifecycle: `createMcpServer` and `McpApplication`;
- authoring: `defineTool`, `defineResource`, `defineResourceTemplate`, `definePrompt`, and `definePlugin`;
- middleware: `composeMiddleware` and `requestLogging`;
- results and errors: `jsonResult`, `textResult`, `errorResult`, and the `McpHarnessError` hierarchy;
- transports: `defineTransport` and `stdioTransport`;
- testing: `connectTestClient`, which uses the official SDK's linked in-memory transport;
- logging: the `Logger` contract, `noopLogger`, and `createStderrLogger`;
- named contracts and stable protocol enums used by these APIs.

Only the package root is a supported import path. Internal source paths are intentionally absent from `exports` so the implementation can evolve without breaking consumers.

## Development and release

```bash
corepack yarn install --immutable
corepack yarn verify
corepack yarn publish:check
```

`verify` runs formatting, linting, production and test type checking, architecture and circular-dependency checks, Knip, per-file coverage, the dual-format build, a downstream type/runtime consumer check, and an npm tarball allowlist check. `publish:check` additionally runs npm's publish dry run.

Publishing is limited to `dist`, `README.md`, `CHANGELOG.md`, `LICENSE`, and package metadata. Releases are intended to follow semantic versioning; update `CHANGELOG.md` before tagging a release.

To prepare a release, run **Actions → Create release PR → Run workflow** on `main` and choose `major`, `minor`, or `revision` (patch). The workflow versions the Unreleased notes, creates a fresh Unreleased section, verifies the package, and opens or updates the release PR. Merge it, then publish a GitHub release with the matching `vX.Y.Z` tag to trigger npm publishing.

`yarn release:prepare revision` prepares the same files locally. `yarn release:publish` verifies and publishes the package with provenance from a configured publishing environment. See the [development guide](docs/development.md) for setup and command details.

## Documentation

Agents working in this repository should start with [AGENTS.md](AGENTS.md) for the architecture map, development commands, review rules, and documentation references.

See the [documentation overview](docs/index.md), [runtime guide](docs/runtime.md), and [development guide](docs/development.md). Build the site with `python -m pip install -r requirements-docs.txt` and `python -m mkdocs build --strict`; preview it with `python -m mkdocs serve`.

## License

GPL-3.0-only. See [LICENSE](LICENSE).
