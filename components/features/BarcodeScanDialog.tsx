'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

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

	const [error, setError] = useState('');
	const [manual, setManual] = useState('');
	const [hasDetector, setHasDetector] = useState(false);

	const stopCamera = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
	}, []);

	useEffect(() => {
		if (!open) {
			stopCamera();
			setError('');
			setManual('');
			setHasDetector(false);
			return;
		}

		let cancelled = false;

		(async () => {
			const BD = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
			setHasDetector(typeof BD === 'function');

			if (typeof BD !== 'function') {
				setError('Сканер недоступен в вашем браузере. Введите ID вручную.');
				return;
			}

			setError('');
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: 'environment' } },
					audio: false,
				});
				if (cancelled) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}
				streamRef.current = stream;
				const v = videoRef.current;
				if (v) {
					v.srcObject = stream;
					await v.play();
				}
				const detector = new BD({ formats: FORMATS });

				const tick = async () => {
					if (cancelled || !videoRef.current) return;
					try {
						const codes = await detector.detect(videoRef.current);
						if (codes.length > 0) {
							const raw = codes[0].rawValue.trim();
							stopCamera();
							onCodeRef.current(raw);
							onCloseRef.current();
							return;
						}
					} catch {}
					rafRef.current = requestAnimationFrame(tick);
				};

				tick();
			} catch (err: any) {
				if (!cancelled) {
					setError('Нет доступа к камере. Введите ID вручную или проверьте разрешения.');
				}
			}
		})();

		return () => {
			cancelled = true;
			stopCamera();
		};
	}, [open, stopCamera]);

	const applyManual = () => {
		const t = manual.trim();
		if (!t) return;
		stopCamera();
		onCodeRef.current(t);
		onCloseRef.current();
	};

	const onManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') applyManual();
	};

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				stopCamera();
				onCloseRef.current();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [open, stopCamera]);

	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (open && (!hasDetector || error) && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open, hasDetector, error]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[120] flex flex-col bg-[var(--md-sys-color-surface)] sm:p-4 print:hidden animate-in fade-in duration-200" aria-modal="true" role="dialog" tabIndex={-1}>
			<div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-[var(--md-sys-color-surface-container-low)] sm:rounded-[2.5rem] shadow-2xl overflow-hidden">
				
				<div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-container)]">
					<p className="text-lg font-medium text-[var(--md-sys-color-on-surface)] ml-2">Сканирование ID</p>
					<button type="button" onClick={() => { stopCamera(); onClose(); }} className="p-3 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] transition-all">
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="flex-1 flex flex-col p-4 gap-4">
					{hasDetector && !error && (
						<div className="relative flex-1 overflow-hidden rounded-[2rem] bg-black shadow-inner">
							<video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoFocus />
							<div className="absolute inset-0 border-4 border-[var(--md-sys-color-primary)]/30 rounded-[2rem] pointer-events-none" />
							<p className="absolute bottom-6 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-md bg-black/40 py-2 mx-8 rounded-full backdrop-blur-sm">
								Наведите на штрихкод
							</p>
						</div>
					)}
					
					{error && (
						<div className="flex-1 flex items-center justify-center p-6 bg-[var(--md-sys-color-error-container)] rounded-[2rem] text-[var(--md-sys-color-on-error-container)] text-center font-medium">
							{error}
						</div>
					)}

					<div className="mt-auto space-y-4 pt-4 pb-safe">
						<div className="relative group">
							<input
								ref={inputRef}
								value={manual}
								onChange={(e) => setManual(e.target.value)}
								onKeyDown={onManualKeyDown}
								className="w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-high)] px-5 pt-6 pb-2 text-base outline-none transition-all text-[var(--md-sys-color-on-surface)]"
								spellCheck={false}
								maxLength={48}
								autoFocus={!hasDetector || !!error}
							/>
							<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
								${manual ? 'top-1.5 text-xs' : 'top-4 text-base'}
								group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
							`}>
								Ввести вручную
							</label>
						</div>

						<button
							type="button"
							onClick={applyManual}
							className="w-full py-4 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
							disabled={!manual.trim()}>
							Искать
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
