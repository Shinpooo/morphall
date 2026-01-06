import { notFound } from "next/navigation";
import {
  AccrualVault,
  AccrualVaultV2MorphoMarketV1Adapter,
  AccrualVaultV2MorphoMarketV1AdapterV2,
  AccrualVaultV2MorphoVaultV1Adapter,
  Token,
} from "@morpho-org/blue-sdk";
import "@morpho-org/blue-sdk-viem/lib/augment";
import { fetchAccrualVaultV2 } from "@morpho-org/blue-sdk-viem/lib/fetch/vault-v2/VaultV2";
import {
  createPublicClient,
  formatUnits,
  http,
  isAddress,
  zeroAddress,
} from "viem";
import type { PublicClient } from "viem";
import {
  arbitrum,
  base,
  hyperEvm,
  mainnet,
  monad,
  polygon,
  unichain,
} from "viem/chains";
import VaultActions from "../../../../components/VaultActions";
import CopyButton from "../../../../components/CopyButton";

const CHAIN_CONFIG = {
  1: { chain: mainnet, label: "Ethereum", rpcEnv: "RPC_URL_MAINNET" },
  143: { chain: monad, label: "Monad", rpcEnv: "RPC_URL_MONAD" },
  42161: { chain: arbitrum, label: "Arbitrum", rpcEnv: "RPC_URL_ARBITRUM" },
  8453: { chain: base, label: "Base", rpcEnv: "RPC_URL_BASE" },
  999: { chain: hyperEvm, label: "HyperEVM", rpcEnv: "RPC_URL_HYPEREVM" },
  137: { chain: polygon, label: "Polygon", rpcEnv: "RPC_URL_POLYGON" },
  130: { chain: unichain, label: "Unichain", rpcEnv: "RPC_URL_UNICHAIN" },
} as const;

type ChainId = keyof typeof CHAIN_CONFIG;

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatAmount(value: bigint, decimals: number) {
  const parsed = Number.parseFloat(formatUnits(value, decimals));
  return numberFormatter.format(parsed);
}

function formatUsd(value: bigint | undefined) {
  if (value == null) return "—";
  const parsed = Number.parseFloat(formatUnits(value, 18));
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(parsed);
  return `$${compact}`;
}

function formatPercent(value: number) {
  return `${numberFormatter.format(value)}%`;
}

function ratioToPercent(numerator: bigint, denominator: bigint) {
  if (denominator === 0n) return 0;
  const scaled = (numerator * 10000n) / denominator;
  return Number(scaled) / 100;
}

function parseUsdToWad(value: string | number | null | undefined) {
  if (value == null) return 0n;
  const asString = typeof value === "string" ? value : String(value);
  if (asString.includes("e") || asString.includes("E")) {
    const numeric = Number(asString);
    if (!Number.isFinite(numeric)) return 0n;
    const fixed = numeric.toFixed(18);
    const [whole, fraction = ""] = fixed.split(".");
    const paddedFraction = `${fraction}000000000000000000`.slice(0, 18);
    return BigInt(whole || "0") * 10n ** 18n + BigInt(paddedFraction || "0");
  }
  const [whole, fraction = ""] = asString.split(".");
  const paddedFraction = `${fraction}000000000000000000`.slice(0, 18);
  return BigInt(whole || "0") * 10n ** 18n + BigInt(paddedFraction || "0");
}

function computeTokenFromUsd(
  usdValue: bigint | undefined,
  totalAssetsUsd: bigint | undefined,
  totalAssetsRaw: bigint,
  decimals: number
) {
  if (!usdValue || !totalAssetsUsd || totalAssetsRaw === 0n) return null;
  const price = Number.parseFloat(formatUnits(totalAssetsUsd, 18)) /
    Number.parseFloat(formatUnits(totalAssetsRaw, decimals));
  if (!Number.isFinite(price) || price === 0) return null;
  const liquidityUsd = Number.parseFloat(formatUnits(usdValue, 18));
  const units = liquidityUsd / price;
  const scaled = BigInt(Math.floor(units * 10 ** decimals));
  return scaled;
}

