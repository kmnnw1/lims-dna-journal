import type { Specimen } from '@/types';

/**
 * Порядок и список полей для экспорта.
 * Можно расширять или настраивать состав данных без изменений основной логики.
 */
export const EXPORT_FIELDS: (keyof Specimen)[] = [
  'id',
  'taxon',
  'locality',
  'extrLab',
  'extrOperator',
  'extrMethod',
  'dnaConcentration',
  'itsStatus',
  'notes',
];

/**
 * Экранирует значения для CSV-формата с учётом потенциальных проблем:
 * - Двойные кавычки заменяет на двойные двойные кавычки
 * - Если строка содержит специальный символ (",;\n\r) — оборачивает в кавычки
 */
function escapeCsv(value: unknown): string {
  if (value == null) return '';
  let s = String(value);
  // Уберём спец. символы перевода строки, что часто встречается в notes
  s = s.replace(/\r\n|\r|\n/g, ' ');
  if (/[";\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Формирует CSV-строку для заданного массива Specimen, инициализирует скачать файл.
 * Заголовок ставится всегда первым (включая экспорт пустого массива).
 * - Разделитель: ';' для совместимости с Excel/LibreOffice в RU/UA локалях
 * - Кодировка: UTF-8 BOM для корректного открытия кириллических символов
 * - Имя файла — Журнал_проб_<дата>.csv
 */
export function exportToCsv(data: Specimen[]) {
  const headers = EXPORT_FIELDS;
  const rows = [
    headers, // header row
    ...data.map((item) => headers.map((key) => escapeCsv(item[key]))),
  ];

  // Склеиваем строки — разделитель ; между полями, \n — между строками
  const csvText = rows.map((row) => row.join(';')).join('\n');

  // Формируем имя файла с датой
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const filename = `Журнал_проб_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;

  // Создаём blob с BOM для корректного открытия в Excel
  const blob = new Blob(['\uFEFF' + csvText], { type: 'text/csv;charset=utf-8' });

  // Кроссбраузерная загрузка файла
  if ((window.navigator as any).msSaveOrOpenBlob) {
    // IE/Safari (редко)
    (window.navigator as any).msSaveOrOpenBlob(blob, filename);
  } else {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  }
}
