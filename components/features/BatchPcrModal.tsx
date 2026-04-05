'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BatchPcrModalProps {
	selectedSpecimenIds: string[];
	onClose: () => void;
}

export default function BatchPcrModal({ selectedSpecimenIds, onClose }: BatchPcrModalProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [primer, setPrimer] = useState('');
	const [operator, setOperator] = useState('');

	// Заглушка для автодополнения (Combobox), позже привяжем к БД
	const popularPrimers = ['ITS1F / ITS4', 'ML5 / ML6', 'NS1 / NS4'];

	const handleBatchSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			// Вызов API для массового создания (эндпоинт нужно будет добавить в app/api/pcr/batch/route.ts)
			await fetch('/api/pcr/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					specimenIds: selectedSpecimenIds,
					primer,
					operator,
					date: new Date().toISOString(),
				}),
			});
			router.refresh();
			onClose();
		} catch (error) {
			console.error('Batch PCR Error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
				<h2 className="text-xl font-bold mb-4 text-slate-800">
					Массовое добавление ПЦР ({selectedSpecimenIds.length} проб)
				</h2>

				<form onSubmit={handleBatchSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Праймеры
						</label>
						<input
							type="text"
							list="primers-list"
							required
							className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
							value={primer}
							onChange={(e) => setPrimer(e.target.value)}
							placeholder="Начните вводить или выберите..."
						/>
						<datalist id="primers-list">
							{popularPrimers.map((p) => (
								<option key={p} value={p} />
							))}
						</datalist>
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">
							Оператор
						</label>
						<input
							type="text"
							required
							className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
							value={operator}
							onChange={(e) => setOperator(e.target.value)}
							placeholder="ФИО сотрудника"
						/>
					</div>

					<div className="flex justify-end space-x-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50">
							Отмена
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
							{isLoading ? 'Обработка...' : 'Применить ко всем'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
