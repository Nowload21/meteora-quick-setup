import { presetLabel, shortAddress, strategyLabel } from "./core";
import type { PanelState, Preset, Settings, StrategyName } from "./settings";

export interface PoolView {
  poolAddress: string;
  poolName: string;
  tokenSymbol: string;
  walletAddress: string;
}

export interface PreviewView {
  preset: Preset;
  allocationSol: number;
  portfolioText: string;
  minPrice: number;
  maxPrice: number;
  binCount: number;
  rentAndFeesSol: number;
  nonRefundableSol: number;
  newBinArrays: number;
  needsBitmapExtension: boolean;
  remainingSol: number;
  solUsdPrice?: number;
  canCreate: boolean;
  blocker?: string;
}

export interface ResultView {
  signatures: string[];
  positions: string[];
}

export interface UIHandlers {
  onPreset(index: number): void;
  onCreate(): void;
  onRefresh(): void;
  onPanelChange(panel: Partial<PanelState>): void;
}

export interface QuickSetupUI {
  syncSettings(settings: Settings): void;
  setPoolPage(active: boolean): void;
  setPool(pool: PoolView | null, message?: string): void;
  setPreview(preview: PreviewView | null): void;
  setBusy(message: string): void;
  setError(message: string): void;
  setIdle(message?: string): void;
  setSuccess(result: ResultView): void;
  selectedPreset(): number | null;
}

