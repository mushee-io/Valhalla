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
import {
  advanceCivilization,
  buildPropertyForAgent,
  ensureCivilizationState,
  igniteCivilization,
  registerChainAnchor,
} from "./civilization";
import {
  anchorWorldCheckpoint,
  connectPhantom,
  createGenesisProof,
  getDevnetBalance,
} from "./solana";
import WorldMap from "./ui/WorldMap";
import AgentPanel from "./ui/AgentPanel";
import Ledger from "./ui/Ledger";
import EconomyPanel from "./ui/EconomyPanel";
import CivilizationPanel from "./ui/CivilizationPanel";
import DeployModal from "./ui/DeployModal";
import Landing from "./ui/Landing";

const STORAGE_KEY = "valhalla-world-v10";

function freshWorld() {
  return ensureCivilizationState(createInitialWorld());
}

function loadWorld() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? ensureCivilizationState(migrateWorld(JSON.parse(raw))) : freshWorld();
  } catch {
    return freshWorld();
  }
}

export default function App() {
  const [world, setWorld] = useState(loadWorld);
  const [deployOpen, setDeployOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [economyOpen, setEconomyOpen] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
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
    const delay = world.civilizationMode ? 2400 : 1800;
    const timer = window.setInterval(() => {
      setWorld((current) => advanceCivilization(advanceWorld(ensureCivilizationState(current))));
    }, delay);
    return () => window.clearInterval(timer);
  }, [world.running, world.civilizationMode]);

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
      return publicKey;
    } catch (error) {
      setWalletError(error?.message || "Wallet connection was cancelled.");
      return null;
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
      setWorld((current) => ensureCivilizationState(deployAgent(current, form, identity)));
      setDeployOpen(false);
    } catch (error) {
      setWalletError(error?.message || "Agent identity signing failed.");
    } finally {
      setDeploying(false);
    }
  }

  async function anchorCheckpoint() {
    setWalletError("");
    let wallet = world.wallet;
    if (!wallet) wallet = await connectWallet();
    if (!wallet) return;

    setAnchoring(true);
    try {
      const receipt = await anchorWorldCheckpoint(window.solana, wallet, world);
      setWorld((current) => registerChainAnchor(current, receipt));
      const balance = await getDevnetBalance(wallet).catch(() => null);
      if (balance != null) setWorld((current) => ({ ...current, walletBalance: balance }));
    } catch (error) {
      setWalletError(error?.message || "Solana Devnet checkpoint failed.");
    } finally {
      setAnchoring(false);
    }
  }

  function resetWorld() {
    if (!window.confirm("Reset the local Valhalla civilization?")) return;
    const next = freshWorld();
    next.wallet = world.wallet;
    next.walletBalance = world.walletBalance;
    setWorld(next);
  }

  function ignite() {
    setWorld((current) => igniteCivilization(current, 100));
  }

  function forceBuild(agentId) {
    if (!agentId) return;
    setWorld((current) => buildPropertyForAgent(current, agentId));
  }

  if (!entered) {
    return (
      <>
        <Landing
          world={world}
          onEnter={() => setEntered(true)}
          onDeploy={() => setDeployOpen(true)}
          onConnect={connectWallet}
        />
        {walletError && <div className="landing-notice">{walletError}</div>}
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
      </>
    );
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
        <span className="milestone done">6 · PROPERTY</span>
        <span className="milestone done">7 · CITIES</span>
        <span className="milestone done">8 · CONFLICT</span>
        <span className="milestone done">9 · SOLANA</span>
        <span className="milestone done">10 · CIVILIZATION</span>
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

      <CivilizationPanel
        world={world}
        selectedAgent={selectedAgent}
        anchoring={anchoring}
        onIgnite={ignite}
        onBuild={forceBuild}
        onAnchor={anchorCheckpoint}
      />

      <footer>
        <span>VALHALLA / MILESTONES 1–10 ONLINE / ENGINE V{WORLD_VERSION}</span>
        <span>Agents → economy → property → cities → nations → conflict → verifiable Devnet history</span>
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
