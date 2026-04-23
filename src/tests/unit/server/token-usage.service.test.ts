import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenUsageService } from '@/server/modules/usage/token-usage.service';
import { TokenUsageRepo } from '@/ipc/database/usageHandler';

vi.mock('@/ipc/database/usageHandler', () => ({
  TokenUsageRepo: {
    recordUsage: vi.fn(),
    getUsageByHour: vi.fn().mockReturnValue([]),
    getUsageByDay: vi.fn().mockReturnValue([]),
    getUsageByWeek: vi.fn().mockReturnValue([]),
    getUsageByMonth: vi.fn().mockReturnValue([]),
    getUsageByModel: vi.fn().mockReturnValue([]),
  },
}));

describe('TokenUsageService', () => {
  let service: TokenUsageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TokenUsageService();
  });

  describe('recordUsage', () => {
    it('should validate and record usage asynchronously', async () => {
      const params = {
        accountId: 'acc-1',
        model: 'gemini-pro',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        timestamp: Date.now(),
      };

      service.recordUsage(params);

      // Wait for setImmediate
      await new Promise((resolve) => setImmediate(resolve));

      expect(TokenUsageRepo.recordUsage).toHaveBeenCalledWith(params);
    });

    it('should throw ZodError for invalid input', () => {
      const invalidParams = {
        accountId: '',
        model: 'gemini-pro',
        promptTokens: -1,
        completionTokens: 50,
        totalTokens: 150,
        timestamp: Date.now(),
      };

      expect(() => service.recordUsage(invalidParams as any)).toThrow();
    });

    it('should silently ignore repo errors to not block proxy', async () => {
      vi.mocked(TokenUsageRepo.recordUsage).mockImplementation(() => {
        throw new Error('DB down');
      });

      const params = {
        accountId: 'acc-1',
        model: 'gemini-pro',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        timestamp: Date.now(),
      };

      service.recordUsage(params);

      // Should not throw
      await new Promise((resolve) => setImmediate(resolve));
      expect(TokenUsageRepo.recordUsage).toHaveBeenCalled();
    });

    it('should accept optional requestType and isEstimated fields', async () => {
      const params = {
        accountId: 'acc-1',
        model: 'gemini-pro',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        timestamp: Date.now(),
        requestType: 'openai' as const,
        isEstimated: false,
      };

      service.recordUsage(params);
      await new Promise((resolve) => setImmediate(resolve));

      expect(TokenUsageRepo.recordUsage).toHaveBeenCalledWith(params);
    });
  });

  describe('aggregation queries', () => {
    it('should delegate getUsageByHour to repo', () => {
      service.getUsageByHour('acc-1', 1000, 2000);
      expect(TokenUsageRepo.getUsageByHour).toHaveBeenCalledWith('acc-1', 1000, 2000);
    });

    it('should delegate getUsageByDay to repo', () => {
      service.getUsageByDay('acc-1', 1000, 2000);
      expect(TokenUsageRepo.getUsageByDay).toHaveBeenCalledWith('acc-1', 1000, 2000);
    });

    it('should delegate getUsageByWeek to repo', () => {
      service.getUsageByWeek('acc-1', 1000, 2000);
      expect(TokenUsageRepo.getUsageByWeek).toHaveBeenCalledWith('acc-1', 1000, 2000);
    });

    it('should delegate getUsageByMonth to repo', () => {
      service.getUsageByMonth('acc-1', 1000, 2000);
      expect(TokenUsageRepo.getUsageByMonth).toHaveBeenCalledWith('acc-1', 1000, 2000);
    });

    it('should delegate getUsageByModel to repo', () => {
      service.getUsageByModel('acc-1', 1000, 2000);
      expect(TokenUsageRepo.getUsageByModel).toHaveBeenCalledWith('acc-1', 1000, 2000);
    });

    it('should pass undefined params when not provided', () => {
      service.getUsageByHour();
      expect(TokenUsageRepo.getUsageByHour).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });
});
