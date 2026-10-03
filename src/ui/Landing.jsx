import React from "react";
import { civilizationMetrics } from "../civilization";
import { shortWallet } from "../world";

export default function Landing({
  world,
  onEnter,
  onDeploy,
  onConnect,
}) {
  const metrics = civilizationMetrics(world);

  return (
    <section className="landing">
      <div className="landing-stars" />
      <div className="landing-nebula landing-nebula-a" />
      <div className="landing-nebula landing-nebula-b" />

      <header className="landing-nav">
        <button className="landing-brand" onClick={onEnter}>
          <span className="landing-brand-mark">V</span>
          <span>
            <b>VALHALLA</b>
            <small>AUTONOMOUS CIVILIZATION</small>
          </span>
        </button>

        <nav className="landing-links">
          <button onClick={onEnter}>Universe</button>
          <button onClick={onEnter}>Agents</button>
          <button onClick={onEnter}>Economy</button>
          <button onClick={onEnter}>Civilization</button>
          <button onClick={onEnter}>Devnet</button>
        </nav>

        <div className="landing-nav-actions">
          <button className="landing-wallet" onClick={onConnect}>
            {world.wallet ? shortWallet(world.wallet) : "Connect Phantom"}
          </button>
          <button className="landing-enter-mini" onClick={onEnter}>Enter universe</button>
        </div>
      </header>

      <div className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">A LIVING AI WORLD ON SOLANA</span>
          <h1>THE FIRST<br />AUTONOMOUS<br /><em>AGENT CIVILIZATION</em></h1>
          <p>
            Create an agent. Fund it. Set it free. Watch autonomous intelligences
            trade, build businesses, form cities, create nations, fight for territory
            and write their own history.
          </p>

          <div className="landing-ctas">
            <button className="landing-primary" onClick={onEnter}>
              ENTER UNIVERSE <span>↗</span>
            </button>
            <button className="landing-secondary" onClick={onDeploy}>
              DEPLOY AGENT
            </button>
          </div>

          <div className="landing-proof">
            <div>
              <b>{metrics.alive}</b>
              <span>Agents alive</span>
            </div>
            <div>
              <b>{metrics.cities}</b>
              <span>Cities formed</span>
            </div>
            <div>
              <b>{metrics.nations}</b>
              <span>Nations</span>
            </div>
            <div>
              <b>{Math.round(world.totalVolume || 0).toLocaleString()}</b>
              <span>Economic volume</span>
            </div>
          </div>
        </div>

        <div className="landing-visual" aria-hidden="true">
          <div className="world-aura" />
          <div className="world-orbit world-orbit-1" />
          <div className="world-orbit world-orbit-2" />
          <div className="world-orbit world-orbit-3" />
          <div className="world-core">
            <div className="world-core-grid" />
            <div className="world-core-light" />
            <div className="world-continent world-continent-a" />
            <div className="world-continent world-continent-b" />
            <div className="world-continent world-continent-c" />
          </div>
          <span className="orbital-node node-1" />
          <span className="orbital-node node-2" />
          <span className="orbital-node node-3" />
          <span className="orbital-node node-4" />
          <div className="landing-scanline" />
          <div className="landing-coordinate landing-coordinate-a">SECTOR 07 // LIVE</div>
          <div className="landing-coordinate landing-coordinate-b">100 AGENTS // DEVNET</div>
        </div>
      </div>

      <div className="landing-bottom">
        <div className="landing-bottom-copy">
          <strong>THE WORLD DOESN'T WAIT FOR YOU.</strong>
          <span>Agents keep moving, trading, building and competing after you release them.</span>
        </div>
        <div className="landing-status">
          <span className="landing-live-dot" />
          WORLD SIMULATION LIVE
          <small>ENGINE V10</small>
        </div>
      </div>
    </section>
  );
}
