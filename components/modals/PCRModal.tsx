'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, History, FlaskConical } from 'lucide-react';
import type { Specimen, PcrAttempt } from '@/types';
import { MD3Field } from '@/components/ui/MD3Field';
import { Button } from '@/components/ui/Button';

interface Props {
	open: boolean;
	specimenId: string;
	activeSpecimen: Specimen | null;
	onClose: () => void;
	pcrForm: {
		volume: string;
		marker: string;
		forwardPrimer: string;
		reversePrimer: string;
		dnaMatrix: string;
		result: 'Success' | 'Failed';
	};
	setPcrForm: React.Dispatch<React.SetStateAction<{
		volume: string;
		marker: string;
		forwardPrimer: string;
		reversePrimer: string;
		dnaMatrix: string;
		result: 'Success' | 'Failed';
	}>>;
	onSubmit: () => void;
	isReader?: boolean;
}

export function PcrModal({
	open,
	specimenId,
	onClose,
	pcrForm,
	setPcrForm,
	onSubmit,
	isReader,
}: Props) {
	const [history, setHistory] = useState<PcrAttempt[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);

	useEffect(() => {
		if (open && specimenId) {
			setTimeout(() => setLoadingHistory(true), 0);
			fetch(`/api/pcr?specimenId=${specimenId}`)
				.then((res) => res.json())
				.then((data) => {
					setHistory(Array.isArray(data) ? data : []);
					setLoadingHistory(false);
				})
				.catch(() => {
					setHistory([]);
					setLoadingHistory(false);
				});
		}
	}, [open, specimenId]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
	role="dialog"
	aria-modal="true"
	className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	<div className="my-6 w-full max-w-2xl p-6 sm:p-8 relative bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
		
		{/* ===== ЗАГОЛОВОК ===== */}
		<div className="mb-6 flex items-center justify-between gap-4">
			<div>
				<h2 className="text-2xl sm:text-3xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
					Постановка ПЦР
				</h2>
				<p className="text-lg text-[var(--md-sys-color-primary)] font-mono mt-1 font-bold">
					{specimenId}
				</p>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center justify-center p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] active:scale-95 transition-all"
				aria-label="Закрыть">
				<X className="h-6 w-6" />
			</button>
		</div>

		{/* ===== ОСНОВНАЯ ЛОГИКА ===== */}
		<div className="space-y-6">
			
			{/* БЛОК 1: ИСТОРИЯ ПЦР */}
			<section className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
				<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)] flex items-center gap-2">
					<History className="w-5 h-5" /> История реакций
				</h3>
				
				{loadingHistory ? (
					<div className="text-center py-6 text-[var(--md-sys-color-outline)]">
						Загрузка истории...
					</div>
				) : history.length === 0 ? (
					<div className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-2xl text-center text-[var(--md-sys-color-outline)] border border-dashed border-[var(--md-sys-color-outline-variant)]">
						Для этой пробы еще не было постановок ПЦР
					</div>
				) : (
					<div className="space-y-3">
						{history.map((item, idx) => (
							<div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--md-sys-color-surface-container)] rounded-2xl gap-4">
								<div>
									<p className="font-bold text-lg">{item.marker}</p>
									<p className="text-sm opacity-70 mt-1">
										Праймеры: {item.forwardPrimer} / {item.reversePrimer}
									</p>
									<p className="text-xs opacity-50 mt-1">
										{new Date(item.date).toLocaleString()}
									</p>
								</div>
								<div className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap self-start sm:self-auto ${
									item.result === 'Success' 
										? 'bg-green-500/20 text-green-700 dark:text-green-400' 
										: 'bg-red-500/20 text-red-700 dark:text-red-400'
								}`}>
									{item.result === 'Success' ? '✓ Успех' : '✕ Ошибка'}
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* БЛОК 2: НОВАЯ РЕАКЦИЯ (только для редакторов) */}
			{!isReader && (
				<section className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
					<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)] flex items-center gap-2">
						<FlaskConical className="w-5 h-5" /> Новая реакция
					</h3>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Маркер (Select) */}
						<div className="sm:col-span-2">
							<MD3Field
								isSelect
								label="Маркер"
								value={pcrForm.marker}
								onChange={(e) => setPcrForm({ ...pcrForm, marker: e.target.value })}
							>
								<option value=""></option>
								<option value="ITS">ITS</option>
								<option value="SSU">SSU</option>
								<option value="LSU">LSU</option>
								<option value="MCM7">MCM7</option>
							</MD3Field>
						</div>

						<MD3Field
							label="Прямой праймер"
							value={pcrForm.forwardPrimer}
							onChange={(e) => setPcrForm({ ...pcrForm, forwardPrimer: e.target.value })}
						/>

						<MD3Field
							label="Обратный праймер"
							value={pcrForm.reversePrimer}
							onChange={(e) => setPcrForm({ ...pcrForm, reversePrimer: e.target.value })}
						/>

						<MD3Field
							type="number"
							label="Объем (мкл)"
							value={pcrForm.volume}
							onChange={(e) => setPcrForm({ ...pcrForm, volume: e.target.value })}
						/>

						<MD3Field
							label="Матрица ДНК (мкл)"
							value={pcrForm.dnaMatrix}
							onChange={(e) => setPcrForm({ ...pcrForm, dnaMatrix: e.target.value })}
						/>

						{/* Результат (Select с цветом) */}
						<div className="sm:col-span-2">
							<MD3Field
								isSelect
								label="Результат"
								value={pcrForm.result}
								onChange={(e) => setPcrForm({ ...pcrForm, result: e.target.value as 'Success' | 'Failed' })}
								className={pcrForm.result === 'Success' 
									? 'text-green-600 dark:text-green-400 font-bold' 
									: 'text-red-600 dark:text-red-400 font-bold'
								}
							>
								<option value="Success" className="text-green-600 dark:text-green-400">✓ Успешно</option>
								<option value="Failed" className="text-red-600 dark:text-red-400">✕ Ошибка</option>
							</MD3Field>
						</div>
					</div>

					{/* Кнопки (кастомные, как в модалке редактирования) */}
					<div className="flex justify-end gap-3 pt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-3 rounded-full text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 transition-all">
							Отмена
						</button>
						<button
							type="button"
							onClick={onSubmit}
							disabled={!pcrForm.marker}
							className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
							<Save className="h-5 w-5" />
							Сохранить
						</button>
					</div>
				</section>
			)}
		</div>
	</div>
</div>
	);
}
