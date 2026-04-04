/**
 * NextAuth API route handler (login via username & password).
 * Экспортирует GET и POST обработчики для Next.js app/api.
 * Следует новым соглашениям Next.js API Route Handlers (app router).
 *
 * Подробнее о настройках: см. lib/auth.ts (authOptions).
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Оборачиваем вызов NextAuth для поддержки edge/fetch API и возможных доработок
const handler = (req: Request, ctx: any) => {
  // Можно расширять: логирование, доп. параметры, прометей и т.д.
  return NextAuth(authOptions)(req, ctx);
};

export { handler as GET, handler as POST };
