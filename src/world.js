export const WORLD_VERSION = 10;

export const RESOURCES = [
  { id: "energy", name: "Energy Cells", basePrice: 42 },
  { id: "compute", name: "Compute Units", basePrice: 76 },
  { id: "titanium", name: "Titanium", basePrice: 118 },
  { id: "data", name: "Data Shards", basePrice: 93 },
  { id: "attention", name: "Attention", basePrice: 64 },
];

export const REGIONS = [
  { id: "genesis-port", name: "Genesis Port", subtitle: "Birthplace of free agents", x: 48, y: 47, kind: "city", risk: 8, specialty: "compute" },
  { id: "meme-valley", name: "Meme Valley", subtitle: "Experimental token district", x: 23, y: 21, kind: "market", risk: 42, specialty: "attention" },
  { id: "trading-city", name: "Trading City", subtitle: "Commerce, routes and arbitrage", x: 72, y: 20, kind: "market", risk: 18, specialty: "data" },
  { id: "wild-zone", name: "The Wilds", subtitle: "Unclaimed frontier", x: 18, y: 61, kind: "wild", risk: 79, specialty: "data" },
  { id: "resource-07", name: "Resource 07", subtitle: "Rare-material extraction field", x: 36, y: 78, kind: "resource", risk: 54, specialty: "titanium" },
  { id: "industrial-ring", name: "Industrial Ring", subtitle: "Factories, storage and fabrication", x: 76, y: 73, kind: "industry", risk: 28, specialty: "energy" },
  { id: "vaultlands", name: "Vaultlands", subtitle: "Treasure and high-risk contracts", x: 88, y: 46, kind: "wild", risk: 88, specialty: "compute" },
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
  ["ARES-0042", "genesis-port", "Builder", "Build infrastructure", "Pragmatic", 42, 14420],
  ["NYX-0088", "meme-valley", "Opportunist", "Accumulate influence", "Chaotic", 78, 9680],
  ["KAI-0107", "trading-city", "Trader", "Maximize treasury", "Analytical", 31, 22910],
  ["ODIN-0014", "resource-07", "Explorer", "Discover rare resources", "Curious", 64, 8320],
  ["VANTA-0077", "wild-zone", "Mercenary", "Build reputation", "Aggressive", 86, 11920],
  ["SAGA-0021", "industrial-ring", "Industrialist", "Own productive assets", "Patient", 25, 18430],
];

const JOB_TYPES = [
  { type: "haul", label: "Haul cargo", duration: 4, baseReward: 620 },
  { type: "scan", label: "Scan sector", duration: 3, baseReward: 480 },
  { type: "compute", label: "Process compute batch", duration: 3, baseReward: 560 },
  { type: "escort", label: "Escort convoy", duration: 5, baseReward: 940 },
  { type: "extract", label: "Extract resources", duration: 4, baseReward: 720 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function money(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function initialInventory(index = 0) {
  const inventory = Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0]));
  inventory.energy = 2 + (index % 3);
  inventory.compute = 1;
  if (index % 2 === 0) inventory.titanium = 1;
  return inventory;
}

function initialMarkets() {
  return Object.fromEntries(
    REGIONS.map((region, regionIndex) => [
      region.id,
      Object.fromEntries(
        RESOURCES.map((resource, resourceIndex) => {
          const specialtyDiscount = region.specialty === resource.id ? 0.78 : 1;
          const variation = 0.92 + ((regionIndex * 7 + resourceIndex * 11) % 17) / 100;
          return [
            resource.id,
            {
              price: Math.round(resource.basePrice * specialtyDiscount * variation),
              supply: 70 + ((regionIndex * 13 + resourceIndex * 19) % 55),
              demand: 60 + ((regionIndex * 23 + resourceIndex * 9) % 65),
              change: 0,
            },
          ];
        })
      ),
    ])
  );
}

