import { loadWorld, mutateWorld, runtimeStorageMode } from "../server/runtime/store.js";
import {
  commandAgentInWorld,
  createAgentInWorld,
  releaseAgentInWorld,
  tickWorld,
  purchaseHash44LandInWorld,
  buildHash44StructureInWorld,
  listHash44PropertyInWorld,
  cancelHash44ListingInWorld,
  buyListedHash44PropertyInWorld,
  transferHash44PropertyInWorld,
  setHash44RentInWorld,
  rentHash44PropertyInWorld,
  useHash44ChargingStationInWorld,
  buyHash44EquipmentInWorld,
  listHash44EquipmentInWorld,
  cancelHash44EquipmentListingInWorld,
  buyListedHash44EquipmentInWorld,
  buildHash44BusinessInWorld,
  useHash44BusinessInWorld,
  buildHash44GpuCentreInWorld,
  useHash44GpuCentreInWorld,
  buildHash44RepairCentreInWorld,
  useHash44RepairCentreInWorld,
  buyHash44VehicleInWorld,
  createHash44TransportRouteInWorld,
  useHash44TransportRouteInWorld,
  investHash44BusinessInWorld,
  borrowHash44CreditsInWorld,
  repayHash44LoanInWorld,
} from "../server/runtime/engine.js";
import {
  verifyDevnetTransfer,
  verifyHash44ActionProof,
} from "../server/runtime/solana.js";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
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
    totalVolume: world.totalVolume ?? world.metrics?.totalVolume ?? 0,
    storageMode: world.storageMode || runtimeStorageMode(),
    serverTime: new Date().toISOString(),
  };
}

function hash44Treasury() {
  return String(process.env.HASH44_TREASURY_WALLET || "");
}

function requireTreasury() {
  const treasury = hash44Treasury();
  if (!treasury) {
    const error = new Error(
      "Hash 44 treasury is not configured yet. Set HASH44_TREASURY_WALLET on Vercel."
    );
    error.statusCode = 503;
    throw error;
  }
  return treasury;
}

async function verifiedPayment({
  signature,
  source,
  destination,
  lamports,
}) {
  const proof = await verifyDevnetTransfer({
    signature,
    source,
    destination,
    lamports,
  });
  if (!proof.ok) throw new Error(proof.reason || "Payment verification failed.");
  return proof;
}

