
// ============================================
// ПЦР ПОПЫТКИ
// ============================================

export interface PcrAttempt {
  id: string;
  date: string;
  volume: string;
  result: string;
  marker?: string;
  forwardPrimer?: string;
  reversePrimer?: string;
  dnaMatrix?: string;
}

// ============================================
// ОБРАЗЦЫ (SPECIMEN)
// ============================================

export interface Specimen {
  id: string;
  taxon?: string;
  locality?: string;
  extrLab?: string;
  extrOperator?: string;
  extrMethod?: string;
  extrDateRaw?: string;
  dnaConcentration?: string;
  dnaMeter?: string;
  measOperator?: string;
  measDate?: string;
  notes?: string;
  collector?: string;
  itsStatus?: string;
  ssuStatus?: string;
  lsuStatus?: string;
  mcm7Status?: string;
  attempts?: PcrAttempt[];
}

// ============================================
// ФОРМА НОВОЙ ПРОБЫ
// ============================================

export interface NewRecordForm {
  id: string;
  taxon: string;
  locality: string;
  extrLab: string;
  extrOperator: string;
  extrMethod: string;
  extrDateRaw: string;
}

export const EMPTY_NEW_RECORD: NewRecordForm = {
  id: '',
  taxon: '',
  locality: '',
  extrLab: '',
  extrOperator: '',
  extrMethod: '',
  extrDateRaw: ''
};

// ============================================
// ФОРМА РЕДАКТИРОВАНИЯ
// ============================================

export interface EditSpecimenForm {
  id: string;
  taxon?: string;
  locality?: string;
  extrLab?: string;
  extrOperator?: string;
  extrMethod?: string;
  extrDateRaw?: string;
  dnaConcentration?: string;
  dnaMeter?: string;
  measOperator?: string;
  measDate?: string;
  notes?: string;
  collector?: string;
  itsStatus?: string;
  ssuStatus?: string;
  lsuStatus?: string;
  mcm7Status?: string;
  attempts?: PcrAttempt[];
}

// ============================================
// ФОРМА МАССОВОГО ОБНОВЛЕНИЯ
// ============================================

export interface MassUpdateForm {
  lab: string;
  operator: string;
  method: string;
  dnaConcentration: string;
}

export const EMPTY_MASS_UPDATE: MassUpdateForm = {
  lab: '',
  operator: '',
  method: '',
  dnaConcentration: ''
};

// ============================================
// ФОРМА ПЦР
// ============================================

export interface PcrForm {
  volume: string;
  result: string;
  marker: string;
  forwardPrimer: string;
  reversePrimer: string;
  dnaMatrix: string;
}

export const EMPTY_PCR_FORM: PcrForm = {
  volume: '',
  result: 'Fail',
  marker: '',
  forwardPrimer: '',
  reversePrimer: '',
  dnaMatrix: ''
};

// ============================================
// ПОДСКАЗКИ ДЛЯ ФОРМ
// ============================================

export interface Suggestions {
  labs: string[];
  operators: string[];
  methods: string[];
  taxa?: string[];
}

export const EMPTY_SUGGESTIONS: Suggestions = {
  labs: [],
  operators: [],
  methods: []
};


// ============================================
// СОРТИРОВКА
// ============================================

export type SortableFields = keyof Pick<Specimen, 'id' | 'taxon' | 'extrLab' | 'extrOperator' | 'extrMethod'>;

// ============================================
// СОРТИРОВКА
// ============================================
export type QuickFilter = 'ALL' | 'SUCCESS' | 'ERROR' | 'FAVORITES';


