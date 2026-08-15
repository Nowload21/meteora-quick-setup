import { describe, expect, it } from "vitest";
import {
  calculateAllocationSol,
  calculateOneSidedRange,
  extractPoolAddress,
  presetLabel
} from "../src/core";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/settings";

describe("calculateAllocationSol", () => {
  it("calcule une allocation depuis un portfolio SOL", () => {
    expect(calculateAllocationSol(100, "SOL", 4)).toBe(4);
  });

  it("convertit une allocation USD en SOL", () => {
    expect(calculateAllocationSol(10_000, "USD", 4, 200)).toBe(2);
  });

  it("refuse une cotation USD absente", () => {
    expect(calculateAllocationSol(10_000, "USD", 4)).toBe(0);
  });
});

describe("calculateOneSidedRange", () => {
  it("place SOL token Y sous le bin actif", () => {
    const range = calculateOneSidedRange(1_000, 100, -50, false);
    expect(range.maxBinId).toBe(1_000);
    expect(range.minBinId).toBeLessThan(range.maxBinId);
    expect(range.binCount).toBe(range.maxBinId - range.minBinId + 1);
  });

  it("place SOL token X au-dessus du bin actif", () => {
    const range = calculateOneSidedRange(1_000, 100, -50, true);
    expect(range.minBinId).toBe(1_000);
    expect(range.maxBinId).toBeGreaterThan(range.minBinId);
    expect(range.binCount).toBe(range.maxBinId - range.minBinId + 1);
  });
});

describe("helpers", () => {
  it("extrait un pool Meteora valide", () => {
    const address = "5oZb2J5vqqn2G2YfxWZ6FZ9Dk7nPzQxYd4Hs8JkLmNop";
    expect(extractPoolAddress(`/dlmm/${address}`)).toBe(address);
    expect(extractPoolAddress("/pools")).toBeNull();
  });

  it("formate un preset sans nom", () => {
    expect(presetLabel({ enabled: true, strategy: "SPOT", lowerPct: -90, allocationPct: 4 }))
      .toBe("SPOT · -90% · 4%");
  });

  it("borne et conserve la taille personnalisée du panneau", () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      panel: { ...DEFAULT_SETTINGS.panel, width: 120, height: 400 }
    });
    expect(settings.panel.width).toBe(240);
    expect(settings.panel.height).toBe(400);
  });

  it("réduit les anciennes grandes dimensions au format latéral compact", () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      panel: { ...DEFAULT_SETTINGS.panel, width: 520, height: 900 }
    });
    expect(settings.panel.width).toBe(400);
    expect(settings.panel.height).toBe(620);
  });
});
