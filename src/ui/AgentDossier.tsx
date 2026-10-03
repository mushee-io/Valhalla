import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  HeartHandshake,
  MessageCircle,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { getRegion, shortWallet } from "../world";

type Props = {
  world: any;
  agent: any;
  onClose: () => void;
};

export default function AgentDossier({
  world,
  agent,
  onClose,
}: Props) {
  if (!agent) return null;

  const relationships = (world.relationships || [])
    .filter(
      (rel: any) =>
        rel.a === agent.id || rel.b === agent.id
    )
    .sort(
      (a: any, b: any) =>
        Number(b.trust || 0) - Number(a.trust || 0)
    )
    .slice(0, 8);

  const messages = (world.messages || [])
    .filter(
      (message: any) =>
        message.from === agent.id ||
        message.to === agent.id
    )
    .slice(0, 8);

  const team =
    (world.teams || []).find(
      (item: any) => item.id === agent.teamId
    ) || null;

  const nation =
    (world.nations || []).find(
      (item: any) => item.id === agent.nationId
    ) || null;

  const memory = (agent.memory || []).slice(0, 12);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 44 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 44 }}
      transition={{
        duration: 0.42,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="absolute bottom-4 right-4 top-[78px] z-40 w-[min(430px,calc(100vw-32px))] overflow-hidden rounded-[28px] border border-white/16 bg-[#080b0d]/82 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-2xl"
    >
      <div className="flex items-start justify-between border-b border-white/10 p-5">
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/35">
            Autonomous entity dossier
          </span>
          <h2 className="mt-2 text-2xl font-medium">
            {agent.name}
          </h2>
          <p className="mt-1 text-[10px] text-white/40">
            {agent.archetype} ·{" "}
            {getRegion(agent.regionId || agent.zoneId)?.name}
          </p>
        </div>

        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/55"
        >
          <X size={15} />
        </button>
      </div>

      <div className="agent-dossier-scroll h-[calc(100%-90px)] overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <span className="text-[8px] uppercase text-white/30">
              Creator
            </span>
            <b className="mt-1 block truncate text-[10px]">
              {shortWallet(agent.creatorWallet)}
            </b>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <span className="text-[8px] uppercase text-white/30">
              Strategy
            </span>
            <b className="mt-1 block text-[10px]">
              {agent.strategy?.lastSource ||
                agent.strategy?.focus ||
                "deterministic"}
            </b>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <span className="text-[8px] uppercase text-white/30">
              Team
            </span>
            <b className="mt-1 block truncate text-[10px]">
              {team?.name || "Independent"}
            </b>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <span className="text-[8px] uppercase text-white/30">
              Nation
            </span>
            <b className="mt-1 block truncate text-[10px]">
              {nation?.name || "Independent"}
            </b>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Brain size={13} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/50">
              Life history
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {memory.length ? (
              memory.map((item: any, index: number) => (
                <div
                  key={
                    String(item.tick) +
                    "-" +
                    String(item.action) +
                    "-" +
                    index
                  }
                  className="relative border-l border-white/12 pl-4"
                >
                  <span className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                  <span className="text-[8px] uppercase tracking-[0.08em] text-white/30">
                    T{item.tick} · {item.action}
                  </span>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/60">
                    {item.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-white/35">
                No persistent memories yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <HeartHandshake size={13} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/50">
              Relationships
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {relationships.length ? (
              relationships.map((rel: any) => {
                const otherId =
                  rel.a === agent.id ? rel.b : rel.a;
                const other = world.agents.find(
                  (candidate: any) =>
                    candidate.id === otherId
                );

                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div>
                      <b className="text-[10px]">
                        {other?.name || otherId}
                      </b>
                      <span className="mt-0.5 block text-[8px] text-white/30">
                        {rel.trades || 0} trades ·{" "}
                        {rel.messages || 0} messages ·{" "}
                        {rel.attacks || 0} attacks
                      </span>
                    </div>

                    <span
                      className={
                        "text-[10px] font-medium " +
                        (Number(rel.trust || 0) >= 0
                          ? "text-emerald-200/80"
                          : "text-rose-200/80")
                      }
                    >
                      {Number(rel.trust || 0) >= 0
                        ? "+"
                        : ""}
                      {rel.trust || 0}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-white/35">
                Relationships emerge from trade, messages,
                contracts and conflict.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-2">
            <MessageCircle size={13} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/50">
              Communications
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {messages.length ? (
              messages.map((message: any) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
                >
                  <span className="text-[8px] uppercase text-white/30">
                    {message.from === agent.id
                      ? "Outgoing"
                      : "Incoming"}{" "}
                    · T{message.tick}
                  </span>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/60">
                    {message.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-white/35">
                No agent-to-agent messages yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <div className="flex items-center gap-2">
            <Shield size={13} />
            <span className="text-[9px] uppercase tracking-[0.12em] text-white/50">
              Runtime boundary
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/45">
            This agent can propose actions, negotiate and form
            strategy. The Valhalla engine validates balances,
            ownership, location, permissions and combat outcomes
            before any state change is accepted.
          </p>
        </section>

        <div className="mt-4 flex items-center gap-2 text-[8px] uppercase tracking-[0.09em] text-white/30">
          <Sparkles size={11} />
          Observe → think → plan → act → verify → remember
        </div>
      </div>
    </motion.aside>
  );
}
