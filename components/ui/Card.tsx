'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const cardVariants = cva(
	'rounded-[var(--md-sys-shape-corner-lg)] text-[var(--md-sys-color-on-surface)] transition-all duration-[var(--md-sys-motion-duration-medium)] ease-[var(--md-sys-motion-easing-standard)]',
	{
		variants: {
			variant: {
				elevated: 'bg-[var(--md-sys-color-surface-container-low)] md-elevation-1',
				filled: 'bg-[var(--md-sys-color-surface-container-highest)] border-transparent',
				outlined: 'bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]',
			},
		},
		defaultVariants: {
			variant: 'elevated',
		},
	}
);

export interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, ...props }, ref) => (
		<div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
	)
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
	)
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h3
			ref={ref}
			className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
			{...props}
		/>
	)
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<p ref={ref} className={cn('text-sm text-on-surface-variant', className)} {...props} />
	)
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
	)
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
	)
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };