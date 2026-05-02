'use client';

import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { AmplificationTaskBoard } from '@/components/features/AmplificationTaskBoard';
import { useDevSettings } from '@/components/features/DevSettingsProvider';
import { ERModelVisualizer } from '@/components/features/ERModelVisualizer';
import { HistoryDialog } from '@/components/features/HistoryDialog';
import { JournalHeader } from '@/components/features/JournalHeader';
import { JournalToolbar } from '@/components/features/JournalToolbar';
import {
	MobileSpecimenCard,
	type MobileSpecimenShape,
} from '@/components/features/MobileSpecimenCard';
import { PCRStatusBadge } from '@/components/features/PCRStatusBadge';
import { QuickFilterBar } from '@/components/features/QuickFilterBar';
import { SelectionBar } from '@/components/features/SelectionBar';
import { SpecimenTable } from '@/components/features/SpecimenTable';
import { StatsCards } from '@/components/features/StatsCards';
import { WorkflowStagePicker } from '@/components/features/WorkflowStagePicker';
import { useTheme } from '@/components/layout/ThemeProvider';
import { AddSpecimenModal } from '@/components/modals/AddSpecimenModal';
import BatchPCRModal from '@/components/modals/BatchPCRModal';
import { EditSpecimenModal } from '@/components/modals/EditSpecimenModal';
import { PCRModal } from '@/components/modals/PCRModal';
import { TakeInWorkModal } from '@/components/modals/TakeInWorkModal';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { FAB } from '@/components/ui/FAB';
import { useJournalPage } from '@/hooks/useJournalPage';
import { isOperationStage, type OperationStage } from '@/lib/workflow/stages';
import type { Specimen } from '@/types';

const MemoizedSpecimenTable = React.memo(SpecimenTable);
const OFFLINE_WORKFLOW_QUEUE_KEY = 'offline-workflow-operations-batch-v1';

