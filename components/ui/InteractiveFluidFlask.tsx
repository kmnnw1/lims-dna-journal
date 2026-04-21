'use client';

import { useEffect, useRef } from 'react';
import { FluidEngine } from '@/lib/animations/fluid-engine';

export function InteractiveFluidFlask() {
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

		// Resolve the exact RGB color using a temporary DOM element
		// because CSS custom properties can be nested or complex.
		const tempEl = document.createElement('div');
		tempEl.style.color = 'var(--md-sys-color-primary, #6750a4)';
		document.body.appendChild(tempEl);
		const primaryColor = getComputedStyle(tempEl).color;
		document.body.removeChild(tempEl);

		engine.setColor(primaryColor);

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

		// Handle interactions
		const handlePointerDown = (e: PointerEvent) => {
			if (engineRef.current && uiCanvasRef.current) {
				const rect = uiCanvasRef.current.getBoundingClientRect();
				engineRef.current.handleInteraction(e.clientX, e.clientY, rect);
			}
		};

		const uiCanvas = uiCanvasRef.current;
		uiCanvas.addEventListener('pointerdown', handlePointerDown);

		return () => {
			cancelAnimationFrame(requestRef.current);
			uiCanvas.removeEventListener('pointerdown', handlePointerDown);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="relative w-full h-full flex items-center justify-center pointer-events-none"
		>
			{/* SVG Filter Definition for the Gooey Effect */}
			<svg width="0" height="0" className="absolute pointer-events-none">
				<defs>
					<filter id="gooey-filter">
						<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
							result="gooey"
						/>
						<feBlend in="SourceGraphic" in2="gooey" />
					</filter>
				</defs>
			</svg>

			{/* 
				We make the canvases much larger than the 96x96 container 
				so that the liquid can burst out of it (breaking the 4th wall).
			*/}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-auto cursor-pointer group">
				<canvas
					ref={fluidCanvasRef}
					width={300}
					height={300}
					className="absolute inset-0 pointer-events-none"
					style={{ filter: 'url(#gooey-filter)' }}
				/>
				<canvas
					ref={uiCanvasRef}
					width={300}
					height={300}
					className="absolute inset-0 z-10 transition-transform group-hover:scale-[1.02]"
				/>
			</div>
		</div>
	);
}
