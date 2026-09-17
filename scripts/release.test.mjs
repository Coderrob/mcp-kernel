import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { nextVersion, prepareRelease, versionChangelog } from './release.mjs';

const DATE = '2026-09-17';
const CLI_PATH = fileURLToPath(new URL('./prepare-release.mjs', import.meta.url));
const CHANGELOG = `# Changelog

## [Unreleased]

### Added

- New feature.

## [1.2.3] - 2026-08-01

- Previous change.

[Unreleased]: https://github.com/Coderrob/mcp-kernel/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/Coderrob/mcp-kernel/releases/tag/v1.2.3
`;

describe('release preparation', () => {
  it.each([[], ['revision', 'extra']])('should reject invalid CLI argument counts %#', (...args) => {
    const result = spawnSync(process.execPath, [CLI_PATH, ...args], { encoding: 'utf8', timeout: 10_000 });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Usage: yarn release:prepare');
  });

  it.each([
    ['major', '2.0.0'],
    ['minor', '1.3.0'],
    ['revision', '1.2.4'],
  ])('should increment the %s version component', (bump, expected) => {
    expect(nextVersion('1.2.3', bump)).toBe(expected);
  });

  it.each(['patch', 'invalid', '__proto__', undefined])('should reject unsupported release type %s', (bump) => {
    expect(() => nextVersion('1.2.3', bump)).toThrow('Choose major, minor, or revision');
  });

  it.each(['1.2', '01.2.3', '1.2.3-beta.1', '9007199254740992.0.0'])('should reject invalid version %s', (version) => {
    expect(() => nextVersion(version, 'revision')).toThrow();
  });

  it('should reject version component overflow', () => {
    expect(() => nextVersion('9007199254740991.0.0', 'major')).toThrow('safe integer range');
  });

  it('should assign notes, retain prior history, and update version links', () => {
    const result = versionChangelog(CHANGELOG.replace(/\n/g, '\r\n'), '1.2.3', '1.3.0', DATE);
    expect(result).toContain('## [Unreleased]\n\n## [1.3.0] - 2026-09-17\n\n### Added\n\n- New feature.');
    expect(result).toContain('## [1.2.3] - 2026-08-01\n\n- Previous change.');
    expect(result).toContain('[Unreleased]: https://github.com/Coderrob/mcp-kernel/compare/v1.3.0...HEAD');
    expect(result).toContain('[1.3.0]: https://github.com/Coderrob/mcp-kernel/compare/v1.2.3...v1.3.0');
    expect(result).not.toContain('\r');
    expect(() => versionChangelog(result, '1.3.0', '1.3.1', DATE)).toThrow('change entry');
  });

  it('should handle a changelog without earlier release headings', () => {
    const source = CHANGELOG.replace('## [1.2.3] - 2026-08-01\n\n- Previous change.\n\n', '');
    expect(versionChangelog(source, '1.2.3', '1.2.4', DATE)).toContain('## [1.2.4] - 2026-09-17');
  });

  it('should preserve replacement-like dollar sequences in release notes', () => {
    const note = "- Preserve $&, $`, and $' literally.";
    const source = CHANGELOG.replace('- New feature.', () => note);
    const result = versionChangelog(source, '1.2.3', '1.3.0', DATE);
    expect(result).toContain(note);
    expect(result.match(/## \[Unreleased\]/g)).toHaveLength(1);
  });

  it.each([
    [CHANGELOG.replace('## [Unreleased]', '## [Draft]'), 'exactly one'],
    [`## [Unreleased]\n${CHANGELOG}`, 'exactly one'],
    ['## [Unreleased]', 'release notes'],
    [CHANGELOG.replace('- New feature.', ''), 'change entry'],
    [CHANGELOG.replace('## [1.2.3]', '## [1.3.0]'), 'already exists'],
    [CHANGELOG.replace('v1.2.3...HEAD', 'v0.0.0...HEAD'), 'comparison link'],
  ])('should reject malformed changelog %#', (source, message) => {
    expect(() => versionChangelog(source, '1.2.3', '1.3.0', DATE)).toThrow(message);
  });

  it('should reject malformed release dates', () => {
    expect(() => versionChangelog(CHANGELOG, '1.2.3', '1.3.0', 'today')).toThrow('release date');
  });

  it('should validate before writing and preserve package metadata', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mcp-kernel-release-'));
    const packagePath = join(directory, 'package.json');
    const changelogPath = join(directory, 'CHANGELOG.md');
    const metadata = { name: 'fixture', version: '1.2.3', private: true };
    try {
      await writeFile(packagePath, JSON.stringify(metadata));
      await writeFile(changelogPath, CHANGELOG);
      await expect(prepareRelease(directory, 'invalid')).rejects.toThrow();
      expect(JSON.parse(await readFile(packagePath, 'utf8'))).toEqual(metadata);
      expect(await readFile(changelogPath, 'utf8')).toBe(CHANGELOG);
      expect(await prepareRelease(directory, 'revision', DATE)).toBe('1.2.4');
      expect(JSON.parse(await readFile(packagePath, 'utf8'))).toEqual({ ...metadata, version: '1.2.4' });
      expect(await readFile(changelogPath, 'utf8')).toContain('## [1.2.4] - 2026-09-17');
      const releasedPackage = await readFile(packagePath, 'utf8');
      await expect(prepareRelease(directory, 'minor')).rejects.toThrow('change entry');
      expect(await readFile(packagePath, 'utf8')).toBe(releasedPackage);
      await writeFile(packagePath, JSON.stringify(metadata));
      await writeFile(changelogPath, CHANGELOG);
      const result = spawnSync(process.execPath, [CLI_PATH, 'minor'], {
        cwd: directory,
        encoding: 'utf8',
        timeout: 10_000,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Prepared release 1.3.0');
      expect(JSON.parse(await readFile(packagePath, 'utf8')).version).toBe('1.3.0');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
