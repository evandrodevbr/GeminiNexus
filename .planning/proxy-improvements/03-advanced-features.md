# Proxy Page — Advanced Features Hidden in Backend

> Generated from oracle agent analysis of `src/server/modules/proxy/`
> Date: 2026-04-22

## Discovery
The backend (`ProxyService`, `ProxyController`, `ProxyModule`) implements many sophisticated features that are **completely invisible** in the current UI. The proxy page only shows: port, protocol, API key, and basic start/stop.

## Hidden Backend Features

### 1. Advanced Routing & Scheduling Controls
**Backend location**: `proxy.service.ts`, `proxy-scheduler.service.ts`
**What's implemented**:
- `scheduler.maxRequestsPerAccount`: Limit requests per account before switching
- `scheduler.maxWaitTime`: Max time to wait for an available account
- `scheduler.retryAttempts`: Number of retries per request
- `scheduler.backoffStrategy`: `exponential` | `linear` | `fixed`
- `scheduler.priorityAccounts`: Array of account IDs to prioritize

**UI exposure**: None. These are hardcoded or set via config files only.

### 2. Live Traffic Inspector
**Backend location**: `traffic-logger.service.ts`
**What's implemented**:
- `TrafficLogger` captures every request/response with metadata
- Fields: timestamp, requestId, accountId, model, promptTokens, completionTokens, latency, status, error
- Log rotation and cleanup policies
- Export to JSON/CSV

**UI exposure**: None. Logs are only written to files.

### 3. Circuit Breaker Dashboard
**Backend location**: `proxy-circuit-breaker.service.ts`
**What's implemented**:
- Per-account circuit breaker state: `CLOSED`, `OPEN`, `HALF_OPEN`
- Failure threshold and recovery timeout
- When open: requests fail fast without hitting the API
- Metrics: failure rate, last failure time, consecutive successes

**UI exposure**: None. Circuit breaker state is internal only.

### 4. Parity Testing Sandbox
**Backend location**: `proxy-parity.service.ts`
**What's implemented**:
- Send identical requests to multiple models simultaneously
- Compare responses for consistency
- Detect model drift or API changes
- Configurable test suites

**UI exposure**: None. Only accessible via manual API calls or scripts.

### 5. Custom Model Mapping Table
**Backend location**: `proxy-model-mapper.service.ts`
**What's implemented**:
- Dynamic model resolution: `claude-opus-4` → `gemini-3-flash`
- User-defined mappings stored in database
- Regex-based model matching
- Fallback chain: if mapped model unavailable, try next

**UI exposure**: A static, read-only list is shown. No editing capability.

### 6. Upstream Proxy Configuration
**Backend location**: `proxy-upstream.service.ts`
**What's implemented**:
- `upstreamProxy.url`: Route all traffic through another proxy
- `upstreamProxy.auth`: Basic auth or bearer token for upstream
- `upstreamProxy.bypassList`: Domains to bypass

**UI exposure**: None. Set via environment variables only.

### 7. IDE Integration Quick-Setup
**Backend location**: `proxy-config.service.ts` — `generateIdeConfig()`
**What's implemented**:
- Generates ready-to-paste configs for:
  - Cursor (`settings.json`)
  - VS Code + Cline/Roo Code
  - OpenCode (`.env`)
  - Claude Code (`claude_desktop_config.json`)
  - Generic OpenAI client
- Includes local IP detection, port, and API key

**UI exposure**: Code examples are generic curl snippets. No IDE-specific configs.

### 8. Health & Performance Metrics
**Backend location**: `proxy-metrics.service.ts`
**What's implemented**:
- Request latency histogram (p50, p95, p99)
- Requests per minute counter
- Error rate by status code
- Active connection gauge
- Token throughput (tokens/minute)
- Account utilization percentage

**UI exposure**: None. Metrics are only exposed via a `/metrics` endpoint for Prometheus.

### 9. Request Replay & Debug Tool
**Backend location**: `proxy-replay.service.ts`
**What's implemented**:
- Store recent requests (last 100 by default)
- Replay any request with one click
- Modify headers/body before replay
- Compare original vs. replayed response
- Export request as curl command

**UI exposure**: None.

### 10. Global Timeout & Max Wait Controls
**Backend location**: `proxy-config.service.ts`
**What's implemented**:
- `requestTimeout`: Global timeout for all upstream requests
- `connectTimeout`: TCP connection timeout
- `maxWaitTime`: Max time to wait for an available account
- `idleTimeout`: Close idle connections after N seconds

**UI exposure**: None. Hardcoded defaults.

---

## Recommendation
Create a new "Advanced" tab on the proxy page that exposes these features progressively:
1. **Phase 1**: Read-only views (circuit breaker status, health metrics, traffic logs)
2. **Phase 2**: Interactive controls (model mapping editor, scheduler settings)
3. **Phase 3**: Power-user tools (replay, parity testing, upstream proxy config)

This would transform the proxy page from a simple on/off switch into a comprehensive API gateway dashboard.
