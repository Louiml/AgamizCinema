export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-8 w-8 animate-spin-slow text-mint-400 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="glass-panel rounded-3xl p-6 shadow-glow-soft">
        <Spinner className="h-9 w-9" />
      </div>
      <p className="text-sm text-ash">{label}…</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse overflow-hidden rounded-2xl">
      <div className="aspect-[2/3] bg-white/[0.04]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 rounded bg-white/10" />
        <div className="h-2.5 w-1/2 rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function RowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
