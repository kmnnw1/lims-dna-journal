'use client';

import { forwardRef } from 'react';

type MD3FieldProps = {
	label: string;
	value: string;
	isSelect?: boolean;
	isArea?: boolean;
	children?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const MD3Field = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, MD3FieldProps>(
	({ label, value, isSelect, isArea, children, className = '', ...props }, ref) => {
		const baseClass = `md-state-layer md-typescale-body-large w-full rounded-t-[var(--md-sys-shape-corner-xs)] rounded-b-none border-b border-[var(--md-sys-color-outline-variant)] focus:border-b-2 focus:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] bg-[var(--md-sys-color-surface-container-highest)] px-4 pt-6 pb-2 outline-none transition-all duration-[var(--md-sys-motion-duration-medium)] ease-[var(--md-sys-motion-easing-standard)] text-[var(--md-sys-color-on-surface)] appearance-none ${className}`;

		const inputRef = ref as React.LegacyRef<HTMLInputElement>;
		const selectRef = ref as React.LegacyRef<HTMLSelectElement>;
		const areaRef = ref as React.LegacyRef<HTMLTextAreaElement>;

		return (
			<div className="relative group w-full">
				{isSelect ? (
					<select ref={selectRef} value={value} className={baseClass} {...props}>
						{children}
					</select>
				) : isArea ? (
					<textarea
						ref={areaRef}
						value={value}
						className={`${baseClass} min-h-[100px] resize-y`}
						{...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
					/>
				) : (
					<input ref={inputRef} value={value} className={baseClass} {...props} />
				)}
				<label
					className={`absolute left-4 transition-all pointer-events-none text-[var(--md-sys-color-outline)] font-medium duration-[var(--md-sys-motion-duration-short)] ease-[var(--md-sys-motion-easing-standard)] ${
						value ? 'top-2 text-[10px] tracking-wider' : 'top-4 text-base'
					} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-2 group-focus-within:text-[10px] group-focus-within:tracking-wider`}>
					{label}
				</label>
				{isSelect && (
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--md-sys-color-outline)]">
						<svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
					</div>
				)}
			</div>
		);
	},
);

MD3Field.displayName = 'MD3Field';
