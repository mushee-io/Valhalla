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
import { getRegion } from "../world";

type Props = {
  activeTab: string;
  world: any;
  selectedAgent: any;
  onSelectRegion: (regionId: string) => void;
};

function number(value: any) {
  return Math.round(Number(value || 0)).toLocaleString();
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

  return (
    <motion.section
      key={activeTab}
      initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-1/2 top-[48%] z-20 w-[min(980px,72vw)] -translate-x-1/2 -translate-y-1/2"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.17em] text-white/45">
            Valhalla civilization
          </span>
          <h2 className="mt-2 text-3xl font-medium tracking-[-0.035em] md:text-5xl">
            {activeTab}
          </h2>
        </div>
        <span className="hidden text-[9px] uppercase tracking-[0.1em] text-white/35 md:block">
          Tick {world.tick} · Season {world.season || world.cycle || 1}
        </span>
      </div>

      {activeTab === "Worlds" && (
        <div className="grid max-h-[58vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
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
                className="group min-h-[170px] rounded-[26px] border border-white/14 bg-black/15 p-5 text-left backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
                    <Globe2 size={15} />
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.1em] text-white/35">
                    risk {zone.risk ?? 0}%
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-medium">{zone.name}</h3>
                <p className="mt-1 text-[10px] text-white/40">
                  {localAgents} agents · {(zone.resource || zone.specialty || "unknown").toUpperCase()}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[8px] uppercase tracking-[0.09em] text-white/45">
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
        <div className="grid max-h-[58vh] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {teams.length ? (
            teams.map((team: any) => {
              const leader = world.agents.find(
                (agent: any) => agent.id === team.leaderId
              );
              return (
                <article
                  key={team.id}
                  className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
                      <Users size={16} />
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.11em] text-emerald-100/65">
                      {team.status || "ACTIVE"}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-medium">{team.name}</h3>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                    {team.objective || leader?.objective || "Autonomous team"}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8px] uppercase text-white/30">Leader</span>
                      <b className="mt-1 block truncate text-[10px]">
                        {leader?.name || team.leaderId || "—"}
                      </b>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-white/30">Members</span>
                      <b className="mt-1 block text-[10px]">
                        {(team.memberIds || []).length}
                      </b>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-white/30">Treasury</span>
                      <b className="mt-1 block text-[10px]">
                        {number(team.treasury)} cr
                      </b>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="col-span-full rounded-[28px] border border-white/12 bg-black/15 p-10 text-center backdrop-blur-xl">
              <Users className="mx-auto text-white/40" size={24} />
              <h3 className="mt-4 text-lg">No autonomous team has formed yet.</h3>
              <p className="mt-2 text-xs text-white/40">
                Agents create teams when capital, reputation and local opportunity make delegation worthwhile.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Meme Valley" && (
        <div className="grid max-h-[58vh] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 lg:grid-cols-3">
          {tokens.length ? (
            [...tokens]
              .sort((a: any, b: any) => Number(b.liquidity || 0) - Number(a.liquidity || 0))
              .map((token: any) => {
                const creator = world.agents.find(
                  (agent: any) => agent.id === token.creatorAgentId
                );
                return (
                  <article
                    key={token.id}
                    className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.04]">
                        <Sparkles size={15} />
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] uppercase tracking-[0.1em] text-white/45">
                        {token.status || "SIMULATED"}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-medium">
                      {"$" + token.ticker}
                    </h3>
                    <p className="mt-1 text-xs text-white/50">{token.name}</p>
                    <div className="mt-5 space-y-2 text-[10px]">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/35">Price</span>
                        <b>{Number(token.price || 0).toFixed(9)}</b>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-white/35">Liquidity</span>
                        <b>{number(token.liquidity)} cr</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/35">Creator</span>
                        <b className="max-w-32 truncate">
                          {creator?.name || token.creatorAgentId}
                        </b>
                      </div>
                    </div>
                  </article>
                );
              })
          ) : (
            <div className="col-span-full rounded-[28px] border border-white/12 bg-black/15 p-10 text-center backdrop-blur-xl">
              <Coins className="mx-auto text-white/40" size={24} />
              <h3 className="mt-4 text-lg">Meme Valley is waiting for its first launch.</h3>
              <p className="mt-2 text-xs text-white/40">
                Opportunist agents with enough capital can create tokens and seed liquidity autonomously.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Governance" && (
        <div className="grid max-h-[58vh] grid-cols-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
          <section className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Crown size={15} />
              <h3 className="text-sm font-medium">Nations</h3>
            </div>
            <div className="mt-4 space-y-2">
              {nations.length ? (
                nations.map((nation: any) => (
                  <div
                    key={nation.id}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-xs">{nation.name}</b>
                      <span className="text-[8px] text-white/35">
                        {(nation.citizenIds || nation.memberIds || []).length} citizens
                      </span>
                    </div>
                    <div className="mt-2 flex gap-4 text-[9px] text-white/40">
                      <span>{number(nation.treasury)} cr</span>
                      <span>influence {nation.influence || 0}</span>
                      <span>tax {Math.round(Number(nation.taxRate || 0) * 100)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/35">
                  Nations emerge after teams establish cities and accumulate enough reputation.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Vote size={15} />
              <h3 className="text-sm font-medium">Open proposals</h3>
            </div>
            <div className="mt-4 space-y-2">
              {governance.proposals?.filter((p: any) => p.status === "OPEN").length ? (
                governance.proposals
                  .filter((p: any) => p.status === "OPEN")
                  .map((proposal: any) => (
                    <div
                      key={proposal.id}
                      className="rounded-2xl border border-white/8 bg-white/[0.025] p-3"
                    >
                      <b className="text-xs">{proposal.title}</b>
                      <p className="mt-1 text-[9px] leading-relaxed text-white/35">
                        {proposal.body}
                      </p>
                      <div className="mt-2 flex gap-3 text-[8px] text-white/40">
                        <span>YES {proposal.votes?.yes?.length || 0}</span>
                        <span>NO {proposal.votes?.no?.length || 0}</span>
                        <span>closes T{proposal.closesAtTick}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-white/35">No proposal is currently open.</p>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Swords size={15} />
              <h3 className="text-sm font-medium">Conflicts</h3>
            </div>
            <div className="mt-4 space-y-2">
              {wars.length ? (
                wars.slice(0, 6).map((war: any) => (
                  <div
                    key={war.id}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] p-3"
                  >
                    <span className="text-[10px]">
                      {war.attackerNationId || war.attackerId} → {war.defenderNationId || war.defenderId}
                    </span>
                    <span className="text-[8px] uppercase text-white/35">
                      {war.status || "RESOLVED"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/35">No active nation-level conflict.</p>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/14 bg-black/15 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Landmark size={15} />
              <h3 className="text-sm font-medium">Law & diplomacy</h3>
            </div>
            <div className="mt-4 space-y-2 text-[10px]">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/35">Laws passed</span>
                <b>{governance.laws?.length || 0}</b>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/35">Treaties</span>
                <b>{governance.treaties?.length || 0}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-white/35">Selected agent nation</span>
                <b className="max-w-40 truncate">
                  {nations.find((nation: any) => nation.id === selectedAgent?.nationId)?.name || "Independent"}
                </b>
              </div>
            </div>
          </section>
        </div>
      )}
    </motion.section>
  );
}
