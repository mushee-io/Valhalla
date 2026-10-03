import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  CircleDot,
  Coins,
  Globe2,
  Menu,
  Rocket,
  Search,
  Unlock,
  Wallet,
  Zap,
} from "lucide-react";
import { getRegion, shortWallet } from "../world";
import UniverseLayerPanel from "./UniverseLayerPanel";

type PortalUniverseProps = {
  world: any;
  selectedAgent: any;
  selectedRegion: any;
  runtimeMode: string;
  onSelectAgent: (agentId: string, regionId: string) => void;
  onSelectRegion: (regionId: string) => void;
  onConnect: () => void;
  onDeploy: () => void;
  onRelease: (agentId: string) => void;
  onExit: () => void;
};

const SCENES = [
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/3c83091e-4046-4fd6-adbb-2edb728be79a.mp4",
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/fc3ded42-e845-41f3-a830-5cab512d79cd.mp4",
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b30f64d9-1637-477a-83df-d0fc6461a422.mp4",
];

const tabs = [
  "Agents",
  "Worlds",
  "Teams",
  "Meme Valley",
  "Governance",
] as const;

function sceneFor(regionId?: string) {
  const region = getRegion(regionId);
  const index =
    Math.abs(Math.round((region?.x || 0) + (region?.y || 0))) %
    SCENES.length;
  return SCENES[index];
}

