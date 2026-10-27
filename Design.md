# CORMORANT BAY

## Game Design Document

|  |  |
| :---- | :---- |
| **Version** | 1.1 — Design Complete, Pre-Production |
| **Engine** | Monogatari v2.8.0 |
| **Platform** | Installable Android PWA; playable in any modern browser |
| **Genre** | Stat-driven mystery visual novel (quality-gated branching narrative) |
| **Playtime** | 2–3 hours per playthrough |
| **Tone** | Rainy, melancholy, paranoid |
| **Team** | Solo / small team |
| **Status** | Design locked. Implementation not started. |

---

# 1\. Scope & Terminology

## 1.1 What This Game Is

A **quality-gated branching visual novel**. It has a fixed linear spine — six in-game days, authored scene ordering — with stat-checked branches, flag-gated choices, and a state-evaluated ending matrix. Player state (skills, clues, per-character trust, Heat) determines which branches are available at each authored beat.

## 1.2 What This Game Is Not

This is **not** a Quality-Based Narrative in the Failbetter / *Fallen London* sense. There is no storylet pool, no emergent scene selection, no action budget. The player does not navigate a content pool; they move through an authored sequence in which a meaningful subset of options is available at each beat.

## 1.3 Why This Structure

The engine of the story is **controlled revelation**. Eli's photograph must land before Creel's reveal, because the reveal recontextualizes it. The Day 4 church scene only works if the player has spent three days collecting pieces; it is the emotional peak and it must occur on Day 4\. A storylet pool cannot guarantee that ordering without three to five times the content, which is not a scope this project can finish.

The linear spine is the feature. The branching provides replay variation and the sensation of consequence; the spine provides pacing and payoffs.

## 1.4 Terminology

- **Quality** — any player state variable: skill values, clue flags, trust counters, Heat.  
- **Clue** — a named flag added to `player.clues`, representing something Alana has learned or holds.  
- **Check** — a `2d6 + skill + bonus` roll against a difficulty class.  
- **Tier** — the classification of a check: Texture, Clue, Gate, or Death.  
- **Evidence tier** — a per-suspect measure (1/2/3) of how much of the case against that specific person the player has assembled.

The word *storylet* does not appear in this design.

---

# 2\. High Concept

> **Cormorant Bay**, population 900, rain eleven months a year. Your father died alone in the woods behind his house, killed by animals. The coroner's report took four days. The town has already stopped talking about it.  
>   
> You're a writer. You know what it looks like when a story is being managed.

**Alana Taylor** returns to bury a man she hadn't spoken to in six years — a man who called her a traitor for leaving, who spent his last years photographing the point and taping his windows. She has six days before the ferry runs again. She has a notebook, four skills, two moments of conviction, and a town that is *very* polite to her.

## 2.1 Design Thesis

In a mystery, the cover story and the truth are made of the same evidence. The player who accuses the wrong person isn't stupid — they solved a real crime with real evidence. It just wasn't the crime.

## 2.2 The One-Sentence Pitch

A grieving journalist has six days in a small coastal town to work out what killed her father — and the town would rather she concluded almost anything else.

---

# 3\. Design Pillars

| Pillar | What it means in practice |
| :---- | :---- |
| **Failure moves the story** | No check produces a dead end. Every failure yields a lesser clue, a Heat increase, or a visibly closed door. The spine is always reachable; only alternate routes are ever locked. |
| **Scarcity creates drama** | Two Conviction charges for the entire game. No reroll spam. The player lives with outcomes. |
| **Knowledge is power** | Clues grant mechanical bonuses to later rolls. Thorough investigation should *feel* like an advantage, not a flag counter. |
| **The player can be wrong** | The game never corrects a wrong accusation mid-play. It lets you condemn an innocent person and shows you what that cost, years later. |
| **Mercy is not failure** | Saving Toby is a legitimate, earnable ending — gated on *trust*, not evidence. You cannot save someone you treated as a source. |
| **Transparent dice** | Every roll displays its math. Every difficulty is shown with a flavor hint before the player commits. |
| **Silence is a tool** | Rain is the default bed. When the rain stops, the player should feel it. |

---

# 4\. Audience & Platform

## 4.1 Audience

- Readers of literary mystery and folk horror  
- Players of narrative games who value consequence over power fantasy  
- Players who enjoy being *wrong* and finding out later  
- Mobile-first players who want a complete story in 2–3 sittings

**Explicitly not for:** players who want to win, players who reload on failure, players who need the game to tell them they did well.

## 4.2 Platform

|  |  |
| :---- | :---- |
| Primary | Installable PWA on Android (Chrome) |
| Secondary | Any modern desktop or mobile browser |
| Distribution | Static HTTPS host (GitHub Pages, Netlify, Vercel, or Cloudflare Pages) |
| Offline | Full offline play after first load |
| Orientation | Portrait, mobile-first layout |
| Minimum viewport | 360×640 |

## 4.3 PWA Requirements

| Requirement | Detail |
| :---- | :---- |
| Web App Manifest | `manifest.json` with name, short\_name, icons (192, 512, plus maskable), `display: standalone`, theme/background color |
| Service Worker | Must register a `fetch` handler and pre-cache all assets |
| HTTPS | Required for install prompt and service worker |
| Install prompt | Chrome on Android shows "Install app" once manifest and service worker are both detected |

An "Add to Home screen" shortcut is not the same as an install. Both requirements above must be met.

---

# 5\. Narrative Design

## 5.1 Setting

A remote coastal fishing town, population \~900, accessible by ferry twice a week. Rain is near-constant; the climate is a character. The economy runs through **Merritt Kell's** cannery and his rental properties. The old cannery on the point has been shuttered for years, but the fenced run behind it is maintained, locked, and fed.

**Locations (6 town \+ 1 lodging \+ prologue-only ferry):**

| \# | Location | Characters | Function |
| :---- | :---- | :---- | :---- |
| 1 | **Eli's house** — desk, darkroom, shed | — | Primary investigation hub |
| 2 | **Nora's diner** | Nora, townsfolk | Social hub, gossip, Heat reduction |
| 3 | **The docks** | Toby, Price | Arrival, departure, Toby's territory |
| 4 | **Church & graveyard** | Creel | Day 4 reveal, funeral, the vigil |
| 5 | **Sheriff's office** | Vance | Case file, locked drawer, confrontation |
| 6 | **The cannery & the point** | Toby (Thursday) | Third act, the run, the moon |
| 7 | **The motel** | — | Alana's lodging; night scenes, act breaks, the attack |

