import ExcelJS from 'exceljs';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { logAuditAction } from '@/lib/database/audit-log';
import { prisma } from '@/lib/database/prisma';
import {
	cellText,
	extractRawDataFromSheet,
	mergeById,
	type ParsedSpecimenRow,
	parseSheetToRows,
} from '@/lib/excel';
import { parseWithAI } from '@/lib/excel/ai-parser';
import { validateContentType, validateFileSize } from '@/lib/security/input-validator';

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

			const bytes = await file.arrayBuffer();
			const workbook = new ExcelJS.Workbook();
			await workbook.xlsx.load(bytes);

			const dataToInsert: ParsedSpecimenRow[] = [];
			for (const sheet of workbook.worksheets) {
				const rows = parseSheetToRows(sheet, sheet.name);
				dataToInsert.push(...rows);
			}

			const uniqueData = mergeById(dataToInsert);
			const beforeCount = await prisma.specimen.count();

			let inserted = 0;
			let updated = 0;

			await prisma.$transaction(async (tx) => {
				for (const row of uniqueData) {
					const { id, ...data } = row;
					const existing = await tx.specimen.findUnique({ where: { id } });
					await tx.specimen.upsert({
						where: { id },
						update: { ...data, updatedAt: new Date() },
						create: { id, ...data },
					});
					if (existing) updated++;
					else inserted++;
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
				message: `Загрузка завершена. Новых: ${inserted}, обновлено: ${updated}`,
				inserted,
				updated,
				previousCount: beforeCount,
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
