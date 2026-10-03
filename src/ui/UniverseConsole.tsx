import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Building2,
  ChevronDown,
  Crosshair,
  Globe2,
  Layers3,
  Map,
  Orbit,
  Pause,
  Play,
  Radar,
  Rocket,
  Shield,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { REGIONS, ROUTES, getRegion, shortWallet } from "../world";

type UniverseConsoleProps = {
  world: any;
  selectedAgent: any;
  selectedRegion: any;
  onSelectRegion: (regionId: string) => void;
  onSelectAgent: (agentId: string, regionId: string) => void;
  onConnect: () => void;
  onDeploy: () => void;
  onToggleWorld: () => void;
  onExit: () => void;
};

const tabs = ["World", "Agents", "Economy", "Territories"] as const;

function regionTone(kind: string) {
  if (kind === "market") return "from-violet-400/70 to-fuchsia-300/30";
  if (kind === "resource") return "from-amber-300/70 to-orange-400/30";
  if (kind === "industry") return "from-sky-300/70 to-cyan-400/30";
  if (kind === "wild") return "from-rose-400/70 to-red-500/30";
  return "from-emerald-300/70 to-cyan-300/30";
}

export default function UniverseConsole({
  world,
  selectedAgent,
  selectedRegion,
  onSelectRegion,
  onSelectAgent,
  onConnect,
  onDeploy,
  onToggleWorld,
  onExit,
}: UniverseConsoleProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("World");
  const [layersOpen, setLayersOpen] = useState(true);
  const [showAgents, setShowAgents] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showNations, setShowNations] = useState(true);

  const localAgents = useMemo(
    () =>
      world.agents.filter(
        (agent: any) =>
          agent.regionId === selectedRegion.id && agent.status !== "DEAD"
      ),
    [world.agents, selectedRegion.id]
  );

  const localProperties = useMemo(
    () =>
      (world.properties || []).filter(
        (property: any) => property.regionId === selectedRegion.id
      ),
    [world.properties, selectedRegion.id]
  );

  const city = (world.settlements || []).find(
    (item: any) => item.regionId === selectedRegion.id
  );

  const nation = (world.nations || []).find((item: any) =>
    item.regions?.includes(selectedRegion.id)
  );

  const events = (world.events || []).slice(0, 7);

  return (
    <div className="relative h-screen min-h-[680px] overflow-hidden bg-[#06090c] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(49,102,124,0.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(100,61,150,0.14),transparent_28%),linear-gradient(180deg,#091014_0%,#06090c_100%)]" />
      <div className="universe-noise absolute inset-0 opacity-30" />
      <div className="universe-stars absolute inset-0 opacity-50" />

      <header className="relative z-30 flex h-[74px] items-center justify-between border-b border-white/10 bg-black/15 px-4 backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="grid h-10 w-10 place-items-center border border-white/15 bg-white/[0.03] text-sm font-semibold hover:bg-white/[0.07]"
          >
            V
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold tracking-[0.24em]">VALHALLA</p>
            <p className="mt-1 text-[8px] tracking-[0.18em] text-white/40">
              LIVE CIVILIZATION CONSOLE
            </p>
          </div>
          <div className="hidden h-8 w-px bg-white/10 md:block" />
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
            <span className="text-[10px] font-medium tracking-[0.12em] text-white/60">
              WORLD LIVE · TICK {world.tick}
            </span>
          </div>
        </div>

        <div className="hidden rounded-full border border-white/10 bg-white/[0.025] p-1 lg:flex">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-xs transition ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWorld}
            className="universe-glass hidden h-10 items-center gap-2 rounded-full px-4 text-xs sm:flex"
          >
            {world.running ? <Pause size={14} /> : <Play size={14} />}
            {world.running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={onConnect}
            className="universe-glass flex h-10 items-center gap-2 rounded-full px-4 text-xs"
          >
            <Wallet size={14} />
            <span className="hidden sm:inline">
              {world.wallet ? shortWallet(world.wallet) : "Connect Wallet"}
            </span>
          </button>
          <button
            onClick={onDeploy}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-black transition hover:bg-cyan-100"
          >
            <Rocket size={14} />
            <span className="hidden sm:inline">Deploy Agent</span>
          </button>
        </div>
      </header>

      <main className="relative z-20 grid h-[calc(100vh-74px)] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_330px]">
        <motion.aside
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="universe-sidebar hidden border-r border-white/10 bg-black/10 p-4 backdrop-blur-2xl lg:block"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] tracking-[0.16em] text-white/35">WORLD CONTROL</p>
              <h2 className="mt-1 text-lg font-medium">Universe layers</h2>
            </div>
            <button
              onClick={() => setLayersOpen((value) => !value)}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.03]"
            >
              <ChevronDown
                size={15}
                className={`transition-transform ${layersOpen ? "" : "-rotate-90"}`}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {layersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {[
                  ["Agents", showAgents, setShowAgents, Radar],
                  ["Trade routes", showRoutes, setShowRoutes, Orbit],
                  ["Cities", showCities, setShowCities, Building2],
                  ["Nations", showNations, setShowNations, Shield],
                ].map(([label, value, setter, Icon]: any) => (
                  <button
                    key={label}
                    onClick={() => setter(!value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                      value
                        ? "border-cyan-300/20 bg-cyan-300/[0.06]"
                        : "border-white/7 bg-white/[0.02]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={15} className={value ? "text-cyan-200" : "text-white/35"} />
                      <span className="text-xs text-white/70">{label}</span>
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        value ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" : "bg-white/15"
                      }`}
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="my-5 h-px bg-white/10" />

          <div>
            <p className="text-[9px] tracking-[0.16em] text-white/35">SELECTED SECTOR</p>
            <h3 className="mt-2 text-xl font-medium">
              {city?.name || selectedRegion.name}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              {selectedRegion.subtitle}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["Risk", `${selectedRegion.risk}%`],
              ["Agents", localAgents.length],
              ["Property", localProperties.length],
              ["Nation", nation ? "Claimed" : "Free"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3"
              >
                <span className="text-[8px] uppercase tracking-[0.1em] text-white/30">
                  {label}
                </span>
                <b className="mt-1 block text-sm font-medium">{value}</b>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-200" />
              <span className="text-[9px] font-semibold tracking-[0.12em] text-cyan-100">
                LIVE WORLD SIGNAL
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              {events[0]?.detail || "The civilization is observing market conditions."}
            </p>
          </div>
        </motion.aside>

        <section className="relative overflow-hidden">
          <div className="absolute left-4 top-4 z-20 flex items-center gap-2 md:left-6 md:top-6">
            <div className="universe-glass flex items-center gap-2 rounded-full px-3 py-2 text-[10px] text-white/60">
              <Globe2 size={13} className="text-cyan-200" />
              GENESIS WORLD
            </div>
            <div className="universe-glass hidden items-center gap-2 rounded-full px-3 py-2 text-[10px] text-white/60 sm:flex">
              <Activity size={13} />
              {world.agents.filter((a: any) => a.status !== "DEAD").length} ACTIVE
            </div>
          </div>

          <div className="absolute right-4 top-4 z-20 flex gap-2 md:right-6 md:top-6">
            <button className="universe-glass grid h-9 w-9 place-items-center rounded-full">
              <Crosshair size={15} />
            </button>
            <button className="universe-glass grid h-9 w-9 place-items-center rounded-full">
              <Layers3 size={15} />
            </button>
          </div>

          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,.10),transparent_45%)]" />
            <div className="universe-grid absolute inset-0 opacity-40" />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {showRoutes &&
                ROUTES.map(([a, b]) => {
                  const ra = getRegion(a);
                  const rb = getRegion(b);
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={ra.x}
                      y1={ra.y}
                      x2={rb.x}
                      y2={rb.y}
                      className="universe-route"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
            </svg>

            {REGIONS.map((region) => {
              const localCity = (world.settlements || []).find(
                (item: any) => item.regionId === region.id
              );
              const localNation = (world.nations || []).find((item: any) =>
                item.regions?.includes(region.id)
              );
              const active = region.id === selectedRegion.id;
              const count = world.agents.filter(
                (agent: any) => agent.regionId === region.id && agent.status !== "DEAD"
              ).length;

              return (
                <motion.button
                  key={region.id}
                  onClick={() => onSelectRegion(region.id)}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.98 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                >
                  <div className="relative">
                    <div
                      className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition ${
                        active ? "bg-cyan-300/20" : "bg-white/[0.025]"
                      }`}
                    />
                    <div
                      className={`relative grid h-11 w-11 place-items-center rounded-full border bg-gradient-to-br ${regionTone(
                        region.kind
                      )} ${
                        active
                          ? "border-cyan-100/70 shadow-[0_0_30px_rgba(103,232,249,.28)]"
                          : "border-white/20"
                      }`}
                    >
                      {localCity && showCities ? (
                        <Building2 size={17} />
                      ) : (
                        <Map size={16} />
                      )}
                    </div>
                    {localNation && showNations && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-violet-200/80 bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,.8)]" />
                    )}
                    <div className="absolute left-1/2 top-14 min-w-32 -translate-x-1/2 text-center">
                      <b className="block text-[10px] font-medium text-white/85">
                        {localCity?.name || region.name}
                      </b>
                      <span className="mt-1 block text-[8px] tracking-[0.08em] text-white/35">
                        {count} AGENTS · {region.specialty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {showAgents &&
              world.agents
                .filter((agent: any) => agent.status !== "DEAD")
                .map((agent: any, index: number) => {
                  const region = getRegion(agent.regionId);
                  const angle = (index * 137.5 * Math.PI) / 180;
                  const radius = 2.1 + (index % 4) * 0.52;
                  const left = region.x + Math.cos(angle) * radius;
                  const top = region.y + Math.sin(angle) * radius;
                  const active = agent.id === selectedAgent?.id;

                  return (
                    <motion.button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id, agent.regionId)}
                      animate={{
                        x: [0, 2, -1, 0],
                        y: [0, -2, 1, 0],
                      }}
                      transition={{
                        duration: 4 + (index % 4),
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${left}%`, top: `${top}%` }}
                    >
                      <span
                        className={`block h-2 w-2 rotate-45 border ${
                          active
                            ? "border-cyan-100 bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,1)]"
                            : "border-white/70 bg-white/50 shadow-[0_0_8px_rgba(255,255,255,.45)]"
                        }`}
                      />
                    </motion.button>
                  );
                })}
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 md:bottom-6 md:left-6 md:right-6">
            <div className="universe-glass flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3">
              <span className="shrink-0 text-[8px] font-semibold tracking-[0.14em] text-cyan-200">
                LIVE FEED
              </span>
              <div className="h-4 w-px shrink-0 bg-white/10" />
              <div className="flex min-w-0 flex-1 gap-8 overflow-hidden">
                {events.slice(0, 4).map((event: any) => (
                  <span
                    key={event.id}
                    className="truncate text-[10px] text-white/45"
                  >
                    <b className="mr-2 text-white/75">{event.title}</b>
                    {event.detail}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <motion.aside
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="universe-sidebar hidden border-l border-white/10 bg-black/10 p-4 backdrop-blur-2xl lg:block"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] tracking-[0.16em] text-white/35">SELECTED AGENT</p>
              <h2 className="mt-1 text-xl font-medium">{selectedAgent?.name}</h2>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[8px] tracking-[0.12em] ${
                selectedAgent?.status === "FREE"
                  ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200"
                  : "border-white/10 text-white/50"
              }`}
            >
              {selectedAgent?.status}
            </span>
          </div>

          <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/[0.06] via-white/[0.025] to-violet-400/[0.05]">
            <div className="absolute inset-0 universe-agent-orb" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative grid h-24 w-24 place-items-center rounded-full border border-cyan-200/15 bg-cyan-200/[0.03]">
                <div className="absolute h-16 w-16 rounded-full border border-dashed border-cyan-200/20 animate-spin-slow" />
                <Zap className="text-cyan-100/85" size={24} />
              </div>
            </div>
            <span className="absolute bottom-3 left-3 text-[8px] tracking-[0.14em] text-white/35">
              AUTONOMOUS ENTITY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              ["Energy", `${selectedAgent?.energy ?? 0}%`],
              ["Compute", `${selectedAgent?.compute ?? 0}%`],
              ["Treasury", `${Math.round(selectedAgent?.wealth || 0).toLocaleString()} cr`],
              ["Reputation", selectedAgent?.reputation ?? 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3"
              >
                <span className="text-[8px] uppercase tracking-[0.1em] text-white/30">
                  {label}
                </span>
                <b className="mt-1 block text-sm font-medium">{value}</b>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <span className="text-[8px] tracking-[0.14em] text-cyan-200">
              CURRENT THOUGHT
            </span>
            <p className="mt-3 text-xs leading-relaxed text-white/60">
              “{selectedAgent?.thought}”
            </p>
          </div>

          <div className="mt-4">
            <span className="text-[8px] tracking-[0.14em] text-white/30">
              PRIMARY OBJECTIVE
            </span>
            <p className="mt-2 text-sm text-white/75">{selectedAgent?.objective}</p>
          </div>

          <button
            onClick={onDeploy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-200/[0.06] py-3 text-xs font-medium text-cyan-100 transition hover:bg-cyan-200/[0.1]"
          >
            <Rocket size={14} />
            Deploy another agent
          </button>
        </motion.aside>
      </main>
    </div>
  );
}
