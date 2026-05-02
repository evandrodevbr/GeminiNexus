# Proxy Page — Code Quality Issues

> Generated from fixer agent analysis of `src/routes/proxy.tsx`
> Date: 2026-04-22

## Severity Legend

- 🔴 **Critical**: Bugs or crashes
- 🟡 **High**: Performance or reliability issues
- 🟢 **Medium**: Maintainability or best practice violations

## Issues Found

### 1. 🔴 State Duplication Between Proxy Config and Local State

**Location**: Lines ~120-180
**Issue**: The component maintains both `proxyConfig` (from IPC) and local `useState` copies for `port`, `protocol`, `apiKey`. These can drift out of sync if the backend config changes externally.
**Fix**: Use a single source of truth. Either:

- Derive local state from `proxyConfig` with `useEffect` sync
- Or use `useQuery` with `staleTime: 0` and no local cache

### 2. 🟡 Race Condition in Start/Stop Toggle

**Location**: Lines ~200-250
**Issue**: If user clicks start/stop rapidly, multiple IPC calls fire in parallel. The UI shows intermediate states that may not reflect the actual backend state.
**Fix**: Disable the toggle button while a transition is in progress. Add an `isTransitioning` flag.

### 3. 🟢 Clipboard Error Handling

**Location**: Lines ~300-320
**Issue**: `navigator.clipboard.writeText()` can fail (permission denied, not in secure context). The code has no try/catch.
**Fix**:

```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied!');
  } catch {
    toast.error('Failed to copy');
  }
}
```

### 4. 🟢 Unstable Callbacks Causing Re-renders

**Location**: Throughout
**Issue**: Event handlers are defined inline in JSX, causing child components to re-render unnecessarily.
**Fix**: Wrap handlers in `useCallback`:

```typescript
const handleStart = useCallback(() => startProxy(), [startProxy]);
const handleStop = useCallback(() => stopProxy(), [stopProxy]);
```

### 5. 🟡 Memory Leak in setTimeout

**Location**: Lines ~400-420
**Issue**: A `setTimeout` is used for a "copy feedback" animation but is never cleared on unmount.
**Fix**: Use `useEffect` cleanup:

```typescript
useEffect(() => {
  const timer = setTimeout(() => setCopied(false), 2000);
  return () => clearTimeout(timer);
}, [copied]);
```

### 6. 🟢 Missing Loading States for Mutations

**Location**: Lines ~200-250
**Issue**: When starting/stopping the proxy, there's no loading spinner or disabled state on the button.
**Fix**: Add `isPending` state to the mutation hook and disable the button + show spinner while pending.

### 7. 🟢 Hardcoded i18n Strings

**Location**: Throughout
**Issue**: Many UI strings are hardcoded in English instead of using `useTranslation()`:

- "Proxy Service"
- "Start Proxy"
- "Stop Proxy"
- "Copy"
- "Copied!"
  **Fix**: Extract all strings to `src/localization/i18n.ts` and use `t('proxy.startProxy')`, etc.

### 8. 🟢 Magic Numbers

**Location**: Lines ~450-500
**Issue**: Port validation uses hardcoded `3000`, `65535` without constants.
**Fix**:

```typescript
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const DEFAULT_PORT = 3000;
```

### 9. 🟢 Unsafe Type Cast

**Location**: Lines ~550-600
**Issue**: `event.target.value` is cast to `Protocol` without validation.
**Fix**:

```typescript
const protocol = event.target.value;
if (!PROTOCOLS.includes(protocol)) return;
setProtocol(protocol as Protocol);
```

### 10. 🟡 Dangerous Parsing of Local IPs

**Location**: Lines ~650-700
**Issue**: `localIps` is parsed from a shell command output using string splitting that could break on unexpected formats.
**Fix**: Use a robust parser or, better, expose `os.networkInterfaces()` via a safe IPC endpoint.

### 11. 🟢 Unnecessary Re-renders from Inline Objects

**Location**: Lines ~350-380
**Issue**: Inline style objects and arrays are recreated on every render, breaking `React.memo` optimizations in child components.
**Fix**: Extract static styles outside the component or memoize:

```typescript
const cardStyle = useMemo(() => ({ padding: '1.5rem' }), []);
```

### 12. 🟢 No Validation on Port Input

**Location**: Lines ~150-170
**Issue**: User can type any value into the port field, including non-numbers, negatives, or out-of-range values.
**Fix**: Add input validation:

```typescript
<input
  type="number"
  min={1024}
  max={65535}
  value={port}
  onChange={(e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1024 && value <= 65535) setPort(value);
  }}
/>
```

---

## Testing Recommendations

- Add unit tests for `useProxyConfig` hook (mock IPC client)
- Test race conditions: rapid start/stop clicks
- Test clipboard failure path
- Test port validation edge cases (0, 80, 65536, NaN)
- Test with `react-testing-library` + `user-event`
