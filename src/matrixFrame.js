export const AXIS_LEFT = 78;
export const AXIS_TOP = 62;

export function tickIndexes(count) {
  const wanted = count > 12 ? 4 : Math.min(count, 4);
  if (count <= wanted) return [...Array(count).keys()];
  const indexes = [];
  for (let i = 0; i < wanted; i++) indexes.push(Math.round((i * (count - 1)) / (wanted - 1)));
  return [...new Set(indexes)];
}

export function drawPaperAxes(ctx, {
  axisLeft,
  axisTop,
  plotW,
  plotH,
  papers,
  cellW,
  cellH,
  colors,
  columnTitle,
  rowTitle,
}) {
  ctx.strokeStyle = colors.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(axisLeft, axisTop, plotW, plotH);

  ctx.fillStyle = colors.ink;
  ctx.font = "600 12px Figtree, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(columnTitle, axisLeft + plotW / 2, 14);

  ctx.fillStyle = colors.muted;
  ctx.font = "11px Figtree, Helvetica, sans-serif";
  ctx.textBaseline = "bottom";
  tickIndexes(papers.length).forEach((index) => {
    const label = String(papers[index].n);
    const half = ctx.measureText(label).width / 2 + 4;
    const raw = axisLeft + index * cellW + cellW / 2;
    const x = Math.max(axisLeft + half, Math.min(axisLeft + plotW - half, raw));
    ctx.textAlign = "center";
    ctx.fillText(label, x, axisTop - 4);
  });

  ctx.save();
  ctx.translate(Math.max(14, axisLeft - 46), axisTop + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.ink;
  ctx.font = "600 12px Figtree, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(rowTitle, 0, 0);
  ctx.restore();

  ctx.font = "11px Figtree, Helvetica, sans-serif";
  tickIndexes(papers.length).forEach((index) => {
    const y = axisTop + index * cellH + cellH / 2;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(papers[index].n), axisLeft - 8, y);
    ctx.strokeStyle = colors.rule;
    ctx.beginPath();
    ctx.moveTo(axisLeft - 4, y);
    ctx.lineTo(axisLeft, y);
    ctx.stroke();
  });
}

export function blockAt(col, scholarCount) {
  if (scholarCount <= 0) return { block: 0, index: 0 };
  return { block: Math.floor(col / scholarCount), index: col % scholarCount };
}

export function drawBlockedAxes(ctx, { plotW, plotH, papers, scholars, blocks, cellW, cellH, colors }) {
  const blockW = scholars.length * cellW;

  ctx.strokeStyle = colors.rule;
  ctx.lineWidth = 1;
  ctx.strokeRect(AXIS_LEFT, AXIS_TOP, plotW, plotH);

  ctx.fillStyle = colors.ink;
  ctx.font = "600 12px Figtree, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Columns: scholars", AXIS_LEFT + plotW / 2, 12);

  blocks.forEach((block, blockIndex) => {
    const x0 = AXIS_LEFT + blockIndex * blockW;
    if (blockIndex > 0) {
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(x0 + 0.5, 22);
      ctx.lineTo(x0 + 0.5, AXIS_TOP + plotH);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = colors.ink;
    ctx.font = "600 11px Figtree, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = blockW < 118 ? block.short : block.label;
    ctx.fillText(label, x0 + blockW / 2, 30);

    ctx.fillStyle = colors.muted;
    ctx.font = "11px Figtree, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    tickIndexes(scholars.length).forEach((index) => {
      const label = String(scholars[index].n);
      const half = ctx.measureText(label).width / 2 + 6;
      const raw = x0 + index * cellW + cellW / 2;
      const x = Math.max(x0 + half, Math.min(x0 + blockW - half, raw));
      ctx.fillText(label, x, AXIS_TOP - 3);
    });
  });

  ctx.save();
  ctx.translate(14, AXIS_TOP + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = colors.ink;
  ctx.font = "600 12px Figtree, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Rows: papers", 0, 0);
  ctx.restore();

  ctx.font = "11px Figtree, Helvetica, sans-serif";
  tickIndexes(papers.length).forEach((index) => {
    const y = AXIS_TOP + index * cellH + cellH / 2;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(papers[index].n), AXIS_LEFT - 8, y);
    ctx.strokeStyle = colors.rule;
    ctx.beginPath();
    ctx.moveTo(AXIS_LEFT - 4, y);
    ctx.lineTo(AXIS_LEFT, y);
    ctx.stroke();
  });
}
