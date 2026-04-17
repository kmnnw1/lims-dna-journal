import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prisma';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
	mergeById,
	parseSheetToRows,
	extractRawDataFromSheet,
	cellText,
	type ParsedSpecimenRow,
} from '@/lib/excel';
import { logAuditAction } from '@/lib/database/audit-log';
import { parseWithAI } from '@/lib/excel/ai-parser';

async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
		throw { code: 403, message: 'Доступ запрещён (требуются права ADMIN)' };
	}
}

/**
 * Импортирует данные проб из XLSX-файла.
 * ?useAI=true — использует Gemini для умного парсинга.
 * Фоллбэк на regex-парсер если AI недоступен.
 */
export async function GET(req: Request) {
	try {
		await requireAdmin();
		const session = await getServerSession(authOptions);

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

		let dataToInsert: ParsedSpecimenRow[] = [];
		const sheetNames: string[] = [];
		let aiUsed = false;

		// Парсим каждый лист
		for (const sheet of workbook.worksheets) {
			sheetNames.push(sheet.name);

			// Попытка AI-парсинга если запрошено
			if (useAI) {
				const rawData = extractRawDataFromSheet(sheet);
				const headers = rawData[0]?.map((c) => cellText(c)) || [];
				const bodyRows = rawData.slice(1).map((r) =>
					r.map((c) => cellText(c)),
				);

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

		const currentUser = session?.user as { id?: string } | undefined;
		await logAuditAction({
			userId: currentUser?.id || 'admin-system',
			action: 'IMPORT_SPECIMENS',
			resourceType: 'IMPORT',
			details: { 
				count: inserted, 
				sheets: sheetNames, 
				aiUsed, 
				previousCount: beforeCount,
				newCount: beforeCount + inserted
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
		const err = e as { code?: number; message?: string };
		const status = err?.code === 403 ? 403 : 500;
		const msg = err?.message || (e instanceof Error ? e.message : String(e));
		return NextResponse.json({ error: msg }, { status });
	}
}

/**
 * Очищает таблицу specimen по подтверждённому запросу.
 */
export async function POST(request: Request) {
	try {
		await requireAdmin();
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
		const err = e as { code?: number; message?: string };
		const status = err?.code === 403 ? 403 : 500;
		const msg = err?.message || (e instanceof Error ? e.message : String(e));
		return NextResponse.json({ error: msg }, { status });
	}
}
