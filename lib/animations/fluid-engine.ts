export type FluidState =
	| 'IDLE'
	| 'POURING'
	| 'DRAGGING'
	| 'FALLING'
	| 'WAITING_SCENE'
	| 'FLOATING_BACK'
	| 'CHANGING_SHELF';

const SCALE = 4;

class MathUtils {
	static lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}
	static clamp(val: number, min: number, max: number) {
		return Math.max(min, Math.min(max, val));
	}
}

class WaterSpring {
	targetY: number;
	y: number;
	speed: number;
	k = 0.05;
	damp = 0.95;

	constructor(y: number) {
		this.targetY = y;
		this.y = y;
		this.speed = 0;
	}

	update() {
		const f = -this.k * (this.y - this.targetY);
		this.speed += f;
		this.y += this.speed;
		this.speed *= this.damp;
	}
}

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
	neckProgress: number;

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

	update(dt: number, engine: FluidEngine) {
		if (this.popped) return;

		if (this.radius < this.targetRadius) {
			this.radius += (this.targetRadius - this.radius) * 0.05;
		}

		if (this.isMain) {
			// Main bubble floats inside the neck, unattached
			if (engine.getState() === 'IDLE') {
				this.targetRadius += 0.15 * (dt / 16);
				// Unconfident hover effect applied globally in engine based on radius
			}
			// Follow flask, but with some inertia
			const targetX = engine.flaskX;
			const targetY = engine.flaskY - 3 * SCALE; // Top of flask neck
			this.x += (targetX - this.x) * 0.2;
			this.y += (targetY - this.y) * 0.2;
		} else {
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);
			this.vx += (Math.random() - 0.5) * 0.1;
			this.vx *= 0.98;

			// Collision with flask walls (approximate)
			const dx = this.x - engine.flaskX;
			const dy = this.y - engine.flaskY;

			if (dy < -2 * SCALE) {
				// Reached neck
				if (engine.mainBubble && !engine.mainBubble.popped) {
					// Levitate under main bubble
					if (dy < -4 * SCALE) {
						this.y = engine.flaskY - 4 * SCALE;
						this.vy *= -0.5;
					}
				} else {
					// Pop at surface
					this.popped = true;
					engine.splash(this.x, -this.radius * 0.5);
					return;
				}
			}

			if (dy > 8 * SCALE) {
				// Bottom
				this.y = engine.flaskY + 8 * SCALE;
				this.vy *= -0.5;
			}

			// Sides
			if (dy > 0) {
				const maxDist = 4 * SCALE + (dy / (8 * SCALE)) * 2 * SCALE;
				if (Math.abs(dx) > maxDist - this.radius) {
					this.x = engine.flaskX + Math.sign(dx) * (maxDist - this.radius);
					this.vx *= -0.8;
				}
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D, color: string) {
		if (this.popped) return;

		if (this.isMain) {
			// Transparent soap bubble style
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

			// Inner glow / refraction
			const grad = ctx.createRadialGradient(
				this.x - this.radius * 0.3,
				this.y - this.radius * 0.3,
				this.radius * 0.1,
				this.x,
				this.y,
				this.radius,
			);
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
			grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
			grad.addColorStop(0.9, color);
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.4)');

			ctx.fillStyle = grad;
			ctx.fill();
			ctx.strokeStyle = 'rgba(255,255,255,0.8)';
			ctx.lineWidth = 1.5;
			ctx.stroke();

			// Specular highlight
			ctx.beginPath();
			ctx.ellipse(
				this.x - this.radius * 0.4,
				this.y - this.radius * 0.4,
				this.radius * 0.3,
				this.radius * 0.15,
				Math.PI / 4,
				0,
				Math.PI * 2,
			);
			ctx.fillStyle = 'rgba(255,255,255,0.8)';
			ctx.fill();
		} else {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.fill();
			ctx.strokeStyle = 'rgba(255,255,255,0.5)';
			ctx.lineWidth = 0.5;
			ctx.stroke();
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
	isLens: boolean;
	mass: number;

	constructor(x: number, y: number, vx: number, vy: number, radius: number, isLens = false) {
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.radius = radius;
		this.life = 1.0;
		this.isLens = isLens;
		this.mass = radius * radius;
	}

	update(dt: number, engine: FluidEngine) {
		if (this.isLens) {
			// Sticky physics
			this.vy += 0.05 * (dt / 16); // slow gravity
			this.vx *= 0.95;
			this.vy *= 0.98; // friction against glass

			// Wiping logic
			if (engine.isPointerDown) {
				const dx = this.x - engine.pointerX;
				const dy = this.y - engine.pointerY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < 50) {
					// Wipe radius
					this.vx += (dx / dist) * 5;
					this.vy += (dy / dist) * 5;
					this.radius *= 0.95; // Gets squeegeed
				}
			}

			// Dry out eventually
			this.life -= 0.002 * (dt / 16);
		} else {
			this.vy += 0.4 * (dt / 16); // normal gravity
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);

			// Floor collision
			if (this.y > engine.height) {
				this.life = 0;
				engine.addPoolFluid(this.x, this.mass);
			}
		}

		if (this.isLens) {
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);
		}
	}

	draw(ctx: CanvasRenderingContext2D, color: string) {
		if (this.life <= 0) return;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

		if (this.isLens) {
			ctx.globalAlpha = Math.max(0, this.life);
			// Render as refraction blob
			const grad = ctx.createRadialGradient(
				this.x - this.radius * 0.2,
				this.y - this.radius * 0.2,
				0,
				this.x,
				this.y,
				this.radius,
			);
			grad.addColorStop(0, 'rgba(255,255,255,0.8)');
			grad.addColorStop(0.5, 'rgba(200,200,200,0.2)');
			grad.addColorStop(1, 'rgba(100,100,100,0.1)');
			ctx.fillStyle = grad;
			ctx.fill();

			if (this.life < 0.2) {
				// Dried water stain
				ctx.strokeStyle = `rgba(255,255,255,${this.life})`;
				ctx.stroke();
			}
			ctx.globalAlpha = 1.0;
		} else {
			ctx.fillStyle = color;
			ctx.fill();
		}
	}
}

