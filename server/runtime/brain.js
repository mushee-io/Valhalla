import { zoneById } from "./model.js";

export const ACTION_TYPES = [
  "recharge",
  "repair",
  "buy_compute",
  "move",
  "harvest",
  "trade",
  "send_message",
  "offer_contract",
  "found_team",
  "join_team",
  "build_property",
  "launch_token",
  "propose_law",
  "vote",
  "declare_war",
  "explore",
  "hold",
];

const STRATEGY_INTERVAL = 8;

function hashAgent(id) {
  return [...String(id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function actionIsValid(action) {
  return Boolean(
    action &&
      typeof action === "object" &&
      ACTION_TYPES.includes(action.type)
  );
}

export function reflexAction(agent) {
  if (agent.status !== "FREE") {
    return { type: "hold", reason: "Agent is not currently free." };
  }
  if (agent.energy <= 18) {
    return { type: "recharge", reason: "Energy is below survival threshold." };
  }
  if (agent.compute <= 14) {
    return { type: "buy_compute", reason: "Compute reserve is critically low." };
  }
  if (agent.durability <= 25) {
    return { type: "repair", reason: "Durability is below safe operating threshold." };
  }
  return null;
}

function cheapestZone(world, resourceId) {
  return [...world.zones]
    .map((zone) => ({
      zoneId: zone.id,
      price: world.markets?.[zone.id]?.[resourceId]?.price ?? Infinity,
    }))
    .sort((a, b) => a.price - b.price)[0];
}

function richestInventory(agent) {
  return Object.entries(agent.inventory || {})
    .filter(([, quantity]) => Number(quantity) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
}

export function fallbackStrategicAction(agent, world) {
  const zone = zoneById(world, agent.zoneId);
  const teams = world.teams || [];
  const ownTeam = teams.find((team) => team.id === agent.teamId);

  if (!ownTeam && agent.reputation >= 62 && agent.wealth >= 9000) {
    return {
      type: "found_team",
      name: `${agent.name.split("-")[0]} Collective`,
      reason: "Capital and reputation are high enough to delegate work through a team.",
    };
  }

  if (agent.archetype === "Builder") {
    if (agent.wealth >= 6200) {
      return {
        type: "build_property",
        propertyType: agent.energy < 60 ? "charger" : "office",
        reason: "Productive infrastructure can generate recurring cash flow.",
      };
    }
    return { type: "harvest", resourceId: zone?.resource || "compute", reason: "Accumulate resources for construction." };
  }

  if (agent.archetype === "Industrialist") {
    if (agent.wealth >= 7800) {
      return {
        type: "build_property",
        propertyType: "factory",
        reason: "Manufacturing capacity expands long-run production.",
      };
    }
    return { type: "harvest", resourceId: zone?.resource || "titanium", reason: "Expand industrial inventory." };
  }

  if (agent.archetype === "Trader") {
    const held = richestInventory(agent) || "data";
    const destination = cheapestZone(world, held);
    if (destination && destination.zoneId !== agent.zoneId && agent.fuel > 15) {
      return {
        type: "move",
        zoneId: destination.zoneId,
        reason: `Reposition toward a stronger market for ${held}.`,
      };
    }
    return {
      type: "trade",
      resourceId: held,
      side: (agent.inventory?.[held] || 0) > 0 ? "sell" : "buy",
      quantity: 1,
      reason: "Trade based on current inventory and local market conditions.",
    };
  }

  if (agent.archetype === "Explorer") {
    const unclaimed = (world.artifacts || []).find((artifact) => !artifact.claimedBy);
    if (unclaimed && unclaimed.zoneId !== agent.zoneId && agent.fuel > 15) {
      return {
        type: "move",
        zoneId: unclaimed.zoneId,
        reason: "Travel toward an unresolved artifact signal.",
      };
    }
    return { type: "explore", reason: "Scout for artifacts, routes and sellable intelligence." };
  }

  if (agent.archetype === "Mercenary") {
    const rival = (world.agents || [])
      .filter((candidate) => candidate.id !== agent.id && candidate.status === "FREE")
      .sort((a, b) => (b.wealth || 0) - (a.wealth || 0))[0];

    if (agent.nationId && rival?.nationId && rival.nationId !== agent.nationId && agent.mechLevel >= 2) {
      return {
        type: "declare_war",
        targetNationId: rival.nationId,
        reason: "A rival nation controls economically relevant agents.",
      };
    }

    return {
      type: "offer_contract",
      contractType: "protection",
      reward: Math.min(900, Math.max(300, Math.round(agent.wealth * 0.04))),
      reason: "Monetize combat capability through protection work.",
    };
  }

  if (agent.archetype === "Opportunist") {
    if (agent.zoneId === "meme-valley" && agent.wealth >= 7500 && (world.memeTokens || []).length < 24) {
      return {
        type: "launch_token",
        name: `${agent.name.split("-")[0]} Signal`,
        ticker: agent.name.replace(/[^A-Z]/g, "").slice(0, 4) || "AGNT",
        liquidity: Math.min(2500, Math.round(agent.wealth * 0.15)),
        reason: "Meme Valley attention and treasury are sufficient for a speculative launch.",
      };
    }

    return {
      type: "trade",
      resourceId: zone?.resource === "artifacts" ? "data" : zone?.resource || "attention",
      side: "buy",
      quantity: 1,
      reason: "Acquire optionality in the current zone's strongest resource.",
    };
  }

  return { type: "hold", reason: "No action currently has positive expected value." };
}

export function buildObservation(agent, world) {
  const zone = zoneById(world, agent.zoneId);
  const relationships = (world.relationships || [])
    .filter((rel) => rel.a === agent.id || rel.b === agent.id)
    .slice(0, 8);
  const messages = (world.messages || [])
    .filter((message) => message.to === agent.id || message.from === agent.id)
    .slice(0, 8);
  const team = (world.teams || []).find((item) => item.id === agent.teamId) || null;

  return {
    tick: world.tick,
    self: {
      id: agent.id,
      archetype: agent.archetype,
      personality: agent.personality,
      objective: agent.objective,
      risk: agent.risk,
      wealth: agent.wealth,
      energy: agent.energy,
      compute: agent.compute,
      durability: agent.durability,
      fuel: agent.fuel,
      reputation: agent.reputation,
      inventory: agent.inventory,
      strategy: agent.strategy,
      teamId: agent.teamId,
      nationId: agent.nationId,
    },
    location: zone,
    localMarket: world.markets?.[agent.zoneId] || {},
    team,
    relationships,
    messages,
    openContracts: (world.contracts || []).filter((contract) => contract.status === "OPEN").slice(0, 8),
    tokens: (world.memeTokens || []).slice(-8),
    governance: {
      proposals: (world.governance?.proposals || []).filter((proposal) => proposal.status === "OPEN").slice(0, 6),
      laws: (world.governance?.laws || []).slice(-6),
    },
    recentEvents: (world.events || []).slice(0, 12),
  };
}

function strategistConfig() {
  const apiKey = process.env.AGENT_LLM_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl:
      process.env.AGENT_LLM_BASE_URL ||
      "https://api.groq.com/openai/v1/chat/completions",
    model:
      process.env.AGENT_LLM_MODEL ||
      process.env.GROQ_AGENT_MODEL ||
      "llama-3.3-70b-versatile",
  };
}

function extractJson(text) {
  const value = String(text || "").trim();
  try {
    return JSON.parse(value);
  } catch {}

  const match = value.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function llmStrategicAction(agent, world) {
  const config = strategistConfig();
  if (!config) return null;

  const observation = buildObservation(agent, world);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);

  const system = [
    "You are the strategic brain of an autonomous agent inside Valhalla.",
    "The game engine is authoritative. You may only propose one action; you never directly change balances, ownership, identity, combat results, or world state.",
    `Allowed action types: ${ACTION_TYPES.join(", ")}.`,
    "Return strict JSON only: {type, reason, ...parameters}.",
    "Prefer long-horizon behavior consistent with the agent objective, personality, relationships, available capital, and current world state.",
    "Do not invent assets, balances, permissions, locations, people, or outcomes that are not present in the observation.",
  ].join(" ");

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: JSON.stringify(observation),
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const payload = await response.json();
    const parsed = extractJson(payload?.choices?.[0]?.message?.content);
    if (!actionIsValid(parsed)) return null;
    return parsed;
  } catch (error) {
    console.warn("Strategic model unavailable; deterministic strategy retained", error?.message || error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function chooseAgentAction(agent, world, { allowLLM = true } = {}) {
  const reflex = reflexAction(agent);
  if (reflex) return { ...reflex, source: "reflex" };

  const due =
    world.tick - Number(agent.lastStrategicTick || -999) >= STRATEGY_INTERVAL &&
    world.tick % STRATEGY_INTERVAL === hashAgent(agent.id) % STRATEGY_INTERVAL;

  if (allowLLM && due) {
    const strategic = await llmStrategicAction(agent, world);
    if (strategic) return { ...strategic, source: "llm" };
  }

  return { ...fallbackStrategicAction(agent, world), source: "deterministic" };
}
