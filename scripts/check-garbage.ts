import { prisma } from '../lib/database/prisma';

async function check() {
	const refs = await prisma.specimen.count({
		where: {
			OR: [
				{ id: { contains: 'REF' } },
				{ notes: { contains: 'REF' } },
				{ notes: { contains: 'formula' } },
				{ importNotes: { contains: 'REF' } },
			],
		},
	});
	console.log(`🔍 Найдено строк с мусором (#REF!/formula): ${refs}`);
}

check()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
