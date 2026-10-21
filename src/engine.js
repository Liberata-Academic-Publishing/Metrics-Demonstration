/** Browser-side demo of the explorer metrics. Not the Python library. */
const TOPICS = [
  "Artificial intelligence", "Machine learning", "Natural language processing",
  "Computer vision", "Quantum information", "Condensed matter physics",
  "Astrophysics", "Climate science", "Genomics", "Immunology", "Neuroscience",
  "Pharmacology", "Organic chemistry", "Materials science", "Microeconomics",
  "Political science", "Sociology", "Linguistics", "Public health",
  "Epidemiology", "Ecology", "Developmental biology", "Cryptography", "Control theory",
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clip(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function randint(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function choice(rng, arr, k) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k);
}

function normal(rng, mean, std) {
  const u = Math.max(1e-12, rng());
  const v = rng();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function metric(value, format) {
  const payload = { value: value == null || !Number.isFinite(value) ? null : value };
  if (format) payload.format = format;
  return payload;
}

function concentration(values) {
  const weights = values.filter((v) => Number.isFinite(v));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0 || !weights.length) return { hhi: 0, gini: 0, entropy: 0 };
  const w = weights.map((v) => v / total);
  const n = w.length;
  const hhi = w.reduce((a, b) => a + b * b, 0);
  if (n <= 1) return { hhi, gini: 0, entropy: 0 };
  let diffs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) diffs += Math.abs(w[i] - w[j]);
  }
  const gini = diffs / (2 * n);
  const entropy = -w.reduce((a, p) => a + p * Math.log(Math.max(p, 1e-15)), 0) / Math.log(n);
  return { hhi, gini, entropy };
}

function histogram(values, bins) {
  if (!values.length) return { labels: ["0"], values: [0] };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const width = hi - lo || 1;
  const edges = [];
  for (let i = 0; i <= bins; i++) edges.push(lo + (width * i) / bins);
  const counts = new Array(bins).fill(0);
  values.forEach((v) => {
    let b = Math.min(bins - 1, Math.floor(((v - lo) / width) * bins));
    if (!Number.isFinite(b) || b < 0) b = 0;
    counts[b] += 1;
  });
  return {
    labels: counts.map((_, i) => `${edges[i].toFixed(1)}–${edges[i + 1].toFixed(1)}`),
    values: counts,
  };
}

function hIndex(cites) {
  const sorted = cites.slice().sort((a, b) => b - a);
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) h = i + 1;
    else break;
  }
  return h;
}

function gIndex(cites) {
  const sorted = cites.slice().sort((a, b) => b - a);
  let acc = 0;
  let g = 0;
  for (let i = 0; i < sorted.length; i++) {
    acc += sorted[i];
    if (acc >= (i + 1) * (i + 1)) g = i + 1;
    else break;
  }
  return g;
}

function shareParams(slider) {
  const v = Number(slider) / 100;
  if (v <= 0.05) return { sharesDist: "uniform", paretoAlpha: 1 };
  return { sharesDist: "pareto", paretoAlpha: 0.45 + 4.2 * (1 - v) };
}

