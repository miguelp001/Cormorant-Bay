/**
 * Cormorant Bay — Custom UI Overlays
 * Includes:
 * 1. Landing Card Overlay (Prologue Visitor Registration) per AGENTS.md §6
 * 2. Field Notebook (Clue Journal & Skills Display) per DESIGN.md §5.6, §6.2, §9.1
 */

'use strict';
/* global monogatari, confirmLandingCard, P, hasClue, evidenceAgainst, conviction */

// =============================================================================
// 1. LANDING CARD OVERLAY (Prologue Skill Allocation)
// =============================================================================

let landingCardInitialized = false;

const landingSkills = {
	perception: 1,
	empathy: 1,
	persuasion: 1,
	grit: 1
};

const TOTAL_POINTS_TO_DISTRIBUTE = 4;
const MIN_SKILL = 1;
const MAX_SKILL = 3;

function getDistributedPoints () {
	return (
		(landingSkills.perception - MIN_SKILL) +
		(landingSkills.empathy - MIN_SKILL) +
		(landingSkills.persuasion - MIN_SKILL) +
		(landingSkills.grit - MIN_SKILL)
	);
}

function getRemainingPoints () {
	return TOTAL_POINTS_TO_DISTRIBUTE - getDistributedPoints();
}

function updateLandingCardUI () {
	const remaining = getRemainingPoints();
	const remainingEl = document.getElementById('skills-remaining-count');
	if (remainingEl) {
		remainingEl.textContent = String(remaining);
	}

	const skillKeys = ['perception', 'empathy', 'persuasion', 'grit'];
	for (const key of skillKeys) {
		const valEl = document.getElementById(`val-${key}`);
		if (valEl) {
			valEl.textContent = String(landingSkills[key]);
		}

		const minusBtn = document.querySelector(`.btn-step.btn-minus[data-skill="${key}"]`);
		const plusBtn = document.querySelector(`.btn-step.btn-plus[data-skill="${key}"]`);

		if (minusBtn) {
			minusBtn.disabled = landingSkills[key] <= MIN_SKILL;
		}
		if (plusBtn) {
			plusBtn.disabled = landingSkills[key] >= MAX_SKILL || remaining <= 0;
		}
	}

	const confirmBtn = document.getElementById('landing-card-confirm');
	if (confirmBtn) {
		const reasonSelected = !!document.querySelector('input[name="visitReason"]:checked');
		confirmBtn.disabled = !(remaining === 0 && reasonSelected);
	}
}

function setupLandingCard () {
	if (landingCardInitialized) {
		return;
	}

	const steppers = document.querySelectorAll('.stepper-controls button');
	steppers.forEach((btn) => {
		btn.addEventListener('click', (ev) => {
			ev.preventDefault();
			const skill = btn.getAttribute('data-skill');
			const action = btn.getAttribute('data-action');

			if (!skill || !landingSkills.hasOwnProperty(skill)) {
				return;
			}

			const remaining = getRemainingPoints();

			if (action === 'plus') {
				if (landingSkills[skill] < MAX_SKILL && remaining > 0) {
					landingSkills[skill] += 1;
				}
			} else if (action === 'minus') {
				if (landingSkills[skill] > MIN_SKILL) {
					landingSkills[skill] -= 1;
				}
			}

			updateLandingCardUI();
		});
	});

	const radioButtons = document.querySelectorAll('input[name="visitReason"]');
	radioButtons.forEach((radio) => {
		radio.addEventListener('change', () => {
			updateLandingCardUI();
		});
	});

	const confirmBtn = document.getElementById('landing-card-confirm');
	if (confirmBtn) {
		confirmBtn.addEventListener('click', (ev) => {
			ev.preventDefault();
			if (getRemainingPoints() !== 0) {
				return;
			}

			const checkedRadio = document.querySelector('input[name="visitReason"]:checked');
			const reason = checkedRadio ? checkedRadio.value : 'bury';

			hideLandingCard();

			// Call authoritative helper API to persist values
			confirmLandingCard(monogatari, reason, landingSkills);

			// Advance to ferry_after_form
			monogatari.run('jump ferry_after_form');
		});
	}

	updateLandingCardUI();
	setupJournal();
	landingCardInitialized = true;
}

function showLandingCard () {
	const overlay = document.getElementById('landing-card-overlay');
	if (overlay) {
		overlay.style.display = 'flex';
		updateLandingCardUI();
	}
}

