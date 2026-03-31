"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { FlaskConical, Beaker, CheckCircle2, AlertTriangle, Bug, Download, Plus, LogOut, Settings, Trash2, Wifi, WifiOff, Camera, Activity, Printer, Moon, Sun, Barcode, X, Save, RefreshCw, FileText, ScanLine, Home as HomeIcon, Search, MoreHorizontal, Star, Link2, Keyboard, Pencil, FileSpreadsheet, Filter, Palette } from 'lucide-react';
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
  EMPTY_SUGGESTIONS
} from '@/types';
import { exportToCsv } from '@/lib/export';


const RECENT_STORAGE_KEY = 'lj-recent-ids';
const DARK_STORAGE_KEY = 'lj-dark-mode';
const THEME_STORAGE_KEY = 'lj-ui-theme';

export type UiTheme = 'classic' | 'glass' | 'md3';

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
  
  // Оригинальные стейты
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
  
  // Восстановленный стейт полного редактирования
  const [editingSpecimen, setEditingSpecimen] = useState<EditSpecimenForm | null>(null);
  
  const [pcrModalId, setPcrModalId] = useState('');
  const [pcrForm, setPcrForm] = useState<PcrForm>(EMPTY_PCR_FORM);
  const [newRecord, setNewRecord] = useState<NewRecordForm>(EMPTY_NEW_RECORD);
  const [massUpdate, setMassUpdate] = useState<MassUpdateForm>(EMPTY_MASS_UPDATE);

  // Умный фильтр
  const [showAdvFilter, setShowAdvFilter] = useState(false);
  const [filterFwd, setFilterFwd] = useState('');
  const [filterRev, setFilterRev] = useState('');
  const [filterMatrix, setFilterMatrix] = useState('');

  const [dataLoading, setDataLoading] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // ТЕМЫ И ПАСХАЛКА
  const [uiTheme, setUiTheme] = useState<UiTheme>('classic');
  const [logoClicks, setLogoClicks] = useState(0);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const rowsPerPage = isNarrow ? 40 : 100;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fetchSpecimensRef = useRef<() => Promise<void>>(async () => {});
  const persistDark = useRef(false);
  const { canPromptInstall, iosShareHint, promptInstall } = usePwaInstall();
  const ptrRef = usePullToRefresh(() => void fetchSpecimensRef.current(), dataLoading);

  // Обработчик пасхалки
  useEffect(() => {
    if (logoClicks >= 5) {
      setThemeModalOpen(true);
      setLogoClicks(0);
    }
    if (logoClicks > 0) {
      const timer = setTimeout(() => setLogoClicks(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);

  // Загрузка тем и дарк мода
  useEffect(() => {
    try {
      const v = localStorage.getItem(DARK_STORAGE_KEY);
      if (v === '1' || v === '0') setDarkMode(v === '1');
      const t = localStorage.getItem(THEME_STORAGE_KEY) as UiTheme;
      if (['classic', 'glass', 'md3'].includes(t)) setUiTheme(t);
    } catch {}
    const id = requestAnimationFrame(() => { persistDark.current = true; });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    if (!persistDark.current) return;
    try { 
      localStorage.setItem(DARK_STORAGE_KEY, darkMode ? '1' : '0'); 
      localStorage.setItem(THEME_STORAGE_KEY, uiTheme);
    } catch {}
  }, [darkMode, uiTheme]);

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
      if (e.key === '/' && !inField) { e.preventDefault(); searchInputRef.current?.focus(); }
      if ((e.key === 'n' || e.key === 'Н') && !inField && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (session?.user?.role !== 'READER') { e.preventDefault(); setIsAddModalOpen(true); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
      if (e.key === '?' && !inField && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === 'Escape') {
        setIsAddModalOpen(false); setEditingSpecimen(null); setPcrModalId(''); setScanOpen(false); setToolsSheetOpen(false); setPaletteOpen(false); setShortcutsOpen(false); setThemeModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const applyScannedCode = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setSearch(q); setCurrentPage(1); setQuickFilter('ALL'); showToast(`Поиск: ${q}`);
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
      const result = await parseApiResponse<{ specimens?: unknown[]; suggestions?: any }>(res);
      if (!result.ok) { showToast(result.message); return; }
      if (result.data.specimens) {
        setSpecimens(result.data.specimens as any[]);
        setSuggestions(result.data.suggestions ?? { labs: [], operators: [], methods: [] });
      }
    } finally { setDataLoading(false); }
  };
  fetchSpecimensRef.current = fetchSpecimens;

  const handleCreateRecord = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newRecord.id.trim()) { 
    setValidationError(true); 
    return; 
  }
  setValidationError(false);
  
  const res = await fetch('/api/specimens', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(newRecord) 
  });
  
  const result = await parseApiResponse(res);
  if (!result.ok) { 
    showToast(result.message); 
    return; 
  }
  
  // ✅ Используем EMPTY_NEW_RECORD для очистки
  setIsAddModalOpen(false);
  setNewRecord(EMPTY_NEW_RECORD);
  showToast('Проба добавлена');
  fetchSpecimens();
};

const handleSaveEdit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingSpecimen) return;
  
  // Исключаем id и attempts из данных для обновления
  const { id, attempts, ...dataToUpdate } = editingSpecimen;
  
  const res = await fetch('/api/specimens', { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ singleId: id, updateData: dataToUpdate }) 
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
  
  // ✅ Используем massUpdate вместо отдельных переменных
  const updateData: Record<string, string> = {};
  if (massUpdate.lab) updateData.extrLab = massUpdate.lab;
  if (massUpdate.operator) updateData.extrOperator = massUpdate.operator;
  if (massUpdate.method) updateData.extrMethod = massUpdate.method;
  if (massUpdate.dnaConcentration) updateData.dnaConcentration = massUpdate.dnaConcentration;
  
  const res = await fetch('/api/specimens', { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ ids: selectedIds, updateData }) 
  });
  
  const result = await parseApiResponse(res);
  if (!result.ok) { 
    showToast(result.message); 
    return; 
  }
  
  // ✅ Очистка одной строкой
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
    body: JSON.stringify({ ids: selectedIds }) 
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
  // Цикл статусов: '1' → 'badQ' → 'alien' → '1'
  const nextStatus = current === '1' ? 'badQ' : current === 'badQ' ? 'alien' : '1';
  const updateData = { [markerKey]: nextStatus };
  
  const res = await fetch('/api/specimens', { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ singleId: id, updateData }) 
  });
  
  const result = await parseApiResponse(res);
  if (!result.ok) { 
    showToast(result.message); 
    return; 
  }
  
  fetchSpecimens();
};

