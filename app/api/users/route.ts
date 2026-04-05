import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {getServerSession} from 'next-auth/next';
import bcrypt from 'bcryptjs';
import {authOptions} from '@/lib/auth';

// Вспомогательная функция проверки роли администратора.
// Можно расширить аудит/логирование действий.
async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session?.user || (session.user as {role?: string}).role !== 'ADMIN') {
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
			select: {id: true, username: true, role: true},
		});
		return NextResponse.json(users);
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({error: msg}, {status: 403});
	}
}

// POST: Создать нового пользователя
export async function POST(req: Request) {
	try {
		await requireAdmin();
		const {username, password, role} = await req.json();

		if (
			typeof username !== 'string' ||
			typeof password !== 'string' ||
			!username.trim() ||
			!password // (пусть пустые пароли отсекаются)
		) {
			return NextResponse.json({error: 'Некорректные данные пользователя'}, {status: 400});
		}

		if (!ALLOWED_ROLES.has(role)) {
			return NextResponse.json({error: 'Недопустимая роль'}, {status: 400});
		}

		// Проверка уникальности username
		const exists = await prisma.user.findUnique({where: {username}});
		if (exists) {
			return NextResponse.json(
				{error: 'Пользователь с таким именем уже существует'},
				{status: 409},
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: {username, password: hashedPassword, role},
		});
		return NextResponse.json({success: true});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({error: msg}, {status: 400});
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

		if (!id) {
			return NextResponse.json({error: 'Не указан id пользователя'}, {status: 400});
		}

		const data: {role?: string; password?: string} = {};

		if (role !== undefined) {
			if (!ALLOWED_ROLES.has(role)) {
				return NextResponse.json({error: 'Недопустимая роль'}, {status: 400});
			}
			data.role = role;
		}

		if (password !== undefined) {
			data.password = await bcrypt.hash(password, 10);
		}

		if (Object.keys(data).length === 0) {
			return NextResponse.json({error: 'Нечего обновить'}, {status: 400});
		}

		const user = await prisma.user.update({where: {id}, data});
		return NextResponse.json({
			success: true,
			user: {id: user.id, username: user.username, role: user.role},
		});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({error: msg}, {status: 400});
	}
}

// DELETE: Удалить пользователя по id (?id=...)
export async function DELETE(req: Request) {
	try {
		await requireAdmin();
		const url = new URL(req.url);
		const id = url.searchParams.get('id');
		if (!id) {
			return NextResponse.json({error: 'Не указан id пользователя'}, {status: 400});
		}

		// Не позволяем удалять собственного пользователя
		const session = await getServerSession(authOptions);
		if (session?.user && (session.user as any).id === id) {
			return NextResponse.json({error: 'Нельзя удалить себя'}, {status: 400});
		}

		await prisma.user.delete({where: {id: String(id)}});
		return NextResponse.json({success: true});
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Ошибка';
		return NextResponse.json({error: msg}, {status: 400});
	}
}
