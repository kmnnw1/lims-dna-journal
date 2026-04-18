'use client';

import { Camera, ChevronDown, Download, Plus, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BarcodeScanDialog } from '@/components/features/BarcodeScanDialog';
import { HistoryDialog } from '@/components/features/HistoryDialog';
import { JournalHeader } from '@/components/features/JournalHeader';
import { PaginationControls } from '@/components/features/PaginationControls';
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
	} = useJournalPage();

	const [isExportOpen, setIsExportOpen] = useState(false);
	const [historyTarget, setHistoryTarget] = useState<{
		id: string;
		type: 'SPECIMEN' | 'PCR_ATTEMPT';
	} | null>(null);
	const exportRef = useRef<HTMLDivElement>(null);

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

	// Auto-dismiss toast after 4 seconds
	useEffect(() => {
		if (!toastMessage) return;
		const timer = setTimeout(() => setToastMessage(null), 4000);
		return () => clearTimeout(timer);
	}, [toastMessage, setToastMessage]);

	const handleThemeToggle = (newTheme: 'light' | 'dark') => {
		const doc = document as Document & { startViewTransition?: (callback: () => void) => void };
		if (typeof doc.startViewTransition !== 'function') {
			setTheme(newTheme);
			return;
		}
		doc.startViewTransition(() => {
			setTheme(newTheme);
		});
	};

	const handleHistoryOpen = (specimen: Specimen) => {
		setHistoryTarget({ id: specimen.id, type: 'SPECIMEN' });
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

				<div className="flex flex-row items-center justify-between gap-3 mb-4 bg-(--md-sys-color-surface-container-low)/50 p-2 rounded-4xl border border-(--md-sys-color-outline-variant)/20">
					<div className="flex-1 overflow-x-auto no-scrollbar flex items-center">
						<StatsCards {...stats} />
					</div>

					<div className="flex items-center gap-2 shrink-0 pr-2">
						<button
							onClick={() => setIsScanOpen(true)}
							className="flex lg:hidden items-center gap-2 px-4 py-2 bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium text-xs sm:text-sm active:scale-95"
						>
							<Camera className="w-4 h-4 sm:w-5 sm:h-5" />
							<span className="hidden sm:inline">Сканировать</span>
						</button>
						<div className="relative" ref={exportRef}>
							<button
								onClick={() => setIsExportOpen(!isExportOpen)}
								className="flex items-center gap-2 px-4 py-2 bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium text-xs sm:text-sm active:scale-95"
							>
								<Download className="w-4 h-4 sm:w-5 sm:h-5" />
								<span className="hidden lg:inline">Экспорт</span>
								<ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
							</button>
							{isExportOpen && (
								<div className="absolute top-full right-0 mt-2 min-w-[160px] py-2 bg-(--md-sys-color-surface-container-lowest) rounded-2xl shadow-xl md-elevation-3 z-50 border border-(--md-sys-color-outline-variant)/30">
									<button
										onClick={() => {
											setIsExportOpen(false);
											handleExportCSV();
										}}
										className="w-full text-left px-5 py-2.5 text-sm font-medium hover:bg-(--md-sys-color-surface-container-high) transition-colors text-(--md-sys-color-on-surface)"
									>
										Сохранить CSV
									</button>
									<button
										onClick={() => {
											setIsExportOpen(false);
											handleExportXLSX();
										}}
										className="w-full text-left px-5 py-2.5 text-sm font-medium hover:bg-(--md-sys-color-surface-container-high) transition-colors text-(--md-sys-color-on-surface)"
									>
										Сохранить Excel (.xlsx)
									</button>
								</div>
							)}
						</div>
						<PaginationControls
							page={page}
							totalPages={totalPages}
							onPageChange={setPage}
						/>
					</div>
				</div>

				<SpecimenTable
					specimens={specimens}
					loading={loading}
					selectedIds={selectedIds}
					onSelect={handleSelect}
					onSelectAll={handleSelectAll}
					onEdit={setEditingSpecimen}
					onPcr={setActivePcrSpecimen}
					onStatusClick={handleStatusToggle}
					searchQuery={searchQuery}
					sortConfig={sortConfig}
					onSort={handleSort}
					onHistory={handleHistoryOpen}
				/>

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
