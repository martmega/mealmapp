import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-pastel-background transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-pastel-primary text-pastel-primary-text shadow-pastel-button border border-transparent hover:bg-pastel-primary-hover hover:shadow-pastel-button-hover hover:border-pastel-primary-hover active:bg-pastel-primary-hover/90 active:shadow-pastel-button-inset active:border-pastel-primary transform active:scale-[0.97]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-pastel-button border border-transparent hover:bg-destructive/90 hover:shadow-pastel-button-hover hover:border-destructive active:bg-destructive/80 active:shadow-pastel-button-inset active:border-destructive transform active:scale-[0.97]',
        outline:
          'border border-pastel-input-border bg-pastel-card text-pastel-text hover:bg-pastel-highlight hover:border-pastel-active-border hover:shadow-pastel-button active:bg-pastel-highlight/80 active:border-pastel-active-border/70 active:shadow-pastel-button-inset transform active:scale-[0.98]',
        secondary:
          'bg-pastel-secondary text-pastel-secondary-text shadow-pastel-button border border-transparent hover:bg-pastel-secondary-hover hover:shadow-pastel-button-hover hover:border-pastel-secondary-hover active:bg-pastel-secondary-hover/90 active:shadow-pastel-button-inset active:border-pastel-secondary transform active:scale-[0.97]',
        ghost:
          'text-pastel-text/70 border border-transparent hover:bg-pastel-highlight hover:text-pastel-text hover:border-pastel-active-border active:bg-pastel-highlight/90 active:text-pastel-primary active:border-pastel-active-border/70 transform active:scale-[0.98] shadow-none',
        link: 'text-pastel-primary underline-offset-4 border border-transparent hover:underline hover:text-pastel-primary-hover active:text-pastel-primary-hover/90 transform active:scale-[0.98] shadow-none',
        tertiary:
          'bg-pastel-tertiary text-pastel-tertiary-text shadow-pastel-button border border-transparent hover:bg-pastel-tertiary-hover hover:shadow-pastel-button-hover hover:border-pastel-tertiary-hover active:bg-pastel-tertiary-hover/90 active:shadow-pastel-button-inset active:border-pastel-tertiary transform active:scale-[0.97]',
        accent:
          'bg-pastel-accent text-pastel-accent-text shadow-pastel-button border border-transparent hover:bg-pastel-accent-hover hover:shadow-pastel-button-hover hover:border-pastel-accent-hover active:bg-pastel-accent-hover/90 active:shadow-pastel-button-inset active:border-pastel-accent transform active:scale-[0.97]',
        tag:
          'border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-transparent bg-pastel-card text-pastel-text border-pastel-border dark:bg-pastel-card dark:text-pastel-text dark:border-pastel-border hover:bg-pastel-highlight dark:hover:bg-pastel-highlight transform active:scale-[0.97]',
        premium:
          'bg-pastel-accent text-pastel-accent-text border-pastel-accent rounded-md px-4 py-2 hover:bg-pastel-accent-hover active:bg-pastel-accent-hover/90 transform active:scale-[0.97]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      'data-state': dataState,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-state={dataState}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
