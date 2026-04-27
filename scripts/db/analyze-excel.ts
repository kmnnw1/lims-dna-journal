/**
 * Excel Data Analyzer — глубокий анализ data.xlsx
 * Исследует ВСЕ листы, ВСЕ колонки, ВСЕ строки
 * Цель: понять структуру данных для построения идеальной БД
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ExcelJS from 'exceljs';

const DATA_PATH = join(process.cwd(), 'data', 'data.xlsx');
const OUTPUT_PATH = join(process.cwd(), 'data', 'analysis-report.json');
const OUTPUT_MD = join(process.cwd(), 'data', 'analysis-report.md');

interface ColumnAnalysis {
	index: number;
	header: string | null;
	/** Количество непустых ячеек */
	nonEmpty: number;
	/** Количество пустых */
	empty: number;
	/** Все уникальные значения (до 100 примеров) */
	uniqueSamples: string[];
	/** Общее кол-во уникальных */
	uniqueCount: number;
	/** Типы данных встреченные */
	dataTypes: Record<string, number>;
	/** Минимальная длина строки */
	minLength: number;
	/** Максимальная длина строки */
	maxLength: number;
	/** Примеры первых 5 значений */
	firstValues: string[];
	/** Есть ли слипшиеся ячейки (merged cells) */
	hasMerges: boolean;
}

interface SheetAnalysis {
	name: string;
	rowCount: number;
	columnCount: number;
	/** Номера строк с данными (первая и последняя) */
	dataRange: { firstRow: number; lastRow: number };
	columns: ColumnAnalysis[];
	/** Merge-зоны */
	merges: string[];
	/** Первые 3 строки целиком (для понимания структуры) */
	headerRows: string[][];
	/** Паттерн: есть ли у листа заголовки? */
	hasHeaders: boolean;
	/** Количество полностью пустых строк */
	emptyRows: number;
}

function cellToString(cell: ExcelJS.Cell): string {
	if (cell.value === null || cell.value === undefined) return '';
	if (typeof cell.value === 'object') {
		// Rich text
		if ('richText' in cell.value) {
			return (cell.value as ExcelJS.CellRichTextValue).richText.map((rt) => rt.text).join('');
		}
		// Formula result
		if ('result' in cell.value) {
			const result = (cell.value as ExcelJS.CellFormulaValue).result;
			return result?.toString() ?? '';
		}
		// Date
		if (cell.value instanceof Date) {
			return cell.value.toISOString().split('T')[0];
		}
		// Hyperlink
		if ('hyperlink' in cell.value) {
			return (cell.value as ExcelJS.CellHyperlinkValue).text?.toString() ?? '';
		}
		return JSON.stringify(cell.value);
	}
	return cell.value.toString();
}

function detectDataType(cell: ExcelJS.Cell): string {
	if (cell.value === null || cell.value === undefined) return 'empty';
	if (typeof cell.value === 'number') return 'number';
	if (typeof cell.value === 'boolean') return 'boolean';
	if (cell.value instanceof Date) return 'date';
	if (typeof cell.value === 'object') {
		if ('richText' in cell.value) return 'richText';
		if ('formula' in cell.value) return 'formula';
		if ('hyperlink' in cell.value) return 'hyperlink';
		return 'object';
	}
	const s = cell.value.toString();
	if (/^\d{4}-\d{2}-\d{2}/.test(s)) return 'dateString';
	if (/^\d+\.?\d*$/.test(s)) return 'numericString';
	return 'string';
}

