/**
 * Cross-platform development environment setup for Gemini Nexus.
 *
 * Detects and installs native build toolchains required by better-sqlite3,
 * keytar, and other native Node.js modules used in this Electron project.
 *
 * Platforms:
 *   - Windows  → Visual Studio 2022 Build Tools (C++ workload)
 *   - macOS    → Xcode Command Line Tools
 *   - Ubuntu   → build-essential, python3, libsecret-1-dev
 *   - Manjaro/Arch → base-devel, python, libsecret
 *
 * Usage:
 *   node scripts/setup-dev.js        # auto-detect and install/guide
 *   node scripts/setup-dev.js --check-only   # only verify, don't install
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ─── Terminal Color Helpers ─────────────────────────────────────────────────

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

// Disable colors if NO_COLOR is set or output is piped
const useColor = process.env.NO_COLOR === undefined && process.stdout.isTTY;

function color(code, text) {
  return useColor ? `${code}${text}${RESET}` : text;
}

function header(text) {
  console.log(
    `\n${color(BOLD + MAGENTA, '══')} ${color(BOLD, text)} ${color(BOLD + MAGENTA, '══')}`,
  );
}

function success(text) {
  console.log(`  ${color(GREEN, '✓')} ${text}`);
}

function warn(text) {
  console.log(`  ${color(YELLOW, '⚠')} ${text}`);
}

function error(text) {
  console.log(`  ${color(RED, '✗')} ${text}`);
}

function info(text) {
  console.log(`  ${color(CYAN, '→')} ${text}`);
}

function dim(text) {
  console.log(`    ${color(DIM, text)}`);
}

function section(title) {
  console.log(`\n  ${color(BOLD, title)}:`);
}

// ─── Platform Detection ─────────────────────────────────────────────────────

const platform = os.platform(); // 'win32' | 'darwin' | 'linux'
const arch = os.arch();

/** Detect Linux distribution from os-release */
function detectLinuxDistro() {
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    const idMatch = osRelease.match(/^ID="?([^"\n]+)"?/m);
    const idLikeMatch = osRelease.match(/^ID_LIKE="?([^"\n]+)"?/m);

    const id = idMatch ? idMatch[1].toLowerCase() : '';
    const idLike = idLikeMatch ? idLikeMatch[1].toLowerCase() : '';

    if (id === 'ubuntu' || id === 'debian' || idLike.includes('debian')) {
      return 'debian';
    }
    if (id === 'arch' || id === 'manjaro' || idLike.includes('arch')) {
      return 'arch';
    }
    if (id === 'fedora' || idLike.includes('fedora') || idLike.includes('rhel')) {
      return 'fedora';
    }
    return id || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─── Tool Checkers ──────────────────────────────────────────────────────────

