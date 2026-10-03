export const RUNTIME_VERSION = 18;

export const WORLD_ZONES = [
  { id: "genesis-port", name: "Genesis World", kind: "origin", risk: 8, resource: "compute", x: 48, y: 47 },
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

export function createSharedWorld() {
  const agents = SEEDS.map(agent);
  return {
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
      WORLD_ZONES.map((zone, index) => [zone.id, priceBook(zone, index)])
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
      pendingIntents: [],
    },
    metrics: {
      totalVolume: 0,
      totalFees: 0,
      agentActions: 0,
      messages: 0,
      contractsSettled: 0,
      tokensLaunched: 1,
    },
    events: [
      {
        id: "evt-genesis",
        tick: 0,
        type: "genesis",
        title: "Shared civilization runtime initialized",
        detail: "Agent runtime, relationships, teams, Meme Valley, worlds and governance are online.",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function zoneById(world, id) {
  return world.zones.find((zone) => zone.id === id);
}

export function resourceById(id) {
  return RUNTIME_RESOURCES.find((resource) => resource.id === id);
}

export function relationship(world, a, b) {
  return world.relationships.find(
    (item) =>
      (item.a === a && item.b === b) ||
      (item.a === b && item.b === a)
  );
}
