import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull(),
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  tokenJson: text('token_json').notNull(),
  quotaJson: text('quota_json'),
  deviceProfileJson: text('device_profile_json'),
  deviceHistoryJson: text('device_history_json'),
  createdAt: integer('created_at').notNull(),
  lastUsed: integer('last_used').notNull(),
  status: text('status', { enum: ['active', 'rate_limited', 'expired'] }).default('active'),
  statusReason: text('status_reason'),
  isActive: integer('is_active').notNull().default(0),
  proxyUrl: text('proxy_url'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const itemTable = sqliteTable('ItemTable', {
  key: text('key').primaryKey(),
  value: text('value'),
});

export const tokenUsage = sqliteTable('token_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: text('account_id').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  timestamp: integer('timestamp').notNull(),
  requestType: text('request_type'),
  isEstimated: integer('is_estimated'),
});

export const proxyRequestMetrics = sqliteTable('proxy_request_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  endpoint: text('endpoint').notNull(),
  statusCode: integer('status_code').notNull(),
  durationMs: integer('duration_ms').notNull(),
  timestamp: integer('timestamp').notNull(),
  accountId: text('account_id'),
  tokensPrompt: integer('tokens_prompt'),
  tokensCompletion: integer('tokens_completion'),
  errorMessage: text('error_message'),
});

export const proxyConnectionSnapshots = sqliteTable('proxy_connection_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp').notNull(),
  count: integer('count').notNull().default(0),
});

export const trafficLogs = sqliteTable('traffic_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp').notNull(),
  direction: text('direction').notNull(),
  requestId: text('request_id').notNull(),
  endpoint: text('endpoint').notNull(),
  method: text('method'),
  status: integer('status'),
  headersJson: text('headers_json'),
  bodyJson: text('body_json'),
  chunkJson: text('chunk_json'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  errorStack: text('error_stack'),
  errorStatus: integer('error_status'),
  metadataJson: text('metadata_json'),
});
