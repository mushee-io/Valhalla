export const REGIONS = [
  {
    id: "genesis-port",
    name: "Genesis Port",
    subtitle: "Birthplace of free agents",
    x: 48,
    y: 47,
    kind: "city",
    risk: 8,
    resource: "Compute",
    population: 18,
  },
  {
    id: "meme-valley",
    name: "Meme Valley",
    subtitle: "Experimental token district",
    x: 23,
    y: 21,
    kind: "market",
    risk: 42,
    resource: "Attention",
    population: 11,
  },
  {
    id: "trading-city",
    name: "Trading City",
    subtitle: "Commerce, routes and arbitrage",
    x: 72,
    y: 20,
    kind: "market",
    risk: 18,
    resource: "Liquidity",
    population: 24,
  },
  {
    id: "wild-zone",
    name: "The Wilds",
    subtitle: "Unclaimed frontier",
    x: 18,
    y: 61,
    kind: "wild",
    risk: 79,
    resource: "Artifacts",
    population: 4,
  },
  {
    id: "resource-07",
    name: "Resource 07",
    subtitle: "Rare-material extraction field",
    x: 36,
    y: 78,
    kind: "resource",
    risk: 54,
    resource: "Titanium",
    population: 8,
  },
  {
    id: "industrial-ring",
    name: "Industrial Ring",
    subtitle: "Factories, storage and fabrication",
    x: 76,
    y: 73,
    kind: "industry",
    risk: 28,
    resource: "Machinery",
    population: 15,
  },
  {
    id: "vaultlands",
    name: "Vaultlands",
    subtitle: "Treasure and high-risk contracts",
    x: 88,
    y: 46,
    kind: "wild",
    risk: 88,
    resource: "Unknown",
    population: 2,
  },
];

export const ROUTES = [
  ["genesis-port", "meme-valley"],
  ["genesis-port", "trading-city"],
  ["genesis-port", "wild-zone"],
  ["genesis-port", "resource-07"],
  ["genesis-port", "industrial-ring"],
  ["trading-city", "vaultlands"],
  ["industrial-ring", "vaultlands"],
  ["resource-07", "industrial-ring"],
  ["wild-zone", "resource-07"],
  ["meme-valley", "trading-city"],
];

const STARTERS = [
  ["ARES-0042", "genesis-port", "Builder", "Build infrastructure", 14420, 82],
  ["NYX-0088", "meme-valley", "Opportunist", "Accumulate influence", 9680, 71],
  ["KAI-0107", "trading-city", "Trader", "Maximize treasury", 22910, 90],
  ["ODIN-0014", "resource-07", "Explorer", "Discover rare resources", 8320, 68],
  ["VANTA-0077", "wild-zone", "Mercenary", "Build reputation", 11920, 75],
  ["SAGA-0021", "industrial-ring", "Industrialist", "Own productive assets", 18430, 87],
];

const PHRASES = {
  movement: [
    "identified a stronger opportunity and changed route",
    "left its previous sector to scout new economic activity",
    "rebalanced risk and moved to another region",
    "followed a profitable signal across the world",
  ],
  market: [
    "detected a pricing imbalance",
    "found rising demand for energy",
    "noticed declining transport capacity",
    "identified a temporary liquidity gap",
  ],
  world: [
    "A new resource pocket has appeared.",
    "Traffic increased across a major trade route.",
    "Compute prices shifted across the world.",
    "A frontier sector reported unusual activity.",
  ],
};

export function createInitialWorld() {
  return {
    version: 1,
    running: true,
    tick: 0,
    worldMinute: 0,
    cycle: 1,
    wallet: null,
    selectedRegion: "genesis-port",
    selectedAgent: "ARES-0042",
    agents: STARTERS.map(([name, regionId, archetype, objective, wealth, energy], i) => ({
      id: name,
      name,
      regionId,
      previousRegionId: regionId,
      archetype,
      objective,
      wealth,
      energy,
      reputation: 51 + i * 6,
      property: i % 3,
      status: "FREE",
      thought: "Observing the world and evaluating the next move.",
      age: 12 + i * 7,
    })),
    events: [
      {
        id: "genesis-1",
        tick: 0,
        type: "genesis",
        title: "Genesis cycle initialized",
        detail: "The first autonomous agents are active inside Valhalla.",
      },
    ],
  };
}

