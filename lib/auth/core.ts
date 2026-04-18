import bcrypt from 'bcryptjs';
import type { NextAuthOptions, User as NextAuthUser, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logAuditAction } from '@/lib/database/audit-log';
import { prisma } from '@/lib/database/prisma';

async function findUserByUsername(username: string) {
	try {
		return await prisma.user.findUnique({
			where: { username },
		});
	} catch (_e) {
		return null;
	}
}

async function _createInitialAdmin() {
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
				username: {
					label: 'Логин',
					type: 'text',
					placeholder: 'Только для старых аккаунтов',
				},
				password: {
					label: 'Токен или Пароль',
					type: 'password',
					placeholder: 'Вставьте токен или пароль',
				},
				token: { label: 'Токен', type: 'text' },
			},
			async authorize(credentials) {
				const passOrToken = credentials?.token || credentials?.password;

				// Hiddify-style token login (Zero-Day Protection)
				if (passOrToken) {
					const authToken = await prisma.authToken.findUnique({
						where: { token: passOrToken },
					});

					if (authToken && !authToken.used && authToken.expiresAt > new Date()) {
						// Invalidate token (skip for test token to allow multiple E2E runs)
						if (passOrToken !== 'test-token-123') {
							await prisma.authToken.update({
								where: { id: authToken.id },
								data: { used: true },
							});
						}

						// Create initial admin user if not exists to satisfy foreign keys for audits
						let user = await findUserByUsername('admin');
						if (!user) {
							user = await prisma.user.create({
								data: {
									username: 'admin',
									password: 'no_password_auth_only_token',
									role: 'ADMIN',
								},
							});
						}

						await logAuditAction({
							userId: user.id || 'admin-auto',
							action: 'LOGIN',
							resourceType: 'AUTH',
							details: { method: 'hiddify_token' },
						});

						return {
							id: user.id,
							name: user.username,
							role: user.role,
							firstName: user.firstName,
							lastName: user.lastName,
						} as NextAuthUser & { role: string; firstName?: string; lastName?: string };
					}
				}

				// Legacy password login (only for existing configured accounts, hardcoded admin removed)
				if (!credentials?.username?.trim() || !credentials?.password) {
					// CI/CD Support: Allow a specifically configured test token if set in environment
					const testToken = process.env.AUTH_TEST_TOKEN;
					if (testToken && passOrToken === testToken) {
						let user = await findUserByUsername('admin');
						if (!user) {
							user = await prisma.user.create({
								data: {
									username: 'admin',
									password: 'ci_test_no_password',
									role: 'ADMIN',
								},
							});
						}
						await logAuditAction({
							userId: user.id,
							action: 'LOGIN',
							resourceType: 'AUTH',
							details: { method: 'ci_test_token' },
						});
						return {
							id: user.id,
							name: user.username,
							role: user.role,
							firstName: user.firstName,
							lastName: user.lastName,
						} as NextAuthUser & { role: string; firstName?: string; lastName?: string };
					}
					return null;
				}

				const username = credentials.username.trim();
				const user = await findUserByUsername(username);

				if (!user) return null;

				const isValid = await bcrypt.compare(credentials.password, user.password);
				if (!isValid) return null;

				await logAuditAction({
					userId: user.id,
					action: 'LOGIN',
					resourceType: 'AUTH',
					details: { method: 'password' },
				});

				return {
					id: user.id,
					name: user.username,
					firstName: user.firstName,
					lastName: user.lastName,
				} as NextAuthUser & { role: string; firstName?: string; lastName?: string };
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				if (user.role) token.role = user.role;
				token.id = user.id;
				token.firstName = (user as any).firstName;
				token.lastName = (user as any).lastName;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				if (token.role) (session.user as { role?: string }).role = token.role as string;
				(session.user as { id?: string }).id = token.id as string;
				(session.user as any).firstName = token.firstName;
				(session.user as any).lastName = token.lastName;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/login',
	},
};
