'use client';

import { useEffect } from 'react';
import type { Specimen } from '@/types';

/**
 * Горячие клавиши и клавиатурная навигация по таблице проб.
 * Извлечено из useJournalPage для снижения связности.
 */
export function useJournalHotkeys(deps: {
	specimens: Specimen[];
	focusedIndex: number | null;
	setFocusedIndex: (v: React.SetStateAction<number | null>) => void;
	isCommandPaletteOpen: boolean;
	setIsCommandPaletteOpen: (v: React.SetStateAction<boolean>) => void;
	isAddModalOpen: boolean;
	setIsAddModalOpen: (v: boolean) => void;
	editingSpecimen: Specimen | null;
	setEditingSpecimen: (v: Specimen | null) => void;
	activePCRSpecimen: Specimen | null;
	setActivePCRSpecimen: (v: Specimen | null) => void;
	setSearchQuery: (v: string) => void;
	setSelectedIds: (v: React.SetStateAction<Set<string>>) => void;
	searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isInput =
				document.activeElement?.tagName === 'INPUT' ||
				document.activeElement?.tagName === 'TEXTAREA' ||
				document.activeElement?.getAttribute('contenteditable') === 'true';

			// Command Palette
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				deps.setIsCommandPaletteOpen((prev) => !prev);
				return;
			}

			// New Specimen
			if (e.key === 'n' && e.altKey) {
				e.preventDefault();
				deps.setIsAddModalOpen(true);
				return;
			}

			// Focus Search
			if (e.key === '/' && !isInput) {
				e.preventDefault();
				deps.searchInputRef.current?.focus();
				return;
			}

			// Keyboard Navigation (Only if not in input)
			if (!isInput && deps.specimens.length > 0) {
				if (e.key === 'ArrowDown' || (e.key === 'j' && !e.ctrlKey)) {
					e.preventDefault();
					deps.setFocusedIndex((prev) =>
						prev === null || prev >= deps.specimens.length - 1 ? 0 : prev + 1,
					);
				} else if (e.key === 'ArrowUp' || (e.key === 'k' && !e.ctrlKey)) {
					e.preventDefault();
					deps.setFocusedIndex((prev) =>
						prev === null || prev <= 0 ? deps.specimens.length - 1 : prev - 1,
					);
				} else if (e.key === 'Enter' && deps.focusedIndex !== null) {
					e.preventDefault();
					const specimen = deps.specimens[deps.focusedIndex];
					if (specimen) deps.setEditingSpecimen(specimen);
				} else if (e.key === ' ' && deps.focusedIndex !== null) {
					e.preventDefault();
					const specimen = deps.specimens[deps.focusedIndex];
					if (specimen) {
						const id = specimen.id;
						deps.setSelectedIds((prev) => {
							const next = new Set(prev);
							if (next.has(id)) next.delete(id);
							else next.add(id);
							return next;
						});
					}
				}
			}

			if (e.key === 'Escape') {
				if (deps.isCommandPaletteOpen) deps.setIsCommandPaletteOpen(false);
				else if (deps.isAddModalOpen) deps.setIsAddModalOpen(false);
				else if (deps.editingSpecimen) deps.setEditingSpecimen(null);
				else if (deps.activePCRSpecimen) deps.setActivePCRSpecimen(null);
				else deps.setSearchQuery('');
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [
		deps.specimens,
		deps.focusedIndex,
		deps.isCommandPaletteOpen,
		deps.isAddModalOpen,
		deps.editingSpecimen,
		deps.activePCRSpecimen,
		deps,
	]);
}
