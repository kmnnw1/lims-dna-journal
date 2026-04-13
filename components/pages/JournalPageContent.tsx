'use client';

import { useEffect } from 'react';

import { Printer, Plus, Download, Camera } from 'lucide-react';
import { JournalHeader } from '@/components/features/JournalHeader';
import { StatsCards } from '@/components/features/StatsCards';
import { SpecimenTable } from '@/components/features/SpecimenTable';
import { QuickFilterBar } from '@/components/features/QuickFilterBar';
import { PaginationControls } from '@/components/features/PaginationControls';
import { AddSpecimenModal } from '@/components/modals/AddSpecimenModal';
import { EditSpecimenModal } from '@/components/modals/EditSpecimenModal';
import { PcrModal } from '@/components/modals/PCRModal';
import BatchPcrModal from '@/components/modals/BatchPCRModal';
import { BarcodeScanDialog } from '@/components/features/BarcodeScanDialog';
import { FAB } from '@/components/ui/FAB';
import { useJournalPage } from '@/hooks/useJournalPage';

export function JournalPageContent() {
	const {
		session,
		status,
		specimens,
		loading,
		isDark,
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
		setIsDark,
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
		handleExportExcel,
		handleSignOut,
		setPage,
		toastMessage,
		setToastMessage,
	} = useJournalPage();

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

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] p-4 md:p-8 pb-32 transition-colors duration-300">
			<div className="max-w-[1600px] mx-auto">
				<JournalHeader
					userName={session?.user?.name || 'Администратор'}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					onAddClick={() => setIsAddModalOpen(true)}
					onSignOut={handleSignOut}
					isDark={isDark}
					setIsDark={setIsDark}
				/>

				<div className="flex flex-wrap items-center justify-between gap-4 mb-6">
					<QuickFilterBar filterType={filterType} onFilterChange={setFilterType} />
					
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsScanOpen(true)}
							className="flex items-center gap-2 px-5 py-2.5 bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium text-sm active:scale-95">
							<Camera className="w-5 h-5" />
							<span className="hidden sm:inline">Сканировать</span>
						</button>
						<button
							onClick={handleExportExcel}
							className="flex items-center gap-2 px-5 py-2.5 bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] md-elevation-1 hover:md-elevation-2 rounded-full transition-all font-medium text-sm active:scale-95">
							<Download className="w-5 h-5" />
							<span className="hidden sm:inline">Выгрузить CSV</span>
						</button>
					</div>
				</div>

				<StatsCards {...stats} />

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
				/>

				<PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />

				{selectedIds.size > 0 && (
					<div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] rounded-[1.5rem] p-4 flex items-center justify-between shadow-2xl z-50">
						<div className="flex items-center gap-4 pl-2">
							<span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--md-sys-color-inverse-primary)] text-[var(--md-sys-color-primary)] font-bold text-sm">
								{selectedIds.size}
							</span>
							<span className="font-medium">выбрано</span>
						</div>
						<div className="flex gap-2">
							<button
								onClick={handlePrintLabels}
								className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors flex items-center gap-2">
								<Printer className="w-4 h-4" /> Печать
							</button>
							<button
								onClick={() => setSelectedIds(new Set())}
								className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors">
								Сбросить
							</button>
							<button
								onClick={() => setIsBatchModalOpen(true)}
								className="px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-inverse-primary)] hover:bg-white/10 rounded-full transition-colors">
								Batch PCR
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
				/>
				<BatchPcrModal open={isBatchModalOpen} selectedSpecimenIds={[...selectedIds]} onClose={() => setIsBatchModalOpen(false)} />
				<BarcodeScanDialog
					open={isScanOpen}
					onClose={() => setIsScanOpen(false)}
					onCode={(raw) => {
						setSelectedIds((current) => new Set(current).add(raw));
						setIsScanOpen(false);
					}}
				/>
			</div>

			<FAB onClick={() => setIsAddModalOpen(true)} className="fixed bottom-6 right-6 z-50" aria-label="Добавить пробу">
				<Plus className="w-6 h-6" />
			</FAB>

			{/* Toast/Snackbar */}
			{toastMessage && (
				<div
					role="alert"
					className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[200] text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${
						toastMessage.type === 'error'
							? 'bg-red-600 text-white'
							: 'bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)]'
					}`}
					onClick={() => setToastMessage(null)}
				>
					{toastMessage.text}
				</div>
			)}
		</main>
	);
}
