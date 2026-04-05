import {Fragment} from 'react';

/** Экранирует спецсимволы для RegExp, работает безопасно с UTF-16 */
function escapeRegExp(s: string) {
	// Экранируем символы RegExp и не разделяем суррогатные пары
	// Иначе emoji и др. символы ломают split при совпадении
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Подсвечивает все вхождения query в text.
 * Учтены edge-cases: пустые строки, вложенные <mark>, эмодзи и спецсимволы.
 */
export function HighlightMatch({text, query}: {text: string; query: string}) {
	const q = query.trim();
	if (!q) return <>{text}</>;
	// Эвристика: парсим query как слова, выделяем каждое из них независимо,
	// но группируем если строка содержит подряд несколько пробелов или спецсимволов
	// Поддержка сложных запросов через разделение по пробелу
	const terms = Array.from(
		new Set(
			q
				.split(/[\s]+/)
				.map((t) => t.trim())
				.filter(Boolean),
		),
	).sort((a, b) => b.length - a.length); // длинные — вперёд

	if (terms.length === 0) return <>{text}</>;
	try {
		// Собираем RegExp вида (слово1|слово2|...|эмодзи)
		const pattern = terms.map(escapeRegExp).join('|');
		// Если пустой паттерн — fallback
		if (!pattern) return <>{text}</>;
		// "gu" — глобально + Unicode-aware
		const regex = new RegExp(`(${pattern})`, 'giu');

		const parts = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				// Нематч-часть
				parts.push(
					<Fragment key={lastIndex}>{text.slice(lastIndex, match.index)}</Fragment>,
				);
			}
			// Совпавший фрагмент — обязательно выделяем
			parts.push(
				<mark
					key={match.index}
					className="rounded bg-amber-200/90 px-0.5 text-inherit dark:bg-amber-800/60"
				>
					{match[0]}
				</mark>,
			);
			// Move lastIndex to end of current match
			lastIndex = regex.lastIndex;
			// prev regex.lastIndex (unicode) может быть некорректен если 0-width match
			if (match.index === regex.lastIndex) regex.lastIndex++;
		}
		if (lastIndex < text.length) {
			// Остаток
			parts.push(<Fragment key={lastIndex}>{text.slice(lastIndex)}</Fragment>);
		}
		return <>{parts}</>;
	} catch {
		// Fallback — безопасно если RegExp не собрался
		return <>{text}</>;
	}
}
