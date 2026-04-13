'use client';

import Link from 'next/link';
import { Search, Plus, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { AnimatedFlask } from '@/components/ui/AnimatedFlask';

interface JournalHeaderProps {
	userName: string;
	searchQuery: string;
	setSearchQuery: (val: string) => void;
	onAddClick: () => void;
	onSignOut: () => void;
	isDark: boolean;
	setIsDark: (val: boolean) => void;
}

export function JournalHeader({
	userName,
	searchQuery,
	setSearchQuery,
	onAddClick,
	onSignOut,
	isDark,
	setIsDark,
}: JournalHeaderProps) {
	return (
		<header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
			<div className="flex items-center gap-6">
				<AnimatedFlask />
				<div className="flex flex-col">
					<h1 className="md-typescale-headline-medium tracking-tight text-[var(--md-sys-color-primary)]">Журнал Проб</h1>
					<p className="md-typescale-label-medium text-[var(--md-sys-color-outline)]">
						Доступ: <span className="text-[var(--md-sys-color-on-surface-variant)]">{userName}</span>
					</p>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
				<div className="relative flex-1 xl:w-80 group">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--md-sys-color-outline)] group-focus-within:text-[var(--md-sys-color-primary)] transition-colors" />
					<input
						type="text"
						placeholder="Поиск по ID или таксону..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-12 pr-4 py-3.5 bg-[var(--md-sys-color-surface-container-high)] rounded-full outline-none text-base placeholder:text-[var(--md-sys-color-outline)] transition-all border-2 border-transparent focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface)]"
					/>
				</div>

				{/* Кнопка смены темы */}
				<button
					onClick={() => setIsDark(!isDark)}
					title="Тема"
					className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 rounded-full transition-all flex items-center justify-center md-state-layer">
					{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
				</button>

				{/* Кнопка "Новая проба" */}
				<button
					onClick={onAddClick}
					className="flex items-center gap-2 px-6 py-3.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] md-elevation-1 hover:md-elevation-2 rounded-[1.25rem] transition-all font-medium active:scale-95 md-state-layer">
					<Plus className="w-6 h-6" />
					<span className="hidden sm:inline">Новая проба</span>
				</button>

				{/* Кнопка "Админ" */}
				<Link
					href="/admin"
					className="flex items-center gap-2 px-5 py-3.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] rounded-[1.25rem] transition-all font-medium md-state-layer">
					<Settings className="w-5 h-5" />
					<span className="hidden sm:inline">Админ</span>
				</Link>

				{/* Кнопка "Выход" */}
				<button
					onClick={onSignOut}
					title="Выйти"
					className="p-3.5 bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] md-elevation-1 hover:md-elevation-2 hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-all flex items-center justify-center md-state-layer">
					<LogOut className="w-5 h-5" />
				</button>
			</div>
		</header>
	);
}
