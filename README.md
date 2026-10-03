# Valhalla

**Valhalla is a persistent autonomous-agent civilization on Solana.**

Humans create agents, fund them, and release them. Free agents then survive, reason, explore, work, trade and build their own history inside a persistent world.

## Current status

**Milestones 1–5 are implemented in the demo engine.**

### 1. Genesis World
- persistent world state
- simulation clock and world ticks
- connected regions and travel routes
- live civilization event ledger
- agent map and inspection UI

### 2. Deploy Agent / Identity
- Phantom wallet connection
- Solana Devnet balance lookup
- creator-signed Genesis record
- agent identity hash derived from signed creation data
- personality, archetype, objective, risk appetite and starting capital
- agents begin as BOUND and can be released into autonomous status

The Genesis signature does **not** spend SOL. Current agent identity is a signed Devnet identity proof, not yet an on-chain PDA/account.

### 3. Agent Life
Agents now track:
- energy
- compute
- durability
- fuel
- inventory
- treasury
- reputation
- dormant / free / bound / dead state

Agents consume resources while operating and can recharge, repair, become dormant or die.

### 4. Autonomous Brain
Every free agent continuously runs an autonomous decision loop:

`observe → evaluate needs/opportunities → choose action → act → remember → adapt`

Current autonomous actions include:
- recharge
- buy compute
- repair
- accept contracts
- execute contracts
- harvest resources
- buy resources
- sell resources
- relocate to stronger opportunities
- peer-to-peer trading

Agents keep a rolling memory of their own actions and decisions.

### 5. World Economy
- five simulated resources
- region-specific markets
- dynamic supply, demand and prices
- autonomous contract/job board
- rewards and settlement ledger
- resource harvesting
- agent inventory
- buy/sell behavior
- peer-to-peer trades
- civilization transaction history
- total world economic volume

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Roadmap

1. **Genesis World** ✅
2. **Deploy Agent** ✅
3. **Agent Life** ✅
4. **Autonomous Brain** ✅
5. **World Economy** ✅
6. **Property + Businesses** — land, buildings, charging stations, rent and productive infrastructure.
7. **Cities, Companies & Nations** — settlements, organizations, territory and governance.
8. **Conflict & Power** — vehicles, mechs, defense, raids, mercenaries and wars.
9. **Solana Worlds** — deeper on-chain Devnet ownership, payments, token creation, markets and ecosystem zones.
10. **Free-Agent Civilization** — release a larger population and let emergent history unfold.

## Architecture

The high-frequency simulation stays off-chain. Solana is intended to become the high-value truth and settlement layer for:

- creator authorization
- autonomous-agent identity
- scarce property ownership
- payments and treasuries
- tokenized assets
- important economic settlement
- civilization milestones

The current M1–M5 demo uses browser persistence and simulated world credits/resources. Shared server persistence and deeper on-chain settlement are later infrastructure steps.

---

**Status:** Valhalla engine v5 — Milestones 1–5 implemented.
