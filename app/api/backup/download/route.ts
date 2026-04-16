import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Защита: только для админов
        const session = await getServerSession(authOptions);
        const user = session?.user as { role?: string } | undefined;
        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
        }

        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ error: 'Файл базы данных не найден' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(dbPath);

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="lims_backup_${new Date().toISOString().split('T')[0]}.db"`,
                'Content-Type': 'application/vnd.sqlite3',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Ошибка экспорта БД:', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
