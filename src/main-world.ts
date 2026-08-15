import DLMM, { StrategyType, getPriceOfBinByBinId } from "@meteora-ag/dlmm";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";
import BN from "bn.js";
import {
  USDC_MINT,
  WSOL_MINT,
  calculateAllocationSol,
  calculateOneSidedRange,
  extractPoolAddress,
  shortAddress
} from "./core";
import { DEFAULT_SETTINGS, normalizeSettings, type PanelState, type Preset, type Settings } from "./settings";
import { mountUI, type PoolView, type PreviewView, type QuickSetupUI, type ResultView } from "./ui";

const PAGE_SOURCE = "meteora-quick-setup";
const BRIDGE_SOURCE = "meteora-quick-setup-bridge";
const VERSION = "0.1.6";
const MAX_COMPUTE_UNITS = 1_400_000;

interface WalletProvider {
  publicKey?: { toString(): string } | null;
  isConnected?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signTransaction?(transaction: VersionedTransaction): Promise<VersionedTransaction>;
  signAllTransactions?(transactions: VersionedTransaction[]): Promise<VersionedTransaction[]>;
}

interface BridgeFetchResult {
  ok: boolean;
  status: number;
  body?: string;
  error?: string;
}

interface PoolContext {
  address: string;
  dlmm: DLMM;
  connection: Connection;
  wallet: PublicKey;
  solIsTokenX: boolean;
  tokenMint: PublicKey;
  tokenSymbol: string;
  poolName: string;
  activeBinId: number;
  binStep: number;
}

interface PreparedPreview {
  pool: PoolContext;
  preset: Preset;
  presetIndex: number;
  allocationSol: number;
  amountLamports: bigint;
  range: ReturnType<typeof calculateOneSidedRange>;
  rentAndFeesSol: number;
  nonRefundableSol: number;
  newBinArrays: number;
  needsBitmapExtension: boolean;
  solBalance: number;
  solUsdPrice?: number;
  view: PreviewView;
}

const pendingSettings = new Map<string, (settings: Settings) => void>();
const pendingFetch = new Map<string, (result: BridgeFetchResult) => void>();
let settings: Settings = normalizeSettings(DEFAULT_SETTINGS);
let ui: QuickSetupUI;
let poolContext: PoolContext | null = null;
let preview: PreparedPreview | null = null;
let loadingPool = 0;
let creating = false;
let lastPath = location.pathname;

function requestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function requestSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    const reqId = requestId();
    const timer = window.setTimeout(() => {
      pendingSettings.delete(reqId);
      resolve(settings);
    }, 3_000);
    pendingSettings.set(reqId, (next) => {
      window.clearTimeout(timer);
      resolve(next);
    });
    window.postMessage({ source: PAGE_SOURCE, type: "get-settings", reqId }, "*");
  });
}

function savePanel(panel: Partial<PanelState>): void {
  window.postMessage({ source: PAGE_SOURCE, type: "set-panel", payload: panel, reqId: requestId() }, "*");
}

function bridgeFetch(url: string, init?: RequestInit): Promise<BridgeFetchResult> {
  return new Promise((resolve) => {
    const reqId = requestId();
    const timer = window.setTimeout(() => {
      pendingFetch.delete(reqId);
      resolve({ ok: false, status: 0, error: "Délai réseau dépassé." });
    }, 20_000);
    pendingFetch.set(reqId, (result) => {
      window.clearTimeout(timer);
      resolve(result);
    });
    window.postMessage({
      source: PAGE_SOURCE,
      type: "fetch-json",
      reqId,
      url,
      init: init ? {
        method: init.method,
        headers: init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
        body: init.body
      } : undefined
    }, "*");
  });
}

async function bridgeJson<T>(url: string, init?: RequestInit): Promise<T> {
  const result = await bridgeFetch(url, init);
  if (!result.ok) throw new Error(result.error || `Erreur réseau ${result.status}.`);
  try {
    return JSON.parse(result.body ?? "") as T;
  } catch {
    throw new Error("Réponse réseau invalide.");
  }
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const message = event.data;
  if (!message || message.source !== BRIDGE_SOURCE) return;

  if (message.type === "settings") {
    settings = normalizeSettings(message.payload);
    ui?.syncSettings(settings);
    if (message.reqId && pendingSettings.has(message.reqId)) {
      pendingSettings.get(message.reqId)!(settings);
      pendingSettings.delete(message.reqId);
    }
    if (poolContext && ui?.selectedPreset() !== null) void selectPreset(ui.selectedPreset()!);
  }

  if (message.type === "fetch-result" && message.reqId && pendingFetch.has(message.reqId)) {
    pendingFetch.get(message.reqId)!(message.payload as BridgeFetchResult);
    pendingFetch.delete(message.reqId);
  }
});

