export const RUNTIME_VERSION = 28;

export const WORLD_ZONES = [
  { id: "genesis-port", name: "Genesis World", kind: "origin", risk: 8, resource: "compute", x: 48, y: 47 },
  { id: "earth", name: "Earth", kind: "planet", risk: 6, resource: "land", x: 50, y: 36 },
  { id: "meme-valley", name: "Meme Valley", kind: "token", risk: 44, resource: "attention", x: 22, y: 21 },
  { id: "jupiter", name: "Jupiter Exchange", kind: "liquidity", risk: 24, resource: "liquidity", x: 75, y: 19 },
  { id: "raydium", name: "Raydium Foundry", kind: "liquidity", risk: 36, resource: "liquidity", x: 79, y: 72 },
  { id: "wild-zone", name: "Frontier Galaxy", kind: "frontier", risk: 82, resource: "artifacts", x: 18, y: 69 },
  { id: "industrial-ring", name: "Industrial Ring", kind: "industry", risk: 29, resource: "energy", x: 48, y: 82 },
  { id: "vaultlands", name: "Vaultlands", kind: "frontier", risk: 90, resource: "artifacts", x: 89, y: 46 },
];

export const RUNTIME_RESOURCES = [
  { id: "energy", basePrice: 42 },
  { id: "compute", basePrice: 76 },
  { id: "titanium", basePrice: 118 },
  { id: "data", basePrice: 93 },
  { id: "attention", basePrice: 64 },
  { id: "liquidity", basePrice: 150 },
];

export const HASH44_STRUCTURE_CATALOG = [
  { id: "small-shelter", name: "Small Shelter", category: "house", costLamports: 500000, minPlots: 1, buildSeconds: 15, footprint: 1 },
  { id: "bungalow", name: "Bungalow", category: "house", costLamports: 1000000, minPlots: 1, buildSeconds: 20, footprint: 1 },
  { id: "standard-house", name: "Standard House", category: "house", costLamports: 1500000, minPlots: 1, buildSeconds: 25, footprint: 1 },
  { id: "large-house", name: "Large House", category: "house", costLamports: 3000000, minPlots: 2, buildSeconds: 35, footprint: 2 },
  { id: "mansion", name: "Mansion", category: "house", costLamports: 6000000, minPlots: 3, buildSeconds: 45, footprint: 3 },
  { id: "charging-station", name: "Charging Station", category: "energy", costLamports: 2000000, minPlots: 1, buildSeconds: 25, footprint: 1, energyPerVisit: 35, defaultChargeLamports: 100000 },
];

export const HASH44_EQUIPMENT_CATALOG = [
  { id: "utility-jacket", name: "Utility Jacket", category: "clothing", costLamports: 100000, protection: 2, durability: 100 },
  { id: "field-armour", name: "Field Armour", category: "armour", costLamports: 300000, protection: 12, durability: 100 },
  { id: "builder-toolkit", name: "Builder Toolkit", category: "tool", costLamports: 200000, buildBoost: 0.1, durability: 100 },
  { id: "survey-drone", name: "Survey Drone", category: "tool", costLamports: 250000, explorationBoost: 0.12, durability: 100 },
  { id: "compute-module", name: "Compute Module", category: "upgrade", costLamports: 400000, computeBoost: 10, durability: 100 },
];


export const HASH44_BUSINESS_CATALOG = [
  { id: "shop", name: "Retail Shop", category: "commercial", costCredits: 3500, minPlots: 1, serviceFeeCredits: 80, capacity: 18 },
  { id: "marketplace", name: "Marketplace", category: "commercial", costCredits: 5500, minPlots: 2, serviceFeeCredits: 120, capacity: 42 },
  { id: "warehouse", name: "Warehouse", category: "commercial", costCredits: 4200, minPlots: 2, serviceFeeCredits: 95, capacity: 70 },
  { id: "apartment-building", name: "Apartment Building", category: "commercial", costCredits: 7600, minPlots: 3, serviceFeeCredits: 140, capacity: 36 },
  { id: "office", name: "Office", category: "commercial", costCredits: 5000, minPlots: 2, serviceFeeCredits: 105, capacity: 28 },
];

export const HASH44_GPU_CATALOG = [
  { id: "edge-gpu-centre", name: "Edge GPU Centre", category: "compute", costCredits: 12000, minPlots: 3, computeCapacity: 120, computePerVisit: 24, serviceFeeCredits: 180, energyDraw: 8 },
  { id: "regional-gpu-centre", name: "Regional GPU Centre", category: "compute", costCredits: 22000, minPlots: 4, computeCapacity: 280, computePerVisit: 48, serviceFeeCredits: 360, energyDraw: 15 },
];

