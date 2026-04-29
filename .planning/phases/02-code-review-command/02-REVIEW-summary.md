Here is the code review report for the Token Usage Counter feature.

## Summary

The review found 2 critical security issues and 2 warnings. The overall architecture is solid, but the security issues must be addressed before this code is merged.

## Critical Issues

### CR-01: SQL Injection Vulnerability in TokenUsageRepo filter methods

**Issue:** `buildAccountFilter` concatenates `accountId` directly into raw SQL.
**Fix:** Use parameterized queries.

```typescript
function buildAccountFilter(accountId?: string): { sql: string; params: string[] } {
  return accountId ? { sql: `AND account_id = ?`, params: [accountId] } : { sql: '', params: [] };
}
```

### CR-02: Missing validation in TokenUsageRepo queries

**Issue:** `buildDateFilter` directly interpolates `start` and `end` arguments.
**Fix:** Ensure parameters are passed safely using parameterized queries.

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

**Issue:** `recordUsage` calls a synchronous database insertion on every proxy request, which can cause severe performance bottlenecks under load.
**Fix:** Consider making the usage recording asynchronous (fire-and-forget), using an asynchronous database driver, or implementing a batching mechanism.

### WR-02: Missing Unsubscribe / Cleanup in React Query hooks

**Issue:** The usage dashboard queries lack an auto-refresh mechanism.
**Fix:** Add `refetchInterval: 10000` to the query configuration.

## Info

Consider using CSS variables for the Recharts colors instead of hardcoded hex values to support light/dark mode better.
