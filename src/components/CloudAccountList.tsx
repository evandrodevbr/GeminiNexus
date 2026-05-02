import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, Loader2, RefreshCw } from 'lucide-react';
import { filter, flatMap, isEmpty, isNumber, size, sumBy } from 'lodash-es';

import {
  useAddGoogleAccount,
  useAutoSwitchEnabled,
  useCloudAccounts,
  useDeleteCloudAccount,
  useExportCloudAccounts,
  useForcePollCloudMonitor,
  useImportCloudAccounts,
  useOAuthClients,
  useRefreshQuota,
  useSetActiveOAuthClient,
  useSetAutoSwitchEnabled,
  useSyncLocalAccount,
  useSwitchCloudAccount,
  startAuthFlow,
} from '@/hooks/useCloudAccounts';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { getLocalizedErrorMessage } from '@/utils/errorMessages';
import {
  formatAiCreditsAmount,
  getAccountSortValue,
  getQuotaStatus,
  roundQuotaPercentage,
} from '@/utils/quota-display';
import { shouldAutoSubmitGoogleAuthCode } from '@/utils/googleAuthSubmission';
import { CloudAccount } from '@/types/cloudAccount';

import { AccountsHeader } from '@/components/accounts/AccountsHeader';
import { AccountsToolbar } from '@/components/accounts/AccountsToolbar';
import { AddAccountDialog } from '@/components/accounts/AddAccountDialog';
import { ExportImportDialogs } from '@/components/accounts/ExportImportDialogs';
import { BatchActionBar } from '@/components/accounts/BatchActionBar';
import { AccountsGrid } from '@/components/accounts/AccountsGrid';
import { IdentityProfileDialog } from '@/components/IdentityProfileDialog';

export type GridLayout = 'auto' | '2-col' | '3-col' | 'list' | 'compact';

