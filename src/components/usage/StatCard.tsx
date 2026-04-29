import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TrendInfo {
  /** Percentage change vs previous period */
  value: number;
  direction: 'up' | 'down' | 'neutral';
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
  className?: string;
  accent?: 'blue' | 'green' | 'amber' | 'slate' | 'purple';
  trend?: TrendInfo;
  sparkline?: number[];
}

const ACCENT_ICON = {
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  slate: 'text-muted-foreground',
  purple: 'text-violet-400',
};

const ACCENT_BG = {
  blue: 'bg-blue-500/8',
  green: 'bg-emerald-500/8',
  amber: 'bg-amber-500/8',
  slate: 'bg-white/[0.04]',
  purple: 'bg-violet-500/8',
};

/**
 * Render a tiny inline SVG sparkline from an array of values.
 * Normalized to fit within a 60x20 viewBox.
 */
function Sparkline({ data, accent }: { data: number[]; accent: string }) {
  if (data.length < 2) {
    return null;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const pad = 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const strokeColor =
    accent === 'blue'
      ? '#60a5fa'
      : accent === 'green'
        ? '#34d399'
        : accent === 'amber'
          ? '#fbbf24'
          : accent === 'purple'
            ? '#a78bfa'
            : '#6b7280';

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-5 w-[60px] overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sparkGrad-${accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${h} ${points.join(' ')} ${w},${h}`}
        fill={`url(#sparkGrad-${accent})`}
      />
      {/* Line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendBadge({ trend }: { trend: TrendInfo }) {
  const isUp = trend.direction === 'up';
  const isNeutral = trend.direction === 'neutral' || trend.value === 0;
  const Icon = isNeutral ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const color = isNeutral
    ? 'text-muted-foreground'
    : isUp
      ? 'text-emerald-400'
      : 'text-rose-400';

  return (
    <div className={cn('flex items-center gap-0.5 text-[10px] font-medium', color)}>
      <Icon className="h-3 w-3" />
      <span className="tabular-nums">{Math.abs(trend.value).toFixed(1)}%</span>
    </div>
  );
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  isLoading,
  className,
  accent = 'slate',
  trend,
  sparkline,
}) => {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-white/[0.06] bg-card p-4 transition-all duration-200',
        'hover:border-white/[0.1] hover:bg-white/[0.02]',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            {label}
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-foreground font-mono text-xl font-semibold tracking-tight tabular-nums">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {trend && <TrendBadge trend={trend} />}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              ACCENT_BG[accent],
            )}
          >
            <Icon className={cn('h-4 w-4', ACCENT_ICON[accent])} />
          </div>
          {sparkline && sparkline.length >= 2 && !isLoading && (
            <Sparkline data={sparkline} accent={accent} />
          )}
        </div>
      </div>
    </div>
  );
};
