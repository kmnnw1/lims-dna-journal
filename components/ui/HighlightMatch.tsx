import { Fragment } from 'react';

/** Экранирует спецсимволы для RegExp, работает безопасно с UTF-16 */
function escapeRegExp(s: string) {
	// Принудительно приводим к строке, чтобы избежать ошибки .replace у undefined
	const safeStr = String(s || '');
	return safeStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Подсвечивает все вхождения query в text.
 * Учтены edge-cases: null/undefined значения из БД, пустые строки, эмодзи.
 */
export function HighlightMatch({
	text,
	query,
}: {
	text: string | null | undefined;
	query: string;
}) {
	// 1. Защита от null/undefined значений, которые теперь приходят из Prisma 7
	const safeText = text || '';
	const q = (query || '').trim();

	if (!q || !safeText) return <>{safeText}</>;

	// 2. Парсим query как слова
	const terms = Array.from(
		new Set(
			q
				.split(/[\s]+/)
				.map((t) => t.trim())
				.filter(Boolean),
		),
	).sort((a, b) => b.length - a.length);

	if (terms.length === 0) return <>{safeText}</>;

	try {
		const pattern = terms.map(escapeRegExp).join('|');
		if (!pattern) return <>{safeText}</>;

		const regex = new RegExp(`(${pattern})`, 'giu');
		const parts = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		while ((match = regex.exec(safeText)) !== null) {
			if (match.index > lastIndex) {
				parts.push(
					<Fragment key={lastIndex}>{safeText.slice(lastIndex, match.index)}</Fragment>,
				);
			}
			parts.push(
				<mark
					key={match.index}
					className="rounded bg-amber-200/90 px-0.5 text-inherit dark:bg-amber-800/60">
					{match[0]}
				</mark>,
			);
			lastIndex = regex.lastIndex;
			if (match.index === regex.lastIndex) regex.lastIndex++;
		}

		if (lastIndex < safeText.length) {
			parts.push(<Fragment key={lastIndex}>{safeText.slice(lastIndex)}</Fragment>);
		}
		return <>{parts}</>;
	} catch (e) {
		console.error('Highlight error:', e);
		return <>{safeText}</>;
	}
}
