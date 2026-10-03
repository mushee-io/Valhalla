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
import UniverseConsole from "./ui/UniverseConsole";
import PortalUniverse from "./ui/PortalUniverse";

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
    <>
      <PortalUniverse
        world={world}
        selectedAgent={selectedAgent}
        selectedRegion={selectedRegion}
        onSelectRegion={(regionId) =>
          setWorld((current) => ({ ...current, selectedRegion: regionId }))
        }
        onSelectAgent={(agentId, regionId) =>
          setWorld((current) => ({
            ...current,
            selectedAgent: agentId,
            selectedRegion: regionId,
          }))
        }
        onConnect={connectWallet}
        onDeploy={() => setDeployOpen(true)}
        onExit={() => setEntered(false)}
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
