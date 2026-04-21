'use client';

import { QueryClient } from '@tanstack/react-query';
import {
	type PersistedClient,
	PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { useState } from 'react';

/**
 * Кастомный персистер на базе IndexedDB (idb-keyval) для офлайн-поддержки.
 */
const persister = {
	persistClient: async (client: PersistedClient) => {
		await set('tanstack-query-cache', client);
	},
	restoreClient: async () => {
		return await get<PersistedClient>('tanstack-query-cache');
	},
	removeClient: async () => {
		await del('tanstack-query-cache');
	},
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
						refetchOnWindowFocus: false,
						gcTime: 1000 * 60 * 60 * 24, // Сохраняем в кэше 24 часа
					},
				},
			}),
	);

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister,
				maxAge: 1000 * 60 * 60 * 24, // 24 часа
			}}
		>
			{children}
		</PersistQueryClientProvider>
	);
}
