/** Release version and changelog preparation shared by the CLI and its tests. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const RELEASE_COMPONENTS = { major: 0, minor: 1, revision: 2 };
const UNRELEASED_HEADING = '## [Unreleased]';
const COMPARE_URL = 'https://github.com/Coderrob/mcp-kernel/compare';

/**
 * Increments a stable semantic version, treating revision as a patch release.
 * @param version - Current package version.
 * @param bump - Major, minor, or revision.
 * @returns The next stable version.
 */
export function nextVersion(version, bump) {
  assert.match(version, VERSION_PATTERN, 'Expected a stable major.minor.patch package version');
  assert.ok(Object.hasOwn(RELEASE_COMPONENTS, bump), 'Choose major, minor, or revision');
  const components = version.split('.').map(Number);
  assert.ok(components.every(Number.isSafeInteger), 'Version components must be safe integers');
  const component = RELEASE_COMPONENTS[bump];
  components[component] += 1;
  assert.ok(Number.isSafeInteger(components[component]), 'Version increment exceeds the safe integer range');
  return components
    .map(/** Resets less significant version components. */ (value, index) => (index > component ? 0 : value))
    .join('.');
}

/**
 * Finds the release notes while rejecting missing, duplicate, or empty sections.
 * @param source - Normalized changelog text.
 * @returns The complete unreleased section and its note text.
 */
function unreleasedSection(source) {
  const headings = source.match(/^## \[Unreleased\]$/gm);
  assert.equal(headings?.length, 1, 'Expected exactly one Unreleased changelog section');
  const section = source.match(/^## \[Unreleased\]\n([\s\S]*?)(?=^## \[|^\[Unreleased\]:|(?![\s\S]))/m);
  assert.ok(section, 'Unreleased section must contain release notes');
  assert.match(section[1], /^[-*] \S/m, 'Unreleased section must contain a change entry');
  return section;
}

/**
 * Assigns the unreleased notes to a version and starts a fresh Unreleased section.
 * @param changelog - Existing changelog text.
 * @param current - Current package version.
 * @param next - Version being prepared.
 * @param date - UTC release date in YYYY-MM-DD form.
 * @returns Updated changelog with preserved history and comparison links.
 */
export function versionChangelog(changelog, current, next, date) {
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD release date');
  const source = changelog.replace(/\r\n/g, '\n');
  const section = unreleasedSection(source);
  assert.ok(!source.includes(`## [${next}]`), 'The release version already exists in the changelog');
  const reference = `[Unreleased]: ${COMPARE_URL}/v${current}...HEAD`;
  assert.ok(source.includes(reference), 'Unreleased comparison link must match the current package version');
  const released = `${UNRELEASED_HEADING}\n\n## [${next}] - ${date}\n\n${section[1].trim()}\n\n`;
  return source
    .replace(section[0], /** Preserves literal dollar sequences in release notes. */ () => released)
    .replace(
      reference,
      `[Unreleased]: ${COMPARE_URL}/v${next}...HEAD\n[${next}]: ${COMPARE_URL}/v${current}...v${next}`
    );
}

/**
 * Validates both release files before changing either one.
 * @param directory - Repository directory containing the package and changelog.
 * @param bump - Major, minor, or revision.
 * @param date - UTC release date, defaulting to today.
 * @returns The prepared package version.
 */
export async function prepareRelease(directory, bump, date = new Date().toISOString().slice(0, 10)) {
  const packagePath = join(directory, 'package.json');
  const changelogPath = join(directory, 'CHANGELOG.md');
  const [packageText, changelog] = await Promise.all([readFile(packagePath, 'utf8'), readFile(changelogPath, 'utf8')]);
  const metadata = JSON.parse(packageText);
  const version = nextVersion(metadata.version, bump);
  const updatedChangelog = versionChangelog(changelog, metadata.version, version, date);
  const updatedPackage = `${JSON.stringify({ ...metadata, version }, null, 2)}\n`;
  await writeFile(packagePath, updatedPackage);
  await writeFile(changelogPath, updatedChangelog);
  return version;
}
