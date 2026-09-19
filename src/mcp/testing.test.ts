/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { Client } from '@modelcontextprotocol/client';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { McpApplicationState } from '../shared/constants/mcp-protocol.js';
import { createMcpServer } from './application.js';
import { definePlugin, defineTool } from './definitions.js';
import { jsonResult } from './results.js';
import { connectTestClient } from './testing.js';

describe('connectTestClient', () => {
  it('should stop the application when the client handshake fails', async () => {
    const disposeContext = vi.fn();
    const app = createMcpServer({
      identity: { name: 'failed-client', version: '1.0.0' },
      plugins: [],
      createContext: () => ({}),
      disposeContext,
    });
    const connect = vi.spyOn(Client.prototype, 'connect').mockRejectedValueOnce(new Error('handshake failed'));
    try {
      await expect(connectTestClient(app)).rejects.toThrow('handshake failed');
      expect(app.state).toBe(McpApplicationState.STOPPED);
      expect(disposeContext).toHaveBeenCalledTimes(1);
    } finally {
      connect.mockRestore();
    }
  });

  it('should dispose an undefined application context even when client close fails', async () => {
    const disposeContext = vi.fn();
    const disposePlugin = vi.fn();
    const tool = defineTool<undefined>()({
      name: 'context_free',
      description: 'Execute without application dependencies.',
      inputSchema: z.object({}),
      handler: () => jsonResult({ ok: true }),
    });
    const app = createMcpServer<undefined>({
      identity: { name: 'context-free-server', version: '1.0.0' },
      plugins: [
        definePlugin({ name: 'context-free-plugin', version: '1.0.0', features: [tool], dispose: disposePlugin }),
      ],
      createContext: () => undefined,
      disposeContext,
    });
    const connection = await connectTestClient(app);
    expect(await connection.client.callTool({ name: tool.name, arguments: {} })).toMatchObject({
      structuredContent: { ok: true },
    });
    const close = vi.spyOn(connection.client, 'close').mockRejectedValueOnce(new Error('close failed'));
    try {
      await expect(connection.close()).rejects.toThrow('close failed');
      expect(app.state).toBe(McpApplicationState.STOPPED);
      expect(disposeContext).toHaveBeenCalledWith(undefined);
      expect(disposePlugin).toHaveBeenCalledTimes(1);
    } finally {
      close.mockRestore();
      await connection.close();
    }
  });

  it('should connect an SDK client and close the complete application boundary', async () => {
    const tool = defineTool<object>()({
      name: 'test_tool',
      description: 'Test tool.',
      inputSchema: z.object({}),
      handler: () => jsonResult({ ok: true }),
    });
    const app = createMcpServer({
      identity: { name: 'testing-server', version: '1.0.0' },
      plugins: [definePlugin({ name: 'test_plugin', version: '1.0.0', features: [tool] })],
      createContext: () => ({}),
    });
    const connection = await connectTestClient(app);
    expect((await connection.client.listTools()).tools).toHaveLength(1);
    await connection.close();
    await connection.close();
    expect(app.state).toBe(McpApplicationState.STOPPED);
  });
});
