import {
  DEFAULT_SETTINGS,
  STORAGE_KEY,
  normalizeSettings,
  type Preset,
  type Settings,
  type StrategyName
} from "./settings";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function presetEditor(preset: Preset, index: number): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = `preset-editor${preset.enabled ? "" : " is-disabled"}`;
  wrapper.dataset.index = String(index);
  wrapper.innerHTML = `
    <div class="preset-head">
      <strong>Preset ${index + 1}</strong>
      <label class="switch" title="Activer le preset">
        <input class="preset-enabled" type="checkbox" ${preset.enabled ? "checked" : ""}>
        <i></i>
      </label>
    </div>
    <div class="preset-fields">
      <label><span>Stratégie</span><select class="preset-strategy">
        <option value="SPOT" ${preset.strategy === "SPOT" ? "selected" : ""}>SPOT</option>
        <option value="CURVE" ${preset.strategy === "CURVE" ? "selected" : ""}>CURVE</option>
        <option value="BID_ASK" ${preset.strategy === "BID_ASK" ? "selected" : ""}>BID-ASK</option>
      </select></label>
      <label><span>Range min %</span><input class="preset-lower" type="number" min="-99.9" max="-0.1" step="0.1" value="${preset.lowerPct}"></label>
      <label><span>Portfolio %</span><input class="preset-allocation" type="number" min="0.01" max="100" step="0.01" value="${preset.allocationPct}"></label>
    </div>`;
  wrapper.querySelector<HTMLInputElement>(".preset-enabled")!.addEventListener("change", (event) => {
    wrapper.classList.toggle("is-disabled", !(event.target as HTMLInputElement).checked);
  });
  return wrapper;
}

function fill(settings: Settings): void {
  byId<HTMLInputElement>("portfolioValue").value = String(settings.portfolioValue || "");
  byId<HTMLSelectElement>("portfolioUnit").value = settings.portfolioUnit;
  byId<HTMLInputElement>("rpcUrl").value = settings.rpcUrl;
  byId<HTMLSelectElement>("priorityLevel").value = settings.priorityLevel;
  byId<HTMLInputElement>("maxPrioritySol").value = String(settings.maxPriorityLamports / 1e9);
  byId<HTMLInputElement>("simulateBeforeSend").checked = settings.simulateBeforeSend;
  const container = byId("presets");
  container.replaceChildren(...settings.presets.map(presetEditor));
}

function readPresets(): Preset[] {
  return [...document.querySelectorAll<HTMLElement>(".preset-editor")].map((editor) => ({
    enabled: editor.querySelector<HTMLInputElement>(".preset-enabled")!.checked,
    strategy: editor.querySelector<HTMLSelectElement>(".preset-strategy")!.value as StrategyName,
    lowerPct: Number(editor.querySelector<HTMLInputElement>(".preset-lower")!.value),
    allocationPct: Number(editor.querySelector<HTMLInputElement>(".preset-allocation")!.value)
  }));
}

async function load(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeSettings(stored[STORAGE_KEY] ?? DEFAULT_SETTINGS);
}

async function ensureRpcPermission(rpcUrl: string): Promise<boolean> {
  const origin = `${new URL(rpcUrl).origin}/*`;
  if (await chrome.permissions.contains({ origins: [origin] })) return true;
  return chrome.permissions.request({ origins: [origin] });
}

async function save(): Promise<void> {
  const status = byId("status");
  status.className = "";
  try {
    const current = await load();
    const portfolioValue = Number(byId<HTMLInputElement>("portfolioValue").value);
    const presets = readPresets();
    const rpcUrl = byId<HTMLInputElement>("rpcUrl").value.trim();
    const maxPrioritySol = Number(byId<HTMLInputElement>("maxPrioritySol").value);
    if (!Number.isFinite(portfolioValue) || portfolioValue < 0) throw new Error("Portfolio invalide.");
    if (!/^https:\/\//.test(rpcUrl)) throw new Error("Le RPC doit utiliser HTTPS.");
    if (!Number.isFinite(maxPrioritySol) || maxPrioritySol < 0) throw new Error("Plafond de frais invalide.");
    for (const [index, preset] of presets.entries()) {
      if (!preset.enabled) continue;
      if (!Number.isFinite(preset.lowerPct) || preset.lowerPct < -99.9 || preset.lowerPct > -0.1) {
        throw new Error(`Preset ${index + 1} : range entre -99,9 % et -0,1 %.`);
      }
      if (!Number.isFinite(preset.allocationPct) || preset.allocationPct <= 0 || preset.allocationPct > 100) {
        throw new Error(`Preset ${index + 1} : allocation entre 0 et 100 %.`);
      }
    }
    const raw: Partial<Settings> = {
      ...current,
      portfolioValue,
      portfolioUnit: byId<HTMLSelectElement>("portfolioUnit").value as Settings["portfolioUnit"],
      presets,
      rpcUrl,
      priorityLevel: byId<HTMLSelectElement>("priorityLevel").value as Settings["priorityLevel"],
      maxPriorityLamports: Math.round(maxPrioritySol * 1e9),
      simulateBeforeSend: byId<HTMLInputElement>("simulateBeforeSend").checked
    };
    const settings = normalizeSettings(raw);
    if (!(await ensureRpcPermission(settings.rpcUrl))) throw new Error("Permission RPC refusée.");
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    fill(settings);
    status.textContent = "Enregistré ✓";
  } catch (error) {
    status.className = "error";
    status.textContent = error instanceof Error ? error.message : String(error);
  }
}

void load().then(fill);
byId<HTMLButtonElement>("save").addEventListener("click", () => void save());
