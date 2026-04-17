'use client';

import {
	Database,
	Dna,
	FileSpreadsheet,
	Fingerprint,
	FlaskConical,
	Lock,
	ShieldCheck,
	UserSquare2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type DBNode = {
	id: string;
	label: string;
	desc: string;
	fullDesc: { key: string; name: string }[];
	icon: any;
	baseX: number;
	baseY: number;
	phaseX: number;
	phaseY: number;
	color: string;
	bg: string;
};

// Расширяем узлы русскими артибутами ключей
const NODES: DBNode[] = [
	{
		id: 'specimen',
		label: 'Specimen',
		desc: 'Пробы и образцы',
		icon: Fingerprint,
		baseX: 20,
		baseY: 50,
		phaseX: 0.1,
		phaseY: 0.3,
		color: 'var(--md-sys-color-primary)',
		bg: 'var(--md-sys-color-primary-container)',
		fullDesc: [
			{ key: 'PK', name: 'id (UUID)' },
			{ key: 'UK', name: 'taxon (Таксон)' },
			{ key: '---', name: 'locality (Локализация)' },
			{ key: '---', name: 'notes (Заметки)' },
		],
	},
	{
		id: 'extraction',
		label: 'DNA Extraction',
		desc: 'Выделение ДНК',
		icon: FlaskConical,
		baseX: 50,
		baseY: 20,
		phaseX: 0.5,
		phaseY: 0.8,
		color: 'var(--md-sys-color-secondary)',
		bg: 'var(--md-sys-color-secondary-container)',
		fullDesc: [
			{ key: 'PK', name: 'id (UUID)' },
			{ key: 'FK', name: 'specimen_id (К пробе)' },
			{ key: '---', name: 'method (Метод)' },
			{ key: '---', name: 'operator (Лаборант)' },
		],
	},
	{
		id: 'pcr',
		label: 'PCR Reaction',
		desc: 'ПЦР скрининг',
		icon: Dna,
		baseX: 80,
		baseY: 50,
		phaseX: 0.8,
		phaseY: 0.1,
		color: 'var(--md-sys-color-tertiary)',
		bg: 'var(--md-sys-color-tertiary-container)',
		fullDesc: [
			{ key: 'PK', name: 'id (UUID)' },
			{ key: 'FK', name: 'extraction_id (К выделению)' },
			{ key: '---', name: 'marker (ITS/LSU/SSU)' },
			{ key: '---', name: 'date (Дата)' },
			{ key: '---', name: 'success (Успешность)' },
		],
	},
	{
		id: 'users',
		label: 'System Users',
		desc: 'Пользователи LIMS',
		icon: UserSquare2,
		baseX: 50,
		baseY: 80,
		phaseX: 0.2,
		phaseY: 0.9,
		color: 'var(--md-sys-color-error)',
		bg: 'var(--md-sys-color-error-container)',
		fullDesc: [
			{ key: 'PK', name: 'id (UUID)' },
			{ key: 'UK', name: 'login (Логин)' },
			{ key: '---', name: 'role (ADMIN/EDITOR)' },
			{ key: '---', name: 'hash (Хэш пароля)' },
		],
	},
];

const LINKS = [
	{ source: 'specimen', target: 'extraction', label: 'Имеет выделения (1:N)' },
	{ source: 'extraction', target: 'pcr', label: 'Основа для ПЦР (1:N)' },
	{ source: 'users', target: 'specimen', label: 'Создает/Редактирует' },
	{ source: 'users', target: 'extraction', label: 'Проводит' },
	{ source: 'users', target: 'pcr', label: 'Анализирует' },
];

export function ERModelVisualizer() {
	const [_time, setTime] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

	// Стейт интерактивности
	const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
	const [draggedNode, setDraggedNode] = useState<string | null>(null);
	const draggedNodeRef = useRef<string | null>(null);

	const [dragStartMousePos, setDragStartMousePos] = useState<{ x: number; y: number } | null>(
		null,
	);

	// Физика
	const physicsRef = useRef<Record<string, { x: number; y: number; vx: number; vy: number }>>({});
	const dimsRef = useRef(dimensions);
	const [, forceRender] = useState(0);

	useEffect(() => {
		dimsRef.current = dimensions;
		// Init physics positions if empty
		if (dimensions.width > 0) {
			NODES.forEach((n) => {
				if (!physicsRef.current[n.id]) {
					physicsRef.current[n.id] = {
						x: (n.baseX / 100) * dimensions.width,
						y: (n.baseY / 100) * dimensions.height,
						vx: 0,
						vy: 0,
					};
				}
			});
		}
	}, [dimensions]);

	useEffect(() => {
		let reqId: number;
		let t = 0;
		const tick = () => {
			t += 0.016;
			setTime(t);

			const phys = physicsRef.current;
			const dims = dimsRef.current;

			if (dims.width > 0) {
				NODES.forEach((n1) => {
					const nodePhys = phys[n1.id];
					if (!nodePhys) return;

					if (draggedNodeRef.current === n1.id) {
						nodePhys.vx = 0;
						nodePhys.vy = 0;
						return; // mouse controls it
					}

					// Gravity to base
					const targetX = (n1.baseX / 100) * dims.width;
					const targetY = (n1.baseY / 100) * dims.height;
					const driftX = Math.sin(t * 0.8 + n1.phaseX * Math.PI * 2) * 15;
					const driftY = Math.cos(t * 1.1 + n1.phaseY * Math.PI * 2) * 15;

					const dx = targetX + driftX - nodePhys.x;
					const dy = targetY + driftY - nodePhys.y;

					nodePhys.vx += dx * 0.02;
					nodePhys.vy += dy * 0.02;

					// Repulsion from other nodes
					NODES.forEach((n2) => {
						if (n1.id === n2.id) return;
						const p2 = phys[n2.id];
						if (!p2) return;
						const adx = nodePhys.x - p2.x;
						const ady = nodePhys.y - p2.y;
						const dist = Math.sqrt(adx * adx + ady * ady);
						if (dist < 300 && dist > 0) {
							const force = (300 - dist) / 500;
							nodePhys.vx += (adx / dist) * force;
							nodePhys.vy += (ady / dist) * force;
						}
					});

					// Damping and Velocity
					nodePhys.vx *= 0.82;
					nodePhys.vy *= 0.82;
					nodePhys.x += nodePhys.vx;
					nodePhys.y += nodePhys.vy;

					// Wall bouncing logic
					if (nodePhys.x < 120) {
						nodePhys.x = 120;
						nodePhys.vx *= -0.5;
					}
					if (nodePhys.x > dims.width - 120) {
						nodePhys.x = dims.width - 120;
						nodePhys.vx *= -0.5;
					}
					if (nodePhys.y < 80) {
						nodePhys.y = 80;
						nodePhys.vy *= -0.5;
					}
					if (nodePhys.y > dims.height - 80) {
						nodePhys.y = dims.height - 80;
						nodePhys.vy *= -0.5;
					}
				});
			}

			forceRender(Date.now());
			reqId = requestAnimationFrame(tick);
		};
		reqId = requestAnimationFrame(tick);

		const updateDims = () => {
			if (containerRef.current) {
				setDimensions({
					width: containerRef.current.clientWidth,
					height: containerRef.current.clientHeight,
				});
			}
		};
		updateDims();
		window.addEventListener('resize', updateDims);

		return () => {
			cancelAnimationFrame(reqId);
			window.removeEventListener('resize', updateDims);
		};
	}, []);

	const handlePointerDown = (e: React.PointerEvent, id: string) => {
		const rect = containerRef.current?.getBoundingClientRect();
		if (!rect) return;

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		setDraggedNode(id);
		draggedNodeRef.current = id;

		const px = e.clientX - rect.left;
		const py = e.clientY - rect.top;
		if (physicsRef.current[id]) {
			physicsRef.current[id].x = px;
			physicsRef.current[id].y = py;
		}

		setDragStartMousePos({ x: e.clientX, y: e.clientY }); // Используем абсолютные для детекта клика
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!draggedNodeRef.current) return;
		const rect = containerRef.current?.getBoundingClientRect();
		if (!rect) return;

		if (physicsRef.current[draggedNodeRef.current]) {
			physicsRef.current[draggedNodeRef.current].x = e.clientX - rect.left;
			physicsRef.current[draggedNodeRef.current].y = e.clientY - rect.top;
		}
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (draggedNodeRef.current) {
			// Проверка: был ли это клик (перемещение курсора минимально)?
			if (dragStartMousePos) {
				const dx = e.clientX - dragStartMousePos.x;
				const dy = e.clientY - dragStartMousePos.y;
				if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
					toggleExpand(draggedNodeRef.current);
				}
			}

			setDraggedNode(null);
			draggedNodeRef.current = null;
			setDragStartMousePos(null);
			(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		}
	};

	const toggleExpand = (id: string) => {
		setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
	};

	return (
		<div
			ref={containerRef}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerLeave={handlePointerUp}
			className="w-full h-[500px] bg-[var(--md-sys-color-surface-container-low)] rounded-[2.5rem] relative overflow-hidden shadow-sm group select-none touch-none"
		>
			<div
				className="absolute inset-0 opacity-5"
				style={{
					backgroundImage:
						'radial-gradient(var(--md-sys-color-on-surface) 1.5px, transparent 1.5px)',
					backgroundSize: '30px 30px',
				}}
			/>

			<svg className="absolute inset-0 w-full h-full pointer-events-none">
				<defs>
					{LINKS.map((link, i) => {
						const sN = NODES.find((n) => n.id === link.source);
						const tN = NODES.find((n) => n.id === link.target);
						return (
							<linearGradient
								key={`grad-${i}`}
								id={`glowLine-${i}`}
								x1="0%"
								y1="0%"
								x2="100%"
								y2="100%"
							>
								<stop offset="0%" stopColor={sN?.color} stopOpacity="0.8" />
								<stop offset="100%" stopColor={tN?.color} stopOpacity="0.8" />
							</linearGradient>
						);
					})}
				</defs>
				{LINKS.map((link, i) => {
					const sourceNode = NODES.find((n) => n.id === link.source);
					const targetNode = NODES.find((n) => n.id === link.target);
					if (!sourceNode || !targetNode) return null;

					const p1 = physicsRef.current[link.source];
					const p2 = physicsRef.current[link.target];
					if (!p1 || !p2) return null;

					const midX = (p1.x + p2.x) / 2;
					const midY = (p1.y + p2.y) / 2;

					const dx = p2.x - p1.x;
					const dy = p2.y - p1.y;
					let angle = Math.atan2(dy, dx) * (180 / Math.PI);
					let flipText = false;

					if (Math.abs(angle) > 90) {
						angle += 180;
						flipText = true;
					}

					const bothExpanded = expandedNodes[link.source] && expandedNodes[link.target];

					return (
						<g key={i}>
							<path
								d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
								fill="none"
								stroke={`url(#glowLine-${i})`}
								strokeWidth="3"
								strokeDasharray="8 6"
								className="opacity-60 group-hover:opacity-100 transition-opacity duration-300"
							/>
							{bothExpanded && (
								<g
									transform={`translate(${midX}, ${midY}) rotate(${angle}) translate(0, -10)`}
								>
									<rect
										x="-70"
										y="-12"
										width="140"
										height="24"
										fill="var(--md-sys-color-surface-container-highest)"
										rx="12"
										className="shadow-sm"
									/>
									<text
										x="0"
										y="4"
										textAnchor="middle"
										fontSize="11"
										fill={`url(#glowLine-${i})`}
										fontWeight="700"
										style={{ letterSpacing: '0.5px' }}
									>
										{flipText ? `← ${link.label}` : `${link.label} →`}
									</text>
								</g>
							)}
						</g>
					);
				})}
			</svg>

			{NODES.map((n) => {
				const isDragging = draggedNode === n.id;
				const p = physicsRef.current[n.id];
				if (!p) return null;

				const curX = p.x;
				const curY = p.y;

				const expanded = expandedNodes[n.id];
				const Icon = n.icon;

				return (
					<div
						key={n.id}
						onPointerDown={(e) => handlePointerDown(e, n.id)}
						className={`absolute flex flex-col p-4 rounded-2xl shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing hover:z-20 ${expanded ? 'z-30 w-72' : 'w-48 z-10'}`}
						style={{
							left: curX,
							top: Math.max(0, curY),
							transform: 'translate(-50%, -50%)',
							backgroundColor: n.bg,
							color: n.color,
							border: `1px solid ${n.color}40`,
							transition: isDragging
								? 'none'
								: 'box-shadow 0.3s, transform 0.2s, background-color 0.3s',
						}}
					>
						<div className="flex items-center gap-3 w-full pointer-events-none">
							<Icon className="w-8 h-8 opacity-80 shrink-0" />
							<div className="flex-1 min-w-0">
								<div className="font-medium tracking-tight text-sm uppercase opacity-90 truncate">
									{n.label}
								</div>
								{!expanded && (
									<div className="text-xs opacity-70 font-mono mt-0.5 truncate">
										{n.desc}
									</div>
								)}
							</div>
						</div>

						{expanded && (
							<div className="mt-4 pt-3 border-t border-[var(--md-sys-color-outline)]/20 space-y-2 pointer-events-none">
								<div className="text-xs font-medium opacity-80 uppercase tracking-widest text-[var(--md-sys-color-on-surface)]">
									{n.desc}
								</div>
								<div className="space-y-1 mt-2">
									{n.fullDesc.map((attr, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between text-xs font-mono"
										>
											<span
												className={`px-1.5 py-0.5 rounded ${attr.key === 'PK' ? 'bg-[var(--md-sys-color-primary)] text-white' : attr.key === 'FK' ? 'bg-[var(--md-sys-color-tertiary)] text-white' : 'bg-black/5 dark:bg-white/5 opacity-70'}`}
											>
												{attr.key}
											</span>
											<span className="opacity-90">{attr.name}</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				);
			})}

			<div className="absolute top-6 left-8 flex flex-col gap-1 text-[var(--md-sys-color-on-surface)] opacity-40 pointer-events-none">
				<div className="flex items-center gap-2">
					<Database className="w-5 h-5" />
					<span className="text-sm font-medium uppercase tracking-widest">
						DNA Lab ER-Model
					</span>
				</div>
				<div className="text-xs font-mono pl-7">Drag nodes • Click node for metadata</div>
			</div>
		</div>
	);
}
