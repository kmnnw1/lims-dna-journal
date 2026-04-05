import {describe, it, expect} from 'vitest';
import {parseApiResponse} from './api-client';

describe('parseApiResponse', () => {
	it('should parse a valid JSON response and return ok', async () => {
		const res = new Response(JSON.stringify({a: 1}), {status: 200});
		const r = await parseApiResponse<{a: number}>(res);
		expect(r).toEqual({ok: true, data: {a: 1}});
	});

	it('should return an error message when error field is present', async () => {
		const res = new Response(JSON.stringify({error: 'Нет прав'}), {status: 403});
		const r = await parseApiResponse(res);
		expect(r.ok).toBe(false);
		expect(r).toHaveProperty('message', 'Нет прав');
	});

	it('should handle invalid JSON and return a user-friendly error', async () => {
		const res = new Response('not json', {status: 500});
		const r = await parseApiResponse(res);
		expect(r.ok).toBe(false);
		expect((r as {message: string}).message.toLowerCase()).toContain('некорректный');
	});

	it('should handle empty body gracefully', async () => {
		const res = new Response('', {status: 204});
		const r = await parseApiResponse(res);
		expect(r.ok).toBe(false);
		expect((r as {message: string}).message.toLowerCase()).toContain('некорректный');
	});

	it('should prioritize top-level message over error if both are present', async () => {
		const res = new Response(JSON.stringify({error: 'E', message: 'M'}), {status: 400});
		const r = await parseApiResponse(res);
		expect(r.ok).toBe(false);
		expect((r as {message: string}).message).toBe('M');
	});
});
