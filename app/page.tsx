"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { FlaskConical, Beaker, CheckCircle2, AlertTriangle, Bug, Download, Plus, LogOut, Settings, Trash2, Wifi, WifiOff, Camera, Activity, Printer, Moon, Sun, Barcode, X, Save, RefreshCw, FileText, ScanLine, Home as HomeIcon, Search, MoreHorizontal, Star, Link2, Keyboard, Pencil, FileSpreadsheet, Filter } from 'lucide-react';
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

export default function App() { return <Home />; }

function Home() {
  const { data: session, status } = useSession();
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{ labs: string[]; operators: string[]; methods: string[]; }>({ labs: [], operators: [], methods: [] });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [quickFilter, setQuickFilter] = useState('ALL');
  
  const [darkMode, setDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [toast, setToast] = useState('');
  
  // Окна
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpecimen, setEditingSpecimen] = useState<any | null>(null);
  const [pcrModalId, setPcrModalId] = useState('');
  
  // Умный фильтр ПЦР
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [filterFwd, setFilterFwd] = useState('');
  const [filterRev, setFilterRev] = useState('');
  const [filterMatrix, setFilterMatrix] = useState('');

  // Формы ПЦР
  const [pcrVolume, setPcrVolume] = useState('');
  const [pcrResult, setPcrResult] = useState('Fail');
  const [pcrMarker, setPcrMarker] = useState('');
  const [pcrFwd, setPcrFwd] = useState('');
  const [pcrRev, setPcrRev] = useState('');
  const [pcrDnaMatrix, setPcrDnaMatrix] = useState('');
  
  const [newRecord, setNewRecord] = useState({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });
  const [validationError, setValidationError] = useState(false);
  
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
  const { canPromptInstall, iosShareHint, promptInstall } = usePwaInstall();
  const ptrRef = usePullToRefresh(() => void fetchSpecimensRef.current(), dataLoading);

  // Стилизация инпутов под Glassmorphism
  const inputBase = "w-full rounded-2xl border border-zinc-200/60 bg-white/50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:text-zinc-100 placeholder:text-zinc-400 backdrop-blur-sm";
  const glassPanelClass = "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl dark:bg-zinc-900/70 dark:border-zinc-800/50 rounded-[2rem]";

  // Логика переключения тем
  useEffect(() => {
    try {
      const v = localStorage.getItem(DARK_STORAGE_KEY);
      if (v === '1') setDarkMode(true);
      else if (v === '0') setDarkMode(false);
      else setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {}
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.classList.toggle('dark', darkMode);
    try { localStorage.setItem(DARK_STORAGE_KEY, darkMode ? '1' : '0'); } catch {}
  }, [darkMode, themeLoaded]);

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
      if (raw) setRecentIds((JSON.parse(raw) as string[]).slice(0, 8));
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
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [status]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '/' && !inField) { e.preventDefault(); searchInputRef.current?.focus(); }
      if ((e.key === 'n' || e.key === 'Н') && !inField && !e.ctrlKey && !e.metaKey) {
        if (session?.user?.role !== 'READER') { e.preventDefault(); setIsAddModalOpen(true); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === 'Escape') { setIsAddModalOpen(false); setEditingSpecimen(null); setPcrModalId(''); setToolsSheetOpen(false); setPaletteOpen(false); setShortcutsOpen(false); setScanOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  
  const applyScannedCode = useCallback((raw: string) => { 
    const q = raw.trim(); 
    if (q) { setSearch(q); setCurrentPage(1); setQuickFilter('ALL'); showToast(`Поиск: ${q}`); } 
  }, []);

  const fetchSpecimens = async () => {
    setDataLoading(true);
    try {
      const res = await fetch('/api/specimens');
      const result = await parseApiResponse<{ specimens?: any[]; suggestions?: any }>(res);
      if (!result.ok) { showToast(result.message); return; }
      if (result.data.specimens) { setSpecimens(result.data.specimens); setSuggestions(result.data.suggestions ?? { labs: [], operators: [], methods: [] }); }
    } finally { setDataLoading(false); }
  };
  fetchSpecimensRef.current = fetchSpecimens;

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.id.trim()) { setValidationError(true); return; }
    setValidationError(false);
    const res = await fetch('/api/specimens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRecord) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setIsAddModalOpen(false); setNewRecord({ id: '', taxon: '', locality: '', extrLab: '', extrOperator: '', extrMethod: '', extrDateRaw: '' });
    showToast('Проба добавлена'); fetchSpecimens();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpecimen) return;
    const { id, attempts, ...dataToUpdate } = editingSpecimen;
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ singleId: id, updateData: dataToUpdate }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setEditingSpecimen(null); showToast('Успешно обновлено'); fetchSpecimens();
  };

  const handleMassUpdate = async () => {
    if (selectedIds.length === 0) return;
    const updateData: any = {};
    if (massLab) updateData.extrLab = massLab;
    if (massOperator) updateData.extrOperator = massOperator;
    if (massMethod) updateData.extrMethod = massMethod;
    if (massDnaConc) updateData.dnaConcentration = massDnaConc;
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds, updateData }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setSelectedIds([]); setMassLab(''); setMassOperator(''); setMassMethod(''); setMassDnaConc('');
    showToast('Данные обновлены'); fetchSpecimens();
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0 || !confirm(`Удалить ${selectedIds.length} записей?`)) return;
    const res = await fetch('/api/specimens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setSelectedIds([]); showToast('Удалено'); fetchSpecimens();
  };

  const toggleStatus = async (id: string, current: string, markerKey: string = 'itsStatus') => {
    const nextStatus = current === '1' ? 'badQ' : current === 'badQ' ? 'alien' : '1';
    const updateData = { [markerKey]: nextStatus };
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ singleId: id, updateData }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    fetchSpecimens();
  };

  const handleAddAttempt = async () => {
    if (!pcrVolume) return;
    const newAttempt = { specimenId: pcrModalId, volume: pcrVolume, result: pcrResult, marker: pcrMarker.trim(), forwardPrimer: pcrFwd.trim(), reversePrimer: pcrRev.trim(), dnaMatrix: pcrDnaMatrix.trim() };
    const res = await fetch('/api/specimens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newAttempt }) });
    const result = await parseApiResponse(res);
    if (!result.ok) { showToast(result.message); return; }
    setPcrVolume(''); setPcrMarker(''); setPcrFwd(''); setPcrRev(''); setPcrDnaMatrix('');
    showToast('ПЦР сохранен'); fetchSpecimens();
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
    let list = specimens.filter((s) => 
        s.id.toLowerCase().includes(q) || 
        (s.taxon && s.taxon.toLowerCase().includes(q)) || 
        (s.locality && String(s.locality).toLowerCase().includes(q)) ||
        (s.extrOperator && s.extrOperator.toLowerCase().includes(q)) ||
        (s.notes && String(s.notes).toLowerCase().includes(q))
    );
    
    if (quickFilter === 'SUCCESS') list = list.filter((s) => s.itsStatus === '1');
    if (quickFilter === 'ERROR') list = list.filter((s) => s.itsStatus && s.itsStatus !== '1');
    if (quickFilter === 'FAVORITES') list = list.filter((s) => favSet.has(s.id));
    
    // Умный фильтр ПЦР
    if (showAdvFilter && (filterFwd || filterRev || filterMatrix)) {
      list = list.filter(s => {
        if (!s.attempts || s.attempts.length === 0) return false;
        return s.attempts.some((a: any) => {
          const matchFwd = filterFwd ? a.forwardPrimer?.toLowerCase().includes(filterFwd.toLowerCase()) : true;
          const matchRev = filterRev ? a.reversePrimer?.toLowerCase().includes(filterRev.toLowerCase()) : true;
          const matchMat = filterMatrix ? a.dnaMatrix?.toLowerCase().includes(filterMatrix.toLowerCase()) : true;
          return matchFwd && matchRev && matchMat;
        });
      });
    }

    return [...list].sort((a, b) => {
      const aVal = a[sortKey] || ''; const bVal = b[sortKey] || '';
      return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0;
    });
  }, [specimens, search, quickFilter, sortKey, sortOrder, favSet, showAdvFilter, filterFwd, filterRev, filterMatrix]);

  // ЭКСПОРТЫ (Восстановлено из старого файла)
  const exportToExcel = async () => {
    try {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(specimens);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Журнал');
      xlsx.writeFile(wb, 'Журнал_проб.xlsx');
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

  const toggleFavorite = useCallback((id: string) => { setFavoriteIds((prev) => { const next = [...toggleFavoriteId(new Set(prev), id)]; saveFavoriteIds(new Set(next)); return next; }); }, []);
  
  const currentData = filteredSpecimens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  
  // Красивые бейджи для маркеров (ITS, SSU, LSU и др.)
  const renderMarkerStatus = (s: any, marker: 'ITS' | 'SSU' | 'LSU' | 'MCM7') => {
    let key = 'itsStatus';
    if (marker === 'SSU') key = 'ssuStatus';
    if (marker === 'LSU') key = 'lsuStatus';
    if (marker === 'MCM7') key = 'mcm7Status';
    
    const st = s[key];
    const base = 'inline-flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ring-1 ring-inset whitespace-nowrap cursor-pointer';
    
    if (st === '1') return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300`}>{marker} ✓</button>;
    if (['badQ', 'badDNA', 'bad'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-rose-500/20 text-rose-800 ring-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300`}>{marker} ✕</button>;
    if (['alien', 'fungus'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-amber-500/20 text-amber-900 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300`}>{marker} 👽</button>;
    
    return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st || '', key)} className={`${base} bg-zinc-200/50 text-zinc-500 ring-zinc-300/50 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700`}>{marker} ?</button>;
  };

  const activeSpecimen = specimens.find((s) => s.id === pcrModalId);

  if (status === 'unauthenticated') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className={`${glassPanelClass} w-full max-w-md p-10 text-center`}>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-teal-500 text-white shadow-2xl shadow-teal-500/30">
            <FlaskConical className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Журнал ДНК</h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">LIMS для генетических исследований</p>
          <button onClick={() => signIn()} className="mt-8 w-full rounded-full bg-zinc-900 dark:bg-teal-500 py-4 font-bold text-white transition hover:scale-[0.98]">Войти в систему</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-2 sm:p-6 pb-24 text-zinc-900 dark:text-zinc-100 transition-colors">
      <datalist id="labs-list">{suggestions.labs.map((l: string) => <option key={l} value={l} />)}</datalist>
      <datalist id="ops-list">{suggestions.operators.map((o: string) => <option key={o} value={o} />)}</datalist>
      <datalist id="methods-list">{suggestions.methods.map((m: string) => <option key={m} value={m} />)}</datalist>

      {toast && (
        <div className="fixed z-[100] max-w-sm rounded-2xl border border-zinc-200/80 bg-white/95 px-5 py-3 text-sm shadow-2xl backdrop-blur-md dark:border-zinc-600 dark:bg-zinc-900/95 max-md:safe-pb left-4 right-4 max-md:bottom-24 md:bottom-6 md:right-6 md:left-auto">
          {toast}
        </div>
      )}

      {/* ВЕРХНЯЯ ПАНЕЛЬ (НОВЫЙ ДИЗАЙН Glassmorphism) */}
      <header className={`${glassPanelClass} mb-6 p-6 print:hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-500/30">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Журнал ДНК {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
              </h1>
              <p className="text-sm font-medium text-zinc-500">{role} · {specimens.length} проб</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
              <input type="search" placeholder="Поиск (Ctrl+K)" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} className={`${inputBase} pl-12`} />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto justify-end">
                <button onClick={() => setShowAdvFilter(!showAdvFilter)} className={`p-3.5 rounded-full border border-zinc-200/50 bg-white/50 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 transition-all ${showAdvFilter ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' : ''}`}><Filter className="h-5 w-5" /></button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-3.5 rounded-full border border-zinc-200/50 bg-white/50 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 transition-all">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
                <button type="button" onClick={() => fetchSpecimens()} disabled={dataLoading} className="p-3.5 rounded-full border border-zinc-200/50 bg-white/50 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 transition-all">
                    <RefreshCw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} />
                </button>
                {!isReader && <button onClick={() => setIsAddModalOpen(true)} className="rounded-full bg-teal-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-teal-600/20 hover:scale-95 transition-all hidden md:flex"><Plus className="h-5 w-5 inline mr-2" />Новая</button>}
            </div>
          </div>
        </div>

        {/* Умный фильтр ПЦР */}
        {showAdvFilter && (
          <div className="mt-6 rounded-2xl bg-white/60 dark:bg-zinc-950/60 p-4 border border-zinc-200/50 dark:border-zinc-800/50 animate-in slide-in-from-top-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Интеллектуальный фильтр ПЦР</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="Прямой праймер (Fwd)" value={filterFwd} onChange={e => setFilterFwd(e.target.value)} className={inputBase} />
              <input placeholder="Обратный праймер (Rev)" value={filterRev} onChange={e => setFilterRev(e.target.value)} className={inputBase} />
              <input placeholder="ДНК-матрица" value={filterMatrix} onChange={e => setFilterMatrix(e.target.value)} className={inputBase} />
            </div>
            <p className="text-xs text-zinc-500 mt-2">* Показывает только те пробы, у которых есть хотя бы одна попытка ПЦР с совпадением.</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {['ALL', 'SUCCESS', 'ERROR', 'FAVORITES'].map(key => (
            <button key={key} onClick={() => setQuickFilter(key)} className={`rounded-full px-5 py-2 text-sm font-bold transition-all border ${quickFilter === key ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-teal-500 dark:border-teal-500' : 'bg-white/50 border-zinc-200/50 text-zinc-600 hover:bg-white dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-300'}`}>
              {key === 'ALL' ? 'Все' : key === 'SUCCESS' ? 'Успех ITS' : key === 'ERROR' ? 'Ошибки' : '⭐ Избранное'}
            </button>
          ))}
        </div>
      </header>

      {/* ПАНЕЛЬ МАССОВОГО РЕДАКТИРОВАНИЯ */}
      {!isReader && selectedIds.length > 0 && (
        <div className="sticky top-3 z-20 mb-6 flex flex-col gap-3 rounded-[2rem] border border-teal-200/80 bg-teal-50/90 p-5 shadow-lg backdrop-blur-xl print:hidden dark:border-teal-800/50 dark:bg-teal-950/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Выбрано: {selectedIds.length}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportExtractionJournal} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100">
                <FileSpreadsheet className="h-4 w-4" /> В журнал выделений
              </button>
              {isAdmin && <button onClick={handleMassDelete} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500"><Trash2 className="h-4 w-4" /> Удалить</button>}
              <button onClick={() => setSelectedIds(filteredSpecimens.map(s => s.id))} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-teal-300 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-900 shadow-sm hover:bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100">Выбрать все в фильтре</button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input list="labs-list" placeholder="Лаборатория" value={massLab} onChange={(e) => setMassLab(e.target.value)} className={inputBase} />
            <input list="ops-list" placeholder="Кто выделял" value={massOperator} onChange={(e) => setMassOperator(e.target.value)} className={inputBase} />
            <input list="methods-list" placeholder="Метод" value={massMethod} onChange={(e) => setMassMethod(e.target.value)} className={inputBase} />
            <input placeholder="Конц. ДНК" value={massDnaConc} onChange={(e) => setMassDnaConc(e.target.value)} className={inputBase} />
          </div>
          <button onClick={handleMassUpdate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-500 dark:bg-teal-500"><Beaker className="h-4 w-4" /> Применить к выбранным</button>
        </div>
      )}

      {/* ТАБЛИЦА ПРОБ (Новый дизайн + новые маркеры) */}
      <div className={`${glassPanelClass} overflow-hidden print:border-none print:shadow-none print:bg-transparent`}>
        <div className="hidden overflow-x-auto md:block print:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md text-sm border-b border-zinc-200/50 dark:border-zinc-700/50">
              <tr>
                {!isReader && <th className="p-4 w-12 text-center print:hidden"><input type="checkbox" onChange={() => selectedIds.length === currentData.length ? setSelectedIds([]) : setSelectedIds(currentData.map(s => s.id))} checked={selectedIds.length > 0 && selectedIds.length === currentData.length} className="rounded border-zinc-300 text-teal-600 focus:ring-teal-600" /></th>}
                <th className="cursor-pointer p-4 font-bold hover:text-teal-700 dark:hover:text-teal-400" onClick={() => handleSort('id')}>ID {sortKey === 'id' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="cursor-pointer p-4 font-bold hover:text-teal-700 dark:hover:text-teal-400" onClick={() => handleSort('taxon')}>Таксон {sortKey === 'taxon' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="p-4 font-bold hidden xl:table-cell">Заметки</th>
                <th className="p-4 font-bold">Выделение</th>
                <th className="p-4 font-bold min-w-[200px]">Маркеры</th>
                <th className="p-4 font-bold text-center print:hidden">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-700/50 text-sm">
              {currentData.map((s) => (
                <tr key={s.id} className={`transition-all hover:bg-teal-50/30 dark:hover:bg-zinc-800/30 ${selectedIds.includes(s.id) ? 'bg-teal-50/50 dark:bg-teal-900/20' : ''}`}>
                  {!isReader && <td className="p-4 text-center print:hidden"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => setSelectedIds(p => p.includes(s.id) ? p.filter(i => i !== s.id) : [...p, s.id])} className="rounded border-zinc-300 text-teal-600 focus:ring-teal-600" /></td>}
                  <td className="p-4">
                     <div className="flex flex-wrap items-center gap-1 font-mono font-bold text-teal-700 dark:text-teal-400">
                      <button type="button" onClick={() => toggleFavorite(s.id)} className={`rounded p-0.5 print:hidden ${favSet.has(s.id) ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}><Star className={`h-4 w-4 ${favSet.has(s.id) ? 'fill-current' : ''}`} /></button>
                      <HighlightMatch text={s.id} query={search} />
                    </div>
                  </td>
                  <td className="p-4 font-medium">
                    {s.taxon ? <HighlightMatch text={String(s.taxon)} query={search} /> : '—'}
                    <div className="text-xs text-zinc-500 font-normal mt-0.5">{s.locality}</div>
                  </td>
                  <td className="hidden max-w-[14rem] align-top p-4 xl:table-cell">
                    {s.notes ? <p className="line-clamp-2 break-words text-xs text-zinc-600 dark:text-zinc-400" title={s.notes}>{s.notes}</p> : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{s.extrLab || '—'} <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ''}</span></div>
                    <div className="text-xs text-zinc-500 mt-0.5">{s.extrMethod}</div>
                  </td>
                  <td className="p-4 flex gap-1.5 flex-wrap">
                    {renderMarkerStatus(s, 'ITS')}
                    {s.ssuStatus && renderMarkerStatus(s, 'SSU')}
                    {s.lsuStatus && renderMarkerStatus(s, 'LSU')}
                  </td>
                  <td className="p-4 text-center print:hidden">
                    <div className="flex items-center justify-center gap-1">
                        {!isReader && <button onClick={() => setEditingSpecimen(s)} className="p-2 rounded-full border border-zinc-200/50 bg-white/50 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 transition-all text-zinc-500 hover:text-teal-600" title="Редактировать"><Pencil className="h-4 w-4" /></button>}
                        <button onClick={() => setPcrModalId(s.id)} className={`p-2 rounded-full border border-zinc-200/50 bg-white/50 hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-800/50 transition-all ${s.attempts?.length > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'}`} title="ПЦР"><Activity className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden p-3 space-y-3">
           {!dataLoading && currentData.map((s) => (
             <MobileSpecimenCard key={s.id} s={s} isReader={isReader} selected={selectedIds.includes(s.id)} onToggleSelect={() => setSelectedIds((p) => (p.includes(s.id) ? p.filter((i) => i !== s.id) : [...p, s.id]))} onPcr={() => setPcrModalId(s.id)} onEdit={() => setEditingSpecimen(s)} renderStatus={(s) => renderMarkerStatus(s, 'ITS')} favorite={favSet.has(s.id)} onToggleFavorite={() => toggleFavorite(s.id)} searchQuery={search} />
           ))}
        </div>
      </div>

      {/* МОБИЛЬНАЯ НАВИГАЦИЯ */}
      <nav className="safe-pb fixed bottom-0 left-0 right-0 z-[70] flex items-stretch justify-around gap-0 border-t border-zinc-200/90 bg-white/95 px-1 pt-1 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md print:hidden md:hidden dark:border-zinc-800 dark:bg-zinc-900/95">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><HomeIcon className="h-6 w-6" />Вверх</button>
        <button type="button" onClick={() => searchInputRef.current?.focus()} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><Search className="h-6 w-6" />Поиск</button>
        <button type="button" onClick={() => setScanOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-teal-700"><ScanLine className="h-6 w-6" />Скан</button>
        {!isReader && <button type="button" onClick={() => setIsAddModalOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-teal-700"><Plus className="h-6 w-6" />Проба</button>}
        <button type="button" onClick={() => setToolsSheetOpen(true)} className="touch-target flex flex-1 flex-col items-center justify-center py-1 text-[10px] font-medium text-zinc-600"><MoreHorizontal className="h-6 w-6" />Меню</button>
      </nav>

      {/* МОБИЛЬНОЕ МЕНЮ ИНСТРУМЕНТОВ */}
      {toolsSheetOpen && (
        <div className="fixed inset-0 z-[110] md:hidden print:hidden">
          <button type="button" className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={() => setToolsSheetOpen(false)} />
          <div className="safe-pb absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-y-auto rounded-t-[2rem] border border-zinc-200/50 bg-white/90 px-4 pb-4 pt-2 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/90">
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={() => { setToolsSheetOpen(false); exportExtractionJournal(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-teal-50/80 py-3 text-sm font-medium text-teal-900 dark:bg-teal-950/40 dark:text-teal-100"><FileSpreadsheet className="h-4 w-4" /> Журнал выделений</button>
              <button onClick={() => { setToolsSheetOpen(false); exportToExcel(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><Download className="h-4 w-4" /> Вся база (Excel)</button>
              <button onClick={() => { setToolsSheetOpen(false); exportCsv(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><FileText className="h-4 w-4" /> Текущий список (CSV)</button>
              <button onClick={() => { setToolsSheetOpen(false); window.print(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><Printer className="h-4 w-4" /> Печать</button>
              {role === 'ADMIN' && <Link href="/admin" onClick={() => setToolsSheetOpen(false)} className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-violet-50/80 py-3 text-sm font-semibold text-violet-900 dark:bg-violet-950/40 dark:text-violet-100"><Settings className="h-4 w-4" /> Админ</Link>}
            </div>
            <button onClick={() => { setToolsSheetOpen(false); signOut(); }} className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"><LogOut className="h-4 w-4" /> Выйти</button>
          </div>
        </div>
      )}

      {/* МОДАЛКА: СОЗДАНИЕ ПРОБЫ */}
      {!isReader && isAddModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${glassPanelClass} w-full max-w-md p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Новая проба</h2>
              <button type="button" className="rounded-full p-2 bg-zinc-100/50 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700" onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateRecord} className="flex flex-col gap-4">
              <input required placeholder="ID пробы *" value={newRecord.id} onChange={(e) => setNewRecord({ ...newRecord, id: e.target.value })} className={`${inputBase} ${validationError ? 'border-rose-500 ring-2 ring-rose-500/30' : ''}`} />
              <input placeholder="Таксон" value={newRecord.taxon} onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })} className={inputBase} />
              <input list="labs-list" placeholder="Лаборатория" value={newRecord.extrLab} onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })} className={inputBase} />
              <input list="ops-list" placeholder="Лаборант" value={newRecord.extrOperator} onChange={(e) => setNewRecord({ ...newRecord, extrOperator: e.target.value })} className={inputBase} />
              <button type="submit" className="mt-2 rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white transition hover:bg-teal-500 dark:bg-teal-500 shadow-lg shadow-teal-600/20">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ПОЛНОЕ РЕДАКТИРОВАНИЕ ПРОБЫ (Восстановлено) */}
      {!isReader && editingSpecimen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${glassPanelClass} my-4 w-full max-w-2xl p-6`}>
            <div className="mb-6 flex items-center justify-between gap-2">
              <h2 className="font-mono text-xl font-bold tracking-tight">Редактировать · {editingSpecimen.id}</h2>
              <button type="button" className="rounded-full p-2 bg-zinc-100/50 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700" onClick={() => setEditingSpecimen(null)}><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Общая информация */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Общая информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Таксон" value={editingSpecimen.taxon || ''} onChange={e => setEditingSpecimen({...editingSpecimen, taxon: e.target.value})} className={inputBase} />
                  <input placeholder="Место сбора (Locality)" value={editingSpecimen.locality || ''} onChange={e => setEditingSpecimen({...editingSpecimen, locality: e.target.value})} className={inputBase} />
                  <input placeholder="Коллектор" value={editingSpecimen.collector || ''} onChange={e => setEditingSpecimen({...editingSpecimen, collector: e.target.value})} className={inputBase} />
                  <textarea placeholder="Заметки (notes)" value={editingSpecimen.notes || ''} onChange={e => setEditingSpecimen({...editingSpecimen, notes: e.target.value})} className={`${inputBase} sm:col-span-2 min-h-[80px]`} />
                </div>
              </div>

              {/* Выделение ДНК */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Выделение ДНК</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input list="labs-list" placeholder="Лаборатория" value={editingSpecimen.extrLab || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrLab: e.target.value})} className={inputBase} />
                  <input list="ops-list" placeholder="Кто выделял" value={editingSpecimen.extrOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrOperator: e.target.value})} className={inputBase} />
                  <input list="methods-list" placeholder="Метод" value={editingSpecimen.extrMethod || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrMethod: e.target.value})} className={inputBase} />
                  <input placeholder="Дата (Extr. Date)" value={editingSpecimen.extrDateRaw || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrDateRaw: e.target.value})} className={inputBase} />
                </div>
              </div>

              {/* Концентрация */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Концентрация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Оборудование (DNA meter)" value={editingSpecimen.dnaMeter || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaMeter: e.target.value})} className={inputBase} />
                  <input placeholder="Концентрация" value={editingSpecimen.dnaConcentration || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaConcentration: e.target.value})} className={inputBase} />
                  <input placeholder="Кто измерял" value={editingSpecimen.measOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measOperator: e.target.value})} className={inputBase} />
                  <input placeholder="Дата измерения" value={editingSpecimen.measDate || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measDate: e.target.value})} className={inputBase} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <button type="button" onClick={() => setEditingSpecimen(null)} className="px-6 py-2.5 text-sm font-semibold text-zinc-600 bg-white/50 hover:bg-zinc-100 rounded-2xl dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-zinc-700">Отмена</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-teal-500 shadow-lg shadow-teal-600/20">
                  <Save className="h-4 w-4" /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА: ЖУРНАЛ ПЦР (Восстановлено) */}
      {pcrModalId && activeSpecimen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${glassPanelClass} my-4 w-full max-w-lg p-6`}>
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="font-mono text-xl font-bold tracking-tight flex items-center gap-2"><Activity className="text-teal-500 h-5 w-5"/> ПЦР · {pcrModalId}</h2>
              <button type="button" className="rounded-full p-2 bg-zinc-100/50 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:hover:bg-zinc-700" onClick={() => setPcrModalId('')}><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-6 max-h-52 space-y-3 overflow-y-auto pr-2">
              {activeSpecimen.attempts?.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-500 bg-white/30 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">Пока нет записей ПЦР</div>
              ) : (
                activeSpecimen.attempts?.map((a: any) => (
                  <div key={a.id} className="rounded-2xl border border-zinc-200/50 bg-white/60 p-4 text-sm dark:border-zinc-700/50 dark:bg-zinc-800/60 shadow-sm backdrop-blur-md">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <span className="text-zinc-500">{new Date(a.date).toLocaleDateString('ru-RU')}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{a.volume} мкл</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${a.result === 'Success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>{pcrResultLabelRu(a.result)}</span>
                    </div>
                    {(a.marker || a.forwardPrimer || a.reversePrimer || a.dnaMatrix) && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        {a.marker && <span className="px-2 py-1 rounded bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300">Маркер: <b>{a.marker}</b></span>}
                        {a.forwardPrimer && <span className="px-2 py-1 rounded bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300">F: {a.forwardPrimer}</span>}
                        {a.reversePrimer && <span className="px-2 py-1 rounded bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300">R: {a.reversePrimer}</span>}
                        {a.dnaMatrix && <span className="px-2 py-1 rounded bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300">Матрица: {a.dnaMatrix}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isReader && (
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Добавить попытку</p>
                <div className="grid grid-cols-2 gap-3">
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
                <button type="button" onClick={handleAddAttempt} className="mt-2 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-500 dark:bg-teal-500 shadow-lg shadow-teal-600/20">
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