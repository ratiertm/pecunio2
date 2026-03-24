interface StatCardProps {
  label: string;
  value: string;
  color?: "up" | "down" | "neutral";
  sub?: string;
}

const colorMap = {
  up: "text-green-600",
  down: "text-red-500",
  neutral: "text-gray-900",
};

export function StatCard({ label, value, color = "neutral", sub }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}
