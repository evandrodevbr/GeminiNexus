import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ipc } from '@/ipc/manager';
import { useCloudAccounts } from '@/hooks/useCloudAccounts';
import { StatCard } from '@/components/usage/StatCard';
import { ChartCard } from '@/components/usage/ChartCard';
import {
  COLOR_PROMPT,
  COLOR_COMPLETION,
  PIE_COLORS,
  LineTooltip,
} from '@/components/usage/NivoTooltip';
import { nivoTheme } from '@/lib/nivo-theme';
import {
  Activity,
  Layers,
  Loader2,
  MessageSquare,
  Radio,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type TimeRange = '24h' | '7d' | '30d';

interface UsageBucket {
  bucket: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
}

interface ModelBucket {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requests: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getTimeRange(r: TimeRange): { start: number; end: number } {
  const now = Date.now();
  const ms: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return { start: now - ms[r], end: now };
}

function getPreviousTimeRange(r: TimeRange): { start: number; end: number } {
  const { start, end } = getTimeRange(r);
  const duration = end - start;
  return { start: start - duration, end: start };
}

function formatBucketLabel(bucket: string, range: TimeRange): string {
  if (range === '24h') {
    const parts = bucket.split(' ');
    return parts.length === 2 ? parts[1] : bucket;
  }
  const d = new Date(bucket + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString();
}

function calcTrend(
  current: number,
  previous: number,
): { value: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0 && current === 0) {
    return { value: 0, direction: 'neutral' };
  }
  if (previous === 0) {
    return { value: 100, direction: 'up' };
  }
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return { value: 0, direction: 'neutral' };
  }
  return { value: Math.abs(pct), direction: pct > 0 ? 'up' : 'down' };
}

/* ------------------------------------------------------------------ */
/*  Aggregation helpers                                                */
/* ------------------------------------------------------------------ */
function sumBuckets(data: UsageBucket[]) {
  return data.reduce(
    (acc, row) => ({
      promptTokens: acc.promptTokens + row.promptTokens,
      completionTokens: acc.completionTokens + row.completionTokens,
      totalTokens: acc.totalTokens + row.totalTokens,
      requests: acc.requests + row.requests,
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0 },
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
function UsagePage() {
  const [range, setRange] = useState<TimeRange>('7d');
  const ALL_ACCOUNTS = '__all__';
  const [selectedAccountId, setSelectedAccountId] = useState<string>(ALL_ACCOUNTS);
  const { data: accounts, isLoading: accountsLoading } = useCloudAccounts();

  const accountFilter =
    selectedAccountId === ALL_ACCOUNTS ? undefined : selectedAccountId;

  /* ───── Current period data ───── */
  const {
    data: dailyData,
    isLoading: dailyLoading,
    error: dailyError,
    refetch: refetchDaily,
  } = useQuery<UsageBucket[]>({
    queryKey: ['usage', 'day', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByDay({
        accountId: accountFilter,
        start,
        end,
      });
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  const { data: prevDailyData } = useQuery<UsageBucket[]>({
    queryKey: ['usage', 'day', 'prev', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getPreviousTimeRange(range);
      return ipc.client.usage.getUsageByDay({
        accountId: accountFilter,
        start,
        end,
      });
    },
    staleTime: 60_000,
  });

  const {
    data: modelData,
    isLoading: modelLoading,
    error: modelError,
    refetch: refetchModel,
  } = useQuery<ModelBucket[]>({
    queryKey: ['usage', 'model', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByModel({
        accountId: accountFilter,
        start,
        end,
      });
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  const {
    data: hourlyData,
    isLoading: hourlyLoading,
    error: hourlyError,
    refetch: refetchHourly,
  } = useQuery<UsageBucket[]>({
    queryKey: ['usage', 'hour', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByHour({
        accountId: accountFilter,
        start,
        end,
      });
    },
    enabled: range === '24h',
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  /* ───── Derived data ───── */
  const totals = useMemo(() => sumBuckets(dailyData || []), [dailyData]);
  const prevTotals = useMemo(
    () => sumBuckets(prevDailyData || []),
    [prevDailyData],
  );

  const promptRatio = totals.totalTokens
    ? Math.round((totals.promptTokens / totals.totalTokens) * 100)
    : 0;
  const completionRatio = totals.totalTokens
    ? Math.round((totals.completionTokens / totals.totalTokens) * 100)
    : 0;
  const avgReqSize = totals.requests
    ? Math.round(totals.totalTokens / totals.requests)
    : 0;

  const sparklineTotal = useMemo(
    () => (dailyData || []).map((d) => d.totalTokens),
    [dailyData],
  );
  const sparklinePrompt = useMemo(
    () => (dailyData || []).map((d) => d.promptTokens),
    [dailyData],
  );
  const sparklineCompletion = useMemo(
    () => (dailyData || []).map((d) => d.completionTokens),
    [dailyData],
  );
  const sparklineRequests = useMemo(
    () => (dailyData || []).map((d) => d.requests),
    [dailyData],
  );

  // Area chart — Nivo line format
  const areaChartData = useMemo(() => {
    const source = range === '24h' ? hourlyData || [] : dailyData || [];
    return [
      {
        id: 'Prompt',
        color: COLOR_PROMPT,
        data: source.map((d) => ({
          x: formatBucketLabel(d.bucket, range),
          y: d.promptTokens,
        })),
      },
      {
        id: 'Completion',
        color: COLOR_COMPLETION,
        data: source.map((d) => ({
          x: formatBucketLabel(d.bucket, range),
          y: d.completionTokens,
        })),
      },
    ];
  }, [dailyData, hourlyData, range]);

  // Model ranking bar data
  const modelBarData = useMemo(() => {
    if (!modelData?.length) {
      return [];
    }
    return [...modelData]
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 8)
      .map((m) => ({
        model:
          m.model.length > 22 ? m.model.slice(0, 22) + '…' : m.model,
        tokens: m.totalTokens,
      }));
  }, [modelData]);

  // Top models mini-list
  const topModels = useMemo(() => {
    if (!modelData?.length) {
      return [];
    }
    return [...modelData]
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 5);
  }, [modelData]);

  const isAreaEmpty =
    range === '24h'
      ? !hourlyLoading && !hourlyError && !hourlyData?.length
      : !dailyLoading && !dailyError && !dailyData?.length;
  const areaLoading = range === '24h' ? hourlyLoading : dailyLoading;
  const areaError = range === '24h' ? hourlyError : dailyError;
  const isModelEmpty = !modelLoading && !modelError && !modelData?.length;

  /* ───── Render ───── */
  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-lg font-semibold tracking-tight">
              Usage Analytics
            </h1>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
              <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">
                Live
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            Token consumption and model distribution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
            disabled={accountsLoading}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              {accountsLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </span>
              ) : (
                <SelectValue placeholder="All accounts" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACCOUNTS}>All accounts</SelectItem>
              {accounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as TimeRange)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="24h" className="px-3 text-xs">
                24h
              </TabsTrigger>
              <TabsTrigger value="7d" className="px-3 text-xs">
                7d
              </TabsTrigger>
              <TabsTrigger value="30d" className="px-3 text-xs">
                30d
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-6 py-5">
        {/* ─── Stat cards ─── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Tokens"
            value={formatNumber(totals.totalTokens)}
            icon={Zap}
            isLoading={dailyLoading}
            accent="amber"
            trend={
              prevDailyData
                ? calcTrend(totals.totalTokens, prevTotals.totalTokens)
                : undefined
            }
            sparkline={sparklineTotal}
          />
          <StatCard
            label="Prompt Tokens"
            value={formatNumber(totals.promptTokens)}
            icon={MessageSquare}
            isLoading={dailyLoading}
            accent="blue"
            trend={
              prevDailyData
                ? calcTrend(totals.promptTokens, prevTotals.promptTokens)
                : undefined
            }
            sparkline={sparklinePrompt}
          />
          <StatCard
            label="Completion Tokens"
            value={formatNumber(totals.completionTokens)}
            icon={Activity}
            isLoading={dailyLoading}
            accent="green"
            trend={
              prevDailyData
                ? calcTrend(
                    totals.completionTokens,
                    prevTotals.completionTokens,
                  )
                : undefined
            }
            sparkline={sparklineCompletion}
          />
          <StatCard
            label="Total Requests"
            value={totals.requests.toLocaleString()}
            icon={Layers}
            isLoading={dailyLoading}
            accent="slate"
            trend={
              prevDailyData
                ? calcTrend(totals.requests, prevTotals.requests)
                : undefined
            }
            sparkline={sparklineRequests}
          />
        </div>

        {/* ─── Prompt/Completion ratio bar + top models ─── */}
        {!dailyLoading && totals.totalTokens > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="col-span-1 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-card p-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                  Prompt / Completion
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatNumber(totals.totalTokens)} total
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${promptRatio}%`,
                    backgroundColor: COLOR_PROMPT,
                  }}
                />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${completionRatio}%`,
                    backgroundColor: COLOR_COMPLETION,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR_PROMPT }}
                    />
                    <span className="text-muted-foreground">Prompt</span>
                    <span className="font-mono font-semibold text-foreground">
                      {promptRatio}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR_COMPLETION }}
                    />
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-mono font-semibold text-foreground">
                      {completionRatio}%
                    </span>
                  </div>
                </div>
                <span className="text-muted-foreground">
                  Avg/req:{' '}
                  <span className="font-mono font-medium text-foreground">
                    {formatNumber(avgReqSize)}
                  </span>
                </span>
              </div>
            </div>

            {/* Top models */}
            <div className="rounded-xl border border-white/[0.06] bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
                  Top Models
                </span>
                <span className="text-[10px] text-muted-foreground">
                  tokens
                </span>
              </div>
              <div className="space-y-2">
                {topModels.map((m, i) => {
                  const max = topModels[0]?.totalTokens || 1;
                  const pct = Math.max(8, (m.totalTokens / max) * 100);
                  return (
                    <div key={m.model} className="group">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="max-w-[140px] truncate text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                          {m.model}
                        </span>
                        <span className="font-mono text-[11px] font-medium text-foreground tabular-nums">
                          {formatNumber(m.totalTokens)}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {topModels.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No data
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Charts — Area + Model ranking ─── */}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ChartCard
              title={range === '24h' ? 'Hourly Usage' : 'Daily Usage'}
              isLoading={areaLoading}
              error={areaError}
              isEmpty={isAreaEmpty}
              onRetry={() =>
                range === '24h' ? refetchHourly() : refetchDaily()
              }
              emptyTitle="No usage data"
              emptyDescription="Data will appear here once proxy requests are recorded."
              errorMessage="Failed to load usage data"
              retryLabel="Retry"
            >
              <div className="h-[320px]">
                <ResponsiveLine
                  data={areaChartData}
                  theme={nivoTheme}
                  colors={[COLOR_PROMPT, COLOR_COMPLETION]}
                  margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, stacked: false }}
                  curve="monotoneX"
                  enableArea={true}
                  areaOpacity={0.08}
                  areaBlendMode="normal"
                  enablePoints={true}
                  pointSize={4}
                  pointColor={{ theme: 'background' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  enableGridX={false}
                  enableGridY={true}
                  gridYValues={5}
                  axisBottom={{
                    tickSize: 0,
                    tickPadding: 8,
                    tickRotation: 0,
                  }}
                  axisLeft={{
                    tickSize: 0,
                    tickPadding: 8,
                    tickRotation: 0,
                    format: (v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`,
                  }}
                  tooltip={LineTooltip}
                  legends={[
                    {
                      anchor: 'bottom',
                      direction: 'row',
                      justify: false,
                      translateX: 0,
                      translateY: 36,
                      itemsSpacing: 16,
                      itemWidth: 80,
                      itemHeight: 16,
                      itemDirection: 'left-to-right',
                      symbolSize: 8,
                      symbolShape: 'circle',
                    },
                  ]}
                  animate={true}
                  motionConfig="gentle"
                />
              </div>
            </ChartCard>
          </div>

          <div className="xl:col-span-2">
            <ChartCard
              title="Model Distribution"
              isLoading={modelLoading}
              error={modelError}
              isEmpty={isModelEmpty}
              onRetry={() => refetchModel()}
              emptyTitle="No model data"
              emptyDescription="Model distribution will appear after proxy usage."
              errorMessage="Failed to load model data"
              retryLabel="Retry"
            >
              <div className="h-[320px]">
                <ResponsiveBar
                  data={modelBarData}
                  keys={['tokens']}
                  indexBy="model"
                  layout="horizontal"
                  theme={nivoTheme}
                  colors={PIE_COLORS}
                  colorBy="indexValue"
                  margin={{ top: 0, right: 10, bottom: 10, left: 120 }}
                  padding={0.3}
                  borderRadius={4}
                  enableGridX={true}
                  enableGridY={false}
                  gridXValues={4}
                  axisBottom={null}
                  axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  axisTop={null}
                  axisRight={null}
                  enableLabel={true}
                  label={(d) => formatNumber(d.value as number)}
                  labelSkipWidth={40}
                  labelTextColor="#e8eaed"
                  tooltip={({ indexValue, value }) => (
                    <div className="bg-popover rounded-lg border border-white/[0.06] px-3 py-2 shadow-md">
                      <p className="text-foreground mb-1 text-xs font-medium">
                        {indexValue}
                      </p>
                      <span className="text-foreground font-mono text-xs font-medium">
                        {(value as number).toLocaleString()} tokens
                      </span>
                    </div>
                  )}
                  animate={true}
                  motionConfig="gentle"
                />
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/usage')({
  component: UsagePage,
});
