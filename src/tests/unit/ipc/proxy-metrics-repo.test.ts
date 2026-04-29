import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProxyMetricsRepo } from '../../../ipc/database/proxyMetricsHandler';

const mockRun = vi.fn();
const mockAll = vi.fn();
const mockGet = vi.fn();
const mockClose = vi.fn();
const mockPrepare = vi.fn(() => ({ run: mockRun, all: mockAll, get: mockGet }));

const mockOrm = {
  insert: vi.fn(() => ({
    values: vi.fn(() => ({ run: mockRun })),
  })),
};

vi.mock('../../../ipc/database/dbConnection', () => ({
  openDrizzleConnection: vi.fn(() => ({
    raw: { prepare: mockPrepare, close: mockClose, exec: vi.fn() },
    orm: mockOrm,
  })),
}));

vi.mock('../../../ipc/database/cloudHandler', () => ({
  ensureDatabaseInitialized: vi.fn(),
}));

vi.mock('../../../utils/paths', () => ({
  getCloudAccountsDbPath: vi.fn(() => '/mock/db/path.sqlite'),
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ProxyMetricsRepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordRequest (record)', () => {
    it('should insert proxy request metrics into the database', () => {
      const params = {
        endpoint: '/v1/chat',
        statusCode: 200,
        durationMs: 150,
        timestamp: Date.now(),
        accountId: 'acc-1',
        tokensPrompt: 10,
        tokensCompletion: 20,
        errorMessage: null,
      };

      const result = ProxyMetricsRepo.recordRequest(params);

      expect(result).toBe(true);
      expect(mockOrm.insert).toHaveBeenCalled();
      expect(mockRun).toHaveBeenCalled();
    });

    it('should return false when recording fails', () => {
      mockRun.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = ProxyMetricsRepo.recordRequest({
        endpoint: '/v1/chat',
        statusCode: 500,
        durationMs: 100,
        timestamp: Date.now(),
      });

      expect(result).toBe(false);
    });
  });

  describe('getRecentAggregates (getRecent)', () => {
    it('should return time-filtered aggregate metrics', () => {
      mockGet
        .mockReturnValueOnce({ count: 5 })
        .mockReturnValueOnce({ total: 10, avgLatency: 120, errorRate: 10 });

      const result = ProxyMetricsRepo.getRecentAggregates();

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(result.requestsPerMinute).toBe(5);
      expect(result.avgLatencyMs).toBe(120);
      expect(result.errorRatePercent).toBe(10);
    });

    it('should return zeros when no recent data exists', () => {
      mockGet.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);

      const result = ProxyMetricsRepo.getRecentAggregates();

      expect(result.requestsPerMinute).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.errorRatePercent).toBe(0);
    });
  });

  describe('getHistoricalAggregates (getAggregate)', () => {
    it('should return summary aggregates for the given window', () => {
      mockGet
        .mockReturnValueOnce({ total: 100, avgLatency: 200, errorRate: 5 })
        .mockReturnValueOnce({ avg: 12 });

      const result = ProxyMetricsRepo.getHistoricalAggregates();

      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(result.totalRequests).toBe(100);
      expect(result.avgLatencyMs).toBe(200);
      expect(result.errorRatePercent).toBe(5);
      expect(result.avgActiveConnections).toBe(12);
    });

    it('should return zeros when an error occurs', () => {
      mockPrepare.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = ProxyMetricsRepo.getHistoricalAggregates();

      expect(result.totalRequests).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.errorRatePercent).toBe(0);
      expect(result.avgActiveConnections).toBe(0);
    });
  });

  describe('deleteOldRecords (cleanup)', () => {
    it('should remove old records from metrics and snapshots tables', () => {
      const result = ProxyMetricsRepo.deleteOldRecords(Date.now() - 86400000);

      expect(result).toBe(true);
      expect(mockPrepare).toHaveBeenCalledTimes(2);
      expect(mockRun).toHaveBeenCalledTimes(2);
    });

    it('should return false when cleanup fails', () => {
      mockRun.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const result = ProxyMetricsRepo.deleteOldRecords(0);

      expect(result).toBe(false);
    });
  });
});
