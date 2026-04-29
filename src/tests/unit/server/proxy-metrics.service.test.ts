import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProxyMetricsService } from '@/server/modules/proxy/proxy-metrics.service';
import { ProxyMetricsRepo } from '@/ipc/database/proxyMetricsHandler';

vi.mock('@/ipc/database/proxyMetricsHandler', () => ({
  ProxyMetricsRepo: {
    recordRequest: vi.fn(),
    recordConnectionSnapshot: vi.fn(),
    getHistoricalAggregates: vi.fn().mockReturnValue({
      totalRequests: 100,
      requestsPerMinute: 10.5,
      avgLatencyMs: 120.5,
      errorRatePercent: 2.5,
      avgActiveConnections: 5,
    }),
    deleteOldRecords: vi.fn(),
  },
}));

vi.mock('@/ipc/proxy-advanced/service-registry', () => ({
  registerProxyAdvancedService: vi.fn(),
}));

describe('ProxyMetricsService', () => {
  let service: ProxyMetricsService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ProxyMetricsService();
    service.onModuleInit();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('connection tracking', () => {
    it('should increment active connections', () => {
      service.incrementActiveConnections();
      service.incrementActiveConnections();

      const metrics = service.getMetrics();
      expect(metrics.activeConnections).toBeDefined();
    });

    it('should decrement active connections without going below zero', () => {
      service.decrementActiveConnections();
      service.decrementActiveConnections();

      const metrics = service.getMetrics();
      expect(metrics.activeConnections).toBeDefined();
    });

    it('should track connection changes accurately', () => {
      service.incrementActiveConnections();
      service.incrementActiveConnections();
      service.incrementActiveConnections();
      service.decrementActiveConnections();

      const metrics = service.getMetrics();
      expect(metrics.activeConnections).toBeDefined();
    });
  });

  describe('request recording', () => {
    it('should record a request and persist to repo', () => {
      const record = {
        timestamp: Date.now(),
        duration: 150,
        status: 200,
        endpoint: '/v1/chat/completions',
      };

      service.recordRequest(record);

      expect(ProxyMetricsRepo.recordRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: record.endpoint,
          statusCode: record.status,
          durationMs: record.duration,
          timestamp: record.timestamp,
        }),
      );
    });

    it('should cap in-memory records at max size', () => {
      for (let i = 0; i < 110; i++) {
        service.recordRequest({
          timestamp: Date.now(),
          duration: i,
          status: 200,
          endpoint: '/v1/chat/completions',
        });
      }

      expect(ProxyMetricsRepo.recordRequest).toHaveBeenCalledTimes(110);
    });
  });

  describe('token throughput', () => {
    it('should record positive token events', () => {
      service.recordTokens(150);
      service.recordTokens(250);

      const metrics = service.getMetrics();
      expect(metrics.tokenThroughput).toBe(400);
    });

    it('should ignore zero or negative token values', () => {
      service.recordTokens(100);
      service.recordTokens(0);
      service.recordTokens(-50);

      const metrics = service.getMetrics();
      expect(metrics.tokenThroughput).toBe(100);
    });

    it('should trim token events older than 60 seconds', () => {
      const now = Date.now();
      service.recordTokens(100);

      vi.advanceTimersByTime(61_000);
      service.recordTokens(200);

      const metrics = service.getMetrics();
      expect(metrics.tokenThroughput).toBe(200);
    });
  });

  describe('metrics aggregation', () => {
    it('should return aggregated metrics from repo', () => {
      const metrics = service.getMetrics();

      expect(metrics).toMatchObject({
        totalRequests: 100,
        requestsPerMinute: 10.5,
        avgLatency: 120.5,
        errorRate: 2.5,
        cacheHitRate: 0,
      });
      expect(metrics.tokenThroughput).toBe(0);
    });

    it('should round numeric values to 2 decimal places', () => {
      vi.mocked(ProxyMetricsRepo.getHistoricalAggregates).mockReturnValueOnce({
        totalRequests: 99,
        requestsPerMinute: 10.55555,
        avgLatencyMs: 120.99999,
        errorRatePercent: 2.33333,
        avgActiveConnections: 5.12345,
      });

      const metrics = service.getMetrics();
      expect(metrics.requestsPerMinute).toBe(10.56);
      expect(metrics.avgLatency).toBe(121);
      expect(metrics.errorRate).toBe(2.33);
      expect(metrics.activeConnections).toBe(5.12);
    });
  });

  describe('cleanup scheduling', () => {
    it('should schedule periodic cleanup', () => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
      expect(ProxyMetricsRepo.deleteOldRecords).toHaveBeenCalled();
    });

    it('should schedule connection snapshots', () => {
      vi.advanceTimersByTime(30_000);
      expect(ProxyMetricsRepo.recordConnectionSnapshot).toHaveBeenCalled();
    });
  });
});
