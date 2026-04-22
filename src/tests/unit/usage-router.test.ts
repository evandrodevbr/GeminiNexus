import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenUsageRepo } from '../../ipc/database/usageHandler';
import { usageRouter } from '../../ipc/usage/router';

describe('usageRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose all usage endpoints', () => {
    expect(usageRouter).toHaveProperty('recordUsage');
    expect(usageRouter).toHaveProperty('getUsageByHour');
    expect(usageRouter).toHaveProperty('getUsageByDay');
    expect(usageRouter).toHaveProperty('getUsageByWeek');
    expect(usageRouter).toHaveProperty('getUsageByMonth');
    expect(usageRouter).toHaveProperty('getUsageByModel');
  });

  it('recordUsage should delegate to TokenUsageRepo.recordUsage', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'recordUsage').mockImplementation(() => true);
    const input = {
      accountId: 'acc-1',
      model: 'gemini-pro',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      timestamp: Date.now(),
      requestType: 'chat',
    };

    const handler = (usageRouter.recordUsage as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith(input);
    spy.mockRestore();
  });

  it('getUsageByHour should delegate to TokenUsageRepo.getUsageByHour', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'getUsageByHour').mockReturnValue([]);
    const input = { accountId: 'acc-1', start: 1000, end: 2000 };
    const handler = (usageRouter.getUsageByHour as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith('acc-1', 1000, 2000);
    spy.mockRestore();
  });

  it('getUsageByDay should delegate to TokenUsageRepo.getUsageByDay', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'getUsageByDay').mockReturnValue([]);
    const input = { start: 1000, end: 2000 };
    const handler = (usageRouter.getUsageByDay as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith(undefined, 1000, 2000);
    spy.mockRestore();
  });

  it('getUsageByWeek should delegate to TokenUsageRepo.getUsageByWeek', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'getUsageByWeek').mockReturnValue([]);
    const input = {};
    const handler = (usageRouter.getUsageByWeek as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith(undefined, undefined, undefined);
    spy.mockRestore();
  });

  it('getUsageByMonth should delegate to TokenUsageRepo.getUsageByMonth', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'getUsageByMonth').mockReturnValue([]);
    const input = { accountId: 'acc-2' };
    const handler = (usageRouter.getUsageByMonth as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith('acc-2', undefined, undefined);
    spy.mockRestore();
  });

  it('getUsageByModel should delegate to TokenUsageRepo.getUsageByModel', async () => {
    const spy = vi.spyOn(TokenUsageRepo, 'getUsageByModel').mockReturnValue([]);
    const input = { accountId: 'acc-1', start: 1, end: 2 };
    const handler = (usageRouter.getUsageByModel as any)['~orpc'].handler;
    await handler({ input });

    expect(spy).toHaveBeenCalledWith('acc-1', 1, 2);
    spy.mockRestore();
  });
});
