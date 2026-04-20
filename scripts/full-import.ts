/**
 * Full Excel Import — Умный импорт data.xlsx
 * Читает ВСЕ листы, строит specimens + PcrAttempts
 * Режим: UPSERT (добавляет новые, обновляет существующие)
 */

import { join } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
const DATA_PATH = join(process.cwd(), 'data', 'data.xlsx');

// =================================================================
// Утилиты
// =================================================================

function cellStr(cell: ExcelJS.Cell): string {
	if (cell.value === null || cell.value === undefined) return '';
	if (typeof cell.value === 'object') {
		if ('richText' in cell.value) {
			return (cell.value as ExcelJS.CellRichTextValue).richText.map((rt) => rt.text).join('');
		}
		if ('result' in cell.value) {
			const result = (cell.value as ExcelJS.CellFormulaValue).result;
			if (result === undefined || result === null) return '';
			if (
				typeof result === 'object' &&
				result !== null &&
				'error' in (result as unknown as Record<string, unknown>)
			)
				return '';
			return result.toString();
		}
		if (cell.value instanceof Date) {
			return cell.value.toISOString().split('T')[0];
		}
		if ('hyperlink' in cell.value) {
			return (cell.value as ExcelJS.CellHyperlinkValue).text?.toString() ?? '';
		}
		return '';
	}
	return cell.value.toString().trim();
}

function getVal(row: ExcelJS.Row, col: number): string {
	return cellStr(row.getCell(col));
}

/**
 * Разделяет "E. A. Davydov 5295" на { name: "E. A. Davydov", number: "5295" }
 * Если номер не найден — вся строка идёт в name
 */
function splitCollectorAndNumber(raw: string): { name: string; number: string } {
	if (!raw) return { name: '', number: '' };
	// Паттерн: текст + пробел + число (возможно с дробью)
	const match = raw.match(/^(.+?)\s+(\d[\d./\-a-z]*)\s*$/i);
	if (match) {
		return { name: match[1].trim(), number: match[2].trim() };
	}
	return { name: raw.trim(), number: '' };
}

/**
 * Разделяет "ALTB" или "ALTB 12345" на { herbarium, accession }
 */
function splitHerbariumAndAccession(raw: string): { herbarium: string; accession: string } {
	if (!raw) return { herbarium: '', accession: '' };
	const parts = raw.split(/\s+/);
	if (parts.length >= 2) {
		return { herbarium: parts[0], accession: parts.slice(1).join(' ') };
	}
	return { herbarium: raw.trim(), accession: '' };
}

/**
 * Нормализация статуса маркера из Excel
 * "1" → "✓", "rev" → "rev", "bad" → "✕", пустой → null
 */
function normalizeMarkerStatus(raw: string): string | null {
	if (!raw) return null;
	const s = raw.trim().toLowerCase();
	if (s === '1' || s === 'ok' || s === 'ready') return '✓';
	if (s === 'bad' || s === 'no' || s === '0') return '✕';
	if (s === 'rev' || s === 'weak' || s === '?') return '?';
	// Число > 1 тоже может означать "готово" (количество сиквенсов)
	if (/^\d+$/.test(s) && Number(s) > 0) return '✓';
	return raw.trim();
}

// =================================================================
// Парсинг Home листа
// =================================================================

interface RawSpecimen {
	id: string;
	taxon: string;
	comment: string;
	locality: string;
	collector: string;
	collectionNumber: string;
	herbarium: string;
	accessionNumber: string;
	lab: string;
	method: string;
	extrDate: string;
	labNo: string;
	connections: string;
	itsStatus: string | null;
	itsGb: string;
	rpb2Status: string | null;
	rpb2Gb: string;
	ssuStatus: string | null;
	ssuGb: string;
	mtLsuStatus: string | null;
	mtLsuGb: string;
	mtSsuStatus: string | null;
	mtSsuGb: string;
	mcm7Status: string | null;
	mcm7Gb: string;
	rowNumber: number;
}

