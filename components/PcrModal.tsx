"use client";

import { X, Activity, Save } from "lucide-react";
import type { PcrForm, Specimen } from "@/types";

const MD3 = {
  card: "bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200/50 dark:border-zinc-800/50",
  input: "w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 transition-all",
  btnPrimary: "inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg active:scale-95 transition-all",
  iconBtn: "inline-flex items-center justify-center p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 active:scale-95 transition-all",
};

function pcrResultLabelRu(result: string) {
  if (result === 'Success') return 'Успех';
  if (result === 'Fail') return 'Провал';
  return result;
}

type Props = {
  specimenId: string;
  activeSpecimen: Specimen | undefined;
  onClose: () => void;
  pcrForm: PcrForm;
  setPcrForm: (val: PcrForm) => void;
  onSubmit: () => void;
  isReader: boolean;
};

export function PcrModal({ specimenId, activeSpecimen, onClose, pcrForm, setPcrForm, onSubmit, isReader }: Props) {
  if (!specimenId || !activeSpecimen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-zinc-950/40 p-4 animate-in fade-in duration-200">
      <div className={`${MD3.card} my-4 w-full max-w-xl p-8 relative`}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Activity className="text-teal-600 h-6 w-6" /> ПЦР · {specimenId}
          </h2>
          <button type="button" onClick={onClose} className={MD3.iconBtn}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeSpecimen.notes && (
          <div className="mb-6 max-h-32 overflow-y-auto rounded-[1.5rem] bg-amber-50 p-4 text-sm dark:bg-amber-900/10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">Заметки пробы</p>
            <p className="whitespace-pre-wrap break-words text-amber-900 dark:text-amber-200">{activeSpecimen.notes}</p>
          </div>
        )}

        <div className="mb-8 max-h-60 space-y-4 overflow-y-auto pr-2">
          {!activeSpecimen.attempts || activeSpecimen.attempts.length === 0 ? (
            <div className="text-center py-10 text-sm font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-700">
              Пока нет записей ПЦР
            </div>
          ) : (
            activeSpecimen.attempts.map((a: any) => (
              <div key={a.id} className="rounded-[1.5rem] bg-zinc-50 p-5 dark:bg-zinc-800/50">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                  <span className="text-sm font-medium text-zinc-500">
                    {new Date(a.date).toLocaleDateString('ru-RU')}
                  </span>
                  <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    {a.volume} мкл
                  </span>
                  <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider ${a.result === 'Success'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                    }`}>
                    {pcrResultLabelRu(a.result)}
                  </span>
                </div>
                {(a.marker || a.forwardPrimer || a.reversePrimer || a.dnaMatrix) && (
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    {a.marker && (
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        Маркер: <b>{a.marker}</b>
                      </span>
                    )}
                    {a.forwardPrimer && (
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        F: {a.forwardPrimer}
                      </span>
                    )}
                    {a.reversePrimer && (
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        R: {a.reversePrimer}
                      </span>
                    )}
                    {a.dnaMatrix && (
                      <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-100 dark:border-zinc-800">
                        Матрица: {a.dnaMatrix}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {!isReader && (
          <div className="flex flex-col gap-4 pt-6 border-t-2 border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">
              Новая попытка
            </p>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Объём (мкл)"
                value={pcrForm.volume}
                onChange={e =>
                  setPcrForm({ ...pcrForm, volume: e.target.value })
                }
                className={MD3.input}
              />
              <input
                placeholder="Маркер (ITS...)"
                value={pcrForm.marker}
                onChange={e =>
                  setPcrForm({ ...pcrForm, marker: e.target.value })
                }
                className={MD3.input}
              />
              <input
                placeholder="Fwd праймер"
                value={pcrForm.forwardPrimer}
                onChange={e =>
                  setPcrForm({ ...pcrForm, forwardPrimer: e.target.value })
                }
                className={MD3.input}
              />
              <input
                placeholder="Rev праймер"
                value={pcrForm.reversePrimer}
                onChange={e =>
                  setPcrForm({ ...pcrForm, reversePrimer: e.target.value })
                }
                className={MD3.input}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Матрица ДНК (конц. / объём)"
                value={pcrForm.dnaMatrix}
                onChange={e =>
                  setPcrForm({ ...pcrForm, dnaMatrix: e.target.value })
                }
                className={MD3.input}
                autoComplete="off"
                spellCheck={false}
                maxLength={64}
                inputMode="text"
              />
              <select
                value={pcrForm.result}
                onChange={e =>
                  setPcrForm({
                    ...pcrForm,
                    result: e.target.value as "Fail" | "Success",
                  })
                }
                className={`${MD3.input} cursor-pointer font-bold text-base`}
              >
                <option value="Success" className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Успех
                </option>
                <option value="Fail" className="text-rose-700 dark:text-rose-400 font-bold">
                  Провал
                </option>
              </select>
            </div>
            <button type="button" onClick={onSubmit} className={`mt-4 ${MD3.btnPrimary}`}>
              <Save className="h-5 w-5" /> Добавить запись
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
