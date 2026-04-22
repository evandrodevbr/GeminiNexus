import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Loader2, TrendingUp, TrendingDown, Activity, Layers } from 'lucide-react';
import { ipc } from '@/ipc/manager';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useMemo, useState } from 'react';
import { useCloudAccounts } from '@/hooks/useCloudAccounts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function UsagePage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const { data: accounts, isLoading: accountsLoading } = useCloudAccounts();

  function getTimeRange(r: '24h' | '7d' | '30d') {
    const now = Date.now();
    if (r === '24h') {
      return { start: now - 24 * 60 * 60 * 1000, end: now };
    }
    if (r === '7d') {
      return { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
    }
    return { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
  }

  const {
    data: dailyData,
    isLoading: dailyLoading,
    error: dailyError,
    refetch: refetchDaily,
  } = useQuery({
    queryKey: ['usage', 'day', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByDay({ accountId: selectedAccountId, start, end });
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
  } = useQuery({
    queryKey: ['usage', 'model', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByModel({ accountId: selectedAccountId, start, end });
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
  } = useQuery({
    queryKey: ['usage', 'hour', range, selectedAccountId],
    queryFn: () => {
      const { start, end } = getTimeRange(range);
      return ipc.client.usage.getUsageByHour({ accountId: selectedAccountId, start, end });
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });

  const isAllLoading = dailyLoading && modelLoading && hourlyLoading;

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

  const chartData = useMemo(() => {
    return (dailyData || []).map((d) => ({
      name: d.bucket,
      Prompt: d.promptTokens,
      Completion: d.completionTokens,
      Total: d.totalTokens,
    }));
  }, [dailyData]);

  const pieData = useMemo(() => {
    return (modelData || []).map((d) => ({
      name: d.model,
      value: d.totalTokens,
    }));
  }, [modelData]);

  const hourlyChartData = useMemo(() => {
    return (hourlyData || []).map((d) => ({
      name: d.bucket,
      Prompt: d.promptTokens,
      Completion: d.completionTokens,
      Total: d.totalTokens,
    }));
  }, [hourlyData]);

  if (isAllLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const dailyPlaceholder = dailyError ? (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
        <p className="text-sm text-destructive">{t('usage.loadFailed')}</p>
        <button
          onClick={() => refetchDaily()}
          className="text-primary text-sm underline"
        >
          {t('usage.retry')}
        </button>
      </CardContent>
    </Card>
  ) : !dailyData ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">{t('usage.noData')}</p>
      </CardContent>
    </Card>
  ) : null;

  const modelPlaceholder = modelError ? (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
        <p className="text-sm text-destructive">{t('usage.loadFailed')}</p>
        <button
          onClick={() => refetchModel()}
          className="text-primary text-sm underline"
        >
          {t('usage.retry')}
        </button>
      </CardContent>
    </Card>
  ) : !modelData ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">{t('usage.noData')}</p>
      </CardContent>
    </Card>
  ) : null;

  const hourlyPlaceholder = hourlyError ? (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
        <p className="text-sm text-destructive">{t('usage.loadFailed')}</p>
        <button
          onClick={() => refetchHourly()}
          className="text-primary text-sm underline"
        >
          {t('usage.retry')}
        </button>
      </CardContent>
    </Card>
  ) : !hourlyData ? (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">{t('usage.noData')}</p>
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('usage.title')}</h2>
          <p className="text-muted-foreground mt-1">{t('usage.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedAccountId || ''}
            onValueChange={(value) => setSelectedAccountId(value || undefined)}
            disabled={accountsLoading}
          >
            <SelectTrigger className="w-[200px]">
              {accountsLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </span>
              ) : (
                <SelectValue placeholder={t('usage.allAccounts')} />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('usage.allAccounts')}</SelectItem>
              {accounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={range} onValueChange={(v) => setRange(v as '24h' | '7d' | '30d')}>
            <TabsList>
              <TabsTrigger value="24h">{t('usage.range24h')}</TabsTrigger>
              <TabsTrigger value="7d">{t('usage.range7d')}</TabsTrigger>
              <TabsTrigger value="30d">{t('usage.range30d')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary Cards */}
      {dailyPlaceholder || (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('usage.totalTokens')}</CardTitle>
              <Activity className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalTokens.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('usage.promptTokens')}</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.promptTokens.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('usage.completionTokens')}</CardTitle>
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.completionTokens.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t('usage.totalRequests')}</CardTitle>
              <Layers className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.requests.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {dailyPlaceholder || (
          <Card>
            <CardHeader>
              <CardTitle>{t('usage.dailyUsage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Prompt" fill="#3b82f6" />
                  <Bar dataKey="Completion" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {modelPlaceholder || (
          <Card>
            <CardHeader>
              <CardTitle>{t('usage.byModel')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {range === '24h' && (
        hourlyPlaceholder || (
          <Card>
            <CardHeader>
              <CardTitle>{t('usage.hourlyUsage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Prompt" fill="#3b82f6" />
                  <Bar dataKey="Completion" fill="#10b981" />
                  <Bar dataKey="Total" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}

export const Route = createFileRoute('/usage')({
  component: UsagePage,
});
