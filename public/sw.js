/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'lj-shell-v3';
const API_CACHE = 'lj-api-v1';
const PRECACHE_ASSETS = [
	'/offline.html',
	'/manifest.json',
	'/icon-192.png',
	'/icon-512.png',
	'/icon.svg',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((names) =>
			Promise.all(
				names.map((key) => {
					if (key !== CACHE_NAME && key !== API_CACHE) return caches.delete(key);
				})
			)
		).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;

	const url = new URL(req.url);

	// 1. Кэширование API (Network First). Позволяет читать журнал без интернета.
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(req)
				.then((res) => {
					const resClone = res.clone();
					caches.open(API_CACHE).then((cache) => cache.put(req, resClone));
					return res;
				})
				.catch(async () => {
					// Если сети нет, достаем последний успешный ответ из кэша
					const cachedRes = await caches.match(req);
					if (cachedRes) return cachedRes;
					
					// Если в кэше тоже пусто
					return new Response(
						JSON.stringify({ error: 'Офлайн режим. Данные не закэшированы.', specimens: [] }), 
						{ headers: { 'Content-Type': 'application/json' } }
					);
				})
		);
		return;
	}

	// 2. HTML страницы (Network First с фоллбэком на offline.html)
	if (req.mode === 'navigate' || req.headers.get('Accept')?.includes('text/html')) {
		event.respondWith(
			fetch(req).catch(() => caches.match('/offline.html'))
		);
		return;
	}

	// 3. Статика (Cache First)
	event.respondWith(
		caches.match(req).then((cached) => {
			if (cached) return cached;
			return fetch(req).then((res) => {
				if (res.status === 200 && PRECACHE_ASSETS.some((path) => req.url.includes(path))) {
					const resClone = res.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
				}
				return res;
			}).catch(() => undefined);
		})
	);
});