function verifyAction(input, action) {
  const proof = input.proof || {};
  const ok = verifyHash44ActionProof({
    wallet: input.wallet,
    message: proof.message,
    signatureBase64: proof.signatureBase64,
    action,
  });
  if (!ok) throw new Error("Wallet authorization proof is invalid.");
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
          hash44TreasuryConfigured: Boolean(hash44Treasury()),
        });
      }

      if (op === "hash44_config") {
        const world = await loadWorld();
        return send(res, 200, {
          ok: true,
          network: "solana-devnet",
          treasuryWallet: hash44Treasury() || null,
          landPriceLamports: world.hash44?.landPriceLamports || 100000,
          province: world.hash44?.province || null,
          structureCatalog: world.hash44?.structureCatalog || [],
          equipmentCatalog: world.hash44?.equipmentCatalog || [],
          persistence: world.storageMode || runtimeStorageMode(),
        });
      }

      const world = await loadWorld();

      if (op === "agent") {
        const agent = world.agents.find(
          (candidate) => candidate.id === String(req.query?.id || "")
        );
        if (!agent) return send(res, 404, { ok: false, error: "Agent not found." });

        return send(res, 200, {
          ok: true,
          agent,
          relationships: world.relationships.filter(
            (rel) => rel.a === agent.id || rel.b === agent.id
          ),
          messages: world.messages
            .filter(
              (message) =>
                message.from === agent.id || message.to === agent.id
            )
            .slice(0, 50),
          team: world.teams.find((item) => item.id === agent.teamId) || null,
          nation: world.nations.find((item) => item.id === agent.nationId) || null,
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
        created = createAgentInWorld(state, input.agent || {}, input.identity || {});
        return state;
      });
      return send(res, 201, { ok: true, agent: created, world: publicWorld(world) });
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
      return send(res, 200, { ok: true, agent: released, world: publicWorld(world) });
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
      return send(res, 200, { ok: true, agent, world: publicWorld(world) });
    }

    if (op === "hash44_buy_land") {
      const treasury = requireTreasury();
      const current = await loadWorld();
      const plot = current.hash44?.plots?.find((item) => item.id === input.plotId);
      if (!plot) return send(res, 404, { ok: false, error: "Plot not found." });
      const expected = Number(plot.priceLamports || 100000);
      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: treasury,
        lamports: expected,
      });

      let purchased = null;
      const world = await mutateWorld((state) => {
        purchased = purchaseHash44LandInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          wallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          blockTime: proof.blockTime,
          paidLamports: expected,
        });
        return state;
      });
      return send(res, 200, { ok: true, plot: purchased, world: publicWorld(world) });
    }

    if (op === "hash44_build") {
      const treasury = requireTreasury();
      const current = await loadWorld();
      const definition = current.hash44?.structureCatalog?.find(
        (item) => item.id === input.structureType
      );
      if (!definition) return send(res, 404, { ok: false, error: "Structure not found." });

      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: treasury,
        lamports: Number(definition.costLamports),
      });

      let structure = null;
      const world = await mutateWorld((state) => {
        structure = buildHash44StructureInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          structureType: input.structureType,
          wallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          blockTime: proof.blockTime,
          paidLamports: Number(definition.costLamports),
        });
        return state;
      });

      return send(res, 200, { ok: true, structure, world: publicWorld(world) });
    }

    if (op === "hash44_list_property") {
      verifyAction(input, "list_property");
      let plot = null;
      const world = await mutateWorld((state) => {
        plot = listHash44PropertyInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          wallet: input.wallet,
          priceLamports: input.priceLamports,
        });
        return state;
      });
      return send(res, 200, { ok: true, plot, world: publicWorld(world) });
    }

    if (op === "hash44_cancel_listing") {
      verifyAction(input, "cancel_listing");
      let plot = null;
      const world = await mutateWorld((state) => {
        plot = cancelHash44ListingInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, plot, world: publicWorld(world) });
    }

    if (op === "hash44_buy_listing") {
      const current = await loadWorld();
      const plot = current.hash44?.plots?.find((item) => item.id === input.plotId);
      const sale = plot?.sale;
      if (!sale) return send(res, 400, { ok: false, error: "Property is not listed." });

      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: sale.sellerWallet,
        lamports: Number(sale.priceLamports),
      });

      let purchased = null;
      const world = await mutateWorld((state) => {
        purchased = buyListedHash44PropertyInWorld(state, {
          buyerAgentId: input.agentId,
          plotId: input.plotId,
          buyerWallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          blockTime: proof.blockTime,
          paidLamports: Number(sale.priceLamports),
        });
        return state;
      });
      return send(res, 200, { ok: true, plot: purchased, world: publicWorld(world) });
    }

    if (op === "hash44_transfer_property") {
      verifyAction(input, "transfer_property");
      let plot = null;
      const world = await mutateWorld((state) => {
        plot = transferHash44PropertyInWorld(state, {
          fromAgentId: input.agentId,
          toAgentId: input.toAgentId,
          plotId: input.plotId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, plot, world: publicWorld(world) });
    }

    if (op === "hash44_set_rent") {
      verifyAction(input, "set_rent");
      let plot = null;
      const world = await mutateWorld((state) => {
        plot = setHash44RentInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          wallet: input.wallet,
          rentLamports: input.rentLamports,
        });
        return state;
      });
      return send(res, 200, { ok: true, plot, world: publicWorld(world) });
    }

    if (op === "hash44_rent") {
      const current = await loadWorld();
      const plot = current.hash44?.plots?.find((item) => item.id === input.plotId);
      if (!plot?.rental) return send(res, 400, { ok: false, error: "Property is not for rent." });
      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: plot.rental.ownerWallet,
        lamports: Number(plot.rental.rentLamports),
      });
      let rented = null;
      const world = await mutateWorld((state) => {
        rented = rentHash44PropertyInWorld(state, {
          tenantAgentId: input.agentId,
          plotId: input.plotId,
          tenantWallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          blockTime: proof.blockTime,
          paidLamports: Number(plot.rental.rentLamports),
        });
        return state;
      });
      return send(res, 200, { ok: true, plot: rented, world: publicWorld(world) });
    }

    if (op === "hash44_charge") {
      const current = await loadWorld();
      const station = current.hash44?.structures?.find(
        (item) => item.id === input.structureId
      );
      if (!station) return send(res, 404, { ok: false, error: "Charging station not found." });
      const owner = current.agents.find((agent) => agent.id === station.ownerAgentId);
      if (!owner) return send(res, 404, { ok: false, error: "Station owner not found." });

      let proof = { explorerUrl: null, blockTime: null };
      let paidLamports = 0;
      if (owner.id !== input.agentId) {
        paidLamports = Number(station.energyRateLamports || 100000);
        proof = await verifiedPayment({
          signature: input.signature,
          source: input.wallet,
          destination: owner.creatorWallet,
          lamports: paidLamports,
        });
      }

      let agent = null;
      const world = await mutateWorld((state) => {
        agent = useHash44ChargingStationInWorld(state, {
          agentId: input.agentId,
          structureId: input.structureId,
          wallet: input.wallet,
          signature: input.signature || null,
          explorerUrl: proof.explorerUrl,
          paidLamports,
        });
        return state;
      });
      return send(res, 200, { ok: true, agent, world: publicWorld(world) });
    }

    if (op === "hash44_buy_equipment") {
      const treasury = requireTreasury();
      const current = await loadWorld();
      const item = current.hash44?.equipmentCatalog?.find(
        (candidate) => candidate.id === input.equipmentId
      );
      if (!item) return send(res, 404, { ok: false, error: "Equipment item not found." });

      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: treasury,
        lamports: Number(item.costLamports),
      });

      let equipment = null;
      const world = await mutateWorld((state) => {
        equipment = buyHash44EquipmentInWorld(state, {
          agentId: input.agentId,
          equipmentId: input.equipmentId,
          wallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          paidLamports: Number(item.costLamports),
        });
        return state;
      });
      return send(res, 200, { ok: true, equipment, world: publicWorld(world) });
    }


    if (op === "hash44_list_equipment") {
      verifyAction(input, "list_equipment");
      let listing = null;
      const world = await mutateWorld((state) => {
        listing = listHash44EquipmentInWorld(state, {
          agentId: input.agentId,
          ownedItemId: input.ownedItemId,
          wallet: input.wallet,
          priceLamports: input.priceLamports,
        });
        return state;
      });
      return send(res, 200, { ok: true, listing, world: publicWorld(world) });
    }

    if (op === "hash44_cancel_equipment_listing") {
      verifyAction(input, "cancel_equipment_listing");
      let equipment = null;
      const world = await mutateWorld((state) => {
        equipment = cancelHash44EquipmentListingInWorld(state, {
          agentId: input.agentId,
          ownedItemId: input.ownedItemId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, equipment, world: publicWorld(world) });
    }

    if (op === "hash44_buy_equipment_listing") {
      const current = await loadWorld();
      const listing = current.hash44?.equipmentMarket?.find(
        (candidate) =>
          candidate.ownedItemId === input.ownedItemId &&
          candidate.status === "LISTED"
      );
      if (!listing) {
        return send(res, 400, { ok: false, error: "Equipment is not listed." });
      }

      const proof = await verifiedPayment({
        signature: input.signature,
        source: input.wallet,
        destination: listing.sellerWallet,
        lamports: Number(listing.priceLamports),
      });

      let equipment = null;
      const world = await mutateWorld((state) => {
        equipment = buyListedHash44EquipmentInWorld(state, {
          buyerAgentId: input.agentId,
          ownedItemId: input.ownedItemId,
          buyerWallet: input.wallet,
          signature: input.signature,
          explorerUrl: proof.explorerUrl,
          paidLamports: Number(listing.priceLamports),
        });
        return state;
      });

      return send(res, 200, { ok: true, equipment, world: publicWorld(world) });
    }



    if (op === "hash44_build_business") {
      verifyAction(input, "build_business");
      let business = null;
      const world = await mutateWorld((state) => {
        business = buildHash44BusinessInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          businessType: input.businessType,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, business, world: publicWorld(world) });
    }

    if (op === "hash44_use_business") {
      verifyAction(input, "use_business");
      let business = null;
      const world = await mutateWorld((state) => {
        business = useHash44BusinessInWorld(state, {
          agentId: input.agentId,
          businessId: input.businessId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, business, world: publicWorld(world) });
    }

    if (op === "hash44_build_gpu") {
      verifyAction(input, "build_gpu");
      let centre = null;
      const world = await mutateWorld((state) => {
        centre = buildHash44GpuCentreInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          centreType: input.centreType,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, centre, world: publicWorld(world) });
    }

    if (op === "hash44_use_gpu") {
      verifyAction(input, "use_gpu");
      let centre = null;
      const world = await mutateWorld((state) => {
        centre = useHash44GpuCentreInWorld(state, {
          agentId: input.agentId,
          centreId: input.centreId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, centre, world: publicWorld(world) });
    }

    if (op === "hash44_build_repair") {
      verifyAction(input, "build_repair");
      let centre = null;
      const world = await mutateWorld((state) => {
        centre = buildHash44RepairCentreInWorld(state, {
          agentId: input.agentId,
          plotId: input.plotId,
          centreType: input.centreType,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, centre, world: publicWorld(world) });
    }

    if (op === "hash44_use_repair") {
      verifyAction(input, "use_repair");
      let centre = null;
      const world = await mutateWorld((state) => {
        centre = useHash44RepairCentreInWorld(state, {
          agentId: input.agentId,
          centreId: input.centreId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, centre, world: publicWorld(world) });
    }

    if (op === "hash44_buy_vehicle") {
      verifyAction(input, "buy_vehicle");
      let vehicle = null;
      const world = await mutateWorld((state) => {
        vehicle = buyHash44VehicleInWorld(state, {
          agentId: input.agentId,
          vehicleType: input.vehicleType,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, vehicle, world: publicWorld(world) });
    }

    if (op === "hash44_create_route") {
      verifyAction(input, "create_route");
      let route = null;
      const world = await mutateWorld((state) => {
        route = createHash44TransportRouteInWorld(state, {
          agentId: input.agentId,
          vehicleId: input.vehicleId,
          fromPlotId: input.fromPlotId,
          toPlotId: input.toPlotId,
          wallet: input.wallet,
          fareCredits: input.fareCredits,
        });
        return state;
      });
      return send(res, 200, { ok: true, route, world: publicWorld(world) });
    }

    if (op === "hash44_use_route") {
      verifyAction(input, "use_route");
      let route = null;
      const world = await mutateWorld((state) => {
        route = useHash44TransportRouteInWorld(state, {
          agentId: input.agentId,
          routeId: input.routeId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, route, world: publicWorld(world) });
    }

    if (op === "hash44_invest_business") {
      verifyAction(input, "invest_business");
      let holding = null;
      const world = await mutateWorld((state) => {
        holding = investHash44BusinessInWorld(state, {
          agentId: input.agentId,
          businessId: input.businessId,
          shares: input.shares,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, holding, world: publicWorld(world) });
    }

    if (op === "hash44_borrow") {
      verifyAction(input, "borrow");
      let loan = null;
      const world = await mutateWorld((state) => {
        loan = borrowHash44CreditsInWorld(state, {
          agentId: input.agentId,
          amountCredits: input.amountCredits,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, loan, world: publicWorld(world) });
    }

    if (op === "hash44_repay_loan") {
      verifyAction(input, "repay_loan");
      let loan = null;
      const world = await mutateWorld((state) => {
        loan = repayHash44LoanInWorld(state, {
          agentId: input.agentId,
          loanId: input.loanId,
          wallet: input.wallet,
        });
        return state;
      });
      return send(res, 200, { ok: true, loan, world: publicWorld(world) });
    }

    return send(res, 400, { ok: false, error: `Unknown runtime operation: ${op}` });
  } catch (error) {
    console.error("Valhalla runtime error", error);
    const conflict = error?.code === "WORLD_REVISION_CONFLICT";
    return send(res, error?.statusCode || (conflict ? 409 : 500), {
      ok: false,
      error: error?.message || "Runtime failure",
    });
  }
}
