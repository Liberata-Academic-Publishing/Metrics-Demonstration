import { useEffect, useRef, useState } from "react";
import { fmt } from "../metrics";
import { AXIS_LEFT, AXIS_TOP, blockAt, drawBlockedAxes } from "../matrixFrame";
import { rgb, seriesColor, themeColors } from "../theme";
import useThemeColors from "../useTheme";

export default function CapitalMatrix({ matrix, topics = [] }) {
  const sheetRef = useRef(null);
  const canvasRef = useRef(null);
  const layoutRef = useRef({ cellW: 1, cellH: 1 });
  const [tip, setTip] = useState(null);
  const colors = useThemeColors();
  const scholars = matrix?.scholars || [];
  const papers = matrix?.papers || [];
  const blocks = matrix?.blocks || [];
  const values = matrix?.values || [];
  const fields = [];
  papers.forEach((paper) => {
    if (paper.topic && !fields.includes(paper.topic)) fields.push(paper.topic);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !sheet || !scholars.length || !papers.length || !blocks.length) return undefined;

    const paint = () => {
      const rect = sheet.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const theme = themeColors();
      ctx.fillStyle = theme.sheet;
      ctx.fillRect(0, 0, width, height);

      const cols = scholars.length * blocks.length;
      const plotW = Math.max(1, width - AXIS_LEFT - 10);
      const plotH = Math.max(1, height - AXIS_TOP - 10);
      const cellW = plotW / cols;
      const cellH = plotH / papers.length;
      layoutRef.current = { cellW, cellH };
      const insetX = cellW >= 8 ? 0.5 : 0;
      const insetY = cellH >= 8 ? 0.5 : 0;

      let max = 0;
      values.forEach((row) => row.forEach((value) => {
        if (value > max) max = value;
      }));

      values.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const amount = max > 0 ? value / max : 0;
          if (amount <= 0) ctx.fillStyle = theme.empty;
          else {
            const [red, green, blue] = rgb(seriesColor(papers[rowIndex].topic, topics, theme));
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.2 + amount * 0.8})`;
          }
          ctx.fillRect(
            AXIS_LEFT + colIndex * cellW + insetX,
            AXIS_TOP + rowIndex * cellH + insetY,
            Math.max(0.5, cellW - insetX * 2),
            Math.max(0.5, cellH - insetY * 2),
          );
        });
      });

      drawBlockedAxes(ctx, {
        plotW,
        plotH,
        papers,
        scholars,
        blocks,
        cellW,
        cellH,
        colors: theme,
      });
    };

    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(sheet);
    const onTheme = () => paint();
    window.addEventListener("liberata-theme", onTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener("liberata-theme", onTheme);
    };
  }, [scholars, papers, values, blocks, topics]);

  const onMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { cellW, cellH } = layoutRef.current;
    if (!cellW || !cellH) {
      setTip(null);
      return;
    }
    const col = Math.floor((event.clientX - rect.left - AXIS_LEFT) / cellW);
    const row = Math.floor((event.clientY - rect.top - AXIS_TOP) / cellH);
    const cols = scholars.length * blocks.length;
    if (row < 0 || col < 0 || row >= papers.length || col >= cols) {
      setTip(null);
      return;
    }
    const place = blockAt(col, scholars.length);
    setTip({
      x: event.clientX - rect.left + 14,
      y: event.clientY - rect.top + 14,
      scholar: scholars[place.index].label,
      paper: papers[row].label,
      topic: papers[row].topic,
      role: blocks[place.block].label,
      value: values[row][col],
    });
  };

  if (!scholars.length || !papers.length) return null;

  return (
    <figure className="figure matrix">
      <figcaption>
        <span className="fig-title">Capital matrix</span>
        <span className="fig-note">{papers.length} papers · {scholars.length} scholars</span>
      </figcaption>
      <p className="matrix-lead">Each row is a paper. The columns are the same scholars three times, in scholar order: authors, then peer reviewers, then replicators. A cell is that scholar’s capital on that paper in that role. Color is the paper’s field, and a stronger cell means more capital.</p>
      <ul className="network-legend">
        {fields.map((topic) => (
          <li key={topic}>
            <span className="network-swatch" style={{ background: seriesColor(topic, topics, colors) }} />
            {topic}
          </li>
        ))}
      </ul>
      <div className="matrix-fit" ref={sheetRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Capital matrix. Rows are ${papers.length} papers. Columns repeat ${scholars.length} scholars as authors, peer reviewers, and replicators.`}
          onMouseMove={onMove}
          onMouseLeave={() => setTip(null)}
        />
        {tip ? (
          <div className="network-tip" style={{ left: tip.x, top: tip.y }}>
            <strong>{tip.paper}</strong>
            {tip.scholar} · {tip.role}
            <br />
            {tip.topic} · Capital {fmt(tip.value)}
          </div>
        ) : null}
      </div>
    </figure>
  );
}
