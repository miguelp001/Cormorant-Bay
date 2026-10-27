# AGENTS.md

**Project:** Cormorant Bay — a stat-driven mystery visual novel **Engine:** Monogatari v2.8.0 **Target:** Installable Android PWA **Companion doc:** `DESIGN.md` v1.1 **This file version:** 1.1

`DESIGN.md` is the **design** source of truth. This file is the **implementation** source of truth. Where they conflict on matters of code, this file wins. Where they conflict on matters of story or numbers, `DESIGN.md` wins.

---

## 1\. What this project is

A 2–3 hour folk-horror mystery visual novel. The player, **Alana Taylor**, returns to her coastal hometown after her estranged father dies. She has six days to investigate, using four skills allocated on a diegetic landing card, two one-time Conviction rerolls, and a Heat track that escalates the town's suspicion of her.

The narrative is a **quality-gated branching story**: a fixed linear spine (Prologue → Day 6\) with stat-checked branches, flag-gated choices, and a state-evaluated ending matrix. Scene ordering is authored, not emergent. Player state — skills, clue flags, per-character trust, and Heat — gates which branches are available at each authored beat. Failures always advance the story and always produce state.

**This is not a QBN project.** Do not introduce storylet pools, emergent scene selection, action budgets, or a content pool. Ordering is authored. If a task seems to require emergence, it requires a branch instead. See `DESIGN.md` §1.

**Read `DESIGN.md` §5 before writing any narrative content.** The truth, the cast, the dual-reading evidence table, and the moon clock are all specified there. Do not invent plot.

---

## 2\. Repository map

dist/                          \# The deployable app. This is the working root.

├── index.html

├── manifest.json              \# PWA manifest — edit for name/icons/colors

├── service-worker.js          \# Cache manifest — MUST be updated per release

├── js/

│   ├── options.js             \# Game config: title, character defs, engine options

│   ├── main.js                \# preloadGame() — initializes player state

│   ├── landing-card.js        \# The prologue UI overlay — the only custom UI module

│   └── script.js              \# ALL narrative content \+ mechanics helpers

├── engine/core/               \# Monogatari engine — DO NOT EDIT

└── assets/

    ├── images/backgrounds/

    ├── images/characters/

    ├── images/props/

    ├── images/ui/

    ├── audio/music/

    ├── audio/sfx/

    ├── fonts/

    └── icons/                 \# icon-192.png, icon-512.png, icon-maskable.png

**Everything you write lives in four files:** `js/script.js`, `js/main.js`, `js/options.js`, and `js/landing-card.js`. Plus `service-worker.js` when you add assets.

`engine/core/` is vendored upstream code. Never modify it. If you need behavior it doesn't have, extend it from `script.js`.

---

## 3\. Commands

Verify these against `package.json` before relying on them; the Monogatari template has changed its toolchain across versions.

yarn install              \# Install dependencies

yarn build \--dev          \# Dev server with live reload (usually :5173)

yarn build                \# Production build

yarn test                 \# Run any configured tests (may not exist)

**There is no unit test suite.** Verification is manual and is specified in §11. Do not claim a change is tested if you have only read the code.

---

## 4\. State schema

`js/main.js` initializes all persistent state via `preloadGame()`. This is the complete schema — do not add top-level keys without updating this section and `DESIGN.md` §10.3.

this.storage({

    player: {

        skills: { perception: 1, empathy: 1, persuasion: 1, grit: 1 },

        conviction: 2,          // charges remaining

        heat: 0,                // 0–6

        clues: \[\],              // array of clue ID strings

        hasCutters: false,      // item flag

        visitReason: '',        // 'bury' \| 'write' \| 'both' — flavor only

        trust: { nora: 0, vance: 0, toby: 0, creel: 0, price: 0, kell: 0 }

    },

    convictionLeft: 2,          // FLAT MIRROR — for {{}} interpolation

    visitReasonLabel: ''        // FLAT MIRROR — for {{}} interpolation

});

**Flat mirrors exist only so `{{}}` renders.** Monogatari's interpolation does not reliably traverse nested objects. `convictionLeft` and `visitReasonLabel` mirror authoritative values inside `player`; the helpers update both. If you add new state that must appear in text, add a flat mirror the same way.

`lastRoll` is written by `roll()` and holds the most recent roll object. Per-scene roll lines are stored under **named flat keys** (e.g. `desk_roll_line`, `vance_roll_line`) for the same reason.

---

## 5\. Non-negotiable gameplay invariants

These are the rules that make the game work. Violating any of them is a bug, even if the code runs.

