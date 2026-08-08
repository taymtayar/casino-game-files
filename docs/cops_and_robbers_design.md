# Cops & Robbers Slot Game - Design & Theme Specification

## 1. Overview & Core Theme
**Cops & Robbers** is a high-octane, heist-themed video slot game centering on a high-stakes vault break-in. Players follow a mastermind robber attempting to swipe rich loot while dodging relentless police officers and security alarms.

---

## 2. Symbol & Loot Hierarchy

### High-Paying Symbols (Loot & Characters)
1. **Robber (The Mastermind)**: Top-tier character symbol. High payout.
2. **Cop / Police Chief**: Secondary character symbol. Represents security / pursuit.
3. **Gold Bars (High Loot)**: Triple stacked solid gold bullion bars. High pay loot symbol.
4. **Diamond & Jewels (High Loot)**: Sparkly cut diamonds and luxury gem necklace. High pay loot symbol.
5. **Stacks of Cash (High Loot)**: Wrapped bundles of hundred-dollar bills. High pay loot symbol.

### Low-Paying Symbols (Equipment & Clues)
1. **Vault Lock / Safe Door**: Mechanical vault wheel.
2. **Police Siren / Alarm Light**: Flashing red/blue beacon.
3. **Handcuffs**: Heavy steel cuffs.
4. **Money Bag / Sack**: Canvas bag with dollar sign.

### Special Symbols
* **WILD (Police Badge & Vault Door)**: Substitutes for all regular pay symbols.
* **SCATTER (Police Car / Alarm Vault)**: Triggers the Heist & Pursuit Free Spins feature when 3 or more land.

---

## 3. Game Mechanics & Features

### Core Layout Options
* **Grid**: 5x3 or 5x4 Reels (Line or Ways based) or 7x7 Grid (Cluster Pays based).
* **Bet Levels**: Standard multi-currency bets with configurable coin values.

### Thematic Features (To Implement Cleanly)
1. **Loot Multipliers**:
   * Cash, Gold, and Jewelry symbols can randomly display multiplier badges during bonus features.
2. **Police Chase Free Spins**:
   * During Free Spins, Robber symbols collect landed Loot values on screen.
   * Cop symbols move along a pursuit track or clear low-paying symbols, increasing the global win multiplier (e.g. 2x, 3x, 5x, 10x).

---

## 4. Next Steps for Clean Rebuild
* Math SDK logic will be re-built clean using proven engine patterns (`0_0_lines` or `0_0_cluster`).
* Frontend UI will be re-constructed cleanly with proper PixiJS render components and state machines.
