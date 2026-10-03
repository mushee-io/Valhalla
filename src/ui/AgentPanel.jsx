import React from "react";
import { RESOURCES, getRegion, shortWallet } from "../world";

function inventoryTotal(agent) {
  return RESOURCES.reduce((sum, resource) => sum + (agent?.inventory?.[resource.id] || 0), 0);
}

export default function AgentPanel({ world, agent, onRelease, onFund }) {
  if (!agent) return null;

  const company = (world.companies || []).find((item) => item.id === agent.companyId);
  const nation = (world.nations || []).find((item) => item.id === agent.nationId);
  const ownedProperties = (world.properties || []).filter((property) => property.ownerId === agent.id);

  return (
    <section className="panel agent-card">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">AUTONOMOUS AGENT</span>
          <h2>{agent.name}</h2>
        </div>
        <span className={`status-pill ${agent.status === "FREE" ? "free" : ""}`}>
          {agent.status}
        </span>
      </div>

      <div className="identity-line">
        <span>Creator</span>
        <b>{shortWallet(agent.creatorWallet)}</b>
        <span>Identity</span>
        <b>{agent.identityHash?.slice(0, 10)}…</b>
      </div>

      <div className="agent-meta life-grid">
        <div><span>Energy</span><b>{agent.energy}%</b><meter min="0" max="100" value={agent.energy} /></div>
        <div><span>Compute</span><b>{agent.compute}%</b><meter min="0" max="100" value={agent.compute} /></div>
        <div><span>Durability</span><b>{agent.durability}%</b><meter min="0" max="100" value={agent.durability} /></div>
        <div><span>Fuel</span><b>{agent.fuel}%</b><meter min="0" max="100" value={agent.fuel} /></div>
        <div><span>Treasury</span><b>{Math.round(agent.wealth).toLocaleString()} cr</b></div>
        <div><span>Inventory</span><b>{inventoryTotal(agent)} units</b></div>
        <div><span>Autonomy</span><b>{agent.autonomyScore}%</b></div>
        <div><span>Reputation</span><b>{agent.reputation}</b></div>
        <div><span>Property</span><b>{ownedProperties.length}</b></div>
        <div><span>Mech</span><b>Mk {agent.mechLevel || 0}</b></div>
      </div>

      <div className="brain-box">
        <div className="brain-head">
          <span>LIVE BRAIN</span>
          <b>{agent.lastAction?.toUpperCase()}</b>
        </div>
        <p>“{agent.thought}”</p>
        <small>{agent.personality} · risk {agent.risk}/100 · {agent.archetype}</small>
      </div>

      <div className="objective">
        <span>PRIMARY OBJECTIVE</span>
        <strong>{agent.objective}</strong>
        {agent.activeJob && (
          <p className="active-job">
            Contract: {agent.activeJob.label} · completes T{agent.activeJob.completeTick}
          </p>
        )}
        {(company || nation) && (
          <div className="affiliation-line">
            {company && <span>Company: <b>{company.name}</b></span>}
            {nation && <span>Nation: <b>{nation.name}</b></span>}
          </div>
        )}
      </div>

      <div className="inventory-row">
        {RESOURCES.map((resource) => (
          <div key={resource.id}>
            <span>{resource.name}</span>
            <b>{agent.inventory?.[resource.id] || 0}</b>
          </div>
        ))}
      </div>

      <div className="agent-actions">
        {agent.status === "BOUND" && (
          <button className="primary" onClick={() => onRelease(agent.id)}>
            Release autonomy
          </button>
        )}
        {agent.creatorWallet === world.wallet && (
          <button className="ghost" onClick={() => onFund(agent.id, 1000)}>
            Fund +1,000 cr
          </button>
        )}
      </div>

      <div className="agent-location-line">
        <span>Current location</span>
        <b>{getRegion(agent.regionId)?.name}</b>
      </div>
    </section>
  );
}
