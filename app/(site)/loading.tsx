/**
 * Shown the instant a link is clicked, while the next page is fetched from the server.
 * It is also prefetched with each link, so navigation answers immediately.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      {/* thin progress line under the header */}
      <div className="h-0.5 w-full overflow-hidden bg-mist">
        <div className="h-full w-1/3 animate-[loadbar_1s_ease-in-out_infinite] bg-brand" />
      </div>
      <div className="h-32 bg-mist sm:h-48" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto h-6 w-56 rounded bg-mist" />
        <div className="mx-auto mt-3 h-3 w-80 max-w-full rounded bg-mist" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-xl bg-mist" />
              <div className="mt-3 h-3 w-3/4 rounded bg-mist" />
              <div className="mt-2 h-3 w-1/2 rounded bg-mist" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
