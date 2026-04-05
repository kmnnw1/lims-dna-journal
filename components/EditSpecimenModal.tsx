'use client';

import {X, Save} from 'lucide-react';
import {useRef, useEffect} from 'react';
import type {EditSpecimenForm} from '@/types';

// Улучшенная и унифицированная pallete для всех модалок
const MD3 = {
	card: 'bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/60 dark:border-zinc-800/80',
	input: 'w-full rounded-2xl border-none bg-zinc-100/80 px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400/90 dark:placeholder:text-zinc-500',
	btnPrimary:
		'inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-teal-700 hover:shadow-lg active:scale-95 transition-all',
	btnSecondary:
		'inline-flex items-center justify-center gap-2 rounded-full bg-teal-50 px-5 py-3 text-base font-bold text-teal-900 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-100 dark:hover:bg-teal-900/50 active:scale-95 transition-all',
	iconBtn:
		'inline-flex items-center justify-center p-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 active:scale-95 transition-all',
};

type Props = {
	specimen: EditSpecimenForm | null;
	onClose: () => void;
	onChange: (val: EditSpecimenForm) => void;
	onSubmit: (e: React.FormEvent) => void;
};

export function EditSpecimenModal({specimen, onClose, onChange, onSubmit}: Props) {
	const taxonInputRef = useRef<HTMLInputElement>(null);

	// Автофокус на поле "Таксон" при открытии модалки
	useEffect(() => {
		if (specimen && taxonInputRef.current) {
			setTimeout(() => {
				taxonInputRef.current?.focus();
			}, 60);
		}
	}, [specimen]);

	if (!specimen) return null;

	// Валидация для кнопки "Сохранить": запрещаем отправку если все значения пустые
	const isEmpty =
		!specimen.taxon &&
		!specimen.locality &&
		!specimen.collector &&
		!specimen.notes &&
		!specimen.extrLab &&
		!specimen.extrOperator &&
		!specimen.extrMethod &&
		!specimen.extrDateRaw &&
		!specimen.dnaMeter &&
		!specimen.dnaConcentration &&
		!specimen.measOperator &&
		!specimen.measDate;

	return (
		<div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-zinc-950/40 p-4 animate-in fade-in duration-200">
			<div className={`${MD3.card} my-6 w-full max-w-2xl p-8 relative`}>
				<div className="mb-7 flex items-center justify-between gap-4">
					<h2 className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
						Редактировать · {specimen.id}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className={MD3.iconBtn}
						aria-label="Закрыть"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<form onSubmit={onSubmit} className="space-y-8" autoComplete="off">
					{/* Общая информация */}
					<section className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl">
						<h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-teal-600">
							Общая информация
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<input
								ref={taxonInputRef}
								placeholder="Таксон"
								value={specimen.taxon || ''}
								maxLength={72}
								autoComplete="off"
								data-testid="editspecimen-taxon"
								onChange={(e) => onChange({...specimen, taxon: e.target.value})}
								className={MD3.input}
							/>
							<input
								placeholder="Место сбора (Locality)"
								value={specimen.locality || ''}
								maxLength={100}
								data-testid="editspecimen-locality"
								onChange={(e) => onChange({...specimen, locality: e.target.value})}
								className={MD3.input}
							/>
							<input
								placeholder="Коллектор"
								value={specimen.collector || ''}
								maxLength={40}
								data-testid="editspecimen-collector"
								onChange={(e) => onChange({...specimen, collector: e.target.value})}
								className={MD3.input}
							/>
							<textarea
								placeholder="Заметки"
								value={specimen.notes || ''}
								maxLength={300}
								data-testid="editspecimen-notes"
								onChange={(e) => onChange({...specimen, notes: e.target.value})}
								className={`${MD3.input} sm:col-span-2 min-h-[100px] resize-y`}
							/>
						</div>
					</section>

					{/* Выделение ДНК */}
					<section className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl">
						<h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-teal-600">
							Выделение ДНК
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<input
								list="labs-list"
								placeholder="Лаборатория"
								value={specimen.extrLab || ''}
								maxLength={40}
								data-testid="editspecimen-lab"
								onChange={(e) => onChange({...specimen, extrLab: e.target.value})}
								className={MD3.input}
							/>
							<input
								list="ops-list"
								placeholder="Лаборант"
								value={specimen.extrOperator || ''}
								maxLength={40}
								data-testid="editspecimen-operator"
								onChange={(e) =>
									onChange({...specimen, extrOperator: e.target.value})
								}
								className={MD3.input}
							/>
							<input
								list="methods-list"
								placeholder="Метод"
								value={specimen.extrMethod || ''}
								maxLength={40}
								data-testid="editspecimen-method"
								onChange={(e) =>
									onChange({...specimen, extrMethod: e.target.value})
								}
								className={MD3.input}
							/>
							<input
								placeholder="Дата (Extr. Date)"
								value={specimen.extrDateRaw || ''}
								maxLength={20}
								data-testid="editspecimen-extrdate"
								onChange={(e) =>
									onChange({...specimen, extrDateRaw: e.target.value})
								}
								className={MD3.input}
							/>
						</div>
					</section>

					{/* Концентрация */}
					<section className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl">
						<h3 className="mb-4 text-[11px] font-bold uppercase tracking-wider text-teal-600">
							Концентрация
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<input
								placeholder="Оборудование (DNA meter)"
								value={specimen.dnaMeter || ''}
								maxLength={32}
								data-testid="editspecimen-dnameter"
								onChange={(e) => onChange({...specimen, dnaMeter: e.target.value})}
								className={MD3.input}
							/>
							<input
								placeholder="Концентрация"
								value={specimen.dnaConcentration || ''}
								maxLength={12}
								data-testid="editspecimen-dnaconc"
								inputMode="decimal"
								onChange={(e) =>
									onChange({...specimen, dnaConcentration: e.target.value})
								}
								className={MD3.input}
							/>
							<input
								placeholder="Кто измерял"
								value={specimen.measOperator || ''}
								maxLength={40}
								data-testid="editspecimen-measoperator"
								onChange={(e) =>
									onChange({...specimen, measOperator: e.target.value})
								}
								className={MD3.input}
							/>
							<input
								placeholder="Дата измерения"
								value={specimen.measDate || ''}
								maxLength={20}
								data-testid="editspecimen-measdate"
								onChange={(e) => onChange({...specimen, measDate: e.target.value})}
								className={MD3.input}
							/>
						</div>
					</section>

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							className={MD3.btnSecondary}
							data-testid="editspecimen-cancel"
						>
							Отмена
						</button>
						<button
							type="submit"
							className={MD3.btnPrimary}
							disabled={isEmpty}
							data-testid="editspecimen-submit"
							title={isEmpty ? 'Заполните хотя бы одно поле' : undefined}
						>
							<Save className="h-5 w-5" />
							Сохранить
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
