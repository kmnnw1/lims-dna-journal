/**
 * Универсальная утилита транслитерации.
 * Поддерживает как RU -> EN (для экспорта), так и EN -> RU (для умного поиска).
 */

const ruToEn: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
};

const enToRu: Record<string, string> = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'z': 'з', 'i': 'и', 
    'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 
    's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'zh': 'ж', 'ts': 'ц', 'ch': 'ч', 
    'sh': 'ш', 'yu': 'ю', 'ya': 'я'
};

/**
 * Классическая транслитерация RU -> EN
 */
export function transliterate(text: string): string {
    if (!text) return '';
    return text.toLowerCase().split('').map(char => ruToEn[char] ?? char).join('').replace(/[^a-z0-9\s.]/g, '');
}

/**
 * Обратная транслитерация EN -> RU (для поиска)
 */
export function reverseTranslit(text: string): string {
    let res = text.toLowerCase();
    // Сначала длинные комбинации (zh, sh...)
    const longKeys = Object.keys(enToRu).filter(k => k.length > 1).sort((a, b) => b.length - a.length);
    for (const key of longKeys) {
        res = res.replace(new RegExp(key, 'g'), enToRu[key]);
    }
    // Затем одиночные буквы
    for (const key in enToRu) {
        if (key.length === 1) {
            res = res.replace(new RegExp(key, 'g'), enToRu[key]);
        }
    }
    return res;
}

/**
 * Генерирует варианты поисковых запросов (включая транслит)
 */
export function smartSearchTransform(query: string): string[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const variations = [q];
    
    // Если в запросе латиница - пробуем перевести в кириллицу
    if (/[a-z]/.test(q)) {
        const tr = reverseTranslit(q);
        if (tr !== q) variations.push(tr);
        
        // Специфические сокращения
        if (q.includes('davy')) variations.push('давыдов');
        if (q.includes('rpb')) variations.push('рпб');
    }
    
    return Array.from(new Set(variations));
}
