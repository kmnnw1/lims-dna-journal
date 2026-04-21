export type FluidState =
	| 'IDLE'
	| 'BUBBLE_GROWING'
	| 'FLASK_HOVERING'
	| 'WAITING_SCENE' // Новое: зависание и просмотр осколков
	| 'CHANGING_SHELF';

const SCALE = 4; // 24 * 4 = 96px

class WaterSpring {
	targetY: number;
	y: number;
	speed: number;
	k = 0.05; // жесткость
	damp = 0.95; // затухание

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

	update(dt: number, isHovering: boolean, fluidEngine: FluidEngine) {
		if (this.popped) return;

		if (this.radius < this.targetRadius) {
			this.radius += (this.targetRadius - this.radius) * 0.05;
		}

		if (this.isMain) {
			if (!isHovering) {
				this.targetRadius += 0.15 * (dt / 16); // Растет быстрее
				this.neckProgress = Math.min(1.5, this.neckProgress + 0.006 * (dt / 16));
			}
			this.x += (12 * SCALE - this.x) * 0.1;
			this.y += (8 * SCALE - this.y) * 0.1;
		} else {
			this.x += this.vx * (dt / 16);
			this.y += this.vy * (dt / 16);
			this.vx += (Math.random() - 0.5) * 0.1;
			this.vx *= 0.98;

			const unscaledX = this.x / SCALE;
			const unscaledY = this.y / SCALE;

			// Если пузырек всплыл до поверхности, лопаем его и создаем рябь
			const surfaceY = 10 * SCALE;
			if (this.y - this.radius < surfaceY && !this.isMain) {
				this.popped = true;
				fluidEngine.splash(this.x, -this.radius * 0.5); // splash
				return;
			}

			if (unscaledY > 20.5) {
				this.y = 20.5 * SCALE;
				this.vy *= -0.5;
			}
			// Границы колбы
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
			const rootY = 9.5 * SCALE;
			const topY = rootY - this.neckProgress * this.radius * 2;
			const rootR = Math.min(this.radius, 1.8 * SCALE);
			const topR = this.radius * Math.max(0.2, this.neckProgress);

			ctx.beginPath();
			ctx.arc(this.x, topY, topR, 0, Math.PI * 2);

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

			const grad = ctx.createRadialGradient(
				this.x - topR * 0.3,
				topY - topR * 0.3,
				topR * 0.1,
				this.x,
				topY,
				topR * 1.5,
			);
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
			grad.addColorStop(0.2, color);
			grad.addColorStop(0.8, color);
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.5)');

			ctx.fillStyle = grad;
			ctx.fill();
		} else {
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
			grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
			grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

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
		this.vy += 0.3 * (dt / 16);
		this.x += this.vx * (dt / 16);
		this.y += this.vy * (dt / 16);
		this.life -= 0.01 * (dt / 16);
		this.radius *= 0.98;
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
		const speed = Math.random() * 8 + 2;
		const angle = Math.random() * Math.PI * 2;
		this.vx = Math.cos(angle) * speed;
		this.vy = Math.sin(angle) * speed - 4; // throw upwards
		this.angle = Math.random() * Math.PI * 2;
		this.vAngle = (Math.random() - 0.5) * 0.5;
		this.size = Math.random() * 5 + 3;
		this.life = 1.0;

		const numPoints = Math.floor(Math.random() * 3) + 3;
		this.points = [];
		for (let i = 0; i < numPoints; i++) {
			const a = (i / numPoints) * Math.PI * 2;
			const r = this.size * (0.4 + Math.random() * 0.6);
			this.points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
		}
	}

	update(dt: number) {
		this.vy += 0.4 * (dt / 16); // гравитация для стекла
		this.x += this.vx * (dt / 16);
		this.y += this.vy * (dt / 16);
		this.angle += this.vAngle * (dt / 16);
		this.life -= 0.005 * (dt / 16);
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
		ctx.lineWidth = 0.5;
		ctx.stroke();

		ctx.restore();
	}
}

export class FluidEngine {
	private fluidCtx: CanvasRenderingContext2D;
	private uiCtx: CanvasRenderingContext2D;
	private width: number;
	private height: number;

	private bubbles: Bubble[] = [];
	private droplets: Droplet[] = [];
	private shards: Shard[] = [];
	private springs: WaterSpring[] = [];

	private state: FluidState = 'IDLE';
	private mainBubble: Bubble | null = null;

	// Camera and Scene
	private timeSinceLastMainBubble = 0;
	private stateTimer = 0;
	private cameraX = 0;
	private cameraY = 0;
	private cameraScale = 1;
	private time = 0;

	private color: string = 'var(--md-sys-color-primary)';
	private eventMultiplier = 1;
	private shelfAnimProgress = 0;
	private targetColor = '';

