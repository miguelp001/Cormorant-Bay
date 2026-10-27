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
		'Music': 1,
		'Voice': 1,
		'Sound': 1,
		'Video': 1
	},
	'TextSpeed': 20,
	'AutoPlaySpeed': 5
});

// Character Definitions
monogatari.characters({
	'y': {
		name: 'Alana',
		color: '#c9d1d9'
	},
	'vance': {
		name: 'Sheriff Vance',
		color: '#94a3b8'
	},
	'nora': {
		name: 'Nora',
		color: '#f97316'
	},
	'toby': {
		name: 'Toby',
		color: '#38bdf8'
	},
	'creel': {
		name: 'Pastor Creel',
		color: '#c084fc'
	},
	'kell': {
		name: 'Merritt Kell',
		color: '#f87171'
	},
	'price': {
		name: 'Doyle Price',
		color: '#facc15'
	},
	'ferryman': {
		name: 'Ferryman',
		color: '#64748b'
	}
});