async function fetchMorphoVaultUsd(chainId: ChainId, address: string) {
  const responseV2 = await fetch("https://api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "query VaultUsdV2($address: String!, $chainId: Int!) { vaultV2ByAddress(address: $address, chainId: $chainId) { totalAssetsUsd liquidityUsd } }",
      variables: { address, chainId },
    }),
    next: { revalidate: 30 },
  });

  if (responseV2.ok) {
    const payload = (await responseV2.json()) as {
      data?: {
        vaultV2ByAddress?: {
          totalAssetsUsd: string | number;
          liquidityUsd: string | number;
        };
      };
      errors?: Array<{ message: string }>;
    };
    const v2 = payload.data?.vaultV2ByAddress;
    if (v2?.totalAssetsUsd && v2?.liquidityUsd) {
      return {
        totalAssetsUsd: parseUsdToWad(v2.totalAssetsUsd),
        liquidityUsd: parseUsdToWad(v2.liquidityUsd),
      };
    }
  }

  const responseV1 = await fetch("https://api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "query VaultUsdV1($address: String!, $chainId: Int!) { vaultByAddress(address: $address, chainId: $chainId) { state { totalAssetsUsd } } }",
      variables: { address, chainId },
    }),
    next: { revalidate: 30 },
  });

  if (!responseV1.ok) return null;
  const payloadV1 = (await responseV1.json()) as {
    data?: {
      vaultByAddress?: {
        state?: { totalAssetsUsd?: string | number };
      };
    };
    errors?: Array<{ message: string }>;
  };
  const v1State = payloadV1.data?.vaultByAddress?.state;
  if (v1State?.totalAssetsUsd) {
    return {
      totalAssetsUsd: parseUsdToWad(v1State.totalAssetsUsd),
      liquidityUsd: parseUsdToWad(v1State.totalAssetsUsd),
    };
  }

  const responseV1List = await fetch("https://api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "query VaultUsdV1List($address: String!, $chainId: Int!) { vaults(where: { address_in: [$address], chainId_in: [$chainId] }) { items { state { totalAssetsUsd } } } }",
      variables: { address, chainId },
    }),
    next: { revalidate: 30 },
  });

  if (!responseV1List.ok) return null;
  const payloadV1List = (await responseV1List.json()) as {
    data?: {
      vaults?: { items: Array<{ state?: { totalAssetsUsd?: string | number } }> };
    };
  };
  const listState = payloadV1List.data?.vaults?.items?.[0]?.state;
  if (!listState?.totalAssetsUsd) return null;

  return {
    totalAssetsUsd: parseUsdToWad(listState.totalAssetsUsd),
    liquidityUsd: parseUsdToWad(listState.totalAssetsUsd),
  };
}

async function fetchMorphoVaultV2(
  chainId: ChainId,
  address: string
) {
  const response = await fetch("https://api.morpho.org/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query:
        "query VaultV2($address: String!, $chainId: Int!) { vaultV2ByAddress(address: $address, chainId: $chainId) { address name symbol totalAssets totalAssetsUsd totalSupply liquidityUsd avgNetApy asset { address symbol decimals } adapters { items { address assets assetsUsd type } } } }",
      variables: { address, chainId },
    }),
    next: { revalidate: 30 },
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    data?: {
      vaultV2ByAddress?: {
        address: string;
        name: string;
        symbol: string;
        totalAssets: string;
        totalAssetsUsd: string;
        totalSupply: string;
        liquidityUsd: string;
        avgNetApy?: number | string;
        asset: { address: string; symbol: string; decimals: number };
        adapters?: { items?: Array<{ address: string; assets: string; assetsUsd: string; type: string }> };
      };
    };
  };
  return payload.data?.vaultV2ByAddress ?? null;
}

