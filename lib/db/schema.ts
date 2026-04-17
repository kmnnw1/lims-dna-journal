import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Схема данных для Drizzle ORM синхронизированная с Prisma.
 * Используем типизацию SQLite.
 */

export const users = sqliteTable('User', {
	id: text('id').primaryKey(),
	username: text('username').unique().notNull(),
	password: text('password').notNull(),
	role: text('role').notNull().default('EDITOR'),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const specimens = sqliteTable('Specimen', {
	id: text('id').primaryKey(),
	taxon: text('taxon'),
	locality: text('locality'),
	collector: text('collector'),
	collectedAt: integer('collectedAt', { mode: 'timestamp' }),
	collectNotes: text('collectNotes'),
	extrLab: text('extrLab'),
	extrOperator: text('extrOperator'),
	extrMethod: text('extrMethod'),
	extrDateRaw: text('extrDateRaw'),
	extrDate: integer('extrDate', { mode: 'timestamp' }),
	dnaMeter: text('dnaMeter'),
	measDate: integer('measDate', { mode: 'timestamp' }),
	measOperator: text('measOperator'),
	dnaConcentration: real('dnaConcentration'),
	dnaProfile: text('dnaProfile'),
	measComm: text('measComm'),
	imageUrl: text('imageUrl'),
	itsStatus: text('itsStatus'),
	itsGb: text('itsGb'),
	ssuStatus: text('ssuStatus'),
	ssuGb: text('ssuGb'),
	lsuStatus: text('lsuStatus'),
	lsuGb: text('lsuGb'),
	mcm7Status: text('mcm7Status'),
	mcm7Gb: text('mcm7Gb'),
	rpb2Status: text('rpb2Status'),
	rpb2Gb: text('rpb2Gb'),
	mtLsuStatus: text('mtLsuStatus'),
	mtLsuGb: text('mtLsuGb'),
	mtSsuStatus: text('mtSsuStatus'),
	mtSsuGb: text('mtSsuGb'),
	herbarium: text('herbarium'),
	labNo: text('labNo'),
	notes: text('notes'),
	importOrigin: text('importOrigin'),
	importRow: integer('importRow'),
	importNotes: text('importNotes'),
	reviewNotes: text('reviewNotes'),
	reviewPhotos: text('reviewPhotos'),
	deletedAt: integer('deletedAt', { mode: 'timestamp' }),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const pcrAttempts = sqliteTable('PcrAttempt', {
	id: text('id').primaryKey(),
	specimenId: text('specimenId').notNull(),
	date: integer('date', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
	marker: text('marker'),
	forwardPrimer: text('forwardPrimer'),
	reversePrimer: text('reversePrimer'),
	dnaMatrix: text('dnaMatrix'),
	volume: text('volume'),
	polymerase: text('polymerase'),
	cycler: text('cycler'),
	cycles: text('cycles'),
	annealingTemp: text('annealingTemp'),
	extensionTime: text('extensionTime'),
	result: text('result').notNull(),
	resultNotes: text('resultNotes'),
	deletedAt: integer('deletedAt', { mode: 'timestamp' }),
	createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export const auditLogs = sqliteTable('AuditLog', {
	id: text('id').primaryKey(),
	userId: text('userId').notNull(),
	action: text('action').notNull(),
	resourceType: text('resourceType').notNull(),
	resourceId: text('resourceId'),
	details: text('details'),
	changes: text('changes'),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});
