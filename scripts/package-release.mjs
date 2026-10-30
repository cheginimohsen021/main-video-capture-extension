import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const releaseDir = path.join(root, 'release');
const zipPath = path.join(releaseDir, 'main-video-capture-extension.zip');
const crxPath = path.join(releaseDir, 'main-video-capture-extension.crx');
const keyPath = path.join(releaseDir, 'key.pem');

fs.mkdirSync(releaseDir, { recursive: true });

function ensureDist() {
  if (!fs.existsSync(distDir)) {
    throw new Error('Build output folder not found. Run npm run build first.');
  }
}

function packageZip() {
  ensureDist();
  const zip = new (await import('adm-zip')).default();
  zip.addLocalFolder(distDir, '/');
  zip.writeZip(zipPath);
  console.log(`Created ZIP: ${zipPath}`);
}

async function packageCrx() {
  ensureDist();

  if (!fs.existsSync(keyPath)) {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(keyPath, privateKey);
    console.log(`Generated key: ${keyPath}`);
  }

  try {
    execSync(
      `npx crx3 --content ${distDir} --key ${keyPath} --output ${crxPath}`,
      { stdio: 'inherit' }
    );
    console.log(`Created CRX: ${crxPath}`);
  } catch (error) {
    console.warn('CRX generation via crx3 failed; falling back to ZIP copy with .crx extension.');
    fs.copyFileSync(zipPath, crxPath);
  }
}

const mode = process.argv[2] || 'all';
if (mode === 'zip') {
  await packageZip();
} else if (mode === 'crx') {
  await packageZip();
  await packageCrx();
} else {
  await packageZip();
  await packageCrx();
}
