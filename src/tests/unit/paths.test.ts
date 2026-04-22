import { describe, it, expect } from 'vitest';
import {
  getAppDataDir,
  getGeminiNexusDbPath,
  getGeminiNexusStoragePath,
  getGeminiNexusExecutablePath,
} from '../../utils/paths';

describe('Path Utilities', () => {
  it('should get correct AppData directory', () => {
    const appData = getAppDataDir();
    expect(appData).toBeDefined();
    expect(appData.length).toBeGreaterThan(0);
  });

  it('should get correct DB path', () => {
    const dbPath = getGeminiNexusDbPath();
    expect(dbPath).toContain('state.vscdb');
  });

  it('should get correct storage path', () => {
    const storagePath = getGeminiNexusStoragePath();
    expect(storagePath).toContain('storage.json');
  });

  it('should get correct executable path', () => {
    const execPath = getGeminiNexusExecutablePath();
    if (process.platform === 'linux') {
      expect(execPath).toBe('/usr/share/geminiNexus/geminiNexus');
    } else if (process.platform === 'darwin') {
      expect(execPath).toBe('/Applications/GeminiNexus.app/Contents/MacOS/GeminiNexus');
    }
    // Windows path depends on env vars, harder to test strictly without mocking
  });
});
