import { useEffect } from "react";
import Masthead from "./Masthead";
import { DEFS, METRIC_GROUPS, TABS } from "../metrics";

const GROUP_INTRO = {
  portfolio: "Capital held by the selected contributors, how that capital is split, and how it changes across the corpus.",
  market: "Prices and risk of review and replication. Fair market price is average role capital per paper in a field. The other rows compare the selected papers with those field prices and with field returns.",
  distribution: "How unevenly credit is split on the papers held by the selected contributors, and how that compares with the whole corpus.",
  graph: "Shape of the co-authorship graph among the selected contributors: whether it is connected, how many pieces it has, and how dense the collaborations are.",
  health: "How the corpus changes over the yearly snapshots: capital growth, the level and volatility of review and replication capital, and which field holds the most capital. Regional, population, GDP, and purchasing-power versions need data this corpus does not have.",
  traditional: "Citation count, h-index, g-index, and i10 for the current selection. A citation counts only when both papers are in the corpus, so the counts match the citation network.",
};

export default function Guide({ group, metric }) {
  const label = TABS.find(([id]) => id === group)?.[1] || "Portfolio";
  const keys = METRIC_GROUPS[group] || METRIC_GROUPS.portfolio;
  const target = metric && keys.includes(metric) ? `${group}-${metric}` : "";

  useEffect(() => {
    if (!target) return undefined;
    const node = document.getElementById(target);
    if (!node) return undefined;
    node.scrollIntoView({ block: "start" });
    node.focus({ preventScroll: true });
    return undefined;
  }, [target]);

  return (
    <div className="guide">
      <Masthead current="metrics" group={group} />
      <div className="guide-body">
        <div className="guide-wrap">
          <p className="guide-kicker">{label}</p>
          <h1>{label} metrics</h1>
          <p className="guide-lead">{GROUP_INTRO[group]}</p>
          <section className="guide-group" aria-label={label}>
            {keys.map((key) => {
              const [title, blurb] = DEFS[key] || [key, ""];
              const entryId = `${group}-${key}`;
              return (
                <article
                  className={entryId === target ? "guide-entry is-target" : "guide-entry"}
                  id={entryId}
                  key={key}
                  tabIndex={-1}
                >
                  <h3>{title}</h3>
                  <p>{blurb}</p>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