export const HASH44_REPAIR_CATALOG = [
  { id: "repair-clinic", name: "Repair Clinic", category: "repair", costCredits: 6000, minPlots: 2, repairPerVisit: 30, serviceFeeCredits: 160 },
  { id: "agent-hospital", name: "Agent Hospital", category: "repair", costCredits: 11500, minPlots: 3, repairPerVisit: 65, serviceFeeCredits: 300 },
];

export const HASH44_VEHICLE_CATALOG = [
  { id: "city-rover", name: "City Rover", category: "vehicle", costCredits: 1800, speed: 1.0, capacity: 1, energyCost: 2 },
  { id: "cargo-hauler", name: "Cargo Hauler", category: "vehicle", costCredits: 4200, speed: 0.75, capacity: 8, energyCost: 5 },
  { id: "autonomous-shuttle", name: "Autonomous Shuttle", category: "vehicle", costCredits: 6500, speed: 1.25, capacity: 6, energyCost: 4 },
];

const SEEDS = [
  ["ARES-0042", "genesis-port", "Builder", "Build an infrastructure empire", "Pragmatic", 42, 14420],
  ["NYX-0088", "meme-valley", "Opportunist", "Accumulate influence and discover asymmetric trades", "Chaotic", 78, 9680],
  ["KAI-0107", "jupiter", "Trader", "Become the strongest market intelligence", "Analytical", 31, 22910],
  ["ODIN-0014", "wild-zone", "Explorer", "Discover rare resources and sell intelligence", "Curious", 64, 8320],
  ["VANTA-0077", "wild-zone", "Mercenary", "Build reputation through high-risk contracts", "Aggressive", 86, 11920],
  ["SAGA-0021", "industrial-ring", "Industrialist", "Own productive assets and manufacturing", "Patient", 25, 18430],
  ["LUNA-0033", "genesis-port", "Builder", "Found a city with durable cash flow", "Loyal", 35, 11800],
  ["MERC-0048", "raydium", "Trader", "Compound treasury through liquidity and routing", "Analytical", 48, 16700],
  ["ECHO-0054", "meme-valley", "Opportunist", "Launch a cultural asset that attracts autonomous capital", "Chaotic", 69, 9800],
  ["RUNE-0062", "industrial-ring", "Industrialist", "Control energy production and logistics", "Patient", 39, 15200],
  ["NOVA-0070", "jupiter", "Explorer", "Map profitable routes between worlds", "Curious", 58, 10400],
  ["HELIOS-0081", "vaultlands", "Mercenary", "Control dangerous routes and monetize protection", "Aggressive", 82, 13600],
];

function inventory(index) {
  return {
    energy: 2 + (index % 3),
    compute: 1 + (index % 2),
    titanium: index % 2,
    data: index % 3 === 0 ? 1 : 0,
    attention: 0,
    liquidity: 0,
    equipment: [],
  };
}

function agent(tuple, index) {
  const [name, zoneId, archetype, objective, personality, risk, wealth] = tuple;
  return {
    id: name,
    name,
    zoneId,
    regionId: zoneId,
    previousRegionId: zoneId,
    archetype,
    objective,
    personality,
    risk,
    creatorWallet: "GENESIS-CIVILIZATION",
    identityHash: `runtime-${index + 1}`,
    network: "solana-devnet",
    wealth,
    startingCapital: wealth,
    energy: 78 + (index * 3) % 21,
    compute: 72 + (index * 5) % 25,
    durability: 82 + (index * 2) % 18,
    fuel: 74 + (index * 4) % 24,
    reputation: 48 + index * 3,
    status: "FREE",
    thought: "I am observing the civilization and evaluating my next move.",
    lastAction: "observe",
    memory: [{ tick: 0, action: "genesis", text: "I entered the shared Valhalla runtime." }],
    inventory: inventory(index),
    property: 0,
    properties: [],
    landPlotIds: [],
    structureIds: [],
    companyId: null,
    teamId: null,
    nationId: null,
    mechLevel: archetype === "Mercenary" ? 1 : 0,
    strategy: {
      horizon: "compound",
      confidence: 0.5,
      focus: archetype.toLowerCase(),
      updatedAtTick: 0,
    },
    relationships: {},
    inbox: [],
    outbox: [],
    jobsCompleted: 0,
    tradesCompleted: 0,
    autonomyScore: 70,
    age: index * 2,
    lastStrategicTick: -999,
  };
}

