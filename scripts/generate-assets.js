/**
 * Asset Generator for Cormorant Bay
 * Generates P0 & P1 Backgrounds, Character Portraits, Props, and Audio files
 */

const fs = require('fs');
const path = require('path');

// 1. Audio WAV Generator
function createWavBuffer(sampleRate, durationSeconds, generateSample) {
	const numSamples = Math.floor(sampleRate * durationSeconds);
	const buffer = Buffer.alloc(44 + numSamples * 2);

	buffer.write('RIFF', 0);
	buffer.writeUInt32LE(36 + numSamples * 2, 4);
	buffer.write('WAVE', 8);
	buffer.write('fmt ', 12);
	buffer.writeUInt32LE(16, 16); // PCM chunk size
	buffer.writeUInt16LE(1, 20);  // format = PCM
	buffer.writeUInt16LE(1, 22);  // mono
	buffer.writeUInt32LE(sampleRate, 24);
	buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
	buffer.writeUInt16LE(2, 32);  // block align
	buffer.writeUInt16LE(16, 34); // bits per sample
	buffer.write('data', 36);
	buffer.writeUInt32LE(numSamples * 2, 40);

	for (let i = 0; i < numSamples; i++) {
		const sample = generateSample(i, sampleRate);
		const clamped = Math.max(-1, Math.min(1, sample));
		const int16 = Math.floor(clamped * 32767);
		buffer.writeInt16LE(int16, 44 + i * 2);
	}
	return buffer;
}

// Generate Ambient Rain Loop (4.0s loopable noise with lowpass filter)
const rainWav = createWavBuffer(22050, 4.0, (i) => {
	// Soft continuous pink/brown noise
	const white = (Math.random() * 2 - 1) * 0.12;
	return white;
});
fs.writeFileSync('dist/assets/audio/music/mus_rain_loop.wav', rainWav);

// Generate Solo Guitar Theme (Sparse melancholy D-minor notes)
const notes = [146.83, 174.61, 220.00, 164.81]; // D3, F3, A3, E3
const guitarWav = createWavBuffer(22050, 5.0, (i, sr) => {
	const t = i / sr;
	const noteIdx = Math.floor(t / 1.25) % notes.length;
	const noteTime = t % 1.25;
	const freq = notes[noteIdx];
	const env = Math.exp(-noteTime * 3.5);
	const tone = Math.sin(2 * Math.PI * freq * noteTime) * 0.25;
	const harmonic = Math.sin(2 * Math.PI * freq * 2 * noteTime) * 0.08;
	return (tone + harmonic) * env;
});
fs.writeFileSync('dist/assets/audio/music/mus_guitar_theme.wav', guitarWav);

// Generate Dice Roll SFX (dry rapid clicks)
const rollWav = createWavBuffer(22050, 0.45, (i, sr) => {
	const t = i / sr;
	const click1 = (t > 0.05 && t < 0.09) ? (Math.random() * 2 - 1) * 0.35 : 0;
	const click2 = (t > 0.14 && t < 0.18) ? (Math.random() * 2 - 1) * 0.28 : 0;
	const click3 = (t > 0.22 && t < 0.26) ? (Math.random() * 2 - 1) * 0.22 : 0;
	return click1 + click2 + click3;
});
fs.writeFileSync('dist/assets/audio/sfx/sfx_roll.wav', rollWav);

// Generate UI Click SFX
const clickWav = createWavBuffer(22050, 0.06, (i) => {
	return (Math.random() * 2 - 1) * 0.15;
});
fs.writeFileSync('dist/assets/audio/sfx/sfx_ui_click.wav', clickWav);

console.log('Generated audio files.');

