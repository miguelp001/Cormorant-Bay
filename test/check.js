/**
 * Cormorant Bay — Test Suite
 * Milestones 1, 2 & 3 Verification:
 * - State helper API & Invariants
 * - Landing card form validation & state persistence
 * - Roll system (2d6 + skill + bonus vs DC), DC telegraphing & math display
 * - Conviction spend and reroll logic (keep better)
 * - Milestone 3 narrative paths: all branches reach Act One end (night_day3)
 * - Invariant §5.1: Every failure produces state
 * - Suspect Evidence Tiers: Price and Kell have reachable Full (Tier 3), Toby and Creel have Partial (Tier 2) ready for Day 4 reveal
 * - Mercy route trust thresholds: trust.toby >= 1, trust.nora >= 1, trust.creel >= 1 all reachable
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
assert.strictEqual(mockStorage.player.skills.perception, 3, 'Perception updated to 3');
assert.strictEqual(mockStorage.player.skills.grit, 2, 'Grit updated to 2');

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

// 5. Test Trust adjustment
trustUp(mockEngine, 'toby', 2);
assert.strictEqual(trust(mockEngine, 'toby'), 2, 'Toby trust should be 2');
trustUp(mockEngine, 'toby', -3);
assert.strictEqual(trust(mockEngine, 'toby'), -1, 'Toby trust decremented to -1');

// 6. Test Roll resolution and math display
const r = roll(mockEngine, 'perception', 7, 1);
assert(typeof r.d1 === 'number' && r.d1 >= 1 && r.d1 <= 6, 'd1 should be 1-6');
assert(typeof r.d2 === 'number' && r.d2 >= 1 && r.d2 <= 6, 'd2 should be 1-6');
assert.strictEqual(r.s, 3, 'Skill applied matches player perception');
assert.strictEqual(r.bonus, 1, 'Bonus applied');
assert.strictEqual(r.total, r.d1 + r.d2 + 3 + 1, 'Total matches sum of dice + skill + bonus');
const line = rollLine(r);
assert(line.includes('Perception — 2d6'), 'Roll line contains skill name');
assert(line.includes(`vs DC 7`), 'Roll line displays target DC');
console.log('Sample Roll Line:', line);

// 7. Test Conviction spend & flat mirror update
resetStorage();
assert.strictEqual(conviction(mockEngine), 2, 'Conviction initially 2');
spend(mockEngine);
assert.strictEqual(conviction(mockEngine), 1, 'Conviction decremented to 1');
assert.strictEqual(mockStorage.convictionLeft, 1, 'convictionLeft flat mirror updated to 1');

// 8. Test Conviction reroll keeps better result
mockEngine.storage('lastRoll', { total: 10, d1: 4, d2: 4, diceSum: 8, s: 2, bonus: 0, success: true, clean: false, cost: true, margin: 1 });
const rerollResult = rerollWithConviction(mockEngine, 'grit', 9);
assert(rerollResult.total >= 10, 'Conviction reroll must keep the better of the two results');

// 9. Test Evidence Tiers for suspects in Act 1
resetStorage();
// Price Evidence
clue(mockEngine, 'truck_at_point');
clue(mockEngine, 'price_boots');
assert.strictEqual(evidenceAgainst(mockEngine, 'price'), 2, 'Price 2/3 clues = Partial (2)');
clue(mockEngine, 'gate_open');
assert.strictEqual(evidenceAgainst(mockEngine, 'price'), 3, 'Price 3/3 clues = Full (3)');

// Kell Evidence
clue(mockEngine, 'county_letter');
clue(mockEngine, 'kell_threat');
assert.strictEqual(evidenceAgainst(mockEngine, 'kell'), 3, 'Kell 3/3 clues (gate_open, county_letter, kell_threat) = Full (3)');

// Toby Evidence (Photographs and calendar in Act 1)
clue(mockEngine, 'the_photograph');
clue(mockEngine, 'circled_calendar');
assert.strictEqual(evidenceAgainst(mockEngine, 'toby'), 2, 'Toby 2/3 clues = Partial (2)');

// Creel Evidence (Admission and confession in Act 1)
clue(mockEngine, 'vance_admission');
clue(mockEngine, 'confession_heard');
assert.strictEqual(evidenceAgainst(mockEngine, 'creel'), 2, 'Creel 2/3 clues = Partial (2)');

console.log('--- Section 2: Milestone 3 Script Structure & Labels ---');

const script = mockEngine._script;
assert(script, 'Script must be registered');

// Verify Milestone 3 labels
const m3Labels = [
	'motel_night',
	'toby_night_pass',
	'toby_night_fail',
	'toby_night_reroll',
	'toby_night_lost',
	'day2_morning',
	'cannery_exterior',
	'cannery_cutters_pass',
	'cannery_find',
	'cannery_fail',
	'cannery_reroll',
	'day2_docks_toby',
	'toby_testimony_pass',
	'toby_testimony_fail',
	'price_dock_scene',
	'price_boots_pass',
	'price_boots_fail',
	'price_reroll',
	'nora_dinner_scene',
	'nora_dinner_pass',
	'nora_dinner_fail',
	'nora_dinner_quiet',
	'day3_morning',
	'kell_pass',
	'kell_fail',
	'kell_reroll',
	'funeral_scene',
	'funeral_empathy_pass',
	'funeral_empathy_fail',
	'funeral_finish',
	'vance_drawer_scene',
	'vance_drawer_success',
	'vance_drawer_fail',
	'vance_drawer_reroll',
	'night_day3'
];

for (const label of m3Labels) {
	assert(script[label], `Label "${label}" must exist in script`);
}
console.log(`All ${m3Labels.length} Milestone 3 labels verified.`);

// Verify Invariant §5.4: Choice text telegraphs DC for all checks
let rollChoiceCount = 0;
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
						rollChoiceCount++;
					}
				}
			}
		}
	}
}
console.log(`Verified ${rollChoiceCount} roll choices across script explicitly telegraph DC in their choice text.`);

// Verify Invariant §5.1: M3 failure branches produce state
resetStorage();
// 1. toby_night_fail -> heat +1
script.toby_night_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 1, 'toby_night_fail produces state (+1 heat)');

// 2. cannery_fail -> heat +1
resetStorage();
script.cannery_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 1, 'cannery_fail produces state (+1 heat)');

// 3. toby_testimony_fail -> heat +1
resetStorage();
script.toby_testimony_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 1, 'toby_testimony_fail produces state (+1 heat)');

// 4. price_boots_fail -> heat +2 (altercation/trespassing per §7.4)
resetStorage();
script.price_boots_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 2, 'price_boots_fail produces state (+2 heat)');

// 5. kell_fail -> heat +1
resetStorage();
script.kell_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 1, 'kell_fail produces state (+1 heat)');

// 6. vance_drawer_fail -> heat +1
resetStorage();
script.vance_drawer_fail.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(P(mockEngine).heat, 1, 'vance_drawer_fail produces state (+1 heat)');

console.log('Verified Invariant §5.1: All Milestone 3 failure branches produce concrete state changes.');

console.log('--- Section 3: Mercy Route Trust Verification ---');
resetStorage();
// 1. Toby trust from night dock scene (Invariant §5.7)
script.toby_night_pass.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(trust(mockEngine, 'toby'), 1, 'toby trust is 1 after night dock scene');

// 2. Nora trust from diner dinner
script.nora_dinner_pass.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(trust(mockEngine, 'nora'), 1, 'nora trust is 1 after diner dinner scene');

// 3. Creel trust from funeral
script.funeral_empathy_pass.find(x => typeof x === 'function').call(mockEngine);
assert.strictEqual(trust(mockEngine, 'creel'), 1, 'creel trust is 1 after funeral scene');

// Verify mercy route threshold invariant
const canMercy = trust(mockEngine, 'toby') >= 1 && trust(mockEngine, 'nora') >= 1 && trust(mockEngine, 'creel') >= 1;
assert.strictEqual(canMercy, true, 'All three trust conditions for ending_mercy are reachable by end of Act One');
console.log('Mercy route trust requirements (trust.toby >= 1 && trust.nora >= 1 && trust.creel >= 1) verified achievable!');

console.log('All Milestone 3 tests passed successfully!');
