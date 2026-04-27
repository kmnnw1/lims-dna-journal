import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { prisma } from '@/lib/db/prisma/prisma';
import { sanitizeString, validateContentType } from '@/lib/security/input-validator';
import { transliterate } from '@/lib/translit';

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
		await requireRole('ADMIN');

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const body = await req.json();
		const userList = body.users;

		if (!Array.isArray(userList)) {
			throw { statusCode: 400, message: 'Список пользователей должен быть массивом' };
		}

		const results = [];

		for (const userData of userList) {
			const firstName = sanitizeString(userData.firstName, 50);
			const lastName = sanitizeString(userData.lastName, 50);

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

			const newUser = await prisma.user.create({
				data: {
					username,
					password: hashedPassword,
					firstName,
					lastName,
					role: 'EDITOR',
				},
			});

			results.push({
				id: newUser.id,
				name: `${lastName} ${firstName}`,
				username,
				password: plainPassword,
			});
		}

		return NextResponse.json({ success: true, users: results });
	} catch (e) {
		return handleError(e, req);
	}
}
