'use client';

import { FlaskConical, History, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MD3Field } from '@/components/ui/MD3Field';
import type { PCRAttempt, PCRForm, Specimen } from '@/types';

interface Props {
	open: boolean;
	specimenId: string;
	activeSpecimen: Specimen | null;
	onClose: () => void;
	pcrForm: PCRForm & { id?: string };
	setPCRForm: React.Dispatch<React.SetStateAction<PCRForm & { id?: string }>>;
	onSubmit: () => void;
	isReader?: boolean;
}

export function PCRModal({
	open,
	specimenId,
	onClose,
	pcrForm,
	setPCRForm,
	onSubmit,
	isReader,
}: Props) {
	const [history, setHistory] = useState<PCRAttempt[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);

	const fetchHistory = useCallback(() => {
		if (specimenId) {
			setLoadingHistory(true);
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
	}, [specimenId]);

	useEffect(() => {
		if (open) fetchHistory();
	}, [open, fetchHistory]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	const handleEditAttempt = (attempt: PCRAttempt) => {
		setPCRForm({
			id: attempt.id,
			marker: attempt.marker || '',
			forwardPrimer: attempt.forwardPrimer || '',
			reversePrimer: attempt.reversePrimer || '',
			volume: attempt.volume || '',
			dnaMatrix: attempt.dnaMatrix || '',
			result: attempt.result === 'Success' ? 'Success' : 'Fail',
		});
		setIsEditing(true);
	};

	const handleResetForm = () => {
		setPCRForm({
			marker: '',
			forwardPrimer: '',
			reversePrimer: '',
			volume: '',
			dnaMatrix: '',
			result: 'Fail',
		});
		setIsEditing(false);
	};

	const handleDeleteAttempt = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту запись ПЦР?')) return;
		try {
			const res = await fetch(`/api/pcr?id=${id}`, { method: 'DELETE' });
			if (res.ok) {
				fetchHistory();
				handleResetForm();
			}
		} catch (error) {
			console.error('Failed to delete PCR attempt:', error);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-125 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm print:hidden">
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="История и постановка ПЦР"
				tabIndex={0}
				className="my-6 w-full max-w-2xl p-6 sm:p-8 relative bg-(--md-sys-color-surface-container-low) rounded-4xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar focus-visible:outline-none animate-in fade-in zoom-in-95 duration-200"
			>
				<div className="mb-6 flex items-center justify-between gap-4">
					<div>
						<h2 className="text-2xl sm:text-3xl font-normal text-(--md-sys-color-on-surface) tracking-tight">
							История и постановка ПЦР
						</h2>
						<p className="text-lg text-(--md-sys-color-primary) font-mono mt-1 font-bold">
							{specimenId}
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-3 rounded-full hover:bg-black/10 transition-all"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="space-y-6">
					{/* History Section */}
					<section className="bg-(--md-sys-color-surface-container-high) p-6 rounded-3xl shadow-inner">
						<h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-(--md-sys-color-primary) flex items-center gap-2">
							<History className="w-5 h-5" /> История реакций
						</h3>

						{loadingHistory ? (
							<div className="text-center py-6 opacity-50">Загрузка...</div>
						) : history.length === 0 ? (
							<div className="text-center py-8 opacity-40 border-2 border-dashed border-(--md-sys-color-outline-variant) rounded-2xl">
								Пока пусто
							</div>
						) : (
							<div className="space-y-3">
								{history.map((item) => (
									<div
										key={item.id}
										className="group flex items-center justify-between p-4 bg-(--md-sys-color-surface-container) rounded-2xl hover:shadow-md transition-all"
									>
										<div className="flex-1">
											<div className="flex items-center gap-3">
												<span className="font-black text-xl tracking-tighter text-(--md-sys-color-primary)">
													{item.marker}
												</span>
												<span
													className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.result === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
												>
													{item.result === 'Success' ? 'Успех' : 'Ошибка'}
												</span>
											</div>
											<p className="text-xs opacity-60 mt-1">
												{item.forwardPrimer} / {item.reversePrimer} •{' '}
												{new Date(item.date).toLocaleString()}
											</p>
										</div>
										{!isReader && (
											<div className="flex items-center gap-1">
												<button
													onClick={() => handleEditAttempt(item)}
													className="p-2 opacity-0 group-hover:opacity-100 hover:bg-(--md-sys-color-primary-container) text-(--md-sys-color-primary) rounded-full transition-all"
													title="Редактировать"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => handleDeleteAttempt(item.id)}
													className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 rounded-full transition-all"
													title="Удалить"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</section>

					{/* Edit/Add Form Section */}
					{!isReader && (
						<section className="bg-(--md-sys-color-surface-container-high) p-6 rounded-3xl shadow-inner border-2 border-(--md-sys-color-primary)/10">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-black uppercase tracking-[0.2em] text-(--md-sys-color-primary) flex items-center gap-2">
									{isEditing ? (
										<Pencil className="w-5 h-5" />
									) : (
										<Plus className="w-5 h-5" />
									)}
									{isEditing ? 'Редактировать пробу' : 'Новая реакция'}
								</h3>
								{isEditing && (
									<button
										onClick={handleResetForm}
										className="text-xs font-bold text-(--md-sys-color-primary) hover:underline"
									>
										Отмена / Создать новую
									</button>
								)}
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="sm:col-span-2">
									<MD3Field
										isSelect
										label="Маркер"
										value={pcrForm.marker}
										onChange={(e) =>
											setPCRForm({ ...pcrForm, marker: e.target.value })
										}
									>
										<option value=""></option>
										{[
											'ITS',
											'SSU',
											'LSU',
											'MCM7',
											'RPB2',
											'mtLSU',
											'mtSSU',
										].map((m) => (
											<option key={m} value={m}>
												{m}
											</option>
										))}
									</MD3Field>
								</div>
								<MD3Field
									label="Прямой праймер"
									value={pcrForm.forwardPrimer}
									onChange={(e) =>
										setPCRForm({ ...pcrForm, forwardPrimer: e.target.value })
									}
								/>
								<MD3Field
									label="Обратный праймер"
									value={pcrForm.reversePrimer}
									onChange={(e) =>
										setPCRForm({ ...pcrForm, reversePrimer: e.target.value })
									}
								/>
								<MD3Field
									type="number"
									label="Объем (мкл)"
									value={pcrForm.volume}
									onChange={(e) =>
										setPCRForm({ ...pcrForm, volume: e.target.value })
									}
								/>
								<MD3Field
									label="Матрица ДНК (мкл)"
									value={pcrForm.dnaMatrix}
									onChange={(e) =>
										setPCRForm({ ...pcrForm, dnaMatrix: e.target.value })
									}
								/>
								<div className="sm:col-span-2">
									<MD3Field
										isSelect
										label="Результат"
										value={pcrForm.result}
										onChange={(e) =>
											setPCRForm({
												...pcrForm,
												result: e.target.value as 'Success' | 'Fail',
											})
										}
									>
										<option value="Success">✓ Успешно</option>
										<option value="Fail">✕ Ошибка</option>
									</MD3Field>
								</div>
							</div>

							<div className="flex justify-end gap-3 pt-6">
								<Button variant="tonal" onClick={onClose}>
									Отмена
								</Button>
								<Button
									onClick={onSubmit}
									disabled={!pcrForm.marker}
									className="gap-2"
								>
									<Save className="h-5 w-5" />
									{isEditing ? 'Обновить изменения' : 'Сохранить реакцию'}
								</Button>
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
}
