"use client";

import { X } from "lucide-react";
import type { NewRecordForm } from "@/types";

const MD3 = {
  card: "bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200/50 dark:border-zinc-800/50",
  input: "w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 transition-all",
  btnPrimary: "inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg active:scale-95 transition-all",
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

export function AddSpecimenModal({ open, onClose, newRecord, setNewRecord, onSubmit, validationError }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-zinc-950/40 p-4 animate-in fade-in duration-200">
      <div className={`${MD3.card} w-full max-w-md p-8 relative`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Новая проба</h2>
          <button type="button" onClick={onClose} className={MD3.iconBtn}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input 
            required 
            placeholder="ID пробы *" 
            value={newRecord.id} 
            onChange={(e) => setNewRecord({ ...newRecord, id: e.target.value })} 
            className={`${MD3.input} ${validationError ? 'ring-2 ring-rose-500' : ''}`} 
          />
          <input 
            placeholder="Таксон" 
            value={newRecord.taxon} 
            onChange={(e) => setNewRecord({ ...newRecord, taxon: e.target.value })} 
            className={MD3.input} 
          />
          <input 
            list="labs-list" 
            placeholder="Лаборатория" 
            value={newRecord.extrLab} 
            onChange={(e) => setNewRecord({ ...newRecord, extrLab: e.target.value })} 
            className={MD3.input} 
          />
          <input 
            list="ops-list" 
            placeholder="Лаборант" 
            value={newRecord.extrOperator} 
            onChange={(e) => setNewRecord({ ...newRecord, extrOperator: e.target.value })} 
            className={MD3.input} 
          />
          <button type="submit" className={`mt-4 ${MD3.btnPrimary}`}>Сохранить</button>
        </form>
      </div>
    </div>
  );
}