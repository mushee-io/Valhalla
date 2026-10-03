import React from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Crown,
  Globe2,
  Landmark,
  Sparkles,
  Swords,
  Users,
  Vote,
} from "lucide-react";

type Props = {
  activeTab: string;
  world: any;
  selectedAgent: any;
  onSelectRegion: (regionId: string) => void;
};

function number(value: any) {
  return Math.round(Number(value || 0)).toLocaleString();
}

function EmptyState({
  icon: Icon,
  title,
  copy,
}: {
  icon: any;
  title: string;
  copy: string;
}) {
  return (
    <div className="col-span-full flex min-h-[250px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.025] p-8 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-white/[0.03]">
          <Icon className="text-white/45" size={19} />
        </span>
        <h3 className="mt-5 text-xl font-medium">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-white/40">{copy}</p>
      </div>
    </div>
  );
}

export default function UniverseLayerPanel({
  activeTab,
  world,
  selectedAgent,
  onSelectRegion,
}: Props) {
  if (activeTab === "Agents") return null;

  const worlds = world.zones?.length ? world.zones : [];

  const teams =
    world.teams?.length
      ? world.teams
      : (world.companies || []).map((company: any) => ({
          id: company.id,
          name: company.name,
          leaderId: company.founderId,
          memberIds: company.members || [],
          treasury: company.treasury || 0,
          objective: "Build a durable autonomous enterprise",
          zoneId: company.regionId,
          reputation: company.reputation || 0,
        }));

  const tokens = world.memeTokens || [];
  const governance = world.governance || {
    proposals: [],
    laws: [],
    treaties: [],
  };
  const nations = world.nations || [];
  const wars = world.wars || world.conflicts || [];

  const openProposals =
    governance.proposals?.filter((proposal: any) => proposal.status === "OPEN") ||
    [];

  return (
    <div className="absolute inset-x-0 bottom-6 top-[92px] z-20 flex items-center justify-center px-4 sm:px-6 lg:px-10">
      <motion.section
        key={activeTab}
        initial={{ opacity: 0, scale: 0.975, y: 18, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.985, y: 12, filter: "blur(8px)" }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className="universe-layer-shell flex max-h-full w-full max-w-[1180px] flex-col overflow-hidden rounded-[34px] border border-white/12 bg-black/35 shadow-[0_32px_120px_rgba(0,0,0,.38)] backdrop-blur-2xl"
      >
        <header className="flex shrink-0 items-end justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-7 lg:px-9">
          <div>
            <span className="text-[9px] uppercase tracking-[0.17em] text-white/40">
              Valhalla civilization
            </span>
            <h2 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {activeTab}
            </h2>
          </div>

          <div className="hidden items-center gap-3 text-[9px] uppercase tracking-[0.1em] text-white/35 sm:flex">
            <span>Tick {world.tick}</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>Season {world.season || world.cycle || 1}</span>
          </div>
        </header>

        <div className="universe-layer-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-7 lg:px-9 lg:py-7">
          {activeTab === "Worlds" && (
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {worlds.map((zone: any) => {
                const id = zone.id;
                const localAgents = world.agents.filter(
                  (agent: any) =>
                    (agent.zoneId || agent.regionId) === id &&
                    agent.status !== "DEAD"
                ).length;

                const city = (world.settlements || []).find(
                  (item: any) => (item.zoneId || item.regionId) === id
                );

                const nation = (world.nations || []).find((item: any) =>
                  (item.zoneIds || item.regions || []).includes(id)
                );

                return (
                  <button
                    key={id}
                    onClick={() => onSelectRegion(id)}
                    className="group min-h-[190px] min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.055]"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.035]">
                        <Globe2 size={16} />
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.1em] text-white/35">
                        risk {zone.risk ?? 0}%
                      </span>
                    </div>

                    <h3 className="mt-8 truncate text-xl font-medium">
                      {zone.name}
                    </h3>

                    <p className="mt-1 text-[10px] text-white/40">
                      {localAgents} agents ·{" "}
                      {(zone.resource || zone.specialty || "unknown").toUpperCase()}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2 text-[8px] uppercase tracking-[0.09em] text-white/45">
                      {city && (
                        <span className="rounded-full border border-white/10 px-2 py-1">
                          {city.name}
                        </span>
                      )}

                      {nation && (
                        <span className="rounded-full border border-violet-200/15 px-2 py-1 text-violet-100/70">
                          {nation.name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "Teams" && (
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teams.length ? (
                teams.map((team: any) => {
                  const leader = world.agents.find(
                    (agent: any) => agent.id === team.leaderId
                  );

                  return (
                    <article
                      key={team.id}
                      className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.035]">
                          <Users size={16} />
                        </span>

                        <span className="text-[8px] uppercase tracking-[0.11em] text-emerald-100/65">
                          {team.status || "ACTIVE"}
                        </span>
                      </div>

                      <h3 className="mt-7 truncate text-xl font-medium">
                        {team.name}
                      </h3>

                      <p className="mt-1 min-h-[32px] text-[10px] leading-relaxed text-white/40">
                        {team.objective ||
                          leader?.objective ||
                          "Autonomous team"}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase text-white/30">
                            Leader
                          </span>
                          <b className="mt-1 block truncate text-[10px]">
                            {leader?.name || team.leaderId || "—"}
                          </b>
                        </div>

                        <div>
                          <span className="text-[8px] uppercase text-white/30">
                            Members
                          </span>
                          <b className="mt-1 block text-[10px]">
                            {(team.memberIds || []).length}
                          </b>
                        </div>

                        <div>
                          <span className="text-[8px] uppercase text-white/30">
                            Treasury
                          </span>
                          <b className="mt-1 block text-[10px]">
                            {number(team.treasury)} cr
                          </b>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  icon={Users}
                  title="No autonomous team has formed yet."
                  copy="Agents create teams when capital, reputation and local opportunity make delegation worthwhile."
                />
              )}
            </div>
          )}

          {activeTab === "Meme Valley" && (
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tokens.length ? (
                [...tokens]
                  .sort(
                    (a: any, b: any) =>
                      Number(b.liquidity || 0) - Number(a.liquidity || 0)
                  )
                  .map((token: any) => {
                    const creator = world.agents.find(
                      (agent: any) => agent.id === token.creatorAgentId
                    );

                    return (
                      <article
                        key={token.id}
                        className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.035]">
                            <Sparkles size={16} />
                          </span>

                          <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-white/45">
                            {token.status || "SIMULATED"}
                          </span>
                        </div>

                        <h3 className="mt-7 truncate text-xl font-medium">
                          {"$" + token.ticker}
                        </h3>

                        <p className="mt-1 truncate text-xs text-white/50">
                          {token.name}
                        </p>

                        <div className="mt-6 space-y-2 text-[10px]">
                          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                            <span className="text-white/35">Price</span>
                            <b className="truncate">
                              {Number(token.price || 0).toFixed(9)}
                            </b>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                            <span className="text-white/35">Liquidity</span>
                            <b>{number(token.liquidity)} cr</b>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-white/35">Creator</span>
                            <b className="max-w-36 truncate">
                              {creator?.name || token.creatorAgentId}
                            </b>
                          </div>
                        </div>
                      </article>
                    );
                  })
              ) : (
                <EmptyState
                  icon={Coins}
                  title="Meme Valley is waiting for its first launch."
                  copy="Opportunist agents with enough capital can create tokens and seed liquidity autonomously."
                />
              )}
            </div>
          )}

          {activeTab === "Governance" && (
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Crown size={15} />
                  <h3 className="text-sm font-medium">Nations</h3>
                </div>

                <div className="mt-5 space-y-2">
                  {nations.length ? (
                    nations.map((nation: any) => (
                      <div
                        key={nation.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <b className="truncate text-xs">{nation.name}</b>
                          <span className="shrink-0 text-[8px] text-white/35">
                            {(nation.citizenIds || nation.memberIds || []).length}{" "}
                            citizens
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-white/40">
                          <span>{number(nation.treasury)} cr</span>
                          <span>influence {nation.influence || 0}</span>
                          <span>
                            tax {Math.round(Number(nation.taxRate || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-xs leading-relaxed text-white/35">
                      Nations emerge after teams establish cities and accumulate
                      enough reputation.
                    </p>
                  )}
                </div>
              </section>

              <section className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Vote size={15} />
                  <h3 className="text-sm font-medium">Open proposals</h3>
                </div>

                <div className="mt-5 space-y-2">
                  {openProposals.length ? (
                    openProposals.map((proposal: any) => (
                      <div
                        key={proposal.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <b className="block truncate text-xs">
                          {proposal.title}
                        </b>

                        <p className="mt-1 text-[9px] leading-relaxed text-white/35">
                          {proposal.body}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-3 text-[8px] text-white/40">
                          <span>YES {proposal.votes?.yes?.length || 0}</span>
                          <span>NO {proposal.votes?.no?.length || 0}</span>
                          <span>closes T{proposal.closesAtTick}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-xs text-white/35">
                      No proposal is currently open.
                    </p>
                  )}
                </div>
              </section>

              <section className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Swords size={15} />
                  <h3 className="text-sm font-medium">Conflicts</h3>
                </div>

                <div className="mt-5 space-y-2">
                  {wars.length ? (
                    wars.slice(0, 8).map((war: any) => (
                      <div
                        key={war.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3"
                      >
                        <span className="min-w-0 truncate text-[10px]">
                          {war.attackerNationId || war.attackerId} →{" "}
                          {war.defenderNationId || war.defenderId}
                        </span>

                        <span className="shrink-0 text-[8px] uppercase text-white/35">
                          {war.status || "RESOLVED"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-xs text-white/35">
                      No active nation-level conflict.
                    </p>
                  )}
                </div>
              </section>

              <section className="min-w-0 rounded-[26px] border border-white/12 bg-white/[0.025] p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <Landmark size={15} />
                  <h3 className="text-sm font-medium">Law & diplomacy</h3>
                </div>

                <div className="mt-5 space-y-3 text-[10px]">
                  <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                    <span className="text-white/35">Laws passed</span>
                    <b>{governance.laws?.length || 0}</b>
                  </div>

                  <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                    <span className="text-white/35">Treaties</span>
                    <b>{governance.treaties?.length || 0}</b>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-white/35">Selected agent nation</span>
                    <b className="max-w-[55%] truncate">
                      {nations.find(
                        (nation: any) => nation.id === selectedAgent?.nationId
                      )?.name || "Independent"}
                    </b>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
