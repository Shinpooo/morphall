import { ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "../components/ui/badge";
import ExploreVaultsButton from "../components/ExploreVaultsButton";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-16 sm:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-16rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(226,115,143,0.2),_transparent_65%)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[10rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(110,231,255,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-7">
            <Badge className="animate-fade-up">Morpho vault explorer</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl animate-fade-up-delay-1">
              A modern workspace for every Morpho vault.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-400 animate-fade-up-delay-2">
              Explore curated and non-whitelisted vaults, monitor the newest
              curator launches, and move capital without leaving the onchain
              flow.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ExploreVaultsButton withArrow />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#14161a] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="grid gap-5">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>What you can do</span>
                <span className="text-xs text-zinc-500">Always onchain</span>
              </div>
              {[
                {
                  title: "Explore every vault",
                  copy: "Search by chain, status, or asset to surface curated and non-whitelisted vaults.",
                },
                {
                  title: "Track new curator launches",
                  copy: "Monitor new vaults as they go live and inspect their allocation strategy instantly.",
                },
                {
                  title: "Deposit & withdraw anywhere",
                  copy: "Execute onchain flows even when a vault isn’t whitelisted.",
                },
                {
                  title: "Security first",
                  copy: "Morphall relies solely on Morpho smart contracts for deposits and withdrawals.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-base font-semibold text-zinc-100">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Onchain verified",
              copy: "Every allocation and yield signal is backed by Morpho Blue data.",
              icon: ShieldCheck,
            },
            {
              title: "Instant triage",
              copy: "Filter vaults by liquidity, APY, version, and whitelist status.",
              icon: Sparkles,
            },
            {
              title: "Signal-ready",
              copy: "See utilization and market exposure at a glance before you deploy.",
              icon: TrendingUp,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-zinc-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">{item.copy}</p>
              </div>
            );
          })}
        </section>

      </main>
    </div>
  );
}
