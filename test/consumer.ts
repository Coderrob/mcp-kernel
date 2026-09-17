import { z } from 'zod';

import {
  createMcpServer,
  definePlugin,
  defineTool,
  jsonResult,
  McpErrorCode,
  McpHarnessError,
  McpNotFoundError,
  McpUpstreamError,
  requestLogging,
  stdioTransport,
  type Logger,
  type McpApplication,
  type McpToolPolicy,
  type ToolDefinition,
} from '@coderrob/mcp-kernel';

interface ApplicationContext {
  readonly serviceUrl: string;
}

const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const policy: McpToolPolicy = { timeoutMs: 5_000 };
const serviceTool = defineTool<ApplicationContext>()({
  name: 'get_service_url',
  description: 'Returns the configured service URL.',
  inputSchema: z.object({}),
  outputSchema: z.object({ serviceUrl: z.string().url() }),
  policy,
  handler: ({ context }) => jsonResult({ serviceUrl: context.serviceUrl }),
});
const tools: readonly ToolDefinition<ApplicationContext>[] = [serviceTool];
const plugin = definePlugin<ApplicationContext>({ name: 'example-plugin', version: '1.0.0', features: tools });

export const application: McpApplication<ApplicationContext> = createMcpServer({
  identity: { name: 'example-mcp-server', version: '1.0.0' },
  plugins: [plugin],
  createContext: () => ({ serviceUrl: 'https://service.example.com' }),
  middleware: [requestLogging(logger)],
});

export const transport = stdioTransport();
export const representativeErrors = [
  McpErrorCode.AUTHENTICATION_REQUIRED,
  new McpHarnessError(McpErrorCode.CONFLICT, 'conflict'),
  new McpNotFoundError('record'),
  new McpUpstreamError('upstream failure'),
];
