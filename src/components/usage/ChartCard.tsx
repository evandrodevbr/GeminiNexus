import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BarChart3, RotateCcw } from 'lucide-react';

interface ChartStatesProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  onRetry: () => void;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  errorMessage: string;
  retryLabel: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartStatesProps> = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  title,
  emptyTitle,
  emptyDescription,
  errorMessage,
  retryLabel,
  children,
}) => {
  return (
    <div className="flex flex-col rounded-xl border border-white/[0.06] bg-card">
      <div className="flex flex-col p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div className="flex h-[280px] flex-col gap-3">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-muted-foreground text-[13px]">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {retryLabel}
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04]">
                <BarChart3 className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <p className="text-[13px] font-medium text-foreground">{emptyTitle}</p>
              <p className="text-muted-foreground max-w-[240px] text-center text-xs">
                {emptyDescription}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};
