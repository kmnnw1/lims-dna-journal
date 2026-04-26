import { promises as fs } from 'fs';
import { extname, join } from 'path';
import sharp from 'sharp';

/**
 * Скрипт для автоматической оптимизации изображений в public/.
 * Сжимает PNG/JPG и создает WebP версии для улучшения производительности.
 */

const PUBLIC_DIR = join(process.cwd(), 'public');
const SUPPORTED_EXTS = ['.png', '.jpg', '.jpeg'];
const TARGET_WIDTH = 1920; // Максимальная ширина для больших изображений

async function optimizeImages() {
	console.log('🖼️  Запуск оптимизации изображений...');
	let processed = 0;

	try {
		const files = await fs.readdir(PUBLIC_DIR);

		for (const file of files) {
			const ext = extname(file).toLowerCase();
			if (SUPPORTED_EXTS.includes(ext)) {
				const inputPath = join(PUBLIC_DIR, file);
				const outWebp = inputPath.replace(ext, '.webp');

				// Пропускаем, если WebP уже есть и он новее оригинала
				try {
					const statIn = await fs.stat(inputPath);
					const statOut = await fs.stat(outWebp);
					if (statOut.mtime > statIn.mtime) continue;
				} catch {
					// WebP еще не существует
				}

				console.log(`⚡ Обработка: ${file} -> WebP`);

				const image = sharp(inputPath);
				const metadata = await image.metadata();

				let pipeline = image;
				if (metadata.width && metadata.width > TARGET_WIDTH) {
					pipeline = pipeline.resize(TARGET_WIDTH);
				}

				await pipeline.webp({ quality: 80, effort: 6 }).toFile(outWebp);

				processed++;
			}
		}
	} catch (e) {
		console.error('❌ Ошибка оптимизации:', e);
	}

	console.log(`✨ Готово! Оптимизировано изображений: ${processed}`);
}

optimizeImages();
