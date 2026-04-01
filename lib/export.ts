import type { Specimen } from '@/types';

export const EXPORT_FIELDS: (keyof Specimen)[] = [
  'id', 
  'taxon', 
  'locality', 
  'extrLab', 
  'extrOperator', 
  'extrMethod', 
  'dnaConcentration', 
  'itsStatus', 
  'notes'
];

export const exportToCsv = (data: Specimen[]) => {
  const headers = EXPORT_FIELDS;
  
  const esc = (v: unknown) => { 
    const s = v == null ? '' : String(v); 
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; 
  };
  
  const lines = [
    headers.join(';'),
    ...data.map((r) => headers.map((h) => esc(r[h])).join(';'))
  ];
  
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Журнал_проб.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};