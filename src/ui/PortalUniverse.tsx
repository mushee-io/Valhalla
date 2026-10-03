import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  ChevronRight,
  CircleDot,
  Coins,
  Gauge,
  Globe2,
  Landmark,
  Menu,
  Orbit,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { getRegion, shortWallet } from "../world";

type PortalUniverseProps = {
  world: any;
  selectedAgent: any;
  selectedRegion: any;
  onSelectAgent: (agentId: string, regionId: string) => void;
  onSelectRegion: (regionId: string) => void;
  onConnect: () => void;
  onDeploy: () => void;
  onExit: () => void;
};

const BG_VIDEO =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4";

const tabs = ["Agents", "World", "Cities", "Economy"] as const;

export default function PortalUniverse({
  world,
  selectedAgent,
  selectedRegion,
  onSelectAgent,
  onSelectRegion,
  onConnect,
  onDeploy,
  onExit,
}: PortalUniverseProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Agents");
  const [query, setQuery] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const aliveAgents = useMemo(
    () => world.agents.filter((agent: any) => agent.status !== "DEAD"),
    [world.agents]
  );

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aliveAgents;
    return aliveAgents.filter((agent: any) => {
      const region = getRegion(agent.regionId);
      return [
        agent.name,
        agent.archetype,
        agent.personality,
        agent.status,
        region?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [aliveAgents, query]);

  const selectedIndex = Math.max(
    0,
    aliveAgents.findIndex((agent: any) => agent.id === selectedAgent?.id)
  );
  const nextAgent =
    aliveAgents.length > 1
      ? aliveAgents[(selectedIndex + 1) % aliveAgents.length]
      : selectedAgent;

  const city = (world.settlements || []).find(
    (item: any) => item.regionId === selectedAgent?.regionId
  );
  const nation = (world.nations || []).find((item: any) =>
    item.regions?.includes(selectedAgent?.regionId)
  );
  const ownedProperty = (world.properties || []).filter(
    (property: any) => property.ownerId === selectedAgent?.id
  );

  const facts = [
    ["Location:", getRegion(selectedAgent?.regionId)?.name || "Unknown"],
    ["Status:", selectedAgent?.status || "Unknown"],
    ["Energy:", `${selectedAgent?.energy ?? 0}%`],
    ["Treasury:", `${Math.round(selectedAgent?.wealth || 0).toLocaleString()} credits`],
    ["Property:", `${ownedProperty.length} owned assets`],
    ["Objective:", selectedAgent?.objective || "No objective"],
  ];

  const selectNext = () => {
    if (!nextAgent) return;
    onSelectAgent(nextAgent.id, nextAgent.regionId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -13, y: px * 15 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <main className="portal-universe relative h-screen min-h-[620px] overflow-hidden bg-[#090807] text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={BG_VIDEO}
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,8,.66),rgba(6,7,8,.1)_44%,rgba(6,7,8,.2)),linear-gradient(180deg,rgba(0,0,0,.06)_0%,rgba(0,0,0,.10)_52%,rgba(0,0,0,.9)_100%)]" />
      <div className="portal-universe-noise absolute inset-0 opacity-30" />

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 md:px-7 md:py-6">
        <button onClick={onExit} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border border-white/35 bg-white/[0.04] text-sm font-semibold backdrop-blur-md">
            V
          </span>
          <span className="hidden sm:block">
            <b className="block text-xs font-semibold tracking-[0.24em]">VALHALLA</b>
            <span className="mt-1 block text-[8px] tracking-[0.18em] text-white/45">
              AGENT CIVILIZATION
            </span>
          </span>
        </button>

        <div className="hidden items-center rounded-full border border-white/35 bg-white/10 p-1 backdrop-blur-xl md:flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-xs transition ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-white/75 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center">
          <button
            onClick={onConnect}
            className="hidden h-10 items-center gap-2 rounded-full border border-white/35 bg-white/10 px-4 text-xs backdrop-blur-xl sm:flex"
          >
            <Wallet size={14} />
            {world.wallet ? shortWallet(world.wallet) : "Connect Wallet"}
          </button>
          <button
            onClick={onDeploy}
            className="ml-2 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-medium text-black"
          >
            <Rocket size={14} />
            <span className="hidden sm:inline">Deploy Agent</span>
          </button>
          <button className="ml-2 grid h-10 w-10 place-items-center rounded-full bg-white text-black md:hidden">
            <Menu size={16} />
          </button>
        </div>
      </header>

      <aside className="absolute bottom-[25%] left-4 top-[108px] z-20 hidden w-[240px] flex-col md:flex lg:left-7 lg:w-[265px]">
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-[0.15em] text-white/45">
            All agents
          </span>
          <div className="mt-2 flex items-center justify-between">
            <b className="text-lg font-medium">{aliveAgents.length} active entities</b>
            <span className="flex items-center gap-1.5 text-[9px] text-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_rgba(110,231,183,.8)]" />
              LIVE
            </span>
          </div>
        </div>

        <label className="mb-3 flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 backdrop-blur-xl">
          <Search size={13} className="text-white/45" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents"
            className="h-auto w-full border-0 bg-transparent p-0 text-xs text-white outline-none placeholder:text-white/30"
          />
        </label>

        <div className="portal-agent-list min-h-0 flex-1 overflow-y-auto pr-1">
          {filteredAgents.map((agent: any, index: number) => {
            const active = agent.id === selectedAgent?.id;
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.015, 0.3) }}
                onClick={() => onSelectAgent(agent.id, agent.regionId)}
                className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                  active
                    ? "bg-white text-black"
                    : "bg-black/10 text-white hover:bg-white/10"
                }`}
              >
                <span
                  className={`h-3.5 w-3.5 shrink-0 rounded-full ${
                    active
                      ? "bg-black"
                      : "border border-white/60 bg-white/25"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-xs font-medium">{agent.name}</b>
                  <span
                    className={`mt-0.5 block truncate text-[9px] ${
                      active ? "text-black/50" : "text-white/40"
                    }`}
                  >
                    {agent.archetype} · {getRegion(agent.regionId)?.name}
                  </span>
                </span>
                <span
                  className={`text-[8px] ${
                    active ? "text-black/45" : "text-white/30"
                  }`}
                >
                  {agent.status}
                </span>
              </motion.button>
            );
          })}
        </div>
      </aside>

      <section className="absolute left-1/2 top-[46%] z-20 w-[min(330px,52vw)] -translate-x-1/2 -translate-y-1/2 md:w-[min(360px,31vw)]">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-white/70">Next:</span>
          <span className="text-white/80">
            <span className="mr-2 text-white/50">
              [{String((selectedIndex + 2) % Math.max(aliveAgents.length, 1) || 1).padStart(2, "0")}]
            </span>
            <strong className="text-base">{nextAgent?.name || "Agent"}</strong>
          </span>
        </div>

        <motion.button
          onClick={selectNext}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetTilt}
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.8 }}
          style={{ transformStyle: "preserve-3d", perspective: 900 }}
          className="portal-agent-window relative block w-full overflow-hidden rounded-[88px] border-0 bg-transparent"
        >
          <div className="relative aspect-[320/350] overflow-hidden rounded-[88px] border border-white/35 bg-black/35 shadow-[0_30px_90px_rgba(0,0,0,.34)] backdrop-blur-sm">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-85"
              src={BG_VIDEO}
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.08),transparent_28%),linear-gradient(180deg,transparent,rgba(0,0,0,.76))]" />
            <div className="portal-agent-grid absolute inset-0 opacity-35" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative grid h-36 w-36 place-items-center rounded-full border border-white/20 bg-white/[0.03] backdrop-blur-sm">
                <div className="absolute h-28 w-28 rounded-full border border-dashed border-white/25 animate-spin-slow" />
                <div className="absolute h-20 w-20 rounded-full border border-white/15" />
                <Zap size={28} className="text-white" />
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 text-left">
              <span className="text-[8px] uppercase tracking-[0.14em] text-white/45">
                Autonomous Entity
              </span>
              <b className="mt-1 block text-lg font-medium">{nextAgent?.name}</b>
              <span className="mt-1 block text-[10px] text-white/45">
                {nextAgent?.archetype} · {nextAgent?.personality}
              </span>
            </div>
          </div>
        </motion.button>
      </section>

      <section className="absolute bottom-5 left-5 right-5 z-20 md:bottom-7 md:left-7 md:right-7">
        <div className="flex items-end justify-between gap-8">
          <div className="min-w-0 flex-1 md:pl-[275px] lg:pl-[290px]">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-[0.1em] text-white/50">
              <span className="flex items-center gap-1.5">
                <CircleDot size={11} />
                {selectedAgent?.status}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={11} />
                {getRegion(selectedAgent?.regionId)?.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity size={11} />
                Tick {world.tick}
              </span>
            </div>

            <motion.h1
              key={selectedAgent?.id}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="portal-agent-title truncate font-['Arial_Narrow',Arial,sans-serif] text-[clamp(72px,11vw,165px)] font-normal leading-[0.72] tracking-[-0.045em]"
            >
              {selectedAgent?.name || "AGENT"}
            </motion.h1>
          </div>

          <div className="hidden w-[min(460px,35vw)] shrink-0 md:block">
            <dl className="text-[11px] lg:text-xs">
              {facts.slice(0, 4).map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[96px_1fr] gap-4 border-b border-white/35 py-2.5 last:border-b-0 lg:grid-cols-[116px_1fr]"
                >
                  <dt className="font-semibold text-white">{label}</dt>
                  <dd className="m-0 truncate text-white/70">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 md:ml-[275px] lg:ml-[290px]">
          <div className="flex items-center gap-4 overflow-hidden">
            <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Live signal
            </span>
            <p className="truncate text-[10px] text-white/60">
              {selectedAgent?.thought || "Agent is observing the world."}
            </p>
          </div>

          <div className="ml-4 hidden items-center gap-4 text-[9px] text-white/45 lg:flex">
            <span className="flex items-center gap-1.5">
              <Building2 size={11} /> {(world.settlements || []).length} cities
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={11} /> {(world.nations || []).length} nations
            </span>
            <span className="flex items-center gap-1.5">
              <Coins size={11} /> {Math.round(world.totalVolume || 0).toLocaleString()} volume
            </span>
          </div>
        </div>
      </section>

      <aside className="absolute right-5 top-[112px] z-20 hidden w-[260px] xl:block">
        <div className="rounded-2xl border border-white/15 bg-black/15 p-4 backdrop-blur-xl">
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/40">
            Selected agent
          </span>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              [Gauge, "Energy", `${selectedAgent?.energy ?? 0}%`],
              [Zap, "Compute", `${selectedAgent?.compute ?? 0}%`],
              [Coins, "Treasury", Math.round(selectedAgent?.wealth || 0).toLocaleString()],
              [Landmark, "Property", ownedProperty.length],
            ].map(([Icon, label, value]: any) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
              >
                <Icon size={13} className="text-white/55" />
                <span className="mt-2 block text-[8px] uppercase tracking-[0.1em] text-white/35">
                  {label}
                </span>
                <b className="mt-1 block text-sm font-medium">{value}</b>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
              Affiliation
            </span>
            <p className="mt-2 text-xs text-white/70">
              {nation?.name || "Independent"}
              {city ? ` · ${city.name}` : ""}
            </p>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <span className="text-[8px] uppercase tracking-[0.12em] text-white/35">
              Objective
            </span>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              {selectedAgent?.objective}
            </p>
          </div>

          <button
            onClick={onDeploy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-xs font-medium text-black"
          >
            <Rocket size={13} />
            Deploy another agent
          </button>
        </div>
      </aside>

      <div className="absolute bottom-[22%] right-5 z-20 hidden items-center gap-2 rounded-full border border-white/20 bg-black/15 px-3 py-2 text-[9px] text-white/55 backdrop-blur-xl lg:flex">
        <Sparkles size={12} />
        {aliveAgents.length} agents · {(world.properties || []).length} assets · {(world.conflicts || []).length} wars
      </div>

      <button
        onClick={selectNext}
        className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[10px] backdrop-blur-xl md:flex"
      >
        Next agent
        <ChevronRight size={13} />
      </button>
    </main>
  );
}
