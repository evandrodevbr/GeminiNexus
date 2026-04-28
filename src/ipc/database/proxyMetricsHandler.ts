import { logger } from '../../utils/logger';
import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { openDrizzleConnection } from './dbConnection';
import { getCloudAccountsDbPath } from '../../utils/paths';
import { ensureDatabaseInitialized } from './cloudHandler';
import { proxyRequestMetrics, proxyConnectionSnapshots, trafficLogs } from './schema';

export interface RecordProxyRequestParams {
  endpoint: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
  accountId?: string | null;
  tokensPrompt?: number | null;
  tokensCompletion?: number | null;
  errorMessage?: string | null;
}

let proxyMetricsDbConnection: {
  raw: Database.Database;
  orm: BetterSQLite3Database<typeof import('./schema')>;
} | null = null;

function getProxyMetricsDb() {
  if (!proxyMetricsDbConnection) {
    const dbPath = getCloudAccountsDbPath();
    ensureDatabaseInitialized(dbPath);
    const conn = openDrizzleConnection(
      dbPath,
      { readonly: false, fileMustExist: false },
      { busyTimeoutMs: 3000 },
    );
    ensureProxyMetricsTable(conn.raw);
    proxyMetricsDbConnection = conn;
  }
  return proxyMetricsDbConnection;
}

