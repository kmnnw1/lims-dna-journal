'use client';

import { useEffect, useRef } from 'react';
import { useDevSettings } from '@/components/features/DevSettingsProvider';
import { FluidEngine } from '@/lib/animations/fluid-engine';

export function InteractiveFluidFlask() {
	const { settings } = useDevSettings();
	const containerRef = useRef<HTMLDivElement>(null);
	const fluidCanvasRef = useRef<HTMLCanvasElement>(null);
	const uiCanvasRef = useRef<HTMLCanvasElement>(null);
	const engineRef = useRef<FluidEngine | null>(null);
	const requestRef = useRef<number>(0);
	const lastTimeRef = useRef<number>(0);

	useEffect(() => {
		if (!fluidCanvasRef.current || !uiCanvasRef.current || !containerRef.current) return;

		// Initialize engine
		const engine = new FluidEngine(fluidCanvasRef.current, uiCanvasRef.current);
		engineRef.current = engine;

		// Resolve the exact RGB color
		const tempEl = document.createElement('div');
		tempEl.style.color = 'var(--md-sys-color-primary, #6750a4)';
		document.body.appendChild(tempEl);
		const primaryColor = getComputedStyle(tempEl).color;
		document.body.removeChild(tempEl);

		engine.setColor(primaryColor);
		engine.setEventMultiplier(settings.flaskEventMultiplier);

		// Setup animation loop
		const animate = (time: number) => {
			if (!lastTimeRef.current) lastTimeRef.current = time;
			const dt = time - lastTimeRef.current;
			lastTimeRef.current = time;

			engine.update(dt);
			engine.draw();

			requestRef.current = requestAnimationFrame(animate);
		};

		requestRef.current = requestAnimationFrame(animate);

		// Handle resizing
		const handleResize = () => {
			if (fluidCanvasRef.current && uiCanvasRef.current) {
				const w = window.innerWidth;
				const h = window.innerHeight;
				fluidCanvasRef.current.width = w;
				fluidCanvasRef.current.height = h;
				uiCanvasRef.current.width = w;
				uiCanvasRef.current.height = h;
				engine.resize(w, h);
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Initial size

		// Global pointer events for dragging and swiping
		const handlePointerDown = (e: PointerEvent) => {
			engine.handlePointerDown(e.clientX, e.clientY);
		};
		const handlePointerMove = (e: PointerEvent) => {
			engine.handlePointerMove(e.clientX, e.clientY);
		};
		const handlePointerUp = (e: PointerEvent) => {
			engine.handlePointerUp(e.clientX, e.clientY);
		};

		window.addEventListener('pointerdown', handlePointerDown);
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);

		return () => {
			cancelAnimationFrame(requestRef.current);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		};
	}, [settings.flaskEventMultiplier]);

	return (
		<div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none z-[-1]">
			<canvas ref={fluidCanvasRef} className="absolute inset-0 pointer-events-none" />
			<canvas ref={uiCanvasRef} className="absolute inset-0 z-10 pointer-events-none" />
		</div>
	);
}
