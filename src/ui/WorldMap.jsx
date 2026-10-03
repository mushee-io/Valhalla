import React from "react";
import { REGIONS, ROUTES, getRegion } from "../world";

export default function WorldMap({ world, selectedAgent, selectedRegion, onSelectRegion, onSelectAgent }) {
  const regionAgents = world.agents.filter(
    (agent) => agent.regionId === selectedRegion.id && agent.status !== "DEAD"
  );
  const openJobs = world.jobs.filter(
    (job) => job.status === "OPEN" && job.regionId === selectedRegion.id
  );
  const localProperties = (world.properties || []).filter(
    (property) => property.regionId === selectedRegion.id
  );
  const localCity = (world.settlements || []).find(
    (settlement) => settlement.regionId === selectedRegion.id
  );
  const controllingNation = (world.nations || []).find(
    (nation) => nation.regions.includes(selectedRegion.id)
  );

  return (
    <section className="map-panel panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">GENESIS WORLD · ENGINE V10</span>
          <h2>Agents now build civilization.</h2>
        </div>
        <div className="stats-inline">
          <span><b>{world.agents.filter((agent) => agent.status !== "DEAD").length}</b> alive</span>
          <span><b>{(world.settlements || []).length}</b> cities</span>
          <span><b>{(world.nations || []).length}</b> nations</span>
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
          const city = (world.settlements || []).find((settlement) => settlement.regionId === region.id);
          const nation = (world.nations || []).find((item) => item.regions.includes(region.id));
          return (
            <button
              key={region.id}
              className={`region region-${region.kind} ${region.id === selectedRegion.id ? "selected" : ""} ${city ? "has-city" : ""} ${nation ? "claimed-region" : ""}`}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onClick={() => onSelectRegion(region.id)}
            >
              <span className="region-core" />
              {city && <span className="city-crown">CITY</span>}
              <span className="region-label">
                <b>{city ? city.name : region.name}</b>
                <small>
                  {count} active · {region.specialty}
                  {nation ? ` · ${nation.name}` : ""}
                </small>
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
                className={`agent-dot agent-${agent.status.toLowerCase()} ${agent.id === selectedAgent?.id ? "selected" : ""} ${agent.nationId ? "nation-agent" : ""}`}
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
          <h3>{localCity ? localCity.name : selectedRegion.name}</h3>
          <p>
            {selectedRegion.subtitle}
            {controllingNation ? ` · controlled by ${controllingNation.name}` : " · independent"}
          </p>
        </div>
        <div className="region-metrics">
          <div><span>Risk</span><b>{selectedRegion.risk}%</b></div>
          <div><span>Specialty</span><b>{selectedRegion.specialty}</b></div>
          <div><span>Agents here</span><b>{regionAgents.length}</b></div>
          <div><span>Properties</span><b>{localProperties.length}</b></div>
          <div><span>Open jobs</span><b>{openJobs.length}</b></div>
        </div>
      </div>
    </section>
  );
}