	constructor(fluidCanvas: HTMLCanvasElement, uiCanvas: HTMLCanvasElement) {
		this.fluidCtx = fluidCanvas.getContext('2d')!;
		this.uiCtx = uiCanvas.getContext('2d')!;
		this.width = fluidCanvas.width;
		this.height = fluidCanvas.height;

		this.initSprings();
		this.initBubbles();
	}

	private initSprings() {
		this.springs = [];
		const springCount = 20;
		for (let i = 0; i <= springCount; i++) {
			this.springs.push(new WaterSpring(10 * SCALE)); // Y = 10*SCALE
		}
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
		// Увеличено количество мелких пузырей
		for (let i = 0; i < 25; i++) {
			this.bubbles.push(
				new Bubble(
					(6 + Math.random() * 12) * SCALE,
					(12 + Math.random() * 8) * SCALE,
					(1.5 + Math.random() * 3) * SCALE,
				),
			);
		}
	}

	// Возмущение поверхности
	public splash(x: number, force: number) {
		const relativeX = (x - 10 * SCALE) / (14 * SCALE - 10 * SCALE);
		const index = Math.floor(relativeX * (this.springs.length - 1));
		if (index >= 0 && index < this.springs.length) {
			this.springs[index].speed += force;
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

		// Преобразуем координаты клика к локальным координатам сцены с учетом камеры
		const centerX = this.width / 2 - 12 * SCALE;
		const centerY = this.height / 2 - 12 * SCALE;

		const localX = (x - centerX - this.cameraX) / this.cameraScale;
		const localY = (y - centerY - this.cameraY) / this.cameraScale;

		// Проверка клика по главному пузырю
		if (this.mainBubble && !this.mainBubble.popped) {
			const topY = 9.5 * SCALE - this.mainBubble.neckProgress * this.mainBubble.radius * 2;
			const dx = localX - this.mainBubble.x;
			const dy = localY - topY;
			if (Math.sqrt(dx * dx + dy * dy) <= this.mainBubble.radius * 2) {
				this.popMainBubble();
				return; // Приоритет главному
			}
		}

		// Лопаем мелкие пузырьки (интерактивность)
		for (const bubble of this.bubbles) {
			if (!bubble.isMain && !bubble.popped) {
				const dx = localX - bubble.x;
				const dy = localY - bubble.y;
				if (Math.sqrt(dx * dx + dy * dy) <= bubble.radius * 1.5) {
					// Зона клика чуть больше
					bubble.popped = true;
					this.splash(bubble.x, bubble.radius * 2); // Вода всколыхнется
					// Локальные капельки внутри воды
					for (let i = 0; i < 5; i++) {
						this.droplets.push(
							new Droplet(
								bubble.x,
								bubble.y,
								(Math.random() - 0.5) * 4,
								(Math.random() - 0.5) * 4,
								bubble.radius * 0.3 * Math.random(),
							),
						);
					}
					// Спавн нового пузырька через секунду где-то внизу
					setTimeout(() => {
						if (this.state === 'IDLE' || this.state === 'BUBBLE_GROWING') {
							this.bubbles.push(
								new Bubble(
									(6 + Math.random() * 12) * SCALE,
									(20 + Math.random() * 2) * SCALE,
									(1.5 + Math.random() * 3) * SCALE,
								),
							);
						}
					}, 1000);
					break; // Один за клик
				}
			}
		}
	}

	private popMainBubble() {
		if (!this.mainBubble) return;

		this.mainBubble.popped = true;
		const radius = this.mainBubble.radius;
		const topY = 9.5 * SCALE - this.mainBubble.neckProgress * radius * 2;

		// Локальные капли
		for (let i = 0; i < 20; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = Math.random() * 5 + 2;
			this.droplets.push(
				new Droplet(
					this.mainBubble.x,
					topY,
					Math.cos(angle) * speed,
					Math.sin(angle) * speed - 2,
					radius * 0.2 * Math.random(),
				),
			);
		}

		// Если перекачали -> разрушение колбы
		if (radius > 5 * SCALE) {
			// Лимит больше
			this.shatterFlask();
			return;
		}

		this.mainBubble = null;
		this.state = 'IDLE';
	}

	private shatterFlask() {
		this.state = 'WAITING_SCENE';
		this.stateTimer = 0;
		this.mainBubble = null;

		// 1. Создание осколков
		const glassPoints = [
			{ x: 10, y: 10 },
			{ x: 14, y: 10 },
			{ x: 21, y: 21 },
			{ x: 3, y: 21 },
		];
		for (const pt of glassPoints) {
			for (let i = 0; i < 8; i++) {
				this.shards.push(new Shard(pt.x * SCALE, pt.y * SCALE));
			}
		}

		// 2. Вся вода выливается
		for (let i = 0; i < 150; i++) {
			const rx = (6 + Math.random() * 12) * SCALE;
			const ry = (12 + Math.random() * 8) * SCALE;
			this.droplets.push(
				new Droplet(
					rx,
					ry,
					(Math.random() - 0.5) * 8,
					Math.random() * 4, // падают вниз
					(Math.random() * 2 + 1) * SCALE * 0.5,
				),
			);
		}
		// Убираем пузыри
		this.bubbles = [];

		// Глобальное событие (капли на экран)
		if (Math.random() < 0.6 * this.eventMultiplier) {
			window.dispatchEvent(
				new CustomEvent('lensSplatter', {
					detail: {
						x: window.innerWidth / 2,
						y: window.innerHeight / 2,
						amount: 30,
						color: this.color,
					},
				}),
			);
		}
	}

	private triggerShelfChange() {
		this.state = 'CHANGING_SHELF';
		this.shelfAnimProgress = 0;
		const hue = Math.floor(Math.random() * 360);
		this.targetColor = `hsl(${hue}, 80%, 50%)`;

		window.dispatchEvent(new CustomEvent('flaskShattered', { detail: { hue } }));
	}

	private updateSprings() {
		// Обновляем пружины
		for (let i = 0; i < this.springs.length; i++) {
			this.springs[i].update();
		}

		// Распространение волн
		const leftDeltas = new Array(this.springs.length).fill(0);
		const rightDeltas = new Array(this.springs.length).fill(0);
		const spread = 0.2; // скорость распространения

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
		this.time += dt;

		// Физика камеры (покачивание)
		if (this.state !== 'CHANGING_SHELF') {
			this.cameraX = Math.sin(this.time / 800) * 5;
			this.cameraY = Math.cos(this.time / 600) * 8;
			this.cameraScale = 1 + Math.sin(this.time / 1000) * 0.02;
		}

		if (this.state === 'WAITING_SCENE') {
			this.stateTimer += dt;
			// Камера трясется от взрыва
			if (this.stateTimer < 500) {
				this.cameraX += (Math.random() - 0.5) * 15;
				this.cameraY += (Math.random() - 0.5) * 15;
			}

			// Наблюдаем за падением 2 секунды
			if (this.stateTimer > 2000) {
				this.triggerShelfChange();
			}
		}

		if (this.state === 'CHANGING_SHELF') {
			this.shelfAnimProgress += dt / 1500;

			// Камера переезжает
			// progress: 0 -> 1. Отводим камеру вправо (сцена уезжает влево)
			const p = this.shelfAnimProgress;
			const easeInOut = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

			this.cameraX = -easeInOut * 1000;
			this.cameraY = Math.sin(p * Math.PI) * 50; // легкий отлет по дуге

			if (this.shelfAnimProgress >= 1) {
				this.state = 'IDLE';
				this.color = this.targetColor;
				this.cameraX = 0;
				this.cameraY = 0;
				this.shards = [];
				this.droplets = [];
				this.initSprings();
				this.initBubbles();
			}
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
			if (this.mainBubble.radius > 6 * SCALE) {
				// Лимит увеличен
				this.state = 'FLASK_HOVERING';
			}
		}

		this.updateSprings();

		this.bubbles.forEach((b) => b.update(dt, this.state === 'FLASK_HOVERING', this));
		this.bubbles = this.bubbles.filter((b) => !b.popped);

		this.droplets.forEach((d) => d.update(dt));
		this.droplets = this.droplets.filter((d) => d.life > 0);

		this.shards.forEach((s) => s.update(dt));
		this.shards = this.shards.filter((s) => s.life > 0);
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

	private drawConveyorBackground() {
		// Конвейер и колбы на заднем плане (в CHANGING_SHELF)
		const p = this.shelfAnimProgress;
		const offset = p * 1000;

		this.uiCtx.save();
		// Отдаляем фон (глубина)
		this.uiCtx.scale(0.6, 0.6);
		this.uiCtx.globalAlpha = 0.4;

		// Линия конвейера
		this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
		this.uiCtx.lineWidth = 2;
		this.uiCtx.beginPath();
		this.uiCtx.moveTo(0, this.height * 1.5);
		this.uiCtx.lineTo(this.width * 2, this.height * 1.5);
		this.uiCtx.stroke();

		// Рисуем проходящие на заднем плане колбы
		for (let i = 0; i < 5; i++) {
			const xPos = (i * 300 - offset) % 1500;
			if (xPos < -200 || xPos > this.width * 2 + 200) continue;

			this.uiCtx.save();
			this.uiCtx.translate(xPos + 500, this.height * 1.5 - 24 * SCALE);

			this.uiCtx.fillStyle = `hsl(${(i * 70) % 360}, 40%, 30%)`; // Темные и тусклые
			this.createFlaskPath(this.uiCtx, true);
			this.uiCtx.fill();

			this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
			this.createFlaskPath(this.uiCtx, false);
			this.uiCtx.stroke();

			this.uiCtx.restore();
		}
		this.uiCtx.restore();

		// Целевая колба выезжает в наш фокус
		const movement = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // easeInOut
		const targetX = this.width + 500 - movement * 1500;
		if (p > 0.4) {
			this.uiCtx.save();

			// Масштабируем из фона на передний план
			const scale = 0.5 + movement * 0.5;
			this.uiCtx.translate(targetX, this.height / 2 - 12 * SCALE);
			this.uiCtx.scale(scale, scale);

			this.uiCtx.fillStyle = this.targetColor;
			this.createFlaskPath(this.uiCtx, true);
			this.uiCtx.fill();

			this.uiCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
			this.uiCtx.lineWidth = 1;
			this.createFlaskPath(this.uiCtx, false);
			this.uiCtx.stroke();

			this.uiCtx.restore();
		}
	}

	draw() {
		this.fluidCtx.clearRect(0, 0, this.width, this.height);
		this.uiCtx.clearRect(0, 0, this.width, this.height);

		if (this.state === 'CHANGING_SHELF') {
			this.drawConveyorBackground();
			// Осколки и капли от предыдущей колбы продолжают падать, но они смещаются вместе с камерой
		}

		const centerX = this.width / 2 - 12 * SCALE;
		const centerY = this.height / 2 - 12 * SCALE;

		this.fluidCtx.save();
		this.uiCtx.save();

		// Применяем камеру
		this.fluidCtx.translate(centerX + this.cameraX, centerY + this.cameraY);
		this.fluidCtx.scale(this.cameraScale, this.cameraScale);

		this.uiCtx.translate(centerX + this.cameraX, centerY + this.cameraY);
		this.uiCtx.scale(this.cameraScale, this.cameraScale);

		// Если колба цела - рисуем жидкость и UI колбы
		if (this.state !== 'WAITING_SCENE' && this.state !== 'CHANGING_SHELF') {
			// FLUID LAYER (clipped)
			this.fluidCtx.save();
			this.createFlaskPath(this.fluidCtx, true);
			this.fluidCtx.clip();

			// Рисуем поверхность воды с пружинами
			this.fluidCtx.fillStyle = this.color;
			this.fluidCtx.beginPath();

			const startX = 10 * SCALE;
			const endX = 14 * SCALE;
			const step = (endX - startX) / (this.springs.length - 1);

			this.fluidCtx.moveTo(startX, this.springs[0].y);
			for (let i = 1; i < this.springs.length; i++) {
				this.fluidCtx.lineTo(startX + i * step, this.springs[i].y);
			}

			// Замыкаем до дна
			this.fluidCtx.lineTo(21 * SCALE, 21 * SCALE);
			this.fluidCtx.lineTo(3 * SCALE, 21 * SCALE);
			this.fluidCtx.closePath();
			this.fluidCtx.fill();

			// Внутренние пузыри
			this.bubbles.filter((b) => !b.isMain).forEach((b) => b.draw(this.fluidCtx, this.color));
			this.fluidCtx.restore();

			// MAIN BUBBLE (вне маски)
			if (this.mainBubble) {
				this.mainBubble.draw(this.fluidCtx, this.color);
			}

			// МИНИМАЛИСТИЧНЫЙ UI КОЛБЫ (без Frutiger Aero)
			this.uiCtx.strokeStyle = 'rgba(255,255,255,0.2)';
			this.uiCtx.lineWidth = 1;
			this.createFlaskPath(this.uiCtx, false);
			this.uiCtx.stroke();

			// Легкий матовый эффект (Glassmorphism)
			this.uiCtx.fillStyle = 'rgba(255,255,255,0.03)';
			this.uiCtx.fill();

			// Едва заметные отблески слева
			this.uiCtx.strokeStyle = 'rgba(255,255,255,0.4)';
			this.uiCtx.lineWidth = 1;
			this.uiCtx.beginPath();
			this.uiCtx.moveTo(11.5 * SCALE, 3 * SCALE);
			this.uiCtx.lineTo(11.5 * SCALE, 9.5 * SCALE);
			this.uiCtx.lineTo(6 * SCALE, 19 * SCALE);
			this.uiCtx.stroke();
		}

		// РИСУЕМ КАПЛИ И ОСКОЛКИ ВЕЗДЕ
		this.droplets.forEach((d) => d.draw(this.fluidCtx, this.color));
		this.shards.forEach((s) => s.draw(this.uiCtx));

		this.fluidCtx.restore();
		this.uiCtx.restore();
	}
}
