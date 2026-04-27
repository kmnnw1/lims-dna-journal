import ExcelJS from 'exceljs';
import {
	cellText,
	collectRowCellComments,
	extractEmbeddedDate,
	extrDateString,
	getByKey,
	isGarbageId,
	parseLabDate,
} from './cell-parsers';
import { ColumnBinding, ParsedSpecimenRow } from './types';

const NOTE_EXTRA_KEYS = new Set([
	'comment',
	'herbarium',
	'labNo',
	'connections',
	'pcr',
	'sequence',
	'recheck',
	'todo',
]);

export function parseRowWithBindings(
	row: unknown[],
	bindings: ColumnBinding[],
	sheet: ExcelJS.Worksheet,
	sheetRowIndex0: number,
	sheetName: string,
): ParsedSpecimenRow | null {
	if (!Array.isArray(row)) return null;

	const id = getByKey(row, bindings, 'isolate');
	if (isGarbageId(id)) return null;

	const extrRawFull = getByKey(row, bindings, 'extrDate');
	const extrDateRaw = extrRawFull ? extractEmbeddedDate(extrRawFull) || extrRawFull : '';
	const parsedDate = parseLabDate(extrDateRaw || extrRawFull);

	const its = getByKey(row, bindings, 'its') || getByKey(row, bindings, 'itsRef');
	const itsGb = getByKey(row, bindings, 'itsGb');
	const ssu = getByKey(row, bindings, 'ssu');
	const ssuGb = getByKey(row, bindings, 'ssuGb');
	const mtlsu = getByKey(row, bindings, 'mtlsu');
	const mtlsuGb = getByKey(row, bindings, 'mtlsuGb');
	const mtssu = getByKey(row, bindings, 'mtssu');
	const mtssuGb = getByKey(row, bindings, 'mtssuGb');
	const nuLsu = getByKey(row, bindings, 'nuLsu');
	const nuSsu = getByKey(row, bindings, 'nuSsu');
	const mcm7 = getByKey(row, bindings, 'mcm7');
	const mcm7Gb = getByKey(row, bindings, 'mcm7Gb');
	const rpb2 = getByKey(row, bindings, 'rpb2');
	const rpb2Gb = getByKey(row, bindings, 'rpb2Gb');

	const collector = getByKey(row, bindings, 'collector');

	const noteParts: string[] = [];

	for (const b of bindings) {
		if (b.key.startsWith('__col_')) {
			const v = cellText(row[b.index]);
			if (v) noteParts.push(`${b.rawHeader}: ${v}`);
			continue;
		}
		const base = b.key.replace(/_\d+$/, '');
		if (NOTE_EXTRA_KEYS.has(base)) {
			const v = cellText(row[b.index]);
			if (v) noteParts.push(`${b.rawHeader}: ${v}`);
		}
	}

	const markerBits: string[] = [];
	if (ssuGb) markerBits.push(`SSU GB: ${ssuGb}`);
	if (mtlsuGb) markerBits.push(`mtLSU GB: ${mtlsuGb}`);
	if (mtssuGb) markerBits.push(`mtSSU GB: ${mtssuGb}`);
	if (mcm7Gb) markerBits.push(`MCM7 GB: ${mcm7Gb}`);
	if (rpb2Gb) markerBits.push(`RPB2 GB: ${rpb2Gb}`);
	if (rpb2) markerBits.push(`RPB2: ${rpb2}`);

	if (ssu && mtssu && ssu !== mtssu) {
		markerBits.push(`mtSSU (отдельно): ${mtssu}`);
	}

	const lsuStatus = mtlsu || nuLsu || '';
	if (mtlsu && nuLsu && mtlsu !== nuLsu) {
		markerBits.push(`nuLSU (дубль): ${nuLsu}`);
	}

	let ssuStatus = ssu || mtssu || '';
	if (nuSsu && !ssuStatus) ssuStatus = nuSsu;

	const cellComments = collectRowCellComments(sheet, sheetRowIndex0);
	if (cellComments) noteParts.push(`Excel-комментарий: ${cellComments}`);
	if (markerBits.length) noteParts.push(markerBits.join(' | '));

	const notes = noteParts.filter(Boolean).join('\n');

	return {
		id,
		taxon: getByKey(row, bindings, 'taxon'),
		locality: getByKey(row, bindings, 'locality'),
		collector,
		extrLab: getByKey(row, bindings, 'labor'),
		extrOperator: collector,
		extrMethod: getByKey(row, bindings, 'method'),
		extrDateRaw: extrRawFull || extrDateRaw,
		extrDate: extrDateString(parsedDate),
		itsStatus: its,
		itsGb,
		ssuStatus,
		ssuGb,
		lsuStatus,
		lsuGb: mtlsuGb || '',
		mcm7Status: mcm7,
		mcm7Gb,
		notes,
		_sources: [{ sheet: sheetName, row: sheetRowIndex0 + 1 }],
	};
}

