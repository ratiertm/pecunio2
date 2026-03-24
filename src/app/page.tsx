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
    <div className="space-y-8 pb-20 sm:pb-0">
      <OnboardingBanner />

      {/* Sim mode banner */}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary-light/60 px-5 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[13px] font-semibold text-primary">
          모의 거래 모드 — 가상 자금 {portfolio.initial_cash.toLocaleString()}원으로 시작
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      {/* Portfolio chart */}
      <div>
        <h2 className="section-title mb-4">포트폴리오 성장</h2>
        <PortfolioChart data={chartData} />
      </div>

      {/* Holdings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">보유 종목</h2>
          <span className="text-[13px] font-medium text-text-tertiary">
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

      {/* CTA for first trade */}
      {tradeCount === 0 && (
        <div className="card animate-fade-in-up flex flex-col items-center rounded-2xl p-10 text-center">
          <span className="mb-4 text-5xl">👋</span>
          <p className="text-xl font-bold text-text-primary">첫 거래를 시작해보세요!</p>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-text-secondary">
            매매 탭에서 종목을 검색하고 가상 자금으로 안전하게 연습할 수 있습니다
          </p>
          <a
            href="/trade"
            className="btn-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px]"
          >
            매매 시작하기
            <span>→</span>
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
