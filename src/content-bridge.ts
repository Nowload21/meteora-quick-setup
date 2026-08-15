import { DEFAULT_SETTINGS, STORAGE_KEY, normalizeSettings, type Settings } from "./settings";

const PAGE_SOURCE = "meteora-quick-setup";
const BRIDGE_SOURCE = "meteora-quick-setup-bridge";

async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeSettings(stored[STORAGE_KEY] ?? DEFAULT_SETTINGS);
}

function post(type: string, payload: unknown, reqId?: string): void {
  window.postMessage({ source: BRIDGE_SOURCE, type, payload, reqId }, "*");
}

window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== PAGE_SOURCE) return;

  if (message.type === "get-settings") {
    post("settings", await loadSettings(), message.reqId);
    return;
  }

  if (message.type === "set-panel") {
    const current = await loadSettings();
    const next = normalizeSettings({ ...current, panel: { ...current.panel, ...message.payload } });
    await chrome.storage.local.set({ [STORAGE_KEY]: next });
    post("settings", next, message.reqId);
    return;
  }

  if (message.type === "fetch-json") {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "fetch-json",
        url: message.url,
        init: message.init
      });
      post("fetch-result", response, message.reqId);
    } catch (error) {
      post("fetch-result", { ok: false, status: 0, error: String(error) }, message.reqId);
    }
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[STORAGE_KEY]) return;
  post("settings", normalizeSettings(changes[STORAGE_KEY].newValue as Partial<Settings> | undefined));
});
