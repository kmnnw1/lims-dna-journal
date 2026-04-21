'use client';

import { motion, type PanInfo, useAnimation } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * Реализовано перетаскивание с магнитной привязкой к углам экрана.
 */
export function DevToolsButton() {
	const { setOverlayOpen, isOverlayOpen } = useDevSettings();
	const controls = useAnimation();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const isAuthorized =
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
		process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';

	// Установка начальной позиции в правый нижний угол
	useEffect(() => {
		if (isAuthorized) {
			const winWidth = window.innerWidth;
			const winHeight = window.innerHeight;
			const edgePadding = 20;
			const btnSize = 54;
			controls.set({
				x: winWidth - btnSize - edgePadding,
				y: winHeight - btnSize - edgePadding,
			});
		}
	}, [isAuthorized, controls]);

	if (!isAuthorized || isOverlayOpen) return null;

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		setIsDragging(false);
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;
		const btnWidth = buttonRef.current?.offsetWidth || 54;
		const btnHeight = buttonRef.current?.offsetHeight || 54;
		const edgePadding = 20;

		// Логика примагничивания к ближайшему углу
		const snapX = info.point.x < winWidth / 2 ? edgePadding : winWidth - btnWidth - edgePadding;
		const snapY =
			info.point.y < winHeight / 2 ? edgePadding : winHeight - btnHeight - edgePadding;

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