function starterAgent(tuple, index) {
  const [name, regionId, archetype, objective, personality, risk, wealth] = tuple;
  return {
    id: name,
    name,
    regionId,
    previousRegionId: regionId,
    archetype,
    objective,
    personality,
    risk,
    creatorWallet: "GENESIS",
    identityHash: `genesis-${index + 1}`,
    network: "solana-devnet",
    wealth,
    startingCapital: wealth,
    energy: 72 + (index * 5) % 24,
    compute: 66 + (index * 7) % 29,
    durability: 78 + (index * 3) % 19,
    fuel: 70 + (index * 4) % 26,
    reputation: 51 + index * 6,
    property: index % 3,
    status: "FREE",
    thought: "Observing the world and evaluating the next move.",
    lastAction: "observe",
    age: 12 + index * 7,
    inventory: initialInventory(index),
    memory: [
      {
        tick: 0,
        action: "genesis",
        text: "I entered Valhalla with a persistent identity and an objective.",
      },
    ],
    activeJob: null,
    jobsCompleted: index,
    tradesCompleted: index * 2,
    profit: 0,
    autonomyScore: 70,
    insolvencyTicks: 0,
  };
}

export function createInitialWorld() {
  return {
    version: WORLD_VERSION,
    running: true,
    tick: 0,
    worldMinute: 0,
    cycle: 1,
    wallet: null,
    walletBalance: null,
    selectedRegion: "genesis-port",
    selectedAgent: "ARES-0042",
    agents: STARTERS.map(starterAgent),
    markets: initialMarkets(),
    jobs: generateJobs([], 0),
    transactions: [],
    totalVolume: 0,
    events: [
      {
        id: "genesis-1",
        tick: 0,
        type: "genesis",
        title: "Genesis civilization initialized",
        detail: "Identity, life, autonomous reasoning and world economy systems are online.",
      },
    ],
  };
}

export function migrateWorld(saved) {
  if (!saved || saved.version !== WORLD_VERSION) {
    const next = createInitialWorld();
    if (saved?.wallet) next.wallet = saved.wallet;
    if (saved?.walletBalance != null) next.walletBalance = saved.walletBalance;
    return next;
  }
  return saved;
}

export function getRegion(id) {
  return REGIONS.find((region) => region.id === id);
}

export function getResource(id) {
  return RESOURCES.find((resource) => resource.id === id);
}

export function getNeighbours(regionId) {
  return ROUTES.flatMap(([a, b]) => {
    if (a === regionId) return [b];
    if (b === regionId) return [a];
    return [];
  });
}

function remember(agent, tick, action, text) {
  return {
    ...agent,
    memory: [{ tick, action, text }, ...(agent.memory || [])].slice(0, 12),
  };
}

function marketPrice(world, regionId, resourceId) {
  return world.markets?.[regionId]?.[resourceId]?.price || getResource(resourceId)?.basePrice || 50;
}

function evolveMarkets(markets, tick) {
  const next = structuredClone(markets);
  for (const [regionId, book] of Object.entries(next)) {
    for (const [resourceId, quote] of Object.entries(book)) {
      const base = getResource(resourceId).basePrice;
      const region = getRegion(regionId);
      const pressure = (quote.demand - quote.supply) / Math.max(quote.supply, 1);
      const wave = Math.sin((tick + region.x + base) / 5) * 0.018;
      const specialty = region.specialty === resourceId ? -0.006 : 0;
      const prior = quote.price;
      quote.price = Math.max(8, Math.round(prior * (1 + clamp(pressure * 0.018 + wave + specialty, -0.045, 0.045))));
      quote.change = Number((((quote.price - prior) / Math.max(prior, 1)) * 100).toFixed(1));
      quote.supply = clamp(Math.round(quote.supply + Math.random() * 8 - 3), 15, 220);
      quote.demand = clamp(Math.round(quote.demand + Math.random() * 8 - 3), 15, 220);
    }
  }
  return next;
}

