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
	className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
>
	<div className="w-full max-w-2xl p-6 sm:p-8 m-4 max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-[var(--md-sys-color-surface-container-high)] rounded-[2.5rem] md-elevation-3 border-none text-[var(--md-sys-color-on-surface)] transition-all transform scale-100">
		
		{/* ===== ЗАГОЛОВОК (как в Новой пробе) ===== */}
		<div className="mb-6 sm:mb-8 flex items-center justify-between">
			<div>
				<h2 className="text-2xl sm:text-3xl font-normal tracking-tight">Постановка ПЦР</h2>
				<p className="text-lg text-[var(--md-sys-color-primary)] font-mono mt-1 font-bold">{specimenId}</p>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center justify-center p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] active:scale-95 transition-all"
				aria-label="Закрыть"
			>
				<X className="h-6 w-6" />
			</button>
		</div>

		{/* ===== ОСНОВНАЯ ЛОГИКА ===== */}
		<div className="space-y-8">
			
			{/* БЛОК 1: ИСТОРИЯ ПЦР */}
			<section className="bg-[var(--ms-sys-color-surface-container)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
				<h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-[var(--md-sys-color-primary)]">
					<History className="w-5 h-5" /> История реакций
				</h3>
				
				{loadingHistory ? (
					<div className="text-center py-6 text-[var(--md-sys-color-outline)]">Загрузка истории...</div>
				) : history.length === 0 ? (
					<div className="bg-[var(--md-sys-color-surface-container-high)] p-6 rounded-2xl text-center text-[var(--md-sys-color-outline)] border border-dashed border-[var(--md-sys-color-outline-variant)]">
						Для этой пробы еще не было постановок ПЦР
					</div>
				) : (
					<div className="space-y-3">
						{history.map((item, idx) => (
							<div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--md-sys-color-surface-container-high)] rounded-2xl gap-4">
								<div>
									<p className="font-bold text-lg">{item.marker}</p>
									<p className="text-sm opacity-70 mt-1">Праймеры: {item.forwardPrimer} / {item.reversePrimer}</p>
									<p className="text-xs opacity-50 mt-1">{new Date(item.date).toLocaleString()}</p>
								</div>
								<div className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap self-start sm:self-auto ${item.result === 'Success' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:text-red-400'}`}>
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
					<h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[var(--md-sys-color-primary)]">
						<FlaskConical className="w-5 h-5" /> Новая реакция
					</h3>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{/* Маркер (Select) */}
						<div className="sm:col-span-2">
							<MD3Field
								isSelect
								label="Выберите маркер..."
								value={pcrForm.marker}
								onChange={(e) => setPcrForm({ ...pcrForm, marker: e.target.value })}
							>
								<option value="" className="text-[var(--md-sys-color-on-surface)]">Выберите маркер...</option>
								<option value="ITS" className="text-[var(--md-sys-color-on-surface)]">ITS</option>
								<option value="SSU" className="text-[var(--md-sys-color-on-surface)]">SSU</option>
								<option value="LSU" className="text-[var(--md-sys-color-on-surface)]">LSU</option>
								<option value="MCM7" className="text-[var(--md-sys-color-on-surface)]">MCM7</option>
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
						<div className="sm:col-span-2 mt-2">
							<MD3Field
								isSelect
								label="Результат постановки"
								value={pcrForm.result}
								onChange={(e) => setPcrForm({ ...pcrForm, result: e.target.value as 'Success' | 'Failed' })}
								className={pcrForm.result === 'Success' ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'}
							>
								<option value="Success" className="text-green-600 dark:text-green-400">✓ Успешно</option>
								<option value="Failed" className="text-red-600 dark:text-red-400">✕ Ошибка</option>
							</MD3Field>
						</div>
					</div>

					<div className="flex justify-end gap-3 pt-6">
						<Button
							type="button"
							variant="text"
							onClick={onClose}
						>
							Отмена
						</Button>
						<Button
							type="button"
							variant="filled"
							onClick={onSubmit}
							disabled={!pcrForm.marker}
						>
							<Save className="h-5 w-5 inline mr-2" />
							Сохранить
						</Button>
					</div>
				</section>
			)}
		</div>
	</div>
</div>
	);
}