The **ferry** is a prologue-only location and is not listed as a town location.

## 5.2 The Protagonist

**Alana Taylor**, 41, writer for a small magazine. Left Cormorant Bay six years ago after her mother's death. Her father, **Elias "Eli" Taylor**, became withdrawn and paranoid after his wife died; when Alana took the city job, he accused her of abandoning him and stopped speaking to her. They never reconciled.

She is competent, observant, and grieving in a way she hasn't admitted to herself. She was nineteen when Toby Rook, then six, spent a summer sitting on her father's porch step drinking lemonade. She remembers him.

She will not stay in her father's house. The motel is cheap, thin-walled, and hers.

## 5.3 The Truth (Master Spoiler)

**Toby Rook**, 19, is a werewolf. Bitten at thirteen on the point. He told no one until the first full moon, then went to Pastor Creel because he thought he was damned.

The town has managed it for six years, badly and with great tenderness:

- **Nora Vane** feeds him.  
- **Pastor Abel Creel** hears his confession monthly and absolves him.  
- **Sheriff Ruth Vance** writes reports that are technically accurate.  
- **Merritt Kell** maintains the run behind his cannery — not from kindness, but because a boy who owes him everything is a boy who can be used.

Three weeks before the story begins, Eli Taylor — paranoid, with time on his hands — photographed the run and wrote to the county board of health. **Kell told Doyle Price to open the gate.** Scare the old man off. That's all. It was a full moon.

**Eli died. Nobody meant it. Everybody buried it.** Vance wrote *animal attack, no further inquiry* — which is true.

**The horror of the premise:** the coroner's report is correct. Every suspect is guilty of something real. Every accusation the player can make is defensible from evidence.

## 5.4 Themes

- Grief as something you cannot investigate your way out of  
- Small-town silence as both care and violence  
- The difference between honesty and mercy, and whether either is enough  
- Being wrong with confidence  
- The cost of treating people as sources

## 5.5 Cast

Seven named characters, one playable. Three are official suspects; one (Toby) is a hidden fourth accusation.

| Name | Role | Function | Secret | Trust track |
| :---- | :---- | :---- | :---- | :---- |
| **Alana Taylor** | Player | Writer, returning local, estranged daughter | — | — |
| **Sheriff Ruth Vance** | Obstacle | Blocks, deflects, lies by omission, is exhausted rather than evil | Has covered for Toby for six years | `trust.vance` |
| **Nora Vane** | Ally | Diner owner; Alana's mother's best friend | Has fed Toby since year one | `trust.nora` |
| **Merritt Kell** | Suspect 1 | Charm as armor; owns the town | Told Price to open the gate | `trust.kell` |
| **Doyle Price** | Suspect 2 | Drunk, belligerent, guilty of *something* | Opened the gate; did not kill Eli | `trust.price` |
| **Pastor Abel Creel** | Suspect 3 | Moral center; cannot lie, cannot break the seal | Has absolved Toby monthly for six years | `trust.creel` |
| **Toby Rook** | Witness / hidden suspect | 19, works the docks, hands that shake | Is the wolf | `trust.toby` |

### Character Notes

**Vance** — Thirty-one years as sheriff. Not corrupt; tired. She wrote a true report and let the town draw the wrong conclusion from it. She is the game's moral obstacle, not its villain. She is never an accusation option.

**Nora** — Warm, direct, protective. The player's primary source of information and her primary source of warnings, often in the same sentence. Her grief for Eli is real and secondary to her fear for Toby.

**Kell** — Never raises his voice. Charm is a tool he uses because it works. When finally cornered he is *relieved*, because being blamed for the gate means nobody looks at the run.

**Price** — The easiest man in town to accuse and the wrongest. Guilty of a reckless act that got a man killed, and innocent of murder. When he insists *"I opened the gate, I never touched him"* he is telling the exact truth and nobody believes him.

**Creel** — A priest who has been keeping a boy alive with nothing but silence and a bad sermon. He cannot lie. He cannot break the seal. He can, however, be extremely careful about what he does not say.

**Toby** — Nineteen. Frightened, polite, ashamed. The only character in the game who is genuinely trying to be good and has no way to do it. He killed Alana's father by accident and knows it.

## 5.6 The Dual-Reading Evidence System

Every clue supports two interpretations. This is the core narrative mechanism and the reason the mystery is replayable and the reason the player can be confidently wrong.

| Clue ID | The reading you're offered | The reading underneath |
| :---- | :---- | :---- |
| `the_photograph` | Dogs in a run | A shape that isn't a dog |
| `circled_calendar` | He's afraid of the fighting ring | Six days a month. Every month. |
| `county_letter` | Eli was documenting animal cruelty | Eli was documenting a *person* |
| `vance_admission` | Vance is covering for Kell | Vance is covering for a kid |
| `vance_nervous` | She's hiding something | She's holding a door shut |
| `creel_story` | Creel is protecting a donor | Creel has been absolving a boy |
| `truck_at_point` | Price drove out there | Price drove out there to open a gate |
| `price_boots` | Price was at the scene | Price walked to the gate, not to the body |
| `gate_open` | Kell's property is neglected | The gate was opened deliberately |
| `kell_threat` | Kell is dangerous | Kell is *relieved* to be blamed |
| `confession_heard` | Creel heard a confession | Creel heard *Toby's* confession |
| `saw_the_wolf` | You are losing your mind | You saw what you saw |
| `saw_the_fence` | An observant detail from the crossing | The town has something behind the cannery |

**Design rule:** the game never tells the player they are wrong until the accusation scene. At no point does narration editorialize against a plausible wrong conclusion.

## 5.7 The Moon Clock

Six in-game days, preceded by a ferry crossing on the morning of Day 1\. The next full moon is **Thursday night**. The ferry leaves **Friday morning**.

| Day | Beat | Heat behavior |
| :---- | :---- | :---- |
| **1** | *Ferry crossing.* Arrival; Eli's house; sheriff's office; first night | Manageable; scene-setting |
| **2–3** | Investigation: docks, cannery exterior, Kell, second Nora scene, funeral | Climbs; NPCs begin warning |
| **4** | **The church.** Town closes ranks. Creel reveal. | High — pushing hard here is dangerous |
| **5** | **The moon.** Point / church vigil / stay in room | Heat 5 triggers the attack |
| **6** | **The ferry.** The accusation | — |

---

# 6\. Structure

## 6.1 Act Breakdown

