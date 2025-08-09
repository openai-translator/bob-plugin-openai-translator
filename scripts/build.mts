#!/usr/bin/env bun

import path from 'node:path';
import { $ } from 'bun';

const rootDir = path.resolve(import.meta.dir, '..');
const srcDir = path.resolve(rootDir, 'src');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');

async function build() {
  console.log('Building plugin...');

  // Clean dist directory
  await $`rm -rf ${distDir}`;
  await $`mkdir -p ${distDir}`;

  // Build TypeScript to CommonJS (Bob requires CommonJS)
  await Bun.build({
    entrypoints: [path.join(srcDir, 'main.ts')],
    outdir: distDir,
    target: 'node',
    format: 'cjs',
    naming: '[name].js',
    external: ['crypto'],
  });

  // Copy public files to dist
  console.log('Copying public files...');
  const glob = new Bun.Glob('*');
  for await (const file of glob.scan({ cwd: publicDir })) {
    const sourcePath = path.resolve(publicDir, file);
    const destPath = path.resolve(distDir, file);

    const sourceFile = Bun.file(sourcePath);
    await Bun.write(destPath, sourceFile);
  }

  console.log('Build complete!');
}

await build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
