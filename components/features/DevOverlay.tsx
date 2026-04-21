'use client';

import { motion } from 'framer-motion';
import {
	Activity,
	Check,
	Cpu,
	Eye,
	EyeOff,
	Gauge,
	LogIn,
	ShieldAlert,
	Smartphone,
	Sparkles,
	X,
	Zap,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import React, { useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Оверлей инструментов разработчика (переведено на русский)
 * Убраны iOS-слайдеры, заменены на чистые MD3-контролы.
 */
export const DevOverlay: React.FC = () => {
	const { settings, updateSettings, isOverlayOpen, setOverlayOpen } = useDevSettings();
	const { data: session } = useSession();
	const [isBypassing, setIsBypassing] = useState(false);
	const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'EDITOR' | 'READER'>('ADMIN');

	const currentRole = (session?.user as { role?: string })?.role;
	const isAuthenticated = !!session;

	// Доступ ограничен для Павла и Asus
	const isAuthorized =
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';

	if (!isOverlayOpen || !isAuthorized) return null;

	const toggle = (key: keyof typeof settings) => {
		updateSettings({ ...settings, [key]: !settings[key] });
	};

	const handleBypassLogin = async () => {
		setIsBypassing(true);
		try {
			await signIn('credentials', {
				token: 'test-token-123',
				role: selectedRole,
				redirect: true,
				callbackUrl: '/',
			});
		} catch (error) {
			console.error('Ошибка байпаса логина:', error);
		} finally {
			setIsBypassing(false);
			setOverlayOpen(false);
		}
	};

	const roles = [
		{ id: 'ADMIN', label: 'Администратор', color: 'bg-(--md-sys-color-primary)' },
		{ id: 'EDITOR', label: 'Редактор', color: 'bg-(--md-sys-color-secondary)' },
		{ id: 'READER', label: 'Читатель', color: 'bg-(--md-sys-color-tertiary)' },
	] as const;

	return (
		<div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
				onClick={() => setOverlayOpen(false)}
			/>

			{/* Modal Panel */}
			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				className="relative w-full max-w-sm max-h-[85vh] bg-(--md-sys-color-surface-container-high) rounded-4xl shadow-2xl overflow-hidden flex flex-col"
			>
				{/* Header */}
				<div className="shrink-0 p-4 pb-3 border-b border-(--md-sys-color-outline-variant)/10 flex flex-col items-center">
					<div className="p-2 rounded-xl bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container) mb-2">
						<ShieldAlert className="w-6 h-6" />
					</div>
					<h2 className="text-lg font-black text-(--md-sys-color-on-surface) tracking-tight">
						Dev Tools
					</h2>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-none">
					{/* Role Selection */}
					<div className="space-y-2">
						<label className="text-[10px] font-bold uppercase tracking-wider text-(--md-sys-color-outline) opacity-70 ml-1">
							Выберите полномочия
						</label>
						<div className="flex gap-2">
							{roles.map((role) => (
								<button
									key={role.id}
									onClick={() => setSelectedRole(role.id)}
									className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold transition-all border-2 ${
										selectedRole === role.id
											? `${role.color} text-white border-transparent shadow-md scale-105`
											: 'bg-(--md-sys-color-surface-container-lowest) border-(--md-sys-color-outline-variant)/30 text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
									}`}
								>
									{role.label}
								</button>
							))}
						</div>
					</div>

					{/* Bypass Login Button */}
					<button
						onClick={handleBypassLogin}
						disabled={isBypassing}
						className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl md-elevation-1 hover:md-elevation-2 active:scale-95 transition-all disabled:opacity-50 ${
							isAuthenticated
								? 'bg-(--md-sys-color-tertiary-container) text-(--md-sys-color-on-tertiary-container)'
								: 'bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary)'
						}`}
					>
						<LogIn className={`w-5 h-5 ${isBypassing ? 'animate-pulse' : ''}`} />
						<div className="text-left">
							<h3 className="font-bold text-sm">
								{isAuthenticated ? 'Сменить права' : 'Зайти без логина'}
							</h3>
							<p className="text-[10px] opacity-80">
								{isAuthenticated
									? `Текущая роль: ${currentRole}`
									: 'Авторизация по тест-токену'}
							</p>
						</div>
					</button>

					<div className="h-px bg-(--md-sys-color-outline-variant)/10 my-2" />

					{/* Toggles */}
					<div className="space-y-3">
						<button
							onClick={() => toggle('enableMobileCards')}
							className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
								settings.enableMobileCards
									? 'bg-(--md-sys-color-primary-container) border-(--md-sys-color-primary)/30 text-(--md-sys-color-on-primary-container)'
									: 'bg-(--md-sys-color-surface-container-low) border-transparent text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
							}`}
						>
							<div className="flex items-center gap-3">
								<Smartphone
									className={`w-5 h-5 ${settings.enableMobileCards ? 'text-(--md-sys-color-primary)' : 'opacity-60'}`}
								/>
								<div className="text-left">
									<h3 className="font-bold text-sm">Мобильные карточки</h3>
									<p className="text-[10px] opacity-60">Экспериментальный вид</p>
								</div>
							</div>
							<div
								className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
									settings.enableMobileCards
										? 'bg-(--md-sys-color-primary) border-(--md-sys-color-primary)'
										: 'border-(--md-sys-color-outline-variant)'
								}`}
							>
								{settings.enableMobileCards && (
									<Check className="w-4 h-4 text-white" strokeWidth={3} />
								)}
							</div>
						</button>

						<button
							onClick={() => toggle('forceDesktopView')}
							className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
								settings.forceDesktopView
									? 'bg-(--md-sys-color-tertiary-container) border-(--md-sys-color-tertiary)/30 text-(--md-sys-color-on-tertiary-container)'
									: 'bg-(--md-sys-color-surface-container-low) border-transparent text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
							}`}
						>
							<div className="flex items-center gap-3">
								<Cpu
									className={`w-5 h-5 ${settings.forceDesktopView ? 'text-(--md-sys-color-tertiary)' : 'opacity-60'}`}
								/>
								<div className="text-left">
									<h3 className="font-bold text-sm">Принудительно ПК</h3>
									<p className="text-[10px] opacity-60">
										Игнорировать тип устройства
									</p>
								</div>
							</div>
							<div
								className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
									settings.forceDesktopView
										? 'bg-(--md-sys-color-tertiary) border-(--md-sys-color-tertiary)'
										: 'border-(--md-sys-color-outline-variant)'
								}`}
							>
								{settings.forceDesktopView && (
									<Check className="w-4 h-4 text-white" strokeWidth={3} />
								)}
							</div>
						</button>

						<button
							onClick={() => toggle('forceMobileView')}
							className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
								settings.forceMobileView
									? 'bg-(--md-sys-color-secondary-container) border-(--md-sys-color-secondary)/30 text-(--md-sys-color-on-secondary-container)'
									: 'bg-(--md-sys-color-surface-container-low) border-transparent text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
							}`}
						>
							<div className="flex items-center gap-3">
								<Zap
									className={`w-5 h-5 ${settings.forceMobileView ? 'text-(--md-sys-color-secondary)' : 'opacity-60'}`}
								/>
								<div className="text-left">
									<h3 className="font-bold text-sm">Принудительно Мобильный</h3>
									<p className="text-[10px] opacity-60">
										Эмуляция телефона на ПК
									</p>
								</div>
							</div>
							<div
								className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
									settings.forceMobileView
										? 'bg-(--md-sys-color-secondary) border-(--md-sys-color-secondary)'
										: 'border-(--md-sys-color-outline-variant)'
								}`}
							>
								{settings.forceMobileView && (
									<Check className="w-4 h-4 text-white" strokeWidth={3} />
								)}
							</div>
						</button>

						<div className="h-px bg-(--md-sys-color-outline-variant)/10 my-1" />

						{/* Gemini AI Toggle */}
						<button
							onClick={() => toggle('useAI')}
							className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
								settings.useAI
									? 'bg-(--md-sys-color-primary-container) border-(--md-sys-color-primary)/30 text-(--md-sys-color-on-primary-container)'
									: 'bg-(--md-sys-color-surface-container-low) border-transparent text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
							}`}
						>
							<div className="flex items-center gap-3">
								<Sparkles
									className={`w-5 h-5 ${settings.useAI ? 'text-(--md-sys-color-primary)' : 'opacity-60'}`}
								/>
								<div className="text-left">
									<h3 className="font-bold text-sm">Gemini AI (Очистка)</h3>
									<p className="text-[10px] opacity-60">
										Использовать при импорте
									</p>
								</div>
							</div>
							<div
								className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
									settings.useAI
										? 'bg-(--md-sys-color-primary) border-(--md-sys-color-primary)'
										: 'border-(--md-sys-color-outline-variant)'
								}`}
							>
								{settings.useAI && (
									<Check className="w-4 h-4 text-white" strokeWidth={3} />
								)}
							</div>
						</button>

						{/* Next.js Indicator Toggle */}
						<button
							onClick={() => toggle('hideNextIndicator')}
							className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
								settings.hideNextIndicator
									? 'bg-(--md-sys-color-error-container) border-(--md-sys-color-error)/30 text-(--md-sys-color-on-error-container)'
									: 'bg-(--md-sys-color-surface-container-low) border-transparent text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-surface-container-highest)'
							}`}
						>
							<div className="flex items-center gap-3">
								<Activity
									className={`w-5 h-5 ${settings.hideNextIndicator ? 'text-(--md-sys-color-error)' : 'opacity-60'}`}
								/>
								<div className="text-left">
									<h3 className="font-bold text-sm">Скрыть индикатор Next.js</h3>
									<p className="text-[10px] opacity-60">Только в dev-режиме</p>
								</div>
							</div>
							<div
								className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
									settings.hideNextIndicator
										? 'bg-(--md-sys-color-error) border-(--md-sys-color-error)'
										: 'border-(--md-sys-color-outline-variant)'
								}`}
							>
								{settings.hideNextIndicator && (
									<Check className="w-4 h-4 text-white" strokeWidth={3} />
								)}
							</div>
						</button>

						{/* Animation Speed Slider */}
						<div className="p-4 bg-(--md-sys-color-surface-container-low) rounded-2xl space-y-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<Gauge className="w-5 h-5 opacity-60" />
									<h3 className="font-bold text-sm text-(--md-sys-color-on-surface-variant)">
										Скорость анимаций
									</h3>
								</div>
								<span className="text-xs font-mono bg-(--md-sys-color-primary-container) px-2 py-0.5 rounded-full text-(--md-sys-color-primary)">
									{settings.animationSpeed.toFixed(1)}x
								</span>
							</div>
							<input
								type="range"
								min="0.1"
								max="2"
								step="0.1"
								value={settings.animationSpeed}
								onChange={(e) =>
									updateSettings({
										...settings,
										animationSpeed: Number.parseFloat(e.target.value),
									})
								}
								className="w-full h-1.5 bg-(--md-sys-color-outline-variant) rounded-lg appearance-none cursor-pointer accent-(--md-sys-color-primary)"
							/>
						</div>

						{/* Element Visibility Section */}
						<div className="space-y-3 pt-2">
							<div className="flex items-center gap-2 px-1">
								<Eye className="w-4 h-4 opacity-60" />
								<h3 className="text-[10px] font-bold uppercase tracking-wider text-(--md-sys-color-outline)">
									Видимость элементов
								</h3>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{(
									Object.keys(settings.visibility) as Array<
										keyof typeof settings.visibility
									>
								).map((key) => {
									const isVisible = settings.visibility[key];
									const labels: Record<string, string> = {
										header: 'Шапка',
										stats: 'Статистика',
										filters: 'Фильтры',
										table: 'Таблица',
										fab: 'Кнопка +',
									};
									return (
										<button
											key={key}
											onClick={() =>
												updateSettings({
													...settings,
													visibility: {
														...settings.visibility,
														[key]: !isVisible,
													},
												})
											}
											className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
												isVisible
													? 'bg-(--md-sys-color-surface-container-highest) border-transparent text-(--md-sys-color-on-surface)'
													: 'bg-(--md-sys-color-error-container)/10 border-(--md-sys-color-error)/20 text-(--md-sys-color-error) opacity-80'
											}`}
										>
											{isVisible ? (
												<Eye className="w-3.5 h-3.5 shrink-0" />
											) : (
												<EyeOff className="w-3.5 h-3.5 shrink-0" />
											)}
											<span className="text-xs font-bold truncate">
												{labels[key] || key}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					</div>

					<div className="pt-4 border-t border-(--md-sys-color-outline-variant)/10 flex justify-center">
						<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--md-sys-color-primary-container)/30 text-[10px] font-bold text-(--md-sys-color-primary) uppercase tracking-widest">
							<Zap className="w-3 h-3" />
							Бета-режим активен
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="shrink-0 p-4 pt-2 border-t border-(--md-sys-color-outline-variant)/10 flex justify-center bg-(--md-sys-color-surface-container-high)">
					<button
						onClick={() => setOverlayOpen(false)}
						className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) shadow-lg hover:shadow-xl active:scale-95 transition-all"
					>
						<X className="w-4 h-4" /> Закрыть
					</button>
				</div>
			</motion.div>
		</div>
	);
};