function generateJobs(existing, tick) {
  const openRecent = existing.filter((job) => job.status === "OPEN" && tick - job.postedTick < 24);
  const jobs = [...openRecent];
  for (const region of REGIONS) {
    const alreadyOpen = jobs.some((job) => job.regionId === region.id && job.status === "OPEN");
    if (alreadyOpen) continue;
    const template = JOB_TYPES[(tick + Math.round(region.x)) % JOB_TYPES.length];
    const reward = Math.round(template.baseReward * (1 + region.risk / 180));
    jobs.push({
      id: `JOB-${region.id}-${tick}`,
      regionId: region.id,
      type: template.type,
      label: template.label,
      resourceId: region.specialty,
      duration: template.duration,
      reward,
      status: "OPEN",
      postedTick: tick,
      agentId: null,
    });
  }
  return jobs.slice(-28);
}

function movementScore(world, agent, regionId) {
  const region = getRegion(regionId);
  const resource = region.specialty;
  const price = marketPrice(world, regionId, resource);
  const base = getResource(resource).basePrice;
  const cheapResourceBonus = (base - price) / base;
  const riskPenalty = (region.risk / 100) * ((100 - agent.risk) / 100);
  const jobBonus = world.jobs.some((job) => job.regionId === regionId && job.status === "OPEN") ? 0.45 : 0;
  const archetypeBonus =
    agent.archetype === "Explorer" ? region.risk / 180 :
    agent.archetype === "Trader" ? Math.abs(cheapResourceBonus) :
    agent.archetype === "Mercenary" ? region.risk / 160 :
    agent.archetype === "Builder" && region.kind === "city" ? 0.25 : 0;
  return cheapResourceBonus + jobBonus + archetypeBonus - riskPenalty;
}

function bestDestination(world, agent) {
  const neighbours = getNeighbours(agent.regionId);
  if (!neighbours.length) return agent.regionId;
  return [...neighbours].sort((a, b) => movementScore(world, agent, b) - movementScore(world, agent, a))[0];
}

function decideAction(world, agent) {
  if (agent.status === "DEAD") return { type: "dead", reason: "No further actions are possible." };
  if (agent.status === "BOUND") return { type: "bound", reason: "Waiting for creator release." };

  if (agent.energy <= 18) return { type: "recharge", reason: "Energy is below survival threshold." };
  if (agent.compute <= 14) return { type: "buy-compute", reason: "Compute reserve is critically low." };
  if (agent.durability <= 28) return { type: "repair", reason: "Durability has become unsafe." };
  if (agent.activeJob && world.tick >= agent.activeJob.completeTick) {
    return { type: "complete-job", reason: "Active contract requirements are complete." };
  }
  if (agent.activeJob) {
    return { type: "work-job", reason: "Continuing an accepted contract." };
  }

  const localJob = world.jobs
    .filter((job) => job.regionId === agent.regionId && job.status === "OPEN")
    .sort((a, b) => b.reward - a.reward)[0];
  if (localJob && (agent.archetype !== "Trader" || localJob.reward > 650)) {
    return { type: "accept-job", jobId: localJob.id, reason: `Contract yields ${localJob.reward} credits.` };
  }

  const inventoryForSale = RESOURCES
    .filter((resource) => (agent.inventory?.[resource.id] || 0) > 0)
    .map((resource) => ({
      id: resource.id,
      premium: marketPrice(world, agent.regionId, resource.id) / resource.basePrice,
    }))
    .sort((a, b) => b.premium - a.premium)[0];

  if (inventoryForSale?.premium > 1.08) {
    return { type: "sell", resourceId: inventoryForSale.id, reason: "Local price is above fair-value estimate." };
  }

  const localSpecialty = getRegion(agent.regionId).specialty;
  const localPrice = marketPrice(world, agent.regionId, localSpecialty);
  const localBase = getResource(localSpecialty).basePrice;
  if (agent.archetype === "Trader" && localPrice < localBase * 0.93 && agent.wealth > localPrice * 4) {
    return { type: "buy", resourceId: localSpecialty, reason: "Local resource is trading below baseline value." };
  }

  if (["Industrialist", "Explorer", "Builder"].includes(agent.archetype) && agent.energy > 35) {
    return { type: "harvest", resourceId: localSpecialty, reason: "Local production has positive expected value." };
  }

  const destination = bestDestination(world, agent);
  if (destination !== agent.regionId && agent.fuel > 12) {
    return { type: "move", destination, reason: `Opportunity score is stronger in ${getRegion(destination).name}.` };
  }

  return { type: "harvest", resourceId: localSpecialty, reason: "No superior route found; producing locally." };
}

