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

import { describe, expect, it } from 'vitest';

import * as kernel from './index.js';

describe('package public API', () => {
  it('should expose the application, authoring, transport, testing, result, and logging APIs', () => {
    expect(typeof kernel.createMcpServer).toBe('function');
    expect(typeof kernel.definePlugin).toBe('function');
    expect(typeof kernel.defineTool).toBe('function');
    expect(typeof kernel.defineResource).toBe('function');
    expect(typeof kernel.defineResourceTemplate).toBe('function');
    expect(typeof kernel.definePrompt).toBe('function');
    expect(typeof kernel.requestLogging).toBe('function');
    expect(typeof kernel.connectTestClient).toBe('function');
    expect(typeof kernel.stdioTransport).toBe('function');
    expect(typeof kernel.jsonResult).toBe('function');
    expect(typeof kernel.createStderrLogger).toBe('function');
  });
});