function getProvider(): WalletProvider | null {
  const walletWindow = window as typeof window & {
    solflare?: WalletProvider;
    jupiter?: WalletProvider;
    solana?: WalletProvider;
  };
  const candidates = [walletWindow.solflare, walletWindow.jupiter, walletWindow.solana]
    .filter((provider): provider is WalletProvider => Boolean(provider));
  return candidates.find((provider) => Boolean(provider.publicKey)) ?? candidates[0] ?? null;
}

function connectedWallet(provider: WalletProvider | null): PublicKey | null {
  if (!provider?.publicKey) return null;
  try {
    return new PublicKey(provider.publicKey.toString());
  } catch {
    return null;
  }
}

async function ensureConnectedWallet(provider: WalletProvider): Promise<PublicKey> {
  const current = connectedWallet(provider);
  if (current) return current;
  const connected = await provider.connect({ onlyIfTrusted: true });
  return new PublicKey(connected.publicKey.toString());
}

function createConnection(): Connection {
  const proxiedFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const result = await bridgeFetch(url, init);
    return new Response(result.body ?? result.error ?? "", {
      status: result.status || (result.ok ? 200 : 500),
      headers: { "content-type": "application/json" }
    });
  };
  return new Connection(settings.rpcUrl, { commitment: "confirmed", fetch: proxiedFetch });
}

function strategyType(preset: Preset): StrategyType {
  if (preset.strategy === "CURVE") return StrategyType.Curve;
  if (preset.strategy === "BID_ASK") return StrategyType.BidAsk;
  return StrategyType.Spot;
}

function humanPriceForBin(context: PoolContext, binId: number): number {
  const perLamport = getPriceOfBinByBinId(binId, context.binStep).toNumber();
  const internalPrice = Number(context.dlmm.fromPricePerLamport(perLamport));
  return context.solIsTokenX ? 1 / internalPrice : internalPrice;
}

async function poolMetadata(address: string, tokenMint: string): Promise<{ name: string; symbol: string }> {
  try {
    const data = await bridgeJson<Record<string, unknown>>(`https://dlmm.datapi.meteora.ag/pools/${address}`);
    const name = typeof data.name === "string" ? data.name : `SOL/${shortAddress(tokenMint)}`;
    const tokenX = data.token_x as Record<string, unknown> | undefined;
    const tokenY = data.token_y as Record<string, unknown> | undefined;
    const candidates = [tokenX, tokenY].filter(Boolean) as Record<string, unknown>[];
    const token = candidates.find((item) => {
      const mint = item.address ?? item.mint ?? item.mint_address;
      return mint === tokenMint;
    });
    const symbol = typeof token?.symbol === "string"
      ? token.symbol
      : name.split(/[\/-]/).find((part) => part && part.toUpperCase() !== "SOL")?.trim() || shortAddress(tokenMint);
    return { name, symbol };
  } catch {
    return { name: `SOL/${shortAddress(tokenMint)}`, symbol: shortAddress(tokenMint) };
  }
}

