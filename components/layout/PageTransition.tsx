'use client';

import { motion } from 'framer-motion';

/**
 * Обертка для плавного появления страниц.
 * Использует Framer Motion для staggered-анимации или простого fade-in.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.4,
				ease: [0.22, 1, 0.36, 1], // Плавная экспоненциальная кривая
			}}
		>
			{children}
		</motion.div>
	);
}