function parseHomeSheet(sheet: ExcelJS.Worksheet): RawSpecimen[] {
	const specimens: RawSpecimen[] = [];
	// Строка 1 = супер-заголовок, строка 2 = заголовки, данные начинаются со строки 3
	sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
		if (rowNumber <= 2) return; // Пропускаем заголовки

		const isolate = getVal(row, 3); // C = Isolate
		if (!isolate || isolate.startsWith(' ')) return; // Пустой или пробел-заголовок

		const collectorRaw = getVal(row, 7); // G = Collector / Coll. No.
		const { name: collector, number: collectionNumber } = splitCollectorAndNumber(collectorRaw);

		const herbRaw = getVal(row, 8); // H = Herbarium / Acc. No.
		const { herbarium, accession: accessionNumber } = splitHerbariumAndAccession(herbRaw);

		specimens.push({
			id: isolate.trim(),
			taxon: getVal(row, 4), // D
			comment: getVal(row, 5), // E
			locality: getVal(row, 6), // F
			collector,
			collectionNumber,
			herbarium,
			accessionNumber,
			lab: getVal(row, 9), // I = Labor
			method: getVal(row, 10), // J = Method
			extrDate: getVal(row, 11), // K = Extr. Data
			labNo: getVal(row, 12), // L = Lab. No.
			connections: getVal(row, 13), // M = Connections
			itsStatus: normalizeMarkerStatus(getVal(row, 14)), // N
			itsGb: getVal(row, 15), // O
			rpb2Status: normalizeMarkerStatus(getVal(row, 16)), // P
			rpb2Gb: getVal(row, 17), // Q
			ssuStatus: normalizeMarkerStatus(getVal(row, 18)), // R
			ssuGb: getVal(row, 19), // S
			mtLsuStatus: normalizeMarkerStatus(getVal(row, 20)), // T
			mtLsuGb: getVal(row, 21), // U
			mtSsuStatus: normalizeMarkerStatus(getVal(row, 22)), // V
			mtSsuGb: getVal(row, 23), // W
			mcm7Status: normalizeMarkerStatus(getVal(row, 24)), // X
			mcm7Gb: getVal(row, 25), // Y
			rowNumber: rowNumber,
		});
	});

	return specimens;
}

// =================================================================
// Парсинг листов-маркеров (ПЦР-попытки)
// =================================================================

interface RawPcrRun {
	specimenId: string;
	marker: string;
	attempt: number;
	conditions: string;
	primers: string;
	result: string;
}

/**
 * Парсит лист маркера. Колонки повторяются тройками:
 * [условия] [праймеры] [результат]
 */
function parseMarkerSheet(
	sheet: ExcelJS.Worksheet,
	marker: string,
	config: { idCol: number; dataStartCol: number; headerRow: number },
): RawPcrRun[] {
	const runs: RawPcrRun[] = [];

	sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
		if (rowNumber <= config.headerRow) return;

		const specimenId = getVal(row, config.idCol);
		if (!specimenId || specimenId.startsWith(' ')) return;

		// Читаем тройки колонок начиная с dataStartCol
		let attempt = 0;
		for (let col = config.dataStartCol; col <= sheet.columnCount; col += 3) {
			const conditions = getVal(row, col);
			const primers = getVal(row, col + 1);
			const result = getVal(row, col + 2);

			// Пропускаем пустые тройки
			if (!conditions && !primers && !result) continue;

			attempt++;
			runs.push({
				specimenId: specimenId.trim(),
				marker,
				attempt,
				conditions: conditions || '',
				primers: primers || '',
				result: result || '',
			});
		}
	});

	return runs;
}

// =================================================================
// Основной импорт
// =================================================================

