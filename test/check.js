/**
 * Milestone 1 Verification Suite
 * Verifies helper functions, roll resolution, conviction rerolls, and landing card logic.
 */

const assert = require('assert');

// Mock engine storage
const mockStorage = {
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
		return s;
	}
};

global.monogatari = mockEngine;
global.window = global;

// Load script.js logic into test environment
const fs = require('fs');
const scriptContent = fs.readFileSync('dist/js/script.js', 'utf8');
// Evaluate only the helper definitions
eval(scriptContent);

console.log('Testing Milestone 1 invariants...');

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

// 4. Test Heat adjustment (bounded 0 to 6)
heat(mockEngine, 2);
assert.strictEqual(mockStorage.player.heat, 2, 'Heat increased to 2');
heat(mockEngine, 10);
assert.strictEqual(mockStorage.player.heat, 6, 'Heat clamped at 6');
heat(mockEngine, -10);
assert.strictEqual(mockStorage.player.heat, 0, 'Heat clamped at 0');

// 5. Test Trust adjustment
trustUp(mockEngine, 'toby', 2);
assert.strictEqual(trust(mockEngine, 'toby'), 2, 'Toby trust should be 2');

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
assert.strictEqual(conviction(mockEngine), 2, 'Conviction initially 2');
spend(mockEngine);
assert.strictEqual(conviction(mockEngine), 1, 'Conviction decremented to 1');
assert.strictEqual(mockStorage.convictionLeft, 1, 'convictionLeft flat mirror updated to 1');

// 8. Test Conviction reroll keeps better result
mockEngine.storage('lastRoll', { total: 10, d1: 4, d2: 4, diceSum: 8, s: 2, bonus: 0, success: true, clean: false, cost: true, margin: 1 });
const rerollResult = rerollWithConviction(mockEngine, 'grit', 9);
assert(rerollResult.total >= 10, 'Conviction reroll must keep the better of the two results');

// 9. Test Evidence Tiers
mockStorage.player.clues = ['the_photograph', 'circled_calendar'];
assert.strictEqual(evidenceAgainst(mockEngine, 'toby'), 2, '2 clues should equal Partial (tier 2)');
clue(mockEngine, 'creel_story');
assert.strictEqual(evidenceAgainst(mockEngine, 'toby'), 3, '3 clues should equal Full (tier 3)');

console.log('All Milestone 1 verification tests passed successfully!');
