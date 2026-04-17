'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Провайдер для TanStack Query (React Query).
 * Использует useState для создания QueryClient один раз на жизненный цикл компонента.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Настройки по умолчанию для 2026 года:
						staleTime: 60 * 1000, // Данные считаются свежими 1 минуту
						refetchOnWindowFocus: false, // Отключаем лишние перезапросы при смене вкладок
					},
				},
			})
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
