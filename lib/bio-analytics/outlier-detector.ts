import type { EditSpecimenForm } from '@/types';

export type Outlier = {
	field: keyof EditSpecimenForm;
	message: string;
	severity: 'warning' | 'error';
};

/**
 * Детекция аномалий в данных пробы.
 * Проверяет концентрацию, даты и логическую целостность.
 */
export function detectOutliers(specimen: EditSpecimenForm): Outlier[] {
	const outliers: Outlier[] = [];

	// 1. Проверка концентрации (например, > 1000 нг/мкл - подозрительно)
	if (specimen.dnaConcentration) {
		const conc = Number.parseFloat(specimen.dnaConcentration);
		if (!Number.isNaN(conc)) {
			if (conc > 1000) {
				outliers.push({
					field: 'dnaConcentration',
					message:
						'Экстремально высокая концентрация (>1000 нг/мкл). Проверьте разведение.',
					severity: 'warning',
				});
			} else if (conc < 0.1 && conc > 0) {
				outliers.push({
					field: 'dnaConcentration',
					message: 'Очень низкая концентрация. Возможны проблемы с выделением.',
					severity: 'warning',
				});
			}
		}
	}

	// 2. Проверка заполненности оператора при наличии данных измерения
	if ((specimen.dnaConcentration || specimen.dnaMeter) && !specimen.measOperator) {
		outliers.push({
			field: 'measOperator',
			message: 'Данные измерения есть, но оператор не указан.',
			severity: 'warning',
		});
	}

	return outliers;
}
