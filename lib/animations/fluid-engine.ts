export type FluidState =
	| 'IDLE'
	| 'BUBBLE_GROWING'
	| 'FLASK_HOVERING'
	| 'POPPED_FALLING'
	| 'SHATTERED'
	| 'PANNING';

class Bubble {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	targetRadius: number;
	isMain: boolean;
	popped: boolean;

	constructor(x: number, y: number, radius: number, isMain = false) {
		this.id = Math.random();
		this.x = x;
		this.y = y;
		this.vx = (Math.random() - 0.5) * 0.5;
		this.vy = -Math.random() * 0.5 - 0.5;
		this.radius = 0;
		this.targetRadius = radius;
		this.isMain = isMain;
		this.popped = false;
	}

	update(dt: number, bounds: { width: number; height: number }, isHovering: boolean) {
		if (this.popped) return;

		// Grow radius
		if (this.radius < this.targetRadius) {
			this.radius += (this.targetRadius - this.radius) * 0.05;
		}

		if (this.isMain) {
			// Main bubble slowly grows and rises slightly above the flask
			this.targetRadius += 0.05 * (dt / 16);
			this.y += (bounds.height * 0.2 - this.y) * 0.02; // Move towards top
			this.x += (bounds.width / 2 - this.x) * 0.05; // Center horizontally
		} else {
			// Normal bubbles float up
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);
			// Wobble
			this.x += Math.sin(Date.now() / 200 + this.id) * 0.5;

			// Reset if out of bounds (top of liquid)
			if (this.y < bounds.height * 0.5) {
				this.y = bounds.height + this.radius;
				this.x = bounds.width * 0.2 + Math.random() * (bounds.width * 0.6);
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.popped) return;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
	}
}

class Droplet {
	x: number;
	y: number;
	vx: number;
	vy: number;
	radius: number;
	life: number;

	constructor(x: number, y: number, vx: number, vy: number, radius: number) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.radius = radius;
		this.life = 1.0;
	}

	update(dt: number) {
		this.vy += 0.2 * (dt / 16); // gravity
		this.x += this.vx * (dt / 16);
		this.y += this.vy * (dt / 16);
		this.life -= 0.02 * (dt / 16);
		this.radius *= 0.95;
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.life <= 0) return;
		ctx.globalAlpha = Math.max(0, this.life);
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1.0;
	}
}

class ScreenSplash {
	x: number;
	y: number;
	radius: number;
	life: number;
	maxLife: number;

	constructor(x: number, y: number, radius: number) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.life = 1.0;
		this.maxLife = 300 + Math.random() * 200; // Lives for a while
	}

	update(dt: number) {
		this.life -= (1 / this.maxLife) * (dt / 16);
		this.y += 0.1 * (dt / 16); // Slowly drips down
	}

	draw(ctx: CanvasRenderingContext2D, color: string) {
		if (this.life <= 0) return;
		ctx.fillStyle = color;
		ctx.globalAlpha = Math.max(0, this.life * 0.5); // Semi-transparent
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1.0;
	}
}

export class FluidEngine {
	private fluidCtx: CanvasRenderingContext2D;
	private uiCtx: CanvasRenderingContext2D;
	private width: number;
	private height: number;

	private bubbles: Bubble[] = [];
	private droplets: Droplet[] = [];
	private screenSplashes: ScreenSplash[] = [];

	private state: FluidState = 'IDLE';
	private mainBubble: Bubble | null = null;
	private flaskYOffset = 0;
	private flaskVy = 0;
	private timeSinceLastMainBubble = 0;

	private color: string = 'var(--md-sys-color-primary)';

