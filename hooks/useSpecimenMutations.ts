'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useCallback, useState } from 'react';

import type { Specimen } from '@/types';

type NewRecordData = {
	id: string;
	taxon: string;
	locality: string;
	extrLab: string;
	extrOperator: string;
	extrMethod: string;
	extrDateRaw: string;
};

type PCRFormData = {
	volume: string;
	marker: string;
	forwardPrimer: string;
	reversePrimer: string;
	dnaMatrix: string;
	result: 'Success' | 'Fail';
	id?: string;
};

type ToastMessage = { text: string; type: 'error' | 'success' } | null;

/**
 * Управление мутациями проб и ПЦР (add, edit, pcr).
 * Извлечено из useJournalPage для снижения связности.
 */
export function useSpecimenMutations(deps: {
	setIsAddModalOpen: (v: boolean) => void;
	setEditingSpecimen: (v: Specimen | null) => void;
	setActivePCRSpecimen: (v: Specimen | null) => void;
	setValidationError: (v: string | null) => void;
	setToastMessage: (v: ToastMessage) => void;
	newRecordData: NewRecordData;
	setNewRecordData: React.Dispatch<React.SetStateAction<NewRecordData>>;
	editingSpecimen: Specimen | null;
	activePCRSpecimen: Specimen | null;
	pcrForm: PCRFormData;
}) {
	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: async (newRecord: NewRecordData) => {
			const res = await fetch('/api/specimens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newRecord),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка при сохранении');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			deps.setIsAddModalOpen(false);
			deps.setNewRecordData({
				id: '',
				taxon: '',
				locality: '',
				extrLab: '',
				extrOperator: '',
				extrMethod: '',
				extrDateRaw: '',
			});
		},
		onError: (error: Error) => {
			deps.setValidationError(error.message);
		},
	});

	const editMutation = useMutation({
		mutationFn: async (specimen: Specimen) => {
			const res = await fetch('/api/specimens', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(specimen),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка при обновлении');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			deps.setEditingSpecimen(null);
		},
		onError: (error: Error) => {
			deps.setValidationError(error.message);
		},
	});

	const pcrMutation = useMutation({
		mutationFn: async (payload: Record<string, unknown>) => {
			const res = await fetch('/api/pcr', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Ошибка ПЦР');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['specimens'] });
			deps.setActivePCRSpecimen(null);
		},
		onError: (error: Error) => {
			deps.setToastMessage({ text: error.message, type: 'error' });
		},
	});

	const handleAddSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			deps.setValidationError(null);

			const { id, taxon } = deps.newRecordData;
			if (!id.trim()) {
				deps.setValidationError('ID пробы обязателен');
				return;
			}
			if (taxon.trim() && taxon.trim().length < 3) {
				deps.setValidationError('Таксон должен содержать не менее 3 символов');
				return;
			}

			addMutation.mutate(deps.newRecordData);
		},
		[deps, addMutation],
	);

	const handleEditSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			deps.setValidationError(null);

			if (deps.editingSpecimen) {
				const { taxon } = deps.editingSpecimen;
				if (taxon && taxon.trim().length > 0 && taxon.trim().length < 3) {
					deps.setValidationError('Таксон должен содержать не менее 3 символов');
					return;
				}
				editMutation.mutate(deps.editingSpecimen);
			}
		},
		[deps, editMutation],
	);

	const handlePCRSubmit = useCallback(async () => {
		if (deps.activePCRSpecimen) {
			pcrMutation.mutate({
				specimenId: deps.activePCRSpecimen.id,
				...deps.pcrForm,
				date: new Date().toISOString(),
			});
		}
	}, [deps, pcrMutation]);

	return {
		handleAddSubmit,
		handleEditSubmit,
		handlePCRSubmit,
		isAnyMutationPending:
			addMutation.isPending || editMutation.isPending || pcrMutation.isPending,
	};
}
