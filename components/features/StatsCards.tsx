'use client';

import { Clock, FlaskConical } from 'lucide-react';
import React from 'react';

interface StatsCardsProps {
	total: number;
	successful: number;
	others: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ total, successful, others }) => {
	const pct = total > 0 ? Math.round((successful / total) * 100) : 0;
	const circumference = 2 * Math.PI * 18;
	const strokeDashoffset = circumference - (pct / 100) * circumference;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{/* Всего проб */}
			<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] transition-all hover:bg-[var(--md-sys-color-secondary-container-highest)]">
				<FlaskConical className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
				<span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
					Всего
				</span>
				<span className="text-base font-bold tabular-nums tracking-tight">{total}</span>
			</div>

			{/* Успешные ITS */}
			<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] transition-all group">
				<div className="relative w-6 h-6">
					<svg className="w-6 h-6 -rotate-90" viewBox="0 0 40 40">
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
							className="transition-all duration-700 ease-[var(--md-sys-motion-easing-emphasized)]"
						/>
					</svg>
					<span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">
						{pct}%
					</span>
				</div>
				<span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
					ITS ✓
				</span>
				<span className="text-base font-bold tabular-nums tracking-tight">
					{successful}
				</span>
			</div>

			{/* Остальные */}
			<div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] transition-all hover:bg-[var(--md-sys-color-surface-container-high)]">
				<Clock className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
				<span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
					Прочее
				</span>
				<span className="text-base font-bold tabular-nums tracking-tight">{others}</span>
			</div>
		</div>
	);
};
