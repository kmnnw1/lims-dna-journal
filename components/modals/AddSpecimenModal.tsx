'use client';

import { X } from 'lucide-react';
import type { NewRecordForm } from '@/types';
import { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

type Props = {
	open: boolean;
	onClose: () => void;
	newRecord: NewRecordForm;
	setNewRecord: (val: NewRecordForm) => void;
	onSubmit: (e: React.FormEvent) => void;
	validationError?: string;
};

export function AddSpecimenModal({
	open,
	onClose,
	newRecord,
	setNewRecord,
	onSubmit,
	validationError,
}: Props) {
	const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

	const validate = (): boolean => {
		const errors: Record<string, string> = {};
		if (!newRecord.id.trim()) errors.id = 'ID пробы обязателен';
		else if (/\s/.test(newRecord.id)) errors.id = 'ID не должен содержать пробелов';
		if (newRecord.taxon.trim().length > 0 && newRecord.taxon.trim().length < 3) {
			errors.taxon = 'Таксон должен содержать не менее 3 символов';
		}
		setLocalErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) onSubmit(e);
	};
	const idInputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open && idInputRef.current) {
			idInputRef.current.focus();
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === overlayRef.current) onClose();
	};

	if (!open) return null;

	return (
		<div
	role="dialog"
	aria-modal="true"
	className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
	<div className="my-6 w-full max-w-md p-6 sm:p-8 relative bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
		<div className="mb-6 flex items-center justify-between gap-4">
			<h2 className="text-2xl sm:text-3xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
				Новая проба
			</h2>
			<button
				type="button"
				onClick={onClose}
				className="inline-flex items-center justify-center p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] active:scale-95 transition-all"
				aria-label="Закрыть">
				<X className="h-6 w-6" />
			</button>
		</div>

		<form onSubmit={onSubmit} className="space-y-5" autoComplete="off">
			{/* ID пробы */}
			<div className="relative group">
				<input
					ref={idInputRef}
					required
					autoFocus
					maxLength={30}
					value={newRecord.id}
					spellCheck={false}
					onChange={(e) =>
						setNewRecord({
							...newRecord,
							id: e.target.value.replace(/\s/g, ''),
						})
					}
					className={`w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all
						${validationError ? 'border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)]' : 'border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)]'}
					`}
					data-testid="addspecimen-id"
				/>
				<label
					className={`absolute left-5 transition-all duration-200 pointer-events-none
						${newRecord.id ? 'top-1.5 text-xs' : 'top-4 text-base'}
						${validationError ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-outline)] group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs'}
					`}>
					ID пробы *
				</label>
			</div>

			{/* Таксон */}
			<div className="relative group">
				<input
					value={newRecord.taxon}
					maxLength={80}
					onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })}
					className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
					data-testid="addspecimen-taxon"
				/>
				<label
					className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
						${newRecord.taxon ? 'top-1.5 text-xs' : 'top-4 text-base'}
						group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
					`}>
					Таксон
				</label>
			</div>

			{/* Лаборатория */}
			<div className="relative group">
				<input
					list="labs-list"
					value={newRecord.extrLab}
					maxLength={40}
					onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })}
					className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
					data-testid="addspecimen-lab"
				/>
				<label
					className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
						${newRecord.extrLab ? 'top-1.5 text-xs' : 'top-4 text-base'}
						group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
					`}>
					Лаборатория
				</label>
			</div>

			{/* Лаборант */}
			<div className="relative group">
				<input
					list="ops-list"
					value={newRecord.extrOperator}
					maxLength={40}
					onChange={(e) => setNewRecord({ ...newRecord, extrOperator: e.target.value })}
					className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
					data-testid="addspecimen-operator"
				/>
				<label
					className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
						${newRecord.extrOperator ? 'top-1.5 text-xs' : 'top-4 text-base'}
						group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
					`}>
					Лаборант
				</label>
			</div>

			{/* Ошибка валидации */}
			{validationError && (
				<div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-4 rounded-2xl text-sm font-medium">
					{validationError}
				</div>
			)}

			{/* Кнопки */}
			<div className="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onClick={onClose}
					className="px-6 py-3 rounded-full text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 transition-all">
					Отмена
				</button>
				<button
					type="submit"
					className="px-8 py-3 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all">
					Сохранить
				</button>
			</div>
		</form>
	</div>
</div>
	);
}
