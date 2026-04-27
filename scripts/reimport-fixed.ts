import ExcelJS from 'exceljs';
import path from 'path';
import { prisma } from '../lib/database/prisma';
import { cellText, mergeById, parseSheetToRows } from '../lib/excel';
import { resolveTechnicians } from '../lib/excel/technician-resolver';

async function reimport() {
	console.log('ЁЯФД ╨Ч╨░╨┐╤Г╤Б╨║ ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╨╕╤П #REF! ╨╕ ╨┐╨╡╤А╨╡╨╕╨╝╨┐╨╛╤А╤В╨░...');

	const rawPath = process.env.DATA_XLSX_PATH || 'data/data.xlsx';
	const filePath = path.resolve(process.cwd(), rawPath);

	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(filePath);

	const dataToInsert = [];
	for (const sheet of workbook.worksheets) {
		console.log(`ЁЯУС ╨Я╨░╤А╤Б╨╕╨╜╨│ ╨╗╨╕╤Б╤В╨░: ${sheet.name}...`);
		const rows = parseSheetToRows(sheet, sheet.name);
		dataToInsert.push(...rows);
	}

	const uniqueData = mergeById(dataToInsert);
	console.log(
		`ЁЯУж ╨Т╤Б╨╡╨│╨╛ ╤Г╨╜╨╕╨║╨░╨╗╤М╨╜╤Л╤Е ╤Б╤В╤А╨╛╨║ ╨┤╨╗╤П ╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨╕: ${uniqueData.length}`,
	);

	const fixedCount = 0;
	for (let i = 0; i < uniqueData.length; i++) {
		const row = uniqueData[i];
		const { id, ...data } = row;

		// ╨Я╤А╨╕ ╨┐╨╡╤А╨╡╨╕╨╝╨┐╨╛╤А╤В╨╡ ╤Б ╨╜╨╛╨▓╤Л╨╝ cellText, #REF! ╨╛╤И╨╕╨▒╨║╨╕ ╨┤╨╛╨╗╨╢╨╜╤Л ╤А╨░╨╖╤А╨╡╤И╨╕╤В╤М╤Б╤П
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

		if (i % 500 === 0) console.log(`  -> ╨Ю╨▒╤А╨░╨▒╨╛╤В╨░╨╜╨╛: ${i}/${uniqueData.length}`);
	}

	console.log(
		'тЬи ╨Я╨╡╤А╨╡╨╕╨╝╨┐╨╛╤А╤В ╨╖╨░╨▓╨╡╤А╤И╨╡╨╜. ╨Ю╤И╨╕╨▒╨║╨╕ #REF! ╨╕╤Б╨┐╤А╨░╨▓╨╗╨╡╨╜╤Л (╨│╨┤╨╡ ╤Н╤В╨╛ ╨▒╤Л╨╗╨╛ ╨▓╨╛╨╖╨╝╨╛╨╢╨╜╨╛).',
	);
}

reimport()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
