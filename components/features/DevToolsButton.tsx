'use client';

import { motion, type PanInfo, useAnimation } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * С умной привязкой, исключающей перекрытие индикатора Next.js и FAB.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();
	const controls = useAnimation();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const isInitialized = useRef(false);

	const isAuthorized =
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';

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
		if (isAuthorized && !isInitialized.current) {
			const winWidth = document.documentElement.clientWidth;
			const winHeight = document.documentElement.clientHeight;
			const edgePadding = 24;
			const btnSize = 54;
			const logoCorner = getNextLogoCorner();

			// По умолчанию избегаем правого нижнего угла (там FAB и часто логотип)
			const initialAvoidance = 80;
			const isBRBusy = !logoCorner || (!logoCorner.isLeft && !logoCorner.isTop);

			controls.set({
				x: winWidth - btnSize - edgePadding,
				y: winHeight - btnSize - edgePadding - (isBRBusy ? initialAvoidance : 0),
			});
			isInitialized.current = true;
		}
	}, [isAuthorized, controls, getNextLogoCorner]);

	if (!isAuthorized || isOverlayOpen) return null;

	const handleDragEnd = (_: unknown, info: PanInfo) => {
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
			const avoidanceX = isFABInCorner ? 180 : 80; // FAB шире, логотип уже
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

		controls.start({
			x: snapX,
			y: snapY,
			transition: { type: 'spring', stiffness: 400, damping: 30 },
		});
	};

	return (
		<motion.button
			ref={buttonRef}
			drag
			dragMomentum={false}
			dragElastic={0.1}
			onDragStart={() => setIsDragging(true)}
			onDragEnd={handleDragEnd}
			animate={controls}
			whileHover={{ scale: 1.08 }}
			whileTap={{ scale: 0.94 }}
			onClick={() => {
				if (!isDragging) setOverlayOpen(true);
			}}
			className="fixed z-10000 p-3.5 rounded-full bg-(--md-sys-color-surface-container-highest) text-(--md-sys-color-on-surface-variant) shadow-2xl border border-(--md-sys-color-outline-variant)/50 md-elevation-3 cursor-grab active:cursor-grabbing group overflow-hidden"
			style={{
				touchAction: 'none',
				left: 0,
				top: 0,
			}}
			title="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-(--md-sys-color-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity" />
			<ShieldAlert className="w-5 h-5 text-(--md-sys-color-error) group-hover:rotate-12 transition-transform relative z-10" />
		</motion.button>
	);
}
