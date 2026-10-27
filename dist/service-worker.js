'use strict';

const name = 'CormorantBay';
const version = '1.0.0';
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
	'./assets/images/backgrounds/bg_ferry_interior.svg',
	'./assets/images/backgrounds/bg_dock.svg',
	'./assets/images/backgrounds/bg_diner.svg',
	'./assets/images/backgrounds/bg_house.svg',
	'./assets/images/backgrounds/bg_office.svg',
	'./assets/images/backgrounds/bg_motel.svg',
	'./assets/images/backgrounds/bg_church.svg',
	'./assets/images/backgrounds/bg_point.svg',
	'./assets/images/backgrounds/bg_darkroom.svg',
	'./assets/images/backgrounds/bg_shed_ext.svg',
	'./assets/images/backgrounds/bg_cannery_ext.svg',
	'./assets/images/backgrounds/bg_graveyard.svg',

	// Character Portraits
	'./assets/images/characters/vance.svg',
	'./assets/images/characters/nora.svg',
	'./assets/images/characters/toby.svg',
	'./assets/images/characters/creel.svg',
	'./assets/images/characters/kell.svg',
	'./assets/images/characters/price.svg',

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

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
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
			}).catch(() => {
				if (event.request.mode === 'navigate') {
					return caches.match('./index.html');
				}
			});
		})
	);
});
