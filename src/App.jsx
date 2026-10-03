import React, { useEffect, useMemo, useState } from "react";
import {
  WORLD_VERSION,
  advanceWorld,
  createInitialWorld,
  deployAgent,
  formatWorldTime,
  fundAgent,
  getRegion,
  migrateWorld,
  releaseAgent,
  shortWallet,
} from "./world";
import { connectPhantom, createGenesisProof, getDevnetBalance } from "./solana";
import WorldMap from "./ui/WorldMap";
import AgentPanel from "./ui/AgentPanel";
import Ledger from "./ui/Ledger";
import EconomyPanel from "./ui/EconomyPanel";
import DeployModal from "./ui/DeployModal";

const STORAGE_KEY = "valhalla-world-v5";

function loadWorld() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateWorld(JSON.parse(raw)) : createInitialWorld();
  } catch {
    return createInitialWorld();
  }
}

export default function App() {
  const [world, setWorld] = useState(loadWorld);
  const [deployOpen, setDeployOpen] = useState(false);
  const [economyOpen, setEconomyOpen] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [form, setForm] = useState({
    name: "VALKYRIE",
    archetype: "Builder",
    objective: "Build profitable infrastructure",
    personality: "Pragmatic",
    risk: 45,
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
    () => world.agents.find((agent) => agent.id === world.selectedAgent) || world.agents[0],
    [world.agents, world.selectedAgent]
  );

  const selectedRegion = getRegion(world.selectedRegion) || getRegion("genesis-port");

  async function connectWallet() {
    setWalletError("");
    try {
      const { publicKey } = await connectPhantom();
      let walletBalance = null;
      try {
        walletBalance = await getDevnetBalance(publicKey);
      } catch {
        walletBalance = null;
      }
      setWorld((current) => ({ ...current, wallet: publicKey, walletBalance }));
    } catch (error) {
      setWalletError(error?.message || "Wallet connection was cancelled.");
    }
  }

  async function submitDeploy(event) {
    event.preventDefault();
    setWalletError("");
    if (!world.wallet) {
      setWalletError("Connect Phantom first. Agents need a creator-signed Solana Devnet identity.");
      return;
    }

    setDeploying(true);
    try {
      const identity = await createGenesisProof(window.solana, world.wallet, form);
      setWorld((current) => deployAgent(current, form, identity));
      setDeployOpen(false);
    } catch (error) {
      setWalletError(error?.message || "Agent identity signing failed.");
    } finally {
      setDeploying(false);
    }
  }

  function resetWorld() {
    if (!window.confirm("Reset the local Valhalla civilization?")) return;
    const next = createInitialWorld();
    next.wallet = world.wallet;
    next.walletBalance = world.walletBalance;
    setWorld(next);
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
          <button className="wallet" onClick={connectWallet}>
            {world.wallet ? shortWallet(world.wallet) : "Connect Phantom"}
          </button>
          <button className="primary" onClick={() => setDeployOpen(true)}>Deploy agent</button>
        </div>
      </header>

      {walletError && <div className="notice">{walletError}</div>}

      <div className="milestone-bar">
        <span className="milestone done">1 · WORLD</span>
        <span className="milestone done">2 · IDENTITY</span>
        <span className="milestone done">3 · LIFE</span>
        <span className="milestone done">4 · BRAIN</span>
        <span className="milestone done">5 · ECONOMY</span>
        <span className="milestone">6 · PROPERTY</span>
        <span className="network-chip">
          SOLANA DEVNET
          {world.walletBalance != null && <b>{world.walletBalance.toFixed(3)} SOL</b>}
        </span>
      </div>

      <main className="layout">
        <WorldMap
          world={world}
          selectedAgent={selectedAgent}
          selectedRegion={selectedRegion}
          onSelectRegion={(regionId) => setWorld((w) => ({ ...w, selectedRegion: regionId }))}
          onSelectAgent={(agentId, regionId) =>
            setWorld((w) => ({ ...w, selectedAgent: agentId, selectedRegion: regionId }))
          }
        />

        <aside className="side-column">
          <AgentPanel
            world={world}
            agent={selectedAgent}
            onRelease={(agentId) => setWorld((w) => releaseAgent(w, agentId))}
            onFund={(agentId, amount) => setWorld((w) => fundAgent(w, agentId, amount))}
          />
          <Ledger world={world} onReset={resetWorld} />
        </aside>
      </main>

      <EconomyPanel
        world={world}
        region={selectedRegion}
        agent={selectedAgent}
        open={economyOpen}
        onToggle={() => setEconomyOpen((value) => !value)}
      />

      <footer>
        <span>VALHALLA / MILESTONES 1–5 ONLINE / ENGINE V{WORLD_VERSION}</span>
        <span>Creator-signed Devnet identity · survival · autonomous brain · emergent economy</span>
      </footer>

      {deployOpen && (
        <DeployModal
          form={form}
          setForm={setForm}
          wallet={world.wallet}
          deploying={deploying}
          onConnect={connectWallet}
          onSubmit={submitDeploy}
          onClose={() => setDeployOpen(false)}
        />
      )}
    </div>
  );
}
