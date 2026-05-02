'use client';

import { ChevronDown, Download } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { PaginationControls } from '@/components/features/PaginationControls';

type ExportFormat = 'XLSX' | 'CSV' | 'SQL';

interface JournalToolbarProps {
	isMobileDevice: boolean;
	page: number;
	totalPages: number;
	setPage: (v: number) => void;
	handleExportCSV: () => void;
	handleExportXLSX: () => void;
}

/**
 * Панель инструментов журнала: кнопки экспорта (split button) + сканер + пагинация.
 * Извлечена из JournalPageContent для снижения связности.
 */
export function JournalToolbar({
	isMobileDevice: _isMobileDevice,
	page,
	totalPages,
	setPage,
	handleExportCSV,
	handleExportXLSX,
}: JournalToolbarProps) {
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [lastExportFormat, setLastExportFormat] = useState<ExportFormat>('XLSX');
	const exportRef = useRef<HTMLDivElement>(null);

	// Load last export format from localStorage
	useEffect(() => {
		const saved = localStorage.getItem('lastExportFormat');
		if (saved === 'XLSX' || saved === 'CSV' || saved === 'SQL') {
			setLastExportFormat(saved);
		}
	}, []);

	// Close export dropdown on outside click
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
				setIsExportOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, []);

	const saveFormat = (format: ExportFormat) => {
		setLastExportFormat(format);
		localStorage.setItem('lastExportFormat', format);
		setIsExportOpen(false);
	};

	const getFormatLabel = (format: ExportFormat) => {
		if (format === 'XLSX') return 'Excel';
		if (format === 'CSV') return 'CSV';
		return 'SQL';
	};

	const handleExportDB = useCallback(() => {
		window.open('/api/export/db', '_blank');
	}, []);

	const handleMainExportClick = () => {
		if (lastExportFormat === 'XLSX') handleExportXLSX();
		else if (lastExportFormat === 'CSV') handleExportCSV();
		else if (lastExportFormat === 'SQL') handleExportDB();
	};

	return (
		<div className="flex flex-row items-end md:items-center justify-end gap-2 shrink-0 md:pr-2 w-full md:w-auto">
			<div className="flex items-center gap-1.5 sm:gap-2">
				<div className="relative flex items-center" ref={exportRef}>
					<div className="flex items-center h-9 sm:h-10 bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) rounded-full shadow-sm hover:md-elevation-2 overflow-hidden group">
						<button
							onClick={handleMainExportClick}
							aria-label="Экспорт"
							data-testid="export-button"
							className="flex items-center h-full gap-2 pl-3 sm:pl-4 pr-1.5 hover:bg-(--md-sys-color-on-tertiary-container)/10 transition-colors font-medium text-xs sm:text-sm active:scale-95 whitespace-nowrap min-w-max"
							title={`Экспорт в ${getFormatLabel(lastExportFormat)}`}
						>
							<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
							<span>{getFormatLabel(lastExportFormat)}</span>
						</button>
						<div className="w-px h-4 bg-(--md-sys-color-on-tertiary-container)/20" />
						<button
							onClick={() => setIsExportOpen(!isExportOpen)}
							className="flex items-center justify-center h-full px-1.5 sm:px-2 hover:bg-(--md-sys-color-on-tertiary-container)/10 transition-colors active:scale-90"
							aria-label="Выбор формата экспорта"
						>
							<ChevronDown
								className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`}
							/>
						</button>
					</div>

					{isExportOpen && (
						<div className="absolute top-full right-0 mt-2 min-w-[240px] py-2 bg-(--md-sys-color-surface-container-lowest) rounded-2xl shadow-xl md-elevation-3 z-50 border border-(--md-sys-color-outline-variant)/30 overflow-hidden">
							<button
								onClick={() => {
									handleExportXLSX();
									saveFormat('XLSX');
								}}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-(--md-sys-color-tertiary-container)/10 transition-colors text-(--md-sys-color-on-surface) whitespace-nowrap"
							>
								<div className="w-1.5 h-1.5 rounded-full bg-green-500" />
								Сохранить Excel (.xlsx)
							</button>
							<button
								onClick={() => {
									handleExportCSV();
									saveFormat('CSV');
								}}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-(--md-sys-color-tertiary-container)/10 transition-colors text-(--md-sys-color-on-surface) whitespace-nowrap"
							>
								<div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
								Сохранить CSV
							</button>
							<div className="h-px bg-(--md-sys-color-outline-variant)/20 my-1 mx-2" />
							<button
								onClick={() => {
									handleExportDB();
									saveFormat('SQL');
								}}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-(--md-sys-color-tertiary-container)/10 transition-colors text-(--md-sys-color-on-surface)"
							>
								<div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
								Скачать БД (.sqlite)
							</button>
						</div>
					)}
				</div>
			</div>
			<PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
		</div>
	);
}
