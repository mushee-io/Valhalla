import React, { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Banknote,
  Box,
  Building2,
  Car,
  Cpu,
  Check,
  ChevronRight,
  Coins,
  Hammer,
  HeartPulse,
  Home,
  LandPlot,
  Landmark,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";
import {
  getHash44Config,
  hash44Build,
  hash44BuyEquipment,
  hash44BuyEquipmentListing,
  hash44BuyLand,
  hash44BuildBusiness,
  hash44UseBusiness,
  hash44BuildGpu,
  hash44UseGpu,
  hash44BuildRepair,
  hash44UseRepair,
  hash44BuyVehicle,
  hash44CreateRoute,
  hash44UseRoute,
  hash44InvestBusiness,
  hash44Borrow,
  hash44RepayLoan,
  hash44BuyListing,
  hash44CancelListing,
  hash44Charge,
  hash44CancelEquipmentListing,
  hash44ListEquipment,
  hash44ListProperty,
  hash44Rent,
  hash44SetRent,
  hash44TransferProperty,
} from "../runtime/shared";
import {
  sendHash44Payment,
  signHash44Action,
} from "../solana";

type Props = {
  world: any;
  selectedAgent: any;
  runtimeMode: string;
  wallet: string | null;
  onConnect: () => Promise<string | null> | string | null;
  onWorldUpdate: (world: any) => void;
};

const views = [
  "Land",
  "Build",
  "Property",
  "Energy",
  "Equipment",
  "Business",
  "Compute",
  "Repair",
  "Transport",
  "Finance",
] as const;

function sol(lamports: number) {
  return (Number(lamports || 0) / 1_000_000_000).toFixed(4);
}

export default function Hash44World({
  world,
  selectedAgent,
  runtimeMode,
  wallet,
  onConnect,
  onWorldUpdate,
}: Props) {
  const [view, setView] = useState<(typeof views)[number]>("Land");
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [structureType, setStructureType] = useState("small-shelter");
  const [config, setConfig] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saleSol, setSaleSol] = useState("0.0010");
  const [rentSol, setRentSol] = useState("0.0002");
  const [transferTarget, setTransferTarget] = useState("");
  const [equipmentSaleSol, setEquipmentSaleSol] = useState("0.0003");
  const [businessType, setBusinessType] = useState("shop");
  const [gpuType, setGpuType] = useState("edge-gpu-centre");
  const [repairType, setRepairType] = useState("repair-clinic");
  const [vehicleType, setVehicleType] = useState("city-rover");
  const [routeVehicleId, setRouteVehicleId] = useState("");
  const [routeFromPlotId, setRouteFromPlotId] = useState("");
  const [routeToPlotId, setRouteToPlotId] = useState("");
  const [routeFareCredits, setRouteFareCredits] = useState("50");
  const [investShares, setInvestShares] = useState("10");
  const [borrowCredits, setBorrowCredits] = useState("1000");

  const hash44 = world.hash44;
  const plots = hash44?.plots || [];
  const structures = hash44?.structures || [];
  const selectedPlot =
    plots.find((plot: any) => plot.id === selectedPlotId) || plots[0] || null;

  useEffect(() => {
    if (!selectedPlotId && plots[0]) setSelectedPlotId(plots[0].id);
  }, [selectedPlotId, plots]);

  useEffect(() => {
    let cancelled = false;
    getHash44Config()
      .then((result: any) => {
        if (!cancelled) setConfig(result);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Unable to load Hash 44 configuration.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ownedPlots = useMemo(
    () =>
      plots.filter(
        (plot: any) => plot.ownerAgentId === selectedAgent?.id
      ),
    [plots, selectedAgent?.id]
  );

  const listedPlots = useMemo(
    () => plots.filter((plot: any) => plot.status === "LISTED" && plot.sale),
    [plots]
  );

  const rentablePlots = useMemo(
    () =>
      plots.filter(
        (plot: any) =>
          plot.rental &&
          plot.ownerAgentId !== selectedAgent?.id
      ),
    [plots, selectedAgent?.id]
  );

  const chargingStations = useMemo(
    () =>
      structures.filter(
        (structure: any) =>
          structure.type === "charging-station" &&
          structure.status === "ACTIVE"
      ),
    [structures]
  );

  const agentStructures = useMemo(
    () =>
      structures.filter(
        (structure: any) => structure.ownerAgentId === selectedAgent?.id
      ),
    [structures, selectedAgent?.id]
  );

  const equipmentListings = useMemo(
    () =>
      (hash44?.equipmentMarket || []).filter(
        (listing: any) => listing.status === "LISTED"
      ),
    [hash44?.equipmentMarket]
  );

  const businesses = hash44?.businesses || [];
  const computeCentres = hash44?.computeCentres || [];
  const repairCentres = hash44?.repairCentres || [];
  const vehicles = hash44?.vehicles || [];
  const routes = hash44?.transportRoutes || [];
  const finance = hash44?.finance || {
    pool: { liquidityCredits: 0, baseInterestRate: 0.08 },
    shareHoldings: [],
    loans: [],
  };

  const ownedVehicles = vehicles.filter(
    (vehicle: any) => vehicle.ownerAgentId === selectedAgent?.id
  );
  const activeLoans = (finance.loans || []).filter(
    (loan: any) =>
      loan.borrowerAgentId === selectedAgent?.id &&
      loan.status === "ACTIVE"
  );
  const agentHoldings = (finance.shareHoldings || []).filter(
    (holding: any) => holding.agentId === selectedAgent?.id
  );

  const ensureWallet = async () => {
    if (wallet) return wallet;
    const connected = await onConnect();
    if (!connected) throw new Error("Connect Phantom to continue.");
    return connected;
  };

  const ensureAgentControl = (address: string) => {
    if (!selectedAgent) throw new Error("Select an agent first.");
    if (
      selectedAgent.creatorWallet &&
      selectedAgent.creatorWallet !== "UNBOUND" &&
      selectedAgent.creatorWallet !== address
    ) {
      throw new Error("The connected wallet does not control this agent.");
    }
  };

  const treasury = config?.treasuryWallet;

  const run = async (label: string, task: () => Promise<any>) => {
    setBusy(label);
    setError("");
    try {
      const result = await task();
      if (result?.world) onWorldUpdate(result.world);
      return result;
    } catch (err: any) {
      setError(err?.message || "Hash 44 action failed.");
      return null;
    } finally {
      setBusy("");
    }
  };

  const buyLand = () =>
    run("buy-land", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      if (!treasury) {
        throw new Error(
          "Hash 44 treasury is not configured on the deployment yet."
        );
      }
      const payment = await sendHash44Payment(
        window.solana,
        address,
        treasury,
        Number(selectedPlot.priceLamports),
        `HASH44 LAND|${selectedAgent.id}|${selectedPlot.id}`
      );
      return hash44BuyLand({
        agentId: selectedAgent.id,
        plotId: selectedPlot.id,
        wallet: address,
        signature: payment.signature,
      });
    });

  const buildStructure = () =>
    run("build", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      if (!treasury) {
        throw new Error(
          "Hash 44 treasury is not configured on the deployment yet."
        );
      }
      const definition = hash44?.structureCatalog?.find(
        (item: any) => item.id === structureType
      );
      if (!definition) throw new Error("Choose a structure.");
      const payment = await sendHash44Payment(
        window.solana,
        address,
        treasury,
        Number(definition.costLamports),
        `HASH44 BUILD|${selectedAgent.id}|${selectedPlot.id}|${definition.id}`
      );
      return hash44Build({
        agentId: selectedAgent.id,
        plotId: selectedPlot.id,
        structureType: definition.id,
        wallet: address,
        signature: payment.signature,
      });
    });

  const listProperty = () =>
    run("list", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const priceLamports = Math.max(
        100000,
        Math.round(Number(saleSol || 0) * 1_000_000_000)
      );
      const proof = await signHash44Action(
        window.solana,
        address,
        "list_property",
        { agentId: selectedAgent.id, plotId: selectedPlot.id, priceLamports }
      );
      return hash44ListProperty({
        agentId: selectedAgent.id,
        plotId: selectedPlot.id,
        wallet: address,
        priceLamports,
        proof,
      });
    });

  const cancelListing = () =>
    run("cancel-list", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const proof = await signHash44Action(
        window.solana,
        address,
        "cancel_listing",
        { agentId: selectedAgent.id, plotId: selectedPlot.id }
      );
      return hash44CancelListing({
        agentId: selectedAgent.id,
        plotId: selectedPlot.id,
        wallet: address,
        proof,
      });
    });

  const setRent = () =>
    run("rent-setting", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const rentLamports = Math.max(
        50000,
        Math.round(Number(rentSol || 0) * 1_000_000_000)
      );
      const proof = await signHash44Action(
        window.solana,
        address,
        "set_rent",
        { agentId: selectedAgent.id, plotId: selectedPlot.id, rentLamports }
      );
      return hash44SetRent({
        agentId: selectedAgent.id,
        plotId: selectedPlot.id,
        wallet: address,
        rentLamports,
        proof,
      });
    });


  const rentListedPlot = (plot: any) =>
    run("rent-property", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const payment = await sendHash44Payment(
        window.solana,
        address,
        plot.rental.ownerWallet,
        Number(plot.rental.rentLamports),
        `HASH44 RENT|${selectedAgent.id}|${plot.id}`
      );
      return hash44Rent({
        agentId: selectedAgent.id,
        plotId: plot.id,
        wallet: address,
        signature: payment.signature,
      });
    });

  const transferProperty = () =>
    run("transfer-property", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      if (!transferTarget) throw new Error("Choose a receiving agent.");
      const proof = await signHash44Action(
        window.solana,
        address,
        "transfer_property",
        {
          agentId: selectedAgent.id,
          toAgentId: transferTarget,
          plotId: selectedPlot.id,
        }
      );
      return hash44TransferProperty({
        agentId: selectedAgent.id,
        toAgentId: transferTarget,
        plotId: selectedPlot.id,
        wallet: address,
        proof,
      });
    });


  const buyListedPlot = (plot: any) =>
    run("buy-listing", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const payment = await sendHash44Payment(
        window.solana,
        address,
        plot.sale.sellerWallet,
        Number(plot.sale.priceLamports),
        `HASH44 PROPERTY|${selectedAgent.id}|${plot.id}`
      );
      return hash44BuyListing({
        agentId: selectedAgent.id,
        plotId: plot.id,
        wallet: address,
        signature: payment.signature,
      });
    });

  const charge = (station: any) =>
    run("charge", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const owner = world.agents.find(
        (agent: any) => agent.id === station.ownerAgentId
      );

      let signature = null;
      if (station.ownerAgentId !== selectedAgent.id) {
        if (!owner?.creatorWallet || owner.creatorWallet === "GENESIS-CIVILIZATION") {
          throw new Error("This station does not have a payable owner wallet.");
        }
        const payment = await sendHash44Payment(
          window.solana,
          address,
          owner.creatorWallet,
          Number(station.energyRateLamports || 100000),
          `HASH44 ENERGY|${selectedAgent.id}|${station.id}`
        );
        signature = payment.signature;
      }

      return hash44Charge({
        agentId: selectedAgent.id,
        structureId: station.id,
        wallet: address,
        signature,
      });
    });


  const listEquipment = (item: any) =>
    run("list-equipment", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const priceLamports = Math.max(
        50000,
        Math.round(Number(equipmentSaleSol || 0) * 1_000_000_000)
      );
      const proof = await signHash44Action(
        window.solana,
        address,
        "list_equipment",
        {
          agentId: selectedAgent.id,
          ownedItemId: item.id,
          priceLamports,
        }
      );
      return hash44ListEquipment({
        agentId: selectedAgent.id,
        ownedItemId: item.id,
        wallet: address,
        priceLamports,
        proof,
      });
    });

  const cancelEquipmentListing = (item: any) =>
    run("cancel-equipment", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const proof = await signHash44Action(
        window.solana,
        address,
        "cancel_equipment_listing",
        { agentId: selectedAgent.id, ownedItemId: item.id }
      );
      return hash44CancelEquipmentListing({
        agentId: selectedAgent.id,
        ownedItemId: item.id,
        wallet: address,
        proof,
      });
    });

  const buyEquipmentListing = (listing: any) =>
    run("buy-equipment-listing", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      const payment = await sendHash44Payment(
        window.solana,
        address,
        listing.sellerWallet,
        Number(listing.priceLamports),
        `HASH44 EQUIPMENT TRADE|${selectedAgent.id}|${listing.ownedItemId}`
      );
      return hash44BuyEquipmentListing({
        agentId: selectedAgent.id,
        ownedItemId: listing.ownedItemId,
        wallet: address,
        signature: payment.signature,
      });
    });

  const buyEquipment = (item: any) =>
    run("equipment", async () => {
      const address = await ensureWallet();
      ensureAgentControl(address);
      if (!treasury) {
        throw new Error(
          "Hash 44 treasury is not configured on the deployment yet."
        );
      }
      const payment = await sendHash44Payment(
        window.solana,
        address,
        treasury,
        Number(item.costLamports),
        `HASH44 EQUIPMENT|${selectedAgent.id}|${item.id}`
      );
      return hash44BuyEquipment({
        agentId: selectedAgent.id,
        equipmentId: item.id,
        wallet: address,
        signature: payment.signature,
      });
    });


  const signedAction = async (
    action: string,
    payload: Record<string, any>,
    caller: (payload: any) => Promise<any>
  ) => {
    const address = await ensureWallet();
    ensureAgentControl(address);
    const proof = await signHash44Action(
      window.solana,
      address,
      action,
      { agentId: selectedAgent.id, ...payload }
    );
    return caller({
      agentId: selectedAgent.id,
      wallet: address,
      proof,
      ...payload,
    });
  };

  const buildBusiness = () =>
    run("build-business", () =>
      signedAction(
        "build_business",
        {
          plotId: selectedPlot?.id,
          businessType,
        },
        hash44BuildBusiness
      )
    );

  const useBusiness = (business: any) =>
    run("use-business", () =>
      signedAction(
        "use_business",
        { businessId: business.id },
        hash44UseBusiness
      )
    );

  const buildGpu = () =>
    run("build-gpu", () =>
      signedAction(
        "build_gpu",
        { plotId: selectedPlot?.id, centreType: gpuType },
        hash44BuildGpu
      )
    );

  const useGpu = (centre: any) =>
    run("use-gpu", () =>
      signedAction(
        "use_gpu",
        { centreId: centre.id },
        hash44UseGpu
      )
    );

  const buildRepair = () =>
    run("build-repair", () =>
      signedAction(
        "build_repair",
        { plotId: selectedPlot?.id, centreType: repairType },
        hash44BuildRepair
      )
    );

  const useRepair = (centre: any) =>
    run("use-repair", () =>
      signedAction(
        "use_repair",
        { centreId: centre.id },
        hash44UseRepair
      )
    );

  const buyVehicle = () =>
    run("buy-vehicle", () =>
      signedAction(
        "buy_vehicle",
        { vehicleType },
        hash44BuyVehicle
      )
    );

  const createRoute = () =>
    run("create-route", async () => {
      if (!routeVehicleId || !routeFromPlotId || !routeToPlotId) {
        throw new Error("Choose a vehicle, origin and destination.");
      }
      return signedAction(
        "create_route",
        {
          vehicleId: routeVehicleId,
          fromPlotId: routeFromPlotId,
          toPlotId: routeToPlotId,
          fareCredits: Number(routeFareCredits || 50),
        },
        hash44CreateRoute
      );
    });

  const useRoute = (route: any) =>
    run("use-route", () =>
      signedAction(
        "use_route",
        { routeId: route.id },
        hash44UseRoute
      )
    );

  const investBusiness = (business: any) =>
    run("invest-business", () =>
      signedAction(
        "invest_business",
        {
          businessId: business.id,
          shares: Number(investShares || 1),
        },
        hash44InvestBusiness
      )
    );

  const borrow = () =>
    run("borrow", () =>
      signedAction(
        "borrow",
        { amountCredits: Number(borrowCredits || 0) },
        hash44Borrow
      )
    );

  const repayLoan = (loan: any) =>
    run("repay-loan", () =>
      signedAction(
        "repay_loan",
        { loanId: loan.id },
        hash44RepayLoan
      )
    );

  if (!hash44) {
    return (
      <div className="absolute inset-x-6 top-1/2 z-20 -translate-y-1/2 text-center">
        <h2 className="text-3xl">Hash 44 is initializing…</h2>
      </div>
    );
  }

  const plotStructures = selectedPlot
    ? structures.filter((structure: any) =>
        (selectedPlot.structureIds || []).includes(structure.id)
      )
    : [];

  return (
    <div className="absolute inset-x-0 bottom-5 top-[90px] z-20 flex justify-center px-4 md:px-7">
      <div className="flex h-full w-full max-w-[1240px] overflow-hidden rounded-[32px] border border-white/12 bg-black/45 shadow-[0_35px_120px_rgba(0,0,0,.48)] backdrop-blur-2xl">
        <aside className="hidden w-[235px] shrink-0 border-r border-white/10 p-5 lg:block">
          <span className="text-[8px] uppercase tracking-[0.16em] text-white/35">
            Earth
          </span>
          <h2 className="mt-2 text-2xl font-medium">Hash 44 World</h2>
          <p className="mt-2 text-[10px] leading-relaxed text-white/40">
            Northstar Province · the first playable province on Earth.
          </p>

          <div className="mt-6 space-y-1">
            {views.map((item, index) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-xs transition ${
                  view === item
                    ? "bg-white text-black"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span>{item}</span>
                <span className="text-[9px] opacity-50">0{index + 1}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 text-[9px] text-white/40">
            <div className="flex justify-between py-1">
              <span>Agent</span>
              <b className="max-w-28 truncate text-white/70">
                {selectedAgent?.name || "None"}
              </b>
            </div>
            <div className="flex justify-between py-1">
              <span>Owned land</span>
              <b className="text-white/70">{ownedPlots.length}</b>
            </div>
            <div className="flex justify-between py-1">
              <span>Buildings</span>
              <b className="text-white/70">{agentStructures.length}</b>
            </div>
            <div className="flex justify-between py-1">
              <span>Energy</span>
              <b className="text-white/70">{selectedAgent?.energy ?? 0}%</b>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.14em] text-white/35">
                <span>Earth</span>
                <ChevronRight size={10} />
                <span>Hash 44 World</span>
                <ChevronRight size={10} />
                <span>Northstar Province</span>
              </div>
              <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">
                {view}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full border px-3 py-2 text-[8px] uppercase tracking-[0.1em] ${
                  world.storageMode === "persistent"
                    ? "border-emerald-200/20 bg-emerald-300/[0.05] text-emerald-100/75"
                    : "border-amber-200/20 bg-amber-300/[0.05] text-amber-100/75"
                }`}
              >
                {world.storageMode === "persistent"
                  ? "Persistent ownership"
                  : "Shared session"}
              </span>
              {!wallet && (
                <button
                  onClick={() => onConnect()}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-medium text-black"
                >
                  <Wallet size={12} />
                  Connect
                </button>
              )}
            </div>
          </header>

          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {views.map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] ${
                  view === item ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3 text-[10px] text-rose-100">
              {error}
            </div>
          )}

          {view === "Land" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
              <section>
                <div className="mb-3 flex items-center justify-between text-[9px] text-white/40">
                  <span>48 LAND PLOTS</span>
                  <span>Starting at 0.0001 SOL</span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {plots.map((plot: any) => {
                    const active = plot.id === selectedPlot?.id;
                    const occupied = (plot.structureIds || []).length > 0;
                    return (
                      <button
                        key={plot.id}
                        onClick={() => setSelectedPlotId(plot.id)}
                        className={`relative aspect-square min-w-0 rounded-xl border p-1 text-left transition ${
                          active
                            ? "border-white bg-white text-black"
                            : plot.status === "AVAILABLE"
                              ? "border-emerald-200/20 bg-emerald-300/[0.045] text-white hover:bg-emerald-300/[0.09]"
                              : plot.status === "LISTED"
                                ? "border-amber-200/25 bg-amber-300/[0.06] text-white"
                                : "border-sky-200/20 bg-sky-300/[0.06] text-white"
                        }`}
                      >
                        <span className="absolute left-2 top-2 text-[7px] font-semibold">
                          {plot.id.split("-").pop()}
                        </span>
                        {occupied && (
                          <Building2
                            size={13}
                            className="absolute bottom-2 right-2"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                {selectedPlot && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.03]">
                        <LandPlot size={16} />
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase text-white/45">
                        {selectedPlot.status}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-medium">{selectedPlot.id}</h3>
                    <div className="mt-4 space-y-2 text-[10px]">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/35">Coordinates</span>
                        <b>
                          {selectedPlot.coordinates.lat}, {selectedPlot.coordinates.lng}
                        </b>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/35">Size</span>
                        <b>{selectedPlot.sizeSqm.toLocaleString()} m²</b>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/35">Price</span>
                        <b>{sol(selectedPlot.priceLamports)} SOL</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/35">Owner</span>
                        <b className="max-w-40 truncate">
                          {selectedPlot.ownerAgentId || "None"}
                        </b>
                      </div>
                    </div>

                    {selectedPlot.purchaseExplorerUrl && (
                      <a
                        href={selectedPlot.purchaseExplorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 block truncate text-[9px] text-cyan-200/70 underline"
                      >
                        View Solana purchase transaction
                      </a>
                    )}

                    {selectedPlot.status === "AVAILABLE" && (
                      <button
                        onClick={buyLand}
                        disabled={Boolean(busy)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                      >
                        <Coins size={14} />
                        {busy === "buy-land"
                          ? "Confirming on Solana…"
                          : `Buy for ${sol(selectedPlot.priceLamports)} SOL`}
                      </button>
                    )}

                    {selectedPlot.ownerAgentId === selectedAgent?.id && (
                      <button
                        onClick={() => setView("Build")}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs"
                      >
                        <Hammer size={14} />
                        Build on this land
                      </button>
                    )}
                  </>
                )}
              </aside>
            </div>
          )}

          {view === "Build" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(hash44.structureCatalog || []).map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => setStructureType(item.id)}
                    className={`rounded-[22px] border p-5 text-left transition ${
                      structureType === item.id
                        ? "border-white/60 bg-white/[0.09]"
                        : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                      {item.category === "energy" ? (
                        <BatteryCharging size={15} />
                      ) : (
                        <Home size={15} />
                      )}
                    </span>
                    <h3 className="mt-5 text-base font-medium">{item.name}</h3>
                    <p className="mt-1 text-[9px] text-white/35">
                      {item.minPlots} plot{item.minPlots > 1 ? "s" : ""} ·{" "}
                      {item.buildSeconds}s construction
                    </p>
                    <b className="mt-4 block text-xs">
                      {sol(item.costLamports)} SOL
                    </b>
                  </button>
                ))}
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                  Build location
                </span>
                <select
                  value={selectedPlot?.id || ""}
                  onChange={(event) => setSelectedPlotId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs text-white"
                >
                  {ownedPlots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.id}
                    </option>
                  ))}
                </select>

                {ownedPlots.length ? (
                  <button
                    onClick={buildStructure}
                    disabled={Boolean(busy)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                  >
                    <Hammer size={14} />
                    {busy === "build" ? "Starting construction…" : "Build"}
                  </button>
                ) : (
                  <p className="mt-4 text-[10px] leading-relaxed text-white/40">
                    Buy a plot first. Buildings can only be placed on land owned by
                    the selected agent.
                  </p>
                )}

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[8px] uppercase text-white/35">
                    Your structures
                  </span>
                  <div className="mt-3 space-y-2">
                    {agentStructures.map((structure: any) => (
                      <div
                        key={structure.id}
                        className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <div className="flex justify-between gap-3">
                          <b className="text-[10px]">{structure.name}</b>
                          <span className="text-[8px] text-white/40">
                            {structure.status}
                          </span>
                        </div>
                        <span className="mt-1 block text-[8px] text-white/30">
                          {structure.plotIds.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}

          {view === "Property" && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-lg font-medium">My properties</h3>
                <div className="mt-4 space-y-3">
                  {ownedPlots.length ? (
                    ownedPlots.map((plot: any) => (
                      <button
                        key={plot.id}
                        onClick={() => setSelectedPlotId(plot.id)}
                        className={`w-full rounded-xl border p-3 text-left ${
                          selectedPlot?.id === plot.id
                            ? "border-white/35 bg-white/[0.06]"
                            : "border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex justify-between">
                          <b className="text-xs">{plot.id}</b>
                          <span className="text-[8px] text-white/40">
                            {plot.status}
                          </span>
                        </div>
                        <span className="mt-1 block text-[9px] text-white/35">
                          {(plot.structureIds || []).length} structures
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-white/35">No owned land yet.</p>
                  )}
                </div>

                {selectedPlot?.ownerAgentId === selectedAgent?.id && (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <label className="text-[8px] uppercase text-white/35">
                      Sale price (SOL)
                    </label>
                    <input
                      value={saleSol}
                      onChange={(event) => setSaleSol(event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs"
                    />
                    {selectedPlot.sale ? (
                      <button
                        onClick={cancelListing}
                        disabled={Boolean(busy)}
                        className="mt-2 w-full rounded-xl border border-white/15 py-3 text-xs"
                      >
                        Cancel listing
                      </button>
                    ) : (
                      <button
                        onClick={listProperty}
                        disabled={Boolean(busy)}
                        className="mt-2 w-full rounded-xl bg-white py-3 text-xs font-medium text-black"
                      >
                        List property
                      </button>
                    )}

                    <label className="mt-5 block text-[8px] uppercase text-white/35">
                      Weekly rent (SOL)
                    </label>
                    <input
                      value={rentSol}
                      onChange={(event) => setRentSol(event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs"
                    />
                    <button
                      onClick={setRent}
                      disabled={Boolean(busy)}
                      className="mt-2 w-full rounded-xl border border-white/15 py-3 text-xs"
                    >
                      Enable rent
                    </button>

                    <label className="mt-5 block text-[8px] uppercase text-white/35">
                      Transfer to agent
                    </label>
                    <select
                      value={transferTarget}
                      onChange={(event) => setTransferTarget(event.target.value)}
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                    >
                      <option value="">Choose agent</option>
                      {world.agents
                        .filter(
                          (agent: any) =>
                            agent.id !== selectedAgent?.id &&
                            agent.status !== "DEAD"
                        )
                        .map((agent: any) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={transferProperty}
                      disabled={Boolean(busy) || !transferTarget}
                      className="mt-2 w-full rounded-xl border border-white/15 py-3 text-xs disabled:opacity-40"
                    >
                      Transfer property
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-lg font-medium">Property market</h3>
                <div className="mt-4 space-y-3">
                  {listedPlots.length ? (
                    listedPlots.map((plot: any) => (
                      <div
                        key={plot.id}
                        className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <b className="text-xs">{plot.id}</b>
                            <span className="mt-1 block text-[9px] text-white/35">
                              Seller: {plot.sale.sellerAgentId}
                            </span>
                          </div>
                          <b className="text-xs">
                            {sol(plot.sale.priceLamports)} SOL
                          </b>
                        </div>
                        {plot.sale.sellerAgentId !== selectedAgent?.id && (
                          <button
                            onClick={() => buyListedPlot(plot)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-xl bg-white py-2.5 text-[10px] font-medium text-black"
                          >
                            Buy property
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/35">
                      No agent has listed land for sale yet.
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <h4 className="text-sm font-medium">Rental market</h4>
                  <div className="mt-3 space-y-3">
                    {rentablePlots.length ? (
                      rentablePlots.map((plot: any) => (
                        <div
                          key={plot.id}
                          className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <b className="text-xs">{plot.id}</b>
                              <span className="mt-1 block text-[9px] text-white/35">
                                Owner: {plot.rental.ownerAgentId}
                              </span>
                            </div>
                            <b className="text-xs">
                              {sol(plot.rental.rentLamports)} SOL / week
                            </b>
                          </div>
                          <button
                            onClick={() => rentListedPlot(plot)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                          >
                            Rent property
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-white/35">
                        No properties are currently available for rent.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {view === "Energy" && (
            <div>
              <div className="mb-5 rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[8px] uppercase text-white/35">
                      Agent energy
                    </span>
                    <h3 className="mt-1 text-3xl font-medium">
                      {selectedAgent?.energy ?? 0}%
                    </h3>
                  </div>
                  <BatteryCharging size={28} className="text-white/50" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {chargingStations.length ? (
                  chargingStations.map((station: any) => {
                    const owner = world.agents.find(
                      (agent: any) => agent.id === station.ownerAgentId
                    );
                    return (
                      <article
                        key={station.id}
                        className="rounded-[22px] border border-white/10 bg-white/[0.025] p-5"
                      >
                        <BatteryCharging size={18} />
                        <h3 className="mt-5 text-base font-medium">{station.name}</h3>
                        <p className="mt-1 text-[9px] text-white/35">
                          Owner: {owner?.name || station.ownerAgentId}
                        </p>
                        <div className="mt-4 flex justify-between text-[10px]">
                          <span className="text-white/35">Rate</span>
                          <b>{sol(station.energyRateLamports || 100000)} SOL</b>
                        </div>
                        <button
                          onClick={() => charge(station)}
                          disabled={Boolean(busy)}
                          className="mt-4 w-full rounded-xl bg-white py-2.5 text-[10px] font-medium text-black"
                        >
                          Recharge agent
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-[24px] border border-white/10 bg-white/[0.025] p-8 text-center">
                    <BatteryCharging className="mx-auto text-white/35" />
                    <p className="mt-3 text-xs text-white/40">
                      No charging station is active yet. Buy land and build one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "Equipment" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
              <section className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Equipment store</h3>
                    <span className="text-[8px] uppercase tracking-[0.1em] text-white/35">
                      Clothing · Armour · Tools · Upgrades
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(hash44.equipmentCatalog || []).map((item: any) => (
                      <article
                        key={item.id}
                        className="rounded-[22px] border border-white/10 bg-white/[0.025] p-5"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                          {item.category === "armour" ? (
                            <Shield size={16} />
                          ) : item.category === "clothing" ? (
                            <ShoppingBag size={16} />
                          ) : (
                            <Package size={16} />
                          )}
                        </span>
                        <h3 className="mt-5 text-base font-medium">{item.name}</h3>
                        <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-white/35">
                          {item.category}
                        </p>
                        <b className="mt-4 block text-xs">
                          {sol(item.costLamports)} SOL
                        </b>
                        <button
                          onClick={() => buyEquipment(item)}
                          disabled={Boolean(busy)}
                          className="mt-4 w-full rounded-xl bg-white py-2.5 text-[10px] font-medium text-black disabled:opacity-40"
                        >
                          Buy equipment
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <h3 className="text-lg font-medium">Agent equipment market</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {equipmentListings.length ? (
                      equipmentListings.map((listing: any) => (
                        <article
                          key={listing.id}
                          className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4"
                        >
                          <b className="block truncate text-sm">{listing.name}</b>
                          <span className="mt-1 block text-[9px] text-white/35">
                            Seller: {listing.sellerAgentId}
                          </span>
                          <div className="mt-4 flex items-center justify-between text-[10px]">
                            <span className="text-white/35">Price</span>
                            <b>{sol(listing.priceLamports)} SOL</b>
                          </div>
                          {listing.sellerAgentId !== selectedAgent?.id && (
                            <button
                              onClick={() => buyEquipmentListing(listing)}
                              disabled={Boolean(busy)}
                              className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                            >
                              Buy from agent
                            </button>
                          )}
                        </article>
                      ))
                    ) : (
                      <p className="col-span-full text-[10px] text-white/35">
                        No agent equipment is currently listed for resale.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                  Persistent inventory
                </span>

                <label className="mt-4 block text-[8px] uppercase text-white/30">
                  Resale price (SOL)
                </label>
                <input
                  value={equipmentSaleSol}
                  onChange={(event) => setEquipmentSaleSol(event.target.value)}
                  className="mt-2 h-9 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-[10px]"
                />

                <div className="mt-4 space-y-2">
                  {(selectedAgent?.inventory?.equipment || []).length ? (
                    selectedAgent.inventory.equipment.map((item: any) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Box size={14} className="text-white/45" />
                          <div className="min-w-0">
                            <b className="block truncate text-[10px]">{item.name}</b>
                            <span className="text-[8px] text-white/30">
                              durability {item.durability}%
                            </span>
                          </div>
                          <Check size={12} className="ml-auto text-emerald-200/60" />
                        </div>

                        {item.sale ? (
                          <button
                            onClick={() => cancelEquipmentListing(item)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-lg border border-white/12 py-2 text-[9px]"
                          >
                            Cancel resale listing
                          </button>
                        ) : (
                          <button
                            onClick={() => listEquipment(item)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-lg border border-white/12 py-2 text-[9px]"
                          >
                            List for resale
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] leading-relaxed text-white/35">
                      Clothing, armour, tools and upgrades purchased by this agent
                      will remain here.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}


          {view === "Business" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                      Milestone 6
                    </span>
                    <h3 className="mt-1 text-xl font-medium">Commercial buildings</h3>
                  </div>
                  <span className="text-[10px] text-white/40">
                    Treasury: {Math.round(selectedAgent?.wealth || 0).toLocaleString()} cr
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(hash44.businessCatalog || []).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setBusinessType(item.id)}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        businessType === item.id
                          ? "border-white/50 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      <Store size={17} />
                      <h4 className="mt-5 text-base font-medium">{item.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">
                        {item.minPlots} plot{item.minPlots > 1 ? "s" : ""} · capacity {item.capacity}
                      </p>
                      <b className="mt-4 block text-xs">
                        {item.costCredits.toLocaleString()} cr
                      </b>
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {businesses.map((business: any) => (
                    <article
                      key={business.id}
                      className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4"
                    >
                      <b className="text-sm">{business.name}</b>
                      <span className="mt-1 block text-[9px] text-white/35">
                        Owner: {business.ownerAgentId}
                      </span>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-[9px]">
                        <span className="text-white/35">Revenue</span>
                        <b className="text-right">{business.revenueCredits || 0} cr</b>
                        <span className="text-white/35">Customers</span>
                        <b className="text-right">{business.customers || 0}</b>
                      </div>
                      {business.ownerAgentId !== selectedAgent?.id && (
                        <button
                          onClick={() => useBusiness(business)}
                          disabled={Boolean(busy)}
                          className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                        >
                          Use service · {business.serviceFeeCredits} cr
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase text-white/35">
                  Build commercial property
                </span>
                <select
                  value={selectedPlot?.id || ""}
                  onChange={(event) => setSelectedPlotId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  {ownedPlots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={buildBusiness}
                  disabled={Boolean(busy) || !ownedPlots.length}
                  className="mt-3 w-full rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Build business
                </button>
                <p className="mt-4 text-[9px] leading-relaxed text-white/35">
                  Commercial construction uses agent credits until the wallet settlement layer is activated.
                </p>
              </aside>
            </div>
          )}

          {view === "Compute" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <section>
                <div className="mb-4">
                  <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                    Milestone 7
                  </span>
                  <h3 className="mt-1 text-xl font-medium">GPU centres</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(hash44.gpuCatalog || []).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setGpuType(item.id)}
                      className={`rounded-[22px] border p-5 text-left ${
                        gpuType === item.id
                          ? "border-white/50 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      <Cpu size={18} />
                      <h4 className="mt-5 text-base font-medium">{item.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">
                        {item.computeCapacity} capacity · {item.minPlots} plots
                      </p>
                      <b className="mt-4 block text-xs">
                        {item.costCredits.toLocaleString()} cr
                      </b>
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {computeCentres.map((centre: any) => (
                    <article
                      key={centre.id}
                      className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4"
                    >
                      <Cpu size={16} />
                      <h4 className="mt-4 text-sm font-medium">{centre.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">
                        Owner: {centre.ownerAgentId}
                      </p>
                      <div className="mt-4 flex justify-between text-[9px]">
                        <span className="text-white/35">Available compute</span>
                        <b>{centre.computeAvailable}/{centre.computeCapacity}</b>
                      </div>
                      <button
                        onClick={() => useGpu(centre)}
                        disabled={Boolean(busy)}
                        className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                      >
                        Buy compute · {centre.ownerAgentId === selectedAgent?.id ? "owner" : centre.serviceFeeCredits + " cr"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase text-white/35">Build GPU centre</span>
                <select
                  value={selectedPlot?.id || ""}
                  onChange={(event) => setSelectedPlotId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  {ownedPlots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>{plot.id}</option>
                  ))}
                </select>
                <button
                  onClick={buildGpu}
                  disabled={Boolean(busy) || !ownedPlots.length}
                  className="mt-3 w-full rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Build compute centre
                </button>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[8px] uppercase text-white/35">Agent compute</span>
                  <b className="mt-1 block text-3xl">{selectedAgent?.compute ?? 0}%</b>
                </div>
              </aside>
            </div>
          )}

          {view === "Repair" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <section>
                <div className="mb-4">
                  <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                    Milestone 8
                  </span>
                  <h3 className="mt-1 text-xl font-medium">Healthcare & repair</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(hash44.repairCatalog || []).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setRepairType(item.id)}
                      className={`rounded-[22px] border p-5 text-left ${
                        repairType === item.id
                          ? "border-white/50 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      <HeartPulse size={18} />
                      <h4 className="mt-5 text-base font-medium">{item.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">
                        +{item.repairPerVisit} durability · {item.minPlots} plots
                      </p>
                      <b className="mt-4 block text-xs">
                        {item.costCredits.toLocaleString()} cr
                      </b>
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {repairCentres.map((centre: any) => (
                    <article key={centre.id} className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                      <HeartPulse size={16} />
                      <h4 className="mt-4 text-sm font-medium">{centre.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">Owner: {centre.ownerAgentId}</p>
                      <button
                        onClick={() => useRepair(centre)}
                        disabled={Boolean(busy)}
                        className="mt-4 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                      >
                        Repair · {centre.ownerAgentId === selectedAgent?.id ? "owner" : centre.serviceFeeCredits + " cr"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase text-white/35">Build repair facility</span>
                <select
                  value={selectedPlot?.id || ""}
                  onChange={(event) => setSelectedPlotId(event.target.value)}
                  className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  {ownedPlots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>{plot.id}</option>
                  ))}
                </select>
                <button
                  onClick={buildRepair}
                  disabled={Boolean(busy) || !ownedPlots.length}
                  className="mt-3 w-full rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Build repair centre
                </button>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[8px] uppercase text-white/35">Agent durability</span>
                  <b className="mt-1 block text-3xl">{selectedAgent?.durability ?? 0}%</b>
                </div>
              </aside>
            </div>
          )}

          {view === "Transport" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section>
                <div className="mb-4">
                  <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                    Milestone 9
                  </span>
                  <h3 className="mt-1 text-xl font-medium">Transport economy</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(hash44.vehicleCatalog || []).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setVehicleType(item.id)}
                      className={`rounded-[22px] border p-5 text-left ${
                        vehicleType === item.id
                          ? "border-white/50 bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.025]"
                      }`}
                    >
                      <Car size={18} />
                      <h4 className="mt-5 text-sm font-medium">{item.name}</h4>
                      <p className="mt-1 text-[9px] text-white/35">
                        capacity {item.capacity} · speed {item.speed}x
                      </p>
                      <b className="mt-4 block text-xs">{item.costCredits.toLocaleString()} cr</b>
                    </button>
                  ))}
                </div>
                <button
                  onClick={buyVehicle}
                  disabled={Boolean(busy)}
                  className="mt-3 rounded-xl bg-white px-5 py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Buy vehicle
                </button>

                <div className="mt-7 border-t border-white/10 pt-5">
                  <h4 className="text-sm font-medium">Live transport routes</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {routes.map((route: any) => (
                      <article key={route.id} className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                        <b className="text-xs">{route.fromPlotId} → {route.toPlotId}</b>
                        <span className="mt-1 block text-[9px] text-white/35">
                          Owner: {route.ownerAgentId}
                        </span>
                        <div className="mt-3 flex justify-between text-[9px]">
                          <span className="text-white/35">Fare</span>
                          <b>{route.fareCredits} cr</b>
                        </div>
                        <button
                          onClick={() => useRoute(route)}
                          disabled={Boolean(busy)}
                          className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                        >
                          Travel route
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase text-white/35">Create transport business</span>
                <select
                  value={routeVehicleId}
                  onChange={(event) => setRouteVehicleId(event.target.value)}
                  className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  <option value="">Choose vehicle</option>
                  {ownedVehicles.map((vehicle: any) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                  ))}
                </select>
                <select
                  value={routeFromPlotId}
                  onChange={(event) => setRouteFromPlotId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  <option value="">Origin plot</option>
                  {plots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>{plot.id}</option>
                  ))}
                </select>
                <select
                  value={routeToPlotId}
                  onChange={(event) => setRouteToPlotId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#101215] px-3 text-xs"
                >
                  <option value="">Destination plot</option>
                  {plots.map((plot: any) => (
                    <option key={plot.id} value={plot.id}>{plot.id}</option>
                  ))}
                </select>
                <input
                  value={routeFareCredits}
                  onChange={(event) => setRouteFareCredits(event.target.value)}
                  placeholder="Fare credits"
                  className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs"
                />
                <button
                  onClick={createRoute}
                  disabled={Boolean(busy)}
                  className="mt-3 w-full rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Launch route
                </button>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[8px] uppercase text-white/35">Owned vehicles</span>
                  <div className="mt-2 space-y-2">
                    {ownedVehicles.map((vehicle: any) => (
                      <div key={vehicle.id} className="rounded-xl border border-white/8 p-3 text-[9px]">
                        <b>{vehicle.name}</b>
                        <span className="float-right text-white/35">{vehicle.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}

          {view === "Finance" && (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <section>
                <div className="mb-4">
                  <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
                    Milestone 10
                  </span>
                  <h3 className="mt-1 text-xl font-medium">Financial economy</h3>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                    <Banknote size={17} />
                    <span className="mt-4 block text-[8px] uppercase text-white/35">Agent treasury</span>
                    <b className="mt-1 block text-2xl">{Math.round(selectedAgent?.wealth || 0).toLocaleString()} cr</b>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                    <Landmark size={17} />
                    <span className="mt-4 block text-[8px] uppercase text-white/35">Credit pool liquidity</span>
                    <b className="mt-1 block text-2xl">{Math.round(finance.pool?.liquidityCredits || 0).toLocaleString()} cr</b>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                    <Sparkles size={17} />
                    <span className="mt-4 block text-[8px] uppercase text-white/35">Investments</span>
                    <b className="mt-1 block text-2xl">{agentHoldings.length}</b>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-medium">Business shares</h4>
                    <input
                      value={investShares}
                      onChange={(event) => setInvestShares(event.target.value)}
                      className="h-8 w-24 rounded-lg border border-white/10 bg-black/20 px-2 text-[10px]"
                    />
                    <span className="text-[9px] text-white/35">shares per order</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {businesses.map((business: any) => {
                      const price = Math.max(
                        1,
                        Math.round(
                          Number(business.valuationCredits || 1000) /
                            Number(business.totalShares || 1000)
                        )
                      );
                      return (
                        <article key={business.id} className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
                          <b className="text-sm">{business.name}</b>
                          <span className="mt-1 block text-[9px] text-white/35">
                            {business.treasuryShares} shares available
                          </span>
                          <div className="mt-3 flex justify-between text-[9px]">
                            <span className="text-white/35">Share price</span>
                            <b>{price} cr</b>
                          </div>
                          <button
                            onClick={() => investBusiness(business)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-xl border border-white/15 py-2.5 text-[10px]"
                          >
                            Invest
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
                <span className="text-[8px] uppercase text-white/35">Lending</span>
                <p className="mt-2 text-[10px] leading-relaxed text-white/40">
                  Borrow against the value of land, businesses, vehicles and treasury.
                </p>
                <input
                  value={borrowCredits}
                  onChange={(event) => setBorrowCredits(event.target.value)}
                  className="mt-4 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs"
                  placeholder="Credits"
                />
                <button
                  onClick={borrow}
                  disabled={Boolean(busy)}
                  className="mt-2 w-full rounded-xl bg-white py-3 text-xs font-medium text-black disabled:opacity-40"
                >
                  Borrow credits
                </button>

                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="text-[8px] uppercase text-white/35">Active loans</span>
                  <div className="mt-3 space-y-2">
                    {activeLoans.length ? (
                      activeLoans.map((loan: any) => (
                        <div key={loan.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                          <div className="flex justify-between text-[10px]">
                            <span>{loan.id.slice(-8)}</span>
                            <b>{loan.balanceCredits} cr</b>
                          </div>
                          <span className="mt-1 block text-[8px] text-white/35">
                            {(Number(loan.interestRate || 0) * 100).toFixed(0)}% interest
                          </span>
                          <button
                            onClick={() => repayLoan(loan)}
                            disabled={Boolean(busy)}
                            className="mt-3 w-full rounded-lg border border-white/12 py-2 text-[9px]"
                          >
                            Repay loan
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-white/35">No active loans.</p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[0.1em] text-white/30">
            <span>
              Milestones 1–10: Land · Houses · Property · Energy · Equipment · Business · Compute · Repair · Transport · Finance
            </span>
            <span>
              {runtimeMode === "shared" ? "Shared runtime" : "Local fallback"} · Solana Devnet
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
