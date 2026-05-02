import ExcelJS from 'exceljs';
import { ColumnBinding } from './types';

// --- Умный парсинг сложных ячеек ---
export function cellText(v: unknown): string {
	if (v === undefined || v === null) return '';
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'number' && Number.isFinite(v)) return String(v);

	if (typeof v === 'object' && v !== null) {
		const obj = v as Record<string, unknown>;
		if (typeof obj.error === 'string') {
			return String(obj.error).trim();
		}
		if (Array.isArray(obj.richText)) {
			return obj.richText
				.map((t: unknown) => (t as Record<string, unknown>).text || '')
				.join('')
				.trim();
		}
		if (obj.text && obj.hyperlink) {
			return String(obj.text).trim();
		}
		if (obj.result !== undefined) {
			if (obj.result instanceof Date) return obj.result.toISOString().slice(0, 10);
			return String(obj.result).trim();
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

export function normalizeHeader(h: string): string {
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

export function parseLabDate(raw: string): Date | null {
	if (!raw) return null;
	const compact = extractEmbeddedDate(raw);
	const s = compact.toLowerCase().trim();

	if (/^\d{5,6}$/.test(s)) {
		const serial = Number(s);
		if (Number.isFinite(serial) && serial > 20000 && serial < 90000) {
			return new Date(Math.round((serial - 25569) * 86400 * 1000));
		}
	}

	const dotMatch = s.match(/(\d{1,2})[\./-](\d{1,2})[\./-](\d{2,4})/);
	if (dotMatch) {
		let year = parseInt(dotMatch[3], 10);
		if (year < 100) year += 2000;
		return new Date(Date.UTC(year, parseInt(dotMatch[2], 10) - 1, parseInt(dotMatch[1], 10)));
	}

	const ruMonths: Record<string, number> = {
		янв: 0,
		фев: 1,
		мар: 2,
		апр: 3,
		май: 4,
		мая: 4,
		июн: 5,
		июл: 6,
		авг: 7,
		сен: 8,
		окт: 9,
		ноя: 10,
		nov: 10,
		дек: 11,
		dec: 11,
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
			i: 0,
			ii: 1,
			iii: 2,
			iv: 3,
			v: 4,
			vi: 5,
			vii: 6,
			viii: 7,
			ix: 8,
			x: 9,
			xi: 10,
			xii: 11,
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

export function getByKey(row: unknown[], bindings: ColumnBinding[], baseKey: string): string {
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
			const noteObj: unknown = cell.note;
			let noteText = '';
			if (typeof noteObj === 'string') {
				noteText = noteObj;
			} else if (noteObj && typeof noteObj === 'object') {
				const obj = noteObj as Record<string, unknown>;
				if ('texts' in obj && Array.isArray(obj.texts)) {
					noteText = obj.texts
						.map((t: unknown) =>
							t && typeof t === 'object' && 'text' in t
								? String((t as Record<string, unknown>).text)
								: '',
						)
						.join('');
				}
			}
			if (noteText.trim()) texts.push(noteText.trim());
		}
	});
	return texts.join(' | ');
}

export function extrDateString(parsed: Date | null): string | null {
	if (!parsed || isNaN(parsed.getTime())) return null;
	return parsed.toISOString();
}
