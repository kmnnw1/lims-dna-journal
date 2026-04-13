'use client';

interface QuickFilterBarProps {
  filterType: 'all' | 'success' | 'error' | 'fav';
  onFilterChange: (filter: 'all' | 'success' | 'error' | 'fav') => void;
}

const filterButtons = [
  { value: 'all', label: 'Все' },
  { value: 'success', label: 'Успешные' },
  { value: 'error', label: 'Ошибки' },
];

export function QuickFilterBar({ filterType, onFilterChange }: QuickFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[2rem] border border-[var(--md-sys-color-outline-variant)]/40 bg-[var(--md-sys-color-surface-container-lowest)] p-2">
      {filterButtons.map((button) => (
        <button
          key={button.value}
          type="button"
          onClick={() => onFilterChange(button.value as 'all' | 'success' | 'error' | 'fav')}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            filterType === button.value
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-elevation-1'
              : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)]'
          }`}>
          {button.label}
        </button>
      ))}
    </div>
  );
}
