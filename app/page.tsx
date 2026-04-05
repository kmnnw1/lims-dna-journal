'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
	FlaskConical,
	Beaker,
	Download,
	Plus,
	LogOut,
	Settings,
	Trash2,
	Wifi,
	WifiOff,
	Activity,
	Printer,
	Moon,
	Sun,
	Search,
	MoreHorizontal,
	Star,
	Link2,
	Keyboard,
	Pencil,
	FileSpreadsheet,
	Filter,
	RefreshCw,
	FileText,
	ScanLine,
	Home as HomeIcon,
} from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { parseApiResponse } from '@/lib/api-client';
import { BarcodeScanDialog } from '@/components/features/BarcodeScanDialog';
import { MobileSpecimenCard } from '@/components/features/MobileSpecimenCard';
import { HighlightMatch } from '@/components/ui/HighlightMatch';
import { loadFavoriteIds, saveFavoriteIds, toggleFavoriteId } from '@/lib/favorites';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { AddSpecimenModal } from '@/components/features/AddSpecimenModal';
import { EditSpecimenModal } from '@/components/features/EditSpecimenModal';
import { PcrModal } from '@/components/features/PcrModal';
import { exportToCsv } from '@/lib/export';
import {
	Specimen,
	Suggestions,
	NewRecordForm,
	EditSpecimenForm,
	MassUpdateForm,
	PcrForm,
	SortableFields,
	QuickFilter,
	EMPTY_NEW_RECORD,
	EMPTY_MASS_UPDATE,
	EMPTY_PCR_FORM,
	EMPTY_SUGGESTIONS,
} from '@/types';

const RECENT_STORAGE_KEY = 'lj-recent-ids';
const DARK_STORAGE_KEY = 'lj-dark-mode';

const MD3 = {
	page: 'min-h-screen bg-zinc-50 dark:bg-zinc-950 p-2 sm:p-6 pb-24 text-zinc-900 dark:text-zinc-100',
	card: 'bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200/50 dark:border-zinc-800/50',
	input: 'w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 transition-all',
	btnPrimary:
		'inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg active:scale-95 transition-all',
	btnSecondary:
		'inline-flex items-center justify-center gap-2 rounded-full bg-teal-50 px-5 py-3 text-sm font-bold text-teal-900 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-100 dark:hover:bg-teal-900/50 active:scale-95 transition-all',
	iconBtn:
		'inline-flex items-center justify-center p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 active:scale-95 transition-all',
	tableHeader: 'bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800',
	tableRow:
		'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0',
	statCard: 'rounded-[2rem] bg-zinc-100 dark:bg-zinc-800/50 p-5',
};

export default function App() {
	return <Home />;
}

