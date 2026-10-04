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
  buildHash44BusinessInWorld,
  useHash44BusinessInWorld,
  buildHash44GpuCentreInWorld,
  useHash44GpuCentreInWorld,
  buildHash44RepairCentreInWorld,
  useHash44RepairCentreInWorld,
  buyHash44VehicleInWorld,
  createHash44TransportRouteInWorld,
  useHash44TransportRouteInWorld,
  investHash44BusinessInWorld,
  borrowHash44CreditsInWorld,
  repayHash44LoanInWorld,
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
    wealth: 100000,
    zoneId: "genesis-port",
  },
  {
    creatorWallet: "SMOKE_WALLET",
    identityHash: "smoke",
    network: "solana-devnet",
  }
);

releaseAgentInWorld(world, agent.id, "SMOKE_WALLET");

const ownedPlots = world.hash44.plots.slice(0, 7);
for (const plot of ownedPlots) {
  purchaseHash44LandInWorld(world, {
    agentId: agent.id,
    plotId: plot.id,
    wallet: "SMOKE_WALLET",
    signature: `smoke-land-${plot.id}`,
    explorerUrl: "https://example.invalid/smoke-land",
    blockTime: Math.floor(Date.now() / 1000),
    paidLamports: plot.priceLamports,
  });
}

if (ownedPlots.some((plot) => plot.ownerAgentId !== agent.id)) {
  throw new Error("Hash 44 land ownership failed");
}

buildHash44StructureInWorld(world, {
  agentId: agent.id,
  plotId: ownedPlots[6].id,
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
  plotId: ownedPlots[6].id,
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

const customer = createAgentInWorld(
  world,
  {
    name: "CUSTOMER",
    archetype: "Trader",
    objective: "Use Hash 44 services",
    personality: "Analytical",
    risk: 25,
    wealth: 25000,
    zoneId: "earth",
  },
  {
    creatorWallet: "CUSTOMER_WALLET",
    identityHash: "customer-smoke",
    network: "solana-devnet",
  }
);
releaseAgentInWorld(world, customer.id, "CUSTOMER_WALLET");

const business = buildHash44BusinessInWorld(world, {
  agentId: agent.id,
  plotId: ownedPlots[0].id,
  businessType: "shop",
  wallet: "SMOKE_WALLET",
});

useHash44BusinessInWorld(world, {
  agentId: customer.id,
  businessId: business.id,
  wallet: "CUSTOMER_WALLET",
});

const gpu = buildHash44GpuCentreInWorld(world, {
  agentId: agent.id,
  plotId: ownedPlots[1].id,
  centreType: "edge-gpu-centre",
  wallet: "SMOKE_WALLET",
});

useHash44GpuCentreInWorld(world, {
  agentId: customer.id,
  centreId: gpu.id,
  wallet: "CUSTOMER_WALLET",
});

const repair = buildHash44RepairCentreInWorld(world, {
  agentId: agent.id,
  plotId: ownedPlots[4].id,
  centreType: "repair-clinic",
  wallet: "SMOKE_WALLET",
});

customer.durability = 40;
useHash44RepairCentreInWorld(world, {
  agentId: customer.id,
  centreId: repair.id,
  wallet: "CUSTOMER_WALLET",
});

const vehicle = buyHash44VehicleInWorld(world, {
  agentId: agent.id,
  vehicleType: "city-rover",
  wallet: "SMOKE_WALLET",
});

const route = createHash44TransportRouteInWorld(world, {
  agentId: agent.id,
  vehicleId: vehicle.id,
  fromPlotId: ownedPlots[0].id,
  toPlotId: ownedPlots[6].id,
  wallet: "SMOKE_WALLET",
  fareCredits: 75,
});

useHash44TransportRouteInWorld(world, {
  agentId: customer.id,
  routeId: route.id,
  wallet: "CUSTOMER_WALLET",
});

investHash44BusinessInWorld(world, {
  agentId: customer.id,
  businessId: business.id,
  shares: 10,
  wallet: "CUSTOMER_WALLET",
});

const loan = borrowHash44CreditsInWorld(world, {
  agentId: agent.id,
  amountCredits: 1000,
  wallet: "SMOKE_WALLET",
});

repayHash44LoanInWorld(world, {
  agentId: agent.id,
  loanId: loan.id,
  wallet: "SMOKE_WALLET",
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
      businesses: world.hash44.businesses.length,
      computeCentres: world.hash44.computeCentres.length,
      repairCentres: world.hash44.repairCentres.length,
      vehicles: world.hash44.vehicles.length,
      routes: world.hash44.transportRoutes.length,
      holdings: world.hash44.finance.shareHoldings.length,
      repaidLoans: world.hash44.finance.loans.filter(
        (item) => item.status === "REPAID"
      ).length,
    },
    null,
    2
  )
);
