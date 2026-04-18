'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'md-state-layer inline-flex items-center justify-center whitespace-nowrap rounded-(--md-sys-shape-corner-full) md-typescale-label-large ring-offset-background transition-all duration-(--md-sys-motion-duration-medium) ease-(--md-sys-motion-easing-standard) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--md-sys-color-primary) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30',
	{
		variants: {
			variant: {
				filled: 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) hover:md-elevation-1',
				outlined:
					'border border-(--md-sys-color-outline) bg-transparent text-(--md-sys-color-primary) focus-visible:border-(--md-sys-color-primary) active:border-(--md-sys-color-primary)',
				text: 'bg-transparent text-(--md-sys-color-primary) px-3',
				elevated:
					'bg-(--md-sys-color-surface-container-low) text-(--md-sys-color-primary) md-elevation-1 hover:md-elevation-2',
				tonal: 'bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) hover:md-elevation-1',
			},
			size: {
				small: 'h-8 px-4',
				medium: 'h-10 px-6',
				large: 'h-12 px-8 md-typescale-title-small',
			},
		},
		defaultVariants: {
			variant: 'filled',
			size: 'medium',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button, buttonVariants };
