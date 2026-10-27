/**
 * Cormorant Bay — Landing Card Overlay (Prologue Visitor Registration)
 * The only custom UI code in the project per AGENTS.md §6.
 */

'use strict';
/* global monogatari, confirmLandingCard */

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

// Global exports
window.setupLandingCard = setupLandingCard;
window.showLandingCard = showLandingCard;
window.hideLandingCard = hideLandingCard;
