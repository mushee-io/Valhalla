import React from "react";
import { RESOURCES, getRegion, shortWallet } from "../world";

function credits(value) {
  return Math.round(Number(value || 0)).toLocaleString();
}

export default function EconomyPanel({ world, region, agent, open, onToggle }) {
  const openJobs = world.jobs.filter((job) => job.status === "OPEN");
  const market = world.markets[region.id];

  return (
    <section className="panel economy-panel">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">MILESTONE 5 · WORLD ECONOMY</span>
          <h2>{region.name} economy</h2>
        </div>
        <div className="economy-summary">
          <span>{openJobs.length} open contracts</span>
          <span>{world.transactions.length} ledger txs</span>
          <button className="text-button" onClick={onToggle}>
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {open && (
        <div className="economy-grid">
          <div className="economy-block">
            <h3>Market</h3>
            <div className="market-table">
              {RESOURCES.map((resource) => {
                const quote = market[resource.id];
                return (
                  <div className="market-row" key={resource.id}>
                    <span>{resource.name}</span>
                    <b>{quote.price} cr</b>
                    <small className={quote.change >= 0 ? "up" : "down"}>
                      {quote.change >= 0 ? "+" : ""}{quote.change}%
                    </small>
                    <small>S {quote.supply} / D {quote.demand}</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="economy-block">
            <h3>Open contracts</h3>
            <div className="compact-list">
              {openJobs.slice(0, 7).map((job) => (
                <div key={job.id}>
                  <span>{getRegion(job.regionId).name}</span>
                  <b>{job.label}</b>
                  <small>{job.reward} cr · {job.duration} ticks</small>
                </div>
              ))}
            </div>
          </div>

          <div className="economy-block">
            <h3>Recent transactions</h3>
            <div className="compact-list">
              {world.transactions.slice(0, 7).map((tx) => (
                <div key={tx.id}>
                  <span>{tx.type} · T{tx.tick}</span>
                  <b>{tx.resourceId} × {tx.quantity}</b>
                  <small>{shortWallet(tx.from)} → {shortWallet(tx.to)} · {credits(tx.value)} cr</small>
                </div>
              ))}
              {!world.transactions.length && <p className="empty">Waiting for the first economic transaction…</p>}
            </div>
          </div>

          <div className="economy-block">
            <h3>{agent?.name || "Agent"} memory</h3>
            <div className="compact-list memory-list">
              {(agent?.memory || []).slice(0, 7).map((memory, index) => (
                <div key={`${memory.tick}-${memory.action}-${index}`}>
                  <span>T{memory.tick} · {memory.action}</span>
                  <small>{memory.text}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