async function loadPool(): Promise<void> {
  const generation = ++loadingPool;
  preview = null;
  ui.setPreview(null);
  ui.setBusy("Détection du pool et du wallet…");
  const address = extractPoolAddress(location.pathname);
  if (!address) {
    ui.setPoolPage(false);
    poolContext = null;
    ui.setPool(null, "Ouvre une page /dlmm/<pool>.");
    ui.setError("Aucun pool DLMM détecté dans l’URL.");
    return;
  }
  ui.setPoolPage(true);

  const provider = getProvider();
  const wallet = connectedWallet(provider);
  if (!provider || !wallet) {
    poolContext = null;
    ui.setPool(null, "Connecte d’abord ton wallet à Meteora.");
    ui.setError("Wallet connecté à Meteora introuvable.");
    return;
  }

  try {
    const connection = createConnection();
    const dlmm = await DLMM.create(connection, new PublicKey(address));
    const tokenX = dlmm.lbPair.tokenXMint.toBase58();
    const tokenY = dlmm.lbPair.tokenYMint.toBase58();
    const solIsTokenX = tokenX === WSOL_MINT;
    const solIsTokenY = tokenY === WSOL_MINT;
    if (!solIsTokenX && !solIsTokenY) throw new Error("Ce pool n’est pas une paire token/SOL.");
    if (solIsTokenX && solIsTokenY) throw new Error("Pool SOL/SOL incompatible.");
    const tokenMint = solIsTokenX ? dlmm.lbPair.tokenYMint : dlmm.lbPair.tokenXMint;
    const [activeBin, metadata] = await Promise.all([
      dlmm.getActiveBin(),
      poolMetadata(address, tokenMint.toBase58())
    ]);
    if (generation !== loadingPool) return;
    poolContext = {
      address,
      dlmm,
      connection,
      wallet,
      solIsTokenX,
      tokenMint,
      tokenSymbol: metadata.symbol,
      poolName: metadata.name,
      activeBinId: activeBin.binId,
      binStep: dlmm.lbPair.binStep
    };
    const view: PoolView = {
      poolAddress: address,
      poolName: metadata.name,
      tokenSymbol: metadata.symbol,
      walletAddress: wallet.toBase58()
    };
    ui.setPool(view);
    ui.setIdle("Pool valide. Sélectionne un preset.");
    const selected = ui.selectedPreset();
    if (selected !== null) await selectPreset(selected);
  } catch (error) {
    if (generation !== loadingPool) return;
    poolContext = null;
    ui.setPool(null, errorMessage(error));
    ui.setError(errorMessage(error));
  }
}

async function solUsdPrice(): Promise<number> {
  const url = new URL("https://lite-api.jup.ag/swap/v1/quote");
  url.searchParams.set("inputMint", WSOL_MINT);
  url.searchParams.set("outputMint", USDC_MINT);
  url.searchParams.set("amount", "1000000000");
  url.searchParams.set("slippageBps", "50");
  const quote = await bridgeJson<{ outAmount?: string }>(url.toString());
  const price = Number(quote.outAmount) / 1e6;
  if (!(price > 0)) throw new Error("Cotation SOL/USDC indisponible.");
  return price;
}

interface CostEstimate {
  totalSol: number;
  nonRefundableSol: number;
  newBinArrays: number;
  needsBitmapExtension: boolean;
}

async function estimateCosts(
  context: PoolContext,
  range: ReturnType<typeof calculateOneSidedRange>
): Promise<CostEstimate> {
  const quote = await context.dlmm.quoteCreatePosition({
    strategy: { minBinId: range.minBinId, maxBinId: range.maxBinId, strategyType: StrategyType.Spot }
  });
  const rent = Number(quote.positionCost)
    + Number(quote.positionReallocCost)
    + Number(quote.bitmapExtensionCost)
    + Number(quote.binArrayCost);
  const tokenAccountRent = await context.connection.getMinimumBalanceForRentExemption(165);
  const transactionCount = Math.max(1, Number(quote.transactionCount) + Number(quote.positionCount));
  const signatureFees = transactionCount * 10_000;
  const priorityCap = transactionCount * settings.maxPriorityLamports;
  return {
    totalSol: rent + (tokenAccountRent * 2 + signatureFees + priorityCap) / 1e9,
    nonRefundableSol: Number(quote.binArrayCost) + Number(quote.bitmapExtensionCost),
    newBinArrays: Number(quote.binArraysCount),
    needsBitmapExtension: Number(quote.bitmapExtensionCost) > 0
  };
}

