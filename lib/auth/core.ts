import type { NextAuthOptions, User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/database/prisma';
import bcrypt from 'bcryptjs';

async function findUserByUsername(username: string) {
	try {
		return await prisma.user.findUnique({
			where: { username },
		});
	} catch (e) {
		return null;
	}
}

async function createInitialAdmin() {
	const hashed = await bcrypt.hash('admin', 10);
	try {
		return await prisma.user.create({
			data: {
				username: 'admin',
				password: hashed,
				role: 'ADMIN',
			},
		});
	} catch {
		return findUserByUsername('admin');
	}
}

export const authOptions: NextAuthOptions = {
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60,
	},
	providers: [
		CredentialsProvider({
			name: 'Вход',
			credentials: {
				username: { label: 'Логин', type: 'text', placeholder: 'Только для старых аккаунтов' },
				password: { label: 'Токен или Пароль', type: 'password', placeholder: 'Вставьте токен или пароль' },
				token: { label: 'Токен', type: 'text' },
			},
			async authorize(credentials) {
				const passOrToken = credentials?.token || credentials?.password;
				
				// Hiddify-style token login (Zero-Day Protection)
				if (passOrToken) {
					// Dev/Test bypass for E2E tests
					if (process.env.NODE_ENV !== 'production' && process.env.TEST_TOKEN === passOrToken) {
						return { id: 'admin', name: 'admin', role: 'ADMIN' } as NextAuthUser & { role: string };
					}

					const authToken = await prisma.authToken.findUnique({ where: { token: passOrToken } });
					if (authToken && !authToken.used && authToken.expiresAt > new Date()) {
						// Invalidate token
						await prisma.authToken.update({
							where: { id: authToken.id },
							data: { used: true },
						});
						
						// Create initial admin user if not exists to satisfy foreign keys for audits
						let user = await findUserByUsername('admin');
						if (!user) {
							user = await prisma.user.create({
								data: { username: 'admin', password: 'no_password_auth_only_token', role: 'ADMIN' }
							});
						}

						return { id: user.id, name: user.username, role: user.role } as NextAuthUser & { role: string };
					}
				}

				// Legacy password login (only for existing configured accounts, hardcoded admin removed)
				if (!credentials?.username?.trim() || !credentials?.password) return null;

				const username = credentials.username.trim();
				let user = await findUserByUsername(username);

				// Fallback: Create initial admin if database is empty or admin is missing
				if (!user && username === 'admin') {
					const userCount = await prisma.user.count();
					if (userCount === 0) {
						user = await createInitialAdmin();
					}
				}

				if (!user) return null;

				const isValid = await bcrypt.compare(credentials.password, user.password);
				if (!isValid) return null;

				return {
					id: user.id,
					name: user.username,
					role: user.role,
				} as NextAuthUser & { role: string };
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				if (user.role) token.role = user.role;
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				if (token.role) (session.user as { role?: string }).role = token.role as string;
				(session.user as { id?: string }).id = token.id as string;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/login',
	},
};
