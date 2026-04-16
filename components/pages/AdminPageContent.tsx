'use client';

import Link from 'next/link';
import { ArrowLeft, Database, FileSpreadsheet, ShieldAlert, Trash2, UserPlus, Download, Sparkles } from 'lucide-react';
import { MD3Field } from '@/components/ui/MD3Field';
import { AdminUserRow } from '@/components/pages/AdminUserRow';
import { useAdminPage } from '@/hooks/useAdminPage';

type AdminPageProps = ReturnType<typeof useAdminPage>;

export function AdminPageContent(props: AdminPageProps) {
	const {
		session,
		status,
		users,
		adminCount,
		firstName,
		lastName,
		username,
		password,
		role,
		toast,
		importBusy,
		useAI,
		loadingUsers,
		setFirstName,
		setLastName,
		setUsername,
		setPassword,
		setRole,
		setUseAI,
		handleCreateUser,
		handleUpdateUser,
		handleDeleteUser,
		handleClearSpecimens,
		handleImportFromExcel,
	} = props;

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
				<Link href="/" className="mt-8 rounded-full bg-[var(--md-sys-color-primary)] px-8 py-3 text-base font-medium text-[var(--md-sys-color-on-primary)] shadow-md hover:shadow-lg transition-all active:scale-95">
					Вернуться в журнал
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[var(--md-sys-color-surface)] p-3 sm:p-6 text-[var(--md-sys-color-on-surface)] animate-in fade-in duration-300 pb-20">
			{toast && (
				<div
					className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-[1rem] px-6 py-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 font-medium tracking-wide ${
						toast.type === 'error'
							? 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]'
							: 'bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)]'
					}`}>
					{toast.message}
				</div>
			)}

			<div className="max-w-6xl mx-auto">
				<Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--md-sys-color-primary)] hover:opacity-80 transition-opacity bg-[var(--md-sys-color-surface)] shadow-md hover:shadow-lg px-5 py-2.5 rounded-full">
					<ArrowLeft className="h-4 w-4" /> В журнал
				</Link>

				<h1 className="mb-10 flex items-center gap-4 text-4xl font-normal tracking-tight">
					<span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm">
						<UserPlus className="h-7 w-7" strokeWidth={1.5} />
					</span>
					Администрирование
				</h1>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="lg:col-span-3 rounded-[2rem] bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] p-6 shadow-sm">
						<h2 className="mb-2 flex items-center gap-3 text-xl font-medium tracking-tight">
							<Database className="h-6 w-6" strokeWidth={1.5} />
							Управление базой данных
						</h2>
						<p className="mb-4 text-sm opacity-80 max-w-3xl">
							Импорт обрабатывает все листы файла
							<code className="rounded bg-black/10 mx-1.5 px-2 py-0.5 font-mono text-xs dark:bg-white/10">
								data.xlsx
							</code>
							в корне каталога сервера. Перед загрузкой текущая таблица проб очищается.
						</p>
						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={() => window.open('/api/backup/download', '_blank')}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] shadow-sm transition-transform hover:scale-[1.02] active:scale-95">
								<Download className="h-4 w-4" />
								Скачать БД
							</button>

							<button
								type="button"
								disabled={importBusy}
								onClick={handleImportFromExcel}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-on-secondary-container)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-secondary-container)] shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
								<FileSpreadsheet className="h-4 w-4" />
								Импорт
							</button>
							<button
								type="button"
								disabled={importBusy}
								onClick={handleClearSpecimens}
								className="inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-error-container)] px-6 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-error-container)] transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
								<Trash2 className="h-4 w-4" />
								Очистить
							</button>
							<div className="flex items-center gap-2 ml-0 sm:ml-auto">
								<input
									type="checkbox"
									id="useAI"
									checked={useAI}
									onChange={(e) => setUseAI(e.target.checked)}
									className="rounded border-[var(--md-sys-color-outline)] appearance-none w-4 h-4 checked:bg-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-outline)]"
								/>
								<label htmlFor="useAI" className="text-sm font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer">
									ИИ-очистка
								</label>
							</div>
						</div>
					</div>

					<form onSubmit={handleCreateUser} className="rounded-[2rem] bg-[var(--md-sys-color-surface-container-low)] p-6 shadow-sm lg:col-span-1 h-fit">
						<h2 className="mb-4 text-xl font-medium tracking-tight">Новый пользователь</h2>
						<div className="space-y-4 mb-8">
							<div className="grid grid-cols-2 gap-3">
								<MD3Field
									required
									type="text"
									label="Имя"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
								/>
								<MD3Field
									required
									type="text"
									label="Фамилия"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
								/>
							</div>
							<MD3Field
								required
								type="text"
								label="Логин (авто)"
								value={username}
								onChange={(e) => setUsername(e.target.value.toLowerCase())}
							/>
							<div className="relative">
								<MD3Field
									required
									type="text"
									label="Пароль (авто)"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
								<button 
									type="button"
									onClick={() => {
										const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
										let pass = '';
										for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
										setPassword(pass);
									}}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-primary)] p-2 hover:bg-[var(--md-sys-color-primary-container)] rounded-full transition-colors"
									title="Обновить пароль"
								>
									<Sparkles className="w-4 h-4" />
								</button>
							</div>
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

					<div className="rounded-[2rem] bg-[var(--md-sys-color-surface-container-low)] p-6 shadow-sm lg:col-span-2">
						<h2 className="mb-4 text-xl font-medium tracking-tight flex items-center justify-between">
							Пользователи
							{loadingUsers && (
								<div className="animate-spin w-6 h-6 border-2 border-[var(--md-sys-color-primary)]/30 border-t-[var(--md-sys-color-primary)] rounded-full"></div>
							)}
						</h2>
						<div className="space-y-3">
							{users.length > 0 ? (
								users.map((u) => (
									<AdminUserRow 
										key={u.id} 
										user={u} 
										currentUserId={(session?.user as any)?.id}
										adminCount={adminCount}
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