async function main() {
	console.log('📊 Загружаю data.xlsx...');
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(DATA_PATH);

	// 1. Парсим Home
	const homeSheet = workbook.getWorksheet('Home');
	if (!homeSheet) throw new Error('Лист "Home" не найден!');

	const specimens = parseHomeSheet(homeSheet);
	console.log(`🏠 Home: ${specimens.length} проб найдено`);

	// 2. Парсим листы маркеров
	const markerConfigs: Array<{
		sheetName: string;
		marker: string;
		idCol: number;
		dataStartCol: number;
		headerRow: number;
	}> = [
		{ sheetName: 'ITS', marker: 'ITS', idCol: 4, dataStartCol: 9, headerRow: 2 },
		{ sheetName: 'mtLSU', marker: 'mtLSU', idCol: 3, dataStartCol: 8, headerRow: 2 },
		{ sheetName: 'RPB2', marker: 'RPB2', idCol: 1, dataStartCol: 5, headerRow: 2 },
		{ sheetName: 'mtSSU', marker: 'mtSSU', idCol: 3, dataStartCol: 8, headerRow: 2 },
		{ sheetName: 'nuLSU', marker: 'nuLSU', idCol: 1, dataStartCol: 6, headerRow: 1 },
	];

	const allRuns: RawPcrRun[] = [];
	for (const cfg of markerConfigs) {
		const sheet = workbook.getWorksheet(cfg.sheetName);
		if (!sheet || sheet.rowCount <= 1) {
			console.log(`  ⏩ ${cfg.sheetName}: пустой, пропуск`);
			continue;
		}
		const runs = parseMarkerSheet(sheet, cfg.marker, cfg);
		allRuns.push(...runs);
		console.log(`  🧬 ${cfg.sheetName}: ${runs.length} ПЦР-попыток`);
	}

	console.log(`\n📊 Итого: ${specimens.length} проб, ${allRuns.length} ПЦР-попыток\n`);

	// 3. Импортируем в БД
	console.log('💾 Импортирую в БД (upsert)...');

	// Все известные specimen IDs
	const specimenIds = new Set(specimens.map((s) => s.id));

	let created = 0;
	let skipped = 0;

	for (const s of specimens) {
		try {
			await prisma.specimen.upsert({
				where: { id: s.id },
				create: {
					id: s.id,
					taxon: s.taxon || null,
					locality: s.locality || null,
					collector: s.collector || null,
					collectionNumber: s.collectionNumber || null,
					herbarium: s.herbarium || null,
					accessionNumber: s.accessionNumber || null,
					extrLab: s.lab || null,
					extrMethod: s.method || null,
					extrDateRaw: s.extrDate || null,
					labNo: s.labNo || null,
					connections: s.connections || null,
					notes: s.comment || null,
					itsStatus: s.itsStatus,
					itsGb: s.itsGb || null,
					rpb2Status: s.rpb2Status,
					rpb2Gb: s.rpb2Gb || null,
					ssuStatus: s.ssuStatus,
					ssuGb: s.ssuGb || null,
					mtLsuStatus: s.mtLsuStatus,
					mtLsuGb: s.mtLsuGb || null,
					mtSsuStatus: s.mtSsuStatus,
					mtSsuGb: s.mtSsuGb || null,
					mcm7Status: s.mcm7Status,
					mcm7Gb: s.mcm7Gb || null,
					importOrigin: 'data.xlsx (full-import)',
					importRow: s.rowNumber,
				},
				update: {
					taxon: s.taxon || undefined,
					locality: s.locality || undefined,
					collector: s.collector || undefined,
					collectionNumber: s.collectionNumber || undefined,
					herbarium: s.herbarium || undefined,
					accessionNumber: s.accessionNumber || undefined,
					extrLab: s.lab || undefined,
					extrMethod: s.method || undefined,
					extrDateRaw: s.extrDate || undefined,
					labNo: s.labNo || undefined,
					connections: s.connections || undefined,
					notes: s.comment || undefined,
					itsStatus: s.itsStatus ?? undefined,
					itsGb: s.itsGb || undefined,
					rpb2Status: s.rpb2Status ?? undefined,
					rpb2Gb: s.rpb2Gb || undefined,
					ssuStatus: s.ssuStatus ?? undefined,
					ssuGb: s.ssuGb || undefined,
					mtLsuStatus: s.mtLsuStatus ?? undefined,
					mtLsuGb: s.mtLsuGb || undefined,
					mtSsuStatus: s.mtSsuStatus ?? undefined,
					mtSsuGb: s.mtSsuGb || undefined,
					mcm7Status: s.mcm7Status ?? undefined,
					mcm7Gb: s.mcm7Gb || undefined,
				},
			});
			created++;
		} catch (err) {
			skipped++;
			if (skipped <= 5) {
				console.log(`  ⚠️ Ошибка для "${s.id}": ${(err as Error).message}`);
			}
		}
	}

	console.log(`  ✅ Пробы: ${created} обработано, ${skipped} ошибок`);

	// 4. Импортируем ПЦР-попытки
	console.log('🧬 Импортирую ПЦР-попытки...');

	// Сначала удаляем старые попытки из импорта (не ручные)
	// Чтобы не дублировать при повторном запуске
	const deletedAttempts = await prisma.pcrAttempt.deleteMany({
		where: {
			resultNotes: { contains: 'excel-import' },
		},
	});
	console.log(`  🗑️  Удалено ${deletedAttempts.count} старых импортных ПЦР-записей`);

	let pcrCreated = 0;
	let pcrSkipped = 0;

	for (const run of allRuns) {
		if (!specimenIds.has(run.specimenId)) {
			pcrSkipped++;
			continue;
		}

		try {
			await prisma.pcrAttempt.create({
				data: {
					specimenId: run.specimenId,
					marker: run.marker,
					forwardPrimer: run.primers.split('+')[0]?.trim() || null,
					reversePrimer: run.primers.split('+')[1]?.trim() || null,
					result: run.result === 'Ok' ? 'Success' : 'Fail',
					resultNotes: `excel-import | ${run.conditions} | попытка ${run.attempt}`,
				},
			});
			pcrCreated++;
		} catch {
			pcrSkipped++;
		}
	}

	console.log(`  ✅ ПЦР: ${pcrCreated} создано, ${pcrSkipped} пропущено (нет specimen)`);

	// 5. Статистика
	const totalSpecimens = await prisma.specimen.count();
	const totalAttempts = await prisma.pcrAttempt.count();
	console.log(`\n📊 ИТОГ БД:`);
	console.log(`  • Проб: ${totalSpecimens}`);
	console.log(`  • ПЦР-попыток: ${totalAttempts}`);
	console.log('\n✨ Импорт завершён.');

	await prisma.$disconnect();
}

main().catch((err) => {
	console.error('❌ Фатальная ошибка:', err);
	prisma.$disconnect();
	process.exit(1);
});
