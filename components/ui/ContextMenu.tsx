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
				initial={{ opacity: 0, scale: 0.96, y: 4 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 4 }}
				transition={{ type: 'spring', stiffness: 500, damping: 35 }}
				style={{ top: adjustedY, left: adjustedX }}
				className="fixed z-500 min-w-[180px] bg-(--md-sys-color-surface-container-lowest)/85 backdrop-blur-2xl border border-(--md-sys-color-outline-variant)/20 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-1 overflow-hidden"
			>
				{items.map((item, index) => (
					<button
						key={index}
						onClick={(e) => {
							e.stopPropagation();
							item.onClick();
							onClose();
						}}
						className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-semibold transition-all rounded-lg text-left active:scale-[0.98]
							${
								item.variant === 'danger'
									? 'text-red-500 hover:bg-red-500/10'
									: 'text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-surface-container-highest)'
							}
						`}
					>
						{item.icon && <span className="opacity-60 scale-90">{item.icon}</span>}
						<span className="flex-1">{item.label}</span>
					</button>
				))}
			</motion.div>
		</AnimatePresence>
	);
};
