export type FluidState =
	| 'IDLE'
	| 'BUBBLE_GROWING'
	| 'FLASK_HOVERING'
	| 'POPPED_FALLING'
	| 'SHATTERED'
	| 'PANNING';

// Helper to scale 24x24 viewBox coordinates to canvas
const SCALE = 4; // 24 * 4 = 96px

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

	update(dt: number, isHovering: boolean) {
		if (this.popped) return;

		// Grow radius
		if (this.radius < this.targetRadius) {
			this.radius += (this.targetRadius - this.radius) * 0.05;
		}

		if (this.isMain) {
			// Main bubble grows and sticks in the neck
			this.targetRadius += 0.1 * (dt / 16);
			// Neck center is at x=12, y=8
			this.x += (12 * SCALE - this.x) * 0.1;
			this.y += (8 * SCALE - this.y) * 0.1;
		} else {
			// Normal bubbles float up and bounce off walls
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);

			// Add some wobble
			this.vx += (Math.random() - 0.5) * 0.1;
			this.vx *= 0.98; // dampening

			// Physics constraints for Erlenmeyer flask (24x24 coordinate space scaled)
			const unscaledX = this.x / SCALE;
			const unscaledY = this.y / SCALE;

			// Floor
			if (unscaledY > 20.5) {
				this.y = 20.5 * SCALE;
				this.vy *= -0.5;
			}
			// Liquid surface (roughly y=11)
			if (unscaledY < 11) {
				// Reset bubble to bottom
				this.y = (20 + Math.random()) * SCALE;
				this.x = (6 + Math.random() * 12) * SCALE;
				this.vx = (Math.random() - 0.5) * 0.5;
				this.vy = -Math.random() * 0.5 - 0.5;
			}

			// Left wall: from (10, 10) to (3, 21) => dx = -7, dy = 11
			// x = 10 - 7 * (y - 10) / 11
			if (unscaledY >= 10 && unscaledY <= 21) {
				const leftBound = 10 - (7 * (unscaledY - 10)) / 11;
				if (unscaledX < leftBound + 0.5) {
					this.x = (leftBound + 0.5) * SCALE;
					this.vx = Math.abs(this.vx) * 0.8 + 0.2;
				}

				const rightBound = 14 + (7 * (unscaledY - 10)) / 11;
				if (unscaledX > rightBound - 0.5) {
					this.x = (rightBound - 0.5) * SCALE;
					this.vx = -Math.abs(this.vx) * 0.8 - 0.2;
				}
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D, color: string) {
		if (this.popped) return;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

		if (this.isMain) {
			// Realistic iridescent/highlight gradient for main bubble
			const grad = ctx.createRadialGradient(
				this.x - this.radius * 0.3,
				this.y - this.radius * 0.3,
				this.radius * 0.1,
				this.x,
				this.y,
				this.radius,
			);
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
			grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
			grad.addColorStop(0.8, color);
			grad.addColorStop(0.9, 'rgba(200, 255, 255, 0.6)'); // Iridescent edge
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

			ctx.fillStyle = grad;
			ctx.fill();

			// Highlight stroke
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.stroke();
		} else {
			// Normal bubbles
			const grad = ctx.createRadialGradient(
				this.x - this.radius * 0.3,
				this.y - this.radius * 0.3,
				0,
				this.x,
				this.y,
				this.radius,
			);
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

			ctx.fillStyle = grad;
			ctx.fill();
		}
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

	draw(ctx: CanvasRenderingContext2D, color: string) {
		if (this.life <= 0) return;
		ctx.globalAlpha = Math.max(0, this.life);
		ctx.fillStyle = color;
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

		const grad = ctx.createRadialGradient(
			this.x,
			this.y - this.radius * 0.5,
			0,
			this.x,
			this.y,
			this.radius,
		);
		grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
		grad.addColorStop(0.5, color);
		grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

		ctx.fillStyle = grad;
		ctx.globalAlpha = Math.max(0, this.life * 0.8);

		ctx.beginPath();
		// Drip shape
		ctx.moveTo(this.x, this.y - this.radius * 1.5);
		ctx.bezierCurveTo(
			this.x + this.radius,
			this.y - this.radius * 0.5,
			this.x + this.radius,
			this.y + this.radius,
			this.x,
			this.y + this.radius,
		);
		ctx.bezierCurveTo(
			this.x - this.radius,
			this.y + this.radius,
			this.x - this.radius,
			this.y - this.radius * 0.5,
			this.x,
			this.y - this.radius * 1.5,
		);
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
	private eventMultiplier = 1;

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
	}

	setColor(color: string) {
		this.color = color;
	}

	setEventMultiplier(multiplier: number) {
		this.eventMultiplier = multiplier;
	}

	private initBubbles() {
		this.bubbles = [];
		for (let i = 0; i < 15; i++) {
			this.bubbles.push(
				new Bubble(
					(6 + Math.random() * 12) * SCALE,
					(12 + Math.random() * 8) * SCALE,
					(1 + Math.random() * 2) * SCALE,
				),
			);
		}
	}

	private createMainBubble() {
		// Spawns below the neck
		this.mainBubble = new Bubble(12 * SCALE, 14 * SCALE, 2 * SCALE, true);
		this.bubbles.push(this.mainBubble);
		this.state = 'BUBBLE_GROWING';
	}

	public handleInteraction(clientX: number, clientY: number, canvasRect: DOMRect) {
		const x = clientX - canvasRect.left;
		const y = clientY - canvasRect.top;

		if (this.mainBubble && !this.mainBubble.popped) {
			const dx = x - (this.width / 2 - 12 * SCALE + this.mainBubble.x);
			const dy = y - (this.height / 2 - 12 * SCALE + this.mainBubble.y + this.flaskYOffset);
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= this.mainBubble.radius * 1.5) {
				this.popMainBubble();
			}
		}
	}

	private popMainBubble() {
		if (!this.mainBubble) return;

		this.mainBubble.popped = true;
		const radius = this.mainBubble.radius;
		const bx = this.width / 2 - 12 * SCALE + this.mainBubble.x;
		const by = this.height / 2 - 12 * SCALE + this.mainBubble.y + this.flaskYOffset;

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

		// Rare events based on bubble size and multiplier
		if (radius > 4 * SCALE) {
			// Droplets on screen
			if (Math.random() < 0.3 * this.eventMultiplier) {
				for (let i = 0; i < 3; i++) {
					this.screenSplashes.push(
						new ScreenSplash(
							bx + (Math.random() - 0.5) * radius * 3,
							by + (Math.random() - 0.5) * radius * 3,
							radius * (0.2 + Math.random() * 0.3),
						),
					);
				}
			}

			// Extreme rare event: Shatter
			if (Math.random() < 0.05 * this.eventMultiplier) {
				this.state = 'SHATTERED';

				const hue = Math.floor(Math.random() * 360);
				this.color = `hsl(${hue}, 80%, 50%)`;

				// Dispatch global event
				window.dispatchEvent(new CustomEvent('flaskShattered', { detail: { hue } }));

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
		this.flaskYOffset = -this.height; // Come from above
		this.initBubbles();

		setTimeout(() => {
			this.state = 'IDLE';
		}, 1000);
	}

	update(dt: number) {
		if (this.state === 'IDLE') {
			this.timeSinceLastMainBubble += dt;
			// Faster spawns with multiplier
			if (
				this.timeSinceLastMainBubble > 3000 &&
				Math.random() < 0.02 * this.eventMultiplier
			) {
				this.createMainBubble();
				this.timeSinceLastMainBubble = 0;
			}
		}

		if (this.state === 'BUBBLE_GROWING' && this.mainBubble) {
			if (this.mainBubble.radius > 5 * SCALE) {
				this.state = 'FLASK_HOVERING';
			}
		}

		// Flask physics
		if (this.state === 'FLASK_HOVERING') {
			const targetOffset = -20 - Math.sin(Date.now() / 300) * 10;
			this.flaskVy += (targetOffset - this.flaskYOffset) * 0.05;
			this.flaskVy *= 0.8;
			this.flaskYOffset += this.flaskVy;
		} else if (this.state === 'POPPED_FALLING' || this.state === 'IDLE') {
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
			this.flaskYOffset += (0 - this.flaskYOffset) * 0.05;
		}

		this.bubbles.forEach((b) => b.update(dt, this.state === 'FLASK_HOVERING'));
		this.droplets.forEach((d) => d.update(dt));
		this.droplets = this.droplets.filter((d) => d.life > 0);

		this.screenSplashes.forEach((s) => s.update(dt));
		this.screenSplashes = this.screenSplashes.filter((s) => s.life > 0);
	}

	private createFlaskPath(ctx: CanvasRenderingContext2D, inner = false) {
		const s = SCALE;
		ctx.beginPath();
		if (inner) {
			// Inner mask to restrict fluid
			ctx.moveTo(10.3 * s, 10 * s);
			ctx.lineTo(13.7 * s, 10 * s);
			ctx.lineTo(21 * s, 21 * s);
			ctx.arc(20 * s, 21 * s, 1 * s, 0, Math.PI / 2);
			ctx.lineTo(4 * s, 22 * s);
			ctx.arc(4 * s, 21 * s, 1 * s, Math.PI / 2, Math.PI);
			ctx.closePath();
		} else {
			// Outer glass shell
			ctx.moveTo(10 * s, 2 * s);
			ctx.lineTo(14 * s, 2 * s);
			ctx.lineTo(14 * s, 10 * s);
			ctx.lineTo(21.5 * s, 21 * s);
			ctx.arc(20.5 * s, 21 * s, 1 * s, 0, Math.PI / 2);
			ctx.lineTo(3.5 * s, 22 * s);
			ctx.arc(3.5 * s, 21 * s, 1 * s, Math.PI / 2, Math.PI);
			ctx.lineTo(10 * s, 10 * s);
			ctx.closePath();
		}
	}

	draw() {
		this.fluidCtx.clearRect(0, 0, this.width, this.height);
		this.uiCtx.clearRect(0, 0, this.width, this.height);

		if (this.state === 'SHATTERED') {
			return; // Shattered state handled separately or clears out
		}

		const centerX = this.width / 2 - 12 * SCALE;
		const centerY = this.height / 2 - 12 * SCALE;

		this.fluidCtx.save();
		this.fluidCtx.translate(centerX, centerY + this.flaskYOffset);
		this.uiCtx.save();
		this.uiCtx.translate(centerX, centerY + this.flaskYOffset);

		// ================= FLUID LAYER =================
		// Clip to inner flask bounds so fluid doesn't spill
		this.fluidCtx.save();
		this.createFlaskPath(this.fluidCtx, true);
		this.fluidCtx.clip();

		// Base liquid
		this.fluidCtx.fillStyle = this.color;
		this.fluidCtx.fillRect(0, 10 * SCALE, 24 * SCALE, 14 * SCALE);

		// Draw normal bubbles inside clip mask
		this.bubbles.filter((b) => !b.isMain).forEach((b) => b.draw(this.fluidCtx, this.color));

		this.fluidCtx.restore(); // Remove clip

		// Draw main bubble OUTSIDE clip mask so it can inflate past the glass!
		if (this.mainBubble) {
			this.mainBubble.draw(this.fluidCtx, this.color);
		}

		// Draw droplets (splashes)
		this.fluidCtx.translate(-centerX, -(centerY + this.flaskYOffset)); // Droplets use absolute coordinates
		this.droplets.forEach((d) => d.draw(this.fluidCtx, this.color));

		// ================= GLASS UI LAYER =================

		// Draw thick glass back/front outline
		this.uiCtx.strokeStyle = 'rgba(255,255,255,0.4)';
		this.uiCtx.lineWidth = 1.5;
		this.createFlaskPath(this.uiCtx, false);
		this.uiCtx.stroke();

		// Draw inner highlight (reflection)
		this.uiCtx.strokeStyle = 'rgba(255,255,255,0.8)';
		this.uiCtx.lineWidth = 1;
		this.uiCtx.beginPath();
		this.uiCtx.moveTo(11 * SCALE, 3 * SCALE);
		this.uiCtx.lineTo(11 * SCALE, 9.5 * SCALE);
		this.uiCtx.lineTo(5.5 * SCALE, 19 * SCALE);
		this.uiCtx.stroke();

		this.uiCtx.beginPath();
		this.uiCtx.moveTo(19 * SCALE, 19.5 * SCALE);
		this.uiCtx.lineTo(17 * SCALE, 21 * SCALE);
		this.uiCtx.stroke();

		// Add subtle glow to glass
		this.uiCtx.globalCompositeOperation = 'screen';
		this.uiCtx.fillStyle = 'rgba(255,255,255,0.05)';
		this.createFlaskPath(this.uiCtx, false);
		this.uiCtx.fill();
		this.uiCtx.globalCompositeOperation = 'source-over';

		this.fluidCtx.restore();
		this.uiCtx.restore();

		// Screen splashes (not affected by translation)
		this.screenSplashes.forEach((s) => s.draw(this.uiCtx, this.color));
	}
}
