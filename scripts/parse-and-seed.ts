import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import ExcelJS from 'exceljs';
import path from 'path';
import { PrismaClient } from '../prisma/generated/client/client';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

async function parseAndSeed() {
	const workbook = new ExcelJS.Workbook();
	const filePath = path.join(process.cwd(), 'data', 'data.xlsx');

	console.log(`Loading ${filePath}...`);
	await workbook.xlsx.readFile(filePath);

	const sheet = workbook.getWorksheet('Home');
	if (!sheet) {
		console.error("No 'Home' sheet found.");
		process.exit(1);
	}

	console.log(`Processing 'Home' sheet with ${sheet.rowCount} rows...`);

	let successCount = 0;

	for (let i = 3; i <= sheet.rowCount; i++) {
		const row = sheet.getRow(i);
		const rawRow = row.values;
		if (!rawRow || (Array.isArray(rawRow) && rawRow.length < 3)) continue;

		// Extract cell values safely (handling formulas)
		const getVal = (colIdx: number) => {
			let val = Array.isArray(rawRow)
				? rawRow[colIdx]
				: (rawRow as Record<number, unknown>)[colIdx];
			if (val && typeof val === 'object' && 'result' in val) {
				val = val.result;
			}
			if (val && typeof val === 'object' && 'text' in val) {
				val = val.text; // Handling rich text or hyper-links
			}
			if (val && typeof val === 'object' && 'error' in val) {
				val = null; // Ignore #VALUE! errors
			}
			return val ? String(val).trim() : null;
		};

		const id = getVal(3); // ExcelJS values array is 1-indexed, starting from C = 3
		if (!id) continue;

		const parseMarkerStatus = (val: unknown) => {
			if (val === null || val === undefined) return null;
			if (
				val === '1' ||
				val === 1 ||
				String(val).toLowerCase() === 'yes' ||
				String(val).toLowerCase().includes('rev')
			)
				return '✓';
			if (val === '0' || String(val).startsWith('#')) return '✕'; // Formula error typically means missing
			if (String(val).trim() === '') return null;
			return String(val);
		};

		const specimenData = {
			id,
			taxon: getVal(4),
			notes: getVal(5),
			locality: String(getVal(6) || '').slice(0, 191), // Truncate if too long
			collector: getVal(7),
			herbarium: getVal(8),
			extrLab: getVal(9),
			extrMethod: getVal(10),
			extrDateRaw: getVal(11),
			labNo: getVal(12),
			itsStatus: parseMarkerStatus(getVal(14)),
			itsGb: getVal(15),
			rpb2Status: parseMarkerStatus(getVal(16)),
			rpb2Gb: getVal(17),
			ssuStatus: parseMarkerStatus(getVal(18)),
			ssuGb: getVal(19),
			mtLsuStatus: parseMarkerStatus(getVal(20)),
			mtLsuGb: getVal(21),
			mtSsuStatus: parseMarkerStatus(getVal(22)),
			mtSsuGb: getVal(23),
			mcm7Status: parseMarkerStatus(getVal(24)),
			mcm7Gb: getVal(25),
			importOrigin: 'data.xlsx script',
			importRow: i,
		};

		try {
			await prisma.specimen.upsert({
				where: { id },
				update: specimenData,
				create: specimenData,
			});
			successCount++;

			if (successCount % 500 === 0) {
				console.log(`...imported ${successCount} records.`);
			}
		} catch (e: unknown) {
			console.error(`Error importing row ${i} (ID: ${id}):`, (e as Error).message);
		}
	}

	console.log(`✅ successfully imported ${successCount} records.`);
	await prisma.$disconnect();
}

parseAndSeed().catch(async (e) => {
	console.error('Fatal error:', e);
	await prisma.$disconnect();
	process.exit(1);
});
