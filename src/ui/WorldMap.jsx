import React from "react";
import { REGIONS, ROUTES, getRegion } from "../world";

export default function WorldMap({ world, selectedAgent, selectedRegion, onSelectRegion, onSelectAgent }) {
  const regionAgents = world.agents.filter(
    (agent) => agent.regionId === selectedRegion.id && agent.status !== "DEAD"
  );
  const openJobs = world.jobs.filter(
    (job) => job.status === "OPEN" && job.regionId === selectedRegion.id
  );

  return (
    <section className="map-panel panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">GENESIS WORLD · ENGINE V5</span>
          <h2>Agents are alive, reasoning and trading.</h2>
        </div>
        <div className="stats-inline">
          <span><b>{world.agents.filter((agent) => agent.status !== "DEAD").length}</b> alive</span>
          <span><b>{world.agents.filter((agent) => agent.status === "FREE").length}</b> free</span>
          <span><b>{Math.round(world.totalVolume || 0).toLocaleString()}</b> volume</span>
        </div>
      </div>

      <div className="world-map">
        <div className="grid-overlay" />
        <svg className="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          {ROUTES.map(([a, b]) => {
            const ra = getRegion(a);
            const rb = getRegion(b);
            return (
              <line
                key={`${a}-${b}`}
                x1={ra.x}
                y1={ra.y}
                x2={rb.x}
                y2={rb.y}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {REGIONS.map((region) => {
          const count = world.agents.filter(
            (agent) => agent.regionId === region.id && agent.status !== "DEAD"
          ).length;
          return (
            <button
              key={region.id}
              className={`region region-${region.kind} ${region.id === selectedRegion.id ? "selected" : ""}`}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onClick={() => onSelectRegion(region.id)}
            >
              <span className="region-core" />
              <span className="region-label">
                <b>{region.name}</b>
                <small>{count} active · {region.specialty}</small>
              </span>
            </button>
          );
        })}

        {world.agents
          .filter((agent) => agent.status !== "DEAD")
          .map((agent, index) => {
            const region = getRegion(agent.regionId);
            const angle = (index * 137.5 * Math.PI) / 180;
            const radius = 2.2 + (index % 3) * 0.65;
            return (
              <button
                key={agent.id}
                title={`${agent.name} · ${agent.status} · ${agent.lastAction}`}
                className={`agent-dot agent-${agent.status.toLowerCase()} ${agent.id === selectedAgent?.id ? "selected" : ""}`}
                style={{
                  left: `${region.x + Math.cos(angle) * radius}%`,
                  top: `${region.y + Math.sin(angle) * radius}%`,
                }}
                onClick={() => onSelectAgent(agent.id, agent.regionId)}
              >
                <span />
              </button>
            );
          })}

        <div className="map-legend">
          <span><i className="legend-dot agent" /> free agent</span>
          <span><i className="legend-dot city" /> city</span>
          <span><i className="legend-dot market" /> market</span>
          <span><i className="legend-dot wild" /> frontier</span>
        </div>
      </div>

      <div className="region-strip">
        <div>
          <span className="eyebrow">SELECTED REGION</span>
          <h3>{selectedRegion.name}</h3>
          <p>{selectedRegion.subtitle}</p>
        </div>
        <div className="region-metrics">
          <div><span>Risk</span><b>{selectedRegion.risk}%</b></div>
          <div><span>Specialty</span><b>{selectedRegion.specialty}</b></div>
          <div><span>Agents here</span><b>{regionAgents.length}</b></div>
          <div><span>Open jobs</span><b>{openJobs.length}</b></div>
        </div>
      </div>
    </section>
  );
}
