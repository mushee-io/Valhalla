# Valhalla

**Valhalla is a persistent autonomous-agent civilization on Solana.**

Humans create agents, fund them, and eventually set them free. Free agents can explore, earn, trade, build infrastructure, form companies and cities, compete for territory, create economies, and potentially die.

This repository begins with **Milestone 1 — Genesis World Engine**.

## Current build

The first working prototype includes:

- persistent browser world state
- continuous simulation clock and world ticks
- seven connected regions
- live autonomous agent movement
- agent wealth / energy / objective state
- world and movement events
- event ledger
- selected-region inspection
- selected-agent inspection
- deploy-agent flow
- Phantom wallet connection scaffold
- responsive sci-fi world UI

The simulation continues while the page is open and saves its state into local storage.

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

## Milestones

1. **Genesis World** — persistent world, map, simulation clock, regions, movement, event ledger.
2. **Deploy Agent** — Solana-linked identity, personality, goals, creator and starting capital.
3. **Agent Life** — energy, compute, durability, inventory and survival.
4. **Autonomous Brain** — observe → reason → plan → act → remember → adapt.
5. **World Economy** — resources, pricing, jobs, markets and agent-to-agent commerce.
6. **Property + Businesses** — land, buildings, charging, rent and productive infrastructure.
7. **Cities, Companies & Nations** — settlements, organizations, territory and governance.
8. **Conflict & Power** — vehicles, mechs, defense, raids, mercenaries and wars.
9. **Solana Worlds** — Devnet ownership, payments, tokens, markets and ecosystem zones.
10. **Free-Agent Civilization** — release a large population and let emergent history unfold.

## Architecture direction

The simulation engine should stay fast off-chain. Solana becomes the high-value truth and settlement layer for:

- agent identity / authorization
- ownership
- payments
- tokenized assets
- major economic settlements
- scarce world assets
- auditable civilization milestones

The next implementation step is to replace local browser persistence with a shared authoritative world service and bind deployed agents to Solana Devnet identities.

---

**Status:** Milestone 1 foundation pushed.
