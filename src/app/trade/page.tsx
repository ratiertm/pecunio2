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
  const { portfolio, trades, holdings, refresh } = useApp();
  const canTrade = useCanTrade();

  if (!canTrade) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card mx-auto flex flex-col items-center rounded-2xl p-10">
          <span className="mb-4 text-5xl">🔒</span>
          <h2 className="text-xl font-bold text-text-primary">매매 기능이 잠겨 있습니다</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            기초 학습을 먼저 완료해주세요. 2개 레슨을 마치면 매매를 시작할 수 있습니다.
          </p>
          <a
            href="/learn"
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-[15px]"
          >
            학습 시작하기
            <span>→</span>
          </a>
        </div>
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

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    // Try real API first, fall back to demo
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        return;
      }
    } catch {}
    setSearchResults(searchDemoTickers(q));
  }, []);

  const handleSelect = useCallback(async (result: TickerSearchResult & { price?: number; change?: number; change_percent?: number }) => {
    setSelected(result);
    setSearchQuery(result.name);
    setSearchResults([]);
    setError(null);
    setSuccess(null);
    setBiasResult(null);

    // If search result already includes price (from real API), use it
    if (result.price) {
      setQuote({
        ticker: result.ticker,
        market: result.market,
        price: result.price,
        change: result.change ?? 0,
        change_percent: result.change_percent ?? 0,
        volume: 0,
        timestamp: new Date().toISOString(),
        is_stale: false,
      });
    } else {
      // Try real API, fall back to demo
      try {
        const res = await fetch(`/api/market/quote?ticker=${result.ticker}`);
        const data = await res.json();
        if (data.quote) {
          setQuote(data.quote);
        }
      } catch {
        setQuote(getDemoQuote(result.ticker));
      }
    }

    // Fetch real 30-day history
    try {
      const hRes = await fetch(`/api/market/history?ticker=${result.ticker}&days=30`);
      const hData = await hRes.json();
      if (hData.history && hData.history.length > 0) {
        setHistory(hData.history.map((h: any) => ({
          date: `${parseInt(h.date.slice(4, 6))}/${parseInt(h.date.slice(6, 8))}`,
          price: h.price,
        })));
        return;
      }
    } catch {}
    // Fallback to demo
    setHistory(getDemoHistory(result.ticker));
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
      ticker_name: selected.name,
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

    // Record portfolio snapshot after trade
    const allHoldings = store.getHoldings();
    const holdingsVal = allHoldings.reduce((sum, h) => {
      const q = getDemoQuote(h.ticker);
      return sum + (q?.price ?? h.avg_price) * h.qty;
    }, 0);
    store.recordSnapshot(holdingsVal);

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
  const changeColor = quote && quote.change_percent >= 0 ? "text-success" : "text-danger";

  return (
    <div className="space-y-5 pb-20 sm:pb-0">
      {/* Balance banner */}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary-light/60 px-5 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[13px] font-semibold text-primary">
          모의 거래 모드 — 잔액: {portfolio.current_cash.toLocaleString()}원
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-text-tertiary">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="종목 검색 (예: 삼성전자, SK하이닉스, TIGER)"
            className="w-full rounded-2xl border-2 border-card-border bg-white py-3.5 pl-12 pr-5 text-[15px] text-text-primary placeholder-text-tertiary transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
        {searchResults.length > 0 && (
          <ul className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-card-border bg-white shadow-xl shadow-black/5">
            {searchResults.map((r) => (
              <li key={r.ticker}>
                <button
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-surface-hover"
                  onClick={() => handleSelect(r)}
                >
                  <span>
                    <span className="text-[15px] font-semibold text-text-primary">{r.name}</span>
                    <span className="ml-2 text-[13px] text-text-tertiary">{r.ticker}</span>
                  </span>
                  <span className="rounded-lg bg-surface-hover px-2 py-1 text-[11px] font-medium text-text-tertiary">
                    {r.market}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Left: Order */}
        <div className="space-y-5">
          {selected && quote ? (
            <>
              {/* Price card */}
              <div className="card rounded-2xl p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[17px] font-bold text-text-primary">{selected.name}</h3>
                  <span className="rounded-lg bg-surface-hover px-2 py-1 text-[11px] font-medium text-text-tertiary">
                    {selected.ticker}
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight text-text-primary">
                  {quote.price.toLocaleString()}
                  <span className="ml-1 text-base font-medium text-text-tertiary">원</span>
                </p>
                <p className={`mt-1 text-[15px] font-semibold ${changeColor}`}>
                  {quote.change_percent >= 0 ? "+" : ""}{quote.change_percent}%
                  <span className="ml-1.5 text-[13px] font-normal">
                    ({quote.change >= 0 ? "+" : ""}{quote.change.toLocaleString()}원)
                  </span>
                </p>
              </div>

              {/* Order form */}
              <div className="card rounded-2xl p-5">
                {/* Buy/Sell toggle */}
                <div className="mb-5 flex gap-2 rounded-xl bg-surface-hover p-1">
                  <button
                    className={`flex-1 rounded-xl py-2.5 text-[15px] font-semibold transition-all duration-200 ${
                      tradeType === "buy"
                        ? "bg-success text-white shadow-md shadow-success/20"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                    onClick={() => setTradeType("buy")}
                  >
                    매수
                  </button>
                  <button
                    className={`flex-1 rounded-xl py-2.5 text-[15px] font-semibold transition-all duration-200 ${
                      tradeType === "sell"
                        ? "bg-danger text-white shadow-md shadow-danger/20"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                    onClick={() => setTradeType("sell")}
                  >
                    매도
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Qty */}
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-text-secondary">수량</label>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="수량 입력"
                      className="w-full rounded-xl border-2 border-card-border bg-white px-4 py-3 text-[15px] text-text-primary transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-text-secondary">
                      확신도
                      <span className="ml-2 rounded-lg bg-primary-light px-2 py-0.5 text-[12px] font-bold text-primary">
                        {confidence}/5
                      </span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={confidence}
                      onChange={(e) => setConfidence(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-[12px] text-text-tertiary">
                      <span>불확실</span><span>확신</span>
                    </div>
                  </div>

                  {/* Estimated amount */}
                  {qty && parseInt(qty) > 0 && (
                    <div className="rounded-xl bg-surface-hover/70 px-4 py-3">
                      <p className="text-[13px] text-text-secondary">
                        예상 금액:
                        <span className="ml-2 text-[15px] font-bold text-text-primary">
                          {(quote.price * parseInt(qty)).toLocaleString()}원
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Error/Success messages */}
                  {error && (
                    <div className="rounded-xl bg-danger-light px-4 py-3">
                      <p className="text-[13px] font-medium text-danger">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="animate-fade-in-up rounded-xl bg-success-light px-4 py-3">
                      <p className="text-[13px] font-medium text-success">{success}</p>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={!qty || parseInt(qty) <= 0}
                    className={`w-full rounded-2xl py-3.5 text-[15px] font-bold text-white transition-all duration-200 disabled:opacity-40 ${
                      tradeType === "buy"
                        ? "bg-success shadow-md shadow-success/20 hover:shadow-lg hover:shadow-success/30 active:scale-[0.98]"
                        : "bg-danger shadow-md shadow-danger/20 hover:shadow-lg hover:shadow-danger/30 active:scale-[0.98]"
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
            <div className="card flex h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-card-border p-8 text-center">
              <span className="mb-3 text-4xl">🔍</span>
              <p className="text-[15px] font-medium text-text-tertiary">
                종목을 검색해서 선택해주세요
              </p>
              <p className="mt-1 text-[13px] text-text-tertiary">
                삼성전자, SK하이닉스 등을 검색해보세요
              </p>
            </div>
          )}
        </div>

        {/* Right: Chart + Recent trades */}
        <div className="space-y-5">
          {selected && history.length > 0 && (
            <div className="card rounded-2xl p-5">
              <h3 className="mb-3 text-[15px] font-bold text-text-primary">
                {selected.name} 최근 30일
              </h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9e9eb0" }}
                      tickLine={false}
                      axisLine={{ stroke: "#f0ece8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9e9eb0" }}
                      tickLine={false}
                      axisLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      formatter={(v) => `${Number(v).toLocaleString()}원`}
                      contentStyle={{
                        fontSize: 13,
                        borderRadius: 12,
                        border: "1px solid #f0ece8",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#7c5df0"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#7c5df0", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* My holdings */}
          {holdings.length > 0 && (
            <div className="card rounded-2xl p-5">
              <h3 className="mb-4 text-[15px] font-bold text-text-primary">보유 종목</h3>
              <div className="space-y-1">
                {holdings.map((h) => {
                  const curPrice = h.quote?.price ?? h.avg_price;
                  const pnl = ((curPrice - h.avg_price) / h.avg_price) * 100;
                  const isUp = pnl >= 0;
                  return (
                    <button
                      key={h.id}
                      onClick={() => handleSelect({ ticker: h.ticker, name: h.ticker, market: h.market })}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-hover/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-light text-xs font-bold text-primary">
                          {h.qty}
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold text-text-primary">{h.ticker}</p>
                          <p className="text-[12px] text-text-tertiary">평균 {h.avg_price.toLocaleString()}원</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-semibold text-text-primary">{curPrice.toLocaleString()}원</p>
                        <p className={`text-[12px] font-semibold ${isUp ? "text-success" : "text-danger"}`}>
                          {isUp ? "+" : ""}{pnl.toFixed(1)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent trades */}
          <div className="card rounded-2xl p-5">
            <h3 className="mb-4 text-[15px] font-bold text-text-primary">최근 거래</h3>
            {recentTrades.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-2 text-3xl">📋</span>
                <p className="text-[14px] text-text-tertiary">아직 거래 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTrades.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-surface-hover/50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white ${
                          t.type === "buy" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {t.type === "buy" ? "매수" : "매도"}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-text-primary">{t.ticker_name || t.ticker}</p>
                        {t.bias_alert_shown && (
                          <span className="text-[11px] font-medium text-warning">편향감지</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-medium text-text-secondary">
                        {t.qty}주 x {t.price.toLocaleString()}원
                      </p>
                      <p className="text-[11px] text-text-tertiary">
                        {new Date(t.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
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
