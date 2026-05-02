import { prisma } from './prisma';

export type AuditAction =
	| 'CREATE_SPECIMEN'
	| 'UPDATE_SPECIMEN'
	| 'DELETE_SPECIMEN'
	| 'PCR_ATTEMPT'
	| 'CREATE_PCR_ATTEMPT_BATCH'
	| 'CREATE_PCR_ATTEMPT'
	| 'CREATE_WORKFLOW_OPERATION'
	| 'COMPLETE_WORKFLOW_OPERATION'
	| 'CREATE_WORKFLOW_ATTACHMENT'
	| 'CREATE_AMPLIFICATION_TASK'
	| 'TAKE_AMPLIFICATION_TASK'
	| 'COMPLETE_AMPLIFICATION_TASK'
	| 'CANCEL_AMPLIFICATION_TASK'
	| 'IMPORT_SPECIMENS'
	| 'EXPORT_SPECIMENS'
	| 'LOGIN'
	| 'LOGOUT'
	| 'UPDATE_PROFILE'
	| 'CHANGE_ROLE';

export interface AuditLogData {
	userId: string;
	action: AuditAction;
	resourceType: string;
	resourceId?: string;
	details?: Record<string, unknown>;
	changes?: Record<string, { old: unknown; new: unknown }>;
	ipAddress?: string;
	userAgent?: string;
}

/**
 * Логирует действие пользователя в таблицу audit_logs
 * Используется для отслеживания всех изменений и целей модерации
 */
export async function logAuditAction(data: AuditLogData) {
	try {
		await prisma.auditLog.create({
			data: {
				userId: data.userId,
				action: data.action,
				resourceType: data.resourceType,
				resourceId: data.resourceId || null,
				details: data.details ? JSON.stringify(data.details) : null,
				changes: data.changes ? JSON.stringify(data.changes) : null,
				ipAddress: data.ipAddress || null,
				userAgent: data.userAgent || null,
				timestamp: new Date(),
			},
		});
	} catch (error) {
		// Логируем ошибку, но не прерываем выполнение основной операции
		console.error('[Audit Log Error]:', error);
	}
}

/**
 * Получает историю действий для конкретного пользователя
 */
export async function getUserAuditHistory(userId: string, limit = 100) {
	try {
		return await prisma.auditLog.findMany({
			where: { userId },
			orderBy: { timestamp: 'desc' },
			take: limit,
		});
	} catch (error) {
		console.error('[Audit History Error]:', error);
		return [];
	}
}

/**
 * Получает историю действий для конкретного ресурса
 */
export async function getResourceAuditHistory(
	resourceType: string,
	resourceId: string,
	limit = 50,
) {
	try {
		return await prisma.auditLog.findMany({
			where: {
				resourceType,
				resourceId,
			},
			orderBy: { timestamp: 'desc' },
			take: limit,
		});
	} catch (error) {
		console.error('[Resource Audit History Error]:', error);
		return [];
	}
}

/**
 * Получает все логи аудита за период (только для ADMIN)
 */
export async function getAuditLogs(filters?: {
	userId?: string;
	action?: AuditAction;
	resourceType?: string;
	startDate?: Date;
	endDate?: Date;
	limit?: number;
}) {
	try {
		const where: Record<string, unknown> = {};

		if (filters?.userId) where.userId = filters.userId;
		if (filters?.action) where.action = filters.action;
		if (filters?.resourceType) where.resourceType = filters.resourceType;

		if (filters?.startDate || filters?.endDate) {
			where.timestamp = {};
			const timestampFilter = where.timestamp as Record<string, Date>;
			if (filters.startDate) timestampFilter.gte = filters.startDate;
			if (filters.endDate) timestampFilter.lte = filters.endDate;
		}

		return await prisma.auditLog.findMany({
			where,
			orderBy: { timestamp: 'desc' },
			take: filters?.limit || 1000,
		});
	} catch (error) {
		console.error('[Audit Logs Error]:', error);
		return [];
	}
}
