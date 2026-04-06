import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Папки и форматы, которые нам не нужны для архитектурного анализа
const IGNORE_DIRS = new Set([
	'node_modules',
	'.git',
	'.next',
	'out',
	'build',
	'dist',
	'.vercel',
	'lab-data',
	'local',
]);
const IGNORE_EXTS = new Set([
	'.db',
	'.db-journal',
	'.png',
	'.jpg',
	'.jpeg',
	'.svg',
	'.ico',
	'.wav',
	'.xlsx',
	'.csv',
	'.pem',
	'.key',
]);

function walkDir(dir, fileList = [], relativePath = '') {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const absolutePath = path.join(dir, file);
		const relPath = path.join(relativePath, file);
		const stat = fs.statSync(absolutePath);

		if (stat.isDirectory()) {
			if (!IGNORE_DIRS.has(file)) {
				walkDir(absolutePath, fileList, relPath);
			}
		} else {
			const ext = path.extname(file).toLowerCase();
			if (!IGNORE_EXTS.has(ext) && file !== 'project-structure.txt') {
				// Заменяем обратные слеши Windows на прямые для удобства чтения
				fileList.push(relPath.replace(/\\/g, '/'));
			}
		}
	}
	return fileList;
}

try {
	const files = walkDir(rootDir);
	const outputPath = path.join(rootDir, 'project-structure.txt');

	fs.writeFileSync(outputPath, files.join('\n'));
	console.log(`\n✅ Рентген проекта завершен! Найдено файлов: ${files.length}`);
	console.log(`Результат сохранен в файл: project-structure.txt`);
} catch (error) {
	console.error('❌ Ошибка при сканировании:', error);
}