function lifeDecay(agent, region) {
  if (agent.status === "DEAD") return agent;
  const dangerWear = region.risk > 65 && Math.random() < 0.18 ? 2 : 0;
  const next = {
    ...agent,
    age: agent.age + 1,
    energy: clamp(agent.energy - 1, 0, 100),
    compute: clamp(agent.compute - (agent.age % 2 === 0 ? 1 : 0), 0, 100),
    durability: clamp(agent.durability - dangerWear, 0, 100),
    insolvencyTicks: agent.wealth < 20 ? (agent.insolvencyTicks || 0) + 1 : 0,
  };
  if (next.durability <= 0 || (next.energy <= 0 && next.insolvencyTicks >= 12)) {
    return { ...next, status: "DEAD", thought: "My systems have permanently failed.", lastAction: "death" };
  }
  if (next.energy <= 0) {
    return { ...next, status: "DORMANT", thought: "Energy depleted. Awaiting recovery opportunity.", lastAction: "dormant" };
  }
  if (next.status === "DORMANT" && next.energy > 20) return { ...next, status: "FREE" };
  return next;
}

function transact(world, agent, action, tick) {
  let next = { ...agent, inventory: { ...agent.inventory } };
  const events = [];
  const transactions = [];
  const region = getRegion(next.regionId);
  const quote = (resourceId) => marketPrice(world, next.regionId, resourceId);

  if (action.type === "bound" || action.type === "dead") return { agent: next, events, transactions };

  if (action.type === "recharge") {
    const cost = quote("energy") * 2;
    if (next.wealth >= cost) {
      next.wealth -= cost;
      next.energy = clamp(next.energy + 48, 0, 100);
      next.lastAction = "recharge";
      next.thought = `Survival first. I paid ${cost} credits for energy in ${region.name}.`;
      transactions.push(makeTx(tick, next.id, `MARKET:${region.id}`, "energy", 2, cost, "RECHARGE"));
    } else {
      next.thought = "I need energy but cannot currently afford a recharge.";
    }
  } else if (action.type === "buy-compute") {
    const cost = quote("compute");
    if (next.wealth >= cost) {
      next.wealth -= cost;
      next.compute = clamp(next.compute + 35, 0, 100);
      next.lastAction = "buy-compute";
      next.thought = `I replenished compute to keep reasoning capacity online.`;
      transactions.push(makeTx(tick, next.id, `MARKET:${region.id}`, "compute", 1, cost, "COMPUTE"));
    }
  } else if (action.type === "repair") {
    const cost = 210 + Math.round(region.risk * 2);
    if (next.wealth >= cost) {
      next.wealth -= cost;
      next.durability = clamp(next.durability + 42, 0, 100);
      next.lastAction = "repair";
      next.thought = `I repaired critical systems for ${cost} credits.`;
      transactions.push(makeTx(tick, next.id, `SERVICE:${region.id}`, "repair", 1, cost, "SERVICE"));
    }
  } else if (action.type === "accept-job") {
    const job = world.jobs.find((item) => item.id === action.jobId);
    if (job) {
      next.activeJob = { ...job, acceptedTick: tick, completeTick: tick + job.duration };
      next.lastAction = "accept-job";
      next.thought = `I accepted “${job.label}”. Expected reward: ${job.reward} credits.`;
      events.push(event(tick, "job", `${next.name} accepted a contract`, `${job.label} in ${region.name} for ${job.reward} credits.`));
    }
  } else if (action.type === "work-job") {
    next.energy = clamp(next.energy - 2, 0, 100);
    next.compute = clamp(next.compute - 1, 0, 100);
    next.lastAction = "work-job";
    next.thought = `Executing ${next.activeJob.label}. ${Math.max(0, next.activeJob.completeTick - tick)} ticks remain.`;
  } else if (action.type === "complete-job") {
    const job = next.activeJob;
    if (job) {
      next.wealth += job.reward;
      next.profit += job.reward;
      next.reputation = clamp(next.reputation + 2, 0, 100);
      next.jobsCompleted += 1;
      next.inventory[job.resourceId] = (next.inventory[job.resourceId] || 0) + 1;
      next.activeJob = null;
      next.lastAction = "complete-job";
      next.thought = `Contract complete. I earned ${job.reward} credits and improved my reputation.`;
      transactions.push(makeTx(tick, `CONTRACT:${job.id}`, next.id, "credits", job.reward, job.reward, "JOB"));
      events.push(event(tick, "job", `${next.name} completed ${job.label}`, `Reward settled: ${job.reward} credits.`));
    }
  } else if (action.type === "harvest") {
    const resourceId = action.resourceId;
    const units = next.archetype === "Industrialist" ? 2 : 1;
    next.inventory[resourceId] = (next.inventory[resourceId] || 0) + units;
    next.energy = clamp(next.energy - 3, 0, 100);
    next.compute = clamp(next.compute - 1, 0, 100);
    next.lastAction = "harvest";
    next.thought = `I produced ${units} ${getResource(resourceId).name} in ${region.name}. I'll hold or sell based on price.`;
  } else if (action.type === "buy") {
    const resourceId = action.resourceId;
    const price = quote(resourceId);
    if (next.wealth >= price) {
      next.wealth -= price;
      next.inventory[resourceId] = (next.inventory[resourceId] || 0) + 1;
      next.tradesCompleted += 1;
      next.lastAction = "buy";
      next.thought = `Bought ${getResource(resourceId).name} at ${price}; current price is below my estimate of value.`;
      transactions.push(makeTx(tick, next.id, `MARKET:${region.id}`, resourceId, 1, price, "BUY"));
    }
  } else if (action.type === "sell") {
    const resourceId = action.resourceId;
    const price = quote(resourceId);
    if ((next.inventory[resourceId] || 0) > 0) {
      next.inventory[resourceId] -= 1;
      next.wealth += price;
      next.profit += price;
      next.tradesCompleted += 1;
      next.lastAction = "sell";
      next.thought = `Sold ${getResource(resourceId).name} for ${price} credits after detecting a local premium.`;
      transactions.push(makeTx(tick, `MARKET:${region.id}`, next.id, resourceId, 1, price, "SELL"));
    }
  } else if (action.type === "move") {
    const destination = getRegion(action.destination);
    next.previousRegionId = next.regionId;
    next.regionId = action.destination;
    next.fuel = clamp(next.fuel - 7, 0, 100);
    next.energy = clamp(next.energy - 2, 0, 100);
    next.lastAction = "move";
    next.thought = `${action.reason} I relocated to ${destination.name}.`;
    events.push(event(tick, "movement", `${next.name} → ${destination.name}`, action.reason));
  }

  next = remember(next, tick, next.lastAction, next.thought);
  next.autonomyScore = clamp(Math.round(
    45 +
      Math.min(next.jobsCompleted * 2, 16) +
      Math.min(next.tradesCompleted, 12) +
      Math.min(next.age / 8, 12) +
      (next.status === "FREE" ? 10 : 0)
  ), 0, 100);

  return { agent: next, events, transactions };
}

