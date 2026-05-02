import { useTranslation } from 'react-i18next';
import { Cloud } from 'lucide-react';

import { CloudAccountCard, CompactCloudAccountCard } from '@/components/CloudAccountCard';
import { type GridLayout } from '@/components/CloudAccountList';
import type { CloudAccount } from '@/types/cloudAccount';

export const GRID_LAYOUT_CLASSES: Record<GridLayout, string> = {
  auto: 'grid gap-3 md:grid-cols-2 xl:grid-cols-3',
  '2-col': 'grid gap-3 grid-cols-2',
  '3-col': 'grid gap-3 grid-cols-3',
  list: 'grid gap-3 grid-cols-1',
  compact: 'flex flex-col gap-2',
};

interface AccountsGridProps {
  accounts: CloudAccount[];
  gridLayout: GridLayout;
  selectedIds: Set<string>;
  onToggleSelection: (id: string, selected: boolean) => void;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
  onManageIdentity: (id: string) => void;
  refreshingAccountId?: string;
  deletingAccountId?: string;
  switchingAccountId?: string;
  isRefreshPending: boolean;
  isDeletePending: boolean;
  isSwitchPending: boolean;
}

export function AccountsGrid(props: AccountsGridProps) {
  const { t } = useTranslation();
  const {
    accounts,
    gridLayout,
    selectedIds,
    onToggleSelection,
    onRefresh,
    onDelete,
    onSwitch,
    onManageIdentity,
    refreshingAccountId,
    deletingAccountId,
    switchingAccountId,
    isRefreshPending,
    isDeletePending,
    isSwitchPending,
  } = props;
  return (
    <div className={GRID_LAYOUT_CLASSES[gridLayout]}>
      {accounts.map((account) =>
        gridLayout === 'compact' ? (
          <CompactCloudAccountCard
            key={account.id}
            account={account}
            onRefresh={onRefresh}
            onDelete={onDelete}
            onSwitch={onSwitch}
            onManageIdentity={onManageIdentity}
            isRefreshing={isRefreshPending && refreshingAccountId === account.id}
            isDeleting={isDeletePending && deletingAccountId === account.id}
            isSwitching={isSwitchPending && switchingAccountId === account.id}
          />
        ) : (
          <CloudAccountCard
            key={account.id}
            account={account}
            onRefresh={onRefresh}
            onDelete={onDelete}
            onSwitch={onSwitch}
            onManageIdentity={onManageIdentity}
            isSelected={selectedIds.has(account.id)}
            onToggleSelection={onToggleSelection}
            isRefreshing={isRefreshPending && refreshingAccountId === account.id}
            isDeleting={isDeletePending && deletingAccountId === account.id}
            isSwitching={isSwitchPending && switchingAccountId === account.id}
          />
        ),
      )}
      {accounts.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Cloud className="text-muted-foreground/40 h-8 w-8" />
          </div>
          <div className="mt-4 text-sm font-medium">{t('cloud.list.noAccounts')}</div>
          <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
            {t('cloud.description')}
          </p>
        </div>
      )}
    </div>
  );
}
