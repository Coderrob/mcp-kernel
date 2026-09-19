# Getting started

MCP Kernel is a library that a consuming application uses to define and run an MCP server. The application supplies service clients, credentials, and domain behavior. The kernel supplies registration, lifecycle, policies, and protocol testing.

## Install

Use Node.js 24.15 or newer and TypeScript with NodeNext module resolution for an ESM application. Install MCP Kernel with the v2 SDK peers and Zod 4.2 or newer:

```bash
npm install @coderrob/mcp-kernel@^0.2.0 @modelcontextprotocol/server@^2 @modelcontextprotocol/client@^2 zod@^4.2.0
```

The test example below uses Vitest; install it as a development dependency in the consuming project if you use that runner.

If you are upgrading from `0.1.x`, replace the v1 `@modelcontextprotocol/sdk` peer with the v2 server and client packages and upgrade Zod 3 to 4. See the [v0.1.1 README](https://github.com/Coderrob/mcp-kernel/blob/v0.1.1/README.md) for the older dependency requirements.

## Define an application factory

Keep definitions and application construction separate from process startup. The factory below creates a fresh lifecycle for both a stdio process and each protocol test.

```typescript
// src/greeting.ts
import { createMcpServer, definePlugin, defineTool, jsonResult } from '@coderrob/mcp-kernel';
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

export function createGreetingApp() {
  return createMcpServer<AppContext>({
    identity: { name: 'greeting-server', version: '1.0.0' },
    plugins: [definePlugin({ name: 'greetings', version: '1.0.0', features: [hello] })],
    createContext: () => ({ greeting: 'Hello' }),
  });
}
```

`defineTool` infers `input.name` from its Zod schema. The output schema checks successful structured results. Plugins group features and may add setup and disposal hooks. The application creates one context for its lifetime; handlers receive that context and request metadata.

## Start a stdio server

Create a process entry point that starts one application instance. Configure an MCP client or host to launch the compiled JavaScript entry point with Node.js.

```typescript
// src/server.ts
import { stdioTransport } from '@coderrob/mcp-kernel';

import { createGreetingApp } from './greeting.js';

const app = createGreetingApp();
await app.start(stdioTransport());

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.stop(signal);
  });
}
```

Stdio reserves stdout for MCP messages. Send logs to stderr with `createStderrLogger`, and keep secrets out of free-form log messages. `stop` closes the SDK server and disposes initialized plugins and application context. It is terminal: create another application instance to restart.

## Test through the protocol

Use a **new** application instance for an in-memory test. `connectTestClient` starts it on linked official SDK transports and returns a client plus an idempotent cleanup method.

```typescript
// test/greeting.test.ts
import { connectTestClient } from '@coderrob/mcp-kernel';
import { expect, it } from 'vitest';

import { createGreetingApp } from '../src/greeting.js';

it('greets a caller through MCP', async () => {
  const connection = await connectTestClient(createGreetingApp());
  try {
    const result = await connection.client.callTool({ name: 'hello_user', arguments: { name: 'Ada' } });
    expect(result.structuredContent).toEqual({ message: 'Hello, Ada' });
  } finally {
    await connection.close();
  }
});
```

This exercises SDK registration, input validation, invocation, result conversion, and cleanup. Add tests in the consuming application for its actual stdio or HTTP startup, authentication, and service integrations.

## Add more capabilities

`defineResource` registers a fixed URI; `defineResourceTemplate` registers a parameterized URI and optional lister. Their handlers return native MCP resource results. `definePrompt<Context>()` infers prompt arguments from a Zod object of required or optional strings and returns native MCP prompt messages.

Use `app.manifest()` to inspect deterministic plugin and feature metadata without starting a transport. Use `app.listFeatures()` when tooling needs the compiled definitions. See [Architecture](architecture.md) for ownership boundaries and [Runtime and policies](runtime.md) for middleware, authorization, caching, and cancellation.
