interface StatCardProps {
  label: string;
  value: string;
  color?: "up" | "down" | "neutral";
  sub?: string;
}

const colorMap = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-text-primary",
};

const bgMap = {
  up: "bg-success-light",
  down: "bg-danger-light",
  neutral: "bg-white",
};

export function StatCard({ label, value, color = "neutral", sub }: StatCardProps) {
  return (
    <div className={`card rounded-2xl p-5 text-center transition-all duration-200 ${bgMap[color]}`}>
      <p className="mb-2 text-[13px] font-medium text-text-tertiary">{label}</p>
      <p className={`text-2xl font-bold tracking-tight ${colorMap[color]}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[12px] leading-relaxed text-text-tertiary">{sub}</p>}
    </div>
  );
}
