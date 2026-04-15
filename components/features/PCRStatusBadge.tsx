'use client';

import React from 'react';

interface PCRStatusBadgeProps {
	status: string | null | undefined;
	marker: string;
	onClick: () => void;
}

export const PCRStatusBadge: React.FC<PCRStatusBadgeProps> = ({ status, marker, onClick }) => {
	const getStatusStyle = (s: string | null | undefined) => {
		switch (s) {
			case '✓':
				return 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm';
			case '✕':
				return 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] shadow-sm';
			case '?':
				return 'bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)] shadow-sm';
			default:
				return 'bg-transparent border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)] border-dashed';
		}
	};

	return (
		<button
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onClick();
			}}
            title={`Статус: ${status || 'Нет данных'}`}
			className={`inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[9px] font-black tracking-widest transition-all duration-300 active:scale-90 ${getStatusStyle(status)}`}>
			{marker}
		</button>
	);
};
