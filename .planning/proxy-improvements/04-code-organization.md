# Proxy Page — Code Organization Refactoring Plan

> Generated from oracle agent analysis of `src/routes/proxy.tsx`
> Date: 2026-04-22

## Current State

`src/routes/proxy.tsx` is a **724-line monolith** containing:

- Route definition
- State management (useState, useEffect, useMemo)
- Data fetching (useQuery equivalents for proxy config, local IPs)
- Derived state (code examples, URLs)
- UI rendering (service card, model mapping, code examples, local access banner)
- Event handlers (start/stop, copy, protocol change)
- Constants and helper functions

## Target Architecture

Split into **7+ files** following the project's conventions:

```
src/
├── routes/
│   └── proxy.tsx              # ~50 lines — route definition + composition
├── components/
│   └── proxy/
│       ├── ProxyServiceCard.tsx
│       ├── ProxyModelMappingCard.tsx
│       ├── ProxyUsageExamplesCard.tsx
│       └── ProxyLocalAccessBanner.tsx
├── hooks/
│   ├── useProxyConfig.ts
│   ├── useLocalIps.ts
│   └── useProxyExamples.ts
├── constants/
│   └── proxy.ts               # API endpoints, default ports, protocols
└── utils/
    └── proxy.ts               # URL builders, formatters, parsers
```

## File Breakdown

### 1. `src/hooks/useProxyConfig.ts`

**Responsibility**: Fetch and mutate proxy configuration

```typescript
export function useProxyConfig() {
  // Fetches from ipc.client.proxy.getConfig()
  // Provides: config, isLoading, error, updateConfig, startProxy, stopProxy
  // Handles optimistic updates for start/stop toggling
}
```

### 2. `src/hooks/useLocalIps.ts`

**Responsibility**: Get local IP addresses for the access banner

```typescript
export function useLocalIps() {
  // Fetches from ipc.client.system.getLocalIps()
  // Returns: ips[], isLoading, error
}
```

### 3. `src/hooks/useProxyExamples.ts`

**Responsibility**: Generate code examples based on current config

```typescript
export function useProxyExamples(config: ProxyConfig, localIps: string[]) {
  // Returns memoized examples for curl, Python, Node.js
  // Updates when port, protocol, or API key changes
}
```

### 4. `src/components/proxy/ProxyServiceCard.tsx`

**Responsibility**: The main service control card

- Start/stop toggle
- Port input
- Protocol selector
- API key display (with mask/reveal)
- Status indicator

### 5. `src/components/proxy/ProxyModelMappingCard.tsx`

**Responsibility**: Model mapping display/editor

- Read-only list (current state)
- Future: editable table with add/remove
- Show provider badges

### 6. `src/components/proxy/ProxyUsageExamplesCard.tsx`

**Responsibility**: Code examples section

- Collapsible/accordion layout
- Tabs for different languages
- Copy-to-clipboard buttons
- Syntax highlighting (if available)

### 7. `src/components/proxy/ProxyLocalAccessBanner.tsx`

**Responsibility**: "Access your proxy locally" banner

- Show local IPs
- QR code (future)
- Copy URL buttons

### 8. `src/constants/proxy.ts`

**Responsibility**: Constants

```typescript
export const DEFAULT_PROXY_PORT = 3000;
export const PROTOCOLS = ['http', 'https'] as const;
export const EXAMPLE_MODELS = ['gpt-4o', 'claude-3-opus', 'gemini-pro'];
```

### 9. `src/utils/proxy.ts`

**Responsibility**: Pure helper functions

```typescript
export function buildProxyUrl(protocol: string, ip: string, port: number): string;
export function maskApiKey(key: string): string;
export function formatCurlExample(url: string, model: string, apiKey: string): string;
```

## Route File After Refactoring

```typescript
// src/routes/proxy.tsx — ~50 lines
import { createFileRoute } from '@tanstack/react-router';
import { useProxyConfig } from '@/hooks/useProxyConfig';
import { useLocalIps } from '@/hooks/useLocalIps';
import { ProxyServiceCard } from '@/components/proxy/ProxyServiceCard';
import { ProxyModelMappingCard } from '@/components/proxy/ProxyModelMappingCard';
import { ProxyUsageExamplesCard } from '@/components/proxy/ProxyUsageExamplesCard';
import { ProxyLocalAccessBanner } from '@/components/proxy/ProxyLocalAccessBanner';

function ProxyPage() {
  const { config, isLoading, startProxy, stopProxy } = useProxyConfig();
  const { ips } = useLocalIps();

  if (isLoading) return <ProxySkeleton />;

  return (
    <div className="space-y-6 p-6">
      <ProxyServiceCard config={config} onStart={startProxy} onStop={stopProxy} />
      <ProxyModelMappingCard mappings={config.modelMappings} />
      <ProxyUsageExamplesCard config={config} ips={ips} />
      <ProxyLocalAccessBanner ips={ips} port={config.port} />
    </div>
  );
}

export const Route = createFileRoute('/proxy')({ component: ProxyPage });
```

## Migration Steps

1. Create new files (hooks, components, constants, utils)
2. Move code from `proxy.tsx` to appropriate files
3. Update imports in `proxy.tsx`
4. Extract and test each hook independently
5. Add Storybook stories for each component (if Storybook is used)
6. Verify no regression in functionality

## Benefits

- **Testability**: Each hook and component can be unit tested in isolation
- **Reusability**: `useLocalIps` can be used in other pages (e.g., settings)
- **Maintainability**: 50-line route file vs. 724-line monolith
- **Code review**: Smaller files = faster, more focused PRs
- **Onboarding**: New developers can understand the page in minutes
