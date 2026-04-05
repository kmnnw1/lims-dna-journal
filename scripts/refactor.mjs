import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// 1. Файлы под удаление
const TO_DELETE = [
	'AGENTS.md',
	'CLAUDE.md',
	'repomix-output.xml',
	'repomix-output.txt',
	'debug-output.txt'
];

// 2. Файлы для перемещения (Откуда -> Куда)
const MOVES = {
	// UI компоненты
	'components/Providers.tsx': 'components/ui/Providers.tsx',
	'components/PwaBootstrap.tsx': 'components/ui/PwaBootstrap.tsx',
	'components/CommandPalette.tsx': 'components/ui/CommandPalette.tsx',
	'components/ShortcutsModal.tsx': 'components/ui/ShortcutsModal.tsx',
	'lib/highlight.tsx': 'components/ui/HighlightMatch.tsx', // Переносим и переименовываем
	
	// Умные фичи
	'components/AddSpecimenModal.tsx': 'components/features/AddSpecimenModal.tsx',
	'components/EditSpecimenModal.tsx': 'components/features/EditSpecimenModal.tsx',
	'components/MobileSpecimenCard.tsx': 'components/features/MobileSpecimenCard.tsx',
	'components/BarcodeScanDialog.tsx': 'components/features/BarcodeScanDialog.tsx',
	'components/PcrModal.tsx': 'components/features/PcrModal.tsx',
	'components/BatchPcrModal.tsx': 'components/features/BatchPcrModal.tsx',
	
	// Фикс имени малвари (на всякий случай)
	'malware.ts': 'middleware.ts'
};

// 3. Карта замены импортов (Что искали -> На что заменить)
const IMPORT_REPLACEMENTS = {
	'@/components/Providers': '@/components/ui/Providers',
	'@/components/PwaBootstrap': '@/components/ui/PwaBootstrap',
	'@/components/CommandPalette': '@/components/ui/CommandPalette',
	'@/components/ShortcutsModal': '@/components/ui/ShortcutsModal',
	'@/lib/highlight': '@/components/ui/HighlightMatch',
	
	'@/components/AddSpecimenModal': '@/components/features/AddSpecimenModal',
	'@/components/EditSpecimenModal': '@/components/features/EditSpecimenModal',
	'@/components/MobileSpecimenCard': '@/components/features/MobileSpecimenCard',
	'@/components/BarcodeScanDialog': '@/components/features/BarcodeScanDialog',
	'@/components/PcrModal': '@/components/features/PcrModal',
	'@/components/BatchPcrModal': '@/components/features/BatchPcrModal',
};

function ensureDir(filePath) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

console.log('🚜 Запуск архитектурного бульдозера...\n');

// Шаг 1: Удаление мусора
TO_DELETE.forEach(file => {
	const fullPath = path.join(rootDir, file);
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
		console.log(`🗑️  Удален: ${file}`);
	}
});

// Шаг 2: Перемещение файлов
Object.entries(MOVES).forEach(([from, to]) => {
	const fromPath = path.join(rootDir, from);
	const toPath = path.join(rootDir, to);
	
	if (fs.existsSync(fromPath)) {
		ensureDir(toPath);
		fs.renameSync(fromPath, toPath);
		console.log(`📦 Перемещен: ${from} -> ${to}`);
	}
});

// Шаг 3: Обновление импортов во всех .ts/.tsx файлах
function updateImportsInDir(dir) {
	const files = fs.readdirSync(dir);
	
	for (const file of files) {
		const fullPath = path.join(dir, file);
		if (fs.statSync(fullPath).isDirectory()) {
			if (!['node_modules', '.next', '.git'].includes(file)) {
				updateImportsInDir(fullPath);
			}
		} else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
			let content = fs.readFileSync(fullPath, 'utf8');
			let hasChanges = false;
			
			Object.entries(IMPORT_REPLACEMENTS).forEach(([oldImport, newImport]) => {
				// Заменяем импорты с учетом кавычек
				const regex = new RegExp(`['"]${oldImport}['"]`, 'g');
				if (regex.test(content)) {
					content = content.replace(regex, `'${newImport}'`);
					hasChanges = true;
				}
			});
			
			if (hasChanges) {
				fs.writeFileSync(fullPath, content, 'utf8');
				console.log(`🔗 Обновлены импорты в: ${fullPath.replace(rootDir, '')}`);
			}
		}
	}
}

console.log('\n🔍 Сканирование проекта для обновления путей...');
updateImportsInDir(rootDir);

console.log('\n✅ Рефакторинг завершен! Проект чист и структурирован.');
