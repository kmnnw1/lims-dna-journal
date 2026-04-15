/**
 * Transliteration utility for Russian names to Latin
 * Specifically handles Lab-standard patterns and requested overrides.
 */
const charMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

// Common Lab-specific surname overrides
const overrides: Record<string, string> = {
  'тюрин': 'tyurin',
  'баранов': 'baranov',
};

export function transliterate(text: string): string {
  if (!text) return '';
  const lower = text.trim().toLowerCase();
  
  // Check for whole-word overrides first
  if (overrides[lower]) return overrides[lower];
  
  return lower
    .split('')
    .map(char => charMap[char] ?? char)
    .join('')
    .replace(/[^a-z0-9.]/g, ''); // Remove any remaining non-latin chars
}
