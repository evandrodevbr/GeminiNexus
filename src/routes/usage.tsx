import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
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
  COLOR_TOTAL,
  PIE_COLORS,
  BarTooltip,
  PieTooltip,
} from '@/components/usage/NivoTooltip';
import { nivoTheme } from '@/lib/nivo-theme';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Loader2,
  MessageSquare,
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
  if (r === '24h') {
    return { start: now - 24 * 60 * 60 * 1000, end: now };
  }
  if (r === '7d') {
    return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
  }
  return { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
}

function formatBucketLabel(bucket: string, range: TimeRange): string {
  if (range === '24h') {
    // bucket is "YYYY-MM-DD HH:00"
    const parts = bucket.split(' ');
    if (parts.length === 2) {
      return parts[1]; // "HH:00"
    }
  }
  if (range === '7d') {
    // bucket is "YYYY-MM-DD"
    const d = new Date(bucket + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // 30d
  const d = new Date(bucket + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function barColor(bar: any): string {
  if (bar.id === 'Prompt') return COLOR_PROMPT;
  if (bar.id === 'Completion') return COLOR_COMPLETION;
  if (bar.id === 'Total') return COLOR_TOTAL;
  return 'var(--chart-3)';
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
function UsagePage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<TimeRange>('7d');
  const ALL_ACCOUNTS = '__all__';
  const [selectedAccountId, setSelectedAccountId] = useState<string>(ALL_ACCOUNTS);
  const { data: accounts, isLoading: accountsLoading } = useCloudAccounts();

  const {
    data: dailyData,
    isLoading: dailyLoading,
    error: dailyError,
    refetch: refetchDaily,
  } = useQuery<UsageBucket[]>({
    queryKey: ['usage', 'day', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByDay({ accountId: selectedAccountId === ALL_ACCOUNTS ? undefined : selectedAccountId, start, end });
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
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
      return ipc.client.usage.getUsageByModel({ accountId: selectedAccountId === ALL_ACCOUNTS ? undefined : selectedAccountId, start, end });
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
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
      return ipc.client.usage.getUsageByHour({ accountId: selectedAccountId === ALL_ACCOUNTS ? undefined : selectedAccountId, start, end });
    },
    enabled: range === '24h',
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });

  /* -------------------------- Derived data -------------------------- */
  const totals = useMemo(() => {
    const source = dailyData || [];
    return source.reduce(
      (acc, row) => ({
        promptTokens: acc.promptTokens + row.promptTokens,
        completionTokens: acc.completionTokens + row.completionTokens,
        totalTokens: acc.totalTokens + row.totalTokens,
        requests: acc.requests + row.requests,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0 },
    );
  }, [dailyData]);

  const promptRatio = useMemo(() => {
    if (totals.totalTokens === 0) return 0;
    return Math.round((totals.promptTokens / totals.totalTokens) * 100);
  }, [totals]);

  const completionRatio = useMemo(() => {
    if (totals.totalTokens === 0) return 0;
    return Math.round((totals.completionTokens / totals.totalTokens) * 100);
  }, [totals]);

  const chartData = useMemo(() => {
    return (dailyData || []).map((d) => ({
      name: formatBucketLabel(d.bucket, range),
      Prompt: d.promptTokens,
      Completion: d.completionTokens,
    }));
  }, [dailyData, range]);

  const pieData = useMemo(() => {
    return (modelData || []).map((d) => ({
      id: d.model,
      value: d.totalTokens,
    }));
  }, [modelData]);

  const hourlyChartData = useMemo(() => {
    return (hourlyData || []).map((d) => ({
      name: formatBucketLabel(d.bucket, '24h'),
      Prompt: d.promptTokens,
      Completion: d.completionTokens,
      Total: d.totalTokens,
    }));
  }, [hourlyData]);

  const hourlyTickValues = useMemo(() => {
    return hourlyChartData.filter((_, i) => i % 3 === 0).map((d) => d.name);
  }, [hourlyChartData]);

  const isDailyEmpty = !dailyLoading && !dailyError && (!dailyData || dailyData.length === 0);
  const isModelEmpty = !modelLoading && !modelError && (!modelData || modelData.length === 0);
  const isHourlyEmpty = !hourlyLoading && !hourlyError && (!hourlyData || hourlyData.length === 0);

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="border-border/40 flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">{t('usage.title')}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{t('usage.description')}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account filter */}
          <Select
            value={selectedAccountId}
            onValueChange={(value) => setSelectedAccountId(value)}
            disabled={accountsLoading}
          >
            <SelectTrigger className="h-9 w-[200px] text-xs">
              {accountsLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('common.loading')}
                </span>
              ) : (
                <SelectValue placeholder={t('usage.allAccounts')} />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACCOUNTS}>{t('usage.allAccounts')}</SelectItem>
              {accounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time range tabs */}
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList className="h-9">
              <TabsTrigger value="24h" className="px-3 text-xs">
                {t('usage.range24h')}
              </TabsTrigger>
              <TabsTrigger value="7d" className="px-3 text-xs">
                {t('usage.range7d')}
              </TabsTrigger>
              <TabsTrigger value="30d" className="px-3 text-xs">
                {t('usage.range30d')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 space-y-5 px-6 py-5">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('usage.totalTokens')}
            value={totals.totalTokens}
            icon={Zap}
            isLoading={dailyLoading}
            accent="amber"
          />
          <StatCard
            label={t('usage.promptTokens')}
            value={totals.promptTokens}
            icon={MessageSquare}
            isLoading={dailyLoading}
            accent="blue"
          />
          <StatCard
            label={t('usage.completionTokens')}
            value={totals.completionTokens}
            icon={Activity}
            isLoading={dailyLoading}
            accent="green"
          />
          <StatCard
            label={t('usage.totalRequests')}
            value={totals.requests}
            icon={Layers}
            isLoading={dailyLoading}
            accent="slate"
          />
        </div>

        {/* Trend indicators row */}
        {!dailyLoading && totals.totalTokens > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-muted-foreground">{t('usage.promptLabel')}:</span>
              <span className="text-foreground font-mono font-medium">{promptRatio}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">{t('usage.completionLabel')}:</span>
              <span className="text-foreground font-mono font-medium">{completionRatio}%</span>
            </div>
            <div className="bg-border/40 h-3 w-px" />
            <div className="text-muted-foreground text-xs">
              {t('usage.requestsLabel')}:{' '}
              <span className="text-foreground font-mono font-medium">
                {totals.requests.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Daily Usage Bar Chart */}
          <ChartCard
            title={t('usage.dailyUsage')}
            isLoading={dailyLoading}
            error={dailyError}
            isEmpty={isDailyEmpty}
            onRetry={() => refetchDaily()}
            emptyTitle={t('usage.emptyStateTitle')}
            emptyDescription={t('usage.emptyStateDescription')}
            errorMessage={t('usage.loadFailed')}
            retryLabel={t('usage.retry')}
          >
            <div className="h-[280px]">
              <ResponsiveBar
                data={chartData}
                keys={['Prompt', 'Completion']}
                indexBy="name"
                groupMode="grouped"
                theme={nivoTheme}
                colors={barColor}
                margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
                padding={0.2}
                innerPadding={2}
                borderRadius={2}
                enableGridY={true}
                enableGridX={false}
                gridYValues={5}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 5,
                  tickRotation: 0,
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
                }}
                tooltip={BarTooltip}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 30,
                    itemsSpacing: 16,
                    itemWidth: 80,
                    itemHeight: 16,
                    itemDirection: 'left-to-right',
                    symbolSize: 8,
                    symbolShape: 'circle',
                  },
                ]}
                animate={true}
              />
            </div>
          </ChartCard>

          {/* Model Usage Donut Chart */}
          <ChartCard
            title={t('usage.byModel')}
            isLoading={modelLoading}
            error={modelError}
            isEmpty={isModelEmpty}
            onRetry={() => refetchModel()}
            emptyTitle={t('usage.emptyStateTitle')}
            emptyDescription={t('usage.emptyStateDescription')}
            errorMessage={t('usage.loadFailed')}
            retryLabel={t('usage.retry')}
          >
            <div className="h-[280px]">
              <ResponsivePie
                data={pieData}
                innerRadius={0.55}
                padAngle={2}
                colors={PIE_COLORS}
                borderWidth={0}
                theme={nivoTheme}
                margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
                tooltip={PieTooltip}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 30,
                    itemsSpacing: 16,
                    itemWidth: 80,
                    itemHeight: 16,
                    itemDirection: 'left-to-right',
                    symbolSize: 8,
                    symbolShape: 'circle',
                  },
                ]}
                animate={true}
              />
            </div>
          </ChartCard>
        </div>

        {/* Hourly Usage — 24h only */}
        {range === '24h' && (
          <ChartCard
            title={t('usage.hourlyUsage')}
            isLoading={hourlyLoading}
            error={hourlyError}
            isEmpty={isHourlyEmpty}
            onRetry={() => refetchHourly()}
            emptyTitle={t('usage.emptyStateTitle')}
            emptyDescription={t('usage.emptyStateDescription')}
            errorMessage={t('usage.loadFailed')}
            retryLabel={t('usage.retry')}
          >
            <div className="h-[280px]">
              <ResponsiveBar
                data={hourlyChartData}
                keys={['Prompt', 'Completion', 'Total']}
                indexBy="name"
                groupMode="grouped"
                theme={nivoTheme}
                colors={barColor}
                margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
                padding={0.2}
                innerPadding={2}
                borderRadius={2}
                enableGridY={true}
                enableGridX={false}
                gridYValues={5}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 5,
                  tickRotation: 0,
                  tickValues: hourlyTickValues,
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 5,
                  tickRotation: 0,
                  format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
                }}
                tooltip={BarTooltip}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 30,
                    itemsSpacing: 16,
                    itemWidth: 80,
                    itemHeight: 16,
                    itemDirection: 'left-to-right',
                    symbolSize: 8,
                    symbolShape: 'circle',
                  },
                ]}
                animate={true}
              />
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute('/usage')({
  component: UsagePage,
});
