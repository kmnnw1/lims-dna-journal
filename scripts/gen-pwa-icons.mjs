/**
 * Генерирует PNG-иконки из public/icon.svg для PWA манифеста и Apple Touch Icon.
 * Запуск: node scripts/gen-pwa-icons.mjs
 * Требует: sharp, Node.js ≥14
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconPath = join(root, 'public', 'icon.svg');

const sizes = [
	{ size: 192, name: 'icon-192.png', purpose: 'PWA' },
	{ size: 512, name: 'icon-512.png', purpose: 'PWA' },
	{ size: 180, name: 'apple-touch-icon.png', purpose: 'Apple Touch' },
];

async function main() {
	// Проверим наличие исходного SVG и перезапишем иконки, если он есть
	try {
		await fs.access(iconPath);
	} catch {
		console.error(`❌ Не найден файл: ${iconPath}`);
		process.exit(1);
	}

	const svgData = await fs.readFile(iconPath);

	let okCount = 0;
	for (const { size, name, purpose } of sizes) {
		const outPath = join(root, 'public', name);
		try {
			await sharp(svgData)
				.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.png()
				.toFile(outPath);
			console.log(`✅ Сгенерирован ${name} (${size}x${size}, для ${purpose})`);
			okCount++;
		} catch (e) {
			console.error(`❌ Ошибка генерации ${name}:`, e);
		}
	}
	if (okCount === sizes.length) {
		console.log('🟢 Все иконки успешно созданы.');
	} else {
		process.exit(1);
	}
}

main();
