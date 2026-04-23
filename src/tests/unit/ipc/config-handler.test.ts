import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, saveConfig } from '../../../ipc/config/handlers';
import { ConfigManager } from '../../../ipc/config/manager';
import { syncAutoStart } from '../../../utils/autoStart';
import { setServerConfig } from '../../../server/server-config';
import { logger } from '../../../utils/logger';
import { DEFAULT_APP_CONFIG } from '../../../types/config';

vi.mock('../../../ipc/config/manager', () => ({
  ConfigManager: {
    loadConfig: vi.fn(),
    getCachedConfig: vi.fn(),
    saveConfig: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../utils/autoStart', () => ({
  syncAutoStart: vi.fn(),
}));

vi.mock('../../../server/server-config', () => ({
  setServerConfig: vi.fn(),
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    setErrorReportingEnabled: vi.fn(),
  },
}));

describe('Config Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ConfigManager.loadConfig).mockReturnValue(DEFAULT_APP_CONFIG);
    vi.mocked(ConfigManager.getCachedConfig).mockReturnValue(null);
  });

  describe('loadConfig', () => {
    it('should return config from ConfigManager', () => {
      const config = loadConfig();
      expect(config).toEqual(DEFAULT_APP_CONFIG);
      expect(ConfigManager.loadConfig).toHaveBeenCalled();
    });
  });

  describe('saveConfig', () => {
    it('should save config through ConfigManager', async () => {
      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        language: 'en-US',
      };
      await saveConfig(newConfig);
      expect(ConfigManager.saveConfig).toHaveBeenCalledWith(newConfig);
    });

    it('should update server config after save', async () => {
      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        proxy: { ...DEFAULT_APP_CONFIG.proxy, port: 9999 },
      };
      await saveConfig(newConfig);
      expect(setServerConfig).toHaveBeenCalledWith(newConfig.proxy);
    });

    it('should enable error reporting when config has it enabled', async () => {
      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        error_reporting_enabled: true,
      };
      await saveConfig(newConfig);
      expect(logger.setErrorReportingEnabled).toHaveBeenCalledWith(true);
    });

    it('should sync auto start when auto_startup changes from false to true', async () => {
      vi.mocked(ConfigManager.getCachedConfig).mockReturnValueOnce({
        ...DEFAULT_APP_CONFIG,
        auto_startup: false,
      });

      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        auto_startup: true,
      };
      await saveConfig(newConfig);
      expect(syncAutoStart).toHaveBeenCalledWith(newConfig);
    });

    it('should not sync auto start when auto_startup unchanged', async () => {
      vi.mocked(ConfigManager.getCachedConfig).mockReturnValueOnce({
        ...DEFAULT_APP_CONFIG,
        auto_startup: true,
      });

      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        auto_startup: true,
      };
      await saveConfig(newConfig);
      expect(syncAutoStart).not.toHaveBeenCalled();
    });

    it('should handle nested proxy settings correctly', async () => {
      const newConfig = {
        ...DEFAULT_APP_CONFIG,
        proxy: {
          ...DEFAULT_APP_CONFIG.proxy,
          enabled: true,
          upstream_proxy: {
            enabled: true,
            url: 'http://proxy.example.com:8080',
          },
        },
      };
      await saveConfig(newConfig);
      expect(ConfigManager.saveConfig).toHaveBeenCalledWith(newConfig);
      expect(setServerConfig).toHaveBeenCalledWith(newConfig.proxy);
    });
  });
});
