'use client';

import React, { useState, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Activity } from 'lucide-react';

// Локальный хелпер для полей в стиле MD3 Filled
const MD3Field = forwardRef<HTMLInputElement, { label: string; value: string } & React.InputHTMLAttributes<HTMLInputElement>>(({ label, value, className = '', ...props }, ref) => {
	const baseClass = `w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all text-[var(--md-sys-color-on-surface)] ${className}`;
	
	return (
		<div className="relative group w-full">
			<input ref={ref} value={value} className={baseClass} {...props} />
			<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
				${value ? 'top-1.5 text-xs' : 'top-4 text-base'}
				group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
			`}>
				{label}
			</label>
		</div>
	);
});
MD3Field.displayName = 'MD3Field';

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
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
			<div className="bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 relative">
				
				<div className="mb-8 flex items-start justify-between gap-4">
					<div>
						<h2 className="text-3xl font-normal text-[var(--md-sys-color-on-surface)] tracking-tight">
							Массовый ПЦР
						</h2>
						<p className="text-[var(--md-sys-color-primary)] font-medium mt-1">
							Выбрано проб: {selectedSpecimenIds.length}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-3 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all">
						<X className="h-6 w-6" />
					</button>
				</div>

				<form onSubmit={handleBatchSubmit} className="space-y-5">
					<MD3Field
						label="Праймеры"
						list="primers-list"
						required
						value={primer}
						onChange={(e) => setPrimer(e.target.value)}
					/>
					<datalist id="primers-list">
						{popularPrimers.map((p) => (
							<option key={p} value={p} />
						))}
					</datalist>

					<MD3Field
						label="Оператор"
						required
						value={operator}
						onChange={(e) => setOperator(e.target.value)}
					/>

					<div className="flex justify-end gap-3 mt-8">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-2.5 rounded-full text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary)]/10 transition-all">
							Отмена
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-medium bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
							<Activity className="w-5 h-5" />
							{isLoading ? 'Обработка...' : 'Применить ко всем'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
