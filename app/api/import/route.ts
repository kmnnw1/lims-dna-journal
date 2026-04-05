import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {mergeById, parseSheetToRows, type ParsedSpecimenRow} from '@/lib/import-excel';

/**
 * Проверка, что пользователь — админ, иначе выбрасывает 403.
 * Используйте для безопасности в каждом API-обработчике!
 */
async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session || (session.user as {role?: string}).role !== 'ADMIN') {
		throw {code: 403, message: 'Доступ запрещён (требуются права ADMIN)'};
	}
}

/**
 * Импортирует данные проб из указанного XLSX-файла (по умолчанию data.xlsx).
 * Перезаписывает всю таблицу specimen! Возвращает краткую статистику.
 * Только для ADMIN.
 */
export async function GET() {
	try {
		await requireAdmin();

		const rawPath = process.env.DATA_XLSX_PATH || 'data.xlsx';
		const filePath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);

		if (!fs.existsSync(filePath)) {
			return NextResponse.json({error: `Файл импорта не найден: ${filePath}`}, {status: 400});
		}

		// Чтение файла через ExcelJS
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.readFile(filePath);

		const dataToInsert: ParsedSpecimenRow[] = [];
		const sheetNames: string[] = [];

		// Парсим каждый лист
		workbook.eachSheet((sheet) => {
			sheetNames.push(sheet.name);
			const rows = parseSheetToRows(sheet, sheet.name);
			dataToInsert.push(...rows);
		});

		const uniqueData = mergeById(dataToInsert);

		// Считаем до и после, чтобы вернуть точную статистику
		const beforeCount = await prisma.specimen.count();

		// Очищаем таблицу (hard reset)
		await prisma.specimen.deleteMany({});

		// Импортируем пачками — защищаемся от лимитов PostgreSQL/SQLite
		const chunkSize = 500;
		let inserted = 0;
		for (let i = 0; i < uniqueData.length; i += chunkSize) {
			const chunk = uniqueData.slice(i, i + chunkSize);
			const result = await prisma.specimen.createMany({data: chunk});
			inserted += result.count ?? chunk.length;
		}

		// Итоговый ответ с подробной статистикой импорта
		return NextResponse.json({
			success: true,
			message: `Импортировано ${inserted} проб (листов: ${sheetNames.length}).`,
			sheets: sheetNames,
			totalRows: inserted,
			previousCount: beforeCount,
		});
	} catch (e: any) {
		const status = e?.code === 403 ? 403 : 500;
		const msg = e?.message || (e instanceof Error ? e.message : String(e));
		return NextResponse.json({error: msg}, {status});
	}
}

/**
 * Очищает таблицу specimen по подтверждённому запросу.
 * Не требует загрузки файла. Только для ADMIN.
 */
export async function POST(request: Request) {
	try {
		await requireAdmin();
		const body = await request.json().catch(() => ({}));
		if (body.action !== 'clear') {
			return NextResponse.json({error: 'Укажите JSON: { "action": "clear" }'}, {status: 400});
		}
		const beforeCount = await prisma.specimen.count();
		const result = await prisma.specimen.deleteMany({});
		return NextResponse.json({
			success: true,
			deleted: result.count,
			previousCount: beforeCount,
			message: `Удалено записей: ${result.count}`,
		});
	} catch (e: any) {
		const status = e?.code === 403 ? 403 : 500;
		const msg = e?.message || (e instanceof Error ? e.message : String(e));
		return NextResponse.json({error: msg}, {status});
	}
}
