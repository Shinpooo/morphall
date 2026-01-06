"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, ListFilter, Search } from "lucide-react";

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

type SortKey = "totalAssetsUsd" | "liquidityUsd" | "avgNetApy";

function formatUsd(value?: string) {
  if (!value) return "—";
  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed)) return "—";
  return `$${formatCompact(parsed)}`;
}

function formatToken(value?: string, symbol?: string, decimals?: number) {
  if (!value || !symbol || decimals == null) return "—";
  const base = Number.parseFloat(String(value));
  if (Number.isNaN(base)) return "—";
  const scaled = base / 10 ** decimals;
  return `${formatCompact(scaled)} ${symbol}`;
}

function formatTokenFromUnits(
  units?: number,
  symbol?: string
) {
  if (units == null || !symbol) return "—";
  return `${formatCompact(units)} ${symbol}`;
}

function formatApy(value?: number | string) {
  if (value == null) return "—";
  const parsed = Number.parseFloat(String(value));
  if (Number.isNaN(parsed)) return "—";
  return `${(parsed * 100).toFixed(2)}%`;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function computePriceUsd(totalAssetsUsd?: string, totalAssets?: string, decimals?: number) {
  if (!totalAssetsUsd || !totalAssets || decimals == null) return null;
  const usd = Number.parseFloat(String(totalAssetsUsd));
  const raw = Number.parseFloat(String(totalAssets));
  if (Number.isNaN(usd) || Number.isNaN(raw) || raw === 0) return null;
  const units = raw / 10 ** decimals;
  if (units === 0) return null;
  return usd / units;
}

export default function EarnVaultsTable({
  vaults,
  chainId,
}: {
  vaults: VaultItem[];
  chainId: number;
}) {
  const [search, setSearch] = useState("");
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isVersionFilterOpen, setIsVersionFilterOpen] = useState(false);
  const [isAssetFilterOpen, setIsAssetFilterOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set()
  );
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(
    new Set()
  );
  const assetFilterRef = useRef<HTMLDivElement | null>(null);
  const statusFilterRef = useRef<HTMLDivElement | null>(null);
  const versionFilterRef = useRef<HTMLDivElement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("totalAssetsUsd");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vaults
      .filter((vault) => {
        if (selectedStatuses.size === 0) return true;
        const status = vault.whitelisted ? "Whitelisted" : "Non-whitelisted";
        return selectedStatuses.has(status);
      })
      .filter((vault) => {
        if (selectedVersions.size === 0) return true;
        return selectedVersions.has(vault.version);
      })
      .filter((vault) => {
        if (selectedAssets.size === 0) return true;
        const symbol = vault.asset.symbol || vault.symbol;
        return selectedAssets.has(symbol);
      })
      .filter((vault) => {
        if (!query) return true;
        return (
          vault.name.toLowerCase().includes(query) ||
          vault.symbol.toLowerCase().includes(query) ||
          vault.asset.symbol.toLowerCase().includes(query) ||
          vault.address.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const direction = sortDirection === "desc" ? -1 : 1;
        if (sortKey === "avgNetApy") {
          const aValue = Number.parseFloat(String(a.avgNetApy ?? "0"));
          const bValue = Number.parseFloat(String(b.avgNetApy ?? "0"));
          return (aValue - bValue) * direction;
        }
        const aValue = Number.parseFloat(String(a[sortKey] ?? "0"));
        const bValue = Number.parseFloat(String(b[sortKey] ?? "0"));
        return (aValue - bValue) * direction;
      });
  }, [
    vaults,
    search,
    sortDirection,
    sortKey,
    selectedAssets,
    selectedStatuses,
    selectedVersions,
  ]);

  const assetOptions = useMemo(() => {
    const symbols = new Set<string>();
    vaults.forEach((vault) => {
      const symbol = vault.asset.symbol || vault.symbol;
      if (symbol) symbols.add(symbol);
    });
    return Array.from(symbols).sort((a, b) => a.localeCompare(b));
  }, [vaults]);

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return assetOptions;
    return assetOptions.filter((symbol) =>
      symbol.toLowerCase().includes(query)
    );
  }, [assetOptions, assetSearch]);

  const toggleAsset = (symbol: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleVersion = (version: string) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isAssetFilterOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!assetFilterRef.current) return;
      if (!assetFilterRef.current.contains(event.target as Node)) {
        setIsAssetFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isAssetFilterOpen]);

  useEffect(() => {
    if (!isStatusFilterOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!statusFilterRef.current) return;
      if (!statusFilterRef.current.contains(event.target as Node)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isStatusFilterOpen]);

  useEffect(() => {
    if (!isVersionFilterOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!versionFilterRef.current) return;
      if (!versionFilterRef.current.contains(event.target as Node)) {
        setIsVersionFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isVersionFilterOpen]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={statusFilterRef}>
            <button
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                selectedStatuses.size > 0
                  ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/30"
              }`}
              onClick={() => setIsStatusFilterOpen((prev) => !prev)}
              type="button"
            >
              <ListFilter className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              Status
              <span className="text-zinc-400">
                {selectedStatuses.size > 0
                  ? `${selectedStatuses.size} selected`
                  : "All"}
              </span>
            </button>
            {isStatusFilterOpen ? (
              <div className="absolute left-0 top-12 z-30 w-64 rounded-2xl border border-white/10 bg-[#1f2126] p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span>Status</span>
                  <button
                    className="text-zinc-400 transition hover:text-zinc-200"
                    onClick={() => setSelectedStatuses(new Set())}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-200">
                  {["Whitelisted", "Non-whitelisted"].map((status) => (
                    <label
                      key={status}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-white/20"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.has(status)}
                        onChange={() => toggleStatus(status)}
                        className="h-4 w-4 rounded border border-white/20 bg-transparent"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative" ref={versionFilterRef}>
            <button
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                selectedVersions.size > 0
                  ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/30"
              }`}
              onClick={() => setIsVersionFilterOpen((prev) => !prev)}
              type="button"
            >
              <ListFilter className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              Version
              <span className="text-zinc-400">
                {selectedVersions.size > 0
                  ? `${selectedVersions.size} selected`
                  : "All"}
              </span>
            </button>
            {isVersionFilterOpen ? (
              <div className="absolute left-0 top-12 z-30 w-56 rounded-2xl border border-white/10 bg-[#1f2126] p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span>Version</span>
                  <button
                    className="text-zinc-400 transition hover:text-zinc-200"
                    onClick={() => setSelectedVersions(new Set())}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 space-y-2 text-sm text-zinc-200">
                  {["V1", "V2"].map((version) => (
                    <label
                      key={version}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-white/20"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVersions.has(version)}
                        onChange={() => toggleVersion(version)}
                        className="h-4 w-4 rounded border border-white/20 bg-transparent"
                      />
                      <span>{version}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="relative" ref={assetFilterRef}>
            <button
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                selectedAssets.size > 0
                  ? "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/30"
              }`}
              onClick={() => setIsAssetFilterOpen((prev) => !prev)}
              type="button"
            >
              <ListFilter className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              Deposit
              <span className="text-zinc-400">
                {selectedAssets.size > 0
                  ? `${selectedAssets.size} selected`
                  : "All"}
              </span>
            </button>

            {isAssetFilterOpen ? (
              <div className="absolute left-0 top-12 z-30 w-72 rounded-2xl border border-white/10 bg-[#1f2126] p-4 shadow-xl">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                    placeholder="Search deposit asset"
                    value={assetSearch}
                    onChange={(event) => setAssetSearch(event.target.value)}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span>Assets</span>
                  <button
                    className="text-zinc-400 transition hover:text-zinc-200"
                    onClick={() => setSelectedAssets(new Set())}
                    type="button"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1 text-sm text-zinc-200">
                  {filteredAssets.map((symbol) => (
                    <label
                      key={symbol}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition hover:border-white/20"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssets.has(symbol)}
                        onChange={() => toggleAsset(symbol)}
                        className="h-4 w-4 rounded border border-white/20 bg-transparent"
                      />
                      <span>{symbol}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              placeholder="Filter vaults"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#14161a]">
        <div className="grid grid-cols-7 gap-4 border-b border-white/10 bg-[color:var(--accent)]/5 px-6 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span>Vault</span>
          <button
            className={`group flex items-center gap-2 text-left transition ${
              sortKey === "totalAssetsUsd" ? "text-[color:var(--accent)]" : ""
            }`}
            onClick={() => handleSort("totalAssetsUsd")}
            type="button"
          >
            Deposits
            <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-zinc-300" />
          </button>
          <button
            className={`group flex items-center gap-2 text-left transition ${
              sortKey === "liquidityUsd" ? "text-[color:var(--accent)]" : ""
            }`}
            onClick={() => handleSort("liquidityUsd")}
            type="button"
          >
            Liquidity
            <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-zinc-300" />
          </button>
          <span>Asset</span>
          <button
            className={`group flex items-center gap-2 text-left transition ${
              sortKey === "avgNetApy" ? "text-[color:var(--accent)]" : ""
            }`}
            onClick={() => handleSort("avgNetApy")}
            type="button"
          >
            APY
            <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-500 transition group-hover:text-zinc-300" />
          </button>
          <span>Version</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map((vault) => (
            <a
              key={vault.address}
              href={`/vaults/${chainId}/${vault.address}`}
              className="group grid grid-cols-7 items-center gap-4 px-6 py-5 text-sm text-zinc-200 transition hover:bg-white/5"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-100">
                  {vault.name || vault.symbol}
                </p>
                <p className="font-mono text-xs text-zinc-500">
                  {vault.address.slice(0, 6)}…{vault.address.slice(-4)}
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  {formatToken(
                    vault.totalAssets,
                    vault.asset.symbol || vault.symbol,
                    vault.asset.decimals
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatUsd(vault.totalAssetsUsd)}
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  {(() => {
                    const price = computePriceUsd(
                      vault.totalAssetsUsd,
                      vault.totalAssets,
                      vault.asset.decimals
                    );
                    const liquidityUsd = Number.parseFloat(
                      String(vault.liquidityUsd ?? "0")
                    );
                    if (!price || Number.isNaN(liquidityUsd)) {
                      return "—";
                    }
                    return formatTokenFromUnits(
                      liquidityUsd / price,
                      vault.asset.symbol || vault.symbol
                    );
                  })()}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatUsd(vault.liquidityUsd)}
                </p>
              </div>
              <div className="text-sm text-zinc-300">
                {vault.asset.symbol || vault.symbol}
              </div>
              <div className="text-sm text-zinc-100">
                {formatApy(vault.avgNetApy)}
              </div>
              <div className="text-xs text-zinc-400">{vault.version}</div>
              <div className="text-xs text-zinc-400">
                {vault.whitelisted ? "Whitelisted" : "Not whitelisted"}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
