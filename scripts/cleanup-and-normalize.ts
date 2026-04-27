import { prisma } from '../lib/database/prisma';

async function cleanup() {
	console.log('🚀 Запуск последовательной нормализации (без параллелизма)...');

	const allSpecimens = await prisma.specimen.findMany({
		select: { id: true, extrOperator: true, collector: true },
	});

	const davydovName = 'Е. А. Давыдов';
	const davydovAliases = [
		'давыдов 5315',
		'f. a. davydov 5295',
		'e. a. davydov 5309',
		'e. a. davydov',
		'давыдов',
		'davydov',
	];

	const uniqueNames = new Set<string>();
	uniqueNames.add(davydovName);

	console.log('🔍 Предварительное сканирование уникальных имен...');
	for (const s of allSpecimens) {
		const raw = s.extrOperator || s.collector || '';
		if (!raw || raw.includes('John Doe')) continue;
		const names = raw
			.split(/[;,]/)
			.map((n) => n.trim())
			.filter(Boolean);
		for (const name of names) {
			if (
				davydovAliases.some((a) => name.toLowerCase().includes(a)) ||
				name.toLowerCase().includes('давыдов')
			) {
				uniqueNames.add(davydovName);
			} else {
				uniqueNames.add(name);
			}
		}
	}

	const techCache = new Map<string, string>();
	for (const name of uniqueNames) {
		const tech = await prisma.technician.upsert({
			where: { name },
			update: name === davydovName ? { aliases: davydovAliases.join(', ') } : {},
			create: { name, aliases: name === davydovName ? davydovAliases.join(', ') : null },
		});
		techCache.set(name, tech.id);
	}

	console.log(`📊 Всего уникальных лаборантов в справочнике: ${uniqueNames.size}`);
	console.log('🔗 Привязка проб (обработка всего массива)...');

	let totalProcessed = 0;
	for (const s of allSpecimens) {
		const raw = s.extrOperator || s.collector || '';

		// Удаляем John Doe если встретился
		if (raw && raw.includes('John Doe')) {
			await prisma.specimen.update({
				where: { id: s.id },
				data: { extrOperator: '', collector: '' },
			});
		} else if (raw) {
			const names = raw
				.split(/[;,]/)
				.map((n) => n.trim())
				.filter(Boolean);
			const connects = [];
			for (const name of names) {
				let target = name;
				if (
					davydovAliases.some((a) => name.toLowerCase().includes(a)) ||
					name.toLowerCase().includes('давыдов')
				) {
					target = davydovName;
				}
				const id = techCache.get(target);
				if (id) connects.push({ id });
			}

			if (connects.length > 0) {
				await prisma.specimen.update({
					where: { id: s.id },
					data: { technicians: { connect: connects } },
				});
			}
		}

		totalProcessed++;
		if (totalProcessed % 500 === 0 || totalProcessed === allSpecimens.length) {
			console.log(`  -> Прогресс: ${totalProcessed}/${allSpecimens.length}`);
		}
	}

	console.log('✨ База данных успешно нормализована!');
}

cleanup()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
