/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WIX_ZIP = path.join(process.cwd(), 'wix314-binaries.zip');
const WIX_DIR = path.join(process.cwd(), 'tools', 'wix314');

function extractWix() {
  if (!fs.existsSync(WIX_ZIP)) {
    console.error(`WiX zip not found: ${WIX_ZIP}`);
    process.exit(1);
  }

  if (fs.existsSync(WIX_DIR)) {
    console.log(`WiX already extracted at ${WIX_DIR}`);
    return;
  }

  console.log(`Extracting WiX binaries to ${WIX_DIR}...`);
  fs.mkdirSync(WIX_DIR, { recursive: true });

  // Use PowerShell Expand-Archive (built into Windows)
  const psCommand = `Expand-Archive -Path "${WIX_ZIP}" -DestinationPath "${WIX_DIR}" -Force`;
  execSync(psCommand, { shell: 'powershell.exe', stdio: 'inherit' });

  console.log('WiX extraction complete.');
}

function setupWixPath() {
  // electron-wix-msi's detect-wix.js runs execSync('candle -?') which relies on PATH
  process.env.PATH = `${WIX_DIR};${process.env.PATH}`;
  console.log(`Added ${WIX_DIR} to PATH`);
}

function runMake() {
  console.log('Running electron-forge make...');
  const make = spawn('npx', ['electron-forge', 'make'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  make.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

extractWix();
setupWixPath();
runMake();
