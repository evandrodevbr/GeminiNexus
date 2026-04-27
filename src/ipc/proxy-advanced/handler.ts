import { logger } from '../../utils/logger';
import { getServiceOrThrow } from './service-registry';
import type { IdeConfigResult } from '../../server/modules/proxy/proxy-ide-config.service';
import { TrafficLogsRepo } from '../database/proxyMetricsHandler';
import { CloudAccountRepo } from '../database/cloudHandler';

export interface TrafficLogEntryParsed {
  timestamp: string;
  direction: string;
  requestId: string;
  endpoint: string;
  method?: string;
  status?: number;
  headers?: Record<string, unknown>;
  body?: unknown;
  chunk?: unknown;
  durationMs?: number;
  error?: {
    message: string;
    stack?: string;
    status?: number;
    body?: unknown;
  };
  metadata?: Record<string, unknown>;
}

function normalizeServiceError(error: unknown): string {
  if (error instanceof Error && error.message.includes('is not registered')) {
    return 'Proxy advanced service not initialized';
  }
  return error instanceof Error ? error.message : String(error);
}

export async function getRecentTrafficLogs(
  limit: number = 50,
  direction?: string,
): Promise<{ success: boolean; data?: TrafficLogEntryParsed[]; error?: string }> {
  try {
    const rows = TrafficLogsRepo.getRecent(limit, direction);
    const entries: TrafficLogEntryParsed[] = rows.map((r) => ({
      timestamp: new Date(r.timestamp).toISOString(),
      direction: r.direction,
      requestId: r.requestId,
      endpoint: r.endpoint,
      method: r.method,
      status: r.status,
      headers: r.headers,
      body: r.body,
      chunk: r.chunk,
      durationMs: r.durationMs,
      error: r.error,
      metadata: r.metadata,
    }));

    return { success: true, data: entries };
  } catch (error) {
    logger.error('Failed to get recent traffic logs', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTrafficLogStats(): Promise<{
  success: boolean;
  data?: { byDirection: Record<string, number>; byEndpoint: Record<string, number>; total: number };
  error?: string;
}> {
  try {
    const stats = TrafficLogsRepo.getStats();
    return { success: true, data: stats };
  } catch (error) {
    logger.error('Failed to get traffic log stats', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function exportTrafficLogs(
  format: 'json' | 'csv',
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const rows = TrafficLogsRepo.getAllForExport();

    if (format === 'json') {
      return { success: true, data: JSON.stringify(rows, null, 2) };
    }

    // CSV format
    const headers = ['timestamp', 'direction', 'requestId', 'endpoint', 'method', 'status', 'durationMs'];
    const rowsCsv = rows.map((e) =>
      [
        new Date(e.timestamp).toISOString(),
        e.direction,
        e.requestId,
        e.endpoint,
        e.method || '',
        e.status != null ? e.status : '',
        e.durationMs != null ? e.durationMs : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );

    return { success: true, data: [headers.join(','), ...rowsCsv].join('\n') };
  } catch (error) {
    logger.error('Failed to export traffic logs', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getParityCounters(): Promise<{
  success: boolean;
  data?: { totalRequests: number; matchedRequests: number; parityViolations: number; lastUpdated: string };
  error?: string;
}> {
  try {
    const tokenManager = getServiceOrThrow('tokenManager');
    return {
      success: true,
      data: tokenManager.getParityCounters(),
    };
  } catch (error) {
    return { success: false, error: normalizeServiceError(error) };
  }
}

export async function getCircuitBreakerStatus(): Promise<{
  success: boolean;
  data?: { states: Record<string, { state: string; failures: number; lastFailure: string | null }>; globalEnabled: boolean };
  error?: string;
}> {
  try {
    const tokenManager = getServiceOrThrow('tokenManager');

    const rawStatus = tokenManager.getCircuitBreakerStatus();
    const states: Record<string, { state: string; failures: number; lastFailure: string | null }> = {};
    for (const [accountId, entry] of Object.entries(rawStatus)) {
      states[accountId] = {
        state: entry.state,
        failures: entry.failureCount,
        lastFailure: entry.lastFailureTime ? new Date(entry.lastFailureTime).toISOString() : null,
      };
    }

    return {
      success: true,
      data: {
        states,
        globalEnabled: true,
      },
    };
  } catch (error) {
    return { success: false, error: normalizeServiceError(error) };
  }
}

export async function getProxyMetrics(): Promise<{
  success: boolean;
    data?: {
    uptimeSeconds: number;
    totalRequests: number;
    activeConnections: number;
    avgLatency: number;
    errorRate: number;
    requestsPerMinute: number;
    cacheHitRate: number;
  };
  error?: string;
}> {
  try {
    const proxyMetrics = getServiceOrThrow('proxyMetrics');

    const metrics = proxyMetrics.getMetrics();
    return {
      success: true,
      data: {
        uptimeSeconds: Math.floor(process.uptime()),
        totalRequests: metrics.totalRequests,
        activeConnections: metrics.activeConnections,
        avgLatency: metrics.avgLatency,
        errorRate: metrics.errorRate,
        requestsPerMinute: metrics.requestsPerMinute,
        cacheHitRate: metrics.cacheHitRate,
      },
    };
  } catch (error) {
    logger.error('Failed to get proxy metrics', error);
    return { success: false, error: normalizeServiceError(error) };
  }
}

export async function getRecentRequests(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const proxyReplay = getServiceOrThrow('proxyReplay');
    return {
      success: true,
      data: proxyReplay.getRecentRequests(20),
    };
  } catch (error) {
    return { success: false, error: normalizeServiceError(error) };
  }
}

export async function replayRequest(
  requestId: string,
): Promise<{ success: boolean; data?: { original: unknown; newResponse: unknown }; error?: string }> {
  try {
    const proxyReplay = getServiceOrThrow('proxyReplay');
    const result = await proxyReplay.replayRequest(requestId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: normalizeServiceError(error) };
  }
}

export interface ModelCapabilityEntry {
  id: string;
  object: string;
  displayName?: string;
  capabilities: {
    vision: boolean;
    thinking: boolean;
    streaming: boolean;
    jsonMode: boolean;
    recommended: boolean;
  };
  limits: {
    maxTokens?: number;
    maxOutputTokens?: number;
    thinkingBudget?: number;
  };
}

export async function getModelCapabilities(): Promise<{
  success: boolean;
  data?: ModelCapabilityEntry[];
  error?: string;
}> {
  try {
    const accounts = await CloudAccountRepo.getAccounts();

    const modelMap = new Map<string, ModelCapabilityEntry>();

    for (const account of accounts) {
      if (!account.quota || !account.quota.models) {
        continue;
      }

      for (const [modelId, modelInfo] of Object.entries(account.quota.models)) {
        if (modelMap.has(modelId)) {
          continue;
        }

        modelMap.set(modelId, {
          id: modelId,
          object: 'model',
          displayName: modelInfo.display_name,
          capabilities: {
            vision: modelInfo.supports_images ?? false,
            thinking: modelInfo.supports_thinking ?? false,
            streaming: true,
            jsonMode: true,
            recommended: modelInfo.recommended ?? false,
          },
          limits: {
            maxTokens: modelInfo.max_tokens,
            maxOutputTokens: modelInfo.max_output_tokens,
            thinkingBudget: modelInfo.thinking_budget,
          },
        });
      }
    }

    const data = Array.from(modelMap.values()).sort((a, b) => a.id.localeCompare(b.id));

    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get model capabilities', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function mapIdeConfigResult(
  result: IdeConfigResult,
): {
  name: string;
  settingsPath: string;
  proxySetting: string;
  apiKeySetting: string;
  instructions: string;
} {
  switch (result.ide) {
    case 'vscode':
      return {
        name: 'VS Code',
        settingsPath: 'settings.json',
        proxySetting: 'openai.url',
        apiKeySetting: 'openai.apiKey',
        instructions: 'Add these settings to your VS Code settings.json',
      };
    case 'cursor':
      return {
        name: 'Cursor',
        settingsPath: 'settings.json',
        proxySetting: 'OPENAI_BASE_URL',
        apiKeySetting: 'OPENAI_API_KEY',
        instructions: 'Set these environment variables for Cursor',
      };
    case 'claude-code':
      return {
        name: 'Claude Code',
        settingsPath: 'Shell environment',
        proxySetting: 'ANTHROPIC_BASE_URL',
        apiKeySetting: 'ANTHROPIC_API_KEY',
        instructions: 'Run these export commands before starting Claude Code',
      };
    case 'jetbrains':
      return {
        name: 'JetBrains',
        settingsPath: 'IDE Settings',
        proxySetting: 'Base URL',
        apiKeySetting: 'API Key',
        instructions: String(result.content),
      };
    case 'opencide':
      return {
        name: 'Opencide',
        settingsPath: '.env',
        proxySetting: 'OPENAI_BASE_URL',
        apiKeySetting: 'OPENAI_API_KEY',
        instructions: 'Add these lines to your .env file',
      };
    default: {
      const exhaustiveCheck: never = result.ide;
      throw new Error(`Unsupported IDE: ${String(exhaustiveCheck)}`);
    }
  }
}

export async function generateIdeConfig(
  ide: string,
): Promise<{
  success: boolean;
  data?: {
    name: string;
    settingsPath: string;
    proxySetting: string;
    apiKeySetting: string;
    instructions: string;
  };
  error?: string;
}> {
  try {
    const proxyIdeConfig = getServiceOrThrow('proxyIdeConfig');

    const supportedIdes = ['cursor', 'vscode', 'claude-code', 'jetbrains', 'opencide'] as const;
    const normalizedIde = ide.toLowerCase() as typeof supportedIdes[number];
    if (!supportedIdes.includes(normalizedIde)) {
      return { success: false, error: `Unsupported IDE: ${ide}` };
    }

    const result = proxyIdeConfig.generateConfigForCurrentServer(normalizedIde);
    if (!result) {
      return { success: false, error: 'Failed to generate IDE config: server not configured' };
    }

    return {
      success: true,
      data: mapIdeConfigResult(result),
    };
  } catch (error) {
    return { success: false, error: normalizeServiceError(error) };
  }
}
