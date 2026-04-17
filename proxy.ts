import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const isLoginPage = req.nextUrl.pathname === '/login';

		if (token && isLoginPage) {
			return NextResponse.redirect(new URL('/', req.url));
		}
	},
	{
		callbacks: {
			authorized: ({ token }) => {
				return Boolean(token && typeof token === 'object');
			},
		},
		pages: {
			signIn: '/login',
		},
	},
);

export const config = {
	matcher: [
		'/((?!api/auth|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icon-.*\\.png|apple-touch-icon\\.png).*)',
	],
};
