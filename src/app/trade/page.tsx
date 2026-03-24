"use client";

import { useState, useCallback } from "react";
import { useApp } from "@/lib/context";
import { getStore } from "@/lib/store";
import { getDemoQuote, searchDemoTickers, getDemoHistory } from "@/lib/market/demo-data";
import { BiasAlert } from "@/components/ui/bias-alert";
import { useCanTrade } from "@/components/ui/onboarding";
import type { TickerSearchResult, Quote, TradeType, BiasCheckResult } from "@/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function TradePage() {
  const { portfolio, trades, refresh } = useApp();
  const canTrade = useCanTrade();

  if (!canTrade) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="mb-3 text-4xl">🔒</p>
        <h2 className="text-lg font-bold">매매 기능이 잠겨 있습니다</h2>
        <p className="mt-2 text-sm text-gray-500">
          기초 학습을 먼저 완료해주세요. 2개 레슨을 마치면 매매를 시작할 수 있습니다.
        </p>
        <a
          href="/learn"
          className="mt-4 inline-block rounded-md bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white"
        >
          학습 시작하기
        </a>
      </div>
    );
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([]);
  const [selected, setSelected] = useState<TickerSearchResult | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<{ date: string; price: number }[]>([]);
  const [qty, setQty] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [biasResult, setBiasResult] = useState<BiasCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchResults(searchDemoTickers(q));
  }, []);

  const handleSelect = useCallback((result: TickerSearchResult) => {
    setSelected(result);
    setSearchQuery(result.name);
    setSearchResults([]);
    setQuote(getDemoQuote(result.ticker));
    setHistory(getDemoHistory(result.ticker));
    setError(null);
    setSuccess(null);
    setBiasResult(null);
  }, []);

  function checkBiasLocally(): BiasCheckResult {
    const store = getStore();
    const tradeCount = store.getTradeCount();
    const allTrades = store.getTrades();

    if (tradeCount < 10 || tradeType !== "sell" || !selected) {
      return { detected: false, type: null, message: null, severity: null };
    }

    // Loss aversion check: selling a losing position?
    const holding = store.getHolding(selected.ticker);
    if (!holding || !quote) {
      return { detected: false, type: null, message: null, severity: null };
    }

    const isLosing = quote.price < holding.avg_price;
    if (!isLosing) {
      return { detected: false, type: null, message: null, severity: null };
    }

    // Count pattern: how often does user sell losers?
    const sellTrades = allTrades.filter((t) => t.type === "sell");
    let losingSells = 0;
    let totalSells = 0;

    for (const t of sellTrades) {
      // Check if sell was at a loss by comparing with buy history
      const buys = allTrades.filter((b) => b.type === "buy" && b.ticker === t.ticker);
      if (buys.length === 0) continue;
      const avgBuy = buys.reduce((s, b) => s + b.price, 0) / buys.length;
      totalSells++;
      if (t.price < avgBuy) losingSells++;
    }

    const ratio = totalSells > 2 ? losingSells / totalSells : 0;
    if (ratio > 0.5) {
      const lossPercent = (((holding.avg_price - quote.price) / holding.avg_price) * 100).toFixed(1);
      return {
        detected: true,
        type: "loss_aversion",
        message: `이 종목은 ${lossPercent}% 하락 중입니다. 지금까지 매도의 ${Math.round(ratio * 100)}%가 손실 종목이었습니다. 감정이 아닌 근거로 판단하고 있나요?`,
        severity: ratio > 0.7 ? "high" : "medium",
      };
    }

    return { detected: false, type: null, message: null, severity: null };
  }

  function executeTrade(biasAction: "delay" | "learn" | "ignore" | "none") {
    if (!selected || !quote || !qty) return;
    setError(null);
    setSuccess(null);

    const store = getStore();
    const qtyNum = parseInt(qty);

    if (qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError("수량은 1 이상의 정수여야 합니다");
      return;
    }

    const totalAmount = quote.price * qtyNum;

    if (tradeType === "buy") {
      if (totalAmount > portfolio.current_cash) {
        setError(`잔액 부족: 필요 ${totalAmount.toLocaleString()}원, 보유 ${portfolio.current_cash.toLocaleString()}원`);
        return;
      }
      store.updateCash(-totalAmount);
      store.upsertHolding(selected.ticker, selected.market, qtyNum, quote.price);
    } else {
      const holding = store.getHolding(selected.ticker);
      if (!holding || holding.qty < qtyNum) {
        setError(`보유 수량 부족: ${holding?.qty ?? 0}주 보유 중`);
        return;
      }
      store.updateCash(totalAmount);
      store.reduceHolding(selected.ticker, qtyNum);
    }

    const biasCheck = biasAction !== "none" ? biasResult : checkBiasLocally();

    store.addTrade({
      portfolio_id: portfolio.id,
      ticker: selected.ticker,
      market: selected.market,
      type: tradeType,
      qty: qtyNum,
      price: quote.price,
      confidence,
      bias_alert_shown: biasCheck?.detected ?? false,
      bias_alert_action: biasAction,
    });

    if (biasCheck?.detected && biasCheck.type) {
      store.addBiasEvent({
        user_id: store.getUser().id,
        trade_id: undefined,
        bias_type: biasCheck.type,
        score_delta: biasAction === "ignore" ? -5 : 3,
        outcome: biasAction === "ignore" ? "triggered" : "overcome",
        context_json: { ticker: selected.ticker, trade_type: tradeType },
      });
    }

    // Give XP for trading (small amount)
    if (store.getTradeCount() <= 50) {
      store.addXP(10);
    }

    setBiasResult(null);
    setQty("");
    setSuccess(`${selected.name} ${qtyNum}주 ${tradeType === "buy" ? "매수" : "매도"} 완료!`);
    refresh();
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    const bias = checkBiasLocally();
    if (bias.detected) {
      setBiasResult(bias);
      return;
    }

    executeTrade("none");
  }

  const recentTrades = trades.slice(0, 5);
  const changeColor = quote && quote.change_percent >= 0 ? "text-green-600" : "text-red-500";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center text-xs font-semibold text-blue-700">
        모의 거래 모드 — 잔액: {portfolio.current_cash.toLocaleString()}원
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="종목 검색 (예: 삼성전자, SK하이닉스, TIGER)"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        {searchResults.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {searchResults.map((r) => (
              <li key={r.ticker}>
                <button
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                  onClick={() => handleSelect(r)}
                >
                  <span>
                    <span className="font-semibold">{r.name}</span>
                    <span className="ml-2 text-gray-400">{r.ticker}</span>
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    {r.market}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Order */}
        <div className="space-y-4">
          {selected && quote ? (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{selected.name}</h3>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                    {selected.ticker}
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold">{quote.price.toLocaleString()}원</p>
                <p className={`text-sm ${changeColor}`}>
                  {quote.change_percent >= 0 ? "+" : ""}{quote.change_percent}% ({quote.change >= 0 ? "+" : ""}{quote.change.toLocaleString()}원)
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex gap-2">
                  <button
                    className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                      tradeType === "buy" ? "bg-green-600 text-white" : "border border-gray-300 text-gray-500"
                    }`}
                    onClick={() => setTradeType("buy")}
                  >
                    매수
                  </button>
                  <button
                    className={`flex-1 rounded-md py-2 text-sm font-semibold ${
                      tradeType === "sell" ? "bg-red-500 text-white" : "border border-gray-300 text-gray-500"
                    }`}
                    onClick={() => setTradeType("sell")}
                  >
                    매도
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">수량</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="수량 입력"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      확신도 ({confidence}/5)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={confidence}
                      onChange={(e) => setConfidence(parseInt(e.target.value))}
                      className="w-full accent-gray-900"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>불확실</span><span>확신</span>
                    </div>
                  </div>

                  {qty && parseInt(qty) > 0 && (
                    <p className="text-xs text-gray-500">
                      예상 금액: <span className="font-semibold">{(quote.price * parseInt(qty)).toLocaleString()}원</span>
                    </p>
                  )}

                  {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
                  {success && <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-600">{success}</p>}

                  <button
                    onClick={handleSubmit}
                    disabled={!qty || parseInt(qty) <= 0}
                    className={`w-full rounded-md py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                      tradeType === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {tradeType === "buy" ? "매수 주문" : "매도 주문"}
                  </button>
                </div>
              </div>

              {biasResult?.detected && (
                <BiasAlert
                  result={biasResult}
                  onDelay={() => setBiasResult(null)}
                  onLearn={() => { setBiasResult(null); window.location.href = "/learn"; }}
                  onIgnore={() => { executeTrade("ignore"); }}
                />
              )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400">
              종목을 검색해서 선택해주세요
            </div>
          )}
        </div>

        {/* Right: Chart + Recent trades */}
        <div className="space-y-4">
          {selected && history.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                {selected.name} 최근 30일
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v) => `${Number(v).toLocaleString()}원`} contentStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="price" stroke="#111827" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">최근 거래</h3>
            {recentTrades.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">아직 거래 내역이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {recentTrades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <div>
                      <span className="text-sm font-medium">{t.ticker}</span>
                      <span className={`ml-2 text-xs font-semibold ${t.type === "buy" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "buy" ? "매수" : "매도"}
                      </span>
                      {t.bias_alert_shown && (
                        <span className="ml-1 text-[10px] text-orange-500">편향감지</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{t.qty}주 × {t.price.toLocaleString()}원</p>
                      <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
