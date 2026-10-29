import { useEffect, useMemo, useRef, useState } from "react";
import ChartCanvas from "./ChartCanvas";
import { baseChart } from "../chartOptions";
import { fmt } from "../metrics";
import { seriesColor, themeColors } from "../theme";
import useThemeColors from "../useTheme";

function buildModel(network, compact) {
  const count = Math.max(network.nodes.length, 1);
  const nodes = network.nodes.map((node, i) => {
    const angle = (i / count) * Math.PI * 2;
    const ring = 90 + (i % 5) * 28;
    const cited = Math.sqrt(node.citations || 0);
    return {
      ...node,
      x: Math.cos(angle) * ring,
      y: Math.sin(angle) * ring,
      vx: 0,
      vy: 0,
      r: compact
        ? 1.5 + Math.min(3.2, cited * 0.42)
        : 5 + Math.min(11, cited * 2.4),
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const links = network.links
    .map((link) => ({
      source: byId.get(link.source),
      target: byId.get(link.target),
      weight: link.weight || 1,
    }))
    .filter((link) => link.source && link.target && link.source !== link.target);
  return { nodes, links };
}

function tick(model, forceScale = 1, speedLimit = Infinity) {
  const { nodes, links } = model;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let dist2 = dx * dx + dy * dy;
      if (dist2 < 0.01) {
        dx = 0.5;
        dy = 0;
        dist2 = 0.25;
      }
      const dist = Math.sqrt(dist2);
      const force = Math.min(1400 / dist2, 12) * forceScale;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }
  links.forEach((link) => {
    const dx = link.target.x - link.source.x;
    const dy = link.target.y - link.source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const force = (dist - 120) * 0.008 * forceScale;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    link.source.vx += fx;
    link.source.vy += fy;
    link.target.vx -= fx;
    link.target.vy -= fy;
  });
  nodes.forEach((node) => {
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      return;
    }
    node.vx += -node.x * 0.004 * forceScale;
    node.vy += -node.y * 0.004 * forceScale;
    node.vx *= 0.78;
    node.vy *= 0.78;
    const speed = Math.hypot(node.vx, node.vy);
    if (speed > speedLimit) {
      node.vx *= speedLimit / speed;
      node.vy *= speedLimit / speed;
    }
    node.x += node.vx;
    node.y += node.vy;
  });
}

function frameOf(model, width, height) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  model.nodes.forEach((node) => {
    minX = Math.min(minX, node.x - node.r - 10);
    minY = Math.min(minY, node.y - node.r - 10);
    maxX = Math.max(maxX, node.x + node.r + 10);
    maxY = Math.max(maxY, node.y + node.r + 10);
  });
  if (!Number.isFinite(minX)) return { fit: 1, originX: 0, originY: 0 };
  const fit = Math.min(
    (width * 0.9) / Math.max(48, maxX - minX),
    (height * 0.86) / Math.max(48, maxY - minY),
  );
  return { fit, originX: (minX + maxX) / 2, originY: (minY + maxY) / 2 };
}

function applyFrame(view, model, width, height) {
  if (view.userMoved) return;
  const frame = frameOf(model, width, height);
  view.fit = frame.fit;
  view.originX = frame.originX;
  view.originY = frame.originY;
}

function clampAxis(value, lo, hi) {
  if (lo > hi) return (lo + hi) / 2;
  return Math.min(hi, Math.max(lo, value));
}

function clampPan(view, model, width, height) {
  if (!view.userMoved || !model.nodes.length) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  model.nodes.forEach((node) => {
    minX = Math.min(minX, node.x - node.r);
    minY = Math.min(minY, node.y - node.r);
    maxX = Math.max(maxX, node.x + node.r);
    maxY = Math.max(maxY, node.y + node.r);
  });
  const scale = (view.fit || 1) * view.zoom;
  const originX = view.originX || 0;
  const originY = view.originY || 0;
  const boxW = (maxX - minX) * scale;
  const boxH = (maxY - minY) * scale;
  const pad = 24;
  const keep = 80;
  const limits = (span, box, min, max, origin) => {
    if (box <= span) {
      return [
        pad - span / 2 - (min - origin) * scale,
        span - pad - span / 2 - (max - origin) * scale,
      ];
    }
    return [
      keep - span / 2 - (max - origin) * scale,
      span - keep - span / 2 - (min - origin) * scale,
    ];
  };
  const [loX, hiX] = limits(width, boxW, minX, maxX, originX);
  const [loY, hiY] = limits(height, boxH, minY, maxY, originY);
  view.panX = clampAxis(view.panX, loX, hiX);
  view.panY = clampAxis(view.panY, loY, hiY);
}

