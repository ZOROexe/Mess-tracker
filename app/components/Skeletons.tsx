
export function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-4 skeleton-shimmer">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 rounded-lg"
          />
        ))}
      </div>

      {/* Calendar Header (Sun–Sat) */}
      <div className="grid grid-cols-7 gap-2 skeleton-shimmer">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => (
            <div
              key={day}
              className="h-6 bg-gray-300 rounded"
            />
          )
        )}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7 gap-2 skeleton-shimmer">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 rounded-lg flex flex-col justify-between p-2"
          >
            {/* Date placeholder */}
            <div className="h-4 w-6 bg-gray-300 rounded" />

            {/* Event bar placeholder */}
            <div className="h-5 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DayEntryModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-5 skeleton-shimmer">
        {/* Title */}
        <div className="h-6 w-48 bg-gray-200 rounded" />

        {/* Meal Sections */}
        {["Breakfast", "Lunch", "Dinner"].map((meal) => (
          <div key={meal} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />

            {/* Select */}
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ))}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-10 w-24 bg-gray-200 rounded" />
          <div className="h-10 w-24 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}

export function MessPricingSkeleton() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6 skeleton-shimmer">
      {/* Page Title */}
      <div className="h-7 w-56 bg-gray-200 rounded" />

      {/* Current Pricing Card */}
      <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-200 rounded mt-2" />
      </div>

      {/* Form Inputs */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
      ))}

      {/* Save Button */}
      <div className="h-10 bg-gray-300 rounded" />
    </div>
  );
}