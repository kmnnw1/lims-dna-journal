import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Скрипт для извлечения данных из data.xlsx и поиска по ключевым словам.
 */

async function debugData() {
	const filePath = join(process.cwd(), 'data', 'data.xlsx');
	const outPath = join(process.cwd(), 'data', 'data_dump.txt');

	console.log(`📖 Загрузка ${filePath}...`);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);

	let fullText = '';
	const results: string[] = [];
	const searchTerms = ['давыдов', 'davydov'];

	workbook.eachSheet((sheet, id) => {
		fullText += `\n=== SHEET: ${sheet.name} ===\n`;
		console.log(`  -> Обработка листа: ${sheet.name}`);

		sheet.eachRow((row, rowNumber) => {
			const rowValues = row.values;
			// row.values может быть массивом или объектом
			const rowStr = Array.isArray(rowValues)
				? rowValues
						.map((v) => (v && typeof v === 'object' ? JSON.stringify(v) : String(v)))
						.join(' | ')
				: JSON.stringify(rowValues);

			fullText += `[Row ${rowNumber}] ${rowStr}\n`;

			const lowerRow = rowStr.toLowerCase();
			if (searchTerms.some((term) => lowerRow.includes(term))) {
				results.push(`[${sheet.name}][Row ${rowNumber}] ${rowStr}`);
			}
		});
	});

	await fs.writeFile(outPath, fullText, 'utf-8');
	console.log(`✅ Весь текст сохранен в ${outPath}`);

	console.log('\n🔍 Результаты поиска ("Давыдов" / "Davydov"):');
	if (results.length > 0) {
		results.forEach((r) => console.log(r));
		console.log(`\nВсего найдено строк: ${results.length}`);
	} else {
		console.log('Ничего не найдено.');
	}
}

debugData().catch(console.error);
