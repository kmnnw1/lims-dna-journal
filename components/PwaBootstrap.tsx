"use client";

import { useEffect } from "react";

/** Регистрация service worker в production (критерий установки PWA в Chrome). */
export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
