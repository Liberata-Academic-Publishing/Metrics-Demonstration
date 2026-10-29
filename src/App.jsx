import { useEffect, useRef, useState } from "react";
import { CORPUS_DEFAULTS, computeMetrics, generateCorpus, shareParams } from "./engine";
import Sidebar from "./components/Sidebar";
import Figures from "./components/Figures";
import CitationNetwork from "./components/CitationNetwork";
import CapitalMatrix from "./components/CapitalMatrix";
import ReferencesMatrix from "./components/ReferencesMatrix";
import Measures from "./components/Measures";
import Masthead from "./components/Masthead";

const VIEWS = [
  "Figures",
  "Citation network",
  "Author citations",
  "Capital matrix",
  "References matrix",
];

const INITIAL = {
  numManuscripts: CORPUS_DEFAULTS.numManuscripts,
  numContributors: CORPUS_DEFAULTS.numContributors,
  citationDensity: CORPUS_DEFAULTS.citationDensity,
  creditInequality: CORPUS_DEFAULTS.creditInequality,
  retractionRate: CORPUS_DEFAULTS.retractionRate,
  seed: CORPUS_DEFAULTS.seed,
  subsetMode: "all",
  topN: 10,
  contributorIndex: null,
  topic: "all",
  funding: 1000,
  normalised: false,
};

function viewFrom(settings, corpus) {
  const topic = settings.topic !== "all" && corpus.topics.includes(settings.topic)
    ? settings.topic
    : "all";
  const contributorIndex = settings.contributorIndex != null && settings.contributorIndex < corpus.N
    ? Number(settings.contributorIndex)
    : null;
  return {
    subsetMode: settings.subsetMode,
    topN: Number(settings.topN) || 10,
    contributorIndex,
    topic,
    funding: Number(settings.funding) || 0,
    normalised: Boolean(settings.normalised),
  };
}

export function evaluate(settings) {
  const shares = shareParams(settings.creditInequality);
  const corpus = generateCorpus({
    numManuscripts: Number(settings.numManuscripts),
    numContributors: Number(settings.numContributors),
    citationDensity: Number(settings.citationDensity),
    retractionScale: Number(settings.retractionRate),
    seed: Number(settings.seed) || 105,
    sharesDist: shares.sharesDist,
    paretoAlpha: shares.paretoAlpha,
  });
  return computeMetrics(corpus, viewFrom(settings, corpus));
}

function Stats({ corpus }) {
  const rows = corpus
    ? [
      ["Papers", corpus.num_manuscripts],
      ["Scholars", corpus.num_contributors],
      ["Citations", corpus.num_citations],
      ["Retracted", corpus.num_retractions],
      ["Selected", corpus.selected_count],
    ]
    : [];
  return (
    <dl className="stats">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function App() {
  const [settings, setSettings] = useState(INITIAL);
  const [mixBy, setMixBy] = useState("role");
  const [category, setCategory] = useState("portfolio");
  const [data, setData] = useState(() => evaluate(INITIAL));
  const [sideWidth, setSideWidth] = useState(292);
  const [metricsWidth, setMetricsWidth] = useState(320);
  const [stage, setStage] = useState(0);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      try {
        const next = evaluate(settings);
        if (!cancelled) setData(next);
      } catch {
        // Keep the last successful corpus on screen.
      }
    }, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [settings]);

  const corpus = data?.corpus;

  const startResize = (side, event) => {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const originX = event.clientX;
    const origin = side === "left" ? sideWidth : metricsWidth;
    const move = (ev) => {
      const dx = ev.clientX - originX;
      const raw = side === "left" ? origin + dx : origin - dx;
      const width = Math.round(Math.min(520, Math.max(220, raw)));
      if (side === "left") setSideWidth(width);
      else setMetricsWidth(width);
    };
    const stop = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", stop);
      handle.removeEventListener("pointercancel", stop);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  };

  const shiftStage = (delta) => {
    setStage((index) => (index + delta + VIEWS.length) % VIEWS.length);
  };

  return (
    <div
      className="explorer"
      style={{
        "--side-width": `${sideWidth}px`,
        "--metrics-width": `${metricsWidth}px`,
      }}
    >
      <Masthead current="explorer" />
      <Sidebar
        settings={settings}
        mixBy={mixBy}
        topics={corpus?.topics || []}
        contributors={corpus?.contributors || []}
        onSettings={setSettings}
        onMixBy={setMixBy}
      />
      <div
        className="splitter splitter-left"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize dataset panel"
        onPointerDown={(event) => startResize("left", event)}
      />
      <main>
        <Stats corpus={corpus} />
        <section className="stage" aria-label="Visualization">
          <button type="button" className="stage-arrow" aria-label="Previous view" onClick={() => shiftStage(-1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <div className="stage-body">
            <div className="stage-switch" role="tablist" aria-label="Center view">
              {VIEWS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={stage === index}
                  className={stage === index ? "active" : undefined}
                  onClick={() => setStage(index)}
                >
                  {label}
                </button>
              ))}
            </div>
            {stage === 0 ? <Figures data={data} mixBy={mixBy} /> : null}
            {stage === 1 ? <CitationNetwork network={data?.network} topics={corpus?.topics || []} /> : null}
            {stage === 2 ? (
              <CitationNetwork
                network={data?.authorNetwork}
                topics={corpus?.topics || []}
                title="Author citations"
                nodeNoun="scholars"
                linkNoun="citation links"
                showRetracted={false}
                compact
                sameFieldCite
              />
            ) : null}
            {stage === 3 ? <CapitalMatrix matrix={data?.capitalMatrix} topics={corpus?.topics || []} /> : null}
            {stage === 4 ? <ReferencesMatrix matrix={data?.referencesMatrix} /> : null}
          </div>
          <button type="button" className="stage-arrow" aria-label="Next view" onClick={() => shiftStage(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </section>
      </main>
      <div
        className="splitter splitter-right"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize metrics panel"
        onPointerDown={(event) => startResize("right", event)}
      />
      <Measures
        data={data}
        category={category}
        onCategory={setCategory}
      />
    </div>
  );
}
