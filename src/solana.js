import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

export const DEVNET_RPC = "https://api.devnet.solana.com";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

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

export async function anchorWorldCheckpoint(provider, publicKey, world) {
  if (!provider?.signAndSendTransaction) {
    throw new Error("Phantom transaction signing is unavailable.");
  }

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const summary = [
    "VALHALLA_V10",
    `tick=${world.tick}`,
    `agents=${world.agents?.length || 0}`,
    `properties=${world.properties?.length || 0}`,
    `cities=${world.settlements?.length || 0}`,
    `nations=${world.nations?.length || 0}`,
    `wars=${world.conflicts?.length || 0}`,
    `volume=${Math.round(world.totalVolume || 0)}`,
    `season=${world.civilizationSeason || 1}`,
  ].join("|");

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const signer = new PublicKey(publicKey);
  const tx = new Transaction({
    feePayer: signer,
    recentBlockhash: blockhash,
  });

  tx.add(
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
      data: new TextEncoder().encode(summary),
    })
  );

  const result = await provider.signAndSendTransaction(tx);
  const signature = typeof result === "string" ? result : result.signature;
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return {
    signature,
    network: "solana-devnet",
    memo: summary,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}