class Shard {
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	vAngle: number;
	size: number;
	points: { x: number; y: number }[];
	life: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		const speed = Math.random() * 15 + 5;
		const angle = Math.random() * Math.PI + Math.PI; // Upwards
		this.vx = Math.cos(angle) * speed;
		this.vy = Math.sin(angle) * speed;
		this.angle = Math.random() * Math.PI * 2;
		this.vAngle = (Math.random() - 0.5) * 0.5;
		this.size = Math.random() * 8 + 4;
		this.life = 1.0;

		const numPoints = Math.floor(Math.random() * 4) + 3;
		this.points = [];
		for (let i = 0; i < numPoints; i++) {
			const a = (i / numPoints) * Math.PI * 2;
			const r = this.size * (0.4 + Math.random() * 0.6);
			this.points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
		}
	}

	update(dt: number, engine: FluidEngine) {
		this.vy += 0.5 * (dt / 16);
		this.x += this.vx * (dt / 16);
		this.y += this.vy * (dt / 16);
		this.angle += this.vAngle * (dt / 16);

		// Floor bounce
		if (this.y > engine.height - this.size) {
			this.y = engine.height - this.size;
			this.vy *= -0.4;
			this.vx *= 0.8;
			this.vAngle *= 0.8;
		}

		if (engine.getState() !== 'WAITING_SCENE') {
			this.life -= 0.01 * (dt / 16);
		}
	}

	draw(ctx: CanvasRenderingContext2D) {
		if (this.life <= 0) return;
		ctx.save();
		ctx.globalAlpha = Math.max(0, this.life);
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);

		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for (let i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.points[i].x, this.points[i].y);
		}
		ctx.closePath();

		ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.restore();
	}
}

export class FluidEngine {
	public fluidCtx: CanvasRenderingContext2D;
	public uiCtx: CanvasRenderingContext2D;
	public width: number = 800;
	public height: number = 600;

	private state: FluidState = 'IDLE';
	public mainBubble: Bubble | null = null;
	private bubbles: Bubble[] = [];
	private droplets: Droplet[] = [];
	private shards: Shard[] = [];
	private springs: WaterSpring[] = [];

	// Pool at the bottom
	private poolHeights: number[] = [];

