# Frontend v2 Handoff — Build a Themed Client on the "Double Down" Engine

**For:** the engineer/AI building a **second** frontend UI (car-racing theme) on our existing backend.
**From:** Jack's side (we built the first frontend, "Double Down Darts," on this same engine).
**How to use:** feed this whole doc to your AI as context. Sections 1–4 are the **fixed engine** (reuse
exactly — math, API, architecture, compliance). Section 5 is the **new theme brief** (the creative part
you adapt). This is a design/handoff document, **not backend code** — nothing here changes the RGS.

> The core promise: **only the visual layer changes between games.** The math, the server, the money
> flow, and the round logic are identical. A new game = a new skin over the same certified engine. That
> reusability is the whole point — and a selling point when we pitch (fast content velocity).

---

## 1. The game, in the abstract (unchanged across every theme)

A **two-stage "double or nothing"** with a rarity ladder:

1. **Step 1 (the bet):** 48.25% win → a locked **2×**. 51.75% → instant loss, round over.
2. **On a Step-1 win, the player chooses:** **Cash Out** (bank the 2×) **or Double Down** (risk it).
3. **Step 2 (double down):** land one of four tiers, or bust:

| Tier | Multiplier | Probability (of the double-down) |
|---|---|---|
| Exotic | 1000× | 0.01% |
| Legendary | 100× | 0.10% |
| Epic | 10× | 4.00% |
| Rare | 3.5× | 40.00% |
| **Bust** | 0× | 55.89% |

- **Multipliers apply to the original base bet**, not to the 2× (so Rare pays 3.5 × bet, not 7×).
- **Target RTP 96.5%.** The numbers are final and lab-aligned — **do not change any probability or
  multiplier.** Only the *presentation* of these outcomes changes per theme.
- Tier names are **Rare / Epic / Legendary / Exotic** (matches the backend `step_2_tier` string exactly).

---

## 2. The backend is already built — the frontend only talks to it (never decides outcomes)

The RGS (Remote Game Server — the host computer that runs the real game logic and RNG) lives in this
repo (`server.js`). It is **server-authoritative**: the browser sends the player's action and *animates
the result the server returns*. The frontend must never compute a win/loss itself.

**The three endpoints the frontend calls** (all `POST`, JSON body):

| Endpoint | Request body | Success response (200) |
|---|---|---|
| `/api/bet` | `{ clientSeed, betAmount, token, player_id }` | `{ round_id, step_1_outcome: "win"\|"lose", current_multiplier, balance }` |
| `/api/doubledown` | `{ round_id, token, player_id }` | `{ round_id, step_2_tier: "Rare"\|"Epic"\|"Legendary"\|"Exotic"\|"Bust", final_multiplier, amount_won, balance }` |
| `/api/cashout` | `{ round_id, token, player_id }` | `{ message, amount_won, balance }` |

- `token` + `player_id` identify the player's casino session and are **required on every call**.
- `clientSeed` is any client string (provably-fair input).
- Errors: `400` (missing fields / insufficient funds / duplicate request), `404` (round not found /
  already completed), `500` (internal). Handle these gracefully in the UI.
- Optional audit endpoints exist (`GET /api/history`, `/api/history/:roundId`) — not needed for gameplay.
- Full backend detail: `PROJECT_HANDOVER_AND_DESIGN.md` in this repo.

---

## 3. The architecture that makes re-theming trivial (strongly recommended — it's how v1 is built)

Keep three concerns **separate**, so the themed visuals are the *only* thing you write per game:

1. **Round state machine** — the single source of truth for "what moment are we in." Phases:
   `idle → betting → step1Result (win → decision | lose → bust) → [decision: cashOut | doubleDown]
   → step2Reveal (tierWin | bust) → idle`. Illegal transitions should throw (catches bugs loud).