### 5.1 Failure always produces state

Every failed check must yield at least one of: a lesser clue, `+1` Heat, a trust shift, or a visible closed door. **A failure branch that returns to the same next beat with no state change is a bug.** Review every `*_fail`, `*_locked`, and `*_closes` label for this.

### 5.2 No essential clue behind a Gate check

Gate-tier checks (DC 11–13) may only lock **alternate routes**. The spine of the mystery must be reachable without ever passing a Gate check. Texture and Clue checks may gate *flavor* and *bonus* clues respectively.

### 5.3 Always show the math

Every roll's outcome must render via `rollLine(r)` before the player continues. Never resolve a check silently.

### 5.4 Always telegraph the DC

Choice text for any roll must include the skill and a flavor hint, and the DC must be visible before the player commits:

'Text': 'Search the shed. (Grit — the lock\\'s rusted through, DC 11)'

### 5.5 Conviction: two charges, whole game, keep the better reroll

- Offered **after** failure, as a `Condition`\-gated choice — never automatic  
- Consumed by `spend(e)`  
- Reroll keeps the **better** of the two totals  
- Valid on any check **including the death check**  
- Never reduces Heat or undoes an applied consequence

### 5.6 Ending quality is per-suspect, not global

Use `evidenceAgainst(e, who)` — it reads `EVIDENCE[who]` and returns tier `1 | 2 | 3`. Do **not** compute endings from `player.clues.length`.

### 5.7 The Mercy route is gated on trust, not evidence

`ending_mercy` requires `trust.toby >= 1 && trust.nora >= 1 && trust.creel >= 1`. This asymmetry is the thesis of the game. Do not "fix" it by adding an evidence requirement or by lowering it to a single trust check without a design decision recorded in `DESIGN.md`.

### 5.8 Heat 5 must remain a real threat

The `day5_attack` sequence at Heat ≥ 5 with a Grit DC 12 check is the only true loss in the game. It must remain reachable and must remain survivable via Conviction.

### 5.9 Vance is not a suspect

The accusation matrix in `DESIGN.md` §8 has exactly four named suspects: Toby, Price, Creel, Kell. **Never add Vance as a fifth accusation option.** She is the obstacle, not a suspect. A fifth option dilutes the evidence design without adding texture. This was a deliberate design decision (GDD §13).

---

## 6\. The landing card

The prologue's skill allocation is a **custom HTML overlay**, not a native Monogatari screen. It is the only custom UI code in the project.

**File:** `js/landing-card.js`.

**Contract:**

- Fields: NAME (pre-filled, locked), LENGTH OF STAY (pre-filled, locked), REASON FOR VISIT (three options), SKILLS AND TRADE (four steppers).  
- Each skill starts at 1, max 3, **exactly 4 points to distribute**.  
- Confirm is disabled until 0 points remain.  
- On confirm, calls `confirmLandingCard(e, reason, skills)` and jumps to `ferry_after_form`.

**`confirmLandingCard` is the only sanctioned way to write these values.** It updates `player.skills`, `player.visitReason`, and the `visitReasonLabel` mirror together. Do not write them individually from narrative code.

**Fallback if the overlay costs more than half a day:** four sequential form-filling choices, each granting \+1 to a skill. Less elegant, zero custom code, still diegetic. The switch is made at Milestone 1 and recorded in `DESIGN.md` §6.2.

**`visitReason` is flavor only.** It must never gate content, change a check, or affect an ending. It produces one extra line with Vance and one with Nora. If you find yourself writing a `Condition` on `visitReason`, stop — that violates the design.

---

## 7\. Content authoring patterns

Use these templates verbatim. Consistency is what lets the mechanics be audited.

### 7.1 A check with success and failure branches

'choice\_node': {

    'Narration before the choice.': true,

    'What do you do?': {

        'Choice': {

            'Search': {

                'Text': 'Search the desk. (Perception — the drawer\\'s been forced, DC 9)',

                'Do': function () {

                    const r \= roll(this, 'perception', 9);

                    this.storage('desk\_roll\_line', rollLine(r));

                    return r.success ? 'jump desk\_find' : 'jump desk\_fail';

                }

            }

        }

    }

},

'desk\_find': \[

    '{{desk\_roll\_line}}',

    'y Narrative text.',

    function () { clue(this, 'county\_letter'); return 'jump house\_more'; }

\],

'desk\_fail': \[

    '{{desk\_roll\_line}}',

    'y Narrative text that still tells the player something.',

    function () { heat(this, 1); return 'jump house\_more'; }

\],

### 7.2 A Conviction node (attach to every Gate-check failure)

