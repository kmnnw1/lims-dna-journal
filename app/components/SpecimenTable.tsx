'use client';

import React from 'react';
import { Pencil, FlaskConical, ChevronUp, ChevronDown } from 'lucide-react';
import { PCRStatusBadge } from './PCRStatusBadge';

interface SpecimenTableProps {
	specimens: any[];
	loading: boolean;
	selectedIds: Set<string>;
	onSelect: (id: string) => void;
	onSelectAll: (ids: string[]) => void;
	onEdit: (specimen: any) => void;
	onPcr: (specimen: any) => void;
	onStatusClick: (specimenId: string, marker: string) => void;
	searchQuery: string;
	sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
	onSort: (key: string) => void;
}

export const SpecimenTable: React.FC<SpecimenTableProps> = ({
	specimens,
	loading,
	selectedIds,
	onSelect,
	onSelectAll,
	onEdit,
	onPcr,
	onStatusClick,
	searchQuery,
	sortConfig,
	onSort
}) => {
	
	// Хелпер для подсветки поиска
	const highlightText = (text: string | null | undefined, query: string) => {
		if (!text || !query.trim()) return text;
		const parts = String(text).split(new RegExp(`(${query})`, 'gi'));
		return parts.map((part, i) => 
			part.toLowerCase() === query.toLowerCase() 
				? <mark key={i} className="bg-teal-500/40 text-slate-100 rounded-sm px-0.5">{part}</mark> 
				: part
		);
	};

	const renderSortIcon = (key: string) => {
		if (sortConfig?.key !== key) return null;
		return sortConfig.direction === 'asc' 
			? <ChevronUp className="w-3 h-3 inline ml-1" /> 
			: <ChevronDown className="w-3 h-3 inline ml-1" />;
	};

	if (loading && specimens.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/50">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mb-4"></div>
				<p className="text-slate-400 font-medium">Загрузка данных...</p>
			</div>
		);
	}

	return (
		<div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
			<div className="overflow-x-auto custom-scrollbar">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="border-b border-slate-700/50 bg-slate-800/60">
							<th className="p-4 w-12 text-center">
								<input
									type="checkbox"
									onChange={() => onSelectAll(specimens.map(s => s.id))}
									checked={specimens.length > 0 && selectedIds.size === specimens.length}
									className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500/30"
									title="Выбрать все"
								/>
							</th>
							<th 
								className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-teal-400 transition-colors"
								onClick={() => onSort('id')}
							>
								ID {renderSortIcon('id')}
							</th>
							<th 
								className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-teal-400 transition-colors"
								onClick={() => onSort('taxon')}
							>
								Таксон {renderSortIcon('taxon')}
							</th>
							<th className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Заметки</th>
							<th className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Выделение</th>
							<th className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Маркеры</th>
							<th className="p-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Действия</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-700/30">
						{specimens.map((specimen) => (
							<tr 
								key={specimen.id} 
								className={`hover:bg-slate-700/30 transition-colors group ${selectedIds.has(specimen.id) ? 'bg-teal-500/5' : ''}`}
							>
								<td className="p-4 text-center">
									<input
										type="checkbox"
										checked={selectedIds.has(specimen.id)}
										onChange={() => onSelect(specimen.id)}
										className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500/30"
									/>
								</td>
								<td className="p-4 font-mono text-xs text-teal-400 font-semibold">
									{highlightText(specimen.id, searchQuery)}
								</td>
								<td className="p-4">
									<div className="flex flex-col">
										<span className="text-slate-100 font-medium text-sm">
											{highlightText(specimen.taxon, searchQuery)}
										</span>
										<span className="text-slate-500 text-[10px] italic">{specimen.locality}</span>
									</div>
								</td>
								<td className="p-4">
									<p className="text-slate-400 text-xs line-clamp-2 max-w-xs">{specimen.notes || specimen.collectNotes || '—'}</p>
								</td>
								<td className="p-4">
									<div className="flex flex-col gap-1">
										<span className="text-slate-300 text-[11px] truncate w-24 block" title={specimen.extrLab || 'Не указана'}>
											{specimen.extrLab || '—'}
										</span>
										<span className="text-slate-500 text-[10px]">{specimen.extrOperator || 'Не указан'}</span>
									</div>
								</td>
								<td className="p-4">
									<div className="flex flex-wrap gap-1.5 max-w-[180px]">
										<PCRStatusBadge status={specimen.itsStatus} marker="ITS" onClick={() => onStatusClick(specimen.id, 'ITS')} />
										<PCRStatusBadge status={specimen.ssuStatus} marker="SSU" onClick={() => onStatusClick(specimen.id, 'SSU')} />
										<PCRStatusBadge status={specimen.lsuStatus} marker="LSU" onClick={() => onStatusClick(specimen.id, 'LSU')} />
									</div>
								</td>
								<td className="p-4 text-right">
									<div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button 
											onClick={() => onEdit(specimen)}
											className="p-2 hover:bg-slate-600 rounded-xl text-slate-300 hover:text-teal-400 transition-all"
											title="Изменить"
										>
											{/* Replace PencilIcon with Lucide's Pencil */}
											<Pencil className="w-4 h-4" />
										</button>
										<button 
											onClick={() => onPcr(specimen)}
											className="p-2 hover:bg-slate-600 rounded-xl text-slate-300 hover:text-teal-400 transition-all"
											title="ПЦР"
										>
											{/* Replaced BeakerIcon with Lucide's FlaskConical */}
											<FlaskConical className="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{specimens.length === 0 && !loading && (
				<div className="p-12 text-center text-slate-500">
					Пробы не найдены
				</div>
			)}
		</div>
	);
};
