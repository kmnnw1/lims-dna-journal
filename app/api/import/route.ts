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
import { validateContentType } from '@/lib/security/input-validator';

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
			return NextResponse.json(
				{ error: `Файл импорта не найден: ${filePath}` },
				{ status: 400 },
			);
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
		await prisma.specimen.deleteMany({});

		// Импортируем пачками
		const chunkSize = 500;
		let inserted = 0;
		for (let i = 0; i < uniqueData.length; i += chunkSize) {
			const chunk = uniqueData.slice(i, i + chunkSize);
			const result = await prisma.specimen.createMany({ data: chunk });
			inserted += result.count ?? chunk.length;
		}

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
				newCount: beforeCount + inserted,
			},
		});

		return NextResponse.json({
			success: true,
			message: `Импортировано ${inserted} проб (листов: ${sheetNames.length}).`,
			sheets: sheetNames,
			totalRows: inserted,
			previousCount: beforeCount,
			aiUsed,
		});
	} catch (e: unknown) {
		return handleError(e);
	}
}

/**
 * Очищает таблицу specimen по подтверждённому запросу.
 */
export async function POST(request: Request) {
	try {
		await requireRole('ADMIN');

		const contentType = request.headers.get('content-type');
		if (!validateContentType(contentType)) {
			return NextResponse.json(
				{ error: 'Content-Type должен быть application/json' },
				{ status: 415 },
			);
		}

		const body = await request.json().catch(() => ({}));
		if (body.action !== 'clear') {
			return NextResponse.json(
				{ error: 'Укажите JSON: { "action": "clear" }' },
				{ status: 400 },
			);
		}
		const beforeCount = await prisma.specimen.count();
		const result = await prisma.specimen.deleteMany({});
		return NextResponse.json({
			success: true,
			deleted: result.count,
			previousCount: beforeCount,
			message: `Удалено записей: ${result.count}`,
		});
	} catch (e: unknown) {
		return handleError(e);
	}
}
