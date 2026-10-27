/**
 * Cormorant Bay — script.js
 * Mechanics Helpers and Narrative Script
 */

'use strict';
/* global monogatari, showLandingCard */

// Suspect Evidence Table per DESIGN.md §7.6
const EVIDENCE = {
	toby: ['the_photograph', 'circled_calendar', 'creel_story'],
	price: ['truck_at_point', 'price_boots', 'gate_open'],
	creel: ['creel_story', 'vance_admission', 'confession_heard'],
	kell: ['county_letter', 'gate_open', 'kell_threat']
};

// =============================================================================
// Helper API (§7.5) — The only sanctioned way to mutate state
// =============================================================================

function getEngine (e) {
	if (e && typeof e.storage === 'function') {
		return e;
	}
	if (typeof monogatari !== 'undefined' && typeof monogatari.storage === 'function') {
		return monogatari;
	}
	return null;
}

function P (e) {
	const engine = getEngine(e);
	if (!engine) {
		return {};
	}
	const p = engine.storage('player');
	return (typeof p === 'object' && p !== null) ? p : {};
}

function put (e, patch) {
	const engine = getEngine(e);
	if (!engine) {
		return;
	}
	const current = P(engine);
	const updated = Object.assign({}, current, patch);
	engine.storage('player', updated);
	return updated;
}

function clue (e, id) {
	const engine = getEngine(e);
	const player = P(engine);
	const clues = Array.isArray(player.clues) ? [...player.clues] : [];
	if (!clues.includes(id)) {
		clues.push(id);
		put(engine, { clues });
	}
	return clues;
}

function hasClue (e, id) {
	const engine = getEngine(e);
	const player = P(engine);
	return Array.isArray(player.clues) && player.clues.includes(id);
}

function heat (e, n) {
	const engine = getEngine(e);
	const player = P(engine);
	const current = typeof player.heat === 'number' ? player.heat : 0;
	const next = Math.max(0, Math.min(6, current + n));
	put(engine, { heat: next });
	return next;
}

function trust (e, who) {
	const engine = getEngine(e);
	const player = P(engine);
	const t = player.trust || {};
	return typeof t[who] === 'number' ? t[who] : 0;
}

function trustUp (e, who, n) {
	const engine = getEngine(e);
	const player = P(engine);
	const t = Object.assign({}, player.trust);
	const current = typeof t[who] === 'number' ? t[who] : 0;
	t[who] = current + n;
	put(engine, { trust: t });
	return t[who];
}

function conviction (e) {
	const engine = getEngine(e);
	const player = P(engine);
	return typeof player.conviction === 'number' ? player.conviction : 0;
}

function spend (e) {
	const engine = getEngine(e);
	const current = conviction(engine);
	const next = Math.max(0, current - 1);
	put(engine, { conviction: next });
	engine.storage('convictionLeft', next);
	return next;
}

function roll (e, skill, dc, bonus = 0) {
	const engine = getEngine(e);
	const player = P(engine);
	const skillVal = (player.skills && typeof player.skills[skill] === 'number') ? player.skills[skill] : 1;
	const d1 = Math.floor(Math.random() * 6) + 1;
	const d2 = Math.floor(Math.random() * 6) + 1;
	const diceSum = d1 + d2;
	const total = diceSum + skillVal + bonus;
	const success = total >= dc;
	const clean = total >= dc + 3;
	const cost = success && !clean;
	const margin = total - dc;

	const res = {
		skill,
		dc,
		bonus,
		d1,
		d2,
		diceSum,
		s: skillVal,
		total,
		success,
		clean,
		cost,
		margin
	};

	if (engine) {
		engine.storage('lastRoll', res);
	}
	return res;
}

function rollLine (r) {
	if (!r) {
		return '';
	}
	const skillCap = r.skill.charAt(0).toUpperCase() + r.skill.slice(1);
	const bonusPart = r.bonus ? ` + ${r.bonus}` : '';
	let outcome = 'Failure.';
	if (r.clean) {
		outcome = 'Clean success.';
	} else if (r.success) {
		outcome = 'Success, at a cost.';
	}

	return `${skillCap} — 2d6 (${r.d1}+${r.d2}) + ${r.s}${bonusPart} = ${r.total} vs DC ${r.dc}. ${outcome}`;
}

function rerollWithConviction (e, skill, dc, bonus = 0) {
	const engine = getEngine(e);
	const prev = engine.storage('lastRoll');
	const next = roll(engine, skill, dc, bonus);

	// Conviction invariant §5.5: Keep the better of the two results
	if (prev && prev.total > next.total) {
		next.d1 = prev.d1;
		next.d2 = prev.d2;
		next.diceSum = prev.diceSum;
		next.total = prev.total;
		next.success = prev.success;
		next.clean = prev.clean;
		next.cost = prev.cost;
		next.margin = prev.margin;
		next.keptPrior = true;
	}

	engine.storage('lastRoll', next);
	return next;
}

function evidenceAgainst (e, who) {
	const engine = getEngine(e);
	const required = EVIDENCE[who] || [];
	if (!required.length) {
		return 1;
	}
	let count = 0;
	for (const id of required) {
		if (hasClue(engine, id)) {
			count++;
		}
	}
	if (count >= 3) {
		return 3; // Full
	}
	if (count === 2) {
		return 2; // Partial
	}
	return 1; // Thin
}