export function parseRowLegacy(
	row: unknown[],
	sheet: ExcelJS.Worksheet,
	sheetRowIndex0: number,
	sheetName: string,
): ParsedSpecimenRow | null {
	if (!Array.isArray(row) || row[2] == null || String(row[2]).trim() === '') return null;
	const id = cellText(row[2]);
	if (isGarbageId(id)) return null;

	const rawDateStr = row[10] != null ? String(row[10]).trim() : '';
	const parsedDate = parseLabDate(extractEmbeddedDate(rawDateStr) || rawDateStr);

	const unmapped: string[] = [];
	for (let j = 0; j < 50; j++) {
		if ([2, 3, 5, 6, 7, 8, 9, 10, 13, 14].includes(j)) continue;
		const t = cellText(row[j]);
		if (t) unmapped.push(t);
	}

	const fromCells = collectRowCellComments(sheet, sheetRowIndex0);
	const notes = [unmapped.join(' | '), fromCells].filter(Boolean).join('\n').trim();

	return {
		id,
		taxon: row[3] != null ? String(row[3]).trim() : '',
		locality: row[5] != null ? String(row[5]).trim() : '',
		collector: row[6] != null ? String(row[6]).trim() : '',
		extrLab: row[8] != null ? String(row[8]).trim() : '',
		extrMethod: row[9] != null ? String(row[9]).trim() : '',
		extrOperator: row[7] != null ? String(row[7]).trim() : '',
		extrDateRaw: rawDateStr,
		extrDate: extrDateString(parsedDate),
		itsStatus: row[13] != null ? String(row[13]).trim() : '',
		itsGb: row[14] != null ? String(row[14]).trim() : '',
		ssuStatus: '',
		ssuGb: '',
		lsuStatus: '',
		lsuGb: '',
		mcm7Status: '',
		mcm7Gb: '',
		notes,
		_sources: [{ sheet: sheetName, row: sheetRowIndex0 + 1 }],
	};
}

export function parseLySheetRows(
	rawData: unknown[][],
	sheet: ExcelJS.Worksheet,
	sheetName: string,
): ParsedSpecimenRow[] {
	const out: ParsedSpecimenRow[] = [];
	for (let i = 0; i < rawData.length; i++) {
		const row = rawData[i];
		if (!Array.isArray(row)) continue;
		const id = cellText(row[0]);
		if (isGarbageId(id)) continue;

		const taxon = cellText(row[1]);
		const c2 = row[2];
		let extrDateRaw = '';
		let parsedDate: Date | null = null;
		if (c2 instanceof Date) {
			extrDateRaw = c2.toISOString().slice(0, 10);
			parsedDate = c2;
		} else if (typeof c2 === 'number' && c2 > 20000 && c2 < 600000) {
			const d = new Date(Math.round((c2 - 25569) * 86400 * 1000));
			extrDateRaw = d.toISOString().slice(0, 10);
			parsedDate = d;
		} else {
			const comment = cellText(row[2]);
			extrDateRaw = comment;
			parsedDate = parseLabDate(extractEmbeddedDate(comment) || comment);
		}

		const locality = cellText(row[3]);
		const collector = cellText(row[4]);
		const herbarium = cellText(row[5]);
		const labor = cellText(row[6]);
		const method = cellText(row[7]);

		const noteParts = [herbarium && `Гербарий: ${herbarium}`].filter(Boolean) as string[];
		const cellComments = collectRowCellComments(sheet, i);
		if (cellComments) noteParts.push(`Excel-комментарий: ${cellComments}`);

		out.push({
			id,
			taxon,
			locality,
			collector,
			extrLab: labor,
			extrOperator: collector,
			extrMethod: method,
			extrDateRaw,
			extrDate: extrDateString(parsedDate),
			itsStatus: '',
			itsGb: '',
			ssuStatus: '',
			ssuGb: '',
			lsuStatus: '',
			lsuGb: '',
			mcm7Status: '',
			mcm7Gb: '',
			notes: noteParts.join('\n'),
			_sources: [{ sheet: sheetName, row: i + 1 }],
		});
	}
	return out;
}
