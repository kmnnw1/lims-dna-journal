'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';

// Для иконок вместо @heroicons/react используем локальные svg компоненты или stub-заглушки (замените по мере необходимости)
const MagnifyingGlassIcon = (props: any) => <span {...props}>🔍</span>;
const PlusIcon = (props: any) => <span {...props}>＋</span>;
const ArrowRightOnRectangleIcon = (props: any) => <span {...props}>⏏️</span>;
const StarIcon = (props: any) => <span {...props}>⭐</span>;
const TableCellsIcon = (props: any) => <span {...props}>▦</span>;
const Cog8ToothIcon = (props: any) => <span {...props}>⚙️</span>;
const FunnelIcon = (props: any) => <span {...props}>⏳</span>;
const CommandLineIcon = (props: any) => <span {...props}>⌨️</span>;
const ChevronLeftIcon = (props: any) => <span {...props}>◀️</span>;
const ChevronRightIcon = (props: any) => <span {...props}>▶️</span>;


// Наши новые компоненты
import { StatsCards } from './components/StatsCards';
import { SpecimenTable } from './components/SpecimenTable';
import { AddSpecimenModal } from './components/Modals/AddSpecimenModal';
import { EditSpecimenModal } from './components/Modals/EditSpecimenModal';

export default function JournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	
	// Состояние данных
	const [specimens, setSpecimens] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	
	// Пагинация и серверный тотал
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalGlobal, setTotalGlobal] = useState(0);

	// Фильтры и поиск
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 400); // Чуть увеличили паузу, чтобы не спамить сервер
	
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Модалки
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<any | null>(null);

	// Если меняем поиск или фильтр - сбрасываем на первую страницу
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, filterType, sortConfig]);

	const fetchSpecimens = async () => {
		setLoading(true);
		try {
			// Строим параметры для нового серверного API
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '50', // Грузим по 50 штук
				search: debouncedSearch,
				filter: filterType,
				sortBy: sortConfig?.key || 'id',
				sortOrder: sortConfig?.direction || 'asc'
			});

			const res = await fetch(`/api/specimens?${params.toString()}`);
			const data = await res.json();
			
			if (data && Array.isArray(data.specimens)) {
				setSpecimens(data.specimens);
				setTotalPages(data.totalPages || 1);
				setTotalGlobal(data.total || 0);
			} else if (Array.isArray(data)) {
				setSpecimens(data);
			} else {
				console.error('API вернул неожиданный формат:', data);
				setSpecimens([]);
			}
		} catch (error) {
			console.error('Ошибка загрузки:', error);
			setSpecimens([]);
		} finally {
			setLoading(false);
		}
	};

	// Слушаем изменения зависимостей для загрузки
	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
		if (status === 'authenticated') fetchSpecimens();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, page, debouncedSearch, filterType, sortConfig]);

	// Статистика (смешанная: глобальная из БД + детали по текущей странице)
	const stats = useMemo(() => {
		const list = Array.isArray(specimens) ? specimens : [];
		return {
			total: totalGlobal, // Показываем реальное количество всех проб в базе
			successful: list.filter(s => s.itsStatus === '✓').length,
			others: list.filter(s => s.itsStatus !== '✓').length
		};
	}, [specimens, totalGlobal]);

	const handleSort = (key: string) => {
		setSortConfig(current => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const handleAddSave = async (data: any) => {
		try {
			await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});
		} finally {
			setIsAddModalOpen(false);
			fetchSpecimens();
		}
	};

	const handleEditSave = async (id: string, data: any) => {
		try {
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, ...data })
			});
		} finally {
			setEditingSpecimen(null);
			fetchSpecimens();
		}
	};

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans selection:bg-teal-500/30 pb-32">
			<div className="max-w-[1600px] mx-auto">
				{/* Header */}
				<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20">
							<TableCellsIcon className="w-8 h-8 text-white" />
						</div>
						<div>
							<h1 className="text-3xl font-black tracking-tight text-white">База Проб</h1>
							<p className="text-slate-500 text-sm font-medium">Доступ: {session?.user?.name || 'Администратор'}</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
						<div className="relative flex-1 md:w-64 lg:w-80">
							<MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
							<input
								id="main-search"
								type="text"
								placeholder="Поиск по ID или таксону..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-teal-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600"
							/>
						</div>

						<button className="hidden lg:flex items-center gap-2 px-4 py-3.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-medium text-sm">
							<CommandLineIcon className="w-5 h-5" />
							<span>Клавиши</span>
						</button>
						
						<button className="hidden lg:flex items-center gap-2 px-4 py-3.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-medium text-sm">
							<FunnelIcon className="w-5 h-5" />
							<span>Умный фильтр</span>
						</button>

						<button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl transition-all font-bold shadow-lg shadow-teal-900/20 active:scale-95">
							<PlusIcon className="w-5 h-5" />
							<span className="hidden sm:inline">Новая проба</span>
						</button>

						<Link href="/admin" className="flex items-center gap-2 px-5 py-3.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all font-bold shadow-lg">
							<Cog8ToothIcon className="w-5 h-5" />
							<span className="hidden sm:inline">Админ</span>
						</Link>

						<button onClick={() => signOut()} title="Выйти" className="p-3.5 bg-slate-800/50 border border-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all">
							<ArrowRightOnRectangleIcon className="w-5 h-5" />
						</button>
					</div>
				</header>

				<StatsCards {...stats} />

				{/* Filter Toolbar */}
				<div className="flex items-center gap-2 mb-6">
					{(['all', 'success', 'error', 'fav'] as const).map((type) => (
						<button
							key={type}
							onClick={() => setFilterType(type)}
							className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
								filterType === type ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
							}`}
						>
							{type === 'all' && 'Все'}
							{type === 'success' && 'Успешные'}
							{type === 'error' && 'С ошибками'}
							{type === 'fav' && <div className="flex items-center gap-1"><StarIcon className="w-3.5 h-3.5" /> Избранное</div>}
						</button>
					))}
				</div>

				<SpecimenTable 
					specimens={specimens} // Передаем чистые данные с сервера
					loading={loading}
					selectedIds={selectedIds}
					onSelect={(id) => {
						const newSet = new Set(selectedIds);
						newSet.has(id) ? newSet.delete(id) : newSet.add(id);
						setSelectedIds(newSet);
					}}
					onSelectAll={(ids) => {
						setSelectedIds(selectedIds.size === ids.length ? new Set() : new Set(ids));
					}}
					onEdit={setEditingSpecimen}
					onPcr={() => {}} 
					onStatusClick={() => {}}
					searchQuery={debouncedSearch}
					sortConfig={sortConfig}
					onSort={handleSort}
				/>

				{/* Пагинация */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-6 bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl">
						<button
							onClick={() => setPage(p => Math.max(1, p - 1))}
							disabled={page === 1 || loading}
							className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
						>
							<ChevronLeftIcon className="w-4 h-4" />
							Назад
						</button>
						
						<span className="text-slate-400 text-sm font-medium">
							Страница <span className="text-slate-100 font-bold">{page}</span> из {totalPages}
						</span>

						<button
							onClick={() => setPage(p => Math.min(totalPages, p + 1))}
							disabled={page === totalPages || loading}
							className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
						>
							Вперёд
							<ChevronRightIcon className="w-4 h-4" />
						</button>
					</div>
				)}
			</div>

			<AddSpecimenModal 
				isOpen={isAddModalOpen} 
				onClose={() => setIsAddModalOpen(false)} 
				onSave={handleAddSave} 
			/>
			
			<EditSpecimenModal 
				specimen={editingSpecimen} 
				onClose={() => setEditingSpecimen(null)} 
				onSave={handleEditSave} 
			/>

			{/* Панель массовых действий */}
			{selectedIds.size > 0 && (
				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-800/90 backdrop-blur-xl border border-teal-500/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-teal-900/20 z-40 animate-in slide-in-from-bottom-4">
					<div className="flex items-center gap-3">
						<span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm">
							{selectedIds.size}
						</span>
						<span className="text-teal-100 font-medium">проб выбрано</span>
					</div>
					<div className="flex gap-2">
						<button 
							onClick={() => setSelectedIds(new Set())}
							className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
						>
							Сбросить
						</button>
						<button className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg">
							Массовое действие
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