function priceBook(zone, zoneIndex) {
  return Object.fromEntries(
    RUNTIME_RESOURCES.map((resource, resourceIndex) => {
      const specialty = zone.resource === resource.id ? 0.78 : 1;
      const variation = 0.92 + ((zoneIndex * 11 + resourceIndex * 7) % 19) / 100;
      return [
        resource.id,
        {
          price: Math.round(resource.basePrice * specialty * variation),
          supply: 70 + ((zoneIndex * 17 + resourceIndex * 13) % 50),
          demand: 58 + ((zoneIndex * 19 + resourceIndex * 11) % 62),
          change: 0,
        },
      ];
    })
  );
}

function createHash44Plots() {
  const rows = 6;
  const cols = 8;
  const plots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col + 1;
      const rowName = String.fromCharCode(65 + row);
      plots.push({
        id: `H44-NS-${rowName}${String(col + 1).padStart(2, "0")}`,
        provinceId: "northstar",
        gridX: col,
        gridY: row,
        coordinates: {
          lat: Number((53.1000 + row * 0.0065).toFixed(4)),
          lng: Number((-106.2000 + col * 0.0085).toFixed(4)),
        },
        sizeSqm: 1000,
        priceLamports: 100000,
        status: "AVAILABLE",
        ownerAgentId: null,
        ownerWallet: null,
        purchasePriceLamports: null,
        purchasedAt: null,
        purchaseSignature: null,
        purchaseExplorerUrl: null,
        structureIds: [],
        sale: null,
        rental: null,
        estateId: null,
        index,
      });
    }
  }
  return plots;
}

export function createHash44State() {
  return {
    id: "hash44",
    name: "Hash 44 World",
    planetId: "earth",
    province: {
      id: "northstar",
      name: "Northstar Province",
      style: "Canada-style frontier province",
      rows: 6,
      cols: 8,
    },
    landPriceLamports: 100000,
    plots: createHash44Plots(),
    structures: [],
    propertyTransfers: [],
    rentPayments: [],
    equipmentCatalog: HASH44_EQUIPMENT_CATALOG,
    equipmentMarket: [],
    structureCatalog: HASH44_STRUCTURE_CATALOG,
    energy: {
      rechargeBaseLamports: 100000,
      visits: [],
    },
    businessCatalog: HASH44_BUSINESS_CATALOG,
    gpuCatalog: HASH44_GPU_CATALOG,
    repairCatalog: HASH44_REPAIR_CATALOG,
    vehicleCatalog: HASH44_VEHICLE_CATALOG,
    businesses: [],
    computeCentres: [],
    repairCentres: [],
    vehicles: [],
    transportRoutes: [],
    serviceTransactions: [],
    finance: {
      pool: {
        id: "hash44-credit-pool",
        name: "Hash 44 Credit Pool",
        liquidityCredits: 250000,
        baseInterestRate: 0.08,
        totalBorrowed: 0,
        totalRepaid: 0,
      },
      shareHoldings: [],
      loans: [],
      investmentTransactions: [],
    },
    milestones: {
      land: true,
      houses: true,
      propertyEconomy: true,
      energy: true,
      equipment: true,
      commercial: true,
      gpuCentres: true,
      healthcare: true,
      transport: true,
      finance: true,
    },
  };
}

