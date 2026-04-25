'use client';

import { Clock, FlaskConical } from 'lucide-react';
import React from 'react';

interface StatsCardsProps {
	total: number;
	successful: number;
	others: number;
	activeFilter?: 'all' | 'success' | 'error' | 'fav';
	onFilterSelect?: (filter: 'all' | 'success' | 'error' | 'fav') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
	total,
	successful,
	others,
	activeFilter = 'all',
	onFilterSelect,
}) => {
	const pct = total > 0 ? Math.round((successful / total) * 100) : 0;
	const circumference = 2 * Math.PI * 18;
	const strokeDashoffset = circumference - (pct / 100) * circumference;

	return (
		<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
			{/* Всего проб */}
			<div
				onClick={() => onFilterSelect?.('all')}
				className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${
					activeFilter === 'all'
						? 'bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) ring-2 ring-(--md-sys-color-secondary)'
						: 'bg-(--md-sys-color-secondary-container)/40 text-(--md-sys-color-on-secondary-container) hover:bg-(--md-sys-color-secondary-container)/60'
				}`}
			>
				<FlaskConical className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" strokeWidth={2} />
				<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60">
					Всего
				</span>
				<span className="text-sm sm:text-base font-bold tabular-nums tracking-tight">
					{total}
				</span>
			</div>

			{/* Успешные ITS */}
			<div
				onClick={() => onFilterSelect?.('success')}
				className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all group shrink-0 cursor-pointer ${
					activeFilter === 'success'
						? 'bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) ring-2 ring-(--md-sys-color-tertiary)'
						: 'bg-(--md-sys-color-tertiary-container)/40 text-(--md-sys-color-on-tertiary-container) hover:bg-(--md-sys-color-tertiary-container)/60'
				}`}
			>
				<div className="relative w-5 h-5 sm:w-6 sm:h-6">
					<svg className="w-5 h-5 sm:w-6 sm:h-6 -rotate-90" viewBox="0 0 40 40">
						<circle
							cx="20"
							cy="20"
							r="18"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							opacity="0.1"
						/>
						<circle
							cx="20"
							cy="20"
							r="18"
							fill="none"
							stroke="currentColor"
							strokeWidth="4"
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							className="transition-all duration-700 ease-(--md-sys-motion-easing-emphasized)"
						/>
					</svg>
					<span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[7px] font-bold">
						{pct}%
					</span>
				</div>
				<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60">
					ITS ✓
				</span>
				<span className="text-sm sm:text-base font-bold tabular-nums tracking-tight">
					{successful}
				</span>
			</div>

			{/* Остальные */}
			<div
				onClick={() => onFilterSelect?.('error')}
				className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${
					activeFilter === 'error'
						? 'bg-(--md-sys-color-error-container)/40 text-(--md-sys-color-on-error-container) ring-2 ring-(--md-sys-color-error)'
						: 'border border-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-high)'
				}`}
			>
				<Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" strokeWidth={2} />
				<span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60">
					Прочее
				</span>
				<span className="text-sm sm:text-base font-bold tabular-nums tracking-tight">
					{others}
				</span>
			</div>
		</div>
	);
};
