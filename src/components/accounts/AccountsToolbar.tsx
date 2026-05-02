import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckSquare,
  Columns2,
  Columns3,
  Download,
  FileDown,
  LayoutGrid,
  LayoutList,
  List,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  SortAsc,
  Upload,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccountsToolbarProps {
  autoSwitchEnabled: boolean | undefined;
  isSettingsLoading: boolean;
  onToggleAutoSwitch: (checked: boolean) => void;
  isAutoSwitchPending: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  onForcePoll: () => void;
  isForcePollPending: boolean;
  onSyncLocal: () => void;
  isSyncPending: boolean;
  onOpenExportDialog: () => void;
  onOpenImportDialog: () => void;
  onOpenAddDialog: () => void;
  currentSort: string;
  sortOptions: readonly string[];
  sortI18nKeys: Record<string, string>;
  onSortChange: (sort: string) => void;
  gridLayout: string;
  onLayoutChange: (layout: string) => void;
}

export function AccountsToolbar(props: AccountsToolbarProps) {
  const { t } = useTranslation();
  const {
    autoSwitchEnabled,
    isSettingsLoading,
    onToggleAutoSwitch,
    isAutoSwitchPending,
    selectedCount,
    totalCount,
    onToggleSelectAll,
    onForcePoll,
    isForcePollPending,
    onSyncLocal,
    isSyncPending,
    onOpenExportDialog,
    onOpenImportDialog,
    onOpenAddDialog,
    currentSort,
    sortOptions,
    sortI18nKeys,
    onSortChange,
    gridLayout,
    onLayoutChange,
  } = props;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Primary Actions Group */}
      <div className="flex items-center gap-3">
        <Button onClick={onOpenAddDialog} className="cursor-pointer shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('cloud.addAccount')}
        </Button>

        <Button
          variant="outline"
          onClick={onToggleSelectAll}
          title={t('cloud.batch.selectAll')}
          className={`cursor-pointer transition-colors ${selectedCount > 0 && selectedCount === totalCount ? 'border-primary/50 bg-primary/5 text-primary' : ''}`}
        >
          <CheckSquare
            className={`mr-2 h-4 w-4 ${selectedCount > 0 && selectedCount === totalCount ? 'text-primary' : 'opacity-70'}`}
          />
          {selectedCount > 0 ? `${selectedCount} Selected` : t('cloud.batch.selectAll')}
        </Button>
      </div>

      {/* Secondary Actions & View Options */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Layout Toggles */}
        <div className="hidden items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1 sm:flex">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridLayout === 'auto' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 cursor-pointer rounded-md"
                  onClick={() => onLayoutChange('auto')}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('cloud.layout.auto')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridLayout === '2-col' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 cursor-pointer rounded-md"
                  onClick={() => onLayoutChange('2-col')}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('cloud.layout.twoCol')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridLayout === '3-col' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 cursor-pointer rounded-md"
                  onClick={() => onLayoutChange('3-col')}
                >
                  <Columns3 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('cloud.layout.threeCol')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridLayout === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 cursor-pointer rounded-md"
                  onClick={() => onLayoutChange('list')}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('cloud.layout.list')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridLayout === 'compact' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 cursor-pointer rounded-md"
                  onClick={() => onLayoutChange('compact')}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('cloud.layout.compact')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer gap-2 bg-white/[0.02]">
              <SortAsc className="h-4 w-4 opacity-70" />
              <span className="hidden text-xs sm:inline-block">{t(sortI18nKeys[currentSort])}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-muted-foreground text-xs tracking-wider uppercase">
              Sort By
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option}
                className="cursor-pointer"
                onClick={() => onSortChange(option)}
              >
                {currentSort === option ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <div className="mr-2 h-4 w-4" />
                )}
                {t(sortI18nKeys[option])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="cursor-pointer bg-white/[0.02]">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* Auto-Switch Toggle embedded in menu */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Zap
                  className={`h-4 w-4 ${autoSwitchEnabled ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                />
                <Label htmlFor="auto-switch" className="cursor-pointer text-sm font-medium">
                  {t('cloud.autoSwitch')}
                </Label>
              </div>
              <Switch
                id="auto-switch"
                checked={!!autoSwitchEnabled}
                onCheckedChange={onToggleAutoSwitch}
                disabled={isSettingsLoading || isAutoSwitchPending}
              />
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground text-xs tracking-wider uppercase">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={onForcePoll}
              disabled={isForcePollPending}
              className="cursor-pointer"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isForcePollPending ? 'animate-spin' : ''}`} />
              {t('cloud.checkQuota')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSyncLocal}
              disabled={isSyncPending}
              className="cursor-pointer"
            >
              <Download className={`mr-2 h-4 w-4 ${isSyncPending ? 'animate-bounce' : ''}`} />
              {t('cloud.syncFromIDE')}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-muted-foreground text-xs tracking-wider uppercase">
              Data
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={onOpenExportDialog} className="cursor-pointer">
              <FileDown className="mr-2 h-4 w-4" />
              {t('cloud.exportImport.export')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenImportDialog} className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {t('cloud.exportImport.import')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
