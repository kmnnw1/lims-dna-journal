'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { Search, Plus, Settings, LogOut, Keyboard, Filter } from 'lucide-react';

// Правильные импорты! (Используем обновленные компоненты из корня)
import { StatsCards } from '@/components/features/StatsCards';
import { SpecimenTable } from '@/components/features/SpecimenTable';
import { AddSpecimenModal } from '@/components/features/AddSpecimenModal';
import { EditSpecimenModal } from '@/components/features/EditSpecimenModal';


export default function JournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	
	const [specimens, setSpecimens] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalGlobal, setTotalGlobal] = useState(0);

	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 400); 
	
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<any | null>(null);
	const [newRecordData, setNewRecordData] = useState({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });

	const [isPcrModalOpen, setIsPcrModalOpen] = useState(false);
	const [selectedSpecimen, setSelectedSpecimen] = useState<any>(null);

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, filterType, sortConfig]);

	const fetchSpecimens = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '50',
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
			}
		} catch (error) {
			console.error('Ошибка загрузки:', error);
			setSpecimens([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
		if (status === 'authenticated') fetchSpecimens();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status, page, debouncedSearch, filterType, sortConfig]);

	const stats = useMemo(() => {
		const list = Array.isArray(specimens) ? specimens : [];
		return {
			total: totalGlobal, 
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

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRecordData)
			});
		} finally {
			setIsAddModalOpen(false);
			setNewRecordData({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });
			fetchSpecimens();
		}
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingSpecimen) return;
		try {
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: editingSpecimen.id, ...editingSpecimen })
			});
		} finally {
			setEditingSpecimen(null);
			fetchSpecimens();
		}
	};

	const handleStatusToggle = async (id: string, marker: string) => {
		if (marker !== 'ITS') return; 
		const specimen = specimens.find(s => s.id === id);
		if (!specimen) return;

		let newStatus: string | null = '✓';
		if (specimen.itsStatus === '✓') newStatus = '✕';
		else if (specimen.itsStatus === '✕') newStatus = null;

		try {
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ singleId: id, singleStatus: newStatus })
			});
			fetchSpecimens();
		} catch (error) {}
	};




	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] p-4 md:p-8 pb-32 transition-colors duration-300">
			<div className="max-w-[1600px] mx-auto">
				
				<header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
					<div className="flex items-center gap-5">
						<div className="w-14 h-14 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-[1.25rem] shadow-sm flex items-center justify-center text-xl font-black">
							ДНК
							</div>
						<div>
							<h1 className="text-4xl font-normal tracking-tight">Журнал Проб</h1>
							<p className="text-[var(--md-sys-color-outline)] text-sm font-medium mt-1">
								Доступ: {session?.user?.name || 'Администратор'}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
						<div className="relative flex-1 xl:w-80 group">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md-sys-color-outline)] group-focus-within:text-[var(--md-sys-color-primary)] transition-colors" />
							<input
								type="text"
								placeholder="Поиск по ID или таксону..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-12 pr-4 py-4 bg-[var(--md-sys-color-surface-container-high)] rounded-full outline-none text-base placeholder:text-[var(--md-sys-color-outline)] transition-all border-2 border-transparent focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface)]"
							/>
						</div>

						<button className="hidden lg:flex items-center gap-2 px-5 py-4 bg-[var(--md-sys-color-surface)] hover:shadow-md rounded-full transition-all font-medium text-sm shadow-sm">
  <Keyboard className="w-5 h-5" /> Клавиши
</button>

<button className="hidden lg:flex items-center gap-2 px-5 py-4 bg-[var(--md-sys-color-surface)] hover:shadow-md rounded-full transition-all font-medium text-sm shadow-sm">
  <Filter className="w-5 h-5" /> Умный фильтр
</button>

<button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:shadow-lg rounded-[1rem] transition-all font-medium active:scale-95 shadow-md">
  <Plus className="w-6 h-6" />
  <span className="hidden sm:inline">Новая проба</span>
</button>

<Link href="/admin" className="flex items-center gap-2 px-5 py-4 bg-[var(--md-sys-color-secondary-container)] hover:shadow-md rounded-[1rem] transition-all font-medium shadow-sm">
  <Settings className="w-5 h-5" />
  <span className="hidden sm:inline">Админ</span>
</Link>

					

						<button onClick={() => signOut()} title="Выйти" className="p-4 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] rounded-full transition-all flex items-center justify-center">
							<LogOut className="w-5 h-5" />
						</button>
					</div>
				</header>

				<StatsCards {...stats} />

				<div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
					{(['all', 'success', 'error', 'fav'] as const).map((type) => {
						const isSelected = filterType === type;
						return (
							<button
								key={type}
								onClick={() => setFilterType(type)}
								className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border border-[var(--md-sys-color-outline-variant)]
  ${isSelected 
    ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-transparent' 
    : 'bg-transparent text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
  }`}
							>
								{type === 'all' && 'Все пробы'}
								{type === 'success' && 'Успешные'}
								{type === 'error' && 'С ошибками'}
								{type === 'fav' && 'Избранное'}
							</button>
						);
					})}
				</div>

				<SpecimenTable 
					specimens={specimens} 
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
					onPcr={() =>{}}
					onStatusClick={handleStatusToggle}
					searchQuery={debouncedSearch}
					sortConfig={sortConfig}
					onSort={handleSort}
				/>

				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-8 bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-[1.5rem]">
						<button
							onClick={() => setPage(p => Math.max(1, p - 1))}
							disabled={page === 1 || loading}
							className="px-6 py-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] disabled:opacity-40 rounded-full text-sm font-medium transition-all"
						>
							Назад
						</button>
						
						<span className="text-[var(--md-sys-color-outline)] text-sm font-medium">
							Страница <span className="text-[var(--md-sys-color-on-surface)] font-bold">{page}</span> из {totalPages}
						</span>

						<button
							onClick={() => setPage(p => Math.min(totalPages, p + 1))}
							disabled={page === totalPages || loading}
							className="px-6 py-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container-high)] disabled:opacity-40 rounded-full text-sm font-medium transition-all"
						>
							Вперёд
						</button>
					</div>
				)}
			</div>

			<AddSpecimenModal 
				open={isAddModalOpen} 
				onClose={() => setIsAddModalOpen(false)} 
				newRecord={newRecordData as any} 
				setNewRecord={setNewRecordData as any} 
				onSubmit={handleAddSubmit} 
				validationError={false} 
			/>
			
			<EditSpecimenModal 
				specimen={editingSpecimen} 
				onClose={() => setEditingSpecimen(null)} 
				onChange={setEditingSpecimen}
				onSubmit={handleEditSubmit} 
			/>
			

			{selectedIds.size > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-[1.5rem] p-4 flex items-center justify-between shadow-2xl z-40 animate-in slide-in-from-bottom-8">
					<div className="flex items-center gap-4 pl-2">
						<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--md-sys-color-inverse-primary)] text-[var(--md-sys-color-primary)] font-bold text-sm">
							{selectedIds.size}
						</span>
						<span className="font-medium">выбрано</span>
					</div>
					<div className="flex gap-2">
						<button 
							onClick={() => setSelectedIds(new Set())}
							className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors"
						>
							Сбросить
						</button>
						<button className="px-6 py-2.5 bg-[var(--md-sys-color-inverse-primary)] text-[var(--md-sys-color-primary)] hover:brightness-110 text-sm font-medium rounded-full transition-all">
							Действия
						</button>
					</div>
				</div>
			)}
			
			
		</main>
	);
}
