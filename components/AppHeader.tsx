"use client";

import {
  AppKitAccountButton,
  AppKitConnectButton,
  AppKitNetworkButton,
  useAppKitAccount,
  useAppKit,
  useAppKitState,
} from "@reown/appkit/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Vault } from "lucide-react";
import { Button } from "./ui/button";

export default function AppHeader() {
  const { isConnected } = useAppKitAccount();
  const { selectedNetworkId } = useAppKitState();
  const { close, open } = useAppKit();
  const router = useRouter();
  const pathname = usePathname();
  const lastNetworkIdRef = useRef<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedNetworkId) return;
    if (!selectedNetworkId.startsWith("eip155:")) return;
    const chainId = selectedNetworkId.split(":")[1];
    if (!chainId) return;
    if (!pathname) return;
    if (pathname === "/") return;

    if (lastNetworkIdRef.current == null) {
      lastNetworkIdRef.current = selectedNetworkId;
      return;
    }

    if (lastNetworkIdRef.current === selectedNetworkId) return;
    lastNetworkIdRef.current = selectedNetworkId;

    const pathParts = pathname.split("/").filter(Boolean);
    const currentChainId = pathParts.length >= 2 ? pathParts[1] : null;
    if (pathname.startsWith("/vaults") && currentChainId === chainId) return;

    close();
    router.push(`/vaults/${chainId}`);
  }, [selectedNetworkId, pathname, router, close]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  if (pathname === "/") return null;

  const isVaultsActive = pathname?.startsWith("/vaults");
  const pathChainId = pathname?.startsWith("/vaults/")
    ? pathname.split("/")[2]
    : null;
  const vaultsHref = `/vaults/${pathChainId ?? "8453"}`;

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex items-center justify-between px-3 py-3 sm:px-5">
        <div className="flex items-center gap-5">
          <Link
            className="flex items-center gap-4 rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            href={vaultsHref}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 64 64"
                className="h-9 w-9 text-black"
                fill="currentColor"
              >
                <path d="M32 28c-5.6-6.1-16.7-13-23.3-8.3-4.7 3.3-4 11.1 1.9 16 5.7 4.8 15.4 4.4 21.4.8 6 3.6 15.7 4 21.4-.8 5.9-4.9 6.6-12.7 1.9-16C48.7 15 37.6 21.9 32 28Z" />
                <path d="M31.8 33.6c-4.7 4.4-11.5 7-17.9 7.6 4.4 6.2 11.1 10.2 18 10.2 6.8 0 13.6-4 18-10.2-6.4-.6-13.2-3.2-18.1-7.6Z" />
              </svg>
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-zinc-100">
              Morphall
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-base font-semibold transition ${
                isVaultsActive
                  ? "text-[color:var(--accent)]"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
              }`}
            href={vaultsHref}
          >
              <Vault className="h-4 w-4" />
              Vaults
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="wallet-pill group flex items-center gap-2 rounded-2xl border border-white/10 bg-[#121418] p-1.5 transition duration-200 hover:border-white/20 hover:bg-[#171a1f]">
            <div className="scale-105 transition duration-200 group-hover:scale-110">
              <AppKitNetworkButton />
            </div>
            {isConnected ? (
              <div className="scale-105 transition duration-200 group-hover:scale-110">
                <AppKitAccountButton balance="hide" />
              </div>
            ) : (
              <Button
                className="h-[42px] rounded-2xl px-4 text-sm text-black"
                onClick={() => open()}
                type="button"
              >
                Connect wallet
              </Button>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--accent)]/15 ${
                isMenuOpen
                  ? "border-[color:var(--accent)]/60 bg-[color:var(--accent)]/20 text-white"
                  : ""
              }`}
              type="button"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <Menu
                className={`h-5 w-5 transition duration-200 ${
                  isMenuOpen ? "rotate-90 text-zinc-100" : ""
                }`}
              />
            </button>
            {isMenuOpen ? (
              <div className="absolute right-0 top-12 z-40 w-52 origin-top-right rounded-2xl border border-white/10 bg-[#15171b] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition duration-200 animate-fade-up">
                <a
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-white"
                  href="https://discord.com"
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <img
                      src="/discord.svg"
                      alt=""
                      className="h-4 w-4 invert opacity-80 transition group-hover:opacity-100"
                    />
                    Discord
                  </span>
                </a>
                <a
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-white"
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-zinc-400 transition group-hover:text-white"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26L22.8 21.75h-6.62l-5.187-6.78L5.1 21.75H1.79l7.73-8.84L1.2 2.25h6.78l4.694 6.162L18.244 2.25zm-1.161 17.52h1.832L7 4.126H5.043L17.083 19.77z" />
                    </svg>
                    Twitter
                  </span>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
