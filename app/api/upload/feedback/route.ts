import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { saveFeedbackToExcel } from '@/lib/excel-backup';
import {
	sanitizeString,
	validateContentType,
	validateFileSize,
} from '@/lib/security/input-validator';

/**
 * API эндпоинт для загрузки скриншотов и логирования обратной связи.
 * Сохраняет файлы локально и дублирует данные в Excel для отказоустойчивости.
 */
export async function POST(request: Request) {
	try {
		const session = await requireRole('ANY');
		const user = (session.user as ApiUser).id || 'Anonymous';
		const contentType = request.headers.get('content-type') || '';

		// Случай 1: Загрузка скриншота (Multipart)
		if (contentType.includes('multipart/form-data')) {
			const formData = await request.formData();
			const file = formData.get('file') as File;
			const specimenId = sanitizeString(formData.get('specimenId'), 50) || 'Unknown';

			if (!file) {
				throw { statusCode: 400, message: 'Файл не найден' };
			}

			if (!validateFileSize(file.size, 5)) {
				throw { statusCode: 413, message: 'Файл слишком большой (макс 5MB)' };
			}

			const bytes = await file.arrayBuffer();
			const buffer = Buffer.from(bytes);

			const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
			if (!['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
				throw { statusCode: 400, message: 'Неподдерживаемый тип файла' };
			}

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
				notes: '[Screenshot uploaded]',
				photos: [url],
				user,
			});

			return NextResponse.json({ url });
		}

		// Случай 2: Логирование текста/заметок (JSON)
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const data = await request.json();
		const specimenId = sanitizeString(data.specimenId, 50);
		const notes = sanitizeString(data.notes, 1000);
		const photos = Array.isArray(data.photos)
			? data.photos.map((p: unknown) => sanitizeString(p, 200))
			: [];

		if (!specimenId) {
			throw { statusCode: 400, message: 'Specimen ID is required' };
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
		return handleError(e, request);
	}
}
