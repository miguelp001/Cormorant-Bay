/**
 * Cormorant Bay — Engine & Game Settings
 */

'use strict';
/* global monogatari */

monogatari.settings({
	'Name': 'Cormorant Bay',
	'Version': '0.1.0',
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
	'TypeAnimation': true,
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
	'ferry_interior': 'bg_ferry_interior.svg',
	'dock': 'bg_dock.svg',
	'diner': 'bg_diner.svg',
	'house': 'bg_house.svg',
	'office': 'bg_office.svg',
	'motel': 'bg_motel.svg',
	'church': 'bg_church.svg',
	'point': 'bg_point.svg',
	'darkroom': 'bg_darkroom.svg',
	'shed_ext': 'bg_shed_ext.svg',
	'cannery_ext': 'bg_cannery_ext.svg',
	'graveyard': 'bg_graveyard.svg'
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
		sprites: {
			'default': 'vance.svg'
		}
	},
	'nora': {
		name: 'Nora',
		color: '#f97316',
		sprites: {
			'default': 'nora.svg'
		}
	},
	'toby': {
		name: 'Toby',
		color: '#38bdf8',
		sprites: {
			'default': 'toby.svg'
		}
	},
	'creel': {
		name: 'Pastor Creel',
		color: '#c084fc',
		sprites: {
			'default': 'creel.svg'
		}
	},
	'kell': {
		name: 'Merritt Kell',
		color: '#f87171',
		sprites: {
			'default': 'kell.svg'
		}
	},
	'price': {
		name: 'Doyle Price',
		color: '#facc15',
		sprites: {
			'default': 'price.svg'
		}
	},
	'ferryman': {
		name: 'Ferryman',
		color: '#64748b'
	}
});
