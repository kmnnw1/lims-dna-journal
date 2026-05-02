import { and, eq, gte, isNull, like, lte, or, SQL, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle/drizzle';
import { specimens } from '@/lib/db/drizzle/schema';

type WorkflowStage =
	| 'PREP'
	| 'EXTRACTION'
	| 'DNA_MEASUREMENT'
	| 'AMPLIFICATION'
	| 'CLEANUP'
	| 'SEQUENCING'
	| 'TASKS';

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
	stage?: WorkflowStage | null;
	markerCombo?: string[];
	markerCount?: number | null;
}) {
	const conditions = [isNull(specimens.deletedAt)];

	// Фильтрация по этапу — базовая эвристика по существующим полям.
	// Дальше будет уточняться на базе WorkflowOperation/AmplificationTask, но уже сейчас даёт рабочий “вид по этапам”.
	if (params.stage && params.stage !== 'TASKS') {
		if (params.stage === 'PREP') {
			conditions.push(
				and(
					isNull(specimens.extrDate),
					or(
						isNull(specimens.extrDateRaw),
						eq(specimens.extrDateRaw, ''),
					) as unknown as SQL,
					or(isNull(specimens.extrLab), eq(specimens.extrLab, '')) as unknown as SQL,
					or(
						isNull(specimens.extrMethod),
						eq(specimens.extrMethod, ''),
					) as unknown as SQL,
					or(
						isNull(specimens.extrOperator),
						eq(specimens.extrOperator, ''),
					) as unknown as SQL,
				) as unknown as SQL,
			);
		} else if (params.stage === 'EXTRACTION') {
			conditions.push(isNull(specimens.extrDate));
		} else if (params.stage === 'DNA_MEASUREMENT') {
			conditions.push(
				and(
					// есть выделение
					// biome-ignore lint/suspicious/noExplicitAny: Drizzle comparisons can be strict with column types
					or(sql`extrDate IS NOT NULL`, sql`extrDateRaw IS NOT NULL`) as any,
					isNull(specimens.dnaConcentration),
				) as unknown as SQL,
			);
		} else if (params.stage === 'AMPLIFICATION') {
			conditions.push(
				or(
					eq(specimens.itsStatus, '✕'),
					eq(specimens.itsStatus, '?'),
					isNull(specimens.itsStatus),
				) as unknown as SQL,
			);
		} else if (params.stage === 'CLEANUP') {
			conditions.push(
				or(eq(specimens.itsStatus, '✓'), eq(specimens.itsStatus, 'weak')) as unknown as SQL,
			);
		} else if (params.stage === 'SEQUENCING') {
			conditions.push(
				and(
					or(
						eq(specimens.itsStatus, '✓'),
						eq(specimens.itsStatus, 'weak'),
					) as unknown as SQL,
					isNull(specimens.itsGb),
				) as unknown as SQL,
			);
		}
	}

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

	if (params.markerCombo && params.markerCombo.length > 0) {
		const comboSet = new Set(params.markerCombo);
		const markerConditions: SQL[] = [];

		if (comboSet.has('ITS'))
			markerConditions.push(
				sql`coalesce(${specimens.itsStatus}, '') <> ''` as unknown as SQL,
			);
		if (comboSet.has('SSU'))
			markerConditions.push(
				sql`coalesce(${specimens.ssuStatus}, '') <> ''` as unknown as SQL,
			);
		if (comboSet.has('LSU'))
			markerConditions.push(
				sql`coalesce(${specimens.lsuStatus}, '') <> ''` as unknown as SQL,
			);
		if (comboSet.has('RPB2'))
			markerConditions.push(
				sql`coalesce(${specimens.rpb2Status}, '') <> ''` as unknown as SQL,
			);
		if (comboSet.has('MCM7'))
			markerConditions.push(
				sql`coalesce(${specimens.mcm7Status}, '') <> ''` as unknown as SQL,
			);

		if (markerConditions.length > 0) {
			conditions.push(or(...markerConditions) as unknown as SQL);
		}
	}

	if (params.markerCount !== null && params.markerCount !== undefined) {
		conditions.push(
			sql`(
			(case when coalesce(${specimens.itsStatus}, '') <> '' then 1 else 0 end) +
			(case when coalesce(${specimens.ssuStatus}, '') <> '' then 1 else 0 end) +
			(case when coalesce(${specimens.lsuStatus}, '') <> '' then 1 else 0 end) +
			(case when coalesce(${specimens.rpb2Status}, '') <> '' then 1 else 0 end) +
			(case when coalesce(${specimens.mcm7Status}, '') <> '' then 1 else 0 end)
		) = ${params.markerCount}` as unknown as SQL,
		);
	}

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
