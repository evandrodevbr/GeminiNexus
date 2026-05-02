import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getRecentTrafficLogs,
  getTrafficLogStats,
  exportTrafficLogs,
  getParityCounters,
  getCircuitBreakerStatus,
  getProxyMetrics,
  getRecentRequests,
  replayRequest,
  getModelCapabilities,
  generateIdeConfig,
} from '../../../ipc/proxy-advanced/handler';
import { TrafficLogsRepo } from '../../../ipc/database/proxyMetricsHandler';
import { proxyAdvancedRegistry } from '../../../ipc/proxy-advanced/service-registry';

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../ipc/database/proxyMetricsHandler', () => ({
  TrafficLogsRepo: {
    getRecent: vi.fn().mockReturnValue([]),
    getStats: vi.fn().mockReturnValue({ byDirection: {}, byEndpoint: {}, total: 0 }),
    getAllForExport: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('../../../ipc/database/cloudHandler', () => ({
  CloudAccountRepo: {
    getAccounts: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../ipc/proxy-advanced/service-registry', () => {
  const proxyAdvancedRegistry = {
    tokenManager: null,
    proxyMetrics: null,
    proxyReplay: null,
    proxyIdeConfig: null,
  };

  function getServiceOrThrow(key: string) {
    const service = (proxyAdvancedRegistry as Record<string, unknown>)[key];
    if (!service) {
      throw new Error(`ProxyAdvanced service '${key}' is not registered`);
    }
    return service;
  }

  function getServiceOptional(key: string) {
    return (proxyAdvancedRegistry as Record<string, unknown>)[key];
  }

  return {
    proxyAdvancedRegistry,
    getServiceOrThrow,
    getServiceOptional,
  };
});

describe('Proxy Advanced Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecentTrafficLogs', () => {
    it('should return empty logs when no records', async () => {
      const result = await getRecentTrafficLogs();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return parsed logs with default limit', async () => {
      vi.mocked(TrafficLogsRepo.getRecent).mockReturnValueOnce([
        {
          timestamp: Date.now(),
          direction: 'outbound',
          requestId: 'req-1',
          endpoint: '/v1/chat',
          method: 'POST',
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { message: 'hello' },
          durationMs: 120,
        },
      ]);

      const result = await getRecentTrafficLogs();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].direction).toBe('outbound');
      expect(result.data?.[0].endpoint).toBe('/v1/chat');
    });

    it('should filter by direction when provided', async () => {
      await getRecentTrafficLogs(10, 'inbound');
      expect(TrafficLogsRepo.getRecent).toHaveBeenCalledWith(10, 'inbound');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(TrafficLogsRepo.getRecent).mockImplementationOnce(() => {
        throw new Error('DB error');
      });
      const result = await getRecentTrafficLogs();
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('getTrafficLogStats', () => {
    it('should return stats from repo', async () => {
      vi.mocked(TrafficLogsRepo.getStats).mockReturnValueOnce({
        byDirection: { outbound: 5, inbound: 3 },
        byEndpoint: { '/v1/chat': 8 },
        total: 8,
      });

      const result = await getTrafficLogStats();
      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(8);
      expect(result.data?.byDirection.outbound).toBe(5);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(TrafficLogsRepo.getStats).mockImplementationOnce(() => {
        throw new Error('stats error');
      });
      const result = await getTrafficLogStats();
      expect(result.success).toBe(false);
      expect(result.error).toBe('stats error');
    });
  });

  describe('exportTrafficLogs', () => {
    it('should export as JSON', async () => {
      vi.mocked(TrafficLogsRepo.getAllForExport).mockReturnValueOnce([
        { timestamp: 1000, direction: 'outbound', requestId: 'r1', endpoint: '/chat' },
      ]);

      const result = await exportTrafficLogs('json');
      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data ?? '[]');
      expect(parsed).toHaveLength(1);
    });

    it('should export as CSV', async () => {
      vi.mocked(TrafficLogsRepo.getAllForExport).mockReturnValueOnce([
        {
          timestamp: 1000,
          direction: 'outbound',
          requestId: 'r1',
          endpoint: '/chat',
          method: 'POST',
          status: 200,
          durationMs: 50,
        },
      ]);

      const result = await exportTrafficLogs('csv');
      expect(result.success).toBe(true);
      expect(result.data).toContain(
        'timestamp,direction,requestId,endpoint,method,status,durationMs',
      );
      expect(result.data).toContain('outbound');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(TrafficLogsRepo.getAllForExport).mockImplementationOnce(() => {
        throw new Error('export error');
      });
      const result = await exportTrafficLogs('json');
      expect(result.success).toBe(false);
      expect(result.error).toBe('export error');
    });
  });

  describe('getParityCounters', () => {
    it('should return empty counters when tokenManager is null', async () => {
      const result = await getParityCounters();
      expect(result.success).toBe(true);
      expect(result.data?.totalRequests).toBe(0);
    });

    it('should return counters from tokenManager', async () => {
      vi.mocked(proxyAdvancedRegistry).tokenManager = {
        getParityCounters: vi.fn().mockReturnValue({
          totalRequests: 10,
          matchedRequests: 8,
          parityViolations: 2,
          lastUpdated: new Date().toISOString(),
        }),
      } as any;

      const result = await getParityCounters();
      expect(result.success).toBe(true);
      expect(result.data?.totalRequests).toBe(10);
      vi.mocked(proxyAdvancedRegistry).tokenManager = null;
    });
  });

  describe('getCircuitBreakerStatus', () => {
    it('should return empty status when tokenManager is null', async () => {
      const result = await getCircuitBreakerStatus();
      expect(result.success).toBe(true);
      expect(result.data?.states).toEqual({});
    });

    it('should return mapped status from tokenManager', async () => {
      vi.mocked(proxyAdvancedRegistry).tokenManager = {
        getCircuitBreakerStatus: vi.fn().mockReturnValue({
          acc1: { state: 'open', failureCount: 3, lastFailureTime: Date.now() },
        }),
      } as any;

      const result = await getCircuitBreakerStatus();
      expect(result.success).toBe(true);
      expect(result.data?.states.acc1.state).toBe('open');
      expect(result.data?.states.acc1.failures).toBe(3);
      vi.mocked(proxyAdvancedRegistry).tokenManager = null;
    });
  });

  describe('getProxyMetrics', () => {
    it('should return zero metrics when proxyMetrics is null', async () => {
      const result = await getProxyMetrics();
      expect(result.success).toBe(true);
      expect(result.data?.totalRequests).toBe(0);
    });

    it('should return metrics from proxyMetrics service', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyMetrics = {
        getMetrics: vi.fn().mockReturnValue({
          totalRequests: 100,
          activeConnections: 5,
          avgLatency: 120,
          errorRate: 0.02,
          requestsPerMinute: 10,
          cacheHitRate: 0.8,
        }),
      } as any;

      const result = await getProxyMetrics();
      expect(result.success).toBe(true);
      expect(result.data?.totalRequests).toBe(100);
      expect(result.data?.avgLatency).toBe(120);
      vi.mocked(proxyAdvancedRegistry).proxyMetrics = null;
    });
  });

  describe('getRecentRequests', () => {
    it('should return empty array when proxyReplay is null', async () => {
      const result = await getRecentRequests();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return recent requests from proxyReplay', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyReplay = {
        getRecentRequests: vi.fn().mockReturnValue([{ id: 'req-1' }]),
      } as any;

      const result = await getRecentRequests();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      vi.mocked(proxyAdvancedRegistry).proxyReplay = null;
    });
  });

  describe('replayRequest', () => {
    it('should return error when proxyReplay is null', async () => {
      const result = await replayRequest('req-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Proxy advanced service not initialized');
    });

    it('should replay request through proxyReplay', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyReplay = {
        replayRequest: vi.fn().mockResolvedValue({
          original: { id: 'req-1' },
          newResponse: { status: 200 },
        }),
      } as any;

      const result = await replayRequest('req-1');
      expect(result.success).toBe(true);
      expect(result.data?.original).toEqual({ id: 'req-1' });
      vi.mocked(proxyAdvancedRegistry).proxyReplay = null;
    });
  });

  describe('getModelCapabilities', () => {
    it('should return empty array when no accounts have quota', async () => {
      const { CloudAccountRepo } = await import('../../../ipc/database/cloudHandler');
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValueOnce([]);

      const result = await getModelCapabilities();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should aggregate unique models across accounts', async () => {
      const { CloudAccountRepo } = await import('../../../ipc/database/cloudHandler');
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValueOnce([
        {
          id: 'acc-1',
          provider: 'google',
          email: 'a@example.com',
          token: {} as any,
          quota: {
            models: {
              'gemini-pro': {
                percentage: 80,
                resetTime: new Date().toISOString(),
                display_name: 'Gemini Pro',
                supports_images: true,
                supports_thinking: false,
                recommended: true,
                max_tokens: 1000000,
                max_output_tokens: 8192,
              },
            },
          },
          created_at: Date.now(),
          last_used: Date.now(),
        },
        {
          id: 'acc-2',
          provider: 'google',
          email: 'b@example.com',
          token: {} as any,
          quota: {
            models: {
              'gemini-pro': {
                percentage: 60,
                resetTime: new Date().toISOString(),
                display_name: 'Gemini Pro Duplicate',
                supports_images: true,
                supports_thinking: false,
                recommended: true,
                max_tokens: 1000000,
                max_output_tokens: 8192,
              },
              'gemini-flash': {
                percentage: 90,
                resetTime: new Date().toISOString(),
                display_name: 'Gemini Flash',
                supports_images: true,
                supports_thinking: true,
                thinking_budget: 24000,
                recommended: false,
                max_tokens: 500000,
                max_output_tokens: 4096,
              },
            },
          },
          created_at: Date.now(),
          last_used: Date.now(),
        },
      ]);

      const result = await getModelCapabilities();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);

      const pro = result.data!.find((m) => m.id === 'gemini-pro');
      expect(pro).toBeDefined();
      expect(pro!.displayName).toBe('Gemini Pro');
      expect(pro!.capabilities.vision).toBe(true);
      expect(pro!.capabilities.thinking).toBe(false);
      expect(pro!.capabilities.streaming).toBe(true);
      expect(pro!.capabilities.jsonMode).toBe(true);
      expect(pro!.capabilities.recommended).toBe(true);
      expect(pro!.limits.maxTokens).toBe(1000000);
      expect(pro!.limits.maxOutputTokens).toBe(8192);

      const flash = result.data!.find((m) => m.id === 'gemini-flash');
      expect(flash).toBeDefined();
      expect(flash!.displayName).toBe('Gemini Flash');
      expect(flash!.capabilities.thinking).toBe(true);
      expect(flash!.limits.thinkingBudget).toBe(24000);
    });

    it('should handle accounts without quota gracefully', async () => {
      const { CloudAccountRepo } = await import('../../../ipc/database/cloudHandler');
      vi.mocked(CloudAccountRepo.getAccounts).mockResolvedValueOnce([
        {
          id: 'acc-1',
          provider: 'google',
          email: 'a@example.com',
          token: {} as any,
          created_at: Date.now(),
          last_used: Date.now(),
        },
      ]);

      const result = await getModelCapabilities();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle errors from CloudAccountRepo', async () => {
      const { CloudAccountRepo } = await import('../../../ipc/database/cloudHandler');
      vi.mocked(CloudAccountRepo.getAccounts).mockRejectedValueOnce(new Error('DB failure'));

      const result = await getModelCapabilities();
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB failure');
    });
  });

  describe('generateIdeConfig', () => {
    it('should generate fallback config when proxyIdeConfig is null', async () => {
      const result = await generateIdeConfig('vscode');
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('VS Code');
    });

    it('should return error for unsupported IDE', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = {} as any;
      const result = await generateIdeConfig('unknown-ide');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported IDE');
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = null;
    });

    it('should generate config for VS Code', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = {
        generateConfigForCurrentServer: vi.fn().mockReturnValue({
          ide: 'vscode',
          format: 'json',
          content: { 'openai.url': 'http://localhost:8045/v1', 'openai.apiKey': 'key' },
        }),
      } as any;

      const result = await generateIdeConfig('vscode');
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('VS Code');
      expect(result.data?.proxySetting).toBe('openai.url');
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = null;
    });

    it('should generate config for Cursor', async () => {
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = {
        generateConfigForCurrentServer: vi.fn().mockReturnValue({
          ide: 'cursor',
          format: 'json',
          content: { OPENAI_BASE_URL: 'http://localhost:8045/v1', OPENAI_API_KEY: 'key' },
        }),
      } as any;

      const result = await generateIdeConfig('cursor');
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Cursor');
      expect(result.data?.proxySetting).toBe('OPENAI_BASE_URL');
      vi.mocked(proxyAdvancedRegistry).proxyIdeConfig = null;
    });
  });
});
