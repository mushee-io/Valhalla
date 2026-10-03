import React from "react";

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
    <div className="modal-backdrop" onMouseDown={() => !deploying && onClose()}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">MILESTONE 2 · GENESIS IDENTITY</span>
            <h2>Deploy an agent</h2>
          </div>
          <button className="close" disabled={deploying} onClick={onClose}>×</button>
        </div>

        <p className="modal-copy">
          Phantom signs the agent's Genesis record. This does not spend SOL. The signature binds the
          creator, personality and objective to a Solana Devnet identity proof.
        </p>

        {!wallet && (
          <button className="wallet modal-wallet" type="button" onClick={onConnect}>
            Connect Phantom first
          </button>
        )}

        <form onSubmit={onSubmit}>
          <label>
            Agent name
            <input
              value={form.name}
              maxLength={18}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <div className="form-grid">
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
              Personality
              <select
                value={form.personality}
                onChange={(event) => setForm({ ...form, personality: event.target.value })}
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
          </div>

          <label>
            Primary objective
            <input
              value={form.objective}
              onChange={(event) => setForm({ ...form, objective: event.target.value })}
            />
          </label>

          <div className="form-grid">
            <label>
              Risk appetite: {form.risk}
              <input
                type="range"
                min="0"
                max="100"
                value={form.risk}
                onChange={(event) => setForm({ ...form, risk: event.target.value })}
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
          </div>

          <button className="primary deploy-submit" type="submit" disabled={deploying || !wallet}>
            {deploying ? "Sign Genesis record…" : "Sign & create agent"}
          </button>
        </form>
      </div>
    </div>
  );
}
