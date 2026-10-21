import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Chart from "chart.js/auto";
import App from "./App";
import Guide from "./components/Guide";
import { parseRoute, TABS } from "./metrics";
import { applyTheme, themeColors, watchSystemTheme } from "./theme";
import "./styles.css";

function Root() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));

  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (route.page !== "metrics") {
      document.title = "Liberata";
      return;
    }
    const label = TABS.find(([id]) => id === route.group)?.[1] || "Metrics";
    document.title = `${label} · Liberata`;
  }, [route]);

  return route.page === "metrics"
    ? <Guide group={route.group} metric={route.metric} />
    : <App />;
}

applyTheme();
watchSystemTheme();
Chart.defaults.font.family = 'Figtree, "Helvetica Neue", Helvetica, Arial, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.color = themeColors().muted;
Chart.defaults.animation = false;
window.addEventListener("liberata-theme", () => {
  Chart.defaults.color = themeColors().muted;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
