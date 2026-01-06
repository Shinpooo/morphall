"use client";

import { useEffect, useMemo, useState } from "react";
import {
  erc20Abi,
  formatUnits,
  getAddress,
  parseUnits,
} from "viem";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useChainId,
} from "wagmi";
import {
  metaMorphoAbi,
  vaultV2Abi,
} from "@morpho-org/blue-sdk-viem/lib/abis";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

type VaultActionsProps = {
  chainId: number;
  vaultAddress: `0x${string}`;
  assetAddress: `0x${string}`;
  assetSymbol: string;
  assetDecimals: number;
  vaultDecimals: number;
  apyLabel: string;
  vaultVersion: "V1" | "V2";
};

function formatTokenAmount(value?: bigint, decimals?: number) {
  if (value == null || decimals == null) return "0.00";
  const parsed = Number.parseFloat(formatUnits(value, decimals));
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(
    parsed
  );
}

function parseAmount(value: string, decimals: number) {
  if (!value || Number.isNaN(Number(value))) return 0n;
  return parseUnits(value, decimals);
}

export default function VaultActions({
  chainId,
  vaultAddress,
  assetAddress,
  assetSymbol,
  assetDecimals,
  vaultDecimals,
  apyLabel,
  vaultVersion,
}: VaultActionsProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const currentChainId = useChainId();
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const normalizedAsset = getAddress(assetAddress);

  const {
    data: assetBalance,
    refetch: refetchBalance,
  } = useReadContract({
    abi: erc20Abi,
    address: normalizedAsset,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const {
    data: allowance,
    refetch: refetchAllowance,
  } = useReadContract({
    abi: erc20Abi,
    address: normalizedAsset,
    functionName: "allowance",
    args: [address as `0x${string}`, vaultAddress],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const vaultAbi = vaultVersion === "V2" ? vaultV2Abi : metaMorphoAbi;

  const {
    data: shareBalance,
    refetch: refetchShares,
  } = useReadContract({
    abi: vaultAbi,
    address: vaultAddress,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const {
    data: maxWithdraw,
    refetch: refetchMaxWithdraw,
  } = useReadContract({
    abi: vaultAbi,
    address: vaultAddress,
    functionName: "maxWithdraw",
    args: [address as `0x${string}`],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const {
    data: previewAssets,
    refetch: refetchPreviewAssets,
  } = useReadContract({
    abi: vaultAbi,
    address: vaultAddress,
    functionName: "previewRedeem",
    args: [shareBalance ?? 0n],
    chainId,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  const parsedAmount = useMemo(
    () => parseAmount(amount, assetDecimals),
    [amount, assetDecimals]
  );

  const effectiveMaxWithdraw =
    vaultVersion === "V2"
      ? previewAssets ?? 0n
      : maxWithdraw ?? 0n;

  const needsApproval =
    mode === "deposit" &&
    parsedAmount > 0n &&
    (allowance ?? 0n) < parsedAmount;

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isSuccess) return;
    refetchBalance();
    refetchAllowance();
    refetchShares();
    refetchMaxWithdraw();
    refetchPreviewAssets();
  }, [
    isSuccess,
    refetchAllowance,
    refetchBalance,
    refetchMaxWithdraw,
    refetchPreviewAssets,
    refetchShares,
  ]);

  const isWrongNetwork =
    isConnected && currentChainId != null && currentChainId !== chainId;

  const actionLabel = (() => {
    if (!isConnected) return "Connect wallet";
    if (isWrongNetwork) return "Switch network";
    if (needsApproval) return `Approve ${assetSymbol}`;
    return mode === "deposit" ? "Deposit" : "Withdraw";
  })();

  const disabled =
    isPending || isConfirming || parsedAmount <= 0n || !isConnected;

  const handleAction = () => {
    if (!isConnected) {
      open();
      return;
    }
    if (isWrongNetwork) {
      open({ view: "Networks" });
      return;
    }
    if (!address) return;
    const userAddress = address as `0x${string}`;
    if (needsApproval) {
      writeContract({
        abi: erc20Abi,
        address: normalizedAsset,
        functionName: "approve",
        args: [vaultAddress, parsedAmount],
        chainId,
      });
      return;
    }
    if (mode === "deposit") {
      writeContract({
        abi: vaultAbi,
        address: vaultAddress,
        functionName: "deposit",
        args: [parsedAmount, userAddress],
        chainId,
      });
      return;
    }
    writeContract({
      abi: vaultAbi,
      address: vaultAddress,
      functionName: "withdraw",
      args: [parsedAmount, userAddress, userAddress],
      chainId,
    });
  };

  const handleMax = () => {
    if (mode === "deposit") {
      setAmount(formatUnits(assetBalance ?? 0n, assetDecimals));
    } else {
      setAmount(formatUnits(effectiveMaxWithdraw, assetDecimals));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <div className="flex items-center gap-6">
          <button
            className={`relative pb-2 text-sm transition ${
              mode === "deposit"
                ? "text-zinc-50 after:absolute after:left-0 after:top-full after:h-0.5 after:w-full after:bg-[var(--accent)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            onClick={() => setMode("deposit")}
          >
            Deposit
          </button>
          <button
            className={`relative pb-2 text-sm transition ${
              mode === "withdraw"
                ? "text-zinc-50 after:absolute after:left-0 after:top-full after:h-0.5 after:w-full after:bg-[var(--accent)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            onClick={() => setMode("withdraw")}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#1b1d21] p-6">
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            {mode === "deposit" ? "Deposit" : "Withdraw"} {assetSymbol}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5">
            {assetSymbol.slice(0, 1)}
          </span>
        </div>
        <input
          className="mt-5 w-full bg-transparent text-4xl font-semibold text-zinc-100 outline-none placeholder:text-zinc-600"
          placeholder="0.00"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>$0</span>
          <span className="flex items-center gap-2">
            {mode === "withdraw"
              ? `${formatTokenAmount(
                  effectiveMaxWithdraw,
                  assetDecimals
                )} ${assetSymbol}`
              : `${formatTokenAmount(assetBalance, assetDecimals)} ${assetSymbol}`}
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-white/30 hover:text-zinc-100"
              onClick={handleMax}
              type="button"
            >
              MAX
            </button>
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#1b1d21] p-6 text-sm text-zinc-300">
        <div className="flex items-center justify-between">
          <span>Shares ({assetSymbol})</span>
          <span className="text-zinc-400">
            {formatTokenAmount(shareBalance, vaultDecimals)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-zinc-400">
          <span>APY</span>
          <span className="text-zinc-100">{apyLabel}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-zinc-400">
          <span>Max withdraw</span>
          <span>
            {formatTokenAmount(effectiveMaxWithdraw, assetDecimals)} {assetSymbol}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 p-4 text-xs text-[color:var(--accent)]">
        Vaults are permissionless. Morphall surfaces both whitelisted and
        non-whitelisted vaults. Beware of malicious vaults and assess risk
        before depositing.
      </div>

      <button
        className="w-full rounded-full border border-white/10 bg-[color:var(--accent)] py-4 text-sm text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-zinc-500"
        onClick={handleAction}
        disabled={disabled}
      >
        {isPending || isConfirming ? "Confirming..." : actionLabel}
      </button>
    </div>
  );
}