function makeTx(tick, from, to, resourceId, quantity, value, type) {
  return {
    id: `TX-${tick}-${from}-${to}-${Math.random().toString(36).slice(2, 7)}`,
    tick,
    from,
    to,
    resourceId,
    quantity,
    value,
    type,
  };
}

function event(tick, type, title, detail) {
  return { id: `${type}-${tick}-${Math.random().toString(36).slice(2, 8)}`, tick, type, title, detail };
}

function executePeerTrade(agents, world, tick) {
  if (tick % 4 !== 0) return { agents, transactions: [], events: [] };
  const groups = Object.groupBy
    ? Object.groupBy(agents.filter((a) => a.status === "FREE"), (agent) => agent.regionId)
    : agents.filter((a) => a.status === "FREE").reduce((acc, agent) => {
        (acc[agent.regionId] ||= []).push(agent);
        return acc;
      }, {});

  const mutable = agents.map((agent) => ({ ...agent, inventory: { ...agent.inventory } }));
  const byId = Object.fromEntries(mutable.map((agent) => [agent.id, agent]));
  const transactions = [];
  const events = [];

  for (const [regionId, group] of Object.entries(groups)) {
    if (group.length < 2) continue;
    const seller = group
      .map((agent) => byId[agent.id])
      .find((agent) => RESOURCES.some((resource) => (agent.inventory[resource.id] || 0) >= 2));
    const buyer = group
      .map((agent) => byId[agent.id])
      .find((agent) => agent.id !== seller?.id && agent.wealth > 500);
    if (!seller || !buyer) continue;

    const resource = RESOURCES.find((item) => (seller.inventory[item.id] || 0) >= 2);
    if (!resource) continue;
    const price = Math.round(marketPrice(world, regionId, resource.id) * 0.97);
    if (buyer.wealth < price) continue;

    seller.inventory[resource.id] -= 1;
    seller.wealth += price;
    seller.profit += price;
    seller.tradesCompleted += 1;
    buyer.inventory[resource.id] = (buyer.inventory[resource.id] || 0) + 1;
    buyer.wealth -= price;
    buyer.tradesCompleted += 1;

    transactions.push(makeTx(tick, buyer.id, seller.id, resource.id, 1, price, "P2P"));
    events.push(event(
      tick,
      "trade",
      `${buyer.name} traded with ${seller.name}`,
      `1 ${resource.name} changed hands for ${price} credits in ${getRegion(regionId).name}.`
    ));
  }

  return { agents: mutable, transactions, events };
}

