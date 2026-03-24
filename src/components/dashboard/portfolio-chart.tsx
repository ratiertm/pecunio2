"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface PortfolioChartProps {
  data: { date: string; portfolio: number }[];
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

  const first = data[0].portfolio;
  const last = data[data.length - 1].portfolio;
  const isUp = last >= first;

  return (
    <div className="card rounded-2xl p-5">
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#22a66e" : "#e84057"} stopOpacity={0.15} />
                <stop offset="100%" stopColor={isUp ? "#22a66e" : "#e84057"} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              domain={["auto", "auto"]}
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
            <Area
              type="monotone"
              dataKey="portfolio"
              name="내 포트폴리오"
              stroke={isUp ? "#22a66e" : "#e84057"}
              strokeWidth={2.5}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 5, fill: isUp ? "#22a66e" : "#e84057", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
