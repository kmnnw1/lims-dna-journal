'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatOperatorName } from '@/lib/utils';
import type { Specimen } from '@/types';

export function useJournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [page, setPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedSearch = useDebounce(searchQuery, 400);
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
		null,
	);
	const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'fav'>('all');
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [toastMessage, setToastMessage] = useState<{
		text: string;
		type: 'error' | 'success';
	} | null>(null);

	const [minConc, setMinConc] = useState<number | null>(null);
	const [maxConc, setMaxConc] = useState<number | null>(null);
	const [selectedOperator, setSelectedOperator] = useState<string>('');
	const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<Specimen | null>(null);
	const [activePCRSpecimen, setActivePCRSpecimen] = useState<Specimen | null>(null);
	const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
	const [isScanOpen, setIsScanOpen] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const [newRecordData, setNewRecordData] = useState({
		id: '',
		taxon: '',
		locality: '',
		extrLab: '',
		extrOperator: '',
		extrMethod: '',
		extrDateRaw: '',
	});

	const [pcrForm, setPCRForm] = useState<{
		volume: string;
		marker: string;
		forwardPrimer: string;
		reversePrimer: string;
		dnaMatrix: string;
		result: 'Success' | 'Failed';
		id?: string;
	}>({
		volume: '25',
		marker: '',
		forwardPrimer: '',
		reversePrimer: '',
		dnaMatrix: '',
		result: 'Success',
	});

	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Hotkeys
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsCommandPaletteOpen((prev) => !prev);
			}
			if (e.key === 'n' && e.altKey) {
				e.preventDefault();
				setIsAddModalOpen(true);
			}
			if (e.key === '/') {
				if (
					document.activeElement?.tagName !== 'INPUT' &&
					document.activeElement?.tagName !== 'TEXTAREA'
				) {
					e.preventDefault();
					searchInputRef.current?.focus();
				}
			}
			if (e.key === 'Escape') {
				setSearchQuery('');
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Физическое определение мобильного устройства
	const [isMobileDevice, setIsMobileDevice] = useState(false);
	useEffect(() => {
		const checkMobile = () => {
			setIsMobileDevice(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const { data, isLoading: loading } = useQuery({
		queryKey: [
			'specimens',
			{
				page,
				search: debouncedSearch,
				filter: filterType,
				sortBy: sortConfig?.key,
				sortOrder: sortConfig?.direction,
				minConc,
				maxConc,
				operator: selectedOperator,
			},
		],
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '15',
				search: debouncedSearch,
				filter: filterType,
				sortBy: sortConfig?.key || 'id',
				sortOrder: sortConfig?.direction || 'asc',
			});
			if (minConc !== null) params.append('minConc', minConc.toString());
			if (maxConc !== null) params.append('maxConc', maxConc.toString());
			if (selectedOperator) params.append('operator', selectedOperator);

			const res = await fetch(`/api/specimens?${params}`);
			if (!res.ok) throw new Error('Network error');
			return res.json();
		},
	});

	const specimens = data?.specimens || [];
	const totalPages = data?.totalPages || 1;
	const totalGlobal = data?.total || 0;
	const suggestions = data?.suggestions || { labs: [], operators: [], methods: [] };

	const addMutation = useMutation({
		mutationFn: async (newRecord: typeof newRecordData) => {
			const res = await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRecord),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка при сохранении');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
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
		},
		onError: (error: Error) => {
			setValidationError(error.message);
		},
	});

	const editMutation = useMutation({
		mutationFn: async (specimen: Specimen) => {
			const res = await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(specimen),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка при обновлении');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			setEditingSpecimen(null);
		},
		onError: (error: Error) => {
			setValidationError(error.message);
		},
	});

	const pcrMutation = useMutation({
		mutationFn: async (payload: Record<string, unknown>) => {
			const res = await fetch('/api/pcr', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка ПЦР');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			setActivePCRSpecimen(null);
		},
		onError: (error: Error) => {
			setToastMessage({ text: error.message, type: 'error' });
		},
	});

	const stats = useMemo(() => {
		if (data?.stats) return data.stats;
		return {
			total: totalGlobal,
			successful: 0,
			others: 0,
		};
	}, [data?.stats, totalGlobal]);

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
		setValidationError(null);

		const { id, taxon } = newRecordData;
		if (!id.trim()) {
			setValidationError('ID пробы обязателен');
			return;
		}
		if (taxon.trim() && taxon.trim().length < 3) {
			setValidationError('Таксон должен содержать не менее 3 символов');
			return;
		}

		addMutation.mutate(newRecordData);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError(null);

		if (editingSpecimen) {
			const { taxon } = editingSpecimen;
			if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
				setValidationError('Таксон должен содержать не менее 3 символов');
				return;
			}
			editMutation.mutate(editingSpecimen);
		}
	};

	const handlePCRSubmit = async () => {
		if (activePCRSpecimen) {
			pcrMutation.mutate({
				specimenId: activePCRSpecimen.id,
				...pcrForm,
				date: new Date().toISOString(),
			});
		}
	};

	const handleStatusToggle = async (id: string, marker: string) => {
		const specimen = specimens.find((s: Specimen) => s.id === id);
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

		try {
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ singleId: id, singleStatus: newStatus }),
			});
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
		} catch {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
		}
	};

	const handleExportCSV = () => {
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			'ID,Taxon,Locality,ITS,SSU,LSU,MCM7\n' +
			specimens
				.map(
					(s: Specimen) =>
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
			specimens.forEach((s: Specimen) => {
				sheet.addRow({ ...s });
			});
			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `export_${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (_error) {
			setToastMessage({ text: 'Ошибка при формировании XLSX', type: 'error' });
		}
	};

	const handlePrintLabels = () => {
		alert('Функция печати этикеток будет реализована позже.');
	};

	useEffect(() => {
		if (status === 'unauthenticated') router.push('/login');
	}, [status, router]);

	useEffect(() => {
		if (isAddModalOpen && !newRecordData.extrOperator) {
			const user = session?.user;
			if (user?.lastName) {
				const formatted = formatOperatorName(user.firstName, user.lastName);
				setNewRecordData((prev) => ({ ...prev, extrOperator: formatted }));
			}
		}
	}, [isAddModalOpen, session, newRecordData.extrOperator]);

	return {
		session,
		status,
		specimens,
		loading:
			loading || addMutation.isPending || editMutation.isPending || pcrMutation.isPending,
		page,
		setPage,
		totalPages,
		totalGlobal,
		stats,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortConfig,
		handleSort,
		selectedIds,
		setSelectedIds,
		handleSelect: (id: string) => {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
		},
		handleSelectAll: (ids: string[]) => {
			setSelectedIds((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
		},
		toastMessage,
		setToastMessage,
		handleSignOut,
		minConc,
		setMinConc,
		maxConc,
		setMaxConc,
		selectedOperator,
		setSelectedOperator,
		isCommandPaletteOpen,
		setIsCommandPaletteOpen,
		isAddModalOpen,
		setIsAddModalOpen,
		editingSpecimen,
		setEditingSpecimen,
		activePCRSpecimen,
		setActivePCRSpecimen,
		isBatchModalOpen,
		setIsBatchModalOpen,
		isScanOpen,
		setIsScanOpen,
		validationError,
		setValidationError,
		newRecordData,
		setNewRecordData,
		pcrForm,
		setPCRForm,
		focusedIndex,
		setFocusedIndex,
		searchInputRef,
		suggestions,
		handleAddSubmit,
		handleEditSubmit,
		handlePCRSubmit,
		handleStatusToggle,
		handleExportCSV,
		handleExportXLSX,
		handlePrintLabels,
		isMobileDevice,
	};
}
