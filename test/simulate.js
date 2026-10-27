/**
 * Cormorant Bay — Playtest & Monte Carlo Narrative Simulator
 *
 * Simulates hundreds of playthroughs across multiple player archetypes to verify:
 * - Playtest balance (§12.2)
 * - Mercy route accessibility (Target: 10–30%)
 * - Heat 5 death check trigger and survival frequency
 * - Conviction spend rates (verifying players don't universally hoard)
 * - Ending distribution across all 11 resolution paths
 * - Zero softlocks or unhandled branches across all story paths
 */

const fs = require('fs');

// Archetype profiles allocating 4 points across perception, empathy, persuasion, grit (each starts at 1, max 3)
const ARCHETYPES = [
	{
		name: 'The Empathetic Local',
		reason: 'bury',
		skills: { perception: 2, empathy: 3, persuasion: 1, grit: 2 },
		preference: ['Empathy', 'Notice', 'ListenCreel', 'Warmth', 'Bury', 'Talk']
	},
	{
		name: 'The Hardboiled Reporter',
		reason: 'write',
		skills: { perception: 3, empathy: 1, persuasion: 2, grit: 2 },
		preference: ['Perception', 'Watch', 'NoticeFence', 'Desk', 'Darkroom', 'PressWithLetter', 'Cutters', 'BootsCheck', 'ConfrontKell', 'Tell']
	},
	{
		name: 'The Stubborn Bulldozer',
		reason: 'both',
		skills: { perception: 1, empathy: 1, persuasion: 3, grit: 3 },
		preference: ['Grit', 'Shed', 'PressPlain', 'GoDocks', 'ConfrontKell', 'Survive']
	},
	{
		name: 'The Balanced Generalist',
		reason: 'both',
		skills: { perception: 2, empathy: 2, persuasion: 2, grit: 2 },
		preference: []
	}
];

function runSimulation(archetype, seed) {
	let mockStorage = {};
	let steps = 0;
	const maxSteps = 1500;

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

	// Reset storage
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

	// Load script
	const scriptContent = fs.readFileSync('dist/js/script.js', 'utf8');
	eval(scriptContent);

	// Confirm landing card for archetype
	confirmLandingCard(mockEngine, archetype.reason, archetype.skills);

	const script = mockEngine._script;
	let currentLabel = 'ferry_after_form'; // Start after landing card form
	let currentIndex = 0;
	let reachedEnding = null;

	const history = [];

	while (steps < maxSteps && !reachedEnding) {
		steps++;
		history.push(currentLabel);
		const scene = script[currentLabel];
		if (!scene) {
			throw new Error(`Softlock: Label "${currentLabel}" not found in script!`);
		}

		if (currentIndex >= scene.length) {
			// Softlock: fell off array without jump or end
			throw new Error(`Softlock: Reached end of array in "${currentLabel}" without a jump or choice!`);
		}

		const step = scene[currentIndex];
		currentIndex++;

		if (step === 'end') {
			reachedEnding = currentLabel;
			break;
		}

		if (typeof step === 'string') {
			if (step.startsWith('jump ')) {
				currentLabel = step.replace('jump ', '').trim();
				currentIndex = 0;
				continue;
			}
			// Normal narration or audio/scene command, continue
			continue;
		}

		if (typeof step === 'function') {
			const res = step.call(mockEngine);
			if (typeof res === 'string' && res.startsWith('jump ')) {
				currentLabel = res.replace('jump ', '').trim();
				currentIndex = 0;
				continue;
			}
			continue;
		}

		if (typeof step === 'object') {
			const choiceObj = step.Choice || (step['What do you do?'] && step['What do you do?'].Choice);
			if (choiceObj) {
				// Evaluate available choices based on Condition
				const availableKeys = Object.keys(choiceObj).filter(key => {
					const opt = choiceObj[key];
					if (typeof opt.Condition === 'function') {
						try {
							return opt.Condition.call(mockEngine);
						} catch (e) {
							return false;
						}
					}
					return true;
				});

				if (availableKeys.length === 0) {
					throw new Error(`Softlock: No available choices in "${currentLabel}"!`);
				}

				// Pick preferred choice if available, otherwise random
				let selectedKey = availableKeys.find(k => archetype.preference.includes(k));
				if (!selectedKey) {
					selectedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
				}

				const choice = choiceObj[selectedKey];
				if (typeof choice.Do === 'string' && choice.Do.startsWith('jump ')) {
					currentLabel = choice.Do.replace('jump ', '').trim();
					currentIndex = 0;
					continue;
				} else if (typeof choice.Do === 'function') {
					const res = choice.Do.call(mockEngine);
					if (typeof res === 'string' && res.startsWith('jump ')) {
						currentLabel = res.replace('jump ', '').trim();
						currentIndex = 0;
						continue;
					}
				}
			}
		}
	}

	if (!reachedEnding) {
		console.error(`Timeout in run ${seed} for archetype ${archetype.name}. Last 20 labels:`, history.slice(-20));
	}

	return {
		archetype: archetype.name,
		ending: reachedEnding || 'TIMEOUT',
		heat: mockStorage.player.heat,
		cluesCount: mockStorage.player.clues.length,
		convictionRemaining: mockStorage.player.conviction,
		trustToby: mockStorage.player.trust.toby,
		trustNora: mockStorage.player.trust.nora,
		trustCreel: mockStorage.player.trust.creel
	};
}

