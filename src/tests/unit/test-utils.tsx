import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from './mocks/tanstack-query';

/**
 * Combines multiple React providers into a single wrapper for tests.
 */
export function createProviderWrapper() {
  const queryClient = createTestQueryClient();

  return function AllProviders({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

/**
 * Render a React component with all necessary providers.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const Wrapper = createProviderWrapper();
  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Factory for creating mock cloud accounts.
 */
export function createMockAccount(
  overrides?: Partial<{
    id: string;
    email: string;
    name: string;
    avatar: string;
    status: string;
    quota: number;
    quotaUsed: number;
    provider: string;
    isActive: boolean;
  }>,
) {
  return {
    id: 'acc-1',
    email: 'test@example.com',
    name: 'Test Account',
    avatar: 'https://example.com/avatar.png',
    status: 'active',
    quota: 1000,
    quotaUsed: 250,
    provider: 'google',
    isActive: true,
    ...overrides,
  };
}

/**
 * Factory for creating mock usage records.
 */
export function createMockUsage(
  overrides?: Partial<{
    id: number;
    accountId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    timestamp: Date;
  }>,
) {
  return {
    id: 1,
    accountId: 'acc-1',
    model: 'gemini-pro',
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
    timestamp: new Date('2026-04-23T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Factory for creating mock proxy metrics.
 */
export function createMockProxyMetrics(
  overrides?: Partial<{
    id: number;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    timestamp: Date;
  }>,
) {
  return {
    id: 1,
    endpoint: '/v1/chat/completions',
    method: 'POST',
    statusCode: 200,
    latencyMs: 150,
    timestamp: new Date('2026-04-23T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Factory for creating mock app config.
 */
export function createMockConfig(
  overrides?: Partial<{
    proxyPort: number;
    proxyTimeout: number;
    theme: string;
    language: string;
    autoSwitch: boolean;
  }>,
) {
  return {
    proxyPort: 3000,
    proxyTimeout: 30000,
    theme: 'system',
    language: 'en',
    autoSwitch: true,
    ...overrides,
  };
}
