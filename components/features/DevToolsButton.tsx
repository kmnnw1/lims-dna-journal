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
	const { setOverlayOpen, isOverlayOpen, settings, setAnchorPos } = useDevSettings();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isPositioned, setIsPositioned] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	useEffect(() => {
		setMounted(true);
		const devDevice = localStorage.getItem('lab_journal_dev_authorized') === 'true';
		const devUser =
			process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'pavel' ||
			process.env.NEXT_PUBLIC_OS_USER?.toLowerCase() === 'asus';
		const devMode = process.env.NODE_ENV === 'development';

		if (devMode || devDevice || devUser) {
			const hiddenUntil = localStorage.getItem('lab_journal_dev_hidden_until');
			if (hiddenUntil && Date.now() < parseInt(hiddenUntil, 10)) {
				setIsAuthorized(false);
			} else if (!window.location.search.includes('hideDev=true')) {
				setIsAuthorized(true);
			}
		}

		// Инициализируем x и y из localStorage сразу при монтировании (клиентская часть)
		const savedX = localStorage.getItem('lab_journal_dev_btn_x');
		const savedY = localStorage.getItem('lab_journal_dev_btn_y');
		if (savedX !== null && savedY !== null) {
			x.set(Number.parseFloat(savedX));
			y.set(Number.parseFloat(savedY));
			setIsPositioned(true);
		}
	}, [x, y]);

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

	const getThemeToggleCorner = useCallback(() => {
		if (typeof document === 'undefined') return null;
		const toggle = document.getElementById('theme-toggle-button');
		if (!toggle) return null;

		const rect = toggle.getBoundingClientRect();
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;

		return {
			isLeft: rect.left + rect.width / 2 < winWidth / 2,
			isTop: rect.top + rect.height / 2 < winHeight / 2,
		};
	}, []);

	// Установка стабильной начальной позиции, если нет сохраненной
	useEffect(() => {
		if (!isAuthorized || isPositioned) return;

		const loadPosition = () => {
			const winWidth = window.innerWidth;
			const winHeight = window.innerHeight;
			const edgePadding = 24;
			const btnSize = 54;

			const startX = winWidth - btnSize - edgePadding;
			const startY = winHeight - btnSize - edgePadding;

			x.set(startX);
			y.set(startY);
			setIsPositioned(true);
		};

		const timer = setTimeout(loadPosition, 50);
		return () => clearTimeout(timer);
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
			const themeCorner = getThemeToggleCorner();

			let snapX = isLeft ? edgePadding : winWidth - btnWidth - edgePadding;
			let snapY = isTop ? edgePadding : winHeight - btnHeight - edgePadding;

			// Флаг: занят ли текущий угол логотипом или кнопкой темы
			const isLogoInCorner =
				logoCorner && isLeft === logoCorner.isLeft && isTop === logoCorner.isTop;
			const isThemeInCorner =
				themeCorner && isLeft === themeCorner.isLeft && isTop === themeCorner.isTop;

			if (isLogoInCorner || isThemeInCorner) {
				const avoidanceX = 80;
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

			localStorage.setItem('lab_journal_dev_btn_x', snapX.toString());
			localStorage.setItem('lab_journal_dev_btn_y', snapY.toString());
		},
		[x, y, getNextLogoCorner, getThemeToggleCorner],
	);

	if (!mounted || !isAuthorized) return null;

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
				opacity: isPositioned && !isOverlayOpen ? 1 : 0,
				scale: isPositioned && !isOverlayOpen ? 1 : 0.5,
			}}
			style={{
				x,
				y,
				touchAction: 'none',
				position: 'fixed',
				left: 0,
				top: 0,
				zIndex: 9999,
				pointerEvents: isOverlayOpen ? 'none' : 'auto',
			}}
			whileHover={{ scale: 1.08 }}
			whileTap={{ scale: 0.94 }}
			type="button"
			onClick={() => {
				if (!isDragging) {
					setAnchorPos({ x: x.get(), y: y.get() });
					setOverlayOpen(true);
				}
			}}
			className="w-10 h-10 rounded-full bg-black text-white shadow-2xl flex items-center justify-center border border-white/10 cursor-grab z-9999"
			aria-label="Инструменты разработчика"
		>
			<div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
			<svg
				viewBox="0 0 24 24"
				fill="currentColor"
				className="w-5 h-5 transition-transform group-hover:scale-110 relative z-10"
			>
				<path d="M12 4L4 20H20L12 4Z" />
			</svg>
		</motion.button>
	);
}
