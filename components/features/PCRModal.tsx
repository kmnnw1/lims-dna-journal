'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, History, FlaskConical } from 'lucide-react';
import type { Specimen } from '@/types';

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
	setPcrForm: React.Dispatch<React.SetStateAction<any>>;
	onSubmit: () => void;
	isReader?: boolean;
}

export function PcrModal({ open, specimenId, activeSpecimen, onClose, pcrForm, setPcrForm, onSubmit, isReader }: Props) {
	const [history, setHistory] = useState<any[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);

	useEffect(() => {
		if (open && specimenId) {
			setLoadingHistory(true);
			fetch(`/api/pcr?specimenId=${specimenId}`)
				.then(res => res.json())
				.then(data => setHistory(Array.isArray(data) ? data : []))
				.catch(() => setHistory([]))
				.finally(() => setLoadingHistory(false));
		}
	}, [open, specimenId]);

	if (!open) return null;

	return (
		<div role="dialog" aria-modal="true" className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
			<div className="w-full max-w-2xl bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
				
				<div className="p-6 sm:p-8 border-b border-[var(--md-sys-color-outline-variant)] flex justify-between items-center bg-[var(--md-sys-color-surface-container)]">
					<div>
						<h2 className="text-2xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
							Постановка ПЦР
						</h2>
						<p className="text-lg text-[var(--md-sys-color-primary)] font-mono mt-1 font-bold">{specimenId}</p>
					</div>
					<button type="button" onClick={onClose} className="p-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] hover:brightness-95 text-[var(--md-sys-color-on-surface)] transition-all">
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar text-[var(--md-sys-color-on-surface)]">
					
					{/* ИСТОРИЯ ПЦР */}
					<section>
						<h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-[var(--md-sys-color-primary)]">
							<History className="w-5 h-5" /> История реакций
						</h3>
						{loadingHistory ? (
							<div className="text-center py-6 text-[var(--md-sys-color-outline)]">Загрузка истории...</div>
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
											<p className="text-sm opacity-70 mt-1">Праймеры: {item.forwardPrimer} / {item.reversePrimer}</p>
											<p className="text-xs opacity-50 mt-1">{new Date(item.date).toLocaleString()}</p>
										</div>
										<div className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap self-start sm:self-auto ${item.result === 'Success' ? 'bg-[#4caf50]/20 text-[#2e7d32] dark:text-[#81c784]' : 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]'}`}>
											{item.result === 'Success' ? '✓ Успех' : '✕ Ошибка'}
										</div>
									</div>
								))}
							</div>
						)}
					</section>

					{/* ФОРМА НОВОЙ ПЦР */}
					{!isReader && (
						<section className="bg-[var(--md-sys-color-surface-container)] p-6 rounded-[2rem]">
							<h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-[var(--md-sys-color-primary)]">
								<FlaskConical className="w-5 h-5" /> Новая реакция
							</h3>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="relative group sm:col-span-2">
									<select
										value={pcrForm.marker}
										onChange={(e) => setPcrForm({ ...pcrForm, marker: e.target.value })}
										className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all appearance-none"
									>
										<option value="">Выберите маркер...</option>
										<option value="ITS">ITS</option>
										<option value="SSU">SSU</option>
										<option value="LSU">LSU</option>
										<option value="MCM7">MCM7</option>
									</select>
									<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)] ${pcrForm.marker ? 'top-1.5 text-xs' : 'top-4 text-base'} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs`}>
										Маркер *
									</label>
								</div>

								<div className="relative group">
									<input value={pcrForm.forwardPrimer} onChange={(e) => setPcrForm({ ...pcrForm, forwardPrimer: e.target.value })} className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all" />
									<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)] ${pcrForm.forwardPrimer ? 'top-1.5 text-xs' : 'top-4 text-base'} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs`}>Прямой праймер</label>
								</div>

								<div className="relative group">
									<input value={pcrForm.reversePrimer} onChange={(e) => setPcrForm({ ...pcrForm, reversePrimer: e.target.value })} className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all" />
									<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)] ${pcrForm.reversePrimer ? 'top-1.5 text-xs' : 'top-4 text-base'} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs`}>Обратный праймер</label>
								</div>

								<div className="relative group">
									<input type="number" value={pcrForm.volume} onChange={(e) => setPcrForm({ ...pcrForm, volume: e.target.value })} className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all" />
									<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)] ${pcrForm.volume ? 'top-1.5 text-xs' : 'top-4 text-base'} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs`}>Объем (мкл)</label>
								</div>

								<div className="relative group">
									<input value={pcrForm.dnaMatrix} onChange={(e) => setPcrForm({ ...pcrForm, dnaMatrix: e.target.value })} className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all" />
									<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)] ${pcrForm.dnaMatrix ? 'top-1.5 text-xs' : 'top-4 text-base'} group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs`}>Матрица ДНК (мкл)</label>
								</div>

								<div className="relative group sm:col-span-2 mt-2">
									<select
										value={pcrForm.result}
										onChange={(e) => setPcrForm({ ...pcrForm, result: e.target.value as 'Success' | 'Failed' })}
										className="w-full rounded-[1rem] border-2 border-transparent focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 py-4 text-base outline-none transition-all font-bold appearance-none"
									>
										<option value="Success">Успешно (✓)</option>
										<option value="Failed">Ошибка (✕)</option>
									</select>
									<label className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--md-sys-color-outline)]">▼</label>
								</div>
							</div>

							<div className="flex justify-end gap-3 mt-6">
								<button type="button" onClick={onSubmit} disabled={!pcrForm.marker} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
									<Save className="h-5 w-5" />
									Сохранить реакцию
								</button>
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
}
