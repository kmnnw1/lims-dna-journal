"use client";

/**
 * Универсальный провайдер приложения:
 * - Поддержка сессий пользователя (NextAuth)
 * - Инициализация PWA (Progressive Web App)
 * Добавляйте другие глобальные провайдеры здесь при необходимости.
 */
import { SessionProvider } from "next-auth/react";
import { PwaBootstrap } from "@/components/PwaBootstrap";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {/* PWA bootstrapper. Появляется один раз на уровне всего приложения */}
      <PwaBootstrap />
      {children}
    </SessionProvider>
  );
}