'fail\_somewhere': \[

    'y Narrative failure text.',

    'Choice': {

        'Push': {

            'Text': 'Push through. (Conviction — {{convictionLeft}} remaining)',

            'Condition': function () { return conviction(this) \> 0; },

            'Do': function () { spend(this); return 'jump reroll\_somewhere'; }

        },

        'Stop': {

            'Text': 'Let it go.',

            'Do': 'jump consequence\_somewhere'

        }

    }

\],

'reroll\_somewhere': \[

    'y In-character framing of stubbornness.',

    'Do': function () {

        const r \= roll(this, 'grit', 12, 2);

        this.storage('someRollLine', rollLine(r));

        return r.success ? 'jump success\_somewhere' : 'jump consequence\_somewhere';

    }

\],

### 7.3 A trust-gated choice

'Bury': {

    'Text': '"Don\\'t write it down."',

    'Condition': function () {

        return trust(this, 'toby') \>= 1

            && trust(this, 'nora') \>= 1

            && trust(this, 'creel') \>= 1;

    },

    'Do': 'jump ending\_mercy'

}

### 7.4 A bonus modifier from a prior clue

'Search': {

    'Text': 'Look at the run from the tree line. (Perception — you know where the fence is now, DC 9)',

    'Do': function () {

        const bonus \= hasClue(this, 'saw\_the\_fence') ? 1 : 0;

        const r \= roll(this, 'perception', 9, bonus);

        this.storage('cannery\_roll\_line', rollLine(r));

        return r.success ? 'jump cannery\_find' : 'jump cannery\_fail';

    }

}

Clue bonuses are the mechanism by which investigation feels powerful. Apply them wherever a clue makes the player more capable.

### 7.5 Helper API — the only sanctioned way to mutate state

Defined at the top of `js/script.js`. Use these; do not reach into `storage()` directly outside them.

