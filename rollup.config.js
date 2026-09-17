/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 */
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';

import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const packageMetadata = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const dependencyNames = [
  ...Object.keys(packageMetadata.dependencies ?? {}),
  ...Object.keys(packageMetadata.peerDependencies ?? {}),
];
const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map(/** Adds the canonical Node.js protocol prefix. */ (name) => `node:${name}`),
]);

/**
 * Leaves runtime dependencies for the consuming application to resolve.
 * @param id - Module identifier supplied by Rollup.
 * @returns Whether the module must remain external.
 */
function external(id) {
  return (
    nodeBuiltins.has(id) ||
    dependencyNames.some(
      /** Matches a dependency root or one of its exported subpaths. */ (name) =>
        id === name || id.startsWith(`${name}/`)
    )
  );
}

export default [
  {
    input: 'src/index.ts',
    external,
    treeshake: { moduleSideEffects: false },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
      }),
      terser({ format: { comments: false } }),
    ],
    output: [
      { file: 'dist/index.mjs', format: 'es', sourcemap: true },
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'named' },
    ],
  },
  {
    input: 'src/index.ts',
    external,
    plugins: [dts()],
    output: { file: 'dist/index.d.ts', format: 'es' },
  },
];
