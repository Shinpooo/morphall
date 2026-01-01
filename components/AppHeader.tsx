"use client";

import {
  AppKitAccountButton,
  AppKitConnectButton,
  AppKitNetworkButton,
  useAppKitAccount,
  useAppKit,
  useAppKitState,
} from "@reown/appkit/react";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AppHeader() {
  const { isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { close } = useAppKit();
  const router = useRouter();
  const pathname = usePathname();
  const lastNetworkIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedNetworkId) return;
    if (!selectedNetworkId.startsWith("eip155:")) return;
    const chainId = selectedNetworkId.split(":")[1];
    if (!chainId) return;
    if (!pathname) return;

    if (lastNetworkIdRef.current == null) {
      lastNetworkIdRef.current = selectedNetworkId;
      return;
    }

    if (lastNetworkIdRef.current === selectedNetworkId) return;
    lastNetworkIdRef.current = selectedNetworkId;

    const pathParts = pathname.split("/").filter(Boolean);
    const currentChainId = pathParts.length >= 2 ? pathParts[1] : null;
    if (pathname.startsWith("/earn") && currentChainId === chainId) return;

    close();
    router.push(`/earn/${chainId}`);
  }, [selectedNetworkId, pathname, router, close]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0c0d0f]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <span className="text-sm font-semibold text-zinc-100">M</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-zinc-100">morphall</p>
            <p className="text-xs text-zinc-500">Vaults</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
          <a className="text-zinc-100 hover:text-zinc-50" href="/earn/8453">
            Earn
          </a>
        </nav>

        <div className="flex items-center gap-3 pr-2">
          <div className="scale-105">
            <AppKitNetworkButton />
          </div>
          {isConnected ? (
            <div className="scale-105">
              <AppKitAccountButton balance={false} />
            </div>
          ) : (
            <AppKitConnectButton label="Connect wallet" />
          )}
        </div>
      </div>
    </header>
  );
}
