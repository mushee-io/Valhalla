import React, { useEffect, useMemo, useState } from "react";
import {
  advanceWorld,
  createInitialWorld,
  deployAgent,
  getRegion,
  migrateWorld,
  releaseAgent,
} from "./world";
import {
  advanceCivilization,
  ensureCivilizationState,
} from "./civilization";
import {
  connectPhantom,
  createGenesisProof,
  getDevnetBalance,
} from "./solana";
import {
  createSharedAgent,
  getSharedWorld,
  releaseSharedAgent,
  tickSharedWorld,
} from "./runtime/shared";
import DeployModal from "./ui/DeployModal";
import Landing from "./ui/Landing";
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

function mergeRemoteWorld(current, remote) {
  const agents = Array.isArray(remote?.agents) ? remote.agents : [];
  const currentSelected = current?.selectedAgent;
  const selectedAgent =
    agents.some((agent) => agent.id === currentSelected)
      ? currentSelected
      : agents[0]?.id || currentSelected;

  const selected = agents.find((agent) => agent.id === selectedAgent);
  const candidateRegion =
    current?.selectedRegion &&
    getRegion(current.selectedRegion)
      ? current.selectedRegion
      : selected?.regionId || selected?.zoneId || "genesis-port";

  return ensureCivilizationState({
    ...remote,
    selectedAgent,
    selectedRegion: candidateRegion,
    wallet: current?.wallet || remote.wallet || null,
    walletBalance:
      current?.walletBalance ?? remote.walletBalance ?? null,
    totalVolume:
      remote?.totalVolume ??
      remote?.metrics?.totalVolume ??
      current?.totalVolume ??
      0,
  });
}

export default function App() {
  const [world, setWorld] = useState(loadWorld);
  const [deployOpen, setDeployOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [runtimeMode, setRuntimeMode] = useState("probing");
  const [form, setForm] = useState({
    name: "VALKYRIE",
    archetype: "Builder",
    objective: "Build profitable infrastructure",
    personality: "Pragmatic",
    risk: 45,
    wealth: 2500,
    zoneId: "genesis-port",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
  }, [world]);

  useEffect(() => {
    let cancelled = false;

    getSharedWorld()
      .then((result) => {
        if (cancelled || !result?.world?.agents?.length) return;
        setRuntimeMode("shared");
        setWorld((current) => mergeRemoteWorld(current, result.world));
      })
      .catch(() => {
        if (!cancelled) setRuntimeMode("local");
      });

    const fallback = window.setTimeout(() => {
      if (!cancelled) {
        setRuntimeMode((mode) => (mode === "probing" ? "local" : mode));
      }
    }, 4500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!world.running) return;

    if (runtimeMode === "shared") {
      let busy = false;
      const run = async () => {
        if (busy) return;
        busy = true;
        try {
          const result = await tickSharedWorld({
            allowLLM: true,
            maxStrategicAgents: 4,
          });
          if (result?.world) {
            setWorld((current) => mergeRemoteWorld(current, result.world));
          }
        } catch {
          // Keep the last authoritative snapshot; the next tick retries.
        } finally {
          busy = false;
        }
      };

      const timer = window.setInterval(run, 6500);
      return () => window.clearInterval(timer);
    }

    if (runtimeMode === "local") {
      const delay = world.civilizationMode ? 2400 : 1800;
      const timer = window.setInterval(() => {
        setWorld((current) =>
          advanceCivilization(
            advanceWorld(ensureCivilizationState(current))
          )
        );
      }, delay);
      return () => window.clearInterval(timer);
    }
  }, [runtimeMode, world.running, world.civilizationMode]);

  const selectedAgent = useMemo(
    () =>
      world.agents.find((agent) => agent.id === world.selectedAgent) ||
      world.agents[0],
    [world.agents, world.selectedAgent]
  );

  const selectedRegion =
    getRegion(world.selectedRegion) ||
    getRegion(selectedAgent?.regionId) ||
    getRegion("genesis-port");

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
      setWorld((current) => ({
        ...current,
        wallet: publicKey,
        walletBalance,
      }));
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
      setWalletError(
        "Connect Phantom first. Agents need a creator-signed Solana Devnet identity."
      );
      return;
    }

    setDeploying(true);

    try {
      const identity = await createGenesisProof(
        window.solana,
        world.wallet,
        form
      );

      if (runtimeMode === "shared") {
        const result = await createSharedAgent(
          { ...form, status: "BOUND" },
          identity
        );

        if (result?.world) {
          setWorld((current) =>
            mergeRemoteWorld(
              {
                ...current,
                selectedAgent: result.agent?.id,
                selectedRegion:
                  result.agent?.regionId ||
                  result.agent?.zoneId ||
                  "genesis-port",
              },
              result.world
            )
          );
        }
      } else {
        setWorld((current) =>
          ensureCivilizationState(deployAgent(current, form, identity))
        );
      }

      setDeployOpen(false);
      setEntered(true);
    } catch (error) {
      setWalletError(error?.message || "Agent identity signing failed.");
    } finally {
      setDeploying(false);
    }
  }

  async function releaseSelectedAgent(agentId) {
    if (!agentId) return;

    try {
      if (runtimeMode === "shared") {
        const result = await releaseSharedAgent(agentId, world.wallet);
        if (result?.world) {
          setWorld((current) => mergeRemoteWorld(current, result.world));
        }
      } else {
        setWorld((current) => releaseAgent(current, agentId));
      }
    } catch (error) {
      setWalletError(error?.message || "Unable to release this agent.");
    }
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

        {walletError && (
          <div className="landing-notice">{walletError}</div>
        )}

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
        runtimeMode={runtimeMode}
        onSelectRegion={(regionId) =>
          setWorld((current) => ({
            ...current,
            selectedRegion: regionId,
          }))
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
        onRelease={releaseSelectedAgent}
        onExit={() => setEntered(false)}
      />

      {walletError && (
        <div className="landing-notice">{walletError}</div>
      )}

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
