"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

/**
 * Представляет интерфейс детектора штрихкодов.
 */
type BarcodeDetectorClass = new (opts?: { formats?: string[] }) => {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

const FORMATS = [
  "qr_code",
  "code_128",
  "code_39",
  "ean_13",
  "data_matrix",
  "itf",
];

/**
 * Свойства диалога сканирования штрихкода.
 */
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

  // Автоматически синхронизируем последние версии колбеков
  useEffect(() => {
    onCodeRef.current = onCode;
    onCloseRef.current = onClose;
  }, [onCode, onClose]);

  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [hasDetector, setHasDetector] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Основная логика работы: открытие камеры, сканирование, обработка ошибок
  useEffect(() => {
    if (!open) {
      stopCamera();
      setError("");
      setManual("");
      setHasDetector(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const BD = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorClass })
        .BarcodeDetector;
      setHasDetector(typeof BD === "function");

      if (typeof BD !== "function") {
        setError("Сканер недоступен в вашем браузере. Введите ID вручную.");
        return;
      }

      setError("");
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
            // Кадр еще не готов или ошибка — пробуем еще раз на следующем animationFrame
          }
          rafRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err: any) {
        if (!cancelled) {
          if (
            err?.name === "NotAllowedError" ||
            err?.name === "PermissionDeniedError"
          ) {
            setError(
              "Отказано в доступе к камере. Предоставьте разрешение или введите ID вручную."
            );
          } else if (
            err?.name === "NotFoundError" ||
            err?.name === "DevicesNotFoundError"
          ) {
            setError(
              "Камера не найдена. Подключите камеру или введите ID вручную."
            );
          } else {
            setError(
              "Нет доступа к камере. Введите ID вручную или проверьте разрешения."
            );
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  // Обработка отправки вручную
  const applyManual = () => {
    const t = manual.trim();
    if (!t) return;
    stopCamera();
    onCodeRef.current(t);
    onCloseRef.current();
  };

  // Реализация клавиши Enter для поля ручного ввода
  const onManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyManual();
    }
  };

  // Обработка Esc для закрытия окна
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stopCamera();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [open, stopCamera]);

  // Фокус на поле ручного ввода при ручном режиме
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    // Фокусируем, только если нет потоковой камеры (например, на ошибке)
    if ((!hasDetector || error) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, hasDetector, error]);

  if (!open) return null;

  return (
    <div
      className="safe-pt fixed inset-0 z-[120] flex flex-col bg-black/90 p-3 print:hidden"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="mb-2 flex items-center justify-between text-white">
        <p className="text-sm font-medium">Сканируйте ID / QR-код</p>
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
      {hasDetector && !error && (
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/20 bg-black">
          <video
            ref={videoRef}
            className="max-h-full min-h-[40vh] w-full object-cover"
            playsInline
            muted
            autoFocus
          />
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/80">
            Наведите камеру на штрихкод или QR-код этикетки
          </p>
        </div>
      )}
      {error && (
        <p className="mt-3 text-center text-sm text-amber-200">{error}</p>
      )}
      <div className="mt-4 space-y-2 safe-pb">
        <input
          ref={inputRef}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          onKeyDown={onManualKeyDown}
          placeholder="Или введите ID пробы вручную"
          className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-teal-400"
          spellCheck={false}
          maxLength={48}
          autoFocus={!hasDetector || !!error}
          aria-label="Ручной ввод ID"
        />
        <button
          type="button"
          onClick={applyManual}
          className="w-full rounded-2xl bg-teal-500 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.99]"
          disabled={!manual.trim()}
        >
          Искать
        </button>
        <p className="text-xs text-center text-white/60 select-none">* Для сканирования и ручного ввода поддерживаются и цифры, и латиница</p>
      </div>
    </div>
  );
}
