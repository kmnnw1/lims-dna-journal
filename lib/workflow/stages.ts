export const OPERATION_STAGES = [
	'PREP',
	'EXTRACTION',
	'DNA_MEASUREMENT',
	'AMPLIFICATION',
	'CLEANUP',
	'SEQUENCING',
] as const;

export type OperationStage = (typeof OPERATION_STAGES)[number];

export function isOperationStage(value: string | null | undefined): value is OperationStage {
	if (!value) return false;
	return (OPERATION_STAGES as readonly string[]).includes(value);
}
