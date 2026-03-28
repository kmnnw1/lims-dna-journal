"use client";

import { Barcode, Camera, Activity, Share2, Copy, Star } from "lucide-react";
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
  attempts?: unknown[];
};

type Props = {
  s: MobileSpecimenShape;
  isReader: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onPcr: () => void;
  renderStatus: (s: MobileSpecimenShape) => ReactNode;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  searchQuery?: string;
};

export function MobileSpecimenCard({
  s,
  isReader,
  selected,
  onToggleSelect,
  onPcr,
  renderStatus,
  favorite,
  onToggleFavorite,
  searchQuery = "",
}: Props) {
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(s.id);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Проба ${s.id}`, text: s.id });
      } else {
        await copyId();
      }
    } catch {
      /* user cancel */
    }
  };

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        selected
          ? "border-teal-400 bg-teal-50/80 dark:border-teal-700 dark:bg-teal-950/30"
          : "border-zinc-200/80 bg-white dark:border-zinc-700 dark:bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {!isReader && (
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 touch-manipulation"
              checked={selected}
              onChange={onToggleSelect}
              aria-label={`Выбрать ${s.id}`}
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              <Barcode className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
              <span className="break-all">
                <HighlightMatch text={s.id} query={searchQuery} />
              </span>
              {s.imageUrl && (
                <a href={s.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" title="Гель">
                  <Camera className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </a>
              )}
            </div>
            <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-100">{s.taxon || "—"}</p>
            {s.locality ? <p className="truncate text-xs text-zinc-500">{s.locality}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {onToggleFavorite ? (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`touch-target rounded-xl p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                favorite ? "text-amber-500" : "text-zinc-400"
              }`}
              aria-label={favorite ? "Убрать из избранного" : "В избранное"}
            >
              <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={copyId}
            className="touch-target rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Копировать ID"
          >
            <Copy className="h-4 w-4" />
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && typeof navigator.share === "function" ? (
            <button
              type="button"
              onClick={share}
              className="touch-target rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Поделиться"
            >
              <Share2 className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPcr}
            className="touch-target rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Журнал ПЦР"
          >
            <Activity className={`h-5 w-5 ${(s.attempts?.length ?? 0) > 0 ? "text-teal-600 dark:text-teal-400" : ""}`} />
          </button>
        </div>
      </div>
      {s.notes ? (
        <p className="mt-2 line-clamp-2 whitespace-pre-wrap break-words text-xs text-zinc-600 dark:text-zinc-400">{s.notes}</p>
      ) : null}
      <div className="mt-3 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-700">
        <p className="font-medium text-zinc-800 dark:text-zinc-100">
          {s.extrLab || "—"}{" "}
          <span className="font-normal text-zinc-500">{s.extrOperator ? `· ${s.extrOperator}` : ""}</span>
        </p>
        <p className="text-xs text-zinc-500">{s.extrMethod}</p>
        <div className="mt-2 flex justify-start">{renderStatus(s)}</div>
      </div>
    </article>
  );
}