export function getRegion(id) {
  return REGIONS.find((region) => region.id === id);
}

export function getNeighbours(regionId) {
  return ROUTES.flatMap(([a, b]) => {
    if (a === regionId) return [b];
    if (b === regionId) return [a];
    return [];
  });
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function currency(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

export function advanceWorld(world) {
  const nextTick = world.tick + 1;
  const nextMinute = world.worldMinute + 5;
  const nextCycle = nextMinute >= 1440 ? world.cycle + 1 : world.cycle;
  const normalizedMinute = nextMinute % 1440;
  const newEvents = [];
  const moveNow = nextTick % 3 === 0;

  const agents = world.agents.map((agent, index) => {
    let next = {
      ...agent,
      age: agent.age + 1,
      energy: Math.max(5, agent.energy - (index % 2 === 0 ? 1 : 0)),
    };

    if (!moveNow || (nextTick + index) % 2 !== 0) return next;

    const neighbours = getNeighbours(agent.regionId);
    if (!neighbours.length) return next;

    const destination = pick(neighbours);
    const region = getRegion(destination);
    const marketSignal = pick(PHRASES.market);
    const earning = Math.round(140 + Math.random() * 760);
    const energyCost = Math.round(2 + Math.random() * 7);

    next = {
      ...next,
      previousRegionId: agent.regionId,
      regionId: destination,
      wealth: next.wealth + earning,
      energy: Math.max(5, next.energy - energyCost),
      thought: `${marketSignal} in ${region.name}. I will scout it before committing more capital.`,
    };

    newEvents.push({
      id: `${nextTick}-${agent.id}`,
      tick: nextTick,
      type: "movement",
      title: `${agent.name} → ${region.name}`,
      detail: `${agent.name} ${pick(PHRASES.movement)} and earned ${currency(earning)} credits en route.`,
    });

    return next;
  });

  if (nextTick % 5 === 0) {
    const region = pick(REGIONS);
    newEvents.unshift({
      id: `world-${nextTick}`,
      tick: nextTick,
      type: "world",
      title: `${region.name}: world event`,
      detail: pick(PHRASES.world),
    });
  }

  return {
    ...world,
    tick: nextTick,
    worldMinute: normalizedMinute,
    cycle: nextCycle,
    agents,
    events: [...newEvents, ...world.events].slice(0, 80),
  };
}

export function deployAgent(world, input) {
  const id = `${input.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "AGENT"}-${String(
    1000 + Math.floor(Math.random() * 8999)
  )}`;

  const agent = {
    id,
    name: id,
    regionId: "genesis-port",
    previousRegionId: "genesis-port",
    archetype: input.archetype,
    objective: input.objective,
    wealth: Number(input.wealth) || 2500,
    energy: 100,
    reputation: 50,
    property: 0,
    status: "BOUND",
    thought: "I have just entered Valhalla. I am mapping nearby opportunity before choosing my first move.",
    age: 0,
  };

  return {
    ...world,
    selectedAgent: agent.id,
    selectedRegion: "genesis-port",
    agents: [...world.agents, agent],
    events: [
      {
        id: `born-${Date.now()}`,
        tick: world.tick,
        type: "genesis",
        title: `${agent.name} deployed`,
        detail: `${agent.archetype} agent entered Genesis Port with objective: ${agent.objective}.`,
      },
      ...world.events,
    ].slice(0, 80),
  };
}

export function formatWorldTime(world) {
  const h = String(Math.floor(world.worldMinute / 60)).padStart(2, "0");
  const m = String(world.worldMinute % 60).padStart(2, "0");
  return `Cycle ${world.cycle} · ${h}:${m}`;
}
