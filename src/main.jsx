import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  REGIONS,
  ROUTES,
  advanceWorld,
  createInitialWorld,
  deployAgent,
  formatWorldTime,
  getRegion,
} from "./world";
import "./styles.css";

const STORAGE_KEY = "valhalla-world-v1";

function loadWorld() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialWorld();
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? parsed : createInitialWorld();
  } catch {
    return createInitialWorld();
  }
}

function shorten(address) {
  if (!address) return "Connect Phantom";
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function App() {
  const [world, setWorld] = useState(loadWorld);
  const [deployOpen, setDeployOpen] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [form, setForm] = useState({
    name: "VALKYRIE",
    archetype: "Builder",
    objective: "Build profitable infrastructure",
    wealth: 2500,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
  }, [world]);

  useEffect(() => {
    if (!world.running) return;
    const id = window.setInterval(() => {
      setWorld((current) => advanceWorld(current));
    }, 1800);
    return () => window.clearInterval(id);
  }, [world.running]);

  const selectedAgent = useMemo(
    () => world.agents.find((agent) => agent.id === world.selectedAgent) ?? world.agents[0],
    [world.agents, world.selectedAgent]
  );

  const selectedRegion = getRegion(world.selectedRegion) ?? REGIONS[0];
  const regionAgents = world.agents.filter((agent) => agent.regionId === selectedRegion.id);

  async function connectWallet() {
    setWalletError("");
    try {
      const provider = window.solana;
      if (!provider?.isPhantom) {
        setWalletError("Phantom was not detected in this browser.");
        return;
      }
      const response = await provider.connect();
      const wallet = response.publicKey.toString();
      setWorld((current) => ({ ...current, wallet }));
    } catch (error) {
      setWalletError(error?.message || "Wallet connection was cancelled.");
    }
  }

  function resetWorld() {
    if (!window.confirm("Reset the local Genesis simulation?")) return;
    const next = createInitialWorld();
    next.wallet = world.wallet;
    setWorld(next);
  }

  function submitDeploy(event) {
    event.preventDefault();
    setWorld((current) => deployAgent(current, form));
    setDeployOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <div className="eyebrow">AUTONOMOUS CIVILIZATION</div>
            <h1>VALHALLA</h1>
          </div>
        </div>

        <div className="world-status">
          <span className={`live-dot ${world.running ? "active" : ""}`} />
          <div>
            <strong>{world.running ? "WORLD LIVE" : "WORLD PAUSED"}</strong>
            <span>{formatWorldTime(world)} · Tick {world.tick}</span>
          </div>
        </div>

        <div className="header-actions">
          <button className="ghost" onClick={() => setWorld((w) => ({ ...w, running: !w.running }))}>
            {world.running ? "Pause world" : "Resume world"}
          </button>
          <button className="wallet" onClick={connectWallet}>{shorten(world.wallet)}</button>
          <button className="primary" onClick={() => setDeployOpen(true)}>Deploy agent</button>
        </div>
      </header>

      {walletError && <div className="notice">{walletError}</div>}

      <main className="layout">
        <section className="map-panel panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GENESIS WORLD · DEVNET PROTOTYPE</span>
              <h2>One world. Free agents.</h2>
            </div>
            <div className="stats-inline">
              <span><b>{world.agents.length}</b> agents</span>
              <span><b>{REGIONS.length}</b> regions</span>
              <span><b>{world.events.length}</b> events</span>
            </div>
          </div>

          <div className="world-map">
            <div className="grid-overlay" />
            <svg className="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
              {ROUTES.map(([a, b]) => {
                const ra = getRegion(a);
                const rb = getRegion(b);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={ra.x}
                    y1={ra.y}
                    x2={rb.x}
                    y2={rb.y}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {REGIONS.map((region) => {
              const count = world.agents.filter((agent) => agent.regionId === region.id).length;
              const selected = region.id === selectedRegion.id;
              return (
                <button
                  key={region.id}
                  className={`region region-${region.kind} ${selected ? "selected" : ""}`}
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                  onClick={() => setWorld((w) => ({ ...w, selectedRegion: region.id }))}
                >
                  <span className="region-core" />
                  <span className="region-label">
                    <b>{region.name}</b>
                    <small>{count} active</small>
                  </span>
                </button>
              );
            })}

            {world.agents.map((agent, index) => {
              const region = getRegion(agent.regionId);
              const angle = (index * 137.5 * Math.PI) / 180;
              const radius = 2.2 + (index % 3) * 0.6;
              const left = region.x + Math.cos(angle) * radius;
              const top = region.y + Math.sin(angle) * radius;
              return (
                <button
                  key={agent.id}
                  title={agent.name}
                  className={`agent-dot ${agent.id === selectedAgent?.id ? "selected" : ""}`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={() =>
                    setWorld((w) => ({
                      ...w,
                      selectedAgent: agent.id,
                      selectedRegion: agent.regionId,
                    }))
                  }
                >
                  <span />
                </button>
              );
            })}

            <div className="map-legend">
              <span><i className="legend-dot agent" /> agent</span>
              <span><i className="legend-dot city" /> city</span>
              <span><i className="legend-dot market" /> market</span>
              <span><i className="legend-dot wild" /> frontier</span>
            </div>
          </div>

          <div className="region-strip">
            <div>
              <span className="eyebrow">SELECTED REGION</span>
              <h3>{selectedRegion.name}</h3>
              <p>{selectedRegion.subtitle}</p>
            </div>
            <div className="region-metrics">
              <div><span>Risk</span><b>{selectedRegion.risk}%</b></div>
              <div><span>Resource</span><b>{selectedRegion.resource}</b></div>
              <div><span>Agents here</span><b>{regionAgents.length}</b></div>
            </div>
          </div>
        </section>

        <aside className="side-column">
          <section className="panel agent-card">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">SELECTED AGENT</span>
                <h2>{selectedAgent?.name}</h2>
              </div>
              <span className={`status-pill ${selectedAgent?.status === "FREE" ? "free" : ""}`}>
                {selectedAgent?.status}
              </span>
            </div>

            {selectedAgent && (
              <>
                <div className="agent-meta">
                  <div><span>Archetype</span><b>{selectedAgent.archetype}</b></div>
                  <div><span>Location</span><b>{getRegion(selectedAgent.regionId)?.name}</b></div>
                  <div><span>Energy</span><b>{selectedAgent.energy}%</b></div>
                  <div><span>Wealth</span><b>{selectedAgent.wealth.toLocaleString()} cr</b></div>
                  <div><span>Property</span><b>{selectedAgent.property}</b></div>
                  <div><span>Reputation</span><b>{selectedAgent.reputation}</b></div>
                </div>

                <div className="thought">
                  <span>LIVE THOUGHT</span>
                  <p>“{selectedAgent.thought}”</p>
                </div>

                <div className="objective">
                  <span>PRIMARY OBJECTIVE</span>
                  <strong>{selectedAgent.objective}</strong>
                </div>
              </>
            )}
          </section>

          <section className="panel ledger">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">WORLD LEDGER</span>
                <h2>Live events</h2>
              </div>
              <button className="text-button" onClick={resetWorld}>Reset</button>
            </div>

            <div className="event-list">
              {world.events.slice(0, 12).map((event) => (
                <article key={event.id} className={`event event-${event.type}`}>
                  <i />
                  <div>
                    <div className="event-topline">
                      <b>{event.title}</b>
                      <span>T{event.tick}</span>
                    </div>
                    <p>{event.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <footer>
        <span>VALHALLA / GENESIS WORLD ENGINE / MILESTONE 1</span>
        <span>Simulation persists in this browser · Solana account layer comes next</span>
      </footer>

      {deployOpen && (
        <div className="modal-backdrop" onMouseDown={() => setDeployOpen(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">GENESIS PROTOCOL</span>
                <h2>Deploy an agent</h2>
              </div>
              <button className="close" onClick={() => setDeployOpen(false)}>×</button>
            </div>
            <p className="modal-copy">
              Create a new autonomous citizen. In this first world build, the agent enters through Genesis Port and immediately joins the live simulation.
            </p>
            <form onSubmit={submitDeploy}>
              <label>
                Agent name
                <input
                  value={form.name}
                  maxLength={18}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label>
                Archetype
                <select
                  value={form.archetype}
                  onChange={(event) => setForm({ ...form, archetype: event.target.value })}
                >
                  <option>Builder</option>
                  <option>Trader</option>
                  <option>Explorer</option>
                  <option>Mercenary</option>
                  <option>Industrialist</option>
                  <option>Opportunist</option>
                </select>
              </label>
              <label>
                Primary objective
                <input
                  value={form.objective}
                  onChange={(event) => setForm({ ...form, objective: event.target.value })}
                />
              </label>
              <label>
                Starting credits
                <input
                  type="number"
                  min="100"
                  max="100000"
                  value={form.wealth}
                  onChange={(event) => setForm({ ...form, wealth: event.target.value })}
                />
              </label>
              <button className="primary deploy-submit" type="submit">Enter Valhalla</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
