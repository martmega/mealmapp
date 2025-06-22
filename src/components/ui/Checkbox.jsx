import React from 'react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef(
  ({ className, checked, onChange, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      className={cn('w-4 h-4 accent-purple-600', className)}
      {...props}
    />
  )
);
Checkbox.displayName = 'Checkbox';
