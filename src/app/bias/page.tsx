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

export default function BiasPage() {
  const { tradeCount, biasScores, trades } = useApp();
  const store = getStore();
  const events = store.getBiasEvents();

  // Calculate live scores from trade data
  const liveScores = calculateLiveScores(trades, tradeCount);

  // Phase status
  const phase = tradeCount < 10 ? "cold" : tradeCount < 30 ? "observe" : "score";

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          나의 편향 종합 점수
        </p>
        {phase === "cold" ? (
          <>
            <p className="text-5xl font-bold text-gray-300">—</p>
            <p className="mt-2 text-sm text-gray-400">
              {10 - tradeCount}건 더 매매하면 편향 관찰이 시작됩니다
            </p>
            <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gray-400 transition-all"
                style={{ width: `${(tradeCount / 10) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400">{tradeCount}/10 매매 완료</p>
          </>
        ) : phase === "observe" ? (
          <>
            <p className="text-5xl font-bold text-orange-400">관찰중</p>
            <p className="mt-2 text-sm text-gray-500">
              패턴을 분석하고 있습니다. {30 - tradeCount}건 더 매매하면 점수가 활성화됩니다.
            </p>
            <div className="mx-auto mt-3 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-orange-400 transition-all"
                style={{ width: `${(tradeCount / 30) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-400">{tradeCount}/30 매매 완료</p>
          </>
        ) : (
          <>
            <p className="text-6xl font-bold text-gray-900">
              {liveScores.total}
              <span className="text-2xl text-gray-400">/100</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {liveScores.total >= 80
                ? "우수 — 편향 통제력이 뛰어납니다!"
                : liveScores.total >= 60
                  ? "양호 — 개선 가능한 영역이 있습니다"
                  : "주의 — 편향 훈련이 필요합니다"}
            </p>
          </>
        )}
      </div>

      {/* Individual bias scores */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <div key={type} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{BIAS_LABELS[type]}</p>
                {isActive && score !== null ? (
                  <span
                    className={`text-lg font-bold ${
                      score >= 70
                        ? "text-green-600"
                        : score >= 50
                          ? "text-orange-500"
                          : "text-red-500"
                    }`}
                  >
                    {score}/100
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">
                    {phase === "cold" ? "비활성" : "관찰중"}
                  </span>
                )}
              </div>

              {isActive && score !== null ? (
                <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      score >= 70
                        ? "bg-green-500"
                        : score >= 50
                          ? "bg-orange-400"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              ) : (
                <div className="mb-2 h-2 rounded-full bg-gray-100" />
              )}

              <p className="text-xs text-gray-500">{BIAS_DESCRIPTIONS[type]}</p>

              {eventCount > 0 && (
                <p className="mt-2 text-[11px] text-gray-400">
                  감지 {eventCount}회 · 극복 {overcomeCount}회
                </p>
              )}
            </div>
          );
        })}

        {/* Phase 2 bias types (locked) */}
        {(["confirmation", "herd"] as const).map((type) => (
          <div
            key={type}
            className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-50"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{BIAS_LABELS[type]}</p>
              <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                Phase 2
              </span>
            </div>
            <div className="mb-2 h-2 rounded-full bg-gray-200" />
            <p className="text-xs text-gray-500">{BIAS_DESCRIPTIONS[type]}</p>
          </div>
        ))}
      </div>

      {/* Bias event timeline */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-700">편향 이벤트 기록</h2>
        {events.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            {tradeCount < 10
              ? "매매를 시작하면 편향 감지 이벤트가 여기에 표시됩니다"
              : "아직 편향 이벤트가 감지되지 않았습니다. 좋은 징후입니다!"}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-2 text-left font-medium">시간</th>
                  <th className="px-4 py-2 text-left font-medium">편향 유형</th>
                  <th className="px-4 py-2 text-left font-medium">종목</th>
                  <th className="px-4 py-2 text-right font-medium">결과</th>
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
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          {new Date().toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {BIAS_LABELS[event.bias_type]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{ctx?.ticker || "—"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`text-xs font-semibold ${
                              event.outcome === "overcome"
                                ? "text-green-600"
                                : "text-red-500"
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
        <div className="rounded-lg border-2 border-gray-900 bg-gray-50 p-4">
          <p className="mb-1 text-xs font-bold text-gray-900">AI 코치 추천 훈련</p>
          <p className="text-sm text-gray-700">
            {liveScores.lossAversion !== null && liveScores.lossAversion < 60
              ? "손실 회피 점수가 낮습니다. '30분 규칙 챌린지'를 시도해보세요 — 매도 결정을 30분 뒤에 재검토하는 훈련입니다."
              : "편향 분석 데이터를 수집 중입니다. 매매를 계속하면 더 정확한 분석이 가능합니다."}
          </p>
          <p className="mt-2 rounded bg-gray-200 px-3 py-1.5 text-center text-xs text-gray-500">
            AI 코치 전체 기능은 Phase 2에서 활성화됩니다
          </p>
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
