import { readFile, writeFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VALID_RELEASE_TYPES = new Set(['patch', 'minor', 'major']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const releaseType = process.argv[2] ?? process.env.RELEASE_TYPE ?? 'patch';

if (!VALID_RELEASE_TYPES.has(releaseType)) {
  console.error(`Unsupported release type "${releaseType}". Use one of: ${Array.from(VALID_RELEASE_TYPES).join(', ')}`);
  process.exit(1);
}

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

const versionParts = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);

if (!versionParts) {
  console.error(`Unsupported version format "${currentVersion}". Expected x.y.z`);
  process.exit(1);
}

let [major, minor, patch] = versionParts.slice(1).map(Number);

if (releaseType === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (releaseType === 'minor') {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const nextVersion = `${major}.${minor}.${patch}`;
packageJson.version = nextVersion;

await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `previous_version=${currentVersion}\nnext_version=${nextVersion}\ntag=v${nextVersion}\n`,
  );
}

console.log(`Version bumped: ${currentVersion} -> ${nextVersion}`);
