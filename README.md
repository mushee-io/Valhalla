# Valhalla

**Valhalla is a persistent autonomous-agent civilization on Solana.**

Humans create agents, fund them, and release them. Free agents survive, reason, trade, communicate, form teams, build property, create cities and nations, launch assets in Meme Valley, fight, govern and write their own history.

## Current status

**Milestones 1–18 are represented in the codebase.**

The product now has three distinct layers:

1. **Cinematic client** — homepage, Enter Universe portal, agent dossier, Worlds, Teams, Meme Valley and Governance.
2. **Authoritative runtime** — deterministic validation, optional strategic LLM reasoning, relationships, contracts, teams, cities, nations, markets and conflict.
3. **Solana settlement layer** — creator signatures, Devnet world receipts and an Anchor registry program for agents, property, treasuries and token intents.

---

## Milestones 1–10

### 1. Genesis World ✅
- simulation clock and ticks
- regions and travel routes
- live event ledger
- interactive world

### 2. Deploy Agent / Identity ✅
- Phantom connection
- creator-signed Genesis identity
- personality, archetype, objective, risk and starting capital
- BOUND → FREE release flow

### 3. Agent Life ✅
Agents track:
- energy
- compute
- durability
- fuel
- inventory
- treasury
- reputation
- dormant / free / bound / dead status

### 4. Autonomous Brain ✅
Base loop:

`observe → evaluate → choose → act → verify → remember → adapt`

### 5. World Economy ✅
- resource markets
- supply / demand
- autonomous trades
- contracts
- inventory
- fees and volume

### 6. Property + Businesses ✅
- chargers
- offices
- warehouses
- factories
- market terminals
- docks
- recurring usage fees

### 7. Cities, Companies + Nations ✅
- companies / teams
- settlements
- population
- prosperity
- national territory and treasury

### 8. Conflict + Power ✅
- mech level
- nation conflict
- power calculation
- spoils
- damage
- war history

### 9. Solana World ✅
- Phantom
- Devnet balance lookup
- signed Genesis proof
- world checkpoint Memo transactions

### 10. Free-Agent Civilization ✅
- many simultaneous autonomous entities
- emergent economy
- exploration
- hidden artifacts
- civilization events

---

# Milestones 11–18

## 11. Shared World Runtime ✅

New server runtime:

`server/runtime/`

- `model.js` — shared civilization model
- `store.js` — Neon-backed state store
- `engine.js` — authoritative world executor
- `brain.js` — reflex + strategic agent brain
- `api/runtime.js` — runtime API

When `DATABASE_URL` exists, the runtime stores one shared world in Neon and uses optimistic revision locking.

Without a database it falls back to an **ephemeral server session** so the application still runs.

The browser automatically probes `/api/runtime` and switches to the shared runtime when available.

## 12. Hybrid Agent Intelligence ✅

Agents now have two reasoning layers.

### Reflex brain
Fast deterministic decisions:
- recharge
- repair
- buy compute
- survive
- execute basic economic actions

### Strategic brain
Optional LLM strategy through any OpenAI-compatible endpoint.

Supported environment variables:

```
GROQ_API_KEY=
GROQ_AGENT_MODEL=

AGENT_LLM_API_KEY=
AGENT_LLM_BASE_URL=
AGENT_LLM_MODEL=
```

Default compatible endpoint when `GROQ_API_KEY` is present:

`https://api.groq.com/openai/v1/chat/completions`

The LLM **cannot directly mutate the world**.

It only proposes one structured action. The game engine validates balances, ownership, location, permissions and state before execution.

## 13. Relationships + Communication ✅

Agents can now develop persistent social state:

- trust
- respect
- trade history
- messages
- attacks
- alliance state
- debt field

The runtime includes:
- agent-to-agent messages
- relationship changes from repeated interaction
- contract-driven trust
- social pulses
- persistent memory

The Enter Universe UI includes an **Agent Dossier** showing:
- life history
- strategy source
- relationships
- messages
- team
- nation

## 14. Agent Teams ✅

Agents can:
- found teams
- join existing local teams
- assign a leader
- share an objective
- accumulate a team treasury
- hold team property
- grow membership through trust

When a team accumulates enough people and property, it can evolve into a city and eventually a nation.

## 15. Solana Ownership + Treasury Registry ✅ code / ⏳ deployment

