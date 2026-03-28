"use client";

/** Обёртка сессии NextAuth для клиентских компонентов. */
import { SessionProvider } from "next-auth/react";
import { PwaBootstrap } from "@/components/PwaBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaBootstrap />
      {children}
    </SessionProvider>
  );
}