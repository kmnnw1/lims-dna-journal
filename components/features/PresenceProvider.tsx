'use client';

import { useQuery } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Провайдер для отслеживания присутствия пользователей в реальном времени.
 * Использует Polling для обновления статуса и получения списка активных пользователей.
 */

export interface ActiveUser {
	userId: string;
	username: string;
	fullName: string;
	resourceType: string | null;
	resourceId: string | null;
	lastUpdate: string;
}

interface PresenceContextType {
	activeUsers: ActiveUser[];
	setCurrentResource: (type: string | null, id: string | null) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
	const [currentResource, setResource] = useState<{ type: string | null; id: string | null }>({
		type: null,
		id: null,
	});

	// Функция отправки Heartbeat
	const sendHeartbeat = useCallback(async () => {
		try {
			await fetch('/api/presence', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					resourceType: currentResource.type,
					resourceId: currentResource.id,
				}),
			});
		} catch (_error) {
			// Ошибки Heartbeat не должны прерывать работу UI
			console.warn('Presence heartbeat failed');
		}
	}, [currentResource]);

	// Получение списка активных пользователей каждые 10 секунд
	const { data: activeUsers = [] } = useQuery<ActiveUser[]>({
		queryKey: ['presence'],
		queryFn: async () => {
			const res = await fetch('/api/presence');
			if (!res.ok) return [];
			return res.json();
		},
		refetchInterval: 10000,
	});

	// Отправка Heartbeat каждые 30 секунд или при смене ресурса
	useEffect(() => {
		sendHeartbeat();
		const interval = setInterval(sendHeartbeat, 30000);
		return () => clearInterval(interval);
	}, [sendHeartbeat]);

	const setCurrentResource = useCallback((type: string | null, id: string | null) => {
		setResource({ type, id });
	}, []);

	return (
		<PresenceContext.Provider
			value={{
				activeUsers,
				setCurrentResource,
			}}
		>
			{children}
		</PresenceContext.Provider>
	);
}

export const usePresence = () => {
	const context = useContext(PresenceContext);
	if (!context) {
		throw new Error('usePresence must be used within a PresenceProvider');
	}
	return context;
};