async function buildV2Allocations(
  address: `0x${string}`,
  client: unknown,
  chainId: ChainId,
  assetSymbolFallback: string
) {
  const typedClient = client as PublicClient;
  const accrualVaultV2 = await fetchAccrualVaultV2(address, typedClient, {
    chainId,
  });
  const tokenCache = new Map<string, Token>();

  const getToken = async (tokenAddress: `0x${string}`) => {
    if (tokenCache.has(tokenAddress)) return tokenCache.get(tokenAddress)!;
    const token = await Token.fetch(tokenAddress, typedClient, { chainId });
    tokenCache.set(tokenAddress, token);
    return token;
  };

  const allocations: Array<{
    marketId?: string;
    vaultAddress?: string;
    label: string;
    supplyAssets: bigint;
    allocationUsd: bigint | null;
    cap: bigint | null;
    apy: number | null;
    utilization: number | null;
  }> = [];

  for (const adapter of accrualVaultV2.accrualAdapters) {
    if (adapter instanceof AccrualVaultV2MorphoMarketV1Adapter) {
      for (const position of adapter.positions) {
        const market = position.market;
        const loanToken = await getToken(market.params.loanToken);
        const collateralToken =
          market.params.collateralToken === zeroAddress
            ? null
            : await getToken(market.params.collateralToken);
        const label = `${collateralToken?.symbol ?? "Idle"} / ${
          loanToken.symbol ?? assetSymbolFallback
        }`;

        allocations.push({
          marketId: market.id,
          label,
          supplyAssets: position.supplyAssets,
          allocationUsd: loanToken.toUsd?.(position.supplyAssets) ?? null,
          cap: null,
          apy: market.supplyApy,
          utilization:
            Number.parseFloat(formatUnits(market.utilization, 18)) * 100,
        });
      }
      continue;
    }

    if (adapter instanceof AccrualVaultV2MorphoMarketV1AdapterV2) {
      for (const market of adapter.markets) {
        const loanToken = await getToken(market.params.loanToken);
        const collateralToken =
          market.params.collateralToken === zeroAddress
            ? null
            : await getToken(market.params.collateralToken);
        const label = `${collateralToken?.symbol ?? "Idle"} / ${
          loanToken.symbol ?? assetSymbolFallback
        }`;
        const shares = adapter.supplyShares[market.id] ?? 0n;
        const supplyAssets = market.toSupplyAssets(shares);

        allocations.push({
          marketId: market.id,
          label,
          supplyAssets,
          allocationUsd: loanToken.toUsd?.(supplyAssets) ?? null,
          cap: null,
          apy: market.supplyApy,
          utilization:
            Number.parseFloat(formatUnits(market.utilization, 18)) * 100,
        });
      }
      continue;
    }

    if (adapter instanceof AccrualVaultV2MorphoVaultV1Adapter) {
      const adapterAssets = adapter.accrualVaultV1
        .accrueInterest()
        .toAssets(adapter.shares);
      allocations.push({
        label: `Vault V1: ${adapter.accrualVaultV1.name ?? adapter.morphoVaultV1}`,
        vaultAddress: adapter.accrualVaultV1.address,
        supplyAssets: adapterAssets,
        allocationUsd: null,
        cap: null,
        apy: adapter.accrualVaultV1.netApy,
        utilization: null,
      });
      continue;
    }

    allocations.push({
      label: "Adapter",
      supplyAssets: 0n,
      allocationUsd: null,
      cap: null,
      apy: null,
      utilization: null,
    });
  }

  return allocations;
}

