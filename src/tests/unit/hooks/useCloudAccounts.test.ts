// @ts-nocheck
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isLoading: false, error: null })),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(),
}));

vi.mock('@/actions/cloud', () => ({
  listCloudAccounts: vi.fn(),
  addGoogleAccount: vi.fn(),
  deleteCloudAccount: vi.fn(),
  refreshAccountQuota: vi.fn(),
  setAccountProxy: vi.fn(),
  listOAuthClients: vi.fn(),
  setActiveOAuthClient: vi.fn(),
  switchCloudAccount: vi.fn(),
  getAutoSwitchEnabled: vi.fn(),
  setAutoSwitchEnabled: vi.fn(),
  forcePollCloudMonitor: vi.fn(),
  syncLocalAccount: vi.fn(),
  exportCloudAccounts: vi.fn(),
  importCloudAccounts: vi.fn(),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cloudActions from '@/actions/cloud';
import {
  useCloudAccounts,
  useAddGoogleAccount,
  useDeleteCloudAccount,
  useRefreshQuota,
  useSwitchCloudAccount,
  useSetAccountProxy,
  useAutoSwitchEnabled,
  useSetAutoSwitchEnabled,
  useOAuthClients,
  useSetActiveOAuthClient,
  useForcePollCloudMonitor,
  useSyncLocalAccount,
  useExportCloudAccounts,
  useImportCloudAccounts,
  QUERY_KEYS,
  AUTO_SWITCH_KEY,
} from '@/hooks/useCloudAccounts';
import type { CloudAccount } from '@/types/cloudAccount';

const mockedUseQuery = vi.mocked(useQuery);
const mockedUseMutation = vi.mocked(useMutation);
const mockedUseQueryClient = vi.mocked(useQueryClient);

function getLastQueryOptions() {
  return mockedUseQuery.mock.lastCall?.[0];
}

function getLastMutationOptions(): any {
  return mockedUseMutation.mock.lastCall?.[0];
}

describe('useCloudAccounts hooks', () => {
  const mockInvalidateQueries = vi.fn();
  const mockSetQueryData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
      setQueryData: mockSetQueryData,
    } as any);
  });

  describe('useCloudAccounts', () => {
    it('calls useQuery with cloudAccounts key and listCloudAccounts fn', () => {
      renderHook(() => useCloudAccounts());
      const options = getLastQueryOptions();
      expect(options?.queryKey).toEqual(QUERY_KEYS.cloudAccounts);
      expect(options?.queryFn).toBe(cloudActions.listCloudAccounts);
      expect(options?.staleTime).toBe(1000 * 60);
    });
  });

  describe('useAddGoogleAccount', () => {
    it('calls useMutation with addGoogleAccount and invalidates cloudAccounts on success', () => {
      renderHook(() => useAddGoogleAccount());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.addGoogleAccount);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });
  });

  describe('useDeleteCloudAccount', () => {
    it('calls useMutation with deleteCloudAccount and invalidates cloudAccounts on success', () => {
      renderHook(() => useDeleteCloudAccount());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.deleteCloudAccount);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });
  });

  describe('useRefreshQuota', () => {
    it('calls useMutation with refreshAccountQuota', () => {
      renderHook(() => useRefreshQuota());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.refreshAccountQuota);
    });

    it('optimistically updates existing account on success', () => {
      renderHook(() => useRefreshQuota());
      const options = getLastMutationOptions();
      const updatedAccount: CloudAccount = { id: 'acc-2' } as CloudAccount;
      const oldData: CloudAccount[] = [
        { id: 'acc-1' } as CloudAccount,
        { id: 'acc-2', name: 'Old' } as CloudAccount,
      ];

      options?.onSuccess?.(updatedAccount);
      const updater = mockSetQueryData.mock.calls[0][1] as (prev: CloudAccount[] | undefined) => CloudAccount[];
      const result = updater(oldData);
      expect(result).toEqual([oldData[0], updatedAccount]);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });

    it('creates array with updated account when old data is undefined', () => {
      renderHook(() => useRefreshQuota());
      const options = getLastMutationOptions();
      const updatedAccount: CloudAccount = { id: 'acc-1' } as CloudAccount;

      options?.onSuccess?.(updatedAccount);
      const updater = mockSetQueryData.mock.calls[0][1] as (prev: CloudAccount[] | undefined) => CloudAccount[];
      const result = updater(undefined);
      expect(result).toEqual([updatedAccount]);
    });
  });

  describe('useSwitchCloudAccount', () => {
    it('calls useMutation with switchCloudAccount and invalidates correct keys on success', () => {
      renderHook(() => useSwitchCloudAccount());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.switchCloudAccount);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['currentAccount'] });
    });
  });

  describe('useSetAccountProxy', () => {
    it('calls useMutation with setAccountProxy and invalidates cloudAccounts on success', () => {
      renderHook(() => useSetAccountProxy());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.setAccountProxy);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });

    it('logs error on mutation failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderHook(() => useSetAccountProxy());
      const options = getLastMutationOptions();
      const error = new Error('proxy failed');

      options?.onError?.(error);
      expect(consoleSpy).toHaveBeenCalledWith('[Mutation] setAccountProxy failed:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('useAutoSwitchEnabled', () => {
    it('calls useQuery with autoSwitchEnabled key and getAutoSwitchEnabled fn', () => {
      renderHook(() => useAutoSwitchEnabled());
      const options = getLastQueryOptions();
      expect(options?.queryKey).toEqual(AUTO_SWITCH_KEY);
      expect(options?.queryFn).toBe(cloudActions.getAutoSwitchEnabled);
      expect(options?.staleTime).toBe(Infinity);
    });
  });

  describe('useSetAutoSwitchEnabled', () => {
    it('calls useMutation with setAutoSwitchEnabled and updates query data on success', () => {
      renderHook(() => useSetAutoSwitchEnabled());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.setAutoSwitchEnabled);

      options?.onSuccess?.({}, { enabled: true });
      expect(mockSetQueryData).toHaveBeenCalledWith(AUTO_SWITCH_KEY, true);
    });
  });

  describe('useOAuthClients', () => {
    it('calls useQuery with oauthClients key and listOAuthClients fn', () => {
      renderHook(() => useOAuthClients());
      const options = getLastQueryOptions();
      expect(options?.queryKey).toEqual(QUERY_KEYS.oauthClients);
      expect(options?.queryFn).toBe(cloudActions.listOAuthClients);
      expect(options?.staleTime).toBe(1000 * 60 * 5);
    });
  });

  describe('useSetActiveOAuthClient', () => {
    it('calls useMutation with setActiveOAuthClient and invalidates oauthClients on success', () => {
      renderHook(() => useSetActiveOAuthClient());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.setActiveOAuthClient);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.oauthClients });
    });
  });

  describe('useForcePollCloudMonitor', () => {
    it('calls useMutation with forcePollCloudMonitor and invalidates cloudAccounts on success', () => {
      renderHook(() => useForcePollCloudMonitor());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.forcePollCloudMonitor);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });
  });

  describe('useSyncLocalAccount', () => {
    it('calls useMutation with syncLocalAccount and invalidates cloudAccounts on success', () => {
      renderHook(() => useSyncLocalAccount());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.syncLocalAccount);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });
  });

  describe('useExportCloudAccounts', () => {
    it('calls useMutation with exportCloudAccounts and no invalidation', () => {
      renderHook(() => useExportCloudAccounts());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.exportCloudAccounts);
      expect(options?.onSuccess).toBeUndefined();
    });
  });

  describe('useImportCloudAccounts', () => {
    it('calls useMutation with importCloudAccounts and invalidates cloudAccounts on success', () => {
      renderHook(() => useImportCloudAccounts());
      const options = getLastMutationOptions();
      expect(options?.mutationFn).toBe(cloudActions.importCloudAccounts);

      options?.onSuccess?.();
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.cloudAccounts });
    });

    it('logs error on mutation failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderHook(() => useImportCloudAccounts());
      const options = getLastMutationOptions();
      const error = new Error('import failed');

      options?.onError?.(error);
      expect(consoleSpy).toHaveBeenCalledWith('[Mutation] importCloudAccounts failed:', error);
      consoleSpy.mockRestore();
    });
  });
});
