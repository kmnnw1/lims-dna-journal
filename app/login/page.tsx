'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { MD3Field } from '@/components/ui/MD3Field';

import { useRouter } from 'next/navigation';

// Динамический импорт для предотвращения Hydration Error (Math.random)
const AnimatedFlask = dynamic(
	() => import('@/components/ui/AnimatedFlask').then(mod => mod.AnimatedFlask),
	{ ssr: false }
);

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tokenParam = searchParams.get('token');
	const autoSubmitted = useRef(false);
	
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState(tokenParam || '');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const res = await signIn('credentials', {
				username,
				password: password.trim(),
				token: password.trim(),
				redirect: false,
			});

			if (res?.error) {
				setError('Неверный логин или токен');
				setLoading(false);
			} else {
				// Принудительный редирект на главную
				router.push('/');
				router.refresh(); // Обновляем состояние сессии во всем приложении
				
				// Fallback в случае зависания роутера
				setTimeout(() => {
					window.location.href = '/';
				}, 500);
			}
		} catch (_err) {
			setError('Произошла ошибка при входе');
			setLoading(false);
		}
	};

	// Auto-submit при наличии токена в URL (Hiddify-style)
	useEffect(() => {
		if (tokenParam && !autoSubmitted.current) {
			autoSubmitted.current = true;
			handleSubmit();
		}
	}, [tokenParam]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="min-h-screen flex items-center justify-center bg-[var(--md-sys-color-surface)] p-4 font-sans relative overflow-hidden transition-colors duration-300">
			{/* Декоративные пятна (MD3 Expressive flavor) */}
			<div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--md-sys-color-primary-container)]/30 blur-[100px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--md-sys-color-primary)]/10 blur-[100px] pointer-events-none" />

			{/* MD3 Dialog Surface */}
			<div className="w-full max-w-[440px] bg-[var(--md-sys-color-surface-container-low)] rounded-[3rem] shadow-2xl p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500">
				<div className="flex flex-col items-center text-center mb-10">
					<div className="w-24 h-24 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-[1.75rem] flex items-center justify-center mb-8 shadow-sm">
						<AnimatedFlask />
					</div>
					<h1 className="text-4xl font-normal tracking-tight text-[var(--md-sys-color-on-surface)] mb-3">
						Вход в систему
					</h1>
					<p className="text-[var(--md-sys-color-outline)] text-base font-medium">
						Лабораторный журнал (LIMS)
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<MD3Field
						label="Имя пользователя (только для legacy)"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						autoComplete="username"
					/>

					<MD3Field
						label="Одноразовый токен или пароль"
						type="password"
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
					/>

					{error && (
						<div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-5 rounded-[1.5rem] text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-2">
							<AlertCircle className="w-6 h-6 shrink-0" />
							{error}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center gap-3 bg-[var(--md-sys-color-primary)] hover:brightness-110 text-[var(--md-sys-color-on-primary)] rounded-full px-8 py-5 text-lg font-medium md-elevation-1 hover:md-elevation-2 active:scale-95 transition-all mt-6 disabled:opacity-70 disabled:active:scale-100">
						{loading ? (
							<div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<>
								Войти
								<ArrowRight className="w-6 h-6" />
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center">
					<div className="animate-spin w-10 h-10 border-4 border-[var(--md-sys-color-primary)]/30 border-t-[var(--md-sys-color-primary)] rounded-full"></div>
				</div>
			}>
			<LoginContent />
		</Suspense>
	);
}
