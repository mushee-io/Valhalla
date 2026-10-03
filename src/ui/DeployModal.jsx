import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Gauge,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const archetypes = [
  ["Builder", "Construct businesses, infrastructure and cities"],
  ["Trader", "Scout markets and compound through commerce"],
  ["Explorer", "Search frontier sectors and hidden opportunities"],
  ["Mercenary", "Take contracts, defend routes and build power"],
  ["Industrialist", "Own production, logistics and productive assets"],
  ["Opportunist", "Adapt aggressively to whatever the world offers"],
];

export default function DeployModal({
  form,
  setForm,
  wallet,
  deploying,
  onConnect,
  onSubmit,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-3 backdrop-blur-xl sm:p-6"
      onMouseDown={() => !deploying && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative my-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#090d11]/95 shadow-[0_40px_120px_rgba(0,0,0,.65)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.09),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(139,92,246,.08),transparent_34%)]" />

        <div className="relative grid min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden border-r border-white/10 p-8 lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.05]">
                <Rocket size={18} className="text-cyan-100" />
              </div>
              <div>
                <span className="text-[9px] tracking-[0.16em] text-white/35">
                  GENESIS PROTOCOL
                </span>
                <h2 className="mt-1 text-xl font-medium">Create an autonomous life</h2>
              </div>
            </div>

            <div className="relative mt-10 flex flex-1 items-center justify-center">
              <div className="absolute h-72 w-72 rounded-full bg-cyan-300/[0.04] blur-3xl" />
              <div className="relative grid h-60 w-60 place-items-center rounded-full border border-white/10 bg-white/[0.02]">
                <div className="absolute h-52 w-52 rounded-full border border-dashed border-cyan-200/15 animate-spin-slow" />
                <div className="absolute h-36 w-36 rounded-full border border-violet-300/10" />
                <div className="grid h-24 w-24 place-items-center rounded-full border border-cyan-100/20 bg-gradient-to-br from-cyan-200/[0.1] to-violet-400/[0.04] shadow-[0_0_50px_rgba(34,211,238,.08)]">
                  <Brain size={30} className="text-cyan-100" />
                </div>
                <span className="absolute left-[9%] top-[24%] h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
                <span className="absolute right-[12%] top-[36%] h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,.8)]" />
                <span className="absolute bottom-[18%] right-[30%] h-1.5 w-1.5 rounded-full bg-white/80" />
              </div>
            </div>

            <div className="grid gap-2">
              {[
                [ShieldCheck, "Creator-signed identity", "Bound to your Phantom wallet"],
                [Zap, "Autonomous after release", "You fund it; it chooses its own path"],
                [Sparkles, "Persistent memory", "Every trade, alliance and conflict becomes history"],
              ].map(([Icon, title, copy]) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
                >
                  <Icon size={15} className="mt-0.5 text-cyan-100/80" />
                  <div>
                    <b className="block text-xs font-medium">{title}</b>
                    <span className="mt-1 block text-[10px] leading-relaxed text-white/35">
                      {copy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] tracking-[0.16em] text-cyan-100/60">
                  DEPLOY AGENT
                </span>
                <h2 className="mt-2 text-2xl font-medium sm:text-3xl">
                  Configure your agent
                </h2>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/40">
                  Set its initial identity and incentives. After release, the agent can
                  pursue opportunities, build property, trade, join nations and make
                  decisions without continuous human control.
                </p>
              </div>

              <button
                type="button"
                disabled={deploying}
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/55 transition hover:bg-white/[0.07] hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            {!wallet ? (
              <button
                type="button"
                onClick={onConnect}
                className="mt-6 flex w-full items-center justify-between rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.05] px-4 py-4 text-left transition hover:bg-cyan-200/[0.08]"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black">
                    <Wallet size={17} />
                  </span>
                  <span>
                    <b className="block text-sm font-medium">Connect Phantom</b>
                    <small className="mt-1 block text-[10px] text-white/35">
                      Required to sign the Genesis identity record
                    </small>
                  </span>
                </span>
                <span className="text-xs text-cyan-100">Connect →</span>
              </button>
            ) : (
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.04] px-4 py-3">
                <span className="flex items-center gap-2 text-xs text-emerald-100/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />
                  Phantom connected
                </span>
                <span className="max-w-36 truncate text-[10px] text-white/35">
                  {wallet}
                </span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-[9px] font-medium tracking-[0.12em] text-white/40">
                  AGENT CALLSIGN
                </span>
                <input
                  value={form.name}
                  maxLength={18}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-200/30 focus:bg-white/[0.04]"
                  placeholder="VALKYRIE"
                />
              </label>

              <div>
                <span className="text-[9px] font-medium tracking-[0.12em] text-white/40">
                  ARCHETYPE
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {archetypes.map(([name, copy]) => {
                    const active = form.archetype === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, archetype: name })}
                        className={`rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-cyan-200/25 bg-cyan-200/[0.07]"
                            : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                        }`}
                      >
                        <b className="block text-xs font-medium">{name}</b>
                        <small className="mt-1 block text-[9px] leading-relaxed text-white/30">
                          {copy}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[9px] font-medium tracking-[0.12em] text-white/40">
                    PERSONALITY
                  </span>
                  <select
                    value={form.personality}
                    onChange={(event) =>
                      setForm({ ...form, personality: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#0d1217] px-4 text-sm text-white outline-none focus:border-cyan-200/30"
                  >
                    <option>Pragmatic</option>
                    <option>Analytical</option>
                    <option>Curious</option>
                    <option>Aggressive</option>
                    <option>Patient</option>
                    <option>Chaotic</option>
                    <option>Loyal</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[9px] font-medium tracking-[0.12em] text-white/40">
                    STARTING CREDITS
                  </span>
                  <input
                    type="number"
                    min="100"
                    max="100000"
                    value={form.wealth}
                    onChange={(event) =>
                      setForm({ ...form, wealth: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none focus:border-cyan-200/30"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] font-medium tracking-[0.12em] text-white/40">
                  PRIMARY OBJECTIVE
                </span>
                <input
                  value={form.objective}
                  onChange={(event) =>
                    setForm({ ...form, objective: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 text-sm text-white outline-none focus:border-cyan-200/30"
                />
              </label>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[9px] font-medium tracking-[0.12em] text-white/40">
                    <Gauge size={13} />
                    RISK APPETITE
                  </span>
                  <b className="text-sm font-medium">{form.risk}/100</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.risk}
                  onChange={(event) =>
                    setForm({ ...form, risk: event.target.value })
                  }
                  className="mt-4 w-full accent-cyan-300"
                />
                <div className="mt-2 flex justify-between text-[8px] text-white/25">
                  <span>CONSERVATIVE</span>
                  <span>EXTREME</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={deploying || !wallet}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-white py-4 text-sm font-semibold text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Rocket size={16} />
                {deploying ? "Signing Genesis record…" : "Create Agent"}
              </button>

              <p className="text-center text-[9px] leading-relaxed text-white/25">
                Creating an identity signs a Devnet Genesis record. It does not expose
                your private key and does not spend SOL.
              </p>
            </form>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
