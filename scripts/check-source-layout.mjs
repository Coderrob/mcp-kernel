/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 */
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SOURCE_ROOT = 'src';
const TEST_FILE_PATTERN = /\.test\.ts$/;
const TYPES_DIRECTORY = 'types';
const ALLOWED_ROOT_FILES = new Set(['index.ts', 'index.test.ts']);
const ALLOWED_DIRECTORIES = new Set(['mcp', 'shared', 'types']);

/**
 * Resolves TypeScript files represented by one directory entry.
 * @param directory - Parent directory containing the entry.
 * @param entry - Entry to inspect.
 * @returns TypeScript files represented by the entry.
 */
async function listEntryFiles(directory, entry) {
  const path = join(directory, entry.name);
  if (entry.isDirectory()) return listTypescriptFiles(path);
  return isTypescriptEntry(entry) ? [path] : [];
}

/**
 * Reports whether a directory entry is a TypeScript source file.
 * @param entry - Entry to inspect.
 * @returns Whether the entry represents TypeScript source.
 */
function isTypescriptEntry(entry) {
  return entry.isFile() && entry.name.endsWith('.ts');
}

/**
 * Recursively lists TypeScript source files below a directory.
 * @param directory - Directory to traverse.
 * @returns TypeScript source paths.
 */
async function listTypescriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(/** Resolves the files beneath one entry. */ (entry) => listEntryFiles(directory, entry))
  );
  return nested.flat();
}

/**
 * Requires every behavioral module to have a colocated unit test.
 * @param files - All TypeScript source files.
 */
async function checkColocatedTests(files) {
  const knownFiles = new Set(files);
  const missing = files
    .filter(
      /** Selects behavioral production modules. */ (file) =>
        !TEST_FILE_PATTERN.test(file) && relative(SOURCE_ROOT, file).split(/[\\/]/)[0] !== TYPES_DIRECTORY
    )
    .filter(
      /** Selects modules without their expected colocated test. */ (file) =>
        !knownFiles.has(file.replace(/\.ts$/, '.test.ts'))
    )
    .map(/** Makes diagnostics repository-relative. */ (file) => relative(SOURCE_ROOT, file));
  assert.deepEqual(missing, [], `Add a colocated test for each behavioral module: ${missing.join(', ')}`);
}

/** Keeps the source root restricted to the documented package areas. */
async function checkRootLayout() {
  const entries = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const unexpected = entries
    .filter(
      /** Selects entries outside the documented package layout. */ (entry) =>
        entry.isDirectory() ? !ALLOWED_DIRECTORIES.has(entry.name) : !ALLOWED_ROOT_FILES.has(entry.name)
    )
    .map(/** Selects the unexpected entry name. */ (entry) => entry.name);
  assert.deepEqual(unexpected, [], `Unexpected source-root entries: ${unexpected.join(', ')}`);
}

const files = await listTypescriptFiles(SOURCE_ROOT);
await checkRootLayout();
await checkColocatedTests(files);
process.stdout.write('Source layout and colocated tests are valid\n');