const handleAddAttempt = async () => {
  // ✅ Используем pcrForm вместо отдельных переменных
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
        dnaMatrix: pcrForm.dnaMatrix.trim() 
      } 
    }) 
  });
  
  const result = await parseApiResponse(res);
  if (!result.ok) { 
    showToast(result.message); 
    return; 
  }
  
  // ✅ Очистка одной строкой
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

const exportToExcel = async () => {
  try {
    const xlsx = await import('xlsx');
    const ws = xlsx.utils.json_to_sheet(specimens);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Журнал');
    xlsx.writeFile(wb, 'Журнал_проб.xlsx');
  } catch { 
    showToast('Не удалось сформировать Excel'); 
  }
};

const exportFilteredExcel = async () => {
  try {
    const xlsx = await import('xlsx');
    const ws = xlsx.utils.json_to_sheet(filteredSpecimens);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Отфильтровано');
    xlsx.writeFile(wb, 'Журнал_отфильтровано.xlsx');
  } catch { 
    showToast('Не удалось сформировать Excel'); 
  }
};

const exportExtractionJournal = async () => {
  try {
    const xlsx = await import('xlsx');
    const list = selectedIds.length > 0 
      ? specimens.filter(s => selectedIds.includes(s.id)) 
      : filteredSpecimens;
    
    const dataToExport = list.map(s => ({
      'Дата': s.extrDateRaw ||  '',
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
    let list = specimens.filter((s) => s.id.toLowerCase().includes(q) || (s.taxon && s.taxon.toLowerCase().includes(q)) || (s.locality && String(s.locality).toLowerCase().includes(q)) || (s.extrOperator && s.extrOperator.toLowerCase().includes(q)) || (s.notes && String(s.notes).toLowerCase().includes(q)));
    if (quickFilter === 'SUCCESS') list = list.filter((s) => s.itsStatus === '1');
    if (quickFilter === 'ERROR') list = list.filter((s) => s.itsStatus && s.itsStatus !== '1');
    if (quickFilter === 'FAVORITES') list = list.filter((s) => favSet.has(s.id));
    
    // Умный фильтр
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
    return [...list].sort((a, b) => { const aVal = a[sortKey] || ''; const bVal = b[sortKey] || ''; return aVal > bVal ? sortOrder : aVal < bVal ? -sortOrder : 0; });
  }, [specimens, search, quickFilter, sortKey, sortOrder, favSet, showAdvFilter, filterFwd, filterRev, filterMatrix]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => { const next = [...toggleFavoriteId(new Set(prev), id)]; saveFavoriteIds(new Set(next)); return next; });
  }, []);

  const copySpecimenLink = useCallback((id: string) => {
    const url = `${window.location.origin}/?q=${encodeURIComponent(id)}&specimen=${encodeURIComponent(id)}`;
    void navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована'), () => showToast('Не удалось скопировать'));
  }, []);

  const currentData = filteredSpecimens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredSpecimens.length / rowsPerPage);

  useEffect(() => { if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const successCount = specimens.filter((s) => s.itsStatus === '1').length;
  const successPercent = specimens.length ? Math.round((successCount / specimens.length) * 100) : 0;

  // Дизайн классов в зависимости от темы
  const getThemeClasses = (t: UiTheme) => {
    switch (t) {
      case 'glass': return {
        page: "min-h-screen relative overflow-hidden bg-zinc-50/50 dark:bg-zinc-950 p-2 sm:p-6 pb-24 text-zinc-900 dark:text-zinc-100",
        card: "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2rem]",
        input: "w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700/50 dark:bg-zinc-800/40 dark:text-zinc-100 placeholder:text-zinc-500 backdrop-blur-md",
        btnPrimary: "rounded-full bg-teal-500/90 backdrop-blur px-5 py-2.5 font-bold text-white shadow-lg hover:bg-teal-500 transition-all",
        btnSecondary: "rounded-full bg-white/50 border border-white/50 hover:bg-white dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:hover:bg-zinc-700 px-4 py-2 font-medium transition-all backdrop-blur-md",
        iconBtn: "p-2.5 rounded-full bg-white/50 hover:bg-white dark:bg-zinc-800/50 dark:hover:bg-zinc-700 transition-all backdrop-blur-md border border-white/30 dark:border-zinc-700/50",
        tableHeader: "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border-b border-white/30 dark:border-zinc-700/50",
        tableRow: "hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-all",
        statCard: "rounded-[1.5rem] bg-white/40 dark:bg-zinc-800/40 backdrop-blur border border-white/30 p-4 shadow-sm"
      };
      case 'md3': return {
        page: "min-h-screen bg-zinc-50 dark:bg-zinc-950 p-2 sm:p-6 pb-24 text-zinc-900 dark:text-zinc-100",
        card: "bg-white dark:bg-zinc-900 rounded-[2rem] shadow-md border-none",
        input: "w-full rounded-full border-2 border-zinc-200 bg-zinc-100/50 px-5 py-3 outline-none focus:border-teal-600 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-teal-500",
        btnPrimary: "rounded-full bg-teal-600 px-6 py-3 font-bold text-white shadow-md hover:bg-teal-700 active:scale-95 transition-all",
        btnSecondary: "rounded-full bg-teal-50 text-teal-900 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/50 px-5 py-2.5 font-bold transition-all",
        iconBtn: "p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 active:scale-95 transition-all",
        tableHeader: "bg-zinc-100 dark:bg-zinc-800/50 border-b-2 border-zinc-200 dark:border-zinc-700",
        tableRow: "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors",
        statCard: "rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 p-5"
      };
      default: return {
        // ОРИГИНАЛЬНЫЙ ДИЗАЙН (Classic)
        page: "min-h-screen bg-zinc-100 p-2 text-zinc-900 transition-colors selection:bg-teal-500/20 dark:bg-zinc-950 dark:text-zinc-100 sm:p-6 pb-24 max-md:safe-pb-nav",
        card: "bg-white/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl shadow-sm backdrop-blur-sm",
        input: "rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:border-teal-600/40 focus:ring-2 focus:ring-teal-500/15 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        btnPrimary: "inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400",
        btnSecondary: "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700",
        iconBtn: "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700",
        tableHeader: "bg-zinc-100/95 dark:bg-zinc-900/95 border-b border-zinc-200/90 dark:border-zinc-700 backdrop-blur-md",
        tableRow: "even:bg-zinc-50/40 dark:even:bg-zinc-950/30 hover:bg-teal-50/40 dark:hover:bg-zinc-800/50 transition-colors",
        statCard: "rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-sm dark:border-zinc-700/60 dark:from-zinc-900 dark:to-zinc-950"
      };
    }
  };

  const theme = getThemeClasses(uiTheme);

  // Универсальный рендер маркеров
  const renderMarkerStatus = (s: any, marker: 'ITS' | 'SSU' | 'LSU' | 'MCM7') => {
    let key = 'itsStatus';
    if (marker === 'SSU') key = 'ssuStatus';
    if (marker === 'LSU') key = 'lsuStatus';
    if (marker === 'MCM7') key = 'mcm7Status';
    
    const st = s[key];
    if (uiTheme === 'classic') {
      const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition ring-1 ring-inset whitespace-nowrap';
      if (st === '1') return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-emerald-600/10 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-200`}>{marker} ✓</button>;
      if (['badQ', 'badDNA', 'bad'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-rose-600/10 text-rose-800 ring-rose-600/20 dark:bg-rose-500/15 dark:text-rose-200`}>{marker} ✕</button>;
      if (['alien', 'fungus'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-amber-500/15 text-amber-900 ring-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200`}>{marker} 👽</button>;
      return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st || '', key)} className={`${base} bg-zinc-200/80 text-zinc-500 ring-zinc-400/20 dark:bg-zinc-800 dark:text-zinc-400`}>{marker} ?</button>;
    } else {
      const base = 'inline-flex items-center justify-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ring-1 ring-inset whitespace-nowrap cursor-pointer';
      if (st === '1') return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-emerald-500/20 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300`}>{marker} ✓</button>;
      if (['badQ', 'badDNA', 'bad'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-rose-500/20 text-rose-800 ring-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300`}>{marker} ✕</button>;
      if (['alien', 'fungus'].includes(String(st))) return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st, key)} className={`${base} bg-amber-500/20 text-amber-900 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300`}>{marker} 👽</button>;
      return <button type="button" onClick={() => !isReader && toggleStatus(s.id, st || '', key)} className={`${base} bg-zinc-200/50 text-zinc-500 ring-zinc-300/50 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700`}>{marker} ?</button>;
    }
  };

  const tableColSpan = isReader ? 6 : 7;
  const activeSpecimen = specimens.find((s) => s.id === pcrModalId);

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
    <div ref={ptrRef} className={theme.page}>
      {uiTheme === 'glass' && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] opacity-50 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-400/40 blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-400/30 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>
      )}

      <datalist id="labs-list">{suggestions.labs.map((l: string) => <option key={l} value={l} />)}</datalist>
      <datalist id="ops-list">{suggestions.operators.map((o: string) => <option key={o} value={o} />)}</datalist>
      <datalist id="methods-list">{suggestions.methods.map((m: string) => <option key={m} value={m} />)}</datalist>

      {toast && (
        <div className="fixed z-[100] max-w-sm rounded-2xl border border-zinc-200/80 bg-white/95 px-5 py-3 text-sm shadow-2xl backdrop-blur-md dark:border-zinc-600 dark:bg-zinc-900/95 max-md:safe-pb left-4 right-4 max-md:bottom-24 md:bottom-6 md:right-6 md:left-auto">
          {toast}
        </div>
      )}

      {!isOnline && (
        <div className="mb-4 rounded-2xl border border-amber-300/80 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm backdrop-blur-sm dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100 print:hidden z-10 relative">
          <strong>Нет сети.</strong> Запросы к серверу не выполняются.
        </div>
      )}

      <header className={`mb-6 p-5 print:hidden relative z-10 ${theme.card}`}>
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
              <span 
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-md cursor-pointer select-none"
                onClick={() => setLogoClicks(p => p + 1)}
              >
                <FlaskConical className="h-5 w-5" strokeWidth={1.75} />
              </span>
              Журнал ДНК
              {isOnline ? <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Роль: {role}</p>
            {recentIds.length > 0 && (
              <div className="mt-3 md:hidden">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Недавние</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {recentIds.map((id) => (
                    <button key={id} onClick={() => { setSearch(id); setCurrentPage(1); setQuickFilter('ALL'); }} className="shrink-0 rounded-full bg-zinc-200/90 px-3 py-1.5 font-mono text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{id}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 md:w-auto md:flex-1 md:items-end">
            <div className="relative w-full md:max-w-xs">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
               <input ref={searchInputRef} type="search" placeholder="Поиск..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className={`${theme.input} pl-9 min-h-[44px]`} />
            </div>
            
            <div className="hidden flex-wrap justify-end gap-2 md:flex">
              <button onClick={() => setShortcutsOpen(true)} className={theme.iconBtn} title="Горячие клавиши"><Keyboard className="h-4 w-4" /></button>
              <button onClick={() => setShowAdvFilter(!showAdvFilter)} className={`${theme.iconBtn} ${showAdvFilter ? 'text-teal-600 bg-teal-50 border-teal-200' : ''}`} title="Умный фильтр"><Filter className="h-4 w-4" /></button>
              {!isReader && <button onClick={() => setIsAddModalOpen(true)} className={theme.btnPrimary}><Plus className="h-4 w-4 inline mr-1" />Новая</button>}
              <button onClick={exportToExcel} className={theme.btnSecondary} title="Вся база"><Download className="h-4 w-4 inline mr-1" />Вся база</button>
              <button onClick={exportFilteredExcel} className={theme.btnSecondary} title="Список"><Download className="h-4 w-4 inline mr-1" />Список</button>
              <button onClick={() => fetchSpecimens()} disabled={dataLoading} className={theme.iconBtn}><RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} /></button>
              <button onClick={() => setDarkMode(!darkMode)} className={theme.iconBtn}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
              {role === 'ADMIN' && <Link href="/admin" className={`${theme.btnSecondary} text-violet-700`}><Settings className="h-4 w-4 inline mr-1" />Админ</Link>}
            </div>
            <div className="flex flex-wrap gap-2 md:hidden">
              {!isReader && <button onClick={() => setIsAddModalOpen(true)} className={`touch-target flex-1 ${theme.btnPrimary}`}><Plus className="h-4 w-4" /> Новая</button>}
              <button onClick={() => fetchSpecimens()} className={`touch-target ${theme.iconBtn}`}><RefreshCw className={`h-5 w-5 ${dataLoading ? 'animate-spin' : ''}`} /></button>
              <button onClick={() => setToolsSheetOpen(true)} className={`touch-target flex-1 ${theme.btnSecondary}`}><MoreHorizontal className="h-5 w-5 mr-1 inline" /> Ещё</button>
            </div>
          </div>
        </div>

        {showAdvFilter && (
          <div className="mt-4 rounded-2xl bg-white/50 dark:bg-zinc-950/50 p-4 border border-zinc-200/50 dark:border-zinc-800/50">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Интеллектуальный фильтр ПЦР</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="Fwd праймер" value={filterFwd} onChange={e => setFilterFwd(e.target.value)} className={theme.input} />
              <input placeholder="Rev праймер" value={filterRev} onChange={e => setFilterRev(e.target.value)} className={theme.input} />
              <input placeholder="ДНК-матрица" value={filterMatrix} onChange={e => setFilterMatrix(e.target.value)} className={theme.input} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 border-t border-zinc-200/50 pt-5 sm:grid-cols-3 dark:border-zinc-700/50 mt-4">
          <div className={theme.statCard}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Всего проб</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{specimens.length}</p>
          </div>
          <div className={`${theme.statCard} ${uiTheme !== 'md3' ? 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20' : ''}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Успешные ITS</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{successCount}</p>
          </div>
          <div className={`${theme.statCard} ${uiTheme !== 'md3' ? 'border-rose-200/60 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20' : ''}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Остальные</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-rose-700 dark:text-rose-400">{specimens.length - successCount}</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500" style={{ width: `${successPercent}%` }} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
  {(['ALL', 'SUCCESS', 'ERROR', 'FAVORITES'] as const).map((key) => (
    <button 
      key={key} 
      onClick={() => setQuickFilter(key)} 
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
        quickFilter === key 
          ? 'bg-zinc-900 text-white shadow dark:bg-teal-600' 
          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300'
      }`}
    >
      {key === 'FAVORITES' ? (
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" />Избранное
        </span>
      ) : key === 'ALL' ? 'Все' : key === 'SUCCESS' ? 'Успешные' : 'С ошибками'}
    </button>
  ))}
</div>
      </header>

      {!isReader && selectedIds.length > 0 && (
  <div className={`sticky top-3 z-20 mb-6 flex flex-col gap-3 p-4 shadow-lg print:hidden ${theme.card} bg-teal-50/95 dark:bg-teal-950/80 border-teal-200 dark:border-teal-800`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">Выбрано: {selectedIds.length}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportExtractionJournal} className={theme.btnSecondary}>
          <FileSpreadsheet className="h-4 w-4 inline mr-1" /> Журнал выделений
        </button>
        {isAdmin && (
          <button onClick={handleMassDelete} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500">
            <Trash2 className="h-4 w-4 inline mr-1" /> Удалить
          </button>
        )}
        <button onClick={() => setSelectedIds(filteredSpecimens.map(s => s.id))} className={theme.btnSecondary}>
          Все в фильтре
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <input 
        list="labs-list" 
        placeholder="Лаборатория" 
        value={massUpdate.lab} 
        onChange={(e) => setMassUpdate({ ...massUpdate, lab: e.target.value })} 
        className={theme.input} 
      />
      <input 
        list="ops-list" 
        placeholder="Кто выделял" 
        value={massUpdate.operator} 
        onChange={(e) => setMassUpdate({ ...massUpdate, operator: e.target.value })} 
        className={theme.input} 
      />
      <input 
        list="methods-list" 
        placeholder="Метод" 
        value={massUpdate.method} 
        onChange={(e) => setMassUpdate({ ...massUpdate, method: e.target.value })} 
        className={theme.input} 
      />
      <input 
        placeholder="Конц. ДНК" 
        value={massUpdate.dnaConcentration} 
        onChange={(e) => setMassUpdate({ ...massUpdate, dnaConcentration: e.target.value })} 
        className={theme.input} 
      />
    </div>
    <button onClick={handleMassUpdate} className={theme.btnPrimary}>
      <Beaker className="h-4 w-4 inline mr-1" /> Применить
    </button>
  </div>
)}

      <div className={`overflow-hidden relative z-10 print:border-none print:shadow-none print:bg-transparent ${theme.card}`}>
        <div className="hidden overflow-x-auto md:block print:block">
          <table className="w-full border-collapse text-left">
            <thead className={`sticky top-0 z-10 text-sm ${theme.tableHeader}`}>
              <tr>
                {!isReader && <th className="w-10 p-3 text-center print:hidden"><input type="checkbox" onChange={() => selectedIds.length === currentData.length ? setSelectedIds([]) : setSelectedIds(currentData.map(s => s.id))} checked={selectedIds.length === currentData.length && currentData.length > 0} className="rounded" /></th>}
                <th className="cursor-pointer p-3 font-semibold hover:text-teal-600" onClick={() => handleSort('id')}>ID {sortKey === 'id' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="cursor-pointer p-3 font-semibold hover:text-teal-600" onClick={() => handleSort('taxon')}>Таксон {sortKey === 'taxon' && (sortOrder === 1 ? '↑' : '↓')}</th>
                <th className="hidden max-w-[14rem] p-3 font-semibold xl:table-cell">Заметки</th>
                <th className="p-3 font-semibold">Выделение</th>
                <th className="p-3 font-semibold min-w-[180px]">Маркеры</th>
                <th className="p-3 text-center font-semibold print:hidden">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-700/50 text-sm">
              {dataLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={theme.tableRow}>
                    {!isReader && <td className="p-3"><div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /></td>}
                    <td className="p-3"><div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /></td>
                    <td className="p-3"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /></td>
                    <td className="hidden xl:table-cell p-3"><div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /></td>
                    <td className="p-3"><div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" /></td>
                    <td className="p-3"><div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full" /></td>
                    <td className="p-3"><div className="h-6 w-6 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded-full mx-auto" /></td>
                  </tr>
                 ))
              ) : currentData.length === 0 ? (
                <tr><td colSpan={tableColSpan} className="p-12 text-center text-zinc-500">Пусто.</td></tr>
              ) : (
                currentData.map((s) => (
                  <tr key={s.id} className={`${theme.tableRow} ${selectedIds.includes(s.id) ? 'bg-teal-50/50 dark:bg-teal-900/20' : ''}`}>
                    {!isReader && <td className="p-3 text-center print:hidden"><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => setSelectedIds(p => p.includes(s.id) ? p.filter(i => i !== s.id) : [...p, s.id])} className="rounded" /></td>}
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-1 font-mono font-bold text-teal-700 dark:text-teal-400">
                        <button type="button" onClick={() => toggleFavorite(s.id)} className={`rounded p-0.5 print:hidden ${favSet.has(s.id) ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-400'}`}><Star className={`h-4 w-4 ${favSet.has(s.id) ? 'fill-current' : ''}`} /></button>
                        <button type="button" onClick={() => copySpecimenLink(s.id)} className="rounded p-0.5 text-zinc-400 hover:text-teal-600 print:hidden"><Link2 className="h-4 w-4" /></button>
                        <span className="break-all"><HighlightMatch text={s.id} query={search} /></span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{s.taxon ? <HighlightMatch text={String(s.taxon)} query={search} /> : '—'}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{s.locality}</div>
                    </td>
                    <td className="hidden max-w-[14rem] align-top p-3 xl:table-cell">
                      {s.notes ? <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-zinc-600 dark:text-zinc-400" title={s.notes}>{s.notes}</p> : <span className="text-xs text-zinc-400">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{s.extrLab || '—'} <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ''}</span></div>
                      <div className="text-xs text-zinc-500 mt-0.5">{s.extrMethod}</div>
                    </td>
                    <td className="p-3 flex gap-1 flex-wrap">
                      {renderMarkerStatus(s, 'ITS')}
                      {s.ssuStatus && renderMarkerStatus(s, 'SSU')}
                      {s.lsuStatus && renderMarkerStatus(s, 'LSU')}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                            {!isReader && (
                                <button 
                                  type="button" 
                                  onClick={() => setEditingSpecimen(s)} 
                                  className="p-1.5 text-zinc-400 hover:text-teal-600 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700" 
                                  title="Изменить">
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            type="button" 
                            onClick={() => setPcrModalId(s.id)} 
                            className={`p-1.5 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-700 ${
                              s.attempts?.length ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400'
                            }`} 
                            title="ПЦР"
                          >
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
           {!dataLoading && currentData.map((s) => (
             <MobileSpecimenCard key={s.id} s={s} isReader={isReader} selected={selectedIds.includes(s.id)} onToggleSelect={() => setSelectedIds((p) => (p.includes(s.id) ? p.filter((i) => i !== s.id) : [...p, s.id]))} onPcr={() => setPcrModalId(s.id)} onEdit={() => setEditingSpecimen(s)} renderStatus={renderMarkerStatus} favorite={favSet.has(s.id)} onToggleFavorite={() => toggleFavorite(s.id)} searchQuery={search} theme={uiTheme} />
           ))}
        </div>
        
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-zinc-200/50 bg-zinc-50/50 p-4 text-sm dark:border-zinc-800/50 dark:bg-zinc-900/30 print:hidden">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className={theme.btnSecondary}>Назад</button>
            <span className="text-zinc-600 dark:text-zinc-400">Стр. {currentPage} из {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className={theme.btnSecondary}>Вперёд</button>
          </div>
        )}
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
          <button type="button" className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" onClick={() => setToolsSheetOpen(false)} />
          <div className={`safe-pb absolute bottom-0 left-0 right-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-zinc-200/50 bg-white/95 px-4 pb-4 pt-2 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/95`}>
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={() => { setToolsSheetOpen(false); exportExtractionJournal(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-teal-50 py-3 text-sm font-medium text-teal-900 dark:bg-teal-950/40 dark:text-teal-100"><FileSpreadsheet className="h-4 w-4" /> Журнал выделений</button>
              <button onClick={() => { setToolsSheetOpen(false); exportToExcel(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><Download className="h-4 w-4" /> Вся база (Excel)</button>
              <button onClick={() => { setToolsSheetOpen(false); exportCsv(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><FileText className="h-4 w-4" /> Список (CSV)</button>
              <button onClick={() => { setToolsSheetOpen(false); window.print(); }} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-100/80 py-3 text-sm font-medium dark:bg-zinc-800/80"><Printer className="h-4 w-4" /> Печать</button>
              {role === 'ADMIN' && <Link href="/admin" onClick={() => setToolsSheetOpen(false)} className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-violet-50 py-3 text-sm font-semibold text-violet-900 dark:bg-violet-950/40 dark:text-violet-100"><Settings className="h-4 w-4" /> Админ</Link>}
            </div>
            <button onClick={() => { setToolsSheetOpen(false); signOut(); }} className="mt-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"><LogOut className="h-4 w-4" /> Выйти</button>
          </div>
        </div>
      )}

      
      {!isReader && isAddModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${theme.card} w-full max-w-md p-6 relative`}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Новая проба</h2>
              <button onClick={() => setIsAddModalOpen(false)} className={theme.iconBtn}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleCreateRecord} className="flex flex-col gap-4">
              <input required placeholder="ID пробы *" value={newRecord.id} onChange={(e) => setNewRecord({ ...newRecord, id: e.target.value })} className={`${theme.input} ${validationError ? 'border-rose-500' : ''}`} />
              <input placeholder="Таксон" value={newRecord.taxon} onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })} className={theme.input} />
              <input list="labs-list" placeholder="Лаборатория" value={newRecord.extrLab} onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })} className={theme.input} />
              <input list="ops-list" placeholder="Лаборант" value={newRecord.extrOperator} onChange={(e) => setNewRecord({ ...newRecord, extrOperator: e.target.value })} className={theme.input} />
              <button type="submit" className={`mt-2 ${theme.btnPrimary}`}>Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {!isReader && editingSpecimen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${theme.card} my-4 w-full max-w-2xl p-6`}>
            <div className="mb-6 flex items-center justify-between gap-2">
              <h2 className="font-mono text-xl font-bold tracking-tight">Редактировать · {editingSpecimen.id}</h2>
              <button onClick={() => setEditingSpecimen(null)} className={theme.iconBtn}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Общая информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Таксон" value={editingSpecimen.taxon || ''} onChange={e => setEditingSpecimen({...editingSpecimen, taxon: e.target.value})} className={theme.input} />
                  <input placeholder="Место сбора (Locality)" value={editingSpecimen.locality || ''} onChange={e => setEditingSpecimen({...editingSpecimen, locality: e.target.value})} className={theme.input} />
                  <input placeholder="Коллектор" value={editingSpecimen.collector || ''} onChange={e => setEditingSpecimen({...editingSpecimen, collector: e.target.value})} className={theme.input} />
                  <textarea placeholder="Заметки" value={editingSpecimen.notes || ''} onChange={e => setEditingSpecimen({...editingSpecimen, notes: e.target.value})} className={`${theme.input} sm:col-span-2 min-h-[80px]`} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Выделение ДНК</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input list="labs-list" placeholder="Лаборатория" value={editingSpecimen.extrLab || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrLab: e.target.value})} className={theme.input} />
                  <input list="ops-list" placeholder="Кто выделял" value={editingSpecimen.extrOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrOperator: e.target.value})} className={theme.input} />
                  <input list="methods-list" placeholder="Метод" value={editingSpecimen.extrMethod || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrMethod: e.target.value})} className={theme.input} />
                  <input placeholder="Дата (Extr. Date)" value={editingSpecimen.extrDateRaw || ''} onChange={e => setEditingSpecimen({...editingSpecimen, extrDateRaw: e.target.value})} className={theme.input} />
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Концентрация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Оборудование (DNA meter)" value={editingSpecimen.dnaMeter || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaMeter: e.target.value})} className={theme.input} />
                  <input placeholder="Концентрация" value={editingSpecimen.dnaConcentration || ''} onChange={e => setEditingSpecimen({...editingSpecimen, dnaConcentration: e.target.value})} className={theme.input} />
                  <input placeholder="Кто измерял" value={editingSpecimen.measOperator || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measOperator: e.target.value})} className={theme.input} />
                  <input placeholder="Дата измерения" value={editingSpecimen.measDate || ''} onChange={e => setEditingSpecimen({...editingSpecimen, measDate: e.target.value})} className={theme.input} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <button type="button" onClick={() => setEditingSpecimen(null)} className={theme.btnSecondary}>Отмена</button>
                <button type="submit" className={theme.btnPrimary}><Save className="h-4 w-4 inline mr-1" /> Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

            {pcrModalId && activeSpecimen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div className={`${theme.card} my-4 w-full max-w-lg p-6`}>
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="font-mono text-xl font-bold tracking-tight flex items-center gap-2"><Activity className="text-teal-500 h-5 w-5"/> ПЦР · {pcrModalId}</h2>
              <button onClick={() => setPcrModalId('')} className={theme.iconBtn}><X className="h-4 w-4" /></button>
            </div>

            {activeSpecimen.notes && (
              <div className="mb-4 max-h-36 overflow-y-auto rounded-2xl border border-zinc-200/50 bg-zinc-50/50 p-3 text-sm dark:border-zinc-700/50 dark:bg-zinc-950/30">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Заметки пробы</p>
                <p className="whitespace-pre-wrap break-words">{activeSpecimen.notes}</p>
              </div>
            )}

            <div className="mb-6 max-h-52 space-y-3 overflow-y-auto pr-2">
              {activeSpecimen.attempts?.length === 0 ? (
                <div className="text-center py-6 text-sm text-zinc-500 bg-white/30 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">Пока нет записей ПЦР</div>
              ) : (
                activeSpecimen.attempts?.map((a: any) => (
                  <div key={a.id} className="rounded-2xl border border-zinc-200/50 bg-white/60 p-4 text-sm dark:border-zinc-700/50 dark:bg-zinc-800/60 shadow-sm backdrop-blur-md">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <span className="text-zinc-500">{new Date(a.date).toLocaleDateString('ru-RU')}</span>
                      <span className="font-bold">{a.volume} мкл</span>
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Новая попытка</p>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    placeholder="Объём (мкл)" 
                    value={pcrForm.volume} 
                    onChange={(e) => setPcrForm({ ...pcrForm, volume: e.target.value })} 
                    className={theme.input} 
                  />
                  <input 
                    placeholder="Маркер (ITS...)" 
                    value={pcrForm.marker} 
                    onChange={(e) => setPcrForm({ ...pcrForm, marker: e.target.value })} 
                    className={theme.input} 
                  />
                  <input 
                    placeholder="Fwd праймер" 
                    value={pcrForm.forwardPrimer} 
                    onChange={(e) => setPcrForm({ ...pcrForm, forwardPrimer: e.target.value })} 
                    className={theme.input} 
                  />
                  <input 
                    placeholder="Rev праймер" 
                    value={pcrForm.reversePrimer} 
                    onChange={(e) => setPcrForm({ ...pcrForm, reversePrimer: e.target.value })} 
                    className={theme.input} 
                  />
                </div>
                <input 
                  placeholder="Матрица ДНК (конц. / объём)" 
                  value={pcrForm.dnaMatrix} 
                  onChange={(e) => setPcrForm({ ...pcrForm, dnaMatrix: e.target.value })} 
                  className={theme.input} 
                />
                <select 
                  value={pcrForm.result} 
                  onChange={(e) => setPcrForm({ ...pcrForm, result: e.target.value })} 
                  className={theme.input}
                >
                  <option value="Fail">Провал</option>
                  <option value="Success">Успех</option>
                </select>
                <button 
                  type="button" 
                  onClick={handleAddAttempt} 
                  className={`mt-2 ${theme.btnPrimary}`}
                >
                  <Save className="h-4 w-4 inline mr-1" /> Добавить запись
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {themeModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="mb-5 flex items-center justify-between">
               <h2 className="text-xl font-bold flex items-center gap-2"><Palette className="text-violet-500" /> Выбор Темы</h2>
               <button onClick={() => setThemeModalOpen(false)} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setUiTheme('classic'); setThemeModalOpen(false); }} className={`p-4 rounded-2xl text-left border transition-all ${uiTheme === 'classic' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <p className="font-bold">Classic (Оригинал)</p>
                <p className="text-xs text-zinc-500 mt-1">Строгий, привычный дизайн со стандартными тенями и рамками.</p>
              </button>
              <button onClick={() => { setUiTheme('glass'); setThemeModalOpen(false); }} className={`p-4 rounded-2xl text-left border transition-all ${uiTheme === 'glass' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <p className="font-bold text-teal-600">Glassmorphism</p>
                <p className="text-xs text-zinc-500 mt-1">Жидкое стекло, размытие, плавающие цветовые градиенты на фоне.</p>
              </button>
              <button onClick={() => { setUiTheme('md3'); setThemeModalOpen(false); }} className={`p-4 rounded-2xl text-left border transition-all ${uiTheme === 'md3' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                <p className="font-bold text-blue-600">Material Design 3</p>
                <p className="text-xs text-zinc-500 mt-1">Крупные скругления, формы-таблетки, выраженные поверхности.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      <BarcodeScanDialog open={scanOpen} onClose={() => setScanOpen(false)} onCode={applyScannedCode} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} specimens={specimens} onPickSpecimen={(id) => { setSearch(id); setCurrentPage(1); setQuickFilter('ALL'); setPcrModalId(id); }} onNewSpecimen={() => setIsAddModalOpen(true)} onRefresh={() => void fetchSpecimens()} isReader={isReader} isAdmin={isAdmin} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} isReader={isReader} />
    </div>
  );
}