	// Flask Rigid Body
	public flaskX: number = 400;
	public flaskY: number = 300;
	public flaskVx: number = 0;
	public flaskVy: number = 0;
	public flaskRot: number = 0;
	public flaskVRot: number = 0;

	// Dragging
	public isPointerDown: boolean = false;
	public pointerX: number = 0;
	public pointerY: number = 0;
	private dragOffsetX: number = 0;
	private dragOffsetY: number = 0;

	// Camera & Timers
	private timeSinceLastMainBubble = 0;
	private stateTimer = 0;
	private color: string = 'var(--md-sys-color-primary)';
	private eventMultiplier = 1;
	private targetColor = '';

	constructor(fluidCanvas: HTMLCanvasElement, uiCanvas: HTMLCanvasElement) {
		this.fluidCtx = fluidCanvas.getContext('2d')!;
		this.uiCtx = uiCanvas.getContext('2d')!;
		this.initSprings();
	}

	getState() {
		return this.state;
	}

	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		if (this.state === 'IDLE' || this.state === 'POURING') {
			this.flaskX = width / 2;
			this.flaskY = height / 2;
		}

		// Reset pool
		const poolResolution = Math.floor(width / 10);
		this.poolHeights = new Array(poolResolution).fill(0);
	}

	setColor(color: string) {
		this.color = color;
	}

	setEventMultiplier(multiplier: number) {
		this.eventMultiplier = multiplier;
	}

	private initSprings() {
		this.springs = [];
		for (let i = 0; i <= 20; i++) {
			this.springs.push(new WaterSpring(0));
		}
	}

	private spawnBubbles(count: number) {
		for (let i = 0; i < count; i++) {
			this.bubbles.push(
				new Bubble(
					this.flaskX + (Math.random() - 0.5) * 8 * SCALE,
					this.flaskY + 4 * SCALE + Math.random() * 4 * SCALE,
					(1 + Math.random() * 2) * SCALE,
				),
			);
		}
	}

	public splash(x: number, force: number) {
		// x is world coordinate. Need to map to spring index.
		// Springs are spread across the flask width roughly from -4*SCALE to +4*SCALE relative to flaskX
		const localX = x - this.flaskX;
		const width = 8 * SCALE;
		const relativeX = (localX + width / 2) / width;
		const index = Math.floor(relativeX * (this.springs.length - 1));
		if (index >= 0 && index < this.springs.length) {
			this.springs[index].speed += force;
		}
	}

	public addPoolFluid(x: number, mass: number) {
		const index = Math.floor((x / this.width) * this.poolHeights.length);
		if (index >= 0 && index < this.poolHeights.length) {
			this.poolHeights[index] += mass * 0.1;
		}
	}

	private shatterFlask() {
		this.state = 'WAITING_SCENE';
		this.stateTimer = 0;

		// Spawn shards
		for (let i = 0; i < 30; i++) {
			this.shards.push(
				new Shard(
					this.flaskX + (Math.random() - 0.5) * 10 * SCALE,
					this.flaskY + (Math.random() - 0.5) * 10 * SCALE,
				),
			);
		}

		// Liquid explodes
		for (let i = 0; i < 100; i++) {
			this.droplets.push(
				new Droplet(
					this.flaskX + (Math.random() - 0.5) * 10 * SCALE,
					this.flaskY + (Math.random() - 0.5) * 10 * SCALE,
					this.flaskVx * 0.5 + (Math.random() - 0.5) * 20,
					this.flaskVy * 0.5 + (Math.random() - 0.5) * 20,
					(Math.random() * 3 + 1) * SCALE,
				),
			);
		}

		// Camera drops
		if (Math.random() < 0.8 * this.eventMultiplier) {
			for (let i = 0; i < 40; i++) {
				this.droplets.push(
					new Droplet(
						Math.random() * this.width,
						Math.random() * this.height,
						0,
						0,
						Math.random() * 8 * SCALE,
						true, // isLens
					),
				);
			}
		}

		this.mainBubble = null;
		this.bubbles = [];
	}

	private createMainBubble() {
		this.mainBubble = new Bubble(this.flaskX, this.flaskY - 2 * SCALE, 2 * SCALE, true);
		this.bubbles.push(this.mainBubble);
	}

	public handlePointerDown(x: number, y: number) {
		this.isPointerDown = true;
		this.pointerX = x;
		this.pointerY = y;

		if (this.state === 'IDLE' || this.state === 'POURING') {
			// Check if grabbed flask
			const dx = x - this.flaskX;
			const dy = y - this.flaskY;
			if (Math.abs(dx) < 6 * SCALE && Math.abs(dy) < 12 * SCALE) {
				this.state = 'DRAGGING';
				this.dragOffsetX = dx;
				this.dragOffsetY = dy;
				this.flaskVx = 0;
				this.flaskVy = 0;
				this.flaskVRot = 0;
				return;
			}

			// Check if popped main bubble
			if (this.mainBubble && !this.mainBubble.popped) {
				const bdx = x - this.mainBubble.x;
				const bdy = y - this.mainBubble.y;
				if (Math.sqrt(bdx * bdx + bdy * bdy) <= this.mainBubble.radius) {
					this.popMainBubble();
					return;
				}
			}

			// Check small bubbles
			for (const b of this.bubbles) {
				if (!b.isMain && !b.popped) {
					const bdx = x - b.x;
					const bdy = y - b.y;
					if (Math.sqrt(bdx * bdx + bdy * bdy) <= b.radius * 1.5) {
						b.popped = true;
						this.splash(b.x, b.radius * 3);
						break;
					}
				}
			}
		}
	}

	public handlePointerMove(x: number, y: number) {
		if (this.state === 'DRAGGING') {
			const oldX = this.flaskX;
			const oldY = this.flaskY;
			this.flaskX = x - this.dragOffsetX;
			this.flaskY = y - this.dragOffsetY;

			// Calculate velocity for throw
			this.flaskVx = (this.flaskX - oldX) * 0.5;
			this.flaskVy = (this.flaskY - oldY) * 0.5;

			// Add rotation based on horizontal movement
			this.flaskRot = MathUtils.clamp(-this.flaskVx * 0.05, -Math.PI / 4, Math.PI / 4);

			// Slosh water
			this.splash(
				this.flaskX + Math.sign(this.flaskVx) * 4 * SCALE,
				Math.abs(this.flaskVx) * 0.2,
			);

			// If shaken too hard, pop main bubble
			if (Math.abs(this.flaskVx) > 20 || Math.abs(this.flaskVy) > 20) {
				if (this.mainBubble) this.popMainBubble();
			}
		}

		// Pool interaction
		if (this.isPointerDown && y > this.height - 50) {
			const index = Math.floor((x / this.width) * this.poolHeights.length);
			if (index >= 0 && index < this.poolHeights.length) {
				// Push fluid aside
				const push = 5;
				if (this.poolHeights[index] > push) {
					this.poolHeights[index] -= push;
					if (index > 0) this.poolHeights[index - 1] += push / 2;
					if (index < this.poolHeights.length - 1)
						this.poolHeights[index + 1] += push / 2;
				}
			}
		}

		this.pointerX = x;
		this.pointerY = y;
	}

	public handlePointerUp(x: number, y: number) {
		this.isPointerDown = false;
		if (this.state === 'DRAGGING') {
			// Check safe zone (center of screen, rough estimation)
			const safeZoneW = 300;
			const safeZoneH = 200;
			const centerX = this.width / 2;
			const centerY = this.height / 2;

			const isSafe =
				Math.abs(this.flaskX - centerX) < safeZoneW / 2 &&
				Math.abs(this.flaskY - centerY) < safeZoneH / 2;

			if (isSafe) {
				this.state = 'IDLE';
				// Smoothly return to center? Or stay where dropped if we want a shelf.
				// Let's make it snap back to center slowly.
			} else {
				if (this.mainBubble && !this.mainBubble.popped) {
					this.state = 'FLOATING_BACK';
				} else {
					this.state = 'FALLING';
				}
			}
		}
	}

	private popMainBubble() {
		if (!this.mainBubble) return;
		this.mainBubble.popped = true;

		for (let i = 0; i < 20; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 8 + 2;
			this.droplets.push(
				new Droplet(
					this.mainBubble.x,
					this.mainBubble.y,
					Math.cos(angle) * speed,
					Math.sin(angle) * speed,
					this.mainBubble.radius * 0.2,
				),
			);
		}

		// Lens droplets occasionally
		if (Math.random() < 0.5) {
			for (let i = 0; i < 5; i++) {
				this.droplets.push(
					new Droplet(
						this.mainBubble.x + (Math.random() - 0.5) * 100,
						this.mainBubble.y + (Math.random() - 0.5) * 100,
						0,
						0,
						Math.random() * 15,
						true,
					),
				);
			}
		}

		this.mainBubble = null;
	}

	private updateSprings() {
		for (let i = 0; i < this.springs.length; i++) this.springs[i].update();
		const leftDeltas = new Array(this.springs.length).fill(0);
		const rightDeltas = new Array(this.springs.length).fill(0);
		const spread = 0.2;
		for (let i = 0; i < this.springs.length; i++) {
			if (i > 0) {
				leftDeltas[i] = spread * (this.springs[i].y - this.springs[i - 1].y);
				this.springs[i - 1].speed += leftDeltas[i];
			}
			if (i < this.springs.length - 1) {
				rightDeltas[i] = spread * (this.springs[i].y - this.springs[i + 1].y);
				this.springs[i + 1].speed += rightDeltas[i];
			}
		}
		for (let i = 0; i < this.springs.length; i++) {
			if (i > 0) this.springs[i - 1].y += leftDeltas[i];
			if (i < this.springs.length - 1) this.springs[i + 1].y += rightDeltas[i];
		}
	}

	update(dt: number) {
		// --- State Logic ---
		if (this.state === 'IDLE') {
			this.timeSinceLastMainBubble += dt;

			// Unconfident Hover Logic
			const centerX = this.width / 2;
			const centerY = this.height / 2;

			this.flaskX += (centerX - this.flaskX) * 0.05;

			let targetY = centerY;
			if (this.mainBubble) {
				// The bigger the bubble, the higher and more confident it hovers
				const lift = Math.min(this.mainBubble.radius * 2, 40);
				targetY = centerY - lift;

				// Swaying is wilder when bubble is small, smoother when big
				const swayAmt = 10 / (1 + this.mainBubble.radius);
				this.flaskRot = Math.sin(Date.now() / 500) * swayAmt * 0.05;
				this.flaskX += Math.cos(Date.now() / 700) * swayAmt * 2;
			} else {
				this.flaskRot += (0 - this.flaskRot) * 0.1;
			}

			this.flaskY += (targetY - this.flaskY) * 0.05;

			if (
				this.timeSinceLastMainBubble > 4000 &&
				Math.random() < 0.05 * this.eventMultiplier &&
				!this.mainBubble
			) {
				this.createMainBubble();
				this.timeSinceLastMainBubble = 0;
			}

			// Spawn small bubbles occasionally
			if (Math.random() < 0.02) {
				this.spawnBubbles(1);
			}

			// Over-inflation check
			if (this.mainBubble && this.mainBubble.radius > 12 * SCALE) {
				this.popMainBubble();
				this.shatterFlask(); // Bubble got too big!
			}
		} else if (this.state === 'FALLING') {
			this.flaskVy += 0.5 * (dt / 16); // Gravity
			this.flaskY += this.flaskVy * (dt / 16);
			this.flaskX += this.flaskVx * (dt / 16);
			this.flaskRot += this.flaskVx * 0.01; // Spin while falling

			// Check bottom hit
			if (this.flaskY > this.height - 10 * SCALE) {
				// Check pool height at drop location
				const index = Math.floor((this.flaskX / this.width) * this.poolHeights.length);
				const poolH = this.poolHeights[index] || 0;

				if (poolH > 50) {
					// Cushion! Sinks instead of breaking completely immediately
					this.splash(this.flaskX, 50);
					this.flaskVy *= -0.2; // Bounce
					// Empty flask contents into pool slowly
					this.addPoolFluid(this.flaskX, 100);
					this.flaskY = this.height - poolH; // Float on pool
				} else {
					this.shatterFlask();
				}
			}
		} else if (this.state === 'FLOATING_BACK') {
			// Floats back to center slowly
			const centerX = this.width / 2;
			const centerY = this.height / 2;

			const speed = this.mainBubble ? this.mainBubble.radius * 0.05 : 0.1;

			this.flaskX += (centerX - this.flaskX) * speed * (dt / 16);
			this.flaskY += (centerY - this.flaskY) * speed * (dt / 16);

			// Sway
			this.flaskRot = Math.sin(Date.now() / 400) * 0.1;

			if (Math.abs(this.flaskX - centerX) < 5 && Math.abs(this.flaskY - centerY) < 5) {
				this.state = 'IDLE';
			}
		} else if (this.state === 'WAITING_SCENE') {
			this.stateTimer += dt;
			if (this.stateTimer > 10000) {
				// 10 seconds of shards
				this.state = 'CHANGING_SHELF';
				this.stateTimer = 0;
				const hue = Math.floor(Math.random() * 360);
				this.targetColor = `hsl(${hue}, 80%, 50%)`;
			}
		} else if (this.state === 'CHANGING_SHELF') {
			this.stateTimer += dt;
			if (this.stateTimer > 2000) {
				this.state = 'POURING';
				this.stateTimer = 0;
				this.color = this.targetColor;
				this.flaskX = this.width / 2;
				this.flaskY = this.height / 2;
				this.flaskRot = 0;
				this.flaskVx = 0;
				this.flaskVy = 0;
				this.shards = [];
				this.bubbles = [];
				this.initSprings();
				// Empty flask springs
				for (const s of this.springs) s.y = 8 * SCALE;
			}
		} else if (this.state === 'POURING') {
			this.stateTimer += dt;

			// Simulate pouring: particles falling from top into flask
			if (Math.random() < 0.5) {
				this.droplets.push(
					new Droplet(
						this.flaskX + (Math.random() - 0.5) * 2 * SCALE,
						0, // From top
						(Math.random() - 0.5) * 2,
						10, // Fast
						2 * SCALE,
					),
				);
			}

			// Raise springs
			for (let i = 0; i < this.springs.length; i++) {
				if (this.springs[i].y > -1 * SCALE) {
					this.springs[i].y -= 0.1 * (dt / 16);
				}
			}

			if (this.stateTimer > 4000) {
				// 4s pour
				this.state = 'IDLE';
				this.stateTimer = 0;
				this.spawnBubbles(10);
			}
		}

		// --- Physics Updates ---
		this.updateSprings();

		this.bubbles.forEach((b) => b.update(dt, this));
		this.bubbles = this.bubbles.filter((b) => !b.popped);

		this.droplets.forEach((d) => d.update(dt, this));
		this.droplets = this.droplets.filter((d) => d.life > 0);

		this.shards.forEach((s) => s.update(dt, this));
		this.shards = this.shards.filter((s) => s.life > 0);

		// Pool relaxation
		for (let i = 0; i < this.poolHeights.length; i++) {
			if (this.poolHeights[i] > 0) {
				this.poolHeights[i] *= 0.999; // Slow evaporation

				// Leveling
				const spread = 0.1;
				if (i > 0) {
					const diff = this.poolHeights[i] - this.poolHeights[i - 1];
					if (diff > 0) {
						this.poolHeights[i] -= diff * spread;
						this.poolHeights[i - 1] += diff * spread;
					}
				}
				if (i < this.poolHeights.length - 1) {
					const diff = this.poolHeights[i] - this.poolHeights[i + 1];
					if (diff > 0) {
						this.poolHeights[i] -= diff * spread;
						this.poolHeights[i + 1] += diff * spread;
					}
				}
			}
		}
	}

	private createFlaskPath(ctx: CanvasRenderingContext2D, inner = false) {
		const s = SCALE;
		ctx.beginPath();
		if (inner) {
			ctx.moveTo(-1.7 * s, -8 * s);
			ctx.lineTo(1.7 * s, -8 * s);
			ctx.lineTo(9 * s, 3 * s);
			ctx.arc(8 * s, 3 * s, 1 * s, 0, Math.PI / 2);
			ctx.lineTo(-8 * s, 4 * s);
			ctx.arc(-8 * s, 3 * s, 1 * s, Math.PI / 2, Math.PI);
			ctx.closePath();
		} else {
			ctx.moveTo(-2 * s, -16 * s);
			ctx.lineTo(2 * s, -16 * s);
			ctx.lineTo(2 * s, -8 * s);
			ctx.lineTo(9.5 * s, 3 * s);
			ctx.arc(8.5 * s, 3 * s, 1 * s, 0, Math.PI / 2);
			ctx.lineTo(-8.5 * s, 4 * s);
			ctx.arc(-8.5 * s, 3 * s, 1 * s, Math.PI / 2, Math.PI);
			ctx.lineTo(-2 * s, -8 * s);
			ctx.closePath();
		}
	}

	draw() {
		this.fluidCtx.clearRect(0, 0, this.width, this.height);
		this.uiCtx.clearRect(0, 0, this.width, this.height);

		// Draw Pool
		this.fluidCtx.fillStyle = this.color;
		this.fluidCtx.beginPath();
		this.fluidCtx.moveTo(0, this.height);
		const step = this.width / (this.poolHeights.length - 1);
		for (let i = 0; i < this.poolHeights.length; i++) {
			this.fluidCtx.lineTo(i * step, this.height - this.poolHeights[i]);
		}
		this.fluidCtx.lineTo(this.width, this.height);
		this.fluidCtx.closePath();
		this.fluidCtx.fill();

		// Draw Flask System if not shattered
		if (this.state !== 'WAITING_SCENE' && this.state !== 'CHANGING_SHELF') {
			this.fluidCtx.save();
			this.uiCtx.save();

			this.fluidCtx.translate(this.flaskX, this.flaskY);
			this.fluidCtx.rotate(this.flaskRot);
			this.uiCtx.translate(this.flaskX, this.flaskY);
			this.uiCtx.rotate(this.flaskRot);

			// FLUID LAYER
			this.fluidCtx.save();
			this.createFlaskPath(this.fluidCtx, true);
			this.fluidCtx.clip();

			// Draw surface springs.
			// We translate them down since the original coordinates assumed top-left
			this.fluidCtx.fillStyle = this.color;
			this.fluidCtx.beginPath();

			const startX = -4 * SCALE;
			const endX = 4 * SCALE;
			const sStep = (endX - startX) / (this.springs.length - 1);

			this.fluidCtx.moveTo(startX, this.springs[0].y);
			for (let i = 1; i < this.springs.length; i++) {
				this.fluidCtx.lineTo(startX + i * sStep, this.springs[i].y);
			}
			this.fluidCtx.lineTo(9 * SCALE, 9 * SCALE);
			this.fluidCtx.lineTo(-9 * SCALE, 9 * SCALE);
			this.fluidCtx.closePath();
			this.fluidCtx.fill();

			// Restore translation for bubbles so they draw in world space
			this.fluidCtx.restore();

			// UI LAYER (Glass)
			this.uiCtx.strokeStyle = 'rgba(255,255,255,0.4)';
			this.uiCtx.lineWidth = 1.5;
			this.createFlaskPath(this.uiCtx, false);
			this.uiCtx.stroke();

			// Glassmorphism body
			this.uiCtx.fillStyle = 'rgba(255,255,255,0.05)';
			this.uiCtx.fill();

			// Reflections
			this.uiCtx.strokeStyle = 'rgba(255,255,255,0.6)';
			this.uiCtx.lineWidth = 2;
			this.uiCtx.beginPath();
			this.uiCtx.moveTo(-1.5 * SCALE, -15 * SCALE);
			this.uiCtx.lineTo(-1.5 * SCALE, -8 * SCALE);
			this.uiCtx.lineTo(-7 * SCALE, 1 * SCALE);
			this.uiCtx.stroke();

			this.uiCtx.restore();
			this.fluidCtx.restore();
		}

		// Draw Bubbles (World space)
		this.bubbles.forEach((b) => b.draw(this.fluidCtx, this.color));

		// Draw Particles & Drops
		this.droplets.forEach((d) => d.draw(this.fluidCtx, this.color));
		this.shards.forEach((s) => s.draw(this.uiCtx));

		// Draw pour stream in POURING state
		if (this.state === 'POURING') {
			this.uiCtx.fillStyle = this.color;
			this.uiCtx.fillRect(this.flaskX - 2 * SCALE, 0, 4 * SCALE, this.flaskY - 8 * SCALE);
		}
	}
}
