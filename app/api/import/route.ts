import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { mergeById, parseSheetToRows, type ParsedSpecimenRow } from '@/lib/import-excel';

/** Импорт из data.xlsx (все листы) — только ADMIN. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const rawPath = process.env.DATA_XLSX_PATH || 'data.xlsx';
    const filePath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Файл импорта не найден: ${filePath}` },
        { status: 400 }
      );
    }
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    const dataToInsert: ParsedSpecimenRow[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = parseSheetToRows(sheet, sheetName);
      dataToInsert.push(...rows);
    }

    const uniqueData = mergeById(dataToInsert);

    await prisma.specimen.deleteMany({});

    const chunkSize = 500;
    for (let i = 0; i < uniqueData.length; i += chunkSize) {
      const chunk = uniqueData.slice(i, i + chunkSize);
      await prisma.specimen.createMany({ data: chunk });
    }

    return NextResponse.json({
      success: true,
      message: `Загружено ${uniqueData.length} проб (листов: ${workbook.SheetNames.length}).`,
      sheets: workbook.SheetNames.length,
      rows: uniqueData.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Очистить таблицу проб без импорта — только ADMIN. */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.action !== 'clear') {
      return NextResponse.json({ error: 'Укажите JSON: { "action": "clear" }' }, { status: 400 });
    }

    const result = await prisma.specimen.deleteMany({});
    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Удалено записей: ${result.count}`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
