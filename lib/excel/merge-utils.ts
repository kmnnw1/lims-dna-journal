import { extractEmbeddedDate, extrDateString, parseLabDate } from './cell-parsers';
import { normalizeParsedRow } from './normalize';
import { ParsedSpecimenRow, SourceRef } from './types';

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

	for (const rawRow of rows) {
		const row = normalizeParsedRow(rawRow);
		if (!row.id.trim()) continue;
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
			rpb2Status: pickNonEmpty(prev.rpb2Status, row.rpb2Status),
			rpb2Gb: pickNonEmpty(prev.rpb2Gb, row.rpb2Gb),
			mcm7Status: pickNonEmpty(prev.mcm7Status, row.mcm7Status),
			mcm7Gb: pickNonEmpty(prev.mcm7Gb, row.mcm7Gb),
			herbarium: pickNonEmpty(prev.herbarium, row.herbarium),
			collectionNumber: pickNonEmpty(prev.collectionNumber, row.collectionNumber),
			accessionNumber: pickNonEmpty(prev.accessionNumber, row.accessionNumber),
			labNo: pickNonEmpty(prev.labNo, row.labNo),
			connections: pickNonEmpty(prev.connections, row.connections),
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
