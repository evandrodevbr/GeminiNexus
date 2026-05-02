import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server/main module
vi.mock('../../server/main', () => ({
  isNestServerRunning: vi.fn(),
  stopNestServer: vi.fn(),
  bootstrapNestServer: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock ConfigManager
vi.mock('../../ipc/config/manager', () => ({
  ConfigManager: {
    loadConfig: vi.fn(),
  },
}));

// Import after mocks are set up
import { isProcessRunning, closeGeminiNexus, startGeminiNexus } from '../../ipc/process/handler';
import { isNestServerRunning, stopNestServer, bootstrapNestServer } from '../../server/main';
import { ConfigManager } from '../../ipc/config/manager';

describe('Process Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isProcessRunning', () => {
    it('should return true when NestJS server is running', async () => {
      vi.mocked(isNestServerRunning).mockReturnValue(true);

      const result = await isProcessRunning();
      expect(result).toBe(true);
      expect(isNestServerRunning).toHaveBeenCalled();
    });

    it('should return false when NestJS server is not running', async () => {
      vi.mocked(isNestServerRunning).mockReturnValue(false);

      const result = await isProcessRunning();
      expect(result).toBe(false);
      expect(isNestServerRunning).toHaveBeenCalled();
    });
  });

  describe('closeGeminiNexus', () => {
    it('should stop the NestJS server', async () => {
      vi.mocked(stopNestServer).mockResolvedValue(true);

      await closeGeminiNexus();
      expect(stopNestServer).toHaveBeenCalled();
    });
  });

  describe('startGeminiNexus', () => {
    it('should start the NestJS server when not running and proxy config exists', async () => {
      vi.mocked(isNestServerRunning).mockReturnValue(false);
      vi.mocked(ConfigManager.loadConfig).mockReturnValue({
        proxy: { port: 8045, enabled: true },
      } as any);
      vi.mocked(bootstrapNestServer).mockResolvedValue(true);

      await startGeminiNexus();
      expect(bootstrapNestServer).toHaveBeenCalledWith({ port: 8045, enabled: true });
    });

    it('should not start the server if already running', async () => {
      vi.mocked(isNestServerRunning).mockReturnValue(true);

      await startGeminiNexus();
      expect(bootstrapNestServer).not.toHaveBeenCalled();
    });

    it('should throw if proxy configuration is missing', async () => {
      vi.mocked(isNestServerRunning).mockReturnValue(false);
      vi.mocked(ConfigManager.loadConfig).mockReturnValue({} as any);

      await expect(startGeminiNexus()).rejects.toThrow('Proxy configuration not found');
    });
  });

  describe('Module exports', () => {
    it('should export all required functions', () => {
      expect(isProcessRunning).toBeDefined();
      expect(closeGeminiNexus).toBeDefined();
      expect(startGeminiNexus).toBeDefined();
    });
  });
});
