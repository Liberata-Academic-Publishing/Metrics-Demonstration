import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function applyConfig(chart, config) {
  chart.data.labels = config.data.labels;
  const nextSets = config.data.datasets;
  chart.data.datasets.splice(nextSets.length);
  nextSets.forEach((next, i) => {
    const ds = chart.data.datasets[i];
    if (!ds) {
      chart.data.datasets[i] = next;
      return;
    }
    ds.data = next.data;
    if (next.label != null) ds.label = next.label;
    if (next.backgroundColor != null) ds.backgroundColor = next.backgroundColor;
    if (next.borderColor != null) ds.borderColor = next.borderColor;
  });
  const legend = config.options?.plugins?.legend;
  if (legend && chart.options?.plugins?.legend) {
    chart.options.plugins.legend.display = legend.display;
    chart.options.plugins.legend.position = legend.position;
  }
  chart.update("none");
}

export default function ChartCanvas({ config }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return undefined;

    const existing = chartRef.current;
    if (existing && existing.config.type === config.type && chartRef.theme === config.theme) {
      applyConfig(existing, config);
    } else {
      existing?.destroy();
      chartRef.current = new Chart(canvas, config);
      chartRef.theme = config.theme;
    }

    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) chartRef.current?.update("none");
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => () => {
    chartRef.current?.destroy();
    chartRef.current = null;
  }, []);

  return <canvas ref={canvasRef} />;
}
