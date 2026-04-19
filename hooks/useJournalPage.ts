'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatOperatorName } from '@/lib/utils';
import type { Specimen } from '@/types';

export function useJournalPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [theme, setTheme] = useState<'light' | 'dark'>('light');
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

	const [isMobileDevice, setIsMobileDevice] = useState(false);
	const [devSettings, setDevSettings] = useState({
		enableMobileCards: false,
		forceDesktopView: false,
		forceMobileView: false,
	});
	const [pcrForm, setPcrForm] = useState({
		volume: '25',
		marker: '',
		forwardPrimer: '',
		reversePrimer: '',
		dnaMatrix: '',
		result: 'Success' as 'Success' | 'Failed',
	});

	// Theme initialization & sync
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (saved) {
			setTheme(saved);
			document.documentElement.classList.remove('dark');
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
		document.documentElement.classList.remove('dark');
		if (theme !== 'light') document.documentElement.classList.add(theme);
		localStorage.setItem('theme', theme);
	}, [theme]);

	// Физическое определение мобильного устройства (даже если включен "Режим ПК")
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const ua = navigator.userAgent;
		const isHandheld = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			ua,
		);

		// Для iPad и других планшетов, которые могут мимикрировать под десктоп
		// Но у них много точек касания и нет десктопной платформы в некоторых проверках
		const isTablet =
			navigator.maxTouchPoints > 0 &&
			!/Win32|Win64|MacIntel|Linux x86_64/i.test(navigator.platform);

		// Дополнительная проверка на "Pingvin" или типа того (вероятно Puffin или Linux Mobile)
		const isSpecialMobile = /Linux/i.test(ua) && navigator.maxTouchPoints > 0;

		setIsMobileDevice(isHandheld || isTablet || isSpecialMobile);
	}, []);

	// Dev settings sync
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const saved = localStorage.getItem('devSettings');
		if (saved) {
			try {
				setDevSettings(JSON.parse(saved));
			} catch (_) {}
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem('devSettings', JSON.stringify(devSettings));
	}, [devSettings]);

	// Reset page on filter change
	useEffect(() => {
		setPage(1);
	}, []);

	// Fetch Query
	const { data, isLoading: loading } = useQuery({
		queryKey: [
			'specimens',
			{
				page,
				search: debouncedSearch,
				filter: filterType,
				sort: sortConfig,
				minConc,
				maxConc,
				operator: selectedOperator,
			},
		],
		queryFn: async () => {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '50',
				search: debouncedSearch,
				filter: filterType,
				sortBy: sortConfig?.key || 'id',
				sortOrder: sortConfig?.direction || 'asc',
				minConc: minConc?.toString() || '',
				maxConc: maxConc?.toString() || '',
				operator: selectedOperator,
			});
			const res = await fetch(`/api/specimens?${params.toString()}`);
			if (!res.ok) throw new Error('Failed to fetch specimens');
			return res.json();
		},
		enabled: status === 'authenticated',
	});

	const specimens = data?.specimens || [];
	const totalPages = data?.totalPages || 1;
	const totalGlobal = data?.total || 0;
	const suggestions = data?.suggestions || { labs: [], operators: [], methods: [] };

	// Mutations
	const addMutation = useMutation({
		mutationFn: async (payload: typeof newRecordData) => {
			const res = await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка сохранения');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
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
		},
		onError: (error: Error) => {
			setToastMessage({ text: error.message, type: 'error' });
		},
	});

	const editMutation = useMutation({
		mutationFn: async (specimen: Specimen) => {
			const { id, ...rest } = specimen;
			const res = await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, ...rest }),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка редактирования');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			setEditingSpecimen(null);
			setToastMessage({ text: 'Проба успешно обновлена', type: 'success' });
		},
		onError: (error: Error) => {
			setToastMessage({ text: error.message, type: 'error' });
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
			setActivePcrSpecimen(null);
		},
		onError: (error: Error) => {
			setToastMessage({ text: error.message, type: 'error' });
		},
	});

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
		addMutation.mutate(newRecordData);
	};

	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (editingSpecimen) editMutation.mutate(editingSpecimen);
	};

	const handlePcrSubmit = async () => {
		if (activePcrSpecimen) {
			pcrMutation.mutate({
				specimenId: activePcrSpecimen.id,
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
			// Оптимистичное обновление или просто мутация
			await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ singleId: id, updateData: { [statusKey]: newStatus } }),
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

	// Auto-fill operator from session when modal opens
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
		isMobileDevice,
		devSettings,
		setDevSettings,
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
		setPage,
		minConc,
		setMinConc,
		maxConc,
		setMaxConc,
		selectedOperator,
		setSelectedOperator,
		suggestions,
		toastMessage,
		setToastMessage,
	};
}
