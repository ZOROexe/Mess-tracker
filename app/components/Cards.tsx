export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

export function ChartCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <p className="text-sm font-medium text-gray-300 mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

export function MonthSwitcher({
  labelMonth,
  date,
  onChange
}: {
  labelMonth: string
  date: Date;
  onChange: (d: Date) => void;
}) {
  return (
    <div className="flex items-center justify-center sm:justify-end gap-3">
      <button
        onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() - 1))}
        className="rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10"
      >
        ←
      </button>

      <span className="text-sm text-gray-300 min-w-35 text-center">
        {labelMonth}
      </span>

      <button
        onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() + 1))}
        className="rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10"
      >
        →
      </button>
    </div>
  );
}

export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="h-56 flex items-center justify-center text-sm text-gray-400">
      {message}
    </div>
  );
}