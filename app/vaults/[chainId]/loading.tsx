export default function VaultsChainLoading() {
  return (
    <div className="min-h-screen px-6 py-10 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-48 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-64 animate-pulse rounded-full bg-white/5" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-9 w-40 animate-pulse rounded-full bg-white/5" />
              <div className="h-9 w-36 animate-pulse rounded-full bg-white/5" />
              <div className="h-9 w-44 animate-pulse rounded-full bg-white/5" />
            </div>
            <div className="h-9 w-48 animate-pulse rounded-full bg-white/5" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#14161a]">
            <div className="grid grid-cols-7 gap-4 border-b border-white/10 px-6 py-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`header-${index}`}
                  className="h-3 w-20 animate-pulse rounded-full bg-white/5"
                />
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`row-${index}`}
                  className="grid grid-cols-7 items-center gap-4 px-6 py-5"
                >
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <div
                      key={`cell-${index}-${cellIndex}`}
                      className="h-4 w-24 animate-pulse rounded-full bg-white/5"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
