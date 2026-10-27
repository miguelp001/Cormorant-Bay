/**
 * Cormorant Bay — script.js
 * Mechanics Helpers and Narrative Script
 * Milestones 1, 2, 3 & 4: Prologue through Act Three (Days 1–5).
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
// Monogatari Narrative Script: Milestones 1–4
// =============================================================================

monogatari.script({
	// =========================================================================
	// 1. THE FERRY PROLOGUE (Day 1 Morning)
	// =========================================================================
	'Start': [
		'y Rain drums a steady, deadened rhythm against the salt-crusted glass of the passenger salon.',
		'y Below the floorboards, two diesel engines churn through the cold chop of the sound. Outside, the water is the color of wet slate.',
		'y Six years since you last took this crossing. You left with two bags and an acceptance letter to a city paper; your father stood on the dock until the wake washed over his boots, refusing to wave.',
		'y Now Elias Taylor is dead. Found three weeks before his sixty-eighth birthday in the hemlock thicket behind his property.',
		'ferryman "Form\'s in the envelope, miss."',
		'y The deckhand doesn\'t look at your eyes. He drops a white card onto the vinyl table between your coffee and your notebook.',
		'ferryman "Town port authority requires the register filled before we tie up. Everyone files one."',
		function () {
			showLandingCard();
			return false; // Pause engine until landing card is completed
		}
	],

	'ferry_after_form': [
		'y You fold the white slip and slide it into the sleeve of your notebook.',
		'y Reason declared: "{{visitReasonLabel}}"',
		'y Through the streaked glass, the coastline of Cormorant Bay begins to resolve. Black rock, dark fir, and the low silhouette of the town clinging to the slope.',
		'y Out past the breakwater, the weathered corrugated roof of the old cannery juts into the fog at the point.',
		{
			'Choice': {
				'Watch': {
					'Text': 'Watch the tree line as the ferry banks around the point. (Perception — the shore is clearing, DC 7)',
					'Do': function () {
						const r = roll(this, 'perception', 7);
						this.storage('ferry_roll_line', rollLine(r));
						return r.success ? 'jump ferry_watch_find' : 'jump ferry_watch_miss';
					}
				},
				'Ignore': {
					'Text': 'Keep your eyes down on the notebook.',
					'Do': 'jump arrival_dock'
				}
			}
		}
	],

	'ferry_watch_find': [
		'{{ferry_roll_line}}',
		'y Through a gap in the hemlocks behind the cannery, your eye catches a glint of metal in the drizzle.',
		'y Heavy chain-link, eight feet high, topped with double-strand wire. It encloses a long run stretching back from the cannery into the timber.',
		'y Not cattle fencing. Whatever is kept in there has weight, and teeth.',
		function () {
			clue(this, 'saw_the_fence');
			return 'jump arrival_dock';
		}
	],

	'ferry_watch_miss': [
		'{{ferry_roll_line}}',
		'y The diesel fumes wash back into the cabin as the boat turns. Sea spray blankets the pane, reducing the point to a blur of grey rock.',
		'jump arrival_dock'
	],

	// =========================================================================
	// 2. THE DOCKS ARRIVAL (Day 1 Morning)
	// =========================================================================
	'arrival_dock': [
		'y The ferry thuds against the creosote pilings with a shudder that rattles your teeth.',
		'y Out on the wet boards of the dock, a young man catches the bow line. He can\'t be more than nineteen, wearing an oversized woolen sweater soaked dark at the shoulders.',
		'y Toby Rook. You remember him at six years old, sitting on your father\'s porch step on August afternoons, swinging his legs and drinking lemonade from a jelly jar.',
		'y He secures the hawser around the iron cleat. When he straightens, his knuckles are scraped red and his hands tremble visibly.',
		{
			'Choice': {
				'Notice': {
					'Text': 'Notice his demeanor and speak gently. (Perception — his hands are shaking on the cleat, DC 7)',
					'Do': function () {
						const r = roll(this, 'perception', 7);
						this.storage('arrival_roll_line', rollLine(r));
						return r.success ? 'jump arrival_toby_clean' : 'jump arrival_toby_stumble';
					}
				},
				'Pass': {
					'Text': 'Nod quietly and step past him toward the road.',
					'Do': 'jump arrival_walk'
				}
			}
		}
	],

	'arrival_toby_clean': [
		'{{arrival_roll_line}}',
		'y You step off the gangway and keep your voice low.',
		'y "Toby. It\'s Alana."',
		'toby "Alana... Miss Taylor."',
		'y He flinches slightly, then lets out a long, ragged breath. He pulls his sweater sleeves down over his scraped wrists, but his shoulders drop an inch.',
		'toby "I was sorry to hear about your dad. Truly. He... he used to fix my bike chain when I was little. Nobody else in town had the patience."',
		'y His voice is quiet, stripped of defense.',
		function () {
			trustUp(this, 'toby', 1);
			return 'jump arrival_walk';
		}
	],

	'arrival_toby_stumble': [
		'{{arrival_roll_line}}',
		'y You step up abruptly: "Toby. Why is the dock crew shaking like it\'s winter?"',
		'y The boy stiffens as if struck. He pulls his sleeves down fast over his wrists and retreats two steps toward the bollards.',
		'toby "Rope\'s cold, ma\'am. That\'s all. Welcome back to the Bay."',
		'y He turns his back and starts coiling the stern line with hurried, clumsy motions.',
		function () {
			trustUp(this, 'toby', -1);
			return 'jump arrival_walk';
		}
	],

	'arrival_walk': [
		'y Rain slicks the wooden planks of Commercial Street. Half the storefronts are shuttered: marine supply, tackle shop, an empty bait dock.',
		'y At the bend where the street climbs toward the timber ridge, steam fogs the wide front windows of Nora\'s Diner.',
		'jump nora_diner'
	],

	// =========================================================================
	// 3. NORA\'S DINER (Day 1 Midday)
	// =========================================================================
	'nora_diner': [
		'y The bell above the diner door gives a dull tin chime. The interior smells of bacon grease, bleach, and decades of woodstove ash.',
		'y Behind the counter, a woman with grey-streaked copper hair stops wiping a laminate tabletop. Nora Vane. Your mother\'s closest friend.',
		'nora "Alana."',
		'y She sets down her rag and walks around the counter, wiping her hands on her apron. Her hug is brief, fierce, and smelling of lavender soap.',
		function () {
			const reason = P(this).visitReason;
			if (reason === 'bury' || reason === 'both') {
				return 'jump nora_flavor_bury';
			}
			return 'jump nora_flavor_write';
		}
	],

	'nora_flavor_bury': [
		'nora "You came to bury him. That\'s more than most would do after how he talked these last years."',
		'y Her eyes are shadowed, lines creased deep around her mouth.',
		'jump nora_conversation'
	],

	'nora_flavor_write': [
		'nora "Word got from the ferry before you even walked in. Writing about the town, are you? I\'d be careful what rocks you turn over, Alana."',
		'y Her tone is sharp, but the worry beneath it is familial.',
		'jump nora_conversation'
	],

	'nora_conversation': [
		'nora "He died in the woods behind his property, Alana. Ruth Vance says it was dogs, or coyotes. Animals from the ridge."',
		'y She slides a heavy mug of black coffee across the counter. Her knuckles are swollen with arthritis, but her fingers are steady.',
		{
			'Choice': {
				'Empathy': {
					'Text': 'Listen to what she leaves unsaid about Eli\'s final weeks. (Empathy — she\'s grieving and guarded, DC 7)',
					'Do': function () {
						const r = roll(this, 'empathy', 7);
						this.storage('nora_roll_line', rollLine(r));
						return r.success ? 'jump nora_empathy_pass' : 'jump nora_empathy_fail';
					}
				},
				'Direct': {
					'Text': '"Just give me the key to his house, Nora."',
					'Do': 'jump nora_hand_key'
				}
			}
		}
	],

	'nora_empathy_pass': [
		'{{nora_roll_line}}',
		'y You don\'t interrogate her. You wrap both hands around the mug and say quietly: "He was terrified at the end, wasn\'t he?"',
		'y Nora\'s mouth trembles. She looks toward the rain-streaked window facing the street.',
		'nora "He stopped sleeping when the moon was full, Alana. He\'d sit up in that dark house with his camera on the sill, listening. He thought Merritt Kell was running things out on the point that didn\'t belong in this county."',
		'nora "Take the key. Don\'t stay up there after sundown."',
		function () {
			trustUp(this, 'nora', 1);
			return 'jump nora_leave';
		}
	],

	'nora_empathy_fail': [
		'{{nora_roll_line}}',
		'y "Why did Vance\'s report take four days, Nora? Who was she talking to?"',
		'y Nora\'s face hardens. She steps back behind the counter and slides a brass key across the surface with an icy click.',
		'nora "Ruth Vance has kept this town breathing for thirty years while you were off writing features in the city. If you want to question the sheriff, walk down to her office and do it yourself."',
		function () {
			trustUp(this, 'nora', -1);
			return 'jump nora_leave';
		}
	],

	'nora_hand_key': [
		'y Nora looks at you for a long second, then pulls a brass key on a twine loop from her apron pocket.',
		'nora "Top of the hill. Windows are taped. Don\'t expect it to look like home."',
		'jump nora_leave'
	],

	'nora_leave': [
		'y You take the key. Outside, the rain turns heavy, beating hard against the asphalt as you begin the climb toward Eli\'s ridge.',
		'jump house_arrival'
	],

	// =========================================================================
	// 4. ELI\'S HOUSE INVESTIGATION (Day 1 Afternoon)
	// =========================================================================
	'house_arrival': [
		'y Eli\'s house sits at the end of an unpaved lane choked with blackberry briars.',
		'y The cedar shake is black with water. Brown industrial packing tape covers every pane of glass on the ground floor, cross-hatched in tight grids.',
		'y The brass key turns with a dry, grinding scrape. The door opens into chill, damp air that smells of wet paper, darkroom vinegar, and unwashed wool.',
		'y In the study: his oak roll-top desk.',
		'y Down the narrow hall: the sealed door of his makeshift darkroom.',
		'y Out the rear window: the rusted corrugated shed beside the hemlocks.',
		'jump house_hub'
	],

	'house_hub': [
		{
			'Choice': {
				'Desk': {
					'Text': 'Search Eli\'s desk in the study. (Perception — look for what was overlooked, DC 9)',
					'Condition': function () {
						return !this.storage('desk_done');
					},
					'Do': function () {
						const r = roll(this, 'perception', 9);
						this.storage('desk_roll_line', rollLine(r));
						this.storage('desk_done', true);
						return r.success ? 'jump desk_find' : 'jump desk_fail';
					}
				},
				'Darkroom': {
					'Text': 'Inspect the darkroom down the hall. (Perception — red safelight and drying trays, DC 9)',
					'Condition': function () {
						return !this.storage('dark_done');
					},
					'Do': function () {
						const r = roll(this, 'perception', 9);
						this.storage('dark_roll_line', rollLine(r));
						this.storage('dark_done', true);
						return r.success ? 'jump dark_find' : 'jump dark_fail';
					}
				},
				'Shed': {
					'Text': 'Force the rusted padlock on the shed out back. (Grit — corroded through, DC 11)',
					'Condition': function () {
						return !this.storage('shed_done');
					},
					'Do': function () {
						const r = roll(this, 'grit', 11);
						this.storage('shed_roll_line', rollLine(r));
						return r.success ? 'jump shed_find' : 'jump shed_fail';
					}
				},
				'Leave': {
					'Text': 'Finish here and walk down to Sheriff Vance\'s office.',
					'Do': 'jump sheriff_arrival'
				}
			}
		}
	],

	'desk_find': [
		'{{desk_roll_line}}',
		'y You pry the jammed drawer until it slides on swollen runners. Under a stack of water-damaged power bills lies a carbon copy on yellowed legal stock.',
		'y A formal complaint addressed to the County Board of Health, dated three weeks ago in your father\'s uneven cursive.',
		'y *"...commercial kennel operations behind the Point Cannery maintaining unlicensed vicious stock in violation of county enclosure bylaws..."*',
		'y Across the top, in red grease pencil: *DELIVERED BY HAND.*',
		function () {
			clue(this, 'county_letter');
			return 'jump house_after_node';
		}
	],

	'desk_fail': [
		'{{desk_roll_line}}',
		'y The swollen wood fights you. You wrench the drawer hard; the front panel cracks with a sharp, violent snap that echoes through the empty house.',
		'y A neighbor\'s dog down the lane begins to bark — a hoarse, persistent alarm.',
		'y You find only tax assessments from four years ago and unpaid fuel invoices. You leave visible gouges in the oak.',
		function () {
			heat(this, 1);
			return 'jump house_after_node';
		}
	],

	'dark_find': [
		'{{dark_roll_line}}',
		'y The bathroom has been converted into a darkroom: black plastic taped over the vent, pungent smell of fixer and stop bath.',
		'y Clipped to a plastic wire above the bathtub are three glossy 8x10 prints, still curled at the corners.',
		'y Telephoto shots taken through trees under floodlights. High chain-link wire. Inside the run, a low grey shape crouched by the cannery wall.',
		'y The exposure is grainy, shot at high ISO in the dark. It looks like a massive mastiff — except for the elongation of the forelimbs and the angle of the hocks.',
		function () {
			clue(this, 'the_photograph');
			return 'jump house_after_node';
		}
	],

	'dark_fail': [
		'{{dark_roll_line}}',
		'y You fumble in the dark, your elbow catching a glass bottle of stop bath. It shatters in the tub with an acrid splash of vinegar that burns your eyes.',
		'y The drying prints are overexposed or fogged by light leaks. When you swab them with a rag, the silver emulsion smears into black streaks.',
		'y You cough in the fumes, kicking broken glass into the drain.',
		function () {
			heat(this, 1);
			return 'jump house_after_node';
		}
	],

	'shed_find': [
		'{{shed_roll_line}}',
		'y You plant your boot against the weathered siding, throw your weight into the crowbar, and the corroded iron hasp shears off with a dull thud.',
		'y Inside, hanging from a rafter, is an industrial pair of heavy steel bolt cutters with rubber grips.',
		'y Pinned to the wall above his workbench is a commercial wall calendar. Six days in every month are circled in heavy black marker.',
		'y Not the ferry schedule. The moon.',
		function () {
			this.storage('shed_done', true);
			put(this, { hasCutters: true });
			clue(this, 'circled_calendar');
			return 'jump house_after_node';
		}
	],

	'shed_fail': [
		'{{shed_roll_line}}',
		'y The rusted hasp pinches your fingers against wet iron. The metal screeches loud enough to carry across the gulley, but the padlock refuses to budge.',
		{
			'Choice': {
				'Push': {
					'Text': 'Throw your shoulder into it. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump shed_reroll';
					}
				},
				'Stop': {
					'Text': 'Let it go before you break a hand.',
					'Do': 'jump shed_locked'
				}
			}
		}
	],

	'shed_reroll': [
		'y You brace your feet in the mud, grit your teeth against the ache in your palms, and wrench the iron with furious stubbornness.',
		function () {
			const r = rerollWithConviction(this, 'grit', 11);
			this.storage('shed_roll_line', rollLine(r));
			return r.success ? 'jump shed_find' : 'jump shed_locked';
		}
	],

	'shed_locked': [
		'{{shed_roll_line}}',
		'y The rusted iron will not yield. Down the hill, an old man in a yellow oilskin stands at the edge of his driveway, watching your father\'s yard.',
		'y You nurse your bruised fingers in the cold rain and step back from the door.',
		function () {
			this.storage('shed_done', true);
			heat(this, 1);
			return 'jump house_after_node';
		}
	],

	'house_after_node': [
		function () {
			const dDone = this.storage('desk_done');
			const kDone = this.storage('dark_done');
			const sDone = this.storage('shed_done');
			if (dDone && kDone && sDone) {
				return 'jump house_all_searched';
			}
			return 'jump house_hub';
		}
	],

	'house_all_searched': [
		'y You have searched the study, the darkroom, and the yard. The house feels hollow, cold, and watched.',
		'y It is time to see Sheriff Vance.',
		'jump sheriff_arrival'
	],

	// =========================================================================
	// 5. THE SHERIFF\'S OFFICE (Day 1 Late Afternoon)
	// =========================================================================
	'sheriff_arrival': [
		'y The Sheriff\'s Office occupies a concrete annex beside the municipal fire hall.',
		'y Fluorescent lights hum with an insect drone. Sheriff Ruth Vance sits behind a metal desk stacked with county circulars and state patrol logs.',
		'y Thirty-one years on the job. Her uniform is pressed, her holster worn at the seam, her eyes grey and profoundly tired.',
		function () {
			const reason = P(this).visitReason;
			if (reason === 'write' || reason === 'both') {
				return 'jump sheriff_flavor_write';
			}
			return 'jump sheriff_flavor_bury';
		}
	],

	'sheriff_flavor_write': [
		'vance "I\'d keep the notebook closed if I were you, Alana. People around here don\'t take kindly to being drafted into copy for city readers."',
		'y She doesn\'t look up from her coffee cup as she speaks.',
		'jump sheriff_interview'
	],

	'sheriff_flavor_bury': [
		'vance "Eli was a difficult man to deal with, Alana, but he was one of ours. The report was filed on Thursday. Nothing more to dig into."',
		'y She sets down her pen and looks at you with weary finality.',
		'jump sheriff_interview'
	],

	'sheriff_interview': [
		'y "The coroner took four days, Ruth. For an animal attack behind a man\'s own home."',
		'vance "County coroner works two precincts and a timber district. He arrived when he arrived."',
		{
			'Choice': {
				'Observe': {
					'Text': 'Watch her reactions as she defends the report. (Perception — she keeps glancing at her drawer, DC 7)',
					'Condition': function () {
						return !this.storage('vance_observed');
					},
					'Do': function () {
						const r = roll(this, 'perception', 7);
						this.storage('vance_percep_roll_line', rollLine(r));
						this.storage('vance_observed', true);
						return r.success ? 'jump vance_percep_pass' : 'jump vance_percep_fail';
					}
				},
				'PressWithLetter': {
					'Text': 'Confront her with Eli\'s county complaint letter. (Persuasion — backed by paper proof, DC 9 +2 bonus)',
					'Condition': function () {
						return hasClue(this, 'county_letter') && !this.storage('vance_pressed');
					},
					'Do': function () {
						const r = roll(this, 'persuasion', 9, 2);
						this.storage('vance_persuade_roll_line', rollLine(r));
						this.storage('vance_pressed', true);
						return r.success ? 'jump vance_persuade_pass' : 'jump vance_persuade_fail';
					}
				},
				'PressPlain': {
					'Text': 'Demand to see the unedited incident report. (Persuasion — demanding access, DC 11)',
					'Condition': function () {
						return !hasClue(this, 'county_letter') && !this.storage('vance_pressed');
					},
					'Do': function () {
						const r = roll(this, 'persuasion', 11);
						this.storage('vance_persuade_roll_line', rollLine(r));
						this.storage('vance_pressed', true);
						return r.success ? 'jump vance_persuade_pass' : 'jump vance_persuade_fail';
					}
				},
				'Leave': {
					'Text': 'End the interview and head to the motel.',
					'Do': 'jump motel_night'
				}
			}
		}
	],

	'vance_percep_pass': [
		'{{vance_percep_roll_line}}',
		'y You don\'t blink. You watch her hands.',
		'y She isn\'t fidgeting out of guilt. Her left hand rests on the bottom drawer lock, thumb rubbing the keyhole with unconscious vigilance.',
		'y She isn\'t covering for herself. She\'s holding a heavy door shut.',
		function () {
			clue(this, 'vance_nervous');
			return 'jump sheriff_interview';
		}
	],

	'vance_percep_fail': [
		'{{vance_percep_roll_line}}',
		'y Vance catches you staring at her desk. Her jaw tightens into a hard line.',
		'vance "You looking for something in particular, Alana, or just practicing that magazine glare?"',
		'y The air in the office cools instantly.',
		function () {
			heat(this, 1);
			return 'jump sheriff_interview';
		}
	],

	'vance_persuade_pass': [
		'{{vance_persuade_roll_line}}',
		'y Vance looks at the carbon copy, then rubs the bridge of her nose. When she speaks, her voice is stripped of official tone.',
		'vance "Eli wouldn\'t leave it alone. I told him three times: stay off the point. Merritt Kell has deed rights to the old cannery lot and whatever dogs he keeps out there are on private parcel."',
		'vance "Your father thought he was going to expose something. All he did was walk into the dark when he was told to stay in bed."',
		function () {
			clue(this, 'vance_admission');
			return 'jump vance_closes_quiet';
		}
	],

	'vance_persuade_fail': [
		'{{vance_persuade_roll_line}}',
		'y Vance stands up. She isn\'t shouting, which makes it worse.',
		'vance "That\'s enough. You\'ve been back in this town six hours and already you\'re kicking at the drywall."',
		{
			'Choice': {
				'Push': {
					'Text': 'Push back. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump vance_reroll';
					}
				},
				'BackDown': {
					'Text': 'Back down before she takes your notebook.',
					'Do': 'jump vance_closes_harsh'
				}
			}
		}
	],

	'vance_reroll': [
		'y You stand your ground, meeting her cold grey eyes: "My father died fifty yards from his back door, Ruth. I am not leaving until you answer me."',
		function () {
			const r = rerollWithConviction(this, 'grit', 11);
			this.storage('vance_persuade_roll_line', rollLine(r));
			return r.success ? 'jump vance_persuade_pass' : 'jump vance_closes_harsh';
		}
	],

	'vance_closes_quiet': [
		'vance "Now go find a bed. Ray\'s got a room at the motel on the bluff. Lock your door. We don\'t leave porch lights on after nine."',
		'jump motel_night'
	],

	'vance_closes_harsh': [
		'{{vance_persuade_roll_line}}',
		'vance "I said get out. Go check into the motel and stay off the road tonight. If I catch you wandering around the point after dark, you\'ll spend the week in my holding cell."',
		function () {
			heat(this, 1);
			return 'jump motel_night';
		}
	],

	// =========================================================================
	// 6. THE MOTEL & DAY 1 NIGHT (Milestone 3 Opening)
	// =========================================================================
	'motel_night': [
		'y Room 4 of the Cormorant Motel smells of damp carpet and cedar smoke.',
		'y The walls are thin enough that you can hear the rain running in the copper gutters outside.',
		'y On the white visitor registration slip, your reason for coming is recorded: "{{visitReasonLabel}}"',
		'y You look out through the condensation on the window. Far below, through the rain, a lone halogen bulb burns at the end of the commercial dock.',
		'y A silhouette sits alone on the pier in the pouring dark.',
		{
			'Choice': {
				'GoDocks': {
					'Text': 'Walk down to the commercial dock in the dark. (Grit — freezing rain and wind, DC 9)',
					'Do': function () {
						const r = roll(this, 'grit', 9);
						this.storage('toby_night_roll_line', rollLine(r));
						return r.success ? 'jump toby_night_pass' : 'jump toby_night_fail';
					}
				},
				'StayInRoom': {
					'Text': 'Lock the deadbolt and stay inside for the night.',
					'Do': 'jump day2_morning'
				}
			}
		}
	],

	'toby_night_pass': [
		'{{toby_night_roll_line}}',
		'y The wind off the sound is needle-sharp, but you pull your collar tight and walk steady along the wet planks.',
		'y Toby sits on an overturned fish tote, his sodden hood pulled low over his eyes. His sleeves are soaked through, his knees drawn up to his chest.',
		'y You don\'t pull out the notebook. You sit beside him on the wet timber, leaving two feet between your shoulders.',
		'y Five minutes pass in silence, the black water slapping the pilings beneath your boots.',
		'toby "He didn\'t suffer long, Alana."',
		'y His voice is a cracked whisper in the wind.',
		'toby "I swear on my mother\'s grave. It was fast. He... he never even dropped his flashlight."',
		'y He looks at you sideways, terrified you will scream at him. When you remain still, he exhales a shuddering breath.',
		function () {
			trustUp(this, 'toby', 1);
			return 'jump day2_morning';
		}
	],

	'toby_night_fail': [
		'{{toby_night_roll_line}}',
		'y The freezing squall catches your breath. You stumble on a loose cleat, your flashlight beam swinging wild across the harbor.',
		'y Toby bolts upright like a startled animal. Before you can speak, a yellow spotlight snaps on from the harbormaster\'s shack.',
		'y "Who\'s down on the slip at this hour? Clear off the pier!"',
		'y Toby vanishes into the shadow between the bait sheds. You retreat up the hill with rain stinging your eyes.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Circle back through the stacks. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump toby_night_reroll';
					}
				},
				'Stop': {
					'Text': 'Head back to the motel.',
					'Do': 'jump day2_morning'
				}
			}
		}
	],

	'toby_night_reroll': [
		'y You duck beneath the net racks, ignoring the freezing spray, and track his breath in the dark.',
		function () {
			const r = rerollWithConviction(this, 'grit', 9);
			this.storage('toby_night_roll_line', rollLine(r));
			return r.success ? 'jump toby_night_pass' : 'jump toby_night_lost';
		}
	],

	'toby_night_lost': [
		'{{toby_night_roll_line}}',
		'y Toby is already gone. You hear a door slam somewhere in the dark, then only the pounding tide.',
		'jump day2_morning'
	],

	// =========================================================================
	// 7. DAY TWO: CANNERY EXTERIOR & INVESTIGATION
	// =========================================================================
	'day2_morning': [
		'y Tuesday morning breaks the color of dirty pewter.',
		'y The rain hasn\'t stopped; it has merely thinned into a relentless coastal mizzle that hangs in the air like smoke.',
		'y You leave the motel and take the gravel road out along the western spit toward the shuttered cannery on the point.',
		'jump cannery_exterior'
	],

	'cannery_exterior': [
		'y The cannery is a sprawl of rusted corrugated steel and rotted pilings. Gulls scream from the ridge poles.',
		'y Behind the main processing shed stretches the high chain-link enclosure Eli photographed.',
		'y The double gates at the rear are secured with a heavy logging chain.',
		{
			'Choice': {
				'Cutters': {
					'Text': 'Use Eli\'s heavy bolt cutters to inspect the chain link up close.',
					'Condition': function () {
						return P(this).hasCutters;
					},
					'Do': 'jump cannery_cutters_pass'
				},
				'Perception': {
					'Text': 'Examine the gate and latch from the tree line. (Perception — look for recent signs of passage, DC 9)',
					'Do': function () {
						const bonus = hasClue(this, 'saw_the_fence') ? 1 : 0;
						const r = roll(this, 'perception', 9, bonus);
						this.storage('cannery_roll_line', rollLine(r));
						return r.success ? 'jump cannery_find' : 'jump cannery_fail';
					}
				}
			}
		}
	],

	'cannery_cutters_pass': [
		'y You slip the heavy jaws around a link of wire and squeeze. The metal bites deep, giving you clean leverage to reach the gate latch.',
		'y Fresh scrapes score the painted steel. The latch wasn\'t forced open by an animal from within; it was unhooked and swung wide from the outside.',
		'y Tire ruts cut deep into the mud right up to the gate post.',
		function () {
			clue(this, 'gate_open');
			return 'jump day2_docks_toby';
		}
	],

	'cannery_find': [
		'{{cannery_roll_line}}',
		'y You circle the perimeter through the wet salal. At the double gate, you spot what the fog tried to hide.',
		'y The latch is held together with baling twine. Scrape marks on the padlock shackle show it was deliberately unlocked and propped open.',
		'y Heavy tire treads and dragging boot prints are stamped into the mud by the post. The gate was opened from the outside.',
		function () {
			clue(this, 'gate_open');
			return 'jump day2_docks_toby';
		}
	],

	'cannery_fail': [
		'{{cannery_roll_line}}',
		'y You lose your footing on the wet shale. You slide down the embankment into a tangle of rusted wire, tearing your trousers and scraping your shin.',
		'y A truck horn blares twice from the cannery access road. Someone is patrolling the perimeter.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Climb back up and inspect the gate anyway. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump cannery_reroll';
					}
				},
				'Retreat': {
					'Text': 'Scramble back into the trees before the patrol vehicle spots you.',
					'Do': 'jump day2_docks_toby'
				}
			}
		}
	],

	'cannery_reroll': [
		'y You ignore the bleeding scrape, haul yourself up the embankment, and press close to the gate.',
		function () {
			const r = rerollWithConviction(this, 'grit', 11);
			this.storage('cannery_roll_line', rollLine(r));
			return r.success ? 'jump cannery_find' : 'jump day2_docks_toby';
		}
	],

	// =========================================================================
	// 8. DAY TWO: TOBY\'S TESTIMONY & DOYLE PRICE
	// =========================================================================
	'day2_docks_toby': [
		'y Back at the commercial slips, the afternoon tide has brought in two crab boats.',
		'y Toby is stacking crushed ice crates on the dock apron. His hands are still bandaged, but his breath is steadier.',
		{
			'Choice': {
				'Talk': {
					'Text': 'Ask him about vehicles at the point on the night your father died. (Empathy — he remembers, DC 9)',
					'Do': function () {
						const r = roll(this, 'empathy', 9);
						this.storage('toby_day2_roll_line', rollLine(r));
						return r.success ? 'jump toby_testimony_pass' : 'jump toby_testimony_fail';
					}
				},
				'Skip': {
					'Text': 'Leave Toby to his work and look for Doyle Price.',
					'Do': 'jump price_dock_scene'
				}
			}
		}
	],

	'toby_testimony_pass': [
		'{{toby_day2_roll_line}}',
		'y You lean against the ice hopper, keeping your voice casual and warm.',
		'y Toby stops his shovel. He looks around the dock before speaking in a low, tight whisper.',
		'toby "It was midnight, Alana. I was sleeping in the gear locker because my room was freezing."',
		'toby "Doyle Price\'s flatbed drove out toward the point. His muffler has a hole in the baffle — you can hear that rattle from two miles off. He went out, stayed twenty minutes, and came back down the spit fast."',
		function () {
			clue(this, 'truck_at_point');
			trustUp(this, 'toby', 1);
			return 'jump price_dock_scene';
		}
	],

	'toby_testimony_fail': [
		'{{toby_day2_roll_line}}',
		'y You press him too urgently: "You were on watch that night, Toby. Who drove out to the cannery?"',
		'y Toby\'s shoulders hunch. He grips the shovel handle until his scraped knuckles go white.',
		'toby "I shovel ice, Miss Taylor. That\'s all I do. Ask the sheriff if you want a timetable."',
		function () {
			heat(this, 1);
			return 'jump price_dock_scene';
		}
	],

	'price_dock_scene': [
		'y Fifty yards down the pier, an old green Ford flatbed is parked with its hood up. A man in grease-stained coveralls is cursing at an alternator.',
		'y Doyle Price. Fifty-five, thick-necked, smelling of sour beer and two-stroke oil.',
		'y Beside the tailgate sits a pair of heavy rubber work boots caked with grey clay from the point.',
		{
			'Choice': {
				'BootsCheck': {
					'Text': 'Examine the muddy boots while he works on the engine. (Grit — don\'t flinch when he turns, DC 9)',
					'Do': function () {
						const r = roll(this, 'grit', 9);
						this.storage('price_roll_line', rollLine(r));
						return r.success ? 'jump price_boots_pass' : 'jump price_boots_fail';
					}
				},
				'Avoid': {
					'Text': 'Avoid him and head toward the diner for dinner.',
					'Do': 'jump nora_dinner_scene'
				}
			}
		}
	],

	'price_boots_pass': [
		'{{price_roll_line}}',
		'y You walk right up to the tailgate and inspect the boots. Diamond-lug soles, thick grey clay packed deep into the treads.',
		'y Price spins around with a 14-millimeter wrench raised in his fist: "What the hell do you want?"',
		'y You point at the clay: "That mud only comes from the drainage ditch behind the cannery run, Doyle."',
		'price "I never touched your old man! You hear me? Kell told me to open the damn gate to spook him off! I drove out, unhooked the chain, and drove straight back to the tavern!"',
		'y He realizes what he just admitted and slams his hood down with a deafening crash.',
		function () {
			clue(this, 'price_boots');
			return 'jump nora_dinner_scene';
		}
	],

	'price_boots_fail': [
		'{{price_roll_line}}',
		'y Price catches you snooping near his truck before you can see the soles.',
		'price "Get your hands off my rig, city girl!"',
		'y He lunges forward, kicking his greasy boots under the bumper and waving the wrench in your face.',
		'price "You Taylor people think you own this county. Your old man was crazy and you\'re no better. Get off the dock before I call Ruth Vance!"',
		'y Two fishermen on the adjacent trawler turn and watch the altercation with cold hostility.',
		function () {
			heat(this, 2);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Refuse to back down. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump price_reroll';
					}
				},
				'Leave': {
					'Text': 'Walk away before fists are thrown.',
					'Do': 'jump nora_dinner_scene'
				}
			}
		}
	],

	'price_reroll': [
		'y You don\'t blink. You step right into his space: "Kell gave you an order, didn\'t he, Doyle? And you followed it like a dog."',
		function () {
			const r = rerollWithConviction(this, 'persuasion', 11);
			this.storage('price_roll_line', rollLine(r));
			return r.success ? 'jump price_boots_pass' : 'jump nora_dinner_scene';
		}
	],

	// =========================================================================
	// 9. DAY TWO EVENING: DINNER AT THE DINER (Heat Reduction)
	// =========================================================================
	'nora_dinner_scene': [
		'y Evening falls over Cormorant Bay. The neon sign of the diner buzzes red in the fog.',
		'y Inside, the stove is roaring. Nora brings over a steaming bowl of black cod chowder and a thick slice of buttered bread.',
		'nora "Sit down, Alana. You look like you\'ve been walking in the salt all day."',
		{
			'Choice': {
				'Warmth': {
					'Text': 'Sit with Nora and let her talk about your mother. (Empathy — sharing a quiet memory, DC 7)',
					'Do': function () {
						const r = roll(this, 'empathy', 7);
						this.storage('nora_dinner_roll_line', rollLine(r));
						return r.success ? 'jump nora_dinner_pass' : 'jump nora_dinner_fail';
					}
				},
				'EatQuiet': {
					'Text': 'Eat in silence and thank her.',
					'Do': 'jump nora_dinner_quiet'
				}
			}
		}
	],

	'nora_dinner_pass': [
		'{{nora_dinner_roll_line}}',
		'y You sit back and ask her about the garden she and your mother planted behind the parsonage thirty years ago.',
		'y A soft, genuine smile breaks across Nora\'s weathered face. She sits in the booth across from you, resting her hands on the table.',
		'nora "Your mother had a way of forgiving this place, Alana. She knew everyone here had something broken in them."',
		'y For an hour, the town\'s suspicion recedes. Nora refills your coffee and squeezes your hand.',
		function () {
			trustUp(this, 'nora', 1);
			heat(this, -1);
			return 'jump day3_morning';
		}
	],

	'nora_dinner_fail': [
		'{{nora_dinner_roll_line}}',
		'y You try to ask gently, but the strain in your voice makes it sound like an interview. Nora stiffens slightly.',
		'nora "Eat your soup before it goes cold, child."',
		'y She wipes down the counter quietly. Still, sitting in the warm light under the town\'s eyes lowers the tension around you.',
		function () {
			heat(this, -1);
			return 'jump day3_morning';
		}
	],

	'nora_dinner_quiet': [
		'y You eat the hot soup in silence. The warmth seeps into your bones.',
		'y Nora nods approvingly when you clear your bowl. The simple presence of Eli\'s daughter acting like family calms the room.',
		function () {
			heat(this, -1);
			return 'jump day3_morning';
		}
	],

	// =========================================================================
	// 10. DAY THREE: MERRITT KELL CONFRONTATION
	// =========================================================================
	'day3_morning': [
		'y Wednesday morning. The funeral is set for two o\'clock in the churchyard.',
		'y At ten, you walk into the cannery company office at the foot of Commercial Street.',
		'y Merritt Kell is reviewing shipping manifests. Tailored wool jacket, silvering hair, impeccably polished shoes. He looks up with a practiced, radiant smile.',
		'kell "Alana Taylor. Our prodigal journalist. Please, sit down. Nora told me you were in town."',
		{
			'Choice': {
				'ConfrontKell': {
					'Text': 'Call out his charming deflection and confront him about Eli\'s complaints. (Persuasion — cut through his veneer, DC 11)',
					'Do': function () {
						const r = roll(this, 'persuasion', 11);
						this.storage('kell_roll_line', rollLine(r));
						return r.success ? 'jump kell_pass' : 'jump kell_fail';
					}
				},
				'ListenKell': {
					'Text': 'Accept his condolences and leave quietly.',
					'Do': 'jump funeral_scene'
				}
			}
		}
	],

	'kell_pass': [
		'{{kell_roll_line}}',
		'y You lean over his mahogany desk: "My father filed an animal cruelty complaint against your cannery run three weeks ago, Merritt. You sent Doyle Price to open the gate."',
		'y Kell\'s smile vanishes. His eyes go dead and flat, like grey pebbles.',
		'kell "Your father was an old man with a camera trespassing on private property, Alana."',
		'kell "In this county, people who poke their noses into working leases find themselves with broken windows. Or worse. If you have any sense, you\'ll bury him this afternoon and get on Friday\'s boat."',
		function () {
			clue(this, 'kell_threat');
			return 'jump funeral_scene';
		}
	],

	'kell_fail': [
		'{{kell_roll_line}}',
		'y You press him, but Kell parries every word with smooth condescension: "Grief makes people imagine melodrama where there is only unfortunate rural reality."',
		'y He rises and opens the door for you: "Give my regards to Nora, Alana. And do take care walking the bluffs alone."',
		'y His yard foreman watches you walk down the gravel path with undisguised contempt.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Demand an answer before he shuts the door. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump kell_reroll';
					}
				},
				'Leave': {
					'Text': 'Walk down to the graveyard.',
					'Do': 'jump funeral_scene'
				}
			}
		}
	],

	'kell_reroll': [
		'y You wedge your boot in the doorframe, glaring directly into his eyes.',
		function () {
			const r = rerollWithConviction(this, 'grit', 9);
			this.storage('kell_roll_line', rollLine(r));
			return r.success ? 'jump kell_pass' : 'jump funeral_scene';
		}
	],

	// =========================================================================
	// 11. DAY THREE AFTERNOON: THE FUNERAL
	// =========================================================================
	'funeral_scene': [
		'y At two o\'clock, a dozen townsfolk gather on the wet hillside behind Saint Jude in the Pines.',
		'y The raw earth beside your mother\'s headstone is covered in fake green turf. Rain taps hollow against the black umbrellas.',
		'y Pastor Abel Creel stands at the head of the grave. Tall, stooped, wearing vestments frayed at the cuffs. His hands tremble as he holds the open prayer book.',
		'y Nora stands beside you. Across the open trench, Sheriff Vance stands in uniform. Far back, under the wet dripping branches of a cedar, Toby Rook watches in silence.',
		{
			'Choice': {
				'ListenCreel': {
					'Text': 'Listen to Pastor Creel\'s eulogy and read his guarded grief. (Empathy — he knows what was done, DC 9)',
					'Do': function () {
						const r = roll(this, 'empathy', 9);
						this.storage('funeral_roll_line', rollLine(r));
						return r.success ? 'jump funeral_empathy_pass' : 'jump funeral_empathy_fail';
					}
				},
				'StandSilent': {
					'Text': 'Keep your head down until the casket is lowered.',
					'Do': 'jump funeral_finish'
				}
			}
		}
	],

	'funeral_empathy_pass': [
		'{{funeral_roll_line}}',
		'y You don\'t look at the dirt. You watch Creel\'s face as he reads Psalm 23.',
		'y His voice cracks on *"though I walk through the valley of the shadow of death."* His gaze flickers toward Toby at the tree line, filled with profound, agonizing compassion.',
		'y After the mourners disperse, Creel approaches you, his grey eyes glistening.',
		'creel "Alana. Eli was a righteous man who looked for monsters in the dark. God forgive those of us who built a cage and called it mercy."',
		function () {
			trustUp(this, 'creel', 1);
			trustUp(this, 'nora', 1);
			heat(this, -1);
			return 'jump vance_drawer_scene';
		}
	],

	'funeral_empathy_fail': [
		'{{funeral_roll_line}}',
		'y You stare rigidly ahead, refusing to look anyone in the eye. The coldness radiating from you is palpable.',
		'y When the dirt thuds against the pine lid, the townspeople walk past you with averted eyes and hurried nods.',
		function () {
			heat(this, -1);
			return 'jump vance_drawer_scene';
		}
	],

	'funeral_finish': [
		'y The pine box is lowered into the wet loam. You throw a single handful of dark gravel onto the lid.',
		'y Eli Taylor is buried.',
		function () {
			heat(this, -1);
			return 'jump vance_drawer_scene';
		}
	],

	// =========================================================================
	// 12. DAY THREE LATE AFTERNOON: VANCE\'S DRAWER
	// =========================================================================
	'vance_drawer_scene': [
		'y Four in the afternoon. A timber truck has overturned on the causeway highway; the siren atop the fire hall wails, and Vance and her deputy speed out in their cruisers.',
		'y The sheriff\'s office is deserted. The door latch is on the latch; through the glass, the desk sits vacant under the fluorescent hum.',
		'y The locked bottom drawer is right there.',
		{
			'Choice': {
				'SearchDrawer': {
					'Text': 'Break into Vance\'s locked bottom drawer. (Perception — bypass the cylinder lock, DC 11)',
					'Do': function () {
						const r = roll(this, 'perception', 11);
						this.storage('vance_drawer_roll_line', rollLine(r));
						return r.success ? 'jump vance_drawer_success' : 'jump vance_drawer_fail';
					}
				},
				'WalkAway': {
					'Text': 'Walk away before anyone sees you near the municipal hall.',
					'Do': 'jump night_day3'
				}
			}
		}
	],

	'vance_drawer_success': [
		'{{vance_drawer_roll_line}}',
		'y You use a steel hair pin and a pen cap, easing the brass tumblers until the cylinder turns with a soft, clean *click*.',
		'y Inside lies a manila folder marked *CONFIDENTIAL / TOWN SEAL*.',
		'y Inside is an audio cassette labeled: *Creel / Rook — Sealed Confession Log — Monthly.*',
		'y A handwritten memo from Creel to Vance is clipped to the cassette: *"Ruth — The boy came to the rectory again after the change. He remembers nothing of the Taylor yard, only the smell of salt and blood. God will judge him, but the county law will destroy him. Keep the cage shut."*',
		function () {
			clue(this, 'confession_heard');
			return 'jump night_day3';
		}
	],

	'vance_drawer_fail': [
		'{{vance_drawer_roll_line}}',
		'y The pin bends and snaps inside the lock mechanism, jamming the cylinder with a violent scrape.',
		'y Across the street, the postmaster steps out to his truck, squinting through the rain at the sheriff\'s window.',
		'y You slip out the side door into the alley, your heart hammering in your ribs.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Pry it with a flathead screwdriver before leaving. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump vance_drawer_reroll';
					}
				},
				'Flee': {
					'Text': 'Flee into the rain.',
					'Do': 'jump night_day3'
				}
			}
		}
	],

	'vance_drawer_reroll': [
		'y You wrench the metal with stubborn, desperate force.',
		function () {
			const r = rerollWithConviction(this, 'grit', 11);
			this.storage('vance_drawer_roll_line', rollLine(r));
			return r.success ? 'jump vance_drawer_success' : 'jump night_day3';
		}
	],

	// =========================================================================
	// 13. DAY THREE NIGHT: MOTEL (ACT ONE END)
	// =========================================================================
	'night_day3': [
		'y Night falls on Wednesday. The rain has gathered into a black gale off the Pacific, thrashing the motel roof.',
		'y You spread your notebook across the bed in Room 4.',
		'y Eli\'s complaint letter. The photograph of the run. The gate opened from the outside. The muddy boot prints. The sealed confessions.',
		'y Tomorrow is Thursday. The moon clock reaches its zenith tomorrow night.',
		'y The pieces are on the board, and the town knows you are holding them.',
		'y End of Act One.',
		'jump day4_church'
	],

	// =========================================================================
	// 14. ACT TWO (DAY 4): THE CHURCH REVEAL
	// =========================================================================
	'day4_church': [
		'y Thursday morning. Cormorant Bay has pulled into itself like a snail behind an iron shell.',
		'y Heavy storm shutters are battened over the lower windows of every house along the road.',
		'y At Saint Jude in the Pines, the arched oak door stands unlocked. Inside, cold damp air smells of tallow candles and old cedar.',
		'y Pastor Abel Creel kneels alone at the communion rail, his hands clasped over a worn silver crucifix.',
		'y He does not turn around when your boots echo on the floorboards.',
		'creel "I heard your car on the hill, Alana. I have been praying for your departure."',
		{
			'Choice': {
				'ConfrontCreel': {
					'Text': 'Confront him with the full pattern of silence. (Persuasion — he cannot break the seal, but he cannot lie, DC 9)',
					'Do': function () {
						const r = roll(this, 'persuasion', 9);
						this.storage('creel_reveal_roll_line', rollLine(r));
						return r.success ? 'jump day4_creel_clean' : 'jump day4_creel_guarded';
					}
				},
				'DemandDirect': {
					'Text': '"Tell me what killed my father, Abel."',
					'Do': 'jump day4_creel_guarded'
				}
			}
		}
	],

	'day4_creel_clean': [
		'{{creel_reveal_roll_line}}',
		'y You speak without malice, your voice gentle in the cavernous nave: "You built a cage behind the cannery, Abel. Not for beasts. For a boy who thought he was damned."',
		'y Creel bows his head until his forehead touches the polished rail. A slow, shuddering sob escapes him.',
		'creel "He was thirteen, Alana. Bitten on the point during salmon run. He came to this altar drenched in sea water and terrified he was going to hell."',
		'creel "Nora fed him. Ruth buried the records. Kell gave him the run so he could be kept off the streets during the change. We thought... God help us, we thought we were loving him."',
		'creel "Three weeks ago your father started photographing the wire. Kell told Doyle to unhook the latch to scare Eli off. It was a full moon. Toby didn\'t know who was in the yard until he tasted the blood."',
		function () {
			clue(this, 'creel_story');
			trustUp(this, 'creel', 1);
			return 'jump day4_name';
		}
	],

	'day4_creel_guarded': [
		'{{creel_reveal_roll_line}}',
		'y "I have the complaint letter, Abel. I have the boot prints and the photographs. Who is behind the wire?"',
		'y Creel grips his crucifix until his knuckles whiten, but his voice breaks with agonizing sorrow.',
		'creel "I cannot violate the seal of confession, Alana. But look at the calendar in your father\'s shed. Look at the cage Merritt Kell built."',
		'creel "A boy who was thirteen years old and had nobody to protect him. We thought we could tame the dark with silence. And when the gate was opened three weeks ago, that silence killed your father."',
		function () {
			clue(this, 'creel_story');
			heat(this, 1);
			return 'jump day4_name';
		}
	],

	'day4_name': [
		'y The truth hangs in the cold air between you: Toby Rook is the wolf.',
		'y Eli died because Doyle Price opened the gate on Kell\'s orders, and Toby was the beast let loose.',
		'y The coroner\'s report was technically accurate: an animal attack. Everyone in Cormorant Bay is guilty of something real.',
		'creel "Tonight the moon is full again, Alana. Stay in your room. Tomorrow the ferry comes, and you can decide what this town deserves."',
		'jump day5_thursday_start'
	],

	// =========================================================================
	// 15. ACT THREE (DAY 5): THE MOON & THE ATTACK
	// =========================================================================
	'day5_thursday_start': [
		'y Thursday night. The full moon climbs above the jagged ridge, burning silver through ragged tears in the storm clouds.',
		'y Outside, the rain has stopped. The absolute silence across Cormorant Bay is deafening — no cars, no dogs, no voices.',
		function () {
			// Invariant §5.8: Heat >= 5 triggers the attack
			if (P(this).heat >= 5) {
				return 'jump day5_attack';
			}
			return 'jump day5_moon_choice';
		}
	],

	// --- Branch A: Heat 5 Death Attack (Invariant §5.8 & Grit DC 12 Death Check) ---
	'day5_attack': [
		'y In Room 4 of the motel, the lights suddenly flicker and die with a high electrical whine.',
		'y The silence is shattered by the explosive crash of splintering glass in the bathroom.',
		'y A blast of freezing air and wet timber smell fills the dark room. In the hallway doorway, a massive silhouette blocks the light from the moon.',
		'y Broad shoulders, elongated limbs, jaws dripping saliva, yellow eyes blazing with feverish agony.',
		'y The wolf has come for you.',
		{
			'Choice': {
				'Survive': {
					'Text': 'Throw the heavy oak dresser across the door and dive for the steel lamp. (Grit — survival instinct in the pitch dark, DC 12)',
					'Do': function () {
						const r = roll(this, 'grit', 12);
						this.storage('death_roll_line', rollLine(r));
						return r.success ? 'jump day5_attack_survive' : 'jump day5_attack_fail';
					}
				}
			}
		}
	],

	'day5_attack_survive': [
		'{{death_roll_line}}',
		'y You heave with all your weight, slamming the corner of the heavy dresser into the creature\'s chest.',
		'y In the same motion, you swing the heavy steel lamp across its snout with a dull, ringing crack.',
		'y The beast lets out a sickening, half-human yelp of pain. It scrambles backward across the shattered glass and leaps through the window into the cedar thicket.',
		'y You stand in the freezing dark, your hands shaking violently, breathing in the smell of ozone and wet wolf fur.',
		'y You saw it with your own eyes. You survived the beast.',
		function () {
			clue(this, 'saw_the_wolf');
			return 'jump day6_morning';
		}
	],

	'day5_attack_fail': [
		'{{death_roll_line}}',
		'y The beast hits you with the weight of an anvil. Claws shred through your jacket; teeth graze your collarbone in the suffocating dark.',
		{
			'Choice': {
				'Push': {
					'Text': 'Claw for the lamp with dying fury. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump day5_attack_reroll';
					}
				},
				'Surrender': {
					'Text': 'The darkness takes you.',
					'Do': 'jump day5_death'
				}
			}
		}
	],

	'day5_attack_reroll': [
		'y You refuse to die in this room. With your last breath of stubborn life, you gouge your fingers into its muzzle and heave.',
		function () {
			const r = rerollWithConviction(this, 'grit', 12);
			this.storage('death_roll_line', rollLine(r));
			return r.success ? 'jump day5_attack_survive' : 'jump day5_death';
		}
	],

	'day5_death': [
		'{{death_roll_line}}',
		'y The teeth find bone. The salt smell fills your throat.',
		'y The coroner\'s report on Friday morning took two hours to sign.',
		'y *Animal attack. Second fatal occurrence in one week. No further inquiry.*',
		'y You never made it to the ferry.',
		'y Ending 11: The only true loss. The game told you twice.',
		'end'
	],

	// --- Branch B: Heat < 5 Moon Night Options ---
	'day5_moon_choice': [
		'y You stand by the window of Room 4. The full moon hangs like a polished coin above the bay.',
		'y You have three choices for how to spend this night before the ferry arrives tomorrow.',
		{
			'Choice': {
				'Point': {
					'Text': 'Stalk the cannery perimeter wire in the moonlight. (Perception — search the shadows of the run, DC 11)',
					'Do': function () {
						const r = roll(this, 'perception', 11);
						this.storage('point_moon_roll_line', rollLine(r));
						return r.success ? 'jump day5_point_wolf' : 'jump day5_point_blur';
					}
				},
				'Vigil': {
					'Text': 'Join Pastor Creel at Saint Jude in the Pines for the midnight vigil.',
					'Do': 'jump day5_vigil'
				},
				'Stay': {
					'Text': 'Bolt your door, draw the blinds, and wait for morning in your room.',
					'Do': 'jump day5_stay'
				}
			}
		}
	],

	'day5_point_wolf': [
		'{{point_moon_roll_line}}',
		'y You slip through the trees along the western spit. Under the silver flood of the moon, you reach the cannery fence.',
		'y Behind the chain link, an eight-foot shape paces the mud. Grey-black fur, ribcage expanding in deep, ragged breaths.',
		'y It stops. It turns its massive head directly toward you.',
		'y Under the amber reflection of the moonlight, you see the eyes: terrified, pained, and unmistakably Toby Rook.',
		'y It doesn\'t charge. It whines low in its throat and turns back into the hemlocks.',
		function () {
			clue(this, 'saw_the_wolf');
			return 'jump day6_morning';
		}
	],

	'day5_point_blur': [
		'{{point_moon_roll_line}}',
		'y Fog rolls across the spit, blinding your flashlight. You hear heavy panting and the rattle of wire, but see only thrashing shadows.',
		'y A cannery floodlight snaps on; a siren gives two short blasts from the cannery office.',
		'y You flee back into the timber before you are cornered.',
		function () {
			heat(this, 1);
		},
		{
			'Choice': {
				'Push': {
					'Text': 'Circle back to the wire. (Conviction — {{convictionLeft}} remaining)',
					'Condition': function () {
						return conviction(this) > 0;
					},
					'Do': function () {
						spend(this);
						return 'jump day5_point_reroll';
					}
				},
				'Retreat': {
					'Text': 'Retreat to the motel.',
					'Do': 'jump day6_morning'
				}
			}
		}
	],

	'day5_point_reroll': [
		'y You drop to your stomach in the wet moss, crawling toward the fence line.',
		function () {
			const r = rerollWithConviction(this, 'perception', 11);
			this.storage('point_moon_roll_line', rollLine(r));
			return r.success ? 'jump day5_point_wolf' : 'jump day6_morning';
		}
	],

	'day5_vigil': [
		'y You spend the night in Saint Jude in the Pines. Candles flicker on the altar.',
		'y Creel kneels in the center aisle, whispering prayers of absolution into the empty church.',
		'y You sit in the rear pew, keeping watch while the hours tick past. There is no violence here, only shared sorrow.',
		function () {
			trustUp(this, 'creel', 1);
			clue(this, 'confession_heard');
			return 'jump day6_morning';
		}
	],

	'day5_stay': [
		'y You barricade the motel door with a chair and sit beneath the lamp with your coat on.',
		'y Around two in the morning, a long, low howl echoes from the bluffs above the town. It isn\'t a dog.',
		'y You sit in the dark until the dawn begins to grey the window panes.',
		function () {
			heat(this, 1);
			return 'jump day6_morning';
		}
	],

	// =========================================================================
	// 16. ACT FOUR (DAY 6): THE FERRY ARRIVAL & ACCUSATION GATEWAY
	// =========================================================================
	'day6_morning': [
		'y Friday morning. The horn of the ferry echoes across the grey water of Cormorant Bay.',
		'y The crossing boat has arrived to take passengers back to the mainland.',
		'y On the dock apron, the town has gathered: Ruth Vance in uniform, Nora with her apron folded over her arm, Merritt Kell beside his car, Doyle Price smoking by his truck, and Pastor Creel standing beside Toby Rook.',
		'y Everyone is watching you walk down the gangway with your notebook in your hand.',
		'y The moment of accusation has arrived.',
		'end'
	]
});
