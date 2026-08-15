export type PortfolioUnit = "SOL" | "USD";
export type StrategyName = "SPOT" | "CURVE" | "BID_ASK";
export type PriorityLevel = "medium" | "high" | "veryHigh";

export interface Preset {
  enabled: boolean;
  strategy: StrategyName;
  lowerPct: number;
  allocationPct: number;
}

export interface PanelState {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  pinned: boolean;
  collapsed: boolean;
}

export interface Settings {
  portfolioValue: number;
  portfolioUnit: PortfolioUnit;
  presets: Preset[];
  rpcUrl: string;
  priorityLevel: PriorityLevel;
  maxPriorityLamports: number;
  simulateBeforeSend: boolean;
  panel: PanelState;
}

export const STORAGE_KEY = "meteora_quick_setup";

export const DEFAULT_PRESETS: Preset[] = [
  { enabled: true, strategy: "SPOT", lowerPct: -90, allocationPct: 4 },
  ...Array.from({ length: 5 }, () => ({
    enabled: false,
    strategy: "SPOT" as const,
    lowerPct: -50,
    allocationPct: 2
  }))
];

export const DEFAULT_SETTINGS: Settings = {
  portfolioValue: 0,
  portfolioUnit: "SOL",
  presets: DEFAULT_PRESETS,
  rpcUrl: "https://api.mainnet-beta.solana.com",
  priorityLevel: "veryHigh",
  maxPriorityLamports: 2_000_000,
  simulateBeforeSend: true,
  panel: { x: null, y: null, width: null, height: null, pinned: false, collapsed: false }
};

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizePreset(value: Partial<Preset> | undefined, fallback: Preset): Preset {
  const strategies: StrategyName[] = ["SPOT", "CURVE", "BID_ASK"];
  const strategy = strategies.includes(value?.strategy as StrategyName)
    ? (value?.strategy as StrategyName)
    : fallback.strategy;
  return {
    enabled: typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    strategy,
    lowerPct: Math.min(-0.1, Math.max(-99.9, finite(value?.lowerPct, fallback.lowerPct))),
    allocationPct: Math.min(100, Math.max(0.01, finite(value?.allocationPct, fallback.allocationPct)))
  };
}

export function normalizeSettings(value: Partial<Settings> | undefined): Settings {
  const presets = Array.from({ length: 6 }, (_, index) =>
    normalizePreset(value?.presets?.[index], DEFAULT_PRESETS[index])
  );
  const panel = value?.panel ?? DEFAULT_SETTINGS.panel;
  return {
    portfolioValue: Math.max(0, finite(value?.portfolioValue, 0)),
    portfolioUnit: value?.portfolioUnit === "USD" ? "USD" : "SOL",
    presets,
    rpcUrl: typeof value?.rpcUrl === "string" && /^https:\/\//.test(value.rpcUrl)
      ? value.rpcUrl
      : DEFAULT_SETTINGS.rpcUrl,
    priorityLevel: ["medium", "high", "veryHigh"].includes(value?.priorityLevel ?? "")
      ? (value?.priorityLevel as PriorityLevel)
      : DEFAULT_SETTINGS.priorityLevel,
    maxPriorityLamports: Math.max(0, Math.round(finite(value?.maxPriorityLamports, DEFAULT_SETTINGS.maxPriorityLamports))),
    simulateBeforeSend: value?.simulateBeforeSend !== false,
    panel: {
      x: typeof panel.x === "number" && Number.isFinite(panel.x) ? panel.x : null,
      y: typeof panel.y === "number" && Number.isFinite(panel.y) ? panel.y : null,
      width: typeof panel.width === "number" && Number.isFinite(panel.width)
        ? Math.min(400, Math.max(240, panel.width))
        : null,
      height: typeof panel.height === "number" && Number.isFinite(panel.height)
        ? Math.min(620, Math.max(260, panel.height))
        : null,
      pinned: panel.pinned === true,
      collapsed: panel.collapsed === true
    }
  };
}
