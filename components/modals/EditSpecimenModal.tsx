'use client';

import React, { forwardRef, useRef, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { EditSpecimenForm } from '@/types';

import { MD3Field } from '@/components/ui/MD3Field';
import { Button } from '@/components/ui/Button';

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
			setTimeout(() => {
				taxonInputRef.current?.focus();
			}, 60);
		}
	}, [specimen]);

	useEffect(() => {
		if (!specimen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [specimen, onClose]);

	if (!specimen) return null;

	const isEmpty =
		!specimen.taxon &&
		!specimen.locality &&
		!specimen.collector &&
		!specimen.notes &&
		!specimen.extrLab &&
		!specimen.extrOperator &&
		!specimen.extrMethod &&
		!specimen.extrDateRaw &&
		!specimen.dnaMeter &&
		!specimen.dnaConcentration &&
		!specimen.measOperator &&
		!specimen.measDate;

	return (
		<div
	role="dialog"
	aria-modal="true"
	aria-labelledby="edit-modal-title"
	className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	<div className="my-6 w-full max-w-2xl p-6 sm:p-8 relative bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
		<div className="mb-6 flex items-center justify-between gap-4">
			<h2
				id="edit-modal-title"
				className="text-2xl sm:text-3xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
				Редактировать
				<span className="block text-lg text-[var(--md-sys-color-primary)] font-mono mt-1">
					{specimen.id}
				</span>
			</h2>
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center justify-center p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] active:scale-95 transition-all"
				aria-label="Закрыть">
				<X className="h-6 w-6" />
			</button>
		</div>

		<form onSubmit={onSubmit} className="space-y-6" autoComplete="off">
			{/* Секция 1: Общая информация */}
			<section className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
				<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">
					Общая информация
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<MD3Field
						ref={taxonInputRef}
						label="Таксон"
						value={specimen.taxon || ''}
						maxLength={72}
						onChange={(e) => onChange({ ...specimen, taxon: e.target.value })}
					/>
					<MD3Field
						label="Место сбора (Locality)"
						value={specimen.locality || ''}
						maxLength={100}
						onChange={(e) =>
							onChange({ ...specimen, locality: e.target.value })
						}
					/>
					<MD3Field
						label="Коллектор"
						value={specimen.collector || ''}
						maxLength={40}
						onChange={(e) =>
							onChange({ ...specimen, collector: e.target.value })
						}
						className="sm:col-span-2"
					/>
					<div className="sm:col-span-2">
						<MD3Field
							isArea
							label="Заметки"
							value={specimen.notes || ''}
							maxLength={300}
							onChange={(e) =>
								onChange({ ...specimen, notes: e.target.value })
							}
						/>
					</div>
				</div>
			</section>

			{/* Секция 2: Выделение ДНК */}
			<section className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
				<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">
					Выделение ДНК
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<MD3Field
						list="labs-list"
						label="Лаборатория"
						value={specimen.extrLab || ''}
						maxLength={40}
						onChange={(e) => onChange({ ...specimen, extrLab: e.target.value })}
					/>
					<MD3Field
						list="ops-list"
						label="Лаборант"
						value={specimen.extrOperator || ''}
						maxLength={40}
						onChange={(e) =>
							onChange({ ...specimen, extrOperator: e.target.value })
						}
					/>
					<MD3Field
						list="methods-list"
						label="Метод"
						value={specimen.extrMethod || ''}
						maxLength={40}
						onChange={(e) =>
							onChange({ ...specimen, extrMethod: e.target.value })
						}
					/>
					<MD3Field
						label="Дата (Extr. Date)"
						value={specimen.extrDateRaw || ''}
						maxLength={20}
						onChange={(e) =>
							onChange({ ...specimen, extrDateRaw: e.target.value })
						}
					/>
				</div>
			</section>

			{/* Секция 3: Концентрация */}
			<section className="bg-[var(--md-sys-color-surface-container-high)] p-5 sm:p-6 rounded-[2rem] shadow-inner">
				<h3 className="mb-4 text-sm font-medium tracking-wide text-[var(--md-sys-color-primary)]">
					Концентрация
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<MD3Field
						label="Оборудование"
						value={specimen.dnaMeter || ''}
						maxLength={32}
						onChange={(e) =>
							onChange({ ...specimen, dnaMeter: e.target.value })
						}
					/>
					<MD3Field
						label="Концентрация"
						value={specimen.dnaConcentration || ''}
						maxLength={12}
						inputMode="decimal"
						onChange={(e) =>
							onChange({ ...specimen, dnaConcentration: e.target.value })
						}
					/>
					<MD3Field
						label="Кто измерял"
						value={specimen.measOperator || ''}
						maxLength={40}
						onChange={(e) =>
							onChange({ ...specimen, measOperator: e.target.value })
						}
					/>
					<MD3Field
						label="Дата измерения"
						value={specimen.measDate || ''}
						maxLength={20}
						onChange={(e) =>
							onChange({ ...specimen, measDate: e.target.value })
						}
					/>
				</div>
			</section>

			<div className="flex justify-end gap-3 pt-4">
				<Button
					type="button"
					variant="text"
					onClick={onClose}>
					Отмена
				</Button>
				<Button
					type="submit"
					variant="filled"
					disabled={isEmpty}>
					<Save className="h-5 w-5 mr-2" />
					Сохранить
				</Button>
			</div>
		</form>
	</div>
</div>
	);
}