| Act | Days | Content | Approx. words |
| :---- | :---- | :---- | ----: |
| **Prologue** | 1 (morning) | The ferry; the landing card. Arrival, diner, Eli's house, sheriff's office, motel | 8,500 |
| **Act One** | 1 (night) – 3 | Investigation cluster; Toby, Price, Kell, funeral, second Nora, Vance's drawer | 12,000 |
| **Act Two** | 4 | The church; the reveal; the name | 5,000 |
| **Act Three** | 5 | The moon; three possible nights; the attack | 6,000 |
| **Act Four** | 6 | The accusation; eleven endings | 8,000 |
| **Total** |  |  | **\~39,500** |

## 6.2 The Ferry Prologue — The Landing Card

**Placement:** Day 1, morning, before arrival. The player has not met a single character.

**Purpose:**

- Skill allocation, diegetically  
- Establish Alana's interior voice and her relationship to the town before the town starts talking over it  
- A tutorial check so the dice are understood before anything matters  
- Plant the fence early, so the point has been waiting for the player since minute one

**The form:** *Cormorant Bay Visitor Registration*, folded into the ticket envelope. The town keeps a register — everyone who comes, everyone who goes. The last box, SKILLS AND TRADE, is the one that matters: the town wants to know what you're good at so it can be ready.

**Fields:**

| Box | Behavior |
| :---- | :---- |
| NAME | Pre-filled: *Alana Taylor*. Not editable. |
| LENGTH OF STAY | Pre-filled: *six days*. Not editable. |
| REASON FOR VISIT | Three options: *Burying my father.* / *Writing about the town.* / *Both.* |
| SKILLS AND TRADE | Four steppers — Perception, Empathy, Persuasion, Grit. Each starts at 1, max 3, **4 points to distribute**. A counter shows points remaining; confirm is disabled until 0\. |

**Reason for visit** is flavor only (`visitReason`). It produces one extra line with Vance (*"I'd keep the notebook closed if I were you"* for *write* or *both*) and one extra line with Nora (*"You came to bury him. That's more than most would do"* for *bury* or *both*). It does not gate content or change any ending.

**The ferry tutorial check:** after the form is filed, the player may watch the shore (*Perception, DC 7*). Success grants `saw_the_fence` — a texture clue that grants **\+1 to the cannery exterior Perception check** on Day 2\. It costs nothing to miss. Precedent: `vance_nervous` already works this way.

**Fallback if the overlay proves costly to build:** four sequential choices, each framed as filling in one line of the form, each granting \+1 to a skill. Less elegant, zero custom code, and the form is still diegetic. Decide before Milestone 1\.

**The clue journal should display current skills.** The form is the only place the player allocates them; the journal is where they check.

## 6.3 Scene Inventory

Every beat, its location, its checks, and what state it can produce.

| Day | Beat | Location | Characters | Checks | Grants |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1 | **The ferry** | Ferry | Ferryman | Perception DC 7 (texture) | **Skills allocated**; `saw_the_fence`; `visitReason` |
| 1 | Arrival | Docks | Toby | Perception DC 7 (texture) | `trust.toby` ±1 |
| 1 | Nora, first meeting | Diner | Nora | Empathy DC 7 (texture) | `trust.nora` ±1 |
| 1 | The desk | Eli's house | — | Perception DC 9 (clue) | `county_letter` / \+1 Heat |
| 1 | The darkroom | Eli's house | — | Perception DC 9 (clue) | `the_photograph` / \+1 Heat |
| 1 | The shed | Eli's house | — | Grit DC 11 (gate) | `circled_calendar`, `hasCutters` / \+1 Heat |
| 1 | The sheriff | Office | Vance | Persuasion DC 9+2 (clue), Perception DC 7 (texture), Grit DC 11 (gate) | `vance_admission`, `vance_nervous`, \+1 Heat |
| 1 | Night, motel | Motel | — | — | Act break |
| 1 | The dock at night *(optional)* | Docks | Toby | Grit DC 9 (gate) | `trust.toby` \+1 (sit) / \+1 Heat (press) |
| 2 | Cannery exterior | Point | — | Perception DC 9 (+1 if `saw_the_fence`), Grit DC 11 (gate) | `gate_open`, \+1 Heat |
| 2 | Toby's testimony | Docks | Toby | Empathy DC 9 (clue) | `truck_at_point`, `trust.toby` |
| 2 | Doyle Price | Docks | Price | Grit DC 9, Persuasion DC 11 (gate) | `price_boots`, \+2 Heat |
| 2 | Dinner at the diner | Diner | Nora | Empathy DC 7 (texture) | `trust.nora` \+1, −1 Heat |
| 3 | Merritt Kell | Diner / cannery office | Kell | Persuasion DC 11 (gate), Grit DC 9 | `kell_threat`, \+1 Heat |
| 3 | The funeral | Graveyard | Nora, Creel, Vance, Toby | Empathy DC 9 (clue) | `trust.nora` \+1, `trust.creel` \+1, −1 Heat |
| 3 | Vance's drawer | Office | Vance | Perception DC 11 (gate) | `vance_nervous`, `confession_heard` (with trust) |
| 3 | Night, motel | Motel | — | — | Act break |
| 4 | The church | Church | Creel | Persuasion DC 9 (reveal quality) | `creel_story`, `trust.creel` |
| 4 | The name | Church | Creel | — | Reveal; player commits or doesn't |
| 5 | The moon — point | Point | Toby | Perception DC 11 (gate) | `saw_the_wolf` / \+1 Heat |
| 5 | The moon — vigil | Church | Creel | — | `trust.creel` \+1, `confession_heard` |
| 5 | The moon — stay | Motel | — | — | \+1 Heat |
| 5 | The attack *(Heat 5 only)* | Motel | — | **Grit DC 12 (death)** | `saw_the_wolf` / game over |
| 6 | The ferry | Docks | All | — | Ending resolution |

**Total checks: \~35–40** — approximately 20 Texture, 10 Clue, 6 Gate, 1 Death.

## 6.4 Label Inventory

Estimated 58–73 script labels across all beats. Naming convention:

| Prefix | Beat |
| :---- | :---- |
| `Start`, `ferry_*` | Prologue: the crossing and the landing card |
| `arrival_*` | Arrival and diner |
| `house_*`, `desk_*`, `dark_*`, `shed_*` | Eli's house investigation |
| `sheriff_*`, `vance_*` | Sheriff's office |
| `night_*`, `slice_*` | Act breaks |
| `toby_*` | Toby scenes |
| `price_*` | Price scenes |
| `kell_*` | Kell scenes |
| `nora_*`, `funeral_*` | Nora and funeral scenes |
| `cannery_*`, `point_*` | The point |
| `day4_*` | Church reveal |
| `day5_*` | The moon |
| `day6_*`, `accuse_*`, `ending_*` | The accusation and endings |

