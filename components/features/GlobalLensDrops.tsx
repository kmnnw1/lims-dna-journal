'use client';

import { useEffect, useRef, useState } from 'react';

type Drop = {
	id: string;
	x: number;
	y: number;
	size: number;
	vy: number;
	vx: number;
	dryingRate: number;
	color: string;
};

export function GlobalLensDrops() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const dropsRef = useRef<Drop[]>([]);
	const requestRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);
	const [active, setActive] = useState(false);

	useEffect(() => {
		const handleSplash = (e: Event) => {
			const customEvent = e as CustomEvent<{
				x: number;
				y: number;
				amount: number;
				color: string;
			}>;
			const { x, y, amount, color } = customEvent.detail;

			// Add new drops based on the amount
			for (let i = 0; i < amount; i++) {
				dropsRef.current.push({
					id: Math.random().toString(36).substr(2, 9),
					x: x + (Math.random() - 0.5) * 400,
					y: y + (Math.random() - 0.5) * 400,
					size: 10 + Math.random() * 40,
					vy: Math.random() * 0.5,
					vx: (Math.random() - 0.5) * 0.1,
					dryingRate: 0.05 + Math.random() * 0.1, // Dries slowly over seconds
					color,
				});
			}

			if (!active) {
				setActive(true);
			}
		};

		window.addEventListener('lensSplatter', handleSplash);
		return () => window.removeEventListener('lensSplatter', handleSplash);
	}, [active]);

	// Animation loop for drops sliding down and drying
	useEffect(() => {
		if (!active || !canvasRef.current) return;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Make canvas cover the whole screen
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		window.addEventListener('resize', resize);
		resize();

		const animate = (time: number) => {
			if (!lastTimeRef.current) lastTimeRef.current = time;
			const dt = time - lastTimeRef.current;
			lastTimeRef.current = time;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// Update and draw
			dropsRef.current = dropsRef.current.filter((drop) => {
				drop.y += drop.vy * (dt / 16);
				drop.x += drop.vx * (dt / 16);
				drop.size -= drop.dryingRate * (dt / 16);

				if (drop.size <= 0 || drop.y > canvas.height + 50) return false;

				// Draw droplet (using radial gradient for 3D water effect)
				ctx.save();
				ctx.beginPath();
				ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);

				// Clip to just the droplet for drawing reflections
				ctx.clip();

				// Base color with transparency
				ctx.globalAlpha = 0.4;
				ctx.fillStyle = drop.color;
				ctx.fill();

				// Inner shadow / lens effect
				const grad = ctx.createRadialGradient(
					drop.x - drop.size * 0.3,
					drop.y - drop.size * 0.3,
					drop.size * 0.1,
					drop.x,
					drop.y,
					drop.size,
				);
				grad.addColorStop(0, 'rgba(255,255,255,0.8)'); // Highlight
				grad.addColorStop(0.5, 'rgba(255,255,255,0)');
				grad.addColorStop(1, 'rgba(0,0,0,0.3)'); // Shadow

				ctx.globalAlpha = 1.0;
				ctx.fillStyle = grad;
				ctx.fill();

				ctx.restore();

				// Draw droplet outline
				ctx.beginPath();
				ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
				ctx.strokeStyle = 'rgba(255,255,255,0.2)';
				ctx.lineWidth = 1;
				ctx.stroke();

				return true;
			});

			if (dropsRef.current.length === 0) {
				setActive(false);
			} else {
				requestRef.current = requestAnimationFrame(animate);
			}
		};

		requestRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize', resize);
			lastTimeRef.current = 0;
		};
	}, [active]);

	if (!active) return null;

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 pointer-events-none z-9999"
			// Using backdrop-filter to blur what is strictly behind the drawn droplets
			// Note: applying backdrop-filter to the whole canvas blurs everything.
			// To blur ONLY behind drops without an SVG filter, we rely on the droplet rendering
			// or we apply a subtle global blur when active. Since we want high performance,
			// we will use standard canvas drawing and CSS mix-blend-mode.
			style={{ mixBlendMode: 'hard-light' }}
		/>
	);
}
