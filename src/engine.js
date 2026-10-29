/** Browser-side demo of the explorer metrics. Not the Python library. */
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

/** OpenAlex sample, articles 2013–2022. Sliders scale these profiles; 1× leaves them as measured. */
const FIELD_PROFILES = [
  {
    name: "Mathematics",
    meanCitations: 4.2,
    gini: 0.44107142857142756,
    homophily: 0.6764705882352942,
    meanReferences: 25.214285714285715,
    meanTeam: 2.12,
    retractionRate: 0.0004658295299512325,
    lag: [0, 18.36, 11.36, 15.36, 11.36, 16.36, 8.36, 5.36, 4.36, 0.36, 1.36, 1.36, 1.36, 0.36, 0.36, 0.36],
  },
  {
    name: "Computer Science",
    meanCitations: 10.28,
    gini: 0.5994649805447464,
    homophily: 0.4015748031496063,
    meanReferences: 27.875,
    meanTeam: 3.48,
    retractionRate: 0.0023339790277129664,
    lag: [0, 62.22, 42.22, 31.22, 27.22, 30.22, 15.22, 8.22, 7.22, 6.22, 5.22, 2.22, 1.22, 1.22, 1.22, 1.22],
  },
  {
    name: "Medicine",
    meanCitations: 7.48,
    gini: 0.5275019098548512,
    homophily: 0.855072463768116,
    meanReferences: 27.76923076923077,
    meanTeam: 4.92,
    retractionRate: 0.0010906326092251495,
    lag: [0, 11.66, 24.66, 19.66, 33.66, 23.66, 23.66, 15.66, 16.66, 10.66, 4.66, 5.66, 0.66, 0.66, 0.66, 0.66],
  },
  {
    name: "Economics, Econometrics and Finance",
    meanCitations: 12.56,
    gini: 0.7206551410373061,
    homophily: 0.5245901639344263,
    meanReferences: 34.4,
    meanTeam: 2.16,
    retractionRate: 0.0004205185284904773,
    lag: [0, 35.7, 24.7, 35.7, 22.7, 11.7, 14.7, 7.7, 6.7, 15.7, 4.7, 4.7, 1.7, 0.7, 0.7, 0.7],
  },
];

const DEFAULT_MANUSCRIPTS = 40;
const DEFAULT_CONTRIBUTORS = 58;

export const CORPUS_DEFAULTS = {
  numManuscripts: DEFAULT_MANUSCRIPTS,
  numContributors: DEFAULT_CONTRIBUTORS,
  citationDensity: 1,
  retractionRate: 1,
  creditInequality: 80,
  seed: 105,
};

function apportion(total, weights) {
  const n = weights.length;
  const safe = Math.max(total, n);
  const sum = weights.reduce((acc, weight) => acc + weight, 0) || 1;
  const raw = weights.map((weight) => (safe * weight) / sum);
  const counts = raw.map((value) => Math.max(1, Math.floor(value)));
  let used = counts.reduce((acc, value) => acc + value, 0);
  if (used > safe) {
    while (used > safe) {
      let maxIndex = 0;
      for (let index = 1; index < counts.length; index++) {
        if (counts[index] > counts[maxIndex]) maxIndex = index;
      }
      if (counts[maxIndex] <= 1) break;
      counts[maxIndex] -= 1;
      used -= 1;
    }
  } else {
    const order = raw
      .map((value, index) => ({ index, frac: value - Math.floor(value) }))
      .sort((a, b) => b.frac - a.frac);
    let cursor = 0;
    while (used < safe) {
      counts[order[cursor % order.length].index] += 1;
      used += 1;
      cursor += 1;
    }
  }
  return counts;
}

