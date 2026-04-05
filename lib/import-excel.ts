import ExcelJS from 'exceljs';
import { prisma } from './prisma';

export type SourceRef = { sheet: string; row: number };

export type ParsedSpecimenRow = {
	id: string;
	taxon: string;
	locality: string;
	collector: string;
	extrLab: string;
	extrOperator: string;
	extrMethod: string;
	extrDateRaw: string;
	extrDate: string | null;
	itsStatus: string;
	itsGb: string;
	ssuStatus: string;
	ssuGb: string;
	lsuStatus: string;
	lsuGb: string;
	mcm7Status: string;
	mcm7Gb: string;
	notes: string;
	_sources?: SourceRef[];
};

// --- Умный парсинг сложных ячеек ---
function cellText(v: any): string {
	if (v === undefined || v === null) return '';
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);

	if (typeof v === 'object') {
		if (Array.isArray(v.richText)) {
			return v.richText.map((t: any) => t.text || '').join('').trim();
		}
		if (v.text && v.hyperlink) {
			return String(v.text).trim();
		}
		if (v.result !== undefined) {
			if (v.result instanceof Date) return v.result.toISOString().slice(0, 10);
			return String(v.result).trim();
		}
		try {
			return JSON.stringify(v);
		} catch {
			return '';
		}
	}

	return String(v)
		.trim()
		.replace(/[\r\n]+/g, ' | ')
		.replace(/\s{2,}/g, ' ');
}

function normalizeHeader(h: string): string {
	return h
		.toLowerCase()
		.replace(/\u00a0/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\s*\/\s*/g, '/')
		.trim();
}

export function isGarbageId(id: string): boolean {
	const s = id.toLowerCase().replace(/\s+/g, '');
	if (!s) return true;
	if (
		/^(ref|reference|ref\.|справочно|справка|k\-|k\+|к\-|к\+|nk|pk|нк|пк|blank|control|контроль|isolate|id)$/.test(
			s,
		)
	)
		return true;
	return false;
}

export function extractEmbeddedDate(raw: string): string {
	if (!raw) return '';
	const m = raw.match(/\b(\d{1,2})[\./](\d{1,2})[\./](\d{2,4})\b/);
	if (!m) return raw.trim();
	return `${m[1]}.${m[2]}.${m[3]}`;
}