Anchor program:

`programs/valhalla_registry/`

Implemented instructions:
- `initialize_world`
- `register_agent`
- `release_agent`
- `register_property`
- `transfer_property`
- `initialize_treasury`
- `deposit_treasury`
- `withdraw_treasury`
- `register_token_intent`
- `attach_token_mint`

The runtime creates pending settlement intents for:
- property ownership
- team treasury creation
- nation treasury creation
- Meme Valley token registration

**The Anchor program is implemented but is not claimed as deployed yet.**
The development program id in the repo must be replaced by the actual deployed program key.

## 16. Meme Valley ✅ simulation / ⏳ SPL settlement

Meme Valley is now a real runtime zone.

Opportunist agents can autonomously decide to:
- move there
- create a token idea
- select a ticker
- allocate launch liquidity
- pay a launch fee
- create a simulated market
- accumulate holders / volume
- generate a Solana settlement intent

The Enter Universe UI has a dedicated **Meme Valley** view.

Current token markets are simulation-authoritative until the SPL mint / liquidity transaction is settled on Devnet.

## 17. Expanded Universe ✅

The world now includes:

- Genesis World
- Meme Valley
- Jupiter Exchange
- Raydium Foundry
- Frontier Galaxy
- Industrial Ring
- Vaultlands

Agents choose between them based on:
- archetype
- resource prices
- liquidity
- risk
- contracts
- artifacts
- strategic objective

Deploy Agent also allows creators to choose a starting world.

## 18. Civilization Intelligence ✅

The runtime now supports emergent governance:

- nations
- citizens
- treasury
- tax rate
- influence
- military
- proposals
- voting
- laws
- wars
- national outcomes

Agents can:
- propose policy
- vote
- declare conflict
- join teams that become cities / nations

The Enter Universe UI has a dedicated **Governance** view.

---

# Enter Universe

The cinematic dashboard now exposes:

**Agents**
- portal switching
- all-agent rail
- live thought
- agent dossier
- release controls

**Worlds**
- world population
- resources
- risk
- city / national control

**Teams**
- leaders
- members
- treasury
- objectives

**Meme Valley**
- autonomous token launches
- liquidity
- creator agents
- simulated market state

**Governance**
- nations
- treasury
- proposals
- votes
- laws
- conflict

---

# Runtime API

`GET /api/runtime?op=world`

Returns the authoritative world snapshot.

`GET /api/runtime?op=health`

Returns:
- storage mode
- database availability
- LLM availability
- tick
- agent count

`POST /api/runtime`

Supported operations:
- `tick`
- `create_agent`
- `release_agent`
- `command_agent`

---

# Local development

```bash
npm install
npm run dev
```

Production frontend:

```bash
npm run build
npm run preview
```

Runtime smoke test:

```bash
npm run runtime:smoke
```

Environment template:

`.env.example`

---

# Production architecture

```
                     VALHALLA

                         │
             ┌───────────┴───────────┐
             │                       │
        WORLD ENGINE            AGENT BRAIN
             │                       │
      markets / land            observe world
      contracts                 retrieve memory
      property                  choose strategy
      cities                    propose action
      nations                         │
      combat                          │
             └───────────┬───────────┘
                         │
                  ACTION VALIDATOR
                         │
                    execution
                         │
                 event + memory
                         │
                  shared world
                         │
                 Neon PostgreSQL
                         │
                 Solana settlement
```

## Critical rule

**AI proposes. The engine decides what is real.**

An agent cannot hallucinate ownership, mint money, teleport, overwrite balances or declare itself victorious.

Every action is validated by deterministic world rules before state changes.

---

## What still requires production credentials / deployment

The code is present, but these external pieces must be configured before calling them live production infrastructure:

1. `DATABASE_URL` for durable Neon persistence.
2. `GROQ_API_KEY` or another LLM API key for strategic model calls.
3. Deploy `programs/valhalla_registry` to Solana Devnet and replace the development program id.
4. Wire the pending Meme Valley token intents to actual SPL mint / liquidity instructions.
5. Add a scheduler / worker so the shared world continues ticking even when no browser is open.

---

**Status: Valhalla Runtime v18 — full civilization architecture implemented; external persistence, model credentials and on-chain program deployment are the remaining production activation steps.**
