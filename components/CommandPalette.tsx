"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FlaskConical, Search, Plus, Settings, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";

type Spec = { id: string; taxon?: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  specimens: Spec[];
  onPickSpecimen: (id: string) => void;
  onNewSpecimen: () => void;
  onRefresh: () => void;
  isReader: boolean;
  isAdmin: boolean;
};

export function CommandPalette({
  open,
  onClose,
  specimens,
  onPickSpecimen,
  onNewSpecimen,
  onRefresh,
  isReader,
  isAdmin,
}: Props) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return specimens.slice(0, 24);
    return specimens
      .filter(
        (x) =>
          x.id.toLowerCase().includes(s) ||
          (x.taxon && String(x.taxon).toLowerCase().includes(s))
      )
      .slice(0, 40);
  }, [specimens, q]);

  const actions = useMemo(() => {
    const a: { id: string; label: string; icon: ReactNode; run: () => void }[] = [
      { id: "refresh", label: "Обновить данные", icon: <RefreshCw className="h-4 w-4" />, run: onRefresh },
    ];
    if (!isReader) {
      a.push({
        id: "new",
        label: "Новая проба",
        icon: <Plus className="h-4 w-4" />,
        run: onNewSpecimen,
      });
    }
    if (isAdmin) {
      a.push({
        id: "admin",
        label: "Админ-панель",
        icon: <Settings className="h-4 w-4" />,
        run: () => {
          window.location.href = "/admin";
        },
      });
    }
    return a;
  }, [isReader, isAdmin, onNewSpecimen, onRefresh]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center bg-zinc-950/55 p-4 pt-[12vh] backdrop-blur-sm print:hidden">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Закрыть" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmd-palette-title"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-600 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <Search className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
          <input
            ref={inputRef}
            id="cmd-palette-title"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Команда или ID / таксон…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:inline dark:border-zinc-600">
            Esc
          </kbd>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2 text-sm">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Действия</p>
          <ul className="space-y-0.5">
            {actions.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    a.run();
                    onClose();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  {a.icon}
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="mb-1 mt-3 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Пробы</p>
          <ul className="space-y-0.5">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-zinc-500">Ничего не найдено</li>
            ) : (
              filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPickSpecimen(s.id);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left font-mono text-xs transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="min-w-0 truncate font-semibold">{s.id}</span>
                    {s.taxon ? <span className="truncate text-zinc-500">{s.taxon}</span> : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
          <span className="flex items-center gap-1">
            <FlaskConical className="h-3 w-3" /> Журнал
          </span>
          {isAdmin ? (
            <Link href="/admin" className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400" onClick={onClose}>
              <ExternalLink className="h-3 w-3" />
              Админ
            </Link>
          ) : (
            <span>Ctrl+K</span>
          )}
        </div>
      </div>
    </div>
  );
}
