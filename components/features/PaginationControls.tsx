'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({ page, totalPages, onPageChange, className = '' }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-4 rounded-full bg-[var(--md-sys-color-surface-container-high)] px-4 py-1.5 shadow-sm w-max ${className}`}>
      <div className="text-xs font-medium text-[var(--md-sys-color-on-surface)] opacity-80 whitespace-nowrap">
        {page} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center justify-center p-1.5 rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-30 bg-transparent text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center justify-center p-1.5 rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-30 bg-transparent text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)]">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
