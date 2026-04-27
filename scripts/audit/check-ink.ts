import { prisma } from '../lib/database/prisma';

async function checkInk() {
	console.log('✒️  Анализ "невидимых чернил" (Поиск по авторам)...');

	// Статистика по всем авторам
	const stats = await prisma.specimen.groupBy({
		by: ['addedBy'],
		_count: {
			_all: true,
		},
	});

	if (stats.length > 0) {
		console.log('\n📊 Распределение записей по авторам:');
		stats.forEach((s) => {
			console.log(`- ${s.addedBy || 'Неизвестно'}: ${s._count._all} проб`);
		});
	} else {
		console.log('\n📭 В базе пока нет записей с метками.');
	}

	// Поиск недавних записей JORIK
	const jorikRecent = await prisma.specimen.findMany({
		where: { addedBy: 'JORIK' },
		orderBy: { createdAt: 'desc' },
		take: 10,
	});

	if (jorikRecent.length > 0) {
		console.log('\n🕒 Последние 10 записей JORIK:');
		jorikRecent.forEach((s) => {
			console.log(
				`- ID: ${s.id}, Таксон: ${s.taxon || '—'}, Дата: ${s.createdAt.toISOString()}`,
			);
		});
	}

	// Поиск подозрительных записей без автора (если есть)
	const orphans = await prisma.specimen.count({
		where: { addedBy: null },
	});

	if (orphans > 0) {
		console.log(`\n⚠️  Обнаружено ${orphans} записей без меток авторства.`);
	}
}

checkInk()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