async function analyze() {
	console.log('📊 Загружаю data.xlsx...');
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.readFile(DATA_PATH);

	console.log(`📋 Найдено листов: ${workbook.worksheets.length}`);

	const report: SheetAnalysis[] = [];

	for (const sheet of workbook.worksheets) {
		console.log(
			`\n🔍 Анализирую лист: "${sheet.name}" (${sheet.rowCount} строк, ${sheet.columnCount} колонок)`,
		);

		const merges = Object.keys(sheet.model.merges ?? {});

		// Колонки
		const colAnalyses: ColumnAnalysis[] = [];
		for (let colIdx = 1; colIdx <= sheet.columnCount; colIdx++) {
			const uniqueValues = new Set<string>();
			let nonEmpty = 0;
			let empty = 0;
			let minLen = Infinity;
			let maxLen = 0;
			const dataTypes: Record<string, number> = {};
			const firstValues: string[] = [];

			sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
				const cell = row.getCell(colIdx);
				const val = cellToString(cell);
				const dtype = detectDataType(cell);

				dataTypes[dtype] = (dataTypes[dtype] || 0) + 1;

				if (val) {
					nonEmpty++;
					uniqueValues.add(val);
					minLen = Math.min(minLen, val.length);
					maxLen = Math.max(maxLen, val.length);
					if (firstValues.length < 5) firstValues.push(val);
				} else {
					empty++;
				}
			});

			// Header: первая строка
			const headerCell = sheet.getRow(1).getCell(colIdx);
			const header = cellToString(headerCell) || null;

			const uniqueArr = Array.from(uniqueValues);

			colAnalyses.push({
				index: colIdx,
				header,
				nonEmpty,
				empty,
				uniqueSamples: uniqueArr.slice(0, 100),
				uniqueCount: uniqueArr.length,
				dataTypes,
				minLength: minLen === Infinity ? 0 : minLen,
				maxLength: maxLen,
				firstValues,
				hasMerges: merges.some((m) => {
					const match = m.match(/([A-Z]+)\d+:([A-Z]+)\d+/);
					if (!match) return false;
					const colLetter = String.fromCharCode(64 + colIdx);
					return match[1] <= colLetter && colLetter <= match[2];
				}),
			});
		}

		// Header rows (первые 3)
		const headerRows: string[][] = [];
		for (let r = 1; r <= Math.min(3, sheet.rowCount); r++) {
			const row = sheet.getRow(r);
			const cells: string[] = [];
			for (let c = 1; c <= sheet.columnCount; c++) {
				cells.push(cellToString(row.getCell(c)));
			}
			headerRows.push(cells);
		}

		// Empty rows count
		let emptyRowCount = 0;
		sheet.eachRow({ includeEmpty: true }, (row) => {
			let allEmpty = true;
			for (let c = 1; c <= sheet.columnCount; c++) {
				if (cellToString(row.getCell(c))) {
					allEmpty = false;
					break;
				}
			}
			if (allEmpty) emptyRowCount++;
		});

		// Detect firstRow / lastRow with data
		let firstDataRow = 1;
		let lastDataRow = 1;
		sheet.eachRow((row, rowNumber) => {
			if (rowNumber < firstDataRow || firstDataRow === 1) firstDataRow = rowNumber;
			lastDataRow = rowNumber;
		});

		// Has headers heuristic: first row has mostly strings
		const firstRowTypes = colAnalyses.map((c) => c.firstValues[0] || '');
		const hasHeaders =
			firstRowTypes.filter((v) => v && !/^\d+\.?\d*$/.test(v)).length >
			firstRowTypes.length / 2;

		report.push({
			name: sheet.name,
			rowCount: sheet.rowCount,
			columnCount: sheet.columnCount,
			dataRange: { firstRow: firstDataRow, lastRow: lastDataRow },
			columns: colAnalyses,
			merges,
			headerRows,
			hasHeaders,
			emptyRows: emptyRowCount,
		});

		console.log(
			`  ✅ ${sheet.rowCount} строк, ${sheet.columnCount} колонок, ${merges.length} merge-зон, ${emptyRowCount} пустых строк`,
		);
	}

	// Сохраняем JSON
	writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
	console.log(`\n💾 JSON-отчёт: ${OUTPUT_PATH}`);

	// Генерируем MD-отчёт
	let md = '# Анализ data.xlsx\n\n';
	md += `**Дата анализа**: ${new Date().toISOString()}\n`;
	md += `**Размер файла**: ${(1295519 / 1024).toFixed(0)} KB\n`;
	md += `**Листов**: ${report.length}\n\n`;

	for (const sheet of report) {
		md += `---\n## Лист: "${sheet.name}"\n\n`;
		md += `- **Строк**: ${sheet.rowCount} (из них пустых: ${sheet.emptyRows})\n`;
		md += `- **Колонок**: ${sheet.columnCount}\n`;
		md += `- **Merge-зон**: ${sheet.merges.length}\n`;
		md += `- **Заголовки**: ${sheet.hasHeaders ? 'Да' : 'Нет'}\n\n`;

		if (sheet.rowCount <= 1) {
			md += `> Лист пуст или содержит только заголовок.\n\n`;
			continue;
		}

		md += `### Колонки\n\n`;
		md += `| # | Заголовок | Непустых | Уникальных | Типы данных | Примеры (первые 3) |\n`;
		md += `|---|---|---|---|---|---|\n`;

		for (const col of sheet.columns) {
			if (col.nonEmpty === 0) continue; // Пропускаем полностью пустые
			const types = Object.entries(col.dataTypes)
				.filter(([k]) => k !== 'empty')
				.map(([k, v]) => `${k}(${v})`)
				.join(', ');
			const samples = col.firstValues
				.slice(0, 3)
				.map((s) => (s.length > 40 ? s.slice(0, 37) + '...' : s))
				.join(' / ');
			md += `| ${col.index} | ${col.header ?? '—'} | ${col.nonEmpty} | ${col.uniqueCount} | ${types} | ${samples} |\n`;
		}

		md += `\n### Первые 3 строки\n\n`;
		md += '```\n';
		for (const row of sheet.headerRows) {
			md +=
				row.map((c) => (c.length > 25 ? c.slice(0, 22) + '...' : c || '∅')).join(' | ') +
				'\n';
		}
		md += '```\n\n';

		if (sheet.merges.length > 0) {
			md += `### Merge-зоны (первые 20)\n\n`;
			md += sheet.merges
				.slice(0, 20)
				.map((m) => `- \`${m}\``)
				.join('\n');
			md += '\n\n';
		}
	}

	writeFileSync(OUTPUT_MD, md, 'utf-8');
	console.log(`📝 Markdown-отчёт: ${OUTPUT_MD}`);
	console.log('\n✨ Анализ завершён.');
}

analyze().catch(console.error);
