import type {NextAuthOptions, User as NextAuthUser, Session} from 'next-auth';
import type {JWT} from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import {prisma} from '@/lib/prisma';
import bcrypt from 'bcryptjs';

async function findUserByUsername(username: string) {
	try {
		return await prisma.user.findUnique({
			where: {username},
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
				username: {label: 'Логин', type: 'text', placeholder: 'admin'},
				password: {label: 'Пароль', type: 'password', placeholder: 'Пароль'},
			},
			async authorize(credentials) {
				if (!credentials?.username?.trim() || !credentials?.password) return null;

				const username = credentials.username.trim();
				let user = await findUserByUsername(username);

				// Создание admin/admin при первом входе
				if (!user && username === 'admin' && credentials.password === 'admin') {
					user = await createInitialAdmin();
				}

				if (!user) return null;

				const isValid = await bcrypt.compare(credentials.password, user.password);
				if (!isValid) return null;

				return {
					id: user.id,
					name: user.username,
					role: user.role,
				} as NextAuthUser & {role: string};
			},
		}),
	],
	callbacks: {
		async jwt({token, user}) {
			if (user?.role) {
				token.role = user.role;
			}
			return token;
		},
		async session({session, token}) {
			if (session.user && token.role) {
				(session.user as {role?: string}).role = token.role as string;
			}
			return session;
		},
	},
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/login',
	},
};
