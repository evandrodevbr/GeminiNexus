import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TokenUsageRepo, RecordUsageParams } from '../../../ipc/database/usageHandler';

const RecordUsageInputSchema = z.object({
  accountId: z.string().min(1),
  model: z.string().min(1),
  promptTokens: z.number().min(0),
  completionTokens: z.number().min(0),
  totalTokens: z.number().min(0),
  timestamp: z.number(),
  requestType: z.enum(['openai', 'anthropic', 'gemini']).optional(),
  isEstimated: z.boolean().optional(),
});

@Injectable()
export class TokenUsageService {
  recordUsage(params: RecordUsageParams): boolean {
    RecordUsageInputSchema.parse(params);
    return TokenUsageRepo.recordUsage(params);
  }

  getUsageByHour(accountId?: string, start?: number, end?: number) {
    return TokenUsageRepo.getUsageByHour(accountId, start, end);
  }

  getUsageByDay(accountId?: string, start?: number, end?: number) {
    return TokenUsageRepo.getUsageByDay(accountId, start, end);
  }

  getUsageByWeek(accountId?: string, start?: number, end?: number) {
    return TokenUsageRepo.getUsageByWeek(accountId, start, end);
  }

  getUsageByMonth(accountId?: string, start?: number, end?: number) {
    return TokenUsageRepo.getUsageByMonth(accountId, start, end);
  }

  getUsageByModel(accountId?: string, start?: number, end?: number) {
    return TokenUsageRepo.getUsageByModel(accountId, start, end);
  }
}