function confirmLandingCard (e, reason, skills) {
	const engine = getEngine(e);
	const player = P(engine);
	player.skills = Object.assign({}, player.skills, skills);
	player.visitReason = reason;

	let label = 'Burying my father.';
	if (reason === 'write') {
		label = 'Writing about the town.';
	} else if (reason === 'both') {
		label = 'Both.';
	}

	put(engine, player);
	engine.storage('visitReasonLabel', label);
	return label;
}

// Window exports for engine evaluation
window.P = P;
window.put = put;
window.clue = clue;
window.hasClue = hasClue;
window.heat = heat;
window.trust = trust;
window.trustUp = trustUp;
window.conviction = conviction;
window.spend = spend;
window.roll = roll;
window.rollLine = rollLine;
window.rerollWithConviction = rerollWithConviction;
window.evidenceAgainst = evidenceAgainst;
window.confirmLandingCard = confirmLandingCard;

// =============================================================================
// Monogatari Script: Milestone 1 Verification Narrative
// =============================================================================

monogatari.script({
	'Start': [
		'y Rain drums against the cabin glass. The diesel rumble of the ferry vibrates in the bench beneath you.',
		'y Across the grey swell of the sound, Cormorant Bay is only a dark ridge between pine and mist.',
		'y In your lap sits the white registration slip the deckhand handed you with your envelope.',
		function () {
			showLandingCard();
			return false; // Pause script until landing card is confirmed
		}
	],

	'ferry_after_form': [
		'y You fold the card and slip it into your notebook.',
		'y Reason declared: "{{visitReasonLabel}}"',
		'y Through the streaked glass, the coastline sharpens. A rusted corrugated roof stands out against the conifers at the point.',
		{
			'Choice': {
				'Watch': {
					'Text': 'Watch the tree line as the ferry banks. (Perception — the point is coming into view, DC 7)',
					'Do': function () {
						const r = roll(this, 'perception', 7);
						this.storage('ferry_roll_line', rollLine(r));
						return r.success ? 'jump ferry_watch_find' : 'jump ferry_watch_miss';
					}
				},
				'Ignore': {
					'Text': 'Look down at your hands.',
					'Do': 'jump ferry_docking'
				}
			}
		}
	],

	'ferry_watch_find': [
		'{{ferry_roll_line}}',
		'y Behind the shuttered cannery, your eye catches a glint in the drizzle: high chain-link, double-wired along the timber line.',
		'y Not cattle fence. Heavier.',
		function () {
			clue(this, 'saw_the_fence');
			return 'jump test_gate_scene';
		}
	],

	'ferry_watch_miss': [
		'{{ferry_roll_line}}',
		'y Sea spray coats the pane. The coastline is nothing but charcoal rock and cedar trees.',
		function () {
			return 'jump test_gate_scene';
		}
	],

	// Test gate check to verify Conviction reroll and Heat accumulation per M1 criteria
	'test_gate_scene': [
		'y The engines throttle down as the ferry eases into the slip. The deckhand struggles with a rusted mooring gate.',
		{
			'Choice': {
				'ForceGate': {
					'Text': 'Help force the rusted hasp. (Grit — rusted through and stiff, DC 11)',
					'Do': function () {
						const r = roll(this, 'grit', 11);
						this.storage('gate_test_roll_line', rollLine(r));
						return r.success ? 'jump test_gate_success' : 'jump test_gate_fail';
					}
				},
				'StepBack': {
					'Text': 'Step back and wait for the crew.',
					'Do': 'jump ferry_docking'
				}
			}
		}
	],

	'test_gate_success': [
		'{{gate_test_roll_line}}',
		'y The iron shrieks and gives way. The deckhand gives you a nod of surprised appreciation.',
		function () {
			trustUp(this, 'toby', 1);
			return 'jump ferry_docking';
		}
	],

	'test_gate_fail': [
		'{{gate_test_roll_line}}',
		'y The rusted pin jams hard, pinching your hand against cold wet steel. Your boot slips with a loud clatter on the wet deck.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Throw your shoulder into it. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump test_gate_reroll';
					}
				},
				'Stop': {
					'Text': 'Let it go.',
					'Do': 'jump ferry_docking'
				}
			}
		}
	],

	'test_gate_reroll': [
		'y You set your boots against the wet deck and heave with stubborn fury.',
		function () {
			const r = rerollWithConviction(this, 'grit', 11);
			this.storage('gate_test_roll_line', rollLine(r));
			return r.success ? 'jump test_gate_success' : 'jump test_gate_fail_final';
		}
	],

	'test_gate_fail_final': [
		'{{gate_test_roll_line}}',
		'y Even with all your weight, the iron won\'t budge. You nurse your bruised knuckles in silence.',
		'jump ferry_docking'
	],

	'ferry_docking': [
		'y The whistle sounds once — hollow, low, swallowed immediately by the water.',
		'y Welcome to Cormorant Bay.',
		'end'
	]
});
