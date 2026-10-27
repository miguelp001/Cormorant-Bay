'use strict';

const name = 'CormorantBay';
const version = '1.1.6';
const cacheName = `${name}-v${version}`;

const files = [
	'./',
	'./index.html',
	'./manifest.json',
	'./favicon.ico',
	'./engine/core/monogatari.css',
	'./engine/core/monogatari.js',
	'./style/main.css',
	'./js/options.js',
	'./js/main.js',
	'./js/landing-card.js',
	'./js/script.js',
	'./assets/icons/icon-192.png',
	'./assets/icons/icon-512.png',
	'./assets/icons/icon-maskable.png',

	// Background Scenes
	'./assets/images/backgrounds/bg_ferry_interior.jpg',
	'./assets/images/backgrounds/bg_dock.jpg',
	'./assets/images/backgrounds/bg_diner.jpg',
	'./assets/images/backgrounds/bg_house.jpg',
	'./assets/images/backgrounds/bg_office.jpg',
	'./assets/images/backgrounds/bg_motel.jpg',
	'./assets/images/backgrounds/bg_church.jpg',
	'./assets/images/backgrounds/bg_point.jpg',
	'./assets/images/backgrounds/bg_darkroom.jpg',
	'./assets/images/backgrounds/bg_shed_ext.jpg',
	'./assets/images/backgrounds/bg_cannery_ext.jpg',
	'./assets/images/backgrounds/bg_graveyard.jpg',
	'./assets/images/backgrounds/bg_house_ext.jpg',
	'./assets/images/backgrounds/bg_dock_dawn.jpg',
	'./assets/images/backgrounds/bg_house_night.jpg',
	'./assets/images/backgrounds/bg_point_dawn.jpg',
	'./assets/images/backgrounds/bg_title_drop.jpg',
	'./assets/images/ui/ui_title_screen.jpg',
	'./assets/images/ui/ui_title_clean.jpg',

	// Character Portraits (Transparent PNG Sprites)
	'./assets/images/characters/vance.png',
	'./assets/images/characters/nora.png',
	'./assets/images/characters/toby.png',
	'./assets/images/characters/creel.png',
	'./assets/images/characters/kell.png',
	'./assets/images/characters/price.png',
	'./assets/images/characters/vance.jpg',
	'./assets/images/characters/nora.jpg',
	'./assets/images/characters/toby.jpg',
	'./assets/images/characters/creel.jpg',
	'./assets/images/characters/kell.jpg',
	'./assets/images/characters/price.jpg',

	// Evidence Props
	'./assets/images/props/prop_photograph.jpg',
	'./assets/images/props/prop_calendar.jpg',
	'./assets/images/props/prop_county_letter.jpg',
	'./assets/images/props/prop_boots.jpg',
	'./assets/images/props/prop_gate.jpg',
	'./assets/images/props/prop_coroner_report.jpg',
	'./assets/images/props/prop_father_photo.jpg',
	'./assets/images/props/prop_mother_grave.jpg',
	'./assets/images/props/prop_case_file.jpg',
	'./assets/images/props/prop_notebook.jpg',

	// Audio
	'./assets/audio/music/mus_rain_loop.wav',
	'./assets/audio/music/mus_guitar_theme.wav',
	'./assets/audio/sfx/sfx_roll.wav',
	'./assets/audio/sfx/sfx_ui_click.wav'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(cacheName).then((cache) => cache.addAll(files)).then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys.map((key) => {
					if (key !== cacheName) {
						return caches.delete(key);
					}
				})
			)
		).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const url = new URL(event.request.url);
	const isCode = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

	if (isCode) {
		// Network-first for code: fetch latest when online, fallback to cache when offline
		event.respondWith(
			fetch(event.request).then((response) => {
				if (response && response.status === 200) {
					const clone = response.clone();
					caches.open(cacheName).then((cache) => cache.put(event.request, clone));
				}
				return response;
			}).catch(() => {
				return caches.match(event.request, { ignoreSearch: true }).then((cached) => {
					if (cached) return cached;
					if (event.request.mode === 'navigate') {
						return caches.match('./index.html', { ignoreSearch: true });
					}
				});
			})
		);
		return;
	}

	// Cache-first for large media assets (images, audio, fonts)
	event.respondWith(
		caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}
			return fetch(event.request).then((response) => {
				if (!response || response.status !== 200 || response.type !== 'basic') {
					return response;
				}
				const responseToCache = response.clone();
				caches.open(cacheName).then((cache) => {
					cache.put(event.request, responseToCache);
				});
				return response;
			});
		})
	);
});
