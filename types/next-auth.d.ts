/**
 * Расширяет типы NextAuth для поддержки пользовательских ролей:
 * - В объекте пользователя в сессии (Session.user) добавляется поле 'role'
 * - В JWT-токене (JWT) также поддерживается поле 'role'
 */
import type { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
	interface User extends DefaultUser {
		role?: string | null;
	}

	interface Session {
		user: {
			/** Роль пользователя (например: 'admin', 'user', ...), если применимо */
			role?: string | null;
		} & DefaultSession['user'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		/**
		 * Роль пользователя, если устанавливается через callbacks или signin
		 * Может использоваться для client-side logic/авторизации
		 */
		role?: string | null;
	}
}