export function headerToCanonicalKey(raw: string): string | null {
	const t = raw.trim();
	const n = normalizeHeader(raw);
	if (!n) return null;

	if (/^isolate$/i.test(t) || n === 'isolate') return 'isolate';
	if (/^taxon$/i.test(t) || n === 'taxon') return 'taxon';

	if (/\bits\s+gb\b/i.test(t) || n.includes('its gb')) return 'itsGb';
	if (/\bits\s*\(/i.test(t) || /справочно/i.test(t)) return 'itsRef';

	if (/\brpb2\s+gb\b/i.test(t) || /\brpb2\s*gb\b/i.test(n)) return 'rpb2Gb';
	if (/\brpb2\b/i.test(t) || n === 'rpb2') return 'rpb2';

	if (/\bmtssu\s+gb\b/i.test(t)) return 'mtssuGb';
	if (/\bmtssu\b/i.test(t) || n === 'mtssu') return 'mtssu';

	if (/\bmtlsu\s+gb\b/i.test(t)) return 'mtlsuGb';
	if (/^lsu$/i.test(t.trim())) return 'mtlsu';
	if (/\bmtlsu\b/i.test(t) || n === 'mtlsu') return 'mtlsu';

	if (/\bnu\s*ssu\b/i.test(t) || /nussu/i.test(n)) return 'nuSsu';
	if (/\bnu\s*lsu\b/i.test(t) || /nulsu/i.test(n)) return 'nuLsu';

	if (/\bssu\s+gb\b/i.test(t) || n.includes('ssu gb')) return 'ssuGb';
	if (/^ssu$/i.test(t) || n === 'ssu') return 'ssu';

	if (/\bmcm7\s+gb\b/i.test(t)) return 'mcm7Gb';
	if (/\bmcm7\b/i.test(t) || n === 'mcm7') return 'mcm7';

	if (/^its$/i.test(t) || n === 'its') return 'its';

	if (/comment/i.test(t)) return 'comment';
	if (/locality|collection/i.test(t)) return 'locality';
	if (/collector/i.test(t)) return 'collector';
	if (/herbarium|acc\.?\s*no/i.test(t)) return 'herbarium';
	if (/^labor$/i.test(t) || n === 'labor') return 'labor';
	if (/method/i.test(t) && !/mrssu/i.test(n)) return 'method';
	if (/extr\.?\s*data|extr\.?\s*date/i.test(t)) return 'extrDate';
	if (/lab\.?\s*no/i.test(t)) return 'labNo';
	if (/connections/i.test(t)) return 'connections';
	if (/^pcr$/i.test(t) || n === 'pcr') return 'pcr';
	if (/sequence/i.test(t)) return 'sequence';
	if (/re-check|recheck/i.test(t)) return 'recheck';
	if (/делать|сделать/i.test(t)) return 'todo';

	return null;
}

export function findHeaderRowIndex(rawData: unknown[][]): number {
	const max = Math.min(rawData.length, 120);
	for (let i = 0; i < max; i++) {
		const row = rawData[i];
		if (!Array.isArray(row)) continue;
		for (let j = 0; j < Math.min(row.length, 35); j++) {
			const cell = cellText(row[j]);
			if (/^isolate$/i.test(cell.trim())) return i;
		}
	}
	return -1;
}

export type ColumnBinding = { index: number; rawHeader: string; key: string };

export function buildColumnBindings(headerRow: unknown[]): ColumnBinding[] {
	const out: ColumnBinding[] = [];
	const counts = new Map<string, number>();
	const len = Math.min(headerRow.length, 90);
	for (let c = 0; c < len; c++) {
		const rawHeader = cellText(headerRow[c]);
		if (!rawHeader) continue;
		let key = headerToCanonicalKey(rawHeader);
		if (!key) key = `__col_${c}`;
		if (key.startsWith('__')) {
			out.push({ index: c, rawHeader, key });
			continue;
		}
		const n = counts.get(key) ?? 0;
		counts.set(key, n + 1);
		const finalKey = n === 0 ? key : `${key}_${n}`;
		out.push({ index: c, rawHeader, key: finalKey });
	}
	return out;
}

function getByKey(row: unknown[], bindings: ColumnBinding[], baseKey: string): string {
	const matches = bindings
		.filter((b) => {
			if (b.key === baseKey) return true;
			if (b.key.startsWith(baseKey + '_')) {
				const rest = b.key.slice(baseKey.length + 1);
				return /^\d+$/.test(rest);
			}
			return false;
		})
		.sort((a, b) => a.index - b.index);
	for (const b of matches) {
		const v = cellText(row[b.index]);
		if (v) return v;
	}
	return '';
}

export function collectRowCellComments(sheet: ExcelJS.Worksheet, rowIndex0: number): string {
	const excelRowIndex = rowIndex0 + 1;
	const row = sheet.getRow(excelRowIndex);
	if (!row) return '';

	const texts: string[] = [];
	row.eachCell({ includeEmpty: true }, (cell) => {
		if (cell.note) {
			const noteObj: any = cell.note;
			const noteText =
				typeof noteObj === 'string'
					? noteObj
					: noteObj.texts?.map((t: any) => t.text).join('') || '';
			if (noteText.trim()) texts.push(noteText.trim());
		}
	});
	return texts.join(' | ');
}

export function parseLabDate(raw: string): Date | null {
	if (!raw) return null;
	const compact = extractEmbeddedDate(raw);
	const s = compact.toLowerCase().trim();

	const dotMatch = s.match(/(\d{1,2})[\./-](\d{1,2})[\./-](\d{2,4})/);
	if (dotMatch) {
		let year = parseInt(dotMatch[3], 10);
		if (year < 100) year += 2000;
		return new Date(Date.UTC(year, parseInt(dotMatch[2], 10) - 1, parseInt(dotMatch[1], 10)));
	}

	const ruMonths: Record<string, number> = {
		янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4,
		июн: 5, июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10,
		nov: 10, дек: 11, dec: 11,
	};
	for (const [m, idx] of Object.entries(ruMonths)) {
		if (s.includes(m)) {
			const yearMatch = s.match(/\d{2,4}/);
			if (yearMatch) {
				let year = parseInt(yearMatch[0], 10);
				if (year < 100) year += 2000;
				return new Date(Date.UTC(year, idx, 1));
			}
		}
	}

	const romanRe = /(\d{1,2})\s+(xii|xi|x|ix|viii|vii|vi|iv|iii|ii|i|v)\s+(\d{2,4})/i;
	const romanMatch = s.match(romanRe);
	if (romanMatch) {
		const romans: Record<string, number> = {
			i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5,
			vii: 6, viii: 7, ix: 8, x: 9, xi: 10, xii: 11,
		};
		const month = romans[romanMatch[2].toLowerCase()];
		if (month !== undefined) {
			let year = parseInt(romanMatch[3], 10);
			if (year < 100) year += 2000;
			return new Date(Date.UTC(year, month, parseInt(romanMatch[1], 10)));
		}
	}

	if (/^\d{6}$/.test(s)) {
		return new Date(
			Date.UTC(
				2000 + parseInt(s.slice(4, 6), 10),
				parseInt(s.slice(2, 4), 10) - 1,
				parseInt(s.slice(0, 2), 10),
			),
		);
	}

	const ymMatch = s.match(/^(\d{4})-(\d{1,2})$/);
	if (ymMatch) {
		return new Date(Date.UTC(parseInt(ymMatch[1], 10), parseInt(ymMatch[2], 10) - 1, 1));
	}

	return null;
}

export function extrDateString(parsed: Date | null): string | null {
	if (!parsed || isNaN(parsed.getTime())) return null;
	return parsed.toISOString();
}

const NOTE_EXTRA_KEYS = new Set([
	'comment', 'herbarium', 'labNo', 'connections', 
	'pcr', 'sequence', 'recheck', 'todo',
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

function extractRawDataFromSheet(sheet: ExcelJS.Worksheet): unknown[][] {
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

function pickNonEmpty(prev: string, next: string): string {
	return next?.trim() ? next.trim() : prev?.trim() || '';
}

function formatSources(sources: SourceRef[]): string {
	if (!sources || sources.length === 0) return '';
	const map = new Map<string, Set<number>>();
	for (const s of sources) {
		if (!map.has(s.sheet)) map.set(s.sheet, new Set());
		map.get(s.sheet)!.add(s.row);
	}
	const parts: string[] = [];
	for (const [sheet, rows] of map.entries()) {
		if (rows.size > 3) {
			parts.push(`«${sheet}» (${rows.size} строк)`);
		} else {
			const sorted = Array.from(rows).sort((a, b) => a - b);
			parts.push(`«${sheet}» (стр. ${sorted.join(', ')})`);
		}
	}
	return `[Импорт: ${parts.join('; ')}]`;
}

export function mergeById(rows: ParsedSpecimenRow[]): ParsedSpecimenRow[] {
	const map = new Map<string, ParsedSpecimenRow>();

	for (const row of rows) {
		const prev = map.get(row.id);
		if (!prev) {
			map.set(row.id, { ...row, _sources: [...(row._sources || [])] });
			continue;
		}

		const noteSet = new Set<string>();
		if (prev.notes)
			prev.notes.split('\n---\n').forEach((n) => {
				if (n.trim()) noteSet.add(n.trim());
			});
		if (row.notes)
			row.notes.split('\n---\n').forEach((n) => {
				if (n.trim()) noteSet.add(n.trim());
			});
		const mergedNotes = Array.from(noteSet).join('\n---\n');

		const mergedSources = [...(prev._sources || []), ...(row._sources || [])];

		const extrDateRaw = pickNonEmpty(prev.extrDateRaw, row.extrDateRaw);
		const pDate = parseLabDate(extractEmbeddedDate(extrDateRaw) || extrDateRaw);
		let extrDateComputed: string | null = extrDateString(pDate);
		if (!extrDateComputed) {
			const fromPrev = prev.extrDate ?? '';
			const fromRow = row.extrDate ?? '';
			const merged = pickNonEmpty(fromPrev, fromRow).trim();
			extrDateComputed = merged === '' ? null : merged;
		}

		map.set(row.id, {
			id: row.id,
			taxon: pickNonEmpty(prev.taxon, row.taxon),
			locality: pickNonEmpty(prev.locality, row.locality),
			collector: pickNonEmpty(prev.collector, row.collector),
			extrLab: pickNonEmpty(prev.extrLab, row.extrLab),
			extrOperator: pickNonEmpty(prev.extrOperator, row.extrOperator),
			extrMethod: pickNonEmpty(prev.extrMethod, row.extrMethod),
			extrDateRaw,
			extrDate: extrDateComputed,
			itsStatus: pickNonEmpty(prev.itsStatus, row.itsStatus),
			itsGb: pickNonEmpty(prev.itsGb, row.itsGb),
			ssuStatus: pickNonEmpty(prev.ssuStatus, row.ssuStatus),
			ssuGb: pickNonEmpty(prev.ssuGb, row.ssuGb),
			lsuStatus: pickNonEmpty(prev.lsuStatus, row.lsuStatus),
			lsuGb: pickNonEmpty(prev.lsuGb, row.lsuGb),
			mcm7Status: pickNonEmpty(prev.mcm7Status, row.mcm7Status),
			mcm7Gb: pickNonEmpty(prev.mcm7Gb, row.mcm7Gb),
			notes: mergedNotes,
			_sources: mergedSources,
		});
	}

	return Array.from(map.values()).map((r) => {
		const sourceStr = formatSources(r._sources || []);
		const finalNotes = [r.notes, sourceStr].filter(Boolean).join('\n\n');
		const { _sources, ...rest } = r;
		if (rest.extrDate === '') rest.extrDate = null;
		return { ...rest, notes: finalNotes };
	});
}

export async function processExcelToDatabase(buffer: any) {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	const results = {
		specimensInserted: 0,
		pcrAttemptsCreated: 0,
		errors: 0,
		logs: [] as string[],
	};

	let allParsedRows: ParsedSpecimenRow[] = [];
	workbook.worksheets.forEach((sheet) => {
		const rows = parseSheetToRows(sheet, sheet.name);
		allParsedRows = allParsedRows.concat(rows);
	});

	const mergedRows = mergeById(allParsedRows);

	await prisma.$transaction(
		async (tx) => {
			for (const row of mergedRows) {
				try {
					const importNotesObj: Record<string, string> = {};

					if (row.notes) importNotesObj.generalNotes = row.notes;

					if (!row.extrDate && row.extrDateRaw) {
						importNotesObj.unparsedExtrDate = row.extrDateRaw;
					}

					if (row.itsStatus && row.itsStatus.length > 50)
						importNotesObj.itsRaw = row.itsStatus;
					if (row.ssuStatus && row.ssuStatus.length > 50)
						importNotesObj.ssuRaw = row.ssuStatus;
					if (row.lsuStatus && row.lsuStatus.length > 50)
						importNotesObj.lsuRaw = row.lsuStatus;
					if (row.mcm7Status && row.mcm7Status.length > 50)
						importNotesObj.mcm7Raw = row.mcm7Status;

					const importNotesJson =
						Object.keys(importNotesObj).length > 0
							? JSON.stringify(importNotesObj)
							: null;

					const specimen = await tx.specimen.upsert({
						where: { id: row.id },
						update: {
							taxon: row.taxon || undefined,
							locality: row.locality || undefined,
							collector: row.collector || undefined,
							extrLab: row.extrLab || undefined,
							extrOperator: row.extrOperator || undefined,
							extrMethod: row.extrMethod || undefined,
							extrDateRaw: row.extrDateRaw || undefined,
							extrDate: row.extrDate ? new Date(row.extrDate) : undefined,
							itsGb: row.itsGb || undefined,
							ssuGb: row.ssuGb || undefined,
							lsuGb: row.lsuGb || undefined,
							mcm7Gb: row.mcm7Gb || undefined,
							importNotes: importNotesJson,
							updatedAt: new Date(),
						},
						create: {
							id: row.id,
							taxon: row.taxon,
							locality: row.locality,
							collector: row.collector,
							extrLab: row.extrLab,
							extrOperator: row.extrOperator,
							extrMethod: row.extrMethod,
							extrDateRaw: row.extrDateRaw,
							extrDate: row.extrDate ? new Date(row.extrDate) : null,
							itsGb: row.itsGb,
							ssuGb: row.ssuGb,
							lsuGb: row.lsuGb,
							mcm7Gb: row.mcm7Gb,
							importOrigin: 'excel_legacy_parser',
							importNotes: importNotesJson,
						},
					});
					results.specimensInserted++;

					const markersToCheck = [
						{ name: 'ITS', status: row.itsStatus },
						{ name: 'SSU', status: row.ssuStatus },
						{ name: 'LSU', status: row.lsuStatus },
						{ name: 'MCM7', status: row.mcm7Status },
					];

					for (const marker of markersToCheck) {
						if (marker.status && marker.status.trim() !== '') {
							await tx.pcrAttempt.create({
								data: {
									specimenId: specimen.id,
									marker: marker.name,
									result: marker.status.substring(0, 50),
									resultNotes: marker.status.length > 50 ? marker.status : null,
									date: row.extrDate ? new Date(row.extrDate) : new Date(),
								},
							});
							results.pcrAttemptsCreated++;
						}
					}
				} catch (error) {
					results.errors++;
					results.logs.push(`Ошибка на ID [${row.id}]: ${(error as Error).message}`);
				}
			}
		},
		{
			maxWait: 10000,
			timeout: 30000,
		},
	);

	return results;
}
