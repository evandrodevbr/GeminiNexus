import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { calculateCost } from '@/constants/pricing';

interface TrafficLogEntry {
  timestamp: string;
  direction: string;
  requestId: string;
  endpoint: string;
  method?: string;
  status?: number;
  durationMs?: number;
  tokensPrompt?: number;
  tokensCompletion?: number;
  tokensTotal?: number;
  model?: string;
  body?: unknown;
  headers?: Record<string, unknown>;
}

interface TrafficLogTableProps {
  logs: TrafficLogEntry[];
  isLoading: boolean;
}

type SortKey = 'timestamp' | 'direction' | 'endpoint' | 'model' | 'method' | 'status' | 'tokens' | 'cost' | 'duration';
type SortDir = 'asc' | 'desc';

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== column) return <span className="ml-1 inline-block w-3" />;
  return sortDir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

const formatTokens = (tokens?: number) => {
  if (tokens == null) return '—';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
};

/**
 * Safely format a JSON body for display.
 * Truncates very large bodies and handles non-object values.
 */
function formatBody(body: unknown, maxLength = 8000): string {
  if (body == null) return 'No data';
  try {
    const str = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    if (str.length > maxLength) {
      return str.slice(0, maxLength) + `\n\n... [truncated ${str.length - maxLength} chars]`;
    }
    return str;
  } catch {
    return String(body);
  }
}

/**
 * Extract a short preview of the message content from a request/response body.
 */
function getBodyPreview(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;

  // Request body: extract first user message
  if (Array.isArray(obj.messages)) {
    const userMsg = obj.messages.find(
      (m: Record<string, unknown>) => m.role === 'user',
    );
    if (userMsg) {
      const content = typeof userMsg.content === 'string'
        ? userMsg.content
        : JSON.stringify(userMsg.content);
      return content.length > 120 ? content.slice(0, 120) + '…' : content;
    }
  }

  // Response body: extract assistant content
  if (Array.isArray(obj.choices)) {
    const firstChoice = obj.choices[0] as Record<string, unknown> | undefined;
    const message = firstChoice?.message as Record<string, unknown> | undefined;
    if (message?.content && typeof message.content === 'string') {
      return message.content.length > 120
        ? message.content.slice(0, 120) + '…'
        : message.content;
    }
  }

  return null;
}

export const TrafficLogTable: React.FC<TrafficLogTableProps> = ({ logs, isLoading }) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedId((prev) => (prev === logId ? null : logId));
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
        case 'model':
          return (a.model || '').localeCompare(b.model || '') * dir;
        case 'method':
          return (a.method || '').localeCompare(b.method || '') * dir;
        case 'status': {
          const aStatus = a.status ?? -1;
          const bStatus = b.status ?? -1;
          return (aStatus - bStatus) * dir;
        }
        case 'tokens': {
          const aTokens = a.tokensTotal ?? -1;
          const bTokens = b.tokensTotal ?? -1;
          return (aTokens - bTokens) * dir;
        }
        case 'cost': {
          const aCost = calculateCost(a.model || '', a.tokensPrompt || 0, a.tokensCompletion || 0);
          const bCost = calculateCost(b.model || '', b.tokensPrompt || 0, b.tokensCompletion || 0);
          return (aCost - bCost) * dir;
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

  const COL_COUNT = 9;

  return (
    <div className="bg-card overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h4 className="text-[13px] font-semibold">{t('proxy.advanced.trafficLog.title')}</h4>
      </div>
      <div className="p-5">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-[13px]">
            {t('proxy.advanced.trafficLog.noLogs')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-white/[0.06] text-left text-[10px] font-medium tracking-wider uppercase">
                  {/* Expand indicator column */}
                  <th className="w-6 pb-2" />
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('timestamp')}
                  >
                    {t('proxy.advanced.trafficLog.timestamp')}
                    <SortIcon column="timestamp" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('direction')}
                  >
                    {t('proxy.advanced.trafficLog.direction')}
                    <SortIcon column="direction" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('endpoint')}
                  >
                    {t('proxy.advanced.trafficLog.endpoint')}
                    <SortIcon column="endpoint" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('model')}
                  >
                    Model
                    <SortIcon column="model" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('status')}
                  >
                    {t('proxy.advanced.trafficLog.status')}
                    <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('tokens')}
                  >
                    Input / Output
                    <SortIcon column="tokens" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pr-4 pb-2 font-medium select-none"
                    onClick={() => toggleSort('duration')}
                  >
                    {t('proxy.advanced.trafficLog.duration')}
                    <SortIcon column="duration" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                  <th
                    className="cursor-pointer pb-2 font-medium select-none"
                    onClick={() => toggleSort('cost')}
                  >
                    Cost
                    <SortIcon column="cost" sortKey={sortKey} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log, i) => {
                  const logKey = `${log.requestId}-${i}`;
                  const isExpanded = expandedId === logKey;
                  const preview = getBodyPreview(log.body);

                  return (
                    <React.Fragment key={logKey}>
                      <tr
                        className={`cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 ${
                          isExpanded
                            ? 'bg-white/[0.03]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => toggleExpand(logKey)}
                      >
                        {/* Expand chevron */}
                        <td className="py-2 pr-1">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                          )}
                        </td>
                        <td className="text-muted-foreground py-2 pr-4 font-mono text-xs">
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
                        <td className="py-2 pr-4 text-xs">{log.model || '—'}</td>
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
                        <td className="py-2 pr-4 text-xs">
                          {log.tokensTotal ? (
                            `${formatTokens(log.tokensPrompt)} / ${formatTokens(log.tokensCompletion)}`
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 pr-4 text-xs">
                          {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                        </td>
                        <td className="py-2 text-xs text-emerald-400">
                          {log.tokensTotal && log.model
                            ? `$${calculateCost(log.model, log.tokensPrompt || 0, log.tokensCompletion || 0).toFixed(6)}`
                            : '—'}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="border-b border-white/[0.04]">
                          <td colSpan={COL_COUNT} className="p-0">
                            <div className="border-t border-white/[0.06] bg-white/[0.01] px-6 py-4">
                              {/* Preview line */}
                              {preview && (
                                <div className="mb-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground italic break-words">
                                  "{preview}"
                                </div>
                              )}

                              {/* Summary badges */}
                              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  ID: {log.requestId.slice(0, 8)}
                                </Badge>
                                {log.model && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {log.model}
                                  </Badge>
                                )}
                                {log.tokensPrompt != null && (
                                  <Badge variant="outline" className="border-blue-500/20 text-blue-400 text-[10px]">
                                    Input: {log.tokensPrompt.toLocaleString()} tokens
                                  </Badge>
                                )}
                                {log.tokensCompletion != null && (
                                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 text-[10px]">
                                    Output: {log.tokensCompletion.toLocaleString()} tokens
                                  </Badge>
                                )}
                                {log.tokensTotal != null && log.model && (
                                  <Badge variant="outline" className="border-amber-500/20 text-amber-400 text-[10px]">
                                    Cost: ${calculateCost(log.model, log.tokensPrompt || 0, log.tokensCompletion || 0).toFixed(6)}
                                  </Badge>
                                )}
                                {log.durationMs != null && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {log.durationMs}ms
                                  </Badge>
                                )}
                              </div>

                              {/* Body content */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                    {log.direction === 'inbound' ? 'Request Body' : log.direction === 'outbound' ? 'Response Body' : 'Payload'}
                                  </span>
                                </div>
                                <pre className="custom-scrollbar max-h-[400px] overflow-auto rounded-lg bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                                  {formatBody(log.body)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
