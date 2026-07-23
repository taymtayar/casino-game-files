# "Double Down" iGaming RGS — Comprehensive Architecture, Game Design & Handover Report

> **System Status**: Complete, Verified & Deployed  
> **Repository**: [https://github.com/taymtayar/casino-game-files.git](https://github.com/taymtayar/casino-game-files.git)  
> **Backend Architecture**: Node.js (Express) + Redis + Render Web Service & Key-Value Store  
> **Testing Suite**: Jest + Supertest (Deterministic RNG Mocks)

---

## 1. Executive Summary & Repository Context

This document serves as the complete technical specification, game design reference, and architectural record for **"Double Down"**, a two-stage, provably fair Remote Game Server (RGS) for iGaming.

All source code files referenced in this document are hosted and maintained in the primary repository (`https://github.com/taymtayar/casino-game-files.git`) and are accessible for ongoing development, frontend asset creation, and wallet integrations.

---

## 2. Game Concept & Mathematical Model (PAR Sheet)

"Double Down" is a high-volatility, decision-based casino game centered on the strategic choice between securing a guaranteed payout or risking it for exponential multipliers.

```
                  [ Player Places Bet ($1.00) ]
                                |
                   Step 1: Win Check (48.25%)
                   /                        \
           [ WIN (2.00x) ]             [ LOSS / BUST (0x) ]
                 |                         (Round Ends)
         Player Decision
          /           \
   [ CASH OUT ]    [ DOUBLE DOWN ]
   (Takes 2.00x)     (Rolls Step 2 Tier)
                          |
             +------------+------------+---------------+---------------+
             | (0.01%)    | (0.10%)    | (4.00%)       | (40.00%)      | (55.89%)
          Mythic      Legendary      Epic          Uncommon         Bust
         1000.00x      100.00x      10.00x          3.50x          0.00x
```

### 2.1 Step 1 Mechanics (The Bet)
* **Initial Bet**: Player wagers a specified amount (e.g., $1.00).
* **Step 1 Probability**: **48.25%** chance to win.
* **Outcome on Loss**: Player loses the initial wager; round terminates immediately.
* **Outcome on Win**: Wager value instantly doubles to **2.00x**. Player moves to Step 2.

### 2.2 Step 2 Mechanics (The Choice)
Upon winning Step 1, the player MUST select one of two actions:
1. **`Cash Out`**: End the round immediately and collect the 2.00x payout.
2. **`Double Down`**: Risk the 2.00x payout to reveal the pre-generated Step 2 Tier outcome.

### 2.3 Step 2 Tier Distribution Table
The probabilities for Step 2 tiers are evaluated out of the 48.25% of rounds that reach Step 2:

| Tier Name | Multiplier | Tier Probability (Step 2) | Effective Overall Probability | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Mythic** | **1000.00x** | **0.01%** | 0.004825% | Jackpot outcome; maximum win potential |
| **Legendary** | **100.00x** | **0.10%** | 0.048250% | High-tier mega win |
| **Epic** | **10.00x** | **4.00%** | 1.930000% | Mid-high tier win |
| **Uncommon** | **3.50x** | **40.00%** | 19.300000% | Base win tier |
| **Bust** | **0.00x** | **55.89%** | 26.966925% | Player risks 2.00x and loses everything |

---

## 3. Provably Fair RNG Architecture

Game outcomes are calculated using a cryptographically secure, deterministic Provably Fair algorithm based on **HMAC-SHA256**.

```javascript
const getProvablyFairResult = (serverSeed, clientSeed, nonce) => {
    const hmac = crypto.createHmac('sha256', serverSeed);
    const hash = hmac.update(`${clientSeed}-${nonce}`).digest('hex');
    const subHash = hash.substring(0, 8);
    const decimalValue = parseInt(subHash, 16);
    return decimalValue / 0xFFFFFFFF; // Returns float in range [0, 1)
};
```

### Pre-Generation Guarantee
To prevent post-bet manipulation:
1. When `POST /api/bet` is received, both **Step 1 (nonce 0)** and **Step 2 (nonce 1)** outcomes are generated and stored in Redis simultaneously.
2. The secret `serverSeed` is hashed and saved alongside the active round data (`req_123456...`).
3. Players and auditing entities can verify all historical rolls post-round by re-hashing the revealed `serverSeed` with `clientSeed` and `nonce`.

---

## 4. Completed Server Implementation & API Endpoints

The RGS is built with **Node.js**, **Express.js**, and **Redis** (`redis@4.x`), featuring environment configuration via `.env` and request logging via `morgan`.

### 4.1 Implemented Endpoints

#### `POST /api/bet`
* **Request**: `{ "clientSeed": "...", "betAmount": 1.00, "balance": 100.00 }`
* **Response (Win)**: `{ "round_id": "req_...", "step_1_outcome": "win", "current_multiplier": 2.00, "balance": 99.00 }`
* **Response (Loss)**: `{ "round_id": "req_...", "step_1_outcome": "lose", "current_multiplier": 0.00, "balance": 99.00 }`

#### `POST /api/doubledown`
* **Middleware**: `findActiveRound` (validates `round_id` and fetches state from Redis).
* **Request**: `{ "round_id": "req_...", "balance": 99.00 }`
* **Response**: `{ "round_id": "req_...", "step_2_tier": "Uncommon", "final_multiplier": 3.50, "amount_won": 3.50, "balance": 102.50 }`

#### `POST /api/cashout`
* **Request**: `{ "round_id": "req_...", "balance": 99.00 }`
* **Response**: `{ "message": "Cashed out successfully", "amount_won": 2.00, "balance": 101.00 }`

#### `GET /api/history/:roundId`
* **Purpose**: Fetches the permanent audit JSON record for a specific completed round ID.
* **Response**: Full JSON audit log containing seeds, bet, multiplier, payout, balance, and ISO timestamp.

#### `GET /api/history`
* **Purpose**: Fetches a list of the most recent completed game rounds for casino auditing and history tables.
* **Query Params**: `?limit=20` (default 20).
* **Response**: `{ "count": N, "history": [ ...array of round objects ] }`

---

## 5. Audit Logging & Real-Time Telemetry

To satisfy iGaming regulatory compliance:
1. **Permanent Redis Storage**: Every completed round is saved under `history:<roundId>` without expiration and pushed to `global_game_history`.
2. **Render Telemetry (`[GAME LOG]`)**: Every outcome writes structured stdout messages to the terminal console:
   ```text
   [GAME LOG] Round req_a1b2c3d4e5 | Action: BET_STEP1_WIN | Outcome: WIN (2.00x) | Bet: $1.00 | New Balance: $99.00
   [GAME LOG] Round req_a1b2c3d4e5 | Action: DOUBLE_DOWN | Outcome: Tier: Uncommon (3.5x) | Bet: $1.00 | Won: $3.50 | Final Balance: $102.50
   [GAME LOG] Round req_f6g7h8i9j0 | Action: BET_STEP1_LOSS | Outcome: lose | Bet: $1.00 | Won: $0.00 | Final Balance: $99.00
   ```

---

## 6. Automated Testing & Verification

The suite in `server.test.js` uses **Jest** and **Supertest** for full end-to-end integration testing.

```javascript
// Deterministic RNG testing using Jest spies
jest.spyOn(server, 'getProvablyFairResult');

// Force Step 1 WIN (roll < 0.4825) and Step 2 Uncommon (roll = 0.2)
server.getProvablyFairResult.mockReturnValueOnce(0.1);
server.getProvablyFairResult.mockReturnValueOnce(0.2);
```

* **Test Coverage**: Verifies balance calculation, state transitions in Redis, double-down outcomes, cash-out logic, and connection cleanup.

---

## 7. Deployment Configuration

* **Hosting Provider**: Render.com
* **Web Service**: Node 20+ instance running `node server.js`
* **Database**: Render Key-Value Store (Redis 7+)
* **Environment Variables**:
  * `PORT=3000` (or dynamic port provided by host)
  * `REDIS_URL=redis://...`

---

## 8. Next Steps & Roadmap for Gemini Web

When continuing development with **Gemini Web**, focus on the following core modules:

1. **Rich UI/UX & Animations**:
   * Build modern CSS/Canvas animations for the Step 1 outcome reveal.
   * Implement a dramatic "reel/wheel spin" animation for the Step 2 Double Down tier reveal (cycling through Mythic, Legendary, Epic, Uncommon, Bust).
2. **Audio & Sound Effects System**:
   * Add distinct audio triggers for Bet Placement, Step 1 Win, Bust, Double Down Reveal, and Tier Jackpot hits.
3. **Player History Component**:
   * Add a frontend UI widget that fetches `GET /api/history` and renders a live, scrollable table of past bets with provable fairness verification buttons.
4. **Casino Wallet Protocol Integration**:
   * Extend the RGS API contract to support seamless wallet integration (Debit/Credit callbacks) with seamless player authentication tokens.
