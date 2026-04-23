# Proxy Page — Feature Brainstorm

> Generated from designer agent analysis of `src/routes/proxy.tsx`
> Date: 2026-04-22

## Current State
The proxy page (`src/routes/proxy.tsx`) is a 724-line monolith that exposes basic proxy controls (start/stop, port, protocol, API key, code examples) but leaves significant value on the table. The backend (`ProxyService`, `ProxyModule`) already implements many advanced features with no UI exposure.

## Proposed New Features

### 1. Live Traffic Monitor
- Real-time SSE/WebSocket feed of proxied requests
- Show request method, model, account used, latency, token count
- Filter by status (success, rate-limited, error)
- Inspired by: Request logging already exists in `TrafficLogger`

### 2. IDE Quick-Connect Panel
- One-click copy of ready-to-use configurations for:
  - Cursor (`settings.json` snippet)
  - OpenCode (`.env` snippet)
  - Windsurf (`config.yaml` snippet)
  - Claude Code / CLI tools
- Include the local IP, port, and API key pre-filled
- QR code for mobile/quick access

### 3. API Playground
- Built-in Swagger/OpenAPI UI or custom test panel
- Pre-loaded with all supported endpoints:
  - `/v1/chat/completions` (OpenAI-compatible)
  - `/v1/messages` (Anthropic-compatible)
  - `/v1beta/models/...generateContent` (Gemini-native)
- Allow sending test requests and viewing formatted responses
- Show exact curl equivalent for every request

### 4. Health Dashboard
- Real-time metrics cards:
  - Requests/minute
  - Average latency (p50, p95, p99)
  - Error rate %
  - Active connections
  - Circuit breaker status (open/closed/half-open)
- Sparkline charts for the last 5 minutes
- Color-coded status indicators

### 5. Model Availability Status
- Live grid showing which models are currently available
- Per-model indicators:
  - Green: available
  - Yellow: rate-limited (retry after)
  - Red: unavailable / quota exhausted
- Show last-used time and remaining quota (if known)
- Collapse/expand by provider (Gemini, Anthropic)

### 6. Error Feed
- Scrollable log of recent errors
- Columns: timestamp, endpoint, model, account, error code, message
- Click to expand full request/response
- Filter by error type (rate limit, timeout, auth, network)
- Export to JSON/CSV

### 7. Connection Visualizer
- Diagram showing: IDE → Proxy → Account Pool → Upstream API
- Animated flow dots representing live requests
- Highlight currently active account
- Show queue depth / waiting requests
- Simple but effective for understanding routing

### 8. One-Click Diagnostics
- "Run Diagnostics" button that performs:
  - Check if proxy port is accessible
  - Test each configured account
  - Verify model mapping resolution
  - Check upstream API reachability
  - Validate API key format
- Output: green checkmarks or detailed error report with fix suggestions

### 9. Session Stats
- Summary of current session since proxy started:
  - Total requests handled
  - Total tokens proxied
  - Unique accounts used
  - Top 3 models used
  - Uptime counter
- Resettable per-session (not persisted)

---

## Implementation Notes
- Many of these features require new IPC endpoints in `src/ipc/proxy/router.ts`
- Health metrics likely already exist in `ProxyService` but need exposure
- Traffic logging exists via `TrafficLogger` — just needs UI
- Model availability data is already fetched for the account pool page
