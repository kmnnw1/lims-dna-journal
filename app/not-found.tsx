'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/features/ThemeToggle';

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-(--md-sys-color-surface) p-6 text-(--md-sys-color-on-surface)">
			<div className="max-w-md w-full text-center">
				<div className="w-24 h-24 bg-(--md-sys-color-secondary-container) text-(--md-sys-color-on-secondary-container) rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
					<Search className="w-12 h-12" strokeWidth={1.5} />
				</div>
				<h1 className="text-5xl font-light tracking-tight mb-4">404</h1>
				<h2 className="text-2xl font-medium mb-4">Страница не найдена</h2>
				<p className="text-(--md-sys-color-outline) mb-10 text-lg">
					Запрашиваемый ресурс был перемещен или никогда не существовал.
				</p>
				<Link
					href="/"
					className="inline-flex items-center justify-center bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) px-10 py-4 rounded-full font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
				>
					Вернуться в журнал
				</Link>
			</div>

			<ThemeToggle />
		</div>
	);
}
