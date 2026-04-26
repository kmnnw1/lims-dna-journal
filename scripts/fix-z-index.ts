import { promises as fs } from 'fs';
import { extname, join } from 'path';

/**
 * Скрипт для автоматического исправления нотации z-index в Tailwind 4.
 * Заменяет z-[150] на z-150, так как Tailwind 4 поддерживает произвольные числа напрямую.
 */

const TARGET_DIRS = ['components', 'app', 'hooks', 'lib'];
const PATTERN = /z-\[(\d+)\]/g;

async function walk(dir: string): Promise<string[]> {
	let files: string[] = [];
	const items = await fs.readdir(dir, { withFileTypes: true });
	for (const item of items) {
		if (item.isDirectory()) {
			files = [...files, ...(await walk(join(dir, item.name)))];
		} else if (['.tsx', '.ts', '.css'].includes(extname(item.name))) {
			files.push(join(dir, item.name));
		}
	}
	return files;
}

async function fixZIndex() {
	console.log('🚀 Запуск исправления z-index (Tailwind 4 Migration)...');
	let fixedCount = 0;
	let fileCount = 0;

	for (const dir of TARGET_DIRS) {
		const fullPath = join(process.cwd(), dir);
		try {
			await fs.access(fullPath);
			const files = await walk(fullPath);
			for (const file of files) {
				const content = await fs.readFile(file, 'utf-8');
				if (PATTERN.test(content)) {
					const newContent = content.replace(PATTERN, 'z-$1');
					await fs.writeFile(file, newContent, 'utf-8');
					console.log(`✅ Исправлено: ${file}`);
					fixedCount++;
				}
				fileCount++;
			}
		} catch {
			// Директория может не существовать
		}
	}

	console.log(`\n✨ Готово! Обработано файлов: ${fileCount}, Исправлено: ${fixedCount}`);
}

fixZIndex().catch(console.error);
