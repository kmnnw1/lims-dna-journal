'use client';

import {
	ChevronLeft,
	Clock,
	Database,
	FileUp,
	Filter,
	History,
	LogIn,
	RefreshCw,
	Search,
	Shield,
	Tag,
	Trash2,
	User,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface AuditLog {
	id: string;
	userId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	details: string | null;
	changes: string | null;
	timestamp: string;
}

export default function AdminAuditPage() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [_error, setError] = useState<string | null>(null);

	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch('/api/audit?limit=200');
			if (!res.ok) throw new Error('Ошибка доступа или загрузки');
			const data = await res.json();
			setLogs(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const getIcon = (action: string) => {
		if (action.includes('LOGIN')) return <LogIn className="w-4 h-4 text-blue-500" />;
		if (action.includes('IMPORT')) return <FileUp className="w-4 h-4 text-orange-500" />;
		if (action.includes('DELETE')) return <Trash2 className="w-4 h-4 text-red-500" />;
		return <Database className="w-4 h-4 text-green-500" />;
	};

	const actionLabels: Record<string, string> = {
		CREATE_SPECIMEN: 'Создание пробы',
		UPDATE_SPECIMEN: 'Обновление пробы',
		DELETE_SPECIMEN: 'Удаление',
		LOGIN: 'Вход в систему',
		IMPORT_SPECIMENS: 'Импорт Excel',
		PCR_ATTEMPT: 'ПЦР анализ',
	};

	return (
		<div className="min-h-screen bg-(--md-sys-color-surface-container-lowest) p-4 md:p-8">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
					<div className="space-y-2">
						<Link
							href="/"
							className="inline-flex items-center gap-2 text-sm font-bold text-(--md-sys-color-primary) hover:opacity-80 transition-opacity mb-4"
						>
							<ChevronLeft className="w-4 h-4" /> На главную
						</Link>
						<div className="flex items-center gap-4">
							<div className="p-4 rounded-3xl bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container) shadow-lg">
								<Shield className="w-8 h-8" />
							</div>
							<div>
								<h1 className="text-4xl font-black text-(--md-sys-color-on-surface) tracking-tight">
									Аудит Системы
								</h1>
								<p className="text-lg font-medium text-(--md-sys-color-on-surface-variant) opacity-70">
									История всех действий и изменений
								</p>
							</div>
						</div>
					</div>

					<button
						onClick={fetchLogs}
						disabled={isLoading}
						className="flex items-center gap-2 px-6 py-3 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) rounded-full font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all text-sm disabled:opacity-50"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
						Обновить данные
					</button>
				</div>

				{/* Dashboard Stats (Optional Placeholder for richness) */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div className="p-6 rounded-3xl bg-(--md-sys-color-surface-container-high) border border-(--md-sys-color-outline-variant)/30">
						<p className="text-sm font-bold opacity-60 uppercase mb-2">Всего записей</p>
						<p className="text-3xl font-black text-(--md-sys-color-primary)">
							{logs.length}
						</p>
					</div>
					{/* More stats could go here */}
				</div>

				{/* Main Log Table */}
				<div className="bg-(--md-sys-color-surface) rounded-4xl shadow-2xl overflow-hidden border border-(--md-sys-color-outline-variant)/20">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-separate border-spacing-0">
							<thead>
								<tr className="bg-(--md-sys-color-surface-container)">
									<th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-(--md-sys-color-on-surface-variant) opacity-70">
										Событие
									</th>
									<th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-(--md-sys-color-on-surface-variant) opacity-70">
										Пользователь
									</th>
									<th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-(--md-sys-color-on-surface-variant) opacity-70">
										Ресурс
									</th>
									<th className="px-6 py-5 text-sm font-black uppercase tracking-widest text-(--md-sys-color-on-surface-variant) opacity-70">
										Время
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--md-sys-color-outline-variant)/10">
								{isLoading ? (
									<tr>
										<td colSpan={4} className="px-6 py-20 text-center">
											<div className="flex flex-col items-center gap-4">
												<div className="w-12 h-12 border-4 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
												<p className="text-xl font-bold opacity-60">
													Анализ журналов...
												</p>
											</div>
										</td>
									</tr>
								) : logs.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="px-6 py-20 text-center text-xl font-bold opacity-40"
										>
											Журнал пуст
										</td>
									</tr>
								) : (
									logs.map((log) => (
										<tr
											key={log.id}
											className="hover:bg-(--md-sys-color-surface-container-lowest) transition-colors group"
										>
											<td className="px-6 py-5">
												<div className="flex items-center gap-3">
													<div className="p-2 rounded-xl bg-(--md-sys-color-surface-container-highest)">
														{getIcon(log.action)}
													</div>
													<div>
														<p className="font-bold text-(--md-sys-color-on-surface)">
															{actionLabels[log.action] || log.action}
														</p>
														{log.details && (
															<p className="text-xs text-(--md-sys-color-on-surface-variant) opacity-60 line-clamp-1 max-w-xs">
																{log.details}
															</p>
														)}
													</div>
												</div>
											</td>
											<td className="px-6 py-5">
												<div className="flex items-center gap-2 font-medium">
													<User className="w-4 h-4 opacity-40" />
													<span
														className={
															log.userId === 'admin'
																? 'text-(--md-sys-color-primary) font-black'
																: ''
														}
													>
														{log.userId}
													</span>
												</div>
											</td>
											<td className="px-6 py-5 text-sm font-mono opacity-70">
												{log.resourceType}: {log.resourceId || '—'}
											</td>
											<td className="px-6 py-5 whitespace-nowrap">
												<div className="flex items-center gap-2 text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity">
													<Clock className="w-4 h-4" />
													{new Date(log.timestamp).toLocaleString(
														'ru-RU',
													)}
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
