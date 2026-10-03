import { loadWorld, mutateWorld, runtimeStorageMode } from "../server/runtime/store.js";
import {
  commandAgentInWorld,
  createAgentInWorld,
  releaseAgentInWorld,
  tickWorld,
} from "../server/runtime/engine.js";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function publicWorld(world) {
  return {
    ...world,
    storageMode: world.storageMode || runtimeStorageMode(),
    serverTime: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const op = String(req.query?.op || "world");

      if (op === "health") {
        const world = await loadWorld();
        return send(res, 200, {
          ok: true,
          runtimeVersion: world.runtimeVersion,
          storageMode: world.storageMode || runtimeStorageMode(),
          tick: world.tick,
          agents: world.agents?.length || 0,
          llmConfigured: Boolean(
            process.env.AGENT_LLM_API_KEY || process.env.GROQ_API_KEY
          ),
          databaseConfigured: Boolean(process.env.DATABASE_URL),
        });
      }

      const world = await loadWorld();

      if (op === "agent") {
        const agent = world.agents.find(
          (candidate) => candidate.id === String(req.query?.id || "")
        );
        if (!agent) return send(res, 404, { ok: false, error: "Agent not found." });

        const relationships = world.relationships.filter(
          (rel) => rel.a === agent.id || rel.b === agent.id
        );
        const messages = world.messages.filter(
          (message) => message.from === agent.id || message.to === agent.id
        );
        const team = world.teams.find((item) => item.id === agent.teamId) || null;
        const nation =
          world.nations.find((item) => item.id === agent.nationId) || null;

        return send(res, 200, {
          ok: true,
          agent,
          relationships,
          messages: messages.slice(0, 50),
          team,
          nation,
        });
      }

      return send(res, 200, { ok: true, world: publicWorld(world) });
    }

    if (req.method !== "POST") {
      return send(res, 405, { ok: false, error: "Method not allowed." });
    }

    const input = await body(req);
    const op = String(input.op || "tick");

    if (op === "tick") {
      const world = await mutateWorld((state) =>
        tickWorld(state, {
          allowLLM: input.allowLLM !== false,
          maxStrategicAgents: Math.max(
            0,
            Math.min(6, Number(input.maxStrategicAgents ?? 4))
          ),
        })
      );
      return send(res, 200, { ok: true, world: publicWorld(world) });
    }

    if (op === "create_agent") {
      let created = null;
      const world = await mutateWorld((state) => {
        created = createAgentInWorld(
          state,
          input.agent || {},
          input.identity || {}
        );
        return state;
      });

      return send(res, 201, {
        ok: true,
        agent: created,
        world: publicWorld(world),
      });
    }

    if (op === "release_agent") {
      let released = null;
      const world = await mutateWorld((state) => {
        released = releaseAgentInWorld(
          state,
          String(input.agentId || ""),
          input.creatorWallet || null
        );
        return state;
      });

      return send(res, 200, {
        ok: true,
        agent: released,
        world: publicWorld(world),
      });
    }

    if (op === "command_agent") {
      let agent = null;
      const world = await mutateWorld((state) => {
        agent = commandAgentInWorld(
          state,
          String(input.agentId || ""),
          input.command || {}
        );
        return state;
      });

      return send(res, 200, {
        ok: true,
        agent,
        world: publicWorld(world),
      });
    }

    return send(res, 400, {
      ok: false,
      error: `Unknown runtime operation: ${op}`,
    });
  } catch (error) {
    console.error("Valhalla runtime error", error);
    const conflict = error?.code === "WORLD_REVISION_CONFLICT";
    return send(res, conflict ? 409 : 500, {
      ok: false,
      error: error?.message || "Runtime failure",
    });
  }
}
