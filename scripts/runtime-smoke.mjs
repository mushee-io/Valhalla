import { createSharedWorld } from "../server/runtime/model.js";
import {
  createAgentInWorld,
  releaseAgentInWorld,
  tickWorld,
} from "../server/runtime/engine.js";

let world = createSharedWorld();

if (!world.zones.some((zone) => zone.id === "jupiter")) {
  throw new Error("Jupiter world missing");
}
if (!world.zones.some((zone) => zone.id === "raydium")) {
  throw new Error("Raydium world missing");
}

const agent = createAgentInWorld(
  world,
  {
    name: "SMOKE",
    archetype: "Builder",
    objective: "Build test infrastructure",
    personality: "Pragmatic",
    risk: 40,
    wealth: 9000,
    zoneId: "genesis-port",
  },
  {
    creatorWallet: "SMOKE_WALLET",
    identityHash: "smoke",
    network: "solana-devnet",
  }
);

releaseAgentInWorld(world, agent.id, "SMOKE_WALLET");

for (let i = 0; i < 12; i += 1) {
  world.lastTickAt = null;
  world = await tickWorld(world, {
    allowLLM: false,
    maxStrategicAgents: 0,
  });
}

if (world.tick !== 12) {
  throw new Error(`Expected tick 12, got ${world.tick}`);
}

if (!world.metrics.agentActions) {
  throw new Error("No agent actions executed");
}

if (!world.agents.find((item) => item.id === agent.id)) {
  throw new Error("Created agent disappeared");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      tick: world.tick,
      agents: world.agents.length,
      teams: world.teams.length,
      properties: world.properties.length,
      tokens: world.memeTokens.length,
      actions: world.metrics.agentActions,
    },
    null,
    2
  )
);
