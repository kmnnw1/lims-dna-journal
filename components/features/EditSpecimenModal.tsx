'use client';

import React, { forwardRef } from 'react';
import { X, Save } from 'lucide-react';
import { useRef, useEffect } from 'react';
import type { EditSpecimenForm } from '@/types';

// Локальный хелпер для полей в стиле MD3 Filled
const MD3Field = forwardRef<HTMLInputElement | HTMLTextAreaElement, { label: string; value: string; isArea?: boolean } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ label, value, isArea, className = '', ...props }, ref) => {
	const baseClass = `w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all text-[var(--md-sys-color-on-surface)] ${className}`;
	
	return (
		<div className="relative group">
			{isArea ? (
				<textarea ref={ref as any} value={value} className={`${baseClass} min-h-[100px] resize-y`} {...props} />
			) : (
				<input ref={ref as any} value={value} className={baseClass} {...props} />
			)}
			<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
				${value ? 'top-1.5 text-xs' : 'top-4 text-base'}
				group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
			`}>
				{label}
			</label>
		</div>
	);
});
MD3Field.displayName = 'MD3Field';

type Props = {
	specimen: EditSpecimenForm | null;
	onClose: () => void;
	onChange: (val: EditSpecimenForm) => void;
	onSubmit: (e: React.FormEvent) => void;
};

export function EditSpecimenModal({ specimen, onClose, onChange, onSubmit }: Props) {
	const taxonInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (specimen && taxonInputRef.current) {
			setTimeout(() => { taxonInputRef.current?.focus(); }, 60);
		}
	}, [specimen]);

	if (!specimen) return null;

	const isEmpty = !specimen.taxon && !specimen.locality && !specimen.collector && !specimen.notes &&
		!specimen.extrLab && !specimen.extrOperator && !specimen.extrMethod && !specimen.extrDateRaw &&
		!specimen.dnaMeter && !specimen.dnaConcentration && !specimen.measOperator && !specimen.measDate;

	return (
		<div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
					<div className="my-6 w-full max-w-2xl p-8 relative bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl">
						
						<div className="mb-8 flex items-center justify-between gap-4">
							<h2 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
								Редактировать
								<span className="block text-lg text-[var(--md-sys-color-primary)] font-mono mt-1">{specimen.id}</span>
							</h2>
							<button type="button" onClick={onClose} className="p-3 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all">
								<X className="h-6 w-6" />
							</button>
						</div>
		
						<form onSubmit={onSubmit} className="space-y-6" autoComplete="off">
							
							{/* Карточка 1: Общая информация */}
							<section className="bg-gray-150 dark:bg-gray-800 p-6 rounded-[2rem] shadow-inner">
								<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">Общая информация</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<MD3Field ref={taxonInputRef} label="Таксон" value={specimen.taxon || ''} maxLength={72} onChange={(e) => onChange({ ...specimen, taxon: e.target.value })} />
									<MD3Field label="Место сбора (Locality)" value={specimen.locality || ''} maxLength={100} onChange={(e) => onChange({ ...specimen, locality: e.target.value })} />
									<MD3Field label="Коллектор" value={specimen.collector || ''} maxLength={40} onChange={(e) => onChange({ ...specimen, collector: e.target.value })} className="sm:col-span-2" />
									<div className="sm:col-span-2">
										<MD3Field isArea label="Заметки" value={specimen.notes || ''} maxLength={300} onChange={(e) => onChange({ ...specimen, notes: e.target.value })} />
									</div>
								</div>
							</section>
		
							{/* Карточка 2: Выделение ДНК */}
							<section className="bg-gray-150 dark:bg-gray-800 p-6 rounded-[2rem] shadow-inner">
								<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">Выделение ДНК</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<MD3Field list="labs-list" label="Лаборатория" value={specimen.extrLab || ''} maxLength={40} onChange={(e) => onChange({ ...specimen, extrLab: e.target.value })} />
									<MD3Field list="ops-list" label="Лаборант" value={specimen.extrOperator || ''} maxLength={40} onChange={(e) => onChange({ ...specimen, extrOperator: e.target.value })} />
									<MD3Field list="methods-list" label="Метод" value={specimen.extrMethod || ''} maxLength={40} onChange={(e) => onChange({ ...specimen, extrMethod: e.target.value })} />
									<MD3Field label="Дата (Extr. Date)" value={specimen.extrDateRaw || ''} maxLength={20} onChange={(e) => onChange({ ...specimen, extrDateRaw: e.target.value })} />
								</div>
							</section>
		
							{/* Карточка 3: Концентрация */}
							<section className="bg-gray-150 dark:bg-gray-800 p-6 rounded-[2rem] shadow-inner">
								<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">Концентрация</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<MD3Field label="Оборудование" value={specimen.dnaMeter || ''} maxLength={32} onChange={(e) => onChange({ ...specimen, dnaMeter: e.target.value })} />
									<MD3Field label="Концентрация" value={specimen.dnaConcentration || ''} maxLength={12} inputMode="decimal" onChange={(e) => onChange({ ...specimen, dnaConcentration: e.target.value })} />
									<MD3Field label="Кто измерял" value={specimen.measOperator || ''} maxLength={40} onChange={(e) => onChange({ ...specimen, measOperator: e.target.value })} />
									<MD3Field label="Дата измерения" value={specimen.measDate || ''} maxLength={20} onChange={(e) => onChange({ ...specimen, measDate: e.target.value })} />
								</div>
							</section>
		
							{/* MD3 Actions */}
							<div className="flex justify-end gap-3 pt-6">
								<button type="button" onClick={onClose} className="px-6 py-3 rounded-full text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 transition-all">
									Отмена
								</button>
								<button type="submit" disabled={isEmpty} className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
									<Save className="h-5 w-5" />
									Сохранить
								</button>
							</div>
						</form>
					</div>
				</div>
	);
}
