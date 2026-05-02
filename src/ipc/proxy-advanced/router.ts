import { z } from 'zod';
import { os } from '@orpc/server';
import {
  getRecentTrafficLogs,
  getTrafficLogStats,
  exportTrafficLogs,
  getParityCounters,
  getCircuitBreakerStatus,
  getProxyMetrics,
  getRecentRequests,
  generateIdeConfig,
  replayRequest,
  getModelCapabilities,
} from './handler';

const TrafficLogEntrySchema = z.object({
  timestamp: z.string(),
  direction: z.string(),
  requestId: z.string(),
  endpoint: z.string(),
  method: z.string().optional(),
  status: z.number().optional(),
  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.unknown().optional(),
  chunk: z.unknown().optional(),
  durationMs: z.number().optional(),
  error: z
    .object({
      message: z.string(),
      stack: z.string().optional(),
      status: z.number().optional(),
      body: z.unknown().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const TrafficLogsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TrafficLogEntrySchema).optional(),
  error: z.string().optional(),
});

const TrafficLogStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      byDirection: z.record(z.string(), z.number()),
      byEndpoint: z.record(z.string(), z.number()),
      total: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});

const ExportTrafficLogsResponseSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(),
  error: z.string().optional(),
});

const ParityCountersResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      totalRequests: z.number(),
      matchedRequests: z.number(),
      parityViolations: z.number(),
      lastUpdated: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

const CircuitBreakerStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      states: z.record(
        z.string(),
        z.object({
          state: z.string(),
          failures: z.number(),
          lastFailure: z.string().nullable(),
        }),
      ),
      globalEnabled: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

const ProxyMetricsResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      uptimeSeconds: z.number(),
      totalRequests: z.number(),
      activeConnections: z.number(),
      avgLatency: z.number(),
      errorRate: z.number(),
      requestsPerMinute: z.number(),
      cacheHitRate: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});

const RecentRequestsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.unknown()).optional(),
  error: z.string().optional(),
});

const ReplayRequestResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      original: z.unknown(),
      newResponse: z.unknown(),
    })
    .optional(),
  error: z.string().optional(),
});

const ModelCapabilitiesResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.string(),
        object: z.string(),
        displayName: z.string().optional(),
        capabilities: z.object({
          vision: z.boolean(),
          thinking: z.boolean(),
          streaming: z.boolean(),
          jsonMode: z.boolean(),
          recommended: z.boolean(),
        }),
        limits: z.object({
          maxTokens: z.number().optional(),
          maxOutputTokens: z.number().optional(),
          thinkingBudget: z.number().optional(),
        }),
      }),
    )
    .optional(),
  error: z.string().optional(),
});

const IdeConfigResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      name: z.string(),
      settingsPath: z.string(),
      proxySetting: z.string().optional(),
      apiKeySetting: z.string().optional(),
      instructions: z.string().optional(),
      format: z.enum(['json', 'shell', 'env', 'instructions']).optional(),
      content: z.union([z.record(z.string(), z.unknown()), z.string()]).optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const proxyAdvancedRouter = os.router({
  getRecentTrafficLogs: os
    .input(
      z.object({
        limit: z.number().int().min(1).max(1000).optional(),
        direction: z.string().optional(),
      }),
    )
    .output(TrafficLogsResponseSchema)
    .handler(async ({ input }) => {
      return getRecentTrafficLogs(input.limit, input.direction);
    }),

  getTrafficLogStats: os.output(TrafficLogStatsResponseSchema).handler(async () => {
    return getTrafficLogStats();
  }),

  exportTrafficLogs: os
    .input(z.object({ format: z.enum(['json', 'csv']) }))
    .output(ExportTrafficLogsResponseSchema)
    .handler(async ({ input }) => {
      return exportTrafficLogs(input.format);
    }),

  getParityCounters: os.output(ParityCountersResponseSchema).handler(async () => {
    return getParityCounters();
  }),

  getCircuitBreakerStatus: os.output(CircuitBreakerStatusResponseSchema).handler(async () => {
    return getCircuitBreakerStatus();
  }),

  getProxyMetrics: os.output(ProxyMetricsResponseSchema).handler(async () => {
    return getProxyMetrics();
  }),

  getRecentRequests: os.output(RecentRequestsResponseSchema).handler(async () => {
    return getRecentRequests();
  }),

  generateIdeConfig: os
    .input(z.object({ ide: z.string(), defaultModel: z.string().optional() }))
    .output(IdeConfigResponseSchema)
    .handler(async ({ input }) => {
      return generateIdeConfig(input.ide, input.defaultModel);
    }),

  replayRequest: os
    .input(z.object({ requestId: z.string() }))
    .output(ReplayRequestResponseSchema)
    .handler(async ({ input }) => {
      return replayRequest(input.requestId);
    }),

  getModelCapabilities: os.output(ModelCapabilitiesResponseSchema).handler(async () => {
    return getModelCapabilities();
  }),
});
