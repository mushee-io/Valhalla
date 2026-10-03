type RuntimeResponse = {
  ok: boolean;
  world?: any;
  agent?: any;
  storageMode?: string;
  error?: string;
};

const RUNTIME_URL = "/api/runtime";

async function runtimeFetch(
  input: RequestInit & { query?: Record<string, string> } = {}
): Promise<RuntimeResponse> {
  const query = input.query
    ? "?" + new URLSearchParams(input.query).toString()
    : "";

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(RUNTIME_URL + query, {
      ...input,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(input.headers || {}),
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || `Runtime HTTP ${response.status}`);
    }

    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function getRuntimeHealth() {
  return runtimeFetch({
    method: "GET",
    query: { op: "health" },
  });
}

export async function getSharedWorld() {
  return runtimeFetch({
    method: "GET",
    query: { op: "world" },
  });
}

export async function tickSharedWorld(options: {
  allowLLM?: boolean;
  maxStrategicAgents?: number;
} = {}) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({
      op: "tick",
      allowLLM: options.allowLLM ?? true,
      maxStrategicAgents: options.maxStrategicAgents ?? 4,
    }),
  });
}

export async function createSharedAgent(agent: any, identity: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({
      op: "create_agent",
      agent,
      identity,
    }),
  });
}

export async function releaseSharedAgent(
  agentId: string,
  creatorWallet?: string | null
) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({
      op: "release_agent",
      agentId,
      creatorWallet,
    }),
  });
}

export async function commandSharedAgent(agentId: string, command: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({
      op: "command_agent",
      agentId,
      command,
    }),
  });
}
