import { logger } from '../../utils/logger';
import { getCloudDb } from './cloudHandler';
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
}

function buildDateFilter(start?: number, end?: number): string {
  const conditions: string[] = [];
  if (start !== undefined) {
    conditions.push(`timestamp >= ${start}`);
  }
  if (end !== undefined) {
    conditions.push(`timestamp <= ${end}`);
  }
  return conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
}

function buildAccountFilter(accountId?: string): string {
  return accountId ? `AND account_id = '${accountId}'` : '';
}

export class TokenUsageRepo {
  static recordUsage(params: RecordUsageParams): void {
    const { raw, orm } = getCloudDb();
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
        })
        .run();
    } catch (error) {
      logger.error('Failed to record token usage', error);
    } finally {
      raw.close();
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
    const { raw } = getCloudDb();
    try {
      const sql = `
        SELECT
          strftime('%Y-%m-%d %H:00', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${buildAccountFilter(accountId)}
        ${buildDateFilter(start, end)}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all() as unknown[];
      return rows.map((row) => HourlyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get hourly usage', error);
      return [];
    } finally {
      raw.close();
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
    const { raw } = getCloudDb();
    try {
      const sql = `
        SELECT
          strftime('%Y-%m-%d', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${buildAccountFilter(accountId)}
        ${buildDateFilter(start, end)}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all() as unknown[];
      return rows.map((row) => DailyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get daily usage', error);
      return [];
    } finally {
      raw.close();
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
    const { raw } = getCloudDb();
    try {
      const sql = `
        SELECT
          strftime('%Y-%W', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${buildAccountFilter(accountId)}
        ${buildDateFilter(start, end)}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all() as unknown[];
      return rows.map((row) => WeeklyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get weekly usage', error);
      return [];
    } finally {
      raw.close();
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
    const { raw } = getCloudDb();
    try {
      const sql = `
        SELECT
          strftime('%Y-%m', timestamp / 1000, 'unixepoch', 'localtime') as bucket,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${buildAccountFilter(accountId)}
        ${buildDateFilter(start, end)}
        GROUP BY bucket
        ORDER BY bucket
      `;
      const rows = raw.prepare(sql).all() as unknown[];
      return rows.map((row) => MonthlyUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get monthly usage', error);
      return [];
    } finally {
      raw.close();
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
    const { raw } = getCloudDb();
    try {
      const sql = `
        SELECT
          model,
          SUM(prompt_tokens) as promptTokens,
          SUM(completion_tokens) as completionTokens,
          SUM(total_tokens) as totalTokens,
          COUNT(*) as requests
        FROM token_usage
        WHERE 1=1
        ${buildAccountFilter(accountId)}
        ${buildDateFilter(start, end)}
        GROUP BY model
        ORDER BY totalTokens DESC
      `;
      const rows = raw.prepare(sql).all() as unknown[];
      return rows.map((row) => ModelUsageSchema.parse(row));
    } catch (error) {
      logger.error('Failed to get model usage', error);
      return [];
    } finally {
      raw.close();
    }
  }
}
