import { CloudAccount, CloudQuotaModelInfo } from '@/types/cloudAccount';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { MoreVertical, Trash, RefreshCw, Box, Power, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useProviderGrouping } from '@/hooks/useProviderGrouping';
import { ProviderGroup } from '@/components/ProviderGroup';
import {
  clampQuotaPercentage,
  formatAiCreditsAmount,
  formatResetTimeLabel,
  formatResetTimeTitle,
  getQuotaStatus,
  type QuotaStatus,
} from '@/utils/quota-display';
import { getValidationBlockedStatusLabel } from '@/components/accountValidationStatus';

type ModelQuotaEntry = [string, CloudQuotaModelInfo];

const GEMINI_LEGACY_MODEL_PATTERN = /gemini-[12](\.|$|-)/i;
const GEMINI_PRO_COMBINED_MODEL_ID = 'gemini-3.1-pro-low/high';

const MODEL_DISPLAY_REPLACEMENTS: Array<[string, string]> = [
  [GEMINI_PRO_COMBINED_MODEL_ID, 'Gemini 3.1 Pro (Low/High)'],
  ['gemini-3.1-pro-preview', 'Gemini 3.1 Pro Preview'],
  ['gemini-3-pro-image', 'Gemini 3 Pro Image'],
  ['gemini-3.1-pro', 'Gemini 3.1 Pro'],
  ['gemini-3-pro', 'Gemini 3 Pro'],
  ['gemini-3-flash', 'Gemini 3 Flash'],
  ['claude-sonnet-4-6-thinking', 'Claude 4.6 Sonnet (Thinking)'],
  ['claude-sonnet-4-6', 'Claude 4.6 Sonnet'],
  ['claude-sonnet-4-5-thinking', 'Claude 4.5 Sonnet (Thinking)'],
  ['claude-sonnet-4-5', 'Claude 4.5 Sonnet'],
  ['claude-opus-4-6-thinking', 'Claude 4.6 Opus (Thinking)'],
  ['claude-opus-4-5-thinking', 'Claude 4.5 Opus (Thinking)'],
  ['claude-3-5-sonnet', 'Claude 3.5 Sonnet'],
];

const QUOTA_TEXT_COLOR_CLASS_BY_STATUS: Record<QuotaStatus, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-rose-400',
};

const QUOTA_BAR_COLOR_CLASS_BY_STATUS: Record<QuotaStatus, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-rose-500',
};

function isGeminiProLowModel(modelName: string): boolean {
  const normalizedModelName = modelName.toLowerCase();
  return normalizedModelName.includes('gemini-3.1-pro-low');
}

function isGeminiProHighModel(modelName: string): boolean {
  const normalizedModelName = modelName.toLowerCase();
  return normalizedModelName.includes('gemini-3.1-pro-high');
}

