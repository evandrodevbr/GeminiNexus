import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenUsageRepo } from '../../ipc/database/usageHandler';

const mockRun = vi.fn();
const mockAll = vi.fn();
const mockPrepare = vi.fn(() => ({ all: mockAll, run: mockRun }));
const mockClose = vi.fn();
const mockInsert = vi.fn(() => ({
  values: vi.fn(() => ({ run: mockRun })),
}));

vi.mock('../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: vi.fn(() => ({
    raw: {
      prepare: mockPrepare,
      close: mockClose,
    },
    orm: {
      insert: mockInsert,
    },
  })),
}));

vi.mock('../../ipc/database/cloudHandler', () => ({
  ensureDatabaseInitialized: vi.fn(),
}));

vi.mock('../../utils/paths', () => ({
  IS_DEV_ENVIRONMENT: false,
  getCloudAccountsDbPath: vi.fn(() => '/mock/db/path.sqlite'),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('TokenUsageRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should insert usage record into database', () => {
      const params = {
        accountId: 'acc-1',
        model: 'gemini-pro',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        timestamp: Date.now(),
        requestType: 'chat',
      };

      TokenUsageRepo.recordUsage(params);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });

    it('should handle null requestType', () => {
      const params = {
        accountId: 'acc-1',
        model: 'gemini-pro',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        timestamp: Date.now(),
      };

      TokenUsageRepo.recordUsage(params);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('getUsageByHour', () => {
    it('should return hourly aggregated data', () => {
      mockAll.mockReturnValue([
        {
          bucket: '2024-01-01 10:00',
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
          requests: 5,
        },
      ]);

      const result = TokenUsageRepo.getUsageByHour('acc-1', 1704110400000, 1704114000000);

      expect(mockPrepare).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].bucket).toBe('2024-01-01 10:00');
      expect(result[0].totalTokens).toBe(300);
    });

    it('should return empty array on error', () => {
      mockPrepare.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = TokenUsageRepo.getUsageByHour();

      expect(result).toEqual([]);
    });
  });

  describe('getUsageByDay', () => {
    it('should return daily aggregated data', () => {
      mockAll.mockReturnValue([
        {
          bucket: '2024-01-01',
          promptTokens: 1000,
          completionTokens: 2000,
          totalTokens: 3000,
          requests: 50,
        },
      ]);

      const result = TokenUsageRepo.getUsageByDay();

      expect(mockPrepare).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].bucket).toBe('2024-01-01');
    });
  });

  describe('getUsageByWeek', () => {
    it('should return weekly aggregated data', () => {
      mockAll.mockReturnValue([
        {
          bucket: '2024-01',
          promptTokens: 5000,
          completionTokens: 10000,
          totalTokens: 15000,
          requests: 200,
        },
      ]);

      const result = TokenUsageRepo.getUsageByWeek();

      expect(result).toHaveLength(1);
    });
  });

  describe('getUsageByMonth', () => {
    it('should return monthly aggregated data', () => {
      mockAll.mockReturnValue([
        {
          bucket: '2024-01',
          promptTokens: 20000,
          completionTokens: 40000,
          totalTokens: 60000,
          requests: 1000,
        },
      ]);

      const result = TokenUsageRepo.getUsageByMonth();

      expect(result).toHaveLength(1);
    });
  });

  describe('getUsageByModel', () => {
    it('should return model aggregated data', () => {
      mockAll.mockReturnValue([
        {
          model: 'gemini-pro',
          promptTokens: 10000,
          completionTokens: 20000,
          totalTokens: 30000,
          requests: 500,
        },
        {
          model: 'claude-sonnet',
          promptTokens: 5000,
          completionTokens: 10000,
          totalTokens: 15000,
          requests: 250,
        },
      ]);

      const result = TokenUsageRepo.getUsageByModel();

      expect(result).toHaveLength(2);
      expect(result[0].model).toBe('gemini-pro');
    });
  });
});
