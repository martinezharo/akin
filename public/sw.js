const SHELL_CACHE = "akin-shell-v2";
const RUNTIME_CACHE = "akin-runtime-v2";
const APP_SHELL = [
	"/",
	"/manifest.webmanifest",
	"/favicon.svg",
	"/icons/akin-192.png",
	"/icons/akin-512.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		Promise.all([
			caches
				.keys()
				.then((keys) =>
					Promise.all(
						keys
							.filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
							.map((key) => caches.delete(key)),
					),
				),
			self.clients.claim(),
		]),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.method !== "GET" || url.origin !== self.location.origin) return;

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const copy = response.clone();
						event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)));
					}
					return response;
				})
				.catch(async () => (await caches.match(request)) ?? caches.match("/")),
		);
		return;
	}

	if (["font", "image", "script", "style", "worker"].includes(request.destination)) {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				const networkResponse = fetch(request)
					.then((response) => {
						if (response.ok) {
							const copy = response.clone();
							event.waitUntil(
								caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)),
							);
						}
						return response;
					})
					.catch(() => cachedResponse);

				return cachedResponse ?? networkResponse;
			}),
		);
	}
});
