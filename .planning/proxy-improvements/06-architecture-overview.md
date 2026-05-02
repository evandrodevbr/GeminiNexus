# Proxy Page — Architecture Overview

> Generated from explorer agent mapping of proxy-related files
> Date: 2026-04-22

## File Map

### Frontend

| File                                         | Lines | Role                                     |
| -------------------------------------------- | ----- | ---------------------------------------- |
| `src/routes/proxy.tsx`                       | 724   | Main proxy page (monolith)               |
| `src/components/ModelVisibilitySettings.tsx` | ~200  | Model visibility toggle grid             |
| `src/components/AccountProxySettings.tsx`    | ~180  | Per-account proxy configuration          |
| `src/hooks/useCloudAccounts.ts`              | ~50   | Fetches cloud accounts for proxy routing |

### Backend (NestJS)

| File                                                        | Role                                        |
| ----------------------------------------------------------- | ------------------------------------------- |
| `src/server/modules/proxy/proxy.module.ts`                  | NestJS module definition                    |
| `src/server/modules/proxy/proxy.service.ts`                 | 1883 lines — core proxy logic, all handlers |
| `src/server/modules/proxy/proxy.controller.ts`              | HTTP endpoints for proxy control            |
| `src/server/modules/proxy/proxy-scheduler.service.ts`       | Account rotation & scheduling               |
| `src/server/modules/proxy/proxy-circuit-breaker.service.ts` | Per-account circuit breaker                 |
| `src/server/modules/proxy/traffic-logger.service.ts`        | Request/response logging                    |
| `src/server/modules/proxy/proxy-metrics.service.ts`         | Prometheus metrics                          |
| `src/server/modules/proxy/proxy-model-mapper.service.ts`    | Model name resolution                       |
| `src/server/modules/proxy/proxy-parity.service.ts`          | Parity testing                              |
| `src/server/modules/proxy/proxy-replay.service.ts`          | Request replay                              |
| `src/server/modules/proxy/proxy-config.service.ts`          | Config management                           |
| `src/server/modules/proxy/proxy-upstream.service.ts`        | Upstream proxy support                      |

### IPC Layer

| File                      | Role                         |
| ------------------------- | ---------------------------- |
| `src/ipc/router.ts`       | Main IPC router composition  |
| `src/ipc/proxy/router.ts` | Proxy-specific IPC endpoints |
| `src/ipc/manager.ts`      | IPC client initialization    |

### Types & Schema

| File                  | Role                                             |
| --------------------- | ------------------------------------------------ |
| `src/types/config.ts` | `ProxyConfig` Zod schema — reveals hidden fields |
| `src/types/proxy.ts`  | Request/response types                           |

## Hidden ProxyConfig Fields

The `ProxyConfig` schema in `src/types/config.ts` contains many fields never shown in the UI:

```typescript
interface ProxyConfig {
  // Shown in UI
  enabled: boolean;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;

  // Hidden from UI
  scheduler: {
    maxRequestsPerAccount: number;
    maxWaitTime: number;
    retryAttempts: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    priorityAccounts: string[];
  };
  upstreamProxy?: {
    url: string;
    auth?: { username: string; password: string };
    bypassList: string[];
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
  logging: {
    enabled: boolean;
    maxEntries: number;
    retentionDays: number;
  };
  metrics: {
    enabled: boolean;
    histogramBuckets: number[];
  };
  modelMappings: Array<{
    from: string;
    to: string;
    provider: string;
    enabled: boolean;
  }>;
}
```

## Data Flow

```
┌─────────────────┐     IPC      ┌──────────────────┐
│   proxy.tsx     │ ◄──────────► │  proxy/router.ts │
│   (React UI)    │              │   (IPC handlers) │
└─────────────────┘              └────────┬─────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │   ProxyController    │
                              │   (HTTP endpoints)   │
                              └────────┬─────────────┘
                                       │
                                       ▼
                              ┌──────────────────────┐
                              │    ProxyService      │
                              │  (Core orchestrator) │
                              └────────┬─────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌─────────────┐   ┌───────────────┐   ┌──────────────┐
           │  Scheduler  │   │ CircuitBreaker│   │Model Mapper  │
           └─────────────┘   └───────────────┘   └──────────────┘
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌─────────────┐   ┌───────────────┐   ┌──────────────┐
           │TrafficLogger│   │MetricsService │   │ParityService │
           └─────────────┘   └───────────────┘   └──────────────┘
```

## Key Observations

1. **Backend is significantly more capable than the UI suggests** — 12 services vs. 1 page
2. **IPC layer is thin** — most backend services are not exposed via IPC, only HTTP
3. **ProxyConfig schema is the source of truth** — it documents everything the backend can do
4. **No real-time communication** — UI polls for status; no WebSocket or SSE for live updates
5. **Separation of concerns is good on backend**, terrible on frontend (724-line monolith)

## Recommended Architecture Changes

1. Extend `src/ipc/proxy/router.ts` to expose all `ProxyConfig` fields
2. Add IPC endpoints for:
   - `proxy.getTrafficLogs()`
   - `proxy.getCircuitBreakerStatus()`
   - `proxy.getMetrics()`
   - `proxy.replayRequest()`
3. Create a WebSocket or SSE channel for live traffic updates
4. Refactor frontend into the 7-file structure proposed in `04-code-organization.md`
