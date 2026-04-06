'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useSession } from 'next-auth/react';
import {
	UserPlus,
	ShieldAlert,
	Trash2,
	ArrowLeft,
	Database,
	FileSpreadsheet,
	Save,
} from 'lucide-react';
import Link from 'next/link';
import { parseApiResponse } from '@/lib/api-client';

// Локальный хелпер для полей MD3
const MD3Field = forwardRef<HTMLInputElement | HTMLSelectElement, { label: string; value: string; isSelect?: boolean; children?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>>(({ label, value, isSelect, children, className = '', ...props }, ref) => {
	const baseClass = `w-full rounded-t-[1rem] rounded-b-[0.25rem] border-b-2 border-[var(--md-sys-color-outline-variant)] focus:border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface-container-highest)] px-5 pt-6 pb-2 text-base outline-none transition-all text-[var(--md-sys-color-on-surface)] ${className}`;
	
	return (
		<div className="relative group w-full">
			{isSelect ? (
				<select ref={ref as any} value={value} className={baseClass} {...props}>
					{children}
				</select>
			) : (
				<input ref={ref as any} value={value} className={baseClass} {...props} />
			)}
			<label className={`absolute left-5 transition-all duration-200 pointer-events-none text-[var(--md-sys-color-outline)]
				${value ? 'top-1.5 text-xs' : 'top-4 text-base'}
				group-focus-within:text-[var(--md-sys-color-primary)] group-focus-within:top-1.5 group-focus-within:text-xs
			`}>
				{label}
			</label>
		</div>
	);
});
MD3Field.displayName = 'MD3Field';

function UserRow({
	user: u,
	onUpdate,
	onDelete,
}: {
	user: { id: string; username: string; role: string };
	onUpdate: (id: string, role: string, password?: string) => void;
	onDelete: (id: string) => void;
}) {
	const [role, setRole] = useState(u.role);
	const [pwd, setPwd] = useState('');
	const [busy, setBusy] = useState(false);
	useEffect(() => setRole(u.role), [u.role]);

	useEffect(() => {
		setPwd('');
	}, [u.id]);

	const handleUpdateClick = async () => {
		setBusy(true);
		try {
			await onUpdate(u.id, role, pwd);
		} finally {
			setBusy(false);
		}
	};

	const handleDeleteClick = async () => {
		setBusy(true);
		try {
			await onDelete(u.id);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 rounded-[1.5rem] bg-[var(--md-sys-color-surface-container-highest)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-all">
			<div className="min-w-0">
				<p className="font-medium text-[var(--md-sys-color-on-surface)] text-lg tracking-tight">{u.username}</p>
				<p className="text-sm font-mono text-[var(--md-sys-color-primary)]">{u.role}</p>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				{u.username !== 'admin' ? (
					<>
						<div className="w-[140px]">
							<MD3Field isSelect label="Роль" value={role} onChange={(e) => setRole(e.target.value)} disabled={busy}>
								<option value="EDITOR">EDITOR</option>
								<option value="READER">READER</option>
								<option value="ADMIN">ADMIN</option>
							</MD3Field>
						</div>
						<div className="w-[160px]">
							<MD3Field type="password" label="Новый пароль" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" disabled={busy} />
						</div>
						<button
							type="button"
							onClick={handleUpdateClick}
							className="inline-flex items-center justify-center p-3 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:brightness-110 transition-all disabled:opacity-50"
							disabled={busy || (role === u.role && !pwd)}
							aria-label="Сохранить изменения"
							title="Сохранить">
							<Save className="h-5 w-5" />
						</button>
						<button
							type="button"
							onClick={handleDeleteClick}
							className="p-3 rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] hover:brightness-95 transition-all disabled:opacity-50"
							aria-label={`Удалить пользователя "${u.username}"`}
							title="Удалить"
							disabled={busy}>
							<Trash2 className="h-5 w-5" />
						</button>
					</>
				) : (
					<span className="text-sm font-medium px-4 py-2 bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] rounded-full shadow-sm">
  Главный администратор
</span>
				)}
			</div>
		</div>
	);
}

export default function AdminPage() {
	const { data: session, status } = useSession();
	const [users, setUsers] = useState<{ id: string; username: string; role: string }[]>([]);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('EDITOR');
	const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
	const [importBusy, setImportBusy] = useState(false);
	const [loadingUsers, setLoadingUsers] = useState(false);

	const toastTimeout = useRef<NodeJS.Timeout | null>(null);

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToast({ message, type });
		if (toastTimeout.current) clearTimeout(toastTimeout.current);
		toastTimeout.current = setTimeout(() => setToast(null), 4000);
	};

	async function fetchUsers() {
		setLoadingUsers(true);
		try {
			const res = await fetch('/api/users');
			const result = await parseApiResponse<{ id: string; username: string; role: string }[]>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}
			setUsers(Array.isArray(result.data) ? result.data : []);
		} finally {
			setLoadingUsers(false);
		}
	}

	useEffect(() => {
		if (session?.user?.role === 'ADMIN') fetchUsers();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session]);

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			showToast('Укажите логин и пароль', 'error');
			return;
		}
		const res = await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, role }),
		});
		const parsed = await parseApiResponse(res);
		if (!parsed.ok) {
			showToast(parsed.message, 'error');
			return;
		}
		setUsername('');
		setPassword('');
		showToast('Пользователь создан', 'success');
		fetchUsers();
	};

	const handleUpdateUser = async (id: string, newRole: string, newPassword?: string) => {
		const res = await fetch('/api/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id,
				role: newRole,
				...(newPassword && newPassword.length > 0 ? { password: newPassword } : {}),
			}),
		});
		const parsed = await parseApiResponse(res);
		if (!parsed.ok) {
			showToast(parsed.message, 'error');
			return;
		}
		showToast('Пользователь обновлён', 'success');
		fetchUsers();
	};

	const handleDeleteUser = async (id: string) => {
		if (!confirm('Точно удалить пользователя? Это действие необратимо.')) return;
		const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
		const parsed = await parseApiResponse(res);
		if (!parsed.ok) {
			showToast(parsed.message, 'error');
			return;
		}
		showToast('Удалено', 'success');
		fetchUsers();
	};

	const handleClearSpecimens = async () => {
		if (!confirm('Удалить все пробы из базы? Попытки ПЦР тоже удалятся.')) return;
		setImportBusy(true);
		try {
			const res = await fetch('/api/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'clear' }),
			});
			const result = await parseApiResponse<{ message?: string; deleted?: number }>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}
			showToast(result.data.message ?? `Удалено: ${result.data.deleted ?? 0}`, 'success');
		} finally {
			setImportBusy(false);
		}
	};

	const handleImportFromExcel = async () => {
		if (!confirm('Удалить все текущие пробы и загрузить data.xlsx из корня проекта?')) return;
		setImportBusy(true);
		try {
			const res = await fetch('/api/import');
			const result = await parseApiResponse<{ message?: string; sheets?: number; rows?: number; }>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}
			showToast(result.data.message ?? 'Импорт завершён', 'success');
		} finally {
			setImportBusy(false);
		}
	};

	if (status === 'loading') {
		return (
			<div className="min-h-screen bg-[var(--md-sys-color-surface)] p-8 animate-in fade-in flex items-center justify-center">
				<div className="animate-spin w-12 h-12 border-4 border-[var(--md-sys-color-primary)]/30 border-t-[var(--md-sys-color-primary)] rounded-full"></div>
			</div>
		);
	}

	if (session?.user?.role !== 'ADMIN') {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] px-4 text-center animate-in fade-in">
				<ShieldAlert className="mb-6 h-20 w-20 text-[var(--md-sys-color-error)]" strokeWidth={1.5} />
				<h1 className="text-3xl font-normal mb-2">Доступ запрещён</h1>
				<p className="max-w-md text-lg text-[var(--md-sys-color-outline)]">
					Для просмотра этой страницы нужны права Администратора.
				</p>
				<Link
					href="/"
					className="mt-8 rounded-full bg-[var(--md-sys-color-primary)] px-8 py-3 text-base font-medium text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg transition-all active:scale-95">
					Вернуться в журнал
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--md-sys-color-surface)] p-4 sm:p-8 text-[var(--md-sys-color-on-surface)] animate-in fade-in duration-300 pb-24">
			
			{/* MD3 Inverse Surface Toast */}
			{toast && (
				<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-[1rem] px-6 py-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 font-medium tracking-wide
					${toast.type === 'error' 
						? 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]' 
						: 'bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)]'
					}`}>
					{toast.message}
				</div>
			)}

			<div className="max-w-6xl mx-auto">
				<Link
	href="/"
	className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--md-sys-color-primary)] hover:opacity-80 transition-opacity bg-[var(--md-sys-color-surface)] shadow-md hover:shadow-lg px-5 py-2.5 rounded-full">
	<ArrowLeft className="h-4 w-4" /> В журнал
</Link>

				<h1 className="mb-10 flex items-center gap-4 text-4xl font-normal tracking-tight">
					<span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm">
						<UserPlus className="h-7 w-7" strokeWidth={1.5} />
					</span>
					Администрирование
				</h1>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					
					{/* База данных (Tonal Card) */}
					<div className="lg:col-span-3 rounded-[2.5rem] bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] p-8 shadow-sm">
						<h2 className="mb-3 flex items-center gap-3 text-2xl font-normal tracking-tight">
							<Database className="h-7 w-7" strokeWidth={1.5} />
							Импорт проб из Excel
						</h2>
						<p className="mb-6 text-base opacity-80 max-w-3xl">
							Импорт обрабатывает все листы файла
							<code className="rounded bg-black/10 mx-1.5 px-2 py-0.5 font-mono text-sm dark:bg-white/10">
								data.xlsx
							</code>
							в корне каталога сервера. Перед загрузкой текущая таблица проб очищается.
						</p>
						<div className="flex flex-wrap gap-4">
							<button
								type="button"
								disabled={importBusy}
								onClick={handleImportFromExcel}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-on-secondary-container)] px-8 py-3.5 text-base font-medium text-[var(--md-sys-color-secondary-container)] shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
								<FileSpreadsheet className="h-5 w-5" />
								Запустить импорт
							</button>
							<button
								type="button"
								disabled={importBusy}
								onClick={handleClearSpecimens}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-error-container)] px-8 py-3.5 text-base font-medium text-[var(--md-sys-color-on-error-container)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
								<Trash2 className="h-5 w-5" />
								Очистить пробы
							</button>
						</div>
					</div>

					{/* Добавление пользователя */}
					<form
						onSubmit={handleCreateUser}
						className="rounded-[2.5rem] bg-[var(--md-sys-color-surface-container-low)] p-8 shadow-sm lg:col-span-1 h-fit">
						<h2 className="mb-6 text-2xl font-normal tracking-tight">Новый пользователь</h2>
						<div className="space-y-4 mb-8">
							<MD3Field required type="text" label="Логин" value={username} minLength={3} maxLength={24} autoComplete="username" onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())} />
							<MD3Field required type="password" label="Пароль" value={password} minLength={5} maxLength={64} autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} />
							<MD3Field isSelect label="Роль" value={role} onChange={(e) => setRole(e.target.value)}>
								<option value="EDITOR">Редактор (EDITOR)</option>
								<option value="READER">Только чтение (READER)</option>
								<option value="ADMIN">Администратор (ADMIN)</option>
							</MD3Field>
						</div>
						<button
							className="w-full rounded-full bg-[var(--md-sys-color-primary)] py-4 text-base font-medium text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
							disabled={!username.trim() || !password.trim()}>
							Создать
						</button>
					</form>

					{/* Список пользователей */}
					<div className="rounded-[2.5rem] bg-[var(--md-sys-color-surface-container-low)] p-8 shadow-sm lg:col-span-2">
						<h2 className="mb-6 text-2xl font-normal tracking-tight flex items-center justify-between">
							Пользователи
							{loadingUsers && (
								<div className="animate-spin w-6 h-6 border-2 border-[var(--md-sys-color-primary)]/30 border-t-[var(--md-sys-color-primary)] rounded-full"></div>
							)}
						</h2>
						<div className="space-y-3">
							{users.length > 0 ? (
								users.map((u) => (
									<UserRow
										key={u.id}
										user={u}
										onUpdate={handleUpdateUser}
										onDelete={handleDeleteUser}
									/>
								))
							) : loadingUsers ? (
								<div className="text-base text-[var(--md-sys-color-outline)] p-4 text-center">Загрузка...</div>
							) : (
								<div className="text-base text-[var(--md-sys-color-outline)] p-4 text-center">Нет пользователей</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
