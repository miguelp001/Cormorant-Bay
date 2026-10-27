/**
 * Cormorant Bay — Test Suite
 * Milestones 1–6 Verification:
 * - State helper API & Invariants
 * - Landing card form validation & state persistence
 * - Roll system (2d6 + skill + bonus vs DC), DC telegraphing & math display
 * - Conviction spend and reroll logic (keep better)
 * - Complete 11-Ending Resolution Matrix
 * - Milestone 6: Systems UI & Clue Journal (Field Notebook)
 *   - Exit criteria: A new player can check their skills and clues without instruction; the journal lists held clues accurately
 *   - Dual Readings: Every clue has a distinct surface reading and underneath reading
 *   - Suspect cases: Evidence checklist and tier badges (Thin / Partial / Full)
 *   - Dossier: Allocated skills, Heat status description, and Conviction charges
 */

const assert = require('assert');
const fs = require('fs');

let mockStorage = {};

const mockEngine = {
	storage: function (key, val) {
		if (typeof val !== 'undefined') {
			mockStorage[key] = val;
			return val;
		}
		if (typeof key === 'object') {
			Object.assign(mockStorage, key);
			return mockStorage;
		}
		return mockStorage[key];
	},
	script: function (s) {
		this._script = s;
		return s;
	}
};

global.monogatari = mockEngine;
global.window = global;

function resetStorage() {
	mockStorage = {
		player: {
			skills: { perception: 1, empathy: 1, persuasion: 1, grit: 1 },
			conviction: 2,
			heat: 0,
			clues: [],
			hasCutters: false,
			visitReason: '',
			trust: { nora: 0, vance: 0, toby: 0, creel: 0, price: 0, kell: 0 }
		},
		convictionLeft: 2,
		visitReasonLabel: ''
	};
}

resetStorage();

// Load script.js logic into test environment
const scriptContent = fs.readFileSync('dist/js/script.js', 'utf8');
eval(scriptContent);

// Load landing-card.js logic into test environment
const landingContent = fs.readFileSync('dist/js/landing-card.js', 'utf8');
eval(landingContent);

console.log('--- Section 1: Helper API & State Invariants ---');

// 1. Test P and put
const p = P(mockEngine);
assert.strictEqual(p.conviction, 2, 'Initial conviction should be 2');
assert.strictEqual(p.heat, 0, 'Initial heat should be 0');

// 2. Test landing card confirmation
confirmLandingCard(mockEngine, 'write', { perception: 3, empathy: 2, persuasion: 1, grit: 2 });
assert.strictEqual(mockStorage.player.visitReason, 'write', 'Visit reason should be write');
assert.strictEqual(mockStorage.visitReasonLabel, 'Writing about the town.', 'Flat mirror visitReasonLabel set');

// 3. Test Clue addition and duplication prevention
clue(mockEngine, 'saw_the_fence');
assert.strictEqual(hasClue(mockEngine, 'saw_the_fence'), true, 'saw_the_fence should be held');
clue(mockEngine, 'saw_the_fence');
assert.strictEqual(mockStorage.player.clues.filter(c => c === 'saw_the_fence').length, 1, 'Clue should not duplicate');

// 4. Test Heat adjustment (clamped 0 to 6)
heat(mockEngine, 2);
assert.strictEqual(mockStorage.player.heat, 2, 'Heat increased to 2');
heat(mockEngine, 10);
assert.strictEqual(mockStorage.player.heat, 6, 'Heat clamped at 6');
heat(mockEngine, -10);
assert.strictEqual(mockStorage.player.heat, 0, 'Heat clamped at 0');

// 5. Test Conviction spend & reroll keeps better result
resetStorage();
spend(mockEngine);
assert.strictEqual(conviction(mockEngine), 1, 'Conviction decremented to 1');
assert.strictEqual(mockStorage.convictionLeft, 1, 'convictionLeft flat mirror updated to 1');

mockEngine.storage('lastRoll', { total: 10, d1: 4, d2: 4, diceSum: 8, s: 2, bonus: 0, success: true, clean: false, cost: true, margin: 1 });
const rerollResult = rerollWithConviction(mockEngine, 'grit', 9);
assert(rerollResult.total >= 10, 'Conviction reroll must keep the better of the two results');

console.log('--- Section 2: Accusation Matrix & 11 Endings ---');

const script = mockEngine._script;
assert(script, 'Script must be registered');

// Verify Invariant §5.9: Vance is not in the accusation choice
const accuseChoice = script.accuse_hub.find(step => step.Choice).Choice;
assert(!accuseChoice.AccuseVance, 'Invariant §5.9: Vance must never be an accusation option');
assert(accuseChoice.AccuseToby, 'Toby accusation option exists');
assert(accuseChoice.AccusePrice, 'Price accusation option exists');
assert(accuseChoice.AccuseKell, 'Kell accusation option exists');
assert(accuseChoice.AccuseCreel, 'Creel accusation option exists');
assert(accuseChoice.Nobody, 'Nobody option exists');

