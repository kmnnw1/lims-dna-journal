import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Enhanced Error Digest
 * Агрегирует ошибки из Biome и TSC для быстрого анализа.
 */

async function runQA() {
	console.log('\n[QA] Запуск анализа проекта (Biome + TSC)...');
	const issues: string[] = [];

	// 1. Biome
	try {
		console.log('  -> Анализ Biome...');
		await execAsync('npx biome check .');
	} catch (e: unknown) {
		const err = e as { stdout: string };
		const lines = err.stdout.split('\n');
		lines.forEach((l: string) => {
			if (l.includes('error') || l.includes('✖') || l.includes('warning')) {
				issues.push(`[BIOME] ${l.trim()}`);
			}
		});
	}

	// 2. TSC
	try {
		console.log('  -> Анализ TypeScript...');
		await execAsync('npx tsc --noEmit');
	} catch (e: unknown) {
		const err = e as { stdout: string };
		const lines = err.stdout.split('\n');
		lines.forEach((l: string) => {
			if (l.match(/error TS\d+:/)) {
				issues.push(`[TSC] ${l.trim()}`);
			}
		});
	}

	if (issues.length > 0) {
		console.log(`\n[!] Найдено проблем: ${issues.length}`);
		console.log(issues.slice(0, 10).join('\n'));
		if (issues.length > 10) console.log(`... и еще ${issues.length - 10} проблем.`);

		// В Windows можно копировать в буфер через clip
		const report = `--- ERROR REPORT (${issues.length} issues) ---\n\n${issues.join('\n')}\n\n--- END ---`;
		try {
			const child = exec('clip');
			child.stdin?.write(report);
			child.stdin?.end();
			console.log('\n[*] Полный отчет скопирован в буфер обмена.');
		} catch {
			// clip failed
		}
	} else {
		console.log('\n[+] Проект чист! Ошибок не найдено.');
	}
}

runQA().catch(console.error);