function hideLandingCard () {
	const overlay = document.getElementById('landing-card-overlay');
	if (overlay) {
		overlay.style.display = 'none';
	}
}

// =============================================================================
// 2. FIELD NOTEBOOK (Clue Journal & Dual Readings UI)
// =============================================================================

const CLUE_DETAILS = {
	saw_the_fence: {
		title: 'Chain-Link at the Point',
		found: 'Ferry approach to Cormorant Bay',
		surface: 'An observant detail of industrial security fencing behind the cannery.',
		underneath: 'Heavy eight-foot enclosure with double-wire; built to hold a large, violent creature.'
	},
	county_letter: {
		title: 'County Board of Health Complaint',
		found: 'Eli\'s forced desk drawer',
		surface: 'Eli documenting commercial kennel noise and animal cruelty.',
		underneath: 'Eli was documenting the containment of a human being behind the cannery.'
	},
	the_photograph: {
		title: 'Night Floodlight Photographs',
		found: 'Eli\'s darkroom drying wire',
		surface: 'Telephoto shot of a large mastiff in an industrial run.',
		underneath: 'A creature with elongated forelimbs and human shoulder geometry; not a dog.'
	},
	circled_calendar: {
		title: 'Wall Calendar Moon Markings',
		found: 'Eli\'s locked backyard shed',
		surface: 'Markings tracking dog-fighting schedules or cannery shifts.',
		underneath: 'Six days circled in every single month: the exact cycle of the lunar calendar.'
	},
	vance_nervous: {
		title: 'Vance\'s Locked Desk Drawer',
		found: 'Sheriff\'s Office interview',
		surface: 'The Sheriff is defensive and covering up town negligence.',
		underneath: 'She is not covering for herself; she is holding a heavy door shut to protect a child.'
	},
	vance_admission: {
		title: 'Vance\'s Admission of Animal Warnings',
		found: 'Confrontation with Eli\'s complaint letter',
		surface: 'Vance covering for Merritt Kell\'s private kennel lease.',
		underneath: 'Vance was managing the town\'s containment protocol.'
	},
	gate_open: {
		title: 'Tampered Cannery Gate Latch',
		found: 'Point cannery exterior run',
		surface: 'Neglected, decaying security on commercial property.',
		underneath: 'The gate was unhooked and swung wide from the outside; deliberate sabotage.'
	},
	truck_at_point: {
		title: 'Midnight Flatbed Sighting',
		found: 'Toby\'s testimony at the fish docks',
		surface: 'Doyle Price hauling timber or scrap at odd hours.',
		underneath: 'Price drove out to the cannery run at midnight specifically to unhook the gate.'
	},
	price_boots: {
		title: 'Mud-Caked Work Boots',
		found: 'Doyle Price\'s truck tailgate',
		surface: 'Price was present at the murder scene in Eli\'s yard.',
		underneath: 'The clay came from the cannery drainage ditch; he opened the gate, but never touched Eli.'
	},
	kell_threat: {
		title: 'Kell\'s Warning on Property Rights',
		found: 'Cannery company office meeting',
		surface: 'Kell is a dangerous predatory landlord willing to kill.',
		underneath: 'Kell is relieved to be blamed for property disputes because it keeps eyes off the run.'
	},
	confession_heard: {
		title: 'Sealed Confession Audio Cassette',
		found: 'Vance\'s desk drawer / Church vigil',
		surface: 'Creel hiding criminal misconduct under the seal of the confessional.',
		underneath: 'Creel has been monthly absolving Toby Rook, who remembers only salt and blood.'
	},
	creel_story: {
		title: 'Creel\'s Full Revelation',
		found: 'Saint Jude in the Pines church confrontation',
		surface: 'Creel was complicit in a corrupt conspiracy to protect donors.',
		underneath: 'The entire town was acting out of profound, tragic tenderness to keep an orphaned boy alive.'
	},
	saw_the_wolf: {
		title: 'The Beast Under the Moon',
		found: 'Point cannery wire / Thursday night motel survival',
		surface: 'A terrifying encounter with an apex predator.',
		underneath: 'The amber eyes in the wolf\'s skull were undeniably the eyes of Toby Rook.'
	}
};

