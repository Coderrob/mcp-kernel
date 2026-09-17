/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const WINDOWS_PLATFORM = 'win32';
const COMMAND_TIMEOUT_MS = 30_000;
const npmArguments = ['pack', '--dry-run', '--json', '--ignore-scripts'];
const useWindowsCommandShell = process.platform === WINDOWS_PLATFORM;
const executable = useWindowsCommandShell ? (process.env['ComSpec'] ?? 'cmd.exe') : 'npm';
const executableArguments = useWindowsCommandShell ? ['/d', '/s', '/c', 'npm', ...npmArguments] : npmArguments;
const output = execFileSync(executable, executableArguments, {
  encoding: 'utf8',
  env: { ...process.env, npm_config_cache: resolve('.npm-cache') },
  timeout: COMMAND_TIMEOUT_MS,
});
const [packResult] = JSON.parse(output);
const packageMetadata = JSON.parse(await readFile('package.json', 'utf8'));
const expectedFiles = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.ts',
  'dist/index.mjs',
  'dist/index.mjs.map',
  'package.json',
];
const actualFiles = packResult.files.map(/** Selects one packed path from npm's result. */ (file) => file.path).sort();

assert.equal(packResult.name, '@coderrob/mcp-kernel');
assert.equal(packResult.version, packageMetadata.version);
assert.equal(packageMetadata.publishConfig.access, 'public');
assert.equal(packageMetadata.publishConfig.provenance, true);
assert.deepEqual(actualFiles, expectedFiles);
process.stdout.write(`Package ${packResult.filename} contains only the ${String(actualFiles.length)} expected files\n`);
