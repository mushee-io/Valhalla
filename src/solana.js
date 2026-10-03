export const DEVNET_RPC = "https://api.devnet.solana.com";

export async function connectPhantom() {
  const provider = window.solana;
  if (!provider?.isPhantom) {
    throw new Error("Phantom was not detected in this browser.");
  }
  const response = await provider.connect();
  return { provider, publicKey: response.publicKey.toString() };
}

export async function getDevnetBalance(address) {
  if (!address) return 0;
  const response = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [address, { commitment: "confirmed" }],
    }),
  });
  if (!response.ok) throw new Error("Unable to read Solana Devnet balance.");
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "Devnet RPC error.");
  return (payload.result?.value || 0) / 1_000_000_000;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

export async function createGenesisProof(provider, publicKey, draft) {
  if (!provider?.signMessage) {
    throw new Error("This wallet does not support message signing.");
  }

  const message = [
    "VALHALLA GENESIS",
    "network=solana-devnet",
    `creator=${publicKey}`,
    `agent=${draft.name}`,
    `archetype=${draft.archetype}`,
    `objective=${draft.objective}`,
    `personality=${draft.personality}`,
    `risk=${draft.risk}`,
    `nonce=${crypto.randomUUID()}`,
  ].join("\n");

  const encoded = new TextEncoder().encode(message);
  const signed = await provider.signMessage(encoded, "utf8");
  const signature = signed.signature || signed;
  const signatureBytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
  const digest = await crypto.subtle.digest("SHA-256", concatBytes(encoded, signatureBytes));
  const identityHash = bytesToHex(new Uint8Array(digest));

  return {
    network: "solana-devnet",
    creatorWallet: publicKey,
    identityHash,
    proofPrefix: bytesToHex(signatureBytes).slice(0, 32),
    signedMessage: message,
  };
}
