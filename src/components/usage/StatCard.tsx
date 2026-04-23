import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
  className?: string;
  accent?: 'blue' | 'green' | 'amber' | 'slate' | 'purple';
}

const ACCENT_MAP = {
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  slate: 'text-slate-400',
  purple: 'text-purple-400',
};

const BG_MAP = {
  blue: 'bg-blue-500/5',
  green: 'bg-emerald-500/5',
  amber: 'bg-amber-500/5',
  slate: 'bg-slate-500/5',
  purple: 'bg-purple-500/5',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  isLoading,
  className,
  accent = 'slate',
}) => {
  return (
    <Card
      className={cn(
        'border-border/60 bg-card/60 hover:bg-card backdrop-blur-none transition-colors',
        className,
      )}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </span>
          {isLoading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <span className="text-foreground font-mono text-2xl font-semibold tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
          )}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
            BG_MAP[accent],
          )}
        >
          <Icon className={cn('h-4 w-4', ACCENT_MAP[accent])} />
        </div>
      </CardContent>
    </Card>
  );
};
