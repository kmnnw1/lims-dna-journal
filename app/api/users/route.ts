import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { type ApiUser, handleError, requireRole } from '@/lib/api/helpers';
import { prisma } from '@/lib/db/prisma/prisma';
import { sanitizeString, validateContentType, validateRole } from '@/lib/security/input-validator';

// GET: Получить список пользователей (id, username, role)
export async function GET(req: Request) {
	try {
		await requireRole('ADMIN');
		const users = await prisma.user.findMany({
			select: { id: true, username: true, role: true, firstName: true, lastName: true },
		});
		return NextResponse.json(users);
	} catch (e) {
		return handleError(e, req);
	}
}

// POST: Создать нового пользователя
export async function POST(req: Request) {
	try {
		await requireRole('ADMIN');

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const body = await req.json();
		const username = sanitizeString(body.username, 50);
		const password = sanitizeString(body.password, 100);
		const role = validateRole(body.role);
		const firstName = sanitizeString(body.firstName, 50);
		const lastName = sanitizeString(body.lastName, 50);

		if (!username || !password || !role) {
			throw { statusCode: 400, message: 'Некорректные данные пользователя' };
		}

		// Проверка уникальности username
		const exists = await prisma.user.findUnique({ where: { username } });
		if (exists) {
			throw { statusCode: 409, message: 'Пользователь с таким именем уже существует' };
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: { username, password: hashedPassword, role, firstName, lastName },
		});
		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e, req);
	}
}

// PUT: Обновить пользователя (роль и/или пароль)
export async function PUT(req: Request) {
	try {
		const session = await requireRole('ADMIN');
		const currentUserId = (session.user as ApiUser).id;

		const contentType = req.headers.get('content-type');
		if (!validateContentType(contentType)) {
			throw { statusCode: 415, message: 'Content-Type должен быть application/json' };
		}

		const body = await req.json();
		const id = sanitizeString(body.id, 50);
		const role = validateRole(body.role);
		const password = sanitizeString(body.password, 100);
		const firstName = sanitizeString(body.firstName, 50);
		const lastName = sanitizeString(body.lastName, 50);

		if (!id) {
			throw { statusCode: 400, message: 'Не указан id пользователя' };
		}

		const data: {
			role?: string;
			password?: string;
			firstName?: string | null;
			lastName?: string | null;
		} = {};

		if (role) {
			// Блокируем понижение собственной роли
			if (currentUserId === id && role !== 'ADMIN') {
				throw {
					statusCode: 400,
					message:
						'Нельзя понизить собственную роль, чтобы не потерять доступ к панели управления.',
				};
			}
			data.role = role;
		}

		if (body.firstName !== undefined) data.firstName = firstName || null;
		if (body.lastName !== undefined) data.lastName = lastName || null;

		if (password) {
			data.password = await bcrypt.hash(password, 10);
		}

		if (Object.keys(data).length === 0) {
			throw { statusCode: 400, message: 'Нечего обновить' };
		}

		const user = await prisma.user.update({ where: { id }, data });
		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				username: user.username,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		});
	} catch (e) {
		return handleError(e, req);
	}
}

// DELETE: Удалить пользователя по id (?id=...)
export async function DELETE(req: Request) {
	try {
		const session = await requireRole('ADMIN');
		const currentUserId = (session.user as ApiUser).id;

		const { searchParams } = new URL(req.url);
		const id = sanitizeString(searchParams.get('id'), 50);

		if (!id) {
			throw { statusCode: 400, message: 'Не указан id пользователя' };
		}

		// Не позволяем удалять собственного пользователя
		if (currentUserId === id) {
			throw { statusCode: 400, message: 'Нельзя удалить себя' };
		}

		// Не позволяем удалять администраторов (защита от удаления коллег-админов)
		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) {
			throw { statusCode: 404, message: 'Пользователь не найден' };
		}

		if (targetUser.role === 'ADMIN') {
			const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
			if (adminCount <= 2) {
				throw {
					statusCode: 400,
					message:
						'Для безопасности в системе должно оставаться минимум 2 администратора. Сначала создайте третьего или смените роль этого пользователя.',
				};
			}
		}

		await prisma.user.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (e) {
		return handleError(e, req);
	}
}
