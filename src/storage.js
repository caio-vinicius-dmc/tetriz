import { SKINS } from "./skins.js";
const KEY = "tetriz.v1";
export const defaults = {
  records: [],
  pending: [],
  settings: {
    sound: true,
    vibration: true,
    patterns: false,
    motion: true,
    specialEffects: true,
    skin: "standard",
    gestures: true,
    sensitivity: 30,
    difficulty: "medium",
    autoDrop: false,
    theme: "dark",
  },
  session: null,
  cache: null,
};
export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    const valid = (r) =>
      r &&
      Number.isSafeInteger(r.score) &&
      r.score >= 0 &&
      typeof r.id === "string" &&
      Number.isFinite(r.lines) &&
      Number.isFinite(r.level) &&
      Number.isFinite(r.duration);
    const settings = { ...defaults.settings };
    for (const key of Object.keys(settings)) {
      if (typeof s?.settings?.[key] === typeof settings[key])
        settings[key] = s.settings[key];
    }
    if (!SKINS.some((s) => s.id === settings.skin)) settings.skin = "standard";
    if (
      s?.settings?.specialEffects === undefined &&
      s?.settings?.motion === false
    )
      settings.specialEffects = false;
    settings.sensitivity = Math.min(70, Math.max(15, settings.sensitivity));
    if (!["easy", "medium", "hard", "pro"].includes(settings.difficulty))
      settings.difficulty = "medium";
    if (!["light", "dark"].includes(settings.theme)) settings.theme = "dark";
    return {
      ...structuredClone(defaults),
      session: s?.session || null,
      records: Array.isArray(s?.records)
        ? s.records.filter(valid).slice(0, 100)
        : [],
      pending: Array.isArray(s?.pending) ? s.pending.filter(valid) : [],
      cache: Array.isArray(s?.cache?.rows) ? s.cache : null,
      settings,
    };
  } catch {
    return structuredClone(defaults);
  }
}
export function persist(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
