import { prisma } from '../lib/database/prisma';

async function cleanup() {
	console.log(
		'ЁЯЪА ╨Ч╨░╨┐╤Г╤Б╨║ ╨┐╨╛╤Б╨╗╨╡╨┤╨╛╨▓╨░╤В╨╡╨╗╤М╨╜╨╛╨╣ ╨╜╨╛╤А╨╝╨░╨╗╨╕╨╖╨░╤Ж╨╕╨╕ (╨▒╨╡╨╖ ╨┐╨░╤А╨░╨╗╨╗╨╡╨╗╨╕╨╖╨╝╨░)...',
	);

	const allSpecimens = await prisma.specimen.findMany({
		select: { id: true, extrOperator: true, collector: true },
	});

	const davydovName = '╨Х. ╨Р. ╨Ф╨░╨▓╤Л╨┤╨╛╨▓';
	const davydovAliases = [
		'╨┤╨░╨▓╤Л╨┤╨╛╨▓ 5315',
		'f. a. davydov 5295',
		'e. a. davydov 5309',
		'e. a. davydov',
		'╨┤╨░╨▓╤Л╨┤╨╛╨▓',
		'davydov',
	];

	const uniqueNames = new Set<string>();
	uniqueNames.add(davydovName);

	console.log(
		'ЁЯФН ╨Я╤А╨╡╨┤╨▓╨░╤А╨╕╤В╨╡╨╗╤М╨╜╨╛╨╡ ╤Б╨║╨░╨╜╨╕╤А╨╛╨▓╨░╨╜╨╕╨╡ ╤Г╨╜╨╕╨║╨░╨╗╤М╨╜╤Л╤Е ╨╕╨╝╨╡╨╜...',
	);
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
				name.toLowerCase().includes('╨┤╨░╨▓╤Л╨┤╨╛╨▓')
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

	console.log(
		`ЁЯУК ╨Т╤Б╨╡╨│╨╛ ╤Г╨╜╨╕╨║╨░╨╗╤М╨╜╤Л╤Е ╨╗╨░╨▒╨╛╤А╨░╨╜╤В╨╛╨▓ ╨▓ ╤Б╨┐╤А╨░╨▓╨╛╤З╨╜╨╕╨║╨╡: ${uniqueNames.size}`,
	);
	console.log('ЁЯФЧ ╨Я╤А╨╕╨▓╤П╨╖╨║╨░ ╨┐╤А╨╛╨▒ (╨╛╨▒╤А╨░╨▒╨╛╤В╨║╨░ ╨▓╤Б╨╡╨│╨╛ ╨╝╨░╤Б╤Б╨╕╨▓╨░)...');

	let totalProcessed = 0;
	for (const s of allSpecimens) {
		const raw = s.extrOperator || s.collector || '';

		// ╨г╨┤╨░╨╗╤П╨╡╨╝ John Doe ╨╡╤Б╨╗╨╕ ╨▓╤Б╤В╤А╨╡╤В╨╕╨╗╤Б╤П
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
					name.toLowerCase().includes('╨┤╨░╨▓╤Л╨┤╨╛╨▓')
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
			console.log(`  -> ╨Я╤А╨╛╨│╤А╨╡╤Б╤Б: ${totalProcessed}/${allSpecimens.length}`);
		}
	}

	console.log('тЬи ╨С╨░╨╖╨░ ╨┤╨░╨╜╨╜╤Л╤Е ╤Г╤Б╨┐╨╡╤И╨╜╨╛ ╨╜╨╛╤А╨╝╨░╨╗╨╕╨╖╨╛╨▓╨░╨╜╨░!');
}

cleanup()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
