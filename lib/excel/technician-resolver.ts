import { prisma } from '../database/prisma';

/**
 * Утилита для сопоставления имен из Excel со справочником лаборантов.
 */
export async function resolveTechnicians(rawString: string): Promise<string[]> {
	if (!rawString) return [];

	// 1. Предварительная чистка и разделение
	const rawNames = rawString
		.split(/[;,]/)
		.map((n) => n.trim())
		.filter(Boolean);
	const resolvedIds: string[] = [];

	// 2. Загружаем кэш (для скорости можно было бы передавать снаружи, но для импорта ок)
	const allTechs = await prisma.technician.findMany();

	for (const name of rawNames) {
		let foundId: string | null = null;
		const lowerName = name.toLowerCase();

		// Поиск по точному совпадению или алиасу
		for (const tech of allTechs) {
			if (tech.name.toLowerCase() === lowerName) {
				foundId = tech.id;
				break;
			}
			const aliases = (tech.aliases || '').split(',').map((a) => a.trim().toLowerCase());
			if (aliases.includes(lowerName)) {
				foundId = tech.id;
				break;
			}
		}

		// Если не нашли, но имя похоже на Давыдова
		if (!foundId && lowerName.includes('давыдов')) {
			const davydov = allTechs.find((t) => t.name === 'Е. А. Давыдов');
			if (davydov) foundId = davydov.id;
		}

		// Если все еще не нашли - создаем нового
		if (!foundId) {
			const newTech = await prisma.technician.create({ data: { name } });
			allTechs.push(newTech); // Обновляем локальный список
			foundId = newTech.id;
		}

		if (foundId) resolvedIds.push(foundId);
	}

	return resolvedIds;
}
