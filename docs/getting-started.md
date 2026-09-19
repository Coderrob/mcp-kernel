# Getting started

## Install

```bash
npm install @coderrob/mcp-kernel @modelcontextprotocol/server @modelcontextprotocol/client zod@^4.2.0
```

Use Node.js 24.15 or newer and TypeScript with NodeNext module resolution for an ESM application.

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

The application owns its transport. Call `await app.stop()` during shutdown; plugins and application dependencies are disposed in reverse ownership order. Create a new application instance to restart a server.

## Test through the protocol

Use a fresh application instance with `connectTestClient` instead of starting stdio:

```typescript
import { connectTestClient } from '@coderrob/mcp-kernel';

const connection = await connectTestClient(app);
try {
  const result = await connection.client.callTool({ name: 'hello_user', arguments: { name: 'Ada' } });
  console.log(result.structuredContent);
} finally {
  await connection.close();
}
```

The helper connects the official SDK client and server using linked in-memory transports. It stops the application if the client handshake or client cleanup fails.

## Other feature types

`defineResource` registers a fixed URI. `defineResourceTemplate` registers a URI template and an optional lister. Their handlers return native MCP resource results. `definePrompt<Context>()` infers prompt arguments from a Zod object containing required or optional strings and returns native MCP prompt messages.

Use `app.manifest()` to inspect plugin and feature metadata without opening a transport. Use `app.listFeatures()` when building application tooling around the compiled definitions.
