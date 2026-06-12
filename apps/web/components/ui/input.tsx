import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-8 w-full rounded-sm border border-input bg-white px-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
