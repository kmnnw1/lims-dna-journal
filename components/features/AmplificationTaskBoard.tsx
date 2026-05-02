'use client';

import { useMemo, useState } from 'react';

type Task = {
	id: string;
	specimenId: string;
	marker: string;
	forwardPrimer: string | null;
	reversePrimer: string | null;
	dnaMatrix: string | null;
	volume: string | null;
	priority: number;
	assigneeId: string | null;
	status: string;
};

type WorkflowOperation = {
	id: string;
	specimenId: string;
	stage: string;
	status: string;
	marker: string | null;
	startedAt: string;
	completedAt: string | null;
	paramsJson: string | null;
};

export function AmplificationTaskBoard({
	selectedIds,
	onToast,
}: {
	selectedIds: Set<string>;
	onToast: (text: string, type: 'success' | 'error') => void;
}) {
	const [loading, setLoading] = useState(false);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [historySpecimenId, setHistorySpecimenId] = useState('');
	const [history, setHistory] = useState<WorkflowOperation[]>([]);

	const [marker, setMarker] = useState('ITS');
	const [forwardPrimer, setForwardPrimer] = useState('');
	const [reversePrimer, setReversePrimer] = useState('');
	const [dnaMatrix, setDnaMatrix] = useState('');
	const [volume, setVolume] = useState('');
	const [priority, setPriority] = useState(2);
	const [assigneeId, setAssigneeId] = useState('');

	const loadTasks = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/workflow/tasks');
			if (!res.ok) throw new Error('fetch');
			const data = (await res.json()) as Task[];
			setTasks(data);
		} catch {
			onToast('Не удалось загрузить задания', 'error');
		} finally {
			setLoading(false);
		}
	};

	const grouped = useMemo(() => {
		const map = new Map<string, Task[]>();
		for (const t of tasks) {
			const key = [
				t.status,
				t.marker,
				t.forwardPrimer || '',
				t.reversePrimer || '',
				t.dnaMatrix || '',
				t.volume || '',
				String(t.priority),
				t.assigneeId || '',
			].join('|');
			const list = map.get(key) || [];
			list.push(t);
			map.set(key, list);
		}
		return Array.from(map.values());
	}, [tasks]);

	const createTasksFromSelection = async () => {
		if (selectedIds.size === 0) {
			onToast('Выдели пробы для создания заданий', 'error');
			return;
		}
		setLoading(true);
		try {
			for (const specimenId of selectedIds) {
				const res = await fetch('/api/workflow/tasks', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						specimenId,
						marker,
						forwardPrimer,
						reversePrimer,
						dnaMatrix,
						volume,
						priority,
						assigneeId: assigneeId || null,
					}),
				});
				if (!res.ok) throw new Error('create');
			}
			onToast(`Задания созданы: ${selectedIds.size}`, 'success');
			await loadTasks();
		} catch {
			onToast('Ошибка при создании заданий', 'error');
			setLoading(false);
		}
	};

	const updateTask = async (id: string, action: 'take' | 'complete' | 'cancel') => {
		setLoading(true);
		try {
			const res = await fetch('/api/workflow/tasks', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, action }),
			});
			if (!res.ok) throw new Error('update');
			await loadTasks();
		} catch {
			onToast('Ошибка изменения задания', 'error');
			setLoading(false);
		}
	};

	const loadHistory = async () => {
		const id = historySpecimenId.trim();
		if (!id) return;
		setLoading(true);
		try {
			const res = await fetch(
				`/api/workflow/operations?specimenId=${encodeURIComponent(id)}`,
			);
			if (!res.ok) throw new Error('history');
			const data = (await res.json()) as WorkflowOperation[];
			setHistory(data);
		} catch {
			onToast('Не удалось загрузить историю этапов', 'error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 space-y-4">
			<div className="bg-(--md-sys-color-surface-container-low) rounded-2xl p-4 border border-(--md-sys-color-outline-variant)/20">
				<h3 className="font-bold mb-3">Создание заданий амплификации</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
					<input
						value={marker}
						onChange={(e) => setMarker(e.target.value)}
						placeholder="Маркер"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						value={forwardPrimer}
						onChange={(e) => setForwardPrimer(e.target.value)}
						placeholder="Прямой праймер"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						value={reversePrimer}
						onChange={(e) => setReversePrimer(e.target.value)}
						placeholder="Обратный праймер"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						value={dnaMatrix}
						onChange={(e) => setDnaMatrix(e.target.value)}
						placeholder="Матрица ДНК"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						value={volume}
						onChange={(e) => setVolume(e.target.value)}
						placeholder="Объём"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						type="number"
						value={priority}
						onChange={(e) => setPriority(Number(e.target.value))}
						placeholder="Приоритет"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
					<input
						value={assigneeId}
						onChange={(e) => setAssigneeId(e.target.value)}
						placeholder="Исполнитель (или пусто)"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface)"
					/>
				</div>
				<div className="mt-3 flex gap-2">
					<button
						onClick={createTasksFromSelection}
						disabled={loading}
						className="px-4 py-2 rounded-full bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)"
					>
						Создать из выделенных ({selectedIds.size})
					</button>
					<button
						onClick={loadTasks}
						disabled={loading}
						className="px-4 py-2 rounded-full border"
					>
						Обновить список
					</button>
				</div>
			</div>

			<div className="space-y-2">
				{grouped.length === 0 && (
					<div className="text-sm text-(--md-sys-color-on-surface-variant)">
						Заданий пока нет.
					</div>
				)}
				{grouped.map((group) => {
					const head = group[0];
					return (
						<div
							key={group.map((g) => g.id).join(',')}
							className="rounded-2xl border border-(--md-sys-color-outline-variant)/20 p-3 bg-(--md-sys-color-surface-container-low)"
						>
							<div className="text-sm font-semibold">
								{head.marker} | {head.forwardPrimer || '-'} /{' '}
								{head.reversePrimer || '-'} | матрица {head.dnaMatrix || '-'} |
								объем {head.volume || '-'} | приоритет {head.priority}
							</div>
							<div className="text-xs mt-1 text-(--md-sys-color-on-surface-variant)">
								Статус: {head.status}, исполнитель: {head.assigneeId || 'всем'},
								записей: {group.length}
							</div>
							<div className="text-xs mt-1 text-(--md-sys-color-on-surface-variant)">
								{group
									.slice(0, 12)
									.map((x) => x.specimenId)
									.join(', ')}
								{group.length > 12 ? ' ...' : ''}
							</div>
							<div className="mt-2 flex gap-2">
								<button
									onClick={() => updateTask(head.id, 'take')}
									className="px-3 py-1 rounded-full border text-xs"
								>
									В работу
								</button>
								<button
									onClick={() => updateTask(head.id, 'complete')}
									className="px-3 py-1 rounded-full border text-xs"
								>
									Готово
								</button>
								<button
									onClick={() => updateTask(head.id, 'cancel')}
									className="px-3 py-1 rounded-full border text-xs"
								>
									Отменить
								</button>
							</div>
						</div>
					);
				})}
			</div>

			<div className="bg-(--md-sys-color-surface-container-low) rounded-2xl p-4 border border-(--md-sys-color-outline-variant)/20">
				<h3 className="font-bold mb-3">История этапов по пробе</h3>
				<div className="flex flex-wrap gap-2">
					<input
						value={historySpecimenId}
						onChange={(e) => setHistorySpecimenId(e.target.value)}
						placeholder="ID пробы"
						className="px-3 py-2 rounded-xl border bg-(--md-sys-color-surface) min-w-[220px]"
					/>
					<button onClick={loadHistory} className="px-4 py-2 rounded-full border">
						Показать историю
					</button>
				</div>
				<div className="mt-3 space-y-2">
					{history.length === 0 && (
						<div className="text-sm text-(--md-sys-color-on-surface-variant)">
							История не загружена.
						</div>
					)}
					{history.map((h) => (
						<div
							key={h.id}
							className="text-sm rounded-xl border border-(--md-sys-color-outline-variant)/20 p-2 bg-(--md-sys-color-surface)"
						>
							<div>
								<b>{h.stage}</b> / {h.status} / маркер: {h.marker || '-'}
							</div>
							<div className="text-xs text-(--md-sys-color-on-surface-variant)">
								Старт: {new Date(h.startedAt).toLocaleString()}
								{h.completedAt
									? ` | Завершено: ${new Date(h.completedAt).toLocaleString()}`
									: ''}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