function generateCorpus(settings) {
  const M = clip(Math.round(settings.numManuscripts), 8, 120);
  const N = clip(Math.round(settings.numContributors), 8, 180);
  const density = clip(settings.citationDensity, 0.05, 1);
  const retractionRate = clip(settings.retractionRate, 0, 0.3);
  const seed = settings.seed || 105;
  const rng = mulberry32(seed);
  const { sharesDist, paretoAlpha } = settings;

  const nTopics = clip(Math.floor(M / 10) || 1, 1, TOPICS.length);
  const topics = choice(rng, TOPICS, nTopics).map((_, index) => `Field ${index + 1}`);

  const papers = [];
  for (let i = 0; i < M; i++) {
    const year = 2020 + Math.floor(rng() * 5);
    const month = randint(rng, 1, 12);
    const nOn = randint(rng, 1, nTopics);
    const paperTopics = choice(rng, topics, nOn);
    papers.push({
      index: i,
      year,
      date: `${year}-${String(month).padStart(2, "0")}-01`,
      primary: paperTopics[0],
      topics: paperTopics,
      retracted: false,
    });
  }
  papers.sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index);
  papers.forEach((p, i) => { p.index = i; });

  const incoming = new Array(M).fill(0);
  const citeCount = new Array(M).fill(0);
  const citations = [];
  let nCitations = 0;
  for (let i = 1; i < M; i++) {
    const avail = i;
    const maxCitations = Math.floor(avail * density);
    const num = maxCitations > 0 ? randint(rng, 0, maxCitations) : 0;
    if (!num) continue;
    const cited = choice(rng, [...Array(i).keys()], num);
    const w = 1 / num;
    const year = papers[i].year;
    cited.forEach((j) => {
      incoming[j] += w;
      citeCount[j] += 1;
      nCitations += 1;
      citations.push({ citing: i, cited: j, year, weight: w });
    });
  }

  let nRetract = retractionRate > 0 ? Math.ceil(retractionRate * M - 1e-12) : 0;
  nRetract = Math.min(nRetract, M);
  const citedPapers = papers.map((_, i) => i).filter((i) => citeCount[i] > 0);
  const uncited = papers.map((_, i) => i).filter((i) => citeCount[i] === 0);
  const pick = [];
  if (citedPapers.length >= nRetract) {
    pick.push(...choice(rng, citedPapers, nRetract));
  } else {
    pick.push(...citedPapers);
    const extra = nRetract - citedPapers.length;
    if (extra > 0 && uncited.length) pick.push(...choice(rng, uncited, Math.min(extra, uncited.length)));
  }
  pick.forEach((i) => { papers[i].retracted = true; });

  const avg = clip(Math.round(N / 10), 4, 10);
  const std = Math.max(2, Math.floor(avg / 2));
  const shares = [];
  for (let i = 0; i < M; i++) {
    let nOn = Math.round(normal(rng, avg, std));
    nOn = clip(nOn, 1, N);
    const people = choice(rng, [...Array(N).keys()], nOn);
    let raw;
    if (sharesDist === "uniform") {
      raw = people.map(() => 1 / nOn);
    } else if (sharesDist === "dirichlet") {
      raw = people.map(() => -Math.log(Math.max(rng(), 1e-12)));
      const s = raw.reduce((a, b) => a + b, 0);
      raw = raw.map((v) => v / s);
    } else {
      raw = people.map(() => (Math.pow(Math.max(rng(), 1e-12), -1 / paretoAlpha) - 1) + 1e-12);
      const s = raw.reduce((a, b) => a + b, 0);
      raw = raw.map((v) => v / s);
    }
    const order = raw.map((v, k) => k).sort((a, b) => raw[b] - raw[a]);
    const roles = new Array(nOn).fill("author");
    if (nOn >= 2) roles[order[nOn - 1]] = "reviewer";
    if (nOn >= 3) roles[order[nOn - 2]] = "reviewer";
    if (nOn >= 4) roles[order[nOn - 3]] = "replicator";
    if (nOn >= 5) roles[order[nOn - 4]] = "replicator";
    shares[i] = people.map((person, k) => ({ person, share: raw[k], role: roles[k] }));
  }

  const author = Array.from({ length: N }, () => new Array(M).fill(0));
  const reviewer = Array.from({ length: N }, () => new Array(M).fill(0));
  const replicator = Array.from({ length: N }, () => new Array(M).fill(0));
  const retAuthor = Array.from({ length: N }, () => new Array(M).fill(0));
  const retReviewer = Array.from({ length: N }, () => new Array(M).fill(0));
  const retReplicator = Array.from({ length: N }, () => new Array(M).fill(0));

  function addCap(person, paper, role, value, retracted) {
    if (role === "reviewer") reviewer[person][paper] += value;
    else if (role === "replicator") replicator[person][paper] += value;
    else author[person][paper] += value;
    if (retracted) {
      if (role === "reviewer") retReviewer[person][paper] += value;
      else if (role === "replicator") retReplicator[person][paper] += value;
      else retAuthor[person][paper] += value;
    }
  }

  for (let i = 0; i < M; i++) {
    const impact = incoming[i];
    shares[i].forEach(({ person, share, role }) => {
      addCap(person, i, role, share * impact, papers[i].retracted);
    });
  }

  function personTotal(person) {
    let t = 0;
    for (let i = 0; i < M; i++) t += author[person][i] + reviewer[person][i] + replicator[person][i];
    return t;
  }

  if (sharesDist === "uniform") {
    const totals = [...Array(N).keys()].map(personTotal);
    const grand = totals.reduce((a, b) => a + b, 0);
    const target = N ? grand / N : 0;
    for (let p = 0; p < N; p++) {
      if (totals[p] > 1e-15) {
        const scale = target / totals[p];
        for (let i = 0; i < M; i++) {
          author[p][i] *= scale;
          reviewer[p][i] *= scale;
          replicator[p][i] *= scale;
          retAuthor[p][i] *= scale;
          retReviewer[p][i] *= scale;
          retReplicator[p][i] *= scale;
        }
      } else if (target > 0) {
        const even = target / M;
        for (let i = 0; i < M; i++) author[p][i] += even;
      }
    }
  }

  const byPaper = Array.from({ length: M }, () => new Map());
  citations.forEach(({ cited, year, weight }) => {
    byPaper[cited].set(year, (byPaper[cited].get(year) || 0) + weight);
  });
  const citationMass = byPaper.map((map) => {
    const rows = [...map.entries()].sort((a, b) => a[0] - b[0]);
    let cum = 0;
    const total = rows.reduce((sum, [, weight]) => sum + weight, 0);
    return rows.map(([year, weight]) => {
      cum += weight;
      return { year, cum, total };
    });
  });

  return {
    M, N, papers, topics, shares, incoming, citeCount, nCitations, citationMass, citations,
    author, reviewer, replicator, retAuthor, retReviewer, retReplicator,
    settings: {
      num_manuscripts: M,
      num_contributors: N,
      citation_density: density,
      shares_dist: sharesDist,
      pareto_alpha: paretoAlpha,
      seed,
      retraction_rate: retractionRate,
    },
  };
}

