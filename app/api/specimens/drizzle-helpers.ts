import { and, eq, gte, isNull, like, lte, or, type SQL, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { specimens, technicians } from '@/lib/db/schema';
import { smartSearchTransform } from '@/lib/translit';

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
		const variations = smartSearchTransform(params.search);
		const searchFilters = variations.flatMap((v) => {
			const pattern = `%${v}%`;
			return [
				like(specimens.id, pattern),
				like(specimens.taxon, pattern),
				like(specimens.locality, pattern),
				like(specimens.extrOperator, pattern),
				like(specimens.extrLab, pattern),
				like(specimens.extrMethod, pattern),
				like(specimens.notes, pattern),
				like(specimens.itsStatus, pattern),
			];
		});
		conditions.push(or(...searchFilters) as unknown as SQL);
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
		.select({ val: technicians.name })
		.from(technicians)
		.orderBy(technicians.name);
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
