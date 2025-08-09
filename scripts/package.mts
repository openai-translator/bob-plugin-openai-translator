#!/usr/bin/env bun

import path from 'node:path';
import { $ } from 'bun';

interface VersionInfo {
  version: string;
  desc: string;
  sha256: string;
  url: string;
  minBobVersion: string;
}

interface Appcast {
  identifier: string;
  versions: VersionInfo[];
}

const rootDir = path.resolve(import.meta.dir, '..');
const distDir = path.resolve(rootDir, 'dist');

/**
 * Build the plugin
 */
async function build() {
  console.log('Building plugin...');
  await $`bun run build`.cwd(rootDir);
}

/**
 * Package the plugin into a .bobplugin file
 */
async function packagePlugin(version: string): Promise<string> {
  const packageName = `openai-translator-${version}.bobplugin`;
  const packagePath = path.join(distDir, packageName);

  console.log(`Creating package: ${packageName}...`);
  await $`zip -j -r ${packageName} ./*`.cwd(distDir);

  return packagePath;
}

/**
 * Update appcast.json with new version information
 */
async function updateAppcast(
  version: string,
  desc: string,
  packagePath: string,
): Promise<void> {
  // Check if release file exists
  const packageFile = Bun.file(packagePath);
  const exists = await packageFile.exists();

  if (!exists) {
    throw new Error(`Release file does not exist: ${packagePath}`);
  }

  // Calculate SHA256 hash
  const fileContent = await packageFile.arrayBuffer();
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(fileContent);
  const fileHash = hasher.digest('hex');

  const versionInfo: VersionInfo = {
    version: version,
    desc: desc,
    sha256: fileHash,
    url: `https://github.com/openai-translator/bob-plugin-openai-translator/releases/download/v${version}/openai-translator-${version}.bobplugin`,
    minBobVersion: '1.8.0',
  };

  // Read or create appcast
  const appcastPath = path.resolve(rootDir, 'appcast.json');
  const appcastFile = Bun.file(appcastPath);
  let appcast: Appcast;

  if (await appcastFile.exists()) {
    const content = await appcastFile.text();
    appcast = JSON.parse(content);
  } else {
    appcast = {
      identifier: 'yetone.openai.translator',
      versions: [],
    };
  }

  // Insert new version at the beginning
  appcast.versions.unshift(versionInfo);

  // Write appcast file
  await Bun.write(appcastPath, JSON.stringify(appcast, null, 2));

  console.log(`Appcast updated for version ${version}`);
}

if (import.meta.main) {
  const command = process.argv[2];

  switch (command) {
    case 'release': {
      // Build, package, and update appcast for release
      const version = process.argv[3];
      const desc = process.argv[4];

      if (!version || !desc) {
        console.error('Usage: bun release <version> <desc>');
        process.exit(1);
      }

      try {
        await build();
        const packagePath = await packagePlugin(version);
        await updateAppcast(version, desc, packagePath);
        console.log(`Release package created: ${packagePath}`);
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
      break;
    }
    default:
      // Build, package for development, and open folder (default behavior)
      try {
        await build();
        const packagePath = await packagePlugin('dev');
        console.log(`Development package created: ${packagePath}`);
        await $`open ${distDir}`;
      } catch (error) {
        console.error('Error:', (error as Error).message);
        process.exit(1);
      }
      break;
  }
}