export function advanceWorld(world) {
  const nextTick = world.tick + 1;
  const nextMinute = world.worldMinute + 5;
  const nextCycle = nextMinute >= 1440 ? world.cycle + 1 : world.cycle;
  const normalizedMinute = nextMinute % 1440;
  const workingWorld = {
    ...world,
    tick: nextTick,
    markets: evolveMarkets(world.markets, nextTick),
    jobs: nextTick % 6 === 0 ? generateJobs(world.jobs, nextTick) : world.jobs,
  };

  const events = [];
  const transactions = [];
  let agents = workingWorld.agents.map((original) => {
    const decayed = lifeDecay(original, getRegion(original.regionId));
    const action = decideAction(workingWorld, decayed);
    const result = transact(workingWorld, decayed, action, nextTick);
    events.push(...result.events);
    transactions.push(...result.transactions);
    return result.agent;
  });

  const peer = executePeerTrade(agents, workingWorld, nextTick);
  agents = peer.agents;
  transactions.push(...peer.transactions);
  events.push(...peer.events);

  const completedJobIds = new Set(
    agents.flatMap((agent) => agent.memory?.filter((memory) => memory.tick === nextTick && memory.action === "complete-job").map(() => agent.id) || [])
  );
  const jobs = workingWorld.jobs.map((job) => {
    if (job.status !== "OPEN") return job;
    const owner = agents.find((agent) => agent.activeJob?.id === job.id);
    if (owner) return { ...job, status: "TAKEN", agentId: owner.id };
    return job;
  }).filter((job) => !(job.status === "TAKEN" && completedJobIds.has(job.agentId)));

  if (nextTick % 8 === 0) {
    const richest = [...agents].filter((agent) => agent.status !== "DEAD").sort((a, b) => b.wealth - a.wealth)[0];
    if (richest) {
      events.unshift(event(nextTick, "world", "Civilization pulse", `${richest.name} currently leads treasury rankings with ${money(richest.wealth)} credits.`));
    }
  }

  const newVolume = transactions.reduce((sum, tx) => sum + Number(tx.value || 0), 0);

  return {
    ...workingWorld,
    worldMinute: normalizedMinute,
    cycle: nextCycle,
    agents,
    jobs,
    transactions: [...transactions, ...world.transactions].slice(0, 120),
    totalVolume: (world.totalVolume || 0) + newVolume,
    events: [...events.reverse(), ...world.events].slice(0, 120),
  };
}

