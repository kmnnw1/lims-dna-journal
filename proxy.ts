import {withAuth} from 'next-auth/middleware';

export default withAuth({
	callbacks: {
		authorized: ({token}) => {
			return Boolean(token && typeof token === 'object');
		},
	},
	pages: {
		signIn: '/login',
	},
});

export const config = {
	matcher: [
		'/((?!api/auth|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|offline\\.html|icon-.*\\.png|apple-touch-icon\\.png).*)',
	],
};
