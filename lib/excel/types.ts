export type SourceRef = { sheet: string; row: number };

export type ParsedSpecimenRow = {
	id: string;
	taxon: string;
	locality: string;
	collector: string;
	extrLab: string;
	extrOperator: string;
	extrMethod: string;
	extrDateRaw: string;
	extrDate: string | null;
	itsStatus: string;
	itsGb: string;
	ssuStatus: string;
	ssuGb: string;
	lsuStatus: string;
	lsuGb: string;
	mcm7Status: string;
	mcm7Gb: string;
	rpb2Status: string;
	rpb2Gb: string;
	herbarium: string;
	collectionNumber: string;
	accessionNumber: string;
	labNo: string;
	connections: string;
	notes: string;
	_sources?: SourceRef[];
};

export type ColumnBinding = { index: number; rawHeader: string; key: string };
