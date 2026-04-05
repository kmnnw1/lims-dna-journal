'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

// Наши компоненты
import { StatsCards } from './components/StatsCards';
import { SpecimenTable } from './components/SpecimenTable';
import { AddSpecimenModal } from './components/Modals/AddSpecimenModal';
import { EditSpecimenModal } from './components/Modals/EditSpecimenModal';

export default function JournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	
	const [specimens, setSpecimens] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 300);
	
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<any | null>(null);

	const fetchSpecimens = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/specimens');
			const data = await res.json();
			// ЗАЩИТА: проверяем, что данные — это массив
			if (Array.isArray(data)) {
				setSpecimens(data);
			} else {
				console.error('API вернул не массив:', data);
				setSpecimens([]);
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
	}, [status]);

	// Логика фильтрации с защитой
	const filteredSpecimens = useMemo(() => {
		// ЗАЩИТА: если specimens вдруг не массив, возвращаем пустой список
		if (!Array.isArray(specimens)) return [];

		let result = specimens.filter(s => 
			(s.id && s.id.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
			(s.taxon && s.taxon.toLowerCase().includes(debouncedSearch.toLowerCase()))
		);

		if (filterType === 'success') result = result.filter(s => s.itsStatus === '✓');
		if (filterType === 'error') result = result.filter(s => s.itsStatus === '✕');
		
		if (sortConfig) {
			result.sort((a, b) => {
				const valA = a[sortConfig.key] || '';
				const valB = b[sortConfig.key] || '';
				if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
				if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
				return 0;
			});
		}
		return result;
	}, [specimens, debouncedSearch, filterType, sortConfig]);

	const stats = useMemo(() => {
		const list = Array.isArray(specimens) ? specimens : [];
		return {
			total: list.length,
			successful: list.filter(s => s.itsStatus === '✓').length,
			others: list.filter(s => s.itsStatus !== '✓').length
		};
	}, [specimens]);

	const handleSort = (key: string) => {
		setSortConfig(current => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const handleAddSave = async (data: any) => {
		const res = await fetch('/api/specimens', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (res.ok) {
			setIsAddModalOpen(false);
			fetchSpecimens();
		}
	};

	const handleEditSave = async (id: string, data: any) => {
		const res = await fetch(`/api/specimens?id=${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		if (res.ok) {
			setEditingSpecimen(null);
			fetchSpecimens();
		}
	};

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans selection:bg-teal-500/30">
			<div className="max-w-[1600px] mx-auto">
				<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20">
							{/* Removed TableCellsIcon: component not found */}
						</div>
						<div>
							<h1 className="text-3xl font-black tracking-tight text-white">База Проб</h1>
							<p className="text-slate-500 text-sm font-medium">Доступ: {session?.user?.name || 'Администратор'}</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
						<div className="relative flex-1 md:w-80">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none inline-flex items-center justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<circle cx="11" cy="11" r="7" strokeWidth="2" />
									<line x1="16.65" y1="16.65" x2="21" y2="21" strokeWidth="2" strokeLinecap="round" />
								</svg>
							</span>
							<input
								id="main-search"
								type="text"
								placeholder="Поиск по ID или таксону..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-teal-500/50 transition-all outline-none text-sm font-medium placeholder:text-slate-600"
							/>
						</div>
						<button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl transition-all font-bold shadow-lg shadow-teal-900/20 active:scale-95">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5"/>
							</svg>
							<span>Новая проба</span>
						</button>
						<button onClick={() => signOut()} className="p-3.5 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-2xl transition-all">
							{/* Replaced ArrowRightOnRectangleIcon with an inline SVG */}
							<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
								<path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/>
							</svg>
						</button>
					</div>
				</header>

				<StatsCards {...stats} />

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
							{type === 'fav' && (
								<div className="flex items-center gap-1">
									<svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z"/>
									</svg>
									Избранное
								</div>
							)}
						</button>
					))}
				</div>

				<SpecimenTable 
					specimens={filteredSpecimens.slice(0, 100)} 
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
		</main>
	);
}