All labels are global. Every new label must follow its prefix.

---

# 7\. Systems Design

## 7.1 Skills

The player allocates **4 points** at the start, via the **landing card** in the ferry prologue. Each skill begins at **1**; maximum is **3**. The result is a character who is competent everywhere and genuinely good at one or two things — necessary when every scene contains a check.

| Skill | Covers | Typical applications |
| :---- | :---- | :---- |
| **Perception** | Searching, noticing, reading a room, spotting the detail inside the lie | Search scenes, observation, body language |
| **Empathy** | Reading motive, knowing what someone needs to hear | Nora, Creel, Toby, the funeral |
| **Persuasion** | Getting cooperation, being trusted, talking your way in | Vance, Kell, townsfolk |
| **Grit** | Enduring, intimidating, not flinching, going out at night | The shed, the point, Vance under pressure, the death check |

**Design rule:** if a fifth competency seems necessary, convert it into a **flag-based auto-pass** instead. Knowledge should grant certainty, not another die.

**Distribution example:** a player who puts 2 in Perception and 2 in Empathy will find the investigation scenes comfortable and the social confrontations difficult. A player who puts 3 in Grit and 1 elsewhere will survive the night and struggle to learn anything. Both are viable; neither is complete.

The landing card also records `visitReason`, which is flavor only and produces one or two extra lines with Vance and Nora.

## 7.2 Check Resolution

**Formula:** `2d6 + skill + situational bonus` against a **difficulty class (DC)**.

| Tier | DC | Count | On failure |
| :---- | :---- | :---- | :---- |
| **Texture** | 7 | \~20 | Nothing mechanical — you miss flavor or a small detail |
| **Clue** | 9 | \~10 | A lesser clue, or **\+1 Heat** |
| **Gate** | 11–13 | \~6 | Locks an *alternate route*, never the spine |
| **Death** | 12 | 1 | Game over |

**Outcome bands:**

- **Clean success** — `total >= DC + 3`. Get the clue *and* a bonus (trust, extra flag).  
- **Success at a cost** — `DC <= total < DC + 3`. Get the clue; something is paid for it.  
- **Failure** — `total < DC`. Produce state anyway.

### Non-Negotiable Rules

1. **Show the math.** Every roll renders its full arithmetic before the player continues: `Perception — 2d6 (4+3) + 2 = 9 vs DC 9. Success, at a cost.`  
2. **Telegraph the DC.** Choice text includes the skill, a flavor hint, and the number, before the player commits: *"Search the shed. (Grit — the lock's rusted through, DC 11)"*  
3. **Failure always produces state.** Every failed check yields a lesser clue, \+1 Heat, a trust shift, or a visible closed door. A failure that returns to the same beat with no state change is a bug.  
4. **No essential clue behind a Gate check.** Gate checks lock only alternate routes. The spine is always reachable.  
5. **Bonuses are earned, not granted.** Clues, trust, and gear add to rolls. A thorough player should reach the final confrontation rolling `2d6+5` against DC 11 and *feel* it.

## 7.3 Conviction

The player's only safety valve. **Two charges for the entire playthrough.** No refresh.

| Property | Value |
| :---- | :---- |
| Charges | 2 (total, whole game) |
| Trigger | Offered as a choice **after** a failed roll — never automatic |
| Effect | Reroll; **keep the better of the two results** |
| Valid targets | Any check, **including the death check** |
| Does not | Reduce Heat, undo an applied consequence, restore a spent scene |

### Presentation

Never a bare counter. Frame it in character:

> *You could let this go. You could get on the ferry Friday and write a nice piece about a town that lost a man to the woods.*  
>   
> **Push through.** *(Conviction — 1 remaining)*

### Design Intent

The player will be tempted to burn Conviction on a DC 9 clue in the first hour and regret it in the third. That regret is the point. The death check (Grit DC 12\) is the one moment where spending it is unambiguously correct — and if both charges are gone by Thursday night, that scene has real teeth.

**Tuning note:** if playtesting shows near-total hoarding (players finish with both charges unspent), add a single third charge as a story reward — Eli's photographs. Do not add it before playtesting demonstrates the need.

## 7.4 Heat

A single **0–6** quality tracking how much attention Alana has drawn. Heat is the paranoia engine and the game's pacing mechanism.

### Sources of Heat

| Source | Heat |
| :---- | :---- |
| Failed Clue-tier check | \+1 |
| Pushing a character past their patience | \+1 |
| Asking the same person about the dogs twice | \+1 |
| Trespassing somewhere you were warned off | \+2 |
| A normal social scene (dinner, church, funeral) | −1 |

### Effects

| Heat | Effect |
| :---- | :---- |
| **0–1** | Nothing. You are a grieving woman in a small town. |
| **2** | Nora warns you, kindly. Vance pays a visit. |
| **4** | Toby stops talking. Your motel room is searched. The shed is emptied. |
| **5** | **The wolf comes for you**, Thursday night. **Grit DC 12\.** Fail and the game ends. |

### Design Notes

- Heat is never displayed as a HUD element. It is communicated through narration, NPC behavior, and the state of the world.  
- Heat reduction forces a genuine cost: a scene spent at dinner is a scene not spent investigating.  
- Heat 5 is telegraphed twice — at Heat 2 and again at Heat 4\. The death ending is a consequence, not an ambush.

## 7.5 Trust

Separate per-character counters, roughly −1 to \+3: `trust.nora`, `trust.vance`, `trust.toby`, `trust.creel`, `trust.price`, `trust.kell`.

**Trust is not evidence.** It gates:

- Dialogue depth — characters reveal more to someone they like  
- The **Mercy ending**, which requires three trust thresholds  
- Whether NPCs warn you before you do something irreversible

**Raised by:** being gentle, keeping promises, not pressing when told to stop, attending social scenes, sitting with someone instead of interrogating them.

## 7.6 Clues & Evidence

### Clue Master Table

