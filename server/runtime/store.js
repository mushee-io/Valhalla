import { neon } from "@neondatabase/serverless";
import { createSharedWorld } from "./model.js";

const WORLD_ID = "valhalla-main";
const globalKey = "__VALHALLA_SHARED_RUNTIME__";

function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

function memoryContainer() {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = {
      world: createSharedWorld(),
      initializedAt: Date.now(),
    };
  }
  return globalThis[globalKey];
}

function sqlClient() {
  if (!databaseEnabled()) return null;
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS valhalla_worlds (
      id TEXT PRIMARY KEY,
      revision BIGINT NOT NULL DEFAULT 1,
      runtime_version INTEGER NOT NULL,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS valhalla_event_log (
      id TEXT PRIMARY KEY,
      world_id TEXT NOT NULL,
      tick BIGINT NOT NULL,
      type TEXT NOT NULL,
      actor_id TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS valhalla_event_log_world_tick_idx
    ON valhalla_event_log (world_id, tick DESC)
  `;
}

async function loadDatabaseWorld(sql) {
  await ensureSchema(sql);
  const rows = await sql`
    SELECT state, revision
    FROM valhalla_worlds
    WHERE id = ${WORLD_ID}
    LIMIT 1
  `;

  if (!rows.length) {
    const initial = createSharedWorld();
    initial.storageMode = "persistent";
    const inserted = await sql`
      INSERT INTO valhalla_worlds (id, revision, runtime_version, state)
      VALUES (
        ${WORLD_ID},
        1,
        ${initial.runtimeVersion},
        ${JSON.stringify(initial)}::jsonb
      )
      RETURNING revision
    `;
    initial.revision = Number(inserted[0]?.revision || 1);
    return initial;
  }

  const world = rows[0].state;
  world.revision = Number(rows[0].revision || world.revision || 1);
  world.storageMode = "persistent";
  return world;
}

export async function loadWorld() {
  const sql = sqlClient();
  if (!sql) {
    const container = memoryContainer();
    container.world.storageMode = "ephemeral";
    return structuredClone(container.world);
  }

  try {
    return await loadDatabaseWorld(sql);
  } catch (error) {
    console.error("Valhalla persistent store failed; using ephemeral fallback", error);
    const container = memoryContainer();
    container.world.storageMode = "ephemeral";
    container.world.storageError = error?.message || "database unavailable";
    return structuredClone(container.world);
  }
}

async function appendEvents(sql, world, previousEventIds = new Set()) {
  const fresh = (world.events || [])
    .filter((event) => !previousEventIds.has(event.id))
    .slice(0, 30);

  for (const event of fresh) {
    await sql`
      INSERT INTO valhalla_event_log (id, world_id, tick, type, actor_id, payload)
      VALUES (
        ${event.id},
        ${WORLD_ID},
        ${Number(event.tick || world.tick || 0)},
        ${event.type || "event"},
        ${event.actorId || null},
        ${JSON.stringify(event)}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function saveWorld(world, previousWorld = null) {
  const sql = sqlClient();

  if (!sql) {
    const container = memoryContainer();
    const next = structuredClone(world);
    next.revision = Number(container.world.revision || 0) + 1;
    next.storageMode = "ephemeral";
    next.updatedAt = new Date().toISOString();
    container.world = next;
    return structuredClone(next);
  }

  await ensureSchema(sql);

  const expectedRevision = Number(world.revision || 1);
  const next = structuredClone(world);
  next.updatedAt = new Date().toISOString();
  next.storageMode = "persistent";

  const rows = await sql`
    UPDATE valhalla_worlds
    SET
      revision = revision + 1,
      runtime_version = ${Number(next.runtimeVersion || 18)},
      state = ${JSON.stringify(next)}::jsonb,
      updated_at = NOW()
    WHERE id = ${WORLD_ID}
      AND revision = ${expectedRevision}
    RETURNING revision
  `;

  if (!rows.length) {
    const error = new Error("WORLD_REVISION_CONFLICT");
    error.code = "WORLD_REVISION_CONFLICT";
    throw error;
  }

  next.revision = Number(rows[0].revision);

  const previousEventIds = new Set((previousWorld?.events || []).map((event) => event.id));
  await appendEvents(sql, next, previousEventIds);

  return next;
}

export async function mutateWorld(mutator, { retries = 2 } = {}) {
  let attempt = 0;

  while (attempt <= retries) {
    const world = await loadWorld();
    const previous = structuredClone(world);

    try {
      const result = await mutator(structuredClone(world));
      return await saveWorld(result, previous);
    } catch (error) {
      if (error?.code === "WORLD_REVISION_CONFLICT" && attempt < retries) {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Unable to update world after retries");
}

export function runtimeStorageMode() {
  return databaseEnabled() ? "persistent" : "ephemeral";
}
