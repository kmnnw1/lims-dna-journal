'use client';

import { useState, useRef, useEffect } from 'react';
import { Filter, Check, X } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeMarkers, setActiveMarkers] = useState<Set<string>>(new Set(['ITS']));
  const [selectedOperator, setSelectedOperator] = useState<string>('');

  useEffect(() => {
      const handleClick = (e: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
              setIsOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleMarker = (m: string) => {
      setActiveMarkers(prev => {
          const next = new Set(prev);
          if (next.has(m)) next.delete(m);
          else next.add(m);
          return next;
      });
  };

  return (
    <div className="relative flex items-center h-full" ref={dropdownRef}>
      <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
              isOpen 
              ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md'
              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
          title="Фильтры"
      >
          <Filter className="w-5 h-5" />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
          <div className="absolute top-full right-0 mt-3 w-[340px] sm:w-[380px] z-[100] bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-3xl shadow-2xl overflow-hidden md-elevation-4 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between bg-[var(--md-sys-color-surface-container-low)]">
                  <h3 className="font-bold text-base text-[var(--md-sys-color-on-surface)] tracking-tight">Фильтры</h3>
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-outline)] transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>

              <div className="p-5 space-y-6">
                  {/* Быстрые статусы */}
                  <div className="relative flex p-1 bg-[var(--md-sys-color-surface-container-highest)] rounded-xl">
                      {filterButtons.map((button) => (
                          <button
                              key={button.value}
                              onClick={() => {
                                  onFilterChange(button.value as any);
                                  // setIsOpen(false); // Опционально: можно не закрывать
                              }}
                              className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 text-center ${
                                  filterType === button.value
                                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow flex items-center justify-center gap-1.5'
                                  : 'text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)]'
                              }`}
                          >
                              {filterType === button.value && <Check className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                              {button.label}
                          </button>
                      ))}
                  </div>

                  {/* Маркеры */}
                  <div className="space-y-3">
                      <label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">Специфичные маркеры</label>
                      <div className="flex flex-wrap gap-2">
                          {['ITS', 'SSU', 'LSU', 'RPB2', 'MCM7'].map(m => {
                              const active = activeMarkers.has(m);
                              return (
                                  <button
                                      key={m}
                                      onClick={() => toggleMarker(m)}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 border border-transparent flex items-center gap-1.5 ${
                                          active 
                                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' 
                                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                                      }`}
                                  >
                                      {m}
                                      {active && <Check className="w-3.5 h-3.5 opacity-80" />}
                                  </button>
                              );
                          })}
                      </div>
                  </div>

                  {/* Диапазон */}
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">Концентрация ДНК</label>
                          <span className="text-xs font-semibold text-[var(--md-sys-color-primary)]">15 - 120 нг/мкл</span>
                      </div>
                      <div className="relative w-full h-8 flex items-center group cursor-pointer">
                          <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-container-high)] overflow-hidden">
                              <div className="h-full bg-[var(--md-sys-color-primary)] w-3/4 ml-[10%]"></div>
                          </div>
                          {/* Thumbs - mock */}
                          <div className="absolute left-[10%] w-5 h-5 -ml-2.5 bg-white border border-[var(--md-sys-color-outline-variant)] rounded-full shadow block"></div>
                          <div className="absolute left-[85%] w-5 h-5 -ml-2.5 bg-white border border-[var(--md-sys-color-outline-variant)] rounded-full shadow block"></div>
                      </div>
                  </div>

                  {/* Оператор */}
                  <div className="space-y-3">
                      <label className="text-xs font-bold tracking-wider text-[var(--md-sys-color-outline)] uppercase">Исполнитель (Лаборант)</label>
                      <select 
                          value={selectedOperator}
                          onChange={(e) => setSelectedOperator(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-transparent text-[var(--md-sys-color-on-surface)] focus:bg-[var(--md-sys-color-surface-container-high)] outline-none text-sm font-medium transition-all"
                      >
                          <option value="">Любой</option>
                          <option value="ivanov">Иванов И.И.</option>
                          <option value="petrov">Петров П.П.</option>
                          <option value="sidorova">Сидорова А.А.</option>
                      </select>
                  </div>
              </div>

              <div className="p-4 bg-[var(--md-sys-color-surface-container-lowest)] border-t border-[var(--md-sys-color-outline-variant)]/30 flex justify-end gap-3">
                  <button 
                      onClick={() => { setActiveMarkers(new Set()); setSelectedOperator(''); onFilterChange('all'); }}
                      className="px-5 py-2 rounded-full text-sm font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                  >
                      Сбросить
                  </button>
                  <button 
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 rounded-full text-sm font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity"
                  >
                      Применить
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