function Home() {
	const { data: session, status } = useSession();

	const [specimens, setSpecimens] = useState<Specimen[]>([]);
	const [suggestions, setSuggestions] = useState<Suggestions>(EMPTY_SUGGESTIONS);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [sortKey, setSortKey] = useState<SortableFields>('id');
	const [sortOrder, setSortOrder] = useState<1 | -1>(1);
	const [isOnline, setIsOnline] = useState(true);
	const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
	const [darkMode, setDarkMode] = useState(false);
	const [toast, setToast] = useState('');

	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [validationError, setValidationError] = useState(false);
	const [editingSpecimen, setEditingSpecimen] = useState<EditSpecimenForm | null>(null);
	const [pcrModalId, setPcrModalId] = useState('');
	const [pcrForm, setPcrForm] = useState<PcrForm>(EMPTY_PCR_FORM);
	const [newRecord, setNewRecord] = useState<NewRecordForm>(EMPTY_NEW_RECORD);
	const [massUpdate, setMassUpdate] = useState<MassUpdateForm>(EMPTY_MASS_UPDATE);

	const [showAdvFilter, setShowAdvFilter] = useState(false);
	const [filterFwd, setFilterFwd] = useState('');
	const [filterRev, setFilterRev] = useState('');
	const [filterMatrix, setFilterMatrix] = useState('');

	const [dataLoading, setDataLoading] = useState(true);
	const [isNarrow, setIsNarrow] = useState(false);
	const [scanOpen, setScanOpen] = useState(false);
	const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [shortcutsOpen, setShortcutsOpen] = useState(false);

	const rowsPerPage = isNarrow ? 40 : 100;
	const searchInputRef = useRef<HTMLInputElement>(null);
	const fetchSpecimensRef = useRef<() => Promise<void>>(async () => {});
	const persistDark = useRef(false);
	const ptrRef = usePullToRefresh(() => void fetchSpecimensRef.current(), dataLoading);

	useEffect(() => {
		try {
			const v = localStorage.getItem(DARK_STORAGE_KEY);
			if (v === '1' || v === '0') setDarkMode(v === '1');
		} catch {}
		const id = requestAnimationFrame(() => {
			persistDark.current = true;
		});
		return () => cancelAnimationFrame(id);
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle('dark', darkMode);
		if (!persistDark.current) return;
		try {
			localStorage.setItem(DARK_STORAGE_KEY, darkMode ? '1' : '0');
		} catch {}
	}, [darkMode]);

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		const set = () => setIsNarrow(mq.matches);
		set();
		mq.addEventListener('change', set);
		return () => mq.removeEventListener('change', set);
	}, []);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(RECENT_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as unknown;
				if (Array.isArray(parsed)) {
					const recentIds = parsed
						.filter((x): x is string => typeof x === 'string')
						.slice(0, 8);
					setFavoriteIds(recentIds);
				}
			}
		} catch {}
		setFavoriteIds([...loadFavoriteIds()]);
	}, []);

	useEffect(() => {
		setIsOnline(navigator.onLine);
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		if (status === 'authenticated') fetchSpecimens();
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, [status]);

	useEffect(() => {
		if (status !== 'authenticated') return;
		const params = new URLSearchParams(window.location.search);
		if (params.get('q')) setSearch(params.get('q')!);
		if (params.get('specimen')) setPcrModalId(params.get('specimen')!);
	}, [status]);

	useEffect(() => {
		if (status !== 'authenticated') return;
		const u = new URL(window.location.href);
		search.trim() ? u.searchParams.set('q', search.trim()) : u.searchParams.delete('q');
		pcrModalId ? u.searchParams.set('specimen', pcrModalId) : u.searchParams.delete('specimen');
		window.history.replaceState(null, '', `${u.pathname}${u.search}`);
	}, [search, pcrModalId, status]);

	useEffect(() => {
		const onKey = (e: globalThis.KeyboardEvent) => {
			const tag = document.activeElement?.tagName;
			const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
			if (e.key === '/' && !inField) {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
			if ((e.key === 'n' || e.key === 'Н') && !inField && !e.ctrlKey && !e.metaKey) {
				if (session?.user?.role !== 'READER') {
					e.preventDefault();
					setIsAddModalOpen(true);
				}
			}
			if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
				e.preventDefault();
				setPaletteOpen(true);
			}
			if (e.key === '?' && !inField && !e.ctrlKey && !e.metaKey) {
				e.preventDefault();
				setShortcutsOpen(true);
			}
			if (e.key === 'Escape') {
				setIsAddModalOpen(false);
				setEditingSpecimen(null);
				setPcrModalId('');
				setScanOpen(false);
				setToolsSheetOpen(false);
				setPaletteOpen(false);
				setShortcutsOpen(false);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [session]);

	const showToast = (msg: string) => {
		setToast(msg);
		setTimeout(() => setToast(''), 3000);
	};

	const applyScannedCode = useCallback((raw: string) => {
		const q = raw.trim();
		if (!q) return;
		setSearch(q);
		setCurrentPage(1);
		setQuickFilter('ALL');
		showToast(`Поиск: ${q}`);
	}, []);

	useEffect(() => {
		if (!pcrModalId) return;
		setFavoriteIds((prev) => {
			const next = [pcrModalId, ...prev.filter((id) => id !== pcrModalId)].slice(0, 8);
			try {
				localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
			} catch {}
			return next;
		});
	}, [pcrModalId]);

	const fetchSpecimens = async () => {
		setDataLoading(true);
		try {
			const res = await fetch('/api/specimens');
			const result = await parseApiResponse<{ specimens?: unknown[]; suggestions?: any }>(
				res,
			);
			if (!result.ok) {
				showToast(result.message);
				return;
			}
			if (result.data.specimens) {
				setSpecimens(result.data.specimens as any[]);
				setSuggestions(result.data.suggestions ?? { labs: [], operators: [], methods: [] });
			}
		} finally {
			setDataLoading(false);
		}
	};
	fetchSpecimensRef.current = fetchSpecimens;

	const handleCreateRecord = async (e: SubmitEvent) => {
		e.preventDefault();
		if (!newRecord.id.trim()) {
			setValidationError(true);
			return;
		}
		setValidationError(false);
		const res = await fetch('/api/specimens', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newRecord),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		setIsAddModalOpen(false);
		setNewRecord(EMPTY_NEW_RECORD);
		showToast('Проба добавлена');
		fetchSpecimens();
	};

	const handleSaveEdit = async (e: SubmitEvent) => {
		e.preventDefault();
		if (!editingSpecimen) return;
		const { id, attempts, ...dataToUpdate } = editingSpecimen;
		const res = await fetch('/api/specimens', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ singleId: id, updateData: dataToUpdate }),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		setEditingSpecimen(null);
		showToast('Проба успешно обновлена');
		fetchSpecimens();
	};

	const handleMassUpdate = async () => {
		if (selectedIds.length === 0) return;
		const updateData: Record<string, string> = {};
		if (massUpdate.lab) updateData.extrLab = massUpdate.lab;
		if (massUpdate.operator) updateData.extrOperator = massUpdate.operator;
		if (massUpdate.method) updateData.extrMethod = massUpdate.method;
		if (massUpdate.dnaConcentration) updateData.dnaConcentration = massUpdate.dnaConcentration;
		const res = await fetch('/api/specimens', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids: selectedIds, updateData }),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		setSelectedIds([]);
		setMassUpdate(EMPTY_MASS_UPDATE);
		showToast('Данные обновлены');
		fetchSpecimens();
	};

	const handleMassDelete = async () => {
		if (selectedIds.length === 0 || !confirm(`Удалить ${selectedIds.length} записей?`)) return;
		const res = await fetch('/api/specimens', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids: selectedIds }),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		setSelectedIds([]);
		showToast('Записи удалены');
		fetchSpecimens();
	};

	const toggleStatus = async (id: string, current: string, markerKey: string = 'itsStatus') => {
		const nextStatus = current === '1' ? 'badQ' : current === 'badQ' ? 'alien' : '1';
		const res = await fetch('/api/specimens', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ singleId: id, updateData: { [markerKey]: nextStatus } }),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		fetchSpecimens();
	};

	const handleAddAttempt = async () => {
		if (!pcrForm.volume) return;
		const res = await fetch('/api/specimens', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				newAttempt: {
					specimenId: pcrModalId,
					volume: pcrForm.volume,
					result: pcrForm.result,
					marker: pcrForm.marker.trim(),
					forwardPrimer: pcrForm.forwardPrimer.trim(),
					reversePrimer: pcrForm.reversePrimer.trim(),
					dnaMatrix: pcrForm.dnaMatrix.trim(),
				},
			}),
		});
		const result = await parseApiResponse(res);
		if (!result.ok) {
			showToast(result.message);
			return;
		}
		setPcrForm(EMPTY_PCR_FORM);
		showToast('Попытка ПЦР сохранена');
		fetchSpecimens();
	};

	const handleSort = (key: SortableFields) => {
		if (sortKey === key) {
			setSortOrder((sortOrder * -1) as 1 | -1);
		} else {
			setSortKey(key);
			setSortOrder(1);
		}
	};

	// ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ EXCELJS
	const exportToExcel = async () => {
		try {
			const ExcelJS = (await import('exceljs')).default;
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Журнал');

			if (specimens.length > 0) {
				worksheet.columns = Object.keys(specimens[0]).map((key) => ({
					header: key,
					key: key,
				}));
				worksheet.addRows(specimens);
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'Журнал_проб.xlsx';
			a.click();
			window.URL.revokeObjectURL(url);
		} catch {
			showToast('Не удалось сформировать Excel');
		}
	};

	// ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ EXCELJS
	const exportExtractionJournal = async () => {
		try {
			const ExcelJS = (await import('exceljs')).default;
			const list =
				selectedIds.length > 0
					? specimens.filter((s) => selectedIds.includes(s.id))
					: filteredSpecimens;

			const dataToExport = list.map((s) => ({
				Дата: s.extrDateRaw || '',
				Лаборатория: s.extrLab || '',
				Метод: s.extrMethod || '',
				'Кто выделял': s.extrOperator || '',
				Isolate: s.id,
				Taxon: s.taxon || '',
				Locality: s.locality || '',
				Заметки: s.notes || '',
			}));

			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Журнал выделений');

			if (dataToExport.length > 0) {
				worksheet.columns = Object.keys(dataToExport[0]).map((key) => ({
					header: key,
					key: key,
				}));
				worksheet.addRows(dataToExport);
			}

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'Журнал_выделений.xlsx';
			a.click();
			window.URL.revokeObjectURL(url);
			setToolsSheetOpen(false);
		} catch {
			showToast('Не удалось сформировать Excel');
		}
	};

	const exportCsv = () => {
		try {
			exportToCsv(filteredSpecimens);
		} catch {
			showToast('Не удалось сформировать CSV');
		}
	};

	const role = session?.user?.role;
	const isReader = role === 'READER';
	const isAdmin = role === 'ADMIN';
	const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

	const filteredSpecimens = useMemo(() => {
		const q = search.toLowerCase();
		let list = specimens.filter(
			(s) =>
				s.id.toLowerCase().includes(q) ||
				(s.taxon && s.taxon.toLowerCase().includes(q)) ||
				(s.locality && String(s.locality).toLowerCase().includes(q)) ||
				(s.extrOperator && s.extrOperator.toLowerCase().includes(q)) ||
				(s.notes && String(s.notes).toLowerCase().includes(q)),
		);
		if (quickFilter === 'SUCCESS') list = list.filter((s) => s.itsStatus === '1');
		if (quickFilter === 'ERROR') list = list.filter((s) => s.itsStatus && s.itsStatus !== '1');
		if (quickFilter === 'FAVORITES') list = list.filter((s) => favSet.has(s.id));

		if (showAdvFilter && (filterFwd || filterRev || filterMatrix)) {
			list = list.filter((s) => {
				if (!s.attempts || s.attempts.length === 0) return false;
				return s.attempts.some((a: any) => {
					const matchFwd = filterFwd
						? a.forwardPrimer?.toLowerCase().includes(filterFwd.toLowerCase())
						: true;
					const matchRev = filterRev
						? a.reversePrimer?.toLowerCase().includes(filterRev.toLowerCase())
						: true;
					const matchMat = filterMatrix
						? a.dnaMatrix?.toLowerCase().includes(filterMatrix.toLowerCase())
						: true;
					return matchFwd && matchRev && matchMat;
				});
			});
		}
		return [...list].sort((a, b) => {
			const aVal = a[sortKey] || '';
			const bVal = b[sortKey] || '';
			return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0;
		});
	}, [
		specimens,
		search,
		quickFilter,
		sortKey,
		sortOrder,
		favSet,
		showAdvFilter,
		filterFwd,
		filterRev,
		filterMatrix,
	]);

	const toggleFavorite = useCallback((id: string) => {
		setFavoriteIds((prev) => {
			const next = [...toggleFavoriteId(new Set(prev), id)];
			saveFavoriteIds(new Set(next));
			return next;
		});
	}, []);

	const copySpecimenLink = useCallback((id: string) => {
		const url = `${window.location.origin}/?q=${encodeURIComponent(id)}&specimen=${encodeURIComponent(id)}`;
		void navigator.clipboard.writeText(url).then(
			() => showToast('Ссылка скопирована'),
			() => showToast('Не удалось скопировать'),
		);
	}, []);

	const currentData = filteredSpecimens.slice(
		(currentPage - 1) * rowsPerPage,
		currentPage * rowsPerPage,
	);
	const totalPages = Math.ceil(filteredSpecimens.length / rowsPerPage);

	useEffect(() => {
		if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
	}, [totalPages, currentPage]);

	const successCount = specimens.filter((s) => s.itsStatus === '1').length;
	const successPercent = specimens.length
		? Math.round((successCount / specimens.length) * 100)
		: 0;

	const renderMarkerStatus = (s: any, marker: 'ITS' | 'SSU' | 'LSU' | 'MCM7') => {
		const key =
			marker === 'SSU'
				? 'ssuStatus'
				: marker === 'LSU'
					? 'lsuStatus'
					: marker === 'MCM7'
						? 'mcm7Status'
						: 'itsStatus';
		const st = s[key];
		const base =
			'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer select-none';

		if (st === '1')
			return (
				<button
					type="button"
					onClick={() => !isReader && toggleStatus(s.id, st, key)}
					className={`${base} bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300`}>
					{marker} ✓
				</button>
			);
		if (['badQ', 'badDNA', 'bad'].includes(String(st)))
			return (
				<button
					type="button"
					onClick={() => !isReader && toggleStatus(s.id, st, key)}
					className={`${base} bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300`}>
					{marker} ✕
				</button>
			);
		if (['alien', 'fungus'].includes(String(st)))
			return (
				<button
					type="button"
					onClick={() => !isReader && toggleStatus(s.id, st, key)}
					className={`${base} bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300`}>
					{marker} 👽
				</button>
			);

		return (
			<button
				type="button"
				onClick={() => !isReader && toggleStatus(s.id, st || '', key)}
				className={`${base} bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400`}>
				{marker} ?
			</button>
		);
	};

	const tableColSpan = isReader ? 6 : 7;
	const activeSpecimen = specimens.find((s) => s.id === pcrModalId);

	if (status === 'loading') {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
				<div className="mx-auto max-w-3xl space-y-4">
					<div className="h-10 w-48 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-32 animate-pulse rounded-[2rem] bg-zinc-200/80 dark:bg-zinc-800/80" />
					<div className="h-64 animate-pulse rounded-[2rem] bg-zinc-200/60 dark:bg-zinc-800/60" />
				</div>
			</div>
		);
	}

	if (status === 'unauthenticated') {
		return (
			<div className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
				<div className="w-full max-w-md rounded-[2rem] border border-zinc-200/50 bg-white p-10 text-center shadow-md dark:border-zinc-800/50 dark:bg-zinc-900">
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">
						<FlaskConical className="h-8 w-8" strokeWidth={2} />
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
						LIMS Учёт ДНК
					</h1>
					<p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
						Внутренняя система лаборатории
					</p>
					<button
						type="button"
						onClick={() => signIn()}
						className="mt-8 w-full rounded-full bg-teal-600 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg transition-all">
						Войти в систему
					</button>
				</div>
			</div>
		);
	}

	return (
		<div ref={ptrRef} className={MD3.page}>
			<datalist id="labs-list">
				{suggestions.labs.map((l: string) => (
					<option key={l} value={l} />
				))}
			</datalist>
			<datalist id="ops-list">
				{suggestions.operators.map((o: string) => (
					<option key={o} value={o} />
				))}
			</datalist>
			<datalist id="methods-list">
				{suggestions.methods.map((m: string) => (
					<option key={m} value={m} />
				))}
			</datalist>

			{toast && (
				<div className="fixed z-[100] max-w-sm rounded-full bg-zinc-800 px-6 py-3 text-sm font-medium text-white shadow-xl dark:bg-zinc-200 dark:text-zinc-900 max-md:safe-pb left-1/2 -translate-x-1/2 max-md:bottom-24 md:bottom-8 animate-in slide-in-from-bottom-4">
					{toast}
				</div>
			)}

			{!isOnline && (
				<div className="mb-4 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 print:hidden z-10 relative flex items-center gap-2">
					<WifiOff className="h-4 w-4" /> <strong>Нет сети.</strong> Локальный режим.
				</div>
			)}

			<header className={`mb-6 p-5 print:hidden relative z-10 ${MD3.card}`}>
				<div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
					<div className="min-w-0">
						<h1 className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
							<span className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 select-none">
								<FlaskConical className="h-6 w-6" strokeWidth={2} />
							</span>
							База Проб
							{isOnline && (
								<Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							)}
						</h1>
						<p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
							Доступ:{' '}
							{role === 'ADMIN'
								? 'Администратор'
								: role === 'EDITOR'
									? 'Лаборант'
									: 'Чтение'}
						</p>
					</div>

					<div className="flex w-full min-w-0 flex-col gap-3 md:w-auto md:flex-1 md:items-end">
						<div className="relative w-full md:max-w-xs">
							<Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
							<input
								id="main-search"
								name="searchQuery"
								ref={searchInputRef}
								type="search"
								placeholder="Поиск по ID или таксону..."
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setCurrentPage(1);
								}}
								className={`${MD3.input} pl-10`}
							/>
						</div>

						<div className="hidden flex-wrap justify-end gap-2 md:flex">
							<button
								onClick={() => setShortcutsOpen(true)}
								className={MD3.iconBtn}
								title="Клавиши">
								<Keyboard className="h-4 w-4" />
							</button>
							<button
								onClick={() => setShowAdvFilter(!showAdvFilter)}
								className={`${MD3.iconBtn} ${showAdvFilter ? 'text-teal-600 bg-teal-100 dark:bg-teal-900/30' : ''}`}
								title="Умный фильтр">
								<Filter className="h-4 w-4" />
							</button>
							{!isReader && (
								<button
									onClick={() => setIsAddModalOpen(true)}
									className={MD3.btnPrimary}>
									<Plus className="h-4 w-4" />
									Новая проба
								</button>
							)}
							<button
								onClick={exportToExcel}
								className={MD3.btnSecondary}
								title="Вся база">
								<Download className="h-4 w-4" />
								База
							</button>
							<button
								onClick={() => fetchSpecimens()}
								disabled={dataLoading}
								className={MD3.iconBtn}>
								<RefreshCw
									className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`}
								/>
							</button>
							<button onClick={() => setDarkMode(!darkMode)} className={MD3.iconBtn}>
								{darkMode ? (
									<Sun className="h-4 w-4" />
								) : (
									<Moon className="h-4 w-4" />
								)}
							</button>
							{role === 'ADMIN' && (
								<Link
									href="/admin"
									className={`${MD3.btnSecondary} !bg-violet-100 !text-violet-700 dark:!bg-violet-900/30 dark:!text-violet-300`}>
									<Settings className="h-4 w-4" />
									Админ
								</Link>
							)}
						</div>
						<div className="flex flex-wrap gap-2 md:hidden">
							{!isReader && (
								<button
									onClick={() => setIsAddModalOpen(true)}
									className={`touch-target flex-1 ${MD3.btnPrimary}`}>
									<Plus className="h-4 w-4" />
									Новая
								</button>
							)}
							<button
								onClick={() => fetchSpecimens()}
								className={`touch-target ${MD3.iconBtn}`}>
								<RefreshCw
									className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`}
								/>
							</button>
							<button
								onClick={() => setToolsSheetOpen(true)}
								className={`touch-target flex-1 ${MD3.btnSecondary}`}>
								<MoreHorizontal className="h-5 w-5" />
								Ещё
							</button>
						</div>
					</div>
				</div>

				{showAdvFilter && (
					<div className="mt-4 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/30 p-4 border border-zinc-200/50 dark:border-zinc-800/50">
						<p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
							Интеллектуальный фильтр ПЦР
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<input
								id="filter-fwd"
								name="filterFwd"
								placeholder="Fwd праймер"
								value={filterFwd}
								onChange={(e) => setFilterFwd(e.target.value)}
								className={MD3.input}
							/>
							<input
								id="filter-rev"
								name="filterRev"
								placeholder="Rev праймер"
								value={filterRev}
								onChange={(e) => setFilterRev(e.target.value)}
								className={MD3.input}
							/>
							<input
								id="filter-matrix"
								name="filterMatrix"
								placeholder="ДНК-матрица"
								value={filterMatrix}
								onChange={(e) => setFilterMatrix(e.target.value)}
								className={MD3.input}
							/>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 gap-3 border-t border-zinc-100 pt-5 sm:grid-cols-3 dark:border-zinc-800 mt-4">
					<div className={MD3.statCard}>
						<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
							Всего проб
						</p>
						<p className="mt-1 text-3xl font-bold">{specimens.length}</p>
					</div>
					<div className={MD3.statCard}>
						<p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
							Успешные ITS
						</p>
						<p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
							{successCount}
						</p>
					</div>
					<div className={MD3.statCard}>
						<p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
							Остальные
						</p>
						<p className="mt-1 text-3xl font-bold text-rose-700 dark:text-rose-400">
							{specimens.length - successCount}
						</p>
					</div>
				</div>

				<div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80">
					<div
						className="h-full rounded-full bg-teal-500 transition-[width] duration-500"
						style={{ width: `${successPercent}%` }}
					/>
				</div>

				<div className="mt-5 flex flex-wrap gap-2">
					{(['ALL', 'SUCCESS', 'ERROR', 'FAVORITES'] as const).map((key) => (
						<button
							key={key}
							onClick={() => setQuickFilter(key)}
							className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
								quickFilter === key
									? 'bg-zinc-900 text-white dark:bg-teal-600'
									: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
							}`}>
							{key === 'FAVORITES' ? (
								<span className="flex items-center gap-1.5">
									<Star className="h-4 w-4" />
									Избранное
								</span>
							) : key === 'ALL' ? (
								'Все'
							) : key === 'SUCCESS' ? (
								'Успешные'
							) : (
								'С ошибками'
							)}
						</button>
					))}
				</div>
			</header>

			{!isReader && selectedIds.length > 0 && (
				<div
					className={`sticky top-3 z-20 mb-6 flex flex-col gap-4 p-5 shadow-lg print:hidden ${MD3.card} !bg-teal-50 dark:!bg-teal-900/20 !border-teal-200 dark:!border-teal-800/50`}>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="font-bold text-teal-900 dark:text-teal-100">
							Выбрано: {selectedIds.length}
						</p>
						<div className="flex flex-wrap gap-2">
							<button onClick={exportExtractionJournal} className={MD3.btnSecondary}>
								<FileSpreadsheet className="h-4 w-4" /> Журнал выделений
							</button>
							<button
								onClick={() => setSelectedIds(filteredSpecimens.map((s) => s.id))}
								className={MD3.btnSecondary}>
								Все в фильтре
							</button>
							{isAdmin && (
								<button
									onClick={handleMassDelete}
									className="rounded-full bg-rose-100 px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400">
									<Trash2 className="h-4 w-4 inline mr-1" /> Удалить
								</button>
							)}
						</div>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<input
							id="mass-lab"
							name="massLab"
							list="labs-list"
							placeholder="Лаборатория"
							value={massUpdate.lab}
							onChange={(e) => setMassUpdate({ ...massUpdate, lab: e.target.value })}
							className={MD3.input}
						/>
						<input
							id="mass-op"
							name="massOp"
							list="ops-list"
							placeholder="Кто выделял"
							value={massUpdate.operator}
							onChange={(e) =>
								setMassUpdate({ ...massUpdate, operator: e.target.value })
							}
							className={MD3.input}
						/>
						<input
							id="mass-method"
							name="massMethod"
							list="methods-list"
							placeholder="Метод"
							value={massUpdate.method}
							onChange={(e) =>
								setMassUpdate({ ...massUpdate, method: e.target.value })
							}
							className={MD3.input}
						/>
						<input
							id="mass-dna"
							name="massDna"
							placeholder="Конц. ДНК"
							value={massUpdate.dnaConcentration}
							onChange={(e) =>
								setMassUpdate({ ...massUpdate, dnaConcentration: e.target.value })
							}
							className={MD3.input}
						/>
					</div>
					<div className="flex">
						<button onClick={handleMassUpdate} className={MD3.btnPrimary}>
							<Beaker className="h-4 w-4" /> Применить ко всем
						</button>
					</div>
				</div>
			)}

			<div
				className={`overflow-hidden relative z-10 print:border-none print:shadow-none print:bg-transparent ${MD3.card}`}>
				<div className="hidden overflow-x-auto md:block print:block">
					<table className="w-full border-collapse text-left">
						<thead className={MD3.tableHeader}>
							<tr className="text-[13px] uppercase tracking-wider text-zinc-500">
								{!isReader && (
									<th className="w-12 p-4 text-center print:hidden">
										<input
											type="checkbox"
											name="selectAll"
											aria-label="Выбрать все"
											onChange={() =>
												selectedIds.length === currentData.length
													? setSelectedIds([])
													: setSelectedIds(currentData.map((s) => s.id))
											}
											checked={
												selectedIds.length === currentData.length &&
												currentData.length > 0
											}
											className="w-4 h-4 rounded text-teal-600 focus:ring-teal-600 cursor-pointer"
										/>
									</th>
								)}
								<th
									className="cursor-pointer p-4 hover:text-teal-600 transition-colors"
									onClick={() => handleSort('id')}>
									ID {sortKey === 'id' && (sortOrder === 1 ? '↑' : '↓')}
								</th>
								<th
									className="cursor-pointer p-4 hover:text-teal-600 transition-colors"
									onClick={() => handleSort('taxon')}>
									Таксон {sortKey === 'taxon' && (sortOrder === 1 ? '↑' : '↓')}
								</th>
								<th className="hidden max-w-[14rem] p-4 xl:table-cell">Заметки</th>
								<th className="p-4">Выделение</th>
								<th className="p-4 min-w-[180px]">Маркеры</th>
								<th className="p-4 text-center print:hidden">Действия</th>
							</tr>
						</thead>
						<tbody className="text-sm">
							{dataLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={`sk-${i}`} className={MD3.tableRow}>
										{!isReader && (
											<td className="p-4">
												<div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" />
											</td>
										)}
										<td className="p-4">
											<div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" />
										</td>
										<td className="p-4">
											<div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" />
										</td>
										<td className="hidden xl:table-cell p-4">
											<div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" />
										</td>
										<td className="p-4">
											<div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" />
										</td>
										<td className="p-4">
											<div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" />
										</td>
										<td className="p-4">
											<div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full mx-auto" />
										</td>
									</tr>
								))
							) : currentData.length === 0 ? (
								<tr>
									<td
										colSpan={tableColSpan}
										className="p-16 text-center text-zinc-500 font-medium">
										Ничего не найдено.
									</td>
								</tr>
							) : (
								currentData.map((s) => (
									<tr
										key={s.id}
										className={`${MD3.tableRow} ${selectedIds.includes(s.id) ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}>
										{!isReader && (
											<td className="p-4 text-center print:hidden">
												<input
													type="checkbox"
													name={`select-${s.id}`}
													aria-label={`Выбрать ${s.id}`}
													checked={selectedIds.includes(s.id)}
													onChange={() =>
														setSelectedIds((p) =>
															p.includes(s.id)
																? p.filter((i) => i !== s.id)
																: [...p, s.id],
														)
													}
													className="w-4 h-4 rounded text-teal-600 cursor-pointer"
												/>
											</td>
										)}
										<td className="p-4">
											<div className="flex flex-wrap items-center gap-1.5 font-mono font-bold text-teal-700 dark:text-teal-400 text-base">
												<button
													type="button"
													onClick={() => toggleFavorite(s.id)}
													className={`print:hidden transition-colors ${favSet.has(s.id) ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}>
													<Star
														className={`h-4 w-4 ${favSet.has(s.id) ? 'fill-current' : ''}`}
													/>
												</button>
												<span className="break-all">
													<HighlightMatch text={s.id} query={search} />
												</span>
												<button
													type="button"
													onClick={() => copySpecimenLink(s.id)}
													className="text-zinc-400 hover:text-teal-600 print:hidden ml-1">
													<Link2 className="h-3.5 w-3.5" />
												</button>
											</div>
										</td>
										<td className="p-4">
											<div className="font-bold">
												{s.taxon ? (
													<HighlightMatch
														text={String(s.taxon)}
														query={search}
													/>
												) : (
													'—'
												)}
											</div>
											<div className="text-xs text-zinc-500 mt-1">
												{s.locality}
											</div>
										</td>
										<td className="hidden max-w-[14rem] align-top p-4 xl:table-cell">
											{s.notes ? (
												<p
													className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl"
													title={s.notes}>
													{s.notes}
												</p>
											) : (
												<span className="text-xs text-zinc-400">—</span>
											)}
										</td>
										<td className="p-4">
											<div className="font-bold">
												{s.extrLab || '—'}{' '}
												<span className="font-normal text-zinc-500">
													{s.extrOperator ? `· ${s.extrOperator}` : ''}
												</span>
											</div>
											<div className="text-xs text-zinc-500 mt-1 bg-zinc-100 dark:bg-zinc-800 inline-block px-2 py-0.5 rounded-md">
												{s.extrMethod || 'Не указан'}
											</div>
										</td>
										<td className="p-4 flex gap-1.5 flex-wrap">
											{renderMarkerStatus(s, 'ITS')}
											{s.ssuStatus && renderMarkerStatus(s, 'SSU')}
											{s.lsuStatus && renderMarkerStatus(s, 'LSU')}
										</td>
										<td className="p-4 text-center print:hidden">
											<div className="flex items-center justify-center gap-2">
												{!isReader && (
													<button
														type="button"
														onClick={() => setEditingSpecimen(s)}
														className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-full transition-colors"
														title="Изменить">
														<Pencil className="h-4 w-4" />
													</button>
												)}
												<button
													type="button"
													onClick={() => setPcrModalId(s.id)}
													className={`p-2 rounded-full transition-colors ${s.attempts?.length ? 'text-teal-600 bg-teal-50 dark:bg-teal-900/30' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
													title="ПЦР">
													<Activity className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="md:hidden p-3 space-y-3">
					{!dataLoading &&
						currentData.map((s) => (
							<MobileSpecimenCard
								key={s.id}
								s={s}
								isReader={isReader}
								selected={selectedIds.includes(s.id)}
								onToggleSelect={() =>
									setSelectedIds((p) =>
										p.includes(s.id)
											? p.filter((i) => i !== s.id)
											: [...p, s.id],
									)
								}
								onPcr={() => setPcrModalId(s.id)}
								onEdit={() => setEditingSpecimen(s)}
								renderStatus={renderMarkerStatus}
								favorite={favSet.has(s.id)}
								onToggleFavorite={() => toggleFavorite(s.id)}
								searchQuery={search}
							/>
						))}
				</div>

				{totalPages > 1 && (
					<div className="flex flex-wrap items-center justify-center gap-4 border-t border-zinc-100 bg-zinc-50/50 p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900/30 print:hidden">
						<button
							disabled={currentPage <= 1}
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							className={MD3.btnSecondary}>
							Назад
						</button>
						<span className="font-bold text-zinc-600 dark:text-zinc-400">
							Стр. {currentPage} из {totalPages}
						</span>
						<button
							disabled={currentPage >= totalPages}
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							className={MD3.btnSecondary}>
							Вперёд
						</button>
					</div>
				)}
			</div>

			<nav className="safe-pb fixed bottom-0 left-0 right-0 z-[70] flex items-stretch justify-around gap-0 border-t border-zinc-200/90 bg-white/95 px-2 pt-2 pb-1 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] backdrop-blur-md print:hidden md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
				<button
					type="button"
					onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
					className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium text-zinc-600 hover:text-teal-600">
					<HomeIcon className="h-6 w-6 mb-1" />
					Вверх
				</button>
				<button
					type="button"
					onClick={() => searchInputRef.current?.focus()}
					className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium text-zinc-600 hover:text-teal-600">
					<Search className="h-6 w-6 mb-1" />
					Поиск
				</button>
				<button
					type="button"
					onClick={() => setScanOpen(true)}
					className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-bold text-teal-700">
					<ScanLine className="h-6 w-6 mb-1" />
					Скан
				</button>
				{!isReader && (
					<button
						type="button"
						onClick={() => setIsAddModalOpen(true)}
						className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-bold text-teal-700">
						<Plus className="h-6 w-6 mb-1" />
						Проба
					</button>
				)}
				<button
					type="button"
					onClick={() => setToolsSheetOpen(true)}
					className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium text-zinc-600 hover:text-teal-600">
					<MoreHorizontal className="h-6 w-6 mb-1" />
					Меню
				</button>
			</nav>

			{toolsSheetOpen && (
				<div className="fixed inset-0 z-[110] md:hidden print:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-zinc-950/40"
						onClick={() => setToolsSheetOpen(false)}
					/>
					<div className="safe-pb absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-5 pt-3 shadow-2xl dark:bg-zinc-900 transition-transform animate-in slide-in-from-bottom">
						<div className="mx-auto mb-5 h-1.5 w-12 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							<button
								onClick={() => {
									setToolsSheetOpen(false);
									exportExtractionJournal();
								}}
								className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-teal-50 text-sm font-bold text-teal-900 dark:bg-teal-900/30 dark:text-teal-100">
								<FileSpreadsheet className="h-5 w-5" /> Журнал выделений
							</button>
							<button
								onClick={() => {
									setToolsSheetOpen(false);
									exportToExcel();
								}}
								className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-zinc-100 text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
								<Download className="h-5 w-5" /> Вся база (Excel)
							</button>
							<button
								onClick={() => {
									setToolsSheetOpen(false);
									exportCsv();
								}}
								className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-zinc-100 text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
								<FileText className="h-5 w-5" /> Список (CSV)
							</button>
							<button
								onClick={() => {
									setToolsSheetOpen(false);
									window.print();
								}}
								className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-zinc-100 text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
								<Printer className="h-5 w-5" /> Печать
							</button>
							{role === 'ADMIN' && (
								<Link
									href="/admin"
									onClick={() => setToolsSheetOpen(false)}
									className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-violet-100 text-sm font-bold text-violet-900 dark:bg-violet-900/30 dark:text-violet-100">
									<Settings className="h-5 w-5" /> Панель Админа
								</Link>
							)}
						</div>
						<button
							onClick={() => {
								setToolsSheetOpen(false);
								signOut();
							}}
							className="mt-5 flex w-full min-h-[56px] items-center justify-center gap-3 rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
							<LogOut className="h-5 w-5" /> Выйти
						</button>
					</div>
				</div>
			)}

			{/* --- МОДАЛЬНЫЕ ОКНА (ВЫНЕСЕНЫ В КОМПОНЕНТЫ) --- */}
			<AddSpecimenModal
				open={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				newRecord={newRecord}
				setNewRecord={setNewRecord}
				onSubmit={(e) => {
					void handleCreateRecord(e as unknown as SubmitEvent);
				}}
				validationError={validationError}
			/>
			<EditSpecimenModal
				specimen={editingSpecimen}
				onClose={() => setEditingSpecimen(null)}
				onChange={setEditingSpecimen}
				onSubmit={(e) => {
					void handleSaveEdit(e as unknown as SubmitEvent);
				}}
			/>
			<PcrModal
				specimenId={pcrModalId}
				activeSpecimen={activeSpecimen}
				onClose={() => setPcrModalId('')}
				pcrForm={pcrForm}
				setPcrForm={setPcrForm}
				onSubmit={handleAddAttempt}
				isReader={isReader}
			/>

			<BarcodeScanDialog
				open={scanOpen}
				onClose={() => setScanOpen(false)}
				onCode={applyScannedCode}
			/>
			<CommandPalette
				open={paletteOpen}
				onClose={() => setPaletteOpen(false)}
				specimens={specimens}
				onPickSpecimen={(id) => {
					setSearch(id);
					setCurrentPage(1);
					setQuickFilter('ALL');
					setPcrModalId(id);
				}}
				onNewSpecimen={() => setIsAddModalOpen(true)}
				onRefresh={() => void fetchSpecimens()}
				isReader={isReader}
				isAdmin={isAdmin}
			/>
			<ShortcutsModal
				open={shortcutsOpen}
				onClose={() => setShortcutsOpen(false)}
				isReader={isReader}
			/>
		</div>
	);
}
