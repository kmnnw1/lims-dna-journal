import { specimens } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';
import { and, or, like, eq, gte, lte, sql } from 'drizzle-orm';

/**
 * Высокопроизводительный построитель запросов для Drizzle.
 * Прямое отображение параметров запроса в SQL.
 */
export function buildDrizzleQuery(params: {
	search?: string;
	filterType?: string;
	operator?: string;
	minConc?: number | null;
	maxConc?: number | null;
}) {
	const conditions = [eq(specimens.deletedAt, null as any)];

	if (params.search) {
		const s = `%${params.search}%`;
		conditions.push(or(
			like(specimens.id, s),
			like(specimens.taxon, s),
			like(specimens.locality, s),
			like(specimens.extrOperator, s),
			like(specimens.extrLab, s),
			like(specimens.extrMethod, s),
			like(specimens.notes, s),
			like(specimens.itsStatus, s)
		) as any);
	}

	if (params.filterType === 'success') conditions.push(eq(specimens.itsStatus, '✓'));
	if (params.filterType === 'error') conditions.push(eq(specimens.itsStatus, '✕'));
	
	if (params.operator) conditions.push(eq(specimens.extrOperator, params.operator));

	if (params.minConc !== null) conditions.push(gte(specimens.dnaConcentration, params.minConc));
	if (params.maxConc !== null) conditions.push(lte(specimens.dnaConcentration, params.maxConc));

	return and(...conditions);
}

export async function getDrizzleDistinctFields() {
	const labs = await db.selectDistinct({ val: specimens.extrLab }).from(specimens).where(eq(specimens.deletedAt, null as any));
	const operators = await db.selectDistinct({ val: specimens.extrOperator }).from(specimens).where(eq(specimens.deletedAt, null as any));
	const methods = await db.selectDistinct({ val: specimens.extrMethod }).from(specimens).where(eq(specimens.deletedAt, null as any));

	return {
		labs: labs.map(n => n.val).filter(Boolean) as string[],
		operators: operators.map(o => o.val).filter(Boolean) as string[],
		methods: methods.map(m => m.val).filter(Boolean) as string[],
	};
}
