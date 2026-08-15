const ALLOWED_FETCH_HOSTS = new Set([
  "lite-api.jup.ag",
  "dlmm.datapi.meteora.ag"
]);

async function isAllowed(url: URL): Promise<boolean> {
  if (url.protocol !== "https:") return false;
  if (ALLOWED_FETCH_HOSTS.has(url.hostname)) return true;
  const stored = await chrome.storage.local.get("meteora_quick_setup");
  const persisted = stored.meteora_quick_setup as { rpcUrl?: unknown } | undefined;
  const rpcUrl = persisted?.rpcUrl;
  if (typeof rpcUrl !== "string") return url.origin === "https://api.mainnet-beta.solana.com";
  try {
    return url.origin === new URL(rpcUrl).origin;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "fetch-json") return false;

  void (async () => {
    try {
      const url = new URL(message.url);
      if (!(await isAllowed(url))) {
        throw new Error("Hôte réseau non autorisé.");
      }
      const response = await fetch(url, {
        method: message.init?.method ?? "GET",
        headers: message.init?.headers,
        body: message.init?.body
      });
      const body = await response.text();
      sendResponse({ ok: response.ok, status: response.status, body });
    } catch (error) {
      sendResponse({ ok: false, status: 0, error: error instanceof Error ? error.message : String(error) });
    }
  })();

  return true;
});
