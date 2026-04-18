'use client';

import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MD3Field } from '@/components/ui/MD3Field';

export type AdminUser = {
	id: string;
	username: string;
	role: string;
};

export function AdminUserRow({
	user: u,
	currentUserId,
	adminCount = 0,
	onUpdate,
	onDelete,
}: {
	user: AdminUser;
	currentUserId?: string;
	adminCount?: number;
	onUpdate: (id: string, role: string, password?: string) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
}) {
	const [role, setRole] = useState(u.role);
	const [pwd, setPwd] = useState('');
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		setRole(u.role);
	}, [u.role]);

	useEffect(() => {
		setPwd('');
	}, []);

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
		<div className="flex flex-col gap-4 rounded-3xl bg-(--md-sys-color-surface-container-highest) px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-all">
			<div className="min-w-0">
				<p className="font-medium text-(--md-sys-color-on-surface) text-lg tracking-tight">
					{u.username}
				</p>
				<p className="text-sm font-mono text-(--md-sys-color-primary)">{u.role}</p>
			</div>
			<div className="flex flex-wrap items-center gap-3">
				{/* 
				Условия удаления:
				1. Нельзя удалять себя (u.id !== currentUserId)
				2. Нельзя удалять главного 'admin' (u.username !== 'admin')
				3. Другого админа можно удалить только если их > 2 (u.role !== 'ADMIN' || adminCount > 2)
				*/}
				{u.username !== 'admin' && u.id !== currentUserId ? (
					<>
						<div className="w-[140px]">
							<MD3Field
								isSelect
								label="Роль"
								value={role}
								onChange={(e) => setRole(e.target.value)}
								disabled={busy}
							>
								<option value="EDITOR">EDITOR</option>
								<option value="READER">READER</option>
								<option value="ADMIN">ADMIN</option>
							</MD3Field>
						</div>
						<div className="w-[160px]">
							<MD3Field
								type="password"
								label="Новый пароль"
								value={pwd}
								onChange={(e) => setPwd(e.target.value)}
								autoComplete="new-password"
								disabled={busy}
							/>
						</div>
						<button
							type="button"
							onClick={handleUpdateClick}
							className="inline-flex items-center justify-center p-3 rounded-full bg-(--md-sys-color-primary) text-(--md-sys-color-on-primary) hover:brightness-110 transition-all disabled:opacity-50"
							disabled={busy}
							aria-label="Сохранить изменения"
							title="Сохранить"
						>
							<Save className="h-5 w-5" />
						</button>
						{(u.role !== 'ADMIN' || adminCount > 2) && (
							<button
								type="button"
								onClick={handleDeleteClick}
								className="p-3 rounded-full bg-(--md-sys-color-error-container) text-(--md-sys-color-on-error-container) hover:brightness-95 transition-all disabled:opacity-50"
								aria-label={`Удалить пользователя "${u.username}"`}
								title="Удалить"
								disabled={busy}
							>
								<Trash2 className="h-5 w-5" />
							</button>
						)}
					</>
				) : (
					<span className="text-sm font-medium px-4 py-2 bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-primary) rounded-full shadow-sm">
						{u.id === currentUserId ? 'Это вы (Вы вошли)' : 'Главный администратор'}
					</span>
				)}
				{u.username !== 'admin' &&
					u.id !== currentUserId &&
					u.role === 'ADMIN' &&
					adminCount <= 2 && (
						<span className="text-[11px] font-medium px-3 py-1 bg-(--md-sys-color-surface-container-high) text-(--md-sys-color-outline) rounded-full">
							Защита (нужно {'>'}2 админов)
						</span>
					)}
			</div>
		</div>
	);
}
