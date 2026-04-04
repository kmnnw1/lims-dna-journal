import { withAuth } from "next-auth/middleware";

/**
 * Применяет JWT-аутентификацию ко всем страницам, кроме API и статических ассетов.
 * Разрешены страницы только с валидным токеном.
 */
const middleware = withAuth({
  callbacks: {
    authorized: ({ token }) => {
      // Явно проверяем существование и тип токена
      return Boolean(token && typeof token === "object");
    },
  },
  // Можно добавить страницу для редиректа неавторизованных:
  // pages: { signIn: "/login" },
});

export default middleware;

export const config = {
  /**
   * Исключаем из аутентификации:
   * - API-роуты
   * - ассеты Next.js (_next/static, _next/image)
   * - файлы для PWA и иконки
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|icon\\.svg).*)",
  ],
};