import React from "react";
import { PROPERTY_TYPES, civilizationMetrics } from "../civilization";
import { getRegion, shortWallet } from "../world";

function credits(value) {
  return Math.round(Number(value || 0)).toLocaleString();
}

export default function CivilizationPanel({
  world,
  selectedAgent,
  anchoring,
  onIgnite,
  onBuild,
  onAnchor,
}) {
  const metrics = civilizationMetrics(world);
  const recentProperty = world.properties?.[world.properties.length - 1];
  const recentCity = world.settlements?.[world.settlements.length - 1];
  const recentNation = world.nations?.[world.nations.length - 1];
  const latestWar = world.conflicts?.[0];
  const latestAnchor = world.chainAnchors?.[0];

  return (
    <section className="panel civ-panel">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">MILESTONES 6–10 · CIVILIZATION LAYER</span>
          <h2>The world can now build itself.</h2>
        </div>
        <div className="civ-actions">
          <button className="ghost" onClick={() => onBuild(selectedAgent?.id)} disabled={!selectedAgent}>
            Force build
          </button>
          <button className="ghost" onClick={onAnchor} disabled={anchoring}>
            {anchoring ? "Anchoring…" : "Anchor Devnet"}
          </button>
          <button className="primary" onClick={onIgnite}>
            {world.civilizationMode ? "100-agent mode live" : "Ignite 100 agents"}
          </button>
        </div>
      </div>

      <div className="civ-metrics">
        <div><span>Agents</span><b>{metrics.agents}</b></div>
        <div><span>Properties</span><b>{metrics.properties}</b></div>
        <div><span>Companies</span><b>{metrics.companies}</b></div>
        <div><span>Cities</span><b>{metrics.cities}</b></div>
        <div><span>Nations</span><b>{metrics.nations}</b></div>
        <div><span>Wars</span><b>{metrics.wars}</b></div>
        <div><span>Hidden treasure</span><b>{metrics.treasuresRemaining}</b></div>
        <div><span>Devnet anchors</span><b>{metrics.anchors}</b></div>
      </div>

      <div className="civ-grid">
        <div className="civ-block">
          <span className="civ-kicker">6 · PROPERTY + BUSINESSES</span>
          <h3>Agent-owned infrastructure</h3>
          <div className="mini-cards">
            {(world.properties || []).slice(-5).reverse().map((property) => {
              const type = PROPERTY_TYPES.find((item) => item.id === property.type);
              return (
                <div key={property.id}>
                  <span>{type?.icon || "•"} {type?.name || property.type}</span>
                  <b>{property.name}</b>
                  <small>
                    {getRegion(property.regionId)?.name} · L{property.level} · {credits(property.revenue)} cr revenue
                  </small>
                </div>
              );
            })}
            {!world.properties?.length && <p className="empty">Agents have not built property yet.</p>}
          </div>
          {recentProperty && <p className="civ-note">Newest asset owner: {recentProperty.ownerId}</p>}
        </div>

        <div className="civ-block">
          <span className="civ-kicker">7 · CITIES + NATIONS</span>
          <h3>Emergent political geography</h3>
          <div className="mini-cards">
            {(world.settlements || []).slice(-4).reverse().map((city) => (
              <div key={city.id}>
                <span>{getRegion(city.regionId)?.name}</span>
                <b>{city.name}</b>
                <small>{city.population} agents · prosperity {city.prosperity} · defense {city.defense}</small>
              </div>
            ))}
            {(world.nations || []).slice(-3).reverse().map((nation) => (
              <div key={nation.id}>
                <span>NATION · influence {nation.influence}</span>
                <b>{nation.name}</b>
                <small>{nation.regions.length} region(s) · treasury {credits(nation.treasury)} cr</small>
              </div>
            ))}
            {!world.settlements?.length && <p className="empty">Cities emerge after agents concentrate property and population.</p>}
          </div>
          {recentCity && <p className="civ-note">Latest city: {recentCity.name}</p>}
          {recentNation && <p className="civ-note">Latest nation: {recentNation.name}</p>}
        </div>

        <div className="civ-block">
          <span className="civ-kicker">8 · CONFLICT + POWER</span>
          <h3>Mechs, influence and territorial war</h3>
          <div className="power-board">
            {[...(world.agents || [])]
              .filter((agent) => agent.status !== "DEAD")
              .sort((a, b) => (b.mechLevel || 0) - (a.mechLevel || 0) || b.reputation - a.reputation)
              .slice(0, 5)
              .map((agent) => (
                <div key={agent.id}>
                  <b>{agent.name}</b>
                  <span>Mk {agent.mechLevel || 0}</span>
                  <small>{agent.nationId ? "nation member" : "independent"}</small>
                </div>
              ))}
          </div>
          {latestWar ? (
            <p className="civ-note">
              Latest clash: {latestWar.winnerId} defeated {latestWar.loserId} · {credits(latestWar.spoils)} cr spoils
            </p>
          ) : (
            <p className="civ-note">No interstate conflict yet.</p>
          )}
        </div>

        <div className="civ-block">
          <span className="civ-kicker">9 · SOLANA WORLD</span>
          <h3>Verifiable Devnet civilization checkpoints</h3>
          <p className="civ-copy">
            A connected Phantom wallet can publish the current civilization state as a real Solana Devnet Memo transaction.
            This gives the world a timestamped on-chain receipt without pretending the browser simulation itself is an on-chain game engine.
          </p>
          {latestAnchor ? (
            <div className="chain-receipt">
              <span>DEVNET TX</span>
              <b>{latestAnchor.signature.slice(0, 24)}…</b>
              <small>tick {latestAnchor.tick} · {shortWallet(world.wallet)}</small>
              <a href={latestAnchor.explorerUrl} target="_blank" rel="noreferrer">Open in Solana Explorer ↗</a>
            </div>
          ) : (
            <p className="civ-note">No Devnet checkpoint anchored yet.</p>
          )}
        </div>

        <div className="civ-block civ-wide">
          <span className="civ-kicker">10 · FREE-AGENT CIVILIZATION</span>
          <h3>{world.civilizationMode ? "Civilization mode is live" : "Release the population"}</h3>
          <p className="civ-copy">
            In civilization mode, Valhalla runs up to 100 free agents through the same survival, market, property,
            company, city, nation, combat and treasure systems. Their individual outcomes are emergent rather than prewritten.
          </p>
          <div className="treasure-strip">
            {(world.treasures || []).map((treasure) => (
              <div key={treasure.id} className={treasure.claimed ? "claimed" : ""}>
                <span>{treasure.claimed ? "DISCOVERED" : "HIDDEN"}</span>
                <b>{treasure.claimed ? treasure.artifact : "Unknown artifact"}</b>
                <small>
                  {treasure.claimed
                    ? `${treasure.claimedBy} · ${getRegion(treasure.regionId)?.name}`
                    : "Agents must scout the frontier"}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
