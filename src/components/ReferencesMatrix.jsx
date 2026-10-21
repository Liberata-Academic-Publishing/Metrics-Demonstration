import { useEffect, useRef, useState } from "react";
import { drawPaperAxes } from "../matrixFrame";
import { rgb, themeColors } from "../theme";
import useThemeColors from "../useTheme";

const AXIS_LEFT = 96;
const AXIS_TOP = 42;

export default function ReferencesMatrix({ matrix }) {
  const sheetRef = useRef(null);
  const canvasRef = useRef(null);
  const layoutRef = useRef({ cellW: 1, cellH: 1 });
  const [tip, setTip] = useState(null);
  const colors = useThemeColors();
  const papers = matrix?.papers || [];
  const values = matrix?.values || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    const sheet = sheetRef.current;
    if (!canvas || !sheet || !papers.length) return undefined;

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

      const availW = Math.max(1, width - AXIS_LEFT - 12);
      const availH = Math.max(1, height - AXIS_TOP - 12);
      const side = Math.min(availW, availH);
      const cell = side / papers.length;
      const originX = AXIS_LEFT + (availW - side) / 2;
      const originY = AXIS_TOP + (availH - side) / 2;
      layoutRef.current = { cellW: cell, cellH: cell, originX, originY };
      const inset = cell >= 8 ? 0.5 : 0;
      const [red, green, blue] = rgb(theme.brand);

      let max = 0;
      values.forEach((row) => row.forEach((value) => {
        if (value > max) max = value;
      }));

      values.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const amount = max > 0 ? value / max : 0;
          ctx.fillStyle = amount <= 0
            ? theme.empty
            : `rgba(${red}, ${green}, ${blue}, ${0.22 + amount * 0.78})`;
          ctx.fillRect(
            originX + colIndex * cell + inset,
            originY + rowIndex * cell + inset,
            Math.max(0.5, cell - inset * 2),
            Math.max(0.5, cell - inset * 2),
          );
        });
      });

      drawPaperAxes(ctx, {
        axisLeft: originX,
        axisTop: originY,
        plotW: side,
        plotH: side,
        papers,
        cellW: cell,
        cellH: cell,
        colors: theme,
        columnTitle: "Columns: cited papers",
        rowTitle: "Rows: citing papers",
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
  }, [papers, values]);

  const onMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { cellW, cellH, originX, originY } = layoutRef.current;
    if (!cellW || !cellH) {
      setTip(null);
      return;
    }
    const col = Math.floor((event.clientX - rect.left - originX) / cellW);
    const row = Math.floor((event.clientY - rect.top - originY) / cellH);
    if (row < 0 || col < 0 || row >= papers.length || col >= papers.length) {
      setTip(null);
      return;
    }
    setTip({
      x: event.clientX - rect.left + 14,
      y: event.clientY - rect.top + 14,
      citing: papers[row].label,
      cited: papers[col].label,
      weight: values[row][col],
    });
  };

  if (!papers.length) return null;
  const links = values.reduce((sum, row) => sum + row.filter((value) => value > 0).length, 0);

  return (
    <figure className="figure matrix references">
      <figcaption>
        <span className="fig-title">References matrix</span>
        <span className="fig-note">{papers.length} papers · {links} citations</span>
      </figcaption>
      <p className="matrix-lead">Each row is a paper doing the citing. Each column is a paper being cited, in the same paper order. A cell is that citation’s weight: one divided by how many papers the row cites. Later papers cite earlier ones, so the marks sit below the diagonal.</p>
      <ul className="network-legend">
        <li><span className="network-swatch" style={{ background: colors.brand }} />Citation weight</li>
      </ul>
      <div className="matrix-fit" ref={sheetRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`References matrix. Rows are ${papers.length} citing papers and columns are the same papers being cited.`}
          onMouseMove={onMove}
          onMouseLeave={() => setTip(null)}
        />
        {tip ? (
          <div className="network-tip" style={{ left: tip.x, top: tip.y }}>
            <strong>{tip.citing}</strong>
            {tip.weight > 0 ? `cites ${tip.cited}` : `does not cite ${tip.cited}`}
            <br />
            Weight {tip.weight > 0 ? tip.weight.toFixed(3) : "0"}
          </div>
        ) : null}
      </div>
    </figure>
  );
}
