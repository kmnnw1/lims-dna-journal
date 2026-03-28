"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { FlaskConical, Beaker, CheckCircle2, AlertTriangle, Bug, Download, Plus, LogOut, Settings, Trash2, Wifi, WifiOff, Camera, Activity, Printer, Moon, Sun, Barcode, X, Save, RefreshCw, FileText, ScanLine, Home as HomeIcon, Search, MoreHorizontal, Star, Link2, Keyboard, Pencil, FileSpreadsheet } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { parseApiResponse } from '@/lib/api-client';
import { BarcodeScanDialog } from '@/components/BarcodeScanDialog';
import { MobileSpecimenCard } from '@/components/MobileSpecimenCard';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { HighlightMatch } from '@/lib/highlight';
import { loadFavoriteIds, saveFavoriteIds, toggleFavoriteId } from '@/lib/favorites';
import { CommandPalette } from '@/components/CommandPalette';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

const RECENT_STORAGE_KEY = 'lj-recent-ids';
const DARK_STORAGE_KEY = 'lj-dark-mode';

function pcrResultLabelRu(result: string) {
  if (result === 'Success') return 'Успех';
  if (result === 'Fail') return 'Провал';
  return result;
}

export default function App() {
  return <Home />;
}

function Home() {
  const { data: session, status } = useSession();
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{
    labs: string[];
    operators: string[];
    methods: string[];
  }>({ labs: [], operators: [], methods: [] });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState('');
  
  // Модальные окна
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpecimen, setEditingSpecimen] = useState<any | null>(null);
  const [pcrModalId, setPcrModalId] = useState('');
  
  // Формы ПЦР
  const [pcrVolume, setPcrVolume] = useState('');
  const [pcrResult, setPcrResult] = useState('Fail');
  const [pcrMarker, setPcrMarker] = useState('');
  const [pcrFwd, setPcrFwd] = useState('');
  const [pcrRev, setPcrRev] = useState('');
  const [pcrDnaMatrix, setPcrDnaMatrix] = useState('');
  
  // Создание
  const [newRecord, setNewRecord] = useState({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });
  const [validationError, setValidationError] = useState(false);
  
  // Массовое редактирование
  const [massLab, setMassLab] = useState('');
  const [massOperator, setMassOperator] = useState('');
  const [massMethod, setMassMethod] = useState('');
  const [massDnaConc, setMassDnaConc] = useState('');

  const [dataLoading, setDataLoading] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const rowsPerPage = isNarrow ? 40 : 100;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fetchSpecimensRef = useRef<() => Promise<void>>(async () => {});
  const persistDark = useRef(false);
  const { canPromptInstall, iosShareHint, promptInstall } = usePwaInstall();
  const ptrRef = usePullToRefresh(() => void fetchSpecimensRef.current(), dataLoading);

  useEffect(() => {
    try {
      const v = localStorage.getItem(DARK_STORAGE_KEY);
      if (v === '1' || v === '0') setDarkMode(v === '1');
    } catch {}
    const id = requestAnimationFrame(() => { persistDark.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    if (!persistDark.current) return;
    try { localStorage.setItem(DARK_STORAGE_KEY, darkMode ? '1' : '0'); } catch {}
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
        if (Array.isArray(parsed)) setRecentIds(parsed.filter((x): x is string => typeof x === 'string').slice(0, 8));
      }
    } catch {}
  }, []);

  useEffect(() => {
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
    const q = params.get('q');
    const sp = params.get('specimen');
    if (q) setSearch(q);
    if (sp) setPcrModalId(sp);
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const u = new URL(window.location.href);
    if (search.trim()) u.searchParams.set('q', search.trim());
    else u.searchParams.delete('q');
    if (pcrModalId) u.searchParams.set('specimen', pcrModalId);
    else u.searchParams.delete('specimen');
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
      if ((e.key === 'n' || e.key === 'Н') && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const r = (session?.user as { role?: string } | undefined)?.role;
        if (r && r !== 'READER') {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [quickFilter]);

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
    setRecentIds((prev) => {
      const next = [pcrModalId, ...prev.filter((id) => id !== pcrModalId)].slice(0, 8);
      try { localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [pcrModalId]);

  const fetchSpecimens = async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/specimens');
      const result = await parseApiResponse<{
        specimens?: unknown[];
        suggestions?: { labs: string[]; operators: string[]; methods: string[] };
      }>(res);
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

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.id.trim()) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    const res = await fetch('/api/specimens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRecord) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setIsAddModalOpen(false);
    setNewRecord({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });
    showToast('Проба добавлена');
    fetchSpecimens();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecimen) return;
    // Исключаем системные поля из апдейта
    const { id, attempts, ...dataToUpdate } = editingSpecimen;
    const res = await fetch('/api/specimens', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ singleId: id, updateData: dataToUpdate }) 
    });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setEditingSpecimen(null);
    showToast('Проба успешно обновлена');
    fetchSpecimens();
  };

  const handleMassUpdate = async () => {
    if (selectedIds.length === 0) return;
    const updateData: Record<string, string> = {};
    if (massLab) updateData.extrLab = massLab;
    if (massOperator) updateData.extrOperator = massOperator;
    if (massMethod) updateData.extrMethod = massMethod;
    if (massDnaConc) updateData.dnaConcentration = massDnaConc;
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, updateData }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setSelectedIds([]); setMassLab(''); setMassOperator(''); setMassMethod(''); setMassDnaConc('');
    showToast('Данные обновлены');
    fetchSpecimens();
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0 || !confirm(`Удалить ${selectedIds.length} записей?`)) return;
    const res = await fetch('/api/specimens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setSelectedIds([]);
    showToast('Записи удалены');
    fetchSpecimens();
  };

  const toggleStatus = async (id: string, current: string) => {
    const nextStatus = current === '1' ? 'badQ' : current === 'badQ' ? 'alien' : '1';
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ singleId: id, singleStatus: nextStatus }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    fetchSpecimens();
  };

  const handleAddAttempt = async () => {
    if (!pcrVolume) return;
    const res = await fetch('/api/specimens', { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        newAttempt: { 
          specimenId: pcrModalId, 
          volume: pcrVolume, 
          result: pcrResult,
          ...(pcrMarker.trim() ? { marker: pcrMarker.trim() } : {}),
          ...(pcrFwd.trim() ? { forwardPrimer: pcrFwd.trim() } : {}),
          ...(pcrRev.trim() ? { reversePrimer: pcrRev.trim() } : {}),
          ...(pcrDnaMatrix.trim() ? { dnaMatrix: pcrDnaMatrix.trim() } : {}),
        } 
      }) 
    });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setPcrVolume(''); setPcrMarker(''); setPcrFwd(''); setPcrRev(''); setPcrDnaMatrix('');
    showToast('Попытка ПЦР сохранена');
    fetchSpecimens();
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder * -1);
    else { setSortKey(key); setSortOrder(1); }
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
        (s.notes && String(s.notes).toLowerCase().includes(q))
    );
    if (quickFilter === 'SUCCESS') list = list.filter((s) => s.itsStatus === '1');
    if (quickFilter === 'ERROR') list = list.filter((s) => s.itsStatus && s.itsStatus !== '1');
    if (quickFilter === 'FAVORITES') list = list.filter((s) => favSet.has(s.id));
    return [...list].sort((a, b) => {
      const aVal = a[sortKey] || '';
      const bVal = b[sortKey] || '';
      return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0;
    });
  }, [specimens, search, quickFilter, sortKey, sortOrder, favSet]);

  const exportToExcel = async () => {
    try {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(specimens);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Журнал');
      xlsx.writeFile(wb, 'Журнал_проб.xlsx');
    } catch { showToast('Не удалось сформировать Excel'); }
  };

  const exportFilteredExcel = async () => {
    try {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(filteredSpecimens);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Отфильтровано');
      xlsx.writeFile(wb, 'Журнал_отфильтровано.xlsx');
    } catch { showToast('Не удалось сформировать Excel'); }
  };

  const exportExtractionJournal = async () => {
    try {
      const xlsx = await import('xlsx');
      const list = selectedIds.length > 0 ? specimens.filter(s => selectedIds.includes(s.id)) : filteredSpecimens;
      const dataToExport = list.map(s => ({
        'Дата': s.extrDateRaw || s.extrDate || '',
        'Лаборатория': s.extrLab || '',
        'Метод': s.extrMethod || '',
        'Кто выделял': s.extrOperator || '',
        'Isolate': s.id,
        'Taxon': s.taxon || '',
        'Locality': s.locality || '',
        'Заметки': s.notes || ''
      }));
      const ws = xlsx.utils.json_to_sheet(dataToExport);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Журнал выделений');
      xlsx.writeFile(wb, 'Журнал_выделений.xlsx');
      setToolsSheetOpen(false);
    } catch { showToast('Не удалось сформировать Excel'); }
  };

  const exportCsv = () => {
    try {
      const rows = filteredSpecimens;
      const headers = ['id', 'taxon', 'locality', 'extrLab', 'extrOperator', 'extrMethod', 'dnaConcentration', 'itsStatus', 'notes'];
      const esc = (v: unknown) => {
        const s = v == null ? '' : String(v);
        if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [headers.join(';'), ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(';'))];
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Журнал_проб.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { showToast('Не удалось сформировать CSV'); }
  };

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
      () => showToast('Не удалось скопировать')
    );
  }, []);

  const currentData = filteredSpecimens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredSpecimens.length / rowsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const successCount = specimens.filter((s) => s.itsStatus === '1').length;
  const successPercent = specimens.length ? Math.round((successCount / specimens.length) * 100) : 0;

  const renderStatus = (s: { id: string; itsStatus?: string | null }) => {
    const st = s.itsStatus;
    const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition ring-1 ring-inset';
    if (st === '1')
      return (
        <button type="button" onClick={() => !isReader && toggleStatus(s.id, st)} className={`${base} bg-emerald-600/10 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200`}>
          <CheckCircle2 className="h-3 w-3" /> Успех
        </button>
      );
    if (['badQ', 'badDNA', 'bad', 'bad Q'].includes(String(st)))
      return (
        <button type="button" onClick={() => !isReader && toggleStatus(s.id, st!)} className={`${base} bg-rose-600/10 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-200`}>
          <AlertTriangle className="h-3 w-3" /> Ошибка
        </button>
      );
    if (['alien', 'fungus'].includes(String(st)))
      return (
        <button type="button" onClick={() => !isReader && toggleStatus(s.id, st!)} className={`${base} bg-amber-500/15 text-amber-900 ring-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200`}>
          <Bug className="h-3 w-3" /> Чужой
        </button>
      );
    return (
      <button type="button" onClick={() => !isReader && toggleStatus(s.id, st || '')} className={`${base} bg-zinc-200/80 text-zinc-500 ring-zinc-400/20 dark:bg-zinc-800 dark:text-zinc-400`}>
        Нет данных
      </button>
    );
  };

  const activeSpecimen = specimens.find((s) => s.id === pcrModalId);
  const inputBase =
    'rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-teal-600/40 focus:ring-2 focus:ring-teal-500/15 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl space-y-4 p-8">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-32 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60" />
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-100 px-4 dark:bg-zinc-950">
        <div className="relative w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/90 p-10 text-center shadow-2xl backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/90">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-lg">
            <FlaskConical className="h-9 w-9" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Журнал проб ДНК</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Учёт выделения и ПЦР.</p>
          <button type="button" onClick={() => signIn()} className="mt-8 w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 dark:bg-teal-600 dark:hover:bg-teal-500">
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ptrRef} className="min-h-screen touch-manipulation bg-zinc-100 p-2 text-zinc-900 transition-colors selection:bg-teal-500/20 dark:bg-zinc-950 dark:text-zinc-100 sm:p-6 max-md:safe-pb-nav md:pb-20">
      <datalist id="labs-list">{suggestions.labs.map((l: string) => <option key={l} value={l} />)}</datalist>
      <datalist id="ops-list">{suggestions.operators.map((o: string) => <option key={o} value={o} />)}</datalist>
      <datalist id="methods-list">{suggestions.methods.map((m: string) => <option key={m} value={m} />)}</datalist>

      {toast && (
        <div className="fixed z-[100] max-w-sm rounded-2xl border border-zinc-200/80 bg-white/95 px-5 py-3 text-sm shadow-2xl backdrop-blur-md dark:border-zinc-600 dark:bg-zinc-900/95 max-md:safe-pb left-4 right-4 max-md:bottom-24 md:bottom-6 md:right-6 md:left-auto">
          {toast}
        </div>
      )}

      <header className="mb-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm print:hidden dark:border-zinc-700/80 dark:bg-zinc-900/60">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-md">
                <FlaskConical className="h-5 w-5" strokeWidth={1.75} />
              </span>
              Журнал проб ДНК
              {isOnline ? <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Роль: {role}</p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 md:w-auto md:flex-1 md:items-end">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Поиск по ID, таксону, оператору…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`min-h-[48px] w-full min-w-0 md:max-w-xs ${inputBase}`}
            />
            <div className="hidden flex-wrap justify-end gap-2 md:flex">
              <button type="button" onClick={() => setShortcutsOpen(true)} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"><Keyboard className="h-4 w-4" /></button>
              {!isReader && (
                <button type="button" onClick={() => setIsAddModalOpen(true)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400">
                  <Plus className="h-4 w-4" /> Новая проба
                </button>
              )}
              <button type="button" onClick={exportExtractionJournal} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700" title="Формат для выделений">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Журнал выделений
              </button>
              <button type="button" onClick={() => fetchSpecimens()} disabled={dataLoading} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
              </button>
              <button type="button" onClick={() => setDarkMode(!darkMode)} className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {role === 'ADMIN' && (
                <Link href="/admin" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-violet-300/80 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900 shadow-sm hover:bg-violet-100 dark:border-violet-600/50 dark:bg-violet-950/50 dark:text-violet-100">
                  <Settings className="h-4 w-4" /> Админ
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:hidden">
              {!isReader && <button type="button" onClick={() => setIsAddModalOpen(true)} className="touch-target flex-1 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm dark:bg-teal-500"><Plus className="h-4 w-4" /> Новая</button>}
              <button type="button" onClick={() => fetchSpecimens()} className="touch-target rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"><RefreshCw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} /></button>
              <button type="button" onClick={() => setToolsSheetOpen(true)} className="touch-target flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800"><MoreHorizontal className="h-5 w-5 mr-1 inline-block" /> Ещё</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-zinc-200/80 pt-5 sm:grid-cols-3 dark:border-zinc-700/80">
          <div className="rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm dark:border-zinc-700/60 dark:from-zinc-900 dark:to-zinc-950">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Всего проб</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{specimens.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800/40 dark:from-emerald-950/20 dark:to-zinc-950">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Успешные ITS</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">{successCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm dark:border-rose-900/40 dark:from-rose-950/30 dark:to-zinc-950">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Остальные</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-rose-900 dark:text-rose-100">{specimens.length - successCount}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['ALL', 'SUCCESS', 'ERROR', 'FAVORITES'].map(key => (
            <button
              key={key}
              onClick={() => setQuickFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${quickFilter === key ? 'bg-zinc-900 text-white dark:bg-teal-600' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'}`}
            >
              {key === 'FAVORITES' ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />Избранное</span> : key === 'ALL' ? 'Все' : key === 'SUCCESS' ? 'Успешные' : 'С ошибками'}
            </button>
          ))}
        </div>
      </header>

      {!isReader && selectedIds.length > 0 && (
        <div className="sticky top-3 z-20 mb-6 flex flex-col gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/95 p-4 shadow-lg backdrop-blur-md print:hidden dark:border-teal-800/50 dark:bg-teal-950/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Выбрано: {selectedIds.length}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportExtractionJournal} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
                <FileSpreadsheet className="h-4 w-4" /> Журнал выделений
              </button>
              {isAdmin && <button onClick={handleMassDelete} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500"><Trash2 className="h-4 w-4" /> Удалить</button>}
              <button onClick={() => setSelectedIds(filteredSpecimens.map(s => s.id))} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3 py-2 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100">Все отфильтрованные</button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input list="labs-list" placeholder="Лаборатория" value={massLab} onChange={(e) => setMassLab(e.target.value)} className={inputBase} />
            <input list="ops-list" placeholder="Кто выделял" value={massOperator} onChange={(e) => setMassOperator(e.target.value)} className={inputBase} />
            <input list="methods-list" placeholder="Метод" value={massMethod} onChange={(e) => setMassMethod(e.target.value)} className={inputBase} />
            <input placeholder="Конц. ДНК" value={massDnaConc} onChange={(e) => setMassDnaConc(e.target.value)} className={inputBase} />
          </div>
          <button onClick={handleMassUpdate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-500 dark:bg-teal-500"><Beaker className="h-4 w-4" /> Применить к выбранным</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 print:border-none print:shadow-none">
        <div className="hidden overflow-x-auto md:block print:block">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 border-b border-zinc-200/90 bg-zinc-100/95 text-sm text-zinc-600 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-300">
              <tr>
                {!isReader && <th className="w-10 p-3 text-center print:hidden"><input type="checkbox" onChange={() => selectedIds.length === currentData.length ? setSelectedIds([]) : setSelectedIds(currentData.map((s) => s.id))} checked={selectedIds.length === currentData.length && currentData.length > 0} /></th>}
                <th className="cursor-pointer p-3 font-semibold hover:text-teal-700 dark:hover:text-teal-400" onClick={() => handleSort('id')}>ID {sortKey === 'id' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="hidden cursor-pointer p-3 font-semibold sm:table-cell hover:text-teal-700 dark:hover:text-teal-400" onClick={() => handleSort('taxon')}>Таксон {sortKey === 'taxon' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="hidden max-w-[14rem] p-3 font-semibold xl:table-cell">Заметки</th>
                <th className="p-3 font-semibold">Выделение</th>
                <th className="p-3 text-center font-semibold">ITS</th>
                <th className="p-3 text-center font-semibold print:hidden">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800 print:divide-zinc-300">
              {currentData.map((s) => (
                <tr key={s.id} className={`transition-colors hover:bg-teal-50/40 dark:hover:bg-zinc-800/50 ${selectedIds.includes(s.id) ? 'bg-teal-50/60 dark:bg-teal-950/25' : 'even:bg-zinc-50/40 dark:even:bg-zinc-950/30'} print:border-b`}>
                  {!isReader && <td className="p-3 text-center print:hidden"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => setSelectedIds((p) => (p.includes(s.id) ? p.filter((i) => i !== s.id) : [...p, s.id]))} /></td>}
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      <button type="button" onClick={() => toggleFavorite(s.id)} className={`rounded p-0.5 print:hidden ${favSet.has(s.id) ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}><Star className={`h-4 w-4 ${favSet.has(s.id) ? 'fill-current' : ''}`} /></button>
                      <span className="break-all"><HighlightMatch text={s.id} query={search} /></span>
                    </div>
                  </td>
                  <td className="hidden p-3 sm:table-cell">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.taxon ? <HighlightMatch text={String(s.taxon)} query={search} /> : '—'}</div>
                    <div className="max-w-[200px] truncate text-xs text-zinc-500">{s.locality}</div>
                  </td>
                  <td className="hidden max-w-[14rem] align-top p-3 xl:table-cell">
                    {s.notes ? <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-zinc-600 dark:text-zinc-400" title={s.notes}>{s.notes}</p> : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.extrLab || '—'} <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ''}</span></div>
                    <div className="mt-0.5 text-xs text-zinc-500">{s.extrMethod}</div>
                  </td>
                  <td className="p-3 text-center">{renderStatus(s)}</td>
                  <td className="p-3 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1">
                      {!isReader && (
                        <button type="button" className="rounded-lg p-1.5 transition hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-400 hover:text-teal-600" onClick={() => setEditingSpecimen(s)} title="Редактировать">
                          <Pencil className="h-5 w-5" />
                        </button>
                      )}
                      <button type="button" className="rounded-lg p-1.5 transition hover:bg-zinc-200/80 dark:hover:bg-zinc-700" onClick={() => setPcrModalId(s.id)} title="Журнал ПЦР">
                        <Activity className={`h-5 w-5 ${s.attempts?.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-300 hover:text-zinc-500 dark:text-zinc-600'}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-zinc-100 md:hidden print:hidden dark:divide-zinc-800">
           {!dataLoading && currentData.map((s) => (
             <MobileSpecimenCard
               key={s.id} s={s} isReader={isReader} selected={selectedIds.includes(s.id)}
               onToggleSelect={() => setSelectedIds((p) => (p.includes(s.id) ? p.filter((i) => i !== s.id) : [...p, s.id]))}
               onPcr={() => setPcrModalId(s.id)}
               onEdit={() => setEditingSpecimen(s)}
               renderStatus={renderStatus} favorite={favSet.has(s.id)}
               onToggleFavorite={() => toggleFavorite(s.id)} searchQuery={search}
             />
           ))}
        </div>
      </div>

      <nav className="safe-pb fixed bottom-0 left-0 right-0 z-[70] flex items-stretch justify-around gap-0 border-t border-zinc-200/90 bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md print:hidden md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><HomeIcon className="h-6 w-6" />Вверх</button>
        <button type="button" onClick={() => searchInputRef.current?.focus()} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><Search className="h-6 w-6" />Поиск</button>
        <button type="button" onClick={() => setScanOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-teal-700"><ScanLine className="h-6 w-6" />Скан</button>
        {!isReader && <button type="button" onClick={() => setIsAddModalOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-teal-700"><Plus className="h-6 w-6" />Проба</button>}
        <button type="button" onClick={() => setToolsSheetOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><MoreHorizontal className="h-6 w-6" />Меню</button>
      </nav>

      {toolsSheetOpen && (
        <div className="fixed inset-0 z-[110] md:hidden print:hidden">
          <button type="button" className="absolute inset-0 bg-zinc-950/50" onClick={() => setToolsSheetOpen(false)} />
          <div className="safe-pb absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white px-4 pb-4 pt-2 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={() => { setToolsSheetOpen(false); exportExtractionJournal(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal-50 py-3 text-sm font-medium text-teal-900 dark:bg-teal-950/40 dark:text-teal-100"><FileSpreadsheet className="h-4 w-4" /> Журнал выделений</button>
              <button onClick={() => { setToolsSheetOpen(false); exportToExcel(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-50 py-3 text-sm font-medium dark:bg-zinc-800"><Download className="h-4 w-4" /> Вся база (Excel)</button>
              <button onClick={() => { setToolsSheetOpen(false); exportCsv(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-50 py-3 text-sm font-medium dark:bg-zinc-800"><FileText className="h-4 w-4" /> Текущий список (CSV)</button>
              <button onClick={() => { setToolsSheetOpen(false); window.print(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-50 py-3 text-sm font-medium dark:bg-zinc-800"><Printer className="h-4 w-4" /> Печать</button>
              {role === 'ADMIN' && <Link href="/admin" onClick={() => setToolsSheetOpen(false)} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-violet-50 py-3 text-sm font-semibold text-violet-900 dark:bg-violet-950/40 dark:text-violet-100"><Settings className="h-4 w-4" /> Админ</Link>}
            </div>
            <button onClick={() => { setToolsSheetOpen(false); signOut(); }} className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"><LogOut className="h-4 w-4" /> Выйти</button>
          </div>
        </div>
      )}

      {/* Модалка: СОЗДАНИЕ ПРОБЫ */}
      {!isReader && isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Новая проба</h2>
              <button type="button" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateRecord} className="flex flex-col gap-3">
              <input required placeholder="ID пробы *" value={newRecord.id} onChange={(e) => setNewRecord({ ...newRecord, id: e.target.value })} className={`${inputBase} ${validationError ? 'border-rose-500 ring-2 ring-rose-500/30' : ''}`} />
              <input placeholder="Таксон" value={newRecord.taxon} onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })} className={inputBase} />
              <input list="labs-list" placeholder="Лаборатория" value={newRecord.extrLab} onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })} className={inputBase} />
              <input list="ops-list" placeholder="Лаборант" value={newRecord.extrOperator} onChange={(e) => setNewRecord({ ...newRecord, extrOperator: e.target.value })} className={inputBase} />
              <button type="submit" className="mt-1 rounded-2xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-500 dark:bg-teal-500">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: ПОЛНОЕ РЕДАКТИРОВАНИЕ ПРОБЫ */}
      {!isReader && editingSpecimen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="my-4 w-full max-w-2xl rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-mono text-lg font-semibold tracking-tight">Редактировать · {editingSpecimen.id}</h2>
              <button type="button" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setEditingSpecimen(null)}><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Блок: Общая информация */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase text-zinc-500">Общая информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Таксон" value={editingSpecimen.taxon || ''} onChange={e => setEditingSpecimen({...editingSpecimen, taxon: e.target.value})} className={inputBase} />
                  <input placeholder="Место сбора (Locality)" value={editingSpecimen.locality || ''} onChange={e => setEditingSpecimen({...editingSpecimen, locality: e.target.value})} className={inputBase} />
                  <input placeholder="Коллектор" value={editingSpecimen.collector || ''} onChange={e => setEditingSpecimen({...editingSpecimen, collector: e.target.value})} className={inputBase} />
                  <textarea placeholder="Заметки (notes)" value={editingSpecimen.notes || ''} onChange={e => setEditingSpecimen({...editingSpecimen, notes: e.target.value})} className={`${inputBase} sm:col-span-2 min-h-[60px]`} />
                </div>
              </div>

              {/* Блок: Выделение */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase text-zinc-500">Выделение ДНК</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input list="labs-list" placeholder="Лаборатория" value={editingSpecimen.extrLab || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrLab: e.target.value})} className={inputBase} />
                  <input list="ops-list" placeholder="Кто выделял" value={editingSpecimen.extrOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrOperator: e.target.value})} className={inputBase} />
                  <input list="methods-list" placeholder="Метод" value={editingSpecimen.extrMethod || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrMethod: e.target.value})} className={inputBase} />
                  <input placeholder="Дата (Extr. Date)" value={editingSpecimen.extrDateRaw || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrDateRaw: e.target.value})} className={inputBase} />
                </div>
              </div>

              {/* Блок: Концентрация */}
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase text-zinc-500">Концентрация (Измерения)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Оборудование (DNA meter)" value={editingSpecimen.dnaMeter || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaMeter: e.target.value})} className={inputBase} />
                  <input placeholder="Концентрация (нг/мкл и др.)" value={editingSpecimen.dnaConcentration || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaConcentration: e.target.value})} className={inputBase} />
                  <input placeholder="DNA Profile" value={editingSpecimen.dnaProfile || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaProfile: e.target.value})} className={inputBase} />
                  <input placeholder="Кто измерял" value={editingSpecimen.measOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measOperator: e.target.value})} className={inputBase} />
                  <input placeholder="Дата измерения" value={editingSpecimen.measDate || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measDate: e.target.value})} className={inputBase} />
                  <input placeholder="Комментарий к измерению" value={editingSpecimen.measComm || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measComm: e.target.value})} className={inputBase} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button type="button" onClick={() => setEditingSpecimen(null)} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl dark:text-zinc-300 dark:hover:bg-zinc-800">Отмена</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white hover:bg-teal-500">
                  <Save className="h-4 w-4" /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: ПЦР */}
      {pcrModalId && activeSpecimen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className="my-4 w-full max-w-lg rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-mono text-lg font-semibold tracking-tight">ПЦР · {pcrModalId}</h2>
              <button type="button" className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setPcrModalId('')}><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 max-h-52 space-y-2 overflow-y-auto border-y border-zinc-200/80 py-3 dark:border-zinc-700">
              {activeSpecimen.attempts?.length === 0 ? (
                <p className="text-center text-sm text-zinc-500">Пока нет записей ПЦР</p>
              ) : (
                activeSpecimen.attempts?.map((a: any) => (
                  <div key={a.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-zinc-500">{new Date(a.date).toLocaleDateString('ru-RU')}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{a.volume} мкл</span>
                      <span className={a.result === 'Success' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-rose-600 dark:text-rose-400'}>{pcrResultLabelRu(a.result)}</span>
                    </div>
                    {(a.marker || a.forwardPrimer || a.reversePrimer || a.dnaMatrix) && (
                      <p className="mt-1 break-words text-xs text-zinc-500">
                        {[a.marker && `маркер: ${a.marker}`, a.forwardPrimer && `F: ${a.forwardPrimer}`, a.reversePrimer && `R: ${a.reversePrimer}`, a.dnaMatrix && `матр.: ${a.dnaMatrix}`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isReader && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Объём (мкл)" value={pcrVolume} onChange={(e) => setPcrVolume(e.target.value)} className={inputBase} />
                  <input placeholder="Маркер (ITS...)" value={pcrMarker} onChange={(e) => setPcrMarker(e.target.value)} className={inputBase} />
                  <input placeholder="Праймер F" value={pcrFwd} onChange={(e) => setPcrFwd(e.target.value)} className={inputBase} />
                  <input placeholder="Праймер R" value={pcrRev} onChange={(e) => setPcrRev(e.target.value)} className={inputBase} />
                </div>
                <input placeholder="Матрица ДНК (конц. / объём)" value={pcrDnaMatrix} onChange={(e) => setPcrDnaMatrix(e.target.value)} className={inputBase} />
                <select value={pcrResult} onChange={(e) => setPcrResult(e.target.value)} className={inputBase}>
                  <option value="Fail">Провал</option>
                  <option value="Success">Успех</option>
                </select>
                <button type="button" onClick={handleAddAttempt} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-500 dark:bg-teal-500">
                  <Save className="h-4 w-4" /> Добавить запись
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BarcodeScanDialog open={scanOpen} onClose={() => setScanOpen(false)} onCode={applyScannedCode} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} specimens={specimens} onPickSpecimen={(id) => { setSearch(id); setCurrentPage(1); setQuickFilter('ALL'); setPcrModalId(id); }} onNewSpecimen={() => setIsAddModalOpen(true)} onRefresh={() => void fetchSpecimens()} isReader={isReader} isAdmin={isAdmin} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} isReader={isReader} />
    </div>
  );
}