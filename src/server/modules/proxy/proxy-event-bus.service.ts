import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface ProxyEvent {
  type: 'account_switch' | 'rate_limit' | 'error' | 'metric' | 'heartbeat';
  timestamp: number;
  data: unknown;
}

@Injectable()
export class ProxyEventBus {
  private readonly subject = new Subject<ProxyEvent>();

  emit(event: ProxyEvent): void {
    this.subject.next(event);
  }

  listen(): Observable<ProxyEvent> {
    return this.subject.asObservable();
  }
}
