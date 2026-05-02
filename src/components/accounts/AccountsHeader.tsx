import { useTranslation } from 'react-i18next';

import { clampQuotaPercentage, getQuotaStatus, type QuotaStatus } from '@/utils/quota-display';

interface AccountsHeaderProps {
  totalAccounts: number;
  activeAccounts: number;
  rateLimitedAccounts: number;
  overallQuotaPercentage: number | null;
  overallQuotaStatus: QuotaStatus | null;
}

const GLOBAL_QUOTA_BAR_COLOR_CLASS_BY_STATUS: Record<QuotaStatus, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-amber-500',
  low: 'bg-rose-500',
};

const GLOBAL_QUOTA_TEXT_COLOR_CLASS_BY_STATUS: Record<QuotaStatus, string> = {
  high: 'text-emerald-400',
  medium: 'text-amber-400',
  low: 'text-rose-400',
};

export function AccountsHeader({
  totalAccounts,
  activeAccounts,
  rateLimitedAccounts,
  overallQuotaPercentage,
  overallQuotaStatus,
}: AccountsHeaderProps) {
  const { t } = useTranslation();
  const quotaStatus =
    overallQuotaStatus ??
    (overallQuotaPercentage === null ? null : getQuotaStatus(overallQuotaPercentage));

  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {/* Title Area */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-foreground text-2xl font-semibold tracking-tight">
            {t('cloud.title')}
          </h2>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            {t('cloud.description')}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total & Active combined stat */}
          <div className="flex min-w-[120px] flex-col justify-center rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-foreground text-2xl font-bold tracking-tight">
                {totalAccounts}
              </span>
              <span className="text-sm font-medium text-emerald-400">{activeAccounts} active</span>
            </div>
            <span className="text-muted-foreground/70 mt-0.5 text-xs font-medium tracking-wider uppercase">
              {t('cloud.card.actions')}
            </span>
          </div>

          {/* Rate Limited stat (only if > 0) */}
          {rateLimitedAccounts > 0 && (
            <div className="flex min-w-[100px] flex-col justify-center rounded-xl border border-rose-500/10 bg-rose-500/[0.02] px-4 py-3">
              <span className="text-2xl font-bold tracking-tight text-rose-400">
                {rateLimitedAccounts}
              </span>
              <span className="mt-0.5 text-xs font-medium tracking-wider text-rose-400/60 uppercase">
                {t('cloud.card.rateLimited')}
              </span>
            </div>
          )}

          {/* Global Quota */}
          {overallQuotaPercentage !== null && quotaStatus && (
            <div className="flex min-w-[140px] flex-col justify-center rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold tracking-tight ${GLOBAL_QUOTA_TEXT_COLOR_CLASS_BY_STATUS[quotaStatus]}`}
                >
                  {overallQuotaPercentage}%
                </span>
              </div>

              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-in-out ${GLOBAL_QUOTA_BAR_COLOR_CLASS_BY_STATUS[quotaStatus]}`}
                  style={{ width: `${clampQuotaPercentage(overallQuotaPercentage)}%` }}
                />
              </div>
              <span className="text-muted-foreground/70 mt-1.5 text-xs font-medium tracking-wider uppercase">
                {t('cloud.globalQuota')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
