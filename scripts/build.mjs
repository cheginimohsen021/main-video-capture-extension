const fs = await import('node:fs');
const path = await import('node:path');
const { execSync } = await import('node:child_process');

const root = process.cwd();
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'release');
const zipPath = path.join(releaseDir, 'main-video-capture-extension.zip');
const crxPath = path.join(releaseDir, 'main-video-capture-extension.crx');

fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(releaseDir, { recursive: true });

const staticFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'background.js',
  'content.js',
  'icon.svg'
];

for (const file of staticFiles) {
  const source = path.join(root, file);
  const target = path.join(distDir, file);
  fs.copyFileSync(source, target);
}

console.log('Built dist contents successfully.');