2. **An RGS-adapter interface** — the *only* code that talks to the server. One small interface:
   `bet(betAmount)`, `doubleDown()`, `cashOut()` → each calls the matching endpoint above. Swapping
   platforms later (e.g., a specific aggregator's API) = swapping this one file, nothing else.
3. **The themed scene** — the visuals/animation. **This is the only part that differs between games.**
   It listens to the state machine and renders whatever the current phase is.

v1 is **PixiJS 8 + Vite + TypeScript**, compiled to a **static HTML5 site** (what every casino/aggregator
embeds in an iframe). You can use the same stack or your own — as long as it stays server-authoritative,
compiles to a static site, and keeps the RGS-adapter seam clean. (Using the same stack keeps the two
games consistent and lets code/skills transfer.)

---

## 4. Studio-wide rules (keep these for brand consistency + legal compliance)

**Non-negotiable (compliance — these keep the game certifiable and distributable):**
- **Server decides everything.** No outcome logic in the client.
- **No dark patterns** (banned by tier-1 regulators, and they fail certification):
  - No **losses disguised as wins** (never celebrate an outcome that returned less than the stake).
  - No **engineered near-misses** (never fake "you *just* barely lost" on an ordinary loss — e.g., a
    staged photo-finish on a loss). Losses land generically.
  - No **odds deception** — the real probabilities/RTP stay visible and honest.
  - No autoplay/turbo compulsion nudges.
- Wins may feel great and losses should feel gentle/clean (not punishing) — but **through honest game
  feel, never deception.**

**Studio signature (optional but recommended so v2 looks like the same studio):**
- **Rarity color language:** Rare `#5ae374` (green) → Epic `#29dbe8` (teal) → Legendary `#c98ffc`
  (purple) → Exotic `#ff5f35` (red-orange/gold). Use as the **win-feedback glow/celebration color** in
  any theme.
- **Art style:** soft cel-shaded flat cartoon (clean rounded shapes, soft gradient shading, gentle
  rim-light, saturated-not-neon). **Original art only** — no other game's characters/art/branding.
- **AI-sprite workflow** (how v1 makes art cheaply and consistently): generate a **style-anchor** asset
  first, then use it as a *style reference* for every other asset so they match; keep a human in the loop
  (curate + edit) — that human authorship is also what makes the art legally ours.
- **Redundant rank cue:** rarer outcomes should also read *without* color (bigger/louder/more
  celebration), so the tier is clear to colorblind players.

---

## 5. The new theme brief — Car Racing (Jack relaying your concept; adapt freely with your AI)

Map the fixed mechanic (Section 1) onto a race. The **mechanic, math, and API stay identical** — only
the story/visuals change:

- **Place bet → start the race.** The player's car lines up and races.
- **Step 1 result:**
  - **Win (48.25%)** → **your car wins the race** → the **2× is locked**, and the choice appears:
    Cash Out (take 2×) or Double Down (race again).
  - **Lose (51.75%)** → **your car loses the race** → round over.
- **Double Down → race again** (higher stakes):
  - **Bust (55.89%)** → lose this race.
  - **Win** → land a tier, **displayed by the numbered car you finish as / race with** — i.e., the tier
    is expressed through the car's number/identity (your idea). The four tiers (Rare→Exotic) are the four
    escalating race results; you design exactly how each looks. (Suggestion, take or leave: let each tier
    tint its winning car / finish effect with that tier's rarity color from Section 4, so it stays
    on-brand — Exotic being the rarest, biggest celebration.)
- **Loss animations — make several, picked at random client-side** (the server only says "bust"; how you
  show it is yours). Racing-flavored examples: engine breakdown, spin-out, crossing the line behind the
  pack. **Compliance reminder:** none of these may fake a near-miss (no "photo finish you lost by a
  nose" on an ordinary loss — that's an engineered near-miss, which is banned).
- **Idle/anticipation:** ambient race scenery (grandstands, other cars idling, lights) to build
  anticipation — cosmetic only, never implying the odds.

That's the whole brief. Everything you need to build it is above; the math and server are done, so this
is purely a new visual client over the same engine.