function generateCorpus(settings) {
  const M = clip(Math.round(settings.numManuscripts), 12, 100);
  const N = clip(Math.round(settings.numContributors), 16, 180);
  const density = clip(Number(settings.citationDensity), 0.25, 2.5);
  const retractionScale = Math.max(0, Number(settings.retractionScale) || 0);
  const seed = settings.seed || 105;
  const rng = mulberry32(seed);
  const { sharesDist, paretoAlpha } = settings;
  const peopleScale = N / DEFAULT_CONTRIBUTORS;

  const paperCounts = apportion(M, FIELD_PROFILES.map(() => 1));
  const poolCounts = apportion(N, FIELD_PROFILES.map((field) => field.meanTeam));
  const topics = FIELD_PROFILES.map((field) => field.name);
  const profiles = {};
  FIELD_PROFILES.forEach((field) => {
    profiles[field.name] = field;
  });

  let personCursor = 0;
  const pools = poolCounts.map((size) => {
    const people = [];
    for (let index = 0; index < size; index++) people.push(personCursor + index);
    personCursor += size;
    return people;
  });

  const papers = [];
  FIELD_PROFILES.forEach((field, fieldIndex) => {
    const count = paperCounts[fieldIndex];
    const pool = pools[fieldIndex];
    const teamMean = Math.max(1, field.meanTeam * peopleScale);
    const teamStd = 0.35;
    for (let k = 0; k < count; k++) {
      const year = 2013 + Math.round((k / Math.max(count - 1, 1)) * 9);
      const month = randint(rng, 1, 12);
      let nOn = Math.round(normal(rng, teamMean, teamStd));
      nOn = clip(nOn, 1, pool.length);
      const people = choice(rng, pool, nOn);
      papers.push({
        index: papers.length,
        year,
        date: `${year}-${String(month).padStart(2, "0")}-01`,
        primary: field.name,
        topics: [field.name],
        retracted: rng() < Math.min(0.5, field.retractionRate * retractionScale),
        people,
      });
    }
  });
  papers.sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index);
  papers.forEach((paper, index) => { paper.index = index; });

  const generated = closedCitations(papers, profiles, rng, density);
  const citations = generated.citations;
  const citeCount = generated.citeCount;
  const incoming = citeCount.slice();
  weightCitations(citations);
  const received = receivedCapital(citations, M);
  const shares = papers.map((paper) => (
    paper.people.length ? shareRow(rng, paper.people, sharesDist, paretoAlpha) : []
  ));

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
    shares[i].forEach(({ person, share, role }) => {
      addCap(person, i, role, share * received[i], papers[i].retracted);
    });
  }

  function personTotal(person) {
    let total = 0;
    for (let i = 0; i < M; i++) total += author[person][i] + reviewer[person][i] + replicator[person][i];
    return total;
  }

  if (sharesDist === "uniform") {
    const totals = [...Array(N).keys()].map(personTotal);
    const grand = totals.reduce((acc, value) => acc + value, 0);
    const evenTarget = N ? grand / N : 0;
    for (let person = 0; person < N; person++) {
      if (totals[person] > 1e-15) {
        const scale = evenTarget / totals[person];
        for (let i = 0; i < M; i++) {
          author[person][i] *= scale;
          reviewer[person][i] *= scale;
          replicator[person][i] *= scale;
          retAuthor[person][i] *= scale;
          retReviewer[person][i] *= scale;
          retReplicator[person][i] *= scale;
        }
      } else if (evenTarget > 0) {
        const even = evenTarget / M;
        for (let i = 0; i < M; i++) author[person][i] += even;
      }
    }
  }

  const citationMass = citationMassFromEdges(citations, M);
  papers.forEach((paper) => { delete paper.people; });

  return {
    M, N, papers, topics, shares, incoming, citeCount, nCitations: citations.length, citationMass, citations,
    author, reviewer, replicator, retAuthor, retReviewer, retReplicator,
    settings: {
      num_manuscripts: M,
      num_contributors: N,
      citation_density: density,
      shares_dist: sharesDist,
      pareto_alpha: paretoAlpha,
      seed,
      retraction_rate: retractionScale,
    },
  };
}

function shareRow(rng, people, sharesDist, paretoAlpha) {
  const nOn = people.length;
  let raw;
  if (sharesDist === "uniform") {
    raw = people.map(() => 1 / nOn);
  } else if (sharesDist === "dirichlet") {
    raw = people.map(() => -Math.log(Math.max(rng(), 1e-12)));
    const total = raw.reduce((sum, value) => sum + value, 0);
    raw = raw.map((value) => value / total);
  } else {
    raw = people.map(() => (Math.pow(Math.max(rng(), 1e-12), -1 / paretoAlpha) - 1) + 1e-12);
    const total = raw.reduce((sum, value) => sum + value, 0);
    raw = raw.map((value) => value / total);
  }
  const order = raw.map((value, index) => index).sort((a, b) => raw[b] - raw[a]);
  const roles = new Array(nOn).fill("author");
  if (nOn >= 2) roles[order[nOn - 1]] = "reviewer";
  if (nOn >= 3) roles[order[nOn - 2]] = "reviewer";
  if (nOn >= 4) roles[order[nOn - 3]] = "replicator";
  if (nOn >= 5) roles[order[nOn - 4]] = "replicator";
  return people.map((person, index) => ({ person, share: raw[index], role: roles[index] }));
}

