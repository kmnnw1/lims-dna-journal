'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Specimen } from '@/types';

export function useJournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [specimens, setSpecimens] = useState<Specimen[]>([]);
	const [loading, setLoading] = useState(true);
	const [theme, setTheme] = useState<'light' | 'dark' | 'monet'>('light');

	// Theme initialization & sync
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'monet' | null;
		if (saved) {
			setTheme(saved);
			document.documentElement.classList.remove('dark', 'monet');
			if (saved !== 'light') document.documentElement.classList.add(saved);
		} else {
			const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (sysDark) {
				setTheme('dark');
				document.documentElement.classList.add('dark');
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		document.documentElement.classList.remove('dark', 'monet');
		if (theme !== 'light') document.documentElement.classList.add(theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalGlobal, setTotalGlobal] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 400);
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
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
		result: 'Success' as 'Success' | 'Failed',
	});

	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, filterType, sortConfig]);

	const fetchSpecimens = useCallback(async () => {
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
		} catch {
			setSpecimens([]);
		} finally {
			setLoading(false);
		}
	}, [page, debouncedSearch, filterType, sortConfig]);

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
		if (status === 'authenticated') fetchSpecimens();
	}, [status, fetchSpecimens, router]);

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

	const handleSignOut = () => {
		signOut();
	};

	const handleAddSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRecordData),
			});
			if (!res.ok) {
				const error = await res.json();
				setToastMessage({ text: error.error || 'Ошибка сохранения', type: 'error' });
				return;
			}
		} catch (error) {
			setToastMessage({ text: 'Ошибка сети. Проверьте подключение.', type: 'error' });
			return;
		}
		setIsAddModalOpen(false);
		setToastMessage({ text: 'Проба успешно добавлена', type: 'success' });
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
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingSpecimen) return;
		try {
			const { id, ...rest } = editingSpecimen;
			const res = await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, ...rest }),
			});
			if (!res.ok) {
				const error = await res.json();
				setToastMessage({ text: error.error || 'Ошибка редактирования', type: 'error' });
				return;
			}
		} catch (error) {
			setToastMessage({ text: 'Ошибка сети. Проверьте подключение.', type: 'error' });
			return;
		}
		setEditingSpecimen(null);
		setToastMessage({ text: 'Проба успешно обновлена', type: 'success' });
		fetchSpecimens();
	};

	const handlePcrSubmit = async () => {
		if (!activePcrSpecimen) return;
		try {
			const res = await fetch('/api/pcr', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					specimenId: activePcrSpecimen.id,
					...pcrForm,
					date: new Date().toISOString(),
				}),
			});
			if (!res.ok) {
				const error = await res.json();
				setToastMessage({ text: `Ошибка ПЦР: ${error.error}`, type: 'error' });
				return;
			}
		} catch (error) {
			setToastMessage({ text: `Ошибка сети: ${error}`, type: 'error' });
			return;
		}
		setActivePcrSpecimen(null);
		fetchSpecimens();
	};

	const handleStatusToggle = async (id: string, marker: string) => {
		const specimen = specimens.find((s) => s.id === id);
		if (!specimen) return;

		let statusKey: keyof Specimen = 'itsStatus';
		if (marker === 'SSU') statusKey = 'ssuStatus';
		else if (marker === 'LSU') statusKey = 'lsuStatus';
		else if (marker === 'MCM7') statusKey = 'mcm7Status';

		const currentStatus = specimen[statusKey];
		const newStatus: string | null =
			currentStatus === '✓'
				? '✕'
				: currentStatus === '✕'
					? '?'
					: currentStatus === '?'
						? null
						: '✓';

		setSpecimens((prev) => prev.map((s) => (s.id === id ? { ...s, [statusKey]: newStatus } : s)));
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

	const handleExportCSV = () => {
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			'ID,Taxon,Locality,ITS,SSU,LSU,MCM7\n' +
			specimens
				.map((s) =>
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

	const handleExportXLSX = async () => {
		try {
			const ExcelJS = (await import('exceljs')).default;
			const workbook = new ExcelJS.Workbook();
			const sheet = workbook.addWorksheet('Пробы');
			
			sheet.columns = [
				{ header: 'ID', key: 'id', width: 10 },
				{ header: 'Таксон', key: 'taxon', width: 25 },
				{ header: 'Локализация', key: 'locality', width: 25 },
				{ header: 'ITS', key: 'itsStatus', width: 10 },
				{ header: 'SSU', key: 'ssuStatus', width: 10 },
				{ header: 'LSU', key: 'lsuStatus', width: 10 },
				{ header: 'MCM7', key: 'mcm7Status', width: 10 },
			];

			specimens.forEach((s) => {
				sheet.addRow({
					id: s.id,
					taxon: s.taxon || '',
					locality: s.locality || '',
					itsStatus: s.itsStatus || '',
					ssuStatus: s.ssuStatus || '',
					lsuStatus: s.lsuStatus || '',
					mcm7Status: s.mcm7Status || '',
				});
			});

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			setToastMessage({ text: 'Ошибка при формировании XLSX', type: 'error' });
		}
	};

	const handlePrintLabels = () => {
		alert('Функция печати этикеток будет реализована позже.');
	};

	return {
		session,
		status,
		specimens,
		loading,
		theme,
		setTheme,
		page,
		totalPages,
		totalGlobal,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortConfig,
		setSortConfig,
		selectedIds,
		setSelectedIds,
		isAddModalOpen,
		setIsAddModalOpen,
		editingSpecimen,
		setEditingSpecimen,
		activePcrSpecimen,
		setActivePcrSpecimen,
		isBatchModalOpen,
		setIsBatchModalOpen,
		isScanOpen,
		setIsScanOpen,
		newRecordData,
		setNewRecordData,
		pcrForm,
		setPcrForm,
		stats,
		handleSort,
		handleAddSubmit,
		handleEditSubmit,
		handlePcrSubmit,
		handleStatusToggle,
		handleExportCSV,
		handleExportXLSX,
		handlePrintLabels,
		handleSignOut,
		fetchSpecimens,
		setPage,
		toastMessage,
		setToastMessage,
	};
}
