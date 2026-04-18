/**
 * Расширяет типы NextAuth для поддержки пользовательских ролей:
 * - В объекте пользователя в сессии (Session.user) добавляется поле 'role'
 * - В JWT-токене (JWT) также поддерживается поле 'role'
 */
import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
	interface User extends DefaultUser {
		role: string;
		firstName?: string | null;
		lastName?: string | null;
	}

	interface Session {
		user: {
			id: string;
			role: string;
			firstName?: string | null;
			lastName?: string | null;
		} & DefaultSession['user'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		role: string;
		firstName?: string | null;
		lastName?: string | null;
	}
}
