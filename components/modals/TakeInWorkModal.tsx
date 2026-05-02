'use client';

import { useEffect, useState } from 'react';
import type { WorkflowStage } from '@/components/features/WorkflowStagePicker';

type TakeInWorkPayload = {
	stage: WorkflowStage;
	startedAt: string;
	lab: string;
	method: string;
	operator: string;
	comment: string;
	printAfterSave: boolean;
};

export function TakeInWorkModal({
	open,
	stage,
	selectedCount,
	defaultOperator,
	onClose,
	onSubmit,
}: {
	open: boolean;
	stage: WorkflowStage;
	selectedCount: number;
	defaultOperator: string;
	onClose: () => void;
	onSubmit: (payload: TakeInWorkPayload) => Promise<void>;
}) {
	const [startedAt, setStartedAt] = useState('');
	const [lab, setLab] = useState('');
	const [method, setMethod] = useState('');
	const [operator, setOperator] = useState(defaultOperator);
	const [comment, setComment] = useState('');
	const [printAfterSave, setPrintAfterSave] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open) return;
		setStartedAt(new Date().toISOString().slice(0, 16));
		setOperator(defaultOperator);
	}, [open, defaultOperator]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 p-4">
			<div className="w-full max-w-xl rounded-3xl bg-(--md-sys-color-surface-container-lowest) border border-(--md-sys-color-outline-variant)/30 p-5 sm:p-6 shadow-2xl">
				<h3 className="text-lg font-bold mb-2">Взять в работу</h3>
				<p className="text-sm text-(--md-sys-color-on-surface-variant) mb-4">
					Этап: <b>{stage}</b>, записей: <b>{selectedCount}</b>
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label className="flex flex-col gap-1 text-sm">
						<span>Дата и время</span>
						<input
							type="datetime-local"
							value={startedAt}
							onChange={(e) => setStartedAt(e.target.value)}
							className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Оператор</span>
						<input
							value={operator}
							onChange={(e) => setOperator(e.target.value)}
							placeholder="ФИО/логин"
							className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Лаборатория</span>
						<input
							value={lab}
							onChange={(e) => setLab(e.target.value)}
							placeholder="Например, БС ДВО РАН"
							className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						<span>Метод</span>
						<input
							value={method}
							onChange={(e) => setMethod(e.target.value)}
							placeholder="Методика"
							className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
						/>
					</label>
					<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
						<span>Комментарий</span>
						<textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							rows={3}
							className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
						/>
					</label>
				</div>

				<label className="mt-3 flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={printAfterSave}
						onChange={(e) => setPrintAfterSave(e.target.checked)}
					/>
					Сразу открыть печатный бланк
				</label>

				<div className="mt-5 flex items-center justify-end gap-2">
					<button onClick={onClose} className="px-4 py-2 rounded-full border">
						Отмена
					</button>
					<button
						disabled={saving}
						onClick={async () => {
							setSaving(true);
							try {
								await onSubmit({
									stage,
									startedAt,
									lab,
									method,
									operator,
									comment,
									printAfterSave,
								});
							} finally {
								setSaving(false);
							}
						}}
						className="px-4 py-2 rounded-full bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)"
					>
						{saving ? 'Сохранение...' : 'Записать'}
					</button>
				</div>
			</div>
		</div>
	);
}
