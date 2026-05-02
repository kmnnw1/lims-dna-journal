import { extractEmbeddedDate, extrDateString, parseLabDate } from './cell-parsers';
import type { ParsedSpecimenRow } from './types';

const EXCEL_ERROR_RE = /^\s*#(REF|VALUE|ERROR|NAME|N\/A|NUM|NULL)!?\s*$/i;

function isExcelErrorToken(value: string): boolean {
	return EXCEL_ERROR_RE.test(value.trim());
}

function compactSpaces(value: string): string {
	return value.replace(/\s+/g, ' ').trim();
}

function cleanText(value: string, fixes: string[], fieldName: string): string {
	const trimmed = compactSpaces(value);
	if (!trimmed) return '';
	if (isExcelErrorToken(trimmed)) {
		fixes.push(`${fieldName}: удалён Excel error token (${trimmed})`);
		return '';
	}
	const inline = trimmed.replace(/#(REF|VALUE|ERROR|NAME|N\/A|NUM|NULL)!?/gi, (match: string) => {
		fixes.push(`${fieldName}: удалён фрагмент ${match}`);
		return '';
	});
	return compactSpaces(inline);
}

function normalizeMarkerStatus(value: string): string {
	const v = value.trim().toLowerCase();
	if (!v) return '';
	if (v === '✓' || v === '+' || v === 'ok' || v === 'success' || v === 'успех') return '✓';
	if (v === '✕' || v === 'x' || v === '-' || v === 'fail' || v === 'неуспех') return '✕';
	if (v === '?' || v === 'pending' || v === 'todo') return '?';
	return value.trim();
}

function normalizeGb(value: string): string {
	const v = value.trim();
	if (!v) return '';
	const m = v.match(/\b([A-Z]{1,3}_?\d{4,10}(?:\.\d+)?)\b/i);
	if (!m) return v;
	return m[1].toUpperCase();
}

/**
 * Глубокое восстановление полей на основе межколоночных зависимостей.
 * Правило 1: Если в поле Collector указано "Имя Номер" (Давыдов 5295),
 * разделяем их, если поле collectionNumber пустое.
 */
function deepRestoreFields(row: ParsedSpecimenRow, fixes: string[]): Partial<ParsedSpecimenRow> {
	const updates: Partial<ParsedSpecimenRow> = {};

	// Восстановление номера сбора из поля коллектора
	if (row.collector && !row.collectionNumber) {
		const m = row.collector.match(
			/^([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)*)\s+(\d+(?:\/\d+)?(?:[а-яА-Я])?)$/,
		);
		if (m) {
			updates.collector = m[1].trim();
			updates.collectionNumber = m[2].trim();
			fixes.push(`Collector -> CollectionNumber: разбор "${row.collector}" на имя и номер`);
		}
	}

	// Очистка префиксов в поле Collector (leg., coll. и т.д.)
	if (row.collector) {
		const cleaned = row.collector.replace(/^(?:leg\.?|coll\.?|collector:?|собр\.?|сбор:?)\s+/i, '');
		if (cleaned !== row.collector) {
			updates.collector = cleaned;
			fixes.push(`Collector: удален технический префикс из "${row.collector}"`);
		}
	}

	// Извлечение даты из Locality (часто встречается в скобках в конце)
	if (row.locality && !row.extrDate) {
		const dateMatch = row.locality.match(/\(([^)]*(\d{2,4})[^)]*)\)$/);
		if (dateMatch) {
			const potentialDate = dateMatch[1];
			const parsed = parseLabDate(extractEmbeddedDate(potentialDate) || potentialDate);
			if (parsed) {
				updates.extrDate = extrDateString(parsed);
				fixes.push(`Locality -> ExtrDate: извлечена дата "${potentialDate}" из местоположения`);
			}
		}
	}

	return updates;
}

export function normalizeParsedRow(row: ParsedSpecimenRow): ParsedSpecimenRow {
	const fixes: string[] = [];

	const id = cleanText(row.id, fixes, 'id');
	const taxon = cleanText(row.taxon, fixes, 'taxon');
	const locality = cleanText(row.locality, fixes, 'locality');
	const collector = cleanText(row.collector, fixes, 'collector');
	const extrLab = cleanText(row.extrLab, fixes, 'extrLab');
	const extrOperator = cleanText(row.extrOperator, fixes, 'extrOperator');
	const extrMethod = cleanText(row.extrMethod, fixes, 'extrMethod');
	const extrDateRaw = cleanText(row.extrDateRaw, fixes, 'extrDateRaw');

	const parsedDate = parseLabDate(extractEmbeddedDate(extrDateRaw) || extrDateRaw);
	const extrDate = extrDateString(parsedDate) ?? row.extrDate ?? null;

	const itsStatus = normalizeMarkerStatus(cleanText(row.itsStatus, fixes, 'itsStatus'));
	const ssuStatus = normalizeMarkerStatus(cleanText(row.ssuStatus, fixes, 'ssuStatus'));
	const lsuStatus = normalizeMarkerStatus(cleanText(row.lsuStatus, fixes, 'lsuStatus'));
	const mcm7Status = normalizeMarkerStatus(cleanText(row.mcm7Status, fixes, 'mcm7Status'));

	const itsGb = normalizeGb(cleanText(row.itsGb, fixes, 'itsGb'));
	const ssuGb = normalizeGb(cleanText(row.ssuGb, fixes, 'ssuGb'));
	const lsuGb = normalizeGb(cleanText(row.lsuGb, fixes, 'lsuGb'));
	const mcm7Gb = normalizeGb(cleanText(row.mcm7Gb, fixes, 'mcm7Gb'));

	const notesBase = cleanText(row.notes, fixes, 'notes');

	// Применяем правила глубокого восстановления
	const restored = deepRestoreFields(
		{
			...row,
			id,
			taxon,
			locality,
			collector,
			extrLab,
			extrOperator,
			extrMethod,
			extrDateRaw,
		},
		fixes,
	);

	const finalCollector = restored.collector ?? collector;
	const finalCollNo =
		restored.collectionNumber ?? cleanText(row.collectionNumber || '', fixes, 'collNo');
	const finalAccNo = cleanText(row.accessionNumber || '', fixes, 'accNo');
	const finalHerbarium = cleanText(row.herbarium || '', fixes, 'herbarium');
	const finalLabNo = cleanText(row.labNo || '', fixes, 'labNo');
	const finalConnections = cleanText(row.connections || '', fixes, 'connections');

	const finalExtrDate = restored.extrDate ?? extrDate;

	const autoFixLine =
		fixes.length > 0 ? `[AUTO_FIX] ${Array.from(new Set(fixes)).join('; ')}` : '';
	const notes = [notesBase, autoFixLine].filter(Boolean).join('\n');

	return {
		...row,
		id,
		taxon,
		locality,
		collector: finalCollector,
		collectionNumber: finalCollNo,
		accessionNumber: finalAccNo,
		herbarium: finalHerbarium,
		labNo: finalLabNo,
		connections: finalConnections,
		extrLab,
		extrOperator,
		extrMethod,
		extrDateRaw,
		extrDate: finalExtrDate,
		itsStatus,
		itsGb,
		ssuStatus,
		ssuGb,
		lsuStatus,
		lsuGb,
		mcm7Status,
		mcm7Gb,
		notes,
	};
}

export function sanitizeForExport(value: unknown): string {
	const raw = String(value ?? '');
	const cleaned = raw
		.replace(/#(REF|VALUE|ERROR|NAME|N\/A|NUM|NULL)!?/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
	return cleaned;
}
