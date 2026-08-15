import type { Preset, StrategyName } from "./settings";

export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface RangeCalculation {
  minBinId: number;
  maxBinId: number;
  binCount: number;
  direction: "BELOW" | "ABOVE";
}

export function extractPoolAddress(pathname: string): string | null {
  return pathname.match(/\/dlmm\/([1-9A-HJ-NP-Za-km-z]{32,44})(?:\/|$)/)?.[1] ?? null;
}

export function calculateAllocationSol(
  portfolioValue: number,
  portfolioUnit: "SOL" | "USD",
  allocationPct: number,
  solUsdPrice?: number
): number {
  if (!(portfolioValue > 0) || !(allocationPct > 0 && allocationPct <= 100)) return 0;
  const allocated = portfolioValue * allocationPct / 100;
  if (portfolioUnit === "SOL") return allocated;
  if (!solUsdPrice || !Number.isFinite(solUsdPrice) || solUsdPrice <= 0) return 0;
  return allocated / solUsdPrice;
}

export function calculateOneSidedRange(
  activeBinId: number,
  binStep: number,
  lowerPct: number,
  solIsTokenX: boolean
): RangeCalculation {
  if (!Number.isInteger(activeBinId)) throw new Error("Bin actif invalide.");
  if (!(binStep > 0)) throw new Error("Bin step invalide.");
  if (!(lowerPct >= -99.9 && lowerPct <= -0.1)) throw new Error("Borne basse invalide.");

  const targetFactor = 1 + lowerPct / 100;
  const stepFactor = 1 + binStep / 10_000;
  const delta = Math.max(1, Math.ceil(Math.abs(Math.log(targetFactor) / Math.log(stepFactor))));

  if (solIsTokenX) {
    return {
      minBinId: activeBinId,
      maxBinId: activeBinId + delta,
      binCount: delta + 1,
      direction: "ABOVE"
    };
  }

  return {
    minBinId: activeBinId - delta,
    maxBinId: activeBinId,
    binCount: delta + 1,
    direction: "BELOW"
  };
}

export function strategyLabel(strategy: StrategyName): string {
  return strategy === "BID_ASK" ? "BID-ASK" : strategy;
}

export function presetLabel(preset: Preset): string {
  return `${strategyLabel(preset.strategy)} · ${preset.lowerPct}% · ${preset.allocationPct}%`;
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 5)}…${address.slice(-5)}` : address;
}
