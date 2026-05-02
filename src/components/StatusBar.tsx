import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isProcessRunning, startGeminiNexus, closeGeminiNexus } from '@/actions/process';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Square, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
export const StatusBar: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: isRunning, isLoading } = useQuery({
    queryKey: ['process', 'status'],
    queryFn: isProcessRunning,
    refetchInterval: 30000,
  });

  const startMutation = useMutation({
    mutationFn: startGeminiNexus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', 'status'] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: closeGeminiNexus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', 'status'] });
    },
  });

  const handleToggle = () => {
    if (isRunning) {
      stopMutation.mutate();
    } else {
      startMutation.mutate();
    }
  };

  const isPending = startMutation.isPending || stopMutation.isPending;
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      {isLoading ? (
        <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />
      ) : (
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            isRunning
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
              : 'bg-muted-foreground/50',
          )}
        />
      )}
      <span
        className={cn(
          'text-xs font-medium',
          isRunning ? 'text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {isLoading ? '...' : isRunning ? 'Running' : 'Stopped'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || isPending}
        className={cn(
          'h-7 w-7 rounded-md p-0',
          isRunning
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : 'text-muted-foreground hover:bg-white/[0.06]',
        )}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isRunning ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" />
        )}
        <span className="sr-only">{isRunning ? t('action.stop') : t('action.start')}</span>
      </Button>
    </div>
  );
};
