"use client";

import { X, Keyboard } from "lucide-react";
import { useEffect, useRef } from "react";

type Shortcut = {
  keys: string | string[];
  description: string;
  hint?: string;
};

type Props = { open: boolean; onClose: () => void; isReader: boolean };

const SHORTCUTS: (isReader: boolean) => Shortcut[] = (isReader) => [
  { keys: ["/"], description: "Фокус на поиск", hint: "Работает почти везде" },
  { keys: ["?"], description: "Показать это окно", hint: "Shift+/ для быстрого вызова" },
  { keys: ["Ctrl+K", "⌘K"], description: "Палитра команд", hint: "Команды и глобальный поиск" },
  { keys: ["Esc"], description: "Закрыть окна", hint: "Закрывает модальные окна и меню" },
  ...(!isReader ? [{ keys: ["N"], description: "Новая проба", hint: "Создать новую запись" }] : []),
];

function formatKeys(keys: string | string[]) {
  return Array.isArray(keys)
    ? keys.map(k =>
        <kbd
          key={k}
          className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs shadow-sm font-mono border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
        >
          {k}
        </kbd>
      ).reduce((prev, curr, i) => prev === null ? [curr] : [...prev, <span key={`or-${i}`} className="mx-1 text-[11px] text-zinc-400 dark:text-zinc-500">или</span>, curr], null as any) // null trick for reduce start
    : <kbd className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs shadow-sm font-mono border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">{keys}</kbd>;
}

export function ShortcutsModal({ open, onClose, isReader }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Позволяет закрыть модалку по Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Фокус на модалке для a11y
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm print:hidden"
      tabIndex={-1}
      aria-modal="true"
      aria-label="Горячие клавиши"
    >
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} tabIndex={-1} />
      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={0}
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 focus-visible:outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcuts-modal-title" className="text-lg font-semibold flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-teal-500" /> Горячие клавиши
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-teal-400/60"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <table className="w-full text-sm mb-1">
          <tbody>
            {SHORTCUTS(isReader).map((row, idx) => (
              <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 text-left">
                <td className="py-2 pr-3 font-mono text-xs text-teal-700 dark:text-teal-400 whitespace-nowrap align-top">
                  {formatKeys(row.keys)}
                </td>
                <td className="py-2 text-zinc-700 dark:text-zinc-300 align-top">
                  <span>{row.description}</span>
                  {row.hint &&
                    <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{row.hint}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 text-right select-none">
          Для доступа к клавишам клавиатура должна быть активна
        </div>
      </div>
    </div>
  );
}
