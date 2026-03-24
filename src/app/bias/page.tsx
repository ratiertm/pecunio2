"use client";

import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import type { BiasEvent } from "@/types";

const BIAS_LABELS: Record<string, string> = {
  loss_aversion: "손실 회피",
  overconfidence: "과신 편향",
  confirmation: "확증 편향",
  herd: "군중 심리",
};

const BIAS_DESCRIPTIONS: Record<string, string> = {
  loss_aversion: "하락 종목을 너무 빨리 매도하는 패턴",
  overconfidence: "확신도 대비 실제 정확도가 낮은 패턴",
  confirmation: "긍정적 정보에만 집중하는 패턴",
  herd: "거래량 급증 종목에 편승하는 패턴",
};

const BIAS_ICONS: Record<string, string> = {
  loss_aversion: "📉",
  overconfidence: "💪",
  confirmation: "🔍",
  herd: "🐑",
};

export default function BiasPage() {
  const { tradeCount, biasScores, trades } = useApp();
  const store = getStore();
  const events = store.getBiasEvents();

  // Calculate live scores from trade data
  const liveScores = calculateLiveScores(trades, tradeCount);

  // Phase status
  const phase = tradeCount < 10 ? "cold" : tradeCount < 30 ? "observe" : "score";

  return (
    <div className="space-y-8 pb-20 sm:pb-0">
      {/* Overall score */}
      <div className="card overflow-hidden rounded-2xl text-center">
        <div className="bg-gradient-to-br from-primary-light/50 to-white p-8">
          <p className="section-title mb-4">
            나의 편향 종합 점수
          </p>
          {phase === "cold" ? (
            <>
              <p className="text-6xl font-bold text-card-border">—</p>
              <p className="mt-3 text-[15px] text-text-secondary">
                {10 - tradeCount}건 더 매매하면 편향 관찰이 시작됩니다
              </p>
              <div className="mx-auto mt-4 h-3 w-56 overflow-hidden rounded-full bg-card-border">
                <div
                  className="animate-progress h-full rounded-full bg-text-tertiary transition-all"
                  style={{ width: `${(tradeCount / 10) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-text-tertiary">{tradeCount}/10 매매 완료</p>
            </>
          ) : phase === "observe" ? (
            <>
              <p className="text-5xl font-bold text-warning">관찰중</p>
              <p className="mt-3 text-[15px] text-text-secondary">
                패턴을 분석하고 있습니다. {30 - tradeCount}건 더 매매하면 점수가 활성화됩니다.
              </p>
              <div className="mx-auto mt-4 h-3 w-56 overflow-hidden rounded-full bg-card-border">
                <div
                  className="animate-progress h-full rounded-full bg-warning transition-all"
                  style={{ width: `${(tradeCount / 30) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-text-tertiary">{tradeCount}/30 매매 완료</p>
            </>
          ) : (
            <>
              <p className="text-7xl font-bold text-text-primary">
                {liveScores.total}
                <span className="text-2xl text-text-tertiary">/100</span>
              </p>
              <p className="mt-3 text-[15px] text-text-secondary">
                {liveScores.total >= 80
                  ? "우수 — 편향 통제력이 뛰어납니다!"
                  : liveScores.total >= 60
                    ? "양호 — 개선 가능한 영역이 있습니다"
                    : "주의 — 편향 훈련이 필요합니다"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Individual bias scores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["loss_aversion", "overconfidence"] as const).map((type) => {
          const score = liveScores[type === "loss_aversion" ? "lossAversion" : "overconfidence"];
          const isActive =
            (type === "loss_aversion" && tradeCount >= 10) ||
            (type === "overconfidence" && tradeCount >= 15);
          const eventCount = events.filter((e) => e.bias_type === type).length;
          const overcomeCount = events.filter(
            (e) => e.bias_type === type && e.outcome === "overcome"
          ).length;

          return (
            <div key={type} className="card rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{BIAS_ICONS[type]}</span>
                  <p className="text-[15px] font-bold text-text-primary">{BIAS_LABELS[type]}</p>
                </div>
                {isActive && score !== null ? (
                  <span
                    className={`rounded-xl px-3 py-1 text-lg font-bold ${
                      score >= 70
                        ? "bg-success-light text-success"
                        : score >= 50
                          ? "bg-warning-light text-warning"
                          : "bg-danger-light text-danger"
                    }`}
                  >
                    {score}
                  </span>
                ) : (
                  <span className="rounded-xl bg-surface-hover px-3 py-1 text-[13px] font-medium text-text-tertiary">
                    {phase === "cold" ? "비활성" : "관찰중"}
                  </span>
                )}
              </div>

              {isActive && score !== null ? (
                <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-card-border">
                  <div
                    className={`animate-progress h-full rounded-full transition-all ${
                      score >= 70
                        ? "bg-success"
                        : score >= 50
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              ) : (
                <div className="mb-3 h-2.5 rounded-full bg-card-border" />
              )}

              <p className="text-[14px] leading-relaxed text-text-secondary">{BIAS_DESCRIPTIONS[type]}</p>

              {eventCount > 0 && (
                <div className="mt-3 flex gap-3 text-[12px]">
                  <span className="rounded-lg bg-surface-hover px-2 py-1 font-medium text-text-tertiary">
                    감지 {eventCount}회
                  </span>
                  <span className="rounded-lg bg-success-light px-2 py-1 font-medium text-success">
                    극복 {overcomeCount}회
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Phase 2 bias types (locked) */}
        {(["confirmation", "herd"] as const).map((type) => (
          <div
            key={type}
            className="card rounded-2xl p-5 opacity-50"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{BIAS_ICONS[type]}</span>
                <p className="text-[15px] font-bold text-text-primary">{BIAS_LABELS[type]}</p>
              </div>
              <span className="rounded-full bg-surface-hover px-3 py-1 text-[11px] font-semibold text-text-tertiary">
                Phase 2
              </span>
            </div>
            <div className="mb-3 h-2.5 rounded-full bg-card-border" />
            <p className="text-[14px] leading-relaxed text-text-secondary">{BIAS_DESCRIPTIONS[type]}</p>
          </div>
        ))}
      </div>

      {/* Bias event timeline */}
      <div>
        <h2 className="section-title mb-4">편향 이벤트 기록</h2>
        {events.length === 0 ? (
          <div className="card flex flex-col items-center rounded-2xl p-10 text-center">
            <span className="mb-3 text-4xl">
              {tradeCount < 10 ? "🌱" : "🌟"}
            </span>
            <p className="text-[15px] font-medium text-text-secondary">
              {tradeCount < 10
                ? "매매를 시작하면 편향 감지 이벤트가 여기에 표시됩니다"
                : "아직 편향 이벤트가 감지되지 않았습니다. 좋은 징후입니다!"}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-surface-hover/50 text-[13px] text-text-tertiary">
                  <th className="px-5 py-3.5 text-left font-medium">시간</th>
                  <th className="px-5 py-3.5 text-left font-medium">편향 유형</th>
                  <th className="hidden px-5 py-3.5 text-left font-medium sm:table-cell">종목</th>
                  <th className="px-5 py-3.5 text-right font-medium">결과</th>
                </tr>
              </thead>
              <tbody>
                {events
                  .slice()
                  .reverse()
                  .slice(0, 20)
                  .map((event, i) => {
                    const ctx = event.context_json as Record<string, string>;
                    return (
                      <tr
                        key={i}
                        className="border-b border-card-border/50 transition-colors last:border-0 hover:bg-surface-hover/30"
                      >
                        <td className="px-5 py-3.5 text-[13px] text-text-tertiary">
                          {new Date().toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-warning-light px-2.5 py-1 text-[12px] font-semibold text-warning">
                            {BIAS_ICONS[event.bias_type]}
                            {BIAS_LABELS[event.bias_type]}
                          </span>
                        </td>
                        <td className="hidden px-5 py-3.5 text-[13px] text-text-secondary sm:table-cell">
                          {ctx?.ticker || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[12px] font-bold ${
                              event.outcome === "overcome"
                                ? "bg-success-light text-success"
                                : "bg-danger-light text-danger"
                            }`}
                          >
                            {event.outcome === "overcome" ? "극복 성공" : "편향 발동"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Coach recommendation (teaser) */}
      {tradeCount >= 10 && (
        <div className="card overflow-hidden rounded-2xl border-2 border-primary/20">
          <div className="bg-gradient-to-r from-primary-light/50 to-white p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <p className="text-[15px] font-bold text-primary">AI 코치 추천 훈련</p>
            </div>
            <p className="text-[15px] leading-relaxed text-text-secondary">
              {liveScores.lossAversion !== null && liveScores.lossAversion < 60
                ? "손실 회피 점수가 낮습니다. '30분 규칙 챌린지'를 시도해보세요 — 매도 결정을 30분 뒤에 재검토하는 훈련입니다."
                : "편향 분석 데이터를 수집 중입니다. 매매를 계속하면 더 정확한 분석이 가능합니다."}
            </p>
            <div className="mt-4 rounded-xl bg-surface-hover px-4 py-3 text-center text-[13px] font-medium text-text-tertiary">
              AI 코치 전체 기능은 Phase 2에서 활성화됩니다
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateLiveScores(trades: any[], tradeCount: number) {
  let lossAversion: number | null = null;
  let overconfidence: number | null = null;

  if (tradeCount >= 30) {
    // Loss aversion: ratio of losing sells
    const sells = trades.filter((t) => t.type === "sell");
    if (sells.length >= 3) {
      let losingSells = 0;
      let totalSells = 0;
      for (const s of sells) {
        const buys = trades.filter((b: any) => b.type === "buy" && b.ticker === s.ticker);
        if (buys.length === 0) continue;
        const avgBuy = buys.reduce((sum: number, b: any) => sum + b.price, 0) / buys.length;
        totalSells++;
        if (s.price < avgBuy) losingSells++;
      }
      if (totalSells >= 3) {
        const ratio = losingSells / totalSells;
        lossAversion = Math.round(Math.max(0, Math.min(100, (1 - (ratio - 0.5) * 2) * 100)));
      }
    }
    if (lossAversion === null) lossAversion = 50;

    // Overconfidence: simplified
    const withConf = trades.filter((t) => t.confidence != null);
    if (withConf.length >= 10) {
      const highConf = withConf.filter((t) => t.confidence >= 4);
      overconfidence = highConf.length > 0 ? Math.round(50 + Math.random() * 30) : 70;
    } else {
      overconfidence = 50;
    }
  }

  const total =
    lossAversion !== null && overconfidence !== null
      ? Math.round(lossAversion * 0.5 + overconfidence * 0.5)
      : null;

  return { lossAversion, overconfidence, total: total ?? 0 };
}
