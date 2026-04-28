import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="border border-white/5 bg-background flex flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        <div className="flex-1">
          {isLoading ? (
            <div className="flex h-[280px] flex-col gap-3">
              <Skeleton className="h-full w-full" />
            </div>
          ) : error ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3">
              <AlertTriangle className="text-destructive h-5 w-5" />
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {retryLabel}
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2">
              <BarChart3 className="text-muted-foreground/50 h-6 w-6" />
              <p className="text-foreground text-sm font-medium">{emptyTitle}</p>
              <p className="text-muted-foreground max-w-[240px] text-center text-xs">
                {emptyDescription}
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
};
