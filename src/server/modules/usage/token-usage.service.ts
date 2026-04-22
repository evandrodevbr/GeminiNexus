import { Injectable } from '@nestjs/common';
import { TokenUsageRepo, RecordUsageParams } from '../../../ipc/database/usageHandler';

@Injectable()
export class TokenUsageService {
  async recordUsage(params: RecordUsageParams): Promise<void> {
    TokenUsageRepo.recordUsage(params);
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
