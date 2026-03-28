"use client";

import { useEffect, useRef } from "react";

/** Pull-to-refresh у верхнего края страницы (touch). */
export function usePullToRefresh(onRefresh: () => void | Promise<void>, disabled?: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    let startY = 0;
    let armed = false;
    const threshold = 88;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 8) return;
      startY = e.touches[0].clientY;
      armed = true;
    };
    const onMove = (e: TouchEvent) => {
      if (!armed) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > threshold) {
        armed = false;
        void Promise.resolve(onRefresh());
      }
    };
    const onEnd = () => {
      armed = false;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [onRefresh, disabled]);
  return ref;
}
