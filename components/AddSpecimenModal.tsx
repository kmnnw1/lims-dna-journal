"use client";

import { X } from "lucide-react";
import type { NewRecordForm } from "@/types";
import { useRef, useEffect } from "react";

const MD3 = {
  card: "bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/80",
  input: "w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400/90 dark:placeholder:text-zinc-500",
  btnPrimary: "inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg active:scale-95 transition-all",
  iconBtn: "inline-flex items-center justify-center p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 active:scale-95 transition-all",
};

type Props = {
  open: boolean;
  onClose: () => void;
  newRecord: NewRecordForm;
  setNewRecord: (val: NewRecordForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  validationError: boolean;
};

export function AddSpecimenModal({
  open,
  onClose,
  newRecord,
  setNewRecord,
  onSubmit,
  validationError,
}: Props) {
  const idInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus на "ID пробы" при открытии
  useEffect(() => {
    if (open && idInputRef.current) {
      idInputRef.current.focus();
    }
  }, [open]);

  // Закрытие по Escape
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

  // Клик вне модалки — закрыть
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/40 p-4 animate-in fade-in duration-200 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className={`${MD3.card} w-full max-w-md p-8 relative`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Новая проба
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={MD3.iconBtn}
            title="Закрыть"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
          autoComplete="off"
        >
          <input
            ref={idInputRef}
            required
            autoFocus
            maxLength={30}
            placeholder="ID пробы *"
            value={newRecord.id}
            spellCheck={false}
            onChange={(e) =>
              setNewRecord({ ...newRecord, id: e.target.value.replace(/\s/g, "") })
            }
            className={`${MD3.input} ${validationError ? "ring-2 ring-rose-500" : ""}`}
            data-testid="addspecimen-id"
          />
          <input
            placeholder="Таксон"
            value={newRecord.taxon}
            maxLength={80}
            onChange={(e) =>
              setNewRecord({ ...newRecord, taxon: e.target.value })
            }
            className={MD3.input}
            data-testid="addspecimen-taxon"
          />
          <input
            list="labs-list"
            placeholder="Лаборатория"
            value={newRecord.extrLab}
            maxLength={40}
            onChange={(e) =>
              setNewRecord({ ...newRecord, extrLab: e.target.value })
            }
            className={MD3.input}
            data-testid="addspecimen-lab"
          />
          <input
            list="ops-list"
            placeholder="Лаборант"
            value={newRecord.extrOperator}
            maxLength={40}
            onChange={(e) =>
              setNewRecord({ ...newRecord, extrOperator: e.target.value })
            }
            className={MD3.input}
            data-testid="addspecimen-operator"
          />
          <button
            type="submit"
            className={`mt-4 ${MD3.btnPrimary}`}
            data-testid="addspecimen-submit"
          >
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
}
