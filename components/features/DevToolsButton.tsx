'use client';

import { animate, motion, type PanInfo, useMotionValue } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * С умной привязкой, исключающей перекрытие индикатора Next.js и FAB.
 * Использование MotionValue гарантирует отсутствие «прыжков» (телепортации) при наведении.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen, settings } = useDevSettings();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isPositioned, setIsPositioned] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);

	useEffect(() => {
		setMounted(true);
		const devDevice = localStorage.getItem('lab_journal_dev_authorized') === 'true';
		const devUser =
			process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
			process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';
		const devMode = process.env.NODE_ENV === 'development';

		if (devDevice || devUser || devMode) {
			setIsAuthorized(true);
		}
	}, []);

	const x = useMotionValue(0);
	const y = useMotionValue(0);

	// Поиск логотипа Next.js в Shadow DOM для определения его позиции
	const getNextLogoCorner = useCallback(() => {
		if (typeof document === 'undefined') return null;
		const portal = document.querySelector('nextjs-portal');
		const indicator = portal?.shadowRoot?.querySelector('#devtools-indicator');
		if (!indicator) return null;

		const rect = indicator.getBoundingClientRect();
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;

		return {
			isLeft: rect.left + rect.width / 2 < winWidth / 2,
			isTop: rect.top + rect.height / 2 < winHeight / 2,
		};
	}, []);

	// Установка стабильной начальной позиции
	useEffect(() => {
		if (isAuthorized && !isPositioned) {
			const winWidth = document.documentElement.clientWidth;
			const winHeight = document.documentElement.clientHeight;
			const edgePadding = 24;
			const btnSize = 54;

			// Всегда избегаем правого нижнего угла при старте, так как там находится FAB «Новая проба»
			const initialAvoidance = 80;

			x.set(winWidth - btnSize - edgePadding);
			y.set(winHeight - btnSize - edgePadding - initialAvoidance);
			setIsPositioned(true);
		}
	}, [isAuthorized, isPositioned, x, y]);

	// Скрытие индикатора Next.js
	useEffect(() => {
		if (typeof document === 'undefined') return;
		const portal = document.querySelector('nextjs-portal');
		if (portal) {
			(portal as HTMLElement).style.display = settings.hideNextIndicator ? 'none' : 'block';
		}
	}, [settings.hideNextIndicator]);

	const handleDragEnd = useCallback(
		(_: unknown, info: PanInfo) => {
			setIsDragging(false);
			const winWidth = document.documentElement.clientWidth;
			const winHeight = document.documentElement.clientHeight;
			const btnWidth = buttonRef.current?.offsetWidth || 54;
			const btnHeight = buttonRef.current?.offsetHeight || 54;
			const edgePadding = 24;

			const isLeft = info.point.x < winWidth / 2;
			const isTop = info.point.y < winHeight / 2;
			const logoCorner = getNextLogoCorner();

			let snapX = isLeft ? edgePadding : winWidth - btnWidth - edgePadding;
			let snapY = isTop ? edgePadding : winHeight - btnHeight - edgePadding;

			// Флаг: занят ли текущий угол логотипом или FAB (в случае Bottom-Right)
			const isFABInCorner = !isLeft && !isTop;
			const isLogoInCorner =
				logoCorner && isLeft === logoCorner.isLeft && isTop === logoCorner.isTop;

			if (isFABInCorner || isLogoInCorner) {
				const avoidanceX = isFABInCorner ? 180 : 80;
				const avoidanceY = 80;

				const distToYEdge = isTop ? info.point.y : winHeight - info.point.y;
				const distToXEdge = isLeft ? info.point.x : winWidth - info.point.x;

				if (distToYEdge < distToXEdge) {
					snapX = isLeft
						? edgePadding + avoidanceX
						: winWidth - btnWidth - edgePadding - avoidanceX;
				} else {
					snapY = isTop
						? edgePadding + avoidanceY
						: winHeight - btnHeight - edgePadding - avoidanceY;
				}
			}

			animate(x, snapX, { type: 'spring', stiffness: 400, damping: 30 });
			animate(y, snapY, { type: 'spring', stiffness: 400, damping: 30 });
		},
		[x, y, getNextLogoCorner],
	);

	if (!mounted || !isAuthorized || isOverlayOpen) return null;

	return (
		<motion.button
			ref={buttonRef}
			drag
			dragMomentum={false}
			dragElastic={0.1}
			onDragStart={() => setIsDragging(true)}
			onDragEnd={handleDragEnd}
			initial={{ opacity: 0, scale: 0.5 }}
			animate={{
				opacity: isPositioned ? 1 : 0,
				scale: isPositioned ? 1 : 0.5,
				x: x.get(),
				y: y.get(),
			}}
			style={{ x, y, touchAction: 'none', left: 0, top: 0 }}
			whileHover={{ scale: 1.08 }}
			whileTap={{ scale: 0.94 }}
			type="button"
			onClick={() => {
				if (!isDragging) setOverlayOpen(true);
			}}
			className="w-14 h-14 rounded-2xl bg-(--md-sys-color-error-container) text-(--md-sys-color-on-error-container) shadow-2xl flex items-center justify-center border border-(--md-sys-color-error)/20 cursor-grab active:cursor-grabbing active:scale-90 transition-transform z-[9999]"
			aria-label="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-(--md-sys-color-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity" />
			<ShieldAlert className="w-5 h-5 text-(--md-sys-color-error) group-hover:rotate-12 transition-transform relative z-10" />
		</motion.button>
	);
}
