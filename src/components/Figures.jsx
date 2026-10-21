import { useMemo } from "react";
import { buildChartConfigs } from "../chartOptions";
import useThemeColors from "../useTheme";
import ChartCanvas from "./ChartCanvas";

export default function Figures({ data, mixBy }) {
  const colors = useThemeColors();
  const charts = useMemo(
    () => (data ? buildChartConfigs(data, mixBy, colors) : null),
    [data, mixBy, colors],
  );

  return (
    <section className="chart-panel" aria-label="Figures">
      <div className="charts">
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 1</span>
            <span className="fig-title">Academic capital over time</span>
            <span className="fig-note">Yearly total</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.capital} />}</div>
        </figure>
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 2</span>
            <span className="fig-title">{mixBy === "tag" ? "Capital by field" : "Capital by role"}</span>
            <span className="fig-note">{charts ? charts.mixNote : "By role"}</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.mix} />}</div>
        </figure>
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 3</span>
            <span className="fig-title">Share of total capital</span>
            <span className="fig-note">Per scholar</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.hhi} />}</div>
        </figure>
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 4</span>
            <span className="fig-title">Citations received</span>
            <span className="fig-note">Papers per bin</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.cite} />}</div>
        </figure>
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 5</span>
            <span className="fig-title">Capital by paper</span>
            <span className="fig-note">Share of total</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.weights} />}</div>
        </figure>
        <figure className="figure">
          <figcaption>
            <span className="fig-kicker">Fig. 6</span>
            <span className="fig-title">Fair price by field</span>
            <span className="fig-note">Per paper</span>
          </figcaption>
          <div className="chart-wrap">{charts && <ChartCanvas config={charts.fmp} />}</div>
        </figure>
      </div>
    </section>
  );
}
