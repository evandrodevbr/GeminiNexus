import { z } from 'zod';
import { os } from '@orpc/server';
import { TokenUsageRepo } from '../database/usageHandler';
import {
  HourlyUsageSchema,
  DailyUsageSchema,
  WeeklyUsageSchema,
  MonthlyUsageSchema,
  ModelUsageSchema,
} from '../../types/db';

const RecordUsageInputSchema = z.object({
  accountId: z.string(),
  model: z.string(),
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  timestamp: z.number().int(),
  requestType: z.string().optional(),
});

const UsageQueryInputSchema = z.object({
  accountId: z.string().optional(),
  start: z.number().int().optional(),
  end: z.number().int().optional(),
});

export const usageRouter = os.router({
  recordUsage: os
    .input(RecordUsageInputSchema)
    .output(z.void())
    .handler(async ({ input }) => {
      TokenUsageRepo.recordUsage(input);
    }),

  getUsageByHour: os
    .input(UsageQueryInputSchema)
    .output(z.array(HourlyUsageSchema))
    .handler(async ({ input }) => {
      return TokenUsageRepo.getUsageByHour(input.accountId, input.start, input.end);
    }),

  getUsageByDay: os
    .input(UsageQueryInputSchema)
    .output(z.array(DailyUsageSchema))
    .handler(async ({ input }) => {
      return TokenUsageRepo.getUsageByDay(input.accountId, input.start, input.end);
    }),

  getUsageByWeek: os
    .input(UsageQueryInputSchema)
    .output(z.array(WeeklyUsageSchema))
    .handler(async ({ input }) => {
      return TokenUsageRepo.getUsageByWeek(input.accountId, input.start, input.end);
    }),

  getUsageByMonth: os
    .input(UsageQueryInputSchema)
    .output(z.array(MonthlyUsageSchema))
    .handler(async ({ input }) => {
      return TokenUsageRepo.getUsageByMonth(input.accountId, input.start, input.end);
    }),

  getUsageByModel: os
    .input(UsageQueryInputSchema)
    .output(z.array(ModelUsageSchema))
    .handler(async ({ input }) => {
      return TokenUsageRepo.getUsageByModel(input.accountId, input.start, input.end);
    }),
});
