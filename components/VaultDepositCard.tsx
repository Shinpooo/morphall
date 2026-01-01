"use client";

import { useEffect, useMemo } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useReadContract } from "wagmi";
import { erc20Abi, formatUnits, getAddress } from "viem";

type VaultDepositCardProps = {
  chainId: number;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
};

function formatTokenAmount(value?: bigint, decimals?: number) {
  if (value == null || decimals == null) return "0.00";
  const parsed = Number.parseFloat(formatUnits(value, decimals));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    parsed
  );
}

export default function VaultDepositCard({
  chainId,
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
}: VaultDepositCardProps) {
  const { address, isConnected } = useAppKitAccount();
  const normalizedToken = getAddress(tokenAddress);
  const {
    data: balance,
    isLoading,
    isError,
    error,
  } = useReadContract({
    abi: erc20Abi,
    address: normalizedToken,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const formattedBalance = useMemo(
    () => formatTokenAmount(balance, tokenDecimals),
    [balance, tokenDecimals]
  );

  useEffect(() => {
    if (!balance) return;
    const raw = balance.toString();
    const formatted = formatUnits(balance, tokenDecimals);
    console.log("[VaultDepositCard] balance fetched", {
      chainId,
      tokenAddress: normalizedToken,
      wallet: address,
      raw,
      formatted,
      symbol: tokenSymbol,
    });
  }, [balance, tokenDecimals, tokenSymbol, address, chainId, normalizedToken]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#1b1d21] p-6">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Deposit {tokenSymbol}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
          {tokenSymbol.slice(0, 1)}
        </span>
      </div>
      <div className="mt-5 text-4xl font-semibold text-zinc-200">0.00</div>
      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
        <span>$0</span>
        <span className="flex items-center gap-2">
          {isLoading ? "…" : formattedBalance} {tokenSymbol}
          <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
            MAX
          </button>
        </span>
      </div>
      <div className="mt-3 space-y-1 text-xs text-zinc-500">
        <p>Wallet: {address ?? "Not connected"}</p>
        <p>Balance chainId: {chainId}</p>
        <p>Token: {normalizedToken}</p>
      </div>
      {isError ? (
        <p className="mt-3 text-xs text-rose-300">
          Balance unavailable: {error?.message ?? "Unknown error"}
        </p>
      ) : null}
    </div>
  );
}
