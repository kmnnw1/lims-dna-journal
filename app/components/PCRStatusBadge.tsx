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
				// Успех (MD3 Custom Success)
				return 'bg-[#4caf50]/15 text-[#2e7d32] dark:bg-[#81c784]/20 dark:text-[#a5d6a7] hover:bg-[#4caf50]/25';
			case '✕': 
				// Ошибка (MD3 Error Container)
				return 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:brightness-95 dark:hover:brightness-110';
			case '?': 
				// В процессе / Сомнение (MD3 Custom Warning)
				return 'bg-[#ffeb3b]/20 text-[#f57f17] dark:bg-[#fbc02d]/20 dark:text-[#fff59d] hover:bg-[#ffeb3b]/30';
			default: 
				// Нет данных (MD3 Surface Container Highest)
				return 'bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]';
		}
	};

	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-200 active:scale-95 ${getStatusStyle(status)}`}
		>
			{marker} {status || '?'}
		</button>
	);
};
