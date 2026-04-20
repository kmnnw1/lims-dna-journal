import { prisma } from '@/lib/database/prisma';
import { clearCache, getCached, setCache } from '@/lib/utilities/cache';

export {
	type ApiUser,
	handleError,
	invalidateSpecimenCaches,
	requireRole,
} from '@/lib/api/helpers';

// Создание cache key на основе параметров запроса
export function buildCacheKey(params: Record<string, unknown>) {
	return `specimens:${JSON.stringify(params)}`;
}

// Централизованная сборка фильтров для Prisma
export function buildSpecimenQuery(params: {
	search?: string;
	filterType?: string;
	operator?: string;
	minConc?: number | null;
	maxConc?: number | null;
}) {
	const where: Record<string, unknown> = { deletedAt: null };

	if (params.search) {
		where.OR = [
			{ id: { contains: params.search } },
			{ taxon: { contains: params.search } },
			{ locality: { contains: params.search } },
			{ extrOperator: { contains: params.search } },
			{ extrLab: { contains: params.search } },
			{ extrMethod: { contains: params.search } },
			{ notes: { contains: params.search } },
			{ itsStatus: { contains: params.search } },
		];
	}

	if (params.filterType === 'success') where.itsStatus = '✓';
	if (params.filterType === 'error') where.itsStatus = '✕';

	if (params.operator) where.extrOperator = params.operator;

	// Фильтрация по концентрации (ТЕПЕРЬ НА УРОВНЕ БД, ТАК КАК ТИП FLOAT)
	if (params.minConc !== null || params.maxConc !== null) {
		const dnaConc: Record<string, number> = {};
		if (params.minConc !== null) dnaConc.gte = params.minConc as number;
		if (params.maxConc !== null) dnaConc.lte = params.maxConc as number;
		where.dnaConcentration = dnaConc;
	}

	return where;
}

export { getCached, setCache };
