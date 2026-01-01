import EarnVaultsTable from "../../../components/EarnVaultsTable";

type VaultItem = {
  address: string;
  name: string;
  symbol: string;
  version: "V1" | "V2";
  whitelisted: boolean;
  totalAssets: string;
  totalAssetsUsd: string;
  totalSupply: string;
  liquidityUsd: string;
  avgNetApy?: number | string;
  asset: {
    address: string;
    symbol: string;
    decimals: number;
  };
};

async function fetchVaults(chainId: number) {
  const [v2Response, v1Response] = await Promise.all([
    fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "query VaultsV2($chainId: Int!) { vaultV2s(first: 200, where: { chainId_in: [$chainId] }) { items { address name symbol whitelisted totalAssets totalAssetsUsd totalSupply liquidityUsd avgNetApy asset { address symbol decimals } } } }",
        variables: { chainId },
      }),
      next: { revalidate: 30 },
    }),
    fetch("https://api.morpho.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query:
          "query VaultsV1($chainId: Int!) { vaults(first: 200, where: { chainId_in: [$chainId] }) { items { address name symbol whitelisted asset { address symbol decimals } state { totalAssets totalAssetsUsd netApy } } } }",
        variables: { chainId },
      }),
      next: { revalidate: 30 },
    }),
  ]);

  const v2Payload = v2Response.ok
    ? ((await v2Response.json()) as {
        data?: { vaultV2s?: { items: VaultItem[] } };
      })
    : undefined;
  const v1Payload = v1Response.ok
    ? ((await v1Response.json()) as {
        data?: {
          vaults?: {
            items: Array<{
              address: string;
              name: string;
              symbol: string;
              whitelisted: boolean;
              asset?: { address: string; symbol: string; decimals: number };
              state?: {
                totalAssets?: string | number;
                totalAssetsUsd?: string | number;
                netApy?: string | number;
              };
            }>;
          };
        };
      })
    : undefined;

  const v2Vaults =
    v2Payload?.data?.vaultV2s?.items?.map((vault) => ({
      ...vault,
      version: "V2" as const,
    })) ?? [];

  const v1Vaults =
    v1Payload?.data?.vaults?.items?.map((vault) => ({
      address: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      version: "V1" as const,
      whitelisted: vault.whitelisted,
      totalAssets: String(vault.state?.totalAssets ?? "0"),
      totalAssetsUsd: String(vault.state?.totalAssetsUsd ?? "0"),
      totalSupply: "0",
      liquidityUsd: String(vault.state?.totalAssetsUsd ?? "0"),
      avgNetApy:
        vault.state?.netApy != null ? Number(vault.state.netApy) : undefined,
      asset: vault.asset ?? {
        address: "",
        symbol: vault.symbol || "",
        decimals: 18,
      },
    })) ?? [];

  return [...v2Vaults, ...v1Vaults];
}

export const revalidate = 30;

export default async function EarnPage({
  params,
}: {
  params: Promise<{ chainId: string }>;
}) {
  const { chainId } = await params;
  const chainIdNumber = Number(chainId);
  const vaults = await fetchVaults(chainIdNumber);

  return (
    <div className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">
            Earn
          </h1>
          <p className="text-sm text-zinc-400">
            All vaults for chain {chainIdNumber}.
          </p>
        </div>

        <EarnVaultsTable vaults={vaults} chainId={chainIdNumber} />
      </div>
    </div>
  );
}
