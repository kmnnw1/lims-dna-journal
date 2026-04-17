import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './lib/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'prisma/dev.db', // Используем ту же базу, что и Prisma
	},
});
