const PALETTE = ["#050599", "#3d3dcc", "#6b6be0", "#9494eb", "#b8b8f3", "#1a1ab0", "#5252d6"];
const charts = {};

const DEFS = {
  academic_capital: ["Academic capital", "Total credit × citation impact held by the selected contributors."],
  scholar_hhi: ["Scholar HHI", "Concentration of capital across people. This rises when credit inequality is turned up."],
  scholar_gini: ["Scholar Gini", "Inequality of capital across people. Moves with the credit-inequality slider."],
  scholar_entropy: ["Scholar entropy", "How evenly capital is spread across people. Falls when inequality is high."],
  share_splits_inequality: ["Share-split inequality", "Typical credit concentration on a single paper. This is what the inequality slider changes directly."],
  portfolio_hhi: ["Paper HHI", "Concentration of capital across papers, not people. Driven by citations, so the inequality slider barely moves it."],
  portfolio_gini: ["Paper Gini", "Inequality of capital across papers. Same as Paper HHI: mostly citations, not author credit splits."],
  portfolio_normalized_entropy: ["Paper entropy", "Diversity of capital across papers. 1 is a uniform spread over manuscripts."],
  author_split: ["Author split", "Share of selected capital that comes from authorship."],
  reviewer_split: ["Reviewer split", "Share of selected capital that comes from reviewing."],
  replicator_split: ["Replicator split", "Share of selected capital that comes from replication."],
  author_retraction_loss: ["Author retraction loss", "Share of authorship capital on retracted papers. This is the one that usually moves with the retraction slider."],
  reviewer_retraction_loss: ["Reviewer retraction loss", "Share of reviewer capital on retracted papers. Often near 0 because reviewers hold the smallest credit shares."],
  replicator_retraction_loss: ["Replicator retraction loss", "Share of replicator capital on retracted papers."],
  proportional_return: ["Proportional return", "Capital change from first to last yearly snapshot, divided by starting capital."],
  expected_proportional_returns: ["Expected proportional return", "Mean proportional return across yearly snapshots."],
  expected_returns: ["Expected return / time", "Mean capital change per unit time."],
  returns_per_year: ["Return per year", "Total capital change over the corpus lifetime, annualized."],
  volatility: ["Volatility", "Standard deviation of proportional returns."],
  sharpe_ratio: ["Sharpe ratio", "Expected proportional return divided by volatility."],
  arc: ["ARC", "Most recent proportional return divided by current academic capital. Follows citation growth of the selected scholars and field."],
  risk_asymmetry: ["Risk asymmetry", "Skew of the return distribution. Positive means more upside surprises."],
  diversification_ratio: ["Diversification ratio", "Weighted paper volatilities divided by portfolio volatility."],
  funding_efficiency: ["Funding efficiency", "Academic capital per unit of assumed funding."],
  time_efficiency: ["Time efficiency", "Academic capital accumulated per year between the first and last citation year."],
  reviewer_fmp_mean: ["Reviewer FMP", "Average fair market price of review capital across topics. JS demo: reviewer capital / author capital by topic."],
  replicator_fmp_mean: ["Replicator FMP", "Average fair market price of replication capital across topics. JS demo: replicator capital / author capital by topic."],
  hhi_discrepancy: ["HHI discrepancy", "Gap in share concentration between the current selection and the whole corpus. With all fields selected, this is the average gap between fields."],
  mean_citations: ["Mean citations", "Average incoming citations per paper in the current field filter."],
  max_citations: ["Max citations", "Most-cited paper in the current field filter."],
  mean_h_index: ["Mean h-index", "Average h-index of scholars in the current subset."],
  mean_i10_index: ["Mean i10-index", "Average number of papers with at least 10 citations."],
  mean_g_index: ["Mean g-index", "Average g-index of scholars in the current subset."],
  fiedler_value: ["Fiedler value", "Algebraic connectivity of the co-authorship graph in the current field. Zero when that graph is disconnected. The normalised Laplacian checkbox changes this."],
  connected_components: ["Connected components", "Union-find components of the co-authorship graph."],
  spanning_tree_ratio: ["Spanning-tree ratio", "Collaboration edges divided by a spanning forest. JS demo, not Kirchhoff's theorem."],
  weighted_spanning_tree_ratio: ["Weighted STR", "Same ratio using a weighted edge count."],
  relative_spanning_tree_ratio: ["Relative STR", "Weighted / unweighted ratio. Closer to 1 means more even credit splits."],
};

