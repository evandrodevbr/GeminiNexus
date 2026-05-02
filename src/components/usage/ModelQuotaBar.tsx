import clsx from 'clsx';

interface ModelQuotaBarProps {
  modelName: string;
  usedTokens: number;
  limitTokens?: number;
}

export function ModelQuotaBar({ modelName, usedTokens, limitTokens }: ModelQuotaBarProps) {
  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const usagePercentage = limitTokens ? (usedTokens / limitTokens) * 100 : 0;
  const displayPercentage = limitTokens ? Math.min(Math.round(usagePercentage), 100) : null;
  const barPercentage = limitTokens ? Math.min(usagePercentage, 100) : 100;

  let colorClass = 'bg-slate-500'; // Default if no limit
  if (limitTokens) {
    if (usagePercentage < 80) colorClass = 'bg-emerald-500';
    else if (usagePercentage < 90) colorClass = 'bg-amber-500';
    else colorClass = 'bg-rose-500';
  }

  return (
    <div className="group mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground group-hover:text-foreground max-w-[140px] truncate text-xs transition-colors">
          {modelName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-mono text-[11px] font-medium tabular-nums">
            {formatNumber(usedTokens)}
            {limitTokens ? ` / ${formatNumber(limitTokens)}` : ''}
          </span>
          {displayPercentage !== null && (
            <span
              className={clsx('w-8 text-right text-[10px] font-semibold', {
                'text-emerald-400': usagePercentage < 80,
                'text-amber-400': usagePercentage >= 80 && usagePercentage < 90,
                'text-rose-400': usagePercentage >= 90,
              })}
            >
              {displayPercentage}%
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${barPercentage}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}