async function fetchVaultData(chainId: ChainId, address: `0x${string}`) {
  const config = CHAIN_CONFIG[chainId];
  const rpcUrl = process.env[config.rpcEnv];
  if (!rpcUrl) {
    return { error: `Missing ${config.rpcEnv} environment variable.` };
  }

  const transportSettings = (() => {
    if (chainId === 143) {
      return { batchSize: 30, wait: 20, retryCount: 2, retryDelay: 150 };
    }
    return { batchSize: 20, wait: 80, retryCount: 3, retryDelay: 250 };
  })();

  const client = createPublicClient({
    chain: config.chain,
    transport: http(rpcUrl, {
      batch: { batchSize: transportSettings.batchSize, wait: transportSettings.wait },
      retryCount: transportSettings.retryCount,
      retryDelay: transportSettings.retryDelay,
    }),
  });

  const v2Vault = await fetchMorphoVaultV2(chainId, address);
  if (v2Vault) {
    const assetToken = v2Vault.asset;
    const vaultShareToken = await Token.fetch(address, client, { chainId });
    const v2Allocations = await buildV2Allocations(
      address,
      client,
      chainId,
      assetToken.symbol ?? "Asset"
    );
    const totalAssetsRaw = BigInt(v2Vault.totalAssets);
    const totalAssetsUsd = parseUsdToWad(v2Vault.totalAssetsUsd);
    const liquidityUsd = v2Vault.liquidityUsd
      ? parseUsdToWad(v2Vault.liquidityUsd)
      : undefined;
    const liquidityRaw = computeTokenFromUsd(
      liquidityUsd,
      totalAssetsUsd,
      totalAssetsRaw,
      assetToken.decimals
    );
    return {
      version: "V2" as const,
      chainLabel: config.label,
      name: v2Vault.name,
      symbol: v2Vault.symbol,
      assetToken,
      vaultDecimals: vaultShareToken.decimals,
        totalAssetsRaw,
        totalAssetsUsd,
        liquidityRaw,
        liquidityUsd,
        netApy: v2Vault.avgNetApy != null ? Number(v2Vault.avgNetApy) : null,
      allocations: v2Allocations,
    };
  }

  let vault;
  try {
    vault = await AccrualVault.fetch(address, client, { chainId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "RPC request failed.";
    return {
      error: `Vault RPC request failed. ${message.includes("429") ? "Rate limited by RPC." : message}`,
    };
  }

  const assetToken = await Token.fetch(vault.asset, client, { chainId });
  const vaultUsd = await fetchMorphoVaultUsd(chainId, address);
  const allocationEntries = Array.from(vault.allocations.values());
  const allocations = await Promise.all(
    allocationEntries.map(async (allocation) => {
      const market = allocation.position.market;
      const loanToken = await Token.fetch(market.params.loanToken, client, {
        chainId,
      });
      const collateralToken =
        market.params.collateralToken === zeroAddress
          ? null
          : await Token.fetch(market.params.collateralToken, client, {
              chainId,
            });

      return {
        label: `${collateralToken?.symbol ?? "Idle"} / ${
          loanToken.symbol ?? assetToken.symbol ?? "Asset"
        }`,
        marketId: market.id,
        vaultAddress: undefined,
        supplyAssets: allocation.position.supplyAssets,
        allocationUsd: loanToken.toUsd?.(allocation.position.supplyAssets) ?? null,
        cap: allocation.config.cap,
        apy: market.supplyApy,
        utilization: Number.parseFloat(formatUnits(market.utilization, 18)) * 100,
      };
    })
  );

  return {
    version: "V1" as const,
    chainLabel: config.label,
    name: vault.name,
    symbol: vault.symbol,
    assetToken,
    vaultDecimals: vault.decimals,
    totalAssetsRaw: vault.totalAssets,
    totalAssetsUsd: vaultUsd?.totalAssetsUsd,
    liquidityRaw: vault.liquidity,
    liquidityUsd: vaultUsd?.liquidityUsd,
    netApy: vault.netApy,
    allocations,
  };
}

export const revalidate = 15;

export default async function VaultPage({
  params,
}: {
  params: Promise<{ chainId: string; address: string }>;
}) {
  const resolvedParams = await params;
  const chainId = Number(resolvedParams.chainId) as ChainId;
  if (!(chainId in CHAIN_CONFIG)) {
    notFound();
  }

  const normalizedAddress = resolvedParams.address.toLowerCase();
  if (!isAddress(normalizedAddress)) {
    notFound();
  }

  const address = normalizedAddress as `0x${string}`;
  const data = await fetchVaultData(chainId, address);

  if ("error" in data) {
    return (
      <div className="min-h-screen bg-[#0f1012] px-6 py-16 text-zinc-100">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-semibold">Vault data unavailable</h1>
          <p className="mt-3 text-sm text-zinc-400">{data.error}</p>
        </div>
      </div>
    );
  }

  const {
    version,
    chainLabel,
    name,
    symbol,
    assetToken,
    vaultDecimals,
    totalAssetsRaw,
    totalAssetsUsd,
    liquidityRaw,
    liquidityUsd,
    netApy,
    allocations,
  } = data;
  const assetSymbol = assetToken.symbol ?? "Asset";
  const totalDeposits = formatAmount(totalAssetsRaw, assetToken.decimals);
  const liquidity = liquidityRaw
    ? formatAmount(liquidityRaw, assetToken.decimals)
    : "—";
  const apyPercent = Number.isFinite(netApy)
    ? `${numberFormatter.format((netApy ?? 0) * 100)}%`
    : "—";
  const totalDepositsUsdLabel = formatUsd(totalAssetsUsd);
  const liquidityUsdLabel = formatUsd(liquidityUsd);

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="relative overflow-hidden px-6 py-12 sm:px-12">
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {chainLabel}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                    {address.slice(0, 6)}…{address.slice(-4)}
                    <CopyButton value={address} />
                  </span>
                </div>
                <h1 className="text-4xl font-medium tracking-tight text-zinc-50 sm:text-6xl">
                  {name || symbol}
                </h1>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <span>{assetSymbol}</span>
                  <CopyButton value={assetToken.address} />
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Total Deposits</p>
                  <p className="text-3xl font-semibold text-zinc-50">
                    {totalDepositsUsdLabel}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {totalDeposits} {assetSymbol}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Liquidity</p>
                  <p className="text-3xl font-semibold text-zinc-50">
                    {liquidityUsdLabel}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {liquidity} {assetSymbol}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">APY</p>
                  <p className="text-3xl font-semibold text-zinc-50">
                    {apyPercent}
                  </p>
                  <p className="text-sm text-zinc-400">Net APY</p>
                </div>
              </div>

            </div>

            <div className="w-full max-w-md">
              <div className="mt-5">
                <VaultActions
                  chainId={chainId}
                  vaultAddress={address}
                  assetAddress={assetToken.address as `0x${string}`}
                  assetSymbol={assetSymbol}
                  assetDecimals={assetToken.decimals}
                  vaultDecimals={vaultDecimals}
                  apyLabel={apyPercent}
                  vaultVersion={version}
                />
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-[#14161a]">
            <div className="grid grid-cols-5 gap-4 border-b border-white/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <span>Market Exposure</span>
              <span>Vault Allocation</span>
              <span>Supply Cap</span>
              <span>APY</span>
              <span>Utilization</span>
            </div>
            <div className="divide-y divide-white/5">
              {allocations.map((allocation, index) => {
                const allocationPercent = ratioToPercent(
                  allocation.supplyAssets,
                  totalAssetsRaw
                );

                return (
                  <div
                    key={`${allocation.label}-${index}`}
                    className="grid grid-cols-5 items-center gap-4 px-6 py-5 text-sm text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                          {allocation.vaultAddress ? (
                            <a
                              className="text-zinc-100 hover:text-zinc-50"
                              href={`/vaults/${chainId}/${allocation.vaultAddress}`}
                            >
                              {allocation.label}
                            </a>
                          ) : (
                            allocation.label
                          )}
                          {allocation.marketId ? (
                            <CopyButton value={allocation.marketId} />
                          ) : null}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">
                          {formatPercent(allocationPercent)}
                        </span>
                      </div>
                    </div>
                    <div className="text-zinc-100">
                      {formatAmount(
                        allocation.supplyAssets,
                        assetToken.decimals
                      )}{" "}
                      {assetSymbol}
                    </div>
                    <div className="text-zinc-100">
                      {allocation.cap != null
                        ? `${formatAmount(allocation.cap, assetToken.decimals)} ${assetSymbol}`
                        : "—"}
                    </div>
                    <div className="text-zinc-100">
                      {allocation.apy != null
                        ? formatPercent(allocation.apy * 100)
                        : "—"}
                    </div>
                    <div className="text-zinc-100">
                      {allocation.utilization != null
                        ? formatPercent(allocation.utilization)
                        : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