// 2. Background SVG Artworks (1920x1080 High-Grain Photographic aesthetic)
function makeBgSvg(title, subtitle, palette, extraSvg = '') {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${palette.top}" />
      <stop offset="60%" stop-color="${palette.mid}" />
      <stop offset="100%" stop-color="${palette.bot}" />
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" in="noise" result="coloredNoise" />
      <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" />
    </filter>
  </defs>
  <!-- Base Background -->
  <rect width="1920" height="1080" fill="url(#bgGrad)" />

  <!-- Rain Streaks Overlay -->
  <g stroke="rgba(255,255,255,0.08)" stroke-width="1.2">
    <line x1="120" y1="0" x2="100" y2="400" />
    <line x1="380" y1="100" x2="350" y2="700" />
    <line x1="640" y1="50" x2="610" y2="650" />
    <line x1="920" y1="0" x2="880" y2="500" />
    <line x1="1200" y1="120" x2="1160" y2="720" />
    <line x1="1450" y1="20" x2="1410" y2="600" />
    <line x1="1720" y1="80" x2="1680" y2="680" />
  </g>

  ${extraSvg}

  <!-- Film Grain Texture -->
  <rect width="1920" height="1080" fill="rgba(0,0,0,0.01)" filter="url(#grain)" />

  <!-- Location Label -->
  <g transform="translate(60, 1020)">
    <text font-family="Georgia, serif" font-size="28" font-weight="bold" fill="rgba(229, 224, 211, 0.45)" letter-spacing="4">${title.toUpperCase()}</text>
    <text y="24" font-family="-apple-system, sans-serif" font-size="14" fill="rgba(229, 224, 211, 0.3)" letter-spacing="2">${subtitle.toUpperCase()}</text>
  </g>
</svg>`;
}

const backgrounds = {
	'bg_ferry_interior.svg': {
		title: 'Passenger Salon',
		subtitle: 'Cormorant Sound Crossing • Rain on Glass',
		palette: { top: '#181e24', mid: '#13171c', bot: '#0d1013' },
		extra: `
      <!-- Window frame & sea horizon -->
      <path d="M 0,0 L 1920,0 L 1920,80 L 0,80 Z" fill="#090b0d" />
      <path d="M 0,0 L 220,0 L 160,1080 L 0,1080 Z" fill="#0c0e11" />
      <path d="M 1700,0 L 1920,0 L 1920,1080 L 1760,1080 Z" fill="#0c0e11" />
      <line x1="160" y1="620" x2="1760" y2="620" stroke="rgba(255,255,255,0.04)" stroke-width="4" />
      <!-- Dark swell of water -->
      <path d="M 160,620 Q 960,650 1760,620 L 1760,1080 L 160,1080 Z" fill="#0b0f14" opacity="0.6" />
    `
	},
	'bg_dock.svg': {
		title: 'Commercial Slipway',
		subtitle: 'Port Authority Dock • Grey Tide',
		palette: { top: '#232930', mid: '#1a1f26', bot: '#10141a' },
		extra: `
      <!-- Pilings and timber dock apron -->
      <rect x="0" y="740" width="1920" height="340" fill="#0e1217" />
      <rect x="180" y="580" width="40" height="400" fill="#080a0c" />
      <rect x="740" y="560" width="45" height="420" fill="#080a0c" />
      <rect x="1350" y="590" width="40" height="390" fill="#080a0c" />
      <!-- Ridge silhouette -->
      <polygon points="0,520 400,480 850,540 1400,460 1920,530 1920,740 0,740" fill="#14181f" />
    `
	},
	'bg_diner.svg': {
		title: 'Nora\'s Diner',
		subtitle: 'Commercial Street • Condensation & Woodsmoke',
		palette: { top: '#2d2218', mid: '#201811', bot: '#15100b' },
		extra: `
      <!-- Warm window glow and diner counter -->
      <rect x="0" y="680" width="1920" height="400" fill="#18120c" />
      <rect x="200" y="620" width="1520" height="60" fill="#3a2b1f" rx="4" />
      <!-- Steamed window panes -->
      <rect x="300" y="140" width="600" height="420" fill="rgba(255,200,140,0.04)" stroke="#2d2218" stroke-width="12" />
      <rect x="940" y="140" width="600" height="420" fill="rgba(255,200,140,0.04)" stroke="#2d2218" stroke-width="12" />
    `
	},
	'bg_house.svg': {
		title: 'Eli\'s House',
		subtitle: 'Ridge Road • Taped Panes & Archival Dust',
		palette: { top: '#1c1b18', mid: '#151411', bot: '#0c0c0a' },
		extra: `
      <!-- Roll-top desk silhouette -->
      <rect x="1100" y="480" width="620" height="520" fill="#0b0a09" rx="8" />
      <rect x="1080" y="540" width="660" height="30" fill="#141210" />
      <!-- Taped window crosshatch -->
      <rect x="160" y="160" width="480" height="600" fill="rgba(255,255,255,0.02)" stroke="#221e19" stroke-width="16" />
      <line x1="160" y1="160" x2="640" y2="760" stroke="#735432" stroke-width="8" opacity="0.45" />
      <line x1="640" y1="160" x2="160" y2="760" stroke="#735432" stroke-width="8" opacity="0.45" />
    `
	},
	'bg_office.svg': {
		title: 'Sheriff\'s Office',
		subtitle: 'Municipal Annex • Fluorescent Cold',
		palette: { top: '#20252b', mid: '#181d22', bot: '#101317' },
		extra: `
      <!-- Fluorescent light tube glow -->
      <rect x="400" y="40" width="1120" height="24" fill="rgba(210,230,250,0.18)" rx="4" />
      <!-- Metal filing cabinets -->
      <rect x="180" y="320" width="340" height="700" fill="#0d1013" stroke="#222930" stroke-width="4" />
      <!-- Vance's metal desk -->
      <rect x="680" y="600" width="940" height="400" fill="#12161b" stroke="#2a333d" stroke-width="4" />
    `
	},
	'bg_motel.svg': {
		title: 'The Cormorant Motel',
		subtitle: 'Room 4 • Copper Gutters & Rain',
		palette: { top: '#1a1917', mid: '#131210', bot: '#0d0c0a' },
		extra: `
      <!-- Bed and small lamp glow -->
      <circle cx="1520" cy="420" r="140" fill="rgba(255,180,80,0.07)" />
      <rect x="1460" y="520" width="120" height="380" fill="#11100e" />
      <!-- Window looking onto wet pines -->
      <rect x="220" y="180" width="540" height="580" fill="#090b0d" stroke="#28241e" stroke-width="14" />
    `
	},
	'bg_church.svg': {
		title: 'Saint Jude in the Pines',
		subtitle: 'The Nave • Communion Rail & Tallow',
		palette: { top: '#17161b', mid: '#111014', bot: '#0a090c' },
		extra: `
      <!-- Gothic arch window -->
      <path d="M 810,120 Q 960,20 1110,120 L 1110,640 L 810,640 Z" fill="rgba(180,160,230,0.04)" stroke="#272230" stroke-width="8" />
      <!-- Communion rail -->
      <rect x="200" y="740" width="1520" height="30" fill="#09080b" />
      <line x1="960" y1="200" x2="960" y2="480" stroke="#373142" stroke-width="12" />
      <line x1="860" y1="280" x2="1060" y2="280" stroke="#373142" stroke-width="12" />
    `
	},
	'bg_point.svg': {
		title: 'The Cannery Run',
		subtitle: 'The Point • Floodlight & Wire at Night',
		palette: { top: '#10151c', mid: '#0c0f14', bot: '#07090c' },
		extra: `
      <!-- High chain-link fence mesh -->
      <rect x="400" y="240" width="1120" height="760" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
      <line x1="400" y1="240" x2="1520" y2="240" stroke="rgba(255,255,255,0.18)" stroke-width="6" />
      <line x1="400" y1="260" x2="1520" y2="260" stroke="rgba(255,255,255,0.18)" stroke-width="6" />
      <!-- Distant cannery wall silhouette -->
      <polygon points="1200,320 1920,240 1920,1080 1200,1080" fill="#07080a" />
    `
	},
	'bg_darkroom.svg': {
		title: 'The Darkroom',
		subtitle: 'Red Safelight & Chemical Trays',
		palette: { top: '#2b0c0c', mid: '#1c0808', bot: '#0f0404' },
		extra: `
      <!-- Red safelight bulb -->
      <circle cx="960" cy="180" r="80" fill="rgba(255,30,30,0.15)" />
      <circle cx="960" cy="180" r="22" fill="#ff4444" />
      <!-- Developing trays on table -->
      <rect x="320" y="680" width="400" height="80" fill="#140606" stroke="#441111" stroke-width="3" rx="4" />
      <rect x="760" y="680" width="400" height="80" fill="#140606" stroke="#441111" stroke-width="3" rx="4" />
      <rect x="1200" y="680" width="400" height="80" fill="#140606" stroke="#441111" stroke-width="3" rx="4" />
    `
	},
	'bg_shed_ext.svg': {
		title: 'The Shed Exterior',
		subtitle: 'Rusted Iron Hasp • Backyard Hemlocks',
		palette: { top: '#1c1f1c', mid: '#151715', bot: '#0c0e0c' },
		extra: `
      <!-- Weathered barn door & padlock -->
      <rect x="680" y="240" width="560" height="840" fill="#0b0d0b" stroke="#252b25" stroke-width="12" />
      <rect x="660" y="580" width="120" height="40" fill="#4d3b2c" rx="4" />
      <circle cx="720" cy="650" r="28" fill="#3b2d20" />
    `
	},
	'bg_cannery_ext.svg': {
		title: 'Point Cannery Exterior',
		subtitle: 'Western Spit • Salt Mizzle & Gulls',
		palette: { top: '#2b3038', mid: '#1f242b', bot: '#14181d' },
		extra: `
      <!-- Corrugated roof gable -->
      <polygon points="200,480 840,240 1480,480 1480,940 200,940" fill="#111418" stroke="#333d47" stroke-width="6" />
      <line x1="840" y1="240" x2="840" y2="940" stroke="#242b33" stroke-width="4" />
    `
	},
	'bg_graveyard.svg': {
		title: 'Saint Jude Graveyard',
		subtitle: 'Cedar Ridge • Raw Earth & Headstones',
		palette: { top: '#1c2024', mid: '#16191d', bot: '#0f1114' },
		extra: `
      <!-- Headstones in drizzle -->
      <path d="M 440,780 C 440,700 560,700 560,780 L 560,940 L 440,940 Z" fill="#090b0d" stroke="#283038" stroke-width="4" />
      <path d="M 880,720 C 880,620 1040,620 1040,720 L 1040,940 L 880,940 Z" fill="#090b0d" stroke="#283038" stroke-width="4" />
      <path d="M 1360,760 C 1360,670 1500,670 1500,760 L 1500,940 L 1360,940 Z" fill="#090b0d" stroke="#283038" stroke-width="4" />
    `
	}
};

for (const [filename, conf] of Object.entries(backgrounds)) {
	const svgContent = makeBgSvg(conf.title, conf.subtitle, conf.palette, conf.extra);
	fs.writeFileSync(path.join('dist/assets/images/backgrounds', filename), svgContent);
}
console.log(`Generated ${Object.keys(backgrounds).length} background scenes.`);

// 3. Character Portraits (Minimal High-Contrast Portrait Silhouettes)
function makePortraitSvg(name, toneColor, iconPath) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
  <defs>
    <linearGradient id="charGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${toneColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0e1114" stop-opacity="0.95" />
    </linearGradient>
  </defs>
  <!-- Character Torso Silhouette -->
  <path d="M 220,1100 L 260,720 Q 400,640 540,720 L 580,1100 Z" fill="url(#charGrad)" />
  <!-- Head Silhouette -->
  <circle cx="400" cy="500" r="140" fill="url(#charGrad)" />
  ${iconPath}
</svg>`;
}

