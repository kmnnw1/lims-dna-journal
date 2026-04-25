'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
	Activity,
	BarChart3,
	Check,
	Cpu,
	Database,
	Eye,
	EyeOff,
	Filter,
	Gauge,
	LayoutTemplate,
	LogIn,
	PlusCircle,
	Settings2,
	ShieldAlert,
	Smartphone,
	Sparkles,
	Table,
	X,
	Zap,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import pkg from '../../package.json';
import { useDevSettings } from './DevSettingsProvider';

/**
 * DevOverlay (Vercel/Next.js Style Popover)
 * Компактное меню инструментов, открывающееся рядом с кнопкой.
 * Стиль: 1-в-1 как Next.js Dev Tools (Glassmorphism, Dark, Compact).
 */
export const DevOverlay: React.FC = () => {
	const { settings, updateSettings, isOverlayOpen, setOverlayOpen, anchorPos } = useDevSettings();
	const { data: session } = useSession();
	const [_isBypassing, setIsBypassing] = useState(false);
	const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'EDITOR' | 'READER'>('ADMIN');

	const currentRole = (session?.user as { role?: string })?.role;
	const isAuthenticated = !!session;

	// Синхронизация выбранной роли с localStorage и текущей сессией
	useEffect(() => {
		const savedRole = localStorage.getItem('lab_journal_dev_selected_role');
		if (savedRole) {
			setSelectedRole(savedRole as 'ADMIN' | 'EDITOR' | 'READER');
		} else if (currentRole) {
			const mappedRole =
				currentRole === 'ADMIN' ? 'ADMIN' : currentRole === 'EDITOR' ? 'EDITOR' : 'READER';
			setSelectedRole(mappedRole);
		}
	}, [currentRole]);

	const handleSetRole = (role: 'ADMIN' | 'EDITOR' | 'READER') => {
		setSelectedRole(role);
		localStorage.setItem('lab_journal_dev_selected_role', role);
	};
	const containerRef = useRef<HTMLDivElement>(null);

	// Закрытие при клике вне
	useEffect(() => {
		if (!isOverlayOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOverlayOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOverlayOpen, setOverlayOpen]);

	const toggle = (key: keyof typeof settings) => {
		updateSettings({ ...settings, [key]: !settings[key] });
	};

	const handleBypassLogin = async () => {
		setIsBypassing(true);
		try {
			await signIn('credentials', {
				token: process.env.NEXT_PUBLIC_AUTH_TEST_TOKEN || 'test-token-bypass',
				role: selectedRole,
				redirect: true,
				callbackUrl: '/',
			});
		} catch (error) {
			console.error('Bypass error:', error);
		} finally {
			setIsBypassing(false);
			setOverlayOpen(false);
		}
	};

	// Определение направления открытия (вверх или вниз)
	const isBottom = anchorPos.y > (typeof window !== 'undefined' ? window.innerHeight / 2 : 500);
	const isRight = anchorPos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 500);

	return (
		<AnimatePresence>
			{isOverlayOpen && (
				<motion.div
					ref={containerRef}
					initial={{ opacity: 0, scale: 0.9, y: isBottom ? 20 : -20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.9, y: isBottom ? 20 : -20 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					style={{
						position: 'fixed',
						left: isRight ? 'auto' : anchorPos.x,
						right: isRight
							? typeof window !== 'undefined'
								? window.innerWidth - anchorPos.x - 40 // Align with button right edge
								: 24
							: 'auto',
						top: isBottom ? 'auto' : anchorPos.y + 48, // Slightly below button
						bottom: isBottom
							? typeof window !== 'undefined'
								? window.innerHeight - anchorPos.y + 8 // Slightly above button
								: 80
							: 'auto',
					}}
					className="z-9999 w-[320px] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
				>
					{/* Header - Compact */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
						<div className="flex items-center gap-2">
							<Settings2 className="w-4 h-4 text-white/60" />
							<span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
								Dev Tools
							</span>
						</div>
						<button
							onClick={() => setOverlayOpen(false)}
							className="p-1 hover:bg-white/10 rounded-md transition-colors"
						>
							<X className="w-3.5 h-3.5 text-white/40" />
						</button>
					</div>

					{/* Scrollable Content */}
					<div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[60vh] scrollbar-none">
						{/* Быстрые действия (Bypass) */}
						<div className="p-2 space-y-2">
							<div className="grid grid-cols-3 gap-1">
								{['ADMIN', 'EDITOR', 'READER'].map((r) => (
									<button
										key={r}
										onClick={() =>
											handleSetRole(r as 'ADMIN' | 'EDITOR' | 'READER')
										}
										className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
											selectedRole === r
												? 'bg-white/15 border-white/20 text-white'
												: 'bg-white/5 border-transparent text-white/40 hover:text-white/60'
										}`}
									>
										{r === 'ADMIN'
											? 'АДМИН'
											: r === 'EDITOR'
												? 'РЕДАКТОР'
												: 'ГОСТЬ'}
									</button>
								))}
							</div>
							<button
								onClick={handleBypassLogin}
								className="w-full py-2 px-3 bg-white text-black rounded-lg text-[11px] font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2"
							>
								<LogIn className="w-3.5 h-3.5" />
								{isAuthenticated ? 'СМЕНИТЬ РОЛЬ' : 'ЗАЙТИ БЕЗ ЛОГИНА'}
							</button>
							{isAuthenticated && (
								<p className="text-[9px] text-center text-white/30 font-mono">
									АКТИВЕН: {currentRole}
								</p>
							)}
						</div>

						<div className="h-px bg-white/5 mx-2 my-1" />

						{/* Переключатели */}
						<div className="px-2 space-y-0.5">
							{[
								{
									id: 'enableMobileCards',
									label: 'Мобильные карточки',
									icon: Smartphone,
								},
								{ id: 'forceDesktopView', label: 'Режим десктопа', icon: Cpu },
								{ id: 'useAI', label: 'Gemini AI (Очистка)', icon: Sparkles },
								{
									id: 'hideNextIndicator',
									label: 'Скрыть Next.js лого',
									icon: Activity,
								},
							].map((item) => {
								const isOn = settings[item.id as keyof typeof settings];
								return (
									<button
										key={item.id}
										onClick={() => toggle(item.id as keyof typeof settings)}
										className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
									>
										<div className="flex items-center gap-2.5">
											<item.icon
												className={`w-4 h-4 ${isOn ? 'text-blue-400' : 'text-white/30 group-hover:text-white/50'}`}
											/>
											<span
												className={`text-[12px] ${isOn ? 'text-white/90' : 'text-white/50'}`}
											>
												{item.label}
											</span>
										</div>
										{isOn && <Check className="w-3.5 h-3.5 text-blue-400" />}
									</button>
								);
							})}
						</div>

						<div className="h-px bg-white/5 mx-2 my-1" />

						{/* Слайдеры */}
						<div className="px-2 space-y-3 py-2">
							<div className="space-y-1.5">
								<div className="flex justify-between text-[10px] font-mono text-white/40">
									<span>СКОРОСТЬ АНИМАЦИЙ</span>
									<span className="text-white/70">
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
											animationSpeed: parseFloat(e.target.value),
										})
									}
									className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
								/>
							</div>
						</div>

						{/* Настройки видимости */}
						<div className="px-2 space-y-0.5">
							{[
								{ id: 'header', label: 'Шапка', icon: LayoutTemplate },
								{ id: 'stats', label: 'Статистика', icon: BarChart3 },
								{ id: 'filters', label: 'Фильтры', icon: Filter },
								{ id: 'table', label: 'Таблица', icon: Table },
								{ id: 'fab', label: 'Кнопка +', icon: PlusCircle },
								{ id: 'erModel', label: 'ER Модель', icon: Database },
							].map((v) => {
								const isVisible =
									settings.visibility[v.id as keyof typeof settings.visibility];
								return (
									<button
										key={v.id}
										onClick={() => {
											const newVis = {
												...settings.visibility,
												[v.id]: !isVisible,
											};
											updateSettings({ ...settings, visibility: newVis });
										}}
										className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
									>
										<div className="flex items-center gap-2.5">
											<v.icon
												className={`w-4 h-4 ${isVisible ? 'text-blue-400' : 'text-white/30 group-hover:text-white/50'}`}
											/>
											<span
												className={`text-[12px] ${isVisible ? 'text-white/90' : 'text-white/50'}`}
											>
												{v.label}
											</span>
										</div>
										{isVisible ? (
											<Eye className="w-3.5 h-3.5 text-blue-400" />
										) : (
											<EyeOff className="w-3.5 h-3.5 text-white/20" />
										)}
									</button>
								);
							})}
						</div>
					</div>

					<div className="px-4 py-2 border-t border-white/5 flex items-center justify-between bg-black/50">
						<span className="text-[9px] font-mono text-white/20">
							VER. {pkg.version}
						</span>
						<div className="flex items-center gap-1 opacity-20 hover:opacity-50 transition-opacity cursor-default">
							<Zap className="w-2.5 h-2.5" />
							<span className="text-[9px] font-black tracking-tighter italic">
								AG-LIMS
							</span>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
