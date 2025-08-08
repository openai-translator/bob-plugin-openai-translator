#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const infoPath = path.join(__dirname, '..', 'public', 'info.json');
const distPath = path.join(__dirname, '..', 'dist');

// Read and save original version
const originalInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
const originalVersion = originalInfo.version;

console.log(`Original version: ${originalVersion}`);

try {
  // Update version to 9.9.9
  const testInfo = { ...originalInfo, version: '9.9.9' };
  fs.writeFileSync(infoPath, JSON.stringify(testInfo, null, 2) + '\n');
  console.log('Version updated to 9.9.9 for testing');

  // Build the plugin
  console.log('Building plugin...');
  execSync('pnpm build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // Create test package
  console.log('Creating test package...');
  execSync('zip -j -r openai-translator-test.bobplugin ./*', {
    stdio: 'inherit',
    cwd: distPath
  });

  console.log('Test build complete!');
  
  // Open dist folder
  console.log('Opening dist folder...');
  execSync(`open ${distPath}`);

} finally {
  // Always restore original version
  const currentInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  currentInfo.version = originalVersion;
  fs.writeFileSync(infoPath, JSON.stringify(currentInfo, null, 2) + '\n');
  console.log(`Version restored to ${originalVersion}`);
}