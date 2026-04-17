'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const textFieldVariants = cva(
	'md-typescale-body-large flex h-14 w-full transition-all duration-[var(--md-sys-motion-duration-medium)] ease-[var(--md-sys-motion-easing-standard)] px-4 py-2 file:border-0 file:bg-transparent placeholder:text-[var(--md-sys-color-on-surface-variant)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30',
	{
		variants: {
			variant: {
				filled: 'rounded-t-[var(--md-sys-shape-corner-xs)] rounded-b-none border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-highest)] focus-visible:border-b-2 focus-visible:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)]',
				outlined:
					'rounded-[var(--md-sys-shape-corner-sm)] bg-transparent border border-[var(--md-sys-color-outline)] focus-visible:border-2 focus-visible:border-[var(--md-sys-color-primary)]',
			},
		},
		defaultVariants: {
			variant: 'filled',
		},
	},
);

export interface TextFieldProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof textFieldVariants> {}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
	({ className, variant, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(textFieldVariants({ variant }), className)}
				ref={ref}
				{...props}
			/>
		);
	},
);
TextField.displayName = 'TextField';

export { TextField };