const SUSPECT_DETAILS = [
	{
		id: 'toby',
		name: 'Toby Rook',
		role: 'Age 19 • Works the fish docks • Scraped knuckles',
		clues: [
			{ id: 'the_photograph', label: 'Night Floodlight Photo' },
			{ id: 'circled_calendar', label: 'Moon Calendar' },
			{ id: 'creel_story', label: 'Creel\'s Story' }
		]
	},
	{
		id: 'price',
		name: 'Doyle Price',
		role: 'Truck mechanic • Belligerent • Owns green flatbed',
		clues: [
			{ id: 'truck_at_point', label: 'Truck at Point' },
			{ id: 'price_boots', label: 'Muddy Work Boots' },
			{ id: 'gate_open', label: 'Gate Latch Opened' }
		]
	},
	{
		id: 'kell',
		name: 'Merritt Kell',
		role: 'Owns the cannery, rental properties, and town leases',
		clues: [
			{ id: 'county_letter', label: 'Board of Health Letter' },
			{ id: 'gate_open', label: 'Gate Latch Opened' },
			{ id: 'kell_threat', label: 'Recorded Threat' }
		]
	},
	{
		id: 'creel',
		name: 'Pastor Abel Creel',
		role: 'Saint Jude in the Pines • 40 years hearing confessions',
		clues: [
			{ id: 'creel_story', label: 'Creel\'s Story' },
			{ id: 'vance_admission', label: 'Vance\'s Admission' },
			{ id: 'confession_heard', label: 'Sealed Confession Log' }
		]
	}
];

function getHeatDescription (heatVal) {
	if (heatVal >= 5) {
		return 'Immediate Danger — The town has closed ranks; the beast is unleashed.';
	}
	if (heatVal >= 4) {
		return 'Targeted — Doors are locked; motel room searched; quiet hostility.';
	}
	if (heatVal >= 2) {
		return 'Noticed — The Sheriff and Nora are watching your movements closely.';
	}
	return 'Normal — You are a grieving daughter in a quiet town.';
}

function renderJournal () {
	const engine = typeof monogatari !== 'undefined' ? monogatari : null;
	const player = (typeof P === 'function') ? P(engine) : {};
	const clues = Array.isArray(player.clues) ? player.clues : [];

	// Update clue count badge
	const countEl = document.getElementById('journal-clue-count');
	if (countEl) {
		countEl.textContent = String(clues.length);
	}

	// 1. Render Field Notes / Clues Tab
	const cluesListEl = document.getElementById('journal-clues-list');
	if (cluesListEl) {
		if (clues.length === 0) {
			cluesListEl.innerHTML = '<div class="clue-empty-state">No notes recorded yet. Walk the town and investigate.</div>';
		} else {
			let html = '';
			for (const clueId of clues) {
				const info = CLUE_DETAILS[clueId] || {
					title: clueId,
					found: 'Unknown',
					surface: 'Information obtained during investigation.',
					underneath: 'A deeper pattern connects this to the town.'
				};

				html += `
					<div class="clue-entry-card">
						<div class="clue-header">
							<span class="clue-title">${info.title}</span>
							<span class="clue-origin">${info.found}</span>
						</div>
						<div class="clue-readings">
							<div class="reading-surface">
								<span class="reading-surface-label">Apparent:</span>
								${info.surface}
							</div>
							<div class="reading-underneath">
								<span class="reading-underneath-label">The Reading Underneath:</span>
								${info.underneath}
							</div>
						</div>
					</div>
				`;
			}
			cluesListEl.innerHTML = html;
		}
	}

	// 2. Render Suspects Tab
	const suspectsListEl = document.getElementById('journal-suspects-list');
	if (suspectsListEl) {
		let html = '';
		for (const s of SUSPECT_DETAILS) {
			const tier = (typeof evidenceAgainst === 'function') ? evidenceAgainst(engine, s.id) : 1;
			let tierLabel = 'Thin';
			let tierClass = 'tier-thin';
			if (tier === 3) {
				tierLabel = 'Full Evidence';
				tierClass = 'tier-full';
			} else if (tier === 2) {
				tierLabel = 'Partial Case';
				tierClass = 'tier-partial';
			}

			let checklistHtml = '';
			for (const c of s.clues) {
				const isFound = (typeof hasClue === 'function') ? hasClue(engine, c.id) : clues.includes(c.id);
				const mark = isFound ? '&#9745;' : '&#9744;';
				const statusClass = isFound ? 'found' : 'missing';
				checklistHtml += `<div class="clue-check-item ${statusClass}">${mark} ${c.label}</div>`;
			}

			html += `
				<div class="suspect-case-card">
					<div class="suspect-header">
						<div>
							<span class="suspect-title">${s.name}</span>
							<span class="suspect-role">${s.role}</span>
						</div>
						<span class="tier-badge ${tierClass}">${tierLabel}</span>
					</div>
					<div class="suspect-clues-checklist">
						${checklistHtml}
					</div>
				</div>
			`;
		}
		suspectsListEl.innerHTML = html;
	}

	// 3. Render Dossier Tab
	const reasonEl = document.getElementById('dossier-visit-reason');
	if (reasonEl) {
		const label = (engine && typeof engine.storage === 'function') ? engine.storage('visitReasonLabel') : '';
		reasonEl.textContent = label || 'Burying my father.';
	}

	const heatEl = document.getElementById('dossier-heat-status');
	if (heatEl) {
		const heatVal = typeof player.heat === 'number' ? player.heat : 0;
		heatEl.textContent = getHeatDescription(heatVal);
	}

	const skills = player.skills || { perception: 1, empathy: 1, persuasion: 1, grit: 1 };
	for (const sk of ['perception', 'empathy', 'persuasion', 'grit']) {
		const el = document.getElementById(`dossier-val-${sk}`);
		if (el) {
			el.textContent = String(skills[sk] || 1);
		}
	}

	const pipsEl = document.getElementById('dossier-conviction-pips');
	if (pipsEl) {
		const conv = (typeof conviction === 'function') ? conviction(engine) : (typeof player.conviction === 'number' ? player.conviction : 2);
		let pipsHtml = '';
		for (let i = 1; i <= 2; i++) {
			if (i <= conv) {
				pipsHtml += `<div class="conviction-pip active">Charge ${i} (Available)</div>`;
			} else {
				pipsHtml += `<div class="conviction-pip spent">Charge ${i} (Spent)</div>`;
			}
		}
		pipsEl.innerHTML = pipsHtml;
	}
}

