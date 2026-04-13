'use client';

import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

/**
 * AnimatedFlask — Нативная анимация лабораторной колбы на базе Lucide.
 * Использует MD3 Expressive motion (emphasized easing) и CSS-частицы.
 * Заменяет тяжеловесную Lottie-анимацию для повышения производительности и надежности.
 */
export function AnimatedFlask() {
	const [isActive, setIsActive] = useState(false);

	const trigger = () => {
		setIsActive(true);
		setTimeout(() => setIsActive(false), 1000);
	};

	return (
		<div
			onMouseEnter={trigger}
			onTouchStart={trigger}
			onClick={trigger}
			className="cursor-pointer inline-flex select-none relative group"
			title="ДНК Лабораторный Журнал"
		>
			<div className={`relative transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${isActive ? 'scale-110 -rotate-12' : 'scale-100 rotate-0'}`}>
				<FlaskConical 
					size={48} 
					strokeWidth={1.5}
					className={`transition-colors duration-300 ${isActive ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-on-surface)]'}`}
				/>
				
				{/* Пузырьки (только при активации) */}
				{isActive && (
					<div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-12 pointer-events-none">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="absolute bottom-0 left-1/2 w-2 h-2 bg-[var(--md-sys-color-primary)] rounded-full animate-bubble"
								style={{
									left: `${20 + i * 30}%`,
									animationDelay: `${i * 0.2}s`,
									opacity: 0.6
								}}
							/>
						))}
					</div>
				)}
			</div>
			
			{/* Декоративная подложка */}
			<div className="absolute inset-[-8px] bg-[var(--md-sys-color-primary-container)] opacity-0 group-hover:opacity-20 rounded-[1.25rem] transition-opacity duration-300 -z-10" />
		</div>
	);
}