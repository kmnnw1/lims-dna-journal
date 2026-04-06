'use client';

import React, { forwardRef } from 'react';
import { X, Activity, Save } from 'lucide-react';
import type { PcrForm, Specimen } from '@/types';

// Локальный хелпер для полей
const MD3Field = forwardRef<HTMLInputElement | HTMLSelectElement, { label: string; value: string; isSelect?: boolean; children?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>>(({ label, value, isSelect, children, className = '', ...props }, ref) => {
	const baseClass = `w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-zinc-300 focus:border-teal-600 bg-zinc-100/80 dark:bg-zinc-800/80 px-5 pt-6 pb-2 text-base outline-none transition-all text-zinc-900 dark:text-zinc-100 ${className}`;
	return (
		<div className="relative group w-full">
			{isSelect ? (
				<select ref={ref as any} value={value} className={baseClass} {...props}>{children}</select>
			) : (
				<input ref={ref as any} value={value} className={baseClass} {...props} />
			)}
			<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-zinc-500
				${value ? 'top-1.5 text-xs' : 'top-4 text-base'}
				group-focus-within:text-teal-600 group-focus-within:top-1.5 group-focus-within:text-xs
			`}>
				{label}
			</label>
		</div>
	);
});
MD3Field.displayName = 'MD3Field';

function pcrResultLabelRu(result: string) {
	if (result === 'Success') return 'Успех';
	if (result === 'Fail') return 'Провал';
	return result;
}

type Props = {
	open: boolean;
	specimenId: string;
	activeSpecimen: Specimen | undefined | null;
	onClose: () => void;
	pcrForm: PcrForm;
	setPcrForm: (val: PcrForm) => void;
	onSubmit: () => void;
	isReader: boolean;
};

export function PcrModal({ open, specimenId, activeSpecimen, onClose, pcrForm, setPcrForm, onSubmit, isReader }: Props) {
	if (!open || !specimenId || !activeSpecimen) return null;

	return (
		<div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" tabIndex={-1}>
			<div className="my-4 w-full max-w-xl p-8 relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
				
				<div className="mb-6 flex items-start justify-between gap-4 shrink-0">
					<div>
						<h2 className="text-3xl font-normal text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
							<Activity className="text-teal-600 h-8 w-8" /> ПЦР
						</h2>
						<p className="text-teal-600 font-mono font-medium mt-1 text-lg">{specimenId}</p>
					</div>
					<button type="button" onClick={onClose} className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-all">
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-8">
					{activeSpecimen.notes && (
						<div className="rounded-[1.5rem] bg-yellow-400/10 p-5 text-sm border border-yellow-400/20">
							<p className="mb-2 text-xs font-bold uppercase tracking-wider text-yellow-600">Заметки пробы</p>
							<p className="whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">{activeSpecimen.notes}</p>
						</div>
					)}

					<div className="space-y-4">
						<h3 className="text-sm font-medium tracking-wide text-teal-600 px-2">История попыток</h3>
						{!activeSpecimen.attempts || activeSpecimen.attempts.length === 0 ? (
							<div className="text-center py-10 text-sm font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-700">
								Пока нет записей ПЦР
							</div>
						) : (
							activeSpecimen.attempts.map((a: any) => (
								<div key={a.id} className="rounded-[1.5rem] bg-zinc-50 dark:bg-zinc-800 p-5 shadow-sm">
									<div className="flex flex-wrap justify-between items-center gap-3 mb-4">
										<span className="text-sm font-medium text-zinc-500">{new Date(a.date).toLocaleDateString('ru-RU')}</span>
										<span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{a.volume || '—'} мкл</span>
										<span className={`font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${
											a.result === 'Success' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
										}`}>
											{pcrResultLabelRu(a.result)}
										</span>
									</div>
									<div className="flex flex-wrap gap-2 text-xs font-medium">
										{a.marker && <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">Маркер: <b>{a.marker}</b></span>}
										{a.forwardPrimer && <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">F: {a.forwardPrimer}</span>}
										{a.reversePrimer && <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">R: {a.reversePrimer}</span>}
									</div>
								</div>
							))
						)}
					</div>

					{!isReader && (
						<div className="pt-6 border-t-2 border-zinc-100 dark:border-zinc-800 space-y-4">
							<h3 className="text-sm font-medium tracking-wide text-teal-600 px-2">Новая попытка</h3>
							
							<div className="grid grid-cols-2 gap-4">
								<MD3Field label="Объём (мкл)" value={pcrForm.volume} onChange={(e) => setPcrForm({ ...pcrForm, volume: e.target.value })} />
								<MD3Field label="Маркер (ITS...)" value={pcrForm.marker} onChange={(e) => setPcrForm({ ...pcrForm, marker: e.target.value })} />
								<MD3Field label="Fwd праймер" value={pcrForm.forwardPrimer} onChange={(e) => setPcrForm({ ...pcrForm, forwardPrimer: e.target.value })} />
								<MD3Field label="Rev праймер" value={pcrForm.reversePrimer} onChange={(e) => setPcrForm({ ...pcrForm, reversePrimer: e.target.value })} />
							</div>
							
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<MD3Field label="Матрица ДНК" value={pcrForm.dnaMatrix} onChange={(e) => setPcrForm({ ...pcrForm, dnaMatrix: e.target.value })} />
								<MD3Field isSelect label="Результат" value={pcrForm.result} onChange={(e) => setPcrForm({ ...pcrForm, result: e.target.value as 'Fail' | 'Success' })}>
									<option value="Success" className="text-green-600 font-bold">Успех</option>
									<option value="Fail" className="text-rose-600 font-bold">Провал</option>
								</MD3Field>
							</div>

							<div className="pt-4">
								<button type="button" onClick={onSubmit} className="w-full inline-flex justify-center items-center gap-2 py-4 rounded-full text-base font-bold bg-teal-600 text-white shadow-md hover:shadow-lg active:scale-95 transition-all">
									<Save className="h-5 w-5" /> Добавить запись
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