function poisson(rng, lambda) {
  if (lambda <= 0) return 0;
  const limit = Math.exp(-lambda);
  let count = 0;
  let product = 1;
  do {
    count += 1;
    product *= rng();
  } while (product > limit && count < 40);
  return count - 1;
}

function weightedSample(rng, weights, k) {
  const ranked = [];
  weights.forEach((weight, index) => {
    if (weight > 0) ranked.push({ index, key: rng() ** (1 / weight) });
  });
  ranked.sort((a, b) => b.key - a.key);
  return ranked.slice(0, k).map((row) => row.index);
}

/** Citations stay inside the corpus. Outgoing rates follow reference-list length.
 *  Incoming rates, homophily, inequality, and timing follow each field's OpenAlex profile.
 */
function closedCitations(papers, fields, rng, density = 1) {
  const list = Object.values(fields || {});
  const averageOf = (key) => {
    const values = list.map((field) => field[key] || 0).filter((value) => value > 0);
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1) || 1;
  };
  const citeAverage = averageOf("meanCitations");
  const referenceAverage = averageOf("meanReferences");
  const target = 5 * (Number.isFinite(density) ? density : 1);
  const citeCount = new Array(papers.length).fill(0);
  const citations = [];
  const order = papers
    .map((_, index) => index)
    .sort((a, b) => papers[a].date.localeCompare(papers[b].date) || a - b);

  order.forEach((citing) => {
    const profile = fields?.[papers[citing].primary];
    const earlier = order.filter((index) => papers[index].year < papers[citing].year);
    if (!profile || !earlier.length) return;
    const rate = target * (profile.meanReferences || referenceAverage) / referenceAverage;
    const k = Math.min(poisson(rng, rate), earlier.length, 10);
    const homophily = Math.min(0.92, Math.max(0.2, profile.homophily || 0.5));
    const chosen = new Set();
    let guard = 0;
    while (chosen.size < k && guard < k * 12) {
      guard += 1;
      const stay = rng() < homophily;
      let pool = earlier
        .map((index, local) => ({ index, local }))
        .filter((row) => !chosen.has(row.local) && ((papers[row.index].primary === papers[citing].primary) === stay));
      if (!pool.length) {
        if (stay) continue;
        pool = earlier
          .map((index, local) => ({ index, local }))
          .filter((row) => !chosen.has(row.local));
      }
      const weights = pool.map((row) => {
        const field = fields?.[papers[row.index].primary] || {};
        const alpha = Math.min(1.7, 0.6 + 1.2 * (field.gini || 0.5));
        const attract = ((field.meanCitations || citeAverage) / citeAverage) ** 2;
        const gap = papers[citing].year - papers[row.index].year;
        const lag = field.lag || [];
        const lagWeight = lag[Math.min(gap, Math.max(lag.length - 1, 0))] || 1;
        return (citeCount[row.index] + 1) ** alpha * attract * lagWeight;
      });
      const picked = weightedSample(rng, weights, 1)[0];
      if (picked == null) break;
      chosen.add(pool[picked].local);
      citeCount[pool[picked].index] += 1;
      citations.push({ citing, cited: pool[picked].index, year: papers[citing].year, weight: 1 });
    }
  });
  return { citations, citeCount };
}

/** Each citing paper contributes 1, split equally across the papers it cites. */
function weightCitations(citations) {
  const outgoing = new Map();
  citations.forEach((edge) => {
    outgoing.set(edge.citing, (outgoing.get(edge.citing) || 0) + 1);
  });
  citations.forEach((edge) => {
    edge.weight = 1 / outgoing.get(edge.citing);
  });
}

function receivedCapital(citations, paperCount) {
  const received = new Array(paperCount).fill(0);
  citations.forEach((edge) => { received[edge.cited] += edge.weight; });
  return received;
}