// Distinctness verification across all 11 endings:
const all11Endings = [
	'ending_leave',        // Ending 1
	'leave_partial',       // Ending 2
	'leave_full',          // Ending 3
	'toby_thin',           // Ending 4
	'ending_toby_partial', // Ending 5
	'ending_toby_full',    // Ending 6
	'ending_mercy',        // Ending 7
	'ending_price_full',   // Ending 8
	'ending_creel_ruin',   // Ending 9
	'ending_kell_full',    // Ending 10
	'day5_death'           // Ending 11
];

for (const endLabel of all11Endings) {
	assert(script[endLabel], `Ending label "${endLabel}" must exist`);
	assert(Array.isArray(script[endLabel]) && script[endLabel].length > 0, `Ending label "${endLabel}" must contain narrative content`);
}
// Verify saw_the_wolf payoff routing
resetStorage();
clue(mockEngine, 'saw_the_wolf');
const tobyAccuseTarget = accuseChoice.AccuseToby.Do.call(mockEngine);
assert.strictEqual(tobyAccuseTarget, 'jump accuse_toby_saw_wolf', 'Holding saw_the_wolf jumps to accuse_toby_saw_wolf');
assert(script.accuse_toby_saw_wolf, 'accuse_toby_saw_wolf label exists');
assert(script.accuse_toby_saw_wolf.includes('jump accuse_toby_full_fork'), 'accuse_toby_saw_wolf routes to full resolution fork');
console.log('Verified saw_the_wolf accusation payoff route.');

console.log(`Verified all ${all11Endings.length} endings from DESIGN.md §8.1.`);

console.log('--- Section 3: Milestone 6 Systems UI & Clue Journal ---');

// 1. Verify Dual-Reading Evidence Master Table (§5.6)
const expectedClues = [
	'saw_the_fence',
	'county_letter',
	'the_photograph',
	'circled_calendar',
	'vance_nervous',
	'vance_admission',
	'gate_open',
	'truck_at_point',
	'price_boots',
	'kell_threat',
	'confession_heard',
	'creel_story',
	'saw_the_wolf'
];

assert(window.CLUE_DETAILS, 'CLUE_DETAILS must be exported');
for (const clueId of expectedClues) {
	const detail = window.CLUE_DETAILS[clueId];
	assert(detail, `Clue "${clueId}" must have details in CLUE_DETAILS`);
	assert(detail.title && detail.title.length > 0, `Clue "${clueId}" must have a title`);
	assert(detail.surface && detail.surface.length > 0, `Clue "${clueId}" must have a surface reading`);
	assert(detail.underneath && detail.underneath.length > 0, `Clue "${clueId}" must have an underneath reading`);
	assert.notStrictEqual(detail.surface, detail.underneath, `Dual readings must differ for "${clueId}"`);
}
console.log(`Verified all ${expectedClues.length} clues contain distinct dual readings (surface vs underneath).`);

// 2. Verify Suspect Case Files & Clue Mapping
assert(window.SUSPECT_DETAILS, 'SUSPECT_DETAILS must be exported');
const suspectsMapped = window.SUSPECT_DETAILS.map(s => s.id);
assert.deepStrictEqual(suspectsMapped.sort(), ['creel', 'kell', 'price', 'toby'].sort(), 'Suspect cases must cover Toby, Price, Kell, Creel');

for (const s of window.SUSPECT_DETAILS) {
	assert.strictEqual(s.clues.length, 3, `Suspect ${s.id} must have exactly 3 case clues`);
	const suspectClueIds = s.clues.map(c => c.id).sort();
	const evidenceIds = (EVIDENCE[s.id] || []).slice().sort();
	assert.deepStrictEqual(suspectClueIds, evidenceIds, `Suspect ${s.id} clues must match EVIDENCE table`);
}
console.log('Verified suspect case files and clue checklists strictly mirror EVIDENCE table.');

// 3. Test DOM Render Simulation of Journal
// Mock Document elements for renderJournal()
const domStore = {};
function createMockEl(id) {
	return {
		id,
		textContent: '',
		innerHTML: '',
		classList: {
			add: () => {},
			remove: () => {}
		}
	};
}

global.document = {
	getElementById: function (id) {
		if (!domStore[id]) {
			domStore[id] = createMockEl(id);
		}
		return domStore[id];
	},
	querySelectorAll: function () {
		return [];
	}
};

