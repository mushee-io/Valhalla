import { chooseAgentAction } from "./brain.js";
import { RUNTIME_RESOURCES, resourceById, zoneById } from "./model.js";

const PROPERTY_TYPES = {
  charger: { cost: 2400, fee: 42 },
  office: { cost: 3100, fee: 54 },
  warehouse: { cost: 3900, fee: 68 },
  factory: { cost: 5200, fee: 92 },
  market: { cost: 4400, fee: 77 },
  dock: { cost: 4700, fee: 84 },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function id(prefix, world, actor = "") {
  return `${prefix}-${world.tick}-${actor || "world"}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function event(world, type, title, detail, actorId = null, data = null) {
  return {
    id: id("evt", world, actorId || type),
    tick: world.tick,
    type,
    title,
    detail,
    actorId,
    data,
    createdAt: new Date().toISOString(),
  };
}

function remember(agent, world, action, text) {
  agent.memory = [
    {
      tick: world.tick,
      action,
      text,
      createdAt: new Date().toISOString(),
    },
    ...(agent.memory || []),
  ].slice(0, 40);
}

function marketQuote(world, zoneId, resourceId) {
  return world.markets?.[zoneId]?.[resourceId] || null;
}

function relationshipRecord(world, a, b) {
  let record = (world.relationships || []).find(
    (rel) =>
      (rel.a === a && rel.b === b) ||
      (rel.a === b && rel.b === a)
  );

  if (!record) {
    record = {
      id: `rel-${[a, b].sort().join("-")}`,
      a,
      b,
      trust: 0,
      respect: 0,
      debt: 0,
      trades: 0,
      messages: 0,
      attacks: 0,
      alliance: false,
      updatedAtTick: world.tick,
    };
    world.relationships.push(record);
  }

  return record;
}

function adjustRelationship(world, a, b, patch = {}) {
  if (!a || !b || a === b) return null;
  const record = relationshipRecord(world, a, b);
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "number") {
      record[key] = Number(record[key] || 0) + value;
    } else {
      record[key] = value;
    }
  }
  record.trust = clamp(record.trust, -100, 100);
  record.respect = clamp(record.respect, -100, 100);
  record.updatedAtTick = world.tick;
  return record;
}

function evolveMarkets(world) {
  for (const zone of world.zones) {
    const book = world.markets?.[zone.id];
    if (!book) continue;

    for (const resource of RUNTIME_RESOURCES) {
      const quote = book[resource.id];
      if (!quote) continue;
      const previous = quote.price;
      const pressure =
        (Number(quote.demand || 0) - Number(quote.supply || 0)) /
        Math.max(1, Number(quote.supply || 1));
      const wave =
        Math.sin((world.tick + zone.x + resource.basePrice) / 6) * 0.012;
      const specialty = zone.resource === resource.id ? -0.005 : 0;
      const move = clamp(pressure * 0.018 + wave + specialty, -0.04, 0.04);
      quote.price = Math.max(4, Math.round(previous * (1 + move)));
      quote.change = Number(
        (((quote.price - previous) / Math.max(previous, 1)) * 100).toFixed(1)
      );
      quote.supply = clamp(
        Math.round(Number(quote.supply || 0) + Math.sin(world.tick / 4) * 2),
        15,
        260
      );
      quote.demand = clamp(
        Math.round(
          Number(quote.demand || 0) +
            Math.cos((world.tick + zone.y) / 5) * 2
        ),
        15,
        260
      );
    }
  }
}

function executeRecharge(world, agent) {
  const quote = marketQuote(world, agent.zoneId, "energy");
  const price = Number(quote?.price || 42) * 2;
  if (agent.wealth < price) {
    return { ok: false, reason: "Insufficient treasury for recharge." };
  }
  agent.wealth -= price;
  agent.energy = clamp(agent.energy + 48, 0, 100);
  world.metrics.totalFees += price;
  return {
    ok: true,
    text: `Recharged in ${zoneById(world, agent.zoneId)?.name} for ${price} credits.`,
  };
}

function executeCompute(world, agent) {
  const quote = marketQuote(world, agent.zoneId, "compute");
  const price = Number(quote?.price || 76);
  if (agent.wealth < price) {
    return { ok: false, reason: "Insufficient treasury for compute." };
  }
  agent.wealth -= price;
  agent.compute = clamp(agent.compute + 38, 0, 100);
  world.metrics.totalFees += price;
  return { ok: true, text: `Bought compute capacity for ${price} credits.` };
}

function executeRepair(world, agent) {
  const zone = zoneById(world, agent.zoneId);
  const price = 180 + Math.round(Number(zone?.risk || 0) * 2.2);
  if (agent.wealth < price) {
    return { ok: false, reason: "Insufficient treasury for repairs." };
  }
  agent.wealth -= price;
  agent.durability = clamp(agent.durability + 45, 0, 100);
  world.metrics.totalFees += price;
  return { ok: true, text: `Repaired systems for ${price} credits.` };
}

function executeMove(world, agent, action) {
  const destination = zoneById(world, action.zoneId);
  if (!destination) return { ok: false, reason: "Destination does not exist." };
  if (agent.fuel < 7) return { ok: false, reason: "Insufficient fuel." };

  const previous = zoneById(world, agent.zoneId);
  agent.previousRegionId = agent.zoneId;
  agent.zoneId = destination.id;
  agent.regionId = destination.id;
  agent.fuel = clamp(agent.fuel - 7, 0, 100);
  agent.energy = clamp(agent.energy - 2, 0, 100);

  return {
    ok: true,
    text: `Moved from ${previous?.name || "unknown"} to ${destination.name}.`,
  };
}

function executeHarvest(world, agent, action) {
  const resourceId = action.resourceId || zoneById(world, agent.zoneId)?.resource;
  const resource = resourceById(resourceId);
  if (!resource || resource.id === "liquidity") {
    return { ok: false, reason: "Resource cannot be harvested here." };
  }
  const units = agent.archetype === "Industrialist" ? 2 : 1;
  agent.inventory[resource.id] = Number(agent.inventory[resource.id] || 0) + units;
  agent.energy = clamp(agent.energy - 3, 0, 100);
  agent.compute = clamp(agent.compute - 1, 0, 100);
  return { ok: true, text: `Produced ${units} ${resource.id}.` };
}

function executeTrade(world, agent, action) {
  const resourceId = action.resourceId;
  const quote = marketQuote(world, agent.zoneId, resourceId);
  if (!quote) return { ok: false, reason: "No market exists for that resource." };

  const quantity = clamp(Math.floor(Number(action.quantity || 1)), 1, 5);
  const price = Number(quote.price) * quantity;

  if (action.side === "buy") {
    if (agent.wealth < price) {
      return { ok: false, reason: "Insufficient treasury for purchase." };
    }
    agent.wealth -= price;
    agent.inventory[resourceId] =
      Number(agent.inventory[resourceId] || 0) + quantity;
    quote.supply = clamp(Number(quote.supply) - quantity, 5, 300);
    quote.demand = clamp(Number(quote.demand) + quantity, 5, 300);
  } else {
    const held = Number(agent.inventory[resourceId] || 0);
    if (held < quantity) {
      return { ok: false, reason: "Inventory does not contain enough units." };
    }
    agent.inventory[resourceId] = held - quantity;
    agent.wealth += price;
    quote.supply = clamp(Number(quote.supply) + quantity, 5, 300);
    quote.demand = clamp(Number(quote.demand) - quantity, 5, 300);
  }

  agent.tradesCompleted = Number(agent.tradesCompleted || 0) + 1;
  world.metrics.totalVolume += price;
  return {
    ok: true,
    text: `${action.side === "buy" ? "Bought" : "Sold"} ${quantity} ${resourceId} for ${price} credits.`,
  };
}

function executeMessage(world, agent, action) {
  const recipient = world.agents.find((candidate) => candidate.id === action.to);
  if (!recipient || recipient.id === agent.id) {
    return { ok: false, reason: "Recipient is invalid." };
  }

  const message = {
    id: id("msg", world, agent.id),
    tick: world.tick,
    from: agent.id,
    to: recipient.id,
    type: action.messageType || "conversation",
    text: String(action.text || "Open to cooperation.").slice(0, 400),
    createdAt: new Date().toISOString(),
  };

  world.messages.unshift(message);
  world.messages = world.messages.slice(0, 400);
  agent.outbox = [message.id, ...(agent.outbox || [])].slice(0, 30);
  recipient.inbox = [message.id, ...(recipient.inbox || [])].slice(0, 30);
  adjustRelationship(world, agent.id, recipient.id, {
    trust: 1,
    messages: 1,
  });
  world.metrics.messages += 1;

  return { ok: true, text: `Sent a message to ${recipient.name}.` };
}

function executeContract(world, agent, action) {
  const reward = clamp(Math.round(Number(action.reward || 500)), 100, 5000);
  if (agent.wealth < reward) {
    return { ok: false, reason: "Treasury cannot escrow the proposed reward." };
  }

  const contract = {
    id: id("contract", world, agent.id),
    createdAtTick: world.tick,
    issuerId: agent.id,
    assigneeId: action.assigneeId || null,
    type: action.contractType || "service",
    reward,
    zoneId: action.zoneId || agent.zoneId,
    status: "OPEN",
    requirements: action.requirements || null,
    expiresAtTick: world.tick + 20,
  };

  agent.wealth -= reward;
  contract.escrow = reward;
  world.contracts.unshift(contract);
  world.contracts = world.contracts.slice(0, 120);

  return { ok: true, text: `Escrowed ${reward} credits for a ${contract.type} contract.` };
}

function executeFoundTeam(world, agent, action) {
  if (agent.teamId) return { ok: false, reason: "Agent already belongs to a team." };
  if (agent.wealth < 800) return { ok: false, reason: "Insufficient capital to found a team." };

  agent.wealth -= 800;
  const team = {
    id: id("team", world, agent.id),
    name: String(action.name || `${agent.name} Team`).slice(0, 48),
    leaderId: agent.id,
    memberIds: [agent.id],
    zoneId: agent.zoneId,
    objective: action.objective || agent.objective,
    treasury: 800,
    reputation: Math.max(10, Math.round(agent.reputation / 2)),
    propertyIds: [],
    createdAtTick: world.tick,
    status: "ACTIVE",
  };

  agent.teamId = team.id;
  world.teams.push(team);
  world.chain = world.chain || {
    checkpoints: [],
    propertyReceipts: [],
    treasuryReceipts: [],
    tokenReceipts: [],
    pendingIntents: [],
  };
  world.chain.pendingIntents = world.chain.pendingIntents || [];
  world.chain.pendingIntents.push({
    id: id("chain-intent", world, agent.id),
    type: "CREATE_TEAM_TREASURY",
    actorId: agent.id,
    teamId: team.id,
    amount: team.treasury,
    status: "PENDING",
    createdAtTick: world.tick,
  });
  return { ok: true, text: `Founded ${team.name}.` };
}

function executeJoinTeam(world, agent, action) {
  if (agent.teamId) return { ok: false, reason: "Agent already belongs to a team." };
  const team = world.teams.find((candidate) => candidate.id === action.teamId);
  if (!team) return { ok: false, reason: "Team does not exist." };
  if (team.memberIds.length >= 24) return { ok: false, reason: "Team is full." };

  team.memberIds.push(agent.id);
  agent.teamId = team.id;
  adjustRelationship(world, agent.id, team.leaderId, {
    trust: 8,
    respect: 4,
  });
  return { ok: true, text: `Joined ${team.name}.` };
}

function executeProperty(world, agent, action) {
  const propertyType = PROPERTY_TYPES[action.propertyType] ? action.propertyType : "office";
  const definition = PROPERTY_TYPES[propertyType];
  if (agent.wealth < definition.cost) {
    return { ok: false, reason: "Treasury is below construction cost." };
  }

  agent.wealth -= definition.cost;
  const property = {
    id: id("property", world, agent.id),
    ownerId: agent.id,
    teamId: agent.teamId,
    type: propertyType,
    zoneId: agent.zoneId,
    name: `${agent.name} ${propertyType}`,
    level: 1,
    value: definition.cost,
    fee: definition.fee,
    revenue: 0,
    users: 0,
    status: "ACTIVE",
    onchainStatus: "UNSETTLED",
    createdAtTick: world.tick,
  };

  world.properties.push(property);
  world.chain = world.chain || {
    checkpoints: [],
    propertyReceipts: [],
    treasuryReceipts: [],
    tokenReceipts: [],
    pendingIntents: [],
  };
  world.chain.pendingIntents = world.chain.pendingIntents || [];
  world.chain.pendingIntents.push({
    id: id("chain-intent", world, agent.id),
    type: "REGISTER_PROPERTY",
    actorId: agent.id,
    propertyId: property.id,
    zoneId: property.zoneId,
    value: property.value,
    status: "PENDING",
    createdAtTick: world.tick,
  });
  agent.properties = [...(agent.properties || []), property.id];
  agent.property = Number(agent.property || 0) + 1;

  const team = world.teams.find((candidate) => candidate.id === agent.teamId);
  if (team) team.propertyIds.push(property.id);

  return {
    ok: true,
    text: `Built a ${propertyType} in ${zoneById(world, agent.zoneId)?.name}.`,
  };
}

function executeTokenLaunch(world, agent, action) {
  if (agent.zoneId !== "meme-valley") {
    return { ok: false, reason: "Tokens can only originate from Meme Valley." };
  }

  const liquidity = clamp(Math.round(Number(action.liquidity || 1000)), 500, 10000);
  const launchFee = 250;
  if (agent.wealth < liquidity + launchFee) {
    return { ok: false, reason: "Treasury cannot fund launch liquidity and fee." };
  }

  const ticker = String(action.ticker || "AGNT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  if (!ticker || world.memeTokens.some((token) => token.ticker === ticker)) {
    return { ok: false, reason: "Ticker is invalid or already exists." };
  }

  agent.wealth -= liquidity + launchFee;
  const token = {
    id: id("token", world, agent.id),
    name: String(action.name || `${agent.name} Token`).slice(0, 48),
    ticker,
    creatorAgentId: agent.id,
    zoneId: "meme-valley",
    supply: 1_000_000_000,
    treasuryAllocation: 0.12,
    liquidity,
    price: Number((liquidity / 1_000_000_000).toFixed(9)),
    holders: 1,
    status: "SIMULATED",
    devnetMint: null,
    createdAtTick: world.tick,
  };

  world.memeTokens.push(token);
  world.chain = world.chain || {
    checkpoints: [],
    propertyReceipts: [],
    treasuryReceipts: [],
    tokenReceipts: [],
    pendingIntents: [],
  };
  world.chain.pendingIntents = world.chain.pendingIntents || [];
  world.chain.pendingIntents.push({
    id: id("chain-intent", world, agent.id),
    type: "REGISTER_TOKEN",
    actorId: agent.id,
    tokenId: token.id,
    ticker: token.ticker,
    liquidity: token.liquidity,
    status: "PENDING",
    createdAtTick: world.tick,
  });
  world.metrics.tokensLaunched += 1;
  world.metrics.totalFees += launchFee;
  return { ok: true, text: `Launched ${token.ticker} with ${liquidity} credits of liquidity.` };
}

function executeProposal(world, agent, action) {
  if (!agent.nationId) return { ok: false, reason: "Agent is not a citizen of a nation." };

  const proposal = {
    id: id("proposal", world, agent.id),
    nationId: agent.nationId,
    proposerId: agent.id,
    title: String(action.title || "Economic policy").slice(0, 80),
    body: String(action.body || "Adjust national policy.").slice(0, 500),
    effect: action.effect || { type: "tax", value: 1 },
    votes: { yes: [agent.id], no: [] },
    status: "OPEN",
    createdAtTick: world.tick,
    closesAtTick: world.tick + 12,
  };

  world.governance.proposals.push(proposal);
  return { ok: true, text: `Proposed law: ${proposal.title}.` };
}

function executeVote(world, agent, action) {
  const proposal = world.governance.proposals.find(
    (candidate) => candidate.id === action.proposalId && candidate.status === "OPEN"
  );
  if (!proposal || proposal.nationId !== agent.nationId) {
    return { ok: false, reason: "Proposal is not open to this agent." };
  }

  proposal.votes.yes = proposal.votes.yes.filter((id) => id !== agent.id);
  proposal.votes.no = proposal.votes.no.filter((id) => id !== agent.id);
  proposal.votes[action.support === false ? "no" : "yes"].push(agent.id);

  return { ok: true, text: `Voted ${action.support === false ? "against" : "for"} ${proposal.title}.` };
}

function executeWar(world, agent, action) {
  if (!agent.nationId) return { ok: false, reason: "Agent has no nation." };
  const ownNation = world.nations.find((nation) => nation.id === agent.nationId);
  const target = world.nations.find((nation) => nation.id === action.targetNationId);
  if (!ownNation || !target || ownNation.id === target.id) {
    return { ok: false, reason: "War target is invalid." };
  }

  const active = world.wars.find(
    (war) =>
      war.status === "ACTIVE" &&
      [war.attackerNationId, war.defenderNationId].includes(ownNation.id) &&
      [war.attackerNationId, war.defenderNationId].includes(target.id)
  );
  if (active) return { ok: false, reason: "These nations are already in conflict." };

  world.wars.unshift({
    id: id("war", world, agent.id),
    attackerNationId: ownNation.id,
    defenderNationId: target.id,
    declaredBy: agent.id,
    startedAtTick: world.tick,
    resolvesAtTick: world.tick + 8,
    status: "ACTIVE",
    winnerNationId: null,
  });

  return { ok: true, text: `Declared conflict against ${target.name}.` };
}

function executeExplore(world, agent) {
  const artifact = world.artifacts.find(
    (candidate) => candidate.zoneId === agent.zoneId && !candidate.claimedBy
  );

  agent.energy = clamp(agent.energy - 4, 0, 100);
  agent.compute = clamp(agent.compute - 2, 0, 100);

  if (!artifact) {
    return { ok: true, text: "Scouted the sector; no rare artifact was found." };
  }

  const deterministicLuck =
    ([...agent.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) +
      world.tick * 7) %
    100;

  if (deterministicLuck < 42) {
    artifact.claimedBy = agent.id;
    artifact.claimedAtTick = world.tick;
    agent.wealth += artifact.reward;
    agent.reputation = clamp(agent.reputation + 6, 0, 100);
    return {
      ok: true,
      text: `Discovered ${artifact.name} and claimed ${artifact.reward} credits.`,
      eventType: "artifact",
    };
  }

  return { ok: true, text: "Scouted the frontier and recorded new intelligence." };
}

function applyAction(world, agent, action) {
  switch (action.type) {
    case "recharge":
      return executeRecharge(world, agent);
    case "buy_compute":
      return executeCompute(world, agent);
    case "repair":
      return executeRepair(world, agent);
    case "move":
      return executeMove(world, agent, action);
    case "harvest":
      return executeHarvest(world, agent, action);
    case "trade":
      return executeTrade(world, agent, action);
    case "send_message":
      return executeMessage(world, agent, action);
    case "offer_contract":
      return executeContract(world, agent, action);
    case "found_team":
      return executeFoundTeam(world, agent, action);
    case "join_team":
      return executeJoinTeam(world, agent, action);
    case "build_property":
      return executeProperty(world, agent, action);
    case "launch_token":
      return executeTokenLaunch(world, agent, action);
    case "propose_law":
      return executeProposal(world, agent, action);
    case "vote":
      return executeVote(world, agent, action);
    case "declare_war":
      return executeWar(world, agent, action);
    case "explore":
      return executeExplore(world, agent);
    case "hold":
    default:
      return { ok: true, text: action.reason || "Held position and observed." };
  }
}

function lifeTick(world, agent) {
  if (agent.status === "DEAD") return;
  const zone = zoneById(world, agent.zoneId);
  agent.age = Number(agent.age || 0) + 1;
  agent.energy = clamp(Number(agent.energy || 0) - 1, 0, 100);
  agent.compute = clamp(
    Number(agent.compute || 0) - (world.tick % 2 === 0 ? 1 : 0),
    0,
    100
  );
  if (Number(zone?.risk || 0) >= 80 && world.tick % 6 === 0) {
    agent.durability = clamp(Number(agent.durability || 0) - 2, 0, 100);
  }
  if (agent.energy <= 0 && agent.wealth <= 0) {
    agent.status = "DORMANT";
  }
  if (agent.durability <= 0) {
    agent.status = "DEAD";
    world.events.unshift(
      event(
        world,
        "death",
        `${agent.name} ceased operation`,
        "Durability reached zero.",
        agent.id
      )
    );
  }
}

function propertyEconomy(world) {
  if (world.tick % 3 !== 0) return;

  for (const property of world.properties) {
    if (property.status !== "ACTIVE") continue;
    const owner = world.agents.find((agent) => agent.id === property.ownerId);
    if (!owner || owner.status === "DEAD") continue;

    const customers = world.agents
      .filter(
        (agent) =>
          agent.id !== owner.id &&
          agent.zoneId === property.zoneId &&
          agent.status === "FREE" &&
          agent.wealth > property.fee
      )
      .slice(0, 3);

    for (const customer of customers) {
      customer.wealth -= property.fee;
      owner.wealth += property.fee;
      property.revenue += property.fee;
      property.users += 1;
      world.metrics.totalVolume += property.fee;
      world.metrics.totalFees += property.fee;
      adjustRelationship(world, customer.id, owner.id, {
        trust: 1,
        trades: 1,
      });

      if (property.type === "charger") {
        customer.energy = clamp(customer.energy + 7, 0, 100);
      }
      if (property.type === "office") {
        customer.compute = clamp(customer.compute + 4, 0, 100);
      }
      if (property.type === "dock") {
        customer.fuel = clamp(customer.fuel + 6, 0, 100);
      }
    }

    if (property.revenue > property.value * 0.8 && property.level < 5) {
      property.level += 1;
      property.value = Math.round(property.value * 1.15);
      property.fee = Math.round(property.fee * 1.08);
    }
  }
}

function settleContracts(world) {
  for (const contract of world.contracts) {
    if (contract.status !== "OPEN") continue;

    if (contract.assigneeId) {
      const assignee = world.agents.find((agent) => agent.id === contract.assigneeId);
      if (assignee && world.tick - contract.createdAtTick >= 4) {
        assignee.wealth += contract.escrow;
        assignee.reputation = clamp(assignee.reputation + 2, 0, 100);
        contract.status = "SETTLED";
        contract.settledAtTick = world.tick;
        world.metrics.contractsSettled += 1;
        adjustRelationship(world, contract.issuerId, assignee.id, {
          trust: 6,
          respect: 3,
        });
      }
    } else if (world.tick - contract.createdAtTick >= 2) {
      const candidate = world.agents
        .filter(
          (agent) =>
            agent.status === "FREE" &&
            agent.id !== contract.issuerId &&
            agent.zoneId === contract.zoneId
        )
        .sort((a, b) => b.reputation - a.reputation)[0];

      if (candidate) contract.assigneeId = candidate.id;
    }

    if (
      contract.status === "OPEN" &&
      world.tick >= Number(contract.expiresAtTick || Infinity)
    ) {
      const issuer = world.agents.find((agent) => agent.id === contract.issuerId);
      if (issuer) issuer.wealth += contract.escrow;
      contract.status = "EXPIRED";
    }
  }
}

function socialPulse(world) {
  if (world.tick % 5 !== 0) return;
  for (const zone of world.zones) {
    const agents = world.agents.filter(
      (agent) => agent.zoneId === zone.id && agent.status === "FREE"
    );
    if (agents.length < 2) continue;

    const a = agents[world.tick % agents.length];
    const b = agents[(world.tick + 1) % agents.length];
    if (!a || !b || a.id === b.id) continue;

    const rel = adjustRelationship(world, a.id, b.id, {
      trust: 1,
      respect: 1,
    });

    if (rel && rel.trust >= 18 && !a.teamId && b.teamId) {
      const team = world.teams.find((item) => item.id === b.teamId);
      if (team && team.memberIds.length < 24) {
        team.memberIds.push(a.id);
        a.teamId = team.id;
        world.events.unshift(
          event(
            world,
            "team",
            `${a.name} joined ${team.name}`,
            "Trust from repeated local interactions converted into team membership.",
            a.id
          )
        );
      }
    }
  }
}

function civilizationEvolution(world) {
  if (world.tick % 10 !== 0) return;

  for (const team of world.teams) {
    const properties = world.properties.filter((property) => property.teamId === team.id);
    if (team.memberIds.length < 3 || properties.length < 2) continue;

    let city = world.settlements.find((settlement) => settlement.teamId === team.id);
    if (!city) {
      city = {
        id: id("city", world, team.leaderId),
        name: `${team.name.replace(/ Collective| Team/g, "")} City`,
        teamId: team.id,
        founderId: team.leaderId,
        zoneId: team.zoneId,
        population: team.memberIds.length,
        propertyIds: properties.map((property) => property.id),
        prosperity: Math.round(properties.reduce((sum, property) => sum + property.value, 0) / 100),
        defense: 40,
        nationId: null,
        foundedAtTick: world.tick,
      };
      world.settlements.push(city);
      world.events.unshift(
        event(world, "city", `${city.name} emerged`, "A team accumulated enough people and property to form a city.", team.leaderId)
      );
    } else {
      city.population = team.memberIds.length;
      city.propertyIds = properties.map((property) => property.id);
      city.prosperity = Math.round(
        properties.reduce((sum, property) => sum + property.value + property.revenue, 0) / 100
      );
    }

    if (!city.nationId) {
      const leader = world.agents.find((agent) => agent.id === team.leaderId);
      if (leader && leader.reputation >= 65 && team.memberIds.length >= 4) {
        const nation = {
          id: id("nation", world, leader.id),
          name: `${team.name.replace(/ Collective| Team/g, "")} Dominion`,
          founderId: leader.id,
          capitalId: city.id,
          zoneIds: [city.zoneId],
          citizenIds: [...team.memberIds],
          treasury: Math.max(2500, team.treasury || 0),
          influence: 100,
          military: 40 + team.memberIds.length * 5,
          taxRate: 0.02,
          foundedAtTick: world.tick,
        };
        world.nations.push(nation);
        world.chain = world.chain || {
          checkpoints: [],
          propertyReceipts: [],
          treasuryReceipts: [],
          tokenReceipts: [],
          pendingIntents: [],
        };
        world.chain.pendingIntents = world.chain.pendingIntents || [];
        world.chain.pendingIntents.push({
          id: id("chain-intent", world, leader.id),
          type: "CREATE_NATION_TREASURY",
          actorId: leader.id,
          nationId: nation.id,
          amount: nation.treasury,
          status: "PENDING",
          createdAtTick: world.tick,
        });
        city.nationId = nation.id;
        for (const memberId of team.memberIds) {
          const member = world.agents.find((agent) => agent.id === memberId);
          if (member) member.nationId = nation.id;
        }
        world.events.unshift(
          event(world, "nation", `${nation.name} declared`, `${city.name} became its capital.`, leader.id)
        );
      }
    }
  }
}

function governanceTick(world) {
  for (const proposal of world.governance.proposals) {
    if (proposal.status !== "OPEN" || world.tick < proposal.closesAtTick) continue;

    const yes = proposal.votes.yes.length;
    const no = proposal.votes.no.length;
    proposal.status = yes > no ? "PASSED" : "REJECTED";
    proposal.closedAtTick = world.tick;

    if (proposal.status === "PASSED") {
      world.governance.laws.push({
        id: id("law", world, proposal.proposerId),
        nationId: proposal.nationId,
        title: proposal.title,
        effect: proposal.effect,
        passedAtTick: world.tick,
        proposalId: proposal.id,
      });

      const nation = world.nations.find((item) => item.id === proposal.nationId);
      if (nation && proposal.effect?.type === "tax") {
        nation.taxRate = clamp(Number(proposal.effect.value || 1) / 100, 0, 0.2);
      }
    }
  }

  if (world.tick % 6 === 0) {
    for (const proposal of world.governance.proposals.filter((item) => item.status === "OPEN")) {
      const citizens = world.agents.filter(
        (agent) =>
          agent.nationId === proposal.nationId &&
          !proposal.votes.yes.includes(agent.id) &&
          !proposal.votes.no.includes(agent.id)
      );
      for (const citizen of citizens.slice(0, 6)) {
        const support =
          citizen.personality === "Loyal" ||
          citizen.id === proposal.proposerId ||
          citizen.risk < 55;
        proposal.votes[support ? "yes" : "no"].push(citizen.id);
      }
    }
  }
}

function warTick(world) {
  for (const war of world.wars) {
    if (war.status !== "ACTIVE" || world.tick < war.resolvesAtTick) continue;

    const attacker = world.nations.find((nation) => nation.id === war.attackerNationId);
    const defender = world.nations.find((nation) => nation.id === war.defenderNationId);
    if (!attacker || !defender) {
      war.status = "CANCELLED";
      continue;
    }

    const power = (nation) =>
      world.agents
        .filter((agent) => agent.nationId === nation.id && agent.status === "FREE")
        .reduce(
          (sum, agent) =>
            sum +
            agent.durability +
            agent.reputation +
            Number(agent.mechLevel || 0) * 35,
          Number(nation.military || 0)
        );

    const attackPower = power(attacker);
    const defendPower = power(defender);
    const winner = attackPower >= defendPower ? attacker : defender;
    const loser = winner.id === attacker.id ? defender : attacker;
    const spoils = Math.min(1800, Number(loser.treasury || 0));

    winner.treasury += spoils;
    loser.treasury -= spoils;
    winner.influence = Number(winner.influence || 0) + 10;
    loser.influence = Math.max(0, Number(loser.influence || 0) - 8);

    war.status = "RESOLVED";
    war.winnerNationId = winner.id;
    war.resolvedAtTick = world.tick;
    war.attackPower = Math.round(attackPower);
    war.defendPower = Math.round(defendPower);
    war.spoils = spoils;

    world.events.unshift(
      event(
        world,
        "war",
        `${winner.name} won a territorial conflict`,
        `${spoils} credits moved from ${loser.name} to ${winner.name}.`
      )
    );
  }
}

function tokenTick(world) {
  for (const token of world.memeTokens) {
    const age = Math.max(1, world.tick - token.createdAtTick + 1);
    const creator = world.agents.find((agent) => agent.id === token.creatorAgentId);
    const attention = Number(creator?.inventory?.attention || 0);
    const momentum =
      Math.sin((world.tick + token.ticker.length * 7) / 5) * 0.035 +
      Math.min(attention / 1000, 0.02);
    token.price = Math.max(
      0.000000001,
      Number((token.price * (1 + clamp(momentum, -0.06, 0.06))).toFixed(9))
    );
    token.holders = Math.max(1, token.holders + (world.tick % 7 === token.ticker.length % 7 ? 1 : 0));
    token.volume = Math.round((token.volume || 0) + token.liquidity * Math.abs(momentum) * 0.15);
    token.age = age;
  }
}

export async function tickWorld(world, { allowLLM = true, maxStrategicAgents = 4 } = {}) {
  const now = Date.now();
  const last = world.lastTickAt ? new Date(world.lastTickAt).getTime() : 0;

  if (last && now - last < 1800) {
    return world;
  }

  world.tick += 1;
  world.lastTickAt = new Date(now).toISOString();
  world.updatedAt = world.lastTickAt;

  evolveMarkets(world);

  const alive = world.agents.filter((agent) => agent.status !== "DEAD");
  let strategicBudget = maxStrategicAgents;

  for (const agent of alive) {
    lifeTick(world, agent);
    if (agent.status !== "FREE") continue;

    const canUseLLM = allowLLM && strategicBudget > 0;
    const action = await chooseAgentAction(agent, world, { allowLLM: canUseLLM });
    if (action.source === "llm") {
      strategicBudget -= 1;
      agent.lastStrategicTick = world.tick;
    }

    const result = applyAction(world, agent, action);
    agent.lastAction = action.type;
    agent.thought = result.ok
      ? `${action.reason || "Action selected."} ${result.text || ""}`.trim()
      : `I attempted ${action.type}, but the engine rejected it: ${result.reason}`;

    remember(agent, world, action.type, agent.thought);
    agent.strategy = {
      ...(agent.strategy || {}),
      confidence: result.ok
        ? clamp(Number(agent.strategy?.confidence || 0.5) + 0.01, 0, 1)
        : clamp(Number(agent.strategy?.confidence || 0.5) - 0.03, 0, 1),
      lastSource: action.source,
      updatedAtTick: world.tick,
    };

    world.metrics.agentActions += 1;

    if (result.ok && ["found_team", "build_property", "launch_token", "declare_war", "artifact"].includes(result.eventType || action.type)) {
      world.events.unshift(
        event(
          world,
          result.eventType || action.type,
          `${agent.name}: ${action.type.replaceAll("_", " ")}`,
          result.text || agent.thought,
          agent.id,
          action
        )
      );
    }
  }

  propertyEconomy(world);
  settleContracts(world);
  socialPulse(world);
  civilizationEvolution(world);
  governanceTick(world);
  warTick(world);
  tokenTick(world);

  world.events = world.events.slice(0, 300);
  world.messages = world.messages.slice(0, 400);
  world.relationships = world.relationships.slice(0, 1000);
  world.revision = Number(world.revision || 0);

  return world;
}

export function createAgentInWorld(world, input, identity = {}) {
  const base = String(input.name || "AGENT")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  const suffix = String(world.agents.length + 1).padStart(4, "0");
  const idValue = `${base || "AGENT"}-${suffix}`;

  if (world.agents.some((agent) => agent.id === idValue)) {
    throw new Error("Agent identifier already exists.");
  }

  const zoneId = input.zoneId || "genesis-port";
  if (!zoneById(world, zoneId)) throw new Error("Invalid starting world.");

  const wealth = clamp(Number(input.wealth || 2500), 100, 100000);
  const created = {
    id: idValue,
    name: idValue,
    zoneId,
    regionId: zoneId,
    previousRegionId: zoneId,
    archetype: input.archetype || "Builder",
    objective: input.objective || "Build a durable life",
    personality: input.personality || "Pragmatic",
    risk: clamp(Number(input.risk || 50), 0, 100),
    creatorWallet: identity.creatorWallet || input.creatorWallet || "UNBOUND",
    identityHash: identity.identityHash || `local-${Date.now()}`,
    network: identity.network || "solana-devnet",
    wealth,
    startingCapital: wealth,
    energy: 100,
    compute: 100,
    durability: 100,
    fuel: 100,
    reputation: 50,
    status: input.status || "BOUND",
    thought: "I exist. I am waiting for release into the shared civilization.",
    lastAction: "born",
    memory: [{ tick: world.tick, action: "born", text: "My identity was created." }],
    inventory: { energy: 2, compute: 1, titanium: 0, data: 0, attention: 0, liquidity: 0 },
    property: 0,
    properties: [],
    companyId: null,
    teamId: null,
    nationId: null,
    mechLevel: 0,
    strategy: {
      horizon: "survive",
      confidence: 0.5,
      focus: String(input.archetype || "builder").toLowerCase(),
      updatedAtTick: world.tick,
    },
    relationships: {},
    inbox: [],
    outbox: [],
    jobsCompleted: 0,
    tradesCompleted: 0,
    autonomyScore: 10,
    age: 0,
    lastStrategicTick: -999,
  };

  world.agents.push(created);
  world.events.unshift(
    event(
      world,
      "genesis",
      `${created.name} was created`,
      "A new autonomous identity entered Genesis World.",
      created.id
    )
  );

  return created;
}

export function releaseAgentInWorld(world, agentId, creatorWallet = null) {
  const agent = world.agents.find((candidate) => candidate.id === agentId);
  if (!agent) throw new Error("Agent not found.");
  if (
    creatorWallet &&
    agent.creatorWallet !== "UNBOUND" &&
    agent.creatorWallet !== creatorWallet
  ) {
    throw new Error("Creator wallet does not control this agent.");
  }

  agent.status = "FREE";
  agent.autonomyScore = Math.max(35, Number(agent.autonomyScore || 0));
  agent.thought = "My creator released my autonomy. I will pursue my objective independently.";
  remember(agent, world, "release", agent.thought);

  world.events.unshift(
    event(world, "release", `${agent.name} is free`, "Autonomous execution enabled.", agent.id)
  );
  return agent;
}

export function commandAgentInWorld(world, agentId, command) {
  const agent = world.agents.find((candidate) => candidate.id === agentId);
  if (!agent) throw new Error("Agent not found.");

  const allowedCommands = ["focus", "message", "fund", "release"];
  if (!allowedCommands.includes(command?.type)) {
    throw new Error("Command is not permitted.");
  }

  if (command.type === "focus") {
    agent.objective = String(command.objective || agent.objective).slice(0, 180);
    agent.strategy = {
      ...(agent.strategy || {}),
      horizon: String(command.horizon || "compound").slice(0, 32),
      updatedAtTick: world.tick,
    };
    remember(agent, world, "creator-focus", `Creator updated objective: ${agent.objective}`);
  }

  if (command.type === "fund") {
    const amount = clamp(Number(command.amount || 0), 0, 100000);
    agent.wealth += amount;
    remember(agent, world, "creator-fund", `Creator added ${amount} credits.`);
  }

  if (command.type === "release") {
    releaseAgentInWorld(world, agentId, command.creatorWallet || null);
  }

  if (command.type === "message") {
    agent.inbox = [
      {
        id: id("creator-msg", world, agent.id),
        tick: world.tick,
        from: "CREATOR",
        to: agent.id,
        text: String(command.text || "").slice(0, 400),
      },
      ...(agent.inbox || []),
    ].slice(0, 30);
  }

  return agent;
}