| Clue ID | Granted by | Tier | Feeds |
| :---- | :---- | :---- | :---- |
| `saw_the_fence` | Ferry, Perception DC 7 | Texture | \+1 to the cannery exterior Perception check |
| `county_letter` | Desk, Perception DC 9 | Clue | Kell evidence |
| `the_photograph` | Darkroom, Perception DC 9 | Clue | Toby evidence |
| `circled_calendar` | Shed, Grit DC 11 | Gate | Toby evidence |
| `vance_nervous` | Sheriff, Perception DC 7 | Texture | Bonus (+1 to later Vance checks) |
| `vance_admission` | Sheriff, Persuasion DC 9 (+2 with letter) or Grit DC 11 | Clue | Creel evidence |
| `gate_open` | Cannery exterior, Grit DC 11 | Gate | Price \+ Kell evidence |
| `truck_at_point` | Toby's testimony, Empathy DC 9 | Clue | Price evidence |
| `price_boots` | Price, Grit DC 9 | Clue | Price evidence |
| `kell_threat` | Kell, Persuasion DC 11 | Gate | Kell evidence |
| `confession_heard` | Vance's drawer, Perception DC 11; or Thursday vigil | Gate | Creel evidence |
| `creel_story` | Day 4 reveal | Spine | Toby \+ Creel evidence |
| `saw_the_wolf` | Thursday point, Perception DC 11; or surviving the attack | Gate | Unlocks a fifth accusation option |

`hasCutters` is an item flag, not a clue: granted by the shed success, and it opens an alternate route at the cannery gate.

### Evidence Tiers

Ending quality is determined **per suspect**, not by a global clue count.

| Suspect | Required clues |
| :---- | :---- |
| **Toby** | `the_photograph`, `circled_calendar`, `creel_story` |
| **Price** | `truck_at_point`, `price_boots`, `gate_open` |
| **Creel** | `creel_story`, `vance_admission`, `confession_heard` |
| **Kell** | `county_letter`, `gate_open`, `kell_threat` |

**Tier calculation:** 3 of 3 → **Full**; 2 of 3 → **Partial**; otherwise **Thin**.

### The Mercy Route

The *"Don't write it down"* option at the accusation requires:

trust.toby \>= 1  AND  trust.nora \>= 1  AND  trust.creel \>= 1

**Not** evidence. This asymmetry is the thesis of the game. Knowing the truth is not enough to save him; you must have been *kind* to the people who would have to live with the choice.

A player who investigated aggressively — pushed everyone, chased every clue, ran up Heat — will hold full evidence and see no Mercy option at all. That is correct.

---

# 8\. The Ending Matrix

Ending is a function of **who you accuse** × **evidence tier**.

| Accused | Thin | Partial | Full |
| :---- | :---- | :---- | :---- |
| **Toby** ✅ | Town closes ranks. You leave. | Arrested. County comes. You did the right thing and the town will hate you for it. | Fork: **tell** (county comes, truth and cost) or **bury** (mercy; requires three trust thresholds) |
| **Price** ⚠️ | Questioned and released. | Arrested for murder. He opened a gate. | Airtight case. Innocent man condemned. Revealed four years later by letter. |
| **Creel** ⚠️ | Town turns on him. | Scandal; the church collapses. | He confesses everything. You ruin him anyway. He was never the murderer. |
| **Kell** ⚠️ | He laughs. You leave. | County investigates; the cannery dies. | He takes the fall for what he *did* do — and the real story stays buried. |
| **Nobody** | Leave. | Write it; killed by legal. | Write it; published; inquiry; no wolf found. |
| **Death** | Heat 5 on Thursday, failed Grit DC 12\. The second animal attack in one week. |  |  |

## 8.1 The Eleven Endings

| \# | Ending | What the player gets |
| :---- | :---- | :---- |
| 1 | `ending_leave` | Leave with nothing. Escape, not resolution. |
| 2 | `leave_partial` | Write it; the magazine kills it; the draft sits in a drawer for eleven years. |
| 3 | `leave_full` | Write it; it lands; an inquiry finds a cannery and a fence and no wolf. |
| 4 | `toby_thin` | Accuse and be disbelieved. Nobody even argues. |
| 5 | `ending_toby_partial` | Arrested underprepared. He goes quietly. Relief in his face, which is worse. |
| 6 | `ending_toby_full` | The county comes. The truth, and the cost. You are certain, and alone. |
| 7 | `ending_mercy` | Save him. Not cured. You chose the boy anyway. |
| 8 | `ending_price_full` | Condemn an innocent man; learn it four years later. |
| 9 | `ending_creel_ruin` | Ruin a good man who was never the murderer. |
| 10 | `ending_kell_full` / `ending_kell_partial` | Catch the villain who wasn't the story. |
| 11 | `day5_death` | The only true loss. The game told you twice. |

## 8.2 Ending Tone Guide

| Ending | Intended feeling |
| :---- | :---- |
| Mercy | Relief and dread in equal measure |
| Toby full | Correct, and alone |
| Price full | Retroactive horror |
| Creel ruin | Shame |
| Kell full | A hollow victory |
| Leave | Escape, not resolution |
| Death | *It told me. It told me twice.* |

---

# 9\. Presentation

## 9.1 Art Direction

**Style:** high-grain photographic. Heavy contrast, desaturated, wet. Every background is weather. Rain and grain are load-bearing — they hide inconsistency and they are the aesthetic.

- One locked style prompt across all assets.  
- One reference image per character, reused across all expressions, to prevent drift.  
- Silhouettes are an acceptable fallback for minor expressions and crowd scenes.  
- The clue journal is where the dual readings become visible to the player. It should look like Alana's notebook, not a system menu.

**AI-generated content:** must be disclosed in any store listing and in an in-game about screen. Generator terms of use must permit commercial distribution. This is verified before production begins, not after.

## 9.2 Audio Direction

| Cue | Usage |
| :---- | :---- |
| Ambient rain loop | Default bed throughout |
| Wind | Exterior scenes: the docks, the point, the graveyard |
| Diner interior | Muted conversation, dish clatter, low |
| Church tone | Low organ drone or held chord |
| Solo guitar theme | Scene transitions, the funeral, endings only |
| **Silence** | The cannery. The run. Thursday night. |

Silence is not the absence of an asset; it is a designed cue. The contrast between rain and its absence is free horror and should be used sparingly and deliberately.

## 9.3 UI

| Element | Notes |
| :---- | :---- |
| Dialogue box | Semi-transparent, desaturated, subtle border |
| Choice buttons | Default and hover states; locked states visible but not selectable |
| **Landing card** | **Custom HTML overlay.** Four steppers, points-remaining counter, confirm button. The only real UI code in the project. Budget half a day. |
| Roll display | The full arithmetic, every time, framed |
| Clue journal | Accessible from the menu; lists held clues, known suspects, **and current skills** |
| Conviction indicator | Shown only within the failure choice text, never as a HUD element |
| Save/load | Monogatari native slots; minimum 3 slots |
| Settings | Text speed, master/music/SFX volume, skip-read-text |
| Title screen | The point in rain; the title |

