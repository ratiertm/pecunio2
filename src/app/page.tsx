"use client";

import { useApp } from "@/lib/context";
import { StatCard } from "@/components/ui/stat-card";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { getLevelForXP } from "@/types";
import { OnboardingBanner } from "@/components/ui/onboarding";

export default function DashboardPage() {
  const { user, portfolio, holdings, tradeCount, biasScores } = useApp();

  const holdingsValue = holdings.reduce(
    (sum, h) => sum + (h.quote?.price ?? h.avg_price) * h.qty,
    0
  );
  const totalAssets = portfolio.current_cash + holdingsValue;
  const totalReturn =
    ((totalAssets - portfolio.initial_cash) / portfolio.initial_cash) * 100;
  const levelInfo = getLevelForXP(user.xp);

  // Build chart data from portfolio value over time (simplified)
  const chartData = buildChartData(portfolio.initial_cash, totalAssets);

  const biasDisplay =
    tradeCount < 10
      ? { value: "—", sub: `${10 - tradeCount}건 매매 후 활성화` }
      : tradeCount < 30
        ? { value: "관찰중", sub: "30건 매매 후 점수 활성화" }
        : { value: `${biasScores?.total ?? "—"}/100`, sub: undefined };

  return (
    <div className="space-y-6">
      <OnboardingBanner />

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs font-semibold text-blue-700">
        모의 거래 모드 — 가상 자금 {portfolio.initial_cash.toLocaleString()}원으로 시작
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="총 자산"
          value={`${(totalAssets / 10000).toFixed(0)}만원`}
        />
        <StatCard
          label="총 수익률"
          value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(1)}%`}
          color={totalReturn >= 0 ? "up" : "down"}
        />
        <StatCard
          label="편향 점수"
          value={biasDisplay.value}
          sub={biasDisplay.sub}
        />
        <StatCard
          label="학습 레벨"
          value={`Lv.${levelInfo.level}`}
          sub={levelInfo.title}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">포트폴리오 성장</h2>
        <PortfolioChart data={chartData} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">보유 종목</h2>
          <span className="text-xs text-gray-400">
            현금: {portfolio.current_cash.toLocaleString()}원
          </span>
        </div>
        <HoldingsTable
          holdings={holdings.map((h) => ({
            ...h,
            currentPrice: h.quote?.price,
          }))}
        />
      </div>

      {tradeCount === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
          <p className="mb-2 text-2xl">👋</p>
          <p className="font-semibold">첫 거래를 시작해보세요!</p>
          <p className="mt-1 text-sm text-gray-500">
            매매 탭에서 종목을 검색하고 가상 자금으로 연습할 수 있습니다
          </p>
          <a
            href="/trade"
            className="mt-3 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            매매 시작하기
          </a>
        </div>
      )}
    </div>
  );
}

function buildChartData(initial: number, current: number) {
  // Simple linear interpolation for demo
  const days = 14;
  const data = [];
  for (let i = 0; i <= days; i++) {
    const progress = i / days;
    const date = new Date();
    date.setDate(date.getDate() - days + i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    // Add some noise
    const noise = Math.sin(i * 1.5) * (current - initial) * 0.1;
    data.push({
      date: dateStr,
      portfolio: Math.round(initial + (current - initial) * progress + noise),
      benchmark: Math.round(initial * (1 + progress * 0.03)), // 3% benchmark
    });
  }
  return data;
}
