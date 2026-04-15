'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({ page, totalPages, onPageChange, className = '' }: PaginationControlsProps) {
  const [inputValue, setInputValue] = useState(page.toString());

  useEffect(() => {
    setInputValue(page.toString());
  }, [page]);

  if (totalPages <= 1) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const newPage = parseInt(inputValue);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    } else {
      setInputValue(page.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 rounded-full bg-[var(--md-sys-color-surface-container-high)] px-3 py-1.5 shadow-sm w-max ${className}`}>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="В начало"
          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] disabled:opacity-30 transition-all">
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] disabled:opacity-30 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-1 sm:px-2 border-l border-r border-[var(--md-sys-color-outline-variant)]/30">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-8 sm:w-10 bg-transparent text-center font-bold text-sm outline-none text-[var(--md-sys-color-primary)] selection:bg-[var(--md-sys-color-primary-container)]"
          title="Введите номер страницы"
        />
        <span className="text-[10px] sm:text-xs font-medium text-[var(--md-sys-color-outline)] uppercase tracking-tighter">
          из {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] disabled:opacity-30 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="В конец"
          className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] disabled:opacity-30 transition-all">
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
