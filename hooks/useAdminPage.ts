'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiResponse } from '@/lib/api/api-client';
import { transliterate } from '@/lib/translit';

export type AdminUser = {
	id: string;
	username: string;
	role: string;
};

export function useAdminPage() {
	const { data: session, status } = useSession();
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('EDITOR');
	const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(
		null,
	);
	const [importBusy, setImportBusy] = useState(false);
	const [useAI, setUseAI] = useState(false);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const toastTimeout = useRef<NodeJS.Timeout | null>(null);

	const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
		setToast({ message, type });
		if (toastTimeout.current) clearTimeout(toastTimeout.current);
		toastTimeout.current = setTimeout(() => setToast(null), 4000);
	}, []);

	const fetchUsers = useCallback(async () => {
		setLoadingUsers(true);
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		try {
			const res = await fetch('/api/users', { signal: controller.signal });
			clearTimeout(timeoutId);
			const result = await parseApiResponse<AdminUser[]>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}
			setUsers(Array.isArray(result.data) ? result.data : []);
		} catch (err: unknown) {
			const error = err as Error;
			if (error.name === 'AbortError') {
				showToast('Превышено время ожидания списка пользователей', 'error');
			} else {
				showToast('Ошибка при загрузке списка пользователей', 'error');
			}
		} finally {
			clearTimeout(timeoutId);
			setLoadingUsers(false);
		}
	}, [showToast]);

	useEffect(() => {
		if (session?.user?.role === 'ADMIN') fetchUsers();
	}, [session, fetchUsers]);

	// Auto-generate credentials when names change
	useEffect(() => {
		if (!firstName && !lastName) return;

		// Map for quick collision lookup
		const existingLogins = new Set(users.map((u) => u.username.toLowerCase()));

		// Generate base login: name.surname (transliterated)
		const firstTrans = transliterate(firstName);
		const lastTrans = transliterate(lastName);

		if (!lastTrans) {
			if (firstTrans) setUsername(firstTrans);
			return;
		}

		const baseLogin = firstTrans ? `${firstTrans}.${lastTrans}` : lastTrans;
		let suggestedLogin = baseLogin;
		let counter = 1;

		// Handle duplicates by adding numbers
		while (existingLogins.has(suggestedLogin)) {
			suggestedLogin = `${baseLogin}${counter}`;
			counter++;
		}

		setUsername(suggestedLogin);

		// Generate random password if one isn't set yet or is short
		if (password.length < 5) {
			const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
			let pass = '';
			for (let i = 0; i < 8; i++)
				pass += chars.charAt(Math.floor(Math.random() * chars.length));
			setPassword(pass);
		}
	}, [firstName, lastName, users, password.length]);

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim()) {
			showToast('Укажите логин и пароль', 'error');
			return;
		}

		const res = await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, role, firstName, lastName }),
		});

		const parsed = await parseApiResponse(res);
		if (!parsed.ok) {
			showToast(parsed.message, 'error');
			return;
		}

		setFirstName('');
		setLastName('');
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
		const aiText = useAI ? ' с ИИ-очисткой (Gemini)' : '';
		if (!confirm(`Удалить все текущие пробы и загрузить data/data.xlsx${aiText}?`)) return;
		setImportBusy(true);
		try {
			const res = await fetch(`/api/import?useAI=${useAI}`);
			const result = await parseApiResponse<{
				message?: string;
				sheets?: number;
				rows?: number;
			}>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}
			showToast(result.data.message ?? 'Импорт завершён', 'success');
		} finally {
			setImportBusy(false);
		}
	};

	const handleBulkUsers = async (names: string) => {
		if (!names.trim()) return;
		setImportBusy(true);
		try {
			const userList = names
				.split('\n')
				.map((line) => {
					const parts = line.trim().split(/\s+/);
					if (parts.length < 2) return null;
					return { firstName: parts[1], lastName: parts[0] };
				})
				.filter(Boolean);

			if (userList.length === 0) {
				showToast('Неверный формат. Используйте: Фамилия Имя', 'error');
				return;
			}

			const res = await fetch('/api/users/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ users: userList }),
			});

			const result = await parseApiResponse<{ users: AdminUser[] }>(res);
			if (!result.ok) {
				showToast(result.message, 'error');
				return;
			}

			showToast(`Создано пользователей: ${result.data.users.length}`, 'success');
			fetchUsers();
			return result.data.users;
		} finally {
			setImportBusy(false);
		}
	};

	const adminCount = users.filter((u) => u.role === 'ADMIN').length;

	return {
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
		handleBulkUsers,
	};
}
