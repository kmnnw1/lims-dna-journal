import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prisma';

// Вспомогательная функция проверки роли администратора.
// Можно расширить аудит/логирование действий.
async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
		throw new Error('Недостаточно прав администратора');
	}
}

// Вынесён набор допустимых ролей наверх для переиспользования
const ALLOWED_ROLES = new Set(['EDITOR', 'ADMIN', 'READER']);

// GET: Получить список пользователей (id, username, role)
export async function GET() {
	try {
		await requireAdmin();
		const users = await prisma.user.findMany({
			select: { id: true, username: true, role: true, firstName: true, lastName: true },
		});
		return NextResponse.json(users);
	} catch (e) {
		console.error('[API/Users] GET Error:', e);
		const msg = e instanceof Error ? e.message : 'Ошибка доступа';
		return NextResponse.json({ error: msg }, { status: 403 });
	}
}

// POST: Создать нового пользователя
export async function POST(req: Request) {
	try {
		await requireAdmin();
		const { username, password, role, firstName, lastName } = await req.json();

		if (
			typeof username !== 'string' ||
			typeof password !== 'string' ||
			!username.trim() ||
			!password // (пусть пустые пароли отсекаются)
		) {
			return NextResponse.json(
				{ error: 'Некорректные данные пользователя' },
				{ status: 400 },
			);
		}

		if (!ALLOWED_ROLES.has(role)) {
			return NextResponse.json({ error: 'Недопустимая роль' }, { status: 400 });
		}

		// Проверка уникальности username
		const exists = await prisma.user.findUnique({ where: { username } });
		if (exists) {
			return NextResponse.json(
				{ error: 'Пользователь с таким именем уже существует' },
				{ status: 409 },
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: { username, password: hashedPassword, role, firstName, lastName },
		});
		return NextResponse.json({ success: true });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}

// PUT: Обновить пользователя (роль и/или пароль)
export async function PUT(req: Request) {
	try {
		await requireAdmin();
		const body = await req.json();
		const id = typeof body?.id === 'string' ? body.id : undefined;
		const role = typeof body?.role === 'string' ? body.role : undefined;
		const password =
			typeof body?.password === 'string' && body.password.trim().length > 0
				? body.password
				: undefined;
		const firstName = typeof body?.firstName === 'string' ? body.firstName : undefined;
		const lastName = typeof body?.lastName === 'string' ? body.lastName : undefined;

		if (!id) {
			return NextResponse.json({ error: 'Не указан id пользователя' }, { status: 400 });
		}

		const data: { role?: string; password?: string } = {};

		if (role !== undefined) {
			if (!ALLOWED_ROLES.has(role)) {
				return NextResponse.json({ error: 'Недопустимая роль' }, { status: 400 });
			}

			// Блокируем понижение собственной роли
			const session = await getServerSession(authOptions);
			const currentUser = session?.user as { id?: string } | undefined;
			if (currentUser?.id === id && role !== 'ADMIN') {
				return NextResponse.json(
					{
						error: 'Нельзя понизить собственную роль, чтобы не потерять доступ к панели управления.',
					},
					{ status: 400 },
				);
			}

			data.role = role;
		}

		if (firstName !== undefined) (data as any).firstName = firstName;
		if (lastName !== undefined) (data as any).lastName = lastName;

		if (password !== undefined) {
			data.password = await bcrypt.hash(password, 10);
		}

		if (Object.keys(data).length === 0) {
			return NextResponse.json({ error: 'Нечего обновить' }, { status: 400 });
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
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}

// DELETE: Удалить пользователя по id (?id=...)
export async function DELETE(req: Request) {
	try {
		await requireAdmin();
		const url = new URL(req.url);
		const id = url.searchParams.get('id');
		if (!id) {
			return NextResponse.json({ error: 'Не указан id пользователя' }, { status: 400 });
		}

		// Не позволяем удалять собственного пользователя
		const session = await getServerSession(authOptions);
		const currentUser = session?.user as { id?: string } | undefined;
		if (currentUser?.id === id) {
			return NextResponse.json({ error: 'Нельзя удалить себя' }, { status: 400 });
		}

		// Не позволяем удалять администраторов (защита от удаления коллег-админов)
		const targetUser = await prisma.user.findUnique({ where: { id: String(id) } });
		if (!targetUser) {
			return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
		}

		if (targetUser.role === 'ADMIN') {
			const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
			// Если админов 2 или меньше, запрещаем удаление коллеги-админа.
			// (Один может быть 'admin', другой - текущий, или оба - просто админы).
			if (adminCount <= 2) {
				return NextResponse.json(
					{
						error: 'Для безопасности в системе должно оставаться минимум 2 администратора. Сначала создайте третьего или смените роль этого пользователя.',
					},
					{ status: 400 },
				);
			}
		}

		await prisma.user.delete({ where: { id: String(id) } });
		return NextResponse.json({ success: true });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({ error: msg }, { status: 400 });
	}
}
