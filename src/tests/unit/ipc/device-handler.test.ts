import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateDeviceProfile,
  applyDeviceProfile,
  readCurrentDeviceProfile,
} from '../../../ipc/device/handler';
import { getGeminiNexusStoragePaths } from '../../../utils/paths';
import fs from 'fs';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    copyFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmSync: vi.fn(),
    renameSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  renameSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock('os', () => ({
  default: {
    homedir: vi.fn().mockReturnValue('/home/test'),
    userInfo: vi.fn().mockReturnValue({ username: 'test' }),
  },
  homedir: vi.fn().mockReturnValue('/home/test'),
  userInfo: vi.fn().mockReturnValue({ username: 'test' }),
}));

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp'),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../utils/paths', () => ({
  getGeminiNexusStoragePaths: vi.fn().mockReturnValue(['/tmp/storage.json']),
  getGeminiNexusDbPaths: vi.fn().mockReturnValue(['/tmp/state.vscdb']),
  getAgentDir: vi.fn().mockReturnValue('/tmp/agent'),
}));

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    pragma: vi.fn(),
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
    }),
    close: vi.fn(),
  })),
}));

describe('Device Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGeminiNexusStoragePaths).mockReturnValue(['/tmp/storage.json']);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (String(path).includes('storage.json')) {
        return JSON.stringify({
          telemetry: {
            machineId: 'auth0|user_abc123',
            macMachineId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            devDeviceId: '11111111-2222-3333-4444-555555555555',
            sqmId: '{AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE}',
          },
        });
      }
      return '';
    });
  });

  describe('generateDeviceProfile', () => {
    it('should return a device profile with expected keys', () => {
      const profile = generateDeviceProfile();
      expect(profile).toHaveProperty('machineId');
      expect(profile).toHaveProperty('macMachineId');
      expect(profile).toHaveProperty('devDeviceId');
      expect(profile).toHaveProperty('sqmId');
      expect(profile.machineId).toMatch(/^auth0\|user_[0-9a-f]{32}$/);
      expect(profile.macMachineId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(profile.devDeviceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(profile.sqmId).toMatch(
        /^\{[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}\}$/,
      );
      expect(profile.macMachineId).not.toBe(profile.devDeviceId);
    });
  });

  describe('applyDeviceProfile', () => {
    it('should throw when storage.json is not found', () => {
      vi.mocked(getGeminiNexusStoragePaths).mockReturnValueOnce([]);
      const profile = generateDeviceProfile();
      expect(() => applyDeviceProfile(profile)).toThrow('storage_json_not_found');
    });
  });

  describe('readCurrentDeviceProfile', () => {
    it('should read current profile from storage.json', () => {
      const profile = readCurrentDeviceProfile();
      expect(profile.machineId).toBe('auth0|user_abc123');
      expect(profile.macMachineId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
      expect(profile.devDeviceId).toBe('11111111-2222-3333-4444-555555555555');
      expect(profile.sqmId).toBe('{AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE}');
    });

    it('should throw when device fingerprint fields are missing', () => {
      vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({ telemetry: {} }));
      expect(() => readCurrentDeviceProfile()).toThrow('missing_device_fingerprint_fields');
    });
  });
});
