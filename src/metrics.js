export const DEFS = {
  academic_capital: ["Academic capital", "Each citing paper adds one unit, split equally across the papers it cites. A paper nobody cites holds none. Contributors then split their paper’s capital by credit share."],
  scholar_hhi: ["Scholar HHI", "Concentration of capital across people. This rises when credit inequality is turned up."],
  scholar_gini: ["Scholar Gini", "Inequality of capital across people. Moves with the credit-inequality slider."],
  scholar_entropy: ["Scholar entropy", "How evenly capital is spread across people. Falls when inequality is high."],
  share_splits_inequality: ["Share-split inequality", "Typical credit concentration on a single paper. This is what the inequality slider changes directly."],
  portfolio_hhi: ["Paper HHI", "Concentration of capital across papers, not people. Driven by how much each paper receives from later papers, so the inequality slider barely moves it."],
  portfolio_gini: ["Paper Gini", "Inequality of capital across papers. Same as Paper HHI: mostly citations received, not author credit splits."],
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
  reviewer_fmp_mean: ["Reviewer FMP", "Average reviewer capital per paper in a field. Averaged across the fields in the current view."],
  replicator_fmp_mean: ["Replicator FMP", "Average replicator capital per paper in a field. Averaged across the fields in the current view."],
  reviewer_risk_premium: ["Reviewer risk premium", "Reviewer capital on papers the selected scholars authored, minus the field's reviewer fair market price. Averaged across fields."],
  replicator_risk_premium: ["Replicator risk premium", "Replicator capital on papers the selected scholars authored, minus the field's replicator fair market price. Averaged across fields."],
  relative_performance: ["Relative performance", "Portfolio return divided by the return of each paper's field, weighted by the capital held on that paper."],
  sensitivity: ["Sensitivity", "How strongly the selected papers' returns move with their fields. This is the beta of paper returns on field returns."],
  risk_adjusted_excess_return: ["Excess return", "Average paper return after subtracting sensitivity times the field return."],
  risk_adjusted_relative_performance: ["Risk-adjusted performance", "Sum of each paper's excess return divided by its field return."],
  impact_of_quality_control: ["Quality-control impact", "Mean of a paper's capital change in the year after it appears, divided by the same change in its field."],
  academic_capital_growth_rate: ["Capital growth rate", "Compound growth of selected academic capital from the first yearly snapshot to the last."],
  reviewer_fmp_total: ["Reviewer FMP total", "Reviewer capital across the papers in view at the latest snapshot."],
  replicator_fmp_total: ["Replicator FMP total", "Replicator capital across the papers in view at the latest snapshot."],
  reviewer_shrinkage_rate: ["Reviewer shrinkage", "Per-year change in total reviewer capital, first snapshot minus last, divided by the number of years. Positive means that capital fell."],
  replicator_shrinkage_rate: ["Replicator shrinkage", "Per-year change in total replicator capital, first snapshot minus last, divided by the number of years. Positive means that capital fell."],
  reviewer_fmp_volatility: ["Reviewer FMP volatility", "Standard deviation of total reviewer capital across yearly snapshots, scaled by the square root of the number of snapshots."],
  replicator_fmp_volatility: ["Replicator FMP volatility", "Standard deviation of total replicator capital across yearly snapshots, scaled by the square root of the number of snapshots."],
  leading_field_share: ["Leading field share", "Largest field's share of the selected academic capital."],
  hhi_discrepancy: ["HHI discrepancy", "Absolute gap between share inequality across the whole corpus and share inequality on the papers held by the selected contributors."],
  mean_citations: ["Mean citations", "Average incoming citations per paper held by the selected contributors. A citation counts only when the citing paper is in the corpus."],
  max_citations: ["Max citations", "Most-cited paper among the papers held by the selected contributors, counting citations inside the corpus."],
  mean_h_index: ["Mean h-index", "Average h-index of scholars in the current subset, from citations inside the corpus."],
  mean_i10_index: ["Mean i10-index", "Average number of papers with at least 10 citations inside the corpus."],
  mean_g_index: ["Mean g-index", "Average g-index of scholars in the current subset, from citations inside the corpus."],
  fiedler_value: ["Fiedler value", "Algebraic connectivity of the co-authorship graph among the selected contributors. Zero when that graph is disconnected. The normalised Laplacian checkbox changes this."],
  connected_components: ["Connected components", "Union-find components of the co-authorship graph among the selected contributors."],
  spanning_tree_ratio: ["Spanning-tree ratio", "Collaboration edges divided by a spanning forest. JS demo, not Kirchhoff's theorem."],
  weighted_spanning_tree_ratio: ["Weighted STR", "Same ratio using a weighted edge count."],
  relative_spanning_tree_ratio: ["Relative STR", "Weighted / unweighted ratio. Closer to 1 means more even credit splits."],
};

export const METRIC_GROUPS = {
  portfolio: ["academic_capital", "scholar_hhi", "scholar_gini", "scholar_entropy", "share_splits_inequality", "portfolio_hhi", "portfolio_gini", "portfolio_normalized_entropy", "author_split", "reviewer_split", "replicator_split", "author_retraction_loss", "reviewer_retraction_loss", "replicator_retraction_loss", "proportional_return", "expected_proportional_returns", "expected_returns", "returns_per_year", "volatility", "sharpe_ratio", "arc", "risk_asymmetry", "diversification_ratio", "funding_efficiency", "time_efficiency"],
  market: ["reviewer_fmp_mean", "replicator_fmp_mean", "reviewer_risk_premium", "replicator_risk_premium", "relative_performance", "sensitivity", "risk_adjusted_excess_return", "risk_adjusted_relative_performance", "impact_of_quality_control"],
  distribution: ["share_splits_inequality", "hhi_discrepancy"],
  graph: ["fiedler_value", "connected_components", "spanning_tree_ratio", "weighted_spanning_tree_ratio", "relative_spanning_tree_ratio"],
  health: ["academic_capital_growth_rate", "reviewer_fmp_total", "replicator_fmp_total", "reviewer_shrinkage_rate", "replicator_shrinkage_rate", "reviewer_fmp_volatility", "replicator_fmp_volatility", "leading_field_share"],
  traditional: ["mean_citations", "max_citations", "mean_h_index", "mean_g_index", "mean_i10_index"],
};

export const TABS = [
  ["portfolio", "Portfolio"],
  ["market", "Market"],
  ["distribution", "Distribution"],
  ["graph", "Graph"],
  ["health", "Health"],
  ["traditional", "Traditional"],
];

export function parseRoute(hash = "") {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] !== "metrics") return { page: "explorer", group: "", metric: "" };
  const alias = { citation: "traditional" };
  const id = alias[parts[1]] || parts[1];
  const known = TABS.some(([tab]) => tab === id);
  return {
    page: "metrics",
    group: known ? id : "portfolio",
    metric: known ? (parts[2] || "") : "",
  };
}

export function fmt(value, format) {
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

export function inequalityLabel(v) {
  const n = Number(v);
  if (n <= 5) return "Equal";
  if (n <= 35) return "Mild";
  if (n <= 65) return "Moderate";
  if (n <= 85) return "High";
  return "Very high";
}
