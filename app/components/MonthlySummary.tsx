interface SummaryProps {
  summary: {
    messTotal: number;
    outsideTotal: number;
    grandTotal: number;
  };
}

export default function MonthlySummary({ summary }: SummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4 text-black">
      <SummaryCard label="Mess Total" value={summary.messTotal} />
      <SummaryCard label="Outside Total" value={summary.outsideTotal} />
      <SummaryCard label="Grand Total" value={summary.grandTotal} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/90 p-5 text-black shadow-sm hover:shadow-md transition">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">
        ₹{value.toLocaleString()}
      </p>
    </div>
  );
}