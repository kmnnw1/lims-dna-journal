'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Montserrat, Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], variable: '--font-montserrat' });

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ru" className={`${outfit.variable} ${montserrat.variable}`}>
			<body className="antialiased font-sans">
				<div className="min-h-screen flex items-center justify-center p-6 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
					<div className="max-w-md w-full bg-[var(--md-sys-color-surface-container-high)] p-8 rounded-[2.5rem] shadow-2xl border border-[var(--md-sys-color-outline-variant)]/30 text-center shrink-0">
						<div className="w-20 h-20 bg-[var(--md-sys-color-error-container)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
							<AlertTriangle className="w-10 h-10 text-[var(--md-sys-color-on-error-container)]" />
						</div>
						<h1 className="text-3xl font-medium tracking-tight mb-3 font-outfit">
							Что-то пошло не так
						</h1>
						<p className="text-[var(--md-sys-color-on-surface-variant)] mb-8 max-w-sm mx-auto">
							Произошла непредвиденная ошибка приложения. Мы уже работаем над её
							устранением.
						</p>
						<button
							onClick={() => reset()}
							className="inline-flex items-center gap-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-8 py-3.5 rounded-full font-medium hover:opacity-90 transition-all active:scale-95 shadow-md"
						>
							<RotateCcw className="w-5 h-5" />
							<span>Перезагрузить страницу</span>
						</button>
						{error.digest && (
							<p className="text-xs text-[var(--md-sys-color-outline)] mt-6 font-mono opacity-60">
								Error Digest: {error.digest}
							</p>
						)}
					</div>
				</div>
			</body>
		</html>
	);
}
