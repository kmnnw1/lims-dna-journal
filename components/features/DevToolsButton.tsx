'use client';

import { motion, type PanInfo, useAnimation } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * С умной привязкой, исключающей перекрытие индикатора Next.js.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();
	const controls = useAnimation();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);

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

	// Начальная позиция
	useEffect(() => {
		if (isAuthorized) {
			const winWidth = window.innerWidth;
			const winHeight = window.innerHeight;
			const edgePadding = 20;
			const btnSize = 54;
			const logoCorner = getNextLogoCorner();

			// Если логотип в правом нижнем углу (по умолчанию), смещаемся выше
			const initialAvoidance = logoCorner && !logoCorner.isLeft && !logoCorner.isTop ? 75 : 0;

			controls.set({
				x: winWidth - btnSize - edgePadding,
				y: winHeight - btnSize - edgePadding - initialAvoidance,
			});
		}
	}, [isAuthorized, controls, getNextLogoCorner]);

	if (!isAuthorized || isOverlayOpen) return null;

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		setIsDragging(false);
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;
		const btnWidth = buttonRef.current?.offsetWidth || 54;
		const btnHeight = buttonRef.current?.offsetHeight || 54;
		const edgePadding = 20;
		const avoidanceOffset = 75;

		const isLeft = info.point.x < winWidth / 2;
		const isTop = info.point.y < winHeight / 2;
		const logoCorner = getNextLogoCorner();

		let snapX = isLeft ? edgePadding : winWidth - btnWidth - edgePadding;
		let snapY = isTop ? edgePadding : winHeight - btnHeight - edgePadding;

		// Если мы тянем в тот же угол, где сейчас находится логотип Next.js
		if (logoCorner && isLeft === logoCorner.isLeft && isTop === logoCorner.isTop) {
			const distToYEdge = isTop ? info.point.y : winHeight - info.point.y;
			const distToXEdge = isLeft ? info.point.x : winWidth - info.point.x;

			if (distToYEdge < distToXEdge) {
				// Сдвигаемся по горизонтали (дальше от края X)
				snapX = isLeft
					? edgePadding + avoidanceOffset
					: winWidth - btnWidth - edgePadding - avoidanceOffset;
			} else {
				// Сдвигаемся по вертикали (дальше от края Y)
				snapY = isTop
					? edgePadding + avoidanceOffset
					: winHeight - btnHeight - edgePadding - avoidanceOffset;
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
