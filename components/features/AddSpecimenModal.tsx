'use client';

import { X } from 'lucide-react';
import type { NewRecordForm } from '@/types';
import { useRef, useEffect } from 'react';

type Props = {
	open: boolean;
	onClose: () => void;
	newRecord: NewRecordForm;
	setNewRecord: (val: NewRecordForm) => void;
	onSubmit: (e: React.FormEvent) => void;
	validationError: boolean;
};

export function AddSpecimenModal({
	open,
	onClose,
	newRecord,
	setNewRecord,
	onSubmit,
	validationError,
}: Props) {
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
			ref={overlayRef}
			className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={handleOverlayClick}
			aria-modal="true"
			role="dialog"
			tabIndex={-1}>
			<div className="w-full max-w-md p-6 sm:p-8 m-4 max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl text-[var(--md-sys-color-on-surface)] transition-all transform scale-100">
				<div className="mb-6 sm:mb-8 flex items-center justify-between">
					<h2 className="text-2xl sm:text-3xl font-normal tracking-tight">Новая проба</h2>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex items-center justify-center p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] active:scale-95 transition-all"
						aria-label="Закрыть">
						<X className="h-6 w-6" />
					</button>
				</div>

				<form
					onSubmit={onSubmit}
					className="flex flex-col gap-4 sm:gap-5"
					autoComplete="off">
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

					<div className="relative group">
						<input
							list="labs-list"
							value={newRecord.extrLab}
							maxLength={40}
							onChange={(e) =>
								setNewRecord({ ...newRecord, extrLab: e.target.value })
							}
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

					<div className="relative group">
						<input
							list="ops-list"
							value={newRecord.extrOperator}
							maxLength={40}
							onChange={(e) =>
								setNewRecord({ ...newRecord, extrOperator: e.target.value })
							}
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

					<div className="flex justify-end gap-3 mt-4 pt-2 pb-2">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2.5 rounded-full text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 transition-all">
							Отмена
						</button>
						<button
							type="submit"
							className="px-8 py-2.5 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all"
							data-testid="addspecimen-submit">
							Сохранить
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
