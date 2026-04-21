export type FluidState =
	| 'IDLE'
	| 'BUBBLE_GROWING'
	| 'FLASK_HOVERING'
	| 'POPPED_FALLING'
	| 'CHANGING_SHELF';

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
	neckProgress: number; // 0 to 1 how far it's out of the neck

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
		this.neckProgress = 0;
	}

	update(dt: number, isHovering: boolean) {
		if (this.popped) return;

		// Grow radius
		if (this.radius < this.targetRadius) {
			this.radius += (this.targetRadius - this.radius) * 0.05;
		}

		if (this.isMain) {
			if (!isHovering) {
				this.targetRadius += 0.1 * (dt / 16);
				// Squeeze up through neck
				this.neckProgress = Math.min(1.5, this.neckProgress + 0.005 * (dt / 16));
			}
			this.x += (12 * SCALE - this.x) * 0.1;
			this.y += (8 * SCALE - this.y) * 0.1;
		} else {
			// Normal bubbles
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);
			this.vx += (Math.random() - 0.5) * 0.1;
			this.vx *= 0.98;

			const unscaledX = this.x / SCALE;
			const unscaledY = this.y / SCALE;

			if (unscaledY > 20.5) {
				this.y = 20.5 * SCALE;
				this.vy *= -0.5;
			}
			if (unscaledY < 11) {
				this.y = (20 + Math.random()) * SCALE;
				this.x = (6 + Math.random() * 12) * SCALE;
				this.vx = (Math.random() - 0.5) * 0.5;
				this.vy = -Math.random() * 0.5 - 0.5;
			}
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

		if (this.isMain) {
			// Draw main bubble as two connected circles (metaball physics)
			// Root stays in the neck, top part pushes out
			const rootY = 9.5 * SCALE;
			const topY = rootY - this.neckProgress * this.radius * 2;

			const rootR = Math.min(this.radius, 1.8 * SCALE); // fits in neck
			const topR = this.radius * Math.max(0.2, this.neckProgress);

			ctx.beginPath();

			// Top bubble
			ctx.arc(this.x, topY, topR, 0, Math.PI * 2);

			// Draw bezier bridge connecting root and top
			if (this.neckProgress > 0.1 && this.neckProgress < 1.3) {
				const bridgeWidth = rootR * Math.max(0.1, 1 - this.neckProgress);
				ctx.moveTo(this.x - bridgeWidth, rootY);
				ctx.bezierCurveTo(
					this.x - bridgeWidth,
					(rootY + topY) / 2,
					this.x - topR,
					topY,
					this.x - topR,
					topY,
				);
				ctx.lineTo(this.x + topR, topY);
				ctx.bezierCurveTo(
					this.x + topR,
					topY,
					this.x + bridgeWidth,
					(rootY + topY) / 2,
					this.x + bridgeWidth,
					rootY,
				);
			}

			// Fill the whole complex blob
			const grad = ctx.createRadialGradient(
				this.x - topR * 0.3,
				topY - topR * 0.3,
				topR * 0.1,
				this.x,
				topY,
				topR * 1.5,
			);
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
			grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
			grad.addColorStop(0.8, color);
			grad.addColorStop(0.9, 'rgba(200, 255, 255, 0.6)');
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

			ctx.fillStyle = grad;
			ctx.fill();

			// Highlight stroke for the top part
			ctx.beginPath();
			ctx.arc(this.x, topY, topR, 0, Math.PI * 2);
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
			ctx.stroke();
		} else {
			// Normal bubbles
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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
		this.vy += 0.2 * (dt / 16);
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

export class FluidEngine {
	private fluidCtx: CanvasRenderingContext2D;
	private uiCtx: CanvasRenderingContext2D;
	private width: number;
	private height: number;

	private bubbles: Bubble[] = [];
	private droplets: Droplet[] = [];

	private state: FluidState = 'IDLE';
	private mainBubble: Bubble | null = null;
	private flaskYOffset = 0;
	private flaskVy = 0;
	private timeSinceLastMainBubble = 0;

	private color: string = 'var(--md-sys-color-primary)';
	private eventMultiplier = 1;
	private shelfAnimProgress = 0; // 0 to 1
	private targetColor = '';

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
		this.mainBubble = new Bubble(12 * SCALE, 14 * SCALE, 2 * SCALE, true);
		this.bubbles.push(this.mainBubble);
		this.state = 'BUBBLE_GROWING';
	}

	public handleInteraction(clientX: number, clientY: number, canvasRect: DOMRect) {
		const x = clientX - canvasRect.left;
		const y = clientY - canvasRect.top;

		if (this.mainBubble && !this.mainBubble.popped) {
			const dx = x - (this.width / 2 - 12 * SCALE + this.mainBubble.x);
			const topY = 9.5 * SCALE - this.mainBubble.neckProgress * this.mainBubble.radius * 2;
			const dy = y - (this.height / 2 - 12 * SCALE + topY + this.flaskYOffset);
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist <= this.mainBubble.radius * 2) {
				this.popMainBubble();
			}
		}
	}

	private popMainBubble() {
		if (!this.mainBubble) return;

		this.mainBubble.popped = true;
		const radius = this.mainBubble.radius;
		const topY = 9.5 * SCALE - this.mainBubble.neckProgress * radius * 2;
		const bx = this.width / 2 - 12 * SCALE + this.mainBubble.x;
		const by = this.height / 2 - 12 * SCALE + topY + this.flaskYOffset;

		// Local drops (falling back into flask)
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

		if (radius > 4 * SCALE) {
			// Extreme event: Shatter and change shelf
			if (Math.random() < 0.05 * this.eventMultiplier) {
				this.triggerShelfChange();
				return;
			}

			// Screen Splatter (Lens Drops)
			const globalDropAmount = Math.floor(radius * 2 * this.eventMultiplier);
			if (Math.random() < 0.4 * this.eventMultiplier) {
				window.dispatchEvent(
					new CustomEvent('lensSplatter', {
						detail: {
							x: window.innerWidth / 2,
							y: window.innerHeight / 2,
							amount: globalDropAmount,
							color: this.color,
						},
					}),
				);
			}
		}

		this.mainBubble = null;
		if (this.state === 'FLASK_HOVERING') {
			this.state = 'POPPED_FALLING';
		} else {
			this.state = 'IDLE';
		}
	}

	private triggerShelfChange() {
		this.state = 'CHANGING_SHELF';
		this.shelfAnimProgress = 0;
		const hue = Math.floor(Math.random() * 360);
		this.targetColor = `hsl(${hue}, 80%, 50%)`;

		// Fire global event which will update DB and other clients
		window.dispatchEvent(new CustomEvent('flaskShattered', { detail: { hue } }));
		this.mainBubble = null;
	}

	update(dt: number) {
		if (this.state === 'CHANGING_SHELF') {
			this.shelfAnimProgress += dt / 1500; // 1.5s animation
			if (this.shelfAnimProgress >= 1) {
				this.state = 'IDLE';
				this.color = this.targetColor;
				this.initBubbles();
			}
			return; // Don't update physics while camera is moving
		}

		if (this.state === 'IDLE') {
			this.timeSinceLastMainBubble += dt;
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
		}

		this.bubbles.forEach((b) => b.update(dt, this.state === 'FLASK_HOVERING'));
		this.droplets.forEach((d) => d.update(dt));
		this.droplets = this.droplets.filter((d) => d.life > 0);
	}

	private createFlaskPath(ctx: CanvasRenderingContext2D, inner = false) {
		const s = SCALE;
		ctx.beginPath();
		if (inner) {
			ctx.moveTo(10.3 * s, 10 * s);
			ctx.lineTo(13.7 * s, 10 * s);
			ctx.lineTo(21 * s, 21 * s);
			ctx.arc(20 * s, 21 * s, 1 * s, 0, Math.PI / 2);
			ctx.lineTo(4 * s, 22 * s);
			ctx.arc(4 * s, 21 * s, 1 * s, Math.PI / 2, Math.PI);
			ctx.closePath();
		} else {
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

	private drawShelfCinematic() {
		// Parallax infinite shelves effect
		const p = this.shelfAnimProgress;
		// Ease-in-out movement
		const movement = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

		const blurAmount = Math.sin(p * Math.PI) * 20; // Max blur in middle

		// Draw shelves lines
		this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		this.uiCtx.lineWidth = 4;
		this.uiCtx.beginPath();
		this.uiCtx.moveTo(0, this.height * 0.8);
		this.uiCtx.lineTo(this.width, this.height * 0.8);
		this.uiCtx.stroke();

		this.uiCtx.save();

		// Simulate motion blur by repeating drawing with low opacity
		const passes = blurAmount > 1 ? 5 : 1;
		this.uiCtx.globalAlpha = 1 / passes;

		for (let pass = 0; pass < passes; pass++) {
			const offset = movement * 1000 + pass * blurAmount;

			// Draw passing flasks
			for (let i = 0; i < 10; i++) {
				const xPos = (i * 150 - offset) % 1500;
				if (xPos < -100 || xPos > this.width + 100) continue;

				this.uiCtx.save();
				this.uiCtx.translate(xPos, this.height * 0.8 - 24 * SCALE);

				// Draw generic flask silhouette
				this.uiCtx.fillStyle = `hsl(${(i * 50) % 360}, 60%, 40%)`;
				this.uiCtx.globalCompositeOperation = 'screen';
				this.createFlaskPath(this.uiCtx, true);
				this.uiCtx.fill();

				this.uiCtx.restore();
			}

			// Draw the target flask coming into view
			const targetX = this.width + 300 - movement * 1500; // Slide in from right
			if (p > 0.6) {
				this.uiCtx.save();
				this.uiCtx.translate(
					targetX +
						(this.width / 2 - 12 * SCALE - targetX) * Math.pow((p - 0.6) / 0.4, 2),
					this.height / 2 - 12 * SCALE,
				);
				this.uiCtx.fillStyle = this.targetColor;
				this.createFlaskPath(this.uiCtx, true);
				this.uiCtx.fill();

				this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
				this.uiCtx.lineWidth = 1.5;
				this.createFlaskPath(this.uiCtx, false);
				this.uiCtx.stroke();
				this.uiCtx.restore();
			}
		}

		this.uiCtx.restore();
	}

	draw() {
		this.fluidCtx.clearRect(0, 0, this.width, this.height);
		this.uiCtx.clearRect(0, 0, this.width, this.height);

		if (this.state === 'CHANGING_SHELF') {
			this.drawShelfCinematic();
			return;
		}

		const centerX = this.width / 2 - 12 * SCALE;
		const centerY = this.height / 2 - 12 * SCALE;

		this.fluidCtx.save();
		this.fluidCtx.translate(centerX, centerY + this.flaskYOffset);
		this.uiCtx.save();
		this.uiCtx.translate(centerX, centerY + this.flaskYOffset);

		// FLUID LAYER (clipped)
		this.fluidCtx.save();
		this.createFlaskPath(this.fluidCtx, true);
		this.fluidCtx.clip();

		this.fluidCtx.fillStyle = this.color;
		this.fluidCtx.fillRect(0, 10 * SCALE, 24 * SCALE, 14 * SCALE);
		this.bubbles.filter((b) => !b.isMain).forEach((b) => b.draw(this.fluidCtx, this.color));
		this.fluidCtx.restore();

		// MAIN BUBBLE (Draws outside clip to squeeze through neck)
		if (this.mainBubble) {
			this.mainBubble.draw(this.fluidCtx, this.color);
		}

		this.fluidCtx.translate(-centerX, -(centerY + this.flaskYOffset));
		this.droplets.forEach((d) => d.draw(this.fluidCtx, this.color));

		// GLASS UI LAYER
		this.uiCtx.strokeStyle = 'rgba(255,255,255,0.4)';
		this.uiCtx.lineWidth = 1.5;
		this.createFlaskPath(this.uiCtx, false);
		this.uiCtx.stroke();

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

		this.uiCtx.globalCompositeOperation = 'screen';
		this.uiCtx.fillStyle = 'rgba(255,255,255,0.05)';
		this.createFlaskPath(this.uiCtx, false);
		this.uiCtx.fill();
		this.uiCtx.globalCompositeOperation = 'source-over';

		this.fluidCtx.restore();
		this.uiCtx.restore();
	}
}
