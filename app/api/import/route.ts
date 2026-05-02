import ExcelJS from 'exceljs';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/db/prisma/audit-log';
import { prisma } from '@/lib/db/prisma/prisma';
import {
	buildColumnBindings,
	cellText,
	extractRawDataFromSheet,
	findHeaderRowIndex,
	mergeById,
	type ColumnBinding,
	type ParsedSpecimenRow,
	parseSheetToRows,
	parseRowWithBindings,
} from '@/lib/excel';
import { parseWithAI } from '@/lib/excel/ai-parser';
import { validateContentType, validateFileSize } from '@/lib/security/input-validator';

function buildImportHints(rows: ParsedSpecimenRow[]) {
	const missingDates = rows.filter((row) => row.extrDateRaw && !row.extrDate).length;
	const notesWithExcelComments = rows.filter((row) =>
		row.notes.includes('Excel-комментарий:'),
	).length;
	const autoFixedRows = rows.filter((row) => row.notes.includes('[AUTO_FIX]')).length;
	const rowsWithExtraColumns = rows.filter((row) => row.notes.includes('__col_')).length;
	const problematicRows = rows
		.filter(
			(row) => (row.extrDateRaw && !row.extrDate) || row.notes.includes('Excel-комментарий:'),
		)
		.slice(0, 20)
		.map((row) => ({
			id: row.id,
			extrDateRaw: row.extrDateRaw || null,
			extrDate: row.extrDate,
			source: row._sources?.[0] || null,
		}));
	return {
		missingDates,
		notesWithExcelComments,
		autoFixedRows,
		rowsWithExtraColumns,
		problematicRows,
	};
}

export async function GET(req: Request) {
	try {
		const session = await requireRole('ADMIN');

		const { searchParams } = new URL(req.url);
		const useAI = searchParams.get('useAI') === 'true';

		const rawPath = process.env.DATA_XLSX_PATH || 'data/data.xlsx';
		const filePath = path.isAbsolute(rawPath)
			? rawPath
			: path.join(/*turbopackIgnore: true*/ process.cwd(), rawPath);

		if (!fs.existsSync(filePath)) {
			throw { statusCode: 404, message: `Файл импорта не найден: ${filePath}` };
		}

		// Базовая валидация расширения файла (MIME/Magic bytes были бы лучше, но для локального файла достаточно расширения)
		if (!filePath.toLowerCase().endsWith('.xlsx')) {
			throw { statusCode: 400, message: 'Допустимы только файлы .xlsx' };
		}

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(filePath);

		const dataToInsert: ParsedSpecimenRow[] = [];
		const sheetNames: string[] = [];
		let aiUsed = false;

		// Парсим каждый лист
		for (const sheet of workbook.worksheets) {
			sheetNames.push(sheet.name);

			// Попытка AI-парсинга если запрошено
			if (useAI) {
				const rawData = extractRawDataFromSheet(sheet);
				const headers = rawData[0]?.map((c) => cellText(c)) || [];
				const bodyRows = rawData.slice(1).map((r) => r.map((c) => cellText(c)));

				const aiResult = await parseWithAI(bodyRows, sheet.name, headers);
				if (aiResult && aiResult.length > 0) {
					dataToInsert.push(...aiResult);
					aiUsed = true;
					continue; // Переходим к следующему листу
				}
			}

			// Фоллбэк на стандартный regex-парсер
			const rows = parseSheetToRows(sheet, sheet.name);
			dataToInsert.push(...rows);
		}

		const uniqueData = mergeById(dataToInsert);
		const importHints = buildImportHints(uniqueData);

		const beforeCount = await prisma.specimen.count();

		// Используем транзакцию для атомарного импорта через upsert
		let inserted = 0;
		let updated = 0;

		await prisma.$transaction(async (tx) => {
			for (const row of uniqueData) {
				const { id, ...data } = row;
				const existing = await tx.specimen.findUnique({ where: { id } });

				await tx.specimen.upsert({
					where: { id },
					update: {
						...data,
						updatedAt: new Date(),
					},
					create: {
						id,
						...data,
					},
				});

				if (existing) {
					updated++;
				} else {
					inserted++;
				}
			}
		});

		const currentUser = session.user as ApiUser | undefined;
		await logAuditAction({
			userId: currentUser?.id || 'admin-system',
			action: 'IMPORT_SPECIMENS',
			resourceType: 'IMPORT',
			details: {
				count: inserted,
				sheets: sheetNames,
				aiUsed,
				previousCount: beforeCount,
				newCount: inserted,
			},
		});

		return NextResponse.json({
			success: true,
			message: `Импорт завершен. Новых: ${inserted}, обновлено: ${updated} (листов: ${sheetNames.length}).`,
			sheets: sheetNames,
			totalRows: inserted + updated,
			inserted,
			updated,
			previousCount: beforeCount,
			aiUsed,
			importHints,
		});
	} catch (e: unknown) {
		return handleError(e, req);
	}
}

