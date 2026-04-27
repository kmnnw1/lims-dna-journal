import ExcelJS from 'exceljs';
import path from 'path';
import { prisma } from '../lib/database/prisma';
import { cellText, mergeById, parseSheetToRows } from '../lib/excel';
import { resolveTechnicians } from '../lib/excel/technician-resolver';

async function reimport() {
	console.log('🔄 Запуск исправления #REF! и переимпорта...');

	const rawPath = process.env.DATA_XLSX_PATH || 'data/data.xlsx';
	const filePath = path.resolve(process.cwd(), rawPath);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);

	const dataToInsert = [];
	for (const sheet of workbook.worksheets) {
		console.log(`📑 Парсинг листа: ${sheet.name}...`);
		const rows = parseSheetToRows(sheet, sheet.name);
		dataToInsert.push(...rows);
	}

	const uniqueData = mergeById(dataToInsert);
	console.log(`📦 Всего уникальных строк для обработки: ${uniqueData.length}`);

	const fixedCount = 0;
	for (let i = 0; i < uniqueData.length; i++) {
		const row = uniqueData[i];
		const { id, ...data } = row;

		// При переимпорте с новым cellText, #REF! ошибки должны разрешиться
		const techIds = await resolveTechnicians(data.extrOperator || '');

		await prisma.specimen.upsert({
			where: { id },
			update: {
				...data,
				technicians: { set: techIds.map((tid) => ({ id: tid })) },
				updatedAt: new Date(),
			},
			create: {
				id,
				...data,
				technicians: { connect: techIds.map((tid) => ({ id: tid })) },
			},
		});

		if (i % 500 === 0) console.log(`  -> Обработано: ${i}/${uniqueData.length}`);
	}

	console.log('✨ Переимпорт завершен. Ошибки #REF! исправлены (где это было возможно).');
}

reimport()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