function citationMassFromEdges(citations, paperCount) {
  const byPaper = Array.from({ length: paperCount }, () => new Map());
  citations.forEach(({ cited, year, weight }) => {
    byPaper[cited].set(year, (byPaper[cited].get(year) || 0) + weight);
  });
  return byPaper.map((map) => {
    const rows = [...map.entries()].sort((a, b) => a[0] - b[0]);
    const total = rows.reduce((sum, [, weight]) => sum + weight, 0);
    let cum = 0;
    return rows.map(([year, weight]) => {
      cum += weight;
      return { year, cum, total };
    });
  });
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
  if (corpus.useGlobalCitations) {
    papers.forEach((paper, index) => {
      citeInView[index] = paper.citedByCount || 0;
    });
  } else {
    corpus.citations.forEach((edge) => {
      if (viewMark.has(edge.citing) && viewMark.has(edge.cited)) citeInView[edge.cited] += 1;
    });
  }
  const wrotePaper = (share) => corpus.everyoneAuthored || share.role === "author";
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
      corpus.shares[paperIndex].some((share) => wrotePaper(share) && subsetSet.has(share.person))
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
      if (row.some((s) => s.person === p && wrotePaper(s))) cites.push(citeInView[i]);
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
    .filter((share) => wrotePaper(share) && subsetSet.has(share.person))
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
      const cap = corpus.author[person][paperIndex]
        + corpus.reviewer[person][paperIndex]
        + corpus.replicator[person][paperIndex];
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
  const scholarProfile = (person) => {
    const papersOut = [];
    viewPapers.forEach((paperIndex) => {
      const authored = corpus.shares[paperIndex].some((row) => row.person === person && wrotePaper(row));
      if (!authored) return;
      papersOut.push({
        id: paperIndex,
        label: papers[paperIndex].label || `Paper ${paperIndex + 1}`,
        short: papers[paperIndex].short || papers[paperIndex].label || `Paper ${paperIndex + 1}`,
        year: papers[paperIndex].year,
        ac: corpus.author[person][paperIndex],
        citations: citeInView[paperIndex],
      });
    });
    papersOut.sort((a, b) => b.citations - a.citations || b.ac - a.ac || a.id - b.id);
    return {
      papers: papersOut,
      metrics: {
        academicCapital: papersOut.reduce((sum, paper) => sum + paper.ac, 0),
        citations: incomingAuthors.get(person) || 0,
        papers: papersOut.length,
        hIndex: hIndex(papersOut.map((paper) => paper.citations)),
      },
    };
  };
  const authorNetwork = {
    nodes: [...authorSet].map((person) => {
      const received = incomingAuthors.get(person) || 0;
      const profile = scholarProfile(person);
      return {
        id: person,
        label: corpus.names?.[person] || `Scholar ${person + 1}`,
        topic: homeField(person),
        citations: received,
        detail: `${received} citation${received === 1 ? "" : "s"} received`,
        papers: profile.papers,
        metrics: profile.metrics,
        retracted: false,
        selected: true,
      };
    }),
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
    .map((person) => ({ id: person, label: corpus.names?.[person] || `Scholar ${person + 1}`, n: person + 1 }));
  const matrixPapers = [...viewPapers]
    .sort((a, b) => a - b)
    .map((paperIndex) => ({
      id: paperIndex,
      label: papers[paperIndex].label || `Paper ${paperIndex + 1}`,
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
      num_citations: viewPapers.reduce((sum, index) => sum + citeInView[index], 0),
      num_retractions: viewPapers.filter((i) => papers[i].retracted).length,
      topics,
      papers: viewPapers.map((i) => ({
        id: String(i),
        label: papers[i].label || `Paper ${i + 1}`,
        topic: papers[i].primary,
        date: papers[i].date,
        citations: citeInView[i],
      })),
      contributors: (fieldActive ? [...scholarsInField] : [...Array(N).keys()]).map((index) => ({
        id: String(index),
        index,
        label: corpus.names?.[index] || `Scholar ${index + 1}`,
        capital: totals[index],
        selected: subsetSet.has(index),
      })),
      settings: corpus.settings,
      selected_count: subset.length,
    },
    network: {
      nodes: viewPapers.map((i) => ({
        id: i,
        label: papers[i].short || papers[i].label || `Paper ${i + 1}`,
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
          labels: weightPairs.map((row) => papers[row.i].short || papers[row.i].label || `Paper ${row.i + 1}`),
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
