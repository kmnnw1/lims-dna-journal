import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * API эндпоинт для загрузки скриншотов обратной связи.
 * Сохраняет файлы локально в public/uploads/alpha-feedback.
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Генерируем уникальное имя файла
        const extension = file.name.split('.').pop() || 'png';
        const fileName = `${uuidv4()}.${extension}`;
        
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'alpha-feedback');
        
        // На всякий случай проверяем наличие папки
        await mkdir(uploadDir, { recursive: true });
        
        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        const url = `/uploads/alpha-feedback/${fileName}`;

        return NextResponse.json({ url });
    } catch (e: unknown) {
        console.error('Error uploading feedback screenshot:', e);
        return NextResponse.json({ error: 'Ошибка при загрузке файла' }, { status: 500 });
    }
}
