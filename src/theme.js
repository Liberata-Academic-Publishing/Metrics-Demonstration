const THEME_KEY = "liberata-theme";

export function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readThemeMode() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be blocked. Device settings still apply.
  }
  return "system";
}

export function resolvedTheme(mode = readThemeMode()) {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return systemDark() ? "dark" : "light";
}

export function applyTheme(mode = readThemeMode()) {
  const resolved = resolvedTheme(mode);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = resolved;
  window.dispatchEvent(new Event("liberata-theme"));
}

export function setThemeMode(mode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // The choice still applies for this visit.
  }
  applyTheme(mode);
}

export function watchSystemTheme() {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readThemeMode() === "system") applyTheme("system");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function read(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function themeColors() {
  return {
    sheet: read("--sheet"),
    ink: read("--ink"),
    muted: read("--muted"),
    rule: read("--rule"),
    brand: read("--brand"),
    empty: read("--empty"),
    track: read("--track"),
    tipBg: read("--tip-bg"),
    tipInk: read("--tip-ink"),
    grid: read("--grid"),
    series: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => read(`--c${index}`)),
    author: read("--role-author"),
    reviewer: read("--role-reviewer"),
    replicator: read("--role-replicator"),
  };
}

export function seriesColor(topic, topics, colors = themeColors()) {
  const index = topics.indexOf(topic);
  const list = colors.series.filter(Boolean);
  if (!list.length) return colors.ink;
  return list[(index < 0 ? 0 : index) % list.length];
}

export function rgb(hex) {
  const value = parseInt(String(hex).replace("#", ""), 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channelLuminance(channel) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex) {
  const [red, green, blue] = rgb(hex);
  return 0.2126 * channelLuminance(red) + 0.7152 * channelLuminance(green) + 0.0722 * channelLuminance(blue);
}

export function mixHex(from, to, amount) {
  const start = rgb(from);
  const end = rgb(to);
  const mixed = start.map((channel, index) => Math.round(channel + (end[index] - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function textOn(background, colors) {
  const lighter = luminance(colors.ink) > luminance(colors.sheet) ? colors.ink : colors.sheet;
  const darker = lighter === colors.ink ? colors.sheet : colors.ink;
  return luminance(background) > 0.45 ? darker : lighter;
}