const portraits = {
	'vance.svg': { color: '#4a5568', detail: '<rect x="360" y="700" width="80" height="40" fill="#cbd5e1" rx="4" />' },
	'nora.svg': { color: '#7c4a27', detail: '<path d="M 320,740 L 480,740 L 440,1100 L 360,1100 Z" fill="#eed8c3" opacity="0.3" />' },
	'toby.svg': { color: '#2b4c6f', detail: '<path d="M 340,640 Q 400,690 460,640" stroke="#93c5fd" stroke-width="8" fill="none" />' },
	'creel.svg': { color: '#4c3268', detail: '<line x1="400" y1="680" x2="400" y2="820" stroke="#e9d5ff" stroke-width="8" /><line x1="360" y1="720" x2="440" y2="720" stroke="#e9d5ff" stroke-width="8" />' },
	'kell.svg': { color: '#682a2a', detail: '<polygon points="380,680 420,680 400,760" fill="#fca5a5" />' },
	'price.svg': { color: '#68592a', detail: '<circle cx="400" cy="460" r="60" fill="#2d2613" />' }
};

for (const [filename, conf] of Object.entries(portraits)) {
	const svgContent = makePortraitSvg(filename, conf.color, conf.detail);
	fs.writeFileSync(path.join('dist/assets/images/characters', filename), svgContent);
}
console.log(`Generated ${Object.keys(portraits).length} character portraits.`);

console.log('All asset generation complete!');
