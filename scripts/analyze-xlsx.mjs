import ExcelJS from 'exceljs';
import path from 'path';

async function analyze() {
	const workbook = new ExcelJS.Workbook();
	const filePath = path.join(process.cwd(), 'data', 'data.xlsx');

	console.log(`Loading ${filePath}...`);
	await workbook.xlsx.readFile(filePath);

	workbook.eachSheet((sheet, id) => {
		console.log(`\n=== Sheet: ${sheet.name} (Rows: ${sheet.rowCount}) ===`);

		let headerRow = null;
		for (let i = 1; i <= Math.min(sheet.rowCount, 10); i++) {
			const row = sheet.getRow(i).values;
			if (row && row.length > 1) {
				const vals = row.filter(Boolean);
				if (
					vals.some(
						(v) =>
							typeof v === 'string' &&
							(v.toLowerCase().includes('id') ||
								v.toLowerCase().includes('вид') ||
								v.toLowerCase().includes('taxon')),
					)
				) {
					headerRow = i;
					console.log(`[Header Row ${i}]`, row.slice(1));
					break;
				}
			}
		}

		if (headerRow && sheet.rowCount > headerRow) {
			console.log(
				`[Sample Row ${headerRow + 1}]`,
				sheet.getRow(headerRow + 1).values.slice(1),
			);
			console.log(
				`[Sample Row ${headerRow + 2}]`,
				Math.min(sheet.rowCount, headerRow + 2) > headerRow
					? sheet.getRow(headerRow + 2).values.slice(1)
					: '<empty>',
			);
		}
	});
}

analyze().catch(console.error);
