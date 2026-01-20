
export function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-2xl bg-white/10 skeleton-shimmer"
        />
      ))}
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-md p-4 border border-white/10 space-y-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((_, i) => (
          <div
            key={i}
            className="h-5 rounded bg-white/10 skeleton-shimmer"
          />
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/10 p-2 flex flex-col justify-between skeleton-shimmer"
          >
            <div className="h-3 w-6 bg-white/20 rounded" />
            <div className="h-4 w-full bg-white/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayEntryModalSkeleton() {
  return (
      <div
        className="
          bg-white rounded-2xl p-6 w-full max-w-md
          space-y-5 text-black
          skeleton-shimmer
          animate-[scaleIn_0.15s_ease-out]
        "
      >
        {/* Title */}
        <div className="h-6 w-44 bg-gray-200 rounded" />

        {/* Meals */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            {/* Meal label */}
            <div className="h-4 w-24 bg-gray-200 rounded" />

            {/* Select */}
            <div className="h-10 w-full bg-gray-200 rounded-lg" />

          </div>
        ))}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          <div className="h-10 w-24 bg-gray-300 rounded-lg" />
        </div>
      </div>
  );
}

export function MessPricingSkeleton() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="h-6 w-56 bg-white/20 rounded skeleton-shimmer" />

      <div className="rounded-2xl bg-white/10 p-4 space-y-2 skeleton-shimmer">
        <div className="h-4 w-32 bg-white/20 rounded" />
        <div className="h-4 w-40 bg-white/20 rounded" />
        <div className="h-4 w-36 bg-white/20 rounded" />
        <div className="h-3 w-48 bg-white/20 rounded mt-2" />
      </div>

      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-white/10 rounded-xl skeleton-shimmer" />
      ))}

      <div className="h-10 bg-white/20 rounded-xl skeleton-shimmer" />
    </div>
  );
}