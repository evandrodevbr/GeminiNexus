import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isProcessRunning, startGeminiNexus, closeGeminiNexus } from '@/actions/process';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Square, Loader2, Power } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatusBarProps {
  isCollapsed?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isCollapsed = false }) => {
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

  // Collapsed View
  if (isCollapsed) {
    return (
      <div className="flex justify-center py-2">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggle}
                disabled={isLoading || isPending}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground',
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2 text-xs">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isRunning ? 'bg-emerald-400' : 'bg-muted-foreground',
                )}
              />
              <span>
                {isLoading
                  ? t('status.checking')
                  : isRunning
                    ? t('status.running')
                    : t('status.stopped')}
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Expanded View
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200',
        isRunning
          ? 'bg-emerald-500/[0.08]'
          : 'bg-white/[0.02]',
      )}
    >
      <div className="flex items-center gap-2.5">
        {isLoading ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <div
            className={cn(
              'h-2 w-2 shrink-0 rounded-full transition-colors duration-300',
              isRunning
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                : 'bg-muted-foreground/50',
            )}
          />
        )}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <span className={cn(
            'text-xs font-medium leading-tight',
            isRunning ? 'text-emerald-400' : 'text-muted-foreground',
          )}>
            {isLoading
              ? t('status.checking')
              : isRunning
                ? t('status.running')
                : t('status.stopped')}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading || isPending}
        className={cn(
          'h-7 gap-1.5 rounded-md px-2.5 text-xs',
          isRunning
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : 'text-muted-foreground hover:bg-white/[0.06]',
        )}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isRunning ? (
          <Square className="h-3 w-3 fill-current" />
        ) : (
          <Play className="h-3 w-3 fill-current" />
        )}
        <span>{isRunning ? t('action.stop') : t('action.start')}</span>
      </Button>
    </div>
  );
};
