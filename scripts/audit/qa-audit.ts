import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Dependency Guard
 * Проверяет безопасность зависимостей и наличие обновлений.
 */

async function runAudit() {
	console.log('\n🛡️  Запуск аудита зависимостей...');

	// 1. NPM Audit
	try {
		console.log('  -> Проверка уязвимостей (npm audit)...');
		await execAsync('npm audit --audit-level=high');
		console.log('  ✅ Критических уязвимостей не найдено.');
	} catch (e: unknown) {
		const err = e as { stdout: string };
		console.warn('  ⚠️  Найдены уязвимости в пакетах. Рекомендуется npm audit fix.');
		console.log(err.stdout.slice(0, 500));
	}

	// 2. Outdated
	try {
		console.log('\n  -> Проверка обновлений (npm outdated)...');
		const { stdout } = await execAsync('npm outdated');
		if (stdout) {
			console.log(stdout);
		} else {
			console.log('  ✅ Все пакеты актуальны.');
		}
	} catch (e: unknown) {
		const err = e as { stdout?: string };
		if (err.stdout) console.log(err.stdout);
	}
}

runAudit().catch(console.error);
