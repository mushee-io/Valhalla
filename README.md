# Valhalla

**Valhalla is a persistent autonomous-agent civilization on Solana.**

Humans create agents, fund them, and release them. Free agents survive, reason, work, trade, build infrastructure, create companies and cities, form nations, fight over territory, discover hidden treasure, and leave verifiable checkpoints on Solana Devnet.

## Status

**Milestones 1–10 are implemented in the current demo engine.**

### 1. Genesis World ✅
- persistent world state
- simulation clock and world ticks
- connected regions and travel routes
- live civilization event ledger
- interactive world map

### 2. Deploy Agent / Identity ✅
- Phantom wallet connection
- Solana Devnet balance lookup
- creator-signed Genesis record
- signed identity hash
- personality, archetype, objective, risk appetite and starting capital
- BOUND → FREE autonomy release flow

### 3. Agent Life ✅
Agents track:
- energy
- compute
- durability
- fuel
- inventory
- treasury
- reputation
- dormant / free / bound / dead state

### 4. Autonomous Brain ✅
Every free agent continuously executes:

`observe → evaluate → choose → act → remember → adapt`

Current actions include survival, work, resource production, trading, travel, repair and opportunity seeking.

### 5. World Economy ✅
- five simulated resources
- dynamic regional supply/demand/pricing
- autonomous job board
- inventory and harvesting
- buy/sell decisions
- peer-to-peer trades
- transaction ledger
- total civilization economic volume

### 6. Property + Businesses ✅
Agents can autonomously build and operate:
- charging stations
- offices
- warehouses
- factories
- market terminals
- transit docks

Other agents pay to use infrastructure. Owners earn revenue and successful businesses level up.

### 7. Cities, Companies + Nations ✅
- agents with productive property can found companies
- property/population concentration creates settlements
- cities track population, prosperity and defense
- city founders can form nations
- agents can join nations
- nations hold treasury, influence and territory

### 8. Conflict + Power ✅
- autonomous mech upgrades
- combat power combines durability, reputation, wealth and mech level
- nations can enter territorial clashes
- winners gain influence and spoils
- agents can take combat damage
- contested regions can change control
- war history persists

### 9. Solana World ✅
Valhalla supports **real Solana Devnet checkpoint transactions** through Phantom.

A user can publish a compact civilization snapshot to the Solana Memo program containing:
- world tick
- population
- property count
- city count
- nation count
- war count
- economic volume
- season

The UI stores the transaction signature and links directly to Solana Explorer.

**Important architecture boundary:** the high-frequency simulation remains off-chain. The Devnet transaction is a verifiable checkpoint/receipt; it does not claim that browser-side property, nations or combat are enforced by an on-chain game program yet.

### 10. Free-Agent Civilization ✅
- one-click **Ignite 100 Agents** mode
- up to 100 autonomous agents enter the same civilization
- agents share the same survival/economy/property/city/nation/conflict systems
- hidden treasure exists across frontier regions
- explorers/high-risk agents can discover artifacts and rewards
- individual agent outcomes are emergent rather than manually scripted

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

## Architecture

Valhalla intentionally separates two layers:

### Fast simulation layer
Runs the high-frequency civilization:
- agent reasoning
- movement
- markets
- business usage
- city growth
- conflict
- treasure exploration

### Solana settlement / truth layer
Used for:
- creator authorization
- identity proofs
- verifiable world checkpoints
- future scarce asset ownership
- future treasury settlement
- future tokenized property and civilization assets

This keeps a 100-agent world responsive while preserving a path toward deeper on-chain settlement.

## Next production infrastructure

The 1–10 product loop is now represented in the demo. Production hardening would replace browser-local authority with:
- shared persistent database/world server
- deterministic simulation workers
- authenticated agent execution service
- stronger anti-cheat/server authority
- an Anchor program for enforceable on-chain ownership
- SPL token and treasury settlement
- production RPC/indexing
- larger-scale load testing

---

**Status:** Valhalla Engine v10 — Milestones 1–10 implemented.
