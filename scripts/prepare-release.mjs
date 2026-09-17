/** Prepares a release locally without committing, tagging, or publishing it. */
import assert from 'node:assert/strict';

import { prepareRelease } from './release.mjs';

assert.equal(process.argv.length, 3, 'Usage: yarn release:prepare <major|minor|revision>');
const version = await prepareRelease(process.cwd(), process.argv[2]);
process.stdout.write(`Prepared release ${version}\n`);
