"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function usePwaInstall() {
  const [beforeInstall, setBeforeInstall] = useState<BeforeInstallPrompt | null>(null);
  const [iosShareHint, setIosShareHint] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    setStandalone(inStandalone);

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIosShareHint(ios && !inStandalone);

    const onBip = (e: Event) => {
      e.preventDefault();
      setBeforeInstall(e as BeforeInstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!beforeInstall) return;
    await beforeInstall.prompt();
    await beforeInstall.userChoice;
    setBeforeInstall(null);
  }, [beforeInstall]);

  return {
    canPromptInstall: Boolean(beforeInstall) && !standalone,
    iosShareHint: iosShareHint && !standalone,
    promptInstall,
    standalone,
  };
}
