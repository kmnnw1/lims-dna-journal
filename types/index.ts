
// ========================================
// Типы для ПЦР-попыток
// ========================================

/**
 * Описывает одну попытку постановки ПЦР
 */
export interface PcrAttempt {
  id: string;
  date: string;               // Дата попытки (ISO)
  volume: string;             // Объём (например, "20 мкл")
  result: 'Fail' | 'Success'; // Результат — явно: "Fail" или "Success"
  marker?: string;
  forwardPrimer?: string;
  reversePrimer?: string;
  dnaMatrix?: string;
}

// ========================================
// Типы для образца (Specimen)
// ========================================

/**
 * Основная единица хранения информации о биологическом образце
 */
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
  attempts?: PcrAttempt[]; // Массив попыток ПЦР
}

// ========================================
// Форма создания нового образца
// ========================================

export interface NewRecordForm {
  id: string;
  taxon: string;
  locality: string;
  extrLab: string;
  extrOperator: string;
  extrMethod: string;
  extrDateRaw: string;
}

/** Пустой шаблон формы для удобства сброса */
export const EMPTY_NEW_RECORD: Readonly<NewRecordForm> = {
  id: '',
  taxon: '',
  locality: '',
  extrLab: '',
  extrOperator: '',
  extrMethod: '',
  extrDateRaw: ''
};

// ========================================
// Форма редактирования образца
// ========================================

export type EditSpecimenForm = Partial<Omit<Specimen, 'attempts'>> & Pick<Specimen, 'id'> & {
  attempts?: PcrAttempt[];
};

// ========================================
// Форма массового обновления
// ========================================

/**
 * Для быстрого массового применения параметров к выбранным образцам
 */
export interface MassUpdateForm {
  lab: string;
  operator: string;
  method: string;
  dnaConcentration: string;
}

export const EMPTY_MASS_UPDATE: Readonly<MassUpdateForm> = {
  lab: '',
  operator: '',
  method: '',
  dnaConcentration: ''
};

// ========================================
// Форма ПЦР (ввод новой попытки)
// ========================================

/**
 * Значения новой ПЦР-формы
 */
export interface PcrForm {
  volume: string;
  result: 'Fail' | 'Success'; // Строгая типизация
  marker: string;
  forwardPrimer: string;
  reversePrimer: string;
  dnaMatrix: string;
}

/** Пустое состояние */
export const EMPTY_PCR_FORM: Readonly<PcrForm> = {
  volume: '',
  result: 'Fail',
  marker: '',
  forwardPrimer: '',
  reversePrimer: '',
  dnaMatrix: ''
};

// ========================================
// Подсказки для автозаполнения форм
// ========================================

/**
 * Списки актуальных подсказок для разных полей форм
 */
export interface Suggestions {
  labs: string[];
  operators: string[];
  methods: string[];
  taxa?: string[];
}

export const EMPTY_SUGGESTIONS: Readonly<Suggestions> = {
  labs: [],
  operators: [],
  methods: []
};

// ========================================
// Сортируемые поля таблицы
// ========================================

/** Список допустимых для сортировки полей Specimen */
export type SortableFields =
  | 'id'
  | 'taxon'
  | 'extrLab'
  | 'extrOperator'
  | 'extrMethod';

// ========================================
// Быстрые фильтры для списка образцов
// ========================================

export type QuickFilter = 'ALL' | 'SUCCESS' | 'ERROR' | 'FAVORITES';

