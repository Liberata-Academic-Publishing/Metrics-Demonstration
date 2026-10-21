import Chart from "chart.js/auto";

function mergeScale(base, over) {
  if (!over) return base;
  return {
    ...base,
    ...over,
    grid: { ...(base.grid || {}), ...(over.grid || {}) },
    ticks: { ...(base.ticks || {}), ...(over.ticks || {}) },
    border: { ...(base.border || {}), ...(over.border || {}) },
  };
}

export function baseChart(type, labels, datasets, colors, extra = {}) {
  const { plugins: extraPlugins = {}, scales: extraScales, ...rest } = extra;
  const cartesian = type === "line" || type === "bar";
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    color: colors.muted,
    interaction: type === "line"
      ? { mode: "index", intersect: false }
      : { mode: "nearest", intersect: true },
    plugins: {
      legend: {
        display: type === "doughnut" || datasets.length > 1,
        position: type === "doughnut" ? "right" : "bottom",
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 10,
          color: colors.muted,
          font: { size: 11, family: Chart.defaults.font.family },
        },
        ...(extraPlugins.legend || {}),
      },
      tooltip: {
        backgroundColor: colors.tipBg,
        titleColor: colors.tipInk,
        bodyColor: colors.tipInk,
        cornerRadius: 2,
        padding: 8,
        boxWidth: 8,
        boxHeight: 8,
        titleFont: { size: 12, weight: "500" },
        bodyFont: { size: 12 },
      },
    },
    ...rest,
  };
  options.layout = {
    padding: { top: 4, right: 14, bottom: 2, left: 2 },
    ...(options.layout || {}),
  };
  if (cartesian) {
    options.scales = {
      x: mergeScale({
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6, padding: 4, color: colors.muted },
        border: { display: false },
      }, extraScales && extraScales.x),
      y: mergeScale({
        beginAtZero: true,
        grid: { color: colors.grid, drawTicks: false },
        ticks: { maxTicksLimit: 5, padding: 8, color: colors.muted },
        border: { display: false },
      }, extraScales && extraScales.y),
    };
  }
  if (type === "doughnut") options.cutout = "62%";
  return {
    type,
    data: { labels, datasets },
    options,
    theme: `${colors.ink}|${colors.sheet}|${colors.grid}|${colors.muted}|${colors.tipBg}`,
  };
}

export function buildChartConfigs(data, mixBy, colors) {
  const p = data.portfolio;
  const m = data.market;
  const d = data.distribution;
  const c = data.traditional;
  const byField = mixBy === "tag";
  const mix = p.charts[byField ? "mix_tag" : "mix_role"];
  const longMixLabels = mix.labels.some((label) => String(label).length > 16);
  const scholars = d.charts.scholar_capital;
  const series = colors.series;
  const roleMix = !byField;
  const mixColors = roleMix
    ? [colors.author, colors.reviewer, colors.replicator]
    : series;

  return {
    mixNote: byField ? "By field" : "Papers, reviews, replications",
    capital: baseChart("line", p.charts.capital_over_time.labels, [{
      label: "Academic capital",
      data: p.charts.capital_over_time.values,
      borderColor: colors.author,
      backgroundColor: "transparent",
      fill: false,
      tension: 0.15,
      borderWidth: 1.75,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointHoverBackgroundColor: colors.author,
    }], colors),
    mix: baseChart("doughnut", mix.labels, [{
      data: mix.values,
      backgroundColor: mixColors,
      borderColor: colors.sheet,
      borderWidth: 2,
      hoverOffset: 2,
    }], colors, {
      plugins: { legend: { position: longMixLabels ? "bottom" : "right" } },
    }),
    hhi: baseChart("bar", scholars.labels, [
      { label: "Papers", data: scholars.papers, backgroundColor: colors.author, borderWidth: 0 },
      { label: "Peer reviews", data: scholars.reviews, backgroundColor: colors.reviewer, borderWidth: 0 },
      { label: "Replications", data: scholars.replications, backgroundColor: colors.replicator, borderWidth: 0 },
    ], colors, {
      datasets: { bar: { categoryPercentage: 1, barPercentage: 1 } },
      scales: {
        x: { stacked: true, ticks: { display: false }, grid: { display: false } },
        y: { stacked: true, ticks: { callback: (v) => `${Math.round(100 * Number(v))}%` }, min: 0 },
      },
    }),
    cite: baseChart("bar", c.charts.citation_hist.labels, [{
      label: "Papers", data: c.charts.citation_hist.values, backgroundColor: colors.author, borderWidth: 0,
    }], colors, {
      plugins: { legend: { display: false } },
      datasets: { bar: { categoryPercentage: 0.8, barPercentage: 0.88 } },
      scales: {
        x: { ticks: { maxTicksLimit: 5, maxRotation: 0, autoSkip: true } },
      },
    }),
    weights: baseChart("bar", p.charts.allocation_weights.labels, [{
      label: "Capital share", data: p.charts.allocation_weights.values, backgroundColor: colors.author, borderWidth: 0,
    }], colors, {
      plugins: { legend: { display: false } },
      datasets: { bar: { categoryPercentage: 1, barPercentage: 0.86 } },
      scales: { x: { ticks: { display: false } } },
    }),
    fmp: baseChart("bar", m.charts.fmp.labels, [
      { label: "Peer reviews", data: m.charts.fmp.reviewer, backgroundColor: colors.reviewer, borderWidth: 0 },
      { label: "Replications", data: m.charts.fmp.replicator, backgroundColor: colors.replicator, borderWidth: 0 },
    ], colors, {
      indexAxis: "y",
      datasets: { bar: { categoryPercentage: 0.72, barPercentage: 0.85 } },
      scales: {
        x: {
          beginAtZero: true,
          grid: { display: true, color: colors.grid, drawTicks: false },
          ticks: { maxTicksLimit: 4, maxRotation: 0 },
        },
        y: {
          grid: { display: false },
          ticks: { autoSkip: false, maxTicksLimit: 12, padding: 4, font: { size: 10, family: Chart.defaults.font.family } },
        },
      },
    }),
  };
}
