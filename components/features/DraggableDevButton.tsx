'use client';

import { motion, useAnimation } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface DraggableDevButtonProps {
	onClick: () => void;
}

/**
 * A floating, draggable developer button that snaps to screen corners.
 * Optimized for stability to prevent "flying away" by using x/y transforms.
 */
export const DraggableDevButton: React.FC<DraggableDevButtonProps> = ({ onClick }) => {
	const controls = useAnimation();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Initial setup
	useEffect(() => {
		controls.set({ x: 20, y: 20 });
	}, [controls]);

	const handleDragEnd = (_: any, info: any) => {
		setIsDragging(false);
		const winWidth = window.innerWidth;
		const winHeight = window.innerHeight;
		const btnWidth = buttonRef.current?.offsetWidth || 0;
		const btnHeight = buttonRef.current?.offsetHeight || 0;
		const edgePadding = 20;

		// Local coordinates from the drag info
		const currentX = info.offset.x + 20; // 20 is initial x
		const currentY = info.offset.y + 20; // 20 is initial y

		// Snap logic based on absolute screen position
		const snapX = info.point.x < winWidth / 2 ? edgePadding : winWidth - btnWidth - edgePadding;
		const snapY = info.point.y < winHeight / 2 ? edgePadding : winHeight - btnHeight - edgePadding;

		// Convert absolute snap point to relative x/y (since initial is 0,0 for transform but we set 20,20)
		// It's safer to just animate to absolute if we use fixed, but motion x/y are transforms.
		// Let's use left/top for position and x/y for dragging offset? No, that's what broke it.
		// Correct way: use x and y ONLY.
		
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
				if (!isDragging) onClick();
			}}
			className="fixed z-[10000] p-3.5 rounded-full bg-(--md-sys-color-surface-container-highest) text-(--md-sys-color-on-surface-variant) shadow-2xl border border-(--md-sys-color-outline-variant)/50 md-elevation-3 cursor-grab active:cursor-grabbing group overflow-hidden"
			style={{ 
				touchAction: 'none',
				left: 0,
				top: 0
			}}
		>
			<div className="absolute inset-0 bg-(--md-sys-color-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity" />
			<ShieldAlert className="w-5 h-5 text-(--md-sys-color-error) group-hover:rotate-12 transition-transform relative z-10" />
		</motion.button>
	);
};
