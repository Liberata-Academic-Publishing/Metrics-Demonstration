import { inequalityLabel } from "../metrics";

function patchWith(onSettings, partial) {
  onSettings((current) => ({ ...current, ...partial }));
}

export default function Sidebar({ settings, mixBy, topics, contributors, onSettings, onMixBy }) {
  const set = (partial) => patchWith(onSettings, partial);
  const ranked = [...contributors].sort((a, b) => b.capital - a.capital);
  const scholarValid = ranked.some((row) => row.index === settings.contributorIndex);
  const scholarValue = scholarValid ? settings.contributorIndex : ranked[0]?.index ?? "";
  const topicValue = settings.topic === "all" || topics.includes(settings.topic) ? settings.topic : "all";

  return (
    <aside className="sidebar">
      <form onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend>Corpus</legend>
          <label>
            Manuscripts <output>{settings.numManuscripts}</output>
            <input
              type="range"
              min="12"
              max="100"
              step="1"
              value={settings.numManuscripts}
              onChange={(event) => set({ numManuscripts: Number(event.target.value) })}
            />
          </label>
          <label>
            Contributors <output>{settings.numContributors}</output>
            <input
              type="range"
              min="16"
              max="140"
              step="1"
              value={settings.numContributors}
              onChange={(event) => set({ numContributors: Number(event.target.value) })}
            />
          </label>
          <label>
            Citation density <output>{Number(settings.citationDensity).toFixed(2)}</output>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.citationDensity}
              onChange={(event) => set({ citationDensity: Number(event.target.value) })}
            />
          </label>
          <label>
            Credit inequality <output>{inequalityLabel(settings.creditInequality)}</output>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.creditInequality}
              onChange={(event) => set({ creditInequality: Number(event.target.value) })}
            />
          </label>
          <label>
            Retraction rate <output>{`${Math.round(Number(settings.retractionRate) * 100)}%`}</output>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={settings.retractionRate}
              onChange={(event) => set({ retractionRate: Number(event.target.value) })}
            />
          </label>
          <label>
            Random seed
            <input
              type="number"
              value={settings.seed}
              onChange={(event) => set({ seed: event.target.value })}
            />
          </label>
        </fieldset>

        <fieldset>
        <legend>Selection</legend>
        <label>
          Portfolio subset
          <select
            value={settings.subsetMode}
            onChange={(event) => set({ subsetMode: event.target.value })}
          >
            <option value="all">All contributors</option>
            <option value="top_n">Top N by capital</option>
            <option value="single">Single scholar</option>
          </select>
        </label>
        <label hidden={settings.subsetMode !== "top_n"}>
          Top N <output>{settings.topN}</output>
          <input
            type="range"
            min="1"
            max="40"
            step="1"
            value={settings.topN}
            onChange={(event) => set({ topN: Number(event.target.value) })}
          />
        </label>
        <label hidden={settings.subsetMode !== "single"}>
          Scholar
          <select
            value={scholarValue}
            onChange={(event) => set({ contributorIndex: Number(event.target.value) })}
          >
            {ranked.map((row) => (
              <option key={row.index} value={row.index}>{row.label}</option>
            ))}
          </select>
        </label>
        <label>
          Field
          <select value={topicValue} onChange={(event) => set({ topic: event.target.value })}>
            <option value="all">All fields</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </label>
        <label>
          Mix grouping
          <select value={mixBy} onChange={(event) => onMixBy(event.target.value)}>
            <option value="role">By role</option>
            <option value="tag">By field</option>
          </select>
        </label>
        <label>
          Assumed funding
          <input
            type="number"
            min="0"
            step="50"
            value={settings.funding}
            onChange={(event) => set({ funding: event.target.value })}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.normalised}
            onChange={(event) => set({ normalised: event.target.checked })}
          />
          Normalised Laplacian
        </label>
      </fieldset>

      <p className="rail-note">Controls update the figures as you move them.</p>
      </form>
    </aside>
  );
}
