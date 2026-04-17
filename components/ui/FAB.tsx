'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const fabVariants = cva(
	'md-state-layer md-elevation-3 hover:md-elevation-4 inline-flex items-center justify-center rounded-[var(--md-sys-shape-corner-lg)] md-typescale-label-large transition-all duration-[var(--md-sys-motion-duration-medium)] ease-[var(--md-sys-motion-easing-standard)] active:scale-95 disabled:pointer-events-none disabled:opacity-30',
	{
		variants: {
			variant: {
				primary:
					'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
				secondary:
					'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]',
				tertiary:
					'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]',
				surface:
					'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)]',
			},
			size: {
				small: 'w-10 h-10 rounded-[var(--md-sys-shape-corner-md)]',
				medium: 'w-14 h-14',
				large: 'w-24 h-24 rounded-[var(--md-sys-shape-corner-xl)]',
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
	({ className, variant, size, extended, ...props }, ref) => {
		const isExtended = extended || size === 'extended';
		return (
			<button
				className={cn(
					fabVariants({ variant, size: isExtended ? 'extended' : size }),
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
FAB.displayName = 'FAB';

export { FAB };
