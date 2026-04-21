'use client';

import { Check, Cpu, LogIn, ShieldAlert, Smartphone, X, Zap } from 'lucide-react';
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
			<div className="relative w-full max-w-sm bg-(--md-sys-color-surface-container-high) rounded-3xl shadow-2xl overflow-hidden border border-(--md-sys-color-outline-variant)/30 animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-4 bg-(--md-sys-color-error-container)/20 border-b border-(--md-sys-color-outline-variant)/20">
					<div className="flex items-center gap-2 text-(--md-sys-color-error)">
						<ShieldAlert className="w-5 h-5" />
						<h2 className="font-bold text-base tracking-tight uppercase">
							Инструменты
						</h2>
					</div>
					<button
						onClick={() => setOverlayOpen(false)}
						className="p-1 rounded-full hover:bg-(--md-sys-color-surface-container-highest) transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="p-6 space-y-5">
					<p className="text-xs text-(--md-sys-color-outline) font-medium italic leading-relaxed">
						Панель инструментов разработчика. Изменения применяются только для вашей
						сессии.
					</p>

					{/* Role Selection */}
					<div className="space-y-3">
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
					</div>

					<div className="pt-4 border-t border-(--md-sys-color-outline-variant)/10 flex justify-center">
						<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-(--md-sys-color-primary-container)/30 text-[10px] font-bold text-(--md-sys-color-primary) uppercase tracking-widest">
							<Zap className="w-3 h-3" />
							Бета-режим активен
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
