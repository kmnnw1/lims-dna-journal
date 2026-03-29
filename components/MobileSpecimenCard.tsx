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
  theme?: 'classic' | 'glass' | 'md3';
};

export function MobileSpecimenCard({
  s, isReader, selected, onToggleSelect, onPcr, onEdit, renderStatus, favorite, onToggleFavorite, searchQuery = "", theme = 'classic'
}: Props) {
  
  const copyId = async () => { try { await navigator.clipboard.writeText(s.id); } catch {} };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `Проба ${s.id}`, text: s.id });
      else await copyId();
    } catch {}
  };

  const isGlass = theme === 'glass';
  const isMd3 = theme === 'md3';

  let articleClass = "transition-all duration-300 relative ";
  if (isGlass) {
    articleClass += `rounded-[2rem] p-5 border backdrop-blur-xl shadow-sm ${selected ? "border-teal-400 bg-teal-50/80 dark:border-teal-700 dark:bg-teal-900/30 ring-1 ring-teal-500" : "border-white/40 bg-white/60 dark:border-zinc-700/50 dark:bg-zinc-900/60 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]"}`;
  } else if (isMd3) {
    articleClass += `rounded-[2rem] p-5 ${selected ? "bg-teal-50 dark:bg-teal-900/20" : "bg-white dark:bg-zinc-900 shadow-sm"}`;
  } else {
    articleClass += `rounded-2xl border p-4 shadow-sm ${selected ? "border-teal-400 bg-teal-50/80 dark:border-teal-700 dark:bg-teal-950/30" : "border-zinc-200/80 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"}`;
  }

  let btnClass = "touch-target transition ";
  if (isGlass) btnClass += "rounded-full p-2 bg-white/50 border border-white/50 hover:bg-white dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:hover:bg-zinc-700 backdrop-blur-md ";
  else if (isMd3) btnClass += "rounded-full p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 ";
  else btnClass += "rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ";

  return (
    <article className={articleClass}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {!isReader && (
             <div className="relative flex items-center justify-center pt-1 shrink-0">
               {isGlass || isMd3 ? (
                  <>
                    <input type="checkbox" className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-zinc-300 checked:border-teal-500 checked:bg-teal-500 dark:border-zinc-600 transition-all" checked={selected} onChange={onToggleSelect} />
                    <svg className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </>
               ) : (
                  <input type="checkbox" className="mt-1 size-5 shrink-0 touch-manipulation" checked={selected} onChange={onToggleSelect} />
               )}
             </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              <Barcode className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <span className="break-all"><HighlightMatch text={s.id} query={searchQuery} /></span>
              {s.imageUrl && <a href={s.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Гель"><Camera className="h-4 w-4 text-teal-600 dark:text-teal-400" /></a>}
            </div>
            <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-100">{s.taxon || "—"}</p>
            {s.locality && <p className="truncate text-xs text-zinc-500">{s.locality}</p>}
          </div>
        </div>
        
        <div className={`flex shrink-0 flex-wrap justify-end gap-1.5 ${isGlass || isMd3 ? 'w-[6rem]' : 'w-[4.5rem]'}`}>
          {onToggleFavorite && <button type="button" onClick={onToggleFavorite} className={`${btnClass} ${favorite ? "text-amber-500" : "text-zinc-400"}`}><Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>}
          <button type="button" onClick={copyId} className={`${btnClass} text-zinc-500`}><Copy className="h-4 w-4" /></button>
          {!isReader && <button type="button" onClick={onEdit} className={`${btnClass} text-zinc-500`}><Pencil className="h-4 w-4" /></button>}
          {typeof navigator !== "undefined" && "share" in navigator && !isGlass && !isMd3 ? <button type="button" onClick={share} className={`${btnClass} text-zinc-500`}><Share2 className="h-4 w-4" /></button> : null}
          <button type="button" onClick={onPcr} className={`${btnClass} ${(s.attempts?.length ?? 0) > 0 ? "text-teal-600 dark:text-teal-400" : "text-zinc-500"}`}><Activity className="h-4 w-4" /></button>
        </div>
      </div>
      
      {s.notes && (
        <div className={`mt-3 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 ${isGlass || isMd3 ? 'bg-zinc-50/50 dark:bg-zinc-950/30 p-3 rounded-2xl' : 'whitespace-pre-wrap break-words'}`}>
          {s.notes}
        </div>
      )}
      
      <div className={`mt-3 pt-3 text-sm ${isGlass || isMd3 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200/50 dark:border-zinc-700/50' : 'border-t border-zinc-100 dark:border-zinc-700'}`}>
        <div className="flex flex-col gap-1">
          {(isGlass || isMd3) && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Выделение</p>}
          <p className="font-medium text-zinc-800 dark:text-zinc-100">
            {s.extrLab || "—"} <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ""}</span>
          </p>
          <p className="text-xs text-zinc-500">{s.extrMethod}</p>
        </div>
        
        <div className={`flex flex-col ${isGlass || isMd3 ? 'gap-1' : 'mt-2 justify-start'}`}>
          {(isGlass || isMd3) && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Маркеры</p>}
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