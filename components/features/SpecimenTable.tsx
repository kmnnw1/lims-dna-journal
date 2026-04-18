'use client';

import { ChevronDown, ChevronUp, FlaskConical, History, Pencil } from 'lucide-react';
import React from 'react';
import type { Specimen } from '@/types';
import { PCRStatusBadge } from './PCRStatusBadge';

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
	onHistory: (specimen: Specimen) => void;
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
	onHistory,
}) => {
	// Хелпер для подсветки поиска (MD3 Tertiary Container Style)
	const highlightText = (
		text: string | number | null | undefined | { result: string | number },
		query: string,
	): React.ReactNode => {
		if (!text || !query.trim()) {
			if (typeof text === 'object' && text !== null && 'result' in text) {
				return text.result;
			}
			return (text as React.ReactNode) ?? null;
		}

		// Handle Excel formula objects
		const displayValue =
			typeof text === 'object' && text !== null && 'result' in text
				? String(text.result)
				: String(text);

		const parts = displayValue.split(new RegExp(`(${query})`, 'gi'));
		return parts.map((part, i) =>
			part.toLowerCase() === query.toLowerCase() ? (
				<mark
					key={i}
					className="bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container) rounded px-0.5 font-bold"
				>
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
			<ChevronUp className="w-4 h-4 inline ml-1 text-(--md-sys-color-primary)" />
		) : (
			<ChevronDown className="w-4 h-4 inline ml-1 text-(--md-sys-color-primary)" />
		);
	};

	const hasAnyNotes = specimens.some((s) => s.notes || s.collectNotes);
	const hideActions = selectedIds.size > 1;

	if (loading && specimens.length === 0) {
		return (
			<div className="bg-(--md-sys-color-surface-container-lowest) rounded-4xl overflow-hidden shadow-sm p-4 space-y-4">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="flex gap-4 p-4 items-center bg-(--md-sys-color-surface) rounded-2xl animate-pulse"
					>
						<div className="h-5 w-5 rounded bg-(--md-sys-color-surface-container-highest)" />
						<div className="h-6 w-20 rounded-full bg-(--md-sys-color-surface-container-highest)" />
						<div className="flex-1 space-y-2">
							<div className="h-5 w-1/3 rounded bg-(--md-sys-color-surface-container-highest)" />
							<div className="h-4 w-1/4 rounded bg-(--md-sys-color-surface-container-highest)" />
						</div>
						<div className="flex gap-2">
							<div className="h-8 w-12 rounded-xl bg-(--md-sys-color-surface-container-highest)" />
							<div className="h-8 w-12 rounded-xl bg-(--md-sys-color-surface-container-highest)" />
							<div className="h-8 w-12 rounded-xl bg-(--md-sys-color-surface-container-highest)" />
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="rounded-4xl overflow-hidden border border-(--md-sys-color-outline-variant)/30 bg-(--md-sys-color-surface-container-lowest) shadow-sm transition-all duration-300">
			<div className="overflow-x-auto custom-scrollbar max-h-[75vh]">
				<table className="w-full min-w-[1000px] text-left border-separate border-spacing-0 relative text-sm">
					<thead className="sticky top-0 z-40 bg-(--md-sys-color-surface) backdrop-blur-xl shadow-sm">
						<tr>
							<th className="sticky left-0 z-50 bg-(--md-sys-color-surface) px-3 py-3 w-12 text-center border-b border-b-(--md-sys-color-outline-variant)/50 border-r border-r-(--md-sys-color-outline-variant)/10">
								<div className="relative flex items-center justify-center">
									<input
										type="checkbox"
										onChange={() => onSelectAll(specimens.map((s) => s.id))}
										checked={
											specimens.length > 0 &&
											selectedIds.size === specimens.length
										}
										className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-(--md-sys-color-outline) checked:border-(--md-sys-color-primary) checked:bg-(--md-sys-color-primary) transition-all hover:scale-110"
										title="Выбрать все"
									/>
									<svg
										className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="4"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								</div>
							</th>
							<th
								className="sticky left-12 z-50 bg-(--md-sys-color-surface) px-3 py-3 w-24 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase cursor-pointer hover:bg-(--md-sys-color-surface-container-high) transition-colors select-none whitespace-nowrap border-b border-b-(--md-sys-color-outline-variant)/50 border-r border-r-(--md-sys-color-outline-variant)/30"
								onClick={() => onSort('id')}
							>
								ID {renderSortIcon('id')}
							</th>
							<th
								className="px-4 py-3 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase cursor-pointer hover:bg-(--md-sys-color-surface-container-high) transition-colors select-none whitespace-nowrap border-b border-(--md-sys-color-outline-variant)/50"
								onClick={() => onSort('taxon')}
							>
								Таксон {renderSortIcon('taxon')}
							</th>
							{hasAnyNotes && (
								<th
									className="px-4 py-3 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase cursor-pointer hover:bg-(--md-sys-color-surface-container-high) transition-colors select-none whitespace-nowrap border-b border-(--md-sys-color-outline-variant)/50"
									onClick={() => onSort('notes')}
								>
									Заметки {renderSortIcon('notes')}
								</th>
							)}
							<th
								className="px-4 py-3 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase cursor-pointer hover:bg-(--md-sys-color-surface-container-high) transition-colors select-none whitespace-nowrap border-b border-(--md-sys-color-outline-variant)/50"
								onClick={() => onSort('extrLab')}
							>
								Выделение {renderSortIcon('extrLab')}
							</th>
							<th className="px-4 py-3 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase whitespace-nowrap border-b border-(--md-sys-color-outline-variant)/50">
								Маркеры
							</th>
							<th className="px-4 py-3 w-24 text-(--md-sys-color-on-surface) font-bold tracking-widest uppercase whitespace-nowrap text-right border-b border-(--md-sys-color-outline-variant)/50">
								{/* Действия скрыты как заголовок */}
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-(--md-sys-color-outline-variant)/20">
						{specimens.map((specimen) => {
							const isSelected = selectedIds.has(specimen.id);
							// Динамический фон для липких колонок. Если строка выбрана - заливаем акцентом, иначе поверхностью
							const stickyBgClass = isSelected
								? 'bg-(--md-sys-color-primary-container)'
								: 'bg-(--md-sys-color-surface) group-hover:bg-(--md-sys-color-surface-container-lowest)';

							return (
								<tr
									key={specimen.id}
									className={`group transition-colors duration-150 ${isSelected ? 'bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)' : 'hover:bg-(--md-sys-color-surface-container-lowest) bg-(--md-sys-color-surface) text-(--md-sys-color-on-surface)'}`}
								>
									<td
										className={`sticky left-0 z-30 ${stickyBgClass} px-3 py-2 w-12 text-center border-b border-b-(--md-sys-color-outline-variant)/20 border-r border-r-(--md-sys-color-outline-variant)/10`}
									>
										<div className="relative flex items-center justify-center">
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => onSelect(specimen.id)}
												className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-(--md-sys-color-outline) checked:border-(--md-sys-color-primary) checked:bg-(--md-sys-color-primary) transition-all"
											/>
											<svg
												className="pointer-events-none absolute h-3.5 w-3.5 text-(--md-sys-color-on-primary) opacity-0 peer-checked:opacity-100 transition-opacity"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="3"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<polyline points="20 6 9 17 4 12"></polyline>
											</svg>
										</div>
									</td>
									<td
										className={`sticky left-12 z-30 ${stickyBgClass} px-3 py-2 w-24 border-b border-b-(--md-sys-color-outline-variant)/20 border-r border-r-(--md-sys-color-outline-variant)/30 font-mono text-sm text-(--md-sys-color-primary) font-medium tracking-tight whitespace-nowrap`}
									>
										{highlightText(specimen.id, searchQuery)}
									</td>
									<td className="px-4 py-2 border-b border-(--md-sys-color-outline-variant)/20">
										<div className="flex flex-col gap-0.5 min-w-[180px]">
											<span className="text-(--md-sys-color-on-surface) font-medium text-base leading-snug">
												{highlightText(specimen.taxon, searchQuery)}
											</span>
											{specimen.locality && (
												<span className="text-(--md-sys-color-outline) text-xs line-clamp-1">
													{specimen.locality}
												</span>
											)}
										</div>
									</td>
									{hasAnyNotes && (
										<td className="px-4 py-2 border-b border-(--md-sys-color-outline-variant)/20">
											<p className="text-(--md-sys-color-on-surface) opacity-80 text-sm line-clamp-2 max-w-[200px]">
												{specimen.notes || specimen.collectNotes || '—'}
											</p>
										</td>
									)}
									<td className="px-4 py-2 border-b border-(--md-sys-color-outline-variant)/20">
										<div className="flex flex-col gap-0">
											<span
												className="text-(--md-sys-color-on-surface) text-sm font-medium truncate max-w-[120px] block"
												title={specimen.extrLab || 'Не указана'}
											>
												{specimen.extrLab || '—'}
											</span>
											<span className="text-(--md-sys-color-outline) text-[11px]">
												{specimen.extrOperator || 'Не указан'}
											</span>
										</div>
									</td>
									<td className="px-4 py-2 border-b border-(--md-sys-color-outline-variant)/20">
										<div className="flex flex-wrap gap-1 w-[220px]">
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
									<td className="px-4 py-2 text-right border-b border-(--md-sys-color-outline-variant)/20">
										{!hideActions && (
											<div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => onEdit(specimen)}
													className="p-2 rounded-full hover:bg-(--md-sys-color-surface-container-highest) text-(--md-sys-color-outline) hover:text-(--md-sys-color-primary) transition-all active:scale-95"
													title="Изменить"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => onPcr(specimen)}
													className="p-2 rounded-full hover:bg-(--md-sys-color-surface-container-highest) text-(--md-sys-color-outline) hover:text-(--md-sys-color-primary) transition-all active:scale-95"
													title="ПЦР"
												>
													<FlaskConical className="w-4 h-4" />
												</button>
												<button
													onClick={() => onHistory(specimen)}
													className="p-2 rounded-full hover:bg-(--md-sys-color-surface-container-highest) text-(--md-sys-color-outline) hover:text-(--md-sys-color-primary) transition-all active:scale-95"
													title="История изменений"
												>
													<History className="w-4 h-4" />
												</button>
											</div>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{specimens.length === 0 && !loading && (
				<div className="p-16 text-center text-(--md-sys-color-outline) text-lg">
					Пробы не найдены
				</div>
			)}
		</div>
	);
};
