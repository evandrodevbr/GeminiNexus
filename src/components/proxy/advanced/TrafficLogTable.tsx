import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TrafficLogEntry {
  timestamp: string;
  direction: string;
  requestId: string;
  endpoint: string;
  method?: string;
  status?: number;
  durationMs?: number;
}

interface TrafficLogTableProps {
  logs: TrafficLogEntry[];
  isLoading: boolean;
}

type SortKey = 'timestamp' | 'direction' | 'endpoint' | 'method' | 'status' | 'duration';
type SortDir = 'asc' | 'desc';

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <span className="ml-1 inline-block w-3" />;
  return sortDir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

export const TrafficLogTable: React.FC<TrafficLogTableProps> = ({ logs, isLoading }) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedLogs = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...logs].sort((a, b) => {
      switch (sortKey) {
        case 'timestamp':
          return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * dir;
        case 'direction':
          return (a.direction || '').localeCompare(b.direction || '') * dir;
        case 'endpoint':
          return (a.endpoint || '').localeCompare(b.endpoint || '') * dir;
        case 'method':
          return (a.method || '').localeCompare(b.method || '') * dir;
        case 'status': {
          const aStatus = a.status ?? -1;
          const bStatus = b.status ?? -1;
          return (aStatus - bStatus) * dir;
        }
        case 'duration': {
          const aDur = a.durationMs ?? -1;
          const bDur = b.durationMs ?? -1;
          return (aDur - bDur) * dir;
        }
        default:
          return 0;
      }
    });
  }, [logs, sortKey, sortDir]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          {t('proxy.advanced.trafficLog.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('proxy.advanced.trafficLog.noLogs')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th
                    className="cursor-pointer pb-2 pr-4 font-medium select-none"
                    onClick={() => toggleSort('timestamp')}
                  >
                    {t('proxy.advanced.trafficLog.timestamp')}
                    <SortIcon column="timestamp" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 pr-4 font-medium select-none"
                    onClick={() => toggleSort('direction')}
                  >
                    {t('proxy.advanced.trafficLog.direction')}
                    <SortIcon column="direction" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 pr-4 font-medium select-none"
                    onClick={() => toggleSort('endpoint')}
                  >
                    {t('proxy.advanced.trafficLog.endpoint')}
                    <SortIcon column="endpoint" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 pr-4 font-medium select-none"
                    onClick={() => toggleSort('method')}
                  >
                    {t('proxy.advanced.trafficLog.method')}
                    <SortIcon column="method" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 pr-4 font-medium select-none"
                    onClick={() => toggleSort('status')}
                  >
                    {t('proxy.advanced.trafficLog.status')}
                    <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 font-medium select-none"
                    onClick={() => toggleSort('duration')}
                  >
                    {t('proxy.advanced.trafficLog.duration')}
                    <SortIcon column="duration" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log, i) => (
                  <tr
                    key={`${log.requestId}-${i}`}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge
                        variant="outline"
                        className={
                          log.direction === 'inbound'
                            ? 'border-blue-500/30 text-blue-400'
                            : log.direction === 'outbound'
                              ? 'border-emerald-500/30 text-emerald-400'
                              : 'border-slate-500/30 text-slate-400'
                        }
                      >
                        {log.direction}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.endpoint}</td>
                    <td className="py-2 pr-4 text-xs">{log.method || '—'}</td>
                    <td className="py-2 pr-4 text-xs">
                      {log.status != null ? (
                        <Badge
                          variant={log.status >= 400 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-xs">
                      {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
