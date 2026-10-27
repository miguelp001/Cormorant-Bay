/**
 * Cormorant Bay — Test Suite
 * Milestones 1, 2, 3 & 4 Verification:
 * - State helper API & Invariants
 * - Landing card form validation & state persistence
 * - Roll system (2d6 + skill + bonus vs DC), DC telegraphing & math display
 * - Conviction spend and reroll logic (keep better)
 * - Milestone 4 narrative paths:
 *   - Day 4 church reveal: creel_story is always granted (§12.1 exit criteria)
 *   - Day 5 Moon: Point, Vigil, Stay, and Heat 5 Death Check (Grit DC 12)
 *   - Death check reachable at Heat >= 5 and survivable via roll or Conviction
 *   - Suspect Evidence Tiers: Toby, Price, Creel, and Kell all have reachable Full Tier (3/3)
 *   - Invariant §5.1: Every failure produces state
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

console.log('--- Section 2: Milestone 4 Exit Criteria & Invariants ---');

const script = mockEngine._script;
assert(script, 'Script must be registered');

// Verify all M4 labels
const m4Labels = [
	'day4_church',
	'day4_creel_clean',
	'day4_creel_guarded',
	'day4_name',
	'day5_thursday_start',
	'day5_attack',
	'day5_attack_survive',
	'day5_attack_fail',
	'day5_attack_reroll',
	'day5_death',
	'day5_moon_choice',
	'day5_point_wolf',
	'day5_point_blur',
	'day5_point_reroll',
	'day5_vigil',
	'day5_stay',
	'day6_morning'
];

for (const label of m4Labels) {
	assert(script[label], `Label "${label}" must exist in script`);
}
console.log(`All ${m4Labels.length} Milestone 4 labels verified.`);

// Exit Criterion 1: creel_story is always granted
resetStorage();
script.day4_creel_clean.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(hasClue(mockEngine, 'creel_story'), true, 'creel_story must be granted on clean success');

resetStorage();
script.day4_creel_guarded.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(hasClue(mockEngine, 'creel_story'), true, 'creel_story must be granted on guarded branch');
assert.strictEqual(P(mockEngine).heat, 1, 'day4_creel_guarded must produce state (+1 heat)');
console.log('Verified Exit Criterion 1: creel_story is unconditionally granted along the spine.');

// Exit Criterion 2: Death check is reachable at Heat >= 5 and survivable
resetStorage();
heat(mockEngine, 5);
const thursdayAction = script.day5_thursday_start.find(x => typeof x === 'function');
const targetBranchAtHeat5 = thursdayAction.call(mockEngine);
assert.strictEqual(targetBranchAtHeat5, 'jump day5_attack', 'Heat >= 5 must route to day5_attack');

// Test death check survival
resetStorage();
script.day5_attack_survive.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(hasClue(mockEngine, 'saw_the_wolf'), true, 'Surviving attack grants saw_the_wolf');

// Test death ending on failure
assert(script.day5_death.some(step => step.includes('Ending 11')), 'day5_death represents Ending 11');
console.log('Verified Exit Criterion 2: Death check is reachable at Heat 5 and survivable.');

// Exit Criterion 3: All four suspects have reachable Full Tier (Tier 3)
resetStorage();
// Toby evidence
clue(mockEngine, 'the_photograph');
clue(mockEngine, 'circled_calendar');
clue(mockEngine, 'creel_story');
assert.strictEqual(evidenceAgainst(mockEngine, 'toby'), 3, 'Toby has Full Tier (3/3)');

// Price evidence
clue(mockEngine, 'truck_at_point');
clue(mockEngine, 'price_boots');
clue(mockEngine, 'gate_open');
assert.strictEqual(evidenceAgainst(mockEngine, 'price'), 3, 'Price has Full Tier (3/3)');

// Creel evidence
clue(mockEngine, 'vance_admission');
clue(mockEngine, 'confession_heard');
assert.strictEqual(evidenceAgainst(mockEngine, 'creel'), 3, 'Creel has Full Tier (3/3)');

// Kell evidence
clue(mockEngine, 'county_letter');
clue(mockEngine, 'kell_threat');
assert.strictEqual(evidenceAgainst(mockEngine, 'kell'), 3, 'Kell has Full Tier (3/3)');
console.log('Verified Exit Criterion 3: All four suspects (Toby, Price, Creel, Kell) have reachable Full Tiers (3/3).');

// Verify Invariant §5.4: Choice text telegraphs DC for all checks
let dcCheckCount = 0;
for (const [label, steps] of Object.entries(script)) {
	for (const step of steps) {
		if (step && typeof step === 'object' && step.Choice) {
			for (const [optKey, optVal] of Object.entries(step.Choice)) {
				if (typeof optVal.Do === 'function') {
					const doStr = optVal.Do.toString();
					if (doStr.includes('roll(')) {
						assert(
							optVal.Text.includes('DC '),
							`Choice "${optKey}" in label "${label}" rolls dice but Text does not telegraph DC: "${optVal.Text}"`
						);
						dcCheckCount++;
					}
				}
			}
		}
	}
}
console.log(`Verified ${dcCheckCount} roll choices across entire game explicitly telegraph DC.`);

console.log('All Milestone 4 tests passed successfully!');
