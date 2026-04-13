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
				return 'bg-[#059669] text-white border-transparent md-elevation-1 hover:md-elevation-2 shadow-[#059669]/30'; // MD3 Green Solid
			case '✕':
				return 'bg-[#DC2626] text-white border-transparent md-elevation-1 hover:md-elevation-2 shadow-[#DC2626]/30'; // MD3 Red Solid
			case '?':
				return 'bg-[#D97706] text-white border-transparent md-elevation-1 hover:md-elevation-2 shadow-[#D97706]/30'; // Warning Amber
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
