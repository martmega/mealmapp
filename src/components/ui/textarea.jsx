import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm ring-offset-pastel-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150 shadow-pastel-input hover:border-pastel-muted-foreground/30 focus-visible:shadow-pastel-input-focus',
        'border-2 border-pastel-input-border bg-pastel-input text-pastel-text placeholder:text-pastel-muted-foreground dark:border-pastel-input-border dark:bg-pastel-input dark:text-pastel-text dark:placeholder:text-pastel-muted-foreground',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
