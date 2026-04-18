'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { MD3Field } from '@/components/ui/MD3Field';
import type { NewRecordForm, Specimen } from '@/types';

type Props = {
	open: boolean;
	onClose: () => void;
	newRecord: NewRecordForm;
	setNewRecord: (val: NewRecordForm) => void;
	onSubmit: (e: React.FormEvent) => void;
	validationError?: string;
	specimens: Specimen[];
};

export function AddSpecimenModal({
	open,
	onClose,
	newRecord,
	setNewRecord,
	onSubmit,
	validationError,
	specimens = [],
}: Props) {
	const idInputRef = useRef<HTMLInputElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open && idInputRef.current) {
			idInputRef.current.focus();
		}
	}, [open]);

	const taxons = useMemo(
		() => Array.from(new Set(specimens.map((s) => s.taxon).filter(Boolean))),
		[specimens],
	);
	const labs = useMemo(
		() => Array.from(new Set(specimens.map((s) => s.extrLab).filter(Boolean))),
		[specimens],
	);
	const operators = useMemo(
		() => Array.from(new Set(specimens.map((s) => s.extrOperator).filter(Boolean))),
		[specimens],
	);

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
			ref={overlayRef}
			role="dialog"
			aria-modal="true"
			className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
			onClick={handleOverlayClick}
		>
			<div className="my-6 w-full max-w-md p-6 sm:p-8 relative bg-(--md-sys-color-surface-container-low) rounded-4xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
				<div className="mb-6 flex items-center justify-between gap-4">
					<h2 className="text-2xl sm:text-3xl font-normal text-(--md-sys-color-on-surface) tracking-tight">
						Новая проба
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex items-center justify-center p-3 rounded-full hover:bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface) active:scale-95 transition-all"
						aria-label="Закрыть"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<form
					onSubmit={onSubmit}
					className="space-y-5"
					autoComplete="off"
					aria-label="Форма добавления пробы"
				>
					<MD3Field
						ref={idInputRef}
						required
						label="ID пробы *"
						value={newRecord.id}
						maxLength={30}
						spellCheck={false}
						onChange={(e) =>
							setNewRecord({
								...newRecord,
								id: e.target.value.replace(/\s/g, ''),
							})
						}
						className="!bg-(--md-sys-color-surface-container-high)"
						data-testid="addspecimen-id"
					/>

					<MD3Field
						list="taxons-list"
						label="Таксон"
						value={newRecord.taxon}
						maxLength={80}
						onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })}
						className="!bg-(--md-sys-color-surface-container-high) !rounded-md"
						data-testid="addspecimen-taxon"
					/>

					<MD3Field
						list="labs-list"
						label="Лаборатория"
						value={newRecord.extrLab}
						maxLength={40}
						onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })}
						className="!bg-(--md-sys-color-surface-container-high) !rounded-md"
						data-testid="addspecimen-lab"
					/>

					<MD3Field
						list="ops-list"
						label="Лаборант"
						value={newRecord.extrOperator}
						maxLength={40}
						onChange={(e) =>
							setNewRecord({ ...newRecord, extrOperator: e.target.value })
						}
						className="!bg-(--md-sys-color-surface-container-high) !rounded-t-xs !rounded-b-2xl"
						data-testid="addspecimen-operator"
					/>

					<datalist id="taxons-list">
						{taxons.map((t, i) => (
							<option key={i} value={t as string} />
						))}
					</datalist>
					<datalist id="labs-list">
						{labs.map((t, i) => (
							<option key={i} value={t as string} />
						))}
					</datalist>
					<datalist id="ops-list">
						{operators.map((t, i) => (
							<option key={i} value={t as string} />
						))}
					</datalist>

					{validationError && (
						<div className="bg-(--md-sys-color-error-container) text-(--md-sys-color-on-error-container) p-4 rounded-2xl text-sm font-medium">
							{validationError}
						</div>
					)}

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-3 rounded-full text-sm font-medium text-(--md-sys-color-primary) hover:bg-(--md-sys-color-primary)/10 transition-all"
						>
							Отмена
						</button>
						<button
							type="submit"
							className="px-8 py-3 rounded-full text-sm font-medium bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) shadow-md hover:shadow-lg active:scale-95 transition-all"
						>
							Сохранить
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
