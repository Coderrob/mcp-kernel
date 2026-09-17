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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

import { McpTransportName } from '../shared/constants/mcp-protocol.js';
import type { McpTestConnection } from '../types/mcp.js';
import type { McpApplication } from './application.js';
import { defineTransport } from './transports.js';

const MCP_TEST_CLIENT_NAME = 'mcp-harness-test-client';
const MCP_TEST_CLIENT_VERSION = '1.0.0';
const TEST_COMPLETE_STOP_REASON = 'test-complete';

/**
 * Releases the application even when closing the client fails.
 * @param app - Application owned by the test connection.
 * @param client - SDK client to close.
 * @param reason - Reason supplied to application shutdown.
 */
async function closeTestConnection<TContext>(
  app: Readonly<McpApplication<TContext>>,
  client: Readonly<Client>,
  reason: string
): Promise<void> {
  try {
    await client.close();
  } finally {
    await app.stop(reason);
  }
}

/**
 * Starts an application on linked in-memory transports and connects an SDK client.
 * @param app - Application under test.
 * @returns A client and an idempotent cleanup boundary for contract tests.
 * @throws {Error} When application startup or the client handshake fails.
 */
export async function connectTestClient<TContext>(app: Readonly<McpApplication<TContext>>): Promise<McpTestConnection> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await app.start(
    defineTransport(McpTransportName.IN_MEMORY, /** Creates the transport instance. */ () => serverTransport)
  );

  const client = new Client({ name: MCP_TEST_CLIENT_NAME, version: MCP_TEST_CLIENT_VERSION });
  try {
    await client.connect(clientTransport);
  } catch (error) {
    await closeTestConnection(app, client, 'test-client-connection-failed');
    throw error;
  }

  return {
    client,
    /**
     * Closes the SDK client and stops the application.
     */
    async close(): Promise<void> {
      await closeTestConnection(app, client, TEST_COMPLETE_STOP_REASON);
    },
  };
}
