export default function Home() {
  return (
    <div className="flex min-h-screen items-center px-6 py-20 sm:px-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            Morpho vault explorer
          </p>
          <h1 className="text-4xl font-medium tracking-tight text-zinc-50 sm:text-6xl">
            Explore any vault. Whitelisted or not.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-400">
            morphall lets you inspect vault allocations, yields, and positions
            across Base and Mainnet while keeping the onchain path open for
            deposits and withdrawals.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl border border-white/10 bg-[#14161a] p-8 text-sm text-zinc-300">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              Try a vault
            </p>
            <p className="font-mono text-sm text-zinc-200">
              /vaults/8453/0x861F47d8dA4a23d36D70CDDD775c4fbaF9Dd2c40
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-100 transition hover:border-white/30 hover:bg-white/10"
              href="/vaults/8453/0x861F47d8dA4a23d36D70CDDD775c4fbaF9Dd2c40"
            >
              Open Base vault
            </a>
            <a
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-zinc-100 transition hover:border-white/30 hover:bg-white/10"
              href="/vaults/1/0x04422053aDDbc9bB2759b248B574e3FCA76Bc145"
            >
              Open Mainnet vault
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
