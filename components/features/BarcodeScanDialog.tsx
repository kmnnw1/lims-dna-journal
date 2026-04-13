'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera } from 'lucide-react';

type BarcodeDetectorClass = new (opts?: { formats?: string[] }) => {
	detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

const FORMATS = ['qr_code', 'code_128', 'code_39', 'ean_13', 'data_matrix', 'itf'];

type Props = {
	open: boolean;
	onClose: () => void;
	onCode: (raw: string) => void;
};

export function BarcodeScanDialog({ open, onClose, onCode }: Props) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const rafRef = useRef(0);
	const onCodeRef = useRef(onCode);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onCodeRef.current = onCode;
		onCloseRef.current = onClose;
	}, [onCode, onClose]);

	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCloseRef.current();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	const [error, setError] = useState('');
	const [manual, setManual] = useState('');
	const [hasDetector, setHasDetector] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Хелпер для тактильного отклика (вибрации)
	const triggerHaptic = (type: 'success' | 'start') => {
		if (typeof window !== 'undefined' && window.navigator.vibrate) {
			if (type === 'success') {
				// Сочный двойной отклик при успешном сканировании
				window.navigator.vibrate([100, 50, 100]);
			} else {
				// Легкий щелчок при включении камеры
				window.navigator.vibrate(10);
			}
		}
	};

	const stopCamera = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
	}, []);

	useEffect(() => {
		if (!open) {
			stopCamera();
			return;
		}

		if (!('BarcodeDetector' in window)) {
			queueMicrotask(() => {
				setError('Сканер не поддерживается. Введите ID вручную.');
				setHasDetector(false);
			});
			return;
		}

		queueMicrotask(() => {
			setHasDetector(true);
			setError('');
			setManual('');
		});
	const BarcodeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
	if (!BarcodeDetector) {
		queueMicrotask(() => {
			setError('Сканер не поддерживается. Введите ID вручную.');
			setHasDetector(false);
		});
		return;
	}

	const detector = new BarcodeDetector({ formats: FORMATS });

	navigator.mediaDevices
		.getUserMedia({ video: { facingMode: 'environment' } })
			.then((stream) => {
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					videoRef.current.play();
					triggerHaptic('start'); // Отклик при готовности сканера
				}

				const scan = async () => {
					if (!videoRef.current || videoRef.current.readyState !== 4) {
						rafRef.current = requestAnimationFrame(scan);
						return;
					}
					try {
						const barcodes = await detector.detect(videoRef.current);
						if (barcodes.length > 0) {
							triggerHaptic('success'); // Победная вибрация!
							stopCamera();
							onCodeRef.current(barcodes[0].rawValue);
							return;
						}
					} catch (_err) {}
					rafRef.current = requestAnimationFrame(scan);
				};
				rafRef.current = requestAnimationFrame(scan);
			})
			.catch(() => {
				setError('Нет доступа к камере. Введите ID вручную.');
			});

		return stopCamera;
	}, [open, stopCamera]);

	const applyManual = () => {
		if (manual.trim()) {
			triggerHaptic('success');
			stopCamera();
			onCode(manual.trim());
		}
	};

	const onManualKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') applyManual();
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[200] flex flex-col bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] animate-in slide-in-from-bottom-full duration-300">
			<div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-container)]">
				<h2 className="text-xl font-medium flex items-center gap-2">
					<Camera className="w-5 h-5 text-[#E1AD01]" /> Сканирование
				</h2>
				<button
					onClick={onClose}
					className="p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors">
					<X className="w-6 h-6" />
				</button>
			</div>

			<div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
				<div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
					{hasDetector && !error ? (
						<div className="w-full aspect-square max-w-[300px] bg-black rounded-[3rem] overflow-hidden relative shadow-2xl border-8 border-[var(--md-sys-color-surface-container-highest)]">
							<video
								ref={videoRef}
								playsInline
								className="w-full h-full object-cover grayscale-[0.3]"
							/>
							<div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>

							<div className="absolute top-1/2 left-0 w-full h-1 bg-[#E1AD01] shadow-[0_0_20px_#E1AD01] animate-pulse"></div>

							<div className="absolute inset-10 border-2 border-[#E1AD01]/30 rounded-2xl pointer-events-none"></div>
						</div>
					) : (
						<div className="text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] p-6 rounded-3xl text-center font-medium shadow-sm">
							{error}
						</div>
					)}
				</div>

				<div className="mt-auto space-y-4 pt-4 pb-safe">
					<div className="relative group">
						<input
							ref={inputRef}
							value={manual}
							onChange={(e) => setManual(e.target.value)}
							onKeyDown={onManualKeyDown}
							className="w-full rounded-t-[1.25rem] rounded-b-[0.5rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[#E1AD01] bg-[var(--md-sys-color-surface-container-high)] px-6 pt-7 pb-3 text-lg outline-none transition-all"
							placeholder=" "
							spellCheck={false}
							autoFocus={!hasDetector || !!error}
						/>
						<label
							className={`absolute left-6 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
							${manual ? 'top-2 text-xs' : 'top-5 text-lg'}
							group-focus-within:text-[#E1AD01] group-focus-within:top-2 group-focus-within:text-xs
						`}>
							Введите ID пробы вручную
						</label>
					</div>

					<button
						type="button"
						onClick={applyManual}
						disabled={!manual.trim()}
						className="w-full py-5 rounded-full bg-[#E1AD01] text-black font-bold text-lg shadow-lg disabled:opacity-50 active:scale-95 transition-all">
						Найти пробу ⛵
					</button>
				</div>
			</div>
		</div>
	);
}
