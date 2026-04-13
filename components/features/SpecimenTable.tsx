'use client';

import React from 'react';
import { Pencil, FlaskConical, ChevronUp, ChevronDown } from 'lucide-react';
import { PCRStatusBadge } from './PCRStatusBadge';
import type { Specimen } from '@/types';

interface SpecimenTableProps {
	specimens: Specimen[];
	loading: boolean;
	selectedIds: Set<string>;
	onSelect: (id: string) => void;
	onSelectAll: (ids: string[]) => void;
	onEdit: (specimen: Specimen) => void;
	onPcr: (specimen: Specimen) => void;
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
	onSort,
}) => {
	// Хелпер для подсветки поиска (MD3 Tertiary Container Style)
	const highlightText = (text: string | null | undefined, query: string) => {
		if (!text || !query.trim()) return text;
		const parts = String(text).split(new RegExp(`(${query})`, 'gi'));
		return parts.map((part, i) =>
			part.toLowerCase() === query.toLowerCase() ? (
				<mark
					key={i}
					className="bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded px-0.5 font-bold">
					{part}
				</mark>
			) : (
				part
			),
		);
	};

	const renderSortIcon = (key: string) => {
		if (sortConfig?.key !== key) return null;
		return sortConfig.direction === 'asc' ? (
			<ChevronUp className="w-4 h-4 inline ml-1 text-[var(--md-sys-color-primary)]" />
		) : (
			<ChevronDown className="w-4 h-4 inline ml-1 text-[var(--md-sys-color-primary)]" />
		);
	};

	if (loading && specimens.length === 0) {
		return (
			<div className="bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] overflow-hidden shadow-sm p-4 space-y-4">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="flex gap-4 p-4 items-center bg-[var(--md-sys-color-surface)] rounded-2xl animate-pulse">
						<div className="h-5 w-5 rounded bg-[var(--md-sys-color-surface-container-highest)]" />
						<div className="h-6 w-20 rounded-full bg-[var(--md-sys-color-surface-container-highest)]" />
						<div className="flex-1 space-y-2">
							<div className="h-5 w-1/3 rounded bg-[var(--md-sys-color-surface-container-highest)]" />
							<div className="h-4 w-1/4 rounded bg-[var(--md-sys-color-surface-container-highest)]" />
						</div>
						<div className="flex gap-2">
							<div className="h-8 w-12 rounded-xl bg-[var(--md-sys-color-surface-container-highest)]" />
							<div className="h-8 w-12 rounded-xl bg-[var(--md-sys-color-surface-container-highest)]" />
							<div className="h-8 w-12 rounded-xl bg-[var(--md-sys-color-surface-container-highest)]" />
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="rounded-[2.5rem] overflow-hidden border border-[var(--md-sys-color-outline-variant)]/50 bg-[var(--md-sys-color-surface-container-lowest)] md-elevation-1 transition-all duration-300">
			<div className="overflow-x-auto custom-scrollbar max-h-[75vh]">
				<table className="w-full text-left border-collapse relative">
					<thead className="sticky top-0 z-20 bg-[var(--md-sys-color-surface)]/80 backdrop-blur-xl md-elevation-1">
	<tr className="border-b border-[var(--md-sys-color-outline-variant)]/50">
		<th className="p-6 w-16 text-center">
			<div className="relative flex items-center justify-center">
				<input
					type="checkbox"
					onChange={() => onSelectAll(specimens.map((s) => s.id))}
					checked={
						specimens.length > 0 &&
						selectedIds.size === specimens.length
					}
					className="peer size-5 cursor-pointer appearance-none rounded-[4px] border-2 border-[var(--md-sys-color-outline)] checked:border-[var(--md-sys-color-primary)] checked:bg-[var(--md-sys-color-primary)] transition-all hover:scale-110"
					title="Выбрать все"
				/>
				<svg
					className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="4"
					strokeLinecap="round"
					strokeLinejoin="round">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			</div>
		</th>
		<th
			className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors select-none whitespace-nowrap"
			onClick={() => onSort('id')}>
			ID {renderSortIcon('id')}
		</th>
		<th
			className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase cursor-pointer hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors select-none min-w-[180px]"
			onClick={() => onSort('taxon')}>
			Таксон {renderSortIcon('taxon')}
		</th>
		<th className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase">
			Заметки
		</th>
		<th className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase">
			Выделение
		</th>
		<th className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase">
			Маркеры
		</th>
		<th className="p-6 text-[var(--md-sys-color-on-surface)] font-bold text-xs tracking-widest uppercase text-right">
			Действия
		</th>
	</tr>
</thead>
					<tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]/20">
						{specimens.map((specimen) => {
							const isSelected = selectedIds.has(specimen.id);
							return (
								<tr
									key={specimen.id}
									className={`group md-state-layer transition-all duration-[var(--md-sys-motion-duration-medium)] ease-[var(--md-sys-motion-easing-standard)] ${isSelected ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : 'relative z-10 hover:z-20 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]'}`}>
									<td className="p-4 text-center">
										<div className="relative flex items-center justify-center">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => onSelect(specimen.id)}
												className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-[var(--md-sys-color-outline)] checked:border-[var(--md-sys-color-primary)] checked:bg-[var(--md-sys-color-primary)] transition-all"
											/>
											<svg
												className="pointer-events-none absolute h-3.5 w-3.5 text-[var(--md-sys-color-on-primary)] opacity-0 peer-checked:opacity-100 transition-opacity"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												strokeLinecap="round"
												strokeLinejoin="round">
												<polyline points="20 6 9 17 4 12"></polyline>
											</svg>
										</div>
									</td>
									<td className="p-4 font-mono text-sm text-[var(--md-sys-color-primary)] font-medium tracking-tight">
										{highlightText(specimen.id, searchQuery)}
									</td>
									<td className="p-4">
										<div className="flex flex-col gap-0.5">
											<span className="text-[var(--md-sys-color-on-surface)] font-medium text-base leading-snug">
												{highlightText(specimen.taxon, searchQuery)}
											</span>
											{specimen.locality && (
												<span className="text-[var(--md-sys-color-outline)] text-xs line-clamp-1">
													{specimen.locality}
												</span>
											)}
										</div>
									</td>
									<td className="p-4">
										<p className="text-[var(--md-sys-color-on-surface)] opacity-80 text-sm line-clamp-2 max-w-xs">
											{specimen.notes || specimen.collectNotes || '—'}
										</p>
									</td>
									<td className="p-4">
										<div className="flex flex-col gap-1">
											<span
												className="text-[var(--md-sys-color-on-surface)] text-sm font-medium truncate w-28 block"
												title={specimen.extrLab || 'Не указана'}>
												{specimen.extrLab || '—'}
											</span>
											<span className="text-[var(--md-sys-color-outline)] text-xs">
												{specimen.extrOperator || 'Не указан'}
											</span>
										</div>
									</td>
									<td className="p-4">
										<div className="inline-flex flex-wrap gap-1 max-w-[260px]">
											<PCRStatusBadge
												status={specimen.itsStatus}
												marker="ITS"
												onClick={() => onStatusClick(specimen.id, 'ITS')}
											/>
											<PCRStatusBadge
												status={specimen.ssuStatus}
												marker="SSU"
												onClick={() => onStatusClick(specimen.id, 'SSU')}
											/>
											<PCRStatusBadge
												status={specimen.lsuStatus}
												marker="LSU"
												onClick={() => onStatusClick(specimen.id, 'LSU')}
											/>
											<PCRStatusBadge
												status={specimen.rpb2Status}
												marker="RPB2"
												onClick={() => onStatusClick(specimen.id, 'RPB2')}
											/>
											<PCRStatusBadge
												status={specimen.mtLsuStatus}
												marker="mtLSU"
												onClick={() => onStatusClick(specimen.id, 'mtLSU')}
											/>
											<PCRStatusBadge
												status={specimen.mtSsuStatus}
												marker="mtSSU"
												onClick={() => onStatusClick(specimen.id, 'mtSSU')}
											/>
										</div>
									</td>
									<td className="p-4 text-right">
										<div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
											<button
												onClick={() => onEdit(specimen)}
												className="p-2.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] transition-all active:scale-95"
												title="Изменить">
												<Pencil className="w-5 h-5" />
											</button>
											<button
												onClick={() => onPcr(specimen)}
												className="p-2.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-primary)] transition-all active:scale-95"
												title="ПЦР">
												<FlaskConical className="w-5 h-5" />
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{specimens.length === 0 && !loading && (
				<div className="p-16 text-center text-[var(--md-sys-color-outline)] text-lg">
					Пробы не найдены
				</div>
			)}
		</div>
	);
};
