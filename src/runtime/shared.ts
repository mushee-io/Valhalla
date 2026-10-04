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


export async function getHash44Config() {
  return runtimeFetch({
    method: "GET",
    query: { op: "hash44_config" },
  });
}

export async function hash44BuyLand(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_buy_land", ...payload }),
  });
}

export async function hash44Build(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_build", ...payload }),
  });
}

export async function hash44ListProperty(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_list_property", ...payload }),
  });
}

export async function hash44CancelListing(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_cancel_listing", ...payload }),
  });
}

export async function hash44BuyListing(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_buy_listing", ...payload }),
  });
}

export async function hash44TransferProperty(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_transfer_property", ...payload }),
  });
}

export async function hash44SetRent(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_set_rent", ...payload }),
  });
}

export async function hash44Rent(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_rent", ...payload }),
  });
}

export async function hash44Charge(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_charge", ...payload }),
  });
}

export async function hash44BuyEquipment(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_buy_equipment", ...payload }),
  });
}


export async function hash44ListEquipment(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_list_equipment", ...payload }),
  });
}

export async function hash44CancelEquipmentListing(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_cancel_equipment_listing", ...payload }),
  });
}

export async function hash44BuyEquipmentListing(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_buy_equipment_listing", ...payload }),
  });
}


export async function hash44BuildBusiness(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_build_business", ...payload }),
  });
}

export async function hash44UseBusiness(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_use_business", ...payload }),
  });
}

export async function hash44BuildGpu(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_build_gpu", ...payload }),
  });
}

export async function hash44UseGpu(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_use_gpu", ...payload }),
  });
}

export async function hash44BuildRepair(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_build_repair", ...payload }),
  });
}

export async function hash44UseRepair(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_use_repair", ...payload }),
  });
}

export async function hash44BuyVehicle(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_buy_vehicle", ...payload }),
  });
}

export async function hash44CreateRoute(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_create_route", ...payload }),
  });
}

export async function hash44UseRoute(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_use_route", ...payload }),
  });
}

export async function hash44InvestBusiness(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_invest_business", ...payload }),
  });
}

export async function hash44Borrow(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_borrow", ...payload }),
  });
}

export async function hash44RepayLoan(payload: any) {
  return runtimeFetch({
    method: "POST",
    body: JSON.stringify({ op: "hash44_repay_loan", ...payload }),
  });
}
