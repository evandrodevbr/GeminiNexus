---
phase: 02-code-review-command
reviewed: 2026-04-22T14:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/ipc/database/cloudHandler.ts
  - src/ipc/database/schema.ts
  - src/ipc/database/usageHandler.ts
  - src/ipc/router.ts
  - src/ipc/usage/router.ts
  - src/server/modules/proxy/proxy.module.ts
  - src/server/modules/proxy/proxy.service.ts
  - src/server/modules/usage/token-usage.service.ts
  - src/types/db.ts
  - src/routes/usage.tsx
status: issues_found
---

# Phase 02-code-review-command: Code Review Report

**Reviewed:** 2026-04-22T14:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This review covers the new Token Usage Counter feature introduced in the `feature/token-usage-counter` branch. The feature introduces a new `token_usage` table in SQLite, an IPC router and UI components for displaying token usage dashboards with charts, and hooks into `ProxyService` to record usage per request.

Overall the architecture is well-structured and aligns with the existing project layout. The introduction of `TokenUsageRepo` directly querying the DB with `getCloudDb()` is consistent with the rest of the app. The UI is built using Recharts and properly localized.

However, there are several **critical security and architecture issues** relating to SQLite usage (specifically SQL injection vulnerabilities in `TokenUsageRepo`) and some minor logic/performance concerns.

## Critical Issues

### CR-01: SQL Injection Vulnerability in TokenUsageRepo filter methods

**File:** `src/ipc/database/usageHandler.ts:33-35`
**Issue:** The `buildAccountFilter` function directly concatenates the `accountId` string into the SQL query without using parameterized queries or escaping. This allows for SQL injection if an attacker can manipulate the `accountId` value.
**Fix:**
Use parameterized queries (e.g., `?` placeholders) and pass the `accountId` as an argument to `raw.prepare().all(accountId)`.

```typescript
function buildAccountFilter(accountId?: string): { sql: string; params: string[] } {
  return accountId ? { sql: `AND account_id = ?`, params: [accountId] } : { sql: '', params: [] };
}
```

### CR-02: Missing try-catch and cleanup around database connection in TokenUsageRepo queries

**File:** `src/ipc/database/usageHandler.ts:89`
**Issue:** In `TokenUsageRepo`, the schema explicitly sets `timestamp` as an `integer`, but `start` and `end` arguments are directly interpolated into the query via `buildDateFilter` (lines 23-29). If `start` or `end` are somehow strings, this could also lead to SQL injection.
**Fix:**
Ensure `start` and `end` are strictly validated as integers before passing to the query, or use parameterized queries.

```typescript
function buildDateFilter(start?: number, end?: number): { sql: string; params: number[] } {
  const conditions: string[] = [];
  const params: number[] = [];
  if (start !== undefined) {
    conditions.push(`timestamp >= ?`);
    params.push(start);
  }
  if (end !== undefined) {
    conditions.push(`timestamp <= ?`);
    params.push(end);
  }
  return {
    sql: conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '',
    params,
  };
}
```

## Warnings

### WR-01: Synchronous Database Writing in ProxyService

**File:** `src/server/modules/proxy/proxy.service.ts:57`
**Issue:** The `recordUsage` method calls `this.tokenUsageService.recordUsage()`, which internally calls `TokenUsageRepo.recordUsage()`. `TokenUsageRepo.recordUsage()` performs a synchronous database insertion (`orm.insert(...).run()`) and closes the connection. Since this is called for every single proxy request (in `handleAnthropicMessages` and `handleOpenAIMessages`), the synchronous opening, inserting, and closing of the database connection could severely impact the performance and throughput of the proxy service under high load.
**Fix:** Consider making the usage recording asynchronous (fire-and-forget), using an asynchronous database driver, or implementing a batching mechanism for token usage recording to avoid blocking the proxy request cycle.

### WR-02: Missing Unsubscribe / Cleanup in React Query hooks

**File:** `src/routes/usage.tsx`
**Issue:** The `useQuery` hooks are configured properly, but the UI lacks an auto-refresh mechanism. Given this is a dashboard tracking live API usage, it might be beneficial to include a `refetchInterval` or a manual refresh button.
**Fix:** Add `refetchInterval: 10000` to the query configuration.

## Info

### IN-01: UI Chart Colors and Styling

**File:** `src/routes/usage.tsx:23`
**Issue:** The `COLORS` array is hardcoded with hex values. In a themable application (e.g., light/dark mode), these colors might not adapt correctly, potentially causing visibility issues on certain backgrounds.
**Fix:** Consider using CSS variables from the theme (e.g., `hsl(var(--primary))`) instead of hardcoded hex colors for Recharts components.

---

_Reviewed: 2026-04-22T14:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
