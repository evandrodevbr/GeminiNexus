import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30',
  {
    variants: {
      variant: {
        default: 'bg-accent/15 text-accent border border-accent/20',
        secondary: 'bg-secondary text-secondary-foreground border border-white/[0.06]',
        destructive: 'bg-destructive/15 text-red-400 border border-destructive/20',
        outline: 'border border-white/[0.1] text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
