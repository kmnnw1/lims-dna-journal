import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * ERD Generator (Mermaid)
 * Генерирует схему базы данных в формате Mermaid из Prisma schema.
 */

const PRISMA_PATH = join(process.cwd(), 'prisma', 'schema.prisma');
const OUTPUT_PATH = join(process.cwd(), 'docs', 'ARCHITECTURE.md');

async function genERD() {
	console.log('🏗️  Генерация схемы архитектуры (ERD)...');

	try {
		const content = await fs.readFile(PRISMA_PATH, 'utf-8');
		const models = [...content.matchAll(/model\s+(\w+)\s+{([\s\S]*?)}/g)];

		let mermaid = '```mermaid\nerDiagram\n';

		for (const model of models) {
			const name = model[1];
			const body = model[2];

			// Поля
			const fields = [...body.matchAll(/^\s+(\w+)\s+(\w+)/gm)];
			mermaid += `    ${name} {\n`;
			for (const field of fields) {
				const fName = field[1];
				const fType = field[2];
				if (!['id', 'createdAt', 'updatedAt'].includes(fName)) {
					mermaid += `        ${fType} ${fName}\n`;
				}
			}
			mermaid += '    }\n';

			// Связи (упрощенно)
			const relations = [...body.matchAll(/^\s+(\w+)\s+(\w+)\s+@relation/gm)];
			for (const rel of relations) {
				// Пытаемся угадать связь (обычно 1:N)
				mermaid += `    ${name} ||--o{ ${rel[2]} : "relates"\n`;
			}
		}

		mermaid += '```\n';

		await fs.mkdir(join(process.cwd(), 'docs'), { recursive: true });
		await fs.writeFile(
			OUTPUT_PATH,
			`# Архитектура БД\n\nЭтот файл генерируется автоматически.\n\n${mermaid}`,
			'utf-8',
		);

		console.log(`✅ Схема сохранена в: ${OUTPUT_PATH}`);
	} catch (e) {
		console.error('❌ Ошибка генерации:', e);
	}
}

genERD();