export async function POST(req: Request) {
	try {
		await requireRole('ADMIN');

		const contentType = req.headers.get('content-type') || '';

		// Случай 1: Загрузка файла (Multipart)
		if (contentType.includes('multipart/form-data')) {
			const formData = await req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				throw { statusCode: 400, message: 'Файл не найден в запросе' };
			}

			// Валидация размера (10MB)
			if (!validateFileSize(file.size, 10)) {
				throw { statusCode: 413, message: 'Файл слишком большой (макс 10MB)' };
			}

			// Валидация расширения
			const extension = file.name.split('.').pop()?.toLowerCase();
			if (extension !== 'xlsx') {
				throw { statusCode: 400, message: 'Допустимы только файлы .xlsx' };
			}

			const analyzeOnly = new URL(req.url).searchParams.get('analyzeOnly') === 'true';

			const bytes = await file.arrayBuffer();
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.load(bytes);

			if (analyzeOnly) {
				const firstSheet = workbook.worksheets[0];
				const rawData = extractRawDataFromSheet(firstSheet);
				const headerIdx = findHeaderRowIndex(rawData);
				if (headerIdx === -1) {
					throw { statusCode: 400, message: 'Заголовок "isolate" не найден в файле' };
				}
				const rawHeaders = rawData[headerIdx] as string[];
				const sampleRows = rawData.slice(headerIdx + 1, headerIdx + 6);
				const suggestedMapping = buildColumnBindings(rawHeaders).reduce(
					(acc, b) => {
						acc[b.rawHeader] = b.key;
						return acc;
					},
					{} as Record<string, string>,
				);

				return NextResponse.json({
					success: true,
					headers: rawHeaders,
					sampleRows,
					suggestedMapping,
				});
			}

			// Final Import logic
			const customMappingJson = formData.get('mapping') as string;
			const customMapping = customMappingJson ? JSON.parse(customMappingJson) : null;

			const dataToInsert: ParsedSpecimenRow[] = [];
			for (const sheet of workbook.worksheets) {
				if (customMapping) {
					// Use custom mapping for all sheets if provided
					const rawData = extractRawDataFromSheet(sheet);
					const headerIdx = findHeaderRowIndex(rawData);
					if (headerIdx !== -1) {
						const rawHeaders = rawData[headerIdx] as string[];
						// Convert custom mapping object back to bindings
						const bindings: ColumnBinding[] = rawHeaders
							.map((h, i) => {
								const key = customMapping[h];
								if (!key) return null;
								return { index: i, rawHeader: h, key };
							})
							.filter(Boolean) as ColumnBinding[];

						for (let i = headerIdx + 1; i < rawData.length; i++) {
							const parsed = parseRowWithBindings(rawData[i], bindings, sheet, i, sheet.name);
							if (parsed) dataToInsert.push(parsed);
						}
					}
				} else {
					const rows = parseSheetToRows(sheet, sheet.name);
					dataToInsert.push(...rows);
				}
			}

			const uniqueData = mergeById(dataToInsert);
			const importHints = buildImportHints(uniqueData);
			const beforeCount = await prisma.specimen.count();

			let inserted = 0;
			let updated = 0;

			await prisma.$transaction(async (tx) => {
				for (const row of uniqueData) {
					const { id, ...data } = row;
					const existing = await tx.specimen.findUnique({ where: { id } });
					await tx.specimen.upsert({
						where: { id },
						update: {
							taxon: data.taxon || null,
							locality: data.locality || null,
							collector: data.collector || null,
							extrLab: data.extrLab || null,
							extrOperator: data.extrOperator || null,
							extrMethod: data.extrMethod || null,
							extrDate: data.extrDate || null,
							herbarium: data.herbarium || null,
							collectionNumber: data.collectionNumber || null,
							accessionNumber: data.accessionNumber || null,
							labNo: data.labNo || null,
							connections: data.connections || null,
							updatedAt: new Date(),
						},
						create: {
							id,
							taxon: data.taxon || null,
							locality: data.locality || null,
							collector: data.collector || null,
							extrLab: data.extrLab || null,
							extrOperator: data.extrOperator || null,
							extrMethod: data.extrMethod || null,
							extrDate: data.extrDate || null,
							herbarium: data.herbarium || null,
							collectionNumber: data.collectionNumber || null,
							accessionNumber: data.accessionNumber || null,
							labNo: data.labNo || null,
							connections: data.connections || null,
						},
					});
					if (existing) updated++;
					else inserted++;

					// Also create/update PCR attempts for all markers
					const markers = [
						{ status: row.itsStatus, gb: row.itsGb, type: 'ITS' },
						{ status: row.ssuStatus, gb: row.ssuGb, type: 'SSU' },
						{ status: row.lsuStatus, gb: row.lsuGb, type: 'LSU' },
						{ status: row.rpb2Status, gb: row.rpb2Gb, type: 'RPB2' },
						{ status: row.mcm7Status, gb: row.mcm7Gb, type: 'MCM7' },
					];

					for (const marker of markers) {
						if (marker.status || marker.gb) {
							// For simplicity in this route, we just create.
							// In a real production app, we'd check for existing attempts to avoid duplicates.
							await tx.pCRAttempt.create({
								data: {
									specimenId: id,
									marker: marker.type,
									result: marker.status || 'Unknown',
									resultNotes: marker.gb ? `GenBank: ${marker.gb}` : null,
								},
							});
						}
					}
				}
			});

			await logAuditAction({
				userId: 'admin-system',
				action: 'IMPORT_SPECIMENS',
				resourceType: 'IMPORT',
				details: { source: 'upload', count: inserted + updated, filename: file.name },
			});

			return NextResponse.json({
				success: true,
				message: `Загрузка завершена. Новых: ${inserted}, обновлено: ${updated}.`,
				inserted,
				updated,
				previousCount: beforeCount,
				importHints,
			});
		}

		// Случай 2: JSON команды (очистка)
		if (validateContentType(contentType)) {
			const body = await req.json().catch(() => ({}));
			if (body.action === 'clear') {
				const beforeCount = await prisma.specimen.count();
				const result = await prisma.specimen.deleteMany({});

				await logAuditAction({
					userId: 'admin-system',
					action: 'UPDATE_SPECIMEN',
					resourceType: 'SPECIMEN',
					resourceId: 'ALL',
					details: { action: 'CLEAR_DATABASE', deletedCount: result.count },
				});

				return NextResponse.json({
					success: true,
					deleted: result.count,
					previousCount: beforeCount,
					message: `Удалено записей: ${result.count}`,
				});
			}
		}

		throw { statusCode: 400, message: 'Неподдерживаемый тип запроса или действие' };
	} catch (e: unknown) {
		return handleError(e, req);
	}
}