async function preparePreview(index: number, refreshPool = false): Promise<PreparedPreview> {
  if (refreshPool || !poolContext) await loadPool();
  const context = poolContext;
  if (!context) throw new Error("Pool ou wallet indisponible.");
  const preset = settings.presets[index];
  if (!preset?.enabled) throw new Error("Preset désactivé.");

  const activeBin = await context.dlmm.getActiveBin();
  context.activeBinId = activeBin.binId;
  const range = calculateOneSidedRange(context.activeBinId, context.binStep, preset.lowerPct, context.solIsTokenX);
  const price = settings.portfolioUnit === "USD" ? await solUsdPrice() : undefined;
  const allocationSol = calculateAllocationSol(settings.portfolioValue, settings.portfolioUnit, preset.allocationPct, price);
  const amountLamports = BigInt(Math.floor(allocationSol * 1e9));
  const [balanceLamports, costs] = await Promise.all([
    context.connection.getBalance(context.wallet, "confirmed"),
    estimateCosts(context, range)
  ]);
  const rentAndFeesSol = costs.totalSol;
  const solBalance = balanceLamports / 1e9;
  const required = allocationSol + rentAndFeesSol;
  let blocker: string | undefined;
  if (!(settings.portfolioValue > 0)) blocker = "Renseigne la taille du portfolio dans le popup.";
  else if (amountLamports <= 0n) blocker = "Le montant calculé est trop faible.";
  else if (solBalance < required) blocker = `Solde insuffisant : ${required.toFixed(4)} SOL requis, ${solBalance.toFixed(4)} disponible.`;

  const prices = [humanPriceForBin(context, range.minBinId), humanPriceForBin(context, range.maxBinId)].sort((a, b) => a - b);
  const portfolioText = settings.portfolioUnit === "SOL"
    ? `${settings.portfolioValue} SOL × ${preset.allocationPct}%`
    : `$${settings.portfolioValue} × ${preset.allocationPct}%`;
  const view: PreviewView = {
    preset,
    allocationSol,
    portfolioText,
    minPrice: prices[0],
    maxPrice: prices[1],
    binCount: range.binCount,
    rentAndFeesSol,
    nonRefundableSol: costs.nonRefundableSol,
    newBinArrays: costs.newBinArrays,
    needsBitmapExtension: costs.needsBitmapExtension,
    remainingSol: solBalance - required,
    solUsdPrice: price,
    canCreate: !blocker,
    blocker
  };
  return {
    pool: context,
    preset,
    presetIndex: index,
    allocationSol,
    amountLamports,
    range,
    rentAndFeesSol,
    nonRefundableSol: costs.nonRefundableSol,
    newBinArrays: costs.newBinArrays,
    needsBitmapExtension: costs.needsBitmapExtension,
    solBalance,
    solUsdPrice: price,
    view
  };
}

async function selectPreset(index: number): Promise<void> {
  if (creating) return;
  ui.setBusy("Calcul de la position…");
  try {
    preview = await preparePreview(index);
    ui.setPreview(preview.view);
  } catch (error) {
    preview = null;
    ui.setPreview(null);
    ui.setError(errorMessage(error));
  }
}

function priorityMicroLamports(): number {
  const desired = settings.priorityLevel === "medium" ? 50_000
    : settings.priorityLevel === "high" ? 200_000
      : 1_000_000;
  const cap = Math.floor(settings.maxPriorityLamports * 1_000_000 / MAX_COMPUTE_UNITS);
  return Math.max(0, Math.min(desired, cap));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue.";
}

async function confirmTransaction(
  connection: Connection,
  signature: string,
  blockhash: string,
  lastValidBlockHeight: number
): Promise<void> {
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) {
    const details = await connection.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    const log = details?.meta?.logMessages?.slice(-3).join(" | ");
    throw new Error(log ? `Transaction échouée : ${log}` : `Transaction échouée : ${JSON.stringify(result.value.err)}`);
  }
}