export function JournalPageContent() {
	const {
		session,
		status,
		specimens,
		loading,
		page,
		totalPages,
		searchQuery,
		setSearchQuery,
		filterType,
		setFilterType,
		workflowStage,
		setWorkflowStage,
		sortConfig,
		selectedIds,
		setSelectedIds,
		isAddModalOpen,
		setIsAddModalOpen,
		editingSpecimen,
		setEditingSpecimen,
		activePCRSpecimen,
		setActivePCRSpecimen,
		isBatchModalOpen,
		setIsBatchModalOpen,
		isMobileDevice,
		newRecordData,
		setNewRecordData,
		pcrForm,
		setPCRForm,
		stats,
		handleSort,
		handleAddSubmit,
		handleEditSubmit,
		handlePCRSubmit,
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
		selectedMarkers,
		setSelectedMarkers,
		markerCount,
		setMarkerCount,
		suggestions,
		toastMessage,
		setToastMessage,
		validationError,
		setValidationError,
		searchInputRef,
		isCommandPaletteOpen,
		setIsCommandPaletteOpen,
		focusedIndex,
		toggleMyFilter,
		refreshSpecimens,
	} = useJournalPage();

	const { settings: devSettings } = useDevSettings();
	const [historyTarget, setHistoryTarget] = useState<{
		id: string;
		type: 'SPECIMEN' | 'PCR_ATTEMPT';
	} | null>(null);
	const [isTakeInWorkOpen, setIsTakeInWorkOpen] = useState(false);
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
	const [offlineQueueSize, setOfflineQueueSize] = useState(0);

	type OfflineBatchItem = {
		id: string;
		createdAt: string;
		payload: Record<string, unknown>;
	};

	const readOfflineQueue = useCallback((): OfflineBatchItem[] => {
		try {
			const raw = localStorage.getItem(OFFLINE_WORKFLOW_QUEUE_KEY);
			if (!raw) return [];
			const parsed = JSON.parse(raw) as OfflineBatchItem[];
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, []);

	const writeOfflineQueue = useCallback((queue: OfflineBatchItem[]) => {
		localStorage.setItem(OFFLINE_WORKFLOW_QUEUE_KEY, JSON.stringify(queue));
		setOfflineQueueSize(queue.length);
	}, []);

	const enqueueOfflineBatch = useCallback(
		(payload: Record<string, unknown>) => {
			const queue = readOfflineQueue();
			queue.push({
				id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
				createdAt: new Date().toISOString(),
				payload,
			});
			writeOfflineQueue(queue);
		},
		[readOfflineQueue, writeOfflineQueue],
	);

	const syncOfflineQueue = useCallback(async () => {
		const queue = readOfflineQueue();
		if (queue.length === 0) {
			setToastMessage({ text: 'Оффлайн-очередь пуста', type: 'success' });
			return;
		}
		const failed: OfflineBatchItem[] = [];
		let synced = 0;
		for (const item of queue) {
			try {
				const response = await fetch('/api/workflow/operations/batch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item.payload),
				});
				if (response.ok) synced += 1;
				else failed.push(item);
			} catch {
				failed.push(item);
			}
		}
		writeOfflineQueue(failed);
		if (synced > 0) {
			await refreshSpecimens();
		}
		setToastMessage({
			text:
				failed.length === 0
					? `Синхронизация завершена: ${synced}`
					: `Синхронизировано: ${synced}, осталось в очереди: ${failed.length}`,
			type: failed.length === 0 ? 'success' : 'error',
		});
	}, [readOfflineQueue, refreshSpecimens, setToastMessage, writeOfflineQueue]);

	useEffect(() => {
		setOfflineQueueSize(readOfflineQueue().length);
	}, [readOfflineQueue]);

	const handleSelect = useCallback(
		(id: string, shiftKey?: boolean) => {
			const currentIndex = specimens.findIndex((s: Specimen) => s.id === id);

			setSelectedIds((current) => {
				const next = new Set(current);

				if (shiftKey && lastSelectedIndex !== null) {
					const start = Math.min(lastSelectedIndex, currentIndex);
					const end = Math.max(lastSelectedIndex, currentIndex);
					const rangeIds = specimens.slice(start, end + 1).map((s: Specimen) => s.id);

					const isChecking = !next.has(id);
					for (const rid of rangeIds) {
						if (isChecking) next.add(rid);
						else next.delete(rid);
					}
				} else {
					if (next.has(id)) next.delete(id);
					else next.add(id);
				}

				return next;
			});

			setLastSelectedIndex(currentIndex);
		},
		[specimens, lastSelectedIndex, setSelectedIds],
	);

	const handleFilterChange = useCallback(
		(type: 'all' | 'success' | 'error' | 'fav') => {
			setFilterType(type);
			setSelectedOperator('');
		},
		[setFilterType, setSelectedOperator],
	);

	const handleSelectAll = useCallback(
		(ids: string[]) => {
			setSelectedIds((current) => {
				const allSelected = ids.every((id) => current.has(id));
				return allSelected ? new Set() : new Set(ids);
			});
		},
		[setSelectedIds],
	);

	const handleHistoryOpen = useCallback((specimen: Specimen) => {
		setHistoryTarget({ id: specimen.id, type: 'SPECIMEN' });
	}, []);

	const handleCopyID = useCallback(
		(id: string) => {
			navigator.clipboard.writeText(id).then(() => {
				setToastMessage({ text: `ID ${id} скопирован в буфер обмена`, type: 'success' });
			});
		},
		[setToastMessage],
	);

	const handleCopySelectedIds = useCallback(() => {
		const idsString = Array.from(selectedIds).join(', ');
		navigator.clipboard.writeText(idsString).then(() => {
			setToastMessage({
				text: `Скопировано ${selectedIds.size} ID в буфер обмена`,
				type: 'success',
			});
		});
	}, [selectedIds, setToastMessage]);

	const handleExportSelected = useCallback(async () => {
		const selected = specimens.filter((s: Specimen) => selectedIds.has(s.id));
		if (selected.length === 0) {
			setToastMessage({ text: 'Нет выбранных проб для экспорта', type: 'error' });
			return;
		}

		const csvEscape = (value: unknown) => {
			const text = String(value ?? '');
			if (/[",\r\n]/.test(text)) {
				return `"${text.replaceAll('"', '""')}"`;
			}
			return text;
		};
		const csvContent =
			'data:text/csv;charset=utf-8,' +
			'ID,Taxon,Locality,ITS,SSU,LSU,RPB2,MCM7\r\n' +
			selected
				.map((s: Specimen) =>
					[
						csvEscape(s.id),
						csvEscape(s.taxon || ''),
						csvEscape(s.locality || ''),
						csvEscape(s.itsStatus || ''),
						csvEscape(s.ssuStatus || ''),
						csvEscape(s.lsuStatus || ''),
						csvEscape(s.rpb2Status || ''),
						csvEscape(s.mcm7Status || ''),
					].join(','),
				)
				.join('\r\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute(
			'download',
			`selected_export_${new Date().toISOString().split('T')[0]}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setToastMessage({ text: `Экспортировано: ${selected.length}`, type: 'success' });
	}, [specimens, selectedIds, setToastMessage]);

	const handleBulkRenameSelected = useCallback(async () => {
		if (selectedIds.size === 0) {
			setToastMessage({ text: 'Нет выбранных проб для переименования', type: 'error' });
			return;
		}
		const replaceFrom = window.prompt('Заменить в таксоне (что ищем):', '') ?? '';
		const replaceTo = window.prompt('Заменить на:', '') ?? '';
		const prefix = window.prompt('Префикс (опционально):', '') ?? '';
		const suffix = window.prompt('Суффикс (опционально):', '') ?? '';

		const res = await fetch('/api/specimens', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ids: Array.from(selectedIds),
				rename: { replaceFrom, replaceTo, prefix, suffix },
			}),
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) {
			setToastMessage({
				text: data?.error || 'Ошибка массового переименования',
				type: 'error',
			});
			return;
		}
		setToastMessage({
			text: `Переименовано записей: ${data?.updated ?? selectedIds.size}`,
			type: 'success',
		});
		refreshSpecimens();
	}, [selectedIds, setToastMessage, refreshSpecimens]);

	const openPrintBlank = useCallback(
		(payload: {
			stage: string;
			startedAt: string;
			lab: string;
			method: string;
			operator: string;
			comment: string;
		}) => {
			const ids = Array.from(selectedIds);
			const html = `
				<!doctype html>
				<html><head><meta charset="utf-8"><title>Бланк работ</title>
				<style>
					body { font-family: Arial, sans-serif; padding: 20px; }
					h1 { margin: 0 0 10px; }
					.meta { margin: 0 0 14px; font-size: 14px; }
					table { width: 100%; border-collapse: collapse; }
					th, td { border: 1px solid #bbb; padding: 6px; font-size: 13px; }
					th { text-align: left; background: #f2f2f2; }
				</style></head><body>
				<h1>Бланк лабораторной работы</h1>
				<div class="meta">Этап: <b>${payload.stage}</b></div>
				<div class="meta">Дата: <b>${payload.startedAt}</b></div>
				<div class="meta">Лаборатория: <b>${payload.lab || '-'}</b></div>
				<div class="meta">Метод: <b>${payload.method || '-'}</b></div>
				<div class="meta">Оператор: <b>${payload.operator || '-'}</b></div>
				<div class="meta">Комментарий: <b>${payload.comment || '-'}</b></div>
				<table><thead><tr><th>#</th><th>ID пробы</th></tr></thead><tbody>
				${ids.map((id, i) => `<tr><td>${i + 1}</td><td>${id}</td></tr>`).join('')}
				</tbody></table>
				<script>window.onload = () => window.print();</script>
				</body></html>
			`;
			const w = window.open('', '_blank', 'width=900,height=700');
			if (!w) return;
			w.document.open();
			w.document.write(html);
			w.document.close();
		},
		[selectedIds],
	);

	// Auto-dismiss toast after 4 seconds
	useEffect(() => {
		if (!toastMessage) return;
		const timer = setTimeout(() => setToastMessage(null), 4000);
		return () => clearTimeout(timer);
	}, [toastMessage, setToastMessage]);

	if (status === 'loading') return null;

	return (
		<main className="min-h-screen bg-(--md-sys-color-surface) text-(--md-sys-color-on-surface) px-3 md:px-6 pb-24 transition-colors duration-300">
			<div className="w-full pt-0">
				{devSettings.visibility?.header && (
					<JournalHeader
						ref={searchInputRef}
						userName={session?.user?.name || 'Пользователь'}
						userRole={(session?.user as { role?: string })?.role || 'READER'}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						filterType={filterType}
						onFilterChange={setFilterType}
						onSignOut={handleSignOut}
						minConc={minConc}
						setMinConc={setMinConc}
						maxConc={maxConc}
						setMaxConc={setMaxConc}
						selectedOperator={selectedOperator}
						setSelectedOperator={setSelectedOperator}
						selectedMarkers={selectedMarkers}
						setSelectedMarkers={setSelectedMarkers}
						markerCount={markerCount}
						setMarkerCount={setMarkerCount}
						suggestions={suggestions}
						onAddClick={() => setIsAddModalOpen(true)}
					/>
				)}

				{(devSettings.visibility?.stats || devSettings.visibility?.filters) && (
					<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 bg-(--md-sys-color-surface-container-low)/50 p-2 sm:p-3 rounded-2xl sm:rounded-4xl border border-(--md-sys-color-outline-variant)/20">
						{devSettings.visibility?.stats && (
							<div className="flex-1 flex flex-wrap items-center justify-start gap-2 sm:gap-4">
								<StatsCards
									{...stats}
									activeFilter={filterType}
									onFilterSelect={setFilterType}
								/>
								<div className="flex items-center gap-1.5 ml-2 border-l border-(--md-sys-color-outline-variant)/30 pl-4">
									<button
										onClick={() => handleFilterChange('all')}
										className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
											filterType === 'all' && !selectedOperator
												? 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)'
												: 'bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
										}`}
									>
										Все
									</button>
									<button
										onClick={() => handleFilterChange('error')}
										className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
											filterType === 'error'
												? 'bg-(--md-sys-color-error) text-white'
												: 'bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
										}`}
									>
										Ошибки
									</button>
									<button
										onClick={toggleMyFilter}
										className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
											selectedOperator
												? 'bg-(--md-sys-color-tertiary) text-(--md-sys-color-on-tertiary)'
												: 'bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
										}`}
									>
										Мои
									</button>
								</div>
							</div>
						)}

						{devSettings.visibility?.filters && (
							<div className="flex flex-col gap-2 w-full md:w-auto">
								<WorkflowStagePicker
									value={workflowStage}
									onChange={setWorkflowStage}
								/>
								<JournalToolbar
									isMobileDevice={isMobileDevice}
									page={page}
									totalPages={totalPages}
									setPage={setPage}
									handleExportCSV={handleExportCSV}
									handleExportXLSX={handleExportXLSX}
									onImportUploaded={(message, type) => {
										setToastMessage({ text: message, type });
										setPage(1);
									}}
									offlineQueueSize={offlineQueueSize}
									onSyncOffline={syncOfflineQueue}
								/>
							</div>
						)}
					</div>
				)}
				{devSettings.visibility?.table && (
					<div className="bg-(--md-sys-color-surface-container-lowest) rounded-2xl sm:rounded-3xl md-elevation-1 border border-(--md-sys-color-outline-variant)/10 overflow-hidden min-h-[400px]">
						{workflowStage === 'TASKS' ? (
							<AmplificationTaskBoard
								selectedIds={selectedIds}
								onToast={(text, type) => setToastMessage({ text, type })}
							/>
						) : (isMobileDevice || devSettings.forceMobileView) &&
							devSettings.enableMobileCards &&
							!devSettings.forceDesktopView ? (
							<div className="grid grid-cols-1 gap-3 p-1 sm:p-0">
								{specimens.map((s: Specimen) => (
									<MobileSpecimenCard
										key={s.id}
										s={s as unknown as MobileSpecimenShape}
										isReader={
											(session?.user as { role?: string })?.role === 'READER'
										}
										onPcr={() => setActivePCRSpecimen(s)}
										onEdit={() => setEditingSpecimen(s)}
										onCopyID={handleCopyID}
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
										selected={selectedIds.has(s.id)}
										onToggleSelect={() => handleSelect(s.id)}
									/>
								))}
							</div>
						) : (
							<MemoizedSpecimenTable
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
								onPcr={setActivePCRSpecimen}
								onStatusClick={handleStatusToggle}
								onHistory={handleHistoryOpen}
								onCopyID={handleCopyID}
								searchQuery={searchQuery}
								focusedIndex={focusedIndex}
							/>
						)}
					</div>
				)}

				<SelectionBar
					selectedIds={selectedIds}
					setSelectedIds={setSelectedIds}
					onCopySelectedIds={handleCopySelectedIds}
					onExportSelected={handleExportSelected}
					onBulkRename={handleBulkRenameSelected}
					onPrintLabels={handlePrintLabels}
					onBatchPCR={() => setIsBatchModalOpen(true)}
					onTakeInWork={() => {
						if (!isOperationStage(workflowStage)) {
							setToastMessage({
								text: 'Для раздела TASKS действие "В работу" недоступно',
								type: 'error',
							});
							return;
						}
						setIsTakeInWorkOpen(true);
					}}
				/>
				<TakeInWorkModal
					open={isTakeInWorkOpen && isOperationStage(workflowStage)}
					stage={
						isOperationStage(workflowStage) ? workflowStage : ('PREP' as OperationStage)
					}
					selectedCount={selectedIds.size}
					defaultOperator={session?.user?.name || ''}
					onClose={() => setIsTakeInWorkOpen(false)}
					onSubmit={async (payload) => {
						const requestBody = {
							specimenIds: Array.from(selectedIds),
							stage: payload.stage,
							startedAt: payload.startedAt,
							lab: payload.lab,
							method: payload.method,
							operator: payload.operator,
							status: payload.resultStatus || 'in_progress',
							completedAt:
								payload.resultStatus === 'success' ||
								payload.resultStatus === 'fail'
									? new Date().toISOString()
									: null,
							params: {
								comment: payload.comment,
								failReason: payload.failReason,
								genbankNo: payload.genbankNo,
								sequenceText: payload.sequenceText,
								rawFileUrl: payload.rawFileUrl,
								processedFileUrl: payload.processedFileUrl,
								cleanupAtVendor: payload.cleanupAtVendor,
								postCleanupConcentration: payload.postCleanupConcentration,
								qualityStatus: payload.qualityStatus,
							},
						};
						try {
							const response = await fetch('/api/workflow/operations/batch', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(requestBody),
							});
							if (!response.ok) {
								setToastMessage({
									text: 'Не удалось записать работу',
									type: 'error',
								});
								return;
							}
							setToastMessage({
								text: `В работу записано: ${selectedIds.size}`,
								type: 'success',
							});
						} catch {
							enqueueOfflineBatch(requestBody);
							setToastMessage({
								text: `Нет сети: операция сохранена оффлайн (${offlineQueueSize + 1} в очереди)`,
								type: 'success',
							});
						}
						if (payload.printAfterSave) {
							openPrintBlank(payload);
						}
						setSelectedIds(new Set());
						setIsTakeInWorkOpen(false);
					}}
				/>

				<AddSpecimenModal
					open={isAddModalOpen}
					onClose={() => {
						setIsAddModalOpen(false);
						setValidationError(null);
					}}
					onSubmit={handleAddSubmit}
					newRecord={newRecordData}
					setNewRecord={setNewRecordData}
					specimens={specimens}
					validationError={validationError || undefined}
				/>
				<PCRModal
					open={Boolean(activePCRSpecimen)}
					specimenId={activePCRSpecimen?.id || ''}
					activeSpecimen={activePCRSpecimen}
					onClose={() => setActivePCRSpecimen(null)}
					pcrForm={pcrForm}
					setPCRForm={setPCRForm}
					onSubmit={handlePCRSubmit}
				/>
				<EditSpecimenModal
					specimen={editingSpecimen}
					onClose={() => {
						setEditingSpecimen(null);
						setValidationError(null);
					}}
					onChange={(val) => val && setEditingSpecimen(val)}
					onSubmit={handleEditSubmit}
					specimens={specimens}
					validationError={validationError || undefined}
				/>
				<BatchPCRModal
					open={isBatchModalOpen}
					selectedSpecimenIds={[...selectedIds]}
					onClose={() => setIsBatchModalOpen(false)}
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
						setPage(page);
					}}
				/>
				<CommandPalette
					open={isCommandPaletteOpen}
					onClose={() => setIsCommandPaletteOpen(false)}
					specimens={specimens}
					onPickSpecimen={(id) => {
						const s = specimens.find((x: Specimen) => x.id === id);
						if (s) setEditingSpecimen(s);
					}}
					onNewSpecimen={() => setIsAddModalOpen(true)}
					onRefresh={() => setPage(page)}
					isReader={(session?.user as { role?: string })?.role === 'READER'}
					isAdmin={(session?.user as { role?: string })?.role === 'ADMIN'}
				/>
			</div>

			{devSettings.visibility?.erModel && <ERModelVisualizer />}

			{devSettings.visibility?.fab && (
				<FAB
					extended
					onClick={() => setIsAddModalOpen(true)}
					id="main-fab"
					className="fixed bottom-6 right-6 z-50 bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) flex items-center gap-2 px-3 sm:px-4 shadow-xl h-14 sm:h-16"
					aria-label="Добавить пробу"
				>
					<Plus className="w-6 h-6" />
					<span className="font-medium mr-1 hidden sm:inline">Новая проба</span>
				</FAB>
			)}

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
