import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { StatCard } from '@/components/usage/StatCard';
import { TrafficLogTable } from './TrafficLogTable';
import { Loader2, Zap, Clock, AlertTriangle, Network, HardDrive } from 'lucide-react';

export const MonitorTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [direction, setDirection] = useState<string>('all');

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'metrics'],
    queryFn: () => ipc.client.proxyAdvanced.getProxyMetrics(),
    refetchInterval: 30000,
  });

  const { data: cbData, isLoading: cbLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'circuitBreaker'],
    queryFn: () => ipc.client.proxyAdvanced.getCircuitBreakerStatus(),
    refetchInterval: 30000,
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['proxyAdvanced', 'logs', direction],
    queryFn: () =>
      ipc.client.proxyAdvanced.getRecentTrafficLogs({
        limit: 50,
        direction: direction === 'all' ? undefined : direction,
      }),
    refetchInterval: 30000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['proxyAdvanced', 'stats'],
    queryFn: () => ipc.client.proxyAdvanced.getTrafficLogStats(),
    refetchInterval: 30000,
  });

  const metrics = metricsData?.success ? metricsData.data : undefined;
  const circuitBreakers = cbData?.success ? cbData.data : undefined;
  const logs = logsData?.success
    ? (logsData.data || []).map((log) => ({
        ...log,
        model: log.metadata?.model as string | undefined,
        tokensPrompt: log.metadata?.tokensPrompt as number | undefined,
        tokensCompletion: log.metadata?.tokensCompletion as number | undefined,
        tokensTotal:
          (((log.metadata?.tokensPrompt as number) || 0) +
            ((log.metadata?.tokensCompletion as number) || 0)) ||
          undefined,
      }))
    : [];
  const stats = statsData?.success ? statsData.data : undefined;

  const handleExport = async (format: 'json' | 'csv') => {
    const result = await ipc.client.proxyAdvanced.exportTrafficLogs({ format });
    if (result.success && result.data) {
      navigator.clipboard.writeText(result.data);
      toast({ title: t('proxy.advanced.tools.copyConfig') });
    } else {
      toast({ title: t('common.error'), description: result.error });
    }
  };

  const getCircuitBadgeVariant = (state: string): React.ComponentProps<typeof Badge>['variant'] => {
    if (state === 'closed') return 'default';
    if (state === 'open') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-5">
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('proxy.advanced.metrics.requestsPerMinute')}
          value={metrics ? Math.round(metrics.requestsPerMinute) : 0}
          icon={Zap}
          isLoading={metricsLoading}
          accent="amber"
        />
        <StatCard
          label={t('proxy.advanced.metrics.avgLatency')}
          value={metrics ? Math.round(metrics.avgLatency) : 0}
          icon={Clock}
          isLoading={metricsLoading}
          accent="blue"
        />
        <StatCard
          label={t('proxy.advanced.metrics.errorRate')}
          value={metrics ? Math.round(metrics.errorRate * 100) : 0}
          icon={AlertTriangle}
          isLoading={metricsLoading}
          accent="amber"
        />
        <StatCard
          label={t('proxy.advanced.metrics.activeConnections')}
          value={metrics?.activeConnections ?? 0}
          icon={Network}
          isLoading={metricsLoading}
          accent="green"
        />
        <StatCard
          label={t('proxy.advanced.metrics.cacheStatus')}
          value={metrics?.cacheHitRate ? `${Math.round(metrics.cacheHitRate * 100)}%` : 'N/A'}
          icon={HardDrive}
          isLoading={metricsLoading}
          accent="purple"
        />
      </div>

      {/* Circuit Breakers */}
      <div className="bg-card overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h4 className="text-[13px] font-semibold">{t('proxy.advanced.circuitBreaker.title')}</h4>
        </div>
        <div className="p-5">
          {cbLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !circuitBreakers ? (
            <p className="text-muted-foreground text-[13px]">No data</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(circuitBreakers.states).map(([api, state]) => (
                <div
                  key={api}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{api}</span>
                    <Badge variant={getCircuitBadgeVariant(state.state)}>{state.state}</Badge>
                  </div>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {t('proxy.advanced.circuitBreaker.failures')}: {state.failures}
                  </div>
                  {state.lastFailure && (
                    <div className="text-muted-foreground text-xs">
                      {t('proxy.advanced.circuitBreaker.lastFailure')}:{' '}
                      {new Date(state.lastFailure).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Traffic Logs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[13px] font-semibold">{t('proxy.advanced.trafficLog.title')}</h3>
            {stats && <span className="text-muted-foreground text-xs">Total: {stats.total}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder={t('proxy.advanced.trafficLog.direction')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('proxy.advanced.trafficLog.all')}</SelectItem>
                <SelectItem value="inbound">{t('proxy.advanced.trafficLog.inbound')}</SelectItem>
                <SelectItem value="outbound">{t('proxy.advanced.trafficLog.outbound')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleExport('json')}
            >
              {t('proxy.advanced.trafficLog.exportJson')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleExport('csv')}
            >
              {t('proxy.advanced.trafficLog.exportCsv')}
            </Button>
          </div>
        </div>
        <TrafficLogTable logs={logs || []} isLoading={logsLoading} />
      </div>
    </div>
  );
};