function formatCreditsExpiry(expiryDate: string): string {
  if (!expiryDate) {
    return '';
  }

  try {
    const date = new Date(expiryDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return expiryDate;
  }
}

function isGeminiProFamilyModel(modelName: string): boolean {
  const normalizedModelName = modelName.toLowerCase();
  return normalizedModelName.includes('gemini-3.1-pro');
}

function mergeGeminiProQuotaEntries(
  entries: ModelQuotaEntry[],
): Record<string, CloudQuotaModelInfo> {
  const mergedModels: Record<string, CloudQuotaModelInfo> = {};
  const hasProLowModel = entries.some(([modelName]) => isGeminiProLowModel(modelName));
  const hasProHighModel = entries.some(([modelName]) => isGeminiProHighModel(modelName));
  const proLowModelInfo = entries.find(([modelName]) => isGeminiProLowModel(modelName))?.[1];

  for (const [modelName, modelInfo] of entries) {
    if (isGeminiProLowModel(modelName) && hasProHighModel) {
      continue;
    }

    if (isGeminiProHighModel(modelName) && hasProLowModel) {
      const mergedPercentage = proLowModelInfo
        ? Math.min(modelInfo.percentage, proLowModelInfo.percentage)
        : modelInfo.percentage;

      mergedModels[GEMINI_PRO_COMBINED_MODEL_ID] = {
        ...modelInfo,
        ...proLowModelInfo,
        percentage: mergedPercentage,
        display_name: 'Gemini 3.1 Pro',
        resetTime:
          modelInfo.resetTime && proLowModelInfo?.resetTime
            ? modelInfo.resetTime < proLowModelInfo.resetTime
              ? modelInfo.resetTime
              : proLowModelInfo.resetTime
            : modelInfo.resetTime || proLowModelInfo?.resetTime || '',
      };
      continue;
    }

    mergedModels[modelName] = modelInfo;
  }

  return mergedModels;
}

function formatModelDisplayName(modelName: string): string {
  let displayName = modelName.replace('models/', '');
  for (const [source, target] of MODEL_DISPLAY_REPLACEMENTS) {
    displayName = displayName.replace(source, target);
  }

  return displayName
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

interface CloudAccountCardProps {
  account: CloudAccount;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
  onManageIdentity: (id: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string, selected: boolean) => void;
  isRefreshing?: boolean;
  isDeleting?: boolean;
  isSwitching?: boolean;
}

export function CloudAccountCard({
  account,
  onRefresh,
  onDelete,
  onSwitch,
  onManageIdentity,
  isSelected = false,
  onToggleSelection,
  isRefreshing,
  isDeleting,
  isSwitching,
}: CloudAccountCardProps) {
  const { t } = useTranslation();
  const { config, saveConfig } = useAppConfig();
  const {
    enabled: providerGroupingsEnabled,
    getAccountStats,
    isProviderCollapsed,
    toggleProviderCollapse,
  } = useProviderGrouping();

  const getQuotaTextColorClass = (percentage: number) => {
    const quotaStatus = getQuotaStatus(percentage);
    return QUOTA_TEXT_COLOR_CLASS_BY_STATUS[quotaStatus];
  };

  const getQuotaBarColorClass = (percentage: number) => {
    const quotaStatus = getQuotaStatus(percentage);
    return QUOTA_BAR_COLOR_CLASS_BY_STATUS[quotaStatus];
  };

  const formatQuotaLabel = (percentage: number) => {
    if (percentage === 0) {
      return t('cloud.card.rateLimitedQuota');
    }
    return `${percentage}%`;
  };

  const formatResetTimeLabelText = (resetTime?: string) => {
    return formatResetTimeLabel(resetTime, {
      prefix: t('cloud.card.resetPrefix'),
      unknown: t('cloud.card.resetUnknown'),
    });
  };

  const formatResetTimeTitleText = (resetTime?: string) => {
    return formatResetTimeTitle(resetTime, t('cloud.card.resetTime'));
  };

  const allModelEntries = Object.entries(account.quota?.models || {}) as ModelQuotaEntry[];

  const visibleModelEntries = Object.entries(account.quota?.models || {}).filter(
    ([modelName]) => config?.model_visibility?.[modelName] !== false,
  ) as ModelQuotaEntry[];

  const mergedModelQuotas = mergeGeminiProQuotaEntries(visibleModelEntries);

  const geminiModels = Object.entries(mergedModelQuotas)
    .filter(([name]) => name.includes('gemini') && !GEMINI_LEGACY_MODEL_PATTERN.test(name))
    .sort((a, b) => b[1].percentage - a[1].percentage);

  const claudeModels = Object.entries(mergedModelQuotas)
    .filter(([name]) => name.includes('claude'))
    .sort((a, b) => b[1].percentage - a[1].percentage);

  const hasHighTier = geminiModels.some(
    ([name, info]) => isGeminiProFamilyModel(name) && info.percentage > 50,
  );
  const hasVisibleQuotaModels = geminiModels.length > 0 || claudeModels.length > 0;

  const renderQuotaModelGroup = (title: string, models: ModelQuotaEntry[]) => {
    if (models.length === 0) return null;
    return (
      <div key={title} className="mt-1 space-y-1">
        <h4 className="text-muted-foreground/60 mb-1.5 px-1 text-[10px] font-bold tracking-widest uppercase">
          {title}
        </h4>
        <div className="flex flex-col gap-1">
          {models.map(([modelName, info]) => (
            <div
              key={modelName}
              className="group/item grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1.5 py-1 text-[13px] transition-colors hover:bg-white/[0.03]"
            >
              <span
                className="text-muted-foreground group-hover/item:text-foreground truncate font-medium transition-colors"
                title={modelName}
              >
                {formatModelDisplayName(modelName)}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-muted-foreground/70 min-w-[50px] text-right text-[9px]"
                  title={formatResetTimeTitleText(info.resetTime)}
                >
                  {formatResetTimeLabelText(info.resetTime)}
                </span>
                <span
                  className={`w-9 text-right font-mono text-xs font-bold ${getQuotaTextColorClass(info.percentage)}`}
                >
                  {info.percentage}%
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/[0.04]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${getQuotaBarColorClass(info.percentage)}`}
                    style={{ width: `${clampQuotaPercentage(info.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const emptyQuotaState = (
    <div className="text-muted-foreground flex flex-col items-center justify-center py-6">
      <Box className="mb-2 h-6 w-6 opacity-20" />
      <span className="text-xs">{t('cloud.card.noQuota')}</span>
    </div>
  );

  const providerStats = providerGroupingsEnabled ? getAccountStats(account) : null;
  const providerGroupedQuotaSection =
    providerStats && providerStats.visibleModels > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
          <span className="text-muted-foreground text-xs font-medium">
            {t('settings.providerGroupings.overall')}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-bold ${getQuotaTextColorClass(providerStats.overallPercentage)}`}
            >
              {formatQuotaLabel(providerStats.overallPercentage)}
            </span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getQuotaBarColorClass(providerStats.overallPercentage)}`}
                style={{
                  width: `${clampQuotaPercentage(providerStats.overallPercentage)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {providerStats.providers.map((group) => (
            <ProviderGroup
              key={group.providerKey}
              stats={group}
              isCollapsed={isProviderCollapsed(account.id, group.providerKey)}
              onToggleCollapse={() => toggleProviderCollapse(account.id, group.providerKey)}
              getQuotaTextColorClass={getQuotaTextColorClass}
              getQuotaBarColorClass={getQuotaBarColorClass}
              formatQuotaLabel={formatQuotaLabel}
              formatResetTimeLabel={formatResetTimeLabelText}
              formatResetTimeTitle={formatResetTimeTitleText}
              leftLabel={t('cloud.card.left')}
            />
          ))}
        </div>
      </div>
    ) : (
      emptyQuotaState
    );

  const aiCredits = account.quota?.ai_credits;
  const shouldShowAiCredits =
    !!aiCredits && Number.isFinite(aiCredits.credits) && aiCredits.credits >= 0;

  const validationBlockedStatusLabel = getValidationBlockedStatusLabel(
    account.status,
    account.status_reason,
    t,
  );

  return (
    <Card
      className={`group bg-card relative flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${isSelected ? 'border-primary/50 ring-primary/50 ring-1' : 'border-white/[0.06] hover:border-white/[0.15]'}`}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5 pb-4">
        {onToggleSelection && (
          <div
            className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelection(account.id, checked as boolean)}
              className="bg-background/80 data-[state=checked]:bg-primary h-4 w-4 backdrop-blur-sm"
            />
          </div>
        )}

        {account.avatar_url ? (
          <img
            src={account.avatar_url}
            alt={account.name || ''}
            className="h-11 w-11 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.02] object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-lg font-medium">
            {account.name?.[0]?.toUpperCase() || 'A'}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden pt-0.5">
          <CardTitle className="truncate text-base leading-tight font-semibold">
            {account.name || t('cloud.card.unknown')}
          </CardTitle>
          <CardDescription className="text-muted-foreground/80 truncate text-xs font-medium">
            {account.email}
          </CardDescription>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge
              variant={
                account.status === 'rate_limited' || account.status === 'expired'
                  ? 'destructive'
                  : 'outline'
              }
              className="h-4 border-white/[0.1] bg-white/[0.02] px-1.5 py-0 text-[9px] uppercase"
            >
              {account.provider}
            </Badge>
            {account.is_active && (
              <Badge
                variant="default"
                className="h-4 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-400 uppercase hover:bg-emerald-500/20"
              >
                {t('cloud.card.active')}
              </Badge>
            )}
            {hasHighTier && (
              <Badge
                variant="secondary"
                className="h-4 animate-pulse border-blue-500/20 bg-blue-500/10 px-1.5 py-0 text-[9px] text-blue-400 uppercase"
              >
                {t('cloud.card.gemini3Ready')}
              </Badge>
            )}
          </div>

          {validationBlockedStatusLabel && (
            <span className="text-destructive mt-1 text-xs font-medium">
              {validationBlockedStatusLabel}
            </span>
          )}

          {shouldShowAiCredits && aiCredits && (
            <div className="mt-2 flex w-fit items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1">
              <span className="text-[10px] font-semibold text-blue-400">
                {t('cloud.card.aiCreditsValue', {
                  amount: formatAiCreditsAmount(aiCredits.credits),
                })}
              </span>
              {aiCredits.expiryDate && (
                <>
                  <span className="h-2.5 w-[1px] bg-blue-500/30"></span>
                  <span className="text-[9px] font-medium text-blue-400/80">
                    {t('cloud.card.creditsExpiry', {
                      date: formatCreditsExpiry(aiCredits.expiryDate),
                    })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {allModelEntries.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground/70 hover:text-foreground h-7 w-7"
                >
                  {(() => {
                    const hiddenCount = allModelEntries.filter(
                      ([modelName]) => config?.model_visibility?.[modelName] === false,
                    ).length;
                    return hiddenCount > 0 ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    );
                  })()}
                  <span className="sr-only">{t('cloud.card.modelVisibility')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel className="text-xs">
                  {t('cloud.card.modelVisibility')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {allModelEntries.map(([modelName]) => {
                    const isVisible = config?.model_visibility?.[modelName] !== false;
                    return (
                      <DropdownMenuItem
                        key={modelName}
                        onSelect={(e) => e.preventDefault()}
                        className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5"
                      >
                        <Checkbox
                          checked={isVisible}
                          onCheckedChange={(checked) => {
                            if (config) {
                              const newVisibility = { ...config.model_visibility };
                              newVisibility[modelName] = checked as boolean;
                              saveConfig({ ...config, model_visibility: newVisibility });
                            }
                          }}
                          className="h-3.5 w-3.5"
                        />
                        <span className="truncate text-xs font-medium" title={modelName}>
                          {formatModelDisplayName(modelName)}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/70 hover:text-foreground h-7 w-7"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onSwitch(account.id)}
                disabled={isSwitching}
                className="cursor-pointer"
              >
                <Power className="mr-2 h-4 w-4" />
                <span className="font-medium">{t('cloud.card.useAccount')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRefresh(account.id)}
                disabled={isRefreshing}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>{t('cloud.card.refresh')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onManageIdentity(account.id)}
                className="cursor-pointer"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                <span>{t('cloud.card.identityProfile')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(account.id)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                disabled={isDeleting}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>{t('cloud.card.delete')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-5 pb-5">
        <div className="space-y-4">
          {providerGroupingsEnabled ? (
            providerGroupedQuotaSection
          ) : hasVisibleQuotaModels ? (
            <div className="space-y-3">
              {renderQuotaModelGroup('Google Gemini', geminiModels)}
              {claudeModels.length > 0 && renderQuotaModelGroup('Anthropic Claude', claudeModels)}
            </div>
          ) : (
            emptyQuotaState
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-white/[0.04] bg-white/[0.01] px-5 py-3">
        <span className="text-muted-foreground/70 text-[11px] font-medium">
          {t('cloud.card.used')}{' '}
          {formatDistanceToNow(account.last_used * 1000, { addSuffix: true })}
        </span>

        {account.is_active ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Active
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitch(account.id)}
            disabled={isSwitching}
            className="hover:bg-primary/10 hover:text-primary h-7 cursor-pointer px-3 text-xs font-medium transition-colors"
          >
            {isSwitching ? (
              <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Power className="mr-1.5 h-3 w-3" />
            )}
            {t('cloud.card.use')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

interface CompactCloudAccountCardProps {
  account: CloudAccount;
  onRefresh: (id: string) => void;
  onDelete: (id: string) => void;
  onSwitch: (id: string) => void;
  onManageIdentity: (id: string) => void;
  isRefreshing?: boolean;
  isDeleting?: boolean;
  isSwitching?: boolean;
}

export function CompactCloudAccountCard({
  account,
  onRefresh,
  onDelete,
  onSwitch,
  onManageIdentity,
  isRefreshing,
  isDeleting,
  isSwitching,
}: CompactCloudAccountCardProps) {
  const { t } = useTranslation();
  const { config, saveConfig } = useAppConfig();

  const getQuotaBarColorClass = (percentage: number) => {
    const quotaStatus = getQuotaStatus(percentage);
    return QUOTA_BAR_COLOR_CLASS_BY_STATUS[quotaStatus];
  };

  const visibleModelEntries = Object.entries(account.quota?.models || {}).filter(
    ([modelName]) => config?.model_visibility?.[modelName] !== false,
  ) as ModelQuotaEntry[];

  const allModelEntries = Object.entries(account.quota?.models || {}) as ModelQuotaEntry[];

  const mergedModelQuotas = mergeGeminiProQuotaEntries(visibleModelEntries);

  const compactModels = Object.entries(mergedModelQuotas).sort(
    (a, b) => b[1].percentage - a[1].percentage,
  );

  const aiCredits = account.quota?.ai_credits;
  const shouldShowAiCredits =
    !!aiCredits && Number.isFinite(aiCredits.credits) && aiCredits.credits >= 0;

  const validationBlockedStatusLabel = getValidationBlockedStatusLabel(
    account.status,
    account.status_reason,
    t,
  );

  return (
    <div className="group bg-card flex items-center gap-3 rounded-xl border border-white/[0.04] px-4 py-3 transition-all duration-200 hover:border-white/[0.1] hover:shadow-sm">
      {account.avatar_url ? (
        <img
          src={account.avatar_url}
          alt={account.name || ''}
          className="h-8 w-8 shrink-0 rounded-full border border-white/[0.08] bg-white/[0.02] object-cover"
        />
      ) : (
        <div className="text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-xs font-semibold">
          {account.name?.[0]?.toUpperCase() || 'A'}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-foreground truncate text-[13px] leading-none font-semibold">
            {account.name || t('cloud.card.unknown')}
          </span>
          <Badge
            variant={
              account.status === 'rate_limited' || account.status === 'expired'
                ? 'destructive'
                : 'outline'
            }
            className="h-4 shrink-0 border-white/[0.1] bg-white/[0.02] px-1.5 py-0 text-[9px] uppercase"
          >
            {account.provider}
          </Badge>
          {account.is_active && (
            <Badge
              variant="default"
              className="h-4 shrink-0 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-400 uppercase"
            >
              {t('cloud.card.active')}
            </Badge>
          )}
        </div>

        <div className="text-muted-foreground/80 flex items-center gap-3 text-[11px] font-medium">
          <span className="truncate">{account.email}</span>
          {validationBlockedStatusLabel && (
            <span className="text-destructive shrink-0">{validationBlockedStatusLabel}</span>
          )}

          {shouldShowAiCredits && aiCredits && (
            <span className="flex shrink-0 items-center gap-1.5 text-blue-400">
              <span>
                {t('cloud.card.aiCreditsValue', {
                  amount: formatAiCreditsAmount(aiCredits.credits),
                })}
              </span>
              {aiCredits.expiryDate && (
                <>
                  <span className="h-2.5 w-[1px] bg-blue-500/30"></span>
                  <span className="text-blue-400/70">
                    {t('cloud.card.creditsExpiry', {
                      date: formatCreditsExpiry(aiCredits.expiryDate),
                    })}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {compactModels.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {compactModels.map(([modelName, info]) => (
              <TooltipProvider key={modelName}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/[0.04]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-out ${getQuotaBarColorClass(info.percentage)}`}
                        style={{ width: `${clampQuotaPercentage(info.percentage)}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-medium">
                    {formatModelDisplayName(modelName)}: {info.percentage}%
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {allModelEntries.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/70 hover:text-foreground h-8 w-8"
              >
                {(() => {
                  const hiddenCount = allModelEntries.filter(
                    ([modelName]) => config?.model_visibility?.[modelName] === false,
                  ).length;
                  return hiddenCount > 0 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  );
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="text-xs">
                {t('cloud.card.modelVisibility')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[250px] overflow-y-auto p-1">
                {allModelEntries.map(([modelName]) => {
                  const isVisible = config?.model_visibility?.[modelName] !== false;
                  return (
                    <DropdownMenuItem
                      key={modelName}
                      onSelect={(e) => e.preventDefault()}
                      className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5"
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(checked) => {
                          if (config) {
                            const newVisibility = { ...config.model_visibility };
                            newVisibility[modelName] = checked as boolean;
                            saveConfig({ ...config, model_visibility: newVisibility });
                          }
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="truncate text-xs font-medium" title={modelName}>
                        {formatModelDisplayName(modelName)}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {account.is_active ? (
          <div className="flex h-8 items-center px-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Active
            </span>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitch(account.id)}
            disabled={isSwitching}
            className="hover:bg-primary/10 hover:text-primary h-8 cursor-pointer px-3 text-xs font-medium transition-colors"
          >
            {isSwitching ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t('cloud.card.use')}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/70 hover:text-foreground h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onSwitch(account.id)}
              disabled={isSwitching}
              className="cursor-pointer"
            >
              <Power className="mr-2 h-4 w-4" />
              <span className="font-medium">{t('cloud.card.useAccount')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRefresh(account.id)}
              disabled={isRefreshing}
              className="cursor-pointer"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>{t('cloud.card.refresh')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onManageIdentity(account.id)}
              className="cursor-pointer"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              <span>{t('cloud.card.identityProfile')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(account.id)}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              disabled={isDeleting}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>{t('cloud.card.delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
