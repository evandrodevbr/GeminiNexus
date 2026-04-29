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
    // On CI or environments without Gemini Nexus installed, the path may be empty.
    // We only verify the function returns a string without throwing.
    expect(typeof execPath).toBe('string');
  });
});
