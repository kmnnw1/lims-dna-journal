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
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-teal-500/20 rounded-2xl text-teal-400">
						<FlaskConical className="w-6 h-6" />
					</div>
					<div>
						<p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Всего проб</p>
						<p className="text-3xl font-bold text-slate-100 tabular-nums">{total}</p>
					</div>
				</div>
			</div>

			<div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
						<CheckCircle className="w-6 h-6" />
					</div>
					<div>
						<p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Успешные ITS</p>
						<p className="text-3xl font-bold text-slate-100 tabular-nums">{successful}</p>
					</div>
				</div>
			</div>

			<div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
				<div className="flex items-center gap-4">
					<div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400">
						<AlertTriangle className="w-6 h-6" />
					</div>
					<div>
						<p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Остальные</p>
						<p className="text-3xl font-bold text-slate-100 tabular-nums">{others}</p>
					</div>
				</div>
			</div>
		</div>
	);
};
