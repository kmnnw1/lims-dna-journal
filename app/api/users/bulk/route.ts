import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';
import { transliterate } from '@/lib/translit';

async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
		throw new Error('Недостаточно прав администратора');
	}
}

function generatePassword() {
	// Simple random password
	const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
	let pass = '';
	for (let i = 0; i < 8; i++) {
		pass += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return pass;
}

export async function POST(req: Request) {
	try {
		await requireAdmin();
		const { users: userList } = await req.json();

		if (!Array.isArray(userList)) {
			return NextResponse.json(
				{ error: 'Список пользователей должен быть массивом' },
				{ status: 400 },
			);
		}

		const results = [];

		for (const userData of userList) {
			const firstName = String(userData.firstName || '').trim();
			const lastName = String(userData.lastName || '').trim();

			if (!firstName || !lastName) continue;

			// Generate username: surname_f
			const baseUsername = `${transliterate(lastName)}_${transliterate(firstName[0])}`;
			let username = baseUsername;
			let counter = 1;

			// Ensure uniqueness
			while (await prisma.user.findUnique({ where: { username } })) {
				username = `${baseUsername}${counter}`;
				counter++;
			}

			const plainPassword = generatePassword();
			const hashedPassword = await bcrypt.hash(plainPassword, 10);

			const user = await prisma.user.create({
				data: {
					username,
					password: hashedPassword,
					firstName,
					lastName,
					role: 'EDITOR',
				},
			});

			results.push({
				id: user.id,
				name: `${lastName} ${firstName}`,
				username,
				password: plainPassword,
			});
		}

		return NextResponse.json({ success: true, users: results });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}
