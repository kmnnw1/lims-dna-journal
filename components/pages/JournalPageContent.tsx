'use client';

import { Camera, ChevronDown, Download, Plus, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { BarcodeScanDialog } from '@/components/features/BarcodeScanDialog';
import { DevOverlay } from '@/components/features/DevOverlay';
import { DraggableDevButton } from '@/components/features/DraggableDevButton';
import { HistoryDialog } from '@/components/features/HistoryDialog';
import { JournalHeader } from '@/components/features/JournalHeader';
import {
	MobileSpecimenCard,
	type MobileSpecimenShape,
} from '@/components/features/MobileSpecimenCard';
import { PaginationControls } from '@/components/features/PaginationControls';
import { PCRStatusBadge } from '@/components/features/PCRStatusBadge';
import { QuickFilterBar } from '@/components/features/QuickFilterBar';
import { SpecimenTable } from '@/components/features/SpecimenTable';
import { StatsCards } from '@/components/features/StatsCards';
import { AddSpecimenModal } from '@/components/modals/AddSpecimenModal';
import BatchPcrModal from '@/components/modals/BatchPCRModal';
import { EditSpecimenModal } from '@/components/modals/EditSpecimenModal';
import { PcrModal } from '@/components/modals/PCRModal';
import { FAB } from '@/components/ui/FAB';
import { useJournalPage } from '@/hooks/useJournalPage';
import type { Specimen } from '@/types';

export function JournalPageContent() {
	const {
		session,
		status,
		specimens,
		loading,
		theme,
		page,
		totalPages,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		sortConfig,
		selectedIds,
		setSelectedIds,
		isAddModalOpen,
		setTheme,
		setIsAddModalOpen,
		editingSpecimen,
		setEditingSpecimen,
		activePcrSpecimen,
		setActivePcrSpecimen,
		isBatchModalOpen,
		setIsBatchModalOpen,
		isScanOpen,
		setIsScanOpen,
		isMobileDevice,
		newRecordData,
		setNewRecordData,
		pcrForm,
		setPcrForm,
		stats,
		handleSort,
		handleAddSubmit,
		handleEditSubmit,
		handlePcrSubmit,
		handleStatusToggle,
		handlePrintLabels,
		handleExportCSV,
		handleExportXLSX,
		handleSignOut,
		setPage,
		minConc,
		setMinConc,
		maxConc,
		setMaxConc,
		selectedOperator,
		setSelectedOperator,
		suggestions,
		toastMessage,
		setToastMessage,
		devSettings,
		setDevSettings,
	} = useJournalPage();

	const [isDevOpen, setIsDevOpen] = useState(false);
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [lastExportFormat, setLastExportFormat] = useState<'XLSX' | 'CSV' | 'SQL'>('XLSX');
	const [historyTarget, setHistoryTarget] = useState<{
		id: string;
		type: 'SPECIMEN' | 'PCR_ATTEMPT';
	} | null>(null);
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

	// Auto-dismiss toast after 4 seconds
	useEffect(() => {
		if (!toastMessage) return;
		const timer = setTimeout(() => setToastMessage(null), 4000);
		return () => clearTimeout(timer);
	}, [toastMessage, setToastMessage]);

	const handleSelect = (id: string) => {
		setSelectedIds((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleSelectAll = (ids: string[]) => {
		setSelectedIds((current) => {
			const allSelected = ids.every((id) => current.has(id));
			return allSelected ? new Set() : new Set(ids);
		});
	};

	const handleThemeToggle = (newTheme: 'light' | 'dark') => {
		const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
		if (typeof doc.startViewTransition !== 'function') {
			setTheme(newTheme);
			return;
		}

		doc.startViewTransition(() => {
			flushSync(() => {
				setTheme(newTheme);
			});
		});
	};

	const handleHistoryOpen = (specimen: Specimen) => {
		setHistoryTarget({ id: specimen.id, type: 'SPECIMEN' });
	};

	const handleMainExportClick = () => {
		if (lastExportFormat === 'XLSX') handleExportXLSX();
		else if (lastExportFormat === 'CSV') handleExportCSV();
		else if (lastExportFormat === 'SQL') handleExportDB();
	};

	const handleExportDB = () => {
		window.open('/api/export/db', '_blank');
	};

	const saveFormat = (format: 'XLSX' | 'CSV' | 'SQL') => {
		setLastExportFormat(format);
		localStorage.setItem('lastExportFormat', format);
		setIsExportOpen(false);
	};

	const getFormatLabel = (format: 'XLSX' | 'CSV' | 'SQL') => {
		if (format === 'XLSX') return 'Excel';
		if (format === 'CSV') return 'CSV';
		return 'SQL';
	};

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-(--md-sys-color-surface) text-(--md-sys-color-on-surface) p-3 md:p-6 pb-24 transition-colors duration-300">
			<div className="w-full">
				<JournalHeader
					userName={session?.user?.name || 'Пользователь'}
					userRole={(session?.user as { role?: string })?.role || 'READER'}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					filterType={filterType}
					onFilterChange={setFilterType}
					onSignOut={handleSignOut}
					theme={theme}
					setTheme={handleThemeToggle}
					minConc={minConc}
					setMinConc={setMinConc}
					maxConc={maxConc}
					setMaxConc={setMaxConc}
					selectedOperator={selectedOperator}
					setSelectedOperator={setSelectedOperator}
					suggestions={suggestions}
				/>

				<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 bg-(--md-sys-color-surface-container-low)/50 p-2 sm:p-3 rounded-2xl sm:rounded-4xl border border-(--md-sys-color-outline-variant)/20">
					<div className="flex-1 flex flex-wrap items-center justify-start gap-2 sm:gap-4">
						<StatsCards {...stats} />
					</div>

					<div className="flex flex-row items-end md:items-center justify-end gap-2 shrink-0 md:pr-2 w-full md:w-auto">
						<div className="flex items-center gap-1.5 sm:gap-2">
							{isMobileDevice && (
								<button
									onClick={() => setIsScanOpen(true)}
									className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium text-xs sm:text-sm active:scale-95"
								>
									<Camera className="w-4 h-4 sm:w-5 sm:h-5" />
									<span className="hidden sm:inline">Сканировать</span>
								</button>
							)}
							<div className="relative flex items-center" ref={exportRef}>
								{/* Main Export Action (Split Button) */}
								<div className="flex items-center bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) rounded-full shadow-sm hover:md-elevation-2 transition-all overflow-hidden group">
									<button
										onClick={handleMainExportClick}
										className="flex items-center gap-2 pl-3 sm:pl-4 pr-1.5 py-2 hover:bg-(--md-sys-color-on-tertiary-container)/10 transition-colors font-medium text-xs sm:text-sm active:scale-95 whitespace-nowrap min-w-max"
										title={`Экспорт в ${getFormatLabel(lastExportFormat)}`}
									>
										<Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
										<span>{getFormatLabel(lastExportFormat)}</span>
									</button>
									<div className="w-px h-4 bg-(--md-sys-color-on-tertiary-container)/20" />
									<button
										onClick={() => setIsExportOpen(!isExportOpen)}
										className="flex items-center justify-center px-1.5 sm:px-2 py-2 hover:bg-(--md-sys-color-on-tertiary-container)/10 transition-colors active:scale-90"
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
						<PaginationControls
							page={page}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</div>
				</div>
				{/* Список проб */}
				<div className="bg-(--md-sys-color-surface-container-lowest) rounded-3xl sm:rounded-4xl md-elevation-1 border border-(--md-sys-color-outline-variant)/10 overflow-hidden transition-all duration-500 min-h-[400px]">
					{(isMobileDevice || devSettings.forceMobileView) &&
					devSettings.enableMobileCards &&
					!devSettings.forceDesktopView ? (
						<div className="grid grid-cols-1 gap-3 p-3">
							{specimens.map((s: Specimen) => (
								<MobileSpecimenCard
									key={s.id}
									s={s as unknown as MobileSpecimenShape}
									isReader={
										(session?.user as { role?: string })?.role === 'READER'
									}
									onPcr={() => setActivePcrSpecimen(s)}
									onEdit={() => setEditingSpecimen(s)}
									searchQuery={searchQuery}
									renderStatus={(spec, marker) => (
										<PCRStatusBadge
											status={
												marker === 'ITS'
													? spec.itsStatus
													: marker === 'SSU'
														? spec.ssuStatus
														: marker === 'LSU'
															? spec.lsuStatus
															: spec.mcm7Status
											}
											marker={marker}
											onClick={() => handleStatusToggle(spec.id, marker)}
										/>
									)}
									selected={false}
									onToggleSelect={function (): void {
										throw new Error('Function not implemented.');
									}}
								/>
							))}
						</div>
					) : (
						<SpecimenTable
							specimens={specimens}
							loading={loading}
							onSort={handleSort}
							sortConfig={sortConfig}
							selectedIds={selectedIds}
							onSelect={handleSelect}
							onSelectAll={() =>
								handleSelectAll(specimens.map((s: Specimen) => s.id))
							}
							onEdit={setEditingSpecimen}
							onPcr={setActivePcrSpecimen}
							onStatusClick={handleStatusToggle}
							onHistory={handleHistoryOpen}
							searchQuery={searchQuery}
						/>
					)}
				</div>

				{selectedIds.size > 0 && (
					<div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-(--md-sys-color-inverse-surface) text-(--md-sys-color-inverse-on-surface) rounded-3xl p-4 flex items-center justify-between shadow-2xl z-50">
						<div className="flex items-center gap-4 pl-2">
							<button
								onClick={() => setSelectedIds(new Set())}
								className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
								title="Сбросить выделение"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-(--md-sys-color-inverse-primary) text-(--md-sys-color-primary) font-bold text-sm">
								{selectedIds.size}
							</span>
							<span className="font-medium">выбрано</span>
						</div>
						<div className="flex gap-2">
							<button
								onClick={handlePrintLabels}
								className="px-5 py-2.5 text-sm font-medium text-(--md-sys-color-inverse-primary) hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
							>
								<Printer className="w-4 h-4" /> Печать
							</button>
							<button
								onClick={() => setIsBatchModalOpen(true)}
								className="px-5 py-2.5 text-sm font-medium text-(--md-sys-color-inverse-primary) hover:bg-white/10 rounded-full transition-colors"
							>
								Массовый ПЦР
							</button>
						</div>
					</div>
				)}

				<AddSpecimenModal
					open={isAddModalOpen}
					onClose={() => setIsAddModalOpen(false)}
					onSubmit={handleAddSubmit}
					newRecord={newRecordData}
					setNewRecord={setNewRecordData}
					specimens={specimens}
				/>
				<PcrModal
					open={Boolean(activePcrSpecimen)}
					specimenId={activePcrSpecimen?.id || ''}
					activeSpecimen={activePcrSpecimen}
					onClose={() => setActivePcrSpecimen(null)}
					pcrForm={pcrForm}
					setPcrForm={setPcrForm}
					onSubmit={handlePcrSubmit}
				/>
				<EditSpecimenModal
					specimen={editingSpecimen}
					onClose={() => setEditingSpecimen(null)}
					onChange={(val) => val && setEditingSpecimen(val)}
					onSubmit={handleEditSubmit}
					specimens={specimens}
				/>
				<BatchPcrModal
					open={isBatchModalOpen}
					selectedSpecimenIds={[...selectedIds]}
					onClose={() => setIsBatchModalOpen(false)}
				/>
				<BarcodeScanDialog
					open={isScanOpen}
					onClose={() => setIsScanOpen(false)}
					onCode={(raw) => {
						setSelectedIds((current) => new Set(current).add(raw));
						setIsScanOpen(false);
					}}
				/>
				<HistoryDialog
					open={Boolean(historyTarget)}
					onClose={() => setHistoryTarget(null)}
					resourceId={historyTarget?.id || ''}
					resourceType={historyTarget?.type || 'SPECIMEN'}
					onRestoreSuccess={() => {
						setToastMessage({
							text: 'Данные успешно восстановлены к старой версии',
							type: 'success',
						});
						// Триггерим рефреш через смену фильтра или страницы
						setPage(page);
					}}
				/>
			</div>

			<DevOverlay
				isOpen={isDevOpen}
				onClose={() => setIsDevOpen(false)}
				settings={devSettings}
				onUpdate={setDevSettings}
				userName={session?.user?.name || undefined}
			/>

			<DraggableDevButton onClick={() => setIsDevOpen(true)} />

			<FAB
				extended
				onClick={() => setIsAddModalOpen(true)}
				className="fixed bottom-6 right-6 z-50 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) flex items-center gap-2 px-4 shadow-xl"
				aria-label="Добавить пробу"
			>
				<Plus className="w-6 h-6" />
				<span className="font-medium mr-1">Новая проба</span>
			</FAB>

			{/* Toast/Snackbar */}
			{toastMessage && (
				<div
					role="alert"
					className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-200 text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${
						toastMessage.type === 'error'
							? 'bg-red-600 text-white'
							: 'bg-(--md-sys-color-inverse-surface) text-(--md-sys-color-inverse-on-surface)'
					}`}
					onClick={() => setToastMessage(null)}
				>
					{toastMessage.text}
				</div>
			)}
		</main>
	);
}