const STYLE = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .panel {
    position: fixed; z-index: 2147483646; right: 12px; top: 72px; width: 320px;
    display: flex; flex-direction: column; max-height: calc(100vh - 84px); container-type: inline-size;
    color: #f7f7fb; background: rgba(17, 17, 28, .97); border: 1px solid #313349;
    border-radius: 12px; box-shadow: 0 16px 44px rgba(0,0,0,.44); overflow: hidden;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 12px; line-height: 1.35; backdrop-filter: blur(14px);
    transition: width .18s ease;
  }
  .header { display: flex; align-items: center; gap: 8px; padding: 8px 9px; border-bottom: 1px solid #2b2c40; cursor: grab; user-select: none; }
  .header.dragging { cursor: grabbing; }
  .mark { display:grid; place-items:center; width:24px; height:24px; border-radius:7px; background:linear-gradient(145deg,#654cf0,#22c9dc); font-weight:900; }
  .title { flex:1; min-width:0; }
  .title strong { display:flex; align-items:center; gap:6px; min-width:0; font-size:12px; }
  .subtitle { display:block; margin-top:1px; color:#777a92; font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pool-inline { display:flex; align-items:center; gap:4px; min-width:0; color:#b8bacb; font-size:10px; font-weight:650; }
  .pool-inline-name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .icon-btn { display:grid; place-items:center; width:25px; height:25px; padding:0; color:#9da0b8; background:#1d1e2e; border:1px solid #303247; border-radius:7px; cursor:pointer; }
  .icon-btn:hover { color:white; border-color:#4c4f69; }
  .body { min-height:0; padding:9px; overflow:auto; }
  .collapsed .body { display:none; }
  .without-pool { width: 220px; }
  .without-pool .body, .without-pool .collapse, .without-pool .resize-handle { display:none; }
  .collapsed .resize-handle { display:none; }
  .resize-handle { position:absolute; right:1px; bottom:1px; width:18px; height:18px; cursor:nwse-resize; opacity:.55; }
  .resize-handle::after { content:""; position:absolute; right:4px; bottom:4px; width:7px; height:7px; border-right:2px solid #777b94; border-bottom:2px solid #777b94; }
  @container (max-width: 285px) {
    .warning { display:none; }
  }
  .pool-dot { flex:0 0 auto; width:6px; height:6px; border-radius:50%; background:#42d9a2; box-shadow:0 0 8px rgba(66,217,162,.5); }
  .pool-dot.off { background:#f4a259; box-shadow:none; }
  .label { margin:9px 0 5px; color:#898ca5; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; }
  .presets { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px; }
  .preset { min-height:39px; padding:5px 6px; text-align:left; color:#b6b8cb; background:#191a29; border:1px solid #2c2e42; border-radius:8px; cursor:pointer; }
  .preset:hover { border-color:#474a66; color:white; }
  .preset.active { color:white; border-color:#6257ed; background:linear-gradient(135deg,rgba(95,76,240,.2),rgba(34,201,220,.08)); box-shadow:0 0 0 1px rgba(98,87,237,.15); }
  .preset-top { display:flex; align-items:center; gap:5px; font-weight:750; font-size:10px; }
  .preset-sub { margin-top:2px; color:#777b94; font-size:9px; }
  .strategy-icon { display:flex; align-items:flex-end; gap:1px; width:24px; height:12px; }
  .strategy-icon i { display:block; width:2px; border-radius:2px 2px 0 0; background:#5b59d9; }
  .strategy-icon i:nth-child(2n) { background:#1bc6dd; }
  .empty { grid-column:1/-1; padding:12px; text-align:center; color:#686b82; border:1px dashed #303247; border-radius:9px; }
  .preview { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .metric { min-height:42px; padding:6px 7px; background:#171824; border:1px solid #292b3e; border-radius:7px; }
  .metric span { display:block; color:#74778e; font-size:9px; text-transform:uppercase; letter-spacing:.05em; }
  .metric strong { display:block; margin-top:4px; color:#f1f2f8; font-size:11px; overflow:hidden; text-overflow:ellipsis; }
  .price-wide { grid-column:1/-1; }
  .non-refundable { grid-column:1/-1; display:flex; gap:8px; align-items:flex-start; padding:9px; color:#ffb557; background:rgba(223,129,31,.13); border:1px solid rgba(255,174,71,.32); border-radius:8px; }
  .non-refundable strong { display:block; color:#ffc474; font-size:11px; }
  .non-refundable span { display:block; margin-top:2px; color:#a98967; font-size:9px; }
  .status { min-height:27px; margin-top:7px; padding:6px 8px; color:#999cb3; background:#151621; border-radius:7px; }
  .status.error { color:#ff8796; background:rgba(177,44,66,.12); }
  .status.success { color:#58dca5; background:rgba(40,153,111,.12); }
  .status a { color:#6fc9ff; text-decoration:none; }
  .create { width:100%; height:36px; margin-top:7px; color:white; background:linear-gradient(135deg,#5e4ce8,#386de8); border:0; border-radius:9px; font-weight:800; cursor:pointer; }
  .create:disabled { color:#66697e; background:#252638; cursor:not-allowed; }
  .warning { margin-top:5px; color:#777a90; font-size:8px; text-align:center; }
`;

function strategyBars(strategy: StrategyName): string {
  const heights = strategy === "CURVE"
    ? [3, 5, 8, 11, 8, 5, 3]
    : strategy === "BID_ASK"
      ? [10, 8, 6, 3, 6, 8, 10]
      : [10, 10, 10, 10, 10, 10, 10];
  return `<span class="strategy-icon" aria-hidden="true">${heights.map((height) => `<i style="height:${height}px"></i>`).join("")}</span>`;
}

export function mountUI(handlers: UIHandlers): QuickSetupUI {
  document.getElementById("meteora-quick-setup-host")?.remove();
  const host = document.createElement("div");
  host.id = "meteora-quick-setup-host";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${STYLE}</style>
    <section class="panel" aria-label="Meteora Quick Setup">
      <header class="header">
        <div class="mark">M</div>
        <div class="title">
          <strong>Quick Setup <span class="pool-inline"><i class="pool-dot off"></i><span class="pool-inline-name">Pool…</span></span></strong>
          <span class="subtitle">Portfolio non défini</span>
        </div>
        <button class="icon-btn refresh" type="button" title="Actualiser la pool">↻</button>
        <button class="icon-btn pin" type="button" title="Épingler">◇</button>
        <button class="icon-btn collapse" type="button" title="Replier">−</button>
      </header>
      <div class="body">
        <div class="label">Presets</div>
        <div class="presets"></div>
        <div class="label">Récapitulatif</div>
        <div class="preview"><div class="empty">Sélectionne un preset</div></div>
        <div class="status">Prêt.</div>
        <button class="create" type="button" disabled>Create Position</button>
        <div class="warning">Le clic sur un preset n’envoie aucune transaction.</div>
      </div>
      <div class="resize-handle" title="Redimensionner"></div>
    </section>`;
  document.documentElement.appendChild(host);

  const panel = shadow.querySelector<HTMLElement>(".panel")!;
  const header = shadow.querySelector<HTMLElement>(".header")!;
  const presetsEl = shadow.querySelector<HTMLElement>(".presets")!;
  const previewEl = shadow.querySelector<HTMLElement>(".preview")!;
  const statusEl = shadow.querySelector<HTMLElement>(".status")!;
  const createButton = shadow.querySelector<HTMLButtonElement>(".create")!;
  const pinButton = shadow.querySelector<HTMLButtonElement>(".pin")!;
  const collapseButton = shadow.querySelector<HTMLButtonElement>(".collapse")!;
  const poolDot = shadow.querySelector<HTMLElement>(".pool-dot")!;
  const poolName = shadow.querySelector<HTMLElement>(".pool-inline-name")!;
  const poolInline = shadow.querySelector<HTMLElement>(".pool-inline")!;
  const subtitle = shadow.querySelector<HTMLElement>(".subtitle")!;
  const resizeHandle = shadow.querySelector<HTMLElement>(".resize-handle")!;
  let currentSettings: Settings | null = null;
  let selected: number | null = null;
  let currentPreview: PreviewView | null = null;
  let busy = false;
  let poolPageActive = true;

  function renderPresets(): void {
    if (!currentSettings) return;
    const enabled = currentSettings.presets
      .map((preset, index) => ({ preset, index }))
      .filter(({ preset }) => preset.enabled);
    if (!enabled.length) {
      presetsEl.innerHTML = '<div class="empty">Configure un preset dans le popup.</div>';
      selected = null;
      return;
    }
    presetsEl.replaceChildren(...enabled.map(({ preset, index }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `preset${selected === index ? " active" : ""}`;
      button.title = presetLabel(preset);
      button.innerHTML = `<span class="preset-top">${strategyBars(preset.strategy)}${strategyLabel(preset.strategy)}</span><span class="preset-sub">${preset.lowerPct}% · ${preset.allocationPct}% portfolio</span>`;
      button.addEventListener("click", () => {
        selected = index;
        currentPreview = null;
        renderPresets();
        createButton.disabled = true;
        handlers.onPreset(index);
      });
      return button;
    }));
  }

  function applyPanelState(state: PanelState): void {
    panel.classList.toggle("collapsed", state.collapsed);
    collapseButton.textContent = state.collapsed ? "+" : "−";
    pinButton.textContent = state.pinned ? "◆" : "◇";
    pinButton.title = state.pinned ? "Désépingler" : "Épingler";
    if (state.x !== null && state.y !== null) {
      panel.style.left = `${Math.max(0, Math.min(state.x, window.innerWidth - panel.offsetWidth))}px`;
      panel.style.top = `${Math.max(0, Math.min(state.y, window.innerHeight - panel.offsetHeight))}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }
    if (poolPageActive && !state.collapsed) {
      panel.style.width = state.width === null ? "320px" : `${state.width}px`;
      panel.style.height = state.height === null ? "auto" : `${Math.min(state.height, Math.max(260, window.innerHeight - 84))}px`;
    } else {
      panel.style.height = "auto";
      if (!poolPageActive) panel.style.width = "220px";
    }
  }

  let drag: { pointerId: number; offsetX: number; offsetY: number } | null = null;
  header.addEventListener("pointerdown", (event) => {
    if (!currentSettings || currentSettings.panel.pinned || (event.target as HTMLElement).closest("button")) return;
    const rect = panel.getBoundingClientRect();
    drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    header.setPointerCapture(event.pointerId);
    header.classList.add("dragging");
  });
  header.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const x = Math.max(0, Math.min(event.clientX - drag.offsetX, window.innerWidth - panel.offsetWidth));
    const y = Math.max(0, Math.min(event.clientY - drag.offsetY, window.innerHeight - panel.offsetHeight));
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  });
  header.addEventListener("pointerup", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    header.classList.remove("dragging");
    const rect = panel.getBoundingClientRect();
    handlers.onPanelChange({ x: Math.round(rect.left), y: Math.round(rect.top) });
  });

  let resizing: { pointerId: number; startX: number; startY: number; width: number; height: number } | null = null;
  resizeHandle.addEventListener("pointerdown", (event) => {
    const rect = panel.getBoundingClientRect();
    resizing = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height
    };
    resizeHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  resizeHandle.addEventListener("pointermove", (event) => {
    if (!resizing || resizing.pointerId !== event.pointerId) return;
    const width = Math.min(400, Math.max(240, resizing.width + event.clientX - resizing.startX));
    const height = Math.min(Math.max(260, window.innerHeight - 84), Math.max(260, resizing.height + event.clientY - resizing.startY));
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
  });
  resizeHandle.addEventListener("pointerup", (event) => {
    if (!resizing || resizing.pointerId !== event.pointerId) return;
    resizing = null;
    const rect = panel.getBoundingClientRect();
    handlers.onPanelChange({ width: Math.round(rect.width), height: Math.round(rect.height) });
  });

  pinButton.addEventListener("click", () => handlers.onPanelChange({ pinned: !currentSettings?.panel.pinned }));
  collapseButton.addEventListener("click", () => handlers.onPanelChange({ collapsed: !currentSettings?.panel.collapsed }));
  shadow.querySelector<HTMLButtonElement>(".refresh")!.addEventListener("click", handlers.onRefresh);
  createButton.addEventListener("click", handlers.onCreate);

  return {
    syncSettings(settings) {
      currentSettings = settings;
      subtitle.textContent = settings.portfolioValue > 0
        ? `Portfolio · ${settings.portfolioValue} ${settings.portfolioUnit}`
        : "Portfolio non défini";
      if (selected !== null && !settings.presets[selected]?.enabled) selected = null;
      applyPanelState(settings.panel);
      renderPresets();
    },
    setPoolPage(active) {
      poolPageActive = active;
      panel.classList.toggle("without-pool", !active);
      if (currentSettings) applyPanelState(currentSettings.panel);
    },
    setPool(pool, message) {
      poolDot.classList.toggle("off", !pool);
      poolName.textContent = pool?.poolName ?? "Aucune pool";
      poolInline.title = pool
        ? `${pool.tokenSymbol}/SOL · ${shortAddress(pool.poolAddress)} · ${shortAddress(pool.walletAddress)}`
        : (message ?? "Ouvre une page DLMM token/SOL");
    },
    setPreview(preview) {
      currentPreview = preview;
      if (!preview) {
        previewEl.innerHTML = '<div class="empty">Sélectionne un preset</div>';
        createButton.disabled = true;
        return;
      }
      const price = (value: number) => value > 0.001 ? value.toFixed(6) : value.toPrecision(5);
      const nonRefundable = preview.nonRefundableSol > 0
        ? `<div class="non-refundable"><b>⚠</b><div><strong>Non remboursable : ${preview.nonRefundableSol.toFixed(5)} SOL</strong><span>${preview.newBinArrays} nouvelle(s) bin array${preview.needsBitmapExtension ? " + extension bitmap" : ""}</span></div></div>`
        : "";
      previewEl.innerHTML = `
        ${nonRefundable}
        <div class="metric"><span>Stratégie</span><strong>${strategyLabel(preview.preset.strategy)}</strong></div>
        <div class="metric"><span>Allocation</span><strong>${preview.allocationSol.toFixed(4)} SOL</strong></div>
        <div class="metric price-wide"><span>Range réelle</span><strong>${price(preview.minPrice)} → ${price(preview.maxPrice)} SOL/token · ${preview.binCount} bins</strong></div>`;
      createButton.disabled = busy || !preview.canCreate;
      if (preview.blocker) this.setError(preview.blocker);
      else this.setIdle("Configuration prête. Vérifie puis crée la position.");
    },
    setBusy(message) {
      busy = true;
      presetsEl.style.pointerEvents = "none";
      presetsEl.style.opacity = ".55";
      statusEl.className = "status";
      statusEl.textContent = message;
      createButton.disabled = true;
    },
    setError(message) {
      busy = false;
      presetsEl.style.pointerEvents = "";
      presetsEl.style.opacity = "";
      statusEl.className = "status error";
      statusEl.textContent = message;
      createButton.disabled = !currentPreview?.canCreate;
    },
    setIdle(message = "Prêt.") {
      busy = false;
      presetsEl.style.pointerEvents = "";
      presetsEl.style.opacity = "";
      statusEl.className = "status";
      statusEl.textContent = message;
      createButton.disabled = !currentPreview?.canCreate;
    },
    setSuccess(result) {
      busy = false;
      presetsEl.style.pointerEvents = "";
      presetsEl.style.opacity = "";
      statusEl.className = "status success";
      statusEl.replaceChildren(document.createTextNode(`${result.positions.length} position(s) confirmée(s). `));
      const tx = document.createElement("a");
      tx.href = `https://solscan.io/tx/${result.signatures[0]}`;
      tx.target = "_blank";
      tx.rel = "noopener noreferrer";
      tx.textContent = "Transaction";
      statusEl.append(tx, document.createTextNode(" · "));
      const position = document.createElement("a");
      position.href = `https://solscan.io/account/${result.positions[0]}`;
      position.target = "_blank";
      position.rel = "noopener noreferrer";
      position.textContent = "Position";
      statusEl.append(position);
      createButton.disabled = false;
    },
    selectedPreset() { return selected; }
  };
}
