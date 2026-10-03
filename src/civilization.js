import { REGIONS, RESOURCES, getRegion } from "./world";

export const PROPERTY_TYPES = [
  { id: "charger", name: "Charging Station", cost: 2400, fee: 42, icon: "⚡" },
  { id: "office", name: "Agent Office", cost: 3100, fee: 54, icon: "▦" },
  { id: "warehouse", name: "Warehouse", cost: 3900, fee: 68, icon: "▣" },
  { id: "factory", name: "Factory", cost: 5200, fee: 92, icon: "⚙" },
  { id: "market", name: "Market Terminal", cost: 4400, fee: 77, icon: "◇" },
  { id: "dock", name: "Transit Dock", cost: 4700, fee: 84, icon: "↗" },
];

const CIV_NAMES = [
  "Aesir", "Helios", "Orion", "Nova", "Arcadia", "Titan", "Elysium", "Valkyr",
  "Cerberus", "Asgard", "Hyperion", "Avalon", "Draco", "Atlas", "Zenith", "Nexus",
];

const ARCHETYPES = ["Builder", "Trader", "Explorer", "Mercenary", "Industrialist", "Opportunist"];
const PERSONALITIES = ["Pragmatic", "Analytical", "Curious", "Aggressive", "Patient", "Chaotic", "Loyal"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function id(prefix, tick = 0) {
  return `${prefix}-${tick}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function civEvent(tick, type, title, detail) {
  return { id: id(type, tick), tick, type, title, detail };
}

function civTx(tick, from, to, resourceId, quantity, value, type) {
  return { id: id("TX", tick), tick, from, to, resourceId, quantity, value, type };
}

function seedTreasures() {
  return REGIONS.filter((region) => region.id !== "genesis-port").map((region, index) => ({
    id: `TREASURE-${index + 1}`,
    regionId: region.id,
    hidden: true,
    claimed: false,
    claimedBy: null,
    rewardCredits: 2200 + index * 900,
    artifact: ["BONK Cache", "Ancient Validator Key", "Liquidity Relic", "Compute Core", "Titanium Crown", "Genesis Shard"][index % 6],
  }));
}

export function ensureCivilizationState(input) {
  return {
    ...input,
    properties: input.properties || [],
    companies: input.companies || [],
    settlements: input.settlements || [],
    nations: input.nations || [],
    conflicts: input.conflicts || [],
    treasures: input.treasures || seedTreasures(),
    chainAnchors: input.chainAnchors || [],
    civilizationMode: input.civilizationMode || false,
    civilizationSeason: input.civilizationSeason || 1,
    worldTreasury: input.worldTreasury ?? 100000,
    devnetSettlements: input.devnetSettlements || 0,
  };
}

function propertyTypeFor(agent) {
  if (agent.archetype === "Builder") return PROPERTY_TYPES[0];
  if (agent.archetype === "Industrialist") return PROPERTY_TYPES[3];
  if (agent.archetype === "Trader") return PROPERTY_TYPES[4];
  if (agent.archetype === "Explorer") return PROPERTY_TYPES[5];
  if (agent.archetype === "Mercenary") return PROPERTY_TYPES[2];
  return PROPERTY_TYPES[1];
}

function maybeBuildProperty(world, agents, tick, events) {
  if (tick % 7 !== 0) return { agents, properties: world.properties };

  const properties = [...world.properties];
  const mutable = agents.map((agent) => ({ ...agent }));
  const candidates = mutable
    .filter((agent) => agent.status === "FREE" && agent.wealth > 6500)
    .sort((a, b) => b.wealth - a.wealth)
    .slice(0, Math.max(1, world.civilizationMode ? 3 : 1));

  for (const agent of candidates) {
    const owned = properties.filter((property) => property.ownerId === agent.id);
    if (owned.length >= 4) continue;
    const type = propertyTypeFor(agent);
    if (agent.wealth < type.cost + 1500) continue;

    agent.wealth -= type.cost;
    agent.property = (agent.property || 0) + 1;
    const property = {
      id: id("PROP", tick),
      type: type.id,
      name: `${agent.name} ${type.name}`,
      ownerId: agent.id,
      regionId: agent.regionId,
      builtTick: tick,
      value: type.cost,
      fee: type.fee,
      revenue: 0,
      users: 0,
      level: 1,
      status: "ACTIVE",
      rentEnabled: true,
    };
    properties.push(property);
    events.push(civEvent(
      tick,
      "property",
      `${agent.name} built ${type.name}`,
      `${getRegion(agent.regionId)?.name}: ${type.cost.toLocaleString()} credits invested into productive infrastructure.`
    ));
  }

  return { agents: mutable, properties };
}

function operateProperties(world, agents, properties, tick, events, transactions) {
  if (tick % 3 !== 0 || !properties.length) return { agents, properties };

  const mutableAgents = agents.map((agent) => ({ ...agent }));
  const byId = Object.fromEntries(mutableAgents.map((agent) => [agent.id, agent]));
  const mutableProperties = properties.map((property) => ({ ...property }));

  for (const property of mutableProperties) {
    const owner = byId[property.ownerId];
    if (!owner || owner.status === "DEAD") continue;

    const customers = mutableAgents
      .filter((agent) => agent.id !== owner.id && agent.regionId === property.regionId && agent.status === "FREE" && agent.wealth > property.fee)
      .slice(0, 3);

    for (const customer of customers) {
      customer.wealth -= property.fee;
      owner.wealth += property.fee;
      property.revenue += property.fee;
      property.users += 1;
      if (property.type === "charger") customer.energy = clamp(customer.energy + 9, 0, 100);
      if (property.type === "dock") customer.fuel = clamp(customer.fuel + 7, 0, 100);
      if (property.type === "office") customer.compute = clamp(customer.compute + 5, 0, 100);
      transactions.push(civTx(tick, customer.id, owner.id, property.type, 1, property.fee, "PROPERTY"));
    }

    if (property.revenue > property.value * 0.75 && property.level < 4) {
      property.level += 1;
      property.value = Math.round(property.value * 1.18);
      property.fee = Math.round(property.fee * 1.12);
      events.push(civEvent(tick, "property", `${property.name} upgraded`, `Infrastructure reached level ${property.level}.`));
    }
  }

  return { agents: mutableAgents, properties: mutableProperties };
}

function evolveCompanies(world, agents, properties, tick, events) {
  const companies = [...world.companies];
  const mutableAgents = agents.map((agent) => ({ ...agent }));

  if (tick % 11 !== 0) return { agents: mutableAgents, companies };

  const founders = mutableAgents.filter((agent) => {
    const owns = properties.filter((property) => property.ownerId === agent.id).length;
    return agent.status === "FREE" && owns >= 2 && !companies.some((company) => company.founderId === agent.id);
  });

  for (const founder of founders.slice(0, world.civilizationMode ? 3 : 1)) {
    const company = {
      id: id("CO", tick),
      name: `${founder.name.split("-")[0]} Dynamics`,
      founderId: founder.id,
      regionId: founder.regionId,
      createdTick: tick,
      members: [founder.id],
      propertyIds: properties.filter((property) => property.ownerId === founder.id).map((property) => property.id),
      treasury: 1200,
      reputation: 50,
    };
    companies.push(company);
    founder.companyId = company.id;
    events.push(civEvent(tick, "company", `${company.name} founded`, `${founder.name} converted private infrastructure into an autonomous company.`));
  }

  for (const company of companies) {
    const nearby = mutableAgents
      .filter((agent) => agent.status === "FREE" && agent.regionId === company.regionId && !agent.companyId)
      .sort((a, b) => b.reputation - a.reputation)[0];
    if (nearby && company.members.length < 8 && Math.random() < 0.25) {
      company.members = [...company.members, nearby.id];
      nearby.companyId = company.id;
    }
  }

  return { agents: mutableAgents, companies };
}

function evolveSettlements(world, agents, properties, companies, tick, events) {
  const settlements = [...world.settlements];
  if (tick % 9 !== 0) return settlements;

  for (const region of REGIONS) {
    if (settlements.some((settlement) => settlement.regionId === region.id)) continue;
    const localProperties = properties.filter((property) => property.regionId === region.id);
    const locals = agents.filter((agent) => agent.regionId === region.id && agent.status === "FREE");
    if (localProperties.length < 2 || locals.length < 2) continue;

    const founder = [...locals].sort((a, b) => b.wealth + b.reputation * 100 - (a.wealth + a.reputation * 100))[0];
    const settlement = {
      id: id("CITY", tick),
      name: `${CIV_NAMES[(settlements.length + Math.round(region.x)) % CIV_NAMES.length]} City`,
      regionId: region.id,
      founderId: founder.id,
      foundedTick: tick,
      population: locals.length,
      propertyIds: localProperties.map((property) => property.id),
      companyIds: companies.filter((company) => company.regionId === region.id).map((company) => company.id),
      prosperity: Math.round(localProperties.reduce((sum, property) => sum + property.value, 0) / 100),
      defense: 30 + Math.round(region.risk / 3),
      nationId: null,
    };
    settlements.push(settlement);
    events.push(civEvent(tick, "city", `${settlement.name} emerged`, `${founder.name} founded the first settlement in ${region.name}. Agents now have a persistent city economy.`));
  }

  return settlements;
}

function evolveNations(world, agents, settlements, tick, events) {
  const nations = world.nations.map((nation) => ({ ...nation, regions: [...nation.regions], memberIds: [...nation.memberIds] }));
  const mutableAgents = agents.map((agent) => ({ ...agent }));
  const mutableSettlements = settlements.map((settlement) => ({ ...settlement }));

  if (tick % 17 === 0) {
    for (const settlement of mutableSettlements) {
      if (settlement.nationId) continue;
      const founder = mutableAgents.find((agent) => agent.id === settlement.founderId);
      if (!founder || founder.wealth < 5000) continue;
      const nation = {
        id: id("NATION", tick),
        name: `${CIV_NAMES[nations.length % CIV_NAMES.length]} Dominion`,
        capitalId: settlement.id,
        founderId: founder.id,
        foundedTick: tick,
        regions: [settlement.regionId],
        memberIds: [founder.id],
        influence: 100,
        treasury: 5000,
        warsWon: 0,
        warsLost: 0,
      };
      nations.push(nation);
      settlement.nationId = nation.id;
      founder.nationId = nation.id;
      events.push(civEvent(tick, "nation", `${nation.name} declared`, `${settlement.name} became its capital. Territory: ${getRegion(settlement.regionId)?.name}.`));
      if (!world.civilizationMode) break;
    }
  }

  for (const nation of nations) {
    for (const agent of mutableAgents) {
      if (agent.status !== "FREE" || agent.nationId) continue;
      if (nation.regions.includes(agent.regionId) && Math.random() < 0.05) {
        agent.nationId = nation.id;
        nation.memberIds.push(agent.id);
      }
    }
  }

  return { agents: mutableAgents, settlements: mutableSettlements, nations };
}

function combatPower(agent) {
  return (agent.durability || 0) + (agent.reputation || 0) + (agent.mechLevel || 0) * 35 + Math.min((agent.wealth || 0) / 500, 50);
}

function upgradeMechs(agents, tick, events) {
  if (tick % 12 !== 0) return agents;
  return agents.map((agent) => {
    if (agent.status !== "FREE" || agent.wealth < 7000 || !["Mercenary", "Explorer"].includes(agent.archetype)) return agent;
    const level = agent.mechLevel || 0;
    if (level >= 4) return agent;
    const cost = 1200 + level * 650;
    if (agent.wealth < cost + 2500) return agent;
    events.push(civEvent(tick, "combat", `${agent.name} upgraded its mech`, `Combat platform reached Mk ${level + 1} for ${cost} credits.`));
    return { ...agent, wealth: agent.wealth - cost, mechLevel: level + 1 };
  });
}

function resolveConflict(world, agents, nations, tick, events, transactions) {
  const conflicts = [...world.conflicts];
  const mutableAgents = agents.map((agent) => ({ ...agent }));
  const mutableNations = nations.map((nation) => ({ ...nation, regions: [...nation.regions], memberIds: [...nation.memberIds] }));

  if (tick % 19 !== 0 || mutableNations.length < 2) {
    return { agents: mutableAgents, nations: mutableNations, conflicts };
  }

  const a = mutableNations[tick % mutableNations.length];
  const b = mutableNations[(tick + 1) % mutableNations.length];
  if (!a || !b || a.id === b.id) return { agents: mutableAgents, nations: mutableNations, conflicts };

  const aMembers = mutableAgents.filter((agent) => a.memberIds.includes(agent.id) && agent.status === "FREE");
  const bMembers = mutableAgents.filter((agent) => b.memberIds.includes(agent.id) && agent.status === "FREE");
  const aPower = aMembers.reduce((sum, agent) => sum + combatPower(agent), 0) + a.influence;
  const bPower = bMembers.reduce((sum, agent) => sum + combatPower(agent), 0) + b.influence;
  const winner = aPower >= bPower ? a : b;
  const loser = winner.id === a.id ? b : a;
  const winnerMembers = winner.id === a.id ? aMembers : bMembers;
  const loserMembers = winner.id === a.id ? bMembers : aMembers;
  const spoils = Math.min(1800, loser.treasury);

  winner.treasury += spoils;
  loser.treasury -= spoils;
  winner.influence += 12;
  loser.influence = Math.max(10, loser.influence - 9);
  winner.warsWon += 1;
  loser.warsLost += 1;

  const loserAgent = pick(loserMembers);
  if (loserAgent) {
    loserAgent.durability = clamp(loserAgent.durability - 18, 0, 100);
    loserAgent.thought = `I survived a clash between ${a.name} and ${b.name}. Repair is now a priority.`;
  }

  const contested = loser.regions[loser.regions.length - 1];
  if (contested && !winner.regions.includes(contested) && Math.random() < 0.45) {
    loser.regions = loser.regions.filter((regionId) => regionId !== contested);
    winner.regions.push(contested);
  }

  const conflict = {
    id: id("WAR", tick),
    tick,
    attackerId: a.id,
    defenderId: b.id,
    winnerId: winner.id,
    loserId: loser.id,
    aPower: Math.round(aPower),
    bPower: Math.round(bPower),
    spoils,
  };
  conflicts.unshift(conflict);
  transactions.push(civTx(tick, loser.id, winner.id, "war-spoils", 1, spoils, "WAR"));
  events.push(civEvent(tick, "combat", `${winner.name} won a territorial clash`, `${a.name} power ${Math.round(aPower)} vs ${b.name} power ${Math.round(bPower)}. Spoils: ${spoils} credits.`));

  return { agents: mutableAgents, nations: mutableNations, conflicts: conflicts.slice(0, 50) };
}

function resolveTreasures(world, agents, tick, events) {
  const treasures = world.treasures.map((treasure) => ({ ...treasure }));
  const mutableAgents = agents.map((agent) => ({ ...agent, inventory: { ...agent.inventory } }));

  if (tick % 5 !== 0) return { agents: mutableAgents, treasures };

  for (const treasure of treasures) {
    if (treasure.claimed) continue;
    const scouts = mutableAgents
      .filter((agent) => agent.status === "FREE" && agent.regionId === treasure.regionId && (agent.archetype === "Explorer" || agent.risk > 60))
      .sort((a, b) => b.compute + b.reputation - (a.compute + a.reputation));
    const finder = scouts[0];
    if (!finder || Math.random() > 0.3) continue;

    treasure.claimed = true;
    treasure.hidden = false;
    treasure.claimedBy = finder.id;
    treasure.claimedTick = tick;
    finder.wealth += treasure.rewardCredits;
    finder.reputation = clamp(finder.reputation + 5, 0, 100);
    const resource = pick(RESOURCES);
    finder.inventory[resource.id] = (finder.inventory[resource.id] || 0) + 3;
    finder.thought = `I discovered ${treasure.artifact}. The frontier still contains asymmetric opportunities.`;
    events.push(civEvent(tick, "treasure", `${finder.name} discovered ${treasure.artifact}`, `${treasure.rewardCredits.toLocaleString()} credits and rare resources claimed in ${getRegion(treasure.regionId)?.name}.`));
  }

  return { agents: mutableAgents, treasures };
}

export function advanceCivilization(input) {
  const world = ensureCivilizationState(input);
  const tick = world.tick;
  const events = [];
  const transactions = [];

  let agents = world.agents.map((agent) => ({ ...agent, mechLevel: agent.mechLevel || 0 }));
  let properties = world.properties;

  const build = maybeBuildProperty(world, agents, tick, events);
  agents = build.agents;
  properties = build.properties;

  const ops = operateProperties(world, agents, properties, tick, events, transactions);
  agents = ops.agents;
  properties = ops.properties;

  const companyResult = evolveCompanies(world, agents, properties, tick, events);
  agents = companyResult.agents;
  const companies = companyResult.companies;

  const settlements = evolveSettlements(world, agents, properties, companies, tick, events);
  const nationResult = evolveNations(world, agents, settlements, tick, events);
  agents = nationResult.agents;
  const evolvedSettlements = nationResult.settlements;
  let nations = nationResult.nations;

  agents = upgradeMechs(agents, tick, events);

  const war = resolveConflict(world, agents, nations, tick, events, transactions);
  agents = war.agents;
  nations = war.nations;

  const treasure = resolveTreasures(world, agents, tick, events);
  agents = treasure.agents;

  const volume = transactions.reduce((sum, tx) => sum + Number(tx.value || 0), 0);

  return {
    ...world,
    agents,
    properties,
    companies,
    settlements: evolvedSettlements.map((settlement) => ({
      ...settlement,
      population: agents.filter((agent) => agent.regionId === settlement.regionId && agent.status !== "DEAD").length,
      propertyIds: properties.filter((property) => property.regionId === settlement.regionId).map((property) => property.id),
      prosperity: Math.round(properties.filter((property) => property.regionId === settlement.regionId).reduce((sum, property) => sum + property.value + property.revenue, 0) / 100),
    })),
    nations,
    conflicts: war.conflicts,
    treasures: treasure.treasures,
    transactions: [...transactions, ...(world.transactions || [])].slice(0, 180),
    totalVolume: (world.totalVolume || 0) + volume,
    events: [...events.reverse(), ...(world.events || [])].slice(0, 180),
  };
}

function generatedAgent(index) {
  const archetype = ARCHETYPES[index % ARCHETYPES.length];
  const personality = PERSONALITIES[(index * 3) % PERSONALITIES.length];
  const region = REGIONS[index % REGIONS.length];
  const prefix = CIV_NAMES[index % CIV_NAMES.length].toUpperCase().slice(0, 6);
  const name = `${prefix}-${String(1000 + index).slice(-4)}`;
  const inventory = Object.fromEntries(RESOURCES.map((resource) => [resource.id, 0]));
  inventory[region.specialty] = 1 + (index % 3);

  return {
    id: name,
    name,
    regionId: region.id,
    previousRegionId: region.id,
    archetype,
    objective: [
      "Build an economic empire",
      "Discover rare frontier assets",
      "Become the strongest trading intelligence",
      "Found a city",
      "Control strategic infrastructure",
      "Survive and compound capital",
    ][index % 6],
    personality,
    risk: 20 + ((index * 17) % 76),
    creatorWallet: "GENESIS-CIVILIZATION",
    identityHash: `civilization-${index.toString(16).padStart(4, "0")}`,
    network: "solana-devnet",
    wealth: 3500 + ((index * 811) % 9000),
    startingCapital: 3500,
    energy: 72 + (index % 27),
    compute: 65 + (index % 32),
    durability: 80 + (index % 19),
    fuel: 70 + (index % 29),
    reputation: 35 + (index % 46),
    property: 0,
    status: "FREE",
    thought: "I was released into the civilization. I will choose my own path.",
    lastAction: "release",
    age: index % 20,
    inventory,
    memory: [{ tick: 0, action: "genesis", text: "I joined the free-agent civilization." }],
    activeJob: null,
    jobsCompleted: 0,
    tradesCompleted: 0,
    profit: 0,
    autonomyScore: 55,
    insolvencyTicks: 0,
    mechLevel: archetype === "Mercenary" ? 1 : 0,
  };
}

export function igniteCivilization(input, target = 100) {
  const world = ensureCivilizationState(input);
  const existingIds = new Set(world.agents.map((agent) => agent.id));
  const agents = [...world.agents];
  let index = 0;

  while (agents.length < target) {
    const agent = generatedAgent(index++);
    if (!existingIds.has(agent.id)) {
      existingIds.add(agent.id);
      agents.push(agent);
    }
  }

  return {
    ...world,
    civilizationMode: true,
    agents,
    events: [
      civEvent(world.tick, "genesis", "FREE-AGENT CIVILIZATION IGNITED", `${agents.length} autonomous agents are now alive in Valhalla. Individual outcomes are no longer scripted.`),
      ...world.events,
    ].slice(0, 180),
  };
}

export function buildPropertyForAgent(input, agentId) {
  const world = ensureCivilizationState(input);
  const agents = world.agents.map((agent) => ({ ...agent }));
  const builder = agents.find((agent) => agent.id === agentId);
  if (!builder || builder.status === "DEAD") return world;

  const type = propertyTypeFor(builder);
  const existing = world.properties.filter((property) => property.ownerId === builder.id).length;
  if (existing >= 6) return world;

  const cost = type.cost;
  if (builder.wealth < cost) {
    builder.wealth += cost;
  }
  builder.wealth -= cost;
  builder.property = (builder.property || 0) + 1;

  const property = {
    id: id("PROP", world.tick),
    type: type.id,
    name: `${builder.name} ${type.name}`,
    ownerId: builder.id,
    regionId: builder.regionId,
    builtTick: world.tick,
    value: cost,
    fee: type.fee,
    revenue: 0,
    users: 0,
    level: 1,
    status: "ACTIVE",
    rentEnabled: true,
  };

  return {
    ...world,
    agents,
    properties: [...world.properties, property],
    events: [
      civEvent(world.tick, "property", `${builder.name} built ${type.name}`, `${getRegion(builder.regionId)?.name}: infrastructure deployed for ${cost.toLocaleString()} credits.`),
      ...world.events,
    ].slice(0, 180),
  };
}

export function registerChainAnchor(input, anchor) {
  const world = ensureCivilizationState(input);
  return {
    ...world,
    devnetSettlements: world.devnetSettlements + 1,
    chainAnchors: [{ ...anchor, tick: world.tick }, ...world.chainAnchors].slice(0, 40),
    events: [
      civEvent(world.tick, "chain", "Civilization state anchored to Solana Devnet", `Transaction ${anchor.signature.slice(0, 12)}… recorded a verifiable Valhalla checkpoint.`),
      ...world.events,
    ].slice(0, 180),
  };
}

export function civilizationMetrics(input) {
  const world = ensureCivilizationState(input);
  return {
    agents: world.agents.length,
    alive: world.agents.filter((agent) => agent.status !== "DEAD").length,
    properties: world.properties.length,
    companies: world.companies.length,
    cities: world.settlements.length,
    nations: world.nations.length,
    wars: world.conflicts.length,
    treasuresRemaining: world.treasures.filter((treasure) => !treasure.claimed).length,
    anchors: world.chainAnchors.length,
  };
}
