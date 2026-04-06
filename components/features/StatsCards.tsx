'use client';

import React from 'react';
import { FlaskConical, CheckCircle, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
	total: number;
	successful: number;
	others: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ total, successful, others }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
			{/* MD3 Tonal Card: Primary */}
			<div className="bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] p-6 rounded-[2rem] shadow-sm transition-transform hover:scale-[1.02]">
				<div className="flex items-center gap-5">
					<div className="p-4 bg-[var(--md-sys-color-on-primary-container)]/10 rounded-full text-[var(--md-sys-color-primary)]">
						<FlaskConical className="w-8 h-8" strokeWidth={1.5} />
					</div>
					<div>
						<p className="text-sm font-medium tracking-wide uppercase opacity-80 mb-1">Всего проб</p>
						<p className="text-4xl font-normal tabular-nums tracking-tight">{total}</p>
					</div>
				</div>
			</div>

			{/* MD3 Tonal Card: Success (Custom MD3 Green) */}
			<div className="bg-[#e8f5e9] dark:bg-[#1b5e20]/40 text-[#1b5e20] dark:text-[#a5d6a7] p-6 rounded-[2rem] shadow-sm transition-transform hover:scale-[1.02]">
				<div className="flex items-center gap-5">
					<div className="p-4 bg-[#4caf50]/20 rounded-full text-[#2e7d32] dark:text-[#81c784]">
						<CheckCircle className="w-8 h-8" strokeWidth={1.5} />
					</div>
					<div>
						<p className="text-sm font-medium tracking-wide uppercase opacity-80 mb-1">Успешные ITS</p>
						<p className="text-4xl font-normal tabular-nums tracking-tight">{successful}</p>
					</div>
				</div>
			</div>

			{/* MD3 Tonal Card: Error Container */}
			<div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-6 rounded-[2rem] shadow-sm transition-transform hover:scale-[1.02]">
				<div className="flex items-center gap-5">
					<div className="p-4 bg-[var(--md-sys-color-error)]/10 rounded-full text-[var(--md-sys-color-error)]">
						<AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
					</div>
					<div>
						<p className="text-sm font-medium tracking-wide uppercase opacity-80 mb-1">Остальные</p>
						<p className="text-4xl font-normal tabular-nums tracking-tight">{others}</p>
					</div>
				</div>
			</div>
		</div>
	);
};
