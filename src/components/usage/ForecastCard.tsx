import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Calendar, CalendarDays } from 'lucide-react';

interface UsageBucket {
  totalTokens: number;
  requests: number;
}

interface ForecastCardProps {
  /** Hourly buckets for the selected period (always fetched for all ranges). */
  hourlyData?: UsageBucket[];
  /** Daily buckets for the selected period. */
  dailyData?: UsageBucket[];
  range: '24h' | '7d' | '30d';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/**
 * Usage Averages Card.
 *
 * Calculates REAL averages over the time the user actually used the proxy,
 * not projections over the entire selected window.
 *
 * Logic:
 *   - totalTokens = sum of all buckets in the period
 *   - activeHours = number of hourly buckets with totalTokens > 0
 *   - activeDays  = number of daily  buckets with totalTokens > 0
 *   - avgPerHour  = totalTokens / activeHours   (real average, no padding)
 *   - avgPerDay   = totalTokens / activeDays     (real average, no padding)
 *
 * For the 24h range, avgPerDay equals totalTokens (since it's a single day).
 * For 7d/30d, avgPerDay = totalTokens / activeDays.
 *
 * The card title says "Usage Averages" (not "Forecast") because these are
 * real historical averages, not projections.
 */
export function ForecastCard({ hourlyData, dailyData, range }: ForecastCardProps) {
  const stats = useMemo(() => {
    const hours = hourlyData ?? [];
    const days = dailyData ?? [];

    const totalTokens =
      hours.length > 0
        ? hours.reduce((acc, d) => acc + d.totalTokens, 0)
        : days.reduce((acc, d) => acc + d.totalTokens, 0);

    const totalRequests =
      hours.length > 0
        ? hours.reduce((acc, d) => acc + d.requests, 0)
        : days.reduce((acc, d) => acc + d.requests, 0);

    // Active hours = hourly buckets where there was actual usage
    const activeHours = hours.filter((d) => d.totalTokens > 0).length;

    // Active days = daily buckets where there was actual usage
    const activeDays = days.filter((d) => d.totalTokens > 0).length;

    // Real average per active hour
    const avgPerHour = activeHours > 0 ? totalTokens / activeHours : 0;

    // Real average per active day
    const avgPerDay = activeDays > 0 ? totalTokens / activeDays : 0;

    // Average tokens per request
    const avgPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0;

    return {
      totalTokens,
      totalRequests,
      activeHours,
      activeDays,
      avgPerHour,
      avgPerDay,
      avgPerRequest,
    };
  }, [hourlyData, dailyData]);

  const rangeLabel = range === '24h' ? 'Last 24h' : range === '7d' ? 'Last 7 days' : 'Last 30 days';

  return (
    <Card className="bg-card overflow-hidden rounded-xl border border-white/[0.06]">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
            Usage Averages
          </CardTitle>
          <span className="text-muted-foreground/70 text-[10px]">{rangeLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-2 space-y-3">
          {/* Total consumed in period */}
          <div>
            <div className="mb-0.5 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              <span className="text-muted-foreground text-xs">Total in period</span>
            </div>
            <div className="text-foreground font-mono text-lg font-semibold">
              {formatNumber(stats.totalTokens)}{' '}
              <span className="text-muted-foreground font-sans text-xs font-normal">tokens</span>
            </div>
            <div className="text-muted-foreground/70 mt-0.5 text-[10px]">
              {stats.activeHours > 0 &&
                `${stats.activeHours} active hour${stats.activeHours !== 1 ? 's' : ''}`}
              {stats.activeHours > 0 && stats.activeDays > 0 && ' · '}
              {stats.activeDays > 0 &&
                `${stats.activeDays} active day${stats.activeDays !== 1 ? 's' : ''}`}
              {stats.totalRequests > 0 && ` · ${stats.totalRequests.toLocaleString()} requests`}
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Average per active hour */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-blue-400" />
              <span className="text-muted-foreground text-xs">Avg / active hour</span>
            </div>
            <div className="text-foreground font-mono text-sm font-semibold tabular-nums">
              {formatNumber(stats.avgPerHour)}
              <span className="text-muted-foreground ml-1 font-sans text-[10px] font-normal">
                tokens/h
              </span>
            </div>
          </div>

          {/* Average per active day */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-violet-400" />
              <span className="text-muted-foreground text-xs">Avg / active day</span>
            </div>
            <div className="text-foreground font-mono text-sm font-semibold tabular-nums">
              {formatNumber(stats.avgPerDay)}
              <span className="text-muted-foreground ml-1 font-sans text-[10px] font-normal">
                tokens/d
              </span>
            </div>
          </div>

          {/* Average per request */}
          {stats.totalRequests > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-amber-400" />
                <span className="text-muted-foreground text-xs">Avg / request</span>
              </div>
              <div className="text-foreground font-mono text-sm font-semibold tabular-nums">
                {formatNumber(stats.avgPerRequest)}
                <span className="text-muted-foreground ml-1 font-sans text-[10px] font-normal">
                  tokens/req
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
