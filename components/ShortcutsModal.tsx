"use client";

import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void; isReader: boolean };

const rows = (isReader: boolean) =>
  [
    ["/", "Фокус на поиск"],
    ["?", "Эта подсказка"],
    ["Ctrl+K или ⌘K", "Палитра команд"],
    ["Esc", "Закрыть окна"],
    ...(isReader ? [] : [["N", "Новая проба"]]),
  ] as const;

export function ShortcutsModal({ open, onClose, isReader }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm print:hidden">
      <button type="button" className="absolute inset-0" aria-label="Закрыть" onClick={onClose} />
      <div
        role="dialog"
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Горячие клавиши</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {rows(isReader).map(([key, desc]) => (
              <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-3 font-mono text-xs text-teal-700 dark:text-teal-400">{key}</td>
                <td className="py-2 text-zinc-700 dark:text-zinc-300">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
