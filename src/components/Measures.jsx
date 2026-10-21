import { useState } from "react";
import { DEFS, METRIC_GROUPS, TABS, fmt } from "../metrics";

export default function Measures({ data, category, onCategory }) {
  const group = data?.[category];
  const keys = METRIC_GROUPS[category];
  const [picked, setPicked] = useState(keys[0]);
  const activeKey = keys.includes(picked) ? picked : keys[0];
  const [title, blurb] = DEFS[activeKey] || [activeKey, ""];
  const metric = group?.[activeKey];

  return (
    <aside className="measures" aria-label="Metrics">
      <div className="measures-bar">
        <h2><a href="#/metrics">Metrics</a></h2>
        <nav className="tabs" aria-label="Metric groups">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className={id === category ? "tab active" : "tab"}
              type="button"
              onClick={() => onCategory(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="metric-board" role="list" aria-label="Metric values">
        {keys.map((key) => {
          const [name] = DEFS[key] || [key];
          const row = group?.[key];
          const active = key === activeKey;
          return (
            <a
              key={key}
              href={`#/metrics/${category}/${key}`}
              className={active ? "metric-cell active" : "metric-cell"}
              onMouseEnter={() => setPicked(key)}
              onFocus={() => setPicked(key)}
            >
              <span className="metric-name">{name}</span>
              <span className="metric-num">{fmt(row?.value, row?.format)}</span>
            </a>
          );
        })}
      </div>
      <a className="metric-detail" href={`#/metrics/${category}/${activeKey}`}>
        <strong>{title}.</strong> {blurb} <span className="metric-readout">{fmt(metric?.value, metric?.format)}</span>
      </a>
    </aside>
  );
}
