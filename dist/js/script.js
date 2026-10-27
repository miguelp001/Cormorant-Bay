/**
 * Cormorant Bay — script.js
 * Mechanics Helpers and Narrative Script
 * Milestone 2: The Ferry Prologue, Docks Arrival, Nora's Diner, Eli's House, Sheriff's Office, Motel Act Break.
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
// Monogatari Narrative Script: Milestone 2
// =============================================================================

monogatari.script({
	// -------------------------------------------------------------------------
	// 1. THE FERRY PROLOGUE (Day 1 Morning)
	// -------------------------------------------------------------------------
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

	// -------------------------------------------------------------------------
	// 2. THE DOCKS ARRIVAL (Day 1 Morning)
	// -------------------------------------------------------------------------
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

	// -------------------------------------------------------------------------
	// 3. NORA\'S DINER (Day 1 Midday)
	// -------------------------------------------------------------------------
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

	// -------------------------------------------------------------------------
	// 4. ELI\'S HOUSE INVESTIGATION (Day 1 Afternoon)
	// -------------------------------------------------------------------------
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

	// --- Node 1: The Desk ---
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

	// --- Node 2: The Darkroom ---
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

	// --- Node 3: The Shed (Gate Check DC 11) ---
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

	// -------------------------------------------------------------------------
	// 5. THE SHERIFF\'S OFFICE (Day 1 Late Afternoon)
	// -------------------------------------------------------------------------
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

	// -------------------------------------------------------------------------
	// 6. THE MOTEL ACT BREAK (Day 1 Night)
	// -------------------------------------------------------------------------
	'motel_night': [
		'y Room 4 of the Cormorant Motel smells of damp carpet and cedar smoke.',
		'y The walls are thin enough that you can hear the rain running in the copper gutters outside and the steady murmur of the television in the manager\'s office.',
		'y You drop your coat on the armchair and unpack your notebook on the laminate table under the brass lamp.',
		'y On the white visitor registration slip, your reason for coming is recorded: "{{visitReasonLabel}}"',
		'y You look up into the spotted mirror above the dresser.',
		'y The reflection looking back is tired, pale, and carrying six years of silence that you never got to break with your father.',
		'y But the town is awake around you. In the dark beyond the window, rain blankets the sound, and the point sits out on the water like a closed fist.',
		'y Day One is over.',
		'end'
	]
});
