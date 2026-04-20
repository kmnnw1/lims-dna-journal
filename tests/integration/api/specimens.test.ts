import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/specimens/route';
import { prisma } from '@/lib/database/prisma';

// Мокаем сессию пользователя
vi.mock('next-auth/next', () => ({
	getServerSession: vi.fn(),
}));

describe('API: /api/specimens', () => {
	it('should return 401 if not authenticated', async () => {
		vi.mocked(getServerSession).mockResolvedValueOnce(null);

		const req = new Request('http://localhost/api/specimens');
		const res = await GET(req);

		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.error).toMatch(/Требуется вход/);
	});

	it('should return 403 if user has no role', async () => {
		vi.mocked(getServerSession).mockResolvedValueOnce({
			user: { email: 'test@example.com' },
		} as unknown as Session);

		const req = new Request('http://localhost/api/specimens');
		const res = await GET(req);

		expect(res.status).toBe(403);
	});

	it('should return specimens if user is READER', async () => {
		vi.mocked(getServerSession).mockResolvedValueOnce({
			user: { id: 'user1', role: 'READER' },
		} as unknown as Session);

		const req = new Request('http://localhost/api/specimens');
		const res = await GET(req);

		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data).toHaveProperty('specimens');
	});

	it('should validate POST data correctly', async () => {
		vi.mocked(getServerSession).mockResolvedValueOnce({
			user: { id: 'admin1', role: 'ADMIN' },
		} as unknown as Session);

		const req = new Request('http://localhost/api/specimens', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				id: 'invalid id with spaces',
				taxon: 'ab', // too short
			}),
		});

		const res = await POST(req);
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe('ID не должен содержать пробелов');
	});
});
