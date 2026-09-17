/** Verifies both published JavaScript entry points through package self-reference. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import * as esmKernel from '@coderrob/mcp-kernel';

const require = createRequire(import.meta.url);
const commonJsKernel = require('@coderrob/mcp-kernel');

for (const kernel of [esmKernel, commonJsKernel]) {
  assert.equal(typeof kernel.createMcpServer, 'function');
  assert.equal(typeof kernel.defineTool, 'function');
  assert.equal(typeof kernel.jsonResult, 'function');
  assert.equal(typeof kernel.stdioTransport, 'function');
}

process.stdout.write('ESM and CommonJS package entry points are loadable\n');