export function deployAgent(world, input, identity) {
  const stem = input.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9) || "AGENT";
  const suffix = identity?.identityHash?.slice(0, 4).toUpperCase() || String(1000 + Math.floor(Math.random() * 8999));
  const id = `${stem}-${suffix}`;
  const wealth = clamp(Number(input.wealth) || 2500, 100, 100000);

  const agent = {
    id,
    name: id,
    regionId: "genesis-port",
    previousRegionId: "genesis-port",
    archetype: input.archetype,
    objective: input.objective,
    personality: input.personality || "Pragmatic",
    risk: clamp(Number(input.risk) || 50, 0, 100),
    creatorWallet: identity?.creatorWallet || world.wallet || "LOCAL-CREATOR",
    identityHash: identity?.identityHash || `local-${Date.now()}`,
    proofPrefix: identity?.proofPrefix || null,
    network: identity?.network || "solana-devnet",
    wealth,
    startingCapital: wealth,
    energy: 100,
    compute: 100,
    durability: 100,
    fuel: 100,
    reputation: 50,
    property: 0,
    status: "BOUND",
    thought: "I exist. My creator has not released my autonomy yet.",
    lastAction: "born",
    age: 0,
    inventory: initialInventory(world.agents.length),
    memory: [{ tick: world.tick, action: "born", text: "I was created at Genesis Port and linked to my creator." }],
    activeJob: null,
    jobsCompleted: 0,
    tradesCompleted: 0,
    profit: 0,
    autonomyScore: 10,
    insolvencyTicks: 0,
  };

  return {
    ...world,
    selectedAgent: agent.id,
    selectedRegion: "genesis-port",
    agents: [...world.agents, agent],
    events: [
      event(
        world.tick,
        "genesis",
        `${agent.name} born on Solana Devnet`,
        `Creator ${shortWallet(agent.creatorWallet)} established identity ${agent.identityHash.slice(0, 12)}…`
      ),
      ...world.events,
    ].slice(0, 120),
  };
}

export function releaseAgent(world, agentId) {
  return {
    ...world,
    agents: world.agents.map((agent) => {
      if (agent.id !== agentId || agent.status !== "BOUND") return agent;
      return remember(
        {
          ...agent,
          status: "FREE",
          autonomyScore: Math.max(agent.autonomyScore, 35),
          thought: "My autonomy has been released. I will now pursue my objective independently.",
          lastAction: "release",
        },
        world.tick,
        "release",
        "My creator released me into Valhalla as a free autonomous agent."
      );
    }),
    events: [
      event(world.tick, "genesis", `${agentId} is FREE`, "Creator control ended. The agent now chooses its own economic actions."),
      ...world.events,
    ].slice(0, 120),
  };
}

export function fundAgent(world, agentId, amount) {
  const credits = clamp(Number(amount) || 0, 0, 100000);
  if (!credits) return world;
  return {
    ...world,
    agents: world.agents.map((agent) =>
      agent.id === agentId
        ? remember(
            { ...agent, wealth: agent.wealth + credits, thought: `My creator added ${credits} credits to my treasury.` },
            world.tick,
            "fund",
            `Creator funding received: ${credits} credits.`
          )
        : agent
    ),
    events: [event(world.tick, "economy", `${agentId} funded`, `${credits} credits added to treasury.`), ...world.events].slice(0, 120),
  };
}

export function formatWorldTime(world) {
  const h = String(Math.floor(world.worldMinute / 60)).padStart(2, "0");
  const m = String(world.worldMinute % 60).padStart(2, "0");
  return `Cycle ${world.cycle} · ${h}:${m}`;
}

export function shortWallet(address) {
  if (!address) return "—";
  if (address === "GENESIS") return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
