import fs from 'fs';
import path from 'path';

/**
 * ПЕРСОНАЛЬНЫЙ СКРИПТ БЭКАПА (LOCAL ONLY)
 * Этот скрипт отслеживает изменения только в секретных/игнорируемых файлах
 * и создает для них резервные копии (*~).
 *
 * Список отслеживаемых файлов:
 */
const TARGET_FILES = ['AGENTS.md', 'THOUGHTS.md', 'CHAT_HISTORY.md', 'SESSION_LOG.md', 'CLAUDE.md'];

console.log('🛡️  Selective Personal Backup started.');
console.log('Monitoring:', TARGET_FILES.join(', '));

function createBackup(filename) {
	const fullPath = path.join(process.cwd(), filename);
	if (!fs.existsSync(fullPath)) return;

	try {
		const backupPath = `${fullPath}~`;
		fs.copyFileSync(fullPath, backupPath);
		// console.log(`💾 Backup created: ${filename}~`);
	} catch (_err) {
		// Игнорируем ошибки блокировки
	}
}

// Первичный бэкап при запуске
TARGET_FILES.forEach(createBackup);

// Следим за изменениями в корневой директории
fs.watch(process.cwd(), (eventType, filename) => {
	if (filename && TARGET_FILES.includes(filename)) {
		createBackup(filename);
	}
});

// Держим процесс живым
setInterval(() => {}, 1000 * 60 * 60);