Heat is never displayed numerically.

## 9.4 Typography

| Role | Requirements |
| :---- | :---- |
| Body | Serif, highly legible at mobile sizes, slightly worn. Licensed for web embedding. |
| Display | Heavier serif or distressed face; title screen, act headers, ending cards. Licensed for web embedding. |

Google Fonts is the safe default. License is verified before use.

---

# 10\. Technical Design

## 10.1 Engine

**Monogatari v2.8.0**, selected for:

- Native quality-gating support (`this.storage()`, `Condition` on choices)  
- Built-in PWA features (manifest, service worker, offline play)  
- Web-native stack (HTML/CSS/JS); no build toolchain required  
- TypeScript rewrite in v2.8.0 provides autocomplete for the engine API

Alternatives considered: Kawaijs (simpler PWA path, less mature tooling), Pixi'VN (higher visual ceiling, steeper curve, manual PWA configuration).

## 10.2 Repository Structure

dist/                          \# Deployable app — the working root

├── index.html

├── manifest.json

├── service-worker.js

├── js/

│   ├── options.js             \# Title, character definitions, engine options

│   ├── main.js                \# preloadGame() — initializes player state

│   └── script.js              \# All narrative content and mechanics helpers

├── engine/core/               \# Monogatari engine — never modified

└── assets/

    ├── images/

    │   ├── backgrounds/

    │   ├── characters/

    │   ├── props/

    │   └── ui/

    ├── audio/

    │   ├── music/

    │   └── sfx/

    ├── fonts/

    └── icons/

All authored content lives in three files: `script.js`, `main.js`, `options.js`. `engine/core/` is vendored and must not be modified; behavior not provided by the engine is extended from `script.js`.

## 10.3 State Schema

Initialized in `main.js` via `preloadGame()`. This is the complete persistent schema.

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

    convictionLeft: 2,          // flat mirror — required for {{}} interpolation

    visitReasonLabel: ''        // flat mirror — required for {{}} interpolation

});

**On the flat mirrors:** Monogatari's `{{}}` interpolation does not reliably traverse nested objects. `convictionLeft` and `visitReasonLabel` exist solely so those values render inside dialogue. The authoritative values live in `player`; the helpers update both. Any new state that must appear in text needs the same treatment.

`lastRoll` is written by the roll helper and holds the most recent roll object. Per-scene roll lines are stored under **named flat keys** (e.g. `desk_roll_line`, `vance_roll_line`) for the same reason.

## 10.4 Helper API

Defined at the top of `script.js`. All state mutation goes through these; nothing reaches into `storage()` directly outside them.

| Function | Purpose |
| :---- | :---- |
| `P(e)` | Read the whole `player` object |
| `put(e, patch)` | Shallow-merge a patch into `player` |
| `clue(e, id)` | Add a clue ID if not already held |
| `hasClue(e, id)` | Boolean check |
| `heat(e, n)` | Adjust Heat; returns new value |
| `trust(e, who)` | Read a trust value |
| `trustUp(e, who, n)` | Adjust trust; returns new value |
| `conviction(e)` | Charges remaining |
| `spend(e)` | Consume one charge; updates the flat mirror |
| `roll(e, skill, dc, bonus)` | Returns `{d1, d2, s, total, success, clean, ...}` |
| `rollLine(r)` | Formatted display string for `{{}}` interpolation |
| `evidenceAgainst(e, who)` | Returns tier `1 | 2 | 3` for a given suspect |
| `confirmLandingCard(e, reason, skills)` | Writes `skills` and `visitReason`, plus the flat label mirror |

## 10.5 Engine Constraints

These are hard rules derived from known Monogatari behavior:

1. **`this` binding.** Inside `Do` and `Condition` functions, `this` is the engine. Pass it as the first argument to every helper. If a `Condition` throws, Monogatari may call it without the engine bound — fall back to the global `monogatari` object in any helper used inside a `Condition`.  
     
2. **No dot-path storage.** `this.storage('player.skills.perception')` is unreliable across versions. Read the whole object, mutate in JavaScript, write it back.  
     
3. **No nested interpolation.** Any value rendered in text must live at a flat key.  
     
4. **`Condition` hides choices entirely.** If a player needs to know an option exists but cannot take it, render a separate locked choice with explanatory text rather than hiding it.  
     
5. **`jump` returns from a `Do` function.** It does not fall through. Every branch must return a label string; a missing return is a silent softlock.  
     
6. **Labels are global.** Always use the prefixes in §6.4.

## 10.6 Authoring Patterns

### A check with success and failure branches