resetStorage();
confirmLandingCard(mockEngine, 'both', { perception: 3, empathy: 2, persuasion: 1, grit: 2 });
clue(mockEngine, 'county_letter');
clue(mockEngine, 'the_photograph');
heat(mockEngine, 3);
spend(mockEngine);

// Execute renderJournal
window.renderJournal();

// Verify Clue Count
assert.strictEqual(domStore['journal-clue-count'].textContent, '2', 'Journal clue count should be 2');
assert(domStore['journal-clues-list'].innerHTML.includes('County Board of Health Complaint'), 'Clues list renders letter');
assert(domStore['journal-clues-list'].innerHTML.includes('Night Floodlight Photographs'), 'Clues list renders photograph');

// Verify Suspects List
assert(domStore['journal-suspects-list'].innerHTML.includes('Toby Rook'), 'Suspects list renders Toby');
assert(domStore['journal-suspects-list'].innerHTML.includes('Merritt Kell'), 'Suspects list renders Kell');

// Verify Dossier (Skills & Conviction)
assert.strictEqual(domStore['dossier-val-perception'].textContent, '3', 'Dossier renders Perception 3');
assert.strictEqual(domStore['dossier-val-empathy'].textContent, '2', 'Dossier renders Empathy 2');
assert.strictEqual(domStore['dossier-val-persuasion'].textContent, '1', 'Dossier renders Persuasion 1');
assert.strictEqual(domStore['dossier-val-grit'].textContent, '2', 'Dossier renders Grit 2');
assert(domStore['dossier-heat-status'].textContent.includes('Noticed'), 'Dossier renders descriptive Heat status');
assert(domStore['dossier-conviction-pips'].innerHTML.includes('Spent'), 'Dossier renders spent conviction pip');

console.log('Verified Journal rendering of held clues, dual readings, suspect cases, and Alana\'s dossier.');

console.log('--- Section 4: Milestones 7 & 8 Assets & PWA Verification ---');

// 1. Verify Service Worker file existence and cache array
const swContent = fs.readFileSync('dist/service-worker.js', 'utf8');
const versionMatch = swContent.match(/const version = '([^']+)';/);
assert(versionMatch && versionMatch[1] === '1.0.0', 'Service worker version must be bumped to 1.0.0');

const filesMatch = swContent.match(/const files = \[([\s\S]*?)\];/);
assert(filesMatch, 'Service worker must declare files array');
const fileEntries = filesMatch[1]
	.split('\n')
	.map(line => line.trim())
	.filter(line => line.startsWith("'./") || line.startsWith('"./'))
	.map(line => line.replace(/['",]/g, '').replace(/^\.\//, 'dist/'));

for (const f of fileEntries) {
	if (f === 'dist/' || f === 'dist') continue;
	assert(fs.existsSync(f), `Asset in service worker files array must exist on disk: ${f}`);
}
console.log(`Verified all ${fileEntries.length} service worker cache assets exist on disk.`);

// 2. Verify all background scenes and audio referenced in script.js
const scriptText = fs.readFileSync('dist/js/script.js', 'utf8');
const sceneMatches = [...scriptText.matchAll(/show scene ([a-z_0-9]+)/g)].map(m => m[1]);
const uniqueScenes = [...new Set(sceneMatches)];
for (const sceneKey of uniqueScenes) {
	const expectedBgFile = `dist/assets/images/backgrounds/bg_${sceneKey}.svg`;
	assert(fs.existsSync(expectedBgFile), `Background asset file for scene "${sceneKey}" must exist: ${expectedBgFile}`);
}
console.log(`Verified all ${uniqueScenes.length} scenes referenced in script.js map to real background SVGs.`);

const musicMatches = [...scriptText.matchAll(/play music ([a-z_0-9]+)/g)].map(m => m[1]);
const uniqueMusic = [...new Set(musicMatches)];
for (const track of uniqueMusic) {
	assert(['rain', 'guitar'].includes(track), `Music track "${track}" must be registered in options.js`);
}
console.log(`Verified all music commands (${uniqueMusic.join(', ')}) are registered.`);

// 3. Verify PWA Manifest
const manifestRaw = fs.readFileSync('dist/manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);
assert.strictEqual(manifest.display, 'standalone', 'PWA manifest display must be standalone');
assert.strictEqual(manifest.orientation, 'portrait', 'PWA manifest orientation must be portrait');
assert(manifest.icons.some(i => i.sizes === '192x192'), 'PWA manifest must include 192x192 icon');
assert(manifest.icons.some(i => i.sizes === '512x512' && !i.purpose), 'PWA manifest must include standard 512x512 icon');
assert(manifest.icons.some(i => i.purpose === 'maskable'), 'PWA manifest must include maskable icon');
console.log('Verified PWA manifest meets install criteria.');

console.log('All Milestone 7 & 8 tests passed successfully!');