function citerIds(model, focus) {
  const ids = new Set();
  if (!focus) return ids;
  model.links.forEach((link) => {
    if (link.target.id === focus.id && link.source.id !== focus.id) ids.add(link.source.id);
  });
  return ids;
}

function ring(ctx, node, pad, width, color) {
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(node.x, node.y, node.r + pad, 0, Math.PI * 2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function profileOf(node) {
  return {
    id: node.id,
    label: node.label,
    topic: node.topic,
    papers: node.papers || [],
    metrics: node.metrics || {
      academicCapital: 0,
      citations: node.citations || 0,
      papers: 0,
      hIndex: 0,
    },
  };
}

function draw(ctx, model, view, hoverId, selectedId, topics, width, height, compact, colors, sameFieldCite) {
  applyFrame(view, model, width, height);
  clampPan(view, model, width, height);
  const dpr = window.devicePixelRatio || 1;
  const scale = (view.fit || 1) * view.zoom;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2 + view.panX, height / 2 + view.panY);
  ctx.scale(scale, scale);
  ctx.translate(-(view.originX || 0), -(view.originY || 0));

  const focus = hoverId == null ? null : model.nodes.find((node) => node.id === hoverId);
  const citers = sameFieldCite && focus ? citerIds(model, focus) : null;
  const dimOthers = !citers && model.nodes.some((node) => !node.selected);
  const ringPad = compact ? 1.8 : 3.4;
  const ringWidth = compact ? 0.9 : 1.5;

  model.links.forEach((link) => {
    const hot = citers
      ? link.target.id === focus.id && citers.has(link.source.id)
      : Boolean(focus && (link.source.id === focus.id || link.target.id === focus.id));
    const faded = citers
      ? !hot
      : dimOthers && !link.source.selected && !link.target.selected;
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = hot ? colors.ink : colors.track;
    ctx.globalAlpha = hot ? 0.9 : faded ? (citers ? 0.07 : 0.18) : 0.55;
    ctx.lineWidth = compact
      ? (hot ? 0.7 : 0.2) + Math.min(0.9, Math.sqrt(link.weight || 1) * 0.16)
      : (hot ? 1.35 : 0.45) + Math.min(3.2, Math.sqrt(link.weight || 1) * 0.7);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  model.nodes.forEach((node) => {
    const lit = !citers || node.id === focus.id || citers.has(node.id);
    const faded = citers ? !lit : dimOthers && !node.selected && node.id !== hoverId;
    ctx.globalAlpha = faded ? 0.14 : 1;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    if (node.retracted) {
      ctx.fillStyle = colors.sheet;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = seriesColor(node.topic, topics, colors);
      ctx.setLineDash([2.5, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = seriesColor(node.topic, topics, colors);
      ctx.fill();
    }
    if (citers && citers.has(node.id)) ring(ctx, node, ringPad, ringWidth, colors.ink);
    if (node.id === hoverId) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = compact ? 1.5 : 2;
      ctx.strokeStyle = colors.ink;
      ctx.stroke();
    } else if (node.id === selectedId) {
      const pad = citers && citers.has(node.id) ? ringPad + (compact ? 1.7 : 2.8) : ringPad;
      ring(ctx, node, pad, ringWidth, colors.brand);
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function toWorld(view, width, height, px, py) {
  const scale = (view.fit || 1) * view.zoom;
  return {
    x: (px - width / 2 - view.panX) / scale + (view.originX || 0),
    y: (py - height / 2 - view.panY) / scale + (view.originY || 0),
  };
}

function hitNode(model, view, width, height, px, py) {
  const { x, y } = toWorld(view, width, height, px, py);
  for (let i = model.nodes.length - 1; i >= 0; i--) {
    const node = model.nodes[i];
    const dx = x - node.x;
    const dy = y - node.y;
    if (dx * dx + dy * dy <= (node.r + 3) * (node.r + 3)) return node;
  }
  return null;
}

export default function CitationNetwork({
  network,
  topics,
  title = "Citation network",
  nodeNoun = "papers",
  linkNoun = "links",
  showRetracted = true,
  compact = false,
  sameFieldCite = false,
}) {
  const canvasRef = useRef(null);
  const closeRef = useRef(null);
  const viewRef = useRef({ panX: 0, panY: 0, zoom: 1 });
  const dragRef = useRef(null);
  const hoverRef = useRef(null);
  const selectedRef = useRef(null);
  const paintRef = useRef(() => {});
  const [tip, setTip] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [panel, setPanel] = useState(null);
  const colors = useThemeColors();
  const citeConfig = useMemo(() => {
    const rows = panel?.papers || [];
    if (!rows.length) return null;
    return baseChart(
      "bar",
      rows.map((paper) => paper.short || paper.label),
      [{
        label: "Citations",
        data: rows.map((paper) => paper.citations),
        backgroundColor: colors.author,
        borderWidth: 0,
        maxBarThickness: 16,
      }],
      colors,
      { plugins: { legend: { display: false } } },
    );
  }, [panel, colors]);

  const presentTopics = topics.filter((topic) => network?.nodes.some((node) => node.topic === topic));

  useEffect(() => {
    selectedRef.current = panel?.id ?? null;
    paintRef.current();
  }, [panel]);

  useEffect(() => {
    if (!panel) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  useEffect(() => {
    if (!network || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const model = buildModel(network, compact);
    viewRef.current = { panX: 0, panY: 0, zoom: 1, fit: 1, originX: 0, originY: 0, userMoved: false };
    hoverRef.current = null;
    selectedRef.current = null;
    setTip(null);
    setPanel(null);

    let raf = 0;
    let alive = true;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      return rect;
    };

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      draw(
        ctx,
        model,
        viewRef.current,
        hoverRef.current,
        selectedRef.current,
        topics,
        rect.width,
        rect.height,
        compact,
        themeColors(),
        sameFieldCite,
      );
    };
    paintRef.current = paint;

    const settle = (steps) => {
      let left = steps;
      const run = () => {
        if (!alive || left <= 0) return;
        const progress = (steps - left) / Math.max(steps - 1, 1);
        const forceScale = 0.32 * (1 - progress) ** 2;
        tick(model, forceScale, 1.15);
        paint();
        left -= 1;
        raf = requestAnimationFrame(run);
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    };

    size();
    for (let i = 0; i < 190; i++) tick(model);
    model.nodes.forEach((node) => {
      node.vx *= 0.18;
      node.vy *= 0.18;
    });
    paint();
    settle(58);

    const resize = () => {
      size();
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const point = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
    };

    const onDown = (event) => {
      const { x, y, rect } = point(event);
      const node = hitNode(model, viewRef.current, rect.width, rect.height, x, y);
      if (node) {
        node.pinned = true;
        dragRef.current = { kind: "node", id: node.id, x, y, originX: node.x, originY: node.y, moved: false };
      } else {
        dragRef.current = {
          kind: "pan",
          x,
          y,
          panX: viewRef.current.panX,
          panY: viewRef.current.panY,
          moved: false,
        };
      }
      canvas.setPointerCapture(event.pointerId);
    };

    const onMove = (event) => {
      const { x, y, rect } = point(event);
      const drag = dragRef.current;
      if (!drag) {
        const node = hitNode(model, viewRef.current, rect.width, rect.height, x, y);
        const next = node ? node.id : null;
        if (hoverRef.current !== next) {
          hoverRef.current = next;
          paint();
          const citers = sameFieldCite && node ? citerIds(model, node).size : null;
          setTip(node ? {
            x: x + 14,
            y: y + 14,
            label: node.label,
            topic: node.topic,
            year: node.year,
            citations: node.citations,
            retracted: node.retracted,
            detail: node.detail,
            citers,
          } : null);
        } else if (node) {
          setTip((current) => (current ? { ...current, x: x + 14, y: y + 14 } : current));
        }
        return;
      }
      if (!drag.moved) {
        if (Math.hypot(x - drag.x, y - drag.y) <= 4) return;
        drag.moved = true;
        viewRef.current.userMoved = true;
        setDragging(true);
      }
      if (drag.kind === "pan") {
        viewRef.current.panX = drag.panX + (x - drag.x);
        viewRef.current.panY = drag.panY + (y - drag.y);
        paint();
        return;
      }
      const node = model.nodes.find((item) => item.id === drag.id);
      if (!node) return;
      const zoom = (viewRef.current.fit || 1) * viewRef.current.zoom;
      node.x = drag.originX + (x - drag.x) / zoom;
      node.y = drag.originY + (y - drag.y) / zoom;
      node.vx = 0;
      node.vy = 0;
      paint();
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (drag?.kind === "node") {
        const node = model.nodes.find((item) => item.id === drag.id);
        if (node) node.pinned = false;
        if (sameFieldCite && node && !drag.moved) {
          selectedRef.current = node.id;
          setPanel(profileOf(node));
          paint();
        } else {
          settle(46);
        }
      } else if (sameFieldCite && drag?.kind === "pan" && !drag.moved) {
        selectedRef.current = null;
        setPanel(null);
        paint();
      }
      dragRef.current = null;
      setDragging(false);
    };

    const onLeave = () => {
      if (dragRef.current) return;
      hoverRef.current = null;
      setTip(null);
      paint();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    const onTheme = () => paint();
    window.addEventListener("liberata-theme", onTheme);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("liberata-theme", onTheme);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [network, topics, compact, sameFieldCite]);

  if (!network) return null;
  const papers = network.nodes.length;
  const links = network.links.length;
  const retractedVisible = showRetracted && network.nodes.some((node) => node.retracted);

  return (
    <figure className="figure network">
      <figcaption>
        <span className="fig-title">{title}</span>
        <span className="fig-note">{papers} {nodeNoun} · {links} {linkNoun}</span>
      </figcaption>
      <ul className="network-legend">
        {presentTopics.map((topic) => (
          <li key={topic}>
            <span className="network-swatch" style={{ background: seriesColor(topic, topics, colors) }} />
            {topic}
          </li>
        ))}
        {retractedVisible ? (
          <li>
            <span className="network-swatch network-swatch-open" />
            Retracted
          </li>
        ) : null}
      </ul>
      {sameFieldCite ? (
        <p className="network-note">Highlighted scholars cite the one under your pointer, from any field. Scholars who do not cite them stay dim.</p>
      ) : null}
      <div className="network-stage">
        <canvas
          ref={canvasRef}
          className={[dragging ? "is-dragging" : "", sameFieldCite && tip && !dragging ? "is-pointing" : ""].filter(Boolean).join(" ") || undefined}
          role="img"
          aria-label={`${title}. ${papers} ${nodeNoun} and ${links} ${linkNoun}. Drag a node or the background.${sameFieldCite ? " Click a scholar for details. Hover to highlight scholars who cite them. Other scholars stay dim." : ""}`}
        />
        {tip ? (
          <div className="network-tip" style={{ left: tip.x, top: tip.y }}>
            <strong>{tip.label}</strong>
            {tip.topic}{tip.year != null ? ` · ${tip.year}` : ""}
            <br />
            {tip.detail || `${tip.citations} citation${tip.citations === 1 ? "" : "s"}`}
            {tip.citers != null ? (
              <>
                <br />
                {tip.citers === 1 ? "1 scholar cites them" : `${tip.citers} scholars cite them`}
              </>
            ) : null}
            {tip.retracted ? <><br />Retracted</> : null}
          </div>
        ) : null}
        {panel ? (
          <aside className="scholar-panel" role="dialog" aria-labelledby="scholar-panel-title">
            <header>
              <h3 id="scholar-panel-title">{panel.label}</h3>
              <button ref={closeRef} type="button" className="panel-close" aria-label="Close scholar details" onClick={() => setPanel(null)}>
                ×
              </button>
            </header>
            <p className="scholar-field">
              <span>Field</span>
              {panel.topic || "—"}
            </p>
            <dl className="scholar-metrics">
              <div>
                <dt>Academic capital</dt>
                <dd>{fmt(panel.metrics.academicCapital)}</dd>
              </div>
              <div>
                <dt>Citations received</dt>
                <dd>{fmt(panel.metrics.citations)}</dd>
              </div>
              <div>
                <dt>Papers</dt>
                <dd>{fmt(panel.metrics.papers)}</dd>
              </div>
              <div>
                <dt>h-index</dt>
                <dd>{fmt(panel.metrics.hIndex)}</dd>
              </div>
            </dl>
            <div className="scholar-cite">
              <h4>Citation distribution</h4>
              {citeConfig ? (
                <div className="scholar-cite-chart">
                  <ChartCanvas config={citeConfig} />
                </div>
              ) : (
                <p className="ac-note">No authored papers in this view.</p>
              )}
            </div>
            <div className="scholar-papers">
              <h4>Papers</h4>
              {panel.papers.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Paper</th>
                      <th className="num" title="Academic capital">AC</th>
                      <th className="num">Citations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panel.papers.map((paper) => (
                      <tr key={paper.id}>
                        <td>{paper.label}</td>
                        <td className="num">{fmt(paper.ac)}</td>
                        <td className="num">{fmt(paper.citations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="ac-note">No authored papers in this view.</p>
              )}
              <p className="ac-note">AC is this scholar’s academic capital on that paper.</p>
            </div>
          </aside>
        ) : null}
      </div>
    </figure>
  );
}
