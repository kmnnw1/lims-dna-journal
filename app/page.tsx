'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { Star, Download, Camera, Printer } from 'lucide-react';
import type { Specimen } from '@/types';

import { JournalHeader } from '@/components/features/JournalHeader';
import { StatsCards } from '@/components/features/StatsCards';
import { SpecimenTable } from '@/components/features/SpecimenTable';
import { AddSpecimenModal } from '@/components/features/AddSpecimenModal';
import { EditSpecimenModal } from '@/components/features/EditSpecimenModal';
import { PcrModal } from '@/components/features/PCRModal';
import BatchPcrModal from '@/components/features/BatchPCRModal';
import { BarcodeScanDialog } from '@/components/features/BarcodeScanDialog';

export default function JournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [specimens, setSpecimens] = useState<Specimen[]>([]);
	const [loading, setLoading] = useState(true);
	const [isDark, setIsDark] = useState(false);

	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalGlobal, setTotalGlobal] = useState(0);

	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 400);

	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
		null,
	);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<Specimen | null>(null);
	const [activePcrSpecimen, setActivePcrSpecimen] = useState<Specimen | null>(null);
	const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
	const [isScanOpen, setIsScanOpen] = useState(false);

	const [newRecordData, setNewRecordData] = useState({
		id: '',
		taxon: '',
		locality: '',
		extrLab: '',
		extrOperator: '',
		extrMethod: '',
		extrDateRaw: '',
	});
	const [pcrForm, setPcrForm] = useState({
		volume: '25',
		marker: '',
		forwardPrimer: '',
		reversePrimer: '',
		dnaMatrix: '',
		result: 'Success' as const,
	});

	useEffect(() => {
		if (isDark) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	}, [isDark]);

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
				sortOrder: sortConfig?.direction || 'asc',
			});
			const res = await fetch(`/api/specimens?${params.toString()}`);
			const data = await res.json();

			if (data && Array.isArray(data.specimens)) {
				setSpecimens(data.specimens);
				setTotalPages(data.totalPages || 1);
				setTotalGlobal(data.total || 0);
			}
		} catch (error) {
			setSpecimens([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
		if (status === 'authenticated') fetchSpecimens();
	}, [status, page, debouncedSearch, filterType, sortConfig]);

	const stats = useMemo(() => {
		const list = Array.isArray(specimens) ? specimens : [];
		return {
			total: totalGlobal,
			successful: list.filter((s) => s.itsStatus === '✓').length,
			others: list.filter((s) => s.itsStatus !== '✓').length,
		};
	}, [specimens, totalGlobal]);

	const handleSort = (key: string) => {
		setSortConfig((curr) => ({
			key,
			direction: curr?.key === key && curr.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRecordData),
			});
		} finally {
			setIsAddModalOpen(false);
			setNewRecordData({
				id: '',
				taxon: '',
				locality: '',
				extrLab: '',
				extrOperator: '',
				extrMethod: '',
				extrDateRaw: '',
			});
			fetchSpecimens();
		}
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingSpecimen) return;
		try {
			const { id, ...rest } = editingSpecimen;
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, ...rest }),
			});
		} finally {
			setEditingSpecimen(null);
			fetchSpecimens();
		}
	};

	const handlePcrSubmit = async () => {
		if (!activePcrSpecimen) return;
		try {
			await fetch('/api/pcr', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					specimenId: activePcrSpecimen.id,
					...pcrForm,
					date: new Date().toISOString(),
				}),
			});
		} finally {
			setActivePcrSpecimen(null);
			fetchSpecimens();
		}
	};

	const handleStatusToggle = async (id: string, marker: string) => {
		const specimen = specimens.find((s) => s.id === id);
		if (!specimen) return;

		let statusKey: keyof Specimen = 'itsStatus';
		if (marker === 'SSU') statusKey = 'ssuStatus';
		else if (marker === 'LSU') statusKey = 'lsuStatus';
		else if (marker === 'MCM7') statusKey = 'mcm7Status';

		const currentStatus = specimen[statusKey];
		let newStatus: string | null =
			currentStatus === '✓'
				? '✕'
				: currentStatus === '✕'
					? '?'
					: currentStatus === '?'
						? null
						: '✓';

		setSpecimens((prev) =>
			prev.map((s) => (s.id === id ? { ...s, [statusKey]: newStatus } : s)),
		);
		try {
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ singleId: id, updateData: { [statusKey]: newStatus } }),
			});
		} catch {
			fetchSpecimens();
		}
	};

	const handleExportExcel = () => {
		// Простой экспорт в CSV для Евгения
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			'ID,Taxon,Locality,ITS,SSU,LSU,MCM7\n' +
			specimens
				.map(
					(s) =>
						`${s.id},${s.taxon || ''},${s.locality || ''},${s.itsStatus || ''},${s.ssuStatus || ''},${s.lsuStatus || ''},${s.mcm7Status || ''}`,
				)
				.join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handlePrintLabels = () => {
		// Генерация этикеток для выбранных проб
		const idsToPrint = Array.from(selectedIds);
		const printWindow = window.open('', '_blank');
		if (printWindow) {
			printWindow.document.write(`
                <html>
                <head>
                    <title>Печать этикеток</title>
                    <style>
                        body { font-family: monospace; margin: 0; padding: 10px; }
                        .label { border: 1px solid #000; padding: 10px; margin-bottom: 10px; width: 200px; text-align: center; }
                        .id { font-size: 24px; font-weight: bold; }
                        .barcode { font-size: 12px; margin-top: 5px; }
                    </style>
                </head>
                <body>
                    ${idsToPrint
						.map(
							(id) => `
                        <div class="label">
                            <div class="id">${id}</div>
                            <div class="barcode">*${id}*</div>
                        </div>
                    `,
						)
						.join('')}
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                </body>
                </html>
            `);
			printWindow.document.close();
		}
	};

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] p-4 md:p-8 pb-32 transition-colors duration-300">
			<div className="max-w-[1600px] mx-auto">
				<JournalHeader
					userName={session?.user?.name || 'Администратор'}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					onAddClick={() => setIsAddModalOpen(true)}
					onSignOut={() => signOut()}
					isDark={isDark}
					setIsDark={setIsDark}
				/>

				<div className="flex flex-wrap items-center gap-3 mb-6">
					<button
						onClick={() => setIsScanOpen(true)}
						className="flex items-center gap-2 px-5 py-2.5 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-[1rem] font-medium hover:shadow-md transition-all active:scale-95">
						<Camera className="w-5 h-5" /> Сканировать (Штрихкод)
					</button>
					<button
						onClick={handleExportExcel}
						className="flex items-center gap-2 px-5 py-2.5 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[1rem] font-medium hover:shadow-md transition-all active:scale-95">
						<Download className="w-5 h-5" /> Выгрузить CSV
					</button>
				</div>

				<StatsCards {...stats} />

				<div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
					{(['all', 'success', 'error', 'fav'] as const).map((type) => (
						<button
							key={type}
							onClick={() => setFilterType(type)}
							className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border border-[var(--md-sys-color-outline-variant)] ${filterType === type ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-transparent' : 'bg-transparent text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'}`}>
							{type === 'all' && 'Все пробы'}
							{type === 'success' && 'Успешные'}
							{type === 'error' && 'С ошибками'}
							{type === 'fav' && (
								<span className="flex items-center gap-1">
									<Star className="w-4 h-4" /> Избранное
								</span>
							)}
						</button>
					))}
				</div>

				<SpecimenTable
					specimens={specimens}
					loading={loading}
					selectedIds={selectedIds}
					onSelect={(id) => {
						const n = new Set(selectedIds);
						n.has(id) ? n.delete(id) : n.add(id);
						setSelectedIds(n);
					}}
					onSelectAll={(ids) =>
						setSelectedIds(selectedIds.size === ids.length ? new Set() : new Set(ids))
					}
					onEdit={setEditingSpecimen}
					onPcr={setActivePcrSpecimen}
					onStatusClick={handleStatusToggle}
					searchQuery={debouncedSearch}
					sortConfig={sortConfig}
					onSort={handleSort}
				/>
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
				specimen={editingSpecimen as any}
				onClose={() => setEditingSpecimen(null)}
				onChange={setEditingSpecimen as any}
				onSubmit={handleEditSubmit}
			/>
			<PcrModal
				open={!!activePcrSpecimen}
				specimenId={activePcrSpecimen?.id || ''}
				activeSpecimen={activePcrSpecimen}
				onClose={() => setActivePcrSpecimen(null)}
				pcrForm={pcrForm}
				setPcrForm={setPcrForm as any}
				onSubmit={handlePcrSubmit}
				isReader={session?.user?.role === 'READER'}
			/>

			{isBatchModalOpen && (
				<BatchPcrModal
					selectedSpecimenIds={Array.from(selectedIds)}
					onClose={() => {
						setIsBatchModalOpen(false);
						setSelectedIds(new Set());
						fetchSpecimens();
					}}
				/>
			)}

			<BarcodeScanDialog
				open={isScanOpen}
				onClose={() => setIsScanOpen(false)}
				onCode={(code) => {
					setSearchQuery(code);
					setIsScanOpen(false);
				}}
			/>

			{selectedIds.size > 0 && (
				<div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-[1.5rem] p-4 flex items-center justify-between shadow-2xl z-50">
					<div className="flex items-center gap-4 pl-2">
						<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--md-sys-color-inverse-primary)] text-[var(--md-sys-color-primary)] font-bold text-sm">
							{selectedIds.size}
						</span>
						<span className="font-medium">выбрано</span>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handlePrintLabels}
							className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors flex items-center gap-2">
							<Printer className="w-4 h-4" /> Печать
						</button>
						<button
							onClick={() => setSelectedIds(new Set())}
							className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors">
							Сбросить
						</button>
						<button
							onClick={() => setIsBatchModalOpen(true)}
							className="px-6 py-2.5 bg-[var(--md-sys-color-inverse-primary)] text-[var(--md-sys-color-primary)] hover:brightness-110 text-sm font-medium rounded-full transition-all">
							Действия
						</button>
					</div>
				</div>
			)}
		</main>
	);
}