const METRIC_GROUPS = {
  portfolio: ["academic_capital", "scholar_hhi", "scholar_gini", "scholar_entropy", "share_splits_inequality", "portfolio_hhi", "portfolio_gini", "portfolio_normalized_entropy", "author_split", "reviewer_split", "replicator_split", "author_retraction_loss", "reviewer_retraction_loss", "replicator_retraction_loss", "proportional_return", "expected_proportional_returns", "expected_returns", "returns_per_year", "volatility", "sharpe_ratio", "arc", "risk_asymmetry", "diversification_ratio", "funding_efficiency", "time_efficiency"],
  market: ["reviewer_fmp_mean", "replicator_fmp_mean"],
  distribution: ["share_splits_inequality", "hhi_discrepancy"],
  citation: ["mean_citations", "max_citations", "mean_h_index", "mean_g_index", "mean_i10_index"],
  graph: ["fiedler_value", "connected_components", "spanning_tree_ratio", "weighted_spanning_tree_ratio", "relative_spanning_tree_ratio"],
};

const $ = (id) => document.getElementById(id);

let activeCategory = "portfolio";
let latest = null;
let corpus = null;

function fmt(value, format) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (format === "pct") return `${(100 * n).toFixed(1)}%`;
  if (Math.abs(n) === 0) return "0";
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 1) return n.toFixed(3);
  return n.toPrecision(3);
}

function inequalityLabel(v) {
  const n = Number(v);
  if (n <= 5) return "Equal";
  if (n <= 35) return "Mild";
  if (n <= 65) return "Moderate";
  if (n <= 85) return "High";
  return "Very high";
}

function bindOutputs() {
  const pairs = [
    ["num-manuscripts", "out-manuscripts", (v) => v],
    ["num-contributors", "out-contributors", (v) => v],
    ["citation-density", "out-density", (v) => Number(v).toFixed(2)],
    ["retraction-rate", "out-retract", (v) => `${Math.round(Number(v) * 100)}%`],
    ["top-n", "out-topn", (v) => v],
    ["credit-inequality", "out-inequality", inequalityLabel],
  ];
  pairs.forEach(([input, output, render]) => {
    const el = $(input);
    const out = $(output);
    const sync = () => { out.textContent = render(el.value); };
    el.addEventListener("input", sync);
    sync();
  });
}

function setBusy(busy) {
  $("status-line").classList.toggle("updating", busy);
}

function upsertChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const existing = charts[id];
  if (existing && existing.config.type === config.type) {
    existing.data.labels = config.data.labels;
    const nextSets = config.data.datasets;
    existing.data.datasets.splice(nextSets.length);
    nextSets.forEach((next, i) => {
      const ds = existing.data.datasets[i];
      if (!ds) {
        existing.data.datasets[i] = next;
        return;
      }
      ds.data = next.data;
      if (next.label != null) ds.label = next.label;
      if (next.backgroundColor != null) ds.backgroundColor = next.backgroundColor;
      if (next.borderColor != null) ds.borderColor = next.borderColor;
    });
    existing.update("none");
    return;
  }
  if (existing) existing.destroy();
  charts[id] = new Chart(canvas, config);
}

function card(key, metric) {
  const [title, blurb] = DEFS[key] || [key, ""];
  const m = metric || {};
  return `<article class="card"><h3>${title}</h3><div class="value">${fmt(m.value, m.format)}</div><p>${blurb}</p></article>`;
}

function cards(obj, keys) {
  return `<div class="cards">${keys.map((k) => card(k, obj[k])).join("")}</div>`;
}

function baseChart(type, labels, datasets, extra = {}) {
  return {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1, position: "bottom" } },
      ...extra,
    },
  };
}