/** Check if a command exists on PATH */
function commandExists(cmd) {
  try {
    const whereCmd = platform === 'win32' ? 'where' : 'which';
    execSync(`${whereCmd} "${cmd}"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Check if running with administrator/sudo privileges */
function hasAdminPrivileges() {
  if (platform === 'win32') {
    try {
      // On Windows, check via net session (requires admin)
      execSync('net session', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  // On Unix, check if UID is 0
  return process.getuid ? process.getuid() === 0 : false;
}

/** Check Windows: Visual Studio Build Tools */
function checkWindows() {
  const results = { ok: true, missing: [] };

  // Check for cl.exe (C++ compiler from VS Build Tools)
  if (commandExists('cl.exe')) {
    success('MSVC Compiler (cl.exe) found');
  } else {
    // Try to find VS installation via vswhere or registry
    let vsFound = false;

    // vswhere.exe (shipped with VS 2017+)
    const vswherePaths = [
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe',
      'C:\\Program Files\\Microsoft Visual Studio\\Installer\\vswhere.exe',
    ];

    for (const vswhere of vswherePaths) {
      try {
        const output = execSync(
          `"${vswhere}" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`,
          {
            stdio: ['ignore', 'pipe', 'ignore'],
            encoding: 'utf8',
          },
        ).trim();

        if (output) {
          vsFound = true;
          success(`Visual Studio found at: ${output}`);
          break;
        }
      } catch {
        // vswhere not found, continue
      }
    }

    // Check registry fallback
    if (!vsFound) {
      try {
        execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\SxS\\VS7" /v 17.0', {
          stdio: 'ignore',
        });
        vsFound = true;
        success('Visual Studio 2022 found (registry)');
      } catch {
        // Not found in registry either
      }
    }

    if (!vsFound) {
      error('MSVC Build Tools not found');
      results.ok = false;
      results.missing.push('msvc');
    }
  }

  // Check Python (needed by node-gyp)
  if (commandExists('python') || commandExists('python3')) {
    success('Python found');
  } else {
    error('Python not found (required by node-gyp)');
    results.ok = false;
    results.missing.push('python');
  }

  return results;
}

/** Check macOS: Xcode Command Line Tools */
function checkMacOS() {
  const results = { ok: true, missing: [] };

  try {
    const xcodePath = execSync('xcode-select -p', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    if (xcodePath) {
      success(`Xcode CLT found at: ${xcodePath}`);
    }
  } catch {
    error('Xcode Command Line Tools not found');
    results.ok = false;
    results.missing.push('xcode-clt');
  }

  if (commandExists('make') || commandExists('gmake')) {
    success('make found');
  } else {
    error('make not found');
    results.ok = false;
    results.missing.push('make');
  }

  return results;
}

/** Check Linux: build-essential, python3, libsecret */
function checkLinux() {
  const results = { ok: true, missing: [] };
  const distro = detectLinuxDistro();

  section(`Linux Distribution Detected: ${distro || 'unknown'}`);

  // gcc / g++
  if (commandExists('gcc') || commandExists('cc')) {
    success('C compiler found');
  } else {
    error('C compiler not found');
    results.ok = false;
    results.missing.push('compiler');
  }

  if (commandExists('g++') || commandExists('c++')) {
    success('C++ compiler found');
  } else {
    error('C++ compiler not found');
    results.ok = false;
    results.missing.push('compiler');
  }

  // make
  if (commandExists('make')) {
    success('make found');
  } else {
    error('make not found');
    results.ok = false;
    results.missing.push('make');
  }

  // Python 3
  if (commandExists('python3')) {
    success('Python 3 found');
  } else if (commandExists('python')) {
    // Check if python is python3
    try {
      const ver = execSync('python --version', { encoding: 'utf8' });
      if (ver.includes('3.')) {
        success('Python 3 found (as python)');
      } else {
        error('Python 3 not found (python is v2)');
        results.ok = false;
        results.missing.push('python3');
      }
    } catch {
      error('Python not found');
      results.ok = false;
      results.missing.push('python3');
    }
  } else {
    error('Python 3 not found');
    results.ok = false;
    results.missing.push('python3');
  }

  // libsecret (needed by keytar)
  try {
    if (distro === 'debian') {
      execSync('dpkg -s libsecret-1-dev', { stdio: 'ignore' });
      success('libsecret-1-dev found');
    } else if (distro === 'arch') {
      execSync('pacman -Qi libsecret', { stdio: 'ignore' });
      success('libsecret found');
    } else {
      // Check for pkg-config
      try {
        execSync('pkg-config --exists libsecret-1', { stdio: 'ignore' });
        success('libsecret (pkg-config) found');
      } catch {
        warn('libsecret not detected (may not be needed if using prebuilt keytar)');
      }
    }
  } catch {
    warn('libsecret not detected (may not be needed if using prebuilt keytar)');
  }

  return results;
}

// ─── Installation Helpers ───────────────────────────────────────────────────

/** Run a command and stream output, return exit code */
function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    console.log(`\n  ${color(CYAN, 'Running:')} ${color(DIM, `${cmd} ${args.join(' ')}`)}`);

    const child = spawnSync(cmd, args, {
      stdio: 'inherit',
      shell: platform === 'win32',
      ...opts,
    });

    resolve(child.status);
  });
}

/** Install Windows: Visual Studio 2022 Build Tools via winget */
async function installWindows() {
  // Check if winget is available
  if (!commandExists('winget')) {
    console.log('');
    console.log(
      color(RED, '  winget not found. Please install Visual Studio Build Tools manually:'),
    );
    console.log(
      color(
        CYAN,
        '  https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
      ),
    );
    console.log('');
    console.log('  During installation, select:');
    console.log(color(BOLD, '    "Desktop development with C++" workload'));
    console.log('');
    console.log('  Or install via PowerShell (as Administrator):');
    console.log(
      color(
        DIM,
        '    winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"',
      ),
    );
    return false;
  }

  console.log('');
  info('Attempting automatic installation of Visual Studio 2022 Build Tools...');
  dim('This may take several minutes and requires administrator privileges.');
  console.log('');

  if (!hasAdminPrivileges()) {
    warn('Not running as Administrator. winget may prompt for elevation.');
  }

  const status = await runCommand('winget', [
    'install',
    'Microsoft.VisualStudio.2022.BuildTools',
    '--override',
    '"--quiet --wait --norestart --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows11SDK.22621 --includeRecommended"',
  ]);

  if (status === 0) {
    success('Visual Studio 2022 Build Tools installed successfully.');
    console.log('');
    warn('You may need to restart your terminal for PATH changes to take effect.');
    return true;
  }

  error('Automatic installation failed. Please install manually.');
  return false;
}

/** Install macOS: Xcode Command Line Tools */
async function installMacOS() {
  console.log('');
  info('Installing Xcode Command Line Tools...');
  dim('A GUI dialog will appear. Click "Install" to proceed.');

  const status = await runCommand('xcode-select', ['--install']);

  // xcode-select --install returns 1 if already installed or cancelled
  if (status === 0) {
    success('Xcode Command Line Tools installation initiated.');
    return true;
  }

  // Check if already installed (common false-negative)
  try {
    execSync('xcode-select -p', { stdio: 'ignore' });
    success('Xcode Command Line Tools are already installed.');
    return true;
  } catch {
    warn('Xcode CLT installation was cancelled or failed.');
    warn('You can install manually via: xcode-select --install');
    return false;
  }
}

/** Install Linux: distribution-specific packages */
async function installLinux() {
  const distro = detectLinuxDistro();

  if (distro === 'debian') {
    // Ubuntu / Debian
    if (!hasAdminPrivileges()) {
      warn('Root privileges required. You may be prompted for your password.');
    }

    const status = await runCommand('sudo', [
      'apt-get',
      'install',
      '-y',
      'build-essential',
      'python3',
      'libsecret-1-dev',
      'pkg-config',
    ]);

    if (status === 0) {
      success('Build dependencies installed successfully.');
      return true;
    }

    error('Failed to install build dependencies.');
    return false;
  }

  if (distro === 'arch') {
    // Manjaro / Arch
    if (!hasAdminPrivileges()) {
      warn('Root privileges required. You may be prompted for your password.');
    }

    const status = await runCommand('sudo', [
      'pacman',
      '-S',
      '--needed',
      '--noconfirm',
      'base-devel',
      'python',
      'libsecret',
      'pkg-config',
    ]);

    if (status === 0) {
      success('Build dependencies installed successfully.');
      return true;
    }

    error('Failed to install build dependencies.');
    return false;
  }

  if (distro === 'fedora') {
    if (!hasAdminPrivileges()) {
      warn('Root privileges required. You may be prompted for your password.');
    }

    const status = await runCommand('sudo', [
      'dnf',
      'install',
      '-y',
      'gcc-c++',
      'make',
      'python3',
      'libsecret-devel',
      'pkg-config',
    ]);

    if (status === 0) {
      success('Build dependencies installed successfully.');
      return true;
    }

    error('Failed to install build dependencies.');
    return false;
  }

  // Unknown distro - provide generic instructions
  console.log('');
  warn(`Unknown Linux distribution: ${distro}`);
  console.log('');
  console.log('  You need the following packages to compile native Node.js modules:');
  console.log('    - C/C++ compiler (gcc, g++)');
  console.log('    - GNU Make');
  console.log('    - Python 3');
  console.log('    - libsecret development headers (for keytar)');
  console.log('    - pkg-config');
  console.log('');
  console.log(
    '  Install them using your distribution package manager, then run npm install again.',
  );
  return false;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only') || args.includes('--check');

  console.log('');
  console.log(color(BOLD + CYAN, '┌──────────────────────────────────────────┐'));
  console.log(color(BOLD + CYAN, '│  Gemini Nexus - Dev Environment Setup    │'));
  console.log(color(BOLD + CYAN, '└──────────────────────────────────────────┘'));
  console.log('');
  dim(`Platform: ${platform} (${arch})`);
  dim(`Node.js:  ${process.version}`);

  // Step 1: Check current state
  header('Checking Build Toolchain');

  let results;
  switch (platform) {
    case 'win32':
      results = checkWindows();
      break;
    case 'darwin':
      results = checkMacOS();
      break;
    case 'linux':
      results = checkLinux();
      break;
    default:
      console.log('');
      error(`Unsupported platform: ${platform}`);
      process.exit(1);
  }

  // Print summary
  console.log('');
  if (results.ok) {
    success('All build tools are present and ready.');
    console.log('');
    dim('You can now run: npm install && npm start');
    return;
  }

  // ── Missing tools ──
  console.log('');
  error(
    'Some build tools are missing. Native modules like better-sqlite3 and keytar require compilation.',
  );

  if (checkOnly) {
    console.log('');
    warn('Build tools are missing. Native modules (better-sqlite3, keytar) require compilation.');
    warn('Run "npm run setup" to install them automatically, or install manually:');
    printManualInstructions(platform, results.missing);
    console.log('');
    dim(
      'npm install succeeded, but npm start / electron-rebuild will fail until build tools are installed.',
    );
    // Don't exit with error - allow npm install to succeed (prebuilt binaries may work)
    return;
  }

  // Step 2: Attempt installation
  header('Installing Build Dependencies');

  let installed = false;
  switch (platform) {
    case 'win32':
      installed = await installWindows();
      break;
    case 'darwin':
      installed = await installMacOS();
      break;
    case 'linux':
      installed = await installLinux();
      break;
  }

  // Step 3: Final status
  console.log('');
  if (installed) {
    success('Setup complete. You can now run: npm install && npm start');
    console.log('');
    dim('If you encounter issues, restart your terminal and try again.');
  } else {
    console.log('');
    warn('Automatic installation was not successful.');
    warn('Please install the required tools manually, then run npm install again.');
    printManualInstructions(platform, results.missing);
    process.exit(1);
  }
}

function printManualInstructions(platform, missing) {
  console.log('');
  console.log(color(BOLD, '  ── Manual Installation Instructions ──'));
  console.log('');

  switch (platform) {
    case 'win32':
      console.log('  1. Download Visual Studio 2022 Build Tools:');
      console.log(
        color(
          CYAN,
          '     https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
        ),
      );
      console.log('');
      console.log('  2. Run the installer and select:');
      console.log(color(BOLD, '     "Desktop development with C++"'));
      console.log('');
      console.log('  3. Or install via PowerShell (as Administrator):');
      console.log(
        color(
          DIM,
          '     winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"',
        ),
      );
      console.log('');
      console.log('  4. Restart your terminal after installation.');
      break;

    case 'darwin':
      console.log('  Run this command in your terminal:');
      console.log(color(DIM, '    xcode-select --install'));
      console.log('');
      console.log('  Then click "Install" in the dialog that appears.');
      break;

    case 'linux': {
      const distro = detectLinuxDistro();
      if (distro === 'debian') {
        console.log('  Run:');
        console.log(
          color(
            DIM,
            '    sudo apt-get install -y build-essential python3 libsecret-1-dev pkg-config',
          ),
        );
      } else if (distro === 'arch') {
        console.log('  Run:');
        console.log(
          color(DIM, '    sudo pacman -S --needed base-devel python libsecret pkg-config'),
        );
      } else if (distro === 'fedora') {
        console.log('  Run:');
        console.log(
          color(DIM, '    sudo dnf install -y gcc-c++ make python3 libsecret-devel pkg-config'),
        );
      } else {
        console.log('  Install: C/C++ compiler, make, python3, libsecret-dev, pkg-config');
      }
      break;
    }
  }

  console.log('');
}

// ─── Run ────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(color(RED, `\nUnexpected error: ${err.message}`));
  process.exit(1);
});
