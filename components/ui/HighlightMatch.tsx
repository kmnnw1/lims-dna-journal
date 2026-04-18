'use client';

import React from 'react';

type Props = {
	text?: string | null;
	query?: string;
};

export function HighlightMatch({ text, query }: Props) {
	if (!text) return null;
	if (!query || !query.trim()) return <>{text}</>;

	// Экранируем спецсимволы в запросе для безопасности регулярного выражения
	const escapeRegExp = (string: string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	};

	const regex = new RegExp(`(${escapeRegExp(query.trim())})`, 'gi');
	const parts = text.split(regex);

	return (
		<>
			{parts.map((part, i) =>
				part.toLowerCase() === query.trim().toLowerCase() ? (
					<mark
						key={i}
						className="bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container) px-1 rounded-md font-bold transition-all shadow-sm"
					>
						{part}
					</mark>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</>
	);
}
