"use client";

import { Barcode, Camera, Activity, Share2, Copy, Star, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { HighlightMatch } from "@/lib/highlight";

export type MobileSpecimenShape = {
  id: string;
  taxon?: string | null;
  locality?: string | null;
  notes?: string | null;
  extrLab?: string | null;
  extrOperator?: string | null;
  extrMethod?: string | null;
  imageUrl?: string | null;
  itsStatus?: string | null;
  ssuStatus?: string | null;
  lsuStatus?: string | null;
  mcm7Status?: string | null;
  attempts?: unknown[];
};

type Props = {
  s: MobileSpecimenShape;
  isReader: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onPcr: () => void;
  onEdit: () => void;
  renderStatus: (s: MobileSpecimenShape, marker: 'ITS' | 'SSU' | 'LSU' | 'MCM7') => ReactNode;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  searchQuery?: string;
};

export function MobileSpecimenCard({
  s, isReader, selected, onToggleSelect, onPcr, onEdit, renderStatus, favorite, onToggleFavorite, searchQuery = ""
}: Props) {
  
  const copyId = async () => { try { await navigator.clipboard.writeText(s.id); } catch {} };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Проба ${s.id}`, text: s.id });
      else await copyId();
    } catch {}
  };

  // Строгий MD3 дизайн карточки
  let articleClass = "transition-all duration-300 relative rounded-[2rem] p-5 border shadow-sm ";
  if (selected) {
    articleClass += "border-teal-400 bg-teal-50 dark:border-teal-700/50 dark:bg-teal-900/20";
  } else {
    articleClass += "border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900";
  }

  // Единый MD3 класс для круглых кнопок действий
  const btnClass = "touch-target transition rounded-full p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700";

  return (
    <article className={articleClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {!isReader && (
             <div className="relative flex items-center justify-center pt-1 shrink-0">
                <input 
                  type="checkbox" 
                  className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-zinc-300 checked:border-teal-500 checked:bg-teal-500 dark:border-zinc-600 transition-all" 
                  checked={selected} 
                  onChange={onToggleSelect} 
                />
                <svg className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
             </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              <Barcode className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <span className="break-all"><HighlightMatch text={s.id} query={searchQuery} /></span>
              {s.imageUrl && (
                <a href={s.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Гель">
                  <Camera className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </a>
              )}
            </div>
            <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-100">{s.taxon || "—"}</p>
            {s.locality && <p className="truncate text-xs text-zinc-500">{s.locality}</p>}
          </div>
        </div>
        
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5 w-[6rem]">
          {onToggleFavorite && (
            <button type="button" onClick={onToggleFavorite} className={`${btnClass} ${favorite ? "text-amber-500" : "text-zinc-400"}`}>
              <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
            </button>
          )}
          <button type="button" onClick={copyId} className={`${btnClass} text-zinc-500`}><Copy className="h-4 w-4" /></button>
          {!isReader && <button type="button" onClick={onEdit} className={`${btnClass} text-zinc-500`}><Pencil className="h-4 w-4" /></button>}
          {typeof navigator !== "undefined" && "share" in navigator ? (
            <button type="button" onClick={share} className={`${btnClass} text-zinc-500`}><Share2 className="h-4 w-4" /></button>
          ) : null}
          <button type="button" onClick={onPcr} className={`${btnClass} ${(s.attempts?.length ?? 0) > 0 ? "text-teal-600 dark:text-teal-400" : "text-zinc-500"}`}>
            <Activity className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {s.notes && (
        <div className="mt-4 bg-amber-50/50 dark:bg-amber-900/10 p-3.5 rounded-2xl text-xs text-amber-900 dark:text-amber-200 line-clamp-2 whitespace-pre-wrap break-words border border-amber-100/50 dark:border-amber-900/20">
          {s.notes}
        </div>
      )}
      
      <div className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200/50 dark:border-zinc-800/50 text-sm">
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Выделение</p>
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            {s.extrLab || "—"} <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ""}</span>
          </p>
          <p className="text-xs text-zinc-500">{s.extrMethod}</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Маркеры</p>
          <div className="flex flex-wrap gap-2">
            {renderStatus(s, 'ITS')}
            {s.ssuStatus && renderStatus(s, 'SSU')}
            {s.lsuStatus && renderStatus(s, 'LSU')}
            {s.mcm7Status && renderStatus(s, 'MCM7')}
          </div>
        </div>
      </div>
    </article>
  );
}