export default function PortalUniverse({
  world,
  selectedAgent,
  selectedRegion,
  runtimeMode,
  onSelectAgent,
  onSelectRegion,
  onConnect,
  onDeploy,
  onRelease,
  onExit,
}: PortalUniverseProps) {
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("Agents");
  const [query, setQuery] = useState("");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const aliveAgents = useMemo(
    () =>
      world.agents.filter(
        (agent: any) => agent.status !== "DEAD"
      ),
    [world.agents]
  );

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aliveAgents;

    return aliveAgents.filter((agent: any) => {
      const region = getRegion(agent.regionId || agent.zoneId);
      return [
        agent.name,
        agent.archetype,
        agent.personality,
        agent.status,
        region?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        );
    });
  }, [aliveAgents, query]);

  const selectedIndex = Math.max(
    0,
    aliveAgents.findIndex(
      (agent: any) => agent.id === selectedAgent?.id
    )
  );

  const nextAgent =
    aliveAgents.length > 1
      ? aliveAgents[(selectedIndex + 1) % aliveAgents.length]
      : selectedAgent;

  const selectedRegionId =
    selectedAgent?.regionId ||
    selectedAgent?.zoneId ||
    selectedRegion?.id;

  const nextRegionId =
    nextAgent?.regionId || nextAgent?.zoneId;

  const currentScene = sceneFor(selectedRegionId);
  const nextScene = sceneFor(nextRegionId);

  const ownedProperty = (world.properties || []).filter(
    (property: any) => property.ownerId === selectedAgent?.id
  );

  const team =
    (world.teams || []).find(
      (item: any) => item.id === selectedAgent?.teamId
    ) || null;

  const nation =
    (world.nations || []).find(
      (item: any) => item.id === selectedAgent?.nationId
    ) || null;

  const facts = [
    [
      "Location:",
      getRegion(selectedRegionId)?.name || "Unknown",
    ],
    ["Role:", selectedAgent?.archetype || "Unknown"],
    ["Energy:", `${selectedAgent?.energy ?? 0}%`],
    [
      "Treasury:",
      `${Math.round(
        selectedAgent?.wealth || 0
      ).toLocaleString()} cr`,
    ],
    ["Property:", `${ownedProperty.length} assets`],
    [
      "Team:",
      team?.name || "Independent",
    ],
  ];

  const selectNext = () => {
    if (!nextAgent) return;
    onSelectAgent(
      nextAgent.id,
      nextAgent.regionId || nextAgent.zoneId
    );
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px =
      (event.clientX - rect.left) / rect.width - 0.5;
    const py =
      (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -12, y: px * 14 });
  };

  const shared =
    runtimeMode === "shared";
  const persistent =
    world.storageMode === "persistent";

  return (
    <main className="space-voyage-universe relative h-screen min-h-[620px] overflow-hidden bg-[#090807] text-white">
      <video
        key={currentScene}
        className="absolute inset-0 h-full w-full object-cover"
        src={currentScene}
        autoPlay
        muted
        loop
        playsInline
      />

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.16),rgba(0,0,0,.02)_52%,rgba(0,0,0,.06)),linear-gradient(180deg,rgba(0,0,0,.02)_0%,rgba(0,0,0,.08)_56%,rgba(0,0,0,.78)_100%)]" />
      <div className="portal-universe-noise absolute inset-0 opacity-20" />

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 md:px-7 md:py-6">
        <button
          onClick={onExit}
          className="flex items-center gap-3"
        >
          <span className="grid h-9 w-9 place-items-center border border-white/35 bg-white/[0.08] text-xs font-semibold backdrop-blur-md">
            V
          </span>
          <span className="hidden text-[10px] font-semibold tracking-[0.22em] sm:block">
            VALHALLA
          </span>
        </button>

        <div className="ml-4 hidden items-center gap-2 lg:flex">
          <span
            className={`rounded-full border px-2.5 py-1 text-[8px] uppercase tracking-[0.1em] backdrop-blur-md ${
              shared
                ? "border-emerald-200/20 bg-emerald-300/[0.06] text-emerald-100/80"
                : "border-white/15 bg-white/[0.04] text-white/45"
            }`}
          >
            {shared
              ? persistent
                ? "Persistent runtime"
                : "Shared session"
              : "Local simulation"}
          </span>
          <span className="text-[8px] text-white/35">
            T{world.tick}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-white/45 bg-white/15 p-1 backdrop-blur-xl xl:flex">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-[11px] transition ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={onConnect}
            className="hidden h-9 items-center gap-2 rounded-full border border-white/45 bg-white/15 px-4 text-[11px] backdrop-blur-xl sm:flex"
          >
            <Wallet size={13} />
            {world.wallet
              ? shortWallet(world.wallet)
              : "Wallet"}
          </button>

          <button
            onClick={onDeploy}
            className="flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[11px] font-medium text-black"
          >
            <Rocket size={13} />
            <span className="hidden sm:inline">Deploy</span>
          </button>

          <button className="grid h-9 w-9 place-items-center rounded-full bg-white text-black xl:hidden">
            <Menu size={15} />
          </button>
        </div>
      </header>

      {activeTab === "Agents" && (
        <aside className="absolute left-4 top-1/2 z-20 hidden -translate-y-[44%] md:block lg:left-7">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/55">
              Agents
            </span>
            <span className="text-[8px] text-white/35">
              {aliveAgents.length}
            </span>
          </div>

          <label className="mb-3 flex h-8 w-[180px] items-center gap-2 rounded-full border border-white/20 bg-black/10 px-3 backdrop-blur-md lg:w-[210px]">
            <Search size={11} className="text-white/45" />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search"
              className="h-auto w-full border-0 bg-transparent p-0 text-[10px] text-white outline-none placeholder:text-white/35"
            />
          </label>

          <div className="portal-agent-list max-h-[360px] w-[220px] overflow-y-auto pr-2">
            {filteredAgents.map((agent: any) => {
              const active =
                agent.id === selectedAgent?.id;
              return (
                <button
                  key={agent.id}
                  onClick={() =>
                    onSelectAgent(
                      agent.id,
                      agent.regionId || agent.zoneId
                    )
                  }
                  className={`mb-1 flex w-full items-center gap-2 py-1 text-left transition ${
                    active
                      ? "text-white"
                      : "text-white/72 hover:text-white"
                  }`}
                >
                  {active ? (
                    <span className="h-3.5 w-3.5 rounded-full bg-white" />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span
                    className={`truncate text-[12px] ${
                      active
                        ? "font-semibold"
                        : "font-normal"
                    }`}
                  >
                    {agent.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {activeTab === "Agents" ? (
        <section className="absolute left-1/2 top-[49%] z-20 w-[min(310px,54vw)] -translate-x-1/2 -translate-y-1/2 md:w-[min(320px,28vw)]">
          <div className="mb-3 flex items-center justify-between text-[13px] text-white">
            <span>Next:</span>
            <span>
              <span className="mr-2 text-white/55">
                [
                {String(
                  (selectedIndex + 2) %
                    Math.max(aliveAgents.length, 1) || 1
                ).padStart(2, "0")}
                ]
              </span>
              <strong className="text-[16px]">
                {nextAgent?.name || "Agent"}
              </strong>
            </span>
          </div>

          <motion.button
            onClick={selectNext}
            onPointerMove={handlePointerMove}
            onPointerLeave={() =>
              setTilt({ x: 0, y: 0 })
            }
            animate={{
              rotateX: tilt.x,
              rotateY: tilt.y,
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 18,
            }}
            style={{
              transformStyle: "preserve-3d",
              perspective: 900,
            }}
            className="portal-agent-window relative block w-full overflow-visible rounded-[76px] bg-transparent"
          >
            <div className="relative aspect-[320/350] overflow-hidden rounded-[76px] border border-white/30 bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,.28)]">
              <video
                key={nextScene}
                className="absolute inset-0 h-full w-full object-cover"
                src={nextScene}
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.16)_58%,rgba(0,0,0,.55))]" />

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-white/65 bg-white/20 backdrop-blur-md">
                  <Zap size={17} />
                </span>
                <span className="mt-1.5 block text-[10px] text-white/75">
                  Enter
                </span>
              </div>
            </div>
          </motion.button>
        </section>
      ) : (
        <UniverseLayerPanel
          activeTab={activeTab}
          world={world}
          selectedAgent={selectedAgent}
          onSelectRegion={onSelectRegion}
        />
      )}

      {activeTab === "Agents" && (
        <section className="absolute bottom-5 left-5 right-5 z-20 md:bottom-7 md:left-7 md:right-7">
          <div className="flex items-end justify-between gap-8">
            <div className="min-w-0 flex-1 md:pl-[235px]">
              <div className="mb-2 flex items-center gap-3 text-[9px] uppercase tracking-[0.08em] text-white/55">
                <span className="flex items-center gap-1.5">
                  <CircleDot size={10} />
                  {selectedAgent?.status}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 size={10} />
                  {getRegion(selectedRegionId)?.name}
                </span>
                {nation && (
                  <span>{nation.name}</span>
                )}
              </div>

              <motion.h1
                key={selectedAgent?.id}
                initial={{
                  opacity: 0,
                  y: 26,
                  filter: "blur(8px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="portal-agent-title truncate font-['Arial_Narrow',Arial,sans-serif] text-[clamp(66px,10vw,148px)] font-normal leading-[0.73] tracking-[-0.045em]"
              >
                {selectedAgent?.name || "AGENT"}
              </motion.h1>
            </div>

            <dl className="hidden w-[min(440px,34vw)] shrink-0 text-[10px] md:block lg:text-[11px]">
              {facts.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[90px_1fr] gap-4 border-b border-white/35 py-2 last:border-b-0 lg:grid-cols-[112px_1fr]"
                >
                  <dt className="font-semibold text-white">
                    {label}
                  </dt>
                  <dd className="m-0 truncate text-white/80">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/18 pt-3 md:ml-[235px]">
            <p className="min-w-0 truncate text-[10px] text-white/55">
              {selectedAgent?.thought ||
                "Agent is observing the world."}
            </p>

            <div className="ml-4 flex shrink-0 items-center gap-3">
              {selectedAgent?.status === "BOUND" && (
                <button
                  onClick={() =>
                    onRelease(selectedAgent.id)
                  }
                  className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-[9px] text-white backdrop-blur-md"
                >
                  <Unlock size={11} />
                  Release agent
                </button>
              )}

              <button
                onClick={selectNext}
                className="hidden items-center gap-1.5 text-[10px] text-white/75 md:flex"
              >
                Next agent
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="absolute right-5 top-[110px] z-20 hidden items-center gap-3 rounded-full border border-white/22 bg-black/10 px-3 py-2 text-[9px] text-white/60 backdrop-blur-md lg:flex">
        <span>{(world.teams || world.companies || []).length} teams</span>
        <span>·</span>
        <span>{(world.settlements || []).length} cities</span>
        <span>·</span>
        <span>{(world.nations || []).length} nations</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Coins size={10} />
          {Math.round(
            world.totalVolume ||
              world.metrics?.totalVolume ||
              0
          ).toLocaleString()}
        </span>
      </div>
    </main>
  );
}
