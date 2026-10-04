import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

const DEVNET_RPC =
  process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com";

function decodeBase64(value) {
  return Uint8Array.from(Buffer.from(String(value || ""), "base64"));
}

export function verifyHash44ActionProof({
  wallet,
  message,
  signatureBase64,
  action,
}) {
  if (!wallet || !message || !signatureBase64 || !action) return false;

  const text = String(message);
  if (!text.startsWith("HASH44 ACTION\n")) return false;
  if (!text.includes(`wallet=${wallet}`)) return false;
  if (!text.includes(`action=${action}`)) return false;

  try {
    const publicKey = new PublicKey(wallet);
    return nacl.sign.detached.verify(
      new TextEncoder().encode(text),
      decodeBase64(signatureBase64),
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

async function rpc(method, params) {
  const response = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error("Solana Devnet RPC request failed.");
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.message || "Solana Devnet RPC error.");
  }
  return payload.result;
}

export async function verifyDevnetTransfer({
  signature,
  source,
  destination,
  lamports,
}) {
  if (!signature || !source || !destination || !lamports) {
    return { ok: false, reason: "Incomplete payment proof." };
  }

  let transaction = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    transaction = await rpc("getTransaction", [
      signature,
      {
        commitment: "confirmed",
        encoding: "jsonParsed",
        maxSupportedTransactionVersion: 0,
      },
    ]);

    if (transaction) break;
    await new Promise((resolve) => setTimeout(resolve, 650));
  }

  if (!transaction || transaction.meta?.err) {
    return { ok: false, reason: "Payment transaction is missing or failed." };
  }

  const accountKeys =
    transaction.transaction?.message?.accountKeys || [];

  const sourceSigned = accountKeys.some((entry) => {
    if (typeof entry === "string") return false;
    return entry?.pubkey === source && entry?.signer === true;
  });

  if (!sourceSigned) {
    return { ok: false, reason: "Buyer wallet did not sign the transaction." };
  }

  const instructions =
    transaction.transaction?.message?.instructions || [];

  const transfer = instructions.find((instruction) => {
    const parsed = instruction?.parsed;
    if (!parsed || instruction?.program !== "system") return false;
    if (parsed.type !== "transfer") return false;
    const info = parsed.info || {};
    return (
      info.source === source &&
      info.destination === destination &&
      Number(info.lamports || 0) >= Number(lamports)
    );
  });

  if (!transfer) {
    return {
      ok: false,
      reason: "Transaction does not contain the required SOL transfer.",
    };
  }

  return {
    ok: true,
    slot: transaction.slot,
    blockTime: transaction.blockTime,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}
