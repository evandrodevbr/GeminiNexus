import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'bg-muted/50 text-foreground flex h-9 w-full rounded-lg border border-white/[0.08] px-3 py-1 text-[13px] shadow-none transition-colors duration-200',
          'file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:border-accent/50 focus-visible:ring-accent/20 focus-visible:ring-1 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
