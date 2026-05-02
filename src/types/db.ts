import { z } from 'zod';

export const CloudAccountRowSchema = z.object({
  id: z.string(),
  provider: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  token_json: z.string(),
  quota_json: z.string().nullable(),
  device_profile_json: z.string().nullable().optional(),
  device_history_json: z.string().nullable().optional(),
  created_at: z.number(),
  last_used: z.number(),
  status: z.string().nullable(),
  is_active: z.number().int(),
});

export type CloudAccountRow = z.infer<typeof CloudAccountRowSchema>;

export const AccountTokenRowSchema = z.object({
  id: z.string(),
  token_json: z.string(),
  quota_json: z.string().nullable(),
});

export type AccountTokenRow = z.infer<typeof AccountTokenRowSchema>;

export const SettingsRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export type SettingsRow = z.infer<typeof SettingsRowSchema>;

export const SettingsValueRowSchema = z.object({
  value: z.string(),
});

export type SettingsValueRow = z.infer<typeof SettingsValueRowSchema>;

export const ItemTableKeys = [
  'geminiNexusAuthStatus',
  'geminiNexusOnboarding',
  'geminiNexusUnifiedStateSync.oauthToken',
  'jetskiStateSync.agentManagerInitState',
  'google.geminiNexus',
  'geminiNexusUserSettings.allUserSettings',
] as const;

export const ItemTableKeySchema = z.enum(ItemTableKeys);

export type ItemTableKey = z.infer<typeof ItemTableKeySchema>;

export const ItemTableRowSchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
});

export type ItemTableRow = z.infer<typeof ItemTableRowSchema>;

export const ItemTableValueRowSchema = z.object({
  value: z.string().nullable(),
});

export type ItemTableValueRow = z.infer<typeof ItemTableValueRowSchema>;

export const TableInfoRowSchema = z.object({
  name: z.string(),
});

export type TableInfoRow = z.infer<typeof TableInfoRowSchema>;

export const TokenUsageRowSchema = z.object({
  id: z.number(),
  account_id: z.string(),
  model: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  timestamp: z.number(),
  request_type: z.string().nullable(),
  is_estimated: z.number().nullable(),
});

export type TokenUsageRow = z.infer<typeof TokenUsageRowSchema>;

export const HourlyUsageSchema = z.object({
  bucket: z.string(),
  promptTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  completionTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  totalTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  requests: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
});

export type HourlyUsage = z.infer<typeof HourlyUsageSchema>;

export const DailyUsageSchema = z.object({
  bucket: z.string(),
  promptTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  completionTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  totalTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  requests: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
});

export type DailyUsage = z.infer<typeof DailyUsageSchema>;

export const WeeklyUsageSchema = z.object({
  bucket: z.string(),
  promptTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  completionTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  totalTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  requests: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
});

export type WeeklyUsage = z.infer<typeof WeeklyUsageSchema>;

export const MonthlyUsageSchema = z.object({
  bucket: z.string(),
  promptTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  completionTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  totalTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  requests: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
});

export type MonthlyUsage = z.infer<typeof MonthlyUsageSchema>;

export const ModelUsageSchema = z.object({
  model: z.string(),
  promptTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  completionTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  totalTokens: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
  requests: z
    .number()
    .nullable()
    .transform((v) => v ?? 0),
});

export type ModelUsage = z.infer<typeof ModelUsageSchema>;
