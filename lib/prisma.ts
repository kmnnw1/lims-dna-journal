import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		// Оставляем только 'error', убираем 'query' и 'info'
		log: ['error'],
	});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