| Function | Purpose |
| :---- | :---- |
| `P(e)` | Read the whole `player` object |
| `put(e, patch)` | Shallow-merge a patch into `player` |
| `clue(e, id)` | Add a clue ID if not already held |
| `hasClue(e, id)` | Boolean |
| `heat(e, n)` | Adjust Heat, returns new value |
| `trust(e, who)` | Read a trust value |
| `trustUp(e, who, n)` | Adjust trust, returns new value |
| `conviction(e)` | Charges remaining |
| `spend(e)` | Consume one charge; updates flat mirror |
| `roll(e, skill, dc, bonus)` | Returns `{d1,d2,s,total,success,clean,...}` |
| `rollLine(r)` | Formatted display string for `{{}}` |
| `evidenceAgainst(e, who)` | Tier \`1 |
| `confirmLandingCard(e, reason, skills)` | Writes skills \+ visitReason \+ label mirror |

---

## 8\. Monogatari gotchas

These have all bitten us. Treat them as hard rules.

1. **`this` binding.** Inside `Do` and `Condition` functions, `this` is the engine. Pass it as the first argument to every helper: `roll(this, ...)`. If a `Condition` throws, Monogatari may call it without the engine bound — fall back to the global `monogatari` object (`monogatari.storage('player')`) in any helper used inside a `Condition`.  
     
2. **Do not use dot-path storage.** `this.storage('player.skills.perception')` is unreliable across versions. Read the whole object with `P(e)`, mutate in JS, write it back with `put(e, patch)`.  
     
3. **`{{}}` does not traverse nested objects reliably.** Any value rendered in text must have a **flat key**. Store roll lines under named flat keys per scene.  
     
4. **`Condition` hides choices entirely.** If a player needs to *know* an option exists but can't take it yet, render a separate locked choice with explanatory text rather than hiding it with `Condition`.  
     
5. **`jump` returns from a `Do` function; it does not fall through.** Every branch in a `Do` function must `return` a label string. A missing return is a silent softlock.  
     
6. **Label names are global.** Prefix by scene (`ferry_`, `arrival_`, `desk_`, `vance_`, `day4_`, `day5_`, `accuse_`, `ending_`) to avoid collisions. See `DESIGN.md` §6.4.

---

## 9\. PWA and release checklist

Run before every deploy. Do not skip step 2\.

1. Bump `version` in `service-worker.js`.  
2. **Add every new background, portrait, prop, and audio file to the `files` array** in `service-worker.js`. A missing entry means the asset fails offline for installed users.  
3. Verify `manifest.json` — name, short\_name, `start_url`, `display: standalone`, both icon sizes present, maskable icon present.  
4. Test offline: DevTools → Network → Offline → reload. The game must reach the title screen.  
5. Test install prompt on a real Android device over HTTPS.  
6. Test the landing card at 360×640.

`display: standalone` and a registered service worker with a `fetch` handler are both **required** for Chrome on Android to show the install prompt. An "Add to Home screen" shortcut is not the same thing.

---

## 10\. Asset rules

- **Art is AI-generated, high-grain photographic.** Lock one style prompt; keep one reference image per character. Rain and grain are load-bearing — they hide inconsistency and they are also the aesthetic.  
- **Disclose AI-generated content** in any store listing and in an about screen. Check the generator's commercial-use terms before shipping.  
- **Audio is sparse.** Ambient rain as the default bed. Solo guitar only at transitions and the funeral. **Silence** for the cannery and the Thursday night scene. Do not fill silence.  
- Do not add a background, portrait, or prop without adding it to the service worker.  
- Alana has **no expression set**. A single mirror reflection only. Do not commission more.

---

## 11\. Definition of done

A content change is done when all of the following are true:

- [ ] Every new check uses `roll()` and displays `rollLine()` output  
- [ ] Every new choice that rolls states its skill and DC in the `Text`  
- [ ] Every failure branch produces state (§5.1)  
- [ ] Every Gate-check failure offers a Conviction option (§5.5)  
- [ ] No new essential clue is behind a Gate check (§5.2)  
- [ ] All new labels follow the prefix convention and have no duplicate names  
- [ ] All new `{{}}` interpolations point at flat keys that are actually written  
- [ ] All new assets are in the service worker `files` array  
- [ ] `version` in `service-worker.js` is bumped  
- [ ] Manual playthrough of the affected route in the dev server, including at least one failure path

---

## 12\. Do not

- **Do not** modify `engine/core/` or `dist/index.html` unless the task explicitly requires it.  
- **Do not** invent plot, characters, clues, or endings. All of it is specified in `DESIGN.md`. If something is missing, surface it as a question rather than improvising.  
- **Do not** introduce storylet pools, action budgets, or emergent scene selection. This project is a linear spine with branches. See `DESIGN.md` §1.  
- **Do not** add a fifth skill. Convert extra competencies into flag-based auto-passes.  
- **Do not** add rerolls, save-scumming affordances, or a Conviction refresh without a recorded design decision.  
- **Do not** compute endings from a global clue count.  
- **Do not** add Vance as a suspect. See §5.9.  
- **Do not** gate content, checks, or endings on `visitReason`. It is flavor only. See §6.  
- **Do not** soften Heat, the death check, or the mercy-route trust gate as a "quality of life" change. These are the design.  
- **Do not** add dependencies to solve something the helper functions already solve.  
- **Do not** claim a change is verified without running it in the dev server.

---

## 13\. Current task queue

Ordered. See `DESIGN.md` §6.3 and §13 for full detail.

1. **The landing card overlay** (`js/landing-card.js`) — four steppers, points counter, confirm. Writes via `confirmLandingCard`. The only custom UI code in the project.  
2. **The ferry prologue** — the crossing, the form filing, the tutorial Perception check, `saw_the_fence`. Ends by jumping into `arrival_look`.  
3. **Act One investigation cluster** (6–8 scenes) — grants `truck_at_point`, `price_boots`, `gate_open`, `kell_threat`. These are referenced in `EVIDENCE` and currently unobtainable.  
4. **Toby dock scene (Day 1 night)** — the only path to `trust.toby +1`; without it the Mercy route is unreachable.  
5. **Nora trust scenes** — dinner at the diner, the funeral. Also the primary Heat-reduction mechanism.  
6. **Clue journal UI** — review held clues **and current skills**. This is where the dual readings become visible to the player.  
7. **`saw_the_wolf` payoff** — currently granted but unused. Proposed fifth accusation option. See `DESIGN.md` §13.1.  
8. **Conviction nodes** on remaining Gate failures (`shed_locked`, `vance_closes`, `day5_point_blur`).

---

## 14\. When in doubt

If a task is ambiguous, the resolution order is:

1. `DESIGN.md` for anything narrative or numeric  
2. This file for anything structural or mechanical  
3. The helper function signatures in §7.5  
4. Ask. Do not guess on story.

---

*AGENTS.md v1.1 — companion to DESIGN.md v1.1* *Changelog: adds the landing card contract (§6), `visitReason` and its flat mirror, `saw_the_fence` bonus pattern (§7.4), the Vance exclusion rule (§5.9), the no-storylet-pools rule (§12), the ferry/landing-card task queue entries, and `js/landing-card.js` to the repository map.*  