function personTotalOn(corpus, person, paperSet, role) {
  let total = 0;
  paperSet.forEach((paperIndex) => {
    if (role) total += corpus[role][person][paperIndex];
    else {
      total += corpus.author[person][paperIndex]
        + corpus.reviewer[person][paperIndex]
        + corpus.replicator[person][paperIndex];
    }
  });
  return total;
}

function fractionAt(mass, year, paperYear) {
  if (!mass.length) return year >= paperYear ? 1 : 0;
  let cum = 0;
  for (let i = 0; i < mass.length; i++) {
    if (mass[i].year > year) break;
    cum = mass[i].cum;
  }
  return mass[0].total > 0 ? cum / mass[0].total : 0;
}

function populationStd(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
}

function capitalPaths(corpus, subset, paperSet) {
  const paperCap = paperSet.map((i) => {
    let s = 0;
    subset.forEach((p) => {
      s += corpus.author[p][i] + corpus.reviewer[p][i] + corpus.replicator[p][i];
    });
    return s;
  });
  let minY = Infinity;
  let maxY = -Infinity;
  paperSet.forEach((i, k) => {
    if (paperCap[k] <= 1e-15) return;
    const mass = corpus.citationMass[i];
    if (!mass.length) {
      minY = Math.min(minY, corpus.papers[i].year);
      maxY = Math.max(maxY, corpus.papers[i].year);
      return;
    }
    minY = Math.min(minY, mass[0].year);
    maxY = Math.max(maxY, mass[mass.length - 1].year);
  });
  if (!Number.isFinite(minY)) return { years: [], series: [], paperSeries: paperCap.map(() => []) };
  const years = [];
  for (let y = minY; y <= maxY; y++) years.push(y);
  const paperSeries = paperSet.map((i, k) => years.map((y) => paperCap[k] * fractionAt(corpus.citationMass[i], y, corpus.papers[i].year)));
  const series = years.map((_, t) => paperSeries.reduce((sum, row) => sum + row[t], 0));
  return { years, series, paperSeries };
}

function rolePath(corpus, people, paperSet, years, roleKey) {
  const base = paperSet.map((paperIndex) => {
    let total = 0;
    people.forEach((person) => { total += corpus[roleKey][person][paperIndex]; });
    return total;
  });
  return years.map((year) => paperSet.reduce((sum, paperIndex, index) => (
    sum + base[index] * fractionAt(corpus.citationMass[paperIndex], year, corpus.papers[paperIndex].year)
  ), 0));
}

function spanReturn(series) {
  if (!series || series.length < 2) return 0;
  return (series[series.length - 1] - series[0]) / (series.length - 1);
}

function covariance(left, right) {
  const count = Math.min(left.length, right.length);
  if (count < 2) return 0;
  let meanLeft = 0;
  let meanRight = 0;
  for (let i = 0; i < count; i++) {
    meanLeft += left[i];
    meanRight += right[i];
  }
  meanLeft /= count;
  meanRight /= count;
  let total = 0;
  for (let i = 0; i < count; i++) total += (left[i] - meanLeft) * (right[i] - meanRight);
  return total / count;
}

function proportionalReturns(series) {
  const returns = [];
  for (let t = 1; t < series.length; t++) {
    const prev = series[t - 1];
    returns.push(prev > 1e-12 ? (series[t] - prev) / prev : 0);
  }
  return returns;
}

function fiedlerValue(neighbors, degrees, normalised) {
  const n = degrees.length;
  if (n < 2) return 0;
  const shift = normalised ? 2 : Math.max(1, ...degrees) * 2;
  const kernel = degrees.map((d) => (normalised ? Math.sqrt(Math.max(d, 0)) : 1));
  const v = degrees.map((_, i) => ((i * 17) % 11) - 5);
  const Lv = new Array(n);
  const Mv = new Array(n);
  function applyL(src, out) {
    if (!normalised) {
      for (let i = 0; i < n; i++) {
        let acc = degrees[i] * src[i];
        const nbrs = neighbors[i];
        for (let k = 0; k < nbrs.length; k++) acc -= nbrs[k].w * src[nbrs[k].j];
        out[i] = acc;
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      if (degrees[i] <= 0) {
        out[i] = 0;
        continue;
      }
      let acc = src[i];
      const invDi = 1 / Math.sqrt(degrees[i]);
      const nbrs = neighbors[i];
      for (let k = 0; k < nbrs.length; k++) {
        const j = nbrs[k].j;
        if (degrees[j] <= 0) continue;
        acc -= nbrs[k].w * src[j] * invDi / Math.sqrt(degrees[j]);
      }
      out[i] = acc;
    }
  }
  function project(vec) {
    let dot = 0;
    let kk = 0;
    for (let i = 0; i < n; i++) {
      dot += vec[i] * kernel[i];
      kk += kernel[i] * kernel[i];
    }
    if (kk <= 0) return;
    const scale = dot / kk;
    for (let i = 0; i < n; i++) vec[i] -= scale * kernel[i];
  }
  project(v);
  let lambda = 0;
  for (let iter = 0; iter < 80; iter++) {
    applyL(v, Lv);
    let norm2 = 0;
    for (let i = 0; i < n; i++) {
      Mv[i] = shift * v[i] - Lv[i];
      norm2 += Mv[i] * Mv[i];
    }
    project(Mv);
    norm2 = 0;
    for (let i = 0; i < n; i++) norm2 += Mv[i] * Mv[i];
    const norm = Math.sqrt(norm2) || 1;
    for (let i = 0; i < n; i++) v[i] = Mv[i] / norm;
    applyL(v, Lv);
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += v[i] * Lv[i];
      den += v[i] * v[i];
    }
    lambda = den > 0 ? num / den : 0;
  }
  return Math.max(0, lambda);
}

