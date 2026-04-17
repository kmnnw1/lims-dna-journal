import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

const DATA_DIR = join(process.cwd(), 'data');
const EXCEL_PATH = join(DATA_DIR, 'feedback.xlsx');

export interface FeedbackData {
	timestamp: string;
	specimenId: string;
	notes: string;
	photos: string[];
	user?: string;
}

/**
 * Сохраняет данные обратной связи в Excel файл в качестве резервной копии.
 * Если файл не существует, он будет создан.
 */
export async function saveFeedbackToExcel(data: FeedbackData) {
	try {
		// Убеждаемся, что папка data существует
		if (!existsSync(DATA_DIR)) {
			mkdirSync(DATA_DIR, { recursive: true });
		}

		const workbook = new ExcelJS.Workbook();
		let worksheet: ExcelJS.Worksheet;

		if (existsSync(EXCEL_PATH)) {
			await workbook.xlsx.readFile(EXCEL_PATH);
			worksheet = workbook.getWorksheet('Feedback') || workbook.addWorksheet('Feedback');
		} else {
			worksheet = workbook.addWorksheet('Feedback');
			// Добавляем заголовки
			worksheet.columns = [
				{ header: 'Дата и время', key: 'timestamp', width: 25 },
				{ header: 'ID Пробы', key: 'specimenId', width: 15 },
				{ header: 'Пользователь', key: 'user', width: 20 },
				{ header: 'Заметки', key: 'notes', width: 50 },
				{ header: 'Ссылки на фото', key: 'photos', width: 70 },
			];

			// Стилизуем шапку
			worksheet.getRow(1).font = { bold: true };
			worksheet.getRow(1).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFE0E0E0' },
			};
		}

		// Добавляем строку
		worksheet.addRow({
			timestamp: data.timestamp,
			specimenId: data.specimenId,
			user: data.user || 'Anonymous',
			notes: data.notes,
			photos: data.photos.join(', '),
		});

		// Сохраняем
		await workbook.xlsx.writeFile(EXCEL_PATH);
		console.log(`Feedback saved to Excel: ${EXCEL_PATH}`);
	} catch (error) {
		// Мы не хотим ронять API, если запись в Excel не удалась, но логируем ошибку
		console.error('Failed to save feedback backup to Excel:', error);
	}
}
