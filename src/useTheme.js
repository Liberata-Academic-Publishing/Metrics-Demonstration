import { useEffect, useState } from "react";
import { readThemeMode, setThemeMode, themeColors } from "./theme";

export default function useThemeColors() {
  const [colors, setColors] = useState(themeColors);

  useEffect(() => {
    const sync = () => setColors(themeColors());
    sync();
    window.addEventListener("liberata-theme", sync);
    return () => window.removeEventListener("liberata-theme", sync);
  }, []);

  return colors;
}

export function useThemeMode() {
  const [mode, setMode] = useState(readThemeMode);

  useEffect(() => {
    const sync = () => setMode(readThemeMode());
    window.addEventListener("liberata-theme", sync);
    return () => window.removeEventListener("liberata-theme", sync);
  }, []);

  return [mode, (next) => setThemeMode(next)];
}