'choice\_node': {

    'Narration before the choice.': true,

    'What do you do?': {

        'Choice': {

            'Search': {

                'Text': 'Search the desk. (Perception — the drawer has been forced, DC 9)',

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

### A Conviction node, attached to every Gate-check failure

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

### A trust-gated choice

'Bury': {

    'Text': '"Don\\'t write it down."',

    'Condition': function () {

        return trust(this, 'toby') \>= 1

            && trust(this, 'nora') \>= 1

            && trust(this, 'creel') \>= 1;

    },

    'Do': 'jump ending\_mercy'

}

## 10.7 PWA Configuration

`manifest.json`:

{

  "short\_name": "Cormorant Bay",

  "name": "Cormorant Bay",

  "start\_url": "/",

  "display": "standalone",

  "background\_color": "\#1A1D21",

  "theme\_color": "\#1A1D21",

  "icons": \[

    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },

    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },

    { "src": "assets/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }

  \]

}

`service-worker.js` must list every background, portrait, prop, audio file, font, and icon in its `files` array. The `version` constant is incremented on every content release.

**A missing service-worker entry is the single most common PWA bug and the most likely reason an installed player sees a broken asset.** The release checklist exists primarily to prevent it.

---

# 11\. Asset Requirements

## 11.1 Backgrounds

| ID | Description | Priority |
| :---- | :---- | :---- |
| `bg_ferry_interior` | Ferry interior; window seat, rain on glass, a form on the knee | P0 |
| `bg_dock` | Ferry dock; rain, grey water, town rising behind | P0 |
| `bg_diner` | Nora's diner interior; warm, low, condensation | P0 |
| `bg_house` | Eli's house interior; taped windows, photographs on every wall | P0 |
| `bg_office` | Sheriff's office; fluorescent, filing cabinets | P0 |
| `bg_motel` | Motel room; calendar on wall, rain on glass | P0 |
| `bg_church` | Church interior; cold, wood, tall windows | P0 |
| `bg_point` | Cannery and the run; fence, floodlight, tree line, night | P0 |
| `bg_darkroom` | Eli's back room; developing trays, red safelight | P1 |
| `bg_shed_ext` | Shed exterior; rusted hasp, rotten wood | P1 |
| `bg_cannery_ext` | Cannery exterior by day; shuttered, fenced | P1 |
| `bg_graveyard` | Headstones, Alana's mother's grave, rain | P1 |
| `bg_house_ext` | Eli's house from outside; porch, taped windows | P2 |
| `bg_dock_dawn` | Dock at dawn; mist, the boat arriving | P2 |
| `bg_house_night` | Eli's house at night, desk lamp only | P2 |
| `bg_point_dawn` | The point after the moon; empty run, gate open | P2 |

Black is CSS, not an asset.

**Total: 16 files** — 8 P0, 4 P1, 4 P2.

## 11.2 Character Portraits

Minimum viable expressions per character, chosen for the scenes they appear in.

| Character | Expressions | Count |
| :---- | :---- | ----: |
| **Vance** | neutral, guarded, cracked, angry | 4 |
| **Nora** | warm, grieving, warning, closed | 4 |
| **Creel** | neutral, pained, resolved, blessing | 4 |
| **Toby** | nervous, afraid, relieved, still | 4 |
| **Kell** | charming, contemptuous, relieved, threatening | 4 |
| **Price** | drunk, cornered, spitting, broken | 4 |
| **Alana** | mirror reflection *(only)* | 1 |
| **Crowd** | silhouette | 1 |
| **Ferryman** | silhouette *(prologue)* | 1 |

Alana is first-person and has **no default portrait**. A single mirror image is the only depiction; do not commission an expression set.

The ferryman appears once, in silhouette, in the prologue. He may reuse the crowd silhouette asset with a different color grade.

**Total: 27 files** — 12 P0 (three expressions each for Vance, Nora, Creel, Toby), 11 P1, 4 P2.

## 11.3 Props & Documents

The payoff for investigation. The dual readings only land if the player can look at the evidence.

| ID | Description | Priority |
| :---- | :---- | :---- |
| `prop_photograph` | Eli's night photo: fence, a shape behind the wire, heavy grain | P0 |
| `prop_calendar` | Wall calendar, six days circled in every month | P0 |
| `prop_county_letter` | Typewritten carbon copy, county board letterhead | P0 |
| `prop_coroner_report` | *Animal attack, no further inquiry.* Vance's signature. | P1 |
| `prop_case_file` | The case folder, thumbed at the corner | P1 |
| `prop_boots` | Muddy work boots; prints in the mud | P1 |
| `prop_gate` | The cannery gate, latch, chain | P1 |
| `prop_father_photo` | Eli and Alana, years ago | P2 |
| `prop_mother_grave` | Headstone | P2 |
| `prop_notebook` | Alana's notebook; clue journal skin | P2 |

**Total: 10 files** — 3 P0, 4 P1, 3 P2.

## 11.4 UI

| ID | Description | Priority |
| :---- | :---- | :---- |
| `ui_textbox` | Dialogue box | P0 |
| `ui_choice_button` | Choice button, default \+ hover | P0 |
| `ui_title_screen` | Title art: the point in rain | P0 |
| `ui_landing_card` | The visitor registration form: four steppers, points-remaining counter, confirm button. **Custom HTML overlay.** | P0 |
| `ui_roll_display` | Roll result panel | P1 |
| `ui_clue_journal` | Notebook overlay, two pages; lists clues, suspects, current skills | P1 |
| `ui_menu_bg` | Menu background (may reuse `bg_point`) | P1 |
| `ui_conviction_pip` | Single mark per charge, used only in the failure node | P1 |
| `ui_end_card` | Ending card background | P2 |

**Total: 9 files** — 4 P0, 4 P1, 1 P2.

## 11.5 Audio

| ID | Description | Priority |
| :---- | :---- | :---- |
| `mus_rain_loop` | Ambient rain, seamless loop — the default bed | P0 |
| `mus_guitar_theme` | Solo guitar, sparse, lonely, \~90s loop | P0 |
| `sfx_ui_click` | Soft, low | P0 |
| `sfx_roll` | Dry, small; accompanies the roll display | P0 |
| `mus_wind` | Exterior scenes | P1 |
| `mus_diner_ambience` | Muted conversation, dish clatter | P1 |
| `mus_church_tone` | Low organ drone | P1 |
| `sfx_success` | Restrained; not triumphant | P1 |
| `sfx_fail` | Low, muted | P1 |
| `sfx_door_creak` | Wood, old | P1 |
| `sfx_lock_rattle` | Rusted hasp | P1 |
| `sfx_distant_bark` | A dog, once, then silence | P1 |
| `sfx_howl` | Distant, single, not aggressive | P1 |
| `sfx_wolf_close` | Proximity only; nothing graphic | P1 |
| `mus_motel_ambience` | Rain on glass, distant water, a ticking clock | P2 |
| `mus_ferry_engine` | Low engine, water | P2 |
| `sfx_page_turn` | Notebook | P2 |
| `sfx_water_ferry` | Water against the hull | P2 |
| `sfx_church_bell` | One bell, once | P2 |

**Total: 19 files** — 4 P0, 10 P1, 5 P2.

## 11.6 Fonts & Icons

| ID | Description | Priority |
| :---- | :---- | :---- |
| `font_body` | Serif, legible at mobile sizes | P0 |
| `icon_192` | PWA icon, 192×192 | P0 |
| `icon_512` | PWA icon, 512×512 | P0 |
| `font_display` | Heavier serif; titles and headers | P1 |
| `icon_maskable` | Maskable variant, safe-zone padded | P1 |
| `favicon` | 32×32 or SVG | P1 |
| `splash` | Android splash screen | P2 |

The icon must read at 48px: the point in silhouette, rain, one cormorant. No text.

**Total: 7 files** — 3 P0, 3 P1, 1 P2.

## 11.7 Summary

| Category | P0 | P1 | P2 | Total |
| :---- | ----: | ----: | ----: | ----: |
| Backgrounds | 8 | 4 | 4 | 16 |
| Portraits | 12 | 11 | 4 | 27 |
| Props | 3 | 4 | 3 | 10 |
| UI | 4 | 4 | 1 | 9 |
| Audio | 4 | 10 | 5 | 19 |
| Fonts & icons | 3 | 3 | 1 | 7 |
| **Total** | **34** | **36** | **18** | **88** |

**Format guidance:** backgrounds as JPEG q80 at 1920×1080; portraits as PNG with transparency at \~1000px tall; props as JPEG; audio as OGG Vorbis (MP3 fallback only if required); fonts as WOFF2 only.

---

# 12\. Production Plan

## 12.1 Milestones

| \# | Milestone | Deliverable | Exit criteria |
| :---- | :---- | :---- | :---- |
| 1 | **Foundations** | Monogatari template running; state schema, helper API, and roll system implemented; **landing card overlay built and writing `skills` \+ `visitReason` to storage**; one test scene proves a check, a clue, a Heat tick, and a Conviction node all work end to end | A roll displays its math; a clue persists across a save/load; a Conviction reroll is consumed correctly; the landing card writes correct values |
| 2 | **Prologue** | The ferry and the landing card; arrival; diner; Eli's house (three nodes); sheriff; motel | A player can reach the act break with any combination of successes and failures, and never dead-ends |
| 3 | **Act One** | Days 1 (night) – 3: Toby, Price, Kell, funeral, second Nora scene, Vance's drawer | All twelve clues are obtainable; every suspect has a reachable Full tier |
| 4 | **Act Two & Three** | Day 4 reveal; Day 5 three nights plus the attack | `creel_story` is always granted; the death check is reachable and survivable |
| 5 | **Act Four** | Day 6; all eleven endings | Every cell of the ending matrix is reachable and distinct |
| 6 | **Systems UI** | Clue journal; roll display panel; skill display in the journal | A new player can check their skills and clues without instruction; the journal lists held clues accurately |
| 7 | **Asset production** | All P0 then P1 assets | Every scene renders with final art and audio |
| 8 | **PWA** | Manifest, service worker, offline test, install test on device | Installed on a real Android device; all scenes playable offline |
| 9 | **Playtest** | 5+ external testers | See §12.2 |

## 12.2 Playtest Plan

Five external testers minimum, each completing one full playthrough and a written debrief.

**Questions to answer:**

1. Did any failed roll feel unfair? *(If yes, the DC telegraphing failed.)*  
2. Did you spend Conviction? Did you regret where you spent it?  
3. Did Heat feel like a consequence or a punishment?  
4. Who did you accuse, and how confident were you? *(This is the single most important data point. If every tester accuses Toby, the dual readings are too weak. If no tester accuses Toby, the spine is too obscure.)*  
5. Did you find the mercy route? How? *(Target: 10–30% of testers on a first run.)*  
6. Did the landing card feel like part of the story or like a menu?  
7. Would you replay? What would you do differently?

**Tuning levers, in order of preference:**

1. Adjust DCs (±1) on Clue-tier checks  
2. Adjust Heat accumulation rate  
3. Lower the mercy-route trust thresholds from three to two  
4. Add a third Conviction charge (only if hoarding is near-total)

Do not tune the ending matrix. The endings are the design.

## 12.3 Risks

| Risk | Likelihood | Mitigation |
| :---- | :---- | :---- |
| 35 checks feel random rather than authored | Medium | Texture checks must be cheap and flavorful; they teach the dice, they don't gate |
| Players hoard Conviction and finish with both charges | Medium | Acceptable on a first run. If universal, add a third charge as a story reward |
| The death ending feels punitive | Low | Telegraphed at Heat 2 and Heat 4; survivable with Conviction |
| The landing card overlay costs more than half a day | Medium | Fallback: four sequential form-filling choices, each granting \+1 to a skill |
| AI art drifts between scenes | High | One reference image per character; rain and grain are load-bearing; re-render rather than accept drift |
| The mercy route is unreachable in practice | Medium | Playtest explicitly for it; lower to two trust thresholds if under 10% find it |
| A wrong accusation feels like a bug | Medium | The ending must argue for itself — show the letter, the courtroom, the twelve people who believed what they expected to see |
| Service-worker omission breaks installed builds | High | Release checklist; test offline before every deploy |
| Scope creep in Act One | Medium | The scene inventory in §6.3 is the contract. New beats require cutting an existing one. |

## 12.4 Release Checklist

- [ ] All assets present and referenced  
- [ ] All assets listed in the service-worker `files` array  
- [ ] `version` constant incremented  
- [ ] Offline test passed (DevTools → Network → Offline)  
- [ ] Install prompt verified on a real Android device over HTTPS  
- [ ] All eleven endings manually reached  
- [ ] Save/load verified across an act boundary  
- [ ] Landing card verified on a 360×640 viewport  
- [ ] AI-generated content disclosed  
- [ ] Font and audio licenses verified for web distribution

---

# 13\. Open Questions

Items deliberately left open, to be resolved during production without changing the core design.

1. **The fifth accusation.** `saw_the_wolf` is granted but currently feeds nothing. Proposed: an option at the accusation to *"tell them what you saw,"* which changes the tone of the Toby endings without changing their logic. Decide after Act Three is drafted.  
2. **Title.** *Cormorant Bay* is the working title. Lock before asset production.  
3. **Act One length.** The scene inventory allows trimming one optional beat (the funeral, the Kell meeting, or Vance's drawer) if Act One runs long. Determine after Milestone 3\.

---

# 14\. Appendix

## 14.1 Touchstones

For tone alignment, not imitation:

- *Fallen London* / *Sunless Sea* — quality-driven content gating  
- *Disco Elysium*, *Pentiment*, *Paradise Killer* — investigation structured inside a directed frame  
- *The Wicker Man* (1973) — small-town complicity as a form of care  
- *Midnight Mass* — confession, absolution, and the cost of silence  
- *True Detective* S1 — investigation as self-destruction

## 14.2 The Line to Keep in Mind

> The town is not evil. The town is *kind*, and the kindness is the problem. Every character is trying to protect someone, and the protection is what killed Eli Taylor.

## 14.3 Version History

| Version | Date | Change |
| :---- | :---- | :---- |
| 1.0 | — | Design complete. Scope, terminology, narrative, systems, endings, assets, and technical approach locked. |
| 1.1 | — | Ferry prologue with diegetic landing card added (skill allocation, `visitReason`, `saw_the_fence` tutorial clue). Motel confirmed as full Location 7\. Vance formally excluded from the accusation matrix. Act breakdown, scene inventory, state schema, asset counts, and milestones updated accordingly. Open questions reduced to three. |

---

*End of document.* *Companion file: `AGENTS.md` — implementation rules, coding conventions, and invariant checklist.*  
