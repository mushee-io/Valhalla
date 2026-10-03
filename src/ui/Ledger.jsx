import React from "react";

export default function Ledger({ world, onReset }) {
  return (
    <section className="panel ledger">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">CIVILIZATION LEDGER</span>
          <h2>Live events</h2>
        </div>
        <button className="text-button" onClick={onReset}>Reset</button>
      </div>

      <div className="event-list">
        {world.events.slice(0, 13).map((entry) => (
          <article key={entry.id} className={`event event-${entry.type}`}>
            <i />
            <div>
              <div className="event-topline">
                <b>{entry.title}</b>
                <span>T{entry.tick}</span>
              </div>
              <p>{entry.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