	constructor(fluidCanvas: HTMLCanvasElement, uiCanvas: HTMLCanvasElement) {
		this.fluidCtx = fluidCanvas.getContext('2d')!;
		this.uiCtx = uiCanvas.getContext('2d')!;
		this.width = fluidCanvas.width;
		this.height = fluidCanvas.height;

		this.initBubbles();
	}

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		// Re-init bounds based bubbles if necessary
	}

	setColor(color: string) {
		this.color = color;
	}

	private initBubbles() {
		this.bubbles = [];
		for (let i = 0; i < 15; i++) {
			this.bubbles.push(
				new Bubble(
					this.width * 0.2 + Math.random() * (this.width * 0.6),
					this.height * 0.5 + Math.random() * (this.height * 0.5),
					3 + Math.random() * 5,
				),
			);
		}
	}

	private createMainBubble() {
		this.mainBubble = new Bubble(this.width / 2, this.height * 0.5, 10, true);
		this.bubbles.push(this.mainBubble);
		this.state = 'BUBBLE_GROWING';
	}

	public handleInteraction(clientX: number, clientY: number, canvasRect: DOMRect) {
		const x = clientX - canvasRect.left;
		const y = clientY - canvasRect.top;

		if (this.mainBubble && !this.mainBubble.popped) {
			const dx = x - this.mainBubble.x;
			const dy = y - (this.mainBubble.y + this.flaskYOffset);
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= this.mainBubble.radius * 1.5) {
				// Generous hit area
				this.popMainBubble();
			}
		}
	}

	private popMainBubble() {
		if (!this.mainBubble) return;

		this.mainBubble.popped = true;
		const radius = this.mainBubble.radius;
		const bx = this.mainBubble.x;
		const by = this.mainBubble.y + this.flaskYOffset;

		// Splashes
		for (let i = 0; i < 20; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 5 + 2;
			this.droplets.push(
				new Droplet(
					bx,
					by,
					Math.cos(angle) * speed,
					Math.sin(angle) * speed - 2,
					radius * 0.2 * Math.random(),
				),
			);
		}

		// Rare events based on bubble size
		if (radius > this.width * 0.3) {
			// Droplets on screen (Fourth wall break)
			if (Math.random() < 0.3) {
				for (let i = 0; i < 3; i++) {
					this.screenSplashes.push(
						new ScreenSplash(
							bx + (Math.random() - 0.5) * radius * 2,
							by + (Math.random() - 0.5) * radius * 2,
							radius * (0.2 + Math.random() * 0.3),
						),
					);
				}
			}

			// Extreme rare event: Shatter
			if (Math.random() < 0.05) {
				this.state = 'SHATTERED';
				// TODO: implement shatter particles
				setTimeout(() => {
					this.resetWithNewColor();
				}, 2000);
			}
		}

		this.mainBubble = null;

		if (this.state === 'FLASK_HOVERING') {
			this.state = 'POPPED_FALLING';
		} else if (this.state !== 'SHATTERED') {
			this.state = 'IDLE';
		}
	}

	private resetWithNewColor() {
		this.state = 'PANNING';
		// Assign new random bright HSL color
		const hue = Math.floor(Math.random() * 360);
		this.color = `hsl(${hue}, 80%, 50%)`;

		this.flaskYOffset = -this.height; // Come from above
		this.initBubbles();

		setTimeout(() => {
			this.state = 'IDLE';
		}, 1000);
	}

	update(dt: number) {
		if (this.state === 'IDLE') {
			this.timeSinceLastMainBubble += dt;
			if (this.timeSinceLastMainBubble > 5000 && Math.random() < 0.01) {
				this.createMainBubble();
				this.timeSinceLastMainBubble = 0;
			}
		}

		if (this.state === 'BUBBLE_GROWING' && this.mainBubble) {
			if (this.mainBubble.radius > this.width * 0.4) {
				this.state = 'FLASK_HOVERING';
			}
		}

		// Flask physics
		if (this.state === 'FLASK_HOVERING') {
			// Wobble and lift
			const targetOffset = -20 - Math.sin(Date.now() / 300) * 10;
			this.flaskVy += (targetOffset - this.flaskYOffset) * 0.05;
			this.flaskVy *= 0.8; // dampening
			this.flaskYOffset += this.flaskVy;
		} else if (this.state === 'POPPED_FALLING' || this.state === 'IDLE') {
			// Fall back to 0
			this.flaskVy += (0 - this.flaskYOffset) * 0.1;
			this.flaskVy *= 0.7;
			this.flaskYOffset += this.flaskVy;

			if (
				this.state === 'POPPED_FALLING' &&
				Math.abs(this.flaskYOffset) < 1 &&
				Math.abs(this.flaskVy) < 1
			) {
				this.state = 'IDLE';
			}
		} else if (this.state === 'PANNING') {
			// Slide into place
			this.flaskYOffset += (0 - this.flaskYOffset) * 0.05;
		}

		this.bubbles.forEach((b) =>
			b.update(
				dt,
				{ width: this.width, height: this.height },
				this.state === 'FLASK_HOVERING',
			),
		);
		this.droplets.forEach((d) => d.update(dt));
		this.droplets = this.droplets.filter((d) => d.life > 0);

		this.screenSplashes.forEach((s) => s.update(dt));
		this.screenSplashes = this.screenSplashes.filter((s) => s.life > 0);
	}

	draw() {
		// Clear canvases
		this.fluidCtx.clearRect(0, 0, this.width, this.height);
		this.uiCtx.clearRect(0, 0, this.width, this.height);

		if (this.state === 'SHATTERED') {
			// Draw broken glass
			return;
		}

		// Save context for flask movement
		this.fluidCtx.save();
		this.fluidCtx.translate(0, this.flaskYOffset);
		this.uiCtx.save();
		this.uiCtx.translate(0, this.flaskYOffset);

		// 1. Draw Fluid (Gooey Layer)
		this.fluidCtx.fillStyle = this.color;

		// Liquid base
		this.fluidCtx.beginPath();
		this.fluidCtx.roundRect(
			this.width * 0.2,
			this.height * 0.5,
			this.width * 0.6,
			this.height * 0.45,
			[10, 10, 30, 30],
		);
		this.fluidCtx.fill();

		// Bubbles
		this.bubbles.forEach((b) => b.draw(this.fluidCtx));
		this.droplets.forEach((d) => d.draw(this.fluidCtx));

		// 2. Draw Glass (UI Layer, no filter)
		this.uiCtx.strokeStyle = 'rgba(255,255,255,0.5)';
		this.uiCtx.lineWidth = 4;
		this.uiCtx.beginPath();
		// Neck
		this.uiCtx.moveTo(this.width * 0.35, this.height * 0.1);
		this.uiCtx.lineTo(this.width * 0.35, this.height * 0.4);
		this.uiCtx.moveTo(this.width * 0.65, this.height * 0.1);
		this.uiCtx.lineTo(this.width * 0.65, this.height * 0.4);
		// Body
		this.uiCtx.moveTo(this.width * 0.35, this.height * 0.4);
		this.uiCtx.bezierCurveTo(
			this.width * 0.1,
			this.height * 0.45,
			this.width * 0.1,
			this.height * 0.95,
			this.width * 0.5,
			this.height * 0.95,
		);
		this.uiCtx.bezierCurveTo(
			this.width * 0.9,
			this.height * 0.95,
			this.width * 0.9,
			this.height * 0.45,
			this.width * 0.65,
			this.height * 0.4,
		);
		this.uiCtx.stroke();

		// Highlight on glass
		this.uiCtx.strokeStyle = 'rgba(255,255,255,0.8)';
		this.uiCtx.lineWidth = 3;
		this.uiCtx.beginPath();
		this.uiCtx.moveTo(this.width * 0.75, this.height * 0.6);
		this.uiCtx.bezierCurveTo(
			this.width * 0.8,
			this.height * 0.7,
			this.width * 0.75,
			this.height * 0.85,
			this.width * 0.6,
			this.height * 0.9,
		);
		this.uiCtx.stroke();

		this.fluidCtx.restore();
		this.uiCtx.restore();

		// Draw Screen Splashes (on UI layer, unaffected by flask transform)
		this.screenSplashes.forEach((s) => s.draw(this.uiCtx, this.color));
	}
}
