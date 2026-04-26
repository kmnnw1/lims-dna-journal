'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	variant?: 'default' | 'danger';
}

interface ContextMenuProps {
	x: number;
	y: number;
	items: ContextMenuItem[];
	onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const handleScroll = () => onClose();
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		document.addEventListener('mousedown', handleClickOutside);
		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('keydown', handleKey);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('scroll', handleScroll, true);
			window.removeEventListener('keydown', handleKey);
		};
	}, [onClose]);

	// Корректировка позиции, чтобы меню не уходило за экран
	const adjustedX = typeof window !== 'undefined' && x + 200 > window.innerWidth ? x - 200 : x;
	const adjustedY = typeof window !== 'undefined' && y + 300 > window.innerHeight ? y - 300 : y;

	return (
		<AnimatePresence>
			<motion.div
				ref={menuRef}
				initial={{ opacity: 0, scale: 0.9, y: -10 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: -10 }}
				transition={{ duration: 0.1, ease: 'easeOut' }}
				style={{ top: adjustedY, left: adjustedX }}
				className="fixed z-1000 min-w-[200px] bg-(--md-sys-color-surface-container-lowest) border border-(--md-sys-color-outline-variant)/30 rounded-2xl shadow-2xl py-2 overflow-hidden md-elevation-5"
			>
				{items.map((item, index) => (
					<button
						key={index}
						onClick={(e) => {
							e.stopPropagation();
							item.onClick();
							onClose();
						}}
						className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left
							${
								item.variant === 'danger'
									? 'text-red-500 hover:bg-red-50'
									: 'text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-surface-container-high)'
							}
						`}
					>
						{item.icon && <span className="opacity-70">{item.icon}</span>}
						{item.label}
					</button>
				))}
			</motion.div>
		</AnimatePresence>
	);
};
