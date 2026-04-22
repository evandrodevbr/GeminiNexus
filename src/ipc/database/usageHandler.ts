import { logger } from '../../utils/logger';
import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { openDrizzleConnection } from './dbConnection';
import { getCloudAccountsDbPath } from '../../utils/paths';
import { ensureDatabaseInitialized } from './cloudHandler';
import { tokenUsage } from './schema';
import {
  HourlyUsageSchema,
  DailyUsageSchema,
  WeeklyUsageSchema,
  MonthlyUsageSchema,
  ModelUsageSchema,
} from '../../types/db';

export interface RecordUsageParams {
  accountId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: number;
  requestType?: string;
  isEstimated?: boolean;
}

let usageDbConnection: { raw: Database.Database; orm: BetterSQLite3Database<typeof import('./schema')> } | null = null;

function getUsageDb() {
  if (!usageDbConnection) {
    const dbPath = getCloudAccountsDbPath();
    ensureDatabaseInitialized(dbPath);
    usageDbConnection = openDrizzleConnection(
      dbPath,
      { readonly: false, fileMustExist: false },
      { busyTimeoutMs: 3000 },
    );
  }
  return usageDbConnection;
}

function buildDateFilter(start?: number, end?: number): { sql: string; params: number[] } {
  const conditions: string[] = [];
  const params: number[] = [];
  if (start !== undefined) {
    conditions.push(`timestamp >= ?`);
    params.push(start);
  }
  if (end !== undefined) {
    conditions.push(`timestamp <= ?`);
    params.push(end);
  }
  return {
    sql: conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '',
    params,
  };
}

function buildAccountFilter(accountId?: string): { sql: string; params: unknown[] } {
  return accountId
    ? { sql: 'AND account_id = ?', params: [accountId] }
    : { sql: '', params: [] };
}

export class TokenUsageRepo {
  static recordUsage(params: RecordUsageParams): boolean {
    const { orm } = getUsageDb();
    try {
      orm
        .insert(tokenUsage)
        .values({
          accountId: params.accountId,
          model: params.model,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
          timestamp: params.timestamp,
          requestType: params.requestType ?? null,
          isEstimated: params.isEstimated ? 1 : null,
        })
        .run();
      return true;
    } catch (error) {
      logger.error('Failed to record token usage', error);
      return false;
    }
  }

  static getUsageByHour(
    accountId?: string,
    start?: number,
    end?: number,
  ): Array<{
    bucket: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
  }> {
    const { raw } = getUsageDb();
    try {
      const accountFilter = buildAccountFilter(accountId);
      const dateFilter = buildDateFilter(start, end);
      const sql = `
        SELECT
          strftime('%Y-%m-%d %H:00', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${accountFilter.sql}
        ${dateFilter.sql}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all(...accountFilter.params, ...dateFilter.params) as unknown[];
      return rows.map((row) => HourlyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get hourly usage', error);
      return [];
    }
  }

  static getUsageByDay(
    accountId?: string,
    start?: number,
    end?: number,
  ): Array<{
    bucket: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
  }> {
    const { raw } = getUsageDb();
    try {
      const accountFilter = buildAccountFilter(accountId);
      const dateFilter = buildDateFilter(start, end);
      const sql = `
        SELECT
          strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${accountFilter.sql}
        ${dateFilter.sql}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all(...accountFilter.params, ...dateFilter.params) as unknown[];
      return rows.map((row) => DailyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get daily usage', error);
      return [];
    }
  }

  static getUsageByWeek(
    accountId?: string,
    start?: number,
    end?: number,
  ): Array<{
    bucket: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
  }> {
    const { raw } = getUsageDb();
    try {
      const accountFilter = buildAccountFilter(accountId);
      const dateFilter = buildDateFilter(start, end);
      const sql = `
        SELECT
          strftime('%Y-%W', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${accountFilter.sql}
        ${dateFilter.sql}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all(...accountFilter.params, ...dateFilter.params) as unknown[];
      return rows.map((row) => WeeklyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get weekly usage', error);
      return [];
    }
  }

  static getUsageByMonth(
    accountId?: string,
    start?: number,
    end?: number,
  ): Array<{
    bucket: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
  }> {
    const { raw } = getUsageDb();
    try {
      const accountFilter = buildAccountFilter(accountId);
      const dateFilter = buildDateFilter(start, end);
      const sql = `
        SELECT
          strftime('%Y-%m', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${accountFilter.sql}
        ${dateFilter.sql}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all(...accountFilter.params, ...dateFilter.params) as unknown[];
      return rows.map((row) => MonthlyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get monthly usage', error);
      return [];
    }
  }

  static getUsageByModel(
    accountId?: string,
    start?: number,
    end?: number,
  ): Array<{
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requests: number;
  }> {
    const { raw } = getUsageDb();
    try {
      const accountFilter = buildAccountFilter(accountId);
      const dateFilter = buildDateFilter(start, end);
      const sql = `
        SELECT
          model,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${accountFilter.sql}
        ${dateFilter.sql}
        GROUP BY model
        ORDER BY totalTokens DESC
      `;
      const rows = raw.prepare(sql).all(...accountFilter.params, ...dateFilter.params) as unknown[];
      return rows.map((row) => ModelUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get model usage', error);
      return [];
    }
  }
}
