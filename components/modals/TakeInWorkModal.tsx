'use client';

import { useEffect, useState } from 'react';
import type { OperationStage } from '@/lib/workflow/stages';

type TakeInWorkPayload = {
	stage: OperationStage;
	startedAt: string;
	lab: string;
	method: string;
	operator: string;
	comment: string;
	resultStatus: string;
	failReason: string;
	genbankNo: string;
	sequenceText: string;
	rawFileUrl: string;
	processedFileUrl: string;
	cleanupAtVendor: boolean;
	postCleanupConcentration: string;
	qualityStatus: string;
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
	stage: OperationStage;
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
	const [resultStatus, setResultStatus] = useState('in_progress');
	const [failReason, setFailReason] = useState('');
	const [genbankNo, setGenbankNo] = useState('');
	const [sequenceText, setSequenceText] = useState('');
	const [rawFileUrl, setRawFileUrl] = useState('');
	const [processedFileUrl, setProcessedFileUrl] = useState('');
	const [cleanupAtVendor, setCleanupAtVendor] = useState(false);
	const [postCleanupConcentration, setPostCleanupConcentration] = useState('');
	const [qualityStatus, setQualityStatus] = useState('');
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
					{stage === 'SEQUENCING' && (
						<>
							<label className="flex flex-col gap-1 text-sm">
								<span>Результат</span>
								<select
									value={resultStatus}
									onChange={(e) => setResultStatus(e.target.value)}
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								>
									<option value="in_progress">В работе</option>
									<option value="success">Успех</option>
									<option value="fail">Неуспех</option>
									<option value="retry">Повтор</option>
								</select>
							</label>
							<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
								<span>Номер GenBank</span>
								<input
									value={genbankNo}
									onChange={(e) => setGenbankNo(e.target.value)}
									placeholder="Например, GB_ACCESSION"
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								/>
							</label>
							<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
								<span>Ссылка на сырой файл</span>
								<input
									value={rawFileUrl}
									onChange={(e) => setRawFileUrl(e.target.value)}
									placeholder="URL/путь к сырому файлу"
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								/>
							</label>
							<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
								<span>Ссылка на обработанный файл (опционально)</span>
								<input
									value={processedFileUrl}
									onChange={(e) => setProcessedFileUrl(e.target.value)}
									placeholder="URL/путь к обработанному файлу"
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								/>
							</label>
							<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
								<span>Текст последовательности</span>
								<textarea
									value={sequenceText}
									onChange={(e) => setSequenceText(e.target.value)}
									rows={4}
									placeholder="ATCG..."
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								/>
							</label>
							{resultStatus === 'fail' && (
								<label className="sm:col-span-2 flex flex-col gap-1 text-sm">
									<span>Причина неуспеха</span>
									<input
										value={failReason}
										onChange={(e) => setFailReason(e.target.value)}
										placeholder="Например, смесь организмов / слабый сигнал"
										className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
									/>
								</label>
							)}
							<label className="sm:col-span-2 flex items-center gap-2 text-sm mt-1">
								<input
									type="checkbox"
									checked={cleanupAtVendor}
									onChange={(e) => setCleanupAtVendor(e.target.checked)}
								/>
								Очистка на стороне лаборатории секвенирования
							</label>
						</>
					)}
					{stage === 'CLEANUP' && (
						<>
							<label className="flex flex-col gap-1 text-sm">
								<span>Концентрация после очистки</span>
								<input
									value={postCleanupConcentration}
									onChange={(e) => setPostCleanupConcentration(e.target.value)}
									placeholder="нг/мкл"
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								/>
							</label>
							<label className="flex flex-col gap-1 text-sm">
								<span>Качество</span>
								<select
									value={qualityStatus}
									onChange={(e) => setQualityStatus(e.target.value)}
									className="px-3 py-2 rounded-xl bg-(--md-sys-color-surface-container) border border-(--md-sys-color-outline-variant)/30"
								>
									<option value="">Не указано</option>
									<option value="ok">Годно</option>
									<option value="weak">Слабо</option>
									<option value="fail">Негодно</option>
								</select>
							</label>
						</>
					)}
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
									resultStatus,
									failReason,
									genbankNo,
									sequenceText,
									rawFileUrl,
									processedFileUrl,
									cleanupAtVendor,
									postCleanupConcentration,
									qualityStatus,
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