export function CloudAccountList() {
  const { t } = useTranslation();
  const { data: accounts, isLoading, isError, error, errorUpdatedAt, refetch } = useCloudAccounts();
  const { config, saveConfig } = useAppConfig();
  const refreshMutation = useRefreshQuota();
  const deleteMutation = useDeleteCloudAccount();
  const addMutation = useAddGoogleAccount();
  const switchMutation = useSwitchCloudAccount();
  const syncMutation = useSyncLocalAccount();
  const { data: autoSwitchEnabled, isLoading: isSettingsLoading } = useAutoSwitchEnabled();
  const setAutoSwitchMutation = useSetAutoSwitchEnabled();
  const forcePollMutation = useForcePollCloudMonitor();
  const { data: oauthClients = [], isLoading: isOAuthClientsLoading } = useOAuthClients();
  const setActiveOAuthClientMutation = useSetActiveOAuthClient();
  const exportMutation = useExportCloudAccounts();
  const importMutation = useImportCloudAccounts();
  const { toast } = useToast();

  const lastLoadErrorToastAtRef = useRef<number>(0);
  const lastSubmittedAuthCodeRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gridLayout: GridLayout = (config?.grid_layout as GridLayout) || 'auto';
  const sortOptions = [
    'recently-used',
    'quota-overall',
    'quota-claude',
    'quota-pro3',
    'quota-flash',
  ] as const;
  type SortOption = (typeof sortOptions)[number];
  const currentSort: SortOption = (config?.account_sort as SortOption) || 'recently-used';
  const sortI18nKeys: Record<string, string> = {
    'recently-used': 'cloud.sort.recentlyUsed',
    'quota-overall': 'cloud.sort.quotaOverall',
    'quota-claude': 'cloud.sort.quotaClaude',
    'quota-pro3': 'cloud.sort.quotaPro3',
    'quota-flash': 'cloud.sort.quotaFlash',
  };

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [selectedOAuthClientKey, setSelectedOAuthClientKey] = useState('');
  const [identityAccount, setIdentityAccount] = useState<CloudAccount | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<'merge' | 'overwrite' | 'skip-existing'>(
    'merge',
  );
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sortedAccounts = useMemo(() => {
    if (!accounts?.length) return [];
    const activeAccounts = accounts.filter((a) => a.is_active);
    const otherAccounts = accounts.filter((a) => !a.is_active);
    const sortedActive = [...activeAccounts].sort(
      (a, b) => (b.last_used ?? 0) - (a.last_used ?? 0),
    );
    const sortedOthers = [...otherAccounts].sort((a, b) =>
      currentSort === 'recently-used'
        ? (b.last_used ?? 0) - (a.last_used ?? 0)
        : getAccountSortValue(b, currentSort) - getAccountSortValue(a, currentSort),
    );
    return [...sortedActive, ...sortedOthers];
  }, [accounts, currentSort]);

  const overallQuotaPercentage = useMemo(() => {
    if (!accounts?.length) return null;
    const visibilitySettings = config?.model_visibility ?? {};
    const visibleModelInfos = flatMap(accounts, (account) => {
      if (!account.quota?.models) return [];
      return Object.entries(account.quota.models)
        .filter(([modelName]) => visibilitySettings[modelName] !== false)
        .map(([, info]) => info);
    });
    if (isEmpty(visibleModelInfos)) return null;
    return roundQuotaPercentage(
      sumBy(visibleModelInfos, (modelInfo) => modelInfo.percentage) / visibleModelInfos.length,
    );
  }, [accounts, config?.model_visibility]);

  const overallQuotaStatus =
    overallQuotaPercentage === null ? null : getQuotaStatus(overallQuotaPercentage);
  const totalAccounts = size(accounts);
  const activeAccounts = filter(accounts, (account) => account.is_active).length;
  const rateLimitedAccounts = filter(
    accounts,
    (account) => account.status === 'rate_limited',
  ).length;

  const submitAuthCode = useCallback(
    (incomingAuthCode?: string) => {
      const codeToUse = incomingAuthCode || authCode;
      if (!codeToUse) return;
      lastSubmittedAuthCodeRef.current = codeToUse;
      addMutation.mutate(
        {
          authCode: codeToUse,
          oauthClientKey:
            selectedOAuthClientKey || oauthClients.find((client) => client.is_active)?.key,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            setAuthCode('');
            lastSubmittedAuthCodeRef.current = null;
            toast({ title: t('cloud.toast.addSuccess') });
          },
          onError: (err) =>
            toast({
              title: t('cloud.toast.addFailed.title'),
              description: getLocalizedErrorMessage(err, t),
              variant: 'destructive',
            }),
        },
      );
    },
    [addMutation, authCode, oauthClients, selectedOAuthClientKey, t, toast],
  );

  useEffect(() => {
    const activeClientKey = oauthClients.find((client) => client.is_active)?.key;
    if (activeClientKey && activeClientKey !== selectedOAuthClientKey) {
      setTimeout(() => setSelectedOAuthClientKey(activeClientKey), 0);
    }
  }, [oauthClients, selectedOAuthClientKey]);
  useEffect(() => {
    if (window.electron?.onGoogleAuthCode) {
      return window.electron.onGoogleAuthCode((code) => {
        lastSubmittedAuthCodeRef.current = null;
        setAuthCode(code);
      });
    }
  }, []);
  useEffect(() => {
    if (
      shouldAutoSubmitGoogleAuthCode({
        authCode,
        isAddDialogOpen,
        isPending: addMutation.isPending,
        lastSubmittedAuthCode: lastSubmittedAuthCodeRef.current,
      })
    )
      submitAuthCode(authCode);
  }, [addMutation.isPending, authCode, isAddDialogOpen, submitAuthCode]);
  useEffect(() => {
    if (!isError || !errorUpdatedAt || errorUpdatedAt === lastLoadErrorToastAtRef.current) return;
    toast({
      title: t('cloud.error.loadFailed'),
      description: getLocalizedErrorMessage(error, t),
      variant: 'destructive',
    });
    lastLoadErrorToastAtRef.current = errorUpdatedAt;
  }, [error, errorUpdatedAt, isError, t, toast]);

  const handleRefresh = (id: string) => {
    refreshMutation.mutate(
      { accountId: id },
      {
        onSuccess: (updatedAccount) => {
          const credits = updatedAccount.quota?.ai_credits?.credits;
          toast({
            title: t('cloud.toast.quotaRefreshed'),
            description: isNumber(credits)
              ? t('cloud.toast.refreshCreditsAvailable', { amount: formatAiCreditsAmount(credits) })
              : t('cloud.toast.refreshCreditsUnavailable'),
          });
        },
        onError: () => toast({ title: t('cloud.toast.refreshFailed'), variant: 'destructive' }),
      },
    );
  };
  const handleDelete = (id: string) => {
    if (confirm(t('cloud.toast.deleteConfirm'))) {
      deleteMutation.mutate(
        { accountId: id },
        {
          onSuccess: () => {
            toast({ title: t('cloud.toast.deleted') });
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          },
          onError: () => toast({ title: t('cloud.toast.deleteFailed'), variant: 'destructive' }),
        },
      );
    }
  };
  const handleSwitch = (id: string) => {
    switchMutation.mutate(
      { accountId: id },
      {
        onSuccess: () =>
          toast({
            title: t('cloud.toast.switched.title'),
            description: t('cloud.toast.switched.description'),
          }),
        onError: (err) =>
          toast({
            title: t('cloud.toast.switchFailed'),
            description: getLocalizedErrorMessage(err, t),
            variant: 'destructive',
          }),
      },
    );
  };
  const handleManageIdentity = (id: string) => {
    setIdentityAccount((accounts || []).find((item) => item.id === id) || null);
  };
  const handleToggleAutoSwitch = (checked: boolean) => {
    setAutoSwitchMutation.mutate(
      { enabled: checked },
      {
        onSuccess: () =>
          toast({
            title: checked ? t('cloud.toast.autoSwitchOn') : t('cloud.toast.autoSwitchOff'),
          }),
        onError: () =>
          toast({ title: t('cloud.toast.updateSettingsFailed'), variant: 'destructive' }),
      },
    );
  };
  const handleForcePoll = () => {
    if (forcePollMutation.isPending) return;
    forcePollMutation.mutate(undefined, {
      onSuccess: () => toast({ title: t('cloud.polling') }),
      onError: (err) =>
        toast({
          title: t('cloud.toast.pollFailed'),
          description: getLocalizedErrorMessage(err, t),
          variant: 'destructive',
        }),
    });
  };
  const handleSyncLocal = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (acc: CloudAccount | null) => {
        if (acc) {
          toast({
            title: t('cloud.toast.syncSuccess.title'),
            description: t('cloud.toast.syncSuccess.description', { email: acc.email }),
          });
        } else {
          toast({
            title: t('cloud.toast.syncFailed.title'),
            description: t('cloud.toast.syncFailed.description'),
            variant: 'destructive',
          });
        }
      },
      onError: (err) =>
        toast({
          title: t('cloud.toast.syncFailed.title'),
          description: getLocalizedErrorMessage(err, t),
          variant: 'destructive',
        }),
    });
  };
  const openGoogleAuthSignIn = async () => {
    try {
      lastSubmittedAuthCodeRef.current = null;
      const effectiveClientKey =
        selectedOAuthClientKey || oauthClients.find((client) => client.is_active)?.key;
      await startAuthFlow(effectiveClientKey ? { oauthClientKey: effectiveClientKey } : undefined);
    } catch (e) {
      toast({
        title: t('cloud.toast.startAuthFailed'),
        description: String(e),
        variant: 'destructive',
      });
    }
  };
  const handleExport = async (stripTokens: boolean) => {
    let url: string | null = null;
    try {
      const jsonContent = await exportMutation.mutateAsync({ stripTokens });
      const blob = new Blob([jsonContent], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloud-accounts-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExportDialogOpen(false);
      toast({ title: t('cloud.exportImport.exportSuccess') });
    } catch (error) {
      toast({
        title: t('cloud.error.loadFailed'),
        description: getLocalizedErrorMessage(error, t),
        variant: 'destructive',
      });
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };
  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('cloud.error.loadFailed'),
        description: t('cloud.exportImport.fileTooLarge'),
        variant: 'destructive',
      });
      return;
    }
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content);
        setImportFileContent(content);
      } catch {
        toast({
          title: t('cloud.error.loadFailed'),
          description: t('cloud.exportImport.invalidJson'),
          variant: 'destructive',
        });
        setImportFileName('');
        setImportFileContent(null);
      }
    };
    reader.onerror = () =>
      toast({
        title: t('cloud.error.loadFailed'),
        description: t('cloud.exportImport.readFileFailed'),
        variant: 'destructive',
      });
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };
  const handleImport = () => {
    if (!importFileContent) return;
    importMutation.mutate(
      { jsonContent: importFileContent, strategy: importStrategy },
      {
        onSuccess: (result) => {
          setIsImportDialogOpen(false);
          setImportFileContent(null);
          setImportFileName('');
          setImportStrategy('merge');
          toast({
            title: t('cloud.exportImport.importSuccess', {
              imported: result.imported,
              updated: result.updated,
              skipped: result.skipped,
            }),
          });
          if (result.errors.length > 0)
            toast({
              title: t('cloud.exportImport.importErrors', { count: result.errors.length }),
              description: result.errors.slice(0, 3).join('\n'),
              variant: 'destructive',
            });
        },
        onError: (err) =>
          toast({
            title: t('cloud.error.loadFailed'),
            description: getLocalizedErrorMessage(err, t),
            variant: 'destructive',
          }),
      },
    );
  };

  const setSelectionState = (id: string, selected: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selected ? next.add(id) : next.delete(id);
      return next;
    });
  const toggleSelectAllAccounts = () =>
    setSelectedIds(
      selectedIds.size === accounts?.length ? new Set() : new Set(accounts?.map((a) => a.id) || []),
    );
  const refreshSelectedAccounts = async () => {
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) => refreshMutation.mutateAsync({ accountId: id })),
    );
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    toast(
      failed === 0
        ? {
            title: t('cloud.toast.quotaRefreshed'),
            description: t('cloud.toast.batchRefreshSuccess', { count: successful }),
          }
        : {
            title: t('cloud.toast.batchRefreshPartial.title'),
            description: t('cloud.toast.batchRefreshPartial.description', { successful, failed }),
            variant: 'destructive',
          },
    );
    setSelectedIds(new Set());
  };
  const deleteSelectedAccounts = async () => {
    if (confirm(t('cloud.batch.confirmDelete', { count: selectedIds.size }))) {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) => deleteMutation.mutateAsync({ accountId: id })),
      );
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      toast(
        failed === 0
          ? {
              title: t('cloud.toast.deleted'),
              description: t('cloud.toast.batchDeleteSuccess', { count: successful }),
            }
          : {
              title: t('cloud.toast.batchDeletePartial.title'),
              description: t('cloud.toast.batchDeletePartial.description', { successful, failed }),
              variant: 'destructive',
            },
      );
      setSelectedIds(new Set());
    }
  };

  const updateGridLayout = async (layout: string) => {
    if (config)
      await saveConfig({
        ...(config as typeof config & Record<string, unknown>),
        grid_layout: layout,
      } as typeof config);
  };
  const handleSortChange = async (sort: string) => {
    if (config)
      await saveConfig({
        ...(config as typeof config & Record<string, unknown>),
        account_sort: sort,
      } as typeof config);
  };

  if (isLoading)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  if (isError)
    return (
      <div
        className="col-span-full rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-12 text-center"
        data-testid="cloud-load-error-fallback"
      >
        <Cloud className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-40" />
        <div className="text-base font-medium">{t('cloud.error.loadFailed')}</div>
        <div className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
          {getLocalizedErrorMessage(error, t)}
        </div>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => void refetch()}
          data-testid="cloud-load-error-retry"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('action.retry')}
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-2 pb-20">
      <AccountsHeader
        totalAccounts={totalAccounts}
        activeAccounts={activeAccounts}
        rateLimitedAccounts={rateLimitedAccounts}
        overallQuotaPercentage={overallQuotaPercentage}
        overallQuotaStatus={overallQuotaStatus}
      />
      <AccountsToolbar
        autoSwitchEnabled={autoSwitchEnabled}
        isSettingsLoading={isSettingsLoading}
        onToggleAutoSwitch={handleToggleAutoSwitch}
        isAutoSwitchPending={setAutoSwitchMutation.isPending}
        selectedCount={selectedIds.size}
        totalCount={accounts?.length ?? 0}
        onToggleSelectAll={toggleSelectAllAccounts}
        onForcePoll={handleForcePoll}
        isForcePollPending={forcePollMutation.isPending}
        onSyncLocal={handleSyncLocal}
        isSyncPending={syncMutation.isPending}
        onOpenExportDialog={() => setIsExportDialogOpen(true)}
        onOpenImportDialog={() => setIsImportDialogOpen(true)}
        onOpenAddDialog={() => setIsAddDialogOpen(true)}
        currentSort={currentSort}
        sortOptions={sortOptions}
        sortI18nKeys={sortI18nKeys}
        onSortChange={handleSortChange}
        gridLayout={gridLayout}
        onLayoutChange={updateGridLayout}
      />
      <AccountsGrid
        accounts={sortedAccounts}
        gridLayout={gridLayout}
        selectedIds={selectedIds}
        onToggleSelection={setSelectionState}
        onRefresh={handleRefresh}
        onDelete={handleDelete}
        onSwitch={handleSwitch}
        onManageIdentity={handleManageIdentity}
        refreshingAccountId={refreshMutation.variables?.accountId}
        deletingAccountId={deleteMutation.variables?.accountId}
        switchingAccountId={switchMutation.variables?.accountId}
        isRefreshPending={refreshMutation.isPending}
        isDeletePending={deleteMutation.isPending}
        isSwitchPending={switchMutation.isPending}
      />
      <BatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onRefreshSelected={refreshSelectedAccounts}
        onDeleteSelected={deleteSelectedAccounts}
      />
      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setAuthCode('');
            lastSubmittedAuthCodeRef.current = null;
          }
        }}
        authCode={authCode}
        onAuthCodeChange={setAuthCode}
        selectedOAuthClientKey={selectedOAuthClientKey}
        onOAuthClientChange={(key) => {
          setSelectedOAuthClientKey(key);
          setActiveOAuthClientMutation.mutate(
            { clientKey: key },
            {
              onError: (error) =>
                toast({
                  title: t('cloud.toast.updateSettingsFailed'),
                  description: getLocalizedErrorMessage(error, t),
                  variant: 'destructive',
                }),
            },
          );
        }}
        oauthClients={oauthClients}
        isOAuthClientsLoading={isOAuthClientsLoading}
        isSetActiveOAuthClientPending={setActiveOAuthClientMutation.isPending}
        onOpenGoogleAuth={openGoogleAuthSignIn}
        onSubmitAuthCode={() => submitAuthCode()}
        isAddPending={addMutation.isPending}
      />
      <ExportImportDialogs
        isExportDialogOpen={isExportDialogOpen}
        onExportDialogChange={setIsExportDialogOpen}
        onExport={handleExport}
        isExportPending={exportMutation.isPending}
        isImportDialogOpen={isImportDialogOpen}
        onImportDialogChange={(open) => {
          setIsImportDialogOpen(open);
          if (!open) {
            setImportFileContent(null);
            setImportFileName('');
            setImportStrategy('merge');
          }
        }}
        importStrategy={importStrategy}
        onImportStrategyChange={setImportStrategy}
        importFileName={importFileName}
        onImportFileSelect={handleImportFileSelect}
        importFileContent={importFileContent}
        onImport={handleImport}
        isImportPending={importMutation.isPending}
        fileInputRef={fileInputRef}
      />
      <IdentityProfileDialog
        account={identityAccount}
        open={Boolean(identityAccount)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setIdentityAccount(null);
        }}
      />
    </div>
  );
}
