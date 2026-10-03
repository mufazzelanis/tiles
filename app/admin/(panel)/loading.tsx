/** Skeleton shown instantly while an admin page loads. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 flex items-end justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-9 w-32" />
      </div>
      <div className="mb-4 grid max-w-md grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[68px] rounded-xl" />)}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="skeleton mb-4 h-9 w-full" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-slate-100 py-3">
            <div className="skeleton size-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-1/5" />
            </div>
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
