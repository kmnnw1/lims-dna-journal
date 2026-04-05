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
			case '✓': return 'bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30';
			case '✕': return 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30';
			case '?': return 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30';
			default: return 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700';
		}
	};

	return (
		<button
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			className={`px-2 py-0.5 rounded border text-[10px] font-medium transition-all duration-200 ${getStatusStyle(status)}`}
		>
			{marker} {status || '?'}
		</button>
	);
};