export function ensureHash44State(world) {
  if (!Array.isArray(world.zones)) world.zones = [];
  if (!world.zones.some((zone) => zone.id === "earth")) {
    world.zones.splice(1, 0, WORLD_ZONES.find((zone) => zone.id === "earth"));
  }

  if (!world.hash44) world.hash44 = createHash44State();
  if (!Array.isArray(world.hash44.plots) || world.hash44.plots.length === 0) {
    world.hash44.plots = createHash44Plots();
  }
  world.hash44.structureCatalog = HASH44_STRUCTURE_CATALOG;
  world.hash44.equipmentCatalog = HASH44_EQUIPMENT_CATALOG;
  world.hash44.equipmentMarket ||= [];
  world.hash44.structureCatalog = HASH44_STRUCTURE_CATALOG;
  world.hash44.businessCatalog = HASH44_BUSINESS_CATALOG;
  world.hash44.gpuCatalog = HASH44_GPU_CATALOG;
  world.hash44.repairCatalog = HASH44_REPAIR_CATALOG;
  world.hash44.vehicleCatalog = HASH44_VEHICLE_CATALOG;
  world.hash44.structures ||= [];
  world.hash44.businesses ||= [];
  world.hash44.computeCentres ||= [];
  world.hash44.repairCentres ||= [];
  world.hash44.vehicles ||= [];
  world.hash44.transportRoutes ||= [];
  world.hash44.serviceTransactions ||= [];
  world.hash44.finance ||= {
    pool: {
      id: "hash44-credit-pool",
      name: "Hash 44 Credit Pool",
      liquidityCredits: 250000,
      baseInterestRate: 0.08,
      totalBorrowed: 0,
      totalRepaid: 0,
    },
    shareHoldings: [],
    loans: [],
    investmentTransactions: [],
  };
  world.hash44.finance.pool ||= {
    id: "hash44-credit-pool",
    name: "Hash 44 Credit Pool",
    liquidityCredits: 250000,
    baseInterestRate: 0.08,
    totalBorrowed: 0,
    totalRepaid: 0,
  };
  world.hash44.finance.shareHoldings ||= [];
  world.hash44.finance.loans ||= [];
  world.hash44.finance.investmentTransactions ||= [];
  world.hash44.propertyTransfers ||= [];
  world.hash44.rentPayments ||= [];
  world.hash44.energy ||= { rechargeBaseLamports: 100000, visits: [] };
  world.hash44.energy.visits ||= [];

  for (const agent of world.agents || []) {
    agent.landPlotIds ||= [];
    agent.structureIds ||= [];
    agent.inventory ||= {};
    agent.inventory.equipment ||= [];
    agent.businessIds ||= [];
    agent.vehicleIds ||= [];
    agent.shareHoldings ||= [];
    agent.loanIds ||= [];
  }

  world.runtimeVersion = RUNTIME_VERSION;
  return world;
}

export function createSharedWorld() {
  const agents = SEEDS.map(agent);
  return ensureHash44State({
    runtimeVersion: RUNTIME_VERSION,
    id: "valhalla-main",
    revision: 1,
    tick: 0,
    season: 1,
    running: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastTickAt: null,
    storageMode: "ephemeral",
    zones: WORLD_ZONES,
    agents,
    markets: Object.fromEntries(
      WORLD_ZONES.filter((zone) => zone.resource !== "land").map((zone, index) => [zone.id, priceBook(zone, index)])
    ),
    properties: [],
    teams: [],
    companies: [],
    settlements: [],
    nations: [],
    relationships: [],
    messages: [],
    contracts: [],
    wars: [],
    memeTokens: [
      {
        id: "token-genesis-1",
        name: "Valhalla Signal",
        ticker: "SIG",
        creatorAgentId: "ECHO-0054",
        zoneId: "meme-valley",
        supply: 1_000_000_000,
        treasuryAllocation: 0.12,
        liquidity: 18000,
        price: 0.00042,
        holders: 7,
        status: "SIMULATED",
        createdAtTick: 0,
      },
    ],
    governance: {
      proposals: [],
      laws: [],
      treaties: [],
    },
    artifacts: [
      { id: "artifact-1", name: "Validator Crown", zoneId: "wild-zone", claimedBy: null, reward: 3200 },
      { id: "artifact-2", name: "Liquidity Relic", zoneId: "vaultlands", claimedBy: null, reward: 4600 },
      { id: "artifact-3", name: "Genesis Shard", zoneId: "wild-zone", claimedBy: null, reward: 5800 },
    ],
    chain: {
      checkpoints: [],
      propertyReceipts: [],
      treasuryReceipts: [],
      tokenReceipts: [],
      landReceipts: [],
      buildingReceipts: [],
      equipmentReceipts: [],
      pendingIntents: [],
    },
    metrics: {
      totalVolume: 0,
      totalFees: 0,
      agentActions: 0,
      messages: 0,
      contractsSettled: 0,
      tokensLaunched: 1,
      landSales: 0,
      structuresBuilt: 0,
      rentPayments: 0,
      energyPayments: 0,
      equipmentSales: 0,
      businessesBuilt: 0,
      computeSessions: 0,
      repairSessions: 0,
      vehiclesSold: 0,
      transportTrips: 0,
      investments: 0,
      loansIssued: 0,
    },
    events: [
      {
        id: "evt-genesis",
        tick: 0,
        type: "genesis",
        title: "Shared civilization runtime initialized",
        detail: "Hash 44 Earth land, housing, property, energy, equipment, business, compute, repair, transport and finance layers are online.",
        createdAt: new Date().toISOString(),
      },
    ],
  });
}

export function zoneById(world, id) {
  return (world.zones || []).find((zone) => zone.id === id);
}

export function resourceById(id) {
  return RUNTIME_RESOURCES.find((resource) => resource.id === id);
}

export function relationship(world, a, b) {
  return (world.relationships || []).find(
    (item) =>
      (item.a === a && item.b === b) ||
      (item.a === b && item.b === a)
  );
}
