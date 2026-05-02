'use client';

import { Check, Info, X } from 'lucide-react';
import React, { useState } from 'react';

/**
 * Поля БД, доступные для маппинга.
 */
const DB_FIELDS = [
	{ key: 'isolate', label: 'ID пробы (Isolate)*', required: true },
	{ key: 'taxon', label: 'Таксон (Taxon)' },
	{ key: 'locality', label: 'Место сбора (Locality)' },
	{ key: 'collector', label: 'Коллектор (Collector)' },
	{ key: 'collectionNumber', label: 'Номер сбора (Coll. No.)' },
	{ key: 'accessionNumber', label: 'Номер доступа (Acc. No.)' },
	{ key: 'herbarium', label: 'Гербарий (Herbarium)' },
	{ key: 'labNo', label: 'Лаб. номер (Lab No)' },
	{ key: 'connections', label: 'Связи (Connections)' },
	{ key: 'extrDate', label: 'Дата выделения' },
	{ key: 'labor', label: 'Лаборатория' },
	{ key: 'method', label: 'Метод выделения' },
	{ key: 'its', label: 'ITS статус' },
	{ key: 'itsGb', label: 'ITS GenBank' },
	{ key: 'ssu', label: 'SSU статус' },
	{ key: 'ssuGb', label: 'SSU GenBank' },
	{ key: 'mtlsu', label: 'LSU статус' },
	{ key: 'mtlsuGb', label: 'LSU GenBank' },
	{ key: 'rpb2', label: 'RPB2 статус' },
	{ key: 'rpb2Gb', label: 'RPB2 GenBank' },
	{ key: 'mcm7', label: 'MCM7 статус' },
	{ key: 'mcm7Gb', label: 'MCM7 GenBank' },
	{ key: 'comment', label: 'Комментарий' },
];

interface Props {
	isOpen: boolean;
	onClose: () => void;
	headers: string[];
	sampleRows: any[][];
	suggestedMapping: Record<string, string>;
	onConfirm: (mapping: Record<string, string>) => void;
	isImporting: boolean;
}

export function ImportMapperModal({
	isOpen,
	onClose,
	headers,
	sampleRows,
	suggestedMapping,
	onConfirm,
	isImporting,
}: Props) {
	const [mapping, setMapping] = useState<Record<string, string>>(suggestedMapping);

	if (!isOpen) return null;

	const handleFieldChange = (header: string, dbKey: string) => {
		setMapping((prev) => ({
			...prev,
			[header]: dbKey,
		}));
	};

	const isValid = Object.values(mapping).includes('isolate');

	return (
		<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
			<div className="w-full max-w-4xl bg-(--md-sys-color-surface-container-low) rounded-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="p-6 border-b border-(--md-sys-color-outline-variant)/20 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-semibold text-(--md-sys-color-on-surface)">
							Настройка импорта
						</h2>
						<p className="text-sm text-(--md-sys-color-outline) mt-1">
							Сопоставьте колонки из вашего файла с полями базы данных
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 rounded-full hover:bg-(--md-sys-color-surface-container-high) transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
					<div className="bg-(--md-sys-color-secondary-container)/30 border border-(--md-sys-color-secondary-container) p-4 rounded-2xl flex gap-3 text-sm text-(--md-sys-color-on-secondary-container)">
						<Info className="w-5 h-5 shrink-0" />
						<p>
							Мы автоматически распознали большинство колонок. Пожалуйста, проверьте
							правильность и выберите недостающие. Поле <b>ID пробы</b> обязательно.
						</p>
					</div>

					<div className="space-y-4">
						<div className="grid grid-cols-[1fr,1.5fr,1fr] gap-4 px-4 py-2 text-xs font-bold text-(--md-sys-color-outline) uppercase tracking-wider">
							<div>Колонка в Excel</div>
							<div>Пример данных</div>
							<div>Поле в БД</div>
						</div>

						<div className="space-y-2">
							{headers.map((header, hIdx) => (
								<div
									key={header}
									className="grid grid-cols-[1fr,1.5fr,1fr] gap-4 items-center p-4 bg-(--md-sys-color-surface-container) rounded-2xl border border-transparent hover:border-(--md-sys-color-outline-variant)/30 transition-all"
								>
									<div className="font-medium text-sm text-(--md-sys-color-on-surface) truncate">
										{header}
									</div>
									<div className="flex gap-2 overflow-hidden">
										{sampleRows.slice(0, 3).map((row, rIdx) => (
											<span
												key={rIdx}
												className="px-2 py-1 bg-(--md-sys-color-surface-container-high) rounded-lg text-[10px] text-(--md-sys-color-outline) truncate max-w-[80px]"
											>
												{String(row[hIdx] || '')}
											</span>
										))}
									</div>
									<select
										value={mapping[header] || ''}
										onChange={(e) => handleFieldChange(header, e.target.value)}
										className="w-full h-10 px-3 bg-(--md-sys-color-surface-container-lowest) border border-(--md-sys-color-outline-variant) rounded-xl text-sm focus:ring-2 focus:ring-(--md-sys-color-primary) outline-none transition-all cursor-pointer"
									>
										<option value="">-- Пропустить --</option>
										{DB_FIELDS.map((f) => (
											<option key={f.key} value={f.key}>
												{f.label}
											</option>
										))}
									</select>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="p-6 border-t border-(--md-sys-color-outline-variant)/20 flex items-center justify-between bg-(--md-sys-color-surface-container)">
					<div className="flex items-center gap-2">
						{!isValid && (
							<p className="text-xs text-(--md-sys-color-error) font-medium">
								Выберите колонку для ID пробы
							</p>
						)}
					</div>
					<div className="flex gap-3">
						<button
							onClick={onClose}
							disabled={isImporting}
							className="px-6 py-2.5 rounded-full text-sm font-medium text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-surface-container-high) transition-all"
						>
							Отмена
						</button>
						<button
							onClick={() => onConfirm(mapping)}
							disabled={!isValid || isImporting}
							className="px-8 py-2.5 rounded-full text-sm font-medium bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) shadow-md hover:md-elevation-3 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
						>
							{isImporting ? (
								<>
									<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
									Импорт...
								</>
							) : (
								<>
									<Check className="w-4 h-4" />
									Начать импорт
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
