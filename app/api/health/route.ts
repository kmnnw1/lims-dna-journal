import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

/**
 * API-эндпоинт для health/probe (жив ли сервис, версия, текущее время).
 * Можно расширять дополнительными проверками в будущем.
 */
export async function GET() {
	let version = '0.0.0';
	let name = 'lab-journal';
	try {
		const pkgPath = join(process.cwd(), 'package.json');
		const raw = readFileSync(pkgPath, 'utf8');
		const pkg = JSON.parse(raw) as { version?: string; name?: string };
		version = pkg.version ?? version;
		name = pkg.name ?? name;
		// Note: getting mtime requires fs.statSync, not readFileSync, but avoids ESM vs CJS confusion
		// So skip "build" time for now, unless need be
	} catch {
		// no-op
	}
	/**
	 * Вернём статус — пригодно для любой системы балансировки/мониторинга.
	 * "time" обеспечивает человеческую диагностику (отставание часов, UTC).
	 */
	return NextResponse.json({
		ok: true,
		service: name,
		version,
		build: process.env.BUILD_COMMIT ?? null,
		env: process.env.NODE_ENV ?? undefined,
		time: new Date().toISOString(),
		uptime: process.uptime?.() ?? undefined,
		pid: process.pid,
	});
}
