# MCP Kernel

[![npm version](https://img.shields.io/npm/v/%40coderrob%2Fmcp-kernel)](https://www.npmjs.com/package/@coderrob/mcp-kernel)
[![Code coverage threshold: at least 95% per file](https://img.shields.io/badge/coverage_threshold-%E2%89%A595%25-brightgreen)](https://github.com/Coderrob/mcp-kernel/blob/main/vitest.config.mjs)

<p align="center">
  <img src="https://raw.githubusercontent.com/Coderrob/mcp-kernel/main/docs/assets/mcp-kernel-logo.png" alt="MCP Kernel: modular teal K surrounding a golden core" width="680" />
</p>

`@coderrob/mcp-kernel` is a TypeScript library for composing Model Context Protocol (MCP) servers. Define tools, resources, and prompts with Zod schemas; group them into plugins; and run them through one lifecycle, middleware, and policy boundary. It is a library for applications to use, not a server executable.

| The kernel provides                                                                    | Your application provides                                         |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Feature registration, manifests, lifecycle, and transport integration                  | Service clients, credentials, and business logic                  |
| Middleware, tool authorization scopes, timeouts, rate limits, and local result caching | Authentication and deployment-specific authorization              |
| Native MCP results and an in-memory SDK test client                                    | A process entry point and integration tests for external services |

## Install

Use Node.js 24.15 or newer. Install MCP Kernel with the v2 server and client SDK packages and Zod 4.2 or newer:

```bash
npm install @coderrob/mcp-kernel@^0.2.0 @modelcontextprotocol/server@^2 @modelcontextprotocol/client@^2 zod@^4.2.0
```

Upgrading from `0.1.x` requires replacing the v1 `@modelcontextprotocol/sdk` peer with the v2 server and client packages and upgrading Zod 3 to 4. See the [v0.1.1 README](https://github.com/Coderrob/mcp-kernel/blob/v0.1.1/README.md) for the older release.

The package exports ESM and CommonJS entry points with bundled TypeScript declarations. Consumers import from `@coderrob/mcp-kernel` only.

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
  inputSchema: z.object({ name: z.string().min(1) }).strict(),
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

Use [Getting started](docs/getting-started.md) for a complete server entry point and a protocol test that creates a separate application instance. Stdio reserves stdout for MCP messages; write operational logs to stderr. A consuming application owns its service dependencies and calls `app.stop()` during shutdown.

## Explore the package

- [Getting started](docs/getting-started.md) covers installation from this branch, server startup, and a working protocol test.
- [Architecture](docs/architecture.md) explains the SDK boundary, feature compilation, and cleanup ownership.
- [Runtime and policies](docs/runtime.md) covers middleware, scopes, timeouts, caching, results, and cancellation.
- [Development](docs/development.md) covers verification, documentation builds, and releases.

The package root exports `createMcpServer`, feature and plugin builders, middleware helpers, result and error types, transport factories, `connectTestClient`, logging helpers, and their named contracts. The [public export file](src/index.ts) is the authoritative API list.

## Contribute

Read [AGENTS.md](AGENTS.md) for repository boundaries and review rules. Run `corepack yarn install --immutable` followed by `corepack yarn verify`; verification includes per-file coverage thresholds of 95% for statements, branches, functions, and lines. See the [development guide](docs/development.md) for the full check and release workflow.

## License

GPL-3.0-only. See [LICENSE](LICENSE).
