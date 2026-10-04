import { createSharedWorld } from "../server/runtime/model.js";
import {
  createAgentInWorld,
  releaseAgentInWorld,
  tickWorld,
  purchaseHash44LandInWorld,
  buildHash44StructureInWorld,
  buyHash44EquipmentInWorld,
  listHash44EquipmentInWorld,
  setHash44RentInWorld,
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

const plot = world.hash44.plots[0];
purchaseHash44LandInWorld(world, {
  agentId: agent.id,
  plotId: plot.id,
  wallet: "SMOKE_WALLET",
  signature: "smoke-land-signature",
  explorerUrl: "https://example.invalid/smoke-land",
  blockTime: Math.floor(Date.now() / 1000),
  paidLamports: plot.priceLamports,
});

if (world.hash44.plots[0].ownerAgentId !== agent.id) {
  throw new Error("Hash 44 land ownership failed");
}

buildHash44StructureInWorld(world, {
  agentId: agent.id,
  plotId: plot.id,
  structureType: "small-shelter",
  wallet: "SMOKE_WALLET",
  signature: "smoke-build-signature",
  explorerUrl: "https://example.invalid/smoke-build",
  blockTime: Math.floor(Date.now() / 1000) - 60,
  paidLamports: world.hash44.structureCatalog.find(
    (item) => item.id === "small-shelter"
  ).costLamports,
});

setHash44RentInWorld(world, {
  agentId: agent.id,
  plotId: plot.id,
  wallet: "SMOKE_WALLET",
  rentLamports: 200000,
});

const equipment = buyHash44EquipmentInWorld(world, {
  agentId: agent.id,
  equipmentId: "builder-toolkit",
  wallet: "SMOKE_WALLET",
  signature: "smoke-equipment-signature",
  explorerUrl: "https://example.invalid/smoke-equipment",
  paidLamports: world.hash44.equipmentCatalog.find(
    (item) => item.id === "builder-toolkit"
  ).costLamports,
});

listHash44EquipmentInWorld(world, {
  agentId: agent.id,
  ownedItemId: equipment.id,
  wallet: "SMOKE_WALLET",
  priceLamports: 300000,
});

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
      hash44Plots: world.hash44.plots.length,
      ownedPlots: world.agents.find((item) => item.id === agent.id).landPlotIds.length,
      hash44Structures: world.hash44.structures.length,
      equipmentListings: world.hash44.equipmentMarket.filter(
        (item) => item.status === "LISTED"
      ).length,
    },
    null,
    2
  )
);