console.log('--- Running 1,000 Automated Headless Playtest Simulations ---');
const totalRuns = 1000;
const results = [];
const endingCounts = {};

for (let i = 0; i < totalRuns; i++) {
	const arch = ARCHETYPES[i % ARCHETYPES.length];
	const res = runSimulation(arch, i);
	results.push(res);
	endingCounts[res.ending] = (endingCounts[res.ending] || 0) + 1;
}

console.log(`Simulated ${totalRuns} complete playthroughs.`);
console.log('\nEnding Distribution:');
for (const [end, count] of Object.entries(endingCounts).sort((a, b) => b[1] - a[1])) {
	const pct = ((count / totalRuns) * 100).toFixed(1);
	console.log(`- ${end.padEnd(24)} : ${count.toString().padStart(4)} (${pct}%)`);
}

const mercyRuns = results.filter(r => r.ending === 'ending_mercy');
const mercyPct = ((mercyRuns.length / totalRuns) * 100).toFixed(1);
console.log(`\nMercy Route Rate : ${mercyPct}% (Target: 10–30%)`);

const allTrustRuns = results.filter(r => r.trustToby >= 1 && r.trustNora >= 1 && r.trustCreel >= 1);
console.log('\nArchetype Breakdown:');
for (const arch of ARCHETYPES) {
	const archRuns = results.filter(r => r.archetype === arch.name);
	const archMercy = archRuns.filter(r => r.ending === 'ending_mercy').length;
	const archDeath = archRuns.filter(r => r.ending === 'day5_death').length;
	const archTrustAll = archRuns.filter(r => r.trustToby >= 1 && r.trustNora >= 1 && r.trustCreel >= 1).length;
	console.log(`- ${arch.name}:`);
	console.log(`  Trust Requirement Met: ${((archTrustAll / archRuns.length) * 100).toFixed(1)}%`);
	console.log(`  Mercy Route Rate     : ${((archMercy / archRuns.length) * 100).toFixed(1)}%`);
	console.log(`  Death Rate           : ${((archDeath / archRuns.length) * 100).toFixed(1)}%`);
}

const deathRuns = results.filter(r => r.ending === 'day5_death');
const deathPct = ((deathRuns.length / totalRuns) * 100).toFixed(1);
console.log(`Death Rate (Ending 11) : ${deathPct}%`);

const avgClues = (results.reduce((acc, r) => acc + r.cluesCount, 0) / totalRuns).toFixed(1);
console.log(`Average Clues Discovered : ${avgClues} / 13`);

const avgHeat = (results.reduce((acc, r) => acc + r.heat, 0) / totalRuns).toFixed(1);
console.log(`Average Final Heat : ${avgHeat} / 6`);

const convictionSpent = results.filter(r => r.convictionRemaining < 2).length;
console.log(`Conviction Usage Rate : ${((convictionSpent / totalRuns) * 100).toFixed(1)}%`);

if (endingCounts['TIMEOUT']) {
	console.error('ERROR: Softlock detected in simulation!');
	process.exit(1);
} else {
	console.log('\nSUCCESS: 0 softlocks, 0 dead-ends across 1,000 varied playthroughs!');
}
