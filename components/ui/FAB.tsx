'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const fabVariants = cva(
	'md-state-layer md-elevation-3 hover:md-elevation-4 inline-flex items-center justify-center rounded-(--md-sys-shape-corner-lg) md-typescale-label-large transition-all duration-(--md-sys-motion-duration-medium) ease-(--md-sys-motion-easing-standard) active:scale-95 disabled:pointer-events-none disabled:opacity-30',
	{
		variants: {
			variant: {
				primary:
					'bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)',
				secondary:
					'bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container)',
				tertiary:
					'bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container)',
				surface: 'bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-primary)',
			},
			size: {
				small: 'w-10 h-10 rounded-(--md-sys-shape-corner-md)',
				medium: 'w-14 h-14',
				large: 'w-24 h-24 rounded-(--md-sys-shape-corner-xl)',
				extended: 'h-14 px-6 md-typescale-label-large gap-2',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'medium',
		},
	},
);

export interface FABProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof fabVariants> {
	extended?: boolean;
}

const FAB = forwardRef<HTMLButtonElement, FABProps>(
	({ className, variant, size, extended, onClick, children, ...props }, ref) => {
		const isExtended = extended || size === 'extended';

		const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
			// MD3 Haptic Feedback (Peak Hype)
			if ('vibrate' in navigator) {
				navigator.vibrate(10); // Subtle tick
			}
			onClick?.(e);
		};

		return (
			<button
				className={cn(
					fabVariants({ variant, size: isExtended ? 'extended' : size }),
					className,
				)}
				onClick={handleClick}
				ref={ref}
				{...props}
			>
				{children}
			</button>
		);
	},
);
FAB.displayName = 'FAB';

export { FAB };