async function createPosition(): Promise<void> {
  if (creating) return;
  const selected = ui.selectedPreset();
  if (selected === null) return ui.setError("Sélectionne un preset.");
  creating = true;
  ui.setBusy("Recalcul du prix actif…");
  try {
    const fresh = await preparePreview(selected, true);
    preview = fresh;
    ui.setPreview(fresh.view);
    if (!fresh.view.canCreate) throw new Error(fresh.view.blocker ?? "Position invalide.");

    const provider = getProvider();
    if (!provider) throw new Error("Wallet introuvable.");
    const wallet = await ensureConnectedWallet(provider);
    if (!wallet.equals(fresh.pool.wallet)) throw new Error("Le wallet connecté a changé. Actualise le panneau.");

    ui.setBusy("Construction de la position…");
    const generatedPositions: Keypair[] = [];
    const keypairGenerator = async (count: number): Promise<Keypair[]> => {
      const created = Array.from({ length: count }, () => Keypair.generate());
      generatedPositions.push(...created);
      return created;
    };
    const amount = new BN(fresh.amountLamports.toString());
    const totalXAmount = fresh.pool.solIsTokenX ? amount : new BN(0);
    const totalYAmount = fresh.pool.solIsTokenX ? new BN(0) : amount;
    const strategy = {
      minBinId: fresh.range.minBinId,
      maxBinId: fresh.range.maxBinId,
      strategyType: strategyType(fresh.preset),
      singleSidedX: fresh.pool.solIsTokenX
    };
    const slippageOneBinPct = fresh.pool.binStep / 100;
    const built = await fresh.pool.dlmm.initializeMultiplePositionAndAddLiquidityByStrategy2(
      keypairGenerator,
      totalXAmount,
      totalYAmount,
      strategy,
      wallet,
      wallet,
      slippageOneBinPct
    );

    const blockhash = await fresh.pool.connection.getLatestBlockhash("confirmed");
    const lookupTableAccounts: AddressLookupTableAccount[] = [];
    if (built.lookupTableAddress) {
      const lookupTable = await fresh.pool.connection.getAddressLookupTable(built.lookupTableAddress);
      if (!lookupTable.value) throw new Error("Table d’adresses Meteora introuvable.");
      lookupTableAccounts.push(lookupTable.value);
    }
    const transactions: VersionedTransaction[] = [];
    const groupSizes: number[] = [];
    for (const item of built.instructionsByPositions) {
      const positionTransactions: VersionedTransaction[] = [];
      for (const instructions of item.transactionInstructions) {
        const priorityIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityMicroLamports() });
        const message = new TransactionMessage({
          payerKey: wallet,
          recentBlockhash: blockhash.blockhash,
          instructions: [priorityIx, ...instructions]
        }).compileToV0Message(lookupTableAccounts);
        const transaction = new VersionedTransaction(message);
        transaction.sign([item.positionKeypair]);
        positionTransactions.push(transaction);
      }
      groupSizes.push(positionTransactions.length);
      transactions.push(...positionTransactions);
    }
    if (!transactions.length) throw new Error("Meteora n’a construit aucune transaction.");

    if (settings.simulateBeforeSend) {
      ui.setBusy(`Simulation de ${transactions.length} transaction(s)…`);
      for (const transaction of transactions) {
        const simulation = await fresh.pool.connection.simulateTransaction(transaction, { sigVerify: false });
        if (simulation.value.err) {
          const log = simulation.value.logs?.slice(-4).join(" | ");
          throw new Error(log ? `Simulation refusée : ${log}` : `Simulation refusée : ${JSON.stringify(simulation.value.err)}`);
        }
      }
    }

    ui.setBusy("Signature wallet…");
    let signed: VersionedTransaction[];
    if (provider.signAllTransactions) {
      signed = await provider.signAllTransactions(transactions);
    } else if (provider.signTransaction) {
      signed = [];
      for (const transaction of transactions) signed.push(await provider.signTransaction(transaction));
    } else {
      throw new Error("Ce wallet ne permet pas de signer les transactions.");
    }

    ui.setBusy("Envoi séquentiel sur Solana…");
    const signatures: string[] = [];
    let signedOffset = 0;
    for (let groupIndex = 0; groupIndex < groupSizes.length; groupIndex++) {
      const size = groupSizes[groupIndex];
      for (let transactionIndex = 0; transactionIndex < size; transactionIndex++) {
        ui.setBusy(`Position ${groupIndex + 1}/${groupSizes.length} · étape ${transactionIndex + 1}/${size}…`);
        const transaction = signed[signedOffset++];
        const signature = await fresh.pool.connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: !settings.simulateBeforeSend,
          maxRetries: 3
        });
        signatures.push(signature);
        await confirmTransaction(fresh.pool.connection, signature, blockhash.blockhash, blockhash.lastValidBlockHeight);
      }
    }
    const result: ResultView = {
      signatures,
      positions: generatedPositions.map((position) => position.publicKey.toBase58())
    };
    ui.setSuccess(result);
  } catch (error) {
    ui.setError(errorMessage(error));
  } finally {
    creating = false;
  }
}

async function boot(): Promise<void> {
  ui = mountUI({
    onPreset: (index) => void selectPreset(index),
    onCreate: () => void createPosition(),
    onRefresh: () => void loadPool(),
    onPanelChange: savePanel
  });
  settings = await requestSettings();
  ui.syncSettings(settings);
  await loadPool();
  window.setInterval(() => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    void loadPool();
  }, 1_000);
  console.info(`[MeteoraQuickSetup] v${VERSION} prêt`);
}

void boot();
