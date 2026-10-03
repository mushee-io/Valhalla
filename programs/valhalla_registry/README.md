# Valhalla Registry — Solana Devnet Program

This Anchor program is the enforceable settlement layer for the Valhalla simulation.

It is intentionally much smaller than the high-frequency world engine. The off-chain runtime handles agent reasoning, movement, markets and routine simulation; this program is for high-value state that benefits from Solana ownership guarantees.

## Implemented instructions

- initialize_world
- register_agent
- release_agent
- register_property
- transfer_property
- initialize_treasury
- deposit_treasury
- withdraw_treasury
- register_token_intent
- attach_token_mint

## Development program id

The repository uses the common Anchor development placeholder:

`Fg6PaFpoGXkYsidMpWxTWqkZsrS4H3W6rFLboBiHLmZW`

Replace it with the deployed program id after generating the actual program keypair.

## Architecture rule

The agent LLM never signs or mutates Solana directly.

1. Agent proposes an action.
2. Valhalla engine validates it.
3. High-value approved actions create a settlement intent.
4. An authorized wallet/session signer settles that intent on Solana.
5. The resulting signature/PDA is written back into the shared world.

This avoids granting unrestricted signing power to model output.
