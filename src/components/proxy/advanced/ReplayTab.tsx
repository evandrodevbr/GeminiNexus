import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipc } from '@/ipc/manager';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Play, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface ReplayEntry {
  id: string;
  timestamp: number;
  method: string;
  endpoint: string;
  status?: number;
  duration?: number;
  body?: unknown;
}

export const ReplayTab: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['proxyAdvanced', 'recentRequests'],
    queryFn: () => ipc.client.proxyAdvanced.getRecentRequests(),
    refetchInterval: 10000,
  });

  const replayMutation = useMutation({
    mutationFn: (requestId: string) => ipc.client.proxyAdvanced.replayRequest({ requestId }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: t('proxy.advanced.replay.success'),
          description: t('proxy.advanced.replay.replayedSuccessfully'),
        });
      } else {
        toast({
          title: t('proxy.advanced.replay.error'),
          description: data.error || t('proxy.advanced.replay.unknownError'),
          variant: 'destructive',
        });
      }
      setSelectedRequestId(null);
    },
    onError: (error) => {
      toast({
        title: t('proxy.advanced.replay.error'),
        description: error instanceof Error ? error.message : t('proxy.advanced.replay.unknownError'),
        variant: 'destructive',
      });
      setSelectedRequestId(null);
    },
  });

  const requests: ReplayEntry[] = requestsData?.success ? (requestsData.data as ReplayEntry[]) : [];

  const handleReplay = (requestId: string) => {
    setSelectedRequestId(requestId);
    replayMutation.mutate(requestId);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusBadge = (status?: number) => {
    if (!status) return <Badge variant="outline">{t('proxy.advanced.replay.pending')}</Badge>;
    if (status >= 200 && status < 300) {
      return (
        <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    }
    if (status >= 400) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{t('proxy.advanced.replay.title')}</h3>
          <p className="text-[13px] text-muted-foreground">{t('proxy.advanced.replay.description')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchRequests()}
          disabled={requestsLoading}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${requestsLoading ? 'animate-spin' : ''}`} />
          {t('proxy.advanced.replay.refresh')}
        </Button>
      </div>

      {/* Requests List */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-card">
        <div className="border-b border-white/[0.06] px-5 py-4 space-y-1">
          <h4 className="text-[13px] font-semibold">{t('proxy.advanced.replay.recentRequests')}</h4>
          <p className="text-xs text-muted-foreground">{t('proxy.advanced.replay.clickToReplay')}</p>
        </div>
        <div className="p-5">
          {requestsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1]">
              <Clock className="h-6 w-6 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">
                {t('proxy.advanced.replay.noRequests')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] p-3 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium">
                        {request.method} {request.endpoint}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(request.timestamp)}
                        {request.duration && ` · ${request.duration}ms`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReplay(request.id)}
                    disabled={replayMutation.isPending && selectedRequestId === request.id}
                  >
                    {replayMutation.isPending && selectedRequestId === request.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {t('proxy.advanced.replay.replay')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
