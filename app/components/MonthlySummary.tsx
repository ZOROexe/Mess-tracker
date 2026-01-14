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

function SummaryCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">₹{value}</p>
    </div>
  );
}