'use client';

import { animate, motion, type PanInfo, useMotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevSettings } from './DevSettingsProvider';

/**
 * Плавающая кнопка вызова инструментов разработчика.
 * С умной привязкой и реакцией на расширение логотипа Next.js.
 * Обеспечивает полную свободу при перетаскивании (без «сопротивления»).
 */
export function DevToolsButton() {
	const { setOverlayOpen, settings, setAnchorPos } = useDevSettings();
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

		const savedX = localStorage.getItem('lab_journal_dev_btn_x');
		const savedY = localStorage.getItem('lab_journal_dev_btn_y');
		if (savedX !== null && savedY !== null) {
			x.set(Number.parseFloat(savedX));
			y.set(Number.parseFloat(savedY));
			setIsPositioned(true);
		}
	}, [x, y]);

	const getNextLogoCorner = useCallback(() => {
		if (typeof document === 'undefined') return null;
		const portal = document.querySelector('nextjs-portal');
		const indicator = portal?.shadowRoot?.querySelector('#devtools-indicator');
		if (!indicator) return null;

		const rect = indicator.getBoundingClientRect();
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;

		return {
			element: indicator as HTMLElement,
			isLeft: rect.left + rect.width / 2 < winWidth / 2,
			isTop: rect.top + rect.height / 2 < winHeight / 2,
			width: rect.width,
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

	const getFABCorner = useCallback(() => {
		if (typeof document === 'undefined') return null;
		const fab = document.getElementById('main-fab');
		if (!fab) return null;

		const style = window.getComputedStyle(fab);
		if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
			return null;
		}

		const rect = fab.getBoundingClientRect();
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;

		return {
			isLeft: rect.left + rect.width / 2 < winWidth / 2,
			isTop: rect.top + rect.height / 2 < winHeight / 2,
		};
	}, []);

	const calculateSnapPoint = useCallback(
		(currentX: number, currentY: number) => {
			const winWidth = window.innerWidth;
			const winHeight = window.innerHeight;
			const btnWidth = buttonRef.current?.offsetWidth || 40;
			const btnHeight = buttonRef.current?.offsetHeight || 40;
			const edgePadding = 24;

			const isLeft = currentX < winWidth / 2;
			const isTop = currentY < winHeight / 2;

			const logoCorner = getNextLogoCorner();
			const themeCorner = getThemeToggleCorner();
			const fabCorner = getFABCorner();

			const isLogoInCorner =
				!settings.hideNextIndicator &&
				logoCorner &&
				isLeft === logoCorner.isLeft &&
				isTop === logoCorner.isTop;

			const isThemeInCorner =
				themeCorner && isLeft === themeCorner.isLeft && isTop === themeCorner.isTop;

			const isFabInCorner =
				fabCorner && isLeft === fabCorner.isLeft && isTop === fabCorner.isTop;

			let snapX = isLeft ? edgePadding : winWidth - btnWidth - edgePadding;
			let snapY = isTop ? edgePadding : winHeight - btnHeight - edgePadding;

			if (isLogoInCorner || isThemeInCorner || isFabInCorner) {
				let avoidanceX = 48;
				let avoidanceY = 48;

				if (isFabInCorner) {
					avoidanceX = 185;
					avoidanceY = 76; // Чуть ближе (золотая середина)
				}

				if (isLogoInCorner && logoCorner && logoCorner.width > 50) {
					avoidanceX = Math.max(avoidanceX, logoCorner.width + 12);
				}

				const distToYEdge = isTop ? currentY : winHeight - currentY;
				const distToXEdge = isLeft ? currentX : winWidth - currentX;

				if (distToXEdge < distToYEdge) {
					snapY = isTop
						? edgePadding + avoidanceY
						: winHeight - btnHeight - edgePadding - avoidanceY;
				} else {
					snapX = isLeft
						? edgePadding + avoidanceX
						: winWidth - btnWidth - edgePadding - avoidanceX;
				}
			}

			return { snapX, snapY };
		},
		[getNextLogoCorner, getThemeToggleCorner, getFABCorner, settings.hideNextIndicator],
	);

	// Элегантное слежение за расширением логотипа через ResizeObserver
	useEffect(() => {
		if (!isAuthorized || !isPositioned || isDragging) return;

		const logo = getNextLogoCorner();
		if (!logo?.element) return;

		const observer = new ResizeObserver(() => {
			const { snapX, snapY } = calculateSnapPoint(x.get(), y.get());
			if (Math.abs(snapX - x.get()) > 1 || Math.abs(snapY - y.get()) > 1) {
				animate(x, snapX, { type: 'spring', stiffness: 400, damping: 30 });
				animate(y, snapY, { type: 'spring', stiffness: 400, damping: 30 });
			}
		});

		observer.observe(logo.element);
		return () => observer.disconnect();
	}, [isAuthorized, isPositioned, isDragging, calculateSnapPoint, x, y, getNextLogoCorner]);

	// Реакция на изменение настроек или появление элементов (FAB, темы)
	useEffect(() => {
		if (!isAuthorized || !isPositioned || isDragging) return;
		const { snapX, snapY } = calculateSnapPoint(x.get(), y.get());
		if (Math.abs(snapX - x.get()) > 5 || Math.abs(snapY - y.get()) > 5) {
			animate(x, snapX, { type: 'spring', stiffness: 400, damping: 30 });
			animate(y, snapY, { type: 'spring', stiffness: 400, damping: 30 });
		}
	}, [
		isAuthorized,
		isPositioned,
		isDragging,
		calculateSnapPoint,
		x,
		y,
		settings.hideNextIndicator,
		settings.visibility.fab,
	]);

	useEffect(() => {
		if (!isAuthorized || isPositioned) return;

		const loadPosition = () => {
			const { snapX, snapY } = calculateSnapPoint(window.innerWidth, window.innerHeight);
			x.set(snapX);
			y.set(snapY);
			setIsPositioned(true);
		};

		const timer = setTimeout(loadPosition, 50);
		return () => clearTimeout(timer);
	}, [isAuthorized, isPositioned, x, y, calculateSnapPoint]);

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
			const { snapX, snapY } = calculateSnapPoint(info.point.x, info.point.y);

			animate(x, snapX, { type: 'spring', stiffness: 400, damping: 30 });
			animate(y, snapY, { type: 'spring', stiffness: 400, damping: 30 });

			localStorage.setItem('lab_journal_dev_btn_x', snapX.toString());
			localStorage.setItem('lab_journal_dev_btn_y', snapY.toString());
		},
		[x, y, calculateSnapPoint],
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
				opacity: isPositioned ? 1 : 0,
				scale: isPositioned ? 1 : 0.5,
			}}
			style={{
				x,
				y,
				touchAction: 'none',
				position: 'fixed',
				left: 0,
				top: 0,
				zIndex: 9999,
				pointerEvents: 'auto',
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