function openJournal () {
	const overlay = document.getElementById('journal-overlay');
	if (overlay) {
		renderJournal();
		overlay.style.display = 'flex';
	}
}

function closeJournal () {
	const overlay = document.getElementById('journal-overlay');
	if (overlay) {
		overlay.style.display = 'none';
	}
}

function toggleJournal () {
	const overlay = document.getElementById('journal-overlay');
	if (overlay) {
		if (overlay.style.display === 'flex') {
			closeJournal();
		} else {
			openJournal();
		}
	}
}

function setupJournal () {
	const toggleBtn = document.getElementById('btn-open-journal');
	if (toggleBtn) {
		toggleBtn.addEventListener('click', (ev) => {
			ev.preventDefault();
			openJournal();
		});
	}

	const closeBtn = document.getElementById('btn-close-journal');
	if (closeBtn) {
		closeBtn.addEventListener('click', (ev) => {
			ev.preventDefault();
			closeJournal();
		});
	}

	// Tab switching
	const tabBtns = document.querySelectorAll('.journal-tabs .tab-btn');
	tabBtns.forEach((btn) => {
		btn.addEventListener('click', (ev) => {
			ev.preventDefault();
			tabBtns.forEach((b) => b.classList.remove('active'));
			btn.classList.add('active');

			const tab = btn.getAttribute('data-tab');
			const panes = document.querySelectorAll('.journal-tab-pane');
			panes.forEach((pane) => {
				pane.classList.remove('active');
			});

			const activePane = document.getElementById(`tab-${tab}`);
			if (activePane) {
				activePane.classList.add('active');
			}
		});
	});

	// Close on click outside modal
	const overlay = document.getElementById('journal-overlay');
	if (overlay) {
		overlay.addEventListener('click', (ev) => {
			if (ev.target === overlay) {
				closeJournal();
			}
		});
	}

	// Keyboard shortcut: 'J' or 'N' toggles journal; Escape closes
	window.addEventListener('keydown', (ev) => {
		if (ev.key === 'Escape') {
			closeJournal();
		} else if ((ev.key === 'j' || ev.key === 'J' || ev.key === 'n' || ev.key === 'N') && !['INPUT', 'TEXTAREA'].includes(ev.target.tagName)) {
			toggleJournal();
		}
	});
}

// Global exports
window.setupLandingCard = setupLandingCard;
window.showLandingCard = showLandingCard;
window.hideLandingCard = hideLandingCard;
window.openJournal = openJournal;
window.closeJournal = closeJournal;
window.toggleJournal = toggleJournal;
window.renderJournal = renderJournal;
window.CLUE_DETAILS = CLUE_DETAILS;
window.SUSPECT_DETAILS = SUSPECT_DETAILS;
