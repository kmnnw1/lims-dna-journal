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
			ref={overlayRef}
			className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={handleOverlayClick}
			aria-modal="true"
			role="dialog"
			tabIndex={-1}>
			<Card className="w-full max-w-md p-6 sm:p-8 m-4 max-h-[90vh] overflow-y-auto custom-scrollbar relative md-elevation-3 border-none bg-[var(--md-sys-color-surface-container-high)] hover:md-elevation-3">
				<CardHeader className="mb-6 sm:mb-8 flex items-center justify-between">
					<CardTitle className="text-2xl sm:text-3xl font-normal tracking-tight">Новая проба</CardTitle>
					<Button
						type="button"
						onClick={onClose}
						variant="text"
						size="small"
						className="p-3 rounded-full"
						aria-label="Закрыть">
						<X className="h-6 w-6" />
					</Button>
				</CardHeader>

				<CardContent>
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4 sm:gap-5"
						autoComplete="off">
						<div className="relative group">
							<TextField
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
								className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
								data-testid="addspecimen-id"
								placeholder="ID пробы *"
							/>
							<label
								className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
								${newRecord.id ? 'top-1.5 text-xs' : 'top-4 text-base'}
								group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
							`}>
								ID пробы *
							</label>
							{localErrors.id && <p className="text-xs text-red-500 mt-1 ml-1">{localErrors.id}</p>}
						</div>

						<div className="relative group">
							<TextField
								value={newRecord.taxon}
								maxLength={80}
								onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })}
								className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
								data-testid="addspecimen-taxon"
								placeholder="Таксон"
							/>
							<label
								className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
								${newRecord.taxon ? 'top-1.5 text-xs' : 'top-4 text-base'}
								group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
							`}>
								Таксон
							</label>
							{localErrors.taxon && <p className="text-xs text-red-500 mt-1 ml-1">{localErrors.taxon}</p>}
						</div>

						<div className="relative group">
							<TextField
								list="labs-list"
								value={newRecord.extrLab}
								maxLength={40}
								onChange={(e) =>
									setNewRecord({ ...newRecord, extrLab: e.target.value })
								}
								className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
								data-testid="addspecimen-lab"
								placeholder="Лаборатория"
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
							<TextField
								list="ops-list"
								value={newRecord.extrOperator}
								maxLength={40}
								onChange={(e) =>
									setNewRecord({ ...newRecord, extrOperator: e.target.value })
								}
								className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all"
								data-testid="addspecimen-operator"
								placeholder="Лаборант"
							/>
							<label
								className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
								${newRecord.extrOperator ? 'top-1.5 text-xs' : 'top-4 text-base'}
								group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
							`}>
								Лаборант
							</label>
						</div>

						{validationError && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
								{validationError}
							</div>
						)}

						<CardFooter className="flex justify-end gap-3 mt-4 pt-2 pb-2">
							<Button
								type="button"
								onClick={onClose}
								variant="text">
								Отмена
							</Button>
							<Button
								type="submit"
								variant="filled"
								data-testid="addspecimen-submit">
								Сохранить
							</Button>
						</CardFooter>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
