"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface PortfolioChartProps {
  data: { date: string; portfolio: number; benchmark: number }[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  if (data.length === 0) {
    return (
      <div className="card flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-card-border p-8 text-center">
        <span className="mb-3 text-4xl">📈</span>
        <p className="text-[15px] font-medium text-text-tertiary">
          매매를 시작하면 포트폴리오 성장 그래프가 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl p-5">
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#9e9eb0" }}
              tickLine={false}
              axisLine={{ stroke: "#f0ece8" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9e9eb0" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString()}원`}
              labelStyle={{ fontSize: 13, color: "#6b6b80" }}
              contentStyle={{
                fontSize: 13,
                borderRadius: 12,
                border: "1px solid #f0ece8",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                padding: "8px 12px",
              }}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#6b6b80" }}
            />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="내 포트폴리오"
              stroke="#7c5df0"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#7c5df0", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="코스피 지수"
              stroke="#d4d0cc"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
