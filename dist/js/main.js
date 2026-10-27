/**
 * Cormorant Bay — main.js
 * Initializes persistent player state via preloadGame() and mounts engine.
 */

'use strict';
/* global Monogatari, monogatari, setupLandingCard */

function preloadGame (engine) {
	const e = engine || (typeof monogatari !== 'undefined' ? monogatari : null);
	if (e && typeof e.storage === 'function') {
		e.storage({
			player: {
				skills: { perception: 1, empathy: 1, persuasion: 1, grit: 1 },
				conviction: 2,          // charges remaining
				heat: 0,                // 0–6
				clues: [],              // array of clue ID strings
				hasCutters: false,      // item flag
				visitReason: '',        // 'bury' | 'write' | 'both' — flavor only
				trust: { nora: 0, vance: 0, toby: 0, creel: 0, price: 0, kell: 0 }
			},
			convictionLeft: 2,          // FLAT MIRROR — for {{}} interpolation
			visitReasonLabel: ''        // FLAT MIRROR — for {{}} interpolation
		});
	}
}

// Authoritative state schema initialization
preloadGame(monogatari);

const { $_ready } = Monogatari;

$_ready(() => {
	// Initialize landing card UI event listeners
	if (typeof setupLandingCard === 'function') {
		setupLandingCard();
	}

	monogatari.init('#monogatari').then(() => {
		// Post-init hooks if needed
	});
});
