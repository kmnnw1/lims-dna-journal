import ExcelJS from 'exceljs';
import {
	buildColumnBindings,
	cellText,
	findHeaderRowIndex,
	headerToCanonicalKey,
} from './cell-parsers';
import { parseLySheetRows, parseRowLegacy, parseRowWithBindings } from './row-parsers';
import { ColumnBinding, ParsedSpecimenRow } from './types';

export function extractRawDataFromSheet(sheet: ExcelJS.Worksheet): unknown[][] {
	const rawData: unknown[][] = [];
	sheet.eachRow({ includeEmpty: true }, (row) => {
		const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
		rawData.push(rowValues.map((v) => (v === undefined || v === null ? '' : v)));
	});
	return rawData;
}

// --- ВОЗВРАЩЕННАЯ ФУНКЦИЯ ДЛЯ НАСЛЕДИЯ ---
function parseSheetLegacyRows(
	sheet: ExcelJS.Worksheet,
	sheetName: string,
	rawData: unknown[][],
): ParsedSpecimenRow[] {
	const out: ParsedSpecimenRow[] = [];
	for (let i = 2; i < rawData.length; i++) {
		const parsed = parseRowLegacy(rawData[i], sheet, i, sheetName);
		if (parsed) out.push(parsed);
	}
	return out;
}

export function parseSheetToRows(sheet: ExcelJS.Worksheet, sheetName: string): ParsedSpecimenRow[] {
	const rawData = extractRawDataFromSheet(sheet);
	if (!rawData.length) return [];

	const sn = sheetName.trim();
	if (/^LY$/i.test(sn)) {
		return parseLySheetRows(rawData, sheet, sheetName);
	}

	const headerIdx = findHeaderRowIndex(rawData);
	if (headerIdx >= 0) {
		const bindings = buildColumnBindings(rawData[headerIdx]);
		const hasIsolate = bindings.some((b) => b.key === 'isolate' || /^isolate_\d+$/.test(b.key));
		if (hasIsolate) {
			const out: ParsedSpecimenRow[] = [];
			for (let i = headerIdx + 1; i < rawData.length; i++) {
				const parsed = parseRowWithBindings(rawData[i], bindings, sheet, i, sheetName);
				if (parsed) out.push(parsed);
			}
			return out;
		}
	}

	return parseSheetLegacyRows(sheet, sheetName, rawData);
}
