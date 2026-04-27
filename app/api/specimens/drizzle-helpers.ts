import { and, eq, gte, isNull, like, lte, or, SQL, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { specimens } from '@/lib/db/schema';

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
	const conditions = [isNull(specimens.deletedAt)];

	if (params.search) {
		const s = `%${params.search}%`;
		conditions.push(
			or(
				like(specimens.id, s),
				like(specimens.taxon, s),
				like(specimens.locality, s),
				like(specimens.extrOperator, s),
				like(specimens.extrLab, s),
				like(specimens.extrMethod, s),
				like(specimens.notes, s),
				like(specimens.itsStatus, s),
			) as unknown as SQL,
		);
	}

	if (params.filterType === 'success') conditions.push(eq(specimens.itsStatus, '✓'));
	if (params.filterType === 'error') {
		conditions.push(
			or(
				eq(specimens.itsStatus, '✕'),
				eq(specimens.itsStatus, '?'),
				isNull(specimens.itsStatus),
			) as unknown as SQL,
		);
	}

	if (params.operator) conditions.push(eq(specimens.extrOperator, params.operator));

	if (params.minConc !== null)
		// biome-ignore lint/suspicious/noExplicitAny: Drizzle comparisons can be strict with column types
		conditions.push(gte(specimens.dnaConcentration as any, params.minConc));
	if (params.maxConc !== null)
		// biome-ignore lint/suspicious/noExplicitAny: Drizzle comparisons can be strict with column types
		conditions.push(lte(specimens.dnaConcentration as any, params.maxConc));

	return and(...conditions);
}

export async function getDrizzleDistinctFields() {
	const labs = await db
		.selectDistinct({ val: specimens.extrLab })
		.from(specimens)
		.where(isNull(specimens.deletedAt));
	const operators = await db
		.selectDistinct({ val: specimens.extrOperator })
		.from(specimens)
		.where(isNull(specimens.deletedAt));
	const methods = await db
		.selectDistinct({ val: specimens.extrMethod })
		.from(specimens)
		.where(isNull(specimens.deletedAt));

	return {
		labs: labs.map((n) => n.val).filter(Boolean) as string[],
		operators: operators.map((o) => o.val).filter(Boolean) as string[],
		methods: methods.map((m) => m.val).filter(Boolean) as string[],
	};
}
