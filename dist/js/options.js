/**
 * Cormorant Bay — Engine & Game Settings
 */

'use strict';
/* global monogatari */

monogatari.settings({
	'Name': 'Cormorant Bay',
	'Version': '1.0.7',
	'Label': 'Start',
	'Slots': 10,
	'MultiLanguage': false,
	'LanguageSelectionScreen': false,
	'MainScreenMusic': '',
	'SaveLabel': 'Save',
	'AutoSaveLabel': 'AutoSave',
	'ShowMainScreen': true,
	'Preload': true,
	'AutoSave': 0,
	'ServiceWorkers': true,
	'AspectRatio': 'None',
	'ForceAspectRatio': 'None',
	'TypeAnimation': false,
	'InstantText': true,
	'NVLTypeAnimation': true,
	'NarratorTypeAnimation': true,
	'CenteredTypeAnimation': true,
	'Orientation': 'portrait',
	'Skip': 0,

	'AssetsPath': {
		'root': 'assets',
		'characters': 'images/characters',
		'icons': 'icons',
		'images': 'images/props',
		'music': 'audio/music',
		'scenes': 'images/backgrounds',
		'sounds': 'audio/sfx',
		'ui': 'images/ui',
		'videos': 'videos',
		'voices': 'voices',
		'gallery': 'gallery'
	},

	'Storage': {
		'Adapter': 'LocalStorage',
		'Store': 'CormorantBayData'
	},

	'AllowRollback': false,
	'ExperimentalFeatures': false,
	'Screenshots': false
});

monogatari.preferences({
	'Language': 'English',
	'Volume': {
		'Music': 0.8,
		'Voice': 1,
		'Sound': 1,
		'Video': 1
	},
	'TextSpeed': 20,
	'AutoPlaySpeed': 5
});

// Scene Background Assets
monogatari.assets('scenes', {
	'ferry_interior': 'bg_ferry_interior.jpg',
	'dock': 'bg_dock.jpg',
	'diner': 'bg_diner.jpg',
	'house': 'bg_house.jpg',
	'office': 'bg_office.jpg',
	'motel': 'bg_motel.jpg',
	'church': 'bg_church.jpg',
	'point': 'bg_point.jpg',
	'darkroom': 'bg_darkroom.jpg',
	'shed_ext': 'bg_shed_ext.jpg',
	'cannery_ext': 'bg_cannery_ext.jpg',
	'graveyard': 'bg_graveyard.jpg',
	'house_ext': 'bg_house_ext.jpg',
	'dock_dawn': 'bg_dock_dawn.jpg',
	'house_night': 'bg_house_night.jpg',
	'point_dawn': 'bg_point_dawn.jpg'
});

// Music & Audio Bed
monogatari.assets('music', {
	'rain': 'mus_rain_loop.wav',
	'guitar': 'mus_guitar_theme.wav'
});

// Sound Effects
monogatari.assets('sounds', {
	'roll': 'sfx_roll.wav',
	'click': 'sfx_ui_click.wav'
});

// Character Definitions
monogatari.characters({
	'y': {
		name: 'Alana',
		color: '#c9d1d9'
	},
	'vance': {
		name: 'Sheriff Vance',
		color: '#94a3b8',
		default_expression: 'default',
		expressions: {
			'default': 'vance.jpg'
		},
		sprites: {
			'default': 'vance.jpg'
		}
	},
	'nora': {
		name: 'Nora',
		color: '#f97316',
		default_expression: 'default',
		expressions: {
			'default': 'nora.jpg'
		},
		sprites: {
			'default': 'nora.jpg'
		}
	},
	'toby': {
		name: 'Toby',
		color: '#38bdf8',
		default_expression: 'default',
		expressions: {
			'default': 'toby.jpg'
		},
		sprites: {
			'default': 'toby.jpg'
		}
	},
	'creel': {
		name: 'Pastor Creel',
		color: '#c084fc',
		default_expression: 'default',
		expressions: {
			'default': 'creel.jpg'
		},
		sprites: {
			'default': 'creel.jpg'
		}
	},
	'kell': {
		name: 'Merritt Kell',
		color: '#f87171',
		default_expression: 'default',
		expressions: {
			'default': 'kell.jpg'
		},
		sprites: {
			'default': 'kell.jpg'
		}
	},
	'price': {
		name: 'Doyle Price',
		color: '#facc15',
		default_expression: 'default',
		expressions: {
			'default': 'price.jpg'
		},
		sprites: {
			'default': 'price.jpg'
		}
	},
	'ferryman': {
		name: 'Ferryman',
		color: '#64748b'
	}
});

// Credits & Production Disclosures (§10 & DESIGN.md §12.4)
monogatari.configuration({
	'credits': {
		'Cormorant Bay': {
			'_': 'A stat-driven folk-horror mystery visual novel built with Monogatari v2.8.0.',
			'Design & Narrative': 'Alana Taylor Investigation Team',
			'Version': '1.0.0 Release'
		},
		'Disclosures & Attribution': {
			'Visual Art': 'AI-assisted, high-grain photographic aesthetic. Processed and curated under commercial license.',
			'Audio Design': 'Ambient coastal rain bed and solo guitar theme in D minor.',
			'Engine': 'Monogatari Visual Novel Engine (MIT License)'
		}
	}
});
