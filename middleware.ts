import { withAuth } from "next-auth/middleware";

/** JWT обязателен для всех страниц кроме API и статики. */
export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|offline\\.html|icon-192\\.png|icon-512\\.png|apple-touch-icon\\.png|icon\\.svg).*)",
  ],
};