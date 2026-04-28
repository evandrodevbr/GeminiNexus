import { Injectable, OnModuleInit } from '@nestjs/common';
import { registerProxyAdvancedService } from '../../../ipc/proxy-advanced/service-registry';
import { ProxyMetricsRepo } from '../../../ipc/database/proxyMetricsHandler';

interface RequestRecord {
  timestamp: number;
  duration: number;
  status: number;
  endpoint: string;
}

const HISTORICAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CONNECTION_SNAPSHOT_INTERVAL_MS = 30_000; // 30 seconds
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RECORDS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class ProxyMetricsService implements OnModuleInit {
  private readonly maxRecords = 100;
  private records: RequestRecord[] = [];
  private activeConnectionsCount = 0;
  private tokenEvents: Array<{ timestamp: number; tokens: number }> = [];

  constructor() {
    registerProxyAdvancedService('proxyMetrics', this);
  }

  onModuleInit(): void {
    this.cleanupOldRecords();
    setInterval(() => this.cleanupOldRecords(), CLEANUP_INTERVAL_MS);

    this.recordConnectionSnapshot();
    setInterval(() => this.recordConnectionSnapshot(), CONNECTION_SNAPSHOT_INTERVAL_MS);
  }

  incrementActiveConnections(): void {
    this.activeConnectionsCount++;
  }

  decrementActiveConnections(): void {
    this.activeConnectionsCount = Math.max(0, this.activeConnectionsCount - 1);
  }

  recordRequest(record: RequestRecord): void {
    this.records.push(record);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }

    ProxyMetricsRepo.recordRequest({
      endpoint: record.endpoint,
      statusCode: record.status,
      durationMs: record.duration,
      timestamp: record.timestamp,
      accountId: null,
      tokensPrompt: null,
      tokensCompletion: null,
      errorMessage: null,
    });
  }

  recordTokens(tokens: number): void {
    if (tokens <= 0) {
      return;
    }
    this.tokenEvents.push({ timestamp: Date.now(), tokens });
    this.trimTokenEvents();
  }

  getMetrics(): {
    totalRequests: number;
    requestsPerMinute: number;
    avgLatency: number;
    errorRate: number;
    activeConnections: number;
    tokenThroughput: number;
    cacheHitRate: number;
  } {
    const aggregates = ProxyMetricsRepo.getHistoricalAggregates(HISTORICAL_WINDOW_MS);

    this.trimTokenEvents();
    const tokenThroughput = this.tokenEvents.reduce((sum, e) => sum + e.tokens, 0);

    return {
      totalRequests: aggregates.totalRequests,
      requestsPerMinute: Math.round(aggregates.requestsPerMinute * 100) / 100,
      avgLatency: Math.round(aggregates.avgLatencyMs * 100) / 100,
      errorRate: Math.round(aggregates.errorRatePercent * 100) / 100,
      activeConnections: Math.round(aggregates.avgActiveConnections * 100) / 100,
      tokenThroughput,
      cacheHitRate: 0,
    };
  }

  cleanupOldRecords(): void {
    const cutoff = Date.now() - RECORDS_TTL_MS;
    ProxyMetricsRepo.deleteOldRecords(cutoff);
  }

  private recordConnectionSnapshot(): void {
    ProxyMetricsRepo.recordConnectionSnapshot(this.activeConnectionsCount);
  }

  private trimTokenEvents(): void {
    const cutoff = Date.now() - 60_000;
    const index = this.tokenEvents.findIndex((e) => e.timestamp >= cutoff);
    if (index > 0) {
      this.tokenEvents = this.tokenEvents.slice(index);
    } else if (index === -1 && this.tokenEvents.length > 0) {
      this.tokenEvents = [];
    }
  }
}
