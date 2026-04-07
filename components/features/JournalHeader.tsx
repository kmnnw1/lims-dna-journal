'use client';

import Link from 'next/link';
import { Search, Plus, Settings, LogOut, Moon, Sun, Keyboard, Filter } from 'lucide-react';

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
	<div className="flex items-center gap-5">
		<div className="w-14 h-14 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-[1.25rem] shadow-sm flex items-center justify-center text-2xl font-black">
			ДНК
		</div>
		<div>
			<h1 className="text-3xl md:text-4xl font-normal tracking-tight">Журнал Проб</h1>
			<p className="text-[var(--md-sys-color-outline)] text-sm font-medium mt-1">
				Доступ: {userName}
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

		{/* Кнопка смены темы — белый фон, тень */}
		<button
			onClick={() => setIsDark(!isDark)}
			title="Тема"
			className="p-3.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm hover:shadow-md rounded-full transition-all flex items-center justify-center">
			{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
		</button>

		{/* Кнопка "Новая проба" — без изменений (акцентная) */}
		<button
			onClick={onAddClick}
			className="flex items-center gap-2 px-5 py-3.5 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] hover:shadow-md rounded-[1rem] transition-all font-medium active:scale-95">
			<Plus className="w-6 h-6" />
			<span className="hidden sm:inline">Новая проба</span>
		</button>

		{/* Кнопка "Админ" — белый фон, тень */}
		<Link
	href="/admin"
	className="flex items-center gap-2 px-4 py-3.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm hover:shadow-md hover:bg-[var(--md-sys-color-error-container)] hover:text-[var(--md-sys-color-on-error-container)] rounded-[1rem] transition-all font-medium">
	<Settings className="w-5 h-5" />
	<span className="hidden sm:inline">Админ</span>
</Link>

{/* Кнопка "Выход" — белый фон, тень, при наведении серый */}
<button
	onClick={onSignOut}
	title="Выйти"
	className="p-3.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm hover:shadow-md hover:bg-[var(--md-sys-color-surface-container-high)] rounded-full transition-all flex items-center justify-center">
	<LogOut className="w-5 h-5" />
</button>
	</div>
</header>
	);
}