export function ensureProxyMetricsTable(rawDb: Database.Database): void {
  try {
    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS proxy_request_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        account_id TEXT,
        tokens_prompt INTEGER,
        tokens_completion INTEGER,
        error_message TEXT
      );
    `);
    rawDb.exec(
      `CREATE INDEX IF NOT EXISTS idx_proxy_metrics_timestamp ON proxy_request_metrics(timestamp);`,
    );
    rawDb.exec(
      `CREATE INDEX IF NOT EXISTS idx_proxy_metrics_status ON proxy_request_metrics(status_code);`,
    );

    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS proxy_connection_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        count INTEGER NOT NULL DEFAULT 0
      );
    `);
    rawDb.exec(
      `CREATE INDEX IF NOT EXISTS idx_proxy_conn_timestamp ON proxy_connection_snapshots(timestamp);`,
    );

    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS traffic_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        direction TEXT NOT NULL,
        request_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT,
        status INTEGER,
        headers_json TEXT,
        body_json TEXT,
        chunk_json TEXT,
        duration_ms INTEGER,
        error_message TEXT,
        error_stack TEXT,
        error_status INTEGER,
        metadata_json TEXT
      );
    `);
    rawDb.exec(
      `CREATE INDEX IF NOT EXISTS idx_traffic_logs_timestamp ON traffic_logs(timestamp);`,
    );
    rawDb.exec(
      `CREATE INDEX IF NOT EXISTS idx_traffic_logs_direction ON traffic_logs(direction);`,
    );
  } catch (error) {
    logger.error('Failed to ensure proxy_request_metrics table', error);
    throw error;
  }
}

export class ProxyMetricsRepo {
  static recordRequest(params: RecordProxyRequestParams): boolean {
    const { orm } = getProxyMetricsDb();
    try {
      orm
        .insert(proxyRequestMetrics)
        .values({
          endpoint: params.endpoint,
          statusCode: params.statusCode,
          durationMs: params.durationMs,
          timestamp: params.timestamp,
          accountId: params.accountId ?? null,
          tokensPrompt: params.tokensPrompt ?? null,
          tokensCompletion: params.tokensCompletion ?? null,
          errorMessage: params.errorMessage ?? null,
        })
        .run();
      return true;
    } catch (error) {
      logger.error('Failed to record proxy request metric', error);
      return false;
    }
  }

  static getRecentAggregates(): {
    requestsPerMinute: number;
    avgLatencyMs: number;
    errorRatePercent: number;
  } {
    const { raw } = getProxyMetricsDb();
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const fiveMinutesAgo = now - 5 * 60_000;

    try {
      const requestsPerMinuteRow = raw
        .prepare(`SELECT COUNT(*) as count FROM proxy_request_metrics WHERE timestamp >= ?`)
        .get(oneMinuteAgo) as { count: number } | undefined;
      const requestsPerMinute = requestsPerMinuteRow?.count ?? 0;

      const aggregatesRow = raw
        .prepare(
          `SELECT
            COUNT(*) as total,
            AVG(duration_ms) as avgLatency,
            CASE
              WHEN COUNT(*) = 0 THEN 0
              ELSE (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*))
            END as errorRate
          FROM proxy_request_metrics
          WHERE timestamp >= ?`,
        )
        .get(fiveMinutesAgo) as
        | { total: number; avgLatency: number | null; errorRate: number }
        | undefined;

      const avgLatencyMs = aggregatesRow?.avgLatency ? Math.round(aggregatesRow.avgLatency) : 0;
      const errorRatePercent = aggregatesRow?.errorRate ?? 0;

      return {
        requestsPerMinute,
        avgLatencyMs,
        errorRatePercent,
      };
    } catch (error) {
      logger.error('Failed to get recent proxy metrics aggregates', error);
      return {
        requestsPerMinute: 0,
        avgLatencyMs: 0,
        errorRatePercent: 0,
      };
    }
  }

  static recordConnectionSnapshot(count: number): boolean {
    const { orm } = getProxyMetricsDb();
    try {
      orm.insert(proxyConnectionSnapshots).values({ timestamp: Date.now(), count }).run();
      return true;
    } catch (error) {
      logger.error('Failed to record connection snapshot', error);
      return false;
    }
  }

  static getHistoricalAggregates(windowMs: number = 60 * 60 * 1000): {
    totalRequests: number;
    requestsPerMinute: number;
    avgLatencyMs: number;
    errorRatePercent: number;
    avgActiveConnections: number;
  } {
    const { raw } = getProxyMetricsDb();
    const now = Date.now();
    const cutoff = now - windowMs;

    try {
      const reqRow = raw
        .prepare(
          `SELECT COUNT(*) as total, AVG(duration_ms) as avgLatency,
           CASE WHEN COUNT(*) = 0 THEN 0
           ELSE (COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*))
           END as errorRate
           FROM proxy_request_metrics WHERE timestamp >= ?`,
        )
        .get(cutoff) as
        | { total: number; avgLatency: number | null; errorRate: number }
        | undefined;

      const totalRequests = reqRow?.total ?? 0;
      const minutes = Math.max(windowMs / 60_000, 1);
      const requestsPerMinute = Math.round((totalRequests / minutes) * 100) / 100;
      const avgLatencyMs = reqRow?.avgLatency ? Math.round(reqRow.avgLatency) : 0;
      const errorRatePercent = reqRow?.errorRate ?? 0;

      const connRow = raw
        .prepare(`SELECT AVG(count) as avg FROM proxy_connection_snapshots WHERE timestamp >= ?`)
        .get(cutoff) as { avg: number | null } | undefined;
      const avgActiveConnections = connRow?.avg ? Math.round(connRow.avg) : 0;

      return {
        totalRequests,
        requestsPerMinute,
        avgLatencyMs,
        errorRatePercent,
        avgActiveConnections,
      };
    } catch (error) {
      logger.error('Failed to get historical proxy metrics aggregates', error);
      return {
        totalRequests: 0,
        requestsPerMinute: 0,
        avgLatencyMs: 0,
        errorRatePercent: 0,
        avgActiveConnections: 0,
      };
    }
  }

  static deleteOldRecords(cutoffTimestamp: number): boolean {
    const { raw } = getProxyMetricsDb();
    try {
      raw.prepare(`DELETE FROM proxy_request_metrics WHERE timestamp < ?`).run(cutoffTimestamp);
      raw.prepare(`DELETE FROM proxy_connection_snapshots WHERE timestamp < ?`).run(cutoffTimestamp);
      return true;
    } catch (error) {
      logger.error('Failed to delete old proxy metrics records', error);
      return false;
    }
  }
}

export interface InsertTrafficLogParams {
  timestamp: number;
  direction: string;
  requestId: string;
  endpoint: string;
  method?: string;
  status?: number;
  headers?: Record<string, unknown>;
  body?: unknown;
  chunk?: unknown;
  durationMs?: number;
  error?: { message: string; stack?: string; status?: number; body?: unknown };
  metadata?: Record<string, unknown>;
}

export class TrafficLogsRepo {
  static insert(params: InsertTrafficLogParams): boolean {
    const { orm } = getProxyMetricsDb();
    try {
      orm
        .insert(trafficLogs)
        .values({
          timestamp: params.timestamp,
          direction: params.direction,
          requestId: params.requestId,
          endpoint: params.endpoint,
          method: params.method ?? null,
          status: params.status ?? null,
          headersJson: params.headers ? JSON.stringify(params.headers) : null,
          bodyJson: params.body != null ? JSON.stringify(params.body) : null,
          chunkJson: params.chunk != null ? JSON.stringify(params.chunk) : null,
          durationMs: params.durationMs ?? null,
          errorMessage: params.error?.message ?? null,
          errorStack: params.error?.stack ?? null,
          errorStatus: params.error?.status ?? null,
          metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
        })
        .run();
      return true;
    } catch (error) {
      logger.error('Failed to insert traffic log', error);
      return false;
    }
  }

  static getRecent(limit: number = 50, direction?: string): Array<{
    timestamp: number;
    direction: string;
    requestId: string;
    endpoint: string;
    method?: string;
    status?: number;
    headers?: Record<string, unknown>;
    body?: unknown;
    chunk?: unknown;
    durationMs?: number;
    error?: { message: string; stack?: string; status?: number; body?: unknown };
    metadata?: Record<string, unknown>;
  }> {
    const { raw } = getProxyMetricsDb();
    try {
      let sql = `SELECT * FROM traffic_logs`;
      const args: (number | string)[] = [];
      if (direction) {
        sql += ` WHERE direction = ?`;
        args.push(direction);
      }
      sql += ` ORDER BY timestamp DESC LIMIT ?`;
      args.push(limit);
      const rows = raw.prepare(sql).all(...args) as Array<{
        timestamp: number;
        direction: string;
        request_id: string;
        endpoint: string;
        method: string | null;
        status: number | null;
        headers_json: string | null;
        body_json: string | null;
        chunk_json: string | null;
        duration_ms: number | null;
        error_message: string | null;
        error_stack: string | null;
        error_status: number | null;
        metadata_json: string | null;
      }>;
      return rows.map((r) => ({
        timestamp: r.timestamp,
        direction: r.direction,
        requestId: r.request_id,
        endpoint: r.endpoint,
        method: r.method ?? undefined,
        status: r.status ?? undefined,
        headers: r.headers_json ? JSON.parse(r.headers_json) : undefined,
        body: r.body_json ? JSON.parse(r.body_json) : undefined,
        chunk: r.chunk_json ? JSON.parse(r.chunk_json) : undefined,
        durationMs: r.duration_ms ?? undefined,
        error:
          r.error_message
            ? { message: r.error_message, stack: r.error_stack ?? undefined, status: r.error_status ?? undefined }
            : undefined,
        metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get recent traffic logs', error);
      return [];
    }
  }

  static getStats(): { byDirection: Record<string, number>; byEndpoint: Record<string, number>; total: number } {
    const { raw } = getProxyMetricsDb();
    try {
      const rows = raw.prepare(`SELECT direction, endpoint, COUNT(*) as cnt FROM traffic_logs GROUP BY direction, endpoint`).all() as Array<{
        direction: string;
        endpoint: string;
        cnt: number;
      }>;
      const byDirection: Record<string, number> = {};
      const byEndpoint: Record<string, number> = {};
      let total = 0;
      for (const r of rows) {
        total += r.cnt;
        byDirection[r.direction] = (byDirection[r.direction] || 0) + r.cnt;
        byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + r.cnt;
      }
      return { byDirection, byEndpoint, total };
    } catch (error) {
      logger.error('Failed to get traffic log stats', error);
      return { byDirection: {}, byEndpoint: {}, total: 0 };
    }
  }

  static getAllForExport(): Array<{
    timestamp: number;
    direction: string;
    requestId: string;
    endpoint: string;
    method?: string;
    status?: number;
    headers?: Record<string, unknown>;
    body?: unknown;
    chunk?: unknown;
    durationMs?: number;
    error?: { message: string; stack?: string; status?: number; body?: unknown };
    metadata?: Record<string, unknown>;
  }> {
    const { raw } = getProxyMetricsDb();
    try {
      const rows = raw.prepare(`SELECT * FROM traffic_logs ORDER BY timestamp DESC`).all() as Array<{
        timestamp: number;
        direction: string;
        request_id: string;
        endpoint: string;
        method: string | null;
        status: number | null;
        headers_json: string | null;
        body_json: string | null;
        chunk_json: string | null;
        duration_ms: number | null;
        error_message: string | null;
        error_stack: string | null;
        error_status: number | null;
        metadata_json: string | null;
      }>;
      return rows.map((r) => ({
        timestamp: r.timestamp,
        direction: r.direction,
        requestId: r.request_id,
        endpoint: r.endpoint,
        method: r.method ?? undefined,
        status: r.status ?? undefined,
        headers: r.headers_json ? JSON.parse(r.headers_json) : undefined,
        body: r.body_json ? JSON.parse(r.body_json) : undefined,
        chunk: r.chunk_json ? JSON.parse(r.chunk_json) : undefined,
        durationMs: r.duration_ms ?? undefined,
        error:
          r.error_message
            ? { message: r.error_message, stack: r.error_stack ?? undefined, status: r.error_status ?? undefined }
            : undefined,
        metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
      }));
    } catch (error) {
      logger.error('Failed to get all traffic logs for export', error);
      return [];
    }
  }

  static deleteOld(cutoffTimestamp: number): boolean {
    const { raw } = getProxyMetricsDb();
    try {
      raw.prepare(`DELETE FROM traffic_logs WHERE timestamp < ?`).run(cutoffTimestamp);
      return true;
    } catch (error) {
      logger.error('Failed to delete old traffic logs', error);
      return false;
    }
  }
}