function computeMetrics(corpus, view) {
  const { M, N, papers, topics } = corpus;
  let paperSet = papers.map((_, i) => i);
  if (view.topic && view.topic !== "all") {
    paperSet = papers.map((p, i) => (p.primary === view.topic ? i : -1)).filter((i) => i >= 0);
    if (!paperSet.length) paperSet = papers.map((_, i) => i);
  }
  const fieldActive = Boolean(view.topic && view.topic !== "all");
  const scholarsInField = new Set();
  paperSet.forEach((i) => {
    corpus.shares[i].forEach((share) => scholarsInField.add(share.person));
  });

  const totals = [...Array(N).keys()].map((p) => personTotalOn(corpus, p, paperSet));
  const ranked = totals.map((cap, index) => ({ index, cap })).sort((a, b) => b.cap - a.cap);
  const rankedInView = fieldActive ? ranked.filter((row) => scholarsInField.has(row.index)) : ranked;
  const pool = rankedInView.length ? rankedInView : ranked;
  let subset;
  if (view.subsetMode === "single") {
    const requested = view.contributorIndex == null ? null : Number(view.contributorIndex);
    const allowed = requested != null && pool.some((row) => row.index === requested);
    subset = [allowed ? requested : pool[0].index];
  } else if (view.subsetMode === "top_n") {
    subset = pool.slice(0, clip(view.topN || 10, 1, pool.length)).map((row) => row.index);
  } else {
    subset = pool.map((row) => row.index);
  }
  const subsetSet = new Set(subset);
  const touched = paperSet.filter((i) => corpus.shares[i].some((share) => subsetSet.has(share.person)));
  const viewPapers = touched.length ? touched : paperSet;
  const viewMark = new Set(viewPapers);
  const citeInView = new Array(M).fill(0);
  corpus.citations.forEach((edge) => {
    if (viewMark.has(edge.citing) && viewMark.has(edge.cited)) citeInView[edge.cited] += 1;
  });
  const activeTopics = topics.filter((topic) => viewPapers.some((i) => papers[i].primary === topic));

  const selectedTotals = subset.map((p) => totals[p]);
  const academic = selectedTotals.reduce((a, b) => a + b, 0);
  const scholar = concentration(selectedTotals);

  const paperCap = viewPapers.map((i) => {
    let s = 0;
    subset.forEach((p) => {
      s += corpus.author[p][i] + corpus.reviewer[p][i] + corpus.replicator[p][i];
    });
    return s;
  });
  const paperConc = concentration(paperCap.filter((v) => v > 0));

  let authorCap = 0;
  let reviewerCap = 0;
  let replicatorCap = 0;
  let retA = 0;
  let retR = 0;
  let retP = 0;
  subset.forEach((p) => {
    viewPapers.forEach((i) => {
      authorCap += corpus.author[p][i];
      reviewerCap += corpus.reviewer[p][i];
      replicatorCap += corpus.replicator[p][i];
      retA += corpus.retAuthor[p][i];
      retR += corpus.retReviewer[p][i];
      retP += corpus.retReplicator[p][i];
    });
  });

  const rowHhi = [];
  corpus.shares.forEach((row, i) => {
    if (!viewMark.has(i)) return;
    rowHhi.push(row.reduce((a, s) => a + s.share * s.share, 0));
  });
  const shareIneq = rowHhi.length ? rowHhi.reduce((a, b) => a + b, 0) / rowHhi.length : 0;
  const allRowHhi = corpus.shares.map((row) => row.reduce((a, s) => a + s.share * s.share, 0));
  const fieldIneq = allRowHhi.reduce((a, b) => a + b, 0) / Math.max(allRowHhi.length, 1);

  const mixRole = [authorCap, reviewerCap, replicatorCap];
  const mixTag = topics.map((topic) => {
    let s = 0;
    papers.forEach((p, i) => {
      if (p.primary !== topic || !viewMark.has(i)) return;
      subset.forEach((person) => {
        s += corpus.author[person][i] + corpus.reviewer[person][i] + corpus.replicator[person][i];
      });
    });
    return s;
  });

  const weightPairs = viewPapers.map((i, k) => ({ i, v: paperCap[k] }))
    .filter((row) => row.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 24);

  const paths = capitalPaths(corpus, subset, viewPapers);
  const capitalSeries = paths.series;
  const returns = proportionalReturns(capitalSeries);
  const meanRet = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const vol = populationStd(returns);
  const first = capitalSeries.find((v) => v > 1e-12) || 0;
  const last = capitalSeries.length ? capitalSeries[capitalSeries.length - 1] : 0;
  const propReturn = first > 1e-12 ? (last - first) / first : 0;
  const yearsSpan = Math.max(paths.years.length - 1, 1);
  const absoluteChanges = [];
  for (let t = 1; t < capitalSeries.length; t++) absoluteChanges.push(capitalSeries[t] - capitalSeries[t - 1]);
  const meanAbsolute = absoluteChanges.length
    ? absoluteChanges.reduce((a, b) => a + b, 0) / absoluteChanges.length
    : 0;
  const skew = vol > 1e-12 && returns.length
    ? returns.reduce((a, r) => a + ((r - meanRet) / vol) ** 3, 0) / returns.length
    : 0;
  let diversification = 1;
  if (vol > 1e-12 && last > 1e-12) {
    let weightedVol = 0;
    paths.paperSeries.forEach((row) => {
      const finalCap = row.length ? row[row.length - 1] : 0;
      if (finalCap <= 1e-12) return;
      weightedVol += (finalCap / last) * populationStd(proportionalReturns(row));
    });
    diversification = weightedVol / vol;
  }

  function sumRole(roleKey, paperIndexes, people) {
    let total = 0;
    paperIndexes.forEach((paperIndex) => {
      people.forEach((person) => { total += corpus[roleKey][person][paperIndex]; });
    });
    return total;
  }
  const everyone = [...Array(N).keys()];
  const fmpReviewer = [];
  const fmpReplicator = [];
  const premiumReviewer = [];
  const premiumReplicator = [];
  activeTopics.forEach((topic) => {
    const inField = viewPapers.filter((paperIndex) => papers[paperIndex].primary === topic);
    const count = Math.max(inField.length, 1);
    const reviewerPrice = sumRole("reviewer", inField, everyone) / count;
    const replicatorPrice = sumRole("replicator", inField, everyone) / count;
    fmpReviewer.push(reviewerPrice);
    fmpReplicator.push(replicatorPrice);
    const authored = inField.filter((paperIndex) => (
      corpus.shares[paperIndex].some((share) => share.role === "author" && subsetSet.has(share.person))
    ));
    premiumReviewer.push(sumRole("reviewer", authored, everyone) - reviewerPrice);
    premiumReplicator.push(sumRole("replicator", authored, everyone) - replicatorPrice);
  });
  const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

  const fieldSeries = new Map(activeTopics.map((topic) => {
    const series = paths.years.map((_, time) => viewPapers.reduce((sum, paperIndex, index) => (
      papers[paperIndex].primary === topic ? sum + (paths.paperSeries[index][time] || 0) : sum
    ), 0));
    return [topic, series];
  }));
  const paperMu = viewPapers.map((_, index) => spanReturn(paths.paperSeries[index]));
  const fieldMu = viewPapers.map((paperIndex) => spanReturn(fieldSeries.get(papers[paperIndex].primary)));
  let performanceNumerator = 0;
  let performanceWeight = 0;
  paperMu.forEach((mu, index) => {
    const weight = paperCap[index];
    if (weight <= 0) return;
    performanceWeight += weight;
    const domain = fieldMu[index];
    if (Math.abs(domain) > 1e-10) performanceNumerator += weight * (mu / domain);
    else if (Math.abs(mu) < 1e-10) performanceNumerator += weight;
  });
  const relativePerformance = performanceWeight > 0 ? performanceNumerator / performanceWeight : 0;
  const domainVariance = covariance(fieldMu, fieldMu);
  const sensitivity = Math.abs(domainVariance) > 1e-12 ? covariance(paperMu, fieldMu) / domainVariance : 0;
  const alphas = paperMu.map((mu, index) => mu - sensitivity * fieldMu[index]);
  const excessReturn = average(alphas);
  const riskAdjustedRelative = alphas.reduce((sum, alpha, index) => (
    Math.abs(fieldMu[index]) > 1e-10 ? sum + alpha / fieldMu[index] : sum
  ), 0);
  let qualitySum = 0;
  let qualityCount = 0;
  viewPapers.forEach((paperIndex, index) => {
    const start = paths.years.indexOf(papers[paperIndex].year);
    const end = paths.years.indexOf(papers[paperIndex].year + 1);
    if (start < 0 || end < 0) return;
    const paperDelta = (paths.paperSeries[index][end] || 0) - (paths.paperSeries[index][start] || 0);
    const field = fieldSeries.get(papers[paperIndex].primary) || [];
    const fieldDelta = (field[end] || 0) - (field[start] || 0);
    if (Math.abs(fieldDelta) < 1e-12) return;
    qualitySum += paperDelta / fieldDelta;
    qualityCount += 1;
  });
  const qualityImpact = qualityCount ? qualitySum / qualityCount : 0;

  const reviewerHistory = rolePath(corpus, everyone, viewPapers, paths.years, "reviewer");
  const replicatorHistory = rolePath(corpus, everyone, viewPapers, paths.years, "replicator");
  const historySpan = Math.max(paths.years.length - 1, 1);
  const growthRate = first > 1e-12 && capitalSeries.length > 1
    ? (last / first) ** (1 / historySpan) - 1
    : 0;
  const shrinkage = (history) => (
    history.length > 1 ? (history[0] - history[history.length - 1]) / (history.length - 1) : 0
  );
  const priceVolatility = (history) => populationStd(history) * Math.sqrt(Math.max(history.length, 1));
  let leadingFieldShare = 0;
  activeTopics.forEach((topic) => {
    const share = academic > 0 ? mixTag[topics.indexOf(topic)] / academic : 0;
    if (share > leadingFieldShare) leadingFieldShare = share;
  });

  const topicCites = viewPapers.map((i) => citeInView[i]);
  const citeHist = histogram(topicCites, Math.min(10, Math.max(4, Math.floor(topicCites.length / 5) || 4)));
  citeHist.labels = citeHist.labels.map((lab) => lab.replace(/\.0/g, ""));

  const hVals = [];
  const i10Vals = [];
  const gVals = [];
  subset.forEach((p) => {
    const cites = [];
    corpus.shares.forEach((row, i) => {
      if (!viewMark.has(i)) return;
      if (row.some((s) => s.person === p && s.role === "author")) cites.push(citeInView[i]);
    });
    hVals.push(hIndex(cites));
    i10Vals.push(cites.filter((c) => c >= 10).length);
    gVals.push(gIndex(cites));
  });

  const parent = new Map();
  function ensure(x) {
    if (!parent.has(x)) parent.set(x, x);
  }
  function find(x) {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root);
    let cursor = x;
    while (parent.get(cursor) !== root) {
      const next = parent.get(cursor);
      parent.set(cursor, root);
      cursor = next;
    }
    return root;
  }
  function union(a, b) {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent.set(pa, pb);
  }
  const pairEven = new Map();
  corpus.shares.forEach((row, i) => {
    if (!viewMark.has(i)) return;
    const people = row.filter((s) => subsetSet.has(s.person));
    people.forEach((s) => ensure(s.person));
    for (let a = 0; a < people.length; a++) {
      for (let b = a + 1; b < people.length; b++) {
        const p = people[a].person;
        const q = people[b].person;
        const lo = Math.min(p, q);
        const hi = Math.max(p, q);
        const key = `${lo}|${hi}`;
        const shareSum = people[a].share + people[b].share;
        const even = shareSum > 1e-15 ? (2 * Math.min(people[a].share, people[b].share)) / shareSum : 0;
        const rec = pairEven.get(key) || { w: 0, n: 0, p: lo, q: hi };
        rec.w += even;
        rec.n += 1;
        pairEven.set(key, rec);
        union(p, q);
      }
    }
  });
  let edges = 0;
  let weight = 0;
  pairEven.forEach((rec) => {
    edges += 1;
    weight += rec.n > 0 ? rec.w / rec.n : 0;
  });
  const involved = [...parent.keys()];
  const componentCount = new Set(involved.map(find)).size;
  const forest = Math.max(involved.length - componentCount, 0);
  const str = forest > 0 ? edges / forest : 0;
  const wstr = forest > 0 ? weight / forest : 0;
  let fiedler = 0;
  if (componentCount === 1 && involved.length >= 2) {
    const indexOf = new Map(involved.map((id, idx) => [id, idx]));
    const neighbors = involved.map(() => []);
    pairEven.forEach((rec) => {
      const i = indexOf.get(rec.p);
      const j = indexOf.get(rec.q);
      neighbors[i].push({ j, w: 1 });
      neighbors[j].push({ j: i, w: 1 });
    });
    const degrees = neighbors.map((nbrs) => nbrs.length);
    fiedler = fiedlerValue(neighbors, degrees, Boolean(view.normalised));
  }

  const sharePeople = [...subset].sort((a, b) => totals[b] - totals[a] || a - b);
  const shareGrand = sharePeople.reduce((sum, person) => sum + totals[person], 0);

  const authorsOn = (paperIndex) => corpus.shares[paperIndex]
    .filter((share) => share.role === "author" && subsetSet.has(share.person))
    .map((share) => share.person);
  const authorSet = new Set();
  viewPapers.forEach((paperIndex) => authorsOn(paperIndex).forEach((person) => authorSet.add(person)));
  const citeWeight = new Map();
  const incomingAuthors = new Map();
  corpus.citations.forEach((edge) => {
    if (!viewMark.has(edge.citing) || !viewMark.has(edge.cited)) return;
    const sources = authorsOn(edge.citing);
    const targets = authorsOn(edge.cited);
    sources.forEach((source) => {
      targets.forEach((target) => {
        if (source === target) return;
        const key = `${source}|${target}`;
        citeWeight.set(key, (citeWeight.get(key) || 0) + 1);
        incomingAuthors.set(target, (incomingAuthors.get(target) || 0) + 1);
      });
    });
  });
  const homeField = (person) => {
    const score = new Map();
    viewPapers.forEach((paperIndex) => {
      const cap = corpus.author[person][paperIndex];
      if (cap <= 0) return;
      const topic = papers[paperIndex].primary;
      score.set(topic, (score.get(topic) || 0) + cap);
    });
    let best = activeTopics[0] || topics[0] || "";
    let bestValue = -1;
    score.forEach((value, topic) => {
      if (value > bestValue) {
        bestValue = value;
        best = topic;
      }
    });
    return best;
  };
  const authorNetwork = {
    nodes: [...authorSet].map((person) => ({
      id: person,
      label: `Scholar ${person + 1}`,
      topic: homeField(person),
      citations: incomingAuthors.get(person) || 0,
      detail: `${incomingAuthors.get(person) || 0} citation${(incomingAuthors.get(person) || 0) === 1 ? "" : "s"} received`,
      retracted: false,
      selected: true,
    })),
    links: [...citeWeight.entries()].map(([key, weight]) => {
      const [source, target] = key.split("|").map(Number);
      return { source, target, weight };
    }),
  };

  const matrixBlocks = [
    { key: "author", label: "Authors", short: "Authors" },
    { key: "reviewer", label: "Peer reviewers", short: "Reviewers" },
    { key: "replicator", label: "Replicators", short: "Replicators" },
  ];
  const matrixScholars = [...subset]
    .sort((a, b) => a - b)
    .map((person) => ({ id: person, label: `Scholar ${person + 1}`, n: person + 1 }));
  const matrixPapers = [...viewPapers]
    .sort((a, b) => a - b)
    .map((paperIndex) => ({
      id: paperIndex,
      label: `Paper ${paperIndex + 1}`,
      n: paperIndex + 1,
      topic: papers[paperIndex].primary,
    }));
  const capitalMatrix = {
    scholars: matrixScholars,
    papers: matrixPapers,
    blocks: matrixBlocks,
    values: matrixPapers.map((paper) => matrixBlocks.flatMap((block) => matrixScholars.map((scholar) => (
      corpus[block.key][scholar.id][paper.id]
    )))),
  };
  const referenceWeight = new Map();
  corpus.citations.forEach((edge) => {
    if (!viewMark.has(edge.citing) || !viewMark.has(edge.cited)) return;
    referenceWeight.set(`${edge.citing}|${edge.cited}`, edge.weight);
  });
  const referencesMatrix = {
    papers: matrixPapers,
    values: matrixPapers.map((citing) => matrixPapers.map((cited) => (
      referenceWeight.get(`${citing.id}|${cited.id}`) || 0
    ))),
  };

  return {
    corpus: {
      num_manuscripts: viewPapers.length,
      num_contributors: subset.length,
      num_citations: citeInView.reduce((sum, count) => sum + count, 0),
      num_retractions: viewPapers.filter((i) => papers[i].retracted).length,
      topics,
      papers: viewPapers.map((i) => ({
        id: String(i),
        label: `Paper ${i + 1}`,
        topic: papers[i].primary,
        date: papers[i].date,
        citations: citeInView[i],
      })),
      contributors: (fieldActive ? [...scholarsInField] : [...Array(N).keys()]).map((index) => ({
        id: String(index),
        index,
        label: `Scholar ${index + 1}`,
        capital: totals[index],
        selected: subsetSet.has(index),
      })),
      settings: corpus.settings,
      selected_count: subset.length,
    },
    network: {
      nodes: viewPapers.map((i) => ({
        id: i,
        label: `Paper ${i + 1}`,
        topic: papers[i].primary,
        year: papers[i].year,
        citations: citeInView[i],
        retracted: papers[i].retracted,
        selected: true,
      })),
      links: corpus.citations
        .filter((edge) => viewMark.has(edge.citing) && viewMark.has(edge.cited))
        .map((edge) => ({ source: edge.citing, target: edge.cited, weight: 1 })),
    },
    authorNetwork,
    capitalMatrix,
    referencesMatrix,
    portfolio: {
      academic_capital: metric(academic),
      scholar_hhi: metric(scholar.hhi),
      scholar_gini: metric(scholar.gini),
      scholar_entropy: metric(scholar.entropy),
      share_splits_inequality: metric(shareIneq),
      portfolio_hhi: metric(paperConc.hhi),
      portfolio_gini: metric(paperConc.gini),
      portfolio_normalized_entropy: metric(paperConc.entropy),
      author_split: metric(academic > 0 ? authorCap / academic : 0),
      reviewer_split: metric(academic > 0 ? reviewerCap / academic : 0),
      replicator_split: metric(academic > 0 ? replicatorCap / academic : 0),
      author_retraction_loss: metric(authorCap > 0 ? retA / authorCap : 0, "pct"),
      reviewer_retraction_loss: metric(reviewerCap > 0 ? retR / reviewerCap : 0, "pct"),
      replicator_retraction_loss: metric(replicatorCap > 0 ? retP / replicatorCap : 0, "pct"),
      proportional_return: metric(propReturn),
      expected_proportional_returns: metric(meanRet),
      expected_returns: metric(meanAbsolute),
      returns_per_year: metric(paths.years.length > 1 ? propReturn / yearsSpan : 0),
      volatility: metric(vol),
      sharpe_ratio: metric(vol > 1e-12 ? meanRet / vol : 0),
      arc: metric(last > 1e-12 && returns.length ? returns[returns.length - 1] / last : 0),
      risk_asymmetry: metric(skew),
      diversification_ratio: metric(diversification),
      funding_efficiency: metric(view.funding > 0 ? academic / view.funding : 0),
      time_efficiency: metric(paths.years.length > 1 ? (last - first) / yearsSpan : 0),
      charts: {
        allocation_weights: {
          labels: weightPairs.map((row) => `Paper ${row.i + 1}`),
          values: weightPairs.map((row) => row.v / Math.max(academic, 1e-12)),
        },
        mix_role: { labels: ["Papers", "Peer reviews", "Replications"], values: mixRole },
        mix_tag: {
          labels: activeTopics,
          values: activeTopics.map((topic) => mixTag[topics.indexOf(topic)]),
        },
        capital_over_time: {
          labels: paths.years.map(String),
          values: capitalSeries,
        },
      },
    },
    market: {
      reviewer_fmp_mean: metric(average(fmpReviewer)),
      replicator_fmp_mean: metric(average(fmpReplicator)),
      reviewer_risk_premium: metric(average(premiumReviewer)),
      replicator_risk_premium: metric(average(premiumReplicator)),
      relative_performance: metric(relativePerformance),
      sensitivity: metric(sensitivity),
      risk_adjusted_excess_return: metric(excessReturn),
      risk_adjusted_relative_performance: metric(riskAdjustedRelative),
      impact_of_quality_control: metric(qualityImpact),
      charts: {
        fmp: { labels: activeTopics, reviewer: fmpReviewer, replicator: fmpReplicator },
      },
    },
    distribution: {
      share_splits_inequality: metric(shareIneq),
      hhi_discrepancy: metric(Math.abs(fieldIneq - shareIneq)),
      charts: {
        scholar_capital: {
          labels: sharePeople.map((_, i) => String(i + 1)),
          papers: sharePeople.map((person) => (shareGrand > 0 ? personTotalOn(corpus, person, paperSet, "author") / shareGrand : 0)),
          reviews: sharePeople.map((person) => (shareGrand > 0 ? personTotalOn(corpus, person, paperSet, "reviewer") / shareGrand : 0)),
          replications: sharePeople.map((person) => (shareGrand > 0 ? personTotalOn(corpus, person, paperSet, "replicator") / shareGrand : 0)),
        },
      },
    },
    traditional: {
      mean_citations: metric(topicCites.length ? topicCites.reduce((a, b) => a + b, 0) / topicCites.length : 0),
      max_citations: metric(topicCites.length ? Math.max(...topicCites) : 0),
      mean_h_index: metric(hVals.length ? hVals.reduce((a, b) => a + b, 0) / hVals.length : 0),
      mean_i10_index: metric(i10Vals.length ? i10Vals.reduce((a, b) => a + b, 0) / i10Vals.length : 0),
      mean_g_index: metric(gVals.length ? gVals.reduce((a, b) => a + b, 0) / gVals.length : 0),
      charts: { citation_hist: citeHist },
    },
    graph: {
      fiedler_value: metric(fiedler),
      connected_components: metric(componentCount),
      spanning_tree_ratio: metric(str),
      weighted_spanning_tree_ratio: metric(wstr),
      relative_spanning_tree_ratio: metric(str > 1e-12 ? wstr / str : 0),
    },
    health: {
      academic_capital_growth_rate: metric(growthRate),
      reviewer_fmp_total: metric(reviewerHistory.length ? reviewerHistory[reviewerHistory.length - 1] : 0),
      replicator_fmp_total: metric(replicatorHistory.length ? replicatorHistory[replicatorHistory.length - 1] : 0),
      reviewer_shrinkage_rate: metric(shrinkage(reviewerHistory)),
      replicator_shrinkage_rate: metric(shrinkage(replicatorHistory)),
      reviewer_fmp_volatility: metric(priceVolatility(reviewerHistory)),
      replicator_fmp_volatility: metric(priceVolatility(replicatorHistory)),
      leading_field_share: metric(leadingFieldShare),
    },
  };
}

export { generateCorpus, computeMetrics, shareParams };
