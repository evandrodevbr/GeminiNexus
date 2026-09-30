import { describe, expect, it, vi } from 'vitest';
import { RateLimitReason, RateLimitTracker } from '../../server/modules/proxy/rate-limit-tracker';

describe('RateLimitTracker parity replay', () => {
  it.each([
    ['500ms', 2],
    ['2500ms', 3],
    ['2.2s100ms', 3],
    ['1h2m3s', 3723],
    [' 30s ', 30],
    ['30seconds', 5],
    ['invalid30s', 5],
  ])(
    'parses complete retry duration %s without confusing minutes and milliseconds',
    (duration, expected) => {
      const tracker = new RateLimitTracker();
      const info = tracker.parseAndMarkFromError({
        accountId: 'acc-duration',
        status: 503,
        body: JSON.stringify({
          error: { details: [{ reason: 'MODEL_CAPACITY_EXHAUSTED', retryDelay: duration }] },
        }),
        backoffSteps: [60],
      });
      expect(info?.retryAfterSec).toBe(expected);
    },
  );

  it('waits for the longer of the account and model lockouts', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const tracker = new RateLimitTracker();
      tracker.setLockoutUntilIso(
        'acc-overlap',
        new Date(now + 5000).toISOString(),
        RateLimitReason.RateLimitExceeded,
      );
      tracker.setLockoutUntilIso(
        'acc-overlap',
        new Date(now + 60000).toISOString(),
        RateLimitReason.QuotaExhausted,
        'model-a',
      );
      expect(tracker.getRemainingWaitSeconds('acc-overlap', 'model-a')).toBe(60);
      expect(tracker.getRemainingWaitSeconds('acc-overlap', 'model-b')).toBe(5);
      clock.mockReturnValue(now + 10000);
      expect(tracker.getRemainingWaitSeconds('acc-overlap', 'model-a')).toBe(50);
      expect(tracker.getRemainingWaitSeconds('acc-overlap', 'model-b')).toBe(0);
    } finally {
      clock.mockRestore();
    }
  });

  it('uses Retry-After header before body/default', () => {
    const tracker = new RateLimitTracker();
    const info = tracker.parseAndMarkFromError({
      accountId: 'acc-1',
      status: 429,
      retryAfter: '30',
      body: JSON.stringify({
        error: {
          details: [{ reason: 'RATE_LIMIT_EXCEEDED' }],
          retry_after: 1,
        },
      }),
      model: 'gemini-2.5-pro',
      backoffSteps: [60, 300, 1800, 7200],
    });

    expect(info).not.toBeNull();
    expect(info?.reason).toBe(RateLimitReason.RateLimitExceeded);
    expect(info?.retryAfterSec).toBe(30);
    expect(tracker.isRateLimited('acc-1')).toBe(true);
  });

  it('uses model-level key for quota exhausted', () => {
    const tracker = new RateLimitTracker();
    tracker.parseAndMarkFromError({
      accountId: 'acc-2',
      status: 429,
      body: JSON.stringify({
        error: {
          details: [
            {
              reason: 'QUOTA_EXHAUSTED',
              metadata: { quotaResetDelay: '42s' },
            },
          ],
        },
      }),
      model: 'gemini-2.5-flash',
      backoffSteps: [60, 300, 1800, 7200],
    });

    expect(tracker.isRateLimited('acc-2', 'gemini-2.5-flash')).toBe(true);
    expect(tracker.isRateLimited('acc-2', 'gemini-2.5-pro')).toBe(false);
  });

  it('uses backoff steps when no header/body retry hint', () => {
    const tracker = new RateLimitTracker();
    const steps = [60, 300, 1800, 7200];

    const first = tracker.parseAndMarkFromError({
      accountId: 'acc-3',
      status: 429,
      body: JSON.stringify({
        error: { details: [{ reason: 'QUOTA_EXHAUSTED' }] },
      }),
      backoffSteps: steps,
    });
    const second = tracker.parseAndMarkFromError({
      accountId: 'acc-3',
      status: 429,
      body: JSON.stringify({
        error: { details: [{ reason: 'QUOTA_EXHAUSTED' }] },
      }),
      backoffSteps: steps,
    });

    expect(first?.retryAfterSec).toBe(60);
    expect(second?.retryAfterSec).toBe(300);
  });

  it('parses MODEL_CAPACITY_EXHAUSTED and RetryInfo.retryDelay from 503 payload', () => {
    const tracker = new RateLimitTracker();
    const info = tracker.parseAndMarkFromError({
      accountId: 'acc-4',
      status: 503,
      model: 'gemini-3.1-pro-high',
      body: JSON.stringify({
        error: {
          code: 503,
          message: 'No capacity available for model gemini-3.1-pro-high on the server',
          status: 'UNAVAILABLE',
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
              reason: 'MODEL_CAPACITY_EXHAUSTED',
              domain: 'cloudcode-pa.googleapis.com',
              metadata: { model: 'gemini-3.1-pro-high' },
            },
            {
              '@type': 'type.googleapis.com/google.rpc.RetryInfo',
              retryDelay: '30s',
            },
          ],
        },
      }),
      backoffSteps: [60, 300, 1800, 7200],
    });

    expect(info).not.toBeNull();
    expect(info?.reason).toBe(RateLimitReason.ModelCapacityExhausted);
    expect(info?.retryAfterSec).toBe(30);
    expect(tracker.isRateLimited('acc-4')).toBe(true);
  });
});
