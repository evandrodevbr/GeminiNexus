// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProviderGrouping } from '@/hooks/useProviderGrouping';
import type { CloudAccount } from '@/types/cloudAccount';

vi.mock('@/hooks/useAppConfig', () => ({
  useAppConfig: vi.fn(),
}));

import { useAppConfig } from '@/hooks/useAppConfig';

const mockUseAppConfig = vi.mocked(useAppConfig);

function createMockAccount(overrides?: Partial<CloudAccount>): CloudAccount {
  return {
    id: 'acc-1',
    provider: 'google',
    email: 'test@example.com',
    token: {} as CloudAccount['token'],
    created_at: Date.now(),
    last_used: Date.now(),
    ...overrides,
  };
}

describe('useProviderGrouping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns enabled=false when provider_groupings_enabled is undefined', () => {
    mockUseAppConfig.mockReturnValue({ config: {} } as any);
    const { result } = renderHook(() => useProviderGrouping());
    expect(result.current.enabled).toBe(false);
  });

  it('returns enabled=true when provider_groupings_enabled is true', () => {
    mockUseAppConfig.mockReturnValue({ config: { provider_groupings_enabled: true } } as any);
    const { result } = renderHook(() => useProviderGrouping());
    expect(result.current.enabled).toBe(true);
  });

  describe('getAccountStats', () => {
    it('returns correct stats for an account with models', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const account = createMockAccount({
        quota: {
          models: {
            'gemini-1.5-pro': { percentage: 80, resetTime: '' },
            'claude-3-5-sonnet': { percentage: 60, resetTime: '' },
          },
        },
      });

      const { result } = renderHook(() => useProviderGrouping());
      const stats = result.current.getAccountStats(account);
      expect(stats.providers).toHaveLength(2);
      expect(stats.totalModels).toBe(2);
      expect(stats.visibleModels).toBe(2);
      expect(stats.overallPercentage).toBe(70);
    });

    it('respects model visibility settings', () => {
      mockUseAppConfig.mockReturnValue({
        config: {
          provider_groupings_enabled: true,
          model_visibility: { 'claude-3-5-sonnet': false },
        },
      } as any);

      const account = createMockAccount({
        quota: {
          models: {
            'gemini-1.5-pro': { percentage: 80, resetTime: '' },
            'claude-3-5-sonnet': { percentage: 60, resetTime: '' },
          },
        },
      });

      const { result } = renderHook(() => useProviderGrouping());
      const stats = result.current.getAccountStats(account);
      expect(stats.visibleModels).toBe(1);
      expect(stats.overallPercentage).toBe(80);
    });

    it('handles accounts with no quota', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const account = createMockAccount({ quota: undefined });
      const { result } = renderHook(() => useProviderGrouping());
      const stats = result.current.getAccountStats(account);
      expect(stats.providers).toHaveLength(0);
      expect(stats.totalModels).toBe(0);
    });
  });

  describe('toggleProviderCollapse', () => {
    it('toggles provider collapse state on and off', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const { result } = renderHook(() => useProviderGrouping());

      expect(result.current.isProviderCollapsed('acc-1', 'claude-')).toBe(false);

      act(() => {
        result.current.toggleProviderCollapse('acc-1', 'claude-');
      });
      expect(result.current.isProviderCollapsed('acc-1', 'claude-')).toBe(true);

      act(() => {
        result.current.toggleProviderCollapse('acc-1', 'claude-');
      });
      expect(result.current.isProviderCollapsed('acc-1', 'claude-')).toBe(false);
    });

    it('tracks collapse per account independently', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const { result } = renderHook(() => useProviderGrouping());

      act(() => {
        result.current.toggleProviderCollapse('acc-1', 'gemini-');
      });
      expect(result.current.isProviderCollapsed('acc-1', 'gemini-')).toBe(true);
      expect(result.current.isProviderCollapsed('acc-2', 'gemini-')).toBe(false);
    });
  });

  describe('toggleAccountCollapse', () => {
    it('toggles account collapse state on and off', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const { result } = renderHook(() => useProviderGrouping());

      expect(result.current.isAccountCollapsed('acc-1')).toBe(false);

      act(() => {
        result.current.toggleAccountCollapse('acc-1');
      });
      expect(result.current.isAccountCollapsed('acc-1')).toBe(true);

      act(() => {
        result.current.toggleAccountCollapse('acc-1');
      });
      expect(result.current.isAccountCollapsed('acc-1')).toBe(false);
    });

    it('tracks collapse for multiple accounts independently', () => {
      mockUseAppConfig.mockReturnValue({
        config: { provider_groupings_enabled: true, model_visibility: {} },
      } as any);

      const { result } = renderHook(() => useProviderGrouping());

      act(() => {
        result.current.toggleAccountCollapse('acc-1');
        result.current.toggleAccountCollapse('acc-2');
      });

      expect(result.current.isAccountCollapsed('acc-1')).toBe(true);
      expect(result.current.isAccountCollapsed('acc-2')).toBe(true);

      act(() => {
        result.current.toggleAccountCollapse('acc-1');
      });

      expect(result.current.isAccountCollapsed('acc-1')).toBe(false);
      expect(result.current.isAccountCollapsed('acc-2')).toBe(true);
    });
  });
});
