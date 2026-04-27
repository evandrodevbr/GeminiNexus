import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProxyEventBus, ProxyEvent } from '@/server/modules/proxy/proxy-event-bus.service';
import { take } from 'rxjs/operators';

describe('ProxyEventBus', () => {
  let eventBus: ProxyEventBus;

  beforeEach(() => {
    eventBus = new ProxyEventBus();
  });

  it('should emit events to subscribers', () => {
    const listener = vi.fn();
    eventBus.listen().subscribe(listener);

    const event: ProxyEvent = {
      type: 'account_switch',
      timestamp: Date.now(),
      data: { accountId: 'acc-1' },
    };

    eventBus.emit(event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('should emit multiple event types', () => {
    const events: ProxyEvent[] = [];
    eventBus.listen().subscribe((e) => events.push(e));

    eventBus.emit({ type: 'rate_limit', timestamp: 1, data: {} });
    eventBus.emit({ type: 'error', timestamp: 2, data: { message: 'fail' } });
    eventBus.emit({ type: 'metric', timestamp: 3, data: { latency: 100 } });
    eventBus.emit({ type: 'heartbeat', timestamp: 4, data: {} });

    expect(events).toHaveLength(4);
    expect(events.map((e) => e.type)).toEqual(['rate_limit', 'error', 'metric', 'heartbeat']);
  });

  it('should support multiple subscribers', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    eventBus.listen().subscribe(listener1);
    eventBus.listen().subscribe(listener2);

    const event: ProxyEvent = { type: 'account_switch', timestamp: Date.now(), data: {} };
    eventBus.emit(event);

    expect(listener1).toHaveBeenCalledWith(event);
    expect(listener2).toHaveBeenCalledWith(event);
  });

  it('should allow RxJS operators on the observable', async () => {
    const promise = eventBus.listen().pipe(take(1)).toPromise();

    const event: ProxyEvent = { type: 'metric', timestamp: Date.now(), data: {} };
    eventBus.emit(event);

    const result = await promise;
    expect(result).toEqual(event);
  });

  it('should not receive events before subscription', () => {
    const listener = vi.fn();

    eventBus.emit({ type: 'heartbeat', timestamp: Date.now(), data: {} });
    eventBus.listen().subscribe(listener);
    eventBus.emit({ type: 'heartbeat', timestamp: Date.now(), data: {} });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