function renderStats(c) {
  $("corpus-stats").innerHTML = [
    ["Papers", c.num_manuscripts],
    ["Scholars", c.num_contributors],
    ["Citations", c.num_citations],
    ["Retracted", c.num_retractions],
    ["Selected", c.selected_count],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  $("status-line").textContent = `${c.num_manuscripts} papers · ${c.topics.length} fields · seed ${c.settings.seed} · JS demo`;
}

function fillSelects(c) {
  const topic = $("topic-select");
  const currentTopic = topic.value || "all";
  topic.innerHTML = `<option value="all">All fields</option>` + c.topics.map((t) => `<option value="${t}">${t}</option>`).join("");
  topic.value = [...topic.options].some((o) => o.value === currentTopic) ? currentTopic : "all";

  const scholar = $("scholar-select");
  const currentScholar = scholar.value;
  const ranked = [...c.contributors].sort((a, b) => b.capital - a.capital);
  scholar.innerHTML = ranked.map((row) => `<option value="${row.index}">${row.label}</option>`).join("");
  if ([...scholar.options].some((o) => o.value === currentScholar)) scholar.value = currentScholar;
  else if (ranked.length) scholar.value = String(ranked[0].index);
}

function paintCharts(data) {
  const p = data.portfolio;
  const m = data.market;
  const d = data.distribution;
  const c = data.citation;
  const mixKey = $("mix-by").value === "tag" ? "mix_tag" : "mix_role";
  upsertChart("chart-capital", baseChart("line", p.charts.capital_over_time.labels, [{
    label: "Capital", data: p.charts.capital_over_time.values, borderColor: PALETTE[0], backgroundColor: "rgba(5, 5, 153, 0.15)", fill: true, tension: 0.25,
  }]));
  const mix = p.charts[mixKey];
  upsertChart("chart-mix", baseChart("doughnut", mix.labels, [{ data: mix.values, backgroundColor: PALETTE }]));
  const scholars = d.charts.scholar_capital;
  upsertChart("chart-hhi", baseChart("bar", scholars.labels, [
    { data: scholars.values, backgroundColor: PALETTE[0] },
  ], {
    plugins: { legend: { display: false } },
    datasets: { bar: { categoryPercentage: 1, barPercentage: 1 } },
    scales: {
      x: { ticks: { display: false }, grid: { display: false } },
      y: { ticks: { callback: (v) => `${Math.round(100 * Number(v))}%` }, min: 0 },
    },
  }));
  upsertChart("chart-cite", baseChart("bar", c.charts.citation_hist.labels, [{
    data: c.charts.citation_hist.values, backgroundColor: PALETTE[0],
  }], { plugins: { legend: { display: false } } }));
  upsertChart("chart-weights", baseChart("bar", p.charts.allocation_weights.labels, [{
    data: p.charts.allocation_weights.values, backgroundColor: PALETTE[0],
  }], { plugins: { legend: { display: false } } }));
  upsertChart("chart-fmp", baseChart("bar", m.charts.fmp.labels, [
    { label: "Reviewers", data: m.charts.fmp.reviewer, backgroundColor: PALETTE[2] },
    { label: "Replicators", data: m.charts.fmp.replicator, backgroundColor: PALETTE[1] },
  ]));
}

function paintMetrics(data) {
  $("metrics").innerHTML = cards(data[activeCategory], METRIC_GROUPS[activeCategory]);
}

function renderAll(data, rebuildSelects) {
  latest = data;
  if (rebuildSelects) fillSelects(data.corpus);
  renderStats(data.corpus);
  paintCharts(data);
  paintMetrics(data);
}

function viewSettings() {
  return {
    subsetMode: $("subset-mode").value,
    topN: Number($("top-n").value),
    contributorIndex: $("scholar-select").value === "" ? null : Number($("scholar-select").value),
    topic: $("topic-select").value,
    funding: Number($("funding").value) || 0,
    normalised: $("normalised").checked,
  };
}

function refresh(regenerate) {
  setBusy(true);
  try {
    if (regenerate || !corpus) {
      const shares = LiberataEngine.shareParams($("credit-inequality").value);
      corpus = LiberataEngine.generateCorpus({
        numManuscripts: Number($("num-manuscripts").value),
        numContributors: Number($("num-contributors").value),
        citationDensity: Number($("citation-density").value),
        retractionRate: Number($("retraction-rate").value),
        seed: Number($("seed").value) || 105,
        sharesDist: shares.sharesDist,
        paretoAlpha: shares.paretoAlpha,
      });
    }
    const data = LiberataEngine.computeMetrics(corpus, viewSettings());
    renderAll(data, Boolean(regenerate) || !latest);
  } catch (err) {
    $("status-line").textContent = `Error: ${err.message}`;
  } finally {
    setBusy(false);
  }
}

function setCategory(name) {
  activeCategory = name;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === name));
  if (latest) paintMetrics(latest);
}

function syncSubsetVisibility() {
  const mode = $("subset-mode").value;
  $("top-n-wrap").hidden = mode !== "top_n";
  $("scholar-wrap").hidden = mode !== "single";
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const liveRegenerate = debounce(() => refresh(true), 60);
const liveRefresh = debounce(() => refresh(false), 30);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setCategory(tab.dataset.cat));
});
$("corpus-form").addEventListener("submit", (e) => {
  e.preventDefault();
  refresh(true);
});
["num-manuscripts", "num-contributors", "citation-density", "retraction-rate", "seed", "credit-inequality"].forEach((id) => {
  $(id).addEventListener("input", liveRegenerate);
  $(id).addEventListener("change", liveRegenerate);
});
["subset-mode", "topic-select", "mix-by", "normalised", "scholar-select"].forEach((id) => {
  $(id).addEventListener("change", () => {
    syncSubsetVisibility();
    if (id === "mix-by" && latest) {
      paintCharts(latest);
      return;
    }
    liveRefresh();
  });
});
["top-n", "funding"].forEach((id) => {
  $(id).addEventListener("input", liveRefresh);
  $(id).addEventListener("change", liveRefresh);
});

bindOutputs();
syncSubsetVisibility();
refresh(true);
