'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Particle = {
	id: number;
	state: 'idle' | 'flying';
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	life: number;
	maxLife: number;
};

export function AnimatedFlask() {
	const [isAnimating, setIsAnimating] = useState(false);
	const _canvasRef = useRef<HTMLCanvasElement>(null);
	const requestRef = useRef<number>(0);

	// Храним частицы в ref, чтобы не дергать React render 60 раз в секунду
	const particles = useRef<Particle[]>([]);
	const nextId = useRef(0);
	const rockRef = useRef(0); // Сила раскачивания 0..1

	// Спавн 1 частицы
	const spawnBubble = useCallback((xPos?: number, state: 'idle' | 'flying' = 'idle') => {
		particles.current.push({
			id: nextId.current++,
			state,
			x: xPos ?? 6 + Math.random() * 12,
			y: 12 + Math.random() * 8,
			vx: (Math.random() - 0.5) * 4,
			vy: state === 'flying' ? -15 - Math.random() * 10 : (Math.random() - 0.5) * 4,
			r: 1.2 + Math.random() * 1.8, // Крупнее
			life: 0,
			maxLife: state === 'flying' ? 1.5 : 3 + Math.random() * 5,
		});
	}, []);

	// Автоматическая генерация (1 пузырек каждые 2 сек)
	useEffect(() => {
		const interval = setInterval(() => {
			if (particles.current.filter((p) => p.state === 'idle').length < 7) {
				spawnBubble();
			}
		}, 2000);
		return () => clearInterval(interval);
	}, [spawnBubble]);

	// Границы колбы
	const checkCollision = useCallback((p: Particle) => {
		const dt = 0.016;

		if (p.state === 'idle') {
			p.vx += (Math.random() - 0.5) * 2;
			p.vy += (Math.random() - 0.5) * 2;
			p.vx *= 0.9;
			p.vy *= 0.9;

			if (p.y > 20) {
				p.y = 20;
				p.vy *= -0.5;
			}
			if (p.y < 12) {
				p.y = 12;
				p.vy *= -0.5;
			}

			const leftBound = 4 + (21 - p.y) * 0.3;
			const rightBound = 20 - (21 - p.y) * 0.3;
			if (p.x < leftBound) {
				p.x = leftBound;
				p.vx *= -0.8;
			}
			if (p.x > rightBound) {
				p.x = rightBound;
				p.vx *= -0.8;
			}
		} else {
			if (p.life < 0) {
				p.vx += (Math.random() - 0.5) * 2;
				p.vy += (Math.random() - 0.5) * 2;
				p.vx *= 0.9;
				p.vy *= 0.9;
				if (p.y < 12) {
					p.y = 12;
					p.vy *= -0.5;
				}
				p.life += dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				return;
			}

			p.vy -= 15 * dt;

			if (p.y <= 11) {
				// В горлышке пузыри должны быть узкими
				const neckLeft = 10.5;
				const neckRight = 13.5;

				// Ограничиваем радиус, чтобы не вылезать за стенки (ширина горла ~3.4)
				if (p.r > 1.4) p.r = 1.4;

				if (p.x < neckLeft + p.r) {
					p.x = neckLeft + p.r;
					p.vx = Math.abs(p.vx) * 0.8 + 1;
				}
				if (p.x > neckRight - p.r) {
					p.x = neckRight - p.r;
					p.vx = -Math.abs(p.vx) * 0.8 - 1;
				}
			} else if (p.y > 11) {
				const widthAtY = 14 + (p.y - 10) * ((20 - 14) / 11);
				const halfW = widthAtY / 2;
				const center = 12;
				if (p.x < center - halfW + 1) {
					p.x = center - halfW + 1;
					p.vx = Math.abs(p.vx) * 0.8 + Math.random() * 2;
				}
				if (p.x > center + halfW - 1) {
					p.x = center + halfW - 1;
					p.vx = -Math.abs(p.vx) * 0.8 - Math.random() * 2;
				}
			}
		}

		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.life += dt;
	}, []);

	const runPhysics = useCallback(() => {
		requestRef.current = requestAnimationFrame(runPhysics);

		const _dt = 0.016;

		for (let i = particles.current.length - 1; i >= 0; i--) {
			const p = particles.current[i];
			checkCollision(p);

			if (p.life >= p.maxLife || p.y < -30) {
				particles.current.splice(i, 1);
				const el = document.getElementById(`bubble-${p.id}`);
				if (el) el.style.opacity = '0';
				continue;
			}

			const opacity =
				p.state === 'flying'
					? Math.max(0, 1 - p.life / p.maxLife)
					: Math.min(0.8, p.life * 2);

			const el = document.getElementById(`bubble-${p.id}`);
			if (el) {
				el.setAttribute('cx', p.x.toString());
				el.setAttribute('cy', p.y.toString());
				el.setAttribute('r', p.r.toString());

				// Премиальная видимость с использованием Glow и Stroke
				if (p.state === 'flying' && p.y < 9) {
					el.setAttribute('fill', 'var(--md-sys-color-primary-container)');
					el.setAttribute('stroke', 'var(--md-sys-color-primary)');
					el.setAttribute('stroke-width', '0.3');
					el.style.filter = 'url(#bubble-glow)';
				} else {
					el.setAttribute('fill', 'white');
					el.setAttribute('stroke', 'var(--md-sys-color-outline-variant)');
					el.setAttribute('stroke-width', '0.2');
					el.style.filter = 'url(#bubble-glow)';
				}

				el.style.opacity = opacity.toString();
			}
		}

		if (rockRef.current > 0) {
			rockRef.current = Math.max(0, rockRef.current - 0.016);
			if (rockRef.current === 0) setIsAnimating(false);
		}
	}, [checkCollision]);

	useEffect(() => {
		requestRef.current = requestAnimationFrame(runPhysics);
		return () => cancelAnimationFrame(requestRef.current);
	}, [runPhysics]);

	const handlePump = () => {
		if (particles.current.filter((p) => p.state === 'idle').length < 60) {
			for (let i = 0; i < 5; i++) spawnBubble();
		}
		setIsAnimating(true);
		rockRef.current = Math.min(2.0, rockRef.current + 0.5);
	};

	const handleRelease = () => {
		let count = 0;
		particles.current.forEach((p, index) => {
			if (p.state === 'idle') {
				p.state = 'flying';
				p.life = -Math.random() * 0.6;
				p.maxLife = 1.5 + Math.random() * 0.5;
				p.vy = -10 - Math.random() * 10;
				p.vx = (Math.random() - 0.5) * 8;
				count++;
			}
		});
		if (count > 0) {
			setIsAnimating(true);
			rockRef.current = 1.0;
		}
	};

	return (
		<div
			onClick={handlePump}
			onMouseLeave={handleRelease}
			className="flask-hub-logo cursor-pointer inline-flex select-none relative p-3 z-50 group hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300"
			title="Клик: накачать пузыри, Отпустить: выброс"
		>
			<style>{`
                @keyframes flask-phys-swirl-v13 {
                    0% { transform: rotate(0deg); }
                    20% { transform: rotate(-8deg); }
                    50% { transform: rotate(6deg); }
                    80% { transform: rotate(-3deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes liquid-counter-swirl-v13 {
                    0% { transform: rotate(0deg) translateY(0); }
                    20% { transform: rotate(8deg) translateY(-0.5px); }
                    50% { transform: rotate(-6deg) translateY(0.5px); }
                    80% { transform: rotate(3deg) translateY(-0.2px); }
                    100% { transform: rotate(0deg) translateY(0); }
                }
                .rock-swirl {
                    animation: flask-phys-swirl-v13 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-origin: bottom center;
                }
                .liquid-counter {
                    animation: liquid-counter-swirl-v13 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-origin: 12px 10px;
                }
            `}</style>

			<div
				className={`relative ${isAnimating ? 'rock-swirl' : ''}`}
				style={
					isAnimating
						? {
								animationDuration: `${Math.max(0.2, 0.8 / Math.max(1, rockRef.current))}s`,
							}
						: {}
				}
			>
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="overflow-visible"
					style={{ zIndex: 10 }}
				>
					<defs>
						<linearGradient id="liquid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop
								offset="0%"
								stopColor="var(--md-sys-color-primary)"
								stopOpacity="0.4"
							/>
							<stop
								offset="100%"
								stopColor="var(--md-sys-color-primary)"
								stopOpacity="0.8"
							/>
						</linearGradient>
						<path
							id="flask-inner-mask"
							d="M 10.3,10 L 13.7,10 L 21,21 A 1,1 0 0 1 20,22 H 4 A 1,1 0 0 1 3,21 Z"
						/>
						<clipPath id="flask-liquid-clip">
							<use href="#flask-inner-mask" />
						</clipPath>
						<filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur in="SourceAlpha" stdDeviation="0.4" result="blur" />
							<feComposite in="SourceGraphic" in2="blur" operator="over" />
						</filter>
					</defs>

					<g clipPath="url(#flask-liquid-clip)">
						<g
							className={isAnimating ? 'liquid-counter' : ''}
							style={
								isAnimating
									? {
											animationDuration: `${Math.max(0.2, 0.8 / Math.max(1, rockRef.current))}s`,
										}
									: {}
							}
						>
							<rect
								x="0"
								y="10"
								width="24"
								height="15"
								fill="url(#liquid-grad)"
								stroke="none"
							/>
						</g>
					</g>

					<g stroke="none">
						{Array.from({ length: 150 }).map((_, i) => (
							<circle
								key={i}
								id={`bubble-${i}`}
								cx="0"
								cy="0"
								r="0"
								style={{ opacity: 0 }}
							/>
						))}
					</g>

					<g
						className="text-(--md-sys-color-on-surface) group-hover:text-(--md-sys-color-primary) transition-colors duration-500"
						fill="none"
					>
						<path
							d="M 10,2 H 14 V 10 L 21.5,21 A 1,1 0 0 1 20.5,22 H 3.5 A 1,1 0 0 1 2.5,21 L 10,10 Z"
							strokeWidth="1.5"
						/>
					</g>
				</svg>
			</div>
			<div className="absolute inset-[-4px] bg-(--md-sys-color-primary-container) opacity-0 group-hover:opacity-10 rounded-full transition-all duration-700 blur-xl scale-90 group-hover:scale-110 -z-20" />
		</div>
	);
}
