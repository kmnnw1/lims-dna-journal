'use client';

import { FlaskConical, ListTodo, Microscope, Sparkles } from 'lucide-react';
import React from 'react';

export type WorkflowStage =
	| 'PREP'
	| 'EXTRACTION'
	| 'DNA_MEASUREMENT'
	| 'AMPLIFICATION'
	| 'CLEANUP'
	| 'SEQUENCING'
	| 'TASKS';

const STAGES: Array<{
	id: WorkflowStage;
	label: string;
	help: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{
		id: 'PREP',
		label: 'Подготовка',
		help: 'Заполнение карточки пробы до работы',
		icon: Sparkles,
	},
	{
		id: 'EXTRACTION',
		label: 'Выделение ДНК',
		help: 'Партии выделения и протоколирование',
		icon: FlaskConical,
	},
	{
		id: 'DNA_MEASUREMENT',
		label: 'Концентрация ДНК',
		help: 'Измерение и прикрепление файлов прибора',
		icon: Microscope,
	},
	{
		id: 'AMPLIFICATION',
		label: 'Амплификация',
		help: 'История попыток по маркерам и результаты геля',
		icon: Microscope,
	},
	{
		id: 'TASKS',
		label: 'Задания',
		help: 'Очередь работ (амплификация и партии)',
		icon: ListTodo,
	},
	{
		id: 'CLEANUP',
		label: 'Очистка',
		help: 'Партии очистки амплификата',
		icon: FlaskConical,
	},
	{
		id: 'SEQUENCING',
		label: 'Секвенирование',
		help: 'Отправка партий, результаты и файлы',
		icon: Microscope,
	},
];

export function WorkflowStagePicker({
	value,
	onChange,
}: {
	value: WorkflowStage;
	onChange: (v: WorkflowStage) => void;
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{STAGES.map((s) => {
				const Icon = s.icon;
				const active = value === s.id;
				return (
					<button
						key={s.id}
						type="button"
						onClick={() => onChange(s.id)}
						title={s.help}
						className={[
							'flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border',
							active
								? 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) border-(--md-sys-color-primary)'
								: 'bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-on-surface-variant) border-(--md-sys-color-outline-variant)/30 hover:bg-(--md-sys-color-surface-container-highest)',
						].join(' ')}
					>
						<Icon className="w-4 h-4" />
						{s.label}
					</button>
				);
			})}
		</div>
	);
}
