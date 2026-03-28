"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

type BarcodeDetectorClass = new (opts?: { formats?: string[] }) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

const FORMATS = ["qr_code", "code_128", "code_39", "ean_13", "data_matrix", "itf"];

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
  onCodeRef.current = onCode;
  onCloseRef.current = onClose;
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
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
      setError("");
      setManual("");
      return;
    }
    const BD = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
    setHasDetector(typeof BD === "function");

    if (typeof BD !== "function") {
      setError("Сканер недоступен в этом браузере. Введите ID вручную.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
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
          } catch {
            /* кадр ещё не готов */
          }
          rafRef.current = requestAnimationFrame(() => {
            tick();
          });
        };
        tick();
      } catch {
        if (!cancelled) setError("Нет доступа к камере. Введите ID вручную или проверьте разрешения.");
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  if (!open) return null;

  const applyManual = () => {
    const t = manual.trim();
    if (!t) return;
    stopCamera();
    onCodeRef.current(t);
    onCloseRef.current();
  };

  return (
    <div className="safe-pt fixed inset-0 z-[120] flex flex-col bg-black/90 p-3 print:hidden">
      <div className="mb-2 flex items-center justify-between text-white">
        <p className="text-sm font-medium">Скан ID / QR</p>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="rounded-xl p-2 transition hover:bg-white/10"
          aria-label="Закрыть"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      {hasDetector && !error.includes("Нет доступа") && (
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/20 bg-black">
          <video ref={videoRef} className="max-h-full min-h-[40vh] w-full object-cover" playsInline muted />
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">
            Наведите на штрихкод или QR-код этикетки
          </p>
        </div>
      )}
      {error ? <p className="mt-3 text-center text-sm text-amber-200">{error}</p> : null}
      <div className="mt-4 space-y-2 safe-pb">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Или введите ID пробы с клавиатуры"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-teal-400"
        />
        <button
          type="button"
          onClick={applyManual}
          className="w-full rounded-2xl bg-teal-500 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.99]"
        >
          Искать
        </button>
      </div>
    </div>
  );
}
