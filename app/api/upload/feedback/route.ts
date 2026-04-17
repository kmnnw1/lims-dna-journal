import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
// Мы не можем импортировать authOptions напрямую в Edge/Route Handler без потенциальных проблем с циклическими зависимостями,
// но попробуем импортировать из lib.
import { authOptions } from '@/lib/auth';
import { saveFeedbackToExcel } from '@/lib/excel-backup';

/**
 * API эндпоинт для загрузки скриншотов и логирования обратной связи.
 * Сохраняет файлы локально и дублирует данные в Excel для отказоустойчивости.
 */
export async function POST(request: Request) {
	try {
		const contentType = request.headers.get('content-type') || '';
		const session = await getServerSession(authOptions);
		const user = session?.user?.name || session?.user?.email || 'Anonymous';

		// Случай 1: Загрузка скриншота (Multipart)
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file') as File;
			const specimenId = (formData.get('specimenId') as string) || 'Unknown';

			if (!file) {
				return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
			}

			const bytes = await file.arrayBuffer();
			const buffer = Buffer.from(bytes);

			const extension = file.name.split('.').pop() || 'png';
			const fileName = `${uuidv4()}.${extension}`;
			const uploadDir = join(process.cwd(), 'public', 'uploads', 'alpha-feedback');

			await mkdir(uploadDir, { recursive: true });

			const filePath = join(uploadDir, fileName);
			await writeFile(filePath, buffer);

			const url = `/uploads/alpha-feedback/${fileName}`;

			// Автоматически бекапим факт загрузки в Excel
			await saveFeedbackToExcel({
				timestamp: new Date().toISOString(),
				specimenId,
				notes: `[Screenshot uploaded]`,
				photos: [url],
				user,
			});

			return NextResponse.json({ url });
		}

		// Случай 2: Логирование текста/заметок (JSON)
		const data = await request.json();
		const { specimenId, notes, photos } = data;

		if (!specimenId) {
			return NextResponse.json({ error: 'Specimen ID is required' }, { status: 400 });
		}

		await saveFeedbackToExcel({
			timestamp: new Date().toISOString(),
			specimenId,
			notes: notes || '',
			photos: photos || [],
			user,
		});

		return NextResponse.json({ success: true });
	} catch (e: unknown) {
		console.error('Error handling feedback:', e);
		return NextResponse.json({ error: 'Ошибка при обработке запроса' }, { status: 500 });
	}
